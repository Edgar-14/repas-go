# 🔧 BeFast GO - Configuración Completa de Integración

**Versión**: 1.0  
**Fecha**: Enero 2025  
**Propósito**: Configuración completa para conectar BeFast GO al Ecosistema BeFast existente

---

## 🎯 CONFIGURACIÓN FIREBASE COMPLETA

### 1. Proyecto Firebase (Mismo Proyecto)
```typescript
// firebase.config.ts
const firebaseConfig = {
  apiKey: "AIzaSyBqJxKuoZ8X7X7X7X7X7X7X7X7X7X7X7X7",
  authDomain: "befast-hfkbl.firebaseapp.com",
  projectId: "befast-hfkbl",
  storageBucket: "befast-hfkbl.appspot.com",
  messagingSenderId: "897579485656",
  appId: "1:897579485656:android:abc123def456",
  measurementId: "G-XXXXXXXXXX"
};

import { initializeApp } from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import storage from '@react-native-firebase/storage';

const app = initializeApp(firebaseConfig);
export { firestore, auth, functions, messaging, storage };
```

---

## 📊 COLECCIONES COMPLETAS DE FIRESTORE

### Todas las Colecciones del Ecosistema
```typescript
// collections.ts
export const COLLECTIONS = {
  // Conductores
  DRIVERS: 'drivers',
  DRIVER_APPLICATIONS: 'driverApplications',
  
  // Pedidos
  ORDERS: 'orders',
  ORDER_TIMELINE: 'orderTimeline',
  
  // Financiero
  WALLET_TRANSACTIONS: 'walletTransactions',
  CREDIT_TRANSACTIONS: 'creditTransactions',
  
  // Negocios
  BUSINESSES: 'businesses',
  
  // Sistema
  SYSTEM_LOGS: 'systemLogs',
  AUDIT_LOGS: 'auditLogs',
  
  // Shipday (Integración)
  SHIPDAY_DRIVERS: 'shipdayDrivers',
  SHIPDAY_ORDERS: 'shipdayOrders',
  SHIPDAY_WEBHOOK_LOGS: 'shipdayWebhookLogs',
  
  // Usuarios
  USERS: 'users'
};
```

### Estructura Completa de Documentos

#### **drivers/{driverId}**
```typescript
interface Driver {
  // Identificación
  uid: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  rfc: string;
  curp: string;
  nss: string;
  
  // Datos personales
  personalInfo: {
    dateOfBirth: string;
    address: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  
  // Vehículo
  vehicle: {
    type: 'AUTO' | 'MOTO' | 'BICICLETA' | 'PIE';
    brand?: string;
    model?: string;
    year?: number;
    licensePlate?: string;
  };
  
  // Estado operativo
  operational: {
    status: 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'BREAK';
    isOnline: boolean;
    currentLocation: {
      latitude: number;
      longitude: number;
      timestamp: Timestamp;
    };
    lastUpdate: Timestamp;
  };
  
  // Billetera
  wallet: {
    balance: number;
    pendingDebts: number;
    creditLimit: number;
    lastTransaction: Timestamp;
  };
  
  // Validación crítica
  administrative: {
    befastStatus: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED';
    idseApproved: boolean;
    imssStatus: 'ACTIVO_COTIZANDO' | 'PENDING' | 'INACTIVE';
    documentsStatus: 'APPROVED' | 'PENDING' | 'EXPIRED';
    onboardingDate: Timestamp;
  };
  
  // Estadísticas
  stats: {
    totalOrders: number;
    completedOrders: number;
    rating: number;
    totalEarnings: number;
  };
  
  // KPIs
  kpis: {
    acceptanceRate: number;
    completionRate: number;
    onTimeDeliveryRate: number;
    averageDeliveryTime: number;
  };
  
  // Documentos
  documents: {
    ine: { url: string; status: string; uploadedAt: Timestamp };
    license: { url: string; status: string; uploadedAt: Timestamp };
    rfc: { url: string; status: string; uploadedAt: Timestamp };
    curp: { url: string; status: string; uploadedAt: Timestamp };
    bankAccount: { url: string; status: string; uploadedAt: Timestamp };
  };
  
  // FCM
  fcmToken?: string;
  lastTokenUpdate?: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### **orders/{orderId}**
```typescript
interface Order {
  // Identificación
  orderNumber: string;
  businessId: string;
  source: 'BEFAST_DELIVERY' | 'BEFAST_MARKET';
  
