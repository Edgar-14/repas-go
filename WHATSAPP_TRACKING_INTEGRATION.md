# 📱 Integración WhatsApp - Link de Tracking Automático

## 🎯 Objetivo

Enviar automáticamente un link de tracking por WhatsApp cuando el pedido cambia a estado `IN_TRANSIT` (en camino).

---

## 🔥 Cloud Function Requerida

Esta Cloud Function debe estar en tu proyecto Firebase, típicamente en `functions/src/orderWorkflow.ts`

### Código de Ejemplo

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Configuración de WhatsApp API (ejemplo con Twilio)
const TWILIO_ACCOUNT_SID = functions.config().twilio.account_sid;
const TWILIO_AUTH_TOKEN = functions.config().twilio.auth_token;
const TWILIO_WHATSAPP_NUMBER = functions.config().twilio.whatsapp_number;

// URL base de tu app web
const TRACKING_BASE_URL = 'https://befastapp.com/track';

/**
 * Trigger cuando un pedido cambia de estado
 */
export const onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const orderId = context.params.orderId;
    const before = change.before.data();
    const after = change.after.data();

    // Solo enviar cuando cambia a IN_TRANSIT
    if (before.status !== 'IN_TRANSIT' && after.status === 'IN_TRANSIT') {
      try {
        await sendTrackingLinkToCustomer(orderId, after);
        console.log(`Tracking link sent for order ${orderId}`);
      } catch (error) {
        console.error(`Error sending tracking link for order ${orderId}:`, error);
      }
    }
  });

/**
 * Enviar link de tracking por WhatsApp
 */
async function sendTrackingLinkToCustomer(orderId: string, orderData: any) {
  const trackingUrl = `${TRACKING_BASE_URL}/${orderId}`;
  const customerPhone = orderData.customer.phone; // Formato: +52XXXXXXXXXX
  const businessName = orderData.pickup.businessName;
  const driverName = orderData.driverName || 'tu repartidor';
  const orderNumber = orderData.orderNumber || orderId.slice(-8);

  const message = `🚀 *¡Tu pedido está en camino!*\n\n` +
    `📦 Pedido #${orderNumber}\n` +
    `🏪 De: ${businessName}\n` +
    `👤 Repartidor: ${driverName}\n\n` +
    `📍 *Rastrea tu pedido en tiempo real:*\n` +
    `${trackingUrl}\n\n` +
    `Tu pedido llegará pronto. ¡Gracias por elegir BeFast! 🎉`;

  // Opción 1: Usar Twilio WhatsApp API
  await sendWithTwilio(customerPhone, message);

  // Opción 2: Usar WhatsApp Business API
  // await sendWithWhatsAppBusiness(customerPhone, message);

  // Opción 3: Usar servicio personalizado (Wassenger, Wati, etc.)
  // await sendWithCustomService(customerPhone, message);
}

/**
 * Enviar con Twilio WhatsApp API
 */
