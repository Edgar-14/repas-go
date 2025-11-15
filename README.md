# BeFast GO - Driver Mobile App

Aplicación móvil nativa para conductores de BeFast, desarrollada en React Native. **BeFast GO está diseñado para reemplazar gradualmente a Shipday** como el motor principal de entregas, integrándose directamente con el ecosistema BeFast existente.

## ¿Qué hago ahora?

- Ejecuta un solo comando en Windows para ver la app YA en Android (emulador o dispositivo):
  
  npm run ya

- Si prefieres, también puedes usar: `npm run android` (emulador) o `npm run android:device` (dispositivo físico con USB debug).

## 🚀 Características Principales

- **Gestión de Pedidos en Tiempo Real**: Acepta y gestiona pedidos conectándose directamente al ecosistema BeFast
- **Navegación GPS con Google Navigation SDK**: Navegación turn-by-turn integrada con etapas (pickup → delivery)
- **Tracking en Tiempo Real**: Ubicación del conductor publicada a Firestore y visible en página pública
- **Billetera Digital**: Seguimiento de ganancias y gestión de pagos integrado con el sistema de nómina
- **Cumplimiento IMSS**: Validación automática de requisitos laborales mexicanos
- **WhatsApp Tracking**: Enlaces de tracking automáticos enviados a clientes
- **Página de Tracking Público**: Los clientes pueden ver su pedido en tiempo real en `befastapp.com/track/[orderId]`

## 🛠️ Tecnologías

- **React Native** 0.82.1 - Framework móvil multiplataforma
- **TypeScript** 5.8.3 - Tipado estático para JavaScript
- **Redux Toolkit** 2.10.1 - Gestión de estado global
- **Firebase Suite** - Backend completo integrado con el ecosistema BeFast
  - Authentication - Autenticación de conductores
  - Firestore - Base de datos en tiempo real
  - Cloud Functions - Lógica del lado del servidor
  - Cloud Messaging - Notificaciones push
  - Storage - Almacenamiento de documentos
- **React Navigation** 7.x - Navegación de la aplicación
- **Google Navigation SDK** (Beta) - Navegación turn-by-turn nativa
- **Google Maps** - Mapas y geolocalización
- **Socket.io** - Comunicación en tiempo real

## 📱 Instalación

### Prerrequisitos
- Node.js >= 20
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS)

### Configuración
```bash
# Instalar dependencias
npm install

# iOS - Instalar CocoaPods
cd ios && bundle install && bundle exec pod install

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   ├── map/              # Componentes de mapa (TrackingMap, MapErrorBoundary)
│   ├── modals/           # Modales (NewOrder, Emergency)
│   └── ui/               # Componentes UI reutilizables
├── config/               # Configuración de Firebase y claves
├── hooks/                # Custom hooks
│   ├── useDriverLocation.ts      # Tracking GPS y publicación a Firestore
│   ├── useOrderDispatch.ts       # Suscripción a pedidos
│   ├── useGuidedRoute.ts         # Navegación multi-etapa
│   └── ...
├── navigation/           # Navegación de la app
├── providers/            
│   └── NavigationProvider.tsx    # Contexto para Navigation SDK
├── screens/              # Pantallas de la aplicación
│   ├── NavigationScreen.tsx      # Navegación activa
│   ├── OrdersScreen.tsx          # Lista de pedidos
│   ├── DashboardScreen.tsx       # Dashboard del conductor
│   └── ...
├── services/             # Servicios (Orders, Location, Wallet, etc.)
├── store/                # Estado global con Redux
└── types/                # Definiciones de TypeScript

public/
└── track/                # Página de tracking público para clientes
    ├── index.html        # Página HTML principal
    ├── styles.css        # Estilos responsive
    ├── tracking.js       # Lógica de tracking en tiempo real
    └── README.md         # Guía de deployment
```

## 🔗 Integración con Ecosistema BeFast

BeFast GO se integra directamente con el ecosistema BeFast existente:

### Conexión al Backend
- **Firestore Collections**: Usa las 40+ colecciones existentes (`orders`, `drivers`, `walletTransactions`, etc.)
- **Cloud Functions**: Se conecta a las 69 funciones del ecosistema (no crea nuevas)
- **Proyecto Firebase**: Comparte `befast-hfkbl` con el portal web

### Flujo de Pedidos
1. **Negocio crea pedido** en portal Delivery → Cloud Function `createOrder`
2. **BeFast GO escucha** pedidos en Firestore collection `orders` con status `SEARCHING`
3. **Conductor acepta** → Status cambia a `ACCEPTED` → Cloud Function `validateOrderAssignment` valida automáticamente
4. **Navegación activa** → `useGuidedRoute` actualiza status (`STARTED` → `PICKED_UP` → `IN_TRANSIT` → `ARRIVED`)
5. **Cliente rastrea** → Página pública en `befastapp.com/track/[orderId]` muestra ubicación en tiempo real
6. **Conductor completa** → Cloud Function `processOrderCompletion` actualiza billetera y registra transacción

### WhatsApp Integration
- Usa la función existente `sendWhatsAppConfirmation` del ecosistema
- Envía automáticamente tracking links a clientes
- Formato: `https://befastapp.com/track/[orderId]`

### Reemplazo de Shipday
BeFast GO está diseñado para reemplazar gradualmente a Shipday:
- ✅ Dispatch directo desde el ecosistema BeFast
- ✅ Sin dependencia de APIs externas de terceros
- ✅ Control total sobre la experiencia del conductor
- ✅ Tracking nativo sin intermediarios
- ✅ Integración completa con sistema de nómina e IMSS

