import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
// Helper para formatear fechas de Firestore de forma segura
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  try {
    return timestamp.toDate().toLocaleString('es-MX');
  } catch (error) {
    return new Date(timestamp).toLocaleString('es-MX'); // Fallback
  }
};

// Helper para formatear direcciones de forma segura
const formatAddress = (address: any) => {
  if (!address) return 'N/A';
  if (typeof address === 'string') return address;
  return `${address.street || ''}, ${address.city || ''}`.trim();
};

const HistorialPedidos = ({ driverId }: { driverId: string }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, COLLECTIONS.ORDERS), // Using ORDERS collection per BEFAST FLUJO FINAL 
          where('driverId', '==', driverId),
          orderBy('createdAt', 'desc'),
          limit(50) // Limitar a los últimos 50 pedidos por rendimiento
        );
        const querySnapshot = await getDocs(q);
        setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching order history: ", error);
        // Aquí podrías usar un toast para notificar al usuario
      }
      setLoading(false);
    };
    fetchOrders();
  }, [driverId]);

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="w-full">
      {orders.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No hay pedidos en el historial.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pedido</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Ganancia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>{order.customerName || 'N/A'}</TableCell>
                <TableCell>${order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>${order.driverEarnings?.toFixed(2) || '0.00'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default HistorialPedidos;
