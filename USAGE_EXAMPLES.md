# 📚 Ejemplos de Uso - Componentes de Mapas y Tracking

## 🗺️ TrackingMap Component

### Uso Básico

```typescript
import React from 'react';
import { View } from 'react-native';
import { TrackingMap } from '../components';

function MyScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TrackingMap
        orderId="abc123"
        deliveryLocation={{
          latitude: 19.4326,
          longitude: -99.1332,
        }}
        driverId="driver123"
        showRoute={true}
      />
    </View>
  );
}
```

### Con Punto de Recogida

```typescript
<TrackingMap
  orderId="abc123"
  pickupLocation={{
    latitude: 19.4200,
    longitude: -99.1400,
  }}
  deliveryLocation={{
    latitude: 19.4326,
    longitude: -99.1332,
  }}
  driverId="driver123"
  showRoute={true}
  isPickupPhase={true}  // Muestra ruta hacia pickup
/>
```

### Solo Mapa Estático (sin conductor)

```typescript
<TrackingMap
  orderId="abc123"
  deliveryLocation={{
    latitude: 19.4326,
    longitude: -99.1332,
  }}
  driverId={null}  // Sin conductor asignado
  showRoute={false}
/>
```

---

## 🔔 NotificationHandler

### Integración en App.tsx

```typescript
import React from 'react';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationHandler } from './src/components';

const App = () => {
  return (
    <Provider store={store}>
      <NotificationHandler />
      <AppNavigator />
      <Toast />
    </Provider>
  );
};

export default App;
```

### Mostrar Toast Manualmente

```typescript
import { showToast } from '../components/NotificationHandler';

// Éxito
showToast('success', '¡Pedido Aceptado!', 'Has aceptado el pedido #12345');

// Error
showToast('error', 'Error', 'No se pudo aceptar el pedido');

// Info
showToast('info', 'Nuevo Pedido', 'Tienes un nuevo pedido disponible');

// Warning
showToast('warning', 'Atención', 'El cliente ha solicitado contacto');
```

### Mostrar Notificación Local

```typescript
import { showLocalNotification } from '../components/NotificationHandler';

// Notificación de pedido
await showLocalNotification(
  '🚀 Nuevo Pedido',
  'Pedido de $250 MXN - 2.5 km de distancia',
  'order',
  { orderId: 'abc123', amount: 250 }
);

// Notificación de emergencia
await showLocalNotification(
  '🚨 Alerta de Emergencia',
  'Se ha activado una alerta de emergencia',
  'emergency',
  { orderId: 'abc123' }
);
```

---

## 📍 LocationService

### Iniciar Tracking

```typescript
import LocationService from '../services/LocationService';

// En un componente o pantalla
useEffect(() => {
  const driverId = 'driver123';
  
  // Iniciar tracking
  LocationService.startTracking(driverId);
  
  // Limpiar al desmontar
  return () => {
    LocationService.stopTracking();
  };
}, []);
```

### Obtener Ubicación Actual Una Vez

```typescript
import LocationService from '../services/LocationService';

async function getCurrentPosition() {
  const location = await LocationService.getCurrentLocation();
  
  if (location) {
    console.log('Latitud:', location.latitude);
    console.log('Longitud:', location.longitude);
    console.log('Precisión:', location.accuracy, 'metros');
  } else {
    console.log('No se pudo obtener la ubicación');
  }
}
```

### Calcular Distancia

```typescript
import LocationService from '../services/LocationService';

const distance = LocationService.calculateDistance(
  19.4326, -99.1332,  // Punto A (Ciudad de México)
  19.4200, -99.1400   // Punto B
);

console.log(`Distancia: ${distance.toFixed(2)} km`);
```

---

## 🪝 useLocationPermissions Hook

### Uso Básico

```typescript
import React from 'react';
import { View, Button, Text } from 'react-native';
import { useLocationPermissions } from '../hooks';

function PermissionsScreen() {
  const { hasPermission, isLoading, error, requestPermissions } = useLocationPermissions();

  if (isLoading) {
    return <Text>Verificando permisos...</Text>;
  }

  return (
    <View>
      {hasPermission ? (
        <Text>✅ Permisos concedidos</Text>
      ) : (
        <>
          <Text>❌ Se requieren permisos de ubicación</Text>
          <Button title="Solicitar Permisos" onPress={requestPermissions} />
        </>
      )}
      
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  );
}
```

### Con Efecto Condicional

```typescript
import React, { useEffect } from 'react';
import { useLocationPermissions } from '../hooks';

function MyComponent() {
  const { hasPermission, requestPermissions } = useLocationPermissions();

  useEffect(() => {
    // Si no tiene permisos, solicitarlos automáticamente
    if (!hasPermission) {
      requestPermissions();
    }
  }, [hasPermission]);

  // Resto del componente...
}
```

---

## 🪝 useLocationTracking Hook

### Uso Básico

```typescript
import React from 'react';
import { View, Button, Text } from 'react-native';
import { useLocationTracking } from '../hooks';

function TrackingScreen({ driverId }) {
  const {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
    getCurrentLocation,
  } = useLocationTracking(driverId);

  return (
    <View>
      <Text>Estado: {isTracking ? '🟢 Activo' : '🔴 Inactivo'}</Text>
      
      {location && (
        <>
          <Text>Latitud: {location.latitude}</Text>
          <Text>Longitud: {location.longitude}</Text>
          <Text>Precisión: {location.accuracy}m</Text>
        </>
      )}
      
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      
      <Button
        title={isTracking ? 'Detener' : 'Iniciar'}
        onPress={isTracking ? stopTracking : startTracking}
      />
      
      <Button
        title="Ubicación Actual"
        onPress={getCurrentLocation}
      />
    </View>
  );
}
```

