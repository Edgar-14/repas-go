// Colecciones de Firestore para datos de Shipday
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, setDoc, Timestamp } from 'firebase/firestore';

// =================
// INTERFACES PARA SHIPDAY
// =================

export interface ShipdayOrderData {
  // Datos básicos
  shipdayOrderId: string;
  orderNumber: string;
  companyId: number;
  
  // Información del pedido
  orderItem: string;
  accepted: boolean;
  placementTime: string;
  requestedPickupTime: string;
  requestedDeliveryTime: string;
  assignedTime?: string;
  startTime?: string;
  pickedupTime?: string;
  arrivedTime?: string;
  deliveryTime?: string;
  failedDeliveryTime?: string | null;
  
  // Notas e instrucciones
  deliveryNote: string;
  deliveryInstruction?: string | null;
  dispatcherNote?: string | null;
  
  // Información de pago
  paymentMethod?: string | null;
  orderSource: string;
  incomplete: boolean;
  
  // Costos
  orderTotal: number;
  deliveryFee: number;
  tip: number;
  discount: number;
  tax: number;
  driverPayment: number;
  distance: number;
  
  // Información del repartidor
  carrier: {
    id: number;
    name: string;
    phone: string;
    email: string;
    status: string;
    vehiclePlateNumber: string;
    vehicleDescription: string;
    note: string;
    imageUrl: string;
    partner: string;
  };
  
  // Información de recogida
  pickup: {
    id: number;
    name: string;
    address: string;
    formattedAddress: string;
    phone: string;
    lat: number;
    lng: number;
  };
  
  // Información de entrega
  delivery: {
    id: number;
    name: string;
    address: string;
    formattedAddress: string;
    phone: string;
    email?: string;
    lat: number;
    lng: number;
  };
  
  // Estado
  status: string;
  
  // Metadatos de sincronización
  lastSyncedAt: Timestamp;
  syncStatus: 'synced' | 'pending' | 'error';
  syncError?: string;
  
  // Timestamps de BeFast
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Interface para Carrier (Conductor) de Shipday
 * IMPORTANTE: En Shipday se llaman "carriers" NO "drivers" - Ver docs/shipday.md líneas 25-29 y 238-254
 */
export interface ShipdayCarrierData {
  // Datos básicos del carrier según shipday.md
  shipdayCarrierId: number;  // ID del carrier en Shipday
  personalId: string | null;
  name: string;
  codeName: string | null;
  phoneNumber: string;
  companyId: number | null;
  areaId: number | null;
  isOnShift: boolean | null;
  email: string | null;
  carrierPhoto: string;
  isActive: boolean | null;
  
  // Ubicación del carrier
  carrierLocationLat?: number;
  carrierLocationLng?: number;
  
  // Metadatos de sincronización
  lastSyncedAt: Timestamp;
  syncStatus: 'synced' | 'pending' | 'error';
  syncError?: string;
  
