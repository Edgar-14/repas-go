# Estado Maestro del Sistema — BeFast GO (App de Repartidores)
Fecha: 2025-11-13

Este documento resume, con precisión operativa, lo que está implementado hoy en el proyecto BeFast GO, cómo está cableado con Firebase y Cloud Functions del ecosistema, qué pantallas y flujos existen, y qué pendientes críticos faltan para operar al 100%.

---

## 1) Arquitectura actual

- UI: React Native + React Navigation (Stack + Bottom Tabs)
- Estado: Redux Toolkit
  - Store: `src/store/index.ts`
  - Slices: `auth`, `driver`, `orders`, `wallet`, `notifications`
- Backend: Firebase (RN Firebase)
  - Auth, Firestore, Functions, Messaging, Storage
  - Config central: `src/config/firebase.ts`
- Notificaciones: FCM con manejadores en `src/services/NotificationService.ts` y `src/config/firebase.ts`
- Navegación: `src/navigation/AppNavigator.tsx` (Tabs: Inicio, Pedidos, Mapa, Billetera, Avisos, Perfil)
- Inicio App: `App.tsx` (wrapping con Provider + NavigationContainer + init Firebase/FCM)

---

## 2) Integraciones con backend (Cloud Functions + Firestore)

- Callable Functions usadas (nombres desde `CLOUD_FUNCTIONS`):
  - `validateOrderAssignment`: aceptar pedido
  - `handleOrderWorkflow`: actualizar estado (STARTED, PICKED_UP, DELIVERED, etc.)
  - `processOrderCompletion`: finalizar y calcular financiero
  - `updateDriverStatus`: online/offline, estado operativo
  - `processWithdrawalRequest`: retiros de billetera
  - `processDebtPayment`: pago de deudas
  - `sendNotification`: enviar notificación (sistema)

- Consultas Firestore relevantes:
  - `orders` para pedidos (disponibles/asignados/historial)
  - `drivers/{uid}` para estado operativo, FCM token, KPIs y wallet
  - `walletTransactions` para historial financiero

- Función adicional para listados: `getDriverOrders` (callable)
  - Cliente: `src/services/ordersService.ts` → `fetchDriverOrders(driverId)`
  - Slice: `ordersSlice.loadOrders`

---

## 3) Estado de módulos (qué hay y cómo funciona)

### 3.1 Auth (`src/store/slices/authSlice.ts`)
- Login con email/password (RN Firebase Auth)
- Post-login: carga perfil del driver en Firestore
- Validaciones de elegibilidad del driver (IDSE, estado activo, documentos)
- Estado: `user`, `driver`, `canReceiveOrders`, `blockingReason`, loading/errores

### 3.2 Driver (`src/store/slices/driverSlice.ts`)
- Online/Offline, estado operativo (`ACTIVE|BUSY|OFFLINE|BREAK`)
- Actualización de ubicación en Firestore
- KPIs básicos y estadísticas

### 3.3 Orders (`src/store/slices/ordersSlice.ts`)
- `loadOrders`: usa Callable `getDriverOrders` para disponibles/asignados
- `fetchActiveOrder`: busca activo en Firestore
- `acceptOrder`: valida asignación con CF `validateOrderAssignment`
- `updateOrderStatus`: avanza flujo con CF `handleOrderWorkflow`
- `completeOrder`: cierra pedido con CF `processOrderCompletion`
- `fetchOrderHistory`: historial desde Firestore
- Estado: `availableOrders`, `assignedOrders`, `activeOrder`, `orderHistory`, loading/errores

### 3.4 Wallet (`src/store/slices/walletSlice.ts`)
- Listener de saldo en tiempo real: `drivers/{uid}.wallet`
- Historial de transacciones (`walletTransactions`) con orden descendente
- Operaciones: `processWithdrawal`, `payDebt` (callables)
- Helper: `canAcceptCashOrders(pendingDebts, creditLimit)`

### 3.5 Notificaciones (`src/services/NotificationService.ts` + `src/config/firebase.ts`)
- Solicita permisos, obtiene y guarda FCM token en `drivers/{uid}`
- Listeners: foreground, background, cold start
- Maneja `data.type === 'NEW_ORDER'` y abre modal de nuevo pedido `NewOrderModal`

---

## 4) Pantallas y navegación

