# 🔗 BeFast GO - Integración Completa con Ecosistema BeFast

**Versión**: 2.0  
**Fecha**: 5 de Noviembre 2025  
**Estado**: Guía de Integración para App Existente (80-87% completada)

---

## 🎯 PROPÓSITO DE ESTE DOCUMENTO

Este documento **NO modifica tu app existente**. Su propósito es definir exactamente **cómo integrar tu BeFast GO actual con el ecosistema BeFast** para reemplazar completamente a Shipday.

**IMPORTANTE**: El registro de conductores está **disponible tanto en portal web como en la app móvil** con el mismo proceso de 5 pasos. Los documentos son **solo lectura** después del registro inicial.

---

## 🏗️ ARQUITECTURA DE INTEGRACIÓN

### Conexión Directa: Ecosistema ↔ BeFast GO

```
PORTALES WEB (Next.js)                    BEFAST GO APP (React Native)
├── BeFast Delivery                       ├── Login existente
├── Portal Repartidores                   ├── Dashboard existente  
└── Portal Admin                          ├── Gestión pedidos existente
    ↓                                     ├── Billetera existente
FIREBASE BACKEND (Compartido)             └── Navegación existente
├── Firestore (mismas colecciones)            ↑
├── Cloud Functions (mismas funciones)        │
├── Authentication (mismo sistema)            │
└── Storage (mismos buckets)                  │
    ↓                                         │
INTEGRACIÓN EN TIEMPO REAL ←──────────────────┘
```

**Clave**: Tu app ya funciona, solo necesita conectarse a las **mismas Cloud Functions y colecciones** que usa el ecosistema web.

---

## 🔧 CONFIGURACIÓN DE FIREBASE

### 1. Configuración del Proyecto

```typescript
// firebase.config.ts (en tu app existente)
const firebaseConfig = {
  apiKey: "AIzaSyBqJxKuoZ8X7X7X7X7X7X7X7X7X7X7X7X7",
  authDomain: "befast-hfkbl.firebaseapp.com",
  projectId: "befast-hfkbl",                    // ← MISMO PROYECTO
  storageBucket: "befast-hfkbl.appspot.com",
  messagingSenderId: "897579485656",
  appId: "1:897579485656:android:abc123def456"
};
```

### 2. Colecciones de Firestore (Usar las existentes)

```typescript
// collections.ts (usar exactamente estas)
export const COLLECTIONS = {
  // Conductores
  DRIVERS: 'drivers',
  DRIVER_APPLICATIONS: 'driverApplications',
  
  // Pedidos
  ORDERS: 'orders',
  ORDER_TIMELINE: 'orderTimeline',
  
  // Financiero
  WALLET_TRANSACTIONS: 'walletTransactions',
  CREDIT_TRANSACTIONS: 'creditTransactions',
  
  // Sistema
  SYSTEM_LOGS: 'systemLogs',
  AUDIT_LOGS: 'auditLogs'
};
```

---

## 🔐 AUTENTICACIÓN (Integrar con tu login existente)

### Validación de Estado del Conductor

```typescript
// Agregar a tu login existente
interface DriverValidation {
  // Validación básica (ya tienes)
  isAuthenticated: boolean;
  
  // Validación de habilitación (AGREGAR)
  canReceiveOrders: boolean;
  blockingReason?: string;
  
  // Estados críticos (VALIDAR)
  administrative: {
    befastStatus: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED';
    idseApproved: boolean;        // ← CRÍTICO: Sin esto NO puede operar
    imssStatus: 'ACTIVO_COTIZANDO' | 'PENDING' | 'INACTIVE';
    documentsStatus: 'APPROVED' | 'PENDING' | 'EXPIRED';
  };
}

// Función para validar habilitación (AGREGAR a tu app)
const validateDriverEligibility = async (driverId: string) => {
  const driver = await firestore().collection('drivers').doc(driverId).get();
  const data = driver.data();
  
  // Validación IMSS (REQUISITO INDISPENSABLE)
  if (!data?.administrative?.idseApproved) {
    return {
      canReceiveOrders: false,
      blockingReason: 'IDSE_NOT_APPROVED',
      message: 'Tu alta en IMSS está pendiente. Contacta a soporte.'
    };
  }
  
  // Validación de estado
  if (data?.administrative?.befastStatus !== 'ACTIVE') {
    return {
      canReceiveOrders: false,
      blockingReason: 'NOT_ACTIVE',
      message: 'Tu cuenta no está activa. Contacta a soporte.'
    };
  }
  
  return { canReceiveOrders: true };
};
```

