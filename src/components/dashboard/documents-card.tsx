
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const documentNameMap: {[key: string]: string} = {
    docId: 'INE/Pasaporte',
    docLicense: 'Licencia de Conducir',
    docAddress: 'Comprobante de Domicilio',
    docTax: 'Constancia de Situación Fiscal',
    docCirculation: 'Tarjeta de Circulación',
    docInsurance: 'Póliza de Seguro Vehicular',
}

export function DocumentsCard({ documents }: { documents: any }) {
    if (!documents || Object.keys(documents).length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline font-medium">Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No hay documentos disponibles para este repartidor.</p>
                </CardContent>
            </Card>
        );
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline font-medium flex items-center gap-2">
            <FileText /> Documentos del Repartidor
        </CardTitle>
        <CardDescription>Revisa los documentos subidos y su estado de verificación.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(documents).map(([key, url]) => (
            <div key={key} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                <span className="text-sm font-medium">{documentNameMap[key] || key}</span>
                <div className="flex items-center gap-3">
                     <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                        <CheckCircle size={14} className="mr-1"/>
                        Verificado
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                        <a href={url as string} target="_blank" rel="noopener noreferrer">
                            Ver <ExternalLink size={14} className="ml-1"/>
                        </a>
                    </Button>
                </div>
            </div>
        ))}
      </CardContent>
    </Card>
  );
}
