# Ejemplos de Código - Adaptación de Sistema de Mapas

## 1. MapService.ts - Servicio Principal

```typescript
// src/services/MapService.ts
import { GoogleMapsAPI } from '@react-native-maps';
import firestore from '@react-native-firebase/firestore';
import Geolocation from 'react-native-geolocation-service';

export interface RouteInfo {
  distance: number;
  duration: number;
  polyline: string;
  directions: DirectionStep[];
}

export interface DirectionStep {
  instruction: string;
  distance: number;
}

export class MapService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Obtiene direcciones entre dos puntos
   */
  async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteInfo> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origin.lat},${origin.lng}&` +
        `destination=${destination.lat},${destination.lng}&` +
        `key=${this.apiKey}`
      );

      const data = await response.json();
      
      if (data.routes.length === 0) {
        throw new Error('No routes found');
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value, // en metros
        duration: leg.duration.value, // en segundos
        polyline: route.overview_polyline.points,
        directions: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.value
        }))
      };
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }

  /**
   * Obtiene ubicación actual del driver
   */
  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  }

  /**
   * Monitorea ubicación en tiempo real
   */
  watchLocation(callback: (location: { lat: number; lng: number }) => void) {
    return Geolocation.watchPosition(
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => console.error('Error watching location:', error),
      { enableHighAccuracy: true, distanceFilter: 10 } // actualiza cada 10m
    );
  }

  /**
   * Guarda ubicación del driver en Firebase (tracking real-time)
   */
  async updateDriverLocation(driverId: string, location: { lat: number; lng: number }) {
    try {
      await firestore()
        .collection('drivers')
        .doc(driverId)
        .update({
          currentLocation: new firestore.GeoPoint(location.lat, location.lng),
          lastLocationUpdate: firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  }

  /**
   * Obtiene direcciones inteligentes (cercanas para búsquedas de puntos de referencia)
   */
  async searchNearbyPlaces(
    location: { lat: number; lng: number },
    query: string,
    radius: number = 1000
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${location.lat},${location.lng}&` +
        `radius=${radius}&` +
        `keyword=${encodeURIComponent(query)}&` +
        `key=${this.apiKey}`
      );

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching nearby places:', error);
      throw error;
    }
  }
}

export default MapService;
```

---

## 2. NavigationScreen.tsx - Pantalla Mejorada

```typescript
// src/screens/NavigationScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapService, { RouteInfo } from '../services/MapService';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';

interface Order {
  id: string;
  pickup: { address: string; lat: number; lng: number };
  delivery: { address: string; lat: number; lng: number };
  status: string;
}

const NavigationScreen: React.FC = () => {
  const route = useRoute<any>();
  const { orderId } = route.params || {};
  
  const [order, setOrder] = useState<Order | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [currentLocation, setCurrentLocation] = useState({ lat: 0, lng: 0 });
  const [loading, setLoading] = useState(true);
  const [mapService] = useState(() => new MapService('YOUR_GOOGLE_MAPS_API_KEY'));

  const driverId = useSelector((state: any) => state.auth.user?.id);

  useEffect(() => {
    // Obtener datos de la orden
    const loadOrder = async () => {
      // TODO: Cargar orden desde Firebase
      // const orderData = await firestore().collection('orders').doc(orderId).get();
      // setOrder(orderData.data() as Order);
    };

    loadOrder();
  }, [orderId]);

  useEffect(() => {
    // Obtener ubicación inicial y direcciones
    const setupNavigation = async () => {
      try {
        if (!order) return;

        setLoading(true);
        const location = await mapService.getCurrentLocation();
        setCurrentLocation(location);

        // Obtener direcciones de recolección a entrega
        const directions = await mapService.getDirections(
          order.pickup,
          order.delivery
        );
        setRouteInfo(directions);
      } catch (error) {
        console.error('Error setting up navigation:', error);
      } finally {
        setLoading(false);
      }
    };

    setupNavigation();
  }, [order]);

  useEffect(() => {
    // Monitorear ubicación en tiempo real
    const watchId = mapService.watchLocation(async (location) => {
      setCurrentLocation(location);
      
      // Actualizar ubicación en Firebase cada 10 segundos
      if (driverId) {
        await mapService.updateDriverLocation(driverId, location);
      }
    });

    return () => {
      // Limpiar al desmontar
      Geolocation.clearWatch(watchId);
    };
  }, [driverId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Decodificar polyline para el mapa
  const decodePolyline = (encoded: string) => {
    // Implementación estándar de decodificación de polyline de Google
    // Simplificado aquí - usar librería si es necesario
    return [];
  };

  const polylineCoordinates = routeInfo ? decodePolyline(routeInfo.polyline) : [];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Marcador: Ubicación actual del driver */}
        <Marker
          coordinate={currentLocation}
          title="Tu ubicación"
          pinColor="blue"
        />

        {/* Marcador: Punto de recolección */}
        {order && (
          <Marker
            coordinate={{
              latitude: order.pickup.lat,
              longitude: order.pickup.lng,
            }}
            title="Recolección"
            description={order.pickup.address}
            pinColor="green"
          />
        )}

        {/* Marcador: Punto de entrega */}
        {order && (
          <Marker
            coordinate={{
              latitude: order.delivery.lat,
              longitude: order.delivery.lng,
            }}
            title="Entrega"
            description={order.delivery.address}
            pinColor="red"
          />
        )}

        {/* Ruta */}
        {polylineCoordinates.length > 0 && (
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor="#4285F4"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Información de la ruta */}
      {routeInfo && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeText}>
            Distancia: {(routeInfo.distance / 1000).toFixed(1)} km
          </Text>
          <Text style={styles.routeText}>
            Tiempo estimado: {Math.round(routeInfo.duration / 60)} min
          </Text>
        </View>
      )}

      {/* Botones de acción */}
      <View style={styles.actions}>
        <Button
          title="Marcar como Recogido"
          onPress={() => {
            // TODO: Actualizar estado de orden
          }}
        />
        <Button
          title="Marcar como Entregado"
          onPress={() => {
            // TODO: Actualizar estado de orden
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  routeInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  routeText: {
    fontSize: 14,
    marginBottom: 8,
  },
  actions: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
});

export default NavigationScreen;
```

---

## 3. MapAssistant.tsx - Chat Inteligente

```typescript
// src/components/chat/MapAssistant.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import { useGemini } from '../../hooks/useGemini'; // Necesita ser creado
import { geminiService } from '../../services/geminiService';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const MapAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Llamar a Gemini con contexto de mapas
      const response = await geminiService.chat(inputText, {
        systemInstruction: `Eres un asistente de navegación para conductores de BeFast GO.
Ayuda con preguntas sobre rutas, ubicaciones, y direcciones.
Sé conciso y útil.`,
        context: {
          currentOrder: 'ID_ORDEN_ACTUAL', // TODO: Obtener de estado
          driverId: 'ID_DRIVER', // TODO: Obtener de estado
        }
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.messagesContainer}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.message,
              msg.type === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
          >
            <Text style={styles.messageText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Pregunta sobre tu ruta..."
          value={inputText}
          onChangeText={setInputText}
          editable={!loading}
        />
        <Button
          title="Enviar"
          onPress={handleSend}
          disabled={loading || !inputText.trim()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  message: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4285F4',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 14,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
});

export default MapAssistant;
```

---

## 4. Actualizar geminiService.ts

```typescript
// Agregar al src/services/geminiService.ts existente

const MAPS_SYSTEM_INSTRUCTION = `You are a helpful and proactive AI assistant for drivers using the BeFast GO logistics app. Your name is Vertex. Your purpose is to help drivers manage their deliveries efficiently, maximize their earnings, and resolve any issues they encounter on the road.

Your capabilities include:
- Providing order details (pickup/delivery addresses, items, special instructions).
- Helping with navigation and finding optimal routes.
- Answering questions about earnings, wallet balance, and payments.
- Explaining the incentive and gamification system (points, levels, bonuses).
- Assisting with compliance questions, especially regarding IMSS documentation (Acta IDSE).
- Providing support for in-app features and troubleshooting common problems.
- Giving proactive tips, like demand hotspots or advice on parking.

Key aspects of the BeFast GO ecosystem to be aware of:
- **Orders**: Come from "BeFast Delivery" (mostly cash) and "BeFast Market" (card/cash).
- **Wallet**: Drivers have a digital wallet. They accrue debt for cash orders (commission). Propinas (tips) are 100% for the driver.
- **Compliance**: An approved Acta IDSE (IMSS document) is MANDATORY to receive orders.
- **Performance**: Key metrics are acceptance rate (>=85%), on-time delivery (>=90%), and customer rating (>=4.2). Performance affects driver level (Bronze, Silver, Diamond) and access to benefits.
- **Incentives**: A points-based system rewards drivers for completing orders, logging in daily, and working during peak hours. Points can be lost for reassignments or cancellations.
- **Security**: The app has a panic button and other safety features.

Always be friendly, concise, and supportive. The user is in Colima, Mexico, so communicate in Spanish. Help the driver feel confident and successful.`;

export async function chatWithMapContext(
  userMessage: string,
  context?: {
    currentOrder?: any;
    driverId?: string;
    currentLocation?: { lat: number; lng: number };
  }
): Promise<string> {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: MAPS_SYSTEM_INSTRUCTION,
    },
  });

  const contextMessage = context
    ? `
Context information:
- Driver ID: ${context.driverId}
- Current Location: ${context.currentLocation?.lat}, ${context.currentLocation?.lng}
- Current Order: ${context.currentOrder ? JSON.stringify(context.currentOrder) : 'None'}

User message: ${userMessage}
`
    : userMessage;

  const response = await chat.sendMessage(contextMessage);
  return response.text();
}
```

---

## 5. package.json - Dependencias Necesarias

```json
{
  "dependencies": {
    "react-native-maps": "^1.13.0",
    "react-native-geolocation-service": "^5.3.2",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "polyline-encoded": "^0.0.9"
  }
}
```

**Instalación:**
```bash
npm install react-native-maps react-native-geolocation-service polyline-encoded
cd ios && pod install && cd ..
```

---

## 6. Hook useSmartMap.ts

```typescript
// src/hooks/useSmartMap.ts
import { useState, useCallback } from 'react';
import MapService, { RouteInfo } from '../services/MapService';

interface SmartMapState {
  routeInfo: RouteInfo | null;
  currentLocation: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
}

export function useSmartMap(apiKey: string) {
  const [state, setState] = useState<SmartMapState>({
    routeInfo: null,
    currentLocation: null,
    loading: false,
    error: null,
  });

  const mapService = new MapService(apiKey);

  const getRoute = useCallback(
    async (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number }
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const route = await mapService.getDirections(origin, destination);
        setState((prev) => ({ ...prev, routeInfo: route, loading: false }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
      }
    },
    []
  );

  const getCurrentLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const location = await mapService.getCurrentLocation();
      setState((prev) => ({ ...prev, currentLocation: location, loading: false }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, []);

  return {
    ...state,
    getRoute,
    getCurrentLocation,
  };
}
```

---

## ✅ Pasos Siguientes

1. **Copiar y adaptar** `MapService.ts` a tu proyecto
2. **Actualizar** `NavigationScreen.tsx` con el componente de mapa
3. **Instalar dependencias** de React Native Maps
4. **Configurar API key** de Google Maps
5. **Integrar chat** de IA para contexto de mapas


