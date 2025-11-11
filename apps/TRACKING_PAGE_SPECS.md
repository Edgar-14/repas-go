# 📍 BeFast GO - Especificaciones de Página de Tracking Público

## 🎯 Propósito
Página web pública en **befastapp.com/track/[orderId]** donde los clientes pueden rastrear su pedido en tiempo real sin necesidad de login.

---

## 📱 URL y Acceso

### Ruta Principal
```
https://befastapp.com/track/[orderId]
```

**Ejemplo:**
```
https://befastapp.com/track/abc123xyz789
```

### Acceso
- ✅ **Público** - No requiere autenticación
- ✅ **Responsive** - Mobile-first design
- ✅ **Tiempo Real** - Updates automáticos vía Firestore
- ✅ **Compartible** - Link enviado por WhatsApp

---

## 🔗 Integración con WhatsApp

### Mensaje Actualizado (functions/src/orderWorkflow.ts)
```typescript
const trackingUrl = `https://befastapp.com/track/${orderId}`;

const message = `🚀 *¡Tu pedido está en camino!*\n\n` +
  `📦 Pedido #${orderNumber}\n` +
  `🏪 De: ${businessName}\n` +
  `👤 Repartidor: ${driverName}\n\n` +
  `📍 *Rastrea tu pedido en tiempo real:*\n` +
  `${trackingUrl}\n\n` +
  `Tu pedido llegará pronto. Gracias por elegir BeFast 🎉`;
```

**Trigger:** Cuando el pedido cambia a estado `IN_TRANSIT`

---

## 📊 Datos que Mostrar (Firestore)

### Colección: `orders/[orderId]`
```typescript
{
  id: string;
  orderNumber?: string;           // Número corto del pedido
  status: OrderStatus;            // Estado actual
  
  // Información del negocio
  pickup: {
    businessName: string;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }
  };
  
  // Información de entrega
  delivery: {
    address: string;
    phone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }
  };
  
  // Información del conductor (si asignado)
  driverId: string | null;
  
  // Financiero
  total: number;
  paymentMethod: 'CASH' | 'CARD';
  
  // Timestamps
  timestamps: {
    created: Timestamp;
    assigned?: Timestamp;
    accepted?: Timestamp;
    pickedUp?: Timestamp;
    inTransit?: Timestamp;
    arrived?: Timestamp;
    delivered?: Timestamp;
    completed?: Timestamp;
  };
  
  // ETA (opcional)
  estimatedDeliveryTime?: Timestamp;
}
```

### Colección: `drivers/[driverId]` (solo si order.driverId existe)
```typescript
{
  personalData: {
    fullName: string;
  };
  
  operational: {
    currentLocation: {
      latitude: number;
      longitude: number;
      timestamp: Timestamp;
    };
  };
  
  stats: {
    rating: number;  // 0-5
  };
}
```

---

## 🎨 Componentes Visuales Requeridos

### 1. Header
```
┌─────────────────────────────┐
│   🚀 BeFast Tracking        │
│   Rastrea tu pedido         │
└─────────────────────────────┘
```

### 2. Card de Información del Pedido
```
┌─────────────────────────────────┐
│ Pedido #12345678                │
│                                 │
│ 🏪 Restaurante Don Tacos        │
│ 📍 Calle Principal #123         │
│ 💰 $250.00 MXN                  │
└─────────────────────────────────┘
```

### 3. ETA Badge (solo si IN_TRANSIT o ARRIVED)
```
┌─────────────────────────────────┐
│  ⏱️ Tiempo estimado: 12 minutos │
└─────────────────────────────────┘
```

### 4. Información del Conductor (solo si asignado)
```
┌─────────────────────────────────┐
│  [JD]  Juan Domínguez          │
│        ⭐ 4.8                   │
└─────────────────────────────────┘
```

### 5. Mapa en Tiempo Real (solo IN_TRANSIT y ARRIVED)
```
┌─────────────────────────────────┐
│                                 │
│     🚗 (Conductor)              │
│          \                      │
│           \  Ruta               │
│            \                    │
│             📍 (Tu ubicación)   │
│                                 │
└─────────────────────────────────┘
```
**Funcionalidades:**
- ✅ Ubicación del conductor en tiempo real
- ✅ Ubicación de entrega (destino)
- ✅ Línea mostrando la ruta
- ✅ Auto-zoom para mostrar ambos puntos
- ✅ Actualización cada 10 segundos (Firestore onSnapshot)

### 6. Timeline de Estados
```
┌─────────────────────────────────┐
│ ● ✅ Pendiente            10:30 │
│ │                               │
│ ● ✅ Buscando repartidor  10:32 │
│ │                               │
│ ● ✅ Aceptado             10:35 │
│ │                               │
│ ● ✅ Recogido             10:45 │
│ │                               │
│ ● 🔵 En camino            10:50 │ ← ACTUAL
│ │                               │
│ ○ Llegó a tu ubicación          │
│ │                               │
│ ○ Entregado                     │
└─────────────────────────────────┘
```

**Leyenda:**
- `●` con ✅ = Completado (verde)
- `●` con 🔵 = Estado actual (azul, con animación pulse)
- `○` = Pendiente (gris)

---

## 🔄 Estados del Pedido (OrderStatus)

```typescript
enum OrderStatus {
  PENDING = 'PENDING',          // ⏳ Pendiente
  SEARCHING = 'SEARCHING',      // 🔍 Buscando repartidor
  ASSIGNED = 'ASSIGNED',        // 👤 Repartidor asignado
  ACCEPTED = 'ACCEPTED',        // ✅ Pedido aceptado
  PICKED_UP = 'PICKED_UP',      // 📦 Recogido
  IN_TRANSIT = 'IN_TRANSIT',    // 🚚 En camino      ← TRIGGER WhatsApp
  ARRIVED = 'ARRIVED',          // 📍 En tu ubicación
  DELIVERED = 'DELIVERED',      // 🎉 Entregado
  COMPLETED = 'COMPLETED',      // ✨ Completado
  FAILED = 'FAILED',           // ❌ Fallido
  CANCELLED = 'CANCELLED'       // 🚫 Cancelado
}
```

---

## 🔥 Conexión Firebase (Tiempo Real)

### Configuración Firebase
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBqJxKuoZ8X7X7X7X7X7X7X7X7X7X7X7X7",
  authDomain: "befast-hfkbl.firebaseapp.com",
  projectId: "befast-hfkbl",
  storageBucket: "befast-hfkbl.appspot.com",
  messagingSenderId: "897579485656",
  appId: "1:897579485656:web:abc123def456"
};
```

