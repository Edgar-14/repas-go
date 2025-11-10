# BeFast GO - Driver Mobile App

Aplicación móvil para conductores de BeFast, desarrollada en React Native.

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