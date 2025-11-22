import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
// Helper para formatear fechas de Firestore de forma segura
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  try {
    return timestamp.toDate().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  } catch (error) {
    try {
      return new Date(timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return 'Fecha inválida';
    }
  }
};

const HistorialTransacciones = ({ driverId }: { driverId: string }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, COLLECTIONS.WALLET_TRANSACTIONS), 
          where('driverId', '==', driverId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        setTransactions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching transaction history: ", error);
      }
      setLoading(false);
    };

    if (driverId) {
      fetchTransactions();
    }
  }, [driverId]);

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="w-full">
      {transactions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No hay transacciones en el historial.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(tx => (
              <TableRow key={tx.id}>
                <TableCell className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                <TableCell><Badge variant="outline">{tx.type}</Badge></TableCell>
                <TableCell>{tx.description || 'N/A'}</TableCell>
                <TableCell className={cn(
                  "text-right font-mono",
                  tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {tx.amount > 0 ? '+' : ''}${tx.amount?.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default HistorialTransacciones;
