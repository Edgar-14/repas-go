# Pasos rápidos para ver la app YA (Android en Windows)

Sigue estos pasos cortos. Si algo falla, mira la sección de Solución rápida de errores.

## 1) Requisitos
- Android Studio instalado (con SDK y al menos un emulador configurado)
- Node.js 20+
- Platform Tools (adb) en el PATH
- Depuración USB activada si usarás dispositivo físico

## 2) Ejecutar en emulador
1. Abre Android Studio y levanta un AVD (Pixel, etc.).
2. En la raíz del proyecto, abre PowerShell y ejecuta:
   
   npm run android:oneclick

Eso abrirá Metro y construirá/instalará la app automáticamente.

## 3) Ejecutar en dispositivo físico (USB)
1. Activa Depuración USB en tu teléfono y conéctalo por cable.
2. Acepta la huella RSA cuando se solicite.
3. En la raíz del proyecto, ejecuta:
   
   npm run android:oneclick:device

El script aplicará `adb reverse` al puerto 8081 y compilará/instalará la app.

## 4) Variables y llaves (Maps/Firebase)
- MAPS_API_KEY ya se inyecta mediante gradle.properties.
- google-services.json ya está en android/app/src/main/google-services.json.
- Si cambias el applicationId, descarga un nuevo google-services.json desde Firebase.

## 5) Verificaciones rápidas dentro de la app
- Debes ver la pantalla principal sin errores.
- Si abres una pantalla con mapa, debe renderizar sin el watermark "For development purposes only".
- Si pide permisos (ubicación, notificaciones), concédelos.

## Solución rápida de errores
- No aparece el dispositivo: ejecuta `adb devices`. Si no sale, reinstala Platform Tools o reconecta USB y acepta la huella.
- Error de puerto Metro: cierra otras instancias de Metro o reinicia el script. También puedes ejecutar manualmente: `npm run start` en una terminal y luego `npm run android` en otra.
- Falla de compilación por SDK/Build Tools: abre Android Studio > SDK Manager > instala Android SDK Platform 35 y Build-Tools 35.
- Error con Google Maps API key: verifica que `android/gradle.properties` tenga `MAPS_API_KEY=TU_CLAVE` válida.
- Error Firebase/Google Services: confirma que `google-services.json` pertenece al `applicationId` actual `com.be_fast.be_fast`.

## ¿Necesitas ayuda?
Escribe el texto exacto del error o adjunta captura. Con eso te indico el comando o ajuste preciso para resolverlo al instante.