---

## 📦 GESTIÓN DE PEDIDOS (Integrar con tu sistema existente)

### 1. Escuchar Pedidos Disponibles

```typescript
// Agregar a tu dashboard existente
const listenForAvailableOrders = (driverId: string) => {
  return firestore()
    .collection('orders')
    .where('status', '==', 'SEARCHING')
    .where('assignedDriverId', '==', null)
    .onSnapshot(snapshot => {
      const availableOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Mostrar en tu UI existente
      updateAvailableOrders(availableOrders);
    });
};
```

### 2. Aceptar Pedido (Usar Cloud Function existente)

```typescript
// Modificar tu función de aceptar pedido
const acceptOrder = async (orderId: string, driverId: string) => {
  try {
    // Llamar a la Cloud Function existente del ecosistema
    const result = await functions().httpsCallable('validateOrderAssignment')({
      orderId,
      driverId,
      action: 'ACCEPT'
    });
    
    if (result.data.approved) {
      // Pedido aceptado - continuar con tu flujo existente
      navigateToActiveOrder(orderId);
    } else {
      // Pedido rechazado - mostrar razón
      showAlert(result.data.reason);
    }
  } catch (error) {
    console.error('Error accepting order:', error);
  }
};
```

### 3. Estados del Pedido (Usar los del ecosistema)

```typescript
// Reemplazar tus estados actuales con estos
enum OrderStatus {
  PENDING = 'PENDING',
  SEARCHING = 'SEARCHING',      // Buscando repartidor
  ASSIGNED = 'ASSIGNED',        // Asignado pero no aceptado
  ACCEPTED = 'ACCEPTED',        // Aceptado por repartidor
  PICKED_UP = 'PICKED_UP',      // Recogido del restaurante
  IN_TRANSIT = 'IN_TRANSIT',    // En camino al cliente
  ARRIVED = 'ARRIVED',          // Llegó al destino
  DELIVERED = 'DELIVERED',      // Entregado
  COMPLETED = 'COMPLETED',      // Completado y pagado ← IMPORTANTE
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}
```

### 4. Completar Pedido (Usar Cloud Function existente)

```typescript
// Modificar tu función de completar pedido
const completeOrder = async (orderId: string, completionData: any) => {
  try {
    // Llamar a la Cloud Function existente del ecosistema
    const result = await functions().httpsCallable('processOrderCompletion')({
      orderId,
      driverId: currentUser.uid,
      photoUrl: completionData.photoUrl,      // Foto obligatoria
      signature: completionData.signature,    // Solo efectivo
      customerPin: completionData.pin,        // Solo tarjeta
      cashReceived: completionData.cashAmount // Solo efectivo
    });
    
    if (result.data.success) {
      // Pedido completado - actualizar billetera
      updateWalletBalance();
      showSuccessMessage('Pedido completado exitosamente');
    }
  } catch (error) {
    console.error('Error completing order:', error);
  }
};
```

---

## 💰 BILLETERA DIGITAL (Integrar con tu sistema existente)

### 1. Escuchar Saldo en Tiempo Real

