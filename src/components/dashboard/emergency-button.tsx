'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
export function EmergencyButton() {
  const { toast } = useToast();

  const handleEmergency = () => {
    // In a real app, this would trigger a high-priority notification
    // to the admin dashboard and potentially an SMS to an emergency contact.
    console.info('EMERGENCY PROTOCOL ACTIVATED');
    toast({
      title: 'Protocolo de Emergencia Activado',
      description: 'Se ha notificado al equipo de soporte. Mantén la calma, te contactaremos de inmediato.',
      variant: 'destructive',
      duration: 10000,
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="fixed bottom-4 right-4 z-50 h-16 w-16 rounded-full shadow-lg flex items-center justify-center animate-pulse"
        >
          <ShieldAlert className="h-8 w-8" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro de que quieres activar el protocolo de emergencia?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción solo debe usarse en caso de un accidente, robo o si tu integridad física está en riesgo. Se notificará inmediatamente al equipo de BeFast.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleEmergency}>
            Sí, activar emergencia
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
