# Inventario Técnico y Estado Funcional - App BeFast GO

**Propósito:** Este documento es una auditoría técnica y factual del estado actual de la aplicación `BeFast GO`. No contiene opiniones ni planes, solo un inventario de lo que está implementado en el código y lo que no.

---

## 1. Core del Sistema y Conectividad

### **Funcionalidad: Conexión a Firebase**
- **Estado:** `IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - El archivo `src/config/firebase.ts` contiene las credenciales correctas para el proyecto de Firebase `befast-hfkbl`.
  - Las librerías de `@react-native-firebase` para `auth`, `firestore`, `messaging`, `storage` y `functions` están instaladas y configuradas.
- **Funcionalidad Faltante (Qué Falta):**
  - Nada. La conexión base está lista.

### **Funcionalidad: Autenticación de Usuarios**
- **Estado:** `PARCIALMENTE IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - Existen las pantallas `LoginScreen.tsx` y `RegistrationScreen.tsx`.
  - La librería `@react-native-firebase/auth` está disponible para ser usada.
- **Funcionalidad Faltante (Qué Falta):**
  - El código que conecta los botones de "Iniciar Sesión" y "Registrarse" con las funciones de Firebase (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`).
  - La lógica para manejar el estado de la sesión del usuario (guardar el token, redirigir automáticamente si ya está logueado).

---

## 2. Flujo de Pedidos

### **Funcionalidad: Recepción de Notificaciones de Nuevos Pedidos**
- **Estado:** `IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - El archivo `src/config/firebase.ts` contiene la función `setupNotificationListeners`.
  - Esta función escucha activamente los mensajes push (`messaging().onMessage`).
  - Está programada para identificar notificaciones con `data.type === 'NEW_ORDER'`.
- **Funcionalidad Faltante (Qué Falta):**
  - El componente de UI (modal, alerta, etc.) que se muestra al usuario cuando se recibe la notificación. La función `emitNewOrder` es llamada, pero no hay un listener de UI que la consuma para mostrar los detalles del pedido.

### **Funcionalidad: Visualización de Pedidos Disponibles**
- **Estado:** `NO IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - Existe el archivo de pantalla `OrdersScreen.tsx`.
- **Funcionalidad Faltante (Qué Falta):**
  - El código dentro de `OrdersScreen.tsx` que realice una consulta a la colección `orders` de Firestore para obtener y mostrar una lista de los pedidos con `status: 'PENDING'`.

### **Funcionalidad: Aceptar un Pedido**
- **Estado:** `NO IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - Nada.
- **Funcionalidad Faltante (Qué Falta):**
  - El botón "Aceptar" en la UI de un pedido disponible.
  - El código que, al presionar ese botón, llame a la Cloud Function `validateOrderAssignment` enviando el `orderId` y el `driverId`.
  - La lógica para manejar la respuesta (`APPROVED` o `REJECTED`) de la Cloud Function.

### **Funcionalidad: Cambiar Estado del Pedido (Recogido, Entregado)**
- **Estado:** `NO IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - Nada.
- **Funcionalidad Faltante (Qué Falta):**
  - Los botones en la UI de la pantalla de navegación activa.
  - El código que, al presionarlos, actualice el campo `status` del documento del pedido en Firestore.

### **Funcionalidad: Completar Pedido con PIN**
- **Estado:** `NO IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - Nada.
- **Funcionalidad Faltante (Qué Falta):**
  - La UI para ingresar un PIN.
  - La llamada a una Cloud Function (ej. `completeOrderWithPIN`) para validar el PIN y finalizar el pedido.

---

## 3. Funcionalidades del Repartidor

### **Funcionalidad: Dashboard de KPIs**
- **Estado:** `NO IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - Existe el archivo `DashboardScreen.tsx`.
- **Funcionalidad Faltante (Qué Falta):**
  - El código que consulte el documento del repartidor en la colección `drivers` y su subcolección `kpis` para mostrar métricas (ganancias, calificación, etc.).

### **Funcionalidad: Billetera Digital (Wallet)**
- **Estado:** `NO IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - Existe el archivo `PaymentsScreen.tsx`.
- **Funcionalidad Faltante (Qué Falta):**
  - El código que consulte el campo `walletBalance` y la subcolección `walletTransactions` del repartidor para mostrar su saldo e historial de transacciones.

### **Funcionalidad: Gestión de Documentos**
- **Estado:** `NO IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - Existe el archivo `DocumentsScreen.tsx`.
- **Funcionalidad Faltante (Qué Falta):**
  - El código que consulte la subcolección `documents` del repartidor para mostrar el estado de cada documento.
  - La UI y la lógica para subir nuevos documentos usando `@react-native-firebase/storage`.

### **Funcionalidad: Botón de Emergencia**
- **Estado:** `NO IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - Existe el archivo `EmergencyScreen.tsx`.
- **Funcionalidad Faltante (Qué Falta):**
  - La UI del botón y la lógica para enviar una alerta o llamar a una Cloud Function de emergencia.

---

## 4. Navegación y Tracking

### **Funcionalidad: Visualización de Mapa y Ruta**
- **Estado:** `NO IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - Existe el archivo `NavigationScreen.tsx`.
- **Funcionalidad Faltante (Qué Falta):**
  - La integración de un componente de mapa (ej. `react-native-maps`).
  - El código para obtener las coordenadas de recolección y entrega del pedido y dibujar la ruta.

### **Funcionalidad: Envío de Ubicación en Tiempo Real (Tracking)**
- **Estado:** `NO IMPLEMENTADO`
- **Implementación Actual (Qué Tienes):**
  - Nada.
- **Funcionalidad Faltante (Qué Falta):**
  - Un servicio en segundo plano que obtenga la geolocalización del dispositivo cada X segundos.
  - El código que escriba esas coordenadas en un documento de Firestore (ej. en `drivers/{driverId}` o en una colección `driver_locations`) para que el portal de negocios pueda consumirlas.

---

## 5. Inventario de Archivos (`src`)

### **Directorio: `src/components`**

#### `components/ui`
- **`SimpleIcon.tsx`**: Componente para renderizar iconos básicos.
- **`MobileShell.tsx`**: Componente estructural para envolver pantallas.
- **`DriverChatWidget.tsx`**: Placeholder para un widget de chat.
- **`OrderStatusTimeline.tsx`**: Placeholder para una línea de tiempo de estado de pedido.
- **`NotificationContainer.tsx`**: Placeholder para un contenedor de notificaciones.

#### `components/map`
- **`TrackingMap.tsx`**: Placeholder para el componente principal del mapa de seguimiento.
- **`MapErrorBoundary.tsx`**: Componente para manejar errores específicos del mapa.

#### `components/chat`
- **Estado:** `Vacío`.

#### `components/modals`
- **`NewOrderModal.tsx`**: Placeholder para el modal que se mostrará al recibir un nuevo pedido.
- **`EmergencyModal.tsx`**: Placeholder para el modal principal de emergencia.
- **`EmergencyOptionsModal.tsx`**: Placeholder para un modal con opciones de emergencia.

#### `components/chatbot`
- **Estado:** `Vacío`.

#### `components/incentives`
- **`IncentivesCard.tsx`**: Placeholder para una tarjeta que muestre información de incentivos.

### **Directorio: `src/hooks`**
- **`useAuth.ts`**: Placeholder para un hook que gestione la lógica de autenticación.
- **`useDriver.ts`**: Placeholder para un hook que obtenga datos del repartidor.
- **`useMockData.ts`**: Hook para generar datos de prueba.
- **`useDriverData.ts`**: Placeholder para un hook que obtenga datos específicos del repartidor.
- **`useOrders.ts.backup`**: Archivo de respaldo, no en uso.
- **`useLocationTracking.ts`**: Placeholder para un hook que gestione el seguimiento de la ubicación.
- **`useLocationPermissions.ts`**: Placeholder para un hook que gestione los permisos de ubicación.

### **Directorio: `src/store`**
- **`index.ts`**: Configuración principal de Redux Toolkit.
- **`store/slices`**:
  - **`authSlice.ts`**: Define el estado de autenticación (usuario, token, etc.).
  - **`driverSlice.ts`**: Define el estado de los datos del repartidor.
  - **`ordersSlice.ts`**: Define el estado de los pedidos.
  - **`walletSlice.ts`**: Define el estado de la billetera.
  - **`notificationsSlice.ts`**: Define el estado de las notificaciones.

### **Directorio: `src/types`**
- **`index.ts`**: Archivo principal para exportar tipos de TypeScript.
- **`react-native-svg.d.ts`**: Definiciones de tipos para la librería `react-native-svg`.
- **`react-native-vector-icons.d.ts`**: Definiciones de tipos para la librería `react-native-vector-icons`.

### **Directorio: `src/utils`**
- **`EventBus.ts`**: Sistema de eventos global para la comunicación entre componentes.

### **Directorio: `src/config`**
- **`env.ts`**: Placeholder para variables de entorno.
- **`keys.ts`**: Placeholder para claves de API.
- **`runtime.ts`**: Placeholder para configuración de tiempo de ejecución.
- **`widgets.ts`**: Placeholder para configuración de widgets.
- **`firebase.ts`**: Configuración principal de Firebase.
- **`constants.js`**: Archivo para constantes globales.

### **Directorio: `src/screens`**
- **`index.ts`**: Archivo para exportar todas las pantallas.
- **`LoginScreen.tsx`**: Pantalla de inicio de sesión.
- **`OrdersScreen.tsx`**: Pantalla de lista de pedidos.
- **`SplashScreen.tsx`**: Pantalla de carga inicial.
- **`WalletScreen.tsx`**: Pantalla de billetera.
- **`MetricsScreen.tsx`**: Pantalla de métricas.
- **`ProfileScreen.tsx`**: Pantalla de perfil.
- **`PaymentsScreen.tsx`**: Pantalla de pagos.
- **`SettingsScreen.tsx`**: Pantalla de configuración.
- **`DashboardScreen.tsx`**: Pantalla principal del repartidor.
- **`DocumentsScreen.tsx`**: Pantalla de gestión de documentos.
- **`EmergencyScreen.tsx`**: Pantalla de emergencia.
- **`IncidentsScreen.tsx`**: Pantalla para reportar incidentes.
- **`NavigationScreen.tsx`**: Pantalla de navegación de pedido.
- **`OnboardingScreen.tsx`**: Pantalla de introducción a la app.
- **`OrderDetailScreen.tsx`**: Pantalla de detalle de un pedido.
- **`OrderRatingScreen.tsx`**: Pantalla para calificar un pedido.
- **`RegistrationScreen.tsx`**: Pantalla de registro.
- **`GPSNavigationScreen.tsx`**: Pantalla de navegación GPS.
- **`NotificationsScreen.tsx`**: Pantalla de notificaciones.
- **`OrdersHistoryScreen.tsx`**: Pantalla de historial de pedidos.
- **`OrderCompletionScreen.tsx`**: Pantalla de finalización de pedido.
- **`PaymentsHistoryScreen.tsx`**: Pantalla de historial de pagos.
- **`CustomerTrackingScreen.tsx`**: Pantalla de seguimiento para el cliente.
- **`DeliveryConfirmationScreen.tsx`**: Pantalla de confirmación de entrega.

### **Directorio: `src/services`**
- **`index.ts`**: Archivo para exportar todos los servicios.
- **`registration.ts`**: Placeholder para el servicio de registro.
- **`geminiService.ts`**: Servicio para interactuar con la API de Gemini.
- **`ordersService.ts`**: Placeholder para el servicio de gestión de pedidos.
- **`WalletService.ts`**: Placeholder para el servicio de billetera.
- **`PayrollService.ts`**: Placeholder para el servicio de nómina.
- **`PricingService.ts`**: Placeholder para el servicio de precios.
- **`LocationService.tsx`**: Placeholder para el servicio de ubicación.
- **`ValidationService.ts`**: Placeholder para el servicio de validación.
- **`NotificationService.ts`**: Placeholder para el servicio de notificaciones.
- **`CloudFunctionsService.ts`**: Placeholder para el servicio de llamadas a Cloud Functions.
- **`OrderAssignmentService.ts`**: Placeholder para el servicio de asignación de pedidos.
- **`IncidentManagementService.ts`**: Placeholder para el servicio de gestión de incidentes.

### **Directorio: `src/navigation`**
- **`AppNavigator.tsx`**: Componente principal de navegación de la aplicación.
- **`NavigationService.ts`**: Servicio para controlar la navegación de forma programática.

---

## 6. Inventario de Archivos de Configuración (Raíz)

- **`package.json`**: Define las dependencias y scripts del proyecto.
- **`babel.config.js`**: Configuración del transpilador Babel.
- **`metro.config.js`**: Configuración del empaquetador Metro.
- **`tsconfig.json`**: Configuración de TypeScript.
- **`android/`**: Directorio del proyecto nativo de Android.
- **`ios/`**: Directorio del proyecto nativo de iOS.

---

## Conclusión del Inventario

La aplicación `BeFast GO` es actualmente un **contenedor**. Tiene la estructura de navegación completa y la configuración de conexión a Firebase lista. Su capacidad más desarrollada es la de **recibir notificaciones push**.

Sin embargo, **carece de toda la lógica de negocio y conexión de datos en las pantallas**. Ninguna pantalla consulta o escribe en la base de datos, ni ejecuta acciones o llama a Cloud Functions. Es un esqueleto funcionalmente pasivo, preparado para ser conectado al ecosistema.
