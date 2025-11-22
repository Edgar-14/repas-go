"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { COLLECTIONS } from '@/lib/collections';
import withAuth from "@/components/auth/withAuth";
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeSupportTickets } from '@/hooks/useRealtimeData';
import { LifeBuoy, Phone, History, AlertTriangle, Loader2, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';

function DriverSupportPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { tickets: allTickets, loading: ticketsLoading, error: ticketsError } = useRealtimeSupportTickets(50);
  
  const recentTickets = useMemo(() => 
    allTickets.filter(ticket => ticket.userId === user?.uid).slice(0, 5),
    [allTickets, user?.uid]
  );

  useEffect(() => {
    if (ticketsError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los tickets de soporte.',
      });
    }
  }, [ticketsError, toast]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Abierto</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En Progreso</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resuelto</Badge>;
      case 'closed':
        return <Badge variant="outline">Cerrado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión." });
    if (!subject || !message) return toast({ variant: "destructive", title: "Campos requeridos", description: "Completa el asunto y el mensaje." });

    setIsLoading(true);
    try {
      const ticketRef = await addDoc(collection(db, COLLECTIONS.SUPPORT_TICKETS), {
        ticketNumber: `SUPP-${Date.now()}`,
        userId: user.uid,
        userType: 'DRIVER',
        subject,
        description: message,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Lógica para enviar email (opcional, si tienes un endpoint para ello)
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'support_ticket_response',
          recipient: 'admin@befastapp.com.mx',
          data: {
            userName: user.displayName || user.email,
            ticketData: { transactionId: ticketRef.id, description: `Nuevo ticket: ${subject}\n\nMensaje: ${message}` }
          }
        }),
      });

      toast({ 
        title: "Ticket enviado", 
        description: "Tu solicitud ha sido recibida. Te responderemos pronto." 
      });
      setSubject("");
      setMessage("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo enviar el ticket." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEmergency = async () => {
    if (!user) return toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión." });
    
    setIsLoading(true);
    try {
        await addDoc(collection(db, "emergencies"), {
            driverId: user.uid,
            driverName: user.displayName || user.email,
            reason: "Botón de emergencia activado",
            createdAt: new Date(),
            status: "pending",
            priority: "critical"
        });

        // Lógica para enviar email de emergencia
        await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'emergency_ticket',
                recipient: 'admin@befastapp.com.mx',
                data: {
                    userName: user.displayName || user.email,
                    ticketData: { description: "EMERGENCIA - Repartidor", reason: "Botón de emergencia activado", date: new Date().toLocaleString('es-MX') }
                }
            }),
        });

        toast({ 
            title: "¡Emergencia Notificada!", 
            description: "Un administrador ha sido alertado. Te contactaremos pronto." 
        });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo notificar la emergencia." });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <Card className="border-destructive bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Zona de Emergencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Usa este botón **solo en caso de una emergencia real** (accidente, robo, peligro). Un administrador será notificado inmediatamente.
          </p>
          <Button 
            onClick={handleEmergency} 
            disabled={isLoading} 
            variant="destructive" 
            className="w-full gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Notificar Emergencia
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <LifeBuoy className="h-4 w-4" />
            Crear Ticket de Soporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subject" className="text-xs">Asunto</Label>
              <Input 
                id="subject"
                placeholder="Ej: Problema con un pedido" 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                required 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-xs">Mensaje</Label>
              <Textarea 
                id="message"
                placeholder="Describe tu problema o solicitud con el mayor detalle posible..." 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                required 
                rows={5}
                className="mt-1 resize-none"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LifeBuoy className="h-4 w-4" />}
              {isLoading ? "Enviando..." : "Enviar Ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4" />
            Mis Tickets Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando tickets...</span>
            </div>
          ) : recentTickets.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No tienes tickets de soporte recientes.</p>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm pr-2">{ticket.subject}</h4>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {ticket.createdAt?.toDate ? format(ticket.createdAt.toDate(), 'dd MMM, yyyy', { locale: es }) : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Phone className="h-4 w-4" />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="flex justify-between items-center text-sm py-3 border-b">
            <p className="text-muted-foreground">Email:</p>
            <p className="font-semibold">soporte@befastapp.com.mx</p>
          </div>
          <div className="flex justify-between items-center text-sm py-3 border-b">
            <p className="text-muted-foreground">Teléfono:</p>
            <p className="font-semibold">+52 55 1234 5678</p>
          </div>
          <div className="flex justify-between items-center text-sm py-3 border-b">
            <p className="text-muted-foreground">Horario:</p>
            <p className="font-semibold">Lunes a Viernes, 8:00 AM - 6:00 PM</p>
          </div>
          <div className="flex justify-between items-center text-sm py-3">
            <p className="text-muted-foreground">Emergencias:</p>
            <p className="font-semibold">24/7 con el botón de emergencia</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(DriverSupportPage, {
    role: 'DRIVER',
    redirectTo: '/repartidores/login',
});