# **BeFast GO (App Repartidores) \- Arquitectura y Lógica Operativa v1.0**

Fecha: 12 de noviembre de 2025  
Basado en: BeFast Ecosistema \- Documentación Técnica v7.0 \[cite: BeFast (1).md\]  
Propósito: Servir como la documentación técnica, arquitectónica y de flujos única y definitiva para el desarrollo de la aplicación móvil BeFast GO.

## **📋 ÍNDICE**

### **PARTE 1: ARQUITECTURA Y ESTRUCTURA**

1. [Resumen Ejecutivo y Filosofía](https://www.google.com/search?q=%23resumen-ejecutivo)
2. [Arquitectura de Software (La Vía Correcta)](https://www.google.com/search?q=%23arquitectura-de-software)
3. [Estructura de Carpetas Recomendada](https://www.google.com/search?q=%23estructura-de-carpetas)

### **PARTE 2: PANTALLAS Y FLUJOS DE USUARIO**

4. [Flujo de Autenticación (Login / Registro)](https://www.google.com/search?q=%23flujo-de-autenticacion)
    * [Página 1: Login (LoginScreen)](https://www.google.com/search?q=%23pagina-1-loginscreen)
    * [Página 2: Registro (RegistrationScreen \- 5 Pasos)](https://www.google.com/search?q=%23pagina-2-registrationscreen)
5. [Flujo de Operación Principal (Pestañas)](https://www.google.com/search?q=%23flujo-de-operacion)
    * [Página 3: Dashboard (DashboardScreen)](https://www.google.com/search?q=%23pagina-3-dashboardscreen)
    * [Página 4: Órdenes (OrdersScreen)](https://www.google.com/search?q=%23pagina-4-ordersscreen)
    * [Página 5: Billetera (WalletScreen)](https://www.google.com/search?q=%23pagina-5-billetera)
    * [Página 6: Navegación (NavigationScreen)](https://www.google.com/search?q=%23pagina-6-navegacion)
    * [Página 7: Perfil (ProfileScreen)](https://www.google.com/search?q=%23pagina-7-perfil)
6. [Flujo de Pedido Activo (Crítico)](https://www.google.com/search?q=%23flujo-de-pedido-activo)
    * [Componente 1: Modal de Nueva Orden (NewOrderModal)](https://www.google.com/search?q=%23componente-1-newordermodal)
    * [Página 8: Detalles del Pedido (OrderDetailScreen)](https://www.google.com/search?q=%23pagina-8-orderdetailscreen)
    * [Página 9: Confirmación de Entrega (DeliveryConfirmationScreen)](https://www.google.com/search?q=%23pagina-9-deliveryconfirmationscreen)
7. [Componentes Globales y de Soporte](https://www.google.com/search?q=%23componentes-globales)
    * [Componente 2: Botones Flotantes (Emergencia / Chatbot)](https://www.google.com/search?q=%23componente-2-floatingbuttons)
    * [Página 10: Chat (ChatScreen con IA)](https://www.google.com/search?q=%23pagina-10-chatscreen)
    * [Página 11: Emergencia (EmergencyScreen)](https://www.google.com/search?q=%23pagina-11-emergencyscreen)

### **PARTE 3: MATRIZ DE CONECTIVIDAD (LÓGICA Y DATOS)**

8. [Matriz de Flujo de Datos (UI \-\> Backend)](https://www.google.com/search?q=%23matriz-de-flujo)
9. [Arquitectura del Estado Global (Redux)](https://www.google.com/search?q=%23arquitectura-de-estado)
10. [Checklist de Dependencias del Backend](https://www.google.com/search?q=%23dependencias-backend)

## **PARTE 1: ARQUITECTURA Y ESTRUCTURA**

### **1\. Resumen Ejecutivo y Filosofía**

BeFast GO es la herramienta de trabajo principal del repartidor. NO es el "cerebro" del sistema. El cerebro es el conjunto de Cloud Functions del Ecosistema \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/index.ts\].

La filosofía de esta app es ser un cliente "ligero" que:

1. **Muestra Datos:** Lee el estado de la base de datos (vía Redux) que el backend calcula.
2. **Dispara Acciones:** Llama a Cloud Functions para iniciar flujos de negocio (aceptar pedido, completar entrega, etc.).
3. **NO CALCULA NADA:** La app móvil NUNCA debe calcular la deuda, ni el saldo, ni validar un pedido. Solo dispara la función que lo hace y espera el resultado.

### **2\. Arquitectura de Software (La Vía Correcta)**

El problema central de la app repas-go es que tiene dos arquitecturas en conflicto:

* **Arquitectura Rota (Context):** El archivo App.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/App.tsx\] usa React Context (AuthProvider) y un navegador (AppRoutes) que solo define 5 pantallas. Esta arquitectura está **DESALINEADA** con el Ecosistema.
* **Arquitectura Correcta (Redux):** Los archivos src/store \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/store/index.ts\] y src/navigation/AppNavigator.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/navigation/AppNavigator.tsx\] definen un flujo completo basado en Redux que SÍ importa todas las pantallas (Chat, Emergencia, etc.).

**El camino correcto es ALINEAR la app móvil con la app web (Ecosistema):**

1. **Eliminar** la lógica de Context y AppRoutes de App.tsx.
2. El App.tsx (móvil) **debe** cargar el Provider de Redux (react-redux) y renderizar el AppNavigator \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/navigation/AppNavigator.tsx\].
3. Toda la información del repartidor (driver, walletBalance, pendingDebts) y pedidos (orders) se consume en las pantallas usando el hook useSelector de Redux.
4. El estado de Redux se mantiene sincronizado en tiempo real con Firestore (usando listeners de Firebase dentro de los *slices* o *thunks* de Redux).

### **3\. Estructura de Carpetas Recomendada**

src/  
├── assets/         \# Imágenes y fuentes  
├── components/  
│   ├── ui/         \# Botones, Cards, Inputs (componentes tontos)  
│   ├── shared/     \# Componentes con lógica de negocio (ej. KpiCard, OrderListItem)  
│   └── modals/     \# Modales (NewOrderModal, EmergencyOptionsModal)  
├── config/  
│   └── firebase.ts \# Configuración de @react-native-firebase (¡la tienes bien\!) \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/config/firebase.ts\]  
├── navigation/  
│   ├── AppNavigator.tsx      \# Lógica principal (Auth vs Main vs Pedido Activo) \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/navigation/AppNavigator.tsx\]  
│   ├── AuthNavigator.tsx     \# Stack de Login y Registro  
│   ├── MainTabNavigator.tsx  \# Las 5 pestañas principales  
│   └── types.ts            \# RootStackParamList  
├── screens/  
│   ├── Auth/               \# Pantallas de Login y Registro  
│   ├── Main/               \# Las 5 pantallas de pestañas (Dashboard, Orders, etc.)  
│   ├── OrderFlow/          \# Pantallas de un pedido activo (Detail, Confirm, Rating)  
│   └── Support/            \# Chat, Emergencia, Incidentes  
├── services/  
│   ├── DriverService.ts    \# Lógica para llamar a Cloud Functions (ej. updateDriverStatus)  
│   └── OrderService.ts     \# Lógica para llamar a Cloud Functions (ej. validateOrderAssignment)  
├── store/  
│   ├── index.ts            \# Tu store de Redux \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/store/index.ts\]  
│   └── slices/  
│       ├── authSlice.ts    \# Maneja estado de 'driver' (login, perfil, estatus) \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/store/slices/authSlice.ts\]  
│       └── ordersSlice.ts  \# Maneja 'activeOrder', 'unacceptedOrders', 'orderHistory' \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/store/slices/ordersSlice.ts\]  
└── types/  
└── index.ts          \# Tipos globales (Driver, Order, etc. de 'ecosistema') \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/shared/types.ts\]

## **PARTE 2: PANTALLAS Y FLUJOS DE USUARIO**

### **Flujo de Autenticación**

#### **Página 1: Login (LoginScreen)**

* **Archivo:** src/screens/Auth/LoginScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/LoginScreen.tsx\]
* **Componentes:**
    * Image (Logo de BeFast Repartidores).
    * TextInput (Email).
    * TextInput (Contraseña).
    * Button (Principal): "Iniciar Sesión".
    * Button (Secundario): "Crear una cuenta".
    * Button (Link): "¿Olvidaste tu contraseña?".
* **Lógica de Conexión:**
    1. **"Iniciar Sesión"** \-\> dispatch(loginUser(email, password)) (acción de authSlice).
    2. loginUser (Thunk) llama a firebase.auth().signIn....
    3. Al éxito, obtiene el uid y consulta db.collection('drivers').doc(uid).
    4. Guarda el perfil completo del repartidor en el estado de Redux (state.auth.driver).
    5. El AppNavigator detecta state.auth.isAuthenticated \=== true y navega a "Main".
    6. **"Crear Cuenta"** \-\> navigation.navigate('Registration').

#### **Página 2: Registro (RegistrationScreen)**

* **Archivo:** src/screens/Auth/RegistrationScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/RegistrationScreen.tsx\]
* **Componentes:**
    * **Paso 1 (Datos):** TextInput (Nombre, RFC, CURP, Vehículo, CLABE) \[cite: FLUJOS\_Y\_LOGICA\_BEFAST.md\].
    * **Paso 2 (Documentos):** DocumentUpload (INE, Fiscal, Licencia, T. Circulación) \[cite: FLUJOS\_Y\_LOGICA\_BEFAST.md\].
    * **Paso 3 (Legal):** MarkdownViewer (para politica\_algoritmica.md y modelo\_de\_contrato.md \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/public/politica\_algoritmica.md, edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/public/modelo\_de\_contrato.md\]), Checkbox ("Acepto").
    * **Paso 4 (Capacitación):** VideoPlayer, QuizForm, PhotoUpload (Mochila) \[cite: FLUJOS\_Y\_LOGICA\_BEFAST.md\].
    * **Paso 5 (Revisión):** Resumen de datos y Button ("Enviar Solicitud") \[cite: FLUJOS\_Y\_LOGICA\_BEFAST.md\].
* **Lógica de Conexión:**
    1. **"Enviar Solicitud"** \-\> Llama a dispatch(submitApplication(formData)).
    2. submitApplication (Thunk) sube los archivos a Storage y llama a la Cloud Function **submitDriverApplication** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/drivers/submitDriverApplication.ts\] con todos los datos.
    3. **Lógica de IA (Backend):** La Cloud Function submitDriverApplication dispara (o llama directamente) a **documentValidator** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/documentValidator.ts\].
    4. Vertex AI procesa los documentos (INE, SAT) y guarda los resultados (ej. ocrValidation: { rfcMatch: true }) en la solicitud para que el Admin la revise.
    5. La app navega a "Solicitud Recibida".

### **Flujo de Operación Principal**

#### **Página 3: Dashboard (DashboardScreen)**

* **Archivo:** src/screens/Main/DashboardScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/DashboardScreen.tsx\]
* **Componentes:**
    * **DriverStatusToggle**: Un Switch grande ("Desconectado" / "En Línea").
    * **WidgetWallet (Acceso Directo)**:
        * Título: "Billetera".
        * Contenido: Muestra driver.walletBalance y driver.pendingDebts.
        * Acción: navigation.navigate('Wallet').
    * **WidgetTodayOrders (Acceso Directo)**:
        * Título: "Pedidos del Día".
        * Contenido: Muestra driver.kpis.todayCompletedOrders (ej. "5").
        * Acción: navigation.navigate('Orders').
    * **DriverStatusModule**:
        * Si driver.status \=== 'ACTIVE': Muestra ActivityIndicator (lupa girando) y texto "Buscando pedidos...".
        * Si driver.status \=== 'INACTIVE': Muestra ícono de "pausa" y texto "Desconectado".
    * **KpiGrid (Métricas)**:
        * StatCard ("Aceptación"): Muestra driver.kpis.acceptanceRate (ej. "95%").
        * StatCard ("Calificación"): Muestra driver.kpis.rating (ej. "4.8" \+ Estrellas).
        * StatCard ("Tiempo Promedio"): Muestra driver.kpis.avgDeliveryTime (ej. "25 min").
* **Lógica de Conexión:**
    1. **Carga de Datos:** const driver \= useSelector((state: RootState) \=\> state.auth.driver). Lee todo de Redux.
    2. **Toggle de Estatus:** Al cambiar el Switch, llama a dispatch(updateDriverStatus(newStatus)).
    3. updateDriverStatus (Thunk) llama a la Cloud Function **updateDriverStatus** \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/config/firebase.ts\] (que actualiza Firestore y Shipday).
    4. El *listener* de Redux detecta el cambio en driver.status y la UI del DriverStatusModule se actualiza sola.

#### **Página 4: Órdenes (OrdersScreen)**

* **Archivo:** src/screens/Main/OrdersScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/OrdersScreen.tsx\]
* **Componentes:**
    * **Tabs**: Pestaña "Nuevas y Activas" y Pestaña "Historial".
    * **View (Nuevas y Activas)**:
        * **UnacceptedOrderList**: Mapea state.orders.unacceptedOrders.
            * NewOrderCard: Muestra Tienda, Destino, Ganancia y un **Timer de 1 minuto**.
            * Button ("Aceptar") y Button ("Rechazar").
        * **ActiveOrderList**: Mapea state.orders.activeOrders.
            * OrderListItem: Muestra status: 'ASSIGNED' o 'IN\_TRANSIT'.
            * Acción: navigation.navigate('OrderDetail', { orderId: order.id }).
    * **View (Historial)**:
        * **OrderHistoryList**: Mapea state.orders.orderHistory.
        * OrderListItem: Muestra status: 'COMPLETED' y el monto.
        * Acción: navigation.navigate('OrderHistoryDetail', { orderId: order.id }).
* **Lógica de Conexión:**
    1. **Carga de Datos:** const { unacceptedOrders, activeOrders, orderHistory } \= useSelector((state: RootState) \=\> state.orders).
    2. ordersSlice \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/store/slices/ordersSlice.ts\] escucha en tiempo real la colección ORDERS (filtrada por driverId) y clasifica los pedidos en esas 3 listas.
    3. **Lógica de Aceptar Pedido (IA)**:
        * Al presionar "Aceptar", llama a dispatch(acceptOrder(orderId)).
        * acceptOrder (Thunk) llama a la Cloud Function **validateOrderAssignment** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/orders/validateOrderAssignment.ts\].
        * El backend valida el **IDSE** \[cite: BeFast (1).md\], la **Deuda** \[cite: FLUJOS\_Y\_LOGICA\_BEFAST.md\] y llama a **Vertex AI (orderValidationEnhanced)** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/orderValidationEnhanced.ts\] para aprobar.
        * Si se aprueba, el *listener* de Redux mueve el pedido de unacceptedOrders a activeOrders.

#### **Página 5: Billetera (WalletScreen)**

* **Archivo:** src/screens/Main/WalletScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/WalletScreen.tsx\] (o PaymentsScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/PaymentsScreen.tsx\])
* **Componentes:**
    * **WalletBalanceCard**: Muestra driver.walletBalance (Saldo a favor) y driver.pendingDebts (Deuda).
    * **PeriodSummary (Módulos de Resumen)**:
        * "Pedidos del Día": driver.kpis.todayOrders (Cantidad) y driver.kpis.todayTotal (Dinero).
        * "Pedidos del Mes": driver.kpis.monthOrders (Cantidad) y driver.kpis.monthTotal (Dinero).
    * **IncomeBreakdown (Desglose de Ingresos)**:
        * "Pedidos con Tarjeta": Suma de walletTransactions tipo CARD\_ORDER\_TRANSFER.
        * "Pedidos en Efectivo": Suma de walletTransactions tipo CASH\_ORDER\_ADEUDO.
    * **EarningsBreakdown (Desglose de Ganancias)**:
        * "Propinas": Suma de walletTransactions tipo TIP\_CARD\_TRANSFER.
        * "Incentivos": Suma de walletTransactions tipo INCENTIVE.
        * "Deducciones": Suma de walletTransactions tipo DEDUCTION.
    * **TransactionHistoryList (Historial de Movimientos)**:
        * Lista (FlatList) de la subcolección walletTransactions.
        * Muestra items como "Completaste Pedido \#123", "Retiro de Nómina", "Pago de Deuda".
* **Lógica de Conexión:**
    1. Los saldos y KPIs principales vienen de useSelector((state: RootState) \=\> state.auth.driver).
    2. La lista de "Historial de Movimientos" es el único componente que hace su propia consulta de Firestore, suscribiéndose en tiempo real a db.collection('drivers').doc(uid).collection('walletTransactions').

#### **Página 6: Navegación (NavigationScreen)**

* **Archivo:** src/screens/Main/NavigationScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/NavigationScreen.tsx, NavigationScreen.tsx\]
* **Componentes:**
    * **MapView (Pantalla Completa)**:
        * **HeatmapLayer**: Se muestra si state.orders.activeOrder \=== null.
        * **OrderTrackingLayer**: Se muestra si state.orders.activeOrder \!== null.
        * **Button ("Centrar")**: Centra el mapa en la ubicación del repartidor.
* **Lógica de Conexión:**
    1. Usa useSelector para verificar si hay un pedido activo.
    2. Si **NO hay pedido activo**: Muestra el mapa de calor (datos de system/heatmap).
    3. Si **HAY pedido activo**: Se convierte en el mapa de tracking en vivo (Página 8).
    4. **Lógica de IA (Backend):** Cuando se completan pedidos, la Cloud Function **routeDataCollector** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/routeDataCollector.ts\] (Vertex AI) analiza las rutas y actualiza los datos del mapa de calor, asegurando que el mapa de demanda esté siempre actualizado.

#### **Página 7: Perfil (ProfileScreen)**

* **Archivo:** src/screens/Main/ProfileScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/ProfileScreen.tsx\]
* **Componentes:**
    * Avatar y Nombre del repartidor.
    * Button \-\> "Mis Documentos" (Navega a DocumentsScreen \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/navigation/AppNavigator.tsx\]).
    * Button \-\> "Configuración" (Navega a SettingsScreen \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/navigation/AppNavigator.tsx\]).
    * Switch ("Activar Notificaciones Push").
    * Button ("Cerrar Sesión").
