
'use client'

import React, { useState, useEffect } from 'react';
import { AuditLogEntry } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Activity as ActivityIcon, Loader2, Eye } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { Badge } from '@/components/ui/badge';
import { withAuth } from '@/components/auth/withAuth';
import { useToast } from '@/hooks/use-toast';
import { Section, PageToolbar } from '@/components/layout/primitives';
const formatDate = (timestamp: any) => {
  if (!timestamp?.toDate) return 'N/A';
  return timestamp.toDate().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
};

function AdminActivityPage() {
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, COLLECTIONS.AUDIT_LOGS), orderBy('timestamp', 'desc'), limit(200));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const logs: AuditLogEntry[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            logs.push({ 
                id: doc.id,
                action: data.action ?? '',
                adminId: (data as any).adminId ?? (data as any).performedBy ?? (data as any).actorUid ?? '',
                entityId: (data as any).entityId ?? '',
                timestamp: data.timestamp ?? null
            } as any);
        });
        setAuditLog(logs);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching audit logs: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la bitácora.' });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleDownload = () => {
      toast({ title: 'Próximamente', description: 'La descarga de reportes de auditoría estará disponible pronto.' });
  }

  return (
    <div className="space-y-6">
      <Section>
        <PageToolbar
          right={
            <Button variant="secondary" onClick={handleDownload} disabled>
              <Download />
              Descargar Reporte
            </Button>
          }
        />
      </Section>
      
      <Card>
        <CardContent className="pt-6">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 h-96">
                <Loader2 className="w-16 h-16 text-muted-foreground animate-spin" />
                <h3 className="text-xl font-bold">Cargando bitácora...</h3>
            </div>
        ) : auditLog.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Administrador</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Recurso Afectado</TableHead>
                <TableHead className="text-right">Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLog.map((item: AuditLogEntry) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.timestamp)}</TableCell>
                  <TableCell className="font-medium">{(item as any).adminId}</TableCell>
                  <TableCell>
                      <Badge variant="secondary">{item.action}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{(item as any).entityId}</TableCell>
                  <TableCell className="text-right">
                      <Button variant="ghost" size="icon" disabled>
                          <Eye />
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-4 h-96">
            <ActivityIcon className="w-16 h-16 text-muted-foreground" />
            <h3 className="text-xl font-bold">No hay actividad administrativa</h3>
            <p className="text-muted-foreground">
              Las acciones de los administradores aparecerán aquí cuando se realicen cambios.
            </p>
          </div>
        )}
      </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Mostrando los últimos <strong>{auditLog.length}</strong> registros de auditoría.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default withAuth(AdminActivityPage, {
    requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
