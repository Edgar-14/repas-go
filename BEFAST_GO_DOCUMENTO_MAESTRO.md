# BeFast GO — Documento Maestro Definitivo (Arquitectura, Lógica y Flujos)
## App Nativa de Repartidores v1.1
**Fecha:** 13 de noviembre de 2025

---

## 📋 ÍNDICE

### PARTE 1: ESTADO OPERATIVO ACTUAL
1. Resumen Ejecutivo
2. Arquitectura General de la App
3. Componentes y Módulos (Mapa)
4. Navegación y Jerarquía de Pantallas
5. Flujos Críticos Paso a Paso
6. Lógica Central (Redux + Servicios)
7. Modelo de Datos Consumido (Firestore)
8. Validaciones de Habilitación de Repartidor
9. Notificaciones y Modal de Nuevo Pedido

### PARTE 2: DETALLE TÉCNICO PROFUNDO
10. Slices de Redux (Contratos y Estados)
11. Servicios (Cloud Functions, Wallet, Pricing, Asignación, Localización)
12. Ciclo de Vida del Pedido (Estados)
13. Cálculo Financiero y Deudas
14. Gestión de Ubicación en Tiempo Real
15. Seguridad y Reglas Esperadas
16. Índices Firestore Necesarios
17. Escenarios de Error y Recuperación

### PARTE 3: VISIÓN Y EVOLUCIÓN
18. Roadmap Técnico (Próximos 30 / 60 / 90 días)
19. Migración Completa a Pedidos 100% Nativos
20. Integración Inteligente con IA (Vertex) – Fases
21. Monitoreo y Observabilidad Recomendados

### PARTE 4: BLUEPRINT OPERATIVO
22. Checklist de Instalación y Arranque
23. Checklist de QA Funcional
24. Checklist de Seguridad
25. Healthcheck Post-Login
26. Estructura de Código Estándar (Convenciones)
27. Próximos Incrementos Menores
28. Apéndice de Contratos (Tipos Clave)
29. Glosario de Estados y Campos
30. Conclusión

---

## 1. RESUMEN EJECUTIVO
BeFast GO es la app nativa que habilita a los repartidores para operar pedidos del ecosistema BeFast. Consume Firebase (Auth, Firestore, Functions, Messaging, Storage) y coordina flujos de: login, recepción (pull/push) de pedidos, aceptación, navegación, actualización de estatus, finalización, cálculo financiero y administración de billetera. El cliente mantiene lógica mínima: toda decisión crítica final reside en Cloud Functions.

## 2. ARQUITECTURA GENERAL DE LA APP
```
UI (React Native)
  ├── Navigation (Stack + Tabs)
  ├── Modals (NewOrderModal, etc.)
  └── Screens (Operación + Finanzas + Sistema)
Estado Global (Redux Toolkit)
  ├── authSlice
  ├── driverSlice
  ├── ordersSlice
  ├── walletSlice
  └── notificationsSlice
Servicios (src/services)
  ├── CloudFunctionsService
  ├── ordersService
  ├── WalletService / PricingService
  ├── OrderAssignmentService (algoritmo local de simulación)
  ├── NotificationService (FCM)
  └── LocationService (GPS en tiempo real)
Infra Firebase RN
  ├── Auth / Firestore / Functions / Messaging / Storage
  └── Config central (colecciones + nombres CF)
```

## 3. COMPONENTES Y MÓDULOS (MAPA)
- Store raíz: `src/store/index.ts`.
- Slices: cada archivo en `src/store/slices/` define estado + thunks + reducers.
- Servicios especializados en `src/services/` encapsulan acceso externo y cálculos.
- Modal crítico: `NewOrderModal` interpreta payloads flexibles y habilita aceptación.

## 4. NAVEGACIÓN Y JERARQUÍA DE PANTALLAS
- Tabs principales: Inicio (Dashboard), Pedidos (OrdersScreen), Mapa (NavigationScreen), Billetera (Payments), Avisos (Notifications), Perfil.
- Stack adicional: Detalle de Pedido, Completar, Calificar, Historial de Pagos, Métricas, GPSNavigation, Documents, Settings, etc.
- Pantalla `OrdersScreen` integra historial → elimina necesidad de `OrdersHistoryScreen` directa.

