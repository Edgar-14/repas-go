import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Driver } from '@/types';
import { MINIMUM_SALARY_2025, VEHICLE_EXCLUSION_FACTORS } from '@/constants/business';

// --- Constantes de Cumplimiento 2025 ---
// Usamos los factores de exclusión centralizados de constants/business.ts
// Estos son porcentajes que se aplican al ingreso bruto mensual

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  try {
    return timestamp.toDate().toLocaleDateString('es-MX');
  } catch (e) { return 'Fecha inválida'; }
};

// CORRECCIÓN: Tipos específicos en lugar de any
interface IMSSHistoryItem {
  id: string;
  [key: string]: any;
}

const IMSS = ({ driver }: { driver: Driver | null }) => {
  const { toast } = useToast();
  const [history, setHistory] = useState<IMSSHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const driverId = driver?.id ?? null;

  // --- Lógica de Cálculo ---
  const calculatedData = useMemo(() => {
    if (!driver) {
      return { exclusionFactor: 0, grossIncome: 0, netIncome: 0, isCotizante: false, classification: 'Calculando...' };
    }
    const vehicleType = driver.vehicleInfo?.type?.toUpperCase() || 'MOTO';
    const grossIncome = driver.ingresoBrutoMensual || 0;
    
    // Usar el factor porcentual centralizado de constants/business.ts
    const exclusionPercentage = VEHICLE_EXCLUSION_FACTORS[vehicleType as keyof typeof VEHICLE_EXCLUSION_FACTORS] || 0.30;
    const exclusionFactor = Math.round(grossIncome * exclusionPercentage);
    
    const netIncome = grossIncome - exclusionFactor;
    const isCotizante = netIncome > MINIMUM_SALARY_2025;
    const classification = isCotizante ? 'Empleado Cotizante' : 'Trabajador Independiente';
    return { exclusionFactor, grossIncome, netIncome, isCotizante, classification };
  }, [driver]);

  // --- Fetch Historial ---
  useEffect(() => {
    if (!driverId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, `DRIVER/${driverId}/imssHistory`),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, [driverId]);

  if (!driver) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const handleForceRecalculate = () => {
    toast({ title: 'Próximamente', description: 'Esta función forzará el recálculo de la clasificación del IMSS.' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Clasificación de Cumplimiento IMSS</CardTitle>
          <CardDescription>Cálculo automático basado en los ingresos del último periodo.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <dl className="space-y-2">
              <div className="flex justify-between"><dt>Ingreso Bruto Mensual</dt><dd className="font-medium">${calculatedData.grossIncome.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt>Factor de Exclusión ({driver.vehicleInfo?.type})</dt><dd className="text-red-500">-${calculatedData.exclusionFactor.toFixed(2)}</dd></div>
              <div className="flex justify-between border-t pt-2"><dt>Ingreso Neto Calculado</dt><dd className="font-bold">${calculatedData.netIncome.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt>Salario Mínimo (2025)</dt><dd>${MINIMUM_SALARY_2025.toFixed(2)}</dd></div>
            </dl>
          </div>
          <div className={cn(
            "flex flex-col items-center justify-center p-6 rounded-lg",
            calculatedData.isCotizante ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          )}>
            <h3 className="text-lg font-semibold">Clasificación Actual</h3>
            <p className={cn(
              "text-2xl font-bold mt-2",
              calculatedData.isCotizante ? 'text-green-700' : 'text-yellow-700'
            )}>
              {calculatedData.classification}
            </p>
            <Badge className="mt-4" variant={calculatedData.isCotizante ? 'default' : 'secondary'}>
              Estado IMSS: {(driver as any).imssStatus || 'N/A'}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleForceRecalculate}><RefreshCw className="mr-2 h-4 w-4"/> Forzar Recálculo</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos IMSS</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
           : history.length === 0 ? <p className="text-center text-gray-500 py-8">No hay movimientos registrados.</p>
           : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo de Movimiento</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell><Badge variant="secondary">{item.type}</Badge></TableCell>
                    <TableCell>{item.details || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IMSS;
