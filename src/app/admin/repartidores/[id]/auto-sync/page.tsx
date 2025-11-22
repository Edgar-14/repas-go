'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import withAuth from '@/components/auth/withAuth';

function DriverAutoSyncPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/repartidores/${params.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Perfil
        </Button>
        <h1 className="text-2xl font-bold">Sincronizar con Shipday</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sincronización Automática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Esta función sincronizará automáticamente los datos del repartidor con Shipday, 
              incluyendo estadísticas de entregas, calificaciones y estado actual.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Función en desarrollo</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    La sincronización automática con Shipday estará disponible pronto.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => router.push(`/admin/repartidores/${params.id}`)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Volver al Perfil
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/repartidores')}
              >
                Lista de Repartidores
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(DriverAutoSyncPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});