'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/Input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Package,
  Truck,
  Clock,
  MapPin,
  User,
  Store,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Navigation,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, where, getDocs, limit, startAfter } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import withAuth from '@/components/auth/withAuth';
import ExportOrdersButton from '@/components/ExportOrdersButton';
import { SearchInput } from '@/components/ui/search-input';
import { Section, PageToolbar } from '@/components/layout/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface Order {
  id: string;
  orderNumber: string;
  businessId: string;
  businessName: string;
  driverId?: string;
  driverName?: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'AT_PICKUP' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  deliveryFee: number;
  paymentMethod: 'CASH' | 'CARD';
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDeliveryTime: number;
  actualDeliveryTime?: number;
  createdAt: Date;
  updatedAt: Date;
  assignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  notes?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  source?: string;
  shipdayOrderId?: string | number;
  discount?: number;
  tip?: number;
  totalAmount?: number;
}

// Función para mapear estados de Shipday a estados de BeFast
function mapShipdayStatus(shipdayStatus: string): Order['status'] {
  const statusMap: Record<string, Order['status']> = {
    'NOT_ASSIGNED': 'PENDING',
    'NOT_ACCEPTED': 'PENDING',
    'NOT_STARTED_YET': 'PENDING',
    'STARTED': 'IN_PROGRESS',
    'PICKED_UP': 'PICKED_UP',
    'READY_TO_DELIVER': 'IN_TRANSIT',
    'ALREADY_DELIVERED': 'DELIVERED',
    'INCOMPLETE': 'CANCELLED',
    'FAILED_DELIVERY': 'CANCELLED',
    'PENDING': 'PENDING',
    'ASSIGNED': 'ASSIGNED',
    'IN_PROGRESS': 'IN_PROGRESS',
    'AT_PICKUP': 'AT_PICKUP',
    'IN_TRANSIT': 'IN_TRANSIT',
    'DELIVERED': 'DELIVERED',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED'
  };
  
  return statusMap[shipdayStatus] || 'PENDING';
}

function mapRealtimeOrderStatus(status: string): Order['status'] {
  const statusMap: Record<string, Order['status']> = {
    'SEARCHING': 'PENDING',
    'FAILED': 'CANCELLED',
    'PENDING': 'PENDING',
    'ASSIGNED': 'ASSIGNED',
    'IN_PROGRESS': 'IN_PROGRESS',
    'AT_PICKUP': 'AT_PICKUP',
    'PICKED_UP': 'PICKED_UP',
    'IN_TRANSIT': 'IN_TRANSIT',
    'DELIVERED': 'DELIVERED',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED'
  };
  return statusMap[status] || 'PENDING';
}

import { useRealtimeOrders } from '@/hooks/useRealtimeData';

function OrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredOrdersPerPage] = useState(10); // Reducido para mejor UX
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all'); // New filter for order type
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const { orders: realtimeOrdersRaw, loading: rtLoading, error: rtError } = useRealtimeOrders(filteredOrdersPerPage);

  useEffect(() => {
    if (!autoRefresh) return;
    if (rtError) {
      console.error('Error realtime filteredOrders:', rtError);
      return;
    }
    setLoading(rtLoading);
    if (realtimeOrdersRaw && Array.isArray(realtimeOrdersRaw)) {
      const transformed = realtimeOrdersRaw.map((o: any) => ({
        id: o.id,
        orderNumber: o.shipdayOrderNumber || o.orderId || o.id,
        businessId: o.businessId,
        businessName: o.pickup?.name || 'Restaurante',
        driverId: o.driverId,
        driverName: undefined,
        status: mapRealtimeOrderStatus(o.status),
        priority: 'NORMAL',
        deliveryFee: o.deliveryCost ?? 0,
        paymentMethod: o.paymentMethod,
        pickupAddress: typeof o.pickup?.address === 'string' ? o.pickup.address : '',
        deliveryAddress: typeof o.customer?.address === 'string' ? o.customer.address : '',
        estimatedDeliveryTime: o.estimatedDeliveryTime ?? 30,
        createdAt: (o.createdAt as any)?.toDate?.() ?? new Date(),
        updatedAt: (o.updatedAt as any)?.toDate?.() ?? new Date(),
        assignedAt: undefined,
        pickedUpAt: undefined,
        deliveredAt: undefined,
        completedAt: undefined,
        notes: '',
        items: [],
        source: o.source || ((o.shipdayOrderNumber || o.orderId || o.id || '').toString().startsWith('#SD-') || (o.shipdayOrderNumber || o.orderId || o.id || '').toString().startsWith('SD-')) ? 'DELIVERY' : (o.source || 'DELIVERY'), // Usar source del documento
        shipdayOrderId: o.shipdayOrderId || undefined,
      })) as Order[];
      
      // Usar directamente las órdenes en tiempo real sin preservar datos antiguos
      // Esto asegura que los cambios se reflejen inmediatamente
      setAllOrders(transformed);
    }
  }, [autoRefresh, realtimeOrdersRaw, rtLoading, rtError]);

  const loadOrders = async (page = 1, isNewLoad = true) => {
    try {
      setLoading(true);
      
      // Consulta base para órdenes de Firebase
      let q = query(
        collection(db, COLLECTIONS.ORDERS),
        orderBy('createdAt', 'desc'),
        limit(filteredOrdersPerPage)
      );

      // Si no es la primera página, usar startAfter para paginación
      if (page > 1 && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      
      // Guardar el último documento para paginación
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastDoc);
      setHasMore(snapshot.docs.length === filteredOrdersPerPage);

      console.log('📋 Órdenes de Firebase cargadas:', snapshot.docs.length);
      const firebaseOrders = snapshot.docs.map(d => {
        const data: any = d.data();
        const normalizedStatus = mapRealtimeOrderStatus(String(data.status || data.shipdayStatus || 'PENDING').toUpperCase());
        const pm = String(data.paymentMethod || '').toUpperCase();
        const paymentMethod = pm === 'CASH' ? 'CASH' : 'CARD';
        const orderNumber = data.orderNumber || data.shipdayOrderId || d.id;
        const businessName = data.businessName || data.pickup?.name || 'Restaurante';
        const orderNum = String(data.orderNumber || data.shipdayOrderNumber || '');
        const source = (orderNum.startsWith('BF-DLV-') || orderNum.startsWith('#SD-') || orderNum.startsWith('SD-')) ? 'DELIVERY' : 'MARKET';
        return {
          id: d.id,
          orderNumber,
          businessId: data.businessId || '',
          businessName,
          driverId: data.driverId,
          driverName: data.driverName,
          status: normalizedStatus,
          priority: (data.priority || 'NORMAL').toUpperCase(),
          deliveryFee: Number(data.deliveryFee ?? 0),
          paymentMethod,
          pickupAddress: typeof (data.pickup?.address || data.pickupAddress) === 'string' ? (data.pickup?.address || data.pickupAddress || '') : '',
          deliveryAddress: typeof (data.customer?.address || data.deliveryAddress) === 'string' ? (data.customer?.address || data.deliveryAddress || '') : '',
          estimatedDeliveryTime: Number(data.estimatedDeliveryTime ?? 30),
          actualDeliveryTime: data.deliveryTime ? Number(data.deliveryTime) : undefined,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          assignedAt: data.assignedAt?.toDate?.(),
          pickedUpAt: data.pickedUpAt?.toDate?.(),
          deliveredAt: data.deliveredAt?.toDate?.() || data.completedAt?.toDate?.(),
          completedAt: data.completedAt?.toDate?.(),
          notes: data.notes || '',
          items: data.items || [],
          source,
          shipdayOrderId: data.shipdayOrderId || undefined,
        } as Order;
      }) as Order[];

      // Para la primera carga, también cargar órdenes de Shipday
      if (isNewLoad) {
        const shipdayQ = query(
          collection(db, 'shipdayOrders'),
          orderBy('createdAt', 'desc'),
          limit(50) // Limitar órdenes de Shipday para no sobrecargar
        );

        const shipdaySnapshot = await getDocs(shipdayQ);
        console.log('📋 Órdenes de Shipday:', shipdaySnapshot.docs.length);
        const shipdayOrders = shipdaySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            orderNumber: data.orderNumber || data.order_number || `SD-${data.orderId}`,
            businessName: data.restaurant?.name || data.pickup?.name || 'Restaurante',
            driverName: data.assignedCarrier?.name || data.carrier?.name || 'No asignado',
            status: mapShipdayStatus(data.status || data.order_status || 'PENDING'),
            priority: 'NORMAL',
            deliveryFee: data.deliveryFee || data.delivery_fee || 0,
            paymentMethod: (data.paymentMethod || data.payment_method || 'cash') === 'cash' ? 'CASH' : 'CARD',
            pickupAddress: data.restaurant?.address || data.pickup?.formattedAddress || 'Dirección no disponible',
            deliveryAddress: data.customer?.address || data.delivery?.formattedAddress || 'Dirección no disponible',
            estimatedDeliveryTime: 30,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            assignedAt: data.assignedTime ? new Date(data.assignedTime) : undefined,
            pickedUpAt: data.pickedupTime ? new Date(data.pickedupTime) : undefined,
            deliveredAt: data.deliveryTime ? new Date(data.deliveryTime) : undefined,
            completedAt: data.deliveryTime ? new Date(data.deliveryTime) : undefined,
            notes: data.deliveryNote || data.delivery_note || '',
            items: data.orderItems || [],
            source: 'Shipday',
            shipdayOrderId: data.orderId || data.order_id
          };
        }) as Order[];

        // Combinar órdenes de Firebase y Shipday
        const allOrders = [...firebaseOrders, ...shipdayOrders];
        console.log('📋 Total de órdenes combinadas:', allOrders.length);
        setAllOrders(allOrders);
      } else {
        // Para paginación, solo agregar nuevas órdenes de Firebase
        setAllOrders(prev => [...prev, ...firebaseOrders]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading filteredOrders:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1, true);
  }, []);

  // Función para cargar más órdenes (paginación)
  const loadMoreOrders = async () => {
    if (hasMore && !loading) {
      setLoading(true);
      try {
        let q = query(
          collection(db, COLLECTIONS.ORDERS),
          orderBy('createdAt', 'desc'),
          limit(filteredOrdersPerPage)
        );

        if (lastVisible) {
          q = query(q, startAfter(lastVisible));
        }

        const snapshot = await getDocs(q);
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setLastVisible(lastDoc);
        setHasMore(snapshot.docs.length === filteredOrdersPerPage);

        const newOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          assignedAt: doc.data().assignedAt?.toDate(),
          pickedUpAt: doc.data().pickedUpAt?.toDate(),
          deliveredAt: doc.data().deliveredAt?.toDate(),
          completedAt: doc.data().completedAt?.toDate(),
        })) as Order[];

        setAllOrders(prev => [...prev, ...newOrders]);
      } catch (error) {
        console.error('Error loading more filteredOrders:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar más órdenes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper function to detect order type
  const detectOrderType = (order: Order): 'DELIVERY' | 'MARKET' | 'UNKNOWN' => {
    // Primero verificar por source si está disponible
    if (order.source === 'DELIVERY') return 'DELIVERY';
    if (order.source === 'MARKET') return 'MARKET';
    
    // Luego verificar por número de orden
    const orderNo = String(order.orderNumber ?? '');
    // Delivery: BF-DLV-YYYYMMDD-XXXXX o #SD-número
    if (orderNo.startsWith('BF-DLV-') || orderNo.startsWith('#SD-') || orderNo.startsWith('SD-')) return 'DELIVERY';
    // Market: solo #Número (sin SD)
    if ((orderNo.startsWith('#') && !orderNo.startsWith('#SD-')) || order.businessId === 'befast_market') return 'MARKET';
    
    return 'UNKNOWN';
  };

  useEffect(() => {
    try {
      let filtered = allOrders;

      // Aplicar filtro de búsqueda
      if (searchTerm) {
        filtered = filtered.filter(order =>
          order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.pickupAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Aplicar filtro de estado
      if (statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
      }

      // Aplicar filtro de prioridad
      if (priorityFilter !== 'all') {
        filtered = filtered.filter(order => order.priority === priorityFilter);
      }

      // Aplicar filtro de tipo de pedido
      if (orderTypeFilter !== 'all') {
        filtered = filtered.filter(order => {
          try {
            return detectOrderType(order) === orderTypeFilter;
          } catch (error) {
            console.error('Error detecting order type:', error, order);
            return false;
          }
        });
      }

      setFilteredOrders(filtered);
    } catch (error) {
      console.error('Error filtering filteredOrders:', error);
      setFilteredOrders(allOrders);
    }
    // Nota: No resetear currentPage aquí para mantener la paginación consistente
  }, [allOrders, searchTerm, statusFilter, priorityFilter, orderTypeFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), { // Using ORDERS collection per BEFAST FLUJO FINAL
        status: newStatus,
        updatedAt: new Date(),
      });

      toast({
        title: "Estado actualizado",
        description: `La orden ahora está ${newStatus.toLowerCase()}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const syncWithShipday = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/shipday/sync-to-firestore?type=filteredOrders&companyId=409', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Sincronización exitosa",
          description: `Se sincronizaron ${data.results.filteredOrders.success} pedidos de Shipday`,
        });
        // Recargar la página para mostrar las nuevas órdenes
        window.location.reload();
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error syncing with Shipday:', error);
      toast({
        title: "Error de sincronización",
        description: "No se pudo sincronizar con Shipday",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const exportOrders = async () => {
    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams({
        companyId: '117106' // Tu empresa
      });

      // Agregar filtros si están activos
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/shipday/export/filteredOrders?${params.toString()}`);
      
      if (response.ok) {
        // Crear blob y descargar
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos-befast-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Exportación exitosa",
          description: "Los pedidos se han exportado correctamente",
        });
      } else {
        throw new Error('Error al exportar pedidos');
      }
    } catch (error) {
      console.error('Error exporting filteredOrders:', error);
      toast({
        title: "Error de exportación",
        description: "No se pudieron exportar los pedidos",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string): React.ReactElement => {
    const statusConfig = {
      'PENDING': { 
        label: 'Pendiente', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="w-3 h-3" />
      },
      'ASSIGNED': { 
        label: 'Asignada', 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <User className="w-3 h-3" />
      },
      'IN_PROGRESS': { 
        label: 'En Progreso', 
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: <Truck className="w-3 h-3" />
      },
      'AT_PICKUP': { 
        label: 'En Recolección', 
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <Package className="w-3 h-3" />
      },
      'PICKED_UP': { 
        label: 'Recolectada', 
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <CheckCircle className="w-3 h-3" />
      },
      'IN_TRANSIT': { 
        label: 'En Tránsito', 
        className: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        icon: <Navigation className="w-3 h-3" />
      },
      'DELIVERED': { 
        label: 'Entregada', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="w-3 h-3" />
      },
      'COMPLETED': { 
        label: 'Completada', 
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle className="w-3 h-3" />
      },
      'CANCELLED': { 
        label: 'Cancelada', 
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-3 h-3" />
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];
    
    return (
      <Badge className={`gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pendiente',
      'ASSIGNED': 'Asignada', 
      'IN_PROGRESS': 'En Progreso',
      'AT_PICKUP': 'En Recolección',
      'PICKED_UP': 'Recolectada',
      'IN_TRANSIT': 'En Tránsito',
      'DELIVERED': 'Entregada',
      'COMPLETED': 'Completada',
      'CANCELLED': 'Cancelada'
    };
    return statusMap[status] || 'Desconocido';
  };

  const getPriorityText = (priority: string): string => {
    const priorityMap: Record<string, string> = {
      'LOW': 'Baja',
      'NORMAL': 'Normal',
      'HIGH': 'Alta',
      'URGENT': 'Urgente'
    };
    return priorityMap[priority] || 'Normal';
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'LOW': { 
        label: 'Baja', 
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      'NORMAL': { 
        label: 'Normal', 
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      'HIGH': { 
        label: 'Alta', 
        className: 'bg-orange-100 text-orange-800 border-orange-200'
      },
      'URGENT': { 
        label: 'Urgente', 
        className: 'bg-red-100 text-red-800 border-red-200'
      }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig['NORMAL'];
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getOrderTypeBadge = (order: Order): React.ReactElement => {
    const orderType = detectOrderType(order);
    const typeConfig = {
      'DELIVERY': {
        label: 'Portal Delivery',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Package className="w-3 h-3" />
      },
      'MARKET': {
        label: 'BeFast Market',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <Store className="w-3 h-3" />
      },
      'UNKNOWN': {
        label: 'Desconocido',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <AlertTriangle className="w-3 h-3" />
      }
    };

    const config = typeConfig[orderType];

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Nueva función para obtener información detallada de Market
  const getMarketOrderDetails = (order: Order) => {
    const orderType = detectOrderType(order);

    if (orderType === 'MARKET') {
      const items = order.items || [];
      const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

      return {
        hasDetails: true,
        itemsCount: totalItems,
        subtotal: subtotal,
        discount: order.discount || 0,
        tip: order.tip || 0,
        products: items.slice(0, 3).map(item => `${item.name} x${item.quantity}`).join(', '),
        showMoreProducts: items.length > 3 ? `... y ${items.length - 3} más` : ''
      };
    }

    return {
      hasDetails: false,
      itemsCount: 0,
      subtotal: 0,
      discount: 0,
      tip: 0,
      products: '',
      showMoreProducts: ''
    };
  };

  const getTimeElapsed = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const getDeliveryTimeStatus = (order: Order) => {
    if (!order.estimatedDeliveryTime) return null;
    
    const now = new Date();
    const estimatedTime = new Date(order.createdAt.getTime() + order.estimatedDeliveryTime * 60000);
    const isOverdue = now > estimatedTime;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${
        isOverdue ? 'text-red-600' : 'text-green-600'
      }`}>
        <Timer className="w-3 h-3" />
        <span>
          {isOverdue ? 'Atrasada' : 'A tiempo'}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <Section className="space-y-3">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por orden, negocio, repartidor o dirección..."
          onClear={() => setSearchTerm('')}
          className="w-full min-w-0 h-9 sm:h-10"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="PENDING">Pendientes</SelectItem>
              <SelectItem value="ASSIGNED">Asignadas</SelectItem>
              <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
              <SelectItem value="AT_PICKUP">En Recolección</SelectItem>
              <SelectItem value="PICKED_UP">Recolectadas</SelectItem>
              <SelectItem value="IN_TRANSIT">En Tránsito</SelectItem>
              <SelectItem value="DELIVERED">Entregadas</SelectItem>
              <SelectItem value="COMPLETED">Completadas</SelectItem>
              <SelectItem value="CANCELLED">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Filtrar por prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="URGENT">Urgentes</SelectItem>
              <SelectItem value="HIGH">Altas</SelectItem>
              <SelectItem value="NORMAL">Normales</SelectItem>
              <SelectItem value="LOW">Bajas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
            <SelectTrigger className="w-full h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="DELIVERY">Portal Delivery</SelectItem>
              <SelectItem value="MARKET">BeFast Market</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
            <Button
              variant="outline"
              size="sm"
              onClick={syncWithShipday}
              disabled={syncing}
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </Button>
            <ExportOrdersButton className="flex-1 h-9 sm:h-10 text-xs sm:text-sm" size="sm" />
          </div>
        </div>
      </Section>

      {/* Dashboard Ejecutivo - Métricas de Alto Nivel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Órdenes con Indicadores */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-blue-600 text-sm font-medium mb-1">Total Órdenes</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-800 mb-1">{filteredOrders.length}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-600 font-medium">
                        {filteredOrders.filter(o => detectOrderType(o) === 'MARKET').length} Market
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-600 font-medium">
                        {filteredOrders.filter(o => detectOrderType(o) === 'DELIVERY').length} Delivery
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Financieras Ejecutivas */}
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-emerald-600 text-sm font-medium mb-1">Valor Total</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-1">
                    ${filteredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0).toLocaleString()}
                  </p>
                  <div className="text-xs space-y-1">
                    <p className="text-emerald-600">
                      💰 Comisión BeFast: <span className="font-bold">${(filteredOrders.length * 15).toLocaleString()}</span>
                    </p>
                    <p className="text-emerald-500">
                      📈 Promedio por orden: <span className="font-bold">${filteredOrders.length > 0 ? Math.round(filteredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0) / filteredOrders.length) : 0}</span>
                    </p>
                  </div>
                </div>
                <div className="p-2 bg-emerald-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Rendimiento Operativo */}
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-amber-600 text-sm font-medium mb-1">Rendimiento Operativo</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-800 mb-1">
                    {filteredOrders.length > 0 ? Math.round((filteredOrders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length / filteredOrders.length) * 100) : 0}%
                  </p>
                  <div className="text-xs space-y-1">
                    <p className="text-green-600">
                      ✅ {filteredOrders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length} completadas
                    </p>
                    <p className="text-red-600">
                      ❌ {filteredOrders.filter(o => o.status === 'CANCELLED').length} canceladas
                    </p>
                  </div>
                </div>
                <div className="p-2 bg-amber-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribución por Tipo de Pedido */}
          <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-violet-600 text-sm font-medium mb-1">Market vs Delivery</p>
                  <p className="text-2xl sm:text-3xl font-bold text-violet-800 mb-1">
                    {filteredOrders.length > 0 ? Math.round((filteredOrders.filter(o => detectOrderType(o) === 'MARKET').length / filteredOrders.length) * 100) : 0}%
                  </p>
                  <div className="text-xs space-y-1">
                    <p className="text-purple-600">
                      🛒 {filteredOrders.filter(o => detectOrderType(o) === 'MARKET').length} pedidos Market
                    </p>
                    <p className="text-blue-600">
                      🚚 {filteredOrders.filter(o => detectOrderType(o) === 'DELIVERY').length} pedidos Delivery
                    </p>
                  </div>
                </div>
                <div className="p-2 bg-violet-100 rounded-full">
                  <Store className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Avanzadas por Segmento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rendimiento por Tipo de Pedido */}
          <Card className="bg-white border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Rendimiento por Tipo de Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const marketOrders = filteredOrders.filter(o => detectOrderType(o) === 'MARKET');
                  const deliveryOrders = filteredOrders.filter(o => detectOrderType(o) === 'DELIVERY');

                  const marketCompleted = marketOrders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length;
                  const deliveryCompleted = deliveryOrders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length;

                  const marketSuccessRate = marketOrders.length > 0 ? Math.round((marketCompleted / marketOrders.length) * 100) : 0;
                  const deliverySuccessRate = deliveryOrders.length > 0 ? Math.round((deliveryCompleted / deliveryOrders.length) * 100) : 0;

                  return (
                    <>
                      {/* Market Performance */}
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-purple-800 flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            BeFast Market
                          </h4>
                          <span className="text-sm font-bold text-purple-700">{marketOrders.length} pedidos</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-purple-600">Tasa de éxito:</span>
                            <span className="font-medium text-purple-800">{marketSuccessRate}%</span>
                          </div>
                          <div className="w-full bg-purple-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${marketSuccessRate}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-purple-600">
                            <span>{marketCompleted} completados</span>
                            <span>{marketOrders.length - marketCompleted} pendientes</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Performance */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-blue-800 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Portal Delivery
                          </h4>
                          <span className="text-sm font-bold text-blue-700">{deliveryOrders.length} pedidos</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-600">Tasa de éxito:</span>
                            <span className="font-medium text-blue-800">{deliverySuccessRate}%</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${deliverySuccessRate}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-blue-600">
                            <span>{deliveryCompleted} completados</span>
                            <span>{deliveryOrders.length - deliveryCompleted} pendientes</span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Resumen Financiero Ejecutivo */}
          <Card className="bg-white border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Resumen Financiero Ejecutivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const totalValue = filteredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
                  const totalCommission = filteredOrders.length * 15;
                  const netValue = totalValue - totalCommission;

                  const marketValue = filteredOrders.filter(o => detectOrderType(o) === 'MARKET').reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
                  const deliveryValue = filteredOrders.filter(o => detectOrderType(o) === 'DELIVERY').reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-800">${totalValue.toLocaleString()}</p>
                          <p className="text-xs text-green-600">Valor Bruto Total</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-2xl font-bold text-red-800">${totalCommission.toLocaleString()}</p>
                          <p className="text-xs text-red-600">Comisión BeFast</p>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-800">${netValue.toLocaleString()}</p>
                          <p className="text-sm text-blue-600">Valor Neto para Repartidores</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-purple-700 flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            Market:
                          </span>
                          <span className="font-bold text-purple-800">${marketValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-blue-700 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Delivery:
                          </span>
                          <span className="font-bold text-blue-800">${deliveryValue.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market vs Delivery Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Market Orders Summary */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                <Store className="w-5 h-5" />
                BeFast Market
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const marketOrders = filteredOrders.filter(o => detectOrderType(o) === 'MARKET');
                const marketValue = marketOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
                const marketCompleted = marketOrders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length;

                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Total Market:</span>
                      <span className="font-bold text-purple-800">{marketOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Valor Market:</span>
                      <span className="font-bold text-purple-800">${marketValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Completados:</span>
                      <span className="font-bold text-purple-800">{marketCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Tasa de éxito:</span>
                      <span className="font-bold text-purple-800">
                        {marketOrders.length > 0 ? Math.round((marketCompleted / marketOrders.length) * 100) : 0}%
                      </span>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Delivery Orders Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                <Package className="w-5 h-5" />
                Portal Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const deliveryOrders = filteredOrders.filter(o => detectOrderType(o) === 'DELIVERY');
                const deliveryValue = deliveryOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
                const deliveryCompleted = deliveryOrders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length;

                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Total Delivery:</span>
                      <span className="font-bold text-blue-800">{deliveryOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Valor Delivery:</span>
                      <span className="font-bold text-blue-800">${deliveryValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Completados:</span>
                      <span className="font-bold text-blue-800">{deliveryCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Tasa de éxito:</span>
                      <span className="font-bold text-blue-800">
                        {deliveryOrders.length > 0 ? Math.round((deliveryCompleted / deliveryOrders.length) * 100) : 0}%
                      </span>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>

      {/* Tabla de órdenes - Optimizada para mobile */}
      <Card>
        <CardContent className="p-0">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'No se encontraron órdenes que coincidan con los filtros aplicados.'
                      : 'No hay órdenes registradas en el sistema.'
                    }
                  </p>
                </div>
              ) : (
            <div className="overflow-x-auto">
              {/* Vista móvil - Cards */}
              <div className="sm:hidden space-y-3 p-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="card-mobile">
                    <CardHeader className="card-mobile-header">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-sm">Orden #{order.orderNumber}</CardTitle>
                            {getOrderTypeBadge(order)}
                          </div>
                          <CardDescription className="text-xs">
                            {getTimeElapsed(order.createdAt)}
                          </CardDescription>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="card-mobile-content space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Negocio:</span>
                          <p className="truncate">{order.businessName}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Estado:</span>
                          <p>{getStatusText(order.status)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Tarifa:</span>
                          <p>${order.deliveryFee}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Prioridad:</span>
                          <p>{getPriorityText(order.priority)}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                          className="touch-target"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Vista desktop - Table */}
              <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="mobile-priority">Orden</TableHead>
                        <TableHead className="hidden sm:table-cell">Negocio</TableHead>
                        <TableHead className="hidden md:table-cell">Repartidor</TableHead>
                        <TableHead className="mobile-priority">Estado</TableHead>
                        <TableHead className="hidden lg:table-cell">Prioridad</TableHead>
                        <TableHead className="hidden lg:table-cell">Productos</TableHead>
                        <TableHead className="hidden xl:table-cell">Direcciones</TableHead>
                        <TableHead className="hidden lg:table-cell">Tiempo</TableHead>
                        <TableHead className="hidden md:table-cell">Tarifa</TableHead>
                        <TableHead className="hidden xl:table-cell">Creación</TableHead>
                        <TableHead className="w-[50px] mobile-priority">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50 group" data-label="Orden">
                      <TableCell className="mobile-priority" data-label="Orden">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-mono font-medium text-gray-900 text-responsive-sm">
                              #{order.orderNumber}
                            </div>
                            {getOrderTypeBadge(order)}
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {getTimeElapsed(order.createdAt)}
                          </div>
                          {/* Mobile-only business info */}
                          <div className="sm:hidden text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              <span className="truncate">{order.businessName}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" data-label="Negocio">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={`/business-avatars/${order.businessId}.jpg`} />
                            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white text-xs">
                              {order.businessName ? order.businessName.split(' ').map(n => n[0]).join('').toUpperCase() : 'BS'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900 truncate text-sm">
                            {order.businessName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell" data-label="Repartidor">
                        {(() => {
                          type ExtendedOrder = typeof order & {
                            driverName?: string;
                            shipdayCarrierName?: string;
                            shipdayCarrierId?: string;
                          };
                          const orderData = order as ExtendedOrder;
                          const driverName = orderData.driverName || orderData.shipdayCarrierName;
                          if (driverName) {
                            return (
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={`/avatars/${order.driverId || 'default'}.jpg`} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                    {driverName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="font-medium text-gray-900 truncate text-sm">
                                    {driverName}
                                  </span>
                                  {orderData.shipdayCarrierId && !order.driverId && (
                                    <div className="text-xs text-orange-600">Carrier de Shipday no sincronizado</div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return <span className="text-gray-500 text-sm">Sin asignar</span>;
                        })()}
                      </TableCell>
                      <TableCell className="mobile-priority" data-label="Estado">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" data-label="Prioridad">
                        {getPriorityBadge(order.priority)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" data-label="Productos">
                        {(() => {
                          const marketDetails = getMarketOrderDetails(order);
                          if (marketDetails.hasDetails) {
                            return (
                              <div className="space-y-1 max-w-xs">
                                <div className="text-xs font-medium text-purple-700">
                                  {marketDetails.itemsCount} productos
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {marketDetails.products}
                                </div>
                                {marketDetails.showMoreProducts && (
                                  <div className="text-xs text-purple-600">
                                    {marketDetails.showMoreProducts}
                                  </div>
                                )}
                                {marketDetails.discount > 0 && (
                                  <div className="text-xs text-green-600">
                                    Descuento: ${marketDetails.discount}
                                  </div>
                                )}
                                {marketDetails.tip > 0 && (
                                  <div className="text-xs text-blue-600">
                                    Propina: ${marketDetails.tip}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return (
                            <span className="text-xs text-gray-400">N/A</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell" data-label="Direcciones">
                        <div className="space-y-1 max-w-xs">
                          <div className="flex items-start gap-1 text-xs">
                            <MapPin className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="truncate">
                              <strong>Recoger:</strong> {order.pickupAddress}
                            </span>
                          </div>
                          <div className="flex items-start gap-1 text-xs">
                            <MapPin className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="truncate">
                              <strong>Entregar:</strong> {order.deliveryAddress}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" data-label="Tiempo">
                        <div className="space-y-1">
                          {getDeliveryTimeStatus(order)}
                          {order.estimatedDeliveryTime && (
                            <div className="text-xs text-gray-500">
                              Est: {order.estimatedDeliveryTime}min
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell" data-label="Tarifa">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="font-medium text-green-600 text-sm">
                            ${order.deliveryFee}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {order.paymentMethod === 'CASH' ? 'Efectivo' : 'Tarjeta'}
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell" data-label="Creación">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            {format(order.createdAt, 'dd/MM/yyyy', { locale: es })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(order.createdAt, 'HH:mm', { locale: es })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-label="Acciones">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors touch-target"
                            >
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="w-48 shadow-lg border-0 bg-white/95 backdrop-blur-sm"
                          >
                            <DropdownMenuLabel className="font-semibold text-gray-900">
                              Acciones
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                              className="gap-2 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 touch-target"
                            >
                              <Eye className="mr-2 h-4 w-4 text-blue-600" />
                              <span>Ver Detalles</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 touch-target">
                              <Edit className="mr-2 h-4 w-4 text-gray-600" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {order.status === 'PENDING' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, 'ASSIGNED')}
                                className="gap-2 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 touch-target"
                              >
                                <User className="mr-2 h-4 w-4 text-blue-600" />
                                <span>Asignar</span>
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                                className="gap-2 cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 touch-target"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                <span>Cancelar</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {hasMore && (
            <div className="flex justify-center items-center mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="lg"
                onClick={loadMoreOrders}
                disabled={loading || !hasMore}
                className="px-8 py-3"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  'Cargar más órdenes'
                )}
              </Button>
            </div>
          )}
          
          {/* Mostrar información de paginación */}
          <div className="text-center text-sm text-muted-foreground mt-4">
            Mostrando {filteredOrders.length} de {filteredOrders.length} ��rdenes cargadas
            {hasMore && ' • Hay más órdenes disponibles'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(OrdersPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});