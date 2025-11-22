'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
export default function InitializeCollectionsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const initializeCollections = async () => {
    setIsLoading(true);
    setResults([]);
    
    try {
      const response = await fetch('/api/admin/initialize-collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data.results || []);
        toast({
          title: '✅ Colecciones Inicializadas',
          description: 'Todas las colecciones de Firestore se han creado correctamente.',
        });
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: error.message || 'Error al inicializar las colecciones',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Inicializar Colecciones de Firestore
            </CardTitle>
            <CardDescription>
              Esta función creará todas las colecciones necesarias para el funcionamiento del sistema BeFast.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Button 
                onClick={initializeCollections}
                disabled={isLoading}
                size="lg"
                className="min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Inicializar Colecciones
                  </>
                )}
              </Button>
            </div>

            {results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resultados:</h3>
                <div className="grid gap-3">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.success)}
                        <span className="font-medium">{result.collection}</span>
                      </div>
                      <span className={`text-sm ${getStatusColor(result.success)}`}>
                        {result.success ? 'Creada' : 'Error'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Colecciones que se crearán:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-800">
                <div>• drivers</div>
                <div>• businesses</div>
                <div>• orders</div>
                <div>• users</div>
                <div>• driverApplications</div>
                <div>• orderEvents</div>
                <div>• verificationCodes</div>
                <div>• mailQueue</div>
                <div>• auditLogs</div>
                <div>• systemConfig</div>
                <div>• systemLogs</div>
                <div>• systemMetrics</div>
                <div>• payrollData</div>
                <div>• trainingModules</div>
                <div>• roles</div>
                <div>• ADMIN</div>
                <div>• CONTADORA</div>
                <div>• SUPER_ADMIN</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
