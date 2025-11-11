# BeFast GO - Sistema Completo y Arquitectura

## 🏗️ ARQUITECTURA DEL ECOSISTEMA

### Componentes del Sistema
```
┌─────────────────────────────────────────────────────────────┐
│                    ECOSISTEMA BEFAST                         │
└─────────────────────────────────────────────────────────────┘

1. PORTALES WEB (Next.js) - ECOSISTEMA EXISTENTE
   ├── BeFast Delivery (negocios crean pedidos)
   ├── Portal Repartidores (registro, documentos, nómina)
   └── Portal Admin (aprobaciones, gestión, IDSE)

2. APP MÓVIL (React Native) - NUEVA INTEGRACIÓN
   └── BeFast GO (reemplaza Shipday completamente)

3. BACKEND COMPARTIDO (Firebase)
   ├── Firestore (mismas colecciones)
   ├── Cloud Functions (mismas funciones)
   ├── Authentication (mismo sistema)
   └── Storage (mismos buckets)
```

## 🔄 FLUJO COMPLETO DE REGISTRO Y ACTIVACIÓN

### Fase 1: Registro (Portal Web `/repartidores/signup/`)
1. **Datos Personales**: nombre, RFC, CURP, NSS, vehículo, CLABE
2. **Documentos**: INE, constancia SAT, licencia, tarjeta circulación
3. **Firma Digital**: Política Algorítmica, Contrato de Trabajo
4. **Capacitación**: videos, cuestionario, evidencia equipo
5. **Envío**: solicitud → `driverApplications` collection (PENDING)

### Fase 2: Validación (Portal Admin `/admin/solicitudes`)
1. **Vertex AI Vision**: analiza documentos automáticamente
2. **Revisión Manual**: admin decide APROBAR/RECHAZAR
3. **Si APROBADO**: crea perfil en `drivers` collection
   - `befastStatus: 'APPROVED'`
   - `idseApproved: false`

### Fase 3: Alta IMSS (Portal Admin `/admin/payroll`)
1. **Contabilidad sube Acta IDSE** manualmente
2. **Sistema ejecuta `updateDriverIDSEStatus`**:
   - `befastStatus: 'APPROVED'` → `'ACTIVE'`
   - `idseApproved: false` → `true`
   - `imssStatus: 'PENDING'` → `'ACTIVO_COTIZANDO'`

### Fase 4: Operación (App BeFast GO)
- Conductor inicia sesión → valida ACTIVE + IDSE
- Se conecta online → recibe pedidos
- Validación 360° en cada asignación

## 💰 LÓGICA FINANCIERA DUAL

### Pedidos con TARJETA (BeFast Market)
```
Cliente paga tarjeta → BeFast cobra → Al completar:
- Ganancia neta (total - $15) + propina → walletBalance
- Transacciones: CARD_ORDER_TRANSFER + TIP_CARD_TRANSFER
```

### Pedidos en EFECTIVO (BeFast Delivery)
```
Cliente paga efectivo al conductor → Al completar:
- Fee BeFast ($15) → se registra como deuda en pendingDebts
- Transacción: CASH_ORDER_ADEUDO (negativa)
```

### Control de Deuda
```typescript
// Regla de Bloqueo
if (pendingDebts >= creditLimit) {
  // NO puede aceptar pedidos EFECTIVO
}

// Recuperación Automática (después de pedidos tarjeta)
if (walletBalance > 0 && pendingDebts > 0) {
  const recovery = Math.min(walletBalance, pendingDebts);
  walletBalance -= recovery;
  pendingDebts -= recovery;
}
```

## ✅ VALIDACIÓN 360° CRÍTICA

### Cloud Function: `validateOrderAssignment`
```typescript
const validations = {
  befastActive: driver.administrative.befastStatus === 'ACTIVE',
  idseApproved: driver.administrative.idseApproved === true, // CRÍTICO
  imssActive: driver.administrative.imssStatus === 'ACTIVO_COTIZANDO',
  isOnline: driver.operational.isOnline === true,
  financialValid: order.paymentMethod === 'CARD' || 
                  driver.wallet.pendingDebts < driver.wallet.creditLimit,
  documentsValid: driver.administrative.documentsStatus === 'APPROVED',
  trainingCompleted: driver.administrative.trainingStatus === 'COMPLETED',
  noActiveOrder: !driver.operational.currentOrderId
};

// TODOS deben ser true para aprobar
const approved = Object.values(validations).every(v => v === true);
```

## 📊 ESTRUCTURA DE DATOS (Firestore)

### Collection: `drivers/{driverId}`
```typescript
interface Driver {
  uid: string;
  email: string;
  
  personalData: {
    fullName: string;
    phone: string;
    rfc: string;
    curp: string;
    nss: string;
  };
  
  administrative: {
    befastStatus: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED';
    imssStatus: 'ACTIVO_COTIZANDO' | 'PENDING' | 'INACTIVE';
    documentsStatus: 'APPROVED' | 'PENDING' | 'EXPIRED';
    trainingStatus: 'COMPLETED' | 'PENDING' | 'EXPIRED';
    idseApproved: boolean; // Requisito indispensable
    idseDocument?: string;
  };
  
  operational: {
    isOnline: boolean;
    status: 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'BREAK';
    currentOrderId: string | null;
    currentLocation?: { latitude: number; longitude: number; };
  };
  
  wallet: {
    balance: number;
    pendingDebts: number;
    creditLimit: number; // default: $300 MXN
  };
  
  stats: {
    totalOrders: number;
    completedOrders: number;
    rating: number;
    totalEarnings: number;
  };
}
```