## 🔧 Scripts Disponibles

- `npm start` - Inicia Metro bundler
- `npm run android` - Ejecuta en Android
- `npm run ios` - Ejecuta en iOS
- `npm run lint` - Ejecuta ESLint
- `npm test` - Ejecuta tests
- `npm run ya` - Ejecución rápida en Windows (Android)

## 🔑 Configuración de API Keys

### Google Cloud Console
Se requieren las siguientes API keys configuradas en Google Cloud Platform:

**Para Android:**
- Navigation SDK for Android (Beta)
- Maps SDK for Android
- Routes API (Compute Routes)
- Places API
- Directions API (fallback)

**Para iOS:**
- Navigation SDK for iOS (Beta)
- Maps SDK for iOS
- Routes API (Compute Routes)
- Places API
- Directions API (fallback)

**Para Tracking Web:**
- Maps JavaScript API
- Directions API

### Archivos de Configuración
- `android/gradle.properties` - Configurar `MAPS_API_KEY`
- `ios/BeFastGO/AppDelegate.swift` - Configurar API key en línea 20
- `public/track/index.html` - Configurar API key para tracking público
- Ver `ENVIRONMENT_VARIABLES.md` para detalles completos

## 📦 Dependencias Clave

### Navegación y Mapas
- `@googlemaps/react-native-navigation-sdk` ^0.11.0 - SDK oficial de navegación
- `react-native-maps` ^1.26.0 - Componentes de mapa
- `react-native-maps-directions` ^1.9.0 - Cálculo de rutas
- `@react-native-community/geolocation` ^3.4.0 - Geolocalización

### Firebase
- `@react-native-firebase/app` ^23.5.0
- `@react-native-firebase/auth` ^23.5.0
- `@react-native-firebase/firestore` ^23.5.0
- `@react-native-firebase/functions` ^23.5.0
- `@react-native-firebase/messaging` ^23.5.0
- `@react-native-firebase/storage` ^23.5.0

### Comunicación
- `socket.io-client` ^4.8.1 - WebSocket para tracking en tiempo real
- `react-native-permissions` ^5.4.4 - Gestión de permisos

## 📄 Licencia

Este proyecto es privado y confidencial.

## 🚀 Ejecución rápida en Windows (Android)

Para ver la app YA en Android sin pasos manuales:

- Emulador Android (AVD):
  1) Abre un emulador desde Android Studio.
  2) En la raíz del proyecto, ejecuta:
     
     npm run android:oneclick

- Dispositivo físico (USB):
  1) Activa Depuración USB y conecta tu teléfono. Acepta la huella RSA.
  2) En la raíz del proyecto, ejecuta:
     
     npm run android:oneclick:device

Esto abrirá Metro en otra ventana y compilará/instalará la app automáticamente. Si Metro ya está abierto, no hay problema.

Notas:
- Si aparece algún error de ADB, asegúrate de tener Android Platform Tools en el PATH y el dispositivo visible con `adb devices`.
- La clave de Google Maps (MAPS_API_KEY) ya está configurada en android/gradle.properties para desarrollo local.

## 🌐 Deployment de Tracking Público

La página de tracking para clientes se despliega en Firebase Hosting:

```bash
# Configurar Firebase CLI
npm install -g firebase-tools
firebase login

# Desplegar página de tracking
firebase deploy --only hosting

# Acceder en:
https://befast-hfkbl.web.app/track/[orderId]
```

Ver `public/track/README.md` para instrucciones detalladas de deployment.

## 📚 Documentación Adicional

- `ENVIRONMENT_VARIABLES.md` - Variables de entorno y API keys requeridas
- `SETUP_MAPS.md` - Guía de configuración de Google Maps
- `public/track/README.md` - Deployment de página de tracking
- `inventario_befast_go.md` - Inventario técnico de la app
- `inventario ecosistema befast.md` - Inventario del backend (69 Cloud Functions)

## 🎯 Estado del Proyecto

### ✅ Completado
- [x] Configuración base de React Native y Firebase
- [x] Integración con Firestore del ecosistema
- [x] Instalación de Navigation SDK (Android/iOS)
- [x] Custom hooks para tracking y dispatch
- [x] Página de tracking público en tiempo real
- [x] Conexión a Cloud Functions existentes
- [x] Integración con sistema de WhatsApp

### ⏳ En Progreso
- [ ] Componentes UI de navegación (NavigationCanvas, LiveRouteAnimator)
- [ ] Integración completa de Navigation SDK en pantallas
- [ ] Animación suave del marcador del conductor
- [ ] Testing end-to-end del flujo completo

### 🔮 Próximas Funcionalidades
- [ ] Chat en vivo conductor-cliente
- [ ] Notificaciones push para eventos de pedido
- [ ] Modo offline con sincronización
- [ ] Reportes y analítica del conductor
- [ ] Sistema de incentivos y gamificación
- [ ] Integración con Vertex AI para asistente virtual

## 🤝 Contribución

Este proyecto es parte del ecosistema BeFast. Para contribuir:

1. Consulta el inventario del ecosistema para entender las funciones existentes
2. No duplicar funcionalidad que ya existe en Cloud Functions
3. Seguir la estructura de hooks y providers establecida
4. Documentar cualquier nueva dependencia en `ENVIRONMENT_VARIABLES.md`

## 📞 Soporte

Para soporte técnico, consultar:
- Documentación del ecosistema en `inventario ecosistema befast.md`
- Issues de GitHub del proyecto
- Portal de administración de BeFast