  // Timestamps de BeFast
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * @deprecated Usar ShipdayCarrierData en su lugar
 * Mantener por compatibilidad con código existente
 */
export type ShipdayDriverData = ShipdayCarrierData;

// =================
// FUNCIONES DE SINCRONIZACIÓN
// =================

export async function syncShipdayOrderToFirestore(orderData: any): Promise<void> {
  try {
    const orderRef = doc(db, 'shipdayOrders', `shipday-${orderData.orderId}`);
    
    const shipdayOrder: ShipdayOrderData = {
      // Datos básicos
      shipdayOrderId: orderData.orderId.toString(),
      orderNumber: orderData.orderNumber,
      companyId: orderData.companyId,
      
      // Información del pedido
      orderItem: orderData.orderItem,
      accepted: orderData.accepted,
      placementTime: orderData.placementTime,
      requestedPickupTime: orderData.requestedPickupTime,
      requestedDeliveryTime: orderData.requestedDeliveryTime,
      assignedTime: orderData.assignedTime,
      startTime: orderData.startTime,
      pickedupTime: orderData.pickedupTime,
      arrivedTime: orderData.arrivedTime,
      deliveryTime: orderData.deliveryTime,
      failedDeliveryTime: orderData.failedDeliveryTime,
      
      // Notas e instrucciones
      deliveryNote: orderData.deliveryNote,
      deliveryInstruction: orderData.deliveryInstruction,
      dispatcherNote: orderData.dispatcherNote,
      
      // Información de pago
      paymentMethod: orderData.paymentMethod,
      orderSource: orderData.orderSource,
      incomplete: orderData.incomplete,
      
      // Costos
      orderTotal: orderData.orderTotal,
      deliveryFee: orderData.deliveryFee,
      tip: orderData.tip,
      discount: orderData.discount,
      tax: orderData.tax,
      driverPayment: orderData.driverPayment,
      distance: orderData.distance,
      
      // Información del repartidor
      carrier: orderData.carrier,
      
      // Información de recogida
      pickup: orderData.pickup,
      
      // Información de entrega
      delivery: orderData.delivery,
      
      // Estado
      status: orderData.status,
      
      // Metadatos de sincronización
      lastSyncedAt: Timestamp.now(),
      syncStatus: 'synced',
      
      // Timestamps de BeFast
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(orderRef, shipdayOrder, { merge: true });
    
    console.log(`✅ Pedido de Shipday sincronizado: ${orderData.orderNumber}`);
  } catch (error) {
    console.error('❌ Error sincronizando pedido de Shipday:', error);
    throw error;
  }
}

/**
 * Sincroniza un carrier (conductor) de Shipday a Firestore
 * IMPORTANTE: En Shipday se llaman "carriers" NO "drivers"
 */
export async function syncShipdayCarrierToFirestore(carrierData: any): Promise<void> {
  try {
    const carrierRef = doc(db, 'shipdayCarriers', `shipday-${carrierData.id}`);
    
    const shipdayCarrier: ShipdayCarrierData = {
      // Datos básicos del carrier según shipday.md
      shipdayCarrierId: carrierData.id,
      personalId: carrierData.personalId,
      name: carrierData.name,
      codeName: carrierData.codeName,
      phoneNumber: carrierData.phoneNumber,
      companyId: carrierData.companyId,
      areaId: carrierData.areaId,
      isOnShift: carrierData.isOnShift,
      email: carrierData.email,
      carrierPhoto: carrierData.carrierPhoto,
      isActive: carrierData.isActive,
      
      // Ubicación del carrier
      carrierLocationLat: carrierData.carrierLocationLat,
      carrierLocationLng: carrierData.carrierLocationLng,
      
      // Metadatos de sincronización
      lastSyncedAt: Timestamp.now(),
      syncStatus: 'synced',
      
      // Timestamps de BeFast
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(carrierRef, shipdayCarrier, { merge: true });
    
    console.log(`✅ Carrier (conductor) de Shipday sincronizado: ${carrierData.name}`);
  } catch (error) {
    console.error('❌ Error sincronizando carrier de Shipday:', error);
    throw error;
  }
}

/**
 * @deprecated Usar syncShipdayCarrierToFirestore en su lugar
 */
export const syncShipdayDriverToFirestore = syncShipdayCarrierToFirestore;

// =================
// FUNCIONES DE SINCRONIZACIÓN MASIVA
// =================

export async function syncAllShipdayOrders(orders: any[]): Promise<{ success: number; errors: any[] }> {
  const results = { success: 0, errors: [] as any[] };
  
  for (const order of orders) {
    try {
      await syncShipdayOrderToFirestore(order);
      results.success++;
    } catch (error) {
      results.errors.push({
        orderId: order.orderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}

/**
 * Sincroniza todos los carriers (conductores) de Shipday
 * IMPORTANTE: En Shipday se llaman "carriers" NO "drivers"
 */
export async function syncAllShipdayCarriers(carriers: any[]): Promise<{ success: number; errors: any[] }> {
  const results = { success: 0, errors: [] as any[] };
  
  for (const carrier of carriers) {
    try {
      await syncShipdayCarrierToFirestore(carrier);
      results.success++;
    } catch (error) {
      results.errors.push({
        carrierId: carrier.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}

/**
 * @deprecated Usar syncAllShipdayCarriers en su lugar
 */
export const syncAllShipdayDrivers = syncAllShipdayCarriers;
