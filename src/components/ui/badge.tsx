"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 sm:px-2.5 py-1 sm:py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-sm",
        outline: "text-foreground border-gray-300 hover:bg-gray-50",
        success:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 shadow-sm",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 shadow-sm",
        info:
          "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 shadow-sm",
        pending:
          "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300 shadow-sm",
        active:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 shadow-sm",
        inactive:
          "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Status badge component for common statuses
const StatusBadge = ({ status, className }: { status: string; className?: string }) => {
  // Mapeo de estados en inglés a español
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      // Estados de Shipday
      'NOT_ASSIGNED': 'Sin Asignar',
      'NOT_ACCEPTED': 'Sin Aceptar', 
      'NOT_STARTED_YET': 'Sin Iniciar',
      'STARTED': 'Iniciado',
      'PICKED_UP': 'Recogido',
      'READY_TO_DELIVER': 'Listo para Entregar',
      'ALREADY_DELIVERED': 'Entregado',
      'INCOMPLETE': 'Incompleto',
      'FAILED_DELIVERY': 'Entrega Fallida',
      
      // Estados internos BeFast
      'pending': 'Pendiente',
      'PENDING': 'Pendiente',
      'ASSIGNED': 'Asignado',
      'IN_PROGRESS': 'En Proceso',
      'AT_PICKUP': 'En Punto de Recogida',
      'IN_TRANSIT': 'En Camino',
      'DELIVERED': 'Entregado',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado',
      'FAILED': 'Fallido',
      
      // Estados de transacciones
      'APPROVED': 'Aprobado',
      'REJECTED': 'Rechazado',
      
      // Estados generales
      'active': 'Activo',
      'ACTIVE': 'Activo',
      'inactive': 'Inactivo',
      'INACTIVE': 'Inactivo'
    };
    
    return statusMap[status] || status;
  };

  const getVariant = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'active':
      case 'activo':
      case 'completed':
      case 'delivered':
      case 'already_delivered':
      case 'approved':
      case 'entregado':
      case 'completado':
      case 'aprobado':
        return 'success';
      case 'pending':
      case 'pendiente':
      case 'processing':
      case 'en_proceso':
      case 'not_assigned':
      case 'not_accepted':
      case 'not_started_yet':
      case 'sin asignar':
      case 'sin aceptar':
      case 'sin iniciar':
        return 'pending';
      case 'inactive':
      case 'inactivo':
      case 'cancelled':
      case 'cancelado':
      case 'rejected':
      case 'rechazado':
      case 'failed':
      case 'failed_delivery':
      case 'incomplete':
      case 'fallido':
      case 'incompleto':
        return 'destructive';
      case 'assigned':
      case 'started':
      case 'in_progress':
      case 'picked_up':
      case 'at_pickup':
      case 'in_transit':
      case 'ready_to_deliver':
      case 'asignado':
      case 'iniciado':
      case 'en proceso':
      case 'recogido':
      case 'en camino':
        return 'info';
      case 'warning':
      case 'advertencia':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const translatedStatus = translateStatus(status);

  return (
    <Badge variant={getVariant(status)} className={className}>
      {translatedStatus}
    </Badge>
  );
};

export { Badge, StatusBadge, badgeVariants };