### Escuchar Cambios del Pedido
```javascript
// Real-time order updates
const unsubscribeOrder = db.collection('orders').doc(orderId)
  .onSnapshot((doc) => {
    if (!doc.exists) {
      showError('Pedido no encontrado');
      return;
    }
    
    const order = { id: doc.id, ...doc.data() };
    updateUI(order);
    
    // Si tiene conductor, escuchar su ubicación
    if (order.driverId) {
      listenToDriverLocation(order.driverId);
    }
  });
```

### Escuchar Ubicación del Conductor
```javascript
// Real-time driver location updates
const unsubscribeDriver = db.collection('drivers').doc(driverId)
  .onSnapshot((doc) => {
    if (!doc.exists) return;
    
    const driver = doc.data();
    const location = driver.operational?.currentLocation;
    
    if (location && map) {
      updateDriverMarkerOnMap(location);
      updateRoute(location, destinationCoords);
    }
    
    // Actualizar info del conductor
    updateDriverInfo({
      name: driver.personalData?.fullName,
      rating: driver.stats?.rating
    });
  });
```

### Cleanup
```javascript
// Limpiar listeners cuando el usuario salga
window.addEventListener('beforeunload', () => {
  if (unsubscribeOrder) unsubscribeOrder();
  if (unsubscribeDriver) unsubscribeDriver();
});
```

---

## 🗺️ Google Maps Integration

### Configuración Básica
```javascript
const map = new google.maps.Map(mapElement, {
  zoom: 14,
  center: deliveryCoordinates,
  styles: [ /* Custom styles */ ]
});
```

### Marcadores
```javascript
// Marcador del conductor (actualiza en tiempo real)
const driverMarker = new google.maps.Marker({
  position: { lat, lng },
  map: map,
  icon: {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 5,
    fillColor: '#667eea',
    fillOpacity: 1
  },
  animation: google.maps.Animation.DROP
});

// Marcador del destino (fijo)
const destinationMarker = new google.maps.Marker({
  position: deliveryCoordinates,
  map: map,
  icon: {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: '#4CAF50',
    fillOpacity: 1
  }
});
```

### Línea de Ruta
```javascript
const routeLine = new google.maps.Polyline({
  path: [driverPosition, destinationPosition],
  strokeColor: '#667eea',
  strokeOpacity: 1.0,
  strokeWeight: 4,
  map: map
});
```

### Auto-Zoom
```javascript
// Ajustar mapa para mostrar ambos marcadores
const bounds = new google.maps.LatLngBounds();
bounds.extend(driverPosition);
bounds.extend(destinationPosition);
map.fitBounds(bounds);
```

---

## ⚡ Funcionalidades Clave

### 1. Actualización Automática
- ✅ Updates cada vez que cambia el documento en Firestore
- ✅ No requiere refresh manual
- ✅ Ubicación del conductor actualiza cada ~10 segundos

### 2. Cálculo de ETA
```javascript
// Si existe estimatedDeliveryTime en order
const eta = new Date(order.estimatedDeliveryTime.toDate());
const now = new Date();
const minutesLeft = Math.round((eta - now) / 60000);

if (minutesLeft > 0) {
  return `${minutesLeft} minutos`;
} else {
  return 'Llegando pronto';
}
```

### 3. Estados Condicionales

**Mostrar Mapa solo si:**
```javascript
(order.status === 'IN_TRANSIT' || order.status === 'ARRIVED') 
&& order.driverId 
&& order.delivery?.coordinates
```

**Mostrar ETA solo si:**
```javascript
order.status === 'IN_TRANSIT' || order.status === 'ARRIVED'
```

