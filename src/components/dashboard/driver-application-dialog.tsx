
'use client';

import { useState, useTransition } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, FileText, CheckCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

// The expected output structure from our API
// The expected output structure from our new, simplified API route
export type SummarizeDriverApplicationOutput = {
  summary: string;
  keyQualifications: string;
  suitabilityAssessment: string;
};

export function DriverApplicationDialog({ children, applicationId }: { children: React.ReactNode, applicationId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<SummarizeDriverApplicationOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateSummary = () => {
    if (!applicationId) return;
    setSummary(null);

    startTransition(async () => {
      try {
        // Fetch the actual application text from Firestore
        const applicationDoc = await getDoc(doc(db, 'driverApplications', applicationId));
        if (!applicationDoc.exists()) {
          throw new Error('Solicitud no encontrada');
        }
        
        const applicationData = applicationDoc.data();
        const applicationText = applicationData.personalInfo ? 
          `${applicationData.personalInfo.fullName}, ${applicationData.personalInfo.address}. ${applicationData.personalInfo.phone}. ${applicationData.workExperience || 'Sin experiencia laboral especificada'}. ${applicationData.vehicleInfo ? `Vehículo: ${applicationData.vehicleInfo.type} ${applicationData.vehicleInfo.brand} ${applicationData.vehicleInfo.model} ${applicationData.vehicleInfo.year}` : ''}` :
          'Información de solicitud no disponible';

        const response = await fetch('/api/summarize-application', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ applicationId, applicationText }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get summary');
        }

        const result: { summary: SummarizeDriverApplicationOutput } = await response.json();
        setSummary(result.summary);

      } catch (error) {
         toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      handleGenerateSummary();
    } else {
      setSummary(null); // Reset on close
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" />
            Resumen de Solicitud con IA
          </DialogTitle>
          <DialogDescription>
            Análisis y evaluación de la solicitud ID: {applicationId}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            {isPending ? (
              <div className="flex flex-col items-center justify-center h-full rounded-lg border border-dashed text-center p-8 min-h-[400px]">
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                <h3 className="mt-4 text-lg font-semibold">Generando resumen...</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  La IA está analizando la solicitud. Esto puede tardar unos segundos.
                </p>
              </div>
            ) : summary ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-headline flex items-center gap-2"><FileText size={20}/>Resumen General</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{summary.summary}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-headline flex items-center gap-2"><CheckCircle size={20}/>Puntos Clave</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground whitespace-pre-line">{summary.keyQualifications}</div>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-headline flex items-center gap-2"><Users size={20}/>Evaluación de Idoneidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{summary.suitabilityAssessment}</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full rounded-lg border border-dashed text-center p-8 min-h-[400px]">
                    <Sparkles className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No se pudo cargar el resumen</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                    Hubo un error al generar el análisis de la IA.
                    </p>
                    <Button onClick={handleGenerateSummary} className="mt-4">Reintentar</Button>
                </div>
            )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}