* **Lógica de Conexión:**
    1. **Carga de Datos:** useSelector((state: RootState) \=\> state.auth.driver).
    2. **Cerrar Sesión:** onPress \-\> dispatch(logoutUser()).

### **Flujo de Pedido Activo (Crítico)**

#### **Componente 1: Modal de Nueva Orden (NewOrderModal)**

* **Archivo:** src/components/modals/NewOrderModal.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/components/modals/NewOrderModal.tsx\]
* **Componentes:**
    * Text ("¡Nuevo Pedido\!").
    * Text ("Tienda: {order.storeName}").
    * Text ("Destino: {order.customerAddress}").
    * Text ("Ganancia: ${order.estimatedEarnings}").
    * Timer (60 segundos).
    * Button ("Aceptar") y Button ("Rechazar").
* **Lógica de Conexión:**
    1. Se activa por una notificación push que actualiza state.orders.newOrderToShow en Redux.
    2. **"Aceptar"** \-\> Llama a dispatch(acceptOrder(orderId)).
    3. acceptOrder (Thunk) llama a **validateOrderAssignment** (Cloud Function).
    4. El backend valida **IDSE, Deuda y Vertex AI** \[cite: BeFast (1).md, FLUJOS\_Y\_LOGICA\_BEFAST.md, edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/orderValidationEnhanced.ts\].
    5. Si es "APROBADO", el modal se cierra y la app navega a OrderDetailScreen.

