'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withAuth } from '@/components/auth/withAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// --- Types ---
interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  userEmail: string;
  status: 'open' | 'in_progress' | 'closed' | 'rejected';
  createdAt: any;
  history: any[];
}

// --- Helper Functions ---
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  try {
    return timestamp.toDate().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) { return 'Fecha inválida'; }
};

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'open': 'default',
  'in_progress': 'outline',
  'closed': 'secondary',
  'rejected': 'destructive',
};

function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    const ticketRef = doc(db, 'supportTickets', ticketId);
    const unsubscribe = onSnapshot(ticketRef, (docSnap) => {
      if (docSnap.exists()) {
        setTicket({ id: docSnap.id, ...docSnap.data() } as SupportTicket);
      } else {
        setTicket(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [ticketId]);

  const handleUpdateStatus = async (status: SupportTicket['status']) => {
    setIsUpdating(true);
    try {
      const ticketRef = doc(db, 'supportTickets', ticketId);
      await updateDoc(ticketRef, { status });
      toast({ title: 'Éxito', description: `El estado del ticket se actualizó a ${status}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePostReply = async () => {
    if (!reply.trim() || !user?.email) return;
    setIsUpdating(true);
    try {
      const historyRef = collection(db, `supportTickets/${ticketId}/history`);
      await addDoc(historyRef, {
        type: 'reply',
        content: reply,
        author: user.email,
        createdAt: serverTimestamp(),
      });
      // Optionally update ticket status on reply
      if (ticket?.status === 'open') {
        await updateDoc(doc(db, 'supportTickets', ticketId), { status: 'in_progress' });
      }
      setReply('');
      toast({ title: 'Respuesta enviada' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la respuesta.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!ticket) {
    return (
      <Card className="p-8 text-center">
        <CardTitle>Ticket no encontrado</CardTitle>
        <Button onClick={() => router.push('/admin/support')} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/admin/support')} className="flex-shrink-0 touch-target"><ArrowLeft className="h-4 w-4" /></Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-responsive-lg font-bold break-words">{ticket.subject}</h1>
          <p className="text-responsive-sm text-muted-foreground break-words">
            <span className="block sm:inline">De: {ticket.userEmail}</span>
            <span className="hidden sm:inline"> - </span>
            <span className="block sm:inline">Creado: {formatDate(ticket.createdAt)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="px-4 sm:px-6"><CardTitle className="text-responsive-md">Descripción del Problema</CardTitle></CardHeader>
            <CardContent className="px-4 sm:px-6"><p className="whitespace-pre-wrap text-sm sm:text-base break-words">{ticket.description}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="px-4 sm:px-6"><CardTitle className="text-responsive-md">Responder al Ticket</CardTitle></CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-2">
                <Label htmlFor="reply" className="text-responsive-sm">Respuesta</Label>
                <Textarea id="reply" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Escribe tu respuesta aquí..." rows={5} className="resize-none text-sm sm:text-base" />
              </div>
            </CardContent>
            <CardFooter className="justify-end px-4 sm:px-6 py-3 sm:py-4 flex-col sm:flex-row gap-2">
              <Button onClick={handlePostReply} disabled={isUpdating || !reply.trim()} className="w-full sm:w-auto touch-target">
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Enviar Respuesta
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="px-4 sm:px-6"><CardTitle className="text-responsive-md">Detalles del Ticket</CardTitle></CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="flex justify-between items-center">
                <Label className="text-responsive-sm">Estado</Label>
                <Badge variant={statusVariantMap[ticket.status]} className="text-xs sm:text-sm">{ticket.status}</Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-responsive-sm">Cambiar Estado</Label>
                <Select onValueChange={(value) => handleUpdateStatus(value as SupportTicket['status'])} defaultValue={ticket.status}>
                  <SelectTrigger className="text-sm sm:text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Abierto</SelectItem>
                    <SelectItem value="in_progress">En Proceso</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default withAuth(SupportTicketDetailPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});