'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDriverData } from '@/hooks/useRealtimeData';
import withAuth from '@/components/auth/withAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PayrollReceipt {
  id: string;
  period: string;
  year: number;
  month: number;
  grossIncome: number;
  netIncome: number;
  classification: 'Empleado Cotizante' | 'Trabajador Independiente';
  status: 'generated' | 'sent' | 'downloaded';
  cfdiUrl?: string;
  xmlUrl?: string;
  generatedAt: any;
  downloadedAt?: any;
  notes?: string;
}

interface DriverPayrollData {
  totalReceipts: number;
  currentYear: number;
  totalGrossIncome: number;
  totalNetIncome: number;
  lastReceipt?: PayrollReceipt;
  classification: string;
}

function DriverPayrollPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { driver, loading: driverLoading, error: driverError } = useDriverData(user?.uid || null);
  const [payrollData, setPayrollData] = useState<DriverPayrollData | null>(null);
  const [receipts, setReceipts] = useState<PayrollReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (driverError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la información del conductor.',
      });
    }
  }, [driverError, toast]);

  useEffect(() => {
    if (user?.uid && driver) {
      loadPayrollData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, driver]);

  const loadPayrollData = async () => {
    if (!user?.uid || !driver) return;
    try {
      setIsLoading(true);
      const receiptsQuery = query(
        collection(db, 'payrollReceipts'),
        where('driverId', '==', user.uid),
        orderBy('generatedAt', 'desc')
      );
      
      const receiptsSnapshot = await getDocs(receiptsQuery);
      const receiptsData = receiptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PayrollReceipt[];
      
      setReceipts(receiptsData);
      
      const currentYear = new Date().getFullYear();
      const currentYearReceipts = receiptsData.filter(r => r.year === currentYear);
      const totalGrossIncome = currentYearReceipts.reduce((sum, r) => sum + r.grossIncome, 0);
      const totalNetIncome = currentYearReceipts.reduce((sum, r) => sum + r.netIncome, 0);
      
      setPayrollData({
        totalReceipts: currentYearReceipts.length,
        currentYear,
        totalGrossIncome,
        totalNetIncome,
        lastReceipt: receiptsData[0],
        classification: (driver as any).classification || 'No clasificado'
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Error al cargar los datos de nómina' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (receipt: PayrollReceipt, type: 'cfdi' | 'xml') => {
    const url = type === 'cfdi' ? receipt.cfdiUrl : receipt.xmlUrl;
    const fileType = type.toUpperCase();

    if (!url) {
      return toast({ variant: 'destructive', title: 'Error', description: `El archivo ${fileType} no está disponible` });
    }

    setDownloading(receipt.id);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileType}_${receipt.period}_${user?.email}.${type === 'cfdi' ? 'pdf' : 'xml'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: 'Descarga iniciada', description: `El archivo ${fileType} se está descargando` });

      if (type === 'cfdi' && receipt.status !== 'downloaded') {
        await updateDoc(doc(db, 'payrollReceipts', receipt.id), {
          downloadedAt: new Date(),
          status: 'downloaded'
        });
        // Actualiza el estado local para reflejar el cambio inmediatamente
        setReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, status: 'downloaded' } : r));
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: `Error al descargar el ${fileType}` });
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Generado</Badge>;
      case 'sent':
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Enviado</Badge>;
      case 'downloaded':
        return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700"><Download className="w-3 h-3 mr-1" />Descargado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getClassificationBadge = (classification: string) => {
    if (classification === 'Empleado Cotizante') {
      return <Badge className="bg-blue-100 text-blue-800">Empleado Cotizante</Badge>;
    } else if (classification === 'Trabajador Independiente') {
      return <Badge className="bg-green-100 text-green-800">Independiente</Badge>;
    }
    return <Badge variant="outline">No clasificado</Badge>;
  };

  if (driverLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3 text-muted-foreground">Cargando información de nómina...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {payrollData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comprobantes ({payrollData.currentYear})</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrollData.totalReceipts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Brutos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${payrollData.totalGrossIncome.toLocaleString('es-MX')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${payrollData.totalNetIncome.toLocaleString('es-MX')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clasificación Fiscal</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {getClassificationBadge(payrollData.classification)}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4" />
            Historial de Comprobantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="font-semibold text-gray-700">Aún no tienes comprobantes</p>
              <p className="text-sm text-muted-foreground mt-1">Los comprobantes se generan automáticamente cada mes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Ingreso Neto</TableHead>
                    <TableHead>Clasificación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">
                        {format(new Date(receipt.year, receipt.month - 1), 'MMMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>${receipt.netIncome.toLocaleString('es-MX')}</TableCell>
                      <TableCell>{getClassificationBadge(receipt.classification)}</TableCell>
                      <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => handleDownload(receipt, 'cfdi')} disabled={!receipt.cfdiUrl || downloading === receipt.id} className="gap-1.5">
                            {downloading === receipt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                            PDF
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownload(receipt, 'xml')} disabled={!receipt.xmlUrl || downloading === receipt.id} className="gap-1.5">
                            {downloading === receipt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                            XML
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-800">
            <AlertCircle className="h-4 w-4" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 text-xs space-y-2 pl-8">
          <ul className="list-disc">
            <li>Los comprobantes CFDI se generan automáticamente cada mes.</li>
            <li>Descarga tanto el PDF como el XML para tu declaración de impuestos.</li>
            <li>Si no recibes tu comprobante a tiempo, contacta a soporte.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(DriverPayrollPage, {
  role: 'DRIVER',
  redirectTo: '/repartidores/login'
});