## 5. FLUJOS CRÍTICOS PASO A PASO
### Flujo: Login → Recepción de Pedidos
1. Usuario ingresa correo/contraseña.
2. `authSlice.loginDriver` valida credenciales y carga documento `drivers/{uid}`.
3. Ejecuta validaciones (IDSE, estado, IMSS, documentos). Si falla: bloqueo.
4. Post-login: `dispatch(loadOrders())` y navegación a `Main`.
5. OrdersScreen: muestra disponibles (pull) y escucha FCM (push) para nuevos.

### Flujo: Nuevo Pedido (Push)
1. Backend envía FCM con `data.type = NEW_ORDER`.
2. `NotificationService` captura foreground/background/cold start.
3. `notificationsSlice.showNewOrderModal` guarda payload.
4. `NewOrderModal` muestra datos normalizados (total, propina, método, distancias).
5. Repartidor acepta → `ordersSlice.acceptOrder` → CF `validateOrderAssignment`.

### Flujo: Progreso del Pedido
1. Pedido aceptado se mueve a `assignedOrders` y/o `activeOrder`.
2. Cambios de estado: `updateOrderStatus` → CF `handleOrderWorkflow` (STARTED → PICKED_UP → ARRIVED → DELIVERED).
3. Mapa/Navegación usa ubicación (LocationService) para actualizar Firestore.

### Flujo: Finalización + Finanzas
1. Repartidor confirma entrega en `OrderCompletionScreen`.
2. `completeOrder` → CF `processOrderCompletion` calcula ganancias/neto/deuda.
3. Wallet se actualiza en tiempo real (`listenToWalletBalance`) y se registra transacción.
4. Si hay saldo y deuda simultánea → recuperación automática (WalletService).

## 6. LÓGICA CENTRAL (REDUX + SERVICIOS)
- Slices son responsables del orquestado y manejo de UI/loading/errores.
- Servicios implementan cálculos y llamadas estructuradas (encapsulan CF names).
- `PricingService` define tarifa base (45 MXN), adicional por km (2.5), comisión BeFast (15), propina 100% conductor.
- `OrderAssignmentService` provee heurística local (score, distancia, límite pedidos activos) usada para simulación interna.

## 7. MODELO DE DATOS CONSUMIDO (FIRESTORE)
### drivers/{uid}
```
administrative: { idseApproved, befastStatus, imssStatus, documentsStatus }
wallet: { balance, pendingDebts, creditLimit, lastUpdated }
operational: { isOnline, status, currentLocation { lat, lon, timestamp }, lastLocationUpdate }
stats: { totalOrders, completedOrders, rating, totalEarnings }
kpis: { acceptanceRate, completionRate, onTimeDeliveryRate, averageDeliveryTime }
fcmToken
```
### orders/{orderId}
```
status, driverId?, pickup { businessName, address, location? }, delivery { address, location? },
paymentMethod (CARD|CASH), estimatedEarnings?, distance?, timestamps (createdAt, updatedAt, assignedAt, pickedUpAt, completedAt)
```
### walletTransactions
```
{ driverId, type, amount, orderId?, timestamp, metadata, status }
```

## 8. VALIDACIONES DE HABILITACIÓN DE REPARTIDOR
Condiciones obligatorias (bloquean aceptación):
- idseApproved === true
- befastStatus === 'ACTIVE'
- imssStatus === 'ACTIVO_COTIZANDO'
- documentsStatus === 'APPROVED'
Resultado se expone como `canReceiveOrders` y `blockingReason`.

## 9. NOTIFICACIONES Y MODAL DE NUEVO PEDIDO
- Token FCM guardado tras permisos → `drivers/{uid}.fcmToken`.
- `NotificationService` maneja onMessage, background handler, openedApp e initialNotification.
- Payload flexible normalizado por `NewOrderModal` (tolerancia a diferentes nombres de campos).
- Tiempo de respuesta: contador 60s → auto-cierre.

---

## 10. SLICES DE REDUX (CONTRATOS Y ESTADOS)
### authSlice
Estado: user, driver, isAuthenticated, canReceiveOrders.
Thunks: loginDriver, logoutDriver. Validaciones integradas.
### driverSlice
Estado: isOnline, status, currentLocation, stats, kpis.
Thunks: updateDriverStatus, updateDriverLocation, fetchDriverStats.
### ordersSlice
Estado: availableOrders, assignedOrders, activeOrder, orderHistory.
Thunks: loadOrders, fetchActiveOrder, acceptOrder, updateOrderStatus, completeOrder, fetchOrderHistory.
### walletSlice
Estado: balance, pendingDebts, creditLimit, transactions.
Thunks: listenToWalletBalance, fetchTransactionHistory, processWithdrawal, payDebt.
### notificationsSlice
Estado: newOrderToShow, globalMessage.
Reducers: showNewOrderModal, hideNewOrderModal.

