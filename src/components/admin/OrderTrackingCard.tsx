'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Truck, 
  Package,
  Navigation,
  Timer,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { EtaData, OrderStatus, CarrierLocation, DetailEta } from '@/lib/services/shipdayService';

interface OrderTrackingCardProps {
  trackingId: string;
  etaData: EtaData;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function OrderTrackingCard({ trackingId, etaData, onRefresh, isLoading }: OrderTrackingCardProps) {
  const { fixedData, dynamicData } = etaData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PICKED_UP':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_TRANSIT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ASSIGNED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PICKED_UP':
        return <Package className="w-4 h-4" />;
      case 'IN_TRANSIT':
        return <Truck className="w-4 h-4" />;
      case 'ASSIGNED':
        return <User className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleString('es-MX');
  };

  const formatETA = (etaMinutes: string) => {
    if (etaMinutes === 'INF' || etaMinutes === '-1') return 'No disponible';
    const minutes = parseInt(etaMinutes);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Seguimiento de Pedido #{fixedData?.order.orderNumber || trackingId}
          </CardTitle>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Actualizar'
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estado Actual */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(dynamicData.orderStatus.status)}
            <div>
              <h3 className="font-semibold text-lg">Estado Actual</h3>
              <Badge className={`${getStatusColor(dynamicData.orderStatus.status)} gap-1`}>
                {dynamicData.orderStatus.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Timer className="w-4 h-4" />
              <span>ETA: {formatETA(dynamicData.estimatedTimeInMinutes)}</span>
            </div>
          </div>
        </div>

        {/* Información del Cliente y Restaurante */}
        {fixedData && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{fixedData.customer.name}</p>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{fixedData.customer.address}</span>
                </div>
                <div className="text-xs text-gray-500">
                  📍 {fixedData.customer.latitude.toFixed(6)}, {fixedData.customer.longitude.toFixed(6)}
                </div>
              </CardContent>
            </Card>

            {/* Restaurante */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Restaurante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{fixedData.restaurant.name}</p>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{fixedData.restaurant.address}</span>
                </div>
                <div className="text-xs text-gray-500">
                  📍 {fixedData.restaurant.latitude.toFixed(6)}, {fixedData.restaurant.longitude.toFixed(6)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Información del Repartidor */}
        {fixedData?.carrier && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Repartidor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{fixedData.carrier.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{fixedData.carrier.phoneNumber}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">ID: {fixedData.carrier.id}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ubicación Actual del Repartidor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Ubicación Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coordenadas actuales</p>
                <p className="font-mono text-sm">
                  {dynamicData.carrierLocation.latitude.toFixed(6)}, {dynamicData.carrierLocation.longitude.toFixed(6)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Última actualización</p>
                <p className="text-xs">{new Date().toLocaleTimeString('es-MX')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline de Actividades */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline de Actividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dynamicData.orderStatus.startTime && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Inicio de entrega</p>
                    <p className="text-xs text-gray-500">{formatTime(dynamicData.orderStatus.startTime)}</p>
                  </div>
                </div>
              )}
              
              {dynamicData.orderStatus.pickedTime && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Pedido recogido</p>
                    <p className="text-xs text-gray-500">{formatTime(dynamicData.orderStatus.pickedTime)}</p>
                  </div>
                </div>
              )}
              
              {dynamicData.orderStatus.arrivedTime && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Llegó al destino</p>
                    <p className="text-xs text-gray-500">{formatTime(dynamicData.orderStatus.arrivedTime)}</p>
                  </div>
                </div>
              )}
              
              {dynamicData.orderStatus.deliveryTime && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Entregado</p>
                    <p className="text-xs text-gray-500">{formatTime(dynamicData.orderStatus.deliveryTime)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detalles del ETA */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Detalles del ETA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {dynamicData.detailEta.estimatedTimeInMinutes > 0 ? dynamicData.detailEta.estimatedTimeInMinutes : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Minutos totales</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {dynamicData.detailEta.pickUpTime.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">Tiempo recogida</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {dynamicData.detailEta.travelDistance.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">Distancia (m)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {dynamicData.detailEta.travelDistanceTime.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">Tiempo viaje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
