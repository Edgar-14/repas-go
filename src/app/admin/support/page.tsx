// Página de soporte con Kanban y Sistema de Respuestas Rápidas

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, LifeBuoy, Mail, MoreHorizontal, Download, Eye, AlertTriangle, Clock, CheckCircle, FileText, Search, Filter, Copy, Send, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, addDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { useRealtimeSupportTickets } from '@/hooks/useRealtimeData';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { Section, PageToolbar } from '@/components/layout/primitives';
// Configuración del Kanban de Soporte
const SUPPORT_KANBAN_COLUMNS = [
  { id: 'open', title: 'Tickets Abiertos', icon: AlertTriangle, color: 'bg-red-50 border-red-200', status: 'open' },
  { id: 'in_progress', title: 'En Proceso', icon: Clock, color: 'bg-yellow-50 border-yellow-200', status: 'in_progress' },
  { id: 'resolved', title: 'Resueltos', icon: CheckCircle, color: 'bg-green-50 border-green-200', status: 'resolved' },
  { id: 'closed', title: 'Cerrados', icon: FileText, color: 'bg-gray-50 border-gray-200', status: 'closed' }
];

// Plantillas de Respuestas Rápidas
const QUICK_RESPONSE_TEMPLATES = [
  {
    id: 'driver_approval',
    title: 'Aprobación de Repartidor',
    category: 'Repartidores',
    template: `Estimado/a {nombre},

¡Nos complace informarte que tu solicitud para unirte a la flota de BeFast ha sido APROBADA!

Bienvenido/a a nuestro equipo. Puedes iniciar sesión en la aplicación de repartidores con tu correo electrónico y la contraseña que estableciste.

Si tienes alguna pregunta, no dudes en contactarnos.

Atentamente,
Equipo de Soporte BeFast`,
    variables: ['nombre']
  },
  {
    id: 'driver_rejection',
    title: 'Rechazo de Repartidor',
    category: 'Repartidores',
    template: `Estimado/a {nombre},

Gracias por tu interés en unirte a la flota de BeFast. Después de revisar tu solicitud, lamentamos informarte que no podemos proceder con tu aplicación en este momento.

Motivo: {motivo}

Te invitamos a aplicar nuevamente en el futuro cuando cumplas con todos los requisitos.

Atentamente,
Equipo de Soporte BeFast`,
    variables: ['nombre', 'motivo']
  },
  {
    id: 'order_confirmation',
    title: 'Confirmación de Pedido',
    category: 'Pedidos',
    template: `Estimado/a cliente,

Tu pedido #{referencia} ha sido confirmado y está siendo procesado.

Detalles del pedido:
- Monto: {monto}
- Dirección de entrega: {direccion}
- Tiempo estimado: {tiempo_estimado}

Te mantendremos informado sobre el progreso de tu pedido.

Atentamente,
Equipo BeFast`,
    variables: ['referencia', 'monto', 'direccion', 'tiempo_estimado']
  },
  {
    id: 'payment_confirmation',
    title: 'Confirmación de Pago',
    category: 'Pagos',
    template: `Estimado/a cliente,

Hemos recibido tu pago por el monto de {monto_total}.

Detalles del pago:
- Referencia: {referencia}
- Fecha: {fecha}
- Método: {metodo_pago}

Tu cuenta ha sido actualizada correctamente.

Atentamente,
Equipo de Soporte BeFast`,
    variables: ['monto_total', 'referencia', 'fecha', 'metodo_pago']
  },
  {
    id: 'general_support',
    title: 'Soporte General',
    category: 'General',
    template: `Estimado/a {nombre},

Gracias por contactarnos. Hemos recibido tu consulta y estamos trabajando para resolverla.

Tu ticket de soporte #{referencia} ha sido registrado y será atendido por nuestro equipo especializado.

Tiempo estimado de respuesta: {tiempo_respuesta}

Si tienes alguna pregunta adicional, no dudes en contactarnos.

Atentamente,
Equipo de Soporte BeFast`,
    variables: ['nombre', 'referencia', 'tiempo_respuesta']
  }
];

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'OPEN': 'default',
  'IN_PROGRESS': 'outline',
  'RESOLVED': 'secondary',
  'CLOSED': 'secondary',
  'REJECTED': 'destructive',
  'open': 'default',
  'in_progress': 'outline',
  'resolved': 'secondary',
  'closed': 'secondary',
};

