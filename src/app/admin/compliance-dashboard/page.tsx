'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Loader2,
  Download,
  Calendar
} from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import withAuth from '@/components/auth/withAuth';
import { Section, PageToolbar } from '@/components/layout/primitives';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface ExecutiveMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  activeDrivers: number;
  driverGrowth: number;
  complianceScore: number;
  complianceTrend: 'up' | 'down' | 'stable';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  pendingActions: number;
  completedActions: number;
  fiscalObligations: {
    completed: number;
    pending: number;
    overdue: number;
  };
  laborClassification: {
    workers: number;
    independents: number;
    pending: number;
  };
}

interface RiskIndicator {
  category: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  impact: string;
  mitigation: string;
}

function ComplianceDashboardPage() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [riskIndicators, setRiskIndicators] = useState<RiskIndicator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    const loadExecutiveData = async () => {
      try {
        // Simular carga de datos ejecutivos
        const executiveMetrics: ExecutiveMetrics = {
          totalRevenue: 2450000,
          revenueGrowth: 12.5,
          activeDrivers: 1847,
          driverGrowth: 8.3,
          complianceScore: 87,
          complianceTrend: 'up',
          riskLevel: 'MEDIUM',
          pendingActions: 23,
          completedActions: 156,
          fiscalObligations: {
            completed: 8,
            pending: 3,
            overdue: 1
          },
          laborClassification: {
            workers: 1247,
            independents: 523,
            pending: 77
          }
        };

        setMetrics(executiveMetrics);

        const riskData: RiskIndicator[] = [
          {
            category: 'Cumplimiento IMSS',
            level: 'MEDIUM',
            description: '23 repartidores requieren actualización de documentos',
            impact: 'Posible multa por incumplimiento',
            mitigation: 'Proceso de actualización en curso'
          },
          {
            category: 'Clasificación Laboral',
            level: 'LOW',
            description: '77 clasificaciones pendientes de revisión',
            impact: 'Impacto mínimo en operaciones',
            mitigation: 'Revisión automática programada'
          },
          {
            category: 'Fiscal',
            level: 'HIGH',
            description: '1 obligación fiscal vencida',
            impact: 'Riesgo de sanción fiscal',
            mitigation: 'Acción inmediata requerida'
          }
        ];

        setRiskIndicators(riskData);

      } catch (error) {
        console.error('Error loading executive data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExecutiveData();
  }, [timeRange]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Error al cargar datos ejecutivos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* UI Universal: Section + PageToolbar */}
      <Section>
        <PageToolbar
          left={
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="quarter">Este trimestre</SelectItem>
                <SelectItem value="year">Este año</SelectItem>
              </SelectContent>
            </Select>
          }
          right={
            <Button variant="outline" size="sm">
              <Download />
              Exportar
            </Button>
          }
        />
      </Section>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(metrics.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +{metrics.revenueGrowth}% vs período anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repartidores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeDrivers.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +{metrics.driverGrowth}% vs período anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntuación Cumplimiento</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.complianceScore}%</div>
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon(metrics.complianceTrend)}
              {metrics.complianceTrend === 'up' ? 'Mejorando' : 
               metrics.complianceTrend === 'down' ? 'Deteriorando' : 'Estable'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nivel de Riesgo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getRiskColor(metrics.riskLevel)}>
                {metrics.riskLevel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingActions} acciones pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Clasificación Laboral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Trabajadores</span>
                </div>
                <span className="font-semibold">{metrics.laborClassification.workers}</span>
              </div>
              <Progress value={(metrics.laborClassification.workers / metrics.activeDrivers) * 100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Independientes</span>
                </div>
                <span className="font-semibold">{metrics.laborClassification.independents}</span>
              </div>
              <Progress value={(metrics.laborClassification.independents / metrics.activeDrivers) * 100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Pendientes</span>
                </div>
                <span className="font-semibold">{metrics.laborClassification.pending}</span>
              </div>
              <Progress value={(metrics.laborClassification.pending / metrics.activeDrivers) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Obligaciones Fiscales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Completadas</span>
                </div>
                <span className="font-semibold text-green-600">{metrics.fiscalObligations.completed}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Pendientes</span>
                </div>
                <span className="font-semibold text-yellow-600">{metrics.fiscalObligations.pending}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Vencidas</span>
                </div>
                <span className="font-semibold text-red-600">{metrics.fiscalObligations.overdue}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Indicadores de Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskIndicators.map((risk, index) => (
              <div key={index} className={`p-4 border rounded-lg ${getRiskColor(risk.level)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{risk.category}</h4>
                      <Badge className={getRiskColor(risk.level)}>
                        {risk.level}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{risk.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium">Impacto:</span> {risk.impact}
                      </div>
                      <div>
                        <span className="font-medium">Mitigación:</span> {risk.mitigation}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Ver detalles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Acciones Requeridas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{metrics.fiscalObligations.overdue}</div>
              <p className="text-sm text-muted-foreground">Acciones Urgentes</p>
              <Button variant="destructive" size="sm" className="mt-2">
                Revisar
              </Button>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{metrics.fiscalObligations.pending}</div>
              <p className="text-sm text-muted-foreground">Acciones Pendientes</p>
              <Button variant="outline" size="sm" className="mt-2">
                Programar
              </Button>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{metrics.completedActions}</div>
              <p className="text-sm text-muted-foreground">Acciones Completadas</p>
              <Button variant="outline" size="sm" className="mt-2">
                Ver historial
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(ComplianceDashboardPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});