## 11. SERVICIOS
- CloudFunctionsService: fachada a CF (validateOrderAssignment, handleOrderWorkflow, processOrderCompletion, updateDriverStatus, processWithdrawal, processDebtPayment, sendNotification).
- ordersService: callable getDriverOrders.
- PricingService: cálculo tarifas + ganancias + distances (con API externa si habilitada).
- WalletService: procesa transacciones, recupera deudas automáticamente.
- OrderAssignmentService: calcula candidatos, valida con IA (dummy call `validateAssignmentWithVertexAI`).
- LocationService: permisos + watchPosition + Firestore updates.
- NotificationService: orquesta FCM.

## 12. CICLO DE VIDA DEL PEDIDO (ESTADOS)
Estados manejados/visibles:
```
NOT_ASSIGNED / SEARCHING (disponible)
ASSIGNED / ACCEPTED (aceptado)
STARTED (en camino al pickup)
PICKED_UP (recogido)
IN_TRANSIT / ARRIVED (transitando / llegó destino)
DELIVERED (entregado)
COMPLETED (cerrado final)
```
Transiciones aprobadas vía Cloud Function (handleOrderWorkflow).

## 13. CÁLCULO FINANCIERO Y DEUDAS
Método de pago:
- Tarjeta: (Total - propina) - 15 = neto base + 100% propina → registro en wallet; deuda no aumenta.
- Efectivo: conductor cobra todo, se agrega deuda fija 15 MXN.
Auto recuperación: si balance > 0 y pendingDebts > 0 → se descuenta automáticamente.
Transacciones relevantes:
```
CARD_ORDER_TRANSFER, TIP_CARD_TRANSFER, CASH_ORDER_ADEUDO, DEBT_PAYMENT, BONUS, PENALTY, ADJUSTMENT
```

## 14. GESTIÓN DE UBICACIÓN EN TIEMPO REAL
`LocationService`:
- Permisos diferenciados Android/iOS.
- watchPosition cada 10s / distancia 10m.
- Actualiza `operational.currentLocation` + `lastLocationUpdate`.
- Distancias calculadas (Haversine local + opción API Google).

## 15. SEGURIDAD Y REGLAS ESPERADAS (PROPUESTA)
Firestore (ejemplo):
```
match /drivers/{driverId} {
  allow read, update: if request.auth.uid == driverId;
}
match /orders/{orderId} {
  allow read: if request.auth != null;
  allow update: if request.auth.uid == resource.data.driverId;
}
match /walletTransactions/{txId} {
  allow read: if request.auth.uid == resource.data.driverId;
}
```
Callable CF: requieren `context.auth.uid` y validaciones internas.

## 16. ÍNDICES FIRESTORE NECESARIOS
- orders: composite index para (`driverId` ==, `status` in) + `updatedAt` / `createdAt`.
- walletTransactions: (`driverId` ==) + `timestamp` desc.
- Optional: orders by (`status` in) + `createdAt` desc (para disponibles).

## 17. ESCENARIOS DE ERROR Y RECUPERACIÓN
| Escenario | Causa | Recuperación |
|-----------|-------|--------------|
| CF no encontrada | Nombre/región | Verificar despliegue y nombres en CLOUD_FUNCTIONS |
| FCM sin token | Permisos denegados | Reintentar permisos / fallback a polling |
| Pedido no aparece | Índice faltante | Crear índice sugerido |
| Deuda no actualiza | Falla CF financiera | Mostrar banner y reintentar manual |
| Ubicación no actualiza | Permisos GPS / error geoloc | Solicitar nuevamente / fallback manual |

---

## 18. ROADMAP TÉCNICO (30 / 60 / 90 días)
- 30 días: Despliegue formal `getDriverOrders`, listeners tiempo real para disponibles, canal FCM Android, healthcheck.
- 60 días: Migrar a Firestore listeners para estados de pedidos y asignación, integrar cálculo ETA real, mejoras UI para flujo de entrega.
- 90 días: IA para scoring predictivo, rutas optimizadas, auditoría avanzada automática y antifraude (Vertex).