  // Estado
  status: 'PENDING' | 'CREATED' | 'SEARCHING' | 'ASSIGNED' | 'ACCEPTED' | 'STARTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  assignedDriverId: string | null;
  
  // Datos del cliente
  customer: {
    name: string;
    address: string;
    phoneNumber: string;
    email?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    deliveryInstructions?: string;
  };
  
  // Datos del restaurante/negocio
  restaurant: {
    name: string;
    address: string;
    phoneNumber: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    pickupInstructions?: string;
  };
  
  // Items del pedido
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
  
  // Financiero
  pricing: {
    subtotal: number;
    deliveryFee: number;
    tip: number;
    tax: number;
    discount: number;
    totalAmount: number;
  };
  
  paymentMethod: 'CASH' | 'CARD';
  
  // Tiempos
  timing: {
    createdAt: Timestamp;
    expectedPickupTime?: Timestamp;
    expectedDeliveryTime: Timestamp;
    assignedAt?: Timestamp;
    acceptedAt?: Timestamp;
    startedAt?: Timestamp;
    pickedUpAt?: Timestamp;
    arrivedAt?: Timestamp;
    deliveredAt?: Timestamp;
    completedAt?: Timestamp;
  };
  
  // Distancia y duración
  logistics: {
    distance: number;
    estimatedDuration: number;
    actualDuration?: number;
  };
  
  // Prueba de entrega
  proofOfDelivery?: {
    photoUrl: string;
    signature?: string;
    customerPin?: string;
    deliveryNotes?: string;
  };
  
  // Calificación
  rating?: {
    score: number;
    comment?: string;
    ratedAt: Timestamp;
  };
  
  // Shipday (si aplica)
  shipday?: {
    orderId: number;
    status: string;
    lastSync: Timestamp;
  };
}
```

#### **walletTransactions/{transactionId}**
```typescript
interface WalletTransaction {
  // Identificación
  driverId: string;
  orderId?: string;
  
  // Tipo de transacción
  type: 'CARD_ORDER_TRANSFER' | 'CASH_ORDER_ADEUDO' | 'TIP_CARD_TRANSFER' | 'DEBT_PAYMENT' | 'BENEFITS_TRANSFER' | 'ADJUSTMENT' | 'PENALTY' | 'BONUS';
  
  // Montos
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  
  // Descripción
  description: string;
  notes?: string;
  
  // Metadata
  metadata?: {
    paymentMethod?: string;
    orderNumber?: string;
    businessName?: string;
  };
  
  // Timestamps
  timestamp: Timestamp;
  processedAt: Timestamp;
}
```

---

## ⚡ CLOUD FUNCTIONS COMPLETAS

### Todas las Funciones Disponibles
```typescript
// services/CloudFunctions.ts
export const CLOUD_FUNCTIONS = {
  // Autenticación
  handleAuthOperations: 'handleAuthOperations',
  verifyEmail: 'verifyEmail',
  generateVerificationCode: 'generateVerificationCode',
  resendVerificationCode: 'resendVerificationCode',
  
  // Pedidos
  createOrder: 'createOrder',
  validateOrderAssignment: 'validateOrderAssignment',
  processOrderCompletion: 'processOrderCompletion',
  handleOrderWorkflow: 'handleOrderWorkflow',
  onOrderCompleted: 'onOrderCompleted',
  
  // Conductores
  updateDriverStatus: 'updateDriverStatus',
  processDriverApplication: 'processDriverApplication',
  syncDriverToShipday: 'syncDriverToShipday',
  
  // Financiero
  processPayment: 'processPayment',
  transferBenefits: 'transferBenefits',
  manageFinancialOperationsConsolidated: 'manageFinancialOperationsConsolidated',
  classifyDriversMonthly: 'classifyDriversMonthly',
  generateIDSE: 'generateIDSE',
  processMonthlyPayroll: 'processMonthlyPayroll',
  
  // Shipday
  handleShipdayWebhook: 'handleShipdayWebhook',
  requestShipdaySync: 'requestShipdaySync',
  retryFailedWebhooks: 'retryFailedWebhooks',
  
  // Vertex AI
  businessChatbot: 'businessChatbot',
  driverChatbot: 'driverChatbot',
  adminChatbot: 'adminChatbot',
  processDriverDocuments: 'processDriverDocuments',
  auditFinancialTransaction: 'auditFinancialTransaction'
};
```

### Implementación de Funciones en BeFast GO

#### Autenticación
```typescript
// services/AuthService.ts
export const loginDriver = async (email: string, password: string) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Obtener perfil completo del conductor
    const driverDoc = await firestore().collection('drivers').doc(user.uid).get();
    
    if (!driverDoc.exists) {
      throw new Error('Perfil de conductor no encontrado');
    }
    
    return {
      user,
      driver: driverDoc.data()
    };
  } catch (error) {
    throw error;
  }
};

