// Vista detallada de pedido para admin - UNIFIED ORDER STRUCTURE
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, Package, User, MapPin, Clock, DollarSign } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import withAuth from '@/components/auth/withAuth';
import { Section, PageToolbar } from '@/components/layout/primitives';
import type { Order } from '@/types';

// UNIFIED status mapping - supports both old and new formats
const statusDisplayMap: { [key: string]: string } = {
  // New unified format (uppercase, aligned with canonical types)
  'PENDING': 'Pendiente',
  'ASSIGNED': 'Asignado',
  'IN_TRANSIT': 'En Camino',
  'COMPLETED': 'Completado',
  'CANCELLED': 'Cancelado',
  'STARTED': 'Iniciado',
  'PICKED_UP': 'Recogido',
  'FAILED': 'Fallido',
  // Legacy format (for backward compatibility)
  'pending_dispatch': 'Pendiente',
  'en_camino': 'En Camino',
  'entregado': 'Entregado',
  'cancelado': 'Cancelado',
};

const statusColorMap: { [key: string]: string } = {
  // New unified format (uppercase, aligned with canonical types)
  'PENDING': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  'ASSIGNED': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  'IN_TRANSIT': 'bg-blue-600/20 text-blue-800 border-blue-600/30',
  'COMPLETED': 'bg-green-500/20 text-green-700 border-green-500/30',
  'CANCELLED': 'bg-red-500/20 text-red-700 border-red-500/30',
  'STARTED': 'bg-cyan-500/20 text-cyan-700 border-cyan-500/30',
  'PICKED_UP': 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30',
  'FAILED': 'bg-orange-500/20 text-orange-700 border-orange-500/30',
  // Legacy format
  'en_camino': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  'entregado': 'bg-green-500/20 text-green-700 border-green-500/30',
  'pending_dispatch': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  'cancelado': 'bg-red-500/20 text-red-700 border-red-500/30',
};

function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setIsLoading(true);
    const fetchOrder = async () => {
      try {
        const orderRef = doc(db, COLLECTIONS.ORDERS, orderId); // Using ORDERS collection per BEFAST FLUJO FINAL
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() });
        }
        
        // Obtener eventos de la línea de tiempo
        const eventsQuery = query(
          collection(db, 'orderEvents'),
          where('orderId', '==', orderId),
          orderBy('timestamp', 'desc')
        );
        const eventsSnap = await getDocs(eventsQuery);
        const events = eventsSnap.docs.map(doc => doc.data());
        setTimeline(events);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center">
        <p>Pedido no encontrado</p>
        <Button onClick={() => router.push('/admin/pedidos')}>
          Volver a Pedidos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* UI Universal: Section + PageToolbar */}
      <Section>
        <PageToolbar
          left={
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/pedidos')}
              >
                <ArrowLeft />
                Volver
              </Button>
              <div className="flex items-center gap-3">
                {/* Display unified orderNumber (orderId) or Firestore ID as fallback */}
                <span className="text-lg font-bold">Pedido {order.orderId || `#${order.id.slice(-6)}`}</span>
                <Badge className={statusColorMap[order.status] || 'bg-gray-100 text-gray-800'}>
                  {statusDisplayMap[order.status] || order.status}
                </Badge>
              </div>
            </div>
          }
        />
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Información del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Número de Pedido</label>
                {/* Use unified orderId (e.g., SD-xxx) */}
                <p className="font-mono">{order.orderId || order.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ID Firestore</label>
                <p className="font-mono text-xs text-gray-500">{order.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <Badge className={statusColorMap[order.status] || 'bg-gray-100 text-gray-800'}>
                  {statusDisplayMap[order.status] || order.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Fuente</label>
                <p>{order.source || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                <p>{order.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Monto Total</label>
                <p className="font-semibold text-green-600">
                  ${(order.totalOrderValue || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Costo de Envío</label>
                <p>${(order.deliveryFee || 0).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Método de Pago</label>
                <p>{order.paymentMethod || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre</label>
              {/* Use unified customer.name structure */}
              <p>{order.customer?.name || order.customerName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Teléfono</label>
              <p>{order.customer?.phone || order.customerPhone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Dirección de Entrega</label>
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                {order.customer?.address || order.deliveryAddress || 'N/A'}
              </p>
            </div>
            {order.pickup && (
              <div>
                <label className="text-sm font-medium text-gray-500">Recoger en</label>
                <p className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-gray-500 mt-1" />
                  {order.pickup.name} - {order.pickup.address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Línea de Tiempo
          </CardTitle>
          <CardDescription>
            Historial de eventos del pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full -ml-[7px]"></div>
                    <span className="font-medium">{event.eventType}</span>
                    <span className="text-sm text-gray-500">
                      {event.timestamp?.toDate?.()?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No hay eventos registrados para este pedido
            </p>
          )}
        </CardContent>
      </Card>

      {/* Shipday integration info - using unified structure */}
      {(order.shipdayOrderId || order.shipdayOrderNumber) && (
        <Card>
          <CardHeader>
            <CardTitle>Información de Shipday</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">ID en Shipday</TableCell>
                  <TableCell>{order.shipdayOrderId || order.shipdayData?.id || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Número de Pedido Shipday</TableCell>
                  <TableCell className="font-mono">{order.shipdayOrderNumber || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Repartidor Asignado</TableCell>
                  <TableCell>
                    {order.driverName || order.shipdayCarrierName || (order.driverId ? `ID: ${order.driverId}` : 'No asignado')}
                    {order.shipdayCarrierId && (
                      <div className="text-xs text-gray-500">Shipday Carrier ID: {order.shipdayCarrierId}</div>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Tiempo Estimado de Entrega</TableCell>
                  <TableCell>{order.estimatedDeliveryTime ? `${order.estimatedDeliveryTime} min` : 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Link de Seguimiento</TableCell>
                  <TableCell>
                    {order.trackingLink ? (
                      <a href={order.trackingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Ver seguimiento
                      </a>
                    ) : (
                      <span className="text-gray-500">No disponible</span>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withAuth(AdminOrderDetailPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});