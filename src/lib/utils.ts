import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number, currency = 'MXN') => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date: Date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  } as const;

  return new Date(date).toLocaleDateString('es-MX', { ...defaultOptions, ...options });
};

/**
 * Normalizes Firestore Timestamp or Date-like objects to JavaScript Date
 * Handles both Firestore Timestamp with toDate() method and regular Date objects
 * @param date - Firestore Timestamp, Date, or date-like object
 * @returns JavaScript Date object
 */
export const normalizeFirestoreDate = (date: any): Date => {
  if (!date) return new Date();
  
  // Check if it's a Firestore Timestamp with toDate method
  if (typeof date === 'object' && date !== null && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  
  // If it's already a Date or can be converted to one
  return new Date(date);
};

export const truncateText = (text: string, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    active: 'success',
    pending: 'warning',
    inactive: 'error',
    suspended: 'error',
    approved: 'success',
    rejected: 'error',
    completed: 'success',
    'in-progress': 'primary',
    cancelled: 'error',
    // Order statuses
    'CREATED': 'bg-gray-500',
    'SEARCHING_DRIVER': 'bg-yellow-500',
    'ASSIGNED': 'bg-blue-500',
    'AT_PICKUP': 'bg-orange-500',
    'IN_TRANSIT': 'bg-purple-500',
    'DELIVERED': 'bg-green-500',
    'CANCELLED': 'bg-red-500',
    // Driver statuses
    'ACTIVE': 'bg-green-500',
    'SUSPENDED': 'bg-red-500',
    'ALTA_PROVISIONAL': 'bg-yellow-500',
    'ACTIVO_COTIZANDO': 'bg-green-500',
    'BAJA': 'bg-gray-500'
  };
  return statusColors[status.toLowerCase()] || statusColors[status] || 'bg-gray-500';
};

export const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    'CREATED': 'Creado',
    'SEARCHING_DRIVER': 'Buscando Repartidor',
    'ASSIGNED': 'Repartidor Asignado',
    'AT_PICKUP': 'En Punto de Recogida',
    'IN_TRANSIT': 'En Camino',
    'DELIVERED': 'Entregado',
    'CANCELLED': 'Cancelado',
    'ACTIVE': 'Activo',
    'SUSPENDED': 'Suspendido',
    'ALTA_PROVISIONAL': 'Alta Provisional',
    'ACTIVO_COTIZANDO': 'Activo Cotizando',
    'BAJA': 'Baja',
    'PENDING': 'Pendiente'
  };
  return texts[status] ?? status;
};

export function validateRFC(rfc: string): boolean {
  const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;
  return rfcPattern.test(rfc.toUpperCase());
}

export function validateCURP(curp: string): boolean {
  const curpPattern = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/;
  return curpPattern.test(curp.toUpperCase());
}

export function validateNSS(nss: string): boolean {
  return /^\d{11}$/.test(nss);
}

export function generateOrderId(): string {
  // Solo generar ID en el cliente para evitar errores de hidratación
  if (typeof window === 'undefined') {
    return 'BF-SERVER-ID'; // ID fijo para SSR
  }
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `BF${timestamp}${random}`.toUpperCase();
}

/**
 * Genera un ID único de manera segura para SSR
 * Usa un contador interno para evitar problemas de hidratación
 */
let serverIdCounter = 0;
export function generateSafeId(prefix: string = 'BF'): string {
  if (typeof window === 'undefined') {
    serverIdCounter++;
    return `${prefix}-SERVER-${serverIdCounter}`;
  }
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`.toUpperCase();
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
