
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Star, CheckCheck, Percent } from 'lucide-react';

const StatItem = ({ icon: Icon, label, value, unit }: { icon: React.ElementType, label: string, value: string | number, unit?: string }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg text-center">
        <Icon className="w-8 h-8 text-primary mb-2" />
        <p className="text-2xl font-bold">{value}{unit}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
    </div>
)

export function DriverStatsCard({ driver }: { driver: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline font-medium">Estadísticas y Rendimiento</CardTitle>
        <CardDescription>Un resumen del desempeño del repartidor.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem icon={Star} label="Calificación Prom." value={driver.rating || 'N/A'} />
        <StatItem icon={CheckCheck} label="Entregas Totales" value={driver.deliveries || 0} />
        <StatItem icon={DollarSign} label="Saldo Billetera" value={(driver.wallet?.currentBalance || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
        <StatItem icon={Percent} label="Tasa de Aceptación" value={driver.acceptanceRate || 'N/A'} unit="%" />
      </CardContent>
    </Card>
  );
}

