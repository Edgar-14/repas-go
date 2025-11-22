'use client';

import React, { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDriverData } from "@/hooks/useRealtimeData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  TrendingUp,
  Loader2,
  AlertCircle,
  Download,
  Wallet,
  FileText,
  PiggyBank,
  Target,
  Zap,
  Shield,
  Star,
  CreditCard,
  Banknote,
  CheckCircle
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Section, PageToolbar } from '@/components/layout/primitives';

function DriverWalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { driver, transactions, orders, loading, error } = useDriverData(user?.uid || null);

  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const walletStats = useMemo(() => {
    if (!transactions || !driver) {
      return {
        balance: 0,
        totalEarnings: 0,
        monthlyEarnings: 0,
        completedDeliveries: 0,
        cashDeliveries: 0,
        cardPayments: 0,
        tips: 0,
        cashCollected: 0,
        baseCommissions: 0,
      };
    }

    const now = new Date();
    const startOfThisMonth = startOfMonth(now);

    // Calculate from transactions
    const cardPayments = transactions.filter(t => t.type === 'CARD_ORDER_TRANSFER');
    const tips = transactions.filter(t => t.type === 'TIP_CARD_TRANSFER');
    const cardEarnings = cardPayments.reduce((sum, t) => sum + t.amount, 0);
    const tipsTotal = tips.reduce((sum, t) => sum + t.amount, 0);
    const totalEarnings = cardEarnings + tipsTotal;

    const monthlyEarnings = transactions
      .filter(t => 
        (t.type === 'CARD_ORDER_TRANSFER' || t.type === 'TIP_CARD_TRANSFER') &&
        (t.createdAt?.toDate() ?? new Date(0)) >= startOfThisMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate from orders if available
    let completedDeliveries = 0;
    let cashDeliveries = 0;
    let cashCollected = 0;
    let baseCommissions = 0;

    if (orders && orders.length > 0) {
      const completedOrders = orders.filter(o => 
        o.status === 'DELIVERED' || o.status === 'COMPLETED'
      );
      completedDeliveries = completedOrders.length;
      
      const cashOrders = completedOrders.filter(o => o.paymentMethod === 'CASH');
      cashDeliveries = cashOrders.length;
      cashCollected = cashOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      
      baseCommissions = completedOrders.reduce((sum, o) => 
        sum + (o.driverCommission || o.driverEarnings || 0), 0
      );
    }

    return {
      balance: driver.walletBalance || 0,
      totalEarnings,
      monthlyEarnings,
      completedDeliveries,
      cashDeliveries,
      cardPayments: cardPayments.length,
      tips: tips.length,
      cashCollected,
      baseCommissions,
    };
  }, [transactions, driver, orders]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    if (filter !== 'all') {
      filtered = filtered.filter(t => t.type === filter);
    }

    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      default:
        // 'all' case
        return filtered.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
    }

    return filtered
      .filter(t => (t.createdAt?.toDate() ?? new Date(0)) >= startDate)
      .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  }, [transactions, filter, dateRange]);

  const exportTransactions = async () => {
    if (!user || !driver || !transactions) return;

    try {
      const workbook = XLSX.utils.book_new();

      const summaryData = [
        ['Reporte de Billetera - BeFast'],
        [''],
        ['Conductor', driver.fullName],
        ['Email', driver.email],
        ['Saldo Actual', formatCurrency(walletStats.balance)],
        ['Ganancias Totales (Histórico)', formatCurrency(walletStats.totalEarnings)],
        ['Ganancias del Mes Actual', formatCurrency(walletStats.monthlyEarnings)],
        [''],
        ['Fecha de Generación', new Date().toLocaleString('es-MX')]
      ];
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, 'Resumen');

      const transactionHeaders = ['Fecha', 'Tipo', 'Monto', 'Descripción', 'ID Pedido', 'Saldo Anterior', 'Saldo Después'];
      const transactionData = [
        transactionHeaders,
        ...filteredTransactions.map(transaction => [
          transaction.createdAt?.toDate() ? format(transaction.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A',
          getTransactionTypeText(transaction.type),
          transaction.amount,
          transaction.description,
          transaction.orderId || 'N/A',
          transaction.previousBalance || 0,
          transaction.newBalance || 0
        ])
      ];
      const transactionsWS = XLSX.utils.aoa_to_sheet(transactionData);
      XLSX.utils.book_append_sheet(workbook, transactionsWS, 'Transacciones');

      const fileName = `billetera-${driver.fullName?.replace(/\s+/g, '-') || 'conductor'}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: 'Reporte exportado',
        description: `Se ha descargado el reporte: ${fileName}`,
      });

    } catch (err) {
      console.error('Error exporting transactions:', err);
      toast({
        title: 'Error al exportar',
        description: 'No se pudo generar el reporte',
        variant: 'destructive'
      });
    }
  };

  const getTransactionTypeText = (type: string): string => {
    const types: Record<string, string> = {
      'CARD_ORDER_TRANSFER': 'Ganancia (Tarjeta)',
      'TIP_CARD_TRANSFER': 'Propina (Tarjeta)',
      'CASH_ORDER_ADEUDO': 'Adeudo (Efectivo)',
      'DEBT_PAYMENT': 'Pago de deuda',
      'BENEFITS_TRANSFER': 'Beneficios',
      'ADJUSTMENT': 'Ajuste manual'
    };
    return types[type] || type;
  };

  const liquidateDebt = () => {
    if (!driver || (driver.pendingDebts || 0) <= 0) {
      toast({
        title: 'Sin deuda',
        description: 'No tienes comisiones pendientes por depositar.',
      });
      return;
    }
    router.push('/repartidores/liquidate-debt');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-lg text-gray-600">Error cargando datos de billetera</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-lg text-gray-600">No se encontró tu perfil de conductor</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'CARD_ORDER_TRANSFER': <CreditCard className="h-5 w-5 text-emerald-600" />,
      'TIP_CARD_TRANSFER': <Star className="h-5 w-5 text-yellow-500" />,
      'CASH_ORDER_ADEUDO': <Banknote className="h-5 w-5 text-blue-600" />,
      'DEBT_PAYMENT': <CheckCircle className="h-5 w-5 text-green-600" />,
      'ADJUSTMENT': <TrendingUp className="h-5 w-5 text-purple-600" />
    };
    return icons[type] || <DollarSign className="h-5 w-5" />;
  };

  const hasDebt = (driver?.pendingDebts || 0) > 0;
  const debtPercentageWallet = hasDebt ? Math.min(((driver?.pendingDebts || 0) / (driver?.driverDebtLimit || 300)) * 100, 100) : 0;
  const netBalance = (walletStats.totalEarnings || 0) - (driver?.pendingDebts || 0);

  return (
    <div className="space-y-6">
      {/* UI Universal: Section + PageToolbar */}
      <Section>
        <PageToolbar
          right={
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={liquidateDebt} disabled={!hasDebt} size="sm">
                <DollarSign /> Depositar
              </Button>
              <Button variant="outline" onClick={exportTransactions} size="sm">
                <Download /> Exportar
              </Button>
            </div>
          }
        />
      </Section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Wallet className="h-5 w-5" />
            Saldo Disponible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className={`text-5xl font-bold mb-1 ${hasDebt ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(walletStats.balance || 0)}
            </p>
            <p className="text-sm text-muted-foreground">MXN</p>

            {hasDebt && (
              <div className="mt-6 max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-800">Comisiones por Depositar</span>
                </div>
                <p className="text-2xl font-bold text-red-600 mb-2">{formatCurrency(driver?.pendingDebts || 0)}</p>
                <Progress value={debtPercentageWallet} className="h-2 mb-2" />
                <p className="text-xs text-gray-600">
                  {debtPercentageWallet.toFixed(0)}% de tu límite de {formatCurrency(driver?.driverDebtLimit || 0)} usado.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancias del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(walletStats.monthlyEarnings || 0)}</div>
            <p className="text-xs text-muted-foreground">Ingresos de este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adeudos Pendientes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(driver?.pendingDebts || 0)}</div>
            <p className="text-xs text-muted-foreground">Comisiones por depositar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Neto Histórico</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Ganancias - Adeudos</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas adicionales de estado financiero */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado Financiero Detallado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{walletStats.completedDeliveries}</p>
              <p className="text-xs text-muted-foreground text-center">Entregas completadas</p>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
              <Banknote className="h-5 w-5 text-green-600 mb-2" />
              <p className="text-2xl font-bold">{walletStats.cashDeliveries}</p>
              <p className="text-xs text-muted-foreground text-center">Entregas en efectivo</p>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{walletStats.cardPayments}</p>
              <p className="text-xs text-muted-foreground text-center">Pagos con tarjeta</p>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600 mb-2" />
              <p className="text-2xl font-bold">{walletStats.tips}</p>
              <p className="text-xs text-muted-foreground text-center">Propinas recibidas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Banknote className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Dinero Recogido en Efectivo</p>
                  <p className="text-xs text-muted-foreground">Total de pedidos en efectivo</p>
                </div>
              </div>
              <p className="text-lg font-bold">{formatCurrency(walletStats.cashCollected)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="summary">Resumen y Consejos</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Tipo</label>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="CARD_ORDER_TRANSFER">Ganancias</SelectItem>
                      <SelectItem value="CASH_ORDER_ADEUDO">Adeudos</SelectItem>
                      <SelectItem value="DEBT_PAYMENT">Pagos de adeudo</SelectItem>
                      <SelectItem value="ADJUSTMENT">Ajustes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Periodo</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hoy</SelectItem>
                      <SelectItem value="week">Esta semana</SelectItem>
                      <SelectItem value="month">Este mes</SelectItem>
                      <SelectItem value="all">Todo el historial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">No hay transacciones</h3>
                  <p className="text-sm text-muted-foreground">Prueba a seleccionar otro periodo o tipo de filtro.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium text-sm">{getTransactionTypeText(transaction.type)}</p>
                          {transaction.orderId && (<p className="text-xs text-muted-foreground">Pedido #{transaction.orderId.slice(-6)}</p>)}
                          <p className="text-xs text-muted-foreground">{transaction.createdAt?.toDate() ? format(transaction.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: es }) : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">Saldo: {formatCurrency(transaction.newBalance || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Target className="h-5 w-5 text-muted-foreground" />
                Resumen del Periodo ({dateRange === 'all' ? 'Histórico' : dateRange})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-green-600" /><p className="font-medium text-sm">Ingresos Totales</p></div>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0))}</p>
                </div>
                <div className="p-4 border rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-red-600" /><p className="font-medium text-sm">Adeudos y Retiros</p></div>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))}</p>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Consejos Financieros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasDebt ? (
                <>
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-yellow-800">Deposita tus comisiones regularmente</p>
                      <p className="text-xs text-yellow-700 mt-1">Mantén tus adeudos bajo control para evitar que tu cuenta sea restringida y seguir recibiendo pedidos.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-blue-800">Aumenta tus entregas con tarjeta</p>
                      <p className="text-xs text-blue-700 mt-1">Más entregas con tarjeta se traducen en más transferencias directas a tu favor en la billetera.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-green-800">¡Excelente trabajo!</p>
                      <p className="text-xs text-green-700 mt-1">No tienes adeudos pendientes. Sigue manteniendo un saldo positivo para maximizar tus ganancias.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
                    <PiggyBank className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Planifica tus finanzas</p>
                      <p className="text-xs text-muted-foreground mt-1">Considera establecer metas de ahorro con las ganancias que generas.</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAuth(DriverWalletPage, {
  redirectTo: '/repartidores/login',
});