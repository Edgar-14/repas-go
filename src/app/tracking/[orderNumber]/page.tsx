'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import {
  MapPin,
  Clock,
  User,
  Package,
  Star,
  Phone,
  MessageCircle,
  Navigation,
  Truck,
  Home,
  CheckCircle,
  XCircle,
  Store,
} from 'lucide-react';

interface TrackingData {
  orderNumber: string;
  status: string;
  customer: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phoneNumber?: string;
  };
  business: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  driver?: {
    name: string;
    phoneNumber?: string;
    latitude?: number;
    longitude?: number;
    photo?: string;
    rating?: number;
  };
  driverLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedTime?: number;
  orderItems: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  deliveryFee?: number;
  totalCost: number;
  placementTime: string;
  deliveryTime?: string;
  proofOfDelivery?: string[];
  timeline: Array<{
    status: string;
    timestamp: string;
    description: string;
  }>;
}

export default function TrackingPage() {
  const params = useParams();
  const orderNumber = params?.orderNumber as string;
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['geometry', 'places']
  });

  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (isLoaded && !directionsService && window.google?.maps) {
      setDirectionsService(new window.google.maps.DirectionsService());
      setDirectionsRenderer(new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#f97316',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      }));
    }
  }, [isLoaded, directionsService]);

  useEffect(() => {
    if (directionsRenderer && map) {
      directionsRenderer.setMap(map);
    }
  }, [directionsRenderer, map]);

  useEffect(() => {
    if (directionsService && directionsRenderer && trackingData?.driverLocation && trackingData?.customer && window.google?.maps) {
      directionsService.route({
        origin: { lat: trackingData.driverLocation.latitude, lng: trackingData.driverLocation.longitude },
        destination: { lat: trackingData.customer.latitude, lng: trackingData.customer.longitude },
        travelMode: 'DRIVING' as any,
        avoidTolls: true
      }, (result: any, status: string) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
        }
      });
    }
  }, [directionsService, directionsRenderer, trackingData?.driverLocation, trackingData?.customer]);

  useEffect(() => {
    const fetchTrackingData = async () => {
      // Si no hay orderNumber, no hacemos fetch
      if (!orderNumber) {
        setLoading(false);
        setError('No se proporcionó un número de pedido.');
        return;
      }
      try {
        const response = await fetch(`/api/tracking/${orderNumber}`);
        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.error || 'Pedido no encontrado');
        }
        
        const data = await response.json();
        setTrackingData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el tracking');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
    // Solo configurar el intervalo si hay un orderNumber
    if (orderNumber) {
      const interval = setInterval(fetchTrackingData, 30000);
      return () => clearInterval(interval);
    }
  }, [orderNumber]);

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'CREATED': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-gray-100 text-gray-800',
      'NOT_ASSIGNED': 'bg-gray-100 text-gray-800',
      'NOT_ACCEPTED': 'bg-gray-100 text-gray-800',
      'ACTIVE': 'bg-blue-100 text-blue-800',
      'ASSIGNED': 'bg-blue-100 text-blue-800',
      'STARTED': 'bg-yellow-100 text-yellow-800',
      'PICKED_UP': 'bg-orange-100 text-orange-800',
      'READY_TO_DELIVER': 'bg-orange-100 text-orange-800',
      'ALREADY_DELIVERED': 'bg-green-100 text-green-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'FAILED_DELIVERY': 'bg-red-100 text-red-800',
      'INCOMPLETE': 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'NOT_ASSIGNED': 'Buscando Repartidor',
      'NOT_ACCEPTED': 'Esperando Confirmación',
      'ACTIVE': 'Repartidor Asignado',
      'ASSIGNED': 'Repartidor Asignado',
      'STARTED': 'En Camino a Recoger',
      'PICKED_UP': 'Pedido Recogido',
      'READY_TO_DELIVER': 'En Camino a Entregar',
      'ALREADY_DELIVERED': 'Entregado',
      'DELIVERED': 'Entregado',
      'FAILED_DELIVERY': 'Entrega Fallida',
      'INCOMPLETE': 'Pedido Incompleto',
      'CREATED': 'Pedido Creado',
      'PENDING': 'Pedido Pendiente',
    };
    return statusMap[status] || status;
  };

  const getStatusProgress = (status: string): number => {
    const progressMap: Record<string, number> = {
      'CREATED': 5,
      'PENDING': 10,
      'NOT_ASSIGNED': 15,
      'NOT_ACCEPTED': 20,
      'ACTIVE': 30,
      'ASSIGNED': 30,
      'STARTED': 50,
      'PICKED_UP': 75,
      'READY_TO_DELIVER': 90,
      'ALREADY_DELIVERED': 100,
      'DELIVERED': 100,
    };
    return progressMap[status] || 0;
  };

  const getTimelineIcon = (status: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'NOT_ASSIGNED': <Package className="w-5 h-5 text-white" />,
      'NOT_ACCEPTED': <Package className="w-5 h-5 text-white" />,
      'ACTIVE': <User className="w-5 h-5 text-white" />,
      'STARTED': <Navigation className="w-5 h-5 text-white" />,
      'PICKED_UP': <Truck className="w-5 h-5 text-white" />,
      'READY_TO_DELIVER': <Truck className="w-5 h-5 text-white" />,
      'ALREADY_DELIVERED': <CheckCircle className="w-5 h-5 text-white" />,
      'FAILED_DELIVERY': <XCircle className="w-5 h-5 text-white" />,
      'INCOMPLETE': <XCircle className="w-5 h-5 text-white" />,
    };
    
    const statusKey = status.toUpperCase();
    
    if (iconMap[statusKey]) return iconMap[statusKey];
    if (statusKey.includes('ENTREGADO')) return iconMap['ALREADY_DELIVERED'];
    if (statusKey.includes('RECOGIDO')) return iconMap['PICKED_UP'];
    if (statusKey.includes('ASIGNADO')) return iconMap['ACTIVE'];
    
    return <Clock className="w-5 h-5 text-white" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-semibold text-gray-900">Buscando tu pedido...</h2>
          <p className="text-gray-600">Esto tomará solo un segundo.</p>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar el pedido</h2>
            <p className="text-gray-600">
              {error || 'No pudimos encontrar los detalles de este pedido.'}
            </p>
            <Button className="mt-6 bg-orange-600 hover:bg-orange-700" onClick={() => window.location.href = '/'}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get map bounds to fit all markers
  const getMapBounds = () => {
    if (!trackingData) return null;
    
    const points = [
      { lat: trackingData.business.latitude, lng: trackingData.business.longitude },
      { lat: trackingData.customer.latitude, lng: trackingData.customer.longitude },
    ];
    
    // Add driver location if available
    if (trackingData.driverLocation) {
      points.push({
        lat: trackingData.driverLocation.latitude,
        lng: trackingData.driverLocation.longitude,
      });
    }
    
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    
    return {
      center: {
        lat: (Math.max(...lats) + Math.min(...lats)) / 2,
        lng: (Math.max(...lngs) + Math.min(...lngs)) / 2,
      },
      zoom: 12,
    };
  };

  const mapBounds = getMapBounds();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">BeFast Tracking</h1>
              <p className="text-sm text-gray-600">Pedido #{trackingData?.orderNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card - Simplified */}
        <Card className="bg-white shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <Badge className={`${getStatusColor(trackingData.status)} text-base px-4 py-2 rounded-full font-semibold`}>
                  {getStatusText(trackingData.status)}
                </Badge>
                <p className="text-sm text-gray-600">
                  {new Date(trackingData.placementTime).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${getStatusProgress(trackingData.status)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Pedido creado</span>
                  <span>En camino</span>
                  <span>Entregado</span>
                </div>
              </div>

              {/* ETA */}
              {trackingData.estimatedTime && trackingData.status !== 'ALREADY_DELIVERED' && (
                <div className="flex items-center justify-center gap-2 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <Clock className="w-6 h-6 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-700 font-medium">Tiempo estimado</p>
                    <p className="text-2xl font-bold text-orange-600">{trackingData.estimatedTime} min</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Tracking Map */}
        <Card className="bg-white shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[400px] relative">
              {mapBounds && isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: mapBounds.center.lat, lng: mapBounds.center.lng }}
                  zoom={mapBounds.zoom}
                  options={{ disableDefaultUI: true, zoomControl: true }}
                  onLoad={(mapInstance) => setMap(mapInstance)}
                >
                  <MarkerF
                    position={{ lat: trackingData.business.latitude, lng: trackingData.business.longitude }}
                    label="N"
                  />
                  <MarkerF
                    position={{ lat: trackingData.customer.latitude, lng: trackingData.customer.longitude }}
                    label="C"
                  />
                  {trackingData.driverLocation && (
                    <MarkerF
                      position={{ lat: trackingData.driverLocation.latitude, lng: trackingData.driverLocation.longitude }}
                      label="🚚"
                    />
                  )}
                </GoogleMap>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Cargando mapa...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Map Legend */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="bg-green-500 rounded-full p-1.5">
                    <Store className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700">{trackingData.business.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500 rounded-full p-1.5">
                    <Home className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700">{trackingData.customer.name}</span>
                </div>
                {trackingData.driverLocation && (
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-500 rounded-full p-1.5 animate-pulse">
                      <Truck className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700">Repartidor (en vivo)</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Driver & Delivery Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver Card */}
          <Card className="bg-white shadow-lg lg:col-span-1">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4 uppercase tracking-wide">Repartidor</h3>
              {trackingData.driver ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-orange-200 flex-shrink-0">
                      {trackingData.driver.photo ? (
                        <img src={trackingData.driver.photo} alt={trackingData.driver.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-7 h-7 text-orange-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{trackingData.driver.name}</h4>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">{Number(trackingData.driver.rating || 5.0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {trackingData.driver.phoneNumber && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-xs"
                        onClick={() => window.open(`tel:${trackingData.driver?.phoneNumber}`, '_self')}
                      >
                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                        Llamar
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                        onClick={() => window.open(`https://wa.me/${trackingData.driver?.phoneNumber?.replace(/\D/g, '') || ''}`, '_blank')}
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                        WhatsApp
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Buscando repartidor</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Addresses */}
          <Card className="bg-white shadow-lg lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4 uppercase tracking-wide">Detalles de Entrega</h3>
              <div className="space-y-4">
                {/* Pickup */}
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-green-700 uppercase">Recogida</p>
                    <p className="font-medium text-gray-900 mt-0.5">{trackingData.business.name}</p>
                    <p className="text-sm text-gray-600 truncate">{trackingData.business.address}</p>
                  </div>
                </div>
                
                {/* Delivery */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
                    <Home className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-blue-700 uppercase">Entrega</p>
                    <p className="font-medium text-gray-900 mt-0.5">{trackingData.customer.name}</p>
                    <p className="text-sm text-gray-600 truncate">{trackingData.customer.address}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-4 uppercase tracking-wide">Resumen del Pedido</h3>
            <div className="space-y-2">
              {trackingData.orderItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-orange-600 font-semibold bg-orange-100 rounded px-2 py-0.5 text-xs flex-shrink-0">{item.quantity}x</span>
                    <span className="text-gray-900 text-sm truncate">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm ml-2 flex-shrink-0">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                </div>
              ))}
              
              {trackingData.deliveryFee && (
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-medium text-gray-900">
                    ${trackingData.deliveryFee.toFixed(2)}
                  </span>
                </div>
              )}
              
              <div className="border-t-2 pt-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-orange-600 text-xl">${trackingData.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Prueba de Entrega */}
        {trackingData.proofOfDelivery && trackingData.proofOfDelivery.length > 0 && (
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prueba de Entrega</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trackingData.proofOfDelivery.map((image, index) => (
                  <a href={image} target="_blank" rel="noopener noreferrer" key={index}>
                    <img 
                      src={image} 
                      alt={`Prueba de entrega ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-100 hover:border-orange-500 transition-all cursor-pointer"
                    />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <p className="text-gray-600">
            ¿Necesitas ayuda? Contáctanos por{' '}
            <a href="https://wa.me/5213121905494" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-medium hover:underline">
              WhatsApp
            </a>
            {' '}o{' '}
            <a href="mailto:soporte@befastapp.com.mx" className="text-orange-600 font-medium hover:underline">
              email
            </a>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            BeFast © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}