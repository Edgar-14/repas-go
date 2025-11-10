# 📱 BeFast GO - Aplicación para Repartidores

**Versión**: 1.0.0  
**Fecha**: Noviembre 2025  
**Estado**: Implementación MVP Completa

---

## 🎯 DESCRIPCIÓN

BeFast GO es la aplicación móvil nativa para conductores/repartidores que **reemplaza completamente a Shipday** y se integra directamente con el ecosistema BeFast existente.

### Características Principales

✅ **Login y autenticación** con validación IMSS/IDSE obligatoria  
✅ **Dashboard principal** con métricas en tiempo real  
✅ **Gestión completa de pedidos** con validación 360°  
✅ **Navegación GPS integrada** con estados del pedido  
✅ **Billetera digital** con sistema dual (efectivo/tarjeta)  
✅ **Sistema de notificaciones** push en tiempo real  
✅ **Perfil del conductor** con estadísticas y KPIs  
✅ **Gestión de documentos** (solo lectura)  
✅ **Sistema de emergencia** integrado  
✅ **Configuración completa** de la aplicación  

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico
- **Framework**: React Native 0.82.1 con TypeScript
- **Estado**: Redux Toolkit + RTK Query
- **Navegación**: React Navigation 6
- **Backend**: Firebase (Firestore, Auth, Functions, Messaging)
- **Mapas**: React Native Maps + Google Maps SDK
- **Notificaciones**: Firebase Cloud Messaging (FCM)

### Estructura del Proyecto
```
BeFastGO/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Configuración Firebase
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Navegación principal
│   ├── screens/                 # Pantallas de la app
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── OrderDetailScreen.tsx
│   │   ├── OrdersScreen.tsx
│   │   ├── NavigationScreen.tsx
│   │   ├── PaymentsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   ├── EmergencyScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── DocumentsScreen.tsx
│   │   ├── DeliveryConfirmationScreen.tsx
│   │   └── IncidentsScreen.tsx
│   ├── store/                   # Redux store
│   │   ├── index.ts
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── driverSlice.ts
│   │       ├── ordersSlice.ts
│   │       ├── walletSlice.ts
│   │       └── notificationsSlice.ts
│   └── types/
│       └── index.ts             # Tipos TypeScript
├── android/                     # Configuración Android
├── ios/                         # Configuración iOS
└── App.tsx                      # Componente principal
```

---

## 🚀 INSTALACIÓN Y CONFIGURACIÓN

### Prerequisitos

1. **Node.js** >= 20.19.4
2. **React Native CLI** instalado globalmente
3. **Android Studio** (para desarrollo Android)
4. **Xcode** (para desarrollo iOS - solo macOS)
5. **Firebase Project** configurado

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd BeFastGO
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar Firebase**
   - Crear proyecto en Firebase Console
   - Habilitar Authentication, Firestore, Cloud Functions, Cloud Messaging
   - Descargar `google-services.json` (Android) y `GoogleService-Info.plist` (iOS)
   - Colocar archivos en las carpetas correspondientes

4. **Configurar Android**
```bash
cd android
./gradlew clean
cd ..
```

5. **Configurar iOS** (solo macOS)
```bash
cd ios
pod install
cd ..
```

### Ejecutar la Aplicación

**Android**:
```bash
npm run android
```

**iOS**:
```bash
npm run ios
```

**Metro Bundler**:
```bash
npm start
```

---

## 🔧 CONFIGURACIÓN DE FIREBASE

### 1. Proyecto Firebase
- **Project ID**: `befast-hfkbl`
- **Región**: `us-central1`

### 2. Colecciones de Firestore
```typescript
COLLECTIONS = {
  DRIVERS: 'drivers',
  DRIVER_APPLICATIONS: 'driverApplications',
  ORDERS: 'orders',
  ORDER_TIMELINE: 'orderTimeline',
  WALLET_TRANSACTIONS: 'walletTransactions',
  CREDIT_TRANSACTIONS: 'creditTransactions',
  SYSTEM_LOGS: 'systemLogs',
  AUDIT_LOGS: 'auditLogs'
}
```

### 3. Cloud Functions Requeridas
- `validateOrderAssignment` - Validación 360° + IMSS
- `processOrderCompletion` - Auditoría "Doble Contador"
- `handleOrderWorkflow` - Estados del pedido
- `updateDriverStatus` - Estado operativo
- `processWithdrawalRequest` - Retiros
- `processDebtPayment` - Pago de deudas
- `sendNotification` - Notificaciones push

### 4. Reglas de Seguridad

