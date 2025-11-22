

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download } from 'lucide-react';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
// --- Funciones de Ayuda ---
const toCSV = (data: any[], columns: string[]) => {
  const header = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => JSON.stringify(row[col] ?? '')).join(',')
  );
  return [header, ...rows].join('\r\n');
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  try {
    return timestamp.toDate().toISOString(); // Formato ISO para consistencia
  } catch (e) { return 'Fecha inválida'; }
};

const ExportarReporte = ({ driver }: { driver: any }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!driver?.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const ordersQuery = query(
          collection(db, 'orders'), 
          where('driverId', '==', driver.id),
          orderBy('createdAt', 'desc'),
          limit(500) // Límite de seguridad
        );
        const transactionsQuery = query(
          collection(db, COLLECTIONS.WALLET_TRANSACTIONS), 
          where('driverId', '==', driver.id),
          orderBy('createdAt', 'desc'),
          limit(500) // Límite de seguridad
        );

        const [ordersSnapshot, transactionsSnapshot] = await Promise.all([
          getDocs(ordersQuery),
          getDocs(transactionsQuery)
        ]);

        setOrders(ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTransactions(transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching data for export: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos para exportar.' });
      }
      setLoading(false);
    };

    fetchData();
  }, [driver?.id, toast]);

  const exportFile = (data: any[], columns: string[], fileName: string) => {
    try {
      const csvContent = toCSV(data, columns);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Éxito', description: `Reporte '${fileName}' descargado.` });
    } catch (error) {
      console.error("Export failed: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el archivo.' });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exportar Reportes</CardTitle>
          <CardDescription>Descarga el historial de transacciones y pedidos en formato CSV.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => exportFile(transactions, ['createdAt', 'type', 'amount', 'description'], `transacciones_${driver.id}.csv`)}
            disabled={transactions.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Historial de Transacciones
          </Button>
          <Button 
            onClick={() => exportFile(orders, ['createdAt', 'status', 'totalAmount', 'driverEarnings'], `pedidos_${driver.id}.csv`)}
            disabled={orders.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Historial de Pedidos
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista Previa de Últimas Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 5).map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>{formatDate(tx.createdAt)}</TableCell>
                  <TableCell><Badge variant="outline">{tx.type}</Badge></TableCell>
                  <TableCell className="text-right font-mono">${tx.amount?.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportarReporte;