### Estados del Conductor
| Estado | Descripción | ¿Puede recibir pedidos? |
|--------|-------------|------------------------|
| `PENDING` | Solicitud en revisión | ❌ No |
| `APPROVED` | Aprobado, falta IDSE | ❌ No |
| `ACTIVE` | IDSE aprobada, habilitado | ✅ Sí (cuando online) |
| `SUSPENDED` | Suspendido | ❌ No |

## 🔄 FLUJO DE PEDIDO EN LA APP

```
1. Pedido creado (Portal Web) → status: SEARCHING
2. Sistema busca conductor disponible
3. Conductor ve notificación → toca "Aceptar"
4. validateOrderAssignment() → Validación 360°
5. Si aprobado: status ASSIGNED → ACCEPTED
6. Conductor navega → PICKED_UP → IN_TRANSIT → ARRIVED
7. Entrega con verificación (foto + firma/PIN)
8. processOrderCompletion() → Auditoría + Transacciones
9. Status: COMPLETED
```

## ☁️ CLOUD FUNCTIONS CRÍTICAS

1. **`processDriverApplicationApproval`** - Aprobar/rechazar solicitudes
2. **`updateDriverIDSEStatus`** - Activar conductor (Acta IDSE)
3. **`createOrder`** - Crear pedido desde portal web
4. **`findBestDriverForOrder`** - Buscar mejor conductor
5. **`validateOrderAssignment`** - Validación 360° crítica
6. **`handleOrderWorkflow`** - Gestionar estados del pedido
7. **`processOrderCompletion`** - Completar + transacciones
8. **`processWithdrawalRequest`** - Procesar retiros
9. **`processDebtPayment`** - Pago manual de deuda

## 🔧 CONFIGURACIÓN TÉCNICA

### Firebase Project
```typescript
const firebaseConfig = {
  projectId: "befast-hfkbl",
  authDomain: "befast-hfkbl.firebaseapp.com",
  storageBucket: "befast-hfkbl.appspot.com",
  messagingSenderId: "897579485656",
  appId: "1:897579485656:android:abc123def456"
};
```

### Colecciones Firestore
```typescript
export const COLLECTIONS = {
  DRIVERS: 'drivers',
  DRIVER_APPLICATIONS: 'driverApplications',
  ORDERS: 'orders',
  BUSINESSES: 'businesses',
  WALLET_TRANSACTIONS: 'walletTransactions',
  SYSTEM_LOGS: 'systemLogs',
  AUDIT_LOGS: 'auditLogs'
};
```

### Tipos de Transacción
```typescript
enum TransactionType {
  CASH_ORDER_ADEUDO = 'CASH_ORDER_ADEUDO',         // Deuda por efectivo
  CARD_ORDER_TRANSFER = 'CARD_ORDER_TRANSFER',     // Ganancia tarjeta
  TIP_CARD_TRANSFER = 'TIP_CARD_TRANSFER',         // Propina tarjeta
  DEBT_PAYMENT = 'DEBT_PAYMENT',                   // Pago de deuda
  BENEFITS_TRANSFER = 'BENEFITS_TRANSFER',         // Prestaciones IMSS
  ADJUSTMENT = 'ADJUSTMENT'                        // Ajuste manual
}
```

## 🎯 LÓGICA DE CLASIFICACIÓN LABORAL

### Evaluación Mensual (Primer Mes)
```typescript
const factoresExclusion = {
  auto: 0.36,      // 36%
  moto: 0.30,      // 30%
  bicicleta: 0.12  // 12%
};

const ingresoNeto = ingresoBruto * (1 - factoresExclusion[vehiculo]);
const salarioMinimo = 8364; // MXN

if (ingresoNeto >= salarioMinimo) {
  clasificacion = 'EMPLEADO_COTIZANTE'; // IMSS obligatorio
} else {
  clasificacion = 'TRABAJADOR_INDEPENDIENTE'; // Solo riesgos trabajo
}
```

### Proceso Mensual IMSS
1. **Día 1**: `monthlyDriverClassification()` - Evalúa ingresos
2. **Días 2-5**: `generateMonthlyIDSE()` - Genera movimientos IMSS
3. **Días 10-17**: `transferBenefitsOnly()` - Transfiere prestaciones

## 🚨 FLUJO DE INCUMPLIMIENTOS

### Regla de Tres Strikes
```typescript
if (incumplimientos >= 3 && periodo <= 30_dias) {
  iniciarProcesoRescision();
}

// Tipos de incumplimiento:
// 1. No realización de pedidos aceptados
// 2. Incumplimiento de protocolos operativos
// 3. Falta de actualización de datos (ubicación, disponibilidad)
```

### Proceso de Revisión
1. **Notificación** (24 horas) - Detalle del incumplimiento
2. **Aclaración** (2 días hábiles) - Oportunidad de justificar
3. **Tercer Strike** - Notificación de rescisión (3 días anticipación)
4. **Audiencia** (3 días hábiles) - Derecho a revisión formal
5. **Comité** (5 días hábiles) - Análisis del caso
6. **Resolución** (7 días hábiles) - Decisión final por escrito