```typescript
// Agregar a tu billetera existente
const listenToWalletBalance = (driverId: string) => {
  return firestore()
    .collection('drivers')
    .doc(driverId)
    .onSnapshot(doc => {
      const data = doc.data();
      const walletData = {
        balance: data?.wallet?.balance || 0,
        pendingDebts: data?.wallet?.pendingDebts || 0,
        creditLimit: data?.wallet?.creditLimit || 300
      };
      
      // Actualizar tu UI existente
      updateWalletUI(walletData);
    });
};
```

### 2. Historial de Transacciones

```typescript
// Agregar a tu historial existente
const getTransactionHistory = (driverId: string) => {
  return firestore()
    .collection('walletTransactions')
    .where('driverId', '==', driverId)
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get()
    .then(snapshot => {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
};
```

### 3. Tipos de Transacciones (Usar los del ecosistema)

```typescript
// Usar exactamente estos tipos
enum TransactionType {
  CARD_ORDER_TRANSFER = 'CARD_ORDER_TRANSFER',     // Ganancia pedido tarjeta
  CASH_ORDER_ADEUDO = 'CASH_ORDER_ADEUDO',         // Deuda pedido efectivo
  TIP_CARD_TRANSFER = 'TIP_CARD_TRANSFER',         // Propina tarjeta
  DEBT_PAYMENT = 'DEBT_PAYMENT',                   // Pago de deuda
  BENEFITS_TRANSFER = 'BENEFITS_TRANSFER',         // Prestaciones IMSS
  ADJUSTMENT = 'ADJUSTMENT',                       // Ajuste manual
  PENALTY = 'PENALTY',                             // Penalización
  BONUS = 'BONUS'                                  // Bonificación
}
```

---

## 🔔 NOTIFICACIONES PUSH (Integrar con FCM)

### 1. Configuración FCM

```typescript
// Agregar a tu configuración existente
import messaging from '@react-native-firebase/messaging';

const setupPushNotifications = async () => {
  // Solicitar permisos
  const authStatus = await messaging().requestPermission();
  
  if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
    // Obtener token FCM
    const fcmToken = await messaging().getToken();
    
    // Guardar token en Firestore (para que el ecosistema pueda enviar notificaciones)
    await firestore()
      .collection('drivers')
      .doc(currentUser.uid)
      .update({
        fcmToken: fcmToken,
        lastTokenUpdate: firestore.FieldValue.serverTimestamp()
      });
  }
};
```

### 2. Escuchar Notificaciones de Pedidos

```typescript
// Agregar a tu app existente
const setupOrderNotifications = () => {
  // Notificaciones en primer plano
  messaging().onMessage(async remoteMessage => {
    if (remoteMessage.data?.type === 'NEW_ORDER') {
      // Mostrar notificación de nuevo pedido
      showOrderNotification(remoteMessage.data);
    }
  });
  
  // Notificaciones en segundo plano
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message:', remoteMessage);
  });
};
```

---

## 📊 ESTADÍSTICAS (Integrar con datos del ecosistema)

### 1. KPIs del Conductor

```typescript
// Agregar a tu dashboard existente
const getDriverStats = async (driverId: string) => {
  const driver = await firestore().collection('drivers').doc(driverId).get();
  const data = driver.data();
  
  return {
    // Estadísticas básicas
    totalOrders: data?.stats?.totalOrders || 0,
    completedOrders: data?.stats?.completedOrders || 0,
    rating: data?.stats?.rating || 0,
    totalEarnings: data?.stats?.totalEarnings || 0,
    
    // KPIs calculados
    acceptanceRate: data?.kpis?.acceptanceRate || 0,
    completionRate: data?.kpis?.completionRate || 0,
    onTimeRate: data?.kpis?.onTimeDeliveryRate || 0,
    averageDeliveryTime: data?.kpis?.averageDeliveryTime || 0
  };
};
```

---

## 🚨 VALIDACIÓN CRÍTICA 360° (IMPLEMENTAR)

### Validación Antes de Cada Pedido

