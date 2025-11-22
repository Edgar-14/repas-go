'use client';

import React, { useState } from 'react';
import { withAuth } from '@/components/auth/withAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Download, Users, DollarSign, Truck, Loader2, Store } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { Section, PageToolbar } from '@/components/layout/primitives';

const REPORT_DOWNLOAD_LIMIT = 5000;

function AdminReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const exportCollectionToCSV = async (colName: string, fileName: string, dateField: string | null = 'createdAt') => {
    setLoading(fileName);
    try {
      let firestoreQuery;
      const collectionRef = collection(db, colName);

      // Construir la consulta en el servidor
      if (dateFrom && dateTo && dateField) {
        const startDate = Timestamp.fromDate(new Date(dateFrom));
        const endDate = Timestamp.fromDate(new Date(dateTo + 'T23:59:59'));
        firestoreQuery = query(
          collectionRef,
          where(dateField, '>=', startDate),
          where(dateField, '<=', endDate),
          orderBy(dateField, 'desc'),
          limit(REPORT_DOWNLOAD_LIMIT)
        );
      } else {
        // Si no hay fechas, obtener los últimos N registros
        firestoreQuery = query(collectionRef, orderBy(dateField || 'name', 'desc'), limit(REPORT_DOWNLOAD_LIMIT));
      }

      const snap = await getDocs(firestoreQuery);
      
      if (snap.empty) {
        toast({ title: 'Sin Datos', description: 'No se encontraron registros para los filtros seleccionados.', variant: 'destructive' });
        return;
      }

      // Advertir si se alcanza el límite
      if (snap.size === REPORT_DOWNLOAD_LIMIT) {
        toast({ title: 'Límite Alcanzado', description: `El reporte se ha limitado a los primeros ${REPORT_DOWNLOAD_LIMIT} registros. Para más detalle, acota el rango de fechas.` });
      }

      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${fileName}.csv`);

    } catch (e: any) {
      console.error("Error exporting collection:", e);
      toast({ title: 'Error de Exportación', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const reports = [
    { title: 'Repartidores', description: 'Exportar datos de todos los repartidores.', icon: Users, col: 'drivers', file: 'repartidores', dateField: 'createdAt' },
    { title: 'Pedidos', description: 'Exportar historial completo de pedidos.', icon: Truck, col: 'orders', file: 'pedidos', dateField: 'createdAt' },
    { title: 'Nóminas', description: 'Exportar historial de nóminas procesadas.', icon: DollarSign, col: 'payrollHistory', file: 'nominas', dateField: 'runDate' },
    { title: 'Negocios', description: 'Exportar datos de todos los negocios.', icon: Store, col: 'businesses', file: 'negocios', dateField: 'createdAt' },
  ];

  return (
    <div className="space-y-6">
      {/* Filtros de fecha */}
      <Section>
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold mb-4">Filtrar por Fechas</h4>
          <PageToolbar
            left={
              <div className="flex flex-col sm:flex-row gap-4 items-end w-full min-w-0">
                <div className="w-full sm:w-auto min-w-0">
                  <Label htmlFor="dateFrom">Desde</Label>
                  <Input id="dateFrom" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full" />
                </div>
                <div className="w-full sm:w-auto min-w-0">
                  <Label htmlFor="dateTo">Hasta</Label>
                  <Input id="dateTo" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full" />
                </div>
              </div>
            }
            right={
              <Button variant="outline" onClick={() => { setDateFrom(''); setDateTo(''); }}>Limpiar</Button>
            }
          />
          <p className="text-xs text-muted-foreground mt-3">El filtro de fecha se aplicará a todos los reportes que lo soporten.</p>
        </div>
      </Section>

      {/* Reportes disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <Card key={report.title} className="p-4 flex items-start gap-4">
            <report.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
              <Button 
                onClick={() => exportCollectionToCSV(report.col, report.file, report.dateField)}
                size="sm" 
                disabled={!!loading}
              >
                {loading === report.file ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download />
                )}
                Descargar CSV
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default withAuth(AdminReportsPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
