import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

const statusColors = {
  // Order statuses
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  assigned: 'bg-purple-100 text-purple-800 border-purple-200',
  picked_up: 'bg-orange-100 text-orange-800 border-orange-200',
  in_transit: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  
  // Driver statuses
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  
  // Application statuses
  under_review: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  
  // Business statuses
  verified: 'bg-green-100 text-green-800 border-green-200',
  unverified: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  
  // Payment statuses
  paid: 'bg-green-100 text-green-800 border-green-200',
  unpaid: 'bg-red-100 text-red-800 border-red-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  
  // Classifications
  DIAMOND: 'bg-purple-100 text-purple-800 border-purple-200',
  GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SILVER: 'bg-gray-100 text-gray-800 border-gray-200',
  BRONZE: 'bg-orange-100 text-orange-800 border-orange-200',
  
  // System statuses
  online: 'bg-green-100 text-green-800 border-green-200',
  offline: 'bg-gray-100 text-gray-800 border-gray-200',
  busy: 'bg-orange-100 text-orange-800 border-orange-200',
  available: 'bg-green-100 text-green-800 border-green-200',
  unavailable: 'bg-red-100 text-red-800 border-red-200'
};

const statusLabels = {
  // Order statuses
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  assigned: 'Asignado',
  picked_up: 'Recogido',
  in_transit: 'En tránsito',
  completed: 'Completado',
  cancelled: 'Cancelado',
  
  // Driver statuses
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  pending_approval: 'Pendiente',
  
  // Application statuses
  under_review: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  
  // Business statuses
  verified: 'Verificado',
  unverified: 'No verificado',
  PENDING_VERIFICATION: 'Verificación Pendiente',
  
  // Payment statuses
  paid: 'Pagado',
  unpaid: 'Pendiente',
  processing: 'Procesando',
  
  // Classifications
  DIAMOND: 'Diamante',
  GOLD: 'Oro',
  SILVER: 'Plata',
  BRONZE: 'Bronce',
  
  // System statuses
  online: 'En línea',
  offline: 'Desconectado',
  busy: 'Ocupado',
  available: 'Disponible',
  unavailable: 'No disponible'
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const colorClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  const label = statusLabels[status as keyof typeof statusLabels] || status;

  return (
    <Badge 
      variant={variant} 
      className={cn(
        'text-xs font-medium border',
        !variant && colorClass,
        className
      )}
    >
      {label}
    </Badge>
  );
}