#### **Página 8: Detalles del Pedido (OrderDetailScreen)**

* **Archivo:** src/screens/OrderFlow/OrderDetailScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/OrderDetailScreen.tsx\]
* **Componentes:**
    * MapView (Mapa de Tracking en vivo).
    * OrderStatusTimeline \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/components/ui/OrderStatusTimeline.tsx\] (Muestra "ASIGNADO", "EN TIENDA", "EN CAMINO").
    * AddressCard ("Recolectar en: {store.address}").
    * AddressCard ("Entregar a: {customer.address}").
    * CustomerInfo (Botones para Llamar o Chatear con el cliente).
    * Button (Principal de Acción): El texto cambia según el estado:
        * "Llegué a la tienda"
        * "Pedido Recolectado"
        * "Llegué al destino"
        * "Confirmar Entrega" (Este último navega a DeliveryConfirmationScreen).
* **Lógica de Conexión:**
    1. useSelector para obtener el activeOrder de state.orders.
    2. Los botones de acción (Llegué a la tienda, etc.) llaman a dispatch(updateOrderStatus(orderId, newStatus)).
    3. updateOrderStatus (Thunk) llama a la Cloud Function **handleOrderWorkflow** \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/config/firebase.ts\] para actualizar el estado en Shipday y Firestore.

