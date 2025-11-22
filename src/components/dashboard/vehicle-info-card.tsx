
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bike, Palette, Car, Hash } from 'lucide-react';

export function VehicleInfoCard({ vehicle }: { vehicle: any }) {
    if (!vehicle) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline font-medium">Información del Vehículo</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No hay información del vehículo disponible.</p>
                </CardContent>
            </Card>
        );
    }
    
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline font-medium flex items-center gap-2">
            <Bike /> Información del Vehículo
        </CardTitle>
        <CardDescription>Detalles del vehículo registrado para las entregas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Car /> Marca y Modelo</span>
          <span className="font-semibold">{vehicle.brand} {vehicle.model}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Palette /> Color</span>
          <span className="font-semibold">{vehicle.color}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Hash /> Placa</span>
          <span className="font-semibold font-mono">{vehicle.plate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