## 19. MIGRACIÓN A PEDIDOS 100% NATIVOS
Pasos:
1. Consolidar esquema `orders` y remover dependencias externas.
2. Añadir CF para creación directa de pedidos (negocios internos).
3. Listener en app a `orders` con `status in ['NOT_ASSIGNED','SEARCHING']`.
4. Reemplazar pooling de callable por snapshot.

## 20. INTEGRACIÓN INTELIGENTE CON IA (FASES)
- Fase 1: Validación asignación → IA logistic scoring.
- Fase 2: Auditoría entrega → verificación foto/signature/ubicación.
- Fase 3: Chat contextual (soporte + fraude + coaching).
- Fase 4: Optimización multiruta y carga dinámica.

## 21. MONITOREO Y OBSERVABILIDAD RECOMENDADOS
- CF logs + dashboards (latencia y error rate).
- Crashlytics (si se integra) para la app.
- Métricas personalizadas: tiempo medio aceptación, ratio rechazo, latencia CF financiera.

---

## 22. CHECKLIST DE INSTALACIÓN Y ARRANQUE
- Node + dependencias instaladas.
- `google-services.json` (Android) y `GoogleService-Info.plist` (iOS si aplica).
- CF desplegadas: validateOrderAssignment, handleOrderWorkflow, processOrderCompletion, updateDriverStatus, processWithdrawalRequest, processDebtPayment, sendNotification, getDriverOrders.
- Permisos GPS y notificaciones aceptados.

## 23. CHECKLIST DE QA FUNCIONAL
- Login correcto muestra pedidos disponibles.
- FCM NEW_ORDER abre modal y permite aceptación.
- Estados progresan hasta COMPLETED.
- Wallet refleja movimientos tras completar.
- Deuda se incrementa en efectivo y recupera automáticamente con saldo.

## 24. CHECKLIST DE SEGURIDAD
- Reglas Firestore mínimas activas.
- CF validan `auth.uid` y parámetros.
- No se exponen llaves sensibles en repositorio (API Maps runtime configurable).
- Tokens FCM no accesibles públicamente.

## 25. HEALTHCHECK POST-LOGIN (PROPUESTA)
Tras login:
1. Verificar `auth().currentUser`.
2. Obtener token FCM y guardar.
3. Invocar `getDriverOrders` y confirmar respuesta.
4. Validar que `wallet.balance` y `wallet.pendingDebts` existan.

## 26. ESTRUCTURA DE CÓDIGO ESTÁNDAR (CONVENCIONES)
- Slices: camelCase, acción raíz `'slice/action'`.
- Servicios: Clases singleton o funciones puras.
- Cloud Functions: llamada siempre envía `timestamp`.
- Components: estilos con StyleSheet y colores centralizados.

## 27. PRÓXIMOS INCREMENTOS MENORES
- Banner dinámico si `canReceiveOrders === false`.
- Paginación en historial de pedidos.
- Skeleton loaders para listas.
- Mapa con polyline (pickup → delivery).

## 28. APÉNDICE DE CONTRATOS (TIPOS CLAVE)
Simplificado (derivado de código):
```
interface Order {
  id: string; status: string; driverId?: string;
  pickup?: { businessName?: string; address?: string }; delivery?: { address?: string };
  paymentMethod?: 'CASH' | 'CARD'; estimatedEarnings?: number; distance?: number;
  createdAt?: string | Date; updatedAt?: string | Date;
}
interface DriverWallet { balance: number; pendingDebts: number; creditLimit: number; }
```

## 29. GLOSARIO DE ESTADOS Y CAMPOS
- pendingDebts: deuda acumulada por pedidos en efectivo.
- creditLimit: umbral de bloqueo para aceptar pedidos en efectivo.
- assignmentScore: heurística local (no final) para priorizar candidatos.
- estimatedEarnings: vista al conductor de lo que ganará (tarjeta: neto + propina; efectivo: total a cobrar).

## 30. CONCLUSIÓN
BeFast GO tiene la base completa para operar pedidos reales y evolucionar rápidamente hacia un sistema 100% nativo e impulsado por IA. Los componentes críticos (slices, servicios, modal, navegación, finanzas, ubicación, notificaciones) están estructurados y alineados con la lógica del ecosistema. El foco inmediato debe ser: formalizar `getDriverOrders` en Functions, reforzar reglas/índices y preparar listeners tiempo real para reemplazar pooling. Desde ahí, se abre el camino hacia optimización inteligente y escalamiento sostenible.
