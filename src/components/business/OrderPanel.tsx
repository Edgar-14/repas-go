'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  CreditCard, 
  Package, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  MapPin,
  User,
  Phone,
  Mail,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  normalizeOrderStatus,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOrderStatusIcon
} from '@/utils/orderStatusHelpers';

/**
 * Función helper para formatear moneda
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount || 0);
}
interface OrderFormData {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  direccionEntrega: string;
  ciudadEntrega: string;
  estadoEntrega: string;
  codigoPostalEntrega: string;
  metodoPago: 'efectivo' | 'tarjeta';
  montoACobrar: string;
  notas: string;
}

interface EnrichedOrder {
  // Información básica
  id: string;
  orderNumber: string;
  source: string;
  orderType: string;
  status: string;
  statusEs: string;
  statusColor: string;
  statusIcon: string;

  // Información financiera
  deliveryFee: number;
  tip: number;
  discountAmount: number;
  tax: number;
  subtotal: number;
  totalAmount: number;
  paymentMethod: string;
  paymentMethodLabel: string;

  // Información del cliente
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  };

  // Información del negocio
  businessInfo: {
    name: string;
    phone: string;
    address: string;
  };

  // Información del conductor
  driverInfo: {
    id: string;
    name: string;
    phone: string;
  } | null;

  // Información de ubicación
  pickupAddress: string;
  deliveryAddress: string;

  // Información de Shipday
  shipdayOrderId?: string;
  shipdayOrderNumber?: string;
  shipdayStatus?: string;
  shipdayTrackingLink?: string;
  trackingLink?: string;
  proofOfDelivery?: string;

  // Información de timeline
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  pickedUpAt?: string;
  readyToDeliverAt?: string;
  deliveredAt?: string;
  completedAt?: string;

  // Información de tiempo
  timeElapsed: string;
  progress: number;

  // Información adicional
  priority: string;
  priorityLabel: string;
  specialInstructions: string;
  notes: string;
  items: any[];

  // Información técnica
  lastShipdaySync?: string;
  financialProcessed: boolean;
  tags: string[];

  // Información para el frontend
  canCancel: boolean;
  canReassign: boolean;
  isActive: boolean;
  isCompleted: boolean;
  isProblematic: boolean;
}

interface BusinessOrderPanelProps {
  authToken: string;
  businessData: {
    businessName: string;
    availableCredits: number;
  };
}

export function BusinessOrderPanel({ authToken, businessData }: BusinessOrderPanelProps) {
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<EnrichedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState<OrderFormData>({
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    direccionEntrega: '',
    ciudadEntrega: '',
    estadoEntrega: '',
    codigoPostalEntrega: '',
    metodoPago: 'efectivo',
    montoACobrar: '',
    notas: ''
  });

  // Load active orders on component mount
  useEffect(() => {
    fetchActiveOrders();
  }, []);

  const fetchActiveOrders = async () => {
    try {
      setOrdersLoading(true);

      // Usar el nuevo endpoint enriquecido
      const response = await fetch('/api/shipday/active-orders?limit=50', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.data.orders || []);
        } else {
          console.error('Error en respuesta de API:', data.error);
          toast({
            title: "Error cargando órdenes",
            description: data.error || "No se pudieron cargar las órdenes",
            variant: "destructive"
          });
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudieron cargar las órdenes activas",
        variant: "destructive"
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (businessData.availableCredits < 1) {
      toast({
        title: "Créditos insuficientes",
        description: "No tienes suficientes créditos para crear una orden. Por favor, recarga tu cuenta.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/shipday/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Orden creada exitosamente",
          description: `Orden ${result.orderId} ha sido enviada a Shipday. Créditos restantes: ${result.creditsRemaining}`,
        });

        // Reset form
        setFormData({
          clienteNombre: '',
          clienteTelefono: '',
          clienteEmail: '',
          direccionEntrega: '',
          ciudadEntrega: '',
          estadoEntrega: '',
          codigoPostalEntrega: '',
          metodoPago: 'efectivo',
          montoACobrar: '',
          notas: ''
        });

        // Refresh orders list
        fetchActiveOrders();
        
        // Switch to orders tab
        setActiveTab('orders');
      } else {
        toast({
          title: "Error al crear la orden",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  
  const isFormValid = () => {
    const required = ['clienteNombre', 'clienteTelefono', 'direccionEntrega', 'ciudadEntrega', 'estadoEntrega', 'metodoPago'];
    const hasRequired = required.every(field => formData[field as keyof OrderFormData].trim() !== '');
    
    if (formData.metodoPago === 'efectivo' && !formData.montoACobrar.trim()) {
      return false;
    }
    
    return hasRequired;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel de Órdenes</h1>
          <p className="text-sm text-gray-600">
            Crea y gestiona órdenes de entrega con Shipday
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">Créditos disponibles</div>
            <div className="text-xl font-bold flex items-center">
              <CreditCard className="h-5 w-5 mr-1" />
              {businessData.availableCredits}
            </div>
          </div>
        </div>
      </div>

      {/* Credit Warning */}
      {businessData.availableCredits < 5 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Tienes pocos créditos disponibles ({businessData.availableCredits}). 
            Considera recargar tu cuenta para evitar interrupciones en el servicio.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">Crear Orden</TabsTrigger>
          <TabsTrigger value="orders">Mis Órdenes</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* Create Order Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Nueva Orden de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clienteNombre" className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Nombre del Cliente *
                    </Label>
                    <Input
                      id="clienteNombre"
                      value={formData.clienteNombre}
                      onChange={(e) => handleInputChange('clienteNombre', e.target.value)}
                      placeholder="Nombre completo del cliente"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clienteTelefono" className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Teléfono del Cliente *
                    </Label>
                    <Input
                      id="clienteTelefono"
                      value={formData.clienteTelefono}
                      onChange={(e) => handleInputChange('clienteTelefono', e.target.value)}
                      placeholder="Número de teléfono"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clienteEmail" className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email del Cliente (Opcional)
                    </Label>
                    <Input
                      id="clienteEmail"
                      type="email"
                      value={formData.clienteEmail}
                      onChange={(e) => handleInputChange('clienteEmail', e.target.value)}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Dirección de Entrega
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="direccionEntrega">Dirección Completa *</Label>
                    <Input
                      id="direccionEntrega"
                      value={formData.direccionEntrega}
                      onChange={(e) => handleInputChange('direccionEntrega', e.target.value)}
                      placeholder="Calle, número, colonia, referencias"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ciudadEntrega">Ciudad *</Label>
                      <Input
                        id="ciudadEntrega"
                        value={formData.ciudadEntrega}
                        onChange={(e) => handleInputChange('ciudadEntrega', e.target.value)}
                        placeholder="Ciudad"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estadoEntrega">Estado *</Label>
                      <Input
                        id="estadoEntrega"
                        value={formData.estadoEntrega}
                        onChange={(e) => handleInputChange('estadoEntrega', e.target.value)}
                        placeholder="Estado"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigoPostalEntrega">Código Postal</Label>
                      <Input
                        id="codigoPostalEntrega"
                        value={formData.codigoPostalEntrega}
                        onChange={(e) => handleInputChange('codigoPostalEntrega', e.target.value)}
                        placeholder="CP"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Información de Pago
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metodoPago">Método de Pago *</Label>
                      <Select
                        value={formData.metodoPago}
                        onValueChange={(value) => handleInputChange('metodoPago', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.metodoPago === 'efectivo' && (
                      <div className="space-y-2">
                        <Label htmlFor="montoACobrar">Monto a Cobrar *</Label>
                        <Input
                          id="montoACobrar"
                          type="number"
                          step="0.01"
                          value={formData.montoACobrar}
                          onChange={(e) => handleInputChange('montoACobrar', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas Adicionales</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => handleInputChange('notas', e.target.value)}
                    placeholder="Instrucciones especiales para la entrega..."
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setFormData({
                      clienteNombre: '',
                      clienteTelefono: '',
                      clienteEmail: '',
                      direccionEntrega: '',
                      ciudadEntrega: '',
                      estadoEntrega: '',
                      codigoPostalEntrega: '',
                      metodoPago: 'efectivo',
                      montoACobrar: '',
                      notas: ''
                    });
                  }}>
                    Limpiar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !isFormValid() || businessData.availableCredits < 1}
                    className="min-w-[120px]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Package className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Creando...' : 'Crear Orden'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Órdenes Activas</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchActiveOrders}
                disabled={ordersLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${ordersLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Cargando órdenes...</span>
                </div>
              ) : orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Creada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          <div>{order.orderNumber}</div>
                          <div className="text-xs text-gray-500">{order.id.slice(-8)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.customerInfo.name}</div>
                          <div className="text-sm text-gray-500">{order.customerInfo.phone}</div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate font-medium">{order.deliveryAddress}</div>
                          <div className="text-xs text-gray-500">{order.businessInfo.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={order.statusColor}>
                            <span className="mr-1">{order.statusIcon}</span>
                            {order.statusEs}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {order.paymentMethodLabel} • {formatCurrency(order.totalAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.driverInfo ? (
                            <div>
                              <div className="font-medium">{order.driverInfo.name}</div>
                              <div className="text-sm text-gray-500">{order.driverInfo.phone}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No asignado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{order.createdAt}</div>
                          <div className="text-xs text-gray-500">{order.timeElapsed}</div>
                          {order.progress < 100 && (
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div
                                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${order.progress}%` }}
                              ></div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No tienes órdenes activas</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab('create')}
                  >
                    Crear primera orden
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Órdenes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>El historial completo estará disponible próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
