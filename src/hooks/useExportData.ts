import { useState } from 'react';
import { collection, getDocs, query, orderBy, limit, Query, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export interface ExportConfig<T> {
  collectionName: string;
  filename: string;
  headers: readonly string[] | string[];
  dataMapper: (item: T) => (string | number)[];
  queryOptions?: {
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    limitCount?: number;
  };
}

export function useExportData<T extends Record<string, any>>() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCsv = async (config: ExportConfig<T>) => {
    try {
      setIsExporting(true);
      
      // Construir query
      let dataQuery = collection(db, config.collectionName) as Query<DocumentData>;
      
      if (config.queryOptions?.orderByField) {
        dataQuery = query(
          dataQuery,
          orderBy(config.queryOptions.orderByField, config.queryOptions.orderDirection || 'desc'),
          limit(config.queryOptions.limitCount || 1000)
        );
      }

      // Obtener datos
      const snapshot = await getDocs(dataQuery);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as T[];

      // Generar CSV
      const csvContent = [
        config.headers.join(','),
        ...items.map(item => config.dataMapper(item).map(value => {
          // Escapar valores que contienen comas, comillas o saltos de línea
          const stringValue = String(value || '');
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(','))
      ].join('\n');

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${config.filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportación exitosa',
        description: `${items.length} registros exportados correctamente`,
      });

      return { success: true, count: items.length };

    } catch (error) {
      console.error('Error exportando datos:', error);
      toast({
        title: 'Error al exportar',
        description: 'No se pudo completar la exportación',
        variant: 'destructive',
      });
      
      return { success: false, error };
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToCsv,
    isExporting
  };
}

// Configuraciones predefinidas para tipos comunes
export const EXPORT_CONFIGS = {
  orders: {
    collectionName: 'ORDERS',
    filename: 'pedidos',
    headers: ['ID', 'Estado', 'Cliente', 'Repartidor', 'Total', 'Comisión', 'Fecha', 'Dirección Pickup', 'Dirección Entrega'],
    dataMapper: (order: any) => [
      order.id,
      order.status || '',
      order.customer?.name || order.customerName || '',
      order.driverName || '',
      order.totalOrderValue || order.totalAmount || 0,
      order.commission || 0,
      order.createdAt?.toDate?.()?.toLocaleDateString('es-MX') || '',
      order.pickup?.address || order.pickupAddress || '',
      order.customer?.address || order.deliveryAddress || ''
    ],
    queryOptions: {
      orderByField: 'createdAt',
      orderDirection: 'desc' as const,
      limitCount: 1000
    }
  },
  drivers: {
    collectionName: 'DRIVERS', 
    filename: 'repartidores',
    headers: ['ID', 'Nombre', 'Email', 'Teléfono', 'Estado', 'Vehículo', 'Saldo', 'Fecha Registro'],
    dataMapper: (driver: any) => [
      driver.id,
      driver.fullName || '',
      driver.email || '',
      driver.phone || '',
      driver.status || '',
      driver.vehicle?.type || driver.vehicleType || '',
      driver.walletBalance || 0,
      driver.createdAt?.toDate?.()?.toLocaleDateString('es-MX') || ''
    ],
    queryOptions: {
      limitCount: 1000
    }
  }
} as const;