- Login (`LoginScreen`): login + dispara `loadOrders` al autenticarse
- Dashboard (`DashboardScreen`): métricas del día, saldo, estado online
- Orders (`OrdersScreen`): Tab interno: Disponibles + Historial
  - Pull-to-refresh → `loadOrders` y `fetchOrderHistory`
  - Banner de pedido activo → navega a `Navigation`
- OrderDetail, OrderCompletion, OrderRating: flujo de entrega
- Payments y PaymentsHistory: saldo e historial
- Notifications, Emergency, Settings, Documents, Metrics, GPSNavigation
- `AppNavigator.tsx`: integra Tabs + Stack, muestra `NewOrderModal` vía store `notifications`

---

## 5) Flujo de pedidos actual (end-to-end)

1) Login → valida elegibilidad (IDSE, estado, docs)
2) Post-login → `dispatch(loadOrders())` (en `LoginScreen` ya activado)
3) OrdersScreen → lista disponibles + asignados
4) Nuevo pedido desde backend → FCM (`NEW_ORDER`) → `NewOrderModal`
5) Aceptar pedido → CF `validateOrderAssignment` → si OK, mueve a activo
6) Avanzar estados → `handleOrderWorkflow` (STARTED, PICKED_UP, ARRIVED, DELIVERED)
7) Completar → `processOrderCompletion` (cálculo financiero, wallet/debt)
8) Wallet actualiza saldo en tiempo real; historial disponible

---

## 6) Dependencias y configuración

- RN Firebase: `@react-native-firebase/{app,auth,firestore,functions,messaging,storage}`
- Google Maps: runtime key `setGoogleMapsApiKey(...)` (ver `App.tsx` y `src/config/runtime`)
- Android: `android/app/google-services.json` presente
- iOS: carpeta iOS con `Podfile` y proyecto; se asume `GoogleService-Info.plist` (verificar)

---

## 7) Gaps/Pendientes críticos para “100% negocio”

1) Cloud Function `getDriverOrders` (servidor)
   - En repo hay un archivo `getDriverOrders.ts` en raíz; faltan `functions/` y despliegue formal.
   - Acción: mover a `functions/src/orders/getDriverOrders.ts` + exportar en `functions/src/index.ts` + `firebase deploy`.

2) Índices de Firestore
   - Si se usa `where('status','in', [...])` con `orderBy`, preparar índices.
   - Acción: crear índices sugeridos por consola cuando aparezca error o preconfigurarlos.

3) FCM canales Android
   - Asegurar canal `new_orders` y notificación heads-up.
   - Acción: crear canal antes de mostrar notificaciones (Android >= 8).

4) Reglas de seguridad
   - Reforzar reglas de lectura/escritura para `drivers`, `orders`, `walletTransactions`.
   - Acción: documento de reglas + pruebas de seguridad.

5) iOS setup
   - Verificar APNs y capabilities para FCM; validar `GoogleService-Info.plist`.

6) Healthcheck básico en app (opcional)
   - Un helper para verificar Auth + Functions + Firestore + FCM post-login.

---

## 8) Ready-to-Run (pasos de prueba)

1) Inicia la app (Android):
   - Asegura `google-services.json` y permisos de ubicación/FCM
2) Login con un driver real existente
3) Verifica en consola Redux que `orders/loadOrders` se ejecuta y llena `availableOrders`
4) Desde el ecosistema, asigna un pedido al driver → debe llegar FCM y abrir `NewOrderModal`
5) Acepta y avanza estados → confirma que cambian en app y en Firestore
6) Completa pedido → verifica saldo en Wallet y transacción registrada

---

## 9) Referencias de código clave

- Store: `src/store/index.ts`
- Slices: `src/store/slices/*.ts`
- Servicios: `src/services/*.ts`
- Firebase config: `src/config/firebase.ts`
- Navegación: `src/navigation/AppNavigator.tsx`
- Login y Orders: `src/screens/LoginScreen.tsx`, `src/screens/OrdersScreen.tsx`

---

## 10) Conclusión

La app BeFast GO está estructurada correctamente (Redux + RN Firebase) y lista para operar con el ecosistema si las Cloud Functions están desplegadas y los índices/reglas están correctos. El flujo de pedidos, notificaciones y billetera está implementado a nivel cliente. Los principales pendientes son de backend (mover/desplegar `getDriverOrders`, validar funciones, y asegurar FCM/índices/reglas).