**Firestore Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Drivers collection
    match /drivers/{driverId} {
      allow read: if request.auth.uid == driverId;
      allow write: if false; // Solo Cloud Functions
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.driverId;
      allow write: if false; // Solo Cloud Functions
    }
    
    // Wallet transactions
    match /walletTransactions/{transactionId} {
      allow read: if request.auth.uid == resource.data.driverId;
      allow write: if false; // Solo Cloud Functions
    }
  }
}
```

---

## 📱 FUNCIONALIDADES IMPLEMENTADAS

### 🔐 Autenticación y Validación
- Login con email/password
- Validación IMSS/IDSE obligatoria
- Verificación de estado del conductor
- Bloqueo automático si no cumple requisitos

### 📊 Dashboard Principal
- Estado online/offline con toggle
- Métricas del día (pedidos, ganancias, calificación)
- Pedidos disponibles en tiempo real
- Pedido activo (si existe)
- Accesos rápidos a funciones principales

### 📦 Gestión de Pedidos
- Lista de pedidos disponibles y historial
- Detalles completos del pedido antes de aceptar
- Validación 360° automática al aceptar
- Estados del pedido con códigos de color
- Navegación GPS integrada
- Confirmación de entrega con foto/firma/PIN

### 💰 Billetera Digital
- Sistema dual: efectivo vs tarjeta
- Saldo en tiempo real
- Control de deudas con límite de $300 MXN
- Historial de transacciones detallado
- Retiros con validación de monto mínimo
- Pago manual de deudas

### 👤 Perfil del Conductor
- Información personal y administrativa
- Estadísticas de rendimiento
- KPIs críticos con umbrales
- Estado IMSS/IDSE en tiempo real
- Acceso a documentos y configuración

### 🔔 Sistema de Notificaciones
- Notificaciones push en tiempo real
- Categorización por tipo y prioridad
- Historial de notificaciones
- Configuración de sonido y vibración
- Deep linking a pantallas correspondientes

### 🚨 Sistema de Emergencia
- Botón de emergencia con countdown
- Números de emergencia rápidos
- Compartir ubicación en tiempo real
- Contacto con soporte BeFast
- Reportar incidentes detallados

### ⚙️ Configuración Completa
- Configuración de notificaciones
- Preferencias de navegación
- Configuración de apariencia
- Privacidad y seguridad
- Gestión de cuenta

---

## 🔄 INTEGRACIÓN CON ECOSISTEMA BEFAST

### Conexión Directa
La app se conecta directamente a:
- **Mismas Cloud Functions** que usa el ecosistema web
- **Mismas colecciones** de Firestore
- **Mismo sistema** de autenticación
- **Mismos buckets** de Storage

### Flujo de Datos
```
Portal Web BeFast → Firebase → BeFast GO App
     ↑                ↓              ↓
Cloud Functions ← Firestore → Tiempo Real
```

### Reemplazo de Shipday
- ❌ **Eliminado**: Shipday API y webhooks
- ✅ **Reemplazado**: Sistema nativo BeFast GO
- ✅ **Mejorado**: Validación 360° y auditoría

---

## 🧪 TESTING Y DEBUGGING

### Comandos de Testing
```bash
# Ejecutar tests
npm test

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Debugging
- **Flipper** para debugging avanzado
- **React Native Debugger** para Redux DevTools
- **Firebase Console** para logs de backend

---

## 📋 CHECKLIST DE DEPLOYMENT

### Pre-deployment
- [ ] Configurar Firebase project en producción
- [ ] Actualizar configuración de Firebase
- [ ] Configurar certificados de push notifications
- [ ] Configurar Google Maps API keys
- [ ] Configurar signing keys para Android/iOS

### Android
- [ ] Generar APK/AAB firmado
- [ ] Configurar Google Play Console
- [ ] Subir a Play Store

### iOS
- [ ] Configurar provisioning profiles
- [ ] Generar build para App Store
- [ ] Subir a App Store Connect

---

## 🐛 TROUBLESHOOTING

### Problemas Comunes

**Error de Firebase**:
```bash
# Verificar configuración
npx react-native run-android --verbose
```

**Error de dependencias**:
```bash
# Limpiar cache
npm start -- --reset-cache
cd android && ./gradlew clean && cd ..
```

**Error de Metro**:
```bash
# Reiniciar Metro
npx react-native start --reset-cache
```

---

## 📞 SOPORTE

Para soporte técnico o preguntas sobre la implementación:
- **Documentación**: Ver archivos MD en el proyecto
- **Issues**: Crear issue en el repositorio
- **Contacto**: Equipo de desarrollo BeFast

---

## 📄 LICENCIA

© 2025 BeFast. Todos los derechos reservados.

---

**Documento Técnico Oficial**  
**BeFast GO - Aplicación Móvil para Repartidores**  
**Implementación MVP Completa**  
**Última actualización**: Noviembre 2025