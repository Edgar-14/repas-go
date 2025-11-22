'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  DollarSign, 
  Download, 
  Calculator, 
  FileText, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import withAuth from '@/components/auth/withAuth';
import { Textarea } from '@/components/ui/textarea';
import { COLLECTIONS } from '@/lib/collections';
import { Section, PageToolbar } from '@/components/layout/primitives';
interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL' | 'INACTIVE';
  currentClassification: 'Empleado Cotizante' | 'Trabajador Independiente';
  walletBalance: number;
  pendingDebts: number;
  ingreso_bruto_mensual: number;
  horasTrabajadasMes: number;
  imssStatus: 'PROVISIONAL' | 'COTIZANDO' | 'INACTIVE';
  createdAt: Date;
}

interface PayrollRecord {
  id: string;
  driverId: string;
  driverName: string;
  period: string; // YYYY-MM
  grossIncome: number;
  hoursWorked: number;
  classification: 'Empleado Cotizante' | 'Trabajador Independiente';
  imssDeduction: number;
  netPay: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  processedAt?: Date;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
}

function PayrollPage() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [idseFile, setIdseFile] = useState<File | null>(null);
  const [idseNotes, setIdseNotes] = useState('');
  const [isUploadingIdse, setIsUploadingIdse] = useState(false);
  const [showIdseUploadDialog, setShowIdseUploadDialog] = useState(false);
  const [selectedDriverForIdse, setSelectedDriverForIdse] = useState<string>('');
  const [searchDriver, setSearchDriver] = useState('');

  // Calcular período actual
  const currentDate = new Date();
  const currentPeriod = format(currentDate, 'yyyy-MM');

  useEffect(() => {
    // Verificar que Firebase esté inicializado
    if (!db) {
      console.error('Firebase no está inicializado');
      toast({
        title: "Error de configuración",
        description: "Firebase no está configurado correctamente",
        variant: "destructive",
      });
      return;
    }

    let driversUnsubscribe: (() => void) | null = null;

    try {
      // Cargar drivers activos con manejo de errores mejorado
      driversUnsubscribe = onSnapshot(
        query(
          collection(db, 'drivers'),
          where('status', '==', 'ACTIVE'),
          orderBy('fullName', 'asc')
        ),
        (snapshot) => {
          try {
            const driversData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Driver[];
            
            setDrivers(driversData);
          } catch (error) {
            console.error('Error procesando datos de drivers:', error);
          }
        },
        (error) => {
          console.error('Error fetching drivers:', error);
          
          // Verificar si es un error de índice faltante
          if (error.message?.includes('index') || error.code === 'failed-precondition') {
            toast({
              title: "Índice requerido",
              description: "Se requiere crear un índice en Firebase Console. Consulta la consola para más detalles.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: "No se pudieron cargar los repartidores",
              variant: "destructive",
            });
          }
        }
      );
    } catch (error) {
      console.error('Error inicializando consulta de drivers:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo establecer conexión con la base de datos",
        variant: "destructive",
      });
    }

    // Cargar registros de nómina
    const payrollUnsubscribe = onSnapshot(
      query(
        collection(db, 'payrollRecords'),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const payrollData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          processedAt: doc.data().processedAt?.toDate(),
          paidAt: doc.data().paidAt?.toDate(),
        })) as PayrollRecord[];
        
        setPayrollRecords(payrollData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching payroll records:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los registros de nómina",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => {
      try {
        if (driversUnsubscribe) {
          driversUnsubscribe();
        }
        payrollUnsubscribe();
      } catch (error) {
        console.error('Error al limpiar suscripciones:', error);
      }
    };
  }, [toast]);

  const handleSelectAll = () => {
    if (selectedDrivers.length === drivers.length) {
      setSelectedDrivers([]);
    } else {
      setSelectedDrivers(drivers.map(driver => driver.id));
    }
  };

  const handleSelectDriver = (driverId: string) => {
    setSelectedDrivers(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const calculatePayroll = async () => {
    if (selectedDrivers.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un repartidor",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Llamar a la función de backend para procesar nómina
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const { app } = await import('@/lib/firebase');
      const functions = getFunctions(app);
      const processPayroll = httpsCallable(functions, 'processCompletePayroll');
      
      const result = await processPayroll({
        action: 'processCompletePayrollWithCompliance',
        payload: {
          period: new Date().toISOString().slice(0, 7), // YYYY-MM format
          driverIds: selectedDrivers,
          notes: 'Procesamiento de nómina mensual'
        }
      });

      toast({
        title: "Nómina procesada",
        description: `Nómina procesada exitosamente para ${selectedDrivers.length} repartidores.`,
      });

      setSelectedDrivers([]);
      setShowProcessDialog(false);

    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast({
        title: "Error",
        description: "No se pudo calcular la nómina",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const markAsPaid = async (recordId: string) => {
    try {
      await updateDoc(doc(db, 'payrollRecords', recordId), {
        status: 'PAID',
        paidAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: "Pago Registrado",
        description: "El pago ha sido marcado como completado",
      });
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar el pago",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { 
        label: 'Pendiente', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="w-3 h-3" />
      },
      'PROCESSED': { 
        label: 'Procesado', 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <CheckCircle className="w-3 h-3" />
      },
      'PAID': { 
        label: 'Pagado', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="w-3 h-3" />
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];
    
    return (
      <Badge className={`gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getClassificationBadge = (classification: string) => {
    const isEmployee = classification === 'Empleado Cotizante';
    
    return (
      <Badge className={`gap-1 ${isEmployee 
        ? 'bg-purple-100 text-purple-800 border-purple-200' 
        : 'bg-orange-100 text-orange-800 border-orange-200'
      }`}>
        {isEmployee ? 'Empleado' : 'Independiente'}
      </Badge>
    );
  };

  const exportToExcel = () => {
    // Función simplificada para exportar a Excel
    const csvContent = [
      ['Repartidor', 'Período', 'Ingreso Bruto', 'Horas Trabajadas', 'Clasificación', 'Deducción IMSS', 'Pago Neto', 'Estado'],
      ...payrollRecords.map(record => [
        record.driverName,
        record.period,
        record.grossIncome.toFixed(2),
        record.hoursWorked.toFixed(2),
        record.classification,
        record.imssDeduction.toFixed(2),
        record.netPay.toFixed(2),
        record.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nomina_${selectedPeriod}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportación Completada",
      description: "El archivo de nómina ha sido descargado",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* UI Universal: Section + PageToolbar */}
      <Section>
        <PageToolbar
          left={
            <div className="text-sm text-muted-foreground">
              Procesamiento manual de nómina para repartidores
            </div>
          }
          right={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={exportToExcel} className="text-xs sm:text-sm w-full sm:w-auto">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar Excel</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm w-full sm:w-auto"
                onClick={async () => {
                  try {
                    const functions = getFunctions(app);
                    const exportPayrollReport = httpsCallable(functions, 'exportPayrollReport');
                    const result = await exportPayrollReport({
                      period: new Date().toISOString().slice(0, 7),
                      format: 'xlsx'
                    });
                    
                    if ((result.data as any).success) {
                      toast({
                        title: 'Reporte generado',
                        description: 'El reporte de cierre mensual se ha generado exitosamente',
                      });
                      const link = document.createElement('a');
                      link.href = (result.data as any).downloadUrl;
                      link.download = `reporte_cierre_mensual_${new Date().toISOString().slice(0, 7)}.xlsx`;
                      link.click();
                    } else {
                      throw new Error((result.data as any).message || 'Error al generar reporte');
                    }
                  } catch (error) {
                    console.error('Error exporting payroll report:', error);
                    toast({
                      variant: 'destructive',
                      title: 'Error al exportar',
                      description: 'No se pudo generar el reporte de cierre mensual',
                    });
                  }
                }}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Reporte Mensual</span>
                <span className="sm:hidden">Reporte</span>
              </Button>
              <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
                    <Calculator className="h-4 w-4" />
                    <span className="hidden sm:inline">Procesar Nómina</span>
                    <span className="sm:hidden">Procesar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Procesar Nómina del Período</DialogTitle>
                    <DialogDescription>
                      Selecciona los repartidores y calcula la nómina para el período seleccionado
                    </DialogDescription>
                  </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="period">Período</Label>
                    <Input
                      id="period"
                      type="month"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedDrivers.length === drivers.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </Button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedDrivers.length === drivers.length}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>Repartidor</TableHead>
                        <TableHead>Clasificación</TableHead>
                        <TableHead>Ingreso Bruto</TableHead>
                        <TableHead>Horas Trabajadas</TableHead>
                        <TableHead>Estado IMSS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedDrivers.includes(driver.id)}
                              onChange={() => handleSelectDriver(driver.id)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{driver.fullName}</div>
                              <div className="text-sm text-gray-500">{driver.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getClassificationBadge(driver.currentClassification)}
                          </TableCell>
                          <TableCell>
                            <div className="font-mono">
                              ${(driver.ingreso_bruto_mensual || 0).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono">
                              {(driver.horasTrabajadasMes || 0).toFixed(1)} hrs
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {driver.imssStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowProcessDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={calculatePayroll}
                  disabled={isProcessing || selectedDrivers.length === 0}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calcular Nómina ({selectedDrivers.length})
                    </>
                  )}
                </Button>
              </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={showIdseUploadDialog} onOpenChange={(open) => {
            setShowIdseUploadDialog(open);
            if (!open) {
              setIdseFile(null);
              setIdseNotes('');
              setSelectedDriverForIdse('');
              setSearchDriver('');
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Subir Acta IDSE Consolidada
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Cargar Acta IDSE Consolidada</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="driver-select">Repartidor</Label>
                  <Select value={selectedDriverForIdse} onValueChange={setSelectedDriverForIdse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar repartidor" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.fullName} - {driver.imssStatus || 'PROVISIONAL'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="idse-file">Archivo IDSE (TXT/PDF)</Label>
                  <Input
                    id="idse-file"
                    type="file"
                    accept=".txt,.pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setIdseFile(file);
                    }}
                    className="cursor-pointer"
                  />
                  {idseFile ? (
                    <p className="text-xs text-green-600 mt-1 font-medium">✓ {idseFile.name}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Formatos aceptados: TXT, PDF</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="idse-notes">Notas (opcional)</Label>
                  <Textarea
                    id="idse-notes"
                    placeholder="Acuse de recibo, folio IMSS, comentarios adicionales"
                    value={idseNotes}
                    onChange={(event) => setIdseNotes(event.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowIdseUploadDialog(false);
                    setIdseFile(null);
                    setIdseNotes('');
                  }}
                  disabled={isUploadingIdse}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (!idseFile) {
                      toast({
                        title: 'Archivo requerido',
                        description: 'Selecciona un archivo IDSE antes de continuar.',
                        variant: 'destructive'
                      });
                      return;
                    }

                    try {
                      setIsUploadingIdse(true);

                      const fileName = `IDSE_${selectedPeriod}_${new Date().toISOString()}_${idseFile.name}`;
                      const storagePath = `idse/consolidated/${fileName}`;
                      const fileRef = storageRef(storage, storagePath);
                      await uploadBytes(fileRef, idseFile);
                      const downloadUrl = await getDownloadURL(fileRef);

                      const idseDocRef = await addDoc(collection(db, COLLECTIONS.IDSE_FILES), {
                        type: 'consolidated',
                        storagePath,
                        downloadUrl,
                        notes: idseNotes || '',
                        status: 'uploaded',
                        period: selectedPeriod,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      });

                      const functions = getFunctions(app);
                      const processIdseUpload = httpsCallable(functions, 'processIdseUpload');
                      const res: any = await processIdseUpload({ fileUrl: downloadUrl, period: selectedPeriod });

                      await updateDoc(idseDocRef, {
                        status: 'processed',
                        processedAt: new Date(),
                        ingestionId: res?.data?.ingestionId || null,
                        processed: res?.data?.processed || 0,
                        updated: res?.data?.updated || 0,
                        unmatched: res?.data?.unmatched || 0,
                        errors: res?.data?.errors || 0,
                      });

                      toast({
                        title: 'Acta IDSE procesada exitosamente',
                        description: `✅ ${res?.data?.updated || 0} repartidores actualizados | ⚠️ ${res?.data?.unmatched || 0} sin coincidencia | ❌ ${res?.data?.errors || 0} errores`,
                      });

                      setShowIdseUploadDialog(false);
                      setIdseFile(null);
                      setIdseNotes('');
                    } catch (error: any) {
                      console.error('Error subiendo archivo IDSE:', error);
                      toast({
                        title: 'Error al procesar archivo',
                        description: error.message || 'No se pudo procesar el archivo IDSE',
                        variant: 'destructive'
                      });
                    } finally {
                      setIsUploadingIdse(false);
                    }
                  }}
                  disabled={!idseFile || isUploadingIdse}
                >
                  {isUploadingIdse ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    'Procesar Archivo'
                  )}
                </Button>
              </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />
      </Section>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Registros</p>
                <p className="text-2xl font-bold text-gray-900">{payrollRecords.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {payrollRecords.filter(r => r.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Procesados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {payrollRecords.filter(r => r.status === 'PROCESSED').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagados</p>
                <p className="text-2xl font-bold text-green-600">
                  {payrollRecords.filter(r => r.status === 'PAID').length}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de registros de nómina */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Nómina</CardTitle>
          <CardDescription>
            Historial de procesamiento de nómina por período
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollRecords.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros de nómina</h3>
              <p className="text-gray-500 mb-6">
                Procesa la nómina para el período actual para comenzar
              </p>
              <Button onClick={() => setShowProcessDialog(true)}>
                <Calculator className="w-4 h-4 mr-2" />
                Procesar Primera Nómina
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repartidor</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Clasificación</TableHead>
                    <TableHead>Ingreso Bruto</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Deducción IMSS</TableHead>
                    <TableHead>Pago Neto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{record.driverName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{record.period}</div>
                      </TableCell>
                      <TableCell>
                        {getClassificationBadge(record.classification)}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-medium text-green-600">
                          ${record.grossIncome.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono">
                          {record.hoursWorked.toFixed(1)} hrs
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-red-600">
                          ${record.imssDeduction.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-bold text-blue-600">
                          ${record.netPay.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {format(record.createdAt, 'dd/MM/yyyy', { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.status === 'PROCESSED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsPaid(record.id)}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Marcar Pagado
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(PayrollPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