#### **Página 9: Confirmación de Entrega (DeliveryConfirmationScreen)**

* **Archivo:** src/screens/OrderFlow/DeliveryConfirmationScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/DeliveryConfirmationScreen.tsx\]
* **Componentes:**
    * Text ("Monto a Cobrar: ${order.amountToCollect}") (Solo si es CASH).
    * CameraComponent (para tomar foto de evidencia).
    * SignaturePad (para capturar firma).
    * TextInput (para código de confirmación).
    * Button ("Completar Entrega").
* **Lógica de Conexión:**
    1. **"Completar Entrega"** \-\> Sube la foto/firma a Storage y llama a dispatch(completeOrder(orderId, proofUrl)).
    2. completeOrder (Thunk) llama a la Cloud Function **processOrderCompletion** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/orders/processOrderCompletion.ts\].
    3. **Lógica de IA y Cálculos (Backend):** Esta es la función más importante.
        * Llama al **financialAuditor (Vertex AI)** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/financialAuditor.ts\] para auditar la transacción.
        * Llama a **manageFinancialOperationsConsolidated** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/financial/manageFinancialOperationsConsolidated.ts\] para **actualizar walletBalance o pendingDebts** \[cite: FLUJOS\_Y\_LOGICA\_BEFAST.md\].
        * Llama a **routeDataCollector (Vertex AI)** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/routeDataCollector.ts\] para entrenar el modelo de mapas de calor.
    4. La app navega a OrderRatingScreen \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/navigation/AppNavigator.tsx\].

