'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHydration } from '@/hooks/use-hydration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert';
import { LoadingSpinner, LoadingButton } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { getAuthCookie } from '@/lib/cookies';
import { Section, PageToolbar } from '@/components/layout/primitives';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
import { RefreshCw, 
  Users, 
  Package, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Database,
  Wifi,
  WifiOff } from 'lucide-react';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  timestamp: string;
}

interface SyncStatus {
  lastSync: string | null;
  isRunning: boolean;
  totalSynced: number;
  totalFailed: number;
  lastError: string | null;
}

interface HealthStatus {
  status: string;
  message: string;
  details?: any;
  timestamp?: string;
}

export default function ShipdayAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const isHydrated = useHydration();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [isImportingDrivers, setIsImportingDrivers] = useState(false);
  const [isSettingUpWebhook, setIsSettingUpWebhook] = useState(false);

  useEffect(() => {
    loadStatus();
    loadHealth();
    
    // Actualizar automáticamente cada 30 segundos
    const interval = setInterval(() => {
      loadStatus();
      loadHealth();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      // Obtener token de autenticación
      const token = getAuthCookie();

      if (!token) {
        console.warn('No authentication token found, skipping sync status load');
        setSyncStatus({
          lastSync: 'Nunca',
          totalSynced: 0,
          totalFailed: 0,
          isRunning: false,
          lastError: 'No authentication token found'
        });
        return;
      }

      const response = await fetch('/api/shipday/sync-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.success) {
        setSyncStatus(data.data);
      } else {
        // Si no hay success o data, usar valores por defecto
        setSyncStatus({
          lastSync: 'Nunca',
          totalSynced: 0,
          totalFailed: 0,
          isRunning: false,
          lastError: data?.error || 'Error desconocido'
        });
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
      // Datos por defecto si hay error
      setSyncStatus({
        lastSync: 'Nunca',
        totalSynced: 0,
        totalFailed: 0,
        isRunning: false,
        lastError: error instanceof Error ? error.message : 'Error de conexión'
      });
    }
  };

  const loadHealth = async () => {
    try {
      // Obtener token de autenticación
      const token = getAuthCookie();

      if (!token) {
        // No authentication token found, skipping health status load
        setHealthStatus({
          status: 'error',
          message: 'No authentication token found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const response = await fetch('/api/shipday/sync-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.success && data.data && data.data.health) {
        setHealthStatus(data.data.health);
        toast({
          title: "Estado de salud actualizado",
          description: data.data.health.message,
        });
      } else {
        // Si no hay datos válidos, establecer estado por defecto
        setHealthStatus({
          status: "unknown",
          message: data?.error || "No se pudo obtener el estado de salud"
        });
      }
    } catch (error) {
      console.error('Error loading health status:', error);
      setHealthStatus({
        status: "error",
        message: error instanceof Error ? error.message : "Error de conexión"
      });
      toast({
        title: "Error",
        description: "No se pudo cargar el estado de salud de la API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const performSync = async (type: string) => {
    setSyncing(true);
    
    try {
      let response;
      let syncType = 'all';
      
      if (type === 'importDrivers') {
        syncType = 'drivers';
      } else if (type === 'orders') {
        syncType = 'orders';
      } else if (type === 'status') {
        syncType = 'all';
      }
      
      // Obtener token de autenticación
      const token = getAuthCookie();

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Usar el endpoint de sincronización de estado
      response = await fetch('/api/shipday/sync-status', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: syncType })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLastSyncResult(data);
        await loadStatus();
        
        if (type === 'sync-drivers') {
          toast({
            title: "Sincronización exitosa",
            description: data.data.message || `Se sincronizaron ${data.data.syncedCount || 0} repartidores`,
            variant: "default",
          });
        } else if (type === 'sync-orders') {
          toast({
            title: "Sincronización exitosa",
            description: data.data.message || "Órdenes sincronizadas",
            variant: "default",
          });
        } else {
          toast({
            title: "Sincronización completa exitosa",
            description: data.data.message || "Sincronización completada",
            variant: "default",
          });
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error de sincronización",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const importDriversToBeFast = async () => {
    setIsImportingDrivers(true);
    try {
      // Obtener token de autenticación
      const token = getAuthCookie();

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Usar directamente la API de sincronización que obtiene los drivers internamente
      const response = await fetch('/api/shipday/sync-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'sync-drivers'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sincronización exitosa",
          description: result.data.message || `Se sincronizaron ${result.data.syncedCount || 0} repartidores con Shipday`,
        });
        
        // Recargar estado después de la sincronización
        setTimeout(() => {
          loadStatus();
        }, 1000);
      } else {
        throw new Error(result.error || 'Error en la sincronización');
      }
    } catch (error) {
      console.error('Error importing drivers:', error);
      toast({
        title: "Error de importación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsImportingDrivers(false);
    }
  };

  const setupWebhook = async () => {
    setIsSettingUpWebhook(true);
    try {
      // Obtener token de autenticación
      const token = getAuthCookie();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/shipday/setup-webhook', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Webhook configurado",
          description: "El webhook está configurado para recibir notificaciones en tiempo real de Shipday",
        });
      } else {
        throw new Error(result.error || 'Error configurando webhook');
      }
    } catch (error) {
      console.error('Error setting up webhook:', error);
      toast({
        title: "Error configurando webhook",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsSettingUpWebhook(false);
    }
  };



  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('es-MX');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Evitar errores de hidratación
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
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
              Sincronización y monitoreo de la integración con Shipday
            </div>
          }
          right={
            <Button
              onClick={() => {
                loadStatus();
                loadHealth();
              }}
              variant="outline"
              size="sm"
              disabled={syncing}
            >
              <RefreshCw className={syncing ? 'animate-spin' : ''} />
              Actualizar
            </Button>
          }
        />
      </Section>


      {/* Estado de salud */}
      {healthStatus && (
        <Alert variant={healthStatus.status === "healthy" ? "success" : "destructive"}>
          <AlertIcon variant={healthStatus.status === "healthy" ? "success" : "destructive"} />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Estado de la API:</strong> {healthStatus.message}
              </div>
              <div className="flex items-center gap-2">
                {healthStatus.status === "healthy" ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <StatusBadge status={healthStatus.status === "healthy" ? "Activo" : "Inactivo"} />
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas de sincronización */}
      {syncStatus && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Sincronización</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDate(syncStatus.lastSync)}
              </div>
              <p className="text-xs text-muted-foreground">
                {syncStatus.isRunning ? 'Sincronizando...' : 'Completado'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sincronizado</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {syncStatus.totalSynced}
              </div>
              <p className="text-xs text-muted-foreground">
                Elementos sincronizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fallidos</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {syncStatus.totalFailed}
              </div>
              <p className="text-xs text-muted-foreground">
                Elementos fallidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <StatusBadge 
                  status={syncStatus.isRunning ? "Sincronizando" : "Inactivo"} 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {syncStatus.lastError ? 'Con errores' : 'Sin errores'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Configuración de Webhook */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Configuración de Webhook en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Configura el webhook para recibir notificaciones en tiempo real cuando lleguen nuevos servicios a Shipday
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <LoadingButton
              loading={isSettingUpWebhook}
              onClick={setupWebhook}
              className="flex-1"
              variant="outline"
            >
              Configurar Webhook
            </LoadingButton>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch('/api/shipday/sync-status');
                  const result = await response.json();
                  
                  if (result.success) {
                    toast({
                      title: "✅ Conexión exitosa",
                      description: `Conectado a Shipday. Estado: ${result.data.health.status}`,
                    });
                  } else {
                    toast({
                      variant: "destructive",
                      title: "❌ Error de conexión",
                      description: result.error || "No se pudo conectar con Shipday",
                    });
                  }
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "❌ Error de conexión",
                    description: "No se pudo probar la conexión con Shipday",
                  });
                }
              }}
            >
              <Wifi className="h-4 w-4 mr-2" />
              Probar Conexión
            </Button>
          </div>
        </CardContent>
      </Card>



      {/* Acciones Principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Repartidores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Importa y sincroniza repartidores con Shipday
            </p>
            <LoadingButton
              loading={isImportingDrivers}
              onClick={importDriversToBeFast}
              className="w-full"
            >
              Importar Repartidores
            </LoadingButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Sincroniza pedidos y estados
            </p>
            <LoadingButton
              loading={syncing}
              onClick={() => performSync('orders')}
              className="w-full"
            >
              Sincronizar Pedidos
            </LoadingButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Verifica endpoints disponibles
            </p>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/shipday/check-endpoints');
                  const result = await response.json();
                  
                  if (result.success) {
                    const { summary } = result.data;
                    toast({
                      title: "Endpoints Disponibles",
                      description: `${summary.available}/${summary.total} endpoints activos`,
                    });
                  } else {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: result.details || "Error verificando endpoints"
                    });
                  }
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Error de conexión"
                  });
                }
              }}
              variant="outline"
              className="w-full"
            >
              Verificar Endpoints
            </Button>
          </CardContent>
        </Card>
      </div>


      {/* Resultado de la última sincronización */}
      {lastSyncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Resultado de la Última Sincronización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Sincronizados: {lastSyncResult.synced}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Fallidos: {lastSyncResult.failed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">{formatDate(lastSyncResult.timestamp)}</span>
                </div>
              </div>
              
              {lastSyncResult && lastSyncResult.errors && lastSyncResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Errores:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {lastSyncResult.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-600">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error de la última sincronización */}
      {syncStatus?.lastError && (
        <Alert variant="destructive">
          <AlertIcon variant="destructive" />
          <AlertDescription>
            <strong>Último error:</strong> {syncStatus.lastError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}