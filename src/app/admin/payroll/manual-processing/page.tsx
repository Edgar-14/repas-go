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
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
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

interface ManualPayrollRecord {
  id: string;
  driverId: string;
  driverName: string;
  period: string; // YYYY-MM
  grossIncome: number;
  hoursWorked: number;
  classification: 'Empleado Cotizante' | 'Trabajador Independiente';
  imssDeduction: number;
  isrDeduction: number;
  netPay: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  processedAt?: Date;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  isManual: boolean;
}

function ManualProcessingPage() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [manualRecords, setManualRecords] = useState<ManualPayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [customGrossIncome, setCustomGrossIncome] = useState<{[key: string]: number}>({});
  const [customHours, setCustomHours] = useState<{[key: string]: number}>({});

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

    // Cargar registros de nómina manual
    const manualUnsubscribe = onSnapshot(
      query(
        collection(db, 'manualPayrollRecords'),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const manualData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          processedAt: doc.data().processedAt?.toDate(),
          paidAt: doc.data().paidAt?.toDate(),
        })) as ManualPayrollRecord[];
        
        setManualRecords(manualData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching manual payroll records:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los registros de nómina manual",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => {
      driversUnsubscribe?.();
      manualUnsubscribe();
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

  const handleCustomIncomeChange = (driverId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomGrossIncome(prev => ({
      ...prev,
      [driverId]: numValue
    }));
  };

  const handleCustomHoursChange = (driverId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomHours(prev => ({
      ...prev,
      [driverId]: numValue
    }));
  };

  const calculateManualPayroll = async () => {
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
      const selectedDriversData = drivers.filter(driver => 
        selectedDrivers.includes(driver.id)
      );

      const payrollPromises = selectedDriversData.map(async (driver) => {
        const grossIncome = customGrossIncome[driver.id] || driver.ingreso_bruto_mensual || 0;
        const hoursWorked = customHours[driver.id] || driver.horasTrabajadasMes || 0;
        const classification = driver.currentClassification || 'Trabajador Independiente';
        
        // Calcular deducciones
        let imssDeduction = 0;
        let isrDeduction = 0;
        
        if (classification === 'Empleado Cotizante') {
          // 2.25% del salario base para IMSS
          imssDeduction = grossIncome * 0.0225;
          // ISR simplificado (10% sobre ingresos > $10,000)
          if (grossIncome > 10000) {
            isrDeduction = (grossIncome - 10000) * 0.10;
          }
        }
        
        const netPay = grossIncome - imssDeduction - isrDeduction;

        const manualRecord: Omit<ManualPayrollRecord, 'id'> = {
          driverId: driver.id,
          driverName: driver.fullName,
          period: selectedPeriod,
          grossIncome,
          hoursWorked,
          classification,
          imssDeduction,
          isrDeduction,
          netPay,
          status: 'PENDING',
          createdAt: new Date(),
          isManual: true,
        };

        return addDoc(collection(db, 'manualPayrollRecords'), manualRecord);
      });

      await Promise.all(payrollPromises);

      toast({
        title: "Nómina Manual Calculada",
        description: `${selectedDrivers.length} registro(s) de nómina manual creado(s) exitosamente`,
      });

      setSelectedDrivers([]);
      setCustomGrossIncome({});
      setCustomHours({});
      setShowProcessDialog(false);

    } catch (error) {
      console.error('Error calculating manual payroll:', error);
      toast({
        title: "Error",
        description: "No se pudo calcular la nómina manual",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const markAsPaid = async (recordId: string) => {
    try {
      await updateDoc(doc(db, 'manualPayrollRecords', recordId), {
        status: 'PAID',
        paidAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: "Pago Registrado",
        description: "El pago manual ha sido marcado como completado",
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
    const csvContent = [
      ['Repartidor', 'Período', 'Ingreso Bruto', 'Horas Trabajadas', 'Clasificación', 'Deducción IMSS', 'Deducción ISR', 'Pago Neto', 'Estado'],
      ...manualRecords.map(record => [
        record.driverName,
        record.period,
        record.grossIncome.toFixed(2),
        record.hoursWorked.toFixed(2),
        record.classification,
        record.imssDeduction.toFixed(2),
        record.isrDeduction.toFixed(2),
        record.netPay.toFixed(2),
        record.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nomina_manual_${selectedPeriod}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportación Completada",
      description: "El archivo de nómina manual ha sido descargado",
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/payroll">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Nómina
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Procesamiento Manual de Nómina</h1>
            <p className="text-gray-600">Procesamiento manual con valores personalizados</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Calculator className="w-4 h-4 mr-2" />
                Procesar Nómina Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle>Procesamiento Manual de Nómina</DialogTitle>
                <DialogDescription>
                  Configura valores personalizados para cada repartidor y calcula la nómina
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
                            <Input
                              type="number"
                              placeholder={driver.ingreso_bruto_mensual?.toString() || "0"}
                              value={customGrossIncome[driver.id] || ''}
                              onChange={(e) => handleCustomIncomeChange(driver.id, e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder={driver.horasTrabajadasMes?.toString() || "0"}
                              value={customHours[driver.id] || ''}
                              onChange={(e) => handleCustomHoursChange(driver.id, e.target.value)}
                              className="w-20"
                            />
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
                  onClick={calculateManualPayroll}
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
                      Calcular Nómina Manual ({selectedDrivers.length})
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Registros Manuales</p>
                <p className="text-2xl font-bold text-gray-900">{manualRecords.length}</p>
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
                  {manualRecords.filter(r => r.status === 'PENDING').length}
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
                  {manualRecords.filter(r => r.status === 'PROCESSED').length}
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
                  {manualRecords.filter(r => r.status === 'PAID').length}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de registros de nómina manual */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Nómina Manual</CardTitle>
          <CardDescription>
            Historial de procesamiento manual de nómina por período
          </CardDescription>
        </CardHeader>
        <CardContent>
          {manualRecords.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros de nómina manual</h3>
              <p className="text-gray-500 mb-6">
                Procesa la nómina manual para el período actual para comenzar
              </p>
              <Button onClick={() => setShowProcessDialog(true)}>
                <Calculator className="w-4 h-4 mr-2" />
                Procesar Primera Nómina Manual
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
                    <TableHead>Deducción ISR</TableHead>
                    <TableHead>Pago Neto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualRecords.map((record) => (
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
                        <div className="font-mono text-red-600">
                          ${record.isrDeduction.toFixed(2)}
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

export default withAuth(ManualProcessingPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