export const registerDriver = async (registrationData: any) => {
  try {
    const result = await functions().httpsCallable('handleAuthOperations')({
      action: 'REGISTER_DRIVER',
      data: registrationData
    });
    
    return result.data;
  } catch (error) {
    throw error;
  }
};
```

#### Gestión de Pedidos
```typescript
// services/OrderService.ts
export const acceptOrder = async (orderId: string, driverId: string) => {
  try {
    const result = await functions().httpsCallable('validateOrderAssignment')({
      orderId,
      driverId,
      action: 'ACCEPT'
    });
    
    if (result.data.approved) {
      return {
        success: true,
        order: result.data.order
      };
    } else {
      return {
        success: false,
        reason: result.data.reason
      };
    }
  } catch (error) {
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, status: string, additionalData?: any) => {
  try {
    const result = await functions().httpsCallable('handleOrderWorkflow')({
      orderId,
      driverId: auth().currentUser?.uid,
      action: 'UPDATE_STATUS',
      status,
      ...additionalData
    });
    
    return result.data;
  } catch (error) {
    throw error;
  }
};

export const completeOrder = async (orderId: string, completionData: any) => {
  try {
    const result = await functions().httpsCallable('processOrderCompletion')({
      orderId,
      driverId: auth().currentUser?.uid,
      photoUrl: completionData.photoUrl,
      signature: completionData.signature,
      customerPin: completionData.customerPin,
      cashReceived: completionData.cashAmount,
      deliveryNotes: completionData.notes
    });
    
    return result.data;
  } catch (error) {
    throw error;
  }
};
```

#### Gestión del Conductor
```typescript
// services/DriverService.ts
export const updateDriverStatus = async (status: 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'BREAK') => {
  try {
    await functions().httpsCallable('updateDriverStatus')({
      driverId: auth().currentUser?.uid,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw error;
  }
};

export const updateDriverLocation = async (latitude: number, longitude: number) => {
  try {
    await firestore()
      .collection('drivers')
      .doc(auth().currentUser?.uid)
      .update({
        'operational.currentLocation': {
          latitude,
          longitude,
          timestamp: firestore.FieldValue.serverTimestamp()
        },
        'operational.lastUpdate': firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    throw error;
  }
};
```

#### Chatbot IA
```typescript
// services/ChatService.ts
export const sendMessageToChatbot = async (message: string, context?: any) => {
  try {
    const result = await functions().httpsCallable('driverChatbot')({
      message,
      driverId: auth().currentUser?.uid,
      context
    });
    
    return result.data.response;
  } catch (error) {
    throw error;
  }
};
```

---

## 🔄 LISTENERS EN TIEMPO REAL COMPLETOS

### 1. Pedidos Disponibles
```typescript
// hooks/useAvailableOrders.ts
import { useState, useEffect } from 'react';
import { firestore } from '../config/firebase';

export const useAvailableOrders = (driverId: string) => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;

    const unsubscribe = firestore()
      .collection('orders')
      .where('status', '==', 'SEARCHING')
      .where('assignedDriverId', '==', null)
      .onSnapshot(
        snapshot => {
          const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAvailableOrders(orders);
          setLoading(false);
        },
        error => {
          console.error('Error listening to available orders:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [driverId]);

  return { availableOrders, loading };
};
```

### 2. Pedido Activo
```typescript
// hooks/useActiveOrder.ts
export const useActiveOrder = (driverId: string) => {
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;

    const unsubscribe = firestore()
      .collection('orders')
      .where('assignedDriverId', '==', driverId)
      .where('status', 'in', ['ASSIGNED', 'ACCEPTED', 'STARTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'])
      .onSnapshot(
        snapshot => {
          if (!snapshot.empty) {
            const orderDoc = snapshot.docs[0];
            setActiveOrder({
              id: orderDoc.id,
              ...orderDoc.data()
            });
          } else {
            setActiveOrder(null);
          }
          setLoading(false);
        },
        error => {
          console.error('Error listening to active order:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [driverId]);

  return { activeOrder, loading };
};
```

### 3. Billetera en Tiempo Real
```typescript
// hooks/useWallet.ts
export const useWallet = (driverId: string) => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    pendingDebts: 0,
    creditLimit: 300
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;

    const unsubscribe = firestore()
      .collection('drivers')
      .doc(driverId)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            const data = doc.data();
            setWalletData({
              balance: data?.wallet?.balance || 0,
              pendingDebts: data?.wallet?.pendingDebts || 0,
              creditLimit: data?.wallet?.creditLimit || 300
            });
          }
          setLoading(false);
        },
        error => {
          console.error('Error listening to wallet:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [driverId]);

  return { walletData, loading };
};
```

### 4. Transacciones
```typescript
// hooks/useTransactions.ts
export const useTransactions = (driverId: string, limit: number = 50) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;

    const unsubscribe = firestore()
      .collection('walletTransactions')
      .where('driverId', '==', driverId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .onSnapshot(
        snapshot => {
          const txs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTransactions(txs);
          setLoading(false);
        },
        error => {
          console.error('Error listening to transactions:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [driverId, limit]);

  return { transactions, loading };
};
```

### 5. Perfil del Conductor
```typescript
// hooks/useDriverProfile.ts
export const useDriverProfile = (driverId: string) => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;

    const unsubscribe = firestore()
      .collection('drivers')
      .doc(driverId)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            setDriver({
              id: doc.id,
              ...doc.data()
            });
          }
          setLoading(false);
        },
        error => {
          console.error('Error listening to driver profile:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [driverId]);

  return { driver, loading };
};
```

---

## 🔐 VALIDACIONES CRÍTICAS COMPLETAS

### Validación de Habilitación del Conductor
```typescript
// services/ValidationService.ts
export const validateDriverEligibility = async (driverId: string) => {
  try {
    const driver = await firestore().collection('drivers').doc(driverId).get();
    
    if (!driver.exists) {
      return {
        canReceiveOrders: false,
        blockingReason: 'DRIVER_NOT_FOUND',
        message: 'Perfil de conductor no encontrado'
      };
    }
    
    const data = driver.data();
    
    // VALIDACIÓN IMSS (CRÍTICA)
    if (!data?.administrative?.idseApproved) {
      return {
        canReceiveOrders: false,
        blockingReason: 'IDSE_NOT_APPROVED',
        message: 'Tu alta en IMSS está pendiente. Contacta a soporte.'
      };
    }
    
    // VALIDACIÓN ESTADO BEFAST
    if (data?.administrative?.befastStatus !== 'ACTIVE') {
      return {
        canReceiveOrders: false,
        blockingReason: 'NOT_ACTIVE',
        message: 'Tu cuenta no está activa. Contacta a soporte.'
      };
    }
    
    // VALIDACIÓN DOCUMENTOS
    if (data?.administrative?.documentsStatus !== 'APPROVED') {
      return {
        canReceiveOrders: false,
        blockingReason: 'DOCUMENTS_NOT_APPROVED',
        message: 'Tus documentos están pendientes de aprobación.'
      };
    }
    
    // VALIDACIÓN DEUDA (SOLO PARA EFECTIVO)
    const walletBalance = data?.wallet?.balance || 0;
    const pendingDebts = data?.wallet?.pendingDebts || 0;
    const creditLimit = data?.wallet?.creditLimit || 300;
    
    if (pendingDebts >= creditLimit) {
      return {
        canReceiveOrders: false,
        blockingReason: 'DEBT_LIMIT_EXCEEDED',
        message: `Has alcanzado tu límite de deuda ($${creditLimit}). Realiza un pago para continuar.`
      };
    }
    
    return {
      canReceiveOrders: true,
      walletInfo: {
        balance: walletBalance,
        pendingDebts,
        creditLimit,
        availableCredit: creditLimit - pendingDebts
      }
    };
    
  } catch (error) {
    return {
      canReceiveOrders: false,
      blockingReason: 'VALIDATION_ERROR',
      message: 'Error al validar tu cuenta. Intenta de nuevo.'
    };
  }
};

export const validateOrderAcceptance = async (orderId: string, driverId: string) => {
  try {
    // Primero validar habilitación del conductor
    const eligibility = await validateDriverEligibility(driverId);
    
    if (!eligibility.canReceiveOrders) {
      return eligibility;
    }
    
    // Validar que el pedido esté disponible
    const order = await firestore().collection('orders').doc(orderId).get();
    
    if (!order.exists) {
      return {
        canAcceptOrder: false,
        reason: 'Pedido no encontrado'
      };
    }
    
    const orderData = order.data();
    
    if (orderData?.status !== 'SEARCHING') {
      return {
        canAcceptOrder: false,
        reason: 'Este pedido ya no está disponible'
      };
    }
    
    if (orderData?.assignedDriverId && orderData.assignedDriverId !== driverId) {
      return {
        canAcceptOrder: false,
        reason: 'Este pedido ya fue asignado a otro conductor'
      };
    }
    
    // Validación específica para pedidos en efectivo
    if (orderData?.paymentMethod === 'CASH') {
      const pendingDebts = eligibility.walletInfo?.pendingDebts || 0;
      const creditLimit = eligibility.walletInfo?.creditLimit || 300;
      const orderAmount = orderData?.pricing?.deliveryFee || 15;
      
      if ((pendingDebts + orderAmount) > creditLimit) {
        return {
          canAcceptOrder: false,
          reason: `Este pedido en efectivo excedería tu límite de crédito. Límite disponible: $${creditLimit - pendingDebts}`
        };
      }
    }
    
    return {
      canAcceptOrder: true,
      order: orderData
    };
    
  } catch (error) {
    return {
      canAcceptOrder: false,
      reason: 'Error al validar el pedido'
    };
  }
};
```

---

## 📱 ESTADOS Y FLUJOS COMPLETOS

### Estados de Pedido
```typescript
// types/OrderTypes.ts
export enum OrderStatus {
  // Estados iniciales
  PENDING = 'PENDING',
  CREATED = 'CREATED',
  
  // Estados de asignación
  SEARCHING = 'SEARCHING',        // Buscando repartidor
  ASSIGNED = 'ASSIGNED',          // Asignado pero no aceptado
  ACCEPTED = 'ACCEPTED',          // Aceptado por repartidor
  
  // Estados de ejecución
  STARTED = 'STARTED',            // Repartidor en camino al restaurante
  PICKED_UP = 'PICKED_UP',        // Pedido recogido
  IN_TRANSIT = 'IN_TRANSIT',      // En camino al cliente
  ARRIVED = 'ARRIVED',            // Llegó al destino
  
  // Estados finales
  DELIVERED = 'DELIVERED',        // Entregado
  COMPLETED = 'COMPLETED',        // Completado y procesado financieramente
  
  // Estados de error
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export const ORDER_STATUS_LABELS = {
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
  [OrderStatus.CANCELLED]: 'Cancelado'
};
```

### Estados del Conductor
```typescript
// types/DriverTypes.ts
export enum DriverStatus {
  ACTIVE = 'ACTIVE',      // Disponible para recibir pedidos
  BUSY = 'BUSY',          // Ocupado con un pedido
  OFFLINE = 'OFFLINE',    // Desconectado
  BREAK = 'BREAK'         // En descanso
}

export enum DriverBefastStatus {
  PENDING = 'PENDING',        // Solicitud pendiente
  APPROVED = 'APPROVED',      // Aprobado pero sin IDSE
  ACTIVE = 'ACTIVE',          // Activo y operativo
  SUSPENDED = 'SUSPENDED'     // Suspendido
}

export enum IMSSStatus {
  ACTIVO_COTIZANDO = 'ACTIVO_COTIZANDO',
  PENDING = 'PENDING',
  INACTIVE = 'INACTIVE'
}
```

### Tipos de Transacciones
```typescript
// types/TransactionTypes.ts
export enum TransactionType {
  // Pedidos con tarjeta
  CARD_ORDER_TRANSFER = 'CARD_ORDER_TRANSFER',     // Ganancia por pedido tarjeta
  TIP_CARD_TRANSFER = 'TIP_CARD_TRANSFER',         // Propina de pedido tarjeta
  
  // Pedidos en efectivo
  CASH_ORDER_ADEUDO = 'CASH_ORDER_ADEUDO',         // Deuda por pedido efectivo
  
  // Pagos y ajustes
  DEBT_PAYMENT = 'DEBT_PAYMENT',                   // Pago de deuda
  BENEFITS_TRANSFER = 'BENEFITS_TRANSFER',         // Prestaciones IMSS
  ADJUSTMENT = 'ADJUSTMENT',                       // Ajuste manual
  PENALTY = 'PENALTY',                             // Penalización
  BONUS = 'BONUS'                                  // Bonificación
}

export const TRANSACTION_LABELS = {
  [TransactionType.CARD_ORDER_TRANSFER]: 'Ganancia por pedido (Tarjeta)',
  [TransactionType.TIP_CARD_TRANSFER]: 'Propina (Tarjeta)',
  [TransactionType.CASH_ORDER_ADEUDO]: 'Deuda por pedido (Efectivo)',
  [TransactionType.DEBT_PAYMENT]: 'Pago de deuda',
  [TransactionType.BENEFITS_TRANSFER]: 'Prestaciones IMSS',
  [TransactionType.ADJUSTMENT]: 'Ajuste',
  [TransactionType.PENALTY]: 'Penalización',
  [TransactionType.BONUS]: 'Bonificación'
};
```

---

## 🔔 NOTIFICACIONES FCM COMPLETAS

### Configuración FCM
```typescript
// services/NotificationService.ts
import messaging from '@react-native-firebase/messaging';
import { firestore, auth } from '../config/firebase';

export const setupPushNotifications = async () => {
  try {
    // Solicitar permisos
    const authStatus = await messaging().requestPermission({
      alert: true,
      announcement: false,
      badge: true,
      carPlay: true,
      provisional: false,
      sound: true,
    });

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      
      // Obtener token FCM
      const fcmToken = await messaging().getToken();
      
      if (fcmToken && auth().currentUser) {
        // Guardar token en Firestore
        await firestore()
          .collection('drivers')
          .doc(auth().currentUser.uid)
          .update({
            fcmToken: fcmToken,
            lastTokenUpdate: firestore.FieldValue.serverTimestamp()
          });
        
        console.log('FCM Token saved:', fcmToken);
      }
    }
  } catch (error) {
    console.error('Error setting up push notifications:', error);
  }
};

export const setupNotificationListeners = () => {
  // Notificaciones en primer plano
  messaging().onMessage(async remoteMessage => {
    console.log('Foreground message received:', remoteMessage);
    
    if (remoteMessage.data?.type === 'NEW_ORDER') {
      // Mostrar notificación local de nuevo pedido
      showLocalNotification({
        title: 'Nuevo Pedido Disponible',
        body: `Pedido #${remoteMessage.data.orderNumber} - $${remoteMessage.data.amount}`,
        data: remoteMessage.data
      });
    }
  });

  // Notificaciones en segundo plano
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message received:', remoteMessage);
  });

  // Notificación tocada
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened app:', remoteMessage);
    
    if (remoteMessage.data?.type === 'NEW_ORDER') {
      // Navegar a la pantalla de pedidos
      // navigation.navigate('Orders');
    }
  });

  // App abierta desde notificación (app cerrada)
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('App opened from notification:', remoteMessage);
      }
    });
};

const showLocalNotification = (notification: any) => {
  // Implementar notificación local usando react-native-push-notification
  // o @react-native-community/push-notification-ios
};
```

### Tipos de Notificaciones
```typescript
// types/NotificationTypes.ts
export enum NotificationType {
  NEW_ORDER = 'NEW_ORDER',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  SYSTEM_MESSAGE = 'SYSTEM_MESSAGE'
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    orderId?: string;
    orderNumber?: string;
    amount?: string;
    driverId?: string;
    [key: string]: any;
  };
}
```

---

## 📊 ESTADÍSTICAS Y KPIs COMPLETOS

### Hook para Estadísticas del Conductor
```typescript
// hooks/useDriverStats.ts
export const useDriverStats = (driverId: string, period: 'today' | 'week' | 'month' = 'today') => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    averageRating: 0,
    acceptanceRate: 0,
    completionRate: 0,
    onTimeRate: 0,
    averageDeliveryTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;

    const fetchStats = async () => {
      try {
        // Obtener estadísticas del perfil del conductor
        const driverDoc = await firestore().collection('drivers').doc(driverId).get();
        const driverData = driverDoc.data();

        // Calcular estadísticas del período
        const startDate = getStartDateForPeriod(period);
        
        const ordersQuery = await firestore()
          .collection('orders')
          .where('assignedDriverId', '==', driverId)
          .where('timing.createdAt', '>=', startDate)
          .get();

        const orders = ordersQuery.docs.map(doc => doc.data());
        
        const completedOrders = orders.filter(order => order.status === 'COMPLETED');
        const totalEarnings = completedOrders.reduce((sum, order) => {
          return sum + (order.pricing?.deliveryFee || 0) + (order.pricing?.tip || 0);
        }, 0);

        setStats({
          totalOrders: orders.length,
          completedOrders: completedOrders.length,
          totalEarnings,
          averageRating: driverData?.stats?.rating || 0,
          acceptanceRate: driverData?.kpis?.acceptanceRate || 0,
          completionRate: driverData?.kpis?.completionRate || 0,
          onTimeRate: driverData?.kpis?.onTimeDeliveryRate || 0,
          averageDeliveryTime: driverData?.kpis?.averageDeliveryTime || 0
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching driver stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, [driverId, period]);

  return { stats, loading };
};

const getStartDateForPeriod = (period: string) => {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return weekStart;
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
};
```

---

## 🔧 UTILIDADES Y HELPERS COMPLETOS

### Formateo de Datos
```typescript
// utils/formatters.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

export const formatDate = (date: any): string => {
  if (!date) return '';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  }
};

export const getOrderStatusColor = (status: string): string => {
  const colors = {
    PENDING: '#6B7280',
    CREATED: '#6B7280',
    SEARCHING: '#F59E0B',
    ASSIGNED: '#3B82F6',
    ACCEPTED: '#10B981',
    STARTED: '#8B5CF6',
    PICKED_UP: '#F97316',
    IN_TRANSIT: '#EF4444',
    ARRIVED: '#84CC16',
    DELIVERED: '#059669',
    COMPLETED: '#065F46',
    FAILED: '#DC2626',
    CANCELLED: '#6B7280'
  };
  
  return colors[status] || '#6B7280';
};
```

### Validaciones
```typescript
// utils/validators.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+52|52)?[1-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateRFC = (rfc: string): boolean => {
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/;
  return rfcRegex.test(rfc.toUpperCase());
};

export const validateCURP = (curp: string): boolean => {
  const curpRegex = /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}$/;
  return curpRegex.test(curp.toUpperCase());
};

export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};
```

### Geolocalización
```typescript
// utils/location.ts
import Geolocation from '@react-native-community/geolocation';

export const getCurrentLocation = (): Promise<{latitude: number, longitude: number}> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      error => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
  });
};