**Mostrar Info del Conductor solo si:**
```javascript
order.driverId !== null
```

### 4. Manejo de Errores
```javascript
// Pedido no encontrado
if (!doc.exists) {
  showError('Pedido no encontrado', 'Verifica el link de tracking');
}

// Error de conexión
db.collection('orders').doc(orderId).onSnapshot(
  (doc) => { /* success */ },
  (error) => {
    showError('Error de conexión', 'Por favor recarga la página');
  }
);
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First */
@media (max-width: 600px) {
  .container { padding: 10px; }
  .order-number { font-size: 20px; }
  .map-container { height: 300px; }
}

/* Tablet */
@media (min-width: 601px) and (max-width: 1024px) {
  .container { padding: 20px; }
  .map-container { height: 400px; }
}

/* Desktop */
@media (min-width: 1025px) {
  .container { max-width: 800px; margin: 0 auto; }
  .map-container { height: 500px; }
}
```

---

## 🎨 Colores y Tema (BeFast Brand)

```css
/* Colores principales */
--primary: #667eea;
--primary-dark: #764ba2;
--success: #4CAF50;
--warning: #FFA000;
--error: #FF3B30;
--text: #333333;
--text-secondary: #888888;
--background: #F8F9FA;
--white: #FFFFFF;

/* Gradientes */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

---

## 🔒 Seguridad y Reglas Firestore

### Reglas de Lectura Pública para Tracking
```javascript
// firestore.rules
match /orders/{orderId} {
  // Permitir lectura pública para tracking
  allow read: if true;
  // Escritura solo para usuarios autenticados
  allow write: if request.auth != null;
}

match /drivers/{driverId} {
  // Permitir lectura limitada para tracking (solo operational y stats)
  allow get: if true;
  // Escritura solo para el conductor
  allow write: if request.auth.uid == driverId;
}
```

**⚠️ IMPORTANTE:** Solo se exponen datos necesarios para tracking:
- ✅ Estado del pedido
- ✅ Ubicación del conductor (solo operational.currentLocation)
- ✅ Nombre y rating del conductor
- ❌ **NO** se expone: teléfono del conductor, datos financieros, información sensible

---

## 📋 Checklist de Implementación

### Configuración Inicial
- [ ] Crear ruta `/track/[orderId]` en Next.js
- [ ] Configurar Firebase SDK en la página
- [ ] Configurar Google Maps API

### Funcionalidades Core
- [ ] Obtener orderId de la URL
- [ ] Conectar a Firestore y escuchar cambios
- [ ] Mostrar información básica del pedido
- [ ] Timeline de estados con timestamps
- [ ] Información del conductor (si existe)

### Mapa en Tiempo Real
- [ ] Inicializar Google Maps
- [ ] Marcador de destino (fijo)
- [ ] Marcador de conductor (actualización en tiempo real)
- [ ] Línea de ruta entre conductor y destino
- [ ] Auto-zoom para mostrar ambos puntos

### UI/UX
- [ ] Diseño responsive (mobile-first)
- [ ] Loading states
- [ ] Error states (pedido no encontrado, sin conexión)
- [ ] Animaciones en estado actual
- [ ] ETA badge

### Testing
- [ ] Probar con pedido en estado IN_TRANSIT
- [ ] Verificar updates en tiempo real
- [ ] Probar en mobile y desktop
- [ ] Verificar que el link de WhatsApp funciona

---

## 🧪 Testing URLs

### Ejemplo de URLs de Testing
```
https://befastapp.com/track/abc123xyz789
https://befastapp.com/track/def456uvw012
```

### Casos de Prueba

1. **Pedido en tránsito**
   - Estado: `IN_TRANSIT`
   - Debe mostrar: Mapa, ETA, conductor

2. **Pedido recién creado**
   - Estado: `PENDING` o `SEARCHING`
   - Debe mostrar: Timeline, sin mapa

3. **Pedido entregado**
   - Estado: `DELIVERED` o `COMPLETED`
   - Debe mostrar: Timeline completo, sin mapa

4. **Pedido no encontrado**
   - ID inválido
   - Debe mostrar: Mensaje de error

---

## 🚀 Deploy

### Variables de Entorno
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBqJxKuoZ8X7X7X7X7X7X7X7X7X7X7X7X7
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=befast-hfkbl.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=befast-hfkbl
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=befast-hfkbl.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=897579485656
NEXT_PUBLIC_FIREBASE_APP_ID=1:897579485656:web:abc123def456

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

### Comando de Deploy
```bash
npm run build
npm run deploy
# o
vercel --prod
```

---

## 📞 Soporte

Para cualquier duda sobre la implementación de tracking:
- Documentación completa: `BEFAST_GO_SISTEMA_COMPLETO.md`
- Integración ecosistema: `BEFAST_GO_INTEGRACION_ECOSISTEMA.md`
- Cloud Functions: `functions/src/orderWorkflow.ts`

---

**✨ Última actualización:** Noviembre 6, 2025  
**📱 URL:** befastapp.com/track/[orderId]  
**🔥 Firebase Project:** befast-hfkbl