```typescript
// AGREGAR esta validación crítica a tu app
const validateBeforeAcceptingOrder = async (orderId: string, driverId: string) => {
  try {
    // Llamar a la Cloud Function de validación del ecosistema
    const result = await functions().httpsCallable('validateOrderAssignment')({
      orderId,
      driverId
    });
    
    return result.data; // { approved: boolean, reason?: string }
  } catch (error) {
    return { approved: false, reason: 'Error de validación' };
  }
};

// Usar en tu función de aceptar pedido
const acceptOrderWithValidation = async (orderId: string) => {
  const validation = await validateBeforeAcceptingOrder(orderId, currentUser.uid);
  
  if (!validation.approved) {
    // Mostrar razón del rechazo
    showAlert(`No puedes aceptar este pedido: ${validation.reason}`);
    return;
  }
  
  // Continuar con tu flujo existente
  proceedWithOrder(orderId);
};
```

---

## 🔄 SINCRONIZACIÓN EN TIEMPO REAL

### 1. Estado del Conductor

```typescript
// Agregar a tu app para mantener estado sincronizado
const updateDriverStatus = async (status: 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'BREAK') => {
  await firestore()
    .collection('drivers')
    .doc(currentUser.uid)
    .update({
      'operational.status': status,
      'operational.isOnline': status !== 'OFFLINE',
      'operational.lastUpdate': firestore.FieldValue.serverTimestamp()
    });
};
```

### 2. Ubicación en Tiempo Real

```typescript
// Agregar seguimiento de ubicación
const updateDriverLocation = (latitude: number, longitude: number) => {
  firestore()
    .collection('drivers')
    .doc(currentUser.uid)
    .update({
      'operational.currentLocation': {
        latitude,
        longitude,
        timestamp: firestore.FieldValue.serverTimestamp()
      }
    });
};
```

---

## 📋 CHECKLIST DE INTEGRACIÓN

### ✅ Configuración Básica
- [ ] Configurar Firebase con proyecto `befast-hfkbl`
- [ ] Usar las mismas colecciones de Firestore
- [ ] Configurar FCM para notificaciones push
- [ ] Implementar validación de habilitación IMSS/IDSE
- [ ] Implementar registro completo (5 pasos) en app móvil
- [ ] Configurar documentos como solo lectura post-registro

### ✅ Gestión de Pedidos
- [ ] Escuchar pedidos disponibles desde Firestore
- [ ] Usar Cloud Function `validateOrderAssignment` para aceptar
- [ ] Usar Cloud Function `processOrderCompletion` para completar
- [ ] Implementar estados de pedido del ecosistema

### ✅ Sistema Financiero
- [ ] Escuchar saldo de billetera en tiempo real
- [ ] Mostrar historial de transacciones
- [ ] Usar tipos de transacciones del ecosistema
- [ ] Implementar lógica dual (efectivo vs tarjeta)

### ✅ Sincronización
- [ ] Actualizar estado del conductor en tiempo real
- [ ] Enviar ubicación GPS periódicamente
- [ ] Mantener token FCM actualizado
- [ ] Sincronizar estadísticas y KPIs

---

## 🎯 RESULTADO FINAL

Con esta integración, tu BeFast GO:

1. **Reemplaza completamente a Shipday** ✅
2. **Se conecta directamente al ecosistema BeFast** ✅
3. **Usa las mismas Cloud Functions y datos** ✅
4. **Incluye registro completo de conductores** ✅
5. **Mantiene documentos como solo lectura** ✅
6. **Mantiene tu código existente intacto** ✅
7. **Agrega solo las integraciones necesarias** ✅

**Tu app seguirá funcionando igual, pero ahora estará completamente integrada con el ecosistema BeFast.**

---

**Documento de Integración Oficial**  
**Para app BeFast GO existente (80-87% completada)**  
**Última actualización**: 5 de Noviembre 2025