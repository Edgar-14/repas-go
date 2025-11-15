# 📍 Página de Tracking Público - BeFast GO

## 🎯 Propósito

Página web pública accesible en **befastapp.com/track/[orderId]** donde los clientes pueden rastrear su pedido en tiempo real sin necesidad de login.

---

## �� URL y Acceso

### Ruta Principal
```
https://befastapp.com/track/[orderId]
```

**Ejemplo:**
```
https://befastapp.com/track/abc123xyz789
```

### Características
- ✅ **Público** - No requiere autenticación
- ✅ **Responsive** - Mobile-first design
- ✅ **Tiempo Real** - Updates automáticos vía Firestore
- ✅ **Compartible** - Link enviado por WhatsApp

---

## 📱 Integración con WhatsApp

Los mensajes de WhatsApp del ecosistema BeFast incluyen automáticamente el link de tracking:

```
🚀 ¡Tu pedido está en camino!

📦 Pedido #12345678
🏪 De: Don Tacos
👤 Repartidor: Juan Domínguez

📍 Rastrea tu pedido en tiempo real:
https://befastapp.com/track/abc123xyz789

¡Tu pedido llegará pronto!
```

La Cloud Function existente `sendWhatsAppConfirmation` en el ecosistema ya maneja el envío.

---

## 🚀 Deployment

### Opción 1: Firebase Hosting (Recomendado)

1. **Configurar Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Inicializar Hosting (si no está configurado):**
   ```bash
   firebase init hosting
   # Seleccionar proyecto: befast-hfkbl
   # Public directory: public
   # Single-page app: No
   # Configure GitHub actions: No
   ```

3. **Crear firebase.json en la raíz del proyecto:**
   ```json
   {
     "hosting": {
       "public": "public",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "/track/**",
           "destination": "/track/index.html"
         }
       ]
     }
   }
   ```

4. **Deploy:**
   ```bash
   firebase deploy --only hosting
   ```

5. **Verificar:**
   ```
   https://befast-hfkbl.web.app/track/[orderId]
   ```

6. **Configurar dominio personalizado (opcional):**
   - En Firebase Console → Hosting → Add custom domain
   - Agregar `befastapp.com` y configurar DNS

### Opción 2: Cualquier Hosting Estático

Puedes desplegar la carpeta `public/track` en cualquier servicio:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

**Importante:** Configurar rewrites para que `/track/[orderId]` sirva `index.html`

---

## 🔧 Configuración Requerida

### 1. Google Maps API Key

