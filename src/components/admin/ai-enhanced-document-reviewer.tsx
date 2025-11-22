'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Loader2,
  Sparkles,
  FileText,
  User,
  Calendar,
  CreditCard
} from 'lucide-react';
import { vertexIntegration } from '@/lib/services/befast-vertex-integration';
import { useToast } from '@/hooks/use-toast';
import type { DocumentValidationResult } from '@/lib/services/vertex-ai-service';

interface DriverApplication {
  id: string;
  personalData: {
    name: string;
    rfc: string;
    curp: string;
    phone: string;
    email: string;
  };
  documents: {
    ine: string;
    license: string;
    insurance: string;
    circulation: string;
  };
  status: string;
  submittedAt: any;
  aiValidation?: {
    completed: boolean;
    results: Record<string, DocumentValidationResult>;
    overallValid: boolean;
    lastChecked: string;
  };
}

interface AIEnhancedDocumentReviewerProps {
  application: DriverApplication;
  onStatusUpdate: (applicationId: string, newStatus: string, notes?: string) => void;
}

export function AIEnhancedDocumentReviewer({ 
  application, 
  onStatusUpdate 
}: AIEnhancedDocumentReviewerProps) {
  const [aiValidation, setAiValidation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const { toast } = useToast();

  // Load existing AI validation or trigger new validation
  useEffect(() => {
    if (application.aiValidation?.completed) {
      setAiValidation(application.aiValidation);
    } else {
      // Auto-trigger AI validation for new applications
      handleAIValidation();
    }
  }, [application.id]);

  const handleAIValidation = async () => {
    setIsValidating(true);
    try {
      const validationResult = await vertexIntegration.validateDriverDocuments(
        application.id,
        application.documents,
        application.personalData
      );

      setAiValidation({
        completed: true,
        results: validationResult.documentResults,
        overallValid: validationResult.overallValid,
        nextSteps: validationResult.nextSteps,
        lastChecked: new Date().toISOString(),
      });

      toast({
        title: "Validación con IA Completada",
        description: validationResult.overallValid 
          ? "Todos los documentos pasaron la validación automática"
          : "Se encontraron discrepancias que requieren revisión manual",
      });

    } catch (error) {
      console.error('AI validation failed:', error);
      toast({
        title: "Error en Validación con IA",
        description: "No se pudo completar la validación automática. Revisar manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      ine: 'INE/Pasaporte',
      license: 'Licencia de Conducir',
      insurance: 'Seguro del Vehículo',
      circulation: 'Tarjeta de Circulación',
    };
    return labels[type] || type;
  };

  const getValidationIcon = (result?: DocumentValidationResult) => {
    if (!result) return <Loader2 className="h-4 w-4 animate-spin" />;
    
    if (result.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (result.confidence > 50) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getValidationBadge = (result?: DocumentValidationResult) => {
    if (!result) return <Badge variant="outline">Validando...</Badge>;
    
    if (result.isValid) {
      return <Badge variant="default" className="bg-green-500">Válido</Badge>;
    } else if (result.confidence > 50) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Revisar</Badge>;
    } else {
      return <Badge variant="destructive">Rechazar</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Validation Summary */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Validación con Inteligencia Artificial
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isValidating ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div className="space-y-2">
                <p className="text-sm">Analizando documentos con IA...</p>
                <Progress value={75} className="w-full" />
              </div>
            </div>
          ) : aiValidation ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {aiValidation.overallValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="font-medium">
                    {aiValidation.overallValid 
                      ? 'Validación Exitosa' 
                      : 'Requiere Atención Manual'
                    }
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {showAIAnalysis ? 'Ocultar' : 'Ver'} Análisis IA
                </Button>
              </div>

              {showAIAnalysis && (
                <div className="border rounded-lg p-4 bg-white">
                  <h4 className="font-semibold mb-3">Análisis Detallado por Documento</h4>
                  <div className="grid gap-4">
                    {Object.entries(aiValidation.results).map(([docType, result]) => (
                      <div key={docType} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getValidationIcon(result as DocumentValidationResult)}
                            <span className="font-medium">{getDocumentTypeLabel(docType)}</span>
                          </div>
                          {getValidationBadge(result as DocumentValidationResult)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <strong>Confianza:</strong> {(result as any).confidence}%
                          </div>
                          {(result as any).extractedData && (
                            <div className="space-y-1">
                              {(result as any).extractedData.name && (
                                <div><strong>Nombre extraído:</strong> {(result as any).extractedData.name}</div>
                              )}
                              {(result as any).extractedData.rfc && (
                                <div><strong>RFC extraído:</strong> {(result as any).extractedData.rfc}</div>
                              )}
                              {(result as any).extractedData.expirationDate && (
                                <div><strong>Vigencia:</strong> {(result as any).extractedData.expirationDate}</div>
                              )}
                            </div>
                          )}
                        </div>

                        {(result as any).discrepancies && (result as any).discrepancies.length > 0 && (
                          <Alert className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Discrepancias encontradas:</strong>
                              <ul className="list-disc pl-4 mt-1">
                                {(result as any).discrepancies.map((discrepancy: any, idx: number) => (
                                  <li key={idx}>{discrepancy}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>

                  {aiValidation.nextSteps && aiValidation.nextSteps.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-semibold text-blue-800 mb-2">Pasos Recomendados:</h5>
                      <ul className="list-disc pl-5 text-sm text-blue-700">
                        {aiValidation.nextSteps.map((step: string, idx: number) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Button onClick={handleAIValidation} className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Iniciar Validación con IA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer with AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Revisión de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedDocument || 'ine'} onValueChange={setSelectedDocument}>
            <TabsList className="grid w-full grid-cols-4">
              {Object.entries(application.documents).map(([docType, url]) => (
                <TabsTrigger key={docType} value={docType} className="relative">
                  <div className="flex items-center gap-2">
                    {getValidationIcon(aiValidation?.results[docType])}
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">{getDocumentTypeLabel(docType)}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(application.documents).map(([docType, url]) => (
              <TabsContent key={docType} value={docType}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Document Image */}
                  <div className="space-y-2">
                    <img
                      src={url}
                      alt={`${getDocumentTypeLabel(docType)} - ${application.personalData.name}`}
                      className="w-full max-h-96 object-contain border rounded-lg"
                    />
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver en Tamaño Completo
                    </Button>
                  </div>

                  {/* AI Analysis for this Document */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Análisis de {getDocumentTypeLabel(docType)}</h4>
                    
                    {aiValidation?.results[docType] ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {getValidationIcon(aiValidation.results[docType])}
                          {getValidationBadge(aiValidation.results[docType])}
                          <span className="text-sm text-gray-600">
                            Confianza: {aiValidation.results[docType].confidence}%
                          </span>
                        </div>

                        {/* Extracted vs Form Data Comparison */}
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <h5 className="font-semibold mb-2">Comparación de Datos</h5>
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <strong>Formulario:</strong><br />
                                Nombre: {application.personalData.name}<br />
                                RFC: {application.personalData.rfc}
                              </div>
                              <div>
                                <strong>Extraído de Documento:</strong><br />
                                Nombre: {aiValidation.results[docType].extractedData?.name || 'N/A'}<br />
                                RFC: {aiValidation.results[docType].extractedData?.rfc || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Manual Override Controls */}
                        <div className="border-t pt-3">
                          <h5 className="font-semibold mb-2">Control Manual</h5>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar Manualmente
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Ejecutando análisis con IA...</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Decision Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Decisión Final</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => onStatusUpdate(application.id, 'APPROVED')}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isValidating}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobar Solicitud
            </Button>
            <Button
              onClick={() => onStatusUpdate(application.id, 'REJECTED', 'Documentos no válidos')}
              variant="destructive"
              className="flex-1"
              disabled={isValidating}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar Solicitud
            </Button>
          </div>
          
          {aiValidation && !aiValidation.overallValid && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>La IA detectó posibles problemas.</strong> Revisa cuidadosamente antes de aprobar.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
