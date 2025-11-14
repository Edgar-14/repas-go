// Importar el tipo Timestamp de Firestore
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export enum OrderStatus {
PENDING = 'PENDING',
CREATED = 'CREATED',
SEARCHING = 'SEARCHING',
ASSIGNED = 'ASSIGNED',
ACCEPTED = 'ACCEPTED',
STARTED = 'STARTED',
PICKED_UP = 'PICKED_UP',
IN_TRANSIT = 'IN_TRANSIT',
ARRIVED = 'ARRIVED',
DELIVERED = 'DELIVERED',
COMPLETED = 'COMPLETED',
FAILED = 'FAILED',
CANCELLED = 'CANCELLED',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
[OrderStatus.PENDING]: 'Pendiente',
[OrderStatus.CREATED]: 'Creado',
[OrderStatus.SEARCHING]: 'Buscando repartidor',
[OrderStatus.ASSIGNED]: 'Asignado',
[OrderStatus.ACCEPTED]: 'Aceptado',
[OrderStatus.STARTED]: 'En camino al restaurante',
[OrderStatus.PICKED_UP]: 'Recogido',
[OrderStatus.IN_TRANSIT]: 'En camino al cliente',
[OrderStatus.ARRIVED]: 'En el destino',
[OrderStatus.DELIVERED]: 'Entregado',
[OrderStatus.COMPLETED]: 'Completado',
[OrderStatus.FAILED]: 'Fallido',
[OrderStatus.CANCELLED]: 'Cancelado',
};

// --- Interfaces de Sub-documentos ---

export interface LatLng {
lat: number;
lng: number;
}

export interface OrderPricing {
subtotal: number;
deliveryFee: number;
tip: number;
tax: number;
discount: number;
totalAmount: number;
}

// Reemplazar 'any' con tipos específicos de Timestamp o Date
export interface OrderTiming {
createdAt: FirebaseFirestoreTypes.Timestamp | Date;
expectedPickupTime?: FirebaseFirestoreTypes.Timestamp | Date;
expectedDeliveryTime: FirebaseFirestoreTypes.Timestamp | Date;
assignedAt?: FirebaseFirestoreTypes.Timestamp | Date;
acceptedAt?: FirebaseFirestoreTypes.Timestamp | Date;
startedAt?: FirebaseFirestoreTypes.Timestamp | Date;
pickedUpAt?: FirebaseFirestoreTypes.Timestamp | Date;
arrivedAt?: FirebaseFirestoreTypes.Timestamp | Date;
deliveredAt?: FirebaseFirestoreTypes.Timestamp | Date;
completedAt?: FirebaseFirestoreTypes.Timestamp | Date;
}

export interface OrderLogistics {
distance: number; // en kilómetros
estimatedDuration: number; // en minutos
actualDuration?: number;
}

export interface OrderCustomer {
name: string;
address: string;
phoneNumber: string;
email?: string;
coordinates: LatLng;
deliveryInstructions?: string;
}

export interface OrderRestaurant {
name: string;
address: string;
phoneNumber: string;
coordinates: LatLng;
pickupInstructions?: string;
}

export interface OrderItem {
name: string;
quantity: number;
unitPrice: number;
notes?: string;
}

export interface OrderProofOfDelivery {
photoUrl: string;
signature?: string;
customerPin?: string;
deliveryNotes?: string;
}

export interface OrderRating {
score: number; // e.g., 1-5
comment?: string;
ratedAt: FirebaseFirestoreTypes.Timestamp | Date;
}

export interface ShipdayInfo {
orderId: number;
status: string;
lastSync: FirebaseFirestoreTypes.Timestamp | Date;
}

// --- Documento Principal de la Orden ---

export interface OrderDocument {
id: string;
orderNumber: string;
businessId: string;
source: 'BEFAST_DELIVERY' | 'BEFAST_MARKET';
status: OrderStatus;
assignedDriverId: string | null;
customer: OrderCustomer;
restaurant: OrderRestaurant;
items: OrderItem[];
pricing: OrderPricing;
paymentMethod: 'CASH' | 'CARD';
timing: OrderTiming;
logistics: OrderLogistics;
proofOfDelivery?: OrderProofOfDelivery;
rating?: OrderRating;
shipday?: ShipdayInfo;
}

// --- Adaptador para Componentes Antiguos (Legacy) ---

/**
* Define la estructura de datos que esperan los componentes más antiguos
* (ej. TrackingMap, paneles de información del conductor).
*/
export interface LegacyOrderLocation {
latitude: number;
longitude: number;
}

export interface LegacyOrder {
id: string;
status: OrderStatus;
earnings: number;
payment: {
method: 'TARJETA' | 'EFECTIVO';
tip: number;
};
distance: number;
pickup: {
name: string;
location?: LegacyOrderLocation;
};
customer: {
name: string;
location?: LegacyOrderLocation;
};
timestamps: {
created: Date; // Aseguramos que sea un objeto Date
};
driverId: string | null;
_raw: OrderDocument; // Incluimos el documento original
}

/**
* Convierte un OrderDocument (nueva estructura de Firestore) a la estructura
* que esperan los componentes legacy (ej. pickup.location con latitude/longitude).
* También se encarga de convertir Timestamps de Firestore a objetos Date.
*/
export function adaptOrderForLegacy(order: OrderDocument): LegacyOrder {
  const pickupLocation = order.restaurant?.coordinates
    ? {
        latitude: order.restaurant.coordinates.lat,
        longitude: order.restaurant.coordinates.lng,
      }
    : undefined;

  const deliveryLocation = order.customer?.coordinates
    ? {
        latitude: order.customer.coordinates.lat,
        longitude: order.customer.coordinates.lng,
      }
    : undefined;

  // Convertir createdAt (Timestamp o Date) a un objeto Date
  let createdDate: Date;
  const rawCreated = order.timing?.createdAt;

  if (rawCreated && typeof (rawCreated as any).toDate === 'function') {
    // Es un Timestamp de Firestore
    createdDate = (rawCreated as FirebaseFirestoreTypes.Timestamp).toDate();
  } else if (rawCreated instanceof Date) {
    // Ya es un objeto Date
    createdDate = rawCreated;
  } else {
    // Fallback por si es un string u otro tipo (aunque no debería)
    createdDate = rawCreated ? new Date(rawCreated) : new Date();
  }

  return {
    id: order.id,
    status: order.status,
    earnings: order.pricing?.totalAmount ?? 0,
    payment: {
      method: order.paymentMethod === 'CARD' ? 'TARJETA' : 'EFECTIVO',
      tip: order.pricing?.tip ?? 0,
    },
    distance: order.logistics?.distance ?? 0,
    pickup: {
      name: order.restaurant?.name ?? 'Restaurante',
      location: pickupLocation,
    },
    customer: {
      name: order.customer?.name ?? 'Cliente',
      location: deliveryLocation,
    },
    timestamps: {
      created: createdDate, // Usamos la fecha convertida
    },
    driverId: order.assignedDriverId,
    _raw: order,
  };
}