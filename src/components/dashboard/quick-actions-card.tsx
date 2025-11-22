
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HandCoins, MessageSquareWarning, PhoneOff, UserCog } from 'lucide-react';

export function QuickActionsCard({ driverId }: { driverId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline font-medium">Acciones Rápidas</CardTitle>
        <CardDescription>Gestiona aspectos clave del repartidor.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="flex-col h-20">
            <UserCog className="mb-1"/>
            <span>Editar Perfil</span>
        </Button>
         <Button variant="outline" className="flex-col h-20">
            <HandCoins className="mb-1"/>
            <span>Ajustar Saldo</span>
        </Button>
         <Button variant="outline" className="flex-col h-20 text-yellow-600 border-yellow-300 hover:bg-yellow-50 hover:text-yellow-700">
            <MessageSquareWarning className="mb-1"/>
            <span>Enviar Aviso</span>
        </Button>
         <Button variant="destructive" className="flex-col h-20 bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-100 hover:text-red-700">
            <PhoneOff className="mb-1"/>
            <span>Suspender</span>
        </Button>
      </CardContent>
    </Card>
  );
}
