'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Play,
  Database,
  Cloud,
  Users,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BeFastSystemValidator } from '@/utils/systemValidator';

interface ValidationResult {
  section: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

export default function SystemValidationPage() {
  const { user, role } = useAuth();
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [validationComplete, setValidationComplete] = useState(false);

  const runValidation = async () => {
    setIsValidating(true);
    setResults([]);
    setValidationComplete(false);

    try {
      const validator = new BeFastSystemValidator();
      const validationResults = await validator.runValidation();
      setResults(validationResults);
      setValidationComplete(true);
    } catch (error) {
      console.error('Validation error:', error);
      setResults([{
        section: 'System',
        status: 'FAIL',
        message: 'Validation failed to complete',
        details: error
      }]);
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: 'PASS' | 'FAIL' | 'WARNING') => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: 'PASS' | 'FAIL' | 'WARNING') => {
    switch (status) {
      case 'PASS':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'FAIL':
        return <Badge className="bg-red-100 text-red-800">FAIL</Badge>;
      case 'WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800">WARNING</Badge>;
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section.toLowerCase()) {
      case 'collections':
        return <Database className="h-5 w-5" />;
      case 'cloud functions':
        return <Cloud className="h-5 w-5" />;
      case 'registration':
        return <Users className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos para acceder a esta página.
        </AlertDescription>
      </Alert>
    );
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Validación del Sistema</h1>
          <p className="text-muted-foreground">
            Verifica que todos los componentes de BeFast estén funcionando correctamente
          </p>
        </div>
        <Button 
          onClick={runValidation} 
          disabled={isValidating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isValidating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Ejecutar Validación
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      {validationComplete && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.length}</div>
              <p className="text-xs text-muted-foreground">Verificaciones ejecutadas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exitosas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{passed}</div>
              <p className="text-xs text-muted-foreground">Verificaciones exitosas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fallidas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failed}</div>
              <p className="text-xs text-muted-foreground">Verificaciones fallidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{warnings}</div>
              <p className="text-xs text-muted-foreground">Advertencias encontradas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Validación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    {getSectionIcon(result.section)}
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{result.section}</h4>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.message}
                    </p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">
                          Ver detalles
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Message */}
      {validationComplete && (
        <Alert className={failed === 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {failed === 0 ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            {failed === 0 
              ? "🎉 ¡Todas las validaciones críticas pasaron! El sistema está listo para funcionar."
              : `🚨 Se encontraron ${failed} problemas que necesitan atención.`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      {!validationComplete && !isValidating && (
        <Card>
          <CardHeader>
            <CardTitle>¿Qué hace esta validación?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span>Verifica que todas las colecciones de Firestore existan</span>
              </div>
              <div className="flex items-center space-x-2">
                <Cloud className="h-4 w-4 text-blue-600" />
                <span>Confirma que las Cloud Functions estén desplegadas</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Prueba el flujo de registro de negocios</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Valida la estructura de datos y crea datos de prueba</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}