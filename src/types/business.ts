/**
 * @fileoverview Definición canónica para la estructura de datos de un Negocio (Business).
 * ÚNICA FUENTE DE VERDAD para negocios en el ecosistema BeFast.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Transacción de créditos de un negocio
 */
export interface CreditTransaction {
  transactionId: string;
  amount: number;
  packageType: 'Básico' | 'Empresarial' | 'Corporativo' | 'Personalizado';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Timestamp | Date;
  approvedAt?: Timestamp | Date;
  proofUrl?: string;
  notes?: string;
}

/**
 * Información de facturación del negocio
 */
export interface BusinessBilling {
  lastPurchaseDate?: Date | Timestamp;
  lastPurchaseAmount?: number;
  totalPurchases?: number;
  pendingCheckout?: any;
}

/**
 * Interfaz canónica de Business - ÚNICA FUENTE DE VERDAD
 * Todos los archivos del proyecto DEBEN importar esta interfaz
 */
export interface Business {
  // --- Identificadores Core ---
  id: string; // ID de Firestore
  uid: string; // UID de Firebase Auth
  
  // --- Información del Negocio ---
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rfc: string;
  
  // --- Estado y Créditos ---
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  credits: number; // Campo legacy - mantener por compatibilidad
  availableCredits: number; // Campo nuevo usado por Stripe
  
  // --- Estadísticas ---
  totalOrders: number;
  totalSpent: number;
  
  // --- Verificación ---
  emailVerified: boolean;
  
  // --- Billing ---
  billing?: BusinessBilling;
  creditTransactions?: CreditTransaction[];
  
  // --- Timestamps ---
  createdAt: Timestamp | Date | any;
  updatedAt: Timestamp | Date | any;
  lastCreditPurchaseDate?: Timestamp | Date | any;
  
  // --- Otros ---
  favoriteDrivers?: string[];
  
  // --- Flexibilidad para campos adicionales ---
  [key: string]: any;
}

/**
 * Datos de registro de un nuevo negocio
 */
export interface BusinessRegistrationData {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rfc: string;
  password: string;
}

/**
 * Métricas del negocio
 */
export interface BusinessMetrics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  creditBalance: number;
  lastOrderDate?: Date;
  topDrivers?: Array<{
    driverId: string;
    name: string;
    orders: number;
  }>;
}
