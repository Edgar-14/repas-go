'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  Users, 
  FileText, 
  User,
  Activity,
  AlertCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import withAuth from '@/components/auth/withAuth';
import { Section, PageToolbar } from '@/components/layout/primitives';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface ComplianceAlert {
  id: string;
  type: 'IMSS_DEADLINE' | 'DOCUMENT_EXPIRY' | 'CLASSIFICATION_CHANGE' | 'PAYROLL_OVERDUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  driverId?: string;
  driverName?: string;
  dueDate?: Date;
  createdAt: Date;
  resolved: boolean;
}

interface DriverCompliance {
  id: string;
  fullName: string;
  currentClassification: 'Empleado Cotizante' | 'Trabajador Independiente';
  imssStatus: 'PROVISIONAL' | 'COTIZANDO' | 'INACTIVE' | 'REQUIRES_AFFILIATION' | 'REQUIRES_RISK_INSURANCE';
  ingreso_bruto_mensual: number;
  horasTrabajadasMes: number;
  documentsStatus: {
    licencia: 'VALID' | 'EXPIRED' | 'MISSING';
    ine: 'VALID' | 'EXPIRED' | 'MISSING';
    vehicleRegistration: 'VALID' | 'EXPIRED' | 'MISSING';
  };
  lastClassificationDate?: Date;
  complianceScore: number;
}

