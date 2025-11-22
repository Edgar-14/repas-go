export interface Driver {
  // --- Identificadores ---
  id: string;
  uid?: string; // Firebase Auth UID (opcional para compatibilidad)
  
  // --- Información Personal ---
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth?: string;
  gender?: string;
  curp: string;
  rfc: string;
  nss: string;
  
  // --- Vehículo ---
  vehicle: {
    type: string;
    brand: string;
    model: string;
    plates: string;
    plate?: string; // Alias para plates
    color: string;
    year: string | number;
  };
  vehicleType?: string;
  
  // --- Información Bancaria ---
  bank: {
    name: string;
    clabe: string;
    accountNumber?: string;
    bankName?: string; // Alias para name
    accountHolder?: string;
  };
  
  // --- Estado y Clasificación ---
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ACTIVO_COTIZANDO';
  classification?: string; // 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' | etc.
  currentClassification?: 'Empleado Cotizante' | 'Trabajador Independiente';
  imssStatus?: string; // 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'REQUIRES_RISK_INSURANCE' | 'ACTIVO_COTIZANDO'
  
  // --- Finanzas ---
  walletBalance: number;
  pendingDebts: number;
  driverDebtLimit: number;
  debtLimit?: number; // legacy alias for driverDebtLimit
  totalEarnings: number;
  ingreso_bruto_mensual?: number;
  
  // --- Estadísticas ---
  completedOrders: number;
  rating: number;
  trainingCompleted?: boolean;
  
  // --- KPIs (Opcional - para dashboards) ---
  kpis?: {
    totalOrders: number;
    acceptanceRate: number;
    onTimeDeliveryRate: number;
    averageRating: number;
    totalDistance?: number;
    averageDeliveryTime?: number;
    completedDeliveries?: number;
    lateDeliveries?: number;
    failedDeliveries?: number;
    completionRate?: number; // Porcentaje de entregas completadas exitosamente
    cancellations?: number; // Número de entregas canceladas
  };
  
  // --- Integración Shipday ---
  isActiveInShipday: boolean;
  shipdayCarrierId?: string; // ID del carrier en Shipday (término oficial de Shipday API) - Note: Changed from nullable to optional-only for consistency
  
  // --- Documentos ---
  documents?: {
    [key: string]: string;
  };
  
  // --- Fechas ---
  createdAt: any;
  updatedAt?: any;
  approvedAt?: any;
  lastClassificationUpdate?: any;
  lastServiceDate?: any;
  antiquityStartDate?: any;
  
  // --- Otros ---
  isActive?: boolean;
  annualWorkedHours?: number;
  
  // --- Flexibilidad para campos adicionales ---
  [key: string]: any;
}

export interface DriverData extends Driver {
  // Additional properties for dashboard display
  recentTransactions: any[];
  monthlyEarnings: number;
  weeklyEarnings: number;
  averageOrderValue: number;
  responseTime: number;
}
