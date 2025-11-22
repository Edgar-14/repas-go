"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import { Button } from "@/components/ui/button";
// Encabezado simplificado sin títulos
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  FileSpreadsheet, 
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  Star,
  Package,
  Loader2
} from "lucide-react";
import * as XLSX from 'xlsx';
import withAuth from "@/components/auth/withAuth";
import { useAuth } from '@/hooks/useAuth';
import { COLLECTIONS } from '@/lib/collections';
import type { WalletTransaction } from '@/types';

// Local interfaces for specific page needs
interface DriverKPIs {
  averageRating?: number;
  onTimeRate?: number;
  acceptanceRate?: number;
  totalOrders?: number;
  totalDistance?: number;
  totalDeliveryTime?: number;
  totalEarnings?: number;
  weeklyEarnings?: number;
  monthlyEarnings?: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  driverCommission: number;
  paymentMethod: string;
  dropoffAddress: string;
  completedAt?: any;
  createdAt?: any;
}

function DriverReportsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [kpis, setKpis] = useState<DriverKPIs | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(20);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadDriverData = async (driverId: string, loadMore: boolean = false) => {
    try {
      if (!loadMore) {
        setIsLoading(true);
        // Load driver KPIs and orders (only on initial load)
        const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
        const driverSnap = await getDoc(driverRef);
        if (driverSnap.exists()) {
          setKpis(driverSnap.data().kpis || null);
        }

        const ordersQuery = query(
          collection(db, COLLECTIONS.ORDERS),
          where("driverId", "==", driverId),
          orderBy("createdAt", "desc"),
          limit(100)
        );
        const ordersSnap = await getDocs(ordersQuery);
        const ordersData: OrderData[] = [];
        ordersSnap.forEach((doc) => {
          ordersData.push({ id: doc.id, ...doc.data() } as OrderData);
        });
        setOrders(ordersData);
      }

      // Load wallet transactions with real pagination
      const walletCollectionRef = collection(db, COLLECTIONS.DRIVERS, driverId, COLLECTIONS.WALLET_TRANSACTIONS);
      let walletQuery;
      
      if (loadMore && lastTransaction) {
        walletQuery = query(
          walletCollectionRef,
          orderBy("createdAt", "desc"),
          startAfter(lastTransaction),
          limit(transactionsPerPage)
        );
      } else {
        walletQuery = query(
          walletCollectionRef,
          orderBy("createdAt", "desc"),
          limit(transactionsPerPage)
        );
      }

      const walletSnap = await getDocs(walletQuery);
      const walletData: WalletTransaction[] = [];
      
      walletSnap.forEach((doc) => {
        const data = doc.data();
        walletData.push({ id: doc.id, ...data } as WalletTransaction);
      });

      if (loadMore) {
        setWalletTransactions(prev => [...prev, ...walletData]);
      } else {
        setWalletTransactions(walletData);
      }

      // Update pagination state
      if (walletSnap.docs.length > 0) {
        setLastTransaction(walletSnap.docs[walletSnap.docs.length - 1]);
        setHasMoreTransactions(walletSnap.docs.length === transactionsPerPage);
      } else {
        setHasMoreTransactions(false);
      }

    } catch (error) {
      console.error("Error loading driver data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar los datos del reporte"
      });
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreTransactions = async () => {
    if (!user || loadingMore || !hasMoreTransactions) return;
    
    setLoadingMore(true);
    await loadDriverData(user.uid, true);
  };

  useEffect(() => {
    if(user) {
        loadDriverData(user.uid);
    }
  }, [user]);

  const exportToExcel = async () => {
    if (!user || !kpis) return;
    
    setIsExporting(true);
    try {
      const kpiData = [
        ["Métrica", "Valor"],
        ["Calificación Promedio", kpis.averageRating || 0],
        ["Tasa de Entregas a Tiempo (%)", kpis.onTimeRate || 0],
        ["Tasa de Aceptación (%)", kpis.acceptanceRate || 0],
        ["Total de Pedidos", kpis.totalOrders || 0],
      ];

      const ordersData = [
        ["Número de Pedido", "Estado", "Monto Total", "Comisión", "Método de Pago", "Dirección", "Fecha Creado"]
      ];
      orders.forEach(order => {
        ordersData.push([
          order.orderNumber || order.id,
          order.status,
          (order.totalAmount || 0).toString(),
          (order.driverCommission || 0).toString(),
          order.paymentMethod || "",
          order.dropoffAddress || "",
          order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : ""
        ]);
      });

      const transactionsData = [
        ["Fecha", "Tipo", "Monto", "Descripción"]
      ];
      walletTransactions.forEach(transaction => {
        transactionsData.push([
          transaction.createdAt ? new Date(transaction.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString(),
          transaction.type,
          transaction.amount.toString(),
          transaction.description || ""
        ]);
      });

      const workbook = XLSX.utils.book_new();
      const kpiWorksheet = XLSX.utils.aoa_to_sheet(kpiData);
      const ordersWorksheet = XLSX.utils.aoa_to_sheet(ordersData);
      const transactionsWorksheet = XLSX.utils.aoa_to_sheet(transactionsData);

      XLSX.utils.book_append_sheet(workbook, kpiWorksheet, "KPIs");
      XLSX.utils.book_append_sheet(workbook, ordersWorksheet, "Pedidos");
      XLSX.utils.book_append_sheet(workbook, transactionsWorksheet, "Transacciones");

      const fileName = `reporte_driver_${user.uid}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Reporte Exportado",
        description: "El reporte se ha descargado exitosamente"
      });

    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al exportar el reporte"
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-primary mr-4" />
      <p className="text-lg text-muted-foreground">Cargando reportes...</p>
    </div>
  );

  if (!kpis) return (
    <div className="text-center p-8">
      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
      <p className="text-muted-foreground">Aún no tienes datos de desempeño. Completa algunos pedidos para ver tus estadísticas.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto mt-12 p-6">
      <div className="flex justify-end">
        <Button 
          onClick={exportToExcel}
          disabled={isExporting}
          className="flex items-center gap-2"
          variant="outline"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          {isExporting ? 'Exportando...' : 'Exportar a Excel'}
        </Button>
      </div>
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.averageRating?.toFixed(1) || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">de 5.0 estrellas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Puntualidad</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.onTimeRate?.toFixed(1) || 'N/A'}%</div>
            <p className="text-xs text-muted-foreground">entregas a tiempo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">pedidos completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.totalEarnings?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">ganancias acumuladas</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {walletTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.type.includes('CREDIT') ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium">{transaction.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.createdAt ? new Date(transaction.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.type.includes('CREDIT') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type.includes('CREDIT') ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </p>
                  {transaction.description && (
                    <p className="text-sm text-muted-foreground">{transaction.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Real Pagination Controls */}
          {hasMoreTransactions && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={loadMoreTransactions}
                disabled={loadingMore}
                className="flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    Cargar más transacciones
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Show loading indicator when loading more */}
          {loadingMore && (
            <div className="flex justify-center mt-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          
          {/* Show message when no more transactions */}
          {!hasMoreTransactions && walletTransactions.length > 0 && (
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                No hay más transacciones para mostrar
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(DriverReportsPage, {
    role: 'DRIVER',
    redirectTo: '/repartidores/login',
});