function ComplianceCenterPage() {
  // const { toast } = useToast();
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [drivers, setDrivers] = useState<DriverCompliance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar alertas de cumplimiento
    const alertsUnsubscribe = onSnapshot(
      query(
        collection(db, 'complianceAlerts'),
        where('resolved', '==', false),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const alertsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          dueDate: doc.data().dueDate?.toDate(),
        })) as ComplianceAlert[];
        
        setAlerts(alertsData);
      },
      (error) => {
        console.error('Error fetching compliance alerts:', error);
      }
    );

    // Cargar drivers para análisis de cumplimiento
    const driversUnsubscribe = onSnapshot(
      query(
        collection(db, 'drivers'),
        where('status', '==', 'ACTIVE')
      ),
      (snapshot) => {
        const driversData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            fullName: data.fullName || 'Sin nombre',
            currentClassification: data.currentClassification || 'Trabajador Independiente',
            imssStatus: data.imssStatus || 'INACTIVE',
            ingreso_bruto_mensual: data.ingreso_bruto_mensual || 0,
            horasTrabajadasMes: data.horasTrabajadasMes || 0,
            documentsStatus: {
              licencia: data.documents?.licencia?.status || 'MISSING',
              ine: data.documents?.ine?.status || 'MISSING',
              vehicleRegistration: data.documents?.vehicleRegistration?.status || 'MISSING',
            },
            lastClassificationDate: data.lastClassificationDate?.toDate(),
            complianceScore: calculateComplianceScore(data),
          };
        }) as DriverCompliance[];
        
        setDrivers(driversData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching drivers:', error);
        setLoading(false);
      }
    );

    return () => {
      alertsUnsubscribe();
      driversUnsubscribe();
    };
  }, []);

  const calculateComplianceScore = (driverData: any): number => {
    let score = 0;
    let totalChecks = 0;

    // Verificar clasificación laboral
    totalChecks++;
    if (driverData.currentClassification === 'Empleado Cotizante' && driverData.imssStatus === 'COTIZANDO') {
      score += 1;
    } else if (driverData.currentClassification === 'Trabajador Independiente' && driverData.imssStatus === 'REQUIRES_RISK_INSURANCE') {
      score += 0.8;
    } else if (driverData.imssStatus === 'PROVISIONAL') {
      score += 0.5;
    }

    // Verificar documentos
    const documents = driverData.documents || {};
    const requiredDocs = ['licencia', 'ine', 'vehicleRegistration'];
    
    requiredDocs.forEach(docType => {
      totalChecks++;
      const doc = documents[docType];
      if (doc && doc.status === 'APPROVED') {
        score += 1;
      } else if (doc && doc.status === 'PENDING') {
        score += 0.3;
      }
    });

    // Verificar ingresos para clasificación
    totalChecks++;
    const monthlyIncome = driverData.ingreso_bruto_mensual || 0;
    const monthlyHours = driverData.horasTrabajadasMes || 0;
    
    if (monthlyIncome >= 8364 || monthlyHours >= 120) {
      // Debería ser empleado
      if (driverData.currentClassification === 'Empleado Cotizante') {
        score += 1;
      } else {
        score += 0.2; // Clasificación incorrecta
      }
    } else {
      // Puede ser independiente
      if (driverData.currentClassification === 'Trabajador Independiente') {
        score += 1;
      } else {
        score += 0.8; // Posiblemente correcto
      }
    }

    return Math.round((score / totalChecks) * 100);
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      'LOW': { 
        label: 'Baja', 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Info className="w-3 h-3" />
      },
      'MEDIUM': { 
        label: 'Media', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <AlertTriangle className="w-3 h-3" />
      },
      'HIGH': { 
        label: 'Alta', 
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <AlertCircle className="w-3 h-3" />
      },
      'CRITICAL': { 
        label: 'Crítica', 
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-3 h-3" />
      }
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig['LOW'];
    
    return (
      <Badge className={`gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getComplianceScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getIMSSStatusBadge = (status: string) => {
    const statusConfig = {
      'COTIZANDO': { 
        label: 'Cotizando', 
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      'PROVISIONAL': { 
        label: 'Provisional', 
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      'REQUIRES_AFFILIATION': { 
        label: 'Requiere Alta', 
        className: 'bg-orange-100 text-orange-800 border-orange-200'
      },
      'REQUIRES_RISK_INSURANCE': { 
        label: 'Requiere Seguro', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      'INACTIVE': { 
        label: 'Inactivo', 
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['INACTIVE'];
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL').length;
  const highAlerts = alerts.filter(alert => alert.severity === 'HIGH').length;
  const mediumAlerts = alerts.filter(alert => alert.severity === 'MEDIUM').length;
  const lowAlerts = alerts.filter(alert => alert.severity === 'LOW').length;

  const averageComplianceScore = drivers.length > 0 
    ? Math.round(drivers.reduce((sum, driver) => sum + driver.complianceScore, 0) / drivers.length)
    : 0;

  const employeesCount = drivers.filter(d => d.currentClassification === 'Empleado Cotizante').length;
  const independentsCount = drivers.filter(d => d.currentClassification === 'Trabajador Independiente').length;

  return (
    <div className="space-y-6">
      {/* UI Universal: Section + PageToolbar */}
      <Section>
        <PageToolbar
          right={
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm">
                <FileText />
                Generar Reporte
              </Button>
              <Button size="sm">
                <Shield />
                Actualizar Cumplimiento
              </Button>
            </div>
          }
        />
      </Section>

      {/* Alertas críticas */}
      {criticalAlerts > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertas Críticas ({criticalAlerts})
            </CardTitle>
            <CardDescription className="text-red-700">
              Requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(alert => alert.severity === 'CRITICAL').slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="font-medium text-red-900">{alert.title}</div>
                    <div className="text-sm text-red-700">{alert.description}</div>
                    {alert.driverName && (
                      <div className="text-xs text-red-600 mt-1">
                        Repartidor: {alert.driverName}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="destructive">
                    Resolver
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Puntuación Promedio</p>
                <p className={`text-2xl font-bold ${getComplianceScoreColor(averageComplianceScore)}`}>
                  {averageComplianceScore}%
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <Progress 
              value={averageComplianceScore} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Activas</p>
                <p className="text-2xl font-bold text-orange-600">{alerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {criticalAlerts} críticas, {highAlerts} altas, {mediumAlerts} medias
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empleados</p>
                <p className="text-2xl font-bold text-purple-600">{employeesCount}</p>
              </div>
              <User className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {Math.round((employeesCount / drivers.length) * 100)}% del total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Independientes</p>
                <p className="text-2xl font-bold text-orange-600">{independentsCount}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {Math.round((independentsCount / drivers.length) * 100)}% del total
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertas Recientes
            </CardTitle>
            <CardDescription>
              Últimas alertas de cumplimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin alertas</h3>
                <p className="text-gray-500">No hay alertas de cumplimiento pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{alert.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{alert.description}</div>
                      {alert.driverName && (
                        <div className="text-xs text-gray-500 mt-1">
                          Repartidor: {alert.driverName}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {format(alert.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estado de clasificación laboral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Clasificación Laboral
            </CardTitle>
            <CardDescription>
              Distribución de repartidores por clasificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium">Empleados Cotizantes</span>
                </div>
                <div className="text-sm font-mono">{employeesCount}</div>
              </div>
              <Progress value={(employeesCount / drivers.length) * 100} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium">Trabajadores Independientes</span>
                </div>
                <div className="text-sm font-mono">{independentsCount}</div>
              </div>
              <Progress value={(independentsCount / drivers.length) * 100} className="h-2" />

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <strong>Salario mínimo mensual:</strong> $8,364 MXN
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <strong>Horas mínimas:</strong> 120 hrs/mes
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de cumplimiento por repartidor */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Cumplimiento por Repartidor</CardTitle>
          <CardDescription>
            Puntuación de cumplimiento individual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Repartidor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Clasificación</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Estado IMSS</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Ingresos</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Horas</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Puntuación</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{driver.fullName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={driver.currentClassification === 'Empleado Cotizante' 
                        ? 'bg-purple-100 text-purple-800 border-purple-200' 
                        : 'bg-orange-100 text-orange-800 border-orange-200'
                      }>
                        {driver.currentClassification === 'Empleado Cotizante' ? 'Empleado' : 'Independiente'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {getIMSSStatusBadge(driver.imssStatus)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-sm">
                        ${driver.ingreso_bruto_mensual.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-sm">
                        {driver.horasTrabajadasMes.toFixed(1)} hrs
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getComplianceScoreBg(driver.complianceScore)}`}
                            style={{ width: `${driver.complianceScore}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getComplianceScoreColor(driver.complianceScore)}`}>
                          {driver.complianceScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {driver.complianceScore >= 80 ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Cumple
                        </Badge>
                      ) : driver.complianceScore >= 60 ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Parcial
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Requiere Atención
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(ComplianceCenterPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});