const statusDisplayMap: { [key: string]: string } = {
  'OPEN': 'Abierto',
  'IN_PROGRESS': 'En Proceso',
  'RESOLVED': 'Resuelto',
  'CLOSED': 'Cerrado',
  'REJECTED': 'Rechazado',
  'open': 'Abierto',
  'in_progress': 'En Proceso',
  'resolved': 'Resuelto',
  'closed': 'Cerrado',
};

interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userType: 'DRIVER' | 'BUSINESS' | 'ADMIN';
  userEmail?: string;
  subject: string;
  description: string;
  category: 'TECHNICAL' | 'FINANCIAL' | 'DOCUMENT' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  assignedAt?: any;
  resolution?: string;
  resolvedAt?: any;
  createdAt: any;
  updatedAt: any;
}

import withAuth from '@/components/auth/withAuth';

function SupportPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Estados para el Kanban
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [draggedItem, setDraggedItem] = useState<SupportTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para respuestas rápidas
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateData, setTemplateData] = useState<Record<string, string>>({});
  const [customMessage, setCustomMessage] = useState('');
  const [isQuickResponseOpen, setIsQuickResponseOpen] = useState(false);
  
  // Estados para crear ticket
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'TECHNICAL' | 'FINANCIAL' | 'DOCUMENT' | 'GENERAL'>('GENERAL');
  const [newTicketPriority, setNewTicketPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newTicketUserType, setNewTicketUserType] = useState<'DRIVER' | 'BUSINESS' | 'ADMIN'>('ADMIN');
  const [newTicketRecipient, setNewTicketRecipient] = useState('');
  const [newTicketRecipientEmail, setNewTicketRecipientEmail] = useState('revisiones@befastapp.com.mx');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  
  // Use real-time support tickets data
  const { tickets: realtimeTickets, loading, error } = useRealtimeSupportTickets();

  // Handle real-time data errors
  useEffect(() => {
    if (error) {
      console.error('Error loading support tickets:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tickets de soporte",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Filtrar tickets por búsqueda
  const filteredTickets = realtimeTickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener tickets por estado para el Kanban
  const getTicketsByStatus = (status: string) => {
    return filteredTickets.filter(ticket => ticket.status === status);
  };

  // Calcular tiempo promedio en cada etapa
  const getAverageTimeInStage = (status: string) => {
    const stageTickets = filteredTickets.filter(ticket => ticket.status === status);
    if (stageTickets.length === 0) return '0 min';
    
    const totalTime = stageTickets.reduce((acc, ticket) => {
      const createdAt = ticket.createdAt?.toDate?.() || new Date();
      const updatedAt = ticket.updatedAt?.toDate?.() || new Date();
      const timeInStage = updatedAt.getTime() - createdAt.getTime();
      return acc + timeInStage;
    }, 0);
    
    const averageTime = totalTime / stageTickets.length;
    const hours = Math.floor(averageTime / (1000 * 60 * 60));
    const minutes = Math.floor((averageTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Funciones de drag and drop mejoradas
  const handleDragStart = (e: React.DragEvent, ticket: SupportTicket) => {
    setDraggedItem(ticket);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ticket.id);
    
    // Agregar clase al elemento que se está arrastrando
    const target = e.target as HTMLElement;
    target.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.classList.remove('dragging');
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.status === newStatus) {
      setDraggedItem(null);
      return;
    }

    const oldStatus = draggedItem.status;
    const oldColumnTitle = SUPPORT_KANBAN_COLUMNS.find(col => col.status === oldStatus)?.title;
    const newColumnTitle = SUPPORT_KANBAN_COLUMNS.find(col => col.status === newStatus)?.title;

    try {
      // Actualizar el estado en Firestore
      await updateDoc(doc(db, 'supportTickets', draggedItem.id), {
        status: newStatus,
        updatedAt: new Date()
      });

      toast({
        title: '✅ Ticket movido exitosamente',
        description: `"${draggedItem.subject}" movido de ${oldColumnTitle} a ${newColumnTitle}`
      });

      // Log para debugging
      console.log(`Ticket ${draggedItem.id} movido de ${oldStatus} a ${newStatus}`);
      
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        variant: 'destructive',
        title: '❌ Error al mover ticket',
        description: 'No se pudo actualizar el estado del ticket. Intenta nuevamente.'
      });
    }
    
    setDraggedItem(null);
  };

  // Funciones para respuestas rápidas
  const processTemplate = (template: string, data: Record<string, string>) => {
    let processedTemplate = template;
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), data[key] || '');
    });
    return processedTemplate;
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = QUICK_RESPONSE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      const processedMessage = processTemplate(template.template, templateData);
      setCustomMessage(processedMessage);
    }
  };

  const handleDataChange = (key: string, value: string) => {
    const newData = { ...templateData, [key]: value };
    setTemplateData(newData);
    
    if (selectedTemplate) {
      const template = QUICK_RESPONSE_TEMPLATES.find(t => t.id === selectedTemplate);
      if (template) {
        const processedMessage = processTemplate(template.template, newData);
        setCustomMessage(processedMessage);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    toast({
      title: 'Copiado',
      description: 'Mensaje copiado al portapapeles'
    });
  };

  const handleSend = async () => {
    if (!customMessage.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El mensaje no puede estar vacío'
      });
      return;
    }

    if (!selectedTicket) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selecciona un ticket primero'
      });
      return;
    }

    try {
      const functions = getFunctions(app);
      const sendTicketResponse = httpsCallable(functions, 'sendTicketResponse');
      
      await sendTicketResponse({
        ticketId: selectedTicket.id,
        message: customMessage,
        templateId: selectedTemplate
      });

      toast({
        title: 'Respuesta enviada',
        description: 'La respuesta se ha enviado al cliente por email'
      });

      setCustomMessage('');
      setSelectedTemplate('');
      setTemplateData({});
      setIsQuickResponseOpen(false);
    } catch (error) {
      console.error('Error sending ticket response:', error);
      toast({
        variant: 'destructive',
        title: 'Error al enviar',
        description: 'No se pudo enviar la respuesta'
      });
    }
  };

  const openQuickResponse = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsQuickResponseOpen(true);
  };

  const handleCreateTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketDescription.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El asunto y la descripción son obligatorios'
      });
      return;
    }

    if (!newTicketRecipient.trim() || !newTicketRecipientEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El destinatario y su email son obligatorios'
      });
      return;
    }

    setIsCreatingTicket(true);
    try {
      const ticketRef = await addDoc(collection(db, COLLECTIONS.SUPPORT_TICKETS), {
        ticketNumber: `TKT-${Date.now()}`,
        userId: newTicketRecipientEmail, // Usar el email como ID del usuario
        userType: newTicketUserType,
        subject: newTicketSubject,
        description: newTicketDescription,
        category: newTicketCategory,
        priority: newTicketPriority,
        status: 'OPEN',
        recipientName: newTicketRecipient,
        recipientEmail: newTicketRecipientEmail,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast({
        title: '✅ Ticket creado exitosamente',
        description: `Ticket creado para ${newTicketRecipient} (${newTicketRecipientEmail})`
      });

      // Limpiar formulario
      setNewTicketSubject('');
      setNewTicketDescription('');
      setNewTicketCategory('GENERAL');
      setNewTicketPriority('MEDIUM');
      setNewTicketUserType('ADMIN');
      setNewTicketRecipient('');
      setNewTicketRecipientEmail('revisiones@befastapp.com.mx');
      setIsCreateTicketOpen(false);

    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        variant: 'destructive',
        title: '❌ Error al crear ticket',
        description: 'No se pudo crear el ticket. Intenta nuevamente.'
      });
    } finally {
      setIsCreatingTicket(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estilos para drag and drop */}
      <style jsx>{`
        .dragging {
          transform: rotate(5deg);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        .kanban-column {
          transition: all 0.2s ease;
        }
        .kanban-column.drag-over {
          background-color: rgba(59, 130, 246, 0.1);
          border-color: rgb(59, 130, 246);
        }
      `}</style>
      
      {/* UI Universal: Section + PageToolbar */}
      <Section>
        <PageToolbar
          left={
            <div className="flex items-center gap-4 w-full min-w-0">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'kanban' | 'table')} className="w-auto">
                <TabsList>
                  <TabsTrigger value="kanban">Vista Kanban</TabsTrigger>
                  <TabsTrigger value="table">Vista Tabla</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Indicador de drag and drop */}
              {draggedItem && (
                <div className="hidden md:flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span>Arrastrando: "{draggedItem.subject}"</span>
                </div>
              )}
              
              <div className="relative flex-1 min-w-0 max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
            </div>
          }
          right={
            <div className="flex gap-2 flex-shrink-0">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsCreateTicketOpen(true)}
              >
                <FileText />
                Crear Ticket
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => exportTicketsToCSV(filteredTickets)} 
                disabled={filteredTickets.length === 0}
              >
                <Download />
                Exportar CSV
              </Button>
            </div>
          }
        />
        <div className="text-sm text-muted-foreground mt-2">
          Gestiona y da seguimiento a los tickets de soporte enviados por los usuarios
        </div>
      </Section>

          {loading ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 h-96">
              <Loader2 className="w-16 h-16 text-muted-foreground animate-spin" />
              <h3 className="text-xl font-bold">Cargando tickets de soporte...</h3>
            </div>
      ) : filteredTickets.length > 0 ? (
        <>
          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {SUPPORT_KANBAN_COLUMNS.map((column) => {
                const tickets = getTicketsByStatus(column.status);
                const IconComponent = column.icon;
                
                return (
                  <Card 
                    key={column.id} 
                    className={`kanban-column ${column.color} border-2 transition-colors ${
                      draggedItem && draggedItem.status !== column.status 
                        ? 'border-dashed border-blue-400 bg-blue-50 drag-over' 
                        : ''
                    }`}
                  >
                    <div
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDrop={(e: React.DragEvent) => handleDrop(e, column.status)}
                      className="h-full"
                    >
                    <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                          <CardTitle className="text-xs sm:text-sm font-medium">{column.title}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Badge variant="secondary" className="text-xs">{tickets.length}</Badge>
                          <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                            {getAverageTimeInStage(column.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 min-h-[200px] px-3 sm:px-6">
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ticket)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white p-2 sm:p-3 rounded-lg border shadow-sm cursor-move hover:shadow-md transition-all duration-200 ${
                            draggedItem?.id === ticket.id ? 'opacity-50 scale-95' : ''
                          }`}
                        >
                          <div className="space-y-2 sm:space-y-3">
                            {/* Header con prioridad y acciones */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-xs sm:text-sm line-clamp-2 mb-1">{ticket.subject}</h4>
                                <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-1">
                                  <Badge 
                                    variant={
                                      ticket.priority === 'HIGH' ? 'destructive' :
                                      ticket.priority === 'MEDIUM' ? 'default' : 'secondary'
                                    }
                                    className="text-[10px] sm:text-xs"
                                  >
                                    {ticket.priority}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                                    {ticket.category}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openQuickResponse(ticket)}
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-blue-100 flex-shrink-0 touch-target"
                                title="Responder rápidamente"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            {/* Información del usuario */}
                            <div className="space-y-1">
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                <span className="font-medium">Usuario:</span> {ticket.userId}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                <span className="font-medium">Tipo:</span> {ticket.userType}
                              </p>
                            </div>
                            
                            {/* Footer con fecha y acciones */}
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {ticket.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                              </span>
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/admin/support/${ticket.id}`)}
                                  className="h-6 px-2 text-[10px] sm:text-xs touch-target"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ver
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {tickets.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">No hay tickets</p>
                              <p className="text-xs">Arrastra tickets aquí para cambiar su estado</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-responsive-lg">Lista de Tickets</CardTitle>
                <CardDescription className="text-responsive-sm">Mostrando <strong>{filteredTickets.length}</strong> tickets.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="mobile-priority">ID</TableHead>
                  <TableHead className="mobile-priority">Asunto</TableHead>
                  <TableHead className="hidden md:table-cell">Email Usuario</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead className="mobile-priority">Estado</TableHead>
                  <TableHead className="mobile-priority"><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs mobile-priority">{ticket.id.substring(0, 8)}...</TableCell>
                    <TableCell className="mobile-priority max-w-[200px] truncate">{ticket.subject}</TableCell>
                        <TableCell className="hidden md:table-cell truncate">{ticket.userEmail || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{ticket.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</TableCell>
                    <TableCell className="mobile-priority">
                          <Badge variant={statusVariantMap[ticket.status ?? 'open']} className="text-xs">
                            {statusDisplayMap[ticket.status ?? 'open']}
                      </Badge>
                    </TableCell>
                    <TableCell className="mobile-priority">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Button size="sm" variant="outline" onClick={() => openQuickResponse(ticket)} className="hidden sm:flex text-xs touch-target">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Responder
                            </Button>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/admin/support/${ticket.id}`)} className="text-xs sm:text-sm touch-target">
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Ver</span>
                      </Button>
                          </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-4 h-96">
              <Mail className="w-16 h-16 text-muted-foreground" />
              <h3 className="text-xl font-bold">No hay tickets de soporte</h3>
              <p className="text-muted-foreground">Aún no se han recibido tickets de soporte en la plataforma.</p>
            </div>
          )}

      {/* Dialog de Respuestas Rápidas */}
      <Dialog open={isQuickResponseOpen} onOpenChange={setIsQuickResponseOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Sistema de Respuestas Rápidas</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Responde rápidamente usando plantillas predefinidas con variables dinámicas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Información del ticket */}
            {selectedTicket && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ticket Seleccionado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Asunto:</strong> {selectedTicket.subject}</p>
                    <p><strong>Usuario:</strong> {selectedTicket.userId}</p>
                    <p><strong>Estado:</strong> {statusDisplayMap[selectedTicket.status ?? 'open']}</p>
                  </div>
        </CardContent>
      </Card>
            )}

            {/* Selección de plantilla */}
            <div className="space-y-4">
              <Label htmlFor="template-select">Seleccionar Plantilla</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plantilla..." />
                </SelectTrigger>
                <SelectContent>
                  {QUICK_RESPONSE_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-medium">{template.title}</div>
                        <div className="text-sm text-muted-foreground">{template.category}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variables dinámicas */}
            {selectedTemplate && (
              <div className="space-y-4">
                <Label className="text-responsive-sm">Variables Dinámicas</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {QUICK_RESPONSE_TEMPLATES.find(t => t.id === selectedTemplate)?.variables.map((variable) => (
                    <div key={variable} className="space-y-2">
                      <Label htmlFor={variable}>{variable}</Label>
                      <Input
                        id={variable}
                        placeholder={`Ingresa ${variable}`}
                        value={templateData[variable] || ''}
                        onChange={(e) => handleDataChange(variable, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje personalizado */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-message">Mensaje Personalizado</Label>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </Button>
              </div>
              <Textarea
                id="custom-message"
                placeholder="El mensaje se generará automáticamente cuando selecciones una plantilla..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickResponseOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={!customMessage.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Enviar Respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Crear Ticket */}
      <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Crear Nuevo Ticket de Soporte</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Crea un nuevo ticket de soporte para gestionar solicitudes internas o externas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto *</Label>
                <Input
                  id="subject"
                  placeholder=""
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userType">Tipo de Usuario</Label>
                <Select value={newTicketUserType} onValueChange={(value: 'DRIVER' | 'BUSINESS' | 'ADMIN') => setNewTicketUserType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="DRIVER">Repartidor</SelectItem>
                    <SelectItem value="BUSINESS">Negocio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Destinatario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Destinatario *</Label>
                <Input
                  id="recipient"
                  placeholder=""
                  value={newTicketRecipient}
                  onChange={(e) => setNewTicketRecipient(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Email del Destinatario *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder=""
                  value={newTicketRecipientEmail}
                  onChange={(e) => setNewTicketRecipientEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Categoría y Prioridad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={newTicketCategory} onValueChange={(value: 'TECHNICAL' | 'FINANCIAL' | 'DOCUMENT' | 'GENERAL') => setNewTicketCategory(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="TECHNICAL">Técnico</SelectItem>
                    <SelectItem value="FINANCIAL">Financiero</SelectItem>
                    <SelectItem value="DOCUMENT">Documentación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={newTicketPriority} onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => setNewTicketPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baja</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder=""
                value={newTicketDescription}
                onChange={(e) => setNewTicketDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTicketOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateTicket} 
              disabled={!newTicketSubject.trim() || !newTicketDescription.trim() || !newTicketRecipient.trim() || !newTicketRecipientEmail.trim() || isCreatingTicket}
            >
              {isCreatingTicket ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Crear Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Exporta los tickets a CSV usando papaparse
function exportTicketsToCSV(tickets: SupportTicket[]) {
  if (!tickets.length) return;
  const data = tickets.map(t => ({
    ID: t.id,
    'Número de Ticket': t.ticketNumber,
    Asunto: t.subject,
    Usuario: t.userId,
    'Destinatario': (t as any).recipientName || 'N/A',
    'Email Destinatario': (t as any).recipientEmail || 'N/A',
    Tipo: t.userType,
    Categoría: t.category,
    Prioridad: t.priority,
    Estado: t.status || 'OPEN',
    Fecha: t.createdAt?.toDate?.().toLocaleString('es-MX') || '',
  }));
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `tickets_soporte_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default withAuth(SupportPage);
