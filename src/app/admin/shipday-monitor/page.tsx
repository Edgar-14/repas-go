'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Package, Store, Search, RefreshCw } from 'lucide-react';
import { Section, PageToolbar } from '@/components/layout/primitives';

// Firebase
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/collections';

interface Order {
    id: string;
    orderNumber: string;
    source: 'BeFast Market' | 'BeFast Delivery';
    status: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    businessName: string;
    businessAddress: string;
    driverName?: string;
    driverPhone?: string;
    deliveryFee: number;
    tip: number;
    totalAmount: number;
    paymentMethod: 'CASH' | 'CARD';
    assignedAt?: any;
    pickedUpAt?: any;
    deliveredAt?: any;
    completedAt?: any;
    createdAt: any;
    shipdayOrderId?: string;
    shipdayStatus?: string;
    lastShipdaySync?: any;
    items?: any[];
    timeline?: {
        placementTime?: string;
        assignedTime?: string;
        pickedupTime?: string;
        deliveryTime?: string;
    };
}

export default function ShipdayMonitorPage() {
    const [marketOrders, setMarketOrders] = useState<Order[]>([]);
    const [deliveryOrders, setDeliveryOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadShipdayOrders = async () => {
            try {
                console.log('🔄 Cargando pedidos desde Shipday API...');
                
                // Llamar a la API de Shipday directamente
                const response = await fetch('/api/shipday/orders');
                const data = await response.json();
                
                console.log('📊 Respuesta de Shipday API:', data);
                
                // La respuesta puede ser un array o un objeto con array
                const shipdayOrders = Array.isArray(data) ? data : (data.orders || []);
                
                console.log('📊 Pedidos de Shipday:', shipdayOrders.length);
                
                const marketOrders: Order[] = [];
                const deliveryOrders: Order[] = [];
                
                if (shipdayOrders.length === 0) {
                    console.log('⚠️ No hay pedidos en Shipday');
                }
                
                shipdayOrders.forEach((shipdayOrder: any) => {
                    console.log('🔍 Procesando pedido:', {
                        orderNumber: shipdayOrder.orderNumber,
                        customer: shipdayOrder.customer?.name,
                        status: shipdayOrder.orderStatus?.orderState
                    });
                    
                    const order: Order = {
                        id: shipdayOrder.orderId?.toString() || 'unknown',
                        orderNumber: shipdayOrder.orderNumber || `#${shipdayOrder.orderId}`,
                        source: 'BeFast Delivery', // Se determinará abajo
                        status: shipdayOrder.orderStatus?.orderState || 'PENDING',
                        customerName: shipdayOrder.customer?.name || 'Cliente',
                        customerPhone: shipdayOrder.customer?.phoneNumber || '',
                        customerAddress: shipdayOrder.customer?.address || '',
                        businessName: shipdayOrder.restaurant?.name || 'Negocio',
                        businessAddress: shipdayOrder.restaurant?.address || '',
                        driverName: shipdayOrder.assignedCarrier?.name || '',
                        driverPhone: shipdayOrder.assignedCarrier?.phoneNumber || '',
                        deliveryFee: shipdayOrder.costing?.deliveryFee || 0,
                        tip: shipdayOrder.costing?.tip || 0,
                        totalAmount: shipdayOrder.costing?.totalCost || 0,
                        paymentMethod: shipdayOrder.paymentMethod === 'cash' ? 'CASH' : 'CARD',
                        assignedAt: shipdayOrder.activityLog?.assignedTime ? new Date(shipdayOrder.activityLog.assignedTime) : null,
                        pickedUpAt: shipdayOrder.activityLog?.pickedUpTime ? new Date(shipdayOrder.activityLog.pickedUpTime) : null,
                        deliveredAt: shipdayOrder.activityLog?.deliveryTime ? new Date(shipdayOrder.activityLog.deliveryTime) : null,
                        completedAt: shipdayOrder.activityLog?.deliveryTime ? new Date(shipdayOrder.activityLog.deliveryTime) : null,
                        createdAt: shipdayOrder.activityLog?.placementTime ? new Date(shipdayOrder.activityLog.placementTime) : new Date(),
                        shipdayOrderId: shipdayOrder.orderId?.toString(),
                        shipdayStatus: shipdayOrder.orderStatus?.orderState,
                        lastShipdaySync: new Date(),
                        items: shipdayOrder.orderItems || [],
                        timeline: {
                            placementTime: shipdayOrder.activityLog?.placementTime,
                            assignedTime: shipdayOrder.activityLog?.assignedTime,
                            pickedupTime: shipdayOrder.activityLog?.pickedUpTime,
                            deliveryTime: shipdayOrder.activityLog?.deliveryTime
                        }
                    };
                    
                    // Clasificar por tipo según el plan
                    const orderNum = order.orderNumber || '';
                    if (orderNum.startsWith('BF-')) {
                        order.source = 'BeFast Delivery';
                        deliveryOrders.push(order);
                    } else {
                        order.source = 'BeFast Market';
                        marketOrders.push(order);
                    }
                });
                
                console.log('📦 Market orders:', marketOrders.length);
                console.log('🚚 Delivery orders:', deliveryOrders.length);
                
                setMarketOrders(marketOrders);
                setDeliveryOrders(deliveryOrders);
                
            } catch (error) {
                console.error('❌ Error cargando pedidos de Shipday:', error);
                
                // Fallback: intentar cargar desde Firestore
                const allOrdersQuery = query(
                    collection(db, COLLECTIONS.ORDERS),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );

                const unsubscribe = onSnapshot(allOrdersQuery, (snapshot) => {
                    const marketOrders: Order[] = [];
                    const deliveryOrders: Order[] = [];

                    console.log('📊 Fallback - Pedidos en Firestore:', snapshot.size);

                    snapshot.forEach((doc) => {
                        const docData = doc.data();
                        const order: Order = {
                            id: doc.id,
                            orderNumber: docData.orderNumber || docData.shipdayOrderId || `#${doc.id.slice(-6)}`,
                            source: docData.source || 'BeFast Delivery',
                            status: docData.status || 'PENDING',
                            customerName: docData.customer?.name || docData.customerName || 'Cliente',
                            customerPhone: docData.customer?.phone || docData.customerPhone || '',
                            customerAddress: docData.customer?.address || docData.deliveryAddress || '',
                            businessName: docData.pickup?.businessName || docData.businessName || docData.restaurant?.name || 'Negocio',
                            businessAddress: docData.pickup?.address || docData.businessAddress || docData.restaurant?.address || '',
                            driverName: docData.assignedCarrier?.name || docData.driverName || '',
                            driverPhone: docData.assignedCarrier?.phone || docData.driverPhone || '',
                            deliveryFee: docData.deliveryFee || 0,
                            tip: docData.tip || 0,
                            totalAmount: docData.totalAmount || 0,
                            paymentMethod: docData.paymentMethod || 'CASH',
                            assignedAt: docData.assignedAt,
                            pickedUpAt: docData.pickedUpAt,
                            deliveredAt: docData.deliveredAt,
                            completedAt: docData.completedAt,
                            createdAt: docData.createdAt,
                            shipdayOrderId: docData.shipdayOrderId,
                            shipdayStatus: docData.shipdayStatus,
                            lastShipdaySync: docData.lastShipdaySync,
                            items: docData.items || [],
                            timeline: {
                                placementTime: docData.placementTime,
                                assignedTime: docData.assignedTime,
                                pickedupTime: docData.pickedupTime,
                                deliveryTime: docData.deliveryTime
                            }
                        };

                        const orderNum = order.orderNumber || '';
                        if (orderNum.startsWith('BF-')) {
                            order.source = 'BeFast Delivery';
                            deliveryOrders.push(order);
                        } else {
                            order.source = 'BeFast Market';
                            marketOrders.push(order);
                        }
                    });

                    setMarketOrders(marketOrders);
                    setDeliveryOrders(deliveryOrders);
                });
            }
            
            setLoading(false);
        };

        loadShipdayOrders();
    }, []);

    const setupRealtimeListener = (source: string, setOrders: (orders: Order[]) => void) => {
        const ordersQuery = query(
            collection(db, COLLECTIONS.ORDERS),
            where('source', '==', source),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        return onSnapshot(ordersQuery, (snapshot) => {
            const orders: Order[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();

                orders.push({
                    id: doc.id,
                    orderNumber: data.orderNumber || data.shipdayOrderId || `#${doc.id.slice(-6)}`,
                    source: data.source,
                    status: data.status || 'PENDING',
                    customerName: data.customer?.name || data.customerName || 'Cliente',
                    customerPhone: data.customer?.phone || data.customerPhone || '',
                    customerAddress: data.customer?.address || data.deliveryAddress || '',
                    businessName: data.pickup?.businessName || data.businessName || data.restaurant?.name || 'Negocio',
                    businessAddress: data.pickup?.address || data.businessAddress || data.restaurant?.address || '',
                    driverName: data.assignedCarrier?.name || data.driverName || '',
                    driverPhone: data.assignedCarrier?.phone || data.driverPhone || '',
                    deliveryFee: data.deliveryFee || 0,
                    tip: data.tip || 0,
                    totalAmount: data.totalAmount || 0,
                    paymentMethod: data.paymentMethod || 'CASH',
                    assignedAt: data.assignedAt,
                    pickedUpAt: data.pickedUpAt,
                    deliveredAt: data.deliveredAt,
                    completedAt: data.completedAt,
                    createdAt: data.createdAt,
                    shipdayOrderId: data.shipdayOrderId,
                    shipdayStatus: data.shipdayStatus,
                    lastShipdaySync: data.lastShipdaySync,
                    items: data.items || [],
                    timeline: {
                        placementTime: data.placementTime,
                        assignedTime: data.assignedTime,
                        pickedupTime: data.pickedupTime,
                        deliveryTime: data.deliveryTime
                    }
                });
            });

            setOrders(orders);
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
            'PENDING': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
            'ASSIGNED': { label: 'Asignado', color: 'bg-blue-100 text-blue-800' },
            'PICKED_UP': { label: 'Recogido', color: 'bg-purple-100 text-purple-800' },
            'DELIVERED': { label: 'Entregado', color: 'bg-green-100 text-green-800' },
            'COMPLETED': { label: 'Completado', color: 'bg-green-100 text-green-800' },
            'CANCELLED': { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
        };

        const config = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
        return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return 'N/A';

        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'N/A';
        }
    };



    const OrdersTable = ({ orders, title }: { orders: Order[], title: string }) => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {title === 'Market' ? <Store /> : <Package />}
                    {title} ({orders.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Vista móvil - Cards */}
                <div className="block md:hidden space-y-3">
                    {orders.slice(0, 10).map((order) => (
                        <div key={order.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{order.orderNumber}</p>
                                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                                </div>
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>{order.driverName || 'Sin asignar'}</span>
                                <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatTime(order.createdAt)}</p>
                        </div>
                    ))}
                </div>

                {/* Vista desktop - Tabla */}
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pedido</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Repartidor</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.slice(0, 15).map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                    <TableCell>{order.customerName}</TableCell>
                                    <TableCell>{order.driverName || 'Sin asignar'}</TableCell>
                                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                                    <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                                    <TableCell>{formatTime(order.createdAt)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );

    // Filtrar pedidos por búsqueda
    const filteredMarketOrders = marketOrders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.businessName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDeliveryOrders = deliveryOrders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.businessName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 text-center">Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Encabezado sin título (delegado al header global) */}
            <Section>
                <PageToolbar
                    left={
                        <div className="flex items-center gap-3 w-full min-w-0">
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por pedido, cliente o negocio..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full min-w-0"
                                />
                            </div>
                        </div>
                    }
                    right={
                        <Button className="border border-gray-300 bg-white text-gray-900 hover:bg-gray-50">
                            <RefreshCw />
                            Actualizar
                        </Button>
                    }
                />
            </Section>

            {/* Contenido responsivo */}
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                <OrdersTable orders={filteredMarketOrders} title="Market" />
                <OrdersTable orders={filteredDeliveryOrders} title="Delivery" />
            </div>
        </div>
    );
}