export const watchLocation = (callback: (location: {latitude: number, longitude: number}) => void) => {
  return Geolocation.watchPosition(
    position => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    },
    error => console.error('Location watch error:', error),
    {
      enableHighAccuracy: true,
      distanceFilter: 10, // Actualizar cada 10 metros
      interval: 5000,     // Actualizar cada 5 segundos
      fastestInterval: 2000
    }
  );
};

export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distancia en metros
};
```

---

## 📋 CHECKLIST COMPLETO DE INTEGRACIÓN

### ✅ Configuración Básica
- [ ] Configurar Firebase con proyecto `befast-hfkbl`
- [ ] Instalar todas las dependencias de Firebase
- [ ] Configurar autenticación con custom claims
- [ ] Configurar FCM para notificaciones push
- [ ] Configurar permisos de ubicación

### ✅ Firestore
- [ ] Implementar todas las colecciones requeridas
- [ ] Crear hooks para listeners en tiempo real
- [ ] Implementar cache local para offline
- [ ] Configurar índices necesarios

### ✅ Cloud Functions
- [ ] Implementar llamadas a todas las funciones críticas
- [ ] Manejar errores y reintentos
- [ ] Implementar timeout y fallbacks
- [ ] Validar respuestas de funciones

### ✅ Autenticación
- [ ] Login con email/password
- [ ] Registro completo (5 pasos)
- [ ] Recuperación de contraseña
- [ ] Validación de estado del conductor
- [ ] Manejo de sesiones

### ✅ Gestión de Pedidos
- [ ] Listener para pedidos disponibles
- [ ] Validación antes de aceptar pedidos
- [ ] Flujo completo de estados de pedido
- [ ] Completar pedidos con prueba de entrega
- [ ] Manejo de pedidos fallidos

### ✅ Sistema Financiero
- [ ] Listener de billetera en tiempo real
- [ ] Historial de transacciones
- [ ] Validación de límites de deuda
- [ ] Diferenciación efectivo vs tarjeta
- [ ] Reportes de ganancias

### ✅ Geolocalización
- [ ] Obtener ubicación actual
- [ ] Seguimiento de ubicación en tiempo real
- [ ] Actualizar ubicación en Firestore
- [ ] Calcular distancias y rutas
- [ ] Manejo de permisos de ubicación

### ✅ Notificaciones
- [ ] Configurar FCM
- [ ] Notificaciones de nuevos pedidos
- [ ] Notificaciones de cambios de estado
- [ ] Notificaciones del sistema
- [ ] Manejo de notificaciones en background

### ✅ UI/UX
- [ ] Estados de carga
- [ ] Manejo de errores
- [ ] Validación de formularios
- [ ] Feedback visual
- [ ] Accesibilidad

### ✅ Validaciones Críticas
- [ ] Validación IMSS/IDSE antes de operar
- [ ] Validación de estado del conductor
- [ ] Validación de documentos
- [ ] Validación de límites financieros
- [ ] Validación de pedidos disponibles

### ✅ Testing
- [ ] Pruebas de autenticación
- [ ] Pruebas de flujo de pedidos
- [ ] Pruebas de sistema financiero
- [ ] Pruebas de notificaciones
- [ ] Pruebas de geolocalización

---

## 🎯 RESULTADO FINAL

Con esta configuración completa, BeFast GO estará:

1. **✅ Completamente integrado** con el Ecosistema BeFast
2. **✅ Usando las mismas Cloud Functions** y colecciones de Firestore
3. **✅ Validando correctamente** el estado IMSS/IDSE de los conductores
4. **✅ Procesando pedidos** con el mismo flujo que el ecosistema web
5. **✅ Manejando la billetera** con la misma lógica financiera
6. **✅ Recibiendo notificaciones** en tiempo real
7. **✅ Sincronizando datos** automáticamente
8. **✅ Manteniendo consistencia** con todo el sistema

**La app móvil será una extensión nativa del ecosistema web, compartiendo toda la lógica de negocio y datos.**

---

**Documento de Configuración Completa**  
**BeFast GO - Integración con Ecosistema BeFast**  
**Última actualización**: Enero 2025