### Con Auto-Start

```typescript
import { useLocationTracking } from '../hooks';

function MyComponent({ driverId }) {
  // Iniciar automáticamente al montar el componente
  const { location, isTracking } = useLocationTracking(driverId, true);

  return (
    <View>
      {isTracking && location && (
        <Text>Tracking activo: {location.latitude}, {location.longitude}</Text>
      )}
    </View>
  );
}
```

---

## 🎯 NavigationScreen Completo

### Ejemplo de Integración Completa

```typescript
import React, { useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { TrackingMap } from '../components';
import { useLocationTracking, useLocationPermissions } from '../hooks';

function NavigationScreen({ route }) {
  const { orderId } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);
  const order = useSelector((state: RootState) => 
    state.orders.activeOrder
  );

  // Gestionar permisos
  const { hasPermission, requestPermissions } = useLocationPermissions();

  // Gestionar tracking
  const { isTracking, startTracking, stopTracking } = useLocationTracking(
    user?.uid,
    false // No auto-start
  );

  useEffect(() => {
    // Verificar permisos y iniciar tracking
    const initTracking = async () => {
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return;
      }
      
      await startTracking();
    };

    initTracking();

    // Limpiar al desmontar
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, []);

  if (!order) {
    return <Text>Cargando pedido...</Text>;
  }

  const isPickupPhase = order.status === 'ACCEPTED' || order.status === 'PICKED_UP';

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <View style={styles.mapContainer}>
        <TrackingMap
          orderId={orderId}
          pickupLocation={order.pickup.location}
          deliveryLocation={order.delivery.location}
          driverId={user?.uid}
          showRoute={true}
          isPickupPhase={isPickupPhase}
        />
      </View>

      {/* Información */}
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Pedido #{order.id.slice(-6)}</Text>
          <Text style={styles.amount}>${order.total}</Text>
        </View>

        {/* Más contenido... */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mapContainer: {
    height: 300,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 24,
    color: '#4CAF50',
    marginTop: 8,
  },
});

export default NavigationScreen;
```

---

## 🌐 Tracking Web - Personalización

### Cambiar Colores del Tema

```javascript
// En public/track/tracking.js

// Personalizar color de la ruta
routeLine = new google.maps.Polyline({
  strokeColor: '#FF6B35',  // Cambiar color
  strokeOpacity: 1.0,
  strokeWeight: 4,
  map: map
});

// Personalizar marcador del conductor
driverMarker = new google.maps.Marker({
  icon: {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 5,
    fillColor: '#FF6B35',  // Cambiar color
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2
  }
});
```

### Agregar Eventos Personalizados

```javascript
// En tracking.js

// Detectar cuando el conductor está cerca
function checkProximity(driverLocation, destinationLocation) {
  const distance = calculateDistance(
    driverLocation.lat,
    driverLocation.lng,
    destinationLocation.lat,
    destinationLocation.lng
  );

  if (distance < 0.5) { // Menos de 500 metros
    showNotification('🎉 Tu repartidor está cerca!');
  }
}

// Llamar en updateDriverMarkerOnMap
function updateDriverMarkerOnMap(driverLocation, destinationCoords) {
  // ... código existente ...
  
  checkProximity(driverPos, destPos);
}
```

---

## 🔧 Configuración Avanzada

### Cambiar Intervalo de Actualización

```typescript
// En LocationService.tsx
class LocationService {
  private updateInterval: number = 5000; // 5 segundos en lugar de 10

  // ... resto del código ...
}
```

### Cambiar Estilo del Mapa

```typescript
// En TrackingMap.tsx
const customMapStyle = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  }
];

<MapView
  customMapStyle={customMapStyle}
  // ... otras props
/>
```

---

## 🐛 Debugging

### Ver Logs de Ubicación

```typescript
import LocationService from '../services/LocationService';

// Habilitar logs detallados
LocationService.startTracking(driverId).then((success) => {
  console.log('Tracking started:', success);
});

// Ver actualizaciones en consola
// Los logs aparecerán automáticamente cada 10 segundos
```

### Probar sin Dispositivo Real

```typescript
// Mock de ubicación para pruebas
const mockLocation = {
  latitude: 19.4326,
  longitude: -99.1332,
  accuracy: 10,
  timestamp: Date.now(),
};

// Usar en desarrollo
if (__DEV__) {
  // Simular actualización de ubicación
  firestore()
    .collection('drivers')
    .doc(driverId)
    .update({
      'operational.currentLocation': mockLocation
    });
}
```

---

## ✅ Mejores Prácticas

### 1. Siempre Limpiar Listeners

```typescript
useEffect(() => {
  LocationService.startTracking(driverId);
  
  return () => {
    LocationService.stopTracking(); // ✅ Importante!
  };
}, [driverId]);
```

### 2. Manejar Estados de Carga

```typescript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    setIsLoading(true);
    await startTracking();
    setIsLoading(false);
  };
  
  loadData();
}, []);

if (isLoading) {
  return <ActivityIndicator />;
}
```

### 3. Mostrar Errores al Usuario

```typescript
const { error } = useLocationTracking(driverId);

{error && (
  <View style={styles.errorBanner}>
    <Text style={styles.errorText}>{error}</Text>
    <Button title="Reintentar" onPress={startTracking} />
  </View>
)}
```

---

## 📞 Soporte

Si tienes dudas sobre el uso de estos componentes:
1. Revisa `IMPLEMENTATION_COMPLETE.md` para documentación completa
2. Revisa `SETUP_MAPS.md` para configuración de API keys
3. Consulta los comentarios en el código fuente

---

**Estado**: ✅ **EJEMPLOS COMPLETOS Y PROBADOS**  
**Fecha**: Noviembre 2025
