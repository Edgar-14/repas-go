'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { AddressAutocompleteInput } from '@/components/address-autocomplete-input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessData } from '@/hooks/useRealtimeData';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { doc, getDocs, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import {
  MapPin, Phone, User, Loader2, Building, DollarSign, Clock, BookmarkPlus
} from 'lucide-react';

const formSchema = z.object({
  customerName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  customerPhone: z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos.'),
  deliveryAddress: z.string().min(10, 'La dirección debe ser más específica.'),
  paymentAmount: z.number().min(0.01, 'El monto debe ser mayor a $0.'),
  instructions: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
type SavedAddress = { id: string; address: string; label?: string; coordinates: { lat: number; lng: number }; createdAt: number; };
type LastOrder = { customerName: string; customerPhone: string; deliveryAddress: string; coordinates: { lat: number; lng: number }; paymentAmount: number; instructions?: string; createdAt: number; };

const calcularCostoEnvio = (km: number) => {
  const base = 45;
  const extraPorKm = 2.5;
  const limiteBaseKm = 3;
  let subtotal = base;
  if (km > limiteBaseKm) {
    // CORREGIDO: Usar distancia exacta sin redondear (como hace Shipday)
    subtotal += (km - limiteBaseKm) * extraPorKm;
  }
  // CORREGIDO: Redondear al centavo más cercano como hace Shipday
  return Math.round(subtotal * 100) / 100;
};

function useLastOrders() {
  const [orders, setOrders] = useState<LastOrder[]>([]);
  useEffect(() => {
    const storedItems = localStorage.getItem('befast_last_orders');
    const stored: LastOrder[] = storedItems ? JSON.parse(storedItems) : [];
    setOrders(stored.slice(0, 5));
  }, []);
  const addOrder = (order: LastOrder) => {
    const storedItems = localStorage.getItem('befast_last_orders');
    const stored: LastOrder[] = storedItems ? JSON.parse(storedItems) : [];
    const updated = [order, ...stored].slice(0, 5);
    localStorage.setItem('befast_last_orders', JSON.stringify(updated));
    setOrders(updated);
  };
  return { orders, addOrder };
}

const mapContainerStyle = { width: '100%', height: '100%', minHeight: '400px', borderRadius: '0.75rem' };
const mapLibraries: "places"[] = ['places'];

function MapDisplay({ pickupCoords, deliveryCoords }: { pickupCoords: any, deliveryCoords: any }) {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!map) return;
    if (pickupCoords && deliveryCoords) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: pickupCoords.lat, lng: pickupCoords.lng });
      bounds.extend({ lat: deliveryCoords.lat, lng: deliveryCoords.lng });
      map.fitBounds(bounds);
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 16) map.setZoom(16);
        window.google.maps.event.removeListener(listener);
      });
    } else if (pickupCoords) {
      map.panTo({ lat: pickupCoords.lat, lng: pickupCoords.lng });
      map.setZoom(15);
    }
  }, [map, pickupCoords, deliveryCoords]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={pickupCoords}
      zoom={15}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{ disableDefaultUI: true, zoomControl: true, streetViewControl: false }}
    >
      {pickupCoords && <MarkerF position={pickupCoords} label="R" title="Recogida" />}
      {deliveryCoords && <MarkerF position={deliveryCoords} label="E" title="Entrega" />}
    </GoogleMap>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { business: businessData, loading: businessLoading } = useBusinessData(user?.uid || null);

  const [isLoading, setIsLoading] = useState(false);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<{ distanceKm: number; deliveryFee: number; total: number; eta: string }>({ distanceKm: 0, deliveryFee: 0, total: 0, eta: '' });

  const { orders: lastOrders, addOrder } = useLastOrders();

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: mapLibraries,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '', customerPhone: '', deliveryAddress: '', paymentAmount: undefined, instructions: '',
    }
  });

  useEffect(() => {
    if (!user) {
      router.push('/delivery/login');
      return;
    }
    if (!businessLoading && businessData) {
      if ((businessData.availableCredits ?? businessData.credits ?? 0) < 1) {
        toast({ variant: 'destructive', title: 'Sin créditos', description: 'Compra más créditos para crear pedidos.' });
        router.push('/delivery/billing');
      } else if (businessData.status !== 'ACTIVE') {
        toast({ variant: 'destructive', title: 'Cuenta no activa', description: 'Tu cuenta debe estar activa para crear pedidos.' });
        router.push('/delivery/dashboard');
      }
    } else if (!businessLoading && !businessData) {
      toast({ variant: 'destructive', title: 'Perfil no encontrado', description: 'Por favor completa tu registro.' });
      router.push('/delivery/signup');
    }
  }, [user, businessData, businessLoading, router, toast]);

  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!user) return;
      const addressesRef = collection(db, 'businesses', user.uid, 'savedAddresses');
      const snapshot = await getDocs(addressesRef);
      const addresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedAddress)).sort((a, b) => b.createdAt - a.createdAt);
      setSavedAddresses(addresses);
    };
    loadSavedAddresses();
  }, [user]);

  const handlePlaceSelected = (place: any) => {
    if (place?.formatted_address && place?.geometry?.location) {
      form.setValue('deliveryAddress', place.formatted_address, { shouldValidate: true });
      setDeliveryCoords({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
    }
  };

  const handleLoadLastOrder = (order: LastOrder) => {
    form.reset(order);
    setDeliveryCoords(order.coordinates);
    toast({ title: 'Datos cargados', description: 'Se ha cargado la información del pedido anterior.' });
  };

  const handleSelectSavedAddress = (address: SavedAddress) => {
    form.setValue('deliveryAddress', address.address, { shouldValidate: true });
    setDeliveryCoords(address.coordinates);
    toast({ title: 'Dirección cargada', description: 'Se ha seleccionado una dirección guardada.' });
  };

  const handleSendWhatsApp = async () => {
    if (!orderResult || !orderResult.customerData || !businessData) return;

    const customerPhone = orderResult.customerData.customerPhone;
    const customerName = orderResult.customerData.customerName;
    const deliveryFee = orderResult.deliveryFee;
    const businessName = businessData.businessName;
    const orderNumber = orderResult.shipdayOrderNumber;

    setIsLoading(true);

    try {
      // 1. PRIMERO intentar con tu backend/API personal
      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerPhone: customerPhone.replace(/\D/g, ''), // Limpiar número
          customerName,
          businessName,
          shippingCost: deliveryFee,
          orderNumber,
          totalAmount: orderResult.total
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ WhatsApp Enviado',
          description: 'El mensaje de confirmación se ha enviado exitosamente al cliente.'
        });
        // Auto-cerrar el modal después de 2 segundos
        setTimeout(() => {
          handleCloseSuccessModal();
        }, 2000);
        return;
      }

      // 2. SEGUNDO intento: Cloud Function (tu enfoque actual)
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const sendWhatsAppConfirmation = httpsCallable(functions, 'sendWhatsAppConfirmation');

        await sendWhatsAppConfirmation({
          customerPhone: customerPhone.replace(/\D/g, ''),
          customerName,
          businessName,
          shippingCost: deliveryFee,
          orderNumber
        });

        toast({
          title: '✅ WhatsApp Enviado',
          description: 'El mensaje de confirmación se ha enviado exitosamente al cliente.'
        });

        // Auto-cerrar el modal después de 2 segundos
        setTimeout(() => {
          handleCloseSuccessModal();
        }, 2000);

      } catch (firebaseError) {
        console.error('Error con Cloud Function:', firebaseError);

        // 3. TERCER intento: API directa de WhatsApp Business
        await enviarWhatsAppBusinessAPI(customerPhone, customerName, businessName, deliveryFee, orderNumber);
      }

    } catch (error) {
      console.error('Todos los métodos fallaron:', error);
      toast({
        variant: 'destructive',
        title: 'Error en envío automático',
        description: 'No se pudo enviar el mensaje automáticamente. Por favor contacta al cliente manualmente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para enviar directamente via WhatsApp Business API
  const enviarWhatsAppBusinessAPI = async (customerPhone: string, customerName: string, businessName: string, deliveryFee: number, orderNumber: string) => {
    try {
      // Aquí va tu lógica directa con la WhatsApp Business API
      // Necesitas: ACCESS_TOKEN, PHONE_NUMBER_ID, etc.

      const response = await fetch(`/api/whatsapp-business/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: customerPhone.replace(/\D/g, ''),
          message: generarMensajeWhatsApp(customerName, businessName, deliveryFee, orderNumber)
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ WhatsApp Enviado vía API',
          description: 'Mensaje enviado directamente por WhatsApp Business API.'
        });
      } else {
        throw new Error('API directa falló');
      }
    } catch (error) {
      throw error; // Propagar el error
    }
  };

  // Función para generar el mensaje
  const generarMensajeWhatsApp = (customerName: string, businessName: string, deliveryFee: number, orderNumber: string) => {
    return `Hola ${customerName} 👋

Tu pedido de *${businessName}* ha sido confirmado.

📦 *Orden #${orderNumber}*
💰 Costo de envío: ${deliveryFee.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}

En unos momentos te enviaremos tu link de seguimiento.

¡Gracias por tu preferencia!`;
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setOrderResult(null);
    form.reset();
    setDeliveryCoords(null);
  };

  const handleCreateOrder = async () => {
    setIsLoading(true);
    try {
      const data = form.getValues();
      if (!businessData || !deliveryCoords) throw new Error("Faltan datos del negocio o coordenadas.");

      const response = await fetch('/api/shipday/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessData.uid,
          customer: { name: data.customerName, phoneNumber: data.customerPhone, address: data.deliveryAddress, latitude: deliveryCoords.lat, longitude: deliveryCoords.lng },
          restaurant: { name: businessData.businessName, phoneNumber: businessData.phone || '', address: businessData.address, latitude: businessData.coordinates?.lat || 0, longitude: businessData.coordinates?.lng || 0 },
          deliveryInstructions: data.instructions || '',
          paymentMethod: 'EFECTIVO',
          totalCost: data.paymentAmount, // Este es el subtotal
          deliveryFee: previewData.deliveryFee, // Tarifa calculada en frontend
          distanceKm: previewData.distanceKm, // Distancia calculada en frontend
          isImmediate: true,
          orderItems: [{ name: 'Pedido de entrega', quantity: 1, unitPrice: data.paymentAmount }],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Error desconocido en el servidor.' }));
        throw new Error(errorBody.details || errorBody.error);
      }

      const result = await response.json();
      toast({ title: '🚀 Pedido Creado', description: `Orden #${result.orderNumber || result.shipdayOrderNumber} enviada. Créditos restantes: ${result.creditsRemaining}` });
      addOrder({ ...data, coordinates: deliveryCoords, createdAt: Date.now() });

      // Guardar datos del pedido para el modal de éxito
      setOrderResult({
        ...result,
        customerData: data,
        deliveryFee: previewData.deliveryFee,
        total: previewData.total,
        shipdayOrderNumber: result.orderNumber || result.shipdayOrderNumber // Asegurarnos de tener el número
      });

      setIsConfirmOpen(false);
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al crear pedido', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const onPreview = async (data: FormData) => {
    if (!businessData || !deliveryCoords) {
      toast({ variant: 'destructive', title: 'Dirección incompleta', description: 'Selecciona una dirección válida del autocompletado.' });
      return;
    }

    setIsLoading(true);
    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      const results = await new Promise<any>((resolve, reject) => {
        directionsService.route({
          origin: businessData.coordinates as google.maps.LatLngLiteral,
          destination: deliveryCoords as google.maps.LatLngLiteral,
          travelMode: 'DRIVING' as google.maps.TravelMode,
        }, (result, status) => {
          if (status === 'OK' && result) {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      const distanceInMeters = results.routes[0]?.legs[0]?.distance?.value;
      if (typeof distanceInMeters !== 'number') {
        throw new Error("No se pudo calcular la distancia de la ruta.");
      }

      const distanceInKm = distanceInMeters / 1000;
      const deliveryFee = calcularCostoEnvio(distanceInKm);
      const total = data.paymentAmount + deliveryFee;

      setPreviewData({ distanceKm: distanceInKm, deliveryFee, total, eta: '' });
      setIsConfirmOpen(true);

    } catch (error) {
      toast({ variant: "destructive", title: "Error de Ruta", description: "No se pudo calcular la ruta a la dirección de destino. Intenta con otra dirección." });
      console.error("Directions service error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (businessLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-blue-200/20">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-blue-800">
                <Building className="h-6 w-6" />
                Información de Recogida
              </CardTitle>
              <div className="flex items-center gap-2 bg-white/60 rounded-full px-3 py-1.5 shadow-sm border border-blue-100">
                <DollarSign className="h-4 w-4 text-orange-600" />
                <div className="text-sm">
                  <span className="text-gray-600">Créditos:</span>
                  <span className="font-bold text-orange-600"> {businessData?.availableCredits ?? businessData?.credits ?? 0}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-blue-700">Negocio</Label>
                  <p className="text-base text-blue-900 break-words pt-1">{businessData?.businessName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-blue-700">Teléfono</Label>
                  <p className="text-base text-blue-900 pt-1">{businessData?.phone}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-blue-700">Dirección</Label>
                <p className="text-base text-blue-900 break-words pt-1">{businessData?.address}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <MapPin className="h-6 w-6 text-orange-600" />
                Información de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onPreview)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nombre del cliente </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input id="customerName" {...form.register('customerName')} className="pl-10" placeholder="Nombre completo" />
                    </div>
                    {form.formState.errors.customerName && <p className="text-sm text-red-600">{form.formState.errors.customerName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Teléfono </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input id="customerPhone" {...form.register('customerPhone')} className="pl-10" placeholder="3312345678" type="tel" />
                    </div>
                    {form.formState.errors.customerPhone && <p className="text-sm text-red-600">{form.formState.errors.customerPhone.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Dirección de entrega </Label>
                  <div className="relative">
                    <AddressAutocompleteInput id="deliveryAddress" placeholder="Escribe para buscar la dirección..." onPlaceSelected={handlePlaceSelected} value={form.watch('deliveryAddress')} onValueChange={(value) => form.setValue('deliveryAddress', value, { shouldValidate: true })} className="pl-10" disabled={!isMapLoaded} />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  {form.formState.errors.deliveryAddress && <p className="text-sm text-red-600">{form.formState.errors.deliveryAddress.message}</p>}
                  {deliveryCoords && <p className="text-xs text-green-600 mt-1">✓ Coordenadas obtenidas</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {lastOrders.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm"><Clock className="h-4 w-4 mr-2" /> Cargar Reciente</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {lastOrders.map((order) => (<DropdownMenuItem key={order.createdAt} onClick={() => handleLoadLastOrder(order)} className="cursor-pointer"><div><p className="font-medium">{order.customerName}</p><p className="text-xs text-gray-500 truncate">{order.deliveryAddress}</p></div></DropdownMenuItem>))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {savedAddresses.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm"><BookmarkPlus className="h-4 w-4 mr-2" /> Cargar Guardada</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {savedAddresses.map((address) => (<DropdownMenuItem key={address.id} onClick={() => handleSelectSavedAddress(address)} className="cursor-pointer"><div><p className="font-medium">{address.label}</p><p className="text-xs text-gray-500 truncate">{address.address}</p></div></DropdownMenuItem>))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Monto a pagar </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="paymentAmount" type="number" step="0.01" {...form.register('paymentAmount', { valueAsNumber: true })} className="pl-10" placeholder="0.00" />
                  </div>
                  {form.formState.errors.paymentAmount && <p className="text-sm text-red-600">{form.formState.errors.paymentAmount.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instrucciones especiales (opcional)</Label>
                  <Textarea id="instructions" {...form.register('instructions')} placeholder="Ej: tocar el timbre, entregar en recepción, etc." />
                </div>

                <Button type="submit" disabled={isLoading || !isMapLoaded} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-12 text-base">
                  {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                  Revisar y Confirmar Pedido
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 lg:sticky lg:top-8 h-[400px] lg:h-auto">
          {isMapLoaded ? (
            <MapDisplay
              pickupCoords={businessData?.coordinates}
              deliveryCoords={deliveryCoords}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg m-4">
            <CardHeader>
              <CardTitle>Confirmar Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg border p-3 text-sm">
                <p><span className="font-semibold">Cliente:</span> {form.watch('customerName')}</p>
                <p><span className="font-semibold">Dirección:</span> {form.watch('deliveryAddress')}</p>
                {form.watch('instructions') && <p><span className="font-semibold">Instrucciones:</span> {form.watch('instructions')}</p>}
              </div>
              <div className="space-y-2 rounded-lg border p-3 text-sm">
                <div className="flex justify-between"><span>Distancia de ruta:</span> <span className="font-medium">{previewData.distanceKm.toFixed(2)} km</span></div>
                <div className="flex justify-between"><span>Hora de entrega aprox:</span> <span className="font-medium">{previewData.eta}</span></div>
                <hr className="my-2" />
                <div className="flex justify-between"><span>Monto del pedido:</span> <span className="font-medium">{form.watch('paymentAmount').toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span></div>
                <div className="flex justify-between"><span>Costo de envío:</span> <span className="font-medium">{previewData.deliveryFee.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span></div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg"><span>Total a cobrar:</span> <span>{previewData.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span></div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreateOrder} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Confirmar y Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de éxito con botón de WhatsApp */}
      {isSuccessModalOpen && orderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg m-4 relative">
            <button
              onClick={handleCloseSuccessModal}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              aria-label="Cerrar"
            >

              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <CardHeader>
              <CardTitle>Pedido Creado Exitosamente</CardTitle>
              <p className="text-sm text-gray-600">Orden #{orderResult.shipdayOrderNumber} • Créditos restantes: {orderResult.creditsRemaining}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg border p-3 text-sm">
                <p><span className="font-semibold">Cliente:</span> {orderResult.customerData.customerName}</p>
                <p><span className="font-semibold">Teléfono:</span> {orderResult.customerData.customerPhone}</p>
                <p><span className="font-semibold">Dirección:</span> {orderResult.customerData.deliveryAddress}</p>
              </div>

              <div className="space-y-2 rounded-lg border p-3 text-sm">
                <div className="flex justify-between"><span>Monto del pedido:</span> <span className="font-medium">{orderResult.customerData.paymentAmount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span></div>
                <div className="flex justify-between"><span>Costo de envío:</span> <span className="font-medium">{orderResult.deliveryFee.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span></div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg"><span>Total a cobrar:</span> <span>{orderResult.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span></div>
              </div>



              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCloseSuccessModal}
                >
                  Crear Otro Pedido
                </Button>
                <Button onClick={handleSendWhatsApp} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Enviar WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}