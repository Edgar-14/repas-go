# BeFast GO - Driver Mobile App

Aplicación móvil para conductores de BeFast, desarrollada en React Native.

## ¿Qué hago ahora?

- Ejecuta un solo comando en Windows para ver la app YA en Android (emulador o dispositivo):
  
  npm run ya

- Si prefieres, también puedes usar: `npm run android` (emulador) o `npm run android:device` (dispositivo físico con USB debug).

## 🚀 Características

- **Gestión de Pedidos**: Acepta y gestiona pedidos de entrega en tiempo real
- **Navegación GPS**: Navegación integrada a ubicaciones de recogida y entrega
- **Billetera Digital**: Seguimiento de ganancias y gestión de pagos
- **Cumplimiento IMSS**: Validación y cumplimiento de requisitos laborales mexicanos
- **Comunicación**: Mensajería integrada con clientes y soporte

## 🛠️ Tecnologías

- React Native 0.82.1
- TypeScript 5.8.3
- Redux Toolkit 2.10.1
- Firebase (Auth, Firestore, Functions, Messaging, Storage)
- React Navigation 7.x

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
├── config/          # Configuración de Firebase
├── navigation/      # Navegación de la app
├── screens/         # Pantallas de la aplicación
├── store/          # Estado global con Redux
└── types/          # Definiciones de TypeScript
```

## 🔧 Scripts Disponibles

- `npm start` - Inicia Metro bundler
- `npm run android` - Ejecuta en Android
- `npm run ios` - Ejecuta en iOS
- `npm run lint` - Ejecuta ESLint
- `npm test` - Ejecuta tests

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
