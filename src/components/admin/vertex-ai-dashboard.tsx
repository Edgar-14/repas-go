'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Shield, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Zap,
  Target,
  BarChart3,
  Activity,
  Sparkles
} from 'lucide-react';
import { vertexIntegration } from '@/lib/services/befast-vertex-integration';
import { useToast } from '@/hooks/use-toast';

interface VertexAIDashboardProps {
  className?: string;
}

export function VertexAIDashboard({ className = '' }: VertexAIDashboardProps) {
  const [activePhase, setActivePhase] = useState(1);
  const [dashboardData, setDashboardData] = useState({
    phase1: {
      documentValidations: 0,
      financialAudits: 0,
      chatInteractions: 0,
      routeDataPoints: 0,
    },
    phase2: {
      complianceChecks: 0,
      creditPredictions: 0,
      biometricVerifications: 0,
    },
    phase3: {
      fraudAnalyses: 0,
      assignmentOptimizations: 0,
      personalizedIncentives: 0,
      marketingCampaigns: 0,
    }
  });
  const [systemStatus, setSystemStatus] = useState({
    vertexAI: 'active',
    gemini: 'active',
    automatedSystems: 'active',
  });
  const { toast } = useToast();

  // Simulated data loading
  useEffect(() => {
    const loadDashboardData = () => {
      // In real implementation, this would fetch from Firebase
      setDashboardData({
        phase1: {
          documentValidations: 1247,
          financialAudits: 3456,
          chatInteractions: 8923,
          routeDataPoints: 12453,
        },
        phase2: {
          complianceChecks: 342,
          creditPredictions: 89,
          biometricVerifications: 156,
        },
        phase3: {
          fraudAnalyses: 23,
          assignmentOptimizations: 567,
          personalizedIncentives: 234,
          marketingCampaigns: 12,
        }
      });
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const PhaseCard = ({ 
    phase, 
    title, 
    description, 
    status, 
    features, 
    metrics 
  }: {
    phase: number;
    title: string;
    description: string;
    status: 'active' | 'warning' | 'inactive';
    features: string[];
    metrics: Record<string, number>;
  }) => (
    <div 
      className={`cursor-pointer transition-all duration-200 ${
        activePhase === phase 
          ? 'ring-2 ring-blue-500 shadow-lg' 
          : 'hover:shadow-md'
      }`}
      onClick={() => setActivePhase(phase)}
    >
      <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              {title}
            </span>
          </CardTitle>
          <Badge 
            variant={status === 'active' ? 'default' : status === 'warning' ? 'outline' : 'secondary'}
            className={
              status === 'active' ? 'bg-green-500' : 
              status === 'warning' ? 'border-yellow-500 text-yellow-700' : ''
            }
          >
            {status === 'active' ? 'Activo' : status === 'warning' ? 'Advertencia' : 'Inactivo'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-2">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}:</span>
                <span className="font-semibold">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-700">Funcionalidades:</div>
            <div className="flex flex-wrap gap-1">
              {features.map((feature, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );

  const Phase1Dashboard = () => (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Validaciones de Documentos</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.phase1.documentValidations}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                98.7% precisión
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auditorías Financieras</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.phase1.financialAudits}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-blue-600">
                <Activity className="h-4 w-4 mr-1" />
                100% transacciones auditadas
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Interacciones de Chat</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.phase1.chatInteractions}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-purple-600">
                <Sparkles className="h-4 w-4 mr-1" />
                94% satisfacción
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Datos de Ruta</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.phase1.routeDataPoints}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-orange-600">
                <Target className="h-4 w-4 mr-1" />
                Recopilando para independencia
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de Sistemas Fase 1</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Validación de Documentos</span>
              </div>
              <Badge variant="default" className="bg-green-500">Operacional</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Auditoría Financiera</span>
              </div>
              <Badge variant="default" className="bg-green-500">Operacional</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Soporte Conversacional</span>
              </div>
              <Badge variant="default" className="bg-green-500">Operacional</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Recolección de Datos</span>
              </div>
              <Badge variant="default" className="bg-green-500">Operacional</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const Phase2Dashboard = () => (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revisiones de Cumplimiento</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.phase2.complianceChecks}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-blue-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Normativo continuo
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Predicciones de Crédito</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.phase2.creditPredictions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600">
                <Zap className="h-4 w-4 mr-1" />
                Asistencia proactiva
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verificaciones Biométricas</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.phase2.biometricVerifications}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-purple-600">
                <Shield className="h-4 w-4 mr-1" />
                Seguridad bancaria
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <strong>Fase 2 Activa:</strong> Sistemas de cumplimiento normativo, asistencia proactiva y verificación biométrica operando automáticamente. Los negocios reciben alertas 3 días antes de agotar créditos y los repartidores son notificados 30 días antes de vencimientos documentales.
        </AlertDescription>
      </Alert>
    </div>
  );

  const Phase3Dashboard = () => (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Análisis de Fraude</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.phase3.fraudAnalyses}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-red-600">
                <Shield className="h-4 w-4 mr-1" />
                Detección en tiempo real
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Optimizaciones de Asignación</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.phase3.assignmentOptimizations}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-blue-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                92% eficiencia
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Incentivos Personalizados</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.phase3.personalizedIncentives}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600">
                <Sparkles className="h-4 w-4 mr-1" />
                +15% participación
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Campañas de Marketing</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.phase3.marketingCampaigns}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-purple-600">
                <Activity className="h-4 w-4 mr-1" />
                3.2x ROI promedio
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-purple-200 bg-purple-50">
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <strong>Fase 3 - Liderazgo de Mercado:</strong> IA operando con autonomía completa para detectar fraude, optimizar asignaciones, crear incentivos personalizados y generar campañas de marketing automáticas. El sistema predice y actúa proactivamente.
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centro de Control de Vertex AI</h1>
          <p className="text-gray-600">Monitoreo completo del ecosistema de inteligencia artificial</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Todos los sistemas operacionales</span>
          </div>
        </div>
      </div>

      {/* Phase Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PhaseCard
          phase={1}
          title="Fase 1: Lanzamiento"
          description="Operación blindada con validación de documentos, auditoría financiera y soporte inteligente"
          status="active"
          features={["Validación Docs", "Auditoría $", "Chatbots", "Datos Ruta"]}
          metrics={{
            "Validaciones": dashboardData.phase1.documentValidations,
            "Auditorías": dashboardData.phase1.financialAudits,
            "Chats": dashboardData.phase1.chatInteractions,
            "Rutas": dashboardData.phase1.routeDataPoints,
          }}
        />

        <PhaseCard
          phase={2}
          title="Fase 2: Crecimiento"
          description="Cumplimiento automático, asistencia proactiva y verificación biométrica"
          status="active"
          features={["Cumplimiento", "Predicciones", "Biométrica", "Asistente Pro"]}
          metrics={{
            "Cumplimiento": dashboardData.phase2.complianceChecks,
            "Predicciones": dashboardData.phase2.creditPredictions,
            "Biométrica": dashboardData.phase2.biometricVerifications,
          }}
        />

        <PhaseCard
          phase={3}
          title="Fase 3: Liderazgo"
          description="Detección de fraude, optimización inteligente y marketing automático"
          status="active"
          features={["Anti-Fraude", "Optimización", "Incentivos", "Marketing AI"]}
          metrics={{
            "Fraude": dashboardData.phase3.fraudAnalyses,
            "Asignaciones": dashboardData.phase3.assignmentOptimizations,
            "Incentivos": dashboardData.phase3.personalizedIncentives,
            "Campañas": dashboardData.phase3.marketingCampaigns,
          }}
        />
      </div>

      {/* Phase Details */}
      <Tabs value={`phase${activePhase}`} onValueChange={(value) => setActivePhase(Number(value.replace('phase', '')))}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="phase1">Fase 1: Lanzamiento</TabsTrigger>
          <TabsTrigger value="phase2">Fase 2: Crecimiento</TabsTrigger>
          <TabsTrigger value="phase3">Fase 3: Liderazgo</TabsTrigger>
        </TabsList>
        <TabsContent value="phase1">
          <Phase1Dashboard />
        </TabsContent>
        <TabsContent value="phase2">
          <Phase2Dashboard />
        </TabsContent>
        <TabsContent value="phase3">
          <Phase3Dashboard />
        </TabsContent>
      </Tabs>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>Estado Global del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vertex AI</span>
                <Badge variant="default" className="bg-green-500">Operacional</Badge>
              </div>
              <Progress value={98} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gemini</span>
                <Badge variant="default" className="bg-green-500">Operacional</Badge>
              </div>
              <Progress value={96} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Automatización</span>
                <Badge variant="default" className="bg-green-500">Operacional</Badge>
              </div>
              <Progress value={99} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