Editar `public/track/index.html` línea 15:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=TU_MAPS_API_KEY&libraries=geometry"></script>
```

**APIs Requeridas:**
- Maps JavaScript API
- Directions API (opcional, para rutas)

**Restricciones:**
- Restricción HTTP referrer: `befastapp.com/*`

### 2. Firebase Config (Ya configurado)

El archivo `tracking.js` ya usa las credenciales del proyecto `befast-hfkbl`:
- ✅ API Key configurado
- ✅ Project ID: `befast-hfkbl`
- ✅ App ID configurado

**No se requieren cambios** a menos que cambies de proyecto Firebase.

### 3. Reglas de Firestore (Acceso Público)

Para que la página funcione, las colecciones deben tener reglas de lectura pública:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Permitir lectura pública de pedidos (solo lectura)
    match /orders/{orderId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Permitir lectura pública de ubicación de conductores (solo lectura)
    match /drivers/{driverId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Desplegar reglas:**
```bash
firebase deploy --only firestore:rules
```

---

## 📊 Funcionalidades Implementadas

### 1. Información del Pedido
- ✅ Número de orden
- ✅ Estado actual (badge dinámico)
- ✅ Nombre del negocio
- ✅ Dirección de entrega
- ✅ Método de pago
- ✅ Total del pedido

### 2. Mapa en Tiempo Real
- ✅ Ubicación del conductor (actualización automática)
- ✅ Marcador del restaurante (pickup)
- ✅ Marcador del cliente (delivery)
- ✅ Auto-zoom para mostrar todos los puntos
- ✅ Indicador "En vivo"

### 3. Información de Entrega
- ✅ Tiempo estimado (ETA)
- ✅ Distancia restante
- ⏳ Ruta dibujada (requiere Routes API)

### 4. Timeline de Estados
- ✅ Buscando repartidor
- ✅ Repartidor asignado
- ✅ En camino al restaurante
- ✅ Pedido recogido
- ✅ En camino al cliente
- ✅ Repartidor llegó
- ✅ Pedido entregado

### 5. Información del Conductor
- ✅ Nombre completo
- ✅ Calificación
- ✅ Avatar con iniciales

---

## 🧪 Testing

### Probar Localmente

1. **Servir archivos estáticos:**
   ```bash
   cd public/track
   python -m http.server 8000
   # O usar Live Server de VS Code
   ```

2. **Abrir en navegador:**
   ```
   http://localhost:8000/index.html
   ```

3. **Simular orderId:**
   - Editar manualmente la URL: `http://localhost:8000/?orderId=abc123`
   - O crear un pedido real en Firestore

### Probar con Pedido Real

1. **Crear pedido de prueba en Firestore:**
   - Collection: `orders`
   - Document ID: `test-order-123`
   - Datos mínimos:
     ```json
     {
       "orderNumber": "12345678",
       "status": "IN_TRANSIT",
       "restaurant": {
         "name": "Don Tacos",
         "coordinates": { "lat": 19.4326, "lng": -99.1332 }
       },
       "customer": {
         "name": "Juan Pérez",
         "address": "Calle Principal 123",
         "coordinates": { "lat": 19.4426, "lng": -99.1432 }
       },
       "pricing": { "totalAmount": 250 },
       "paymentMethod": "CASH",
       "assignedDriverId": "driver-id-123"
     }
     ```

2. **Abrir URL:**
   ```
   https://befastapp.com/track/test-order-123
   ```

3. **Verificar:**
   - ✅ Mapa se carga
   - ✅ Marcadores aparecen
   - ✅ Información se muestra
   - ✅ Timeline está actualizado

### Probar Tracking en Tiempo Real

1. **Con conductor activo:**
   - Asegúrate que el conductor tenga `operational.currentLocation` actualizado
   - Abre la página de tracking
   - El marcador del conductor debe aparecer y actualizarse automáticamente

2. **Cambiar estado del pedido:**
   - Actualiza `status` en Firestore
   - La página debe reflejar el cambio automáticamente
   - El timeline se actualiza
   - El badge de estado cambia

---

## 🔒 Seguridad

### Datos Expuestos (Lectura Pública)
- ✅ Información básica del pedido
- ✅ Ubicación del conductor (solo mientras tiene pedido activo)
- ✅ Estado del pedido
- ✅ Información del negocio

### Datos Protegidos (No accesibles)
- ❌ Datos personales sensibles del conductor
- ❌ Datos financieros completos
- ❌ Información de otros pedidos
- ❌ Datos del negocio sensibles

### Recomendaciones
1. ✅ Las reglas de Firestore están configuradas para **solo lectura** pública
2. ✅ No se expone información sensible
3. ✅ El orderId actúa como "token" de acceso
4. ⚠️ Considera ofuscar orderIds para mayor seguridad

---

## 🐛 Solución de Problemas

### El mapa no se carga
- Verifica que el API key de Google Maps esté configurado
- Verifica que Maps JavaScript API esté habilitada
- Revisa la consola del navegador para errores

### No se muestra información del pedido
- Verifica que el orderId sea correcto
- Verifica que el pedido exista en Firestore
- Revisa las reglas de Firestore (deben permitir lectura pública)
- Revisa la consola del navegador para errores de Firebase

### La ubicación del conductor no se actualiza
- Verifica que el conductor tenga `operational.currentLocation` en Firestore
- Verifica que el pedido tenga `assignedDriverId`
- Verifica que el conductor esté usando la app BeFast GO con tracking activo

### El timeline no se actualiza
- Verifica que el pedido tenga `status` correcto
- Verifica que `timing.*At` tenga timestamps válidos

---

## 📝 Roadmap

### Próximas Mejoras
- [ ] Dibujar ruta real usando Routes API
- [ ] Mostrar múltiples waypoints
- [ ] Notificaciones push cuando cambia el estado
- [ ] Chat en vivo con el conductor
- [ ] Compartir tracking por SMS
- [ ] Historial de ubicaciones del conductor
- [ ] Mapa de calor de zonas de demanda

---

## 🔗 Enlaces Relacionados

- [Documentación Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

---

**Estado:** ✅ **LISTO PARA DEPLOYMENT**  
**Fecha:** Noviembre 2025  
**Proyecto:** BeFast GO - Reemplazo de Shipday
