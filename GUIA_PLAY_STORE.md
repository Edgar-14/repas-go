# 📱 Guía: Subir BeFast GO a Google Play Store

## ✅ Configuración Completada

### Archivos Configurados:
- ✓ Keystore de release creado: `android/app/befastgo-release.keystore`
- ✓ Build.gradle configurado con firma de release
- ✓ Scripts de generación creados
- ✓ Package.json actualizado con comandos

---

## 🚀 Paso 1: Generar el AAB (Android App Bundle)

### Opción A - Con npm (RECOMENDADO):
```bash
npm run build:aab
```

### Opción B - Con PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-aab.ps1
```

### Opción C - Manual:
```bash
cd android
./gradlew bundleRelease
```

**📁 El archivo AAB se generará en:**
```
android\app\build\outputs\bundle\release\app-release.aab
```

---

## 📦 Alternativa: Generar APK (para pruebas directas)

Si prefieres un APK para instalar directamente:

```bash
npm run build:apk
```

**📁 El archivo APK se generará en:**
```
android\app\build\outputs\apk\release\app-release.apk
```

---

## 📝 Paso 2: Crear Cuenta en Google Play Console

1. Ve a https://play.google.com/console
2. Si no tienes cuenta, regístrate (cuesta $25 USD por única vez)
3. Acepta los términos del desarrollador
4. Completa la información de la cuenta

---

## 🎯 Paso 3: Crear la Aplicación

1. En Play Console, haz clic en **"Crear aplicación"**
2. Completa los datos básicos:
   - **Nombre de la app**: BeFast GO
   - **Idioma predeterminado**: Español (España)
   - **Tipo de app**: Aplicación
   - **Categoría**: Gratis o De pago
3. Acepta las declaraciones

---

## 📋 Paso 4: Completar el Formulario del Contenido

### Información Básica:
- **Application ID**: `com.be_fast.be_fast`
- **Versión**: 1.0.0 (versionCode: 1)
- **Descripción corta**: App para repartidores de BeFast
- **Descripción completa**: [Escribe una descripción detallada de la app]

### Capturas de Pantalla Requeridas:
- **Teléfono**: Mínimo 2 capturas (1080x1920 px o similar)
- **Tablet 7"**: Opcional pero recomendado
- **Tablet 10"**: Opcional

### Icono y Gráficos:
- **Icono de la app**: 512x512 px PNG
- **Imagen destacada**: 1024x500 px JPG/PNG

---

## 🧪 Paso 5: Configurar Prueba Interna

**¡IMPORTANTE!** Empieza con prueba interna antes de publicar en producción:

1. Ve a **"Pruebas" → "Prueba interna"**
2. Crea una nueva versión
3. Sube el archivo `app-release.aab`
4. Completa las notas de la versión
5. Revisa y publica

### Agregar Testers:
1. Crea una lista de testers
2. Agrega emails de las personas que probarán
3. Comparte el enlace de prueba con ellos

---

## 🎨 Paso 6: Completar la Ficha de la Tienda

### Categorización:
- **Categoría**: Negocios / Productividad
- **Etiquetas**: delivery, repartidor, logística

### Clasificación de Contenido:
1. Completa el cuestionario de clasificación
2. Google asignará una clasificación automáticamente

### Detalles Legales:
- **Política de privacidad**: URL requerida
- **Permisos**: Justifica los permisos solicitados (ubicación, cámara, etc.)

---

## 🔐 Información del Keystore (¡GUÁRDALA SEGURA!)

```
Archivo: befastgo-release.keystore
Ubicación: android/app/befastgo-release.keystore
Alias: befastgo-key
Store Password: befastgo2025
Key Password: befastgo2025
Validez: 10,000 días (~27 años)
```

**⚠️ IMPORTANTE:**
- **NUNCA** subas el keystore a Git
- **GUARDA** una copia de seguridad en un lugar seguro
- **PERDER** el keystore significa que no podrás actualizar la app nunca más

---

## 🔄 Actualizaciones Futuras

Para publicar actualizaciones:

1. Actualiza el `versionCode` y `versionName` en `android/app/build.gradle`:
   ```gradle
   versionCode = 2  // Incrementa en 1
   versionName = "1.0.1"  // Actualiza según sea necesario
   ```

2. Genera un nuevo AAB:
   ```bash
   npm run build:aab
   ```

3. Sube el nuevo AAB a Play Console

---

## ✅ Checklist antes de Subir

- [ ] La app funciona correctamente en modo release
- [ ] Has probado todas las funciones principales
- [ ] Tienes capturas de pantalla listas
- [ ] Tienes el icono en 512x512 px
- [ ] Tienes una descripción de la app
- [ ] Tienes una política de privacidad (si recoges datos)
- [ ] Has generado el AAB exitosamente
- [ ] Has guardado el keystore en un lugar seguro

---

## 🐛 Solución de Problemas

### Error: "No se encuentra keytool"
Asegúrate de tener Java JDK instalado y en el PATH.

### Error al generar AAB
```bash
cd android
./gradlew clean
./gradlew bundleRelease --stacktrace
```

### Error de firma
Verifica que el archivo `gradle.properties` tenga las credenciales correctas.

### La app crashea en release
Agrega reglas de ProGuard en `android/app/proguard-rules.pro` si es necesario.

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs con: `adb logcat`
2. Verifica la consola de Play Store para mensajes de error
3. Asegúrate de cumplir todas las políticas de Google Play

---

## 🎉 ¡Felicitaciones!

Una vez que subas la app, aparecerá en Play Console y podrás:
- Ver estadísticas de uso
- Recibir reportes de crashes
- Gestionar versiones
- Ver reviews de usuarios

**Recuerda:** Empieza con **prueba interna** para probar todo antes de publicar en producción.