### **Componentes Globales (IA y Soporte)**

#### **Componente 2: Botones Flotantes (FloatingButtons)**

* **Archivo:** src/components/ui/FloatingButtons.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/components/ui/FloatingButtons.tsx\]
* **Componentes:**
    * Button (Icono SOS/Emergencia).
    * Button (Icono Chatbot).
* **Lógica de Conexión:**
    * **SOS** \-\> navigation.navigate('Emergency').
    * **Chatbot** \-\> navigation.navigate('Chat').

#### **Página 10: Chat (ChatScreen con IA)**

* **Archivo:** src/screens/Support/ChatScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/ChatScreen.tsx\]
* **Componentes:**
    * MessageList (Muestra el historial de chat).
    * ChatInput (Campo de texto y botón de enviar).
* **Lógica de Conexión:**
    1. **"Enviar"** \-\> Llama a la Cloud Function **chatbotHandler** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/chatbotHandler.ts\] (o a geminiService.ts \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/services/geminiService.ts\] si es directo).
    2. **Lógica de IA (Backend):** chatbotHandler recibe el historial de chat y el driver.uid.
    3. Llama a Vertex AI (Gemini) con un *prompt* que incluye el contexto del repartidor (ej. "Eres un asistente de soporte. El repartidor {driver.fullName} pregunta: ...").
    4. Devuelve la respuesta generada por IA a la app para ser mostrada.

