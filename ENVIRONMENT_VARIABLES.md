# Variables y llaves necesarias (BeFast GO)

Este proyecto ya está configurado para Android con Firebase y Maps. A continuación se listan las variables y llaves que puedes/necesitas proveer para que la app funcione correctamente, y cómo configurarlas.

## 1) Android Google Maps API Key
- Variable: MAPS_API_KEY
- Uso: Clave de Android Maps para `react-native-maps` (y Google Play Services Maps)
- Dónde se inyecta: AndroidManifest mediante manifestPlaceholder `${MAPS_API_KEY}`
- Configuración (opción recomendada):
  1. Edita `android/gradle.properties` y agrega la línea:
     
     MAPS_API_KEY=TU_CLAVE_DE_MAPS_ANDROID
     
  2. Compila normalmente con `npm run android` o `npm run android:device`.
- Alternativa (temporal): pasar por parámetro a Gradle:
  
  ./gradlew assembleDebug -PMAPS_API_KEY=TU_CLAVE
  
  Nota: En Windows, al compilar desde Android Studio, también leerá `gradle.properties`.

Estado actual del repo:
- android/app/build.gradle ya define `manifestPlaceholders` para `MAPS_API_KEY`.
- android/app/src/main/AndroidManifest.xml consume `${MAPS_API_KEY}` en:
  
  <meta-data android:name="com.google.android.geo.API_KEY" android:value="${MAPS_API_KEY}" />

## 2) Firebase (Android)
- Archivo requerido: `android/app/src/main/google-services.json`
- Estado actual: YA incluido y con `package_name` = `com.be_fast.be_fast`.
- No necesitas variables adicionales: @react-native-firebase usa la config nativa del JSON.

## 3) Otros (Opcionales según funcionalidades)
- Servidores propios/API: actualmente el código no referencia variables como `BASE_API_URL`. Si se integra backend propio, definiremos una variable (p.ej. `API_BASE_URL`) y la inyectaremos vía `.env` (con `react-native-config`) o mediante Gradle/iOS xcconfig.
- Notificaciones: ya está configurado Firebase Cloud Messaging. No se requieren llaves adicionales en Android.
- WhatsApp Tracking / Deep Links: si en el futuro agregamos esquemas personalizados, se documentarán las variables requeridas (por ahora no hay).

## Resumen: ¿Qué necesito de ti ahora?
1) Tu clave de Google Maps para Android: `MAPS_API_KEY`
   - Si ya la tienes, pásamela para añadirla a `android/gradle.properties`, o agrégala tú en tu entorno.
2) Confirmar que `google-services.json` es el correcto de tu proyecto (ya lo es según tu archivo). Si cambia el `applicationId`, deberemos descargar uno nuevo.

## Cómo verificar
- Inicia Metro y corre Android:
  
  npm run start
  npm run android   (emulador)
  npm run android:device  (dispositivo físico)
  
- Abre una pantalla con el mapa; si la clave es válida, debe renderizar sin el watermark de "For development purposes only" y sin errores de API Key.

## Seguridad
- No subas tu `MAPS_API_KEY` en claro a repos públicos. `gradle.properties` está pensado para uso local/privado. En CI agregaremos variables seguras.