async function sendWithTwilio(to: string, message: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const data = new URLSearchParams({
    From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
    To: `whatsapp:${to}`,
    Body: message,
  });

  const response = await axios.post(url, data, {
    auth: {
      username: TWILIO_ACCOUNT_SID,
      password: TWILIO_AUTH_TOKEN,
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
}

/**
 * Enviar con WhatsApp Business API (Meta)
 */
async function sendWithWhatsAppBusiness(to: string, message: string) {
  const WHATSAPP_TOKEN = functions.config().whatsapp.token;
  const WHATSAPP_PHONE_ID = functions.config().whatsapp.phone_id;

  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;

  const response = await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to: to.replace('+', ''),
      type: 'text',
      text: {
        body: message,
      },
    },
    {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}
```

---

## ⚙️ Configuración en Firebase

### 1. Instalar Dependencias

```bash
cd functions
npm install axios
```

### 2. Configurar Credenciales

#### Opción A: Twilio

```bash
firebase functions:config:set \
  twilio.account_sid="ACxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  twilio.auth_token="your_auth_token" \
  twilio.whatsapp_number="+14155238886"
```

#### Opción B: WhatsApp Business API (Meta)

```bash
firebase functions:config:set \
  whatsapp.token="your_whatsapp_token" \
  whatsapp.phone_id="your_phone_number_id"
```

### 3. Desplegar Cloud Function

```bash
firebase deploy --only functions
```

---

## 📝 Formato del Número de Teléfono

El número debe estar en formato internacional:

```
Correcto:   +521234567890
Incorrecto: 1234567890
Incorrecto: 521234567890
```

### En Firestore (orders collection)

```typescript
{
  customer: {
    name: "Juan Pérez",
    phone: "+521234567890",  // ✅ Formato correcto
    // ...
  }
}
```

---

## 🔄 Flujo Completo

### 1. Conductor acepta pedido
```
Estado: ACCEPTED → IN_TRANSIT
```

### 2. Cloud Function se activa
```javascript
onOrderStatusChange detecta el cambio
```

### 3. Se genera link de tracking
```
https://befastapp.com/track/abc123xyz789
```

### 4. Se envía WhatsApp al cliente
```
🚀 ¡Tu pedido está en camino!

📦 Pedido #12345678
🏪 De: Don Tacos
👤 Repartidor: Juan Domínguez

📍 Rastrea tu pedido en tiempo real:
https://befastapp.com/track/abc123xyz789

Tu pedido llegará pronto. ¡Gracias por elegir BeFast! 🎉
```

### 5. Cliente abre el link
```
Se carga tracking.html con el orderId
Firebase listener se conecta
Mapa se muestra con ubicación en tiempo real
```

---

## 🧪 Testing

### Probar Localmente

```bash
# Usar Firebase Emulator
firebase emulators:start

# O probar función directamente
npm run serve
```

### Probar en Producción

1. Crear pedido de prueba en Firestore
2. Cambiar estado a `IN_TRANSIT` manualmente
3. Verificar que llegue el WhatsApp
4. Abrir link y verificar tracking

---

## 🛠️ Alternativas de Servicio de WhatsApp

### 1. Twilio (Recomendado para empezar)
- ✅ Fácil de configurar
- ✅ Sandbox gratuito para testing
- ✅ $0.005 por mensaje enviado
- 🔗 https://www.twilio.com/whatsapp

### 2. WhatsApp Business API (Meta)
- ✅ Oficial de Meta
- ✅ Más económico en volumen
- ❌ Proceso de aprobación más largo
- 🔗 https://business.whatsapp.com/

### 3. Wassenger
- ✅ API simple
- ✅ Sin aprobación de Facebook
- ✅ Múltiples números
- 🔗 https://wassenger.com/

### 4. Wati
- ✅ Plataforma completa
- ✅ Templates y workflows
- ✅ Dashboard de mensajes
- 🔗 https://www.wati.io/

### 5. Gupshup
- ✅ Global
- ✅ Múltiples canales
- ✅ Templates aprobados
- 🔗 https://www.gupshup.io/

---

## 🔒 Seguridad

### Validaciones Recomendadas

```typescript
// Validar que el número esté en formato correcto
function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+\d{10,15}$/;
  return phoneRegex.test(phone);
}

// Validar que el pedido existe
async function validateOrder(orderId: string): Promise<boolean> {
  const orderDoc = await admin.firestore()
    .collection('orders')
    .doc(orderId)
    .get();
  
  return orderDoc.exists();
}

// Rate limiting (evitar spam)
const rateLimiter = new Map<string, number>();

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const lastSent = rateLimiter.get(phone) || 0;
  
  if (now - lastSent < 60000) { // 1 minuto mínimo
    return false;
  }
  
  rateLimiter.set(phone, now);
  return true;
}
```

---

## 📊 Monitoreo

### Logs en Firebase Console

```typescript
// Agregar logs detallados
functions.logger.info('Sending tracking link', {
  orderId,
  customerPhone: customerPhone.replace(/\d(?=\d{4})/g, '*'),
  trackingUrl,
});

// Log de errores
functions.logger.error('Failed to send WhatsApp', {
  orderId,
  error: error.message,
});
```

### Guardar Historial en Firestore

```typescript
// Colección para tracking de mensajes
await admin.firestore()
  .collection('whatsapp_messages')
  .add({
    orderId,
    customerPhone,
    message,
    trackingUrl,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'sent',
    provider: 'twilio',
  });
```

---

## 🚨 Manejo de Errores

```typescript
try {
  await sendTrackingLinkToCustomer(orderId, orderData);
} catch (error) {
  // Log del error
  console.error('Error sending WhatsApp:', error);
  
  // Guardar en Firestore para retry
  await admin.firestore()
    .collection('failed_messages')
    .add({
      orderId,
      error: error.message,
      attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
      orderData,
    });
  
  // Notificar al admin (opcional)
  await sendAdminNotification({
    type: 'whatsapp_error',
    orderId,
    error: error.message,
  });
}
```

---

## 💰 Costos Estimados

### Twilio WhatsApp
- Sandbox: Gratis (solo para testing)
- Producción: $0.005 USD por mensaje
- 1000 mensajes/mes = $5 USD

### WhatsApp Business API (Meta)
- Primeros 1000 mensajes: Gratis
- Después: Variable por país
- México: ~$0.003 USD por mensaje

---

## ✅ Checklist de Implementación

- [ ] Elegir proveedor de WhatsApp (Twilio, Meta, otros)
- [ ] Crear cuenta en el proveedor elegido
- [ ] Obtener credenciales (SID, Token, Phone ID)
- [ ] Configurar credenciales en Firebase
- [ ] Implementar Cloud Function
- [ ] Desplegar función a Firebase
- [ ] Probar con pedido de prueba
- [ ] Configurar templates de mensajes
- [ ] Implementar rate limiting
- [ ] Configurar monitoreo y logs
- [ ] Documentar proceso para el equipo

---

## 📞 Soporte

Para dudas sobre la implementación:
- Documentación de Twilio: https://www.twilio.com/docs
- Documentación de WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- Firebase Cloud Functions: https://firebase.google.com/docs/functions

---

**Estado**: 📋 **GUÍA COMPLETA PARA IMPLEMENTACIÓN**  
**Fecha**: Noviembre 2025
