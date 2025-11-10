# 🗺️ Configuración de Google Maps para BeFast GO

## 📋 Requisitos

Para que el sistema de mapas y tracking funcione correctamente, necesitas configurar una **Google Maps API Key**.

## 🔑 Obtener API Key de Google Maps

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Directions API**
   - **Distance Matrix API**
   - **Places API**
   - **Geocoding API**

4. Ve a "Credenciales" y crea una nueva "API Key"
5. Copia la API Key generada

## 📱 Configuración para Android

### 1. AndroidManifest.xml

Reemplaza `YOUR_GOOGLE_MAPS_API_KEY` con tu API key real:

```bash
# Ubicación del archivo
android/app/src/main/AndroidManifest.xml
```

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="TU_API_KEY_AQUI"/>
```

## 🍎 Configuración para iOS

### 1. AppDelegate.mm

Agrega tu API key en el archivo AppDelegate:

```bash
# Ubicación del archivo
ios/BeFastGO/AppDelegate.mm
```

```objc
#import <GoogleMaps/GoogleMaps.h>

// En el método didFinishLaunchingWithOptions
[GMSServices provideAPIKey:@"TU_API_KEY_AQUI"];
```

### 2. Podfile

Asegúrate de que el Podfile incluya:

```ruby
pod 'GoogleMaps'
pod 'Google-Maps-iOS-Utils'
```

Luego ejecuta:
```bash
cd ios
pod install
```

## 🌐 Configuración para Web (Tracking Público)

### 1. public/track/index.html

Reemplaza la API key en el script de Google Maps:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=TU_API_KEY_AQUI"></script>
```

### 2. public/track/tracking.js

Actualiza la configuración de Firebase con tus credenciales reales:

```javascript
const firebaseConfig = {
    apiKey: "TU_FIREBASE_API_KEY",
    authDomain: "TU_PROJECT.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};
```

## 🔧 Configuración en el Código

### TrackingMap.tsx

Busca y reemplaza `YOUR_GOOGLE_MAPS_API_KEY` en:

```typescript
// src/components/TrackingMap.tsx
<MapViewDirections
  apikey="TU_API_KEY_AQUI"
  ...
/>
```

## 🧪 Probar la Configuración

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Web (Tracking)
1. Abre `public/track/index.html` en un navegador
2. Agrega un orderId válido en la URL: `file:///path/to/track/index.html?orderId=abc123`

## 🔒 Seguridad de la API Key

### Restricciones Recomendadas

En Google Cloud Console, configura restricciones para tu API key:

1. **Para Android**: Restringir por nombre de paquete
   - Nombre del paquete: `com.befastgo`
   - Huella SHA-1 (obtenerla con: `keytool -list -v -keystore ~/.android/debug.keystore`)

2. **Para iOS**: Restringir por Bundle ID
   - Bundle ID: `com.befastgo`

3. **Para Web**: Restringir por dominio
   - Dominios permitidos: `befastapp.com`, `*.befastapp.com`

### Variables de Entorno (Recomendado)

Para mayor seguridad, usa variables de entorno:

```bash
# .env
GOOGLE_MAPS_API_KEY=tu_api_key_aqui
FIREBASE_API_KEY=tu_firebase_key_aqui
```

Luego en el código:
```javascript
import Config from 'react-native-config';

const API_KEY = Config.GOOGLE_MAPS_API_KEY;
```

## 📊 Monitoreo de Uso

- Revisa el uso de tu API en [Google Cloud Console](https://console.cloud.google.com/)
- Configura alertas de facturación
- Google Maps ofrece $200 USD de crédito mensual gratis

## 🆘 Solución de Problemas

### El mapa no se muestra

1. Verifica que la API key esté correctamente configurada
2. Revisa que las APIs necesarias estén habilitadas
3. Verifica los logs: `adb logcat` (Android) o Xcode Console (iOS)

### Error de autenticación

1. Confirma que la API key no tenga espacios extras
2. Verifica las restricciones de la API key
3. Asegúrate de que el paquete/bundle ID coincida

### Direcciones no se calculan

1. Verifica que **Directions API** esté habilitada
2. Confirma que tengas créditos disponibles en Google Cloud

## 📞 Soporte

Para más información:
- [Documentación oficial de react-native-maps](https://github.com/react-native-maps/react-native-maps)
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Firebase Documentation](https://firebase.google.com/docs)

---

**✅ Una vez configurado correctamente, tendrás:**
- ✅ Mapa interactivo en la app del conductor
- ✅ Tracking en tiempo real de la ubicación del conductor
- ✅ Rutas calculadas automáticamente
- ✅ Página web pública de tracking para clientes
- ✅ Actualizaciones en tiempo real vía Firebase