#### **Página 11: Emergencia (EmergencyScreen)**

* **Archivo:** src/screens/Support/EmergencyScreen.tsx \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/screens/EmergencyScreen.tsx\]
* **Componentes:**
    * Button ("Llamar a Emergencias 911").
    * Button ("Contactar Soporte BeFast").
    * Button ("Reportar Incidente") \-\> Navega a IncidentsScreen \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/navigation/AppNavigator.tsx\].
* **Lógica de Conexión:**
    * Usa la API de Linking de React Native para iniciar llamadas telefónicas.

## **PARTE 3: MATRIZ DE CONECTIVIDAD (LÓGICA Y DATOS)**

### **8\. Matriz de Flujo de Datos (UI \-\> Backend)**

| Pantalla/Componente (App Móvil) | Acción de Usuario | Lógica de UI (App Móvil) | Cloud Function "Cerebro" (Backend) \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/index.ts\] | Lógica de Backend (Cálculos/IA) |
| :---- | :---- | :---- | :---- | :---- |
| RegistrationScreen | "Enviar Solicitud" | Sube archivos a Storage, llama a dispatch(submitApplication(...)) | **submitDriverApplication** | Llama a **documentValidator (Vertex AI)** para OCR y validación de documentos. |
| LoginScreen | "Iniciar Sesión" | dispatch(loginUser(...)) | (N/A \- Usa Firebase Auth) | 1\. Firebase Auth valida. 2\. authSlice (app) lee el perfil de drivers/{uid}. |
| DashboardScreen | Cambia Switch "En Línea" | dispatch(updateDriverStatus(...)) | **updateDriverStatus** | Actualiza driver.status en Firestore y sincroniza con Shipday. |
| NewOrderModal / OrdersScreen | "Aceptar Pedido" | Llama a dispatch(acceptOrder(...)) | **validateOrderAssignment** | 1\. **Valida IDSE** (Crítico) \[cite: BeFast (1).md\]. 2\. **Valida Deuda** (si es efectivo) \[cite: FLUJOS\_Y\_LOGICA\_BEFAST.md\]. 3\. **Valida IA (orderValidationEnhanced)** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/orderValidationEnhanced.ts\]. |
| OrderDetailScreen | "Llegué a la Tienda" | dispatch(updateOrderStatus(...)) | **handleOrderWorkflow** | Actualiza el status del pedido en Firestore y Shipday. |
| DeliveryConfirmationScreen | "Completar Entrega" | Sube prueba, llama a dispatch(completeOrder(...)) | **processOrderCompletion** | 1\. Llama a **financialAuditor (Vertex AI)** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/financialAuditor.ts\]. 2\. Llama a manageFinancialOperations... para **calcular walletBalance / pendingDebts** \[cite: FLUJOS\_Y\_LOGICA\_BEFAST.md\]. 3\. Llama a **routeDataCollector (Vertex AI)** \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/routeDataCollector.ts\]. |
| ChatScreen | "Enviar Mensaje" | Llama a dispatch(sendChatMessage(...)) | **chatbotHandler** | Llama a **Vertex AI (Gemini)** con el contexto del repartidor para generar una respuesta de soporte. |

### **9\. Arquitectura del Estado Global (Redux)**

La app móvil **debe** tener estos *slices* para funcionar:

* **authSlice.ts** \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/store/slices/authSlice.ts\]:
    * **Estado:** driver: Driver | null, isAuthenticated: boolean, isLoading: boolean.
    * **Responsabilidad:** Contiene el perfil completo del repartidor (drivers/{uid}), incluyendo walletBalance, pendingDebts, status, y kpis. Se actualiza en tiempo real con un *listener* de Firestore que se activa después del login.
* **ordersSlice.ts** \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/store/slices/ordersSlice.ts\]:
    * **Estado:** activeOrder: Order | null, unacceptedOrders: Order\[\], orderHistory: Order\[\], isLoading: boolean.
    * **Responsabilidad:** Escucha la colección ORDERS (filtrada por driverId) y clasifica los pedidos en las listas correctas para que OrdersScreen las muestre.
* **notificationsSlice.ts** \[cite: edgar-14/repas-go/repas-go-f837a2a4d584d9c1732f984180c60a0022907f46/src/store/slices/notificationsSlice.ts\]:
    * **Estado:** newOrderToShow: Order | null, globalMessage: string | null.
    * **Responsabilidad:** Recibe eventos de NotificationHandler (notificaciones push) y actualiza su estado. El NewOrderModal se muestra cuando newOrderToShow no es nulo.

### **10\. Checklist de Dependencias del Backend**

Para que BeFast GO funcione, las siguientes Cloud Functions del Ecosistema **deben estar desplegadas y ser accesibles**:

* submitDriverApplication \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/drivers/submitDriverApplication.ts\] (y sus funciones de IA asociadas \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/documentValidator.ts\]).
* updateDriverStatus \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/drivers/updateDriverStatus.ts\]
* validateOrderAssignment \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/orders/validateOrderAssignment.ts\] (y su IA \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/orderValidationEnhanced.ts\]).
* handleOrderWorkflow \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/orders/handleOrderWorkflow.ts\]
* processOrderCompletion \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/orders/processOrderCompletion.ts\] (y sus funciones de IA \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/financialAuditor.ts, edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/routeDataCollector.ts\]).
* manageFinancialOperationsConsolidated \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/financial/manageFinancialOperationsConsolidated.ts\]
* chatbotHandler (Vertex AI) \[cite: edgar-14/ecosistema/Edgar-14-Ecosistema-b85348b94b2207c69bdb27e94ab2a025ff040114/functions/src/vertex-ai/chatbotHandler.ts\]