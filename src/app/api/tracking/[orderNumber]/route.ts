import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

// --- NUEVA FUNCIÓN HELPER ---
// Construye el timeline desde el objeto activityLog de Shipday (más preciso)
function buildTimelineFromActivityLog(activityLog: any): any[] {
  const timeline = [];
  const logMap = [
    { key: 'placementTime', status: 'CREATED', description: 'Pedido creado' },
    { key: 'assignedTime', status: 'ASSIGNED', description: 'Repartidor asignado' },
    { key: 'startTime', status: 'STARTED', description: 'Repartidor en camino a recoger' },
    { key: 'pickedUpTime', status: 'PICKED_UP', description: 'Pedido recogido' },
    { key: 'arrivedTime', status: 'ARRIVED', description: 'Repartidor llegó al destino' }, // Añadido desde el log
    { key: 'deliveryTime', status: 'DELIVERED', description: 'Pedido entregado' }
  ];

  for (const item of logMap) {
    if (activityLog[item.key]) {
      timeline.push({
        status: item.status,
        timestamp: new Date(activityLog[item.key]).toISOString(),
        description: item.description
      });
    }
  }
  // Ordenar por fecha (más reciente primero)
  return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// --- LÓGICA DE FALLBACK (Tu código original refactorizado) ---
// Busca al conductor en las colecciones de Firebase si la API de Shipday falla
async function getFallbackDriverData(db: any, orderData: any): Promise<any> {
  // 1. Intentar desde shipdayOrders en Firestore
  if (orderData.shipdayOrderId) {
    try {
      const shipdayOrdersRef = collection(db, 'shipdayOrders');
      // NOTA: Tu código usaba parseInt, asegúrate de que shipdayOrderId sea un número o ajusta la query
      const shipdayQuery = query(shipdayOrdersRef, where('orderId', '==', parseInt(orderData.shipdayOrderId)));
      const shipdaySnapshot = await getDocs(shipdayQuery);
      
      if (!shipdaySnapshot.empty) {
        const shipdayOrder = shipdaySnapshot.docs[0].data();
        if (shipdayOrder.assignedCarrier) {
          return {
            name: shipdayOrder.assignedCarrier.name,
            phoneNumber: shipdayOrder.assignedCarrier.phoneNumber || undefined,
            photo: shipdayOrder.assignedCarrier.carrierPhoto || undefined,
            rating: undefined
          };
        }
      }
    } catch (e) { console.error("Error en fallback 1 (shipdayOrders):", e); }
  }

  // 2. Intentar desde carriers en Firestore
  if (orderData.assignedCarrierId) {
    try {
      const carriersRef = collection(db, 'carriers');
      const carrierQuery = query(carriersRef, where('id', '==', orderData.assignedCarrierId));
      const carrierSnapshot = await getDocs(carrierQuery);
      
      if (!carrierSnapshot.empty) {
        const carrier = carrierSnapshot.docs[0].data();
        return {
          name: carrier.name,
          phoneNumber: carrier.phoneNumber || undefined,
          photo: carrier.carrierPhoto || undefined,
          rating: undefined
        };
      }
    } catch (e) { console.error("Error en fallback 2 (carriers):", e); }
  }

  // 3. Último recurso: drivers de BeFast
  if (orderData.driverId) {
    try {
      const driverDoc = await getDoc(doc(db, 'drivers', orderData.driverId));
      if (driverDoc.exists()) {
        const driver = driverDoc.data();
        return {
          name: driver.fullName || driver.name,
          phoneNumber: driver.phoneNumber || undefined,
          photo: driver.profilePhoto || undefined,
          rating: driver.kpis?.averageRating || 4.5
        };
      }
    } catch (e) { console.error("Error en fallback 3 (drivers):", e); }
  }

  return null; // No se encontró conductor
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    // 1. Buscar el pedido base en Firebase por múltiples campos
    const ordersRef = collection(db, 'orders');
    
    // Intentar buscar por orderNumber primero
    let q = query(ordersRef, where('orderNumber', '==', orderNumber));
    let querySnapshot = await getDocs(q);
    
    // Si no se encuentra, intentar por shipdayOrderId
    if (querySnapshot.empty) {
      q = query(ordersRef, where('shipdayOrderId', '==', orderNumber));
      querySnapshot = await getDocs(q);
    }
    
    // Si aún no se encuentra, intentar buscar por documento ID
    if (querySnapshot.empty) {
      try {
        const docRef = doc(ordersRef, orderNumber);
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
          querySnapshot = { docs: [docSnapshot], empty: false } as any;
        }
      } catch (err) {
        // Ignore error, continue to 404
      }
    }

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();

    // 2. Inicializar variables con datos de Firebase (fallback)
    let driverData = null;
    let businessData = null;
    let customerData = {
      name: orderData.customer?.name || 'Cliente',
      address: orderData.customer?.address || 'Dirección no disponible',
      latitude: orderData.customer?.coordinates?.latitude || orderData.customer?.coordinates?.lat || 0,
      longitude: orderData.customer?.coordinates?.longitude || orderData.customer?.coordinates?.lng || 0,
      phoneNumber: orderData.customer?.phoneNumber || orderData.customer?.phone
    };
    let timeline = [];
    let currentStatus = orderData.status;
    let proofOfDelivery = orderData.proofOfDelivery || [];
    let estimatedTime = orderData.estimatedDeliveryTime;
    let driverLocation = null;
    let trackingLink = orderData.trackingLink; // ¡Importante! Leer de Firestore

    // Cargar businessData de fallback
    if (orderData.businessId) {
      const businessDoc = await getDoc(doc(db, 'businesses', orderData.businessId));
      if (businessDoc.exists()) {
        const business = businessDoc.data();
        businessData = {
          name: business.businessName || business.name,
          address: business.address,
          latitude: business.coordinates?.latitude || business.coordinates?.lat || 0,
          longitude: business.coordinates?.longitude || business.coordinates?.lng || 0
        };
      }
    } else if (orderData.pickup) {
      // Si no hay businessId, usar datos de pickup
      businessData = {
        name: orderData.pickup.businessName || 'Negocio',
        address: orderData.pickup.address || '',
        latitude: orderData.pickup.coordinates?.latitude || orderData.pickup.coordinates?.lat || 0,
        longitude: orderData.pickup.coordinates?.longitude || orderData.pickup.coordinates?.lng || 0
      };
    }
    
    // Cargar driverData desde Firestore si ya está asignado (desde webhook)
    if (orderData.driverId) {
      try {
        const driverDoc = await getDoc(doc(db, 'drivers', orderData.driverId));
        if (driverDoc.exists()) {
          const driver = driverDoc.data();
          driverData = {
            name: driver.fullName || driver.name || orderData.driverName,
            phoneNumber: driver.phoneNumber || driver.phone || undefined,
            photo: driver.profilePhoto || undefined,
            rating: driver.kpis?.averageRating || 4.5
          };
        }
      } catch (err) {
        console.error('Error loading driver from Firestore:', err);
      }
    }
    
    // Si no hay driverId pero hay driverName (del webhook), usar eso
    if (!driverData && orderData.driverName) {
      driverData = {
        name: orderData.driverName,
        phoneNumber: undefined,
        rating: undefined
      };
    }

    // Cargar timeline de fallback
    if (orderData.createdAt) timeline.push({ status: 'CREATED', timestamp: orderData.createdAt.toDate?.()?.toISOString() || orderData.createdAt, description: 'Pedido creado' });
    if (orderData.assignedAt) timeline.push({ status: 'ASSIGNED', timestamp: orderData.assignedAt.toDate?.()?.toISOString() || orderData.assignedAt, description: 'Repartidor asignado' });
    if (orderData.startedAt) timeline.push({ status: 'STARTED', timestamp: orderData.startedAt.toDate?.()?.toISOString() || orderData.startedAt, description: 'Repartidor en camino a recoger' });
    if (orderData.pickedUpAt) timeline.push({ status: 'PICKED_UP', timestamp: orderData.pickedUpAt.toDate?.()?.toISOString() || orderData.pickedUpAt, description: 'Pedido recogido' });
    if (orderData.deliveredAt) timeline.push({ status: 'DELIVERED', timestamp: orderData.deliveredAt.toDate?.()?.toISOString() || orderData.deliveredAt, description: 'Pedido entregado' });
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


    // 3. --- MEJORA DE MAPEO: Priorizar datos de la API de Shipday ---
    const shipdayApiKey = process.env.SHIPDAY_API_KEY;

    if (shipdayApiKey) {
      try {
        // ✅ CORRECTO: Usa shipdayOrderNumber real de Shipday (del webhook)
        // Prioridad: shipdayOrderNumber > shipdayOrderId > orderNumber
        const shipdayOrderIdentifier = orderData.shipdayOrderNumber || orderData.shipdayOrderId || orderNumber;
        const shipdayResponse = await fetch(`https://api.shipday.com/orders/${shipdayOrderIdentifier}`, {
          headers: {
            'Authorization': `Basic ${shipdayApiKey}`,
            'Accept': 'application/json'
          }
        });

        if (shipdayResponse.ok) {
          const shipdayOrder = await shipdayResponse.json();
          
          // Log para debugging
          console.log('[Tracking API] Shipday order data:', {
            orderNumber: shipdayOrder.orderNumber,
            status: shipdayOrder.orderStatus?.orderState,
            assignedCarrierId: shipdayOrder.assignedCarrierId,
            hasCarrier: !!shipdayOrder.assignedCarrier,
            carrierName: shipdayOrder.assignedCarrier?.name,
            trackingLink: shipdayOrder.trackingLink
          });

          // --- Aquí está el "mapeo corregido" ---
          
          // MAPEO 1: Estado
          currentStatus = shipdayOrder.orderStatus?.orderState || currentStatus;
          
          // MAPEO 2: ETA - etaTime SIEMPRE está vacío según documentación
          // NO usar etaTime, solo usar /order/progress API

          // MAPEO 3: Datos del Carrier (Repartidor)
          // Importante: assignedCarrierId === -1 significa que NO está asignado
          if (shipdayOrder.assignedCarrier && shipdayOrder.assignedCarrierId !== -1) {
            driverData = {
              name: shipdayOrder.assignedCarrier.name,
              phoneNumber: shipdayOrder.assignedCarrier.phoneNumber || undefined,
              photo: shipdayOrder.assignedCarrier.carrierPhoto || undefined,
              rating: shipdayOrder.feedback
            };
            
            // Actualizar Firestore con la info del carrier si no la teníamos
            if (!orderData.driverName || orderData.shipdayCarrierId !== shipdayOrder.assignedCarrier.id) {
              const carrierUpdate: any = {
                driverName: shipdayOrder.assignedCarrier.name,
                shipdayCarrierId: shipdayOrder.assignedCarrier.id,
                updatedAt: new Date()
              };
              
              // Solo actualizar assignedAt si no existe
              if (!orderData.assignedAt) {
                carrierUpdate.assignedAt = new Date();
              }
              
              await updateDoc(orderDoc.ref, carrierUpdate);
              console.log('[Tracking API] Updated Firestore with carrier info');
            }
          } else {
            // No hay carrier asignado aún, mantener lo que teníamos de Firestore
            // driverData ya está inicializado arriba desde Firestore
          }

          // MAPEO 4: Datos del Negocio (Restaurante)
          if (shipdayOrder.restaurant) {
            businessData = {
              name: shipdayOrder.restaurant.name,
              address: shipdayOrder.restaurant.address,
              latitude: shipdayOrder.restaurant.latitude || 0,
              longitude: shipdayOrder.restaurant.longitude || 0
            };
          }

          // MAPEO 5: Datos del Cliente
          if (shipdayOrder.customer) {
            customerData = {
              name: shipdayOrder.customer.name,
              address: shipdayOrder.customer.address,
              latitude: shipdayOrder.customer.latitude || 0,
              longitude: shipdayOrder.customer.longitude || 0,
              phoneNumber: shipdayOrder.customer.phoneNumber
            };
          }

          // MAPEO 6: Timeline (desde el ActivityLog, mucho más preciso)
          if (shipdayOrder.activityLog) {
            timeline = buildTimelineFromActivityLog(shipdayOrder.activityLog);
          }
          
          // MAPEO 7: Prueba de Entrega (POD)
          if (shipdayOrder.proofOfDelivery) {
             proofOfDelivery = [
               ...(shipdayOrder.proofOfDelivery.imageUrls || []),
               shipdayOrder.proofOfDelivery.signaturePath
             ].filter(Boolean); // Limpia nulos o strings vacíos
          }

          // --- ¡NUEVO! OBTENER UBICACIÓN DEL CARRIER (REPARTIDOR) PARA EL MAPA ---
          // Usamos el endpoint /order/progress/{trackingId}
          // El trackingId puede estar en trackingLink (de Firestore o Shipday) o usar el orderNumber
          let trackingId = orderNumber; // Fallback al orderNumber
          
          // Prioridad 1: trackingLink de Firestore (guardado por el webhook)
          if (trackingLink && typeof trackingLink === 'string') {
            const trackingMatch = trackingLink.match(/\/([^\/]+)$/);
            if (trackingMatch) {
              trackingId = trackingMatch[1];
            }
          } 
          // Prioridad 2: trackingLink de la respuesta de Shipday
          else if (shipdayOrder.trackingLink && typeof shipdayOrder.trackingLink === 'string') {
            const trackingMatch = shipdayOrder.trackingLink.match(/\/([^\/]+)$/);
            if (trackingMatch) {
              trackingId = trackingMatch[1];
            }
            // Actualizar Firestore con el trackingLink si no lo teníamos
            if (!trackingLink) {
              trackingLink = shipdayOrder.trackingLink;
              await updateDoc(orderDoc.ref, { trackingLink: shipdayOrder.trackingLink });
            }
          }
          
          try {
            const progressResponse = await fetch(`https://api.shipday.com/order/progress/${trackingId}?isStaticDataRequired=false`, {
              headers: { 
                'accept': 'application/json',
                'Authorization': `Basic ${shipdayApiKey}` // ✅ Agregar auth (ahora requerido)
              }
            });
            
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              
              // Mapear ubicación del carrier
              if (progressData.dynamicData?.carrierLocation) {
                driverLocation = {
                  latitude: progressData.dynamicData.carrierLocation.latitude,
                  longitude: progressData.dynamicData.carrierLocation.longitude
                };
              }
              
              // PRIORIDAD MÁXIMA: ETA real del repartidor desde progress API
              if (progressData.dynamicData?.estimatedTimeInMinutes) {
                estimatedTime = parseInt(progressData.dynamicData.estimatedTimeInMinutes);
                console.log('[Tracking API] Real ETA from progress API:', estimatedTime, 'minutes');
              }
            } else {
              console.warn(`Progress API returned ${progressResponse.status} for trackingId: ${trackingId}`);
            }
          } catch (progressError) {
            console.error('Error fetching carrier location from progress API:', progressError);
          }
          
        } else {
          // La API de Shipday falló, usamos los fallbacks de Firebase
          console.warn(`Shipday API call failed (${shipdayResponse.status}) for order: ${orderNumber}`);
          driverData = await getFallbackDriverData(db, orderData);
        }
      } catch (error) {
        console.error('Error fetching Shipday API data:', error);
        // Error de red, usamos los fallbacks de Firebase
        driverData = await getFallbackDriverData(db, orderData);
      }
    } else {
      // No hay API key, usamos los fallbacks de Firebase
      driverData = await getFallbackDriverData(db, orderData);
    }
    
    // 3.5 --- OBTENER UBICACIÓN DEL DRIVER USANDO /order/progress ---
    // Esto funciona independientemente de si tenemos acceso a la API de /orders
    // Solo necesitamos el trackingLink que se guarda en Firestore al crear la orden
    if (trackingLink && typeof trackingLink === 'string') {
      let trackingId = orderNumber; // Fallback
      
      // Extraer trackingId del trackingLink
      const trackingMatch = trackingLink.match(/\/([^\/]+)$/);
      if (trackingMatch) {
        trackingId = trackingMatch[1];
      }
      
      try {
        console.log(`[Tracking API] Fetching driver location for trackingId: ${trackingId}`);
        const progressResponse = await fetch(
          `https://api.shipday.com/order/progress/${trackingId}?isStaticDataRequired=false`,
          {
            headers: { 
              'accept': 'application/json',
              'Authorization': `Basic ${shipdayApiKey}` // ✅ Agregar auth (ahora requerido)
            }
          }
        );
        
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          
          // Mapear ubicación del carrier
          if (progressData.dynamicData?.carrierLocation) {
            driverLocation = {
              latitude: progressData.dynamicData.carrierLocation.latitude,
              longitude: progressData.dynamicData.carrierLocation.longitude
            };
            console.log(`[Tracking API] Driver location found:`, driverLocation);
          }
          
          // PRIORIDAD MÁXIMA: ETA real del repartidor (sobrescribir cualquier valor anterior)
          if (progressData.dynamicData?.estimatedTimeInMinutes) {
            estimatedTime = parseInt(progressData.dynamicData.estimatedTimeInMinutes);
            console.log('[Tracking API] Real ETA from progress API (fallback):', estimatedTime, 'minutes');
          }
          
          // Obtener info del carrier si no la tenemos
          if (progressData.fixedData?.carrier && !driverData) {
            driverData = {
              name: progressData.fixedData.carrier.name,
              phoneNumber: progressData.fixedData.carrier.phoneNumber || undefined,
              photo: progressData.fixedData.carrier.imagePath || undefined,
              rating: undefined
            };
            console.log(`[Tracking API] Driver info from progress API:`, driverData.name);
          }
        } else {
          console.warn(`[Tracking API] Progress API returned ${progressResponse.status} for trackingId: ${trackingId}`);
        }
      } catch (progressError) {
        console.error('[Tracking API] Error fetching from progress API:', progressError);
      }
    }

    // 4. Construir respuesta final
    const trackingData = {
      orderNumber: orderData.orderNumber,
      status: currentStatus, // Mapeado
      customer: customerData, // Mapeado
      business: businessData || { // Mapeado
        name: 'Negocio',
        address: 'Dirección no disponible',
        latitude: 0,
        longitude: 0
      },
      driver: driverData, // Mapeado (con fallbacks)
      driverLocation: driverLocation, // ¡Nuevo!
      estimatedTime: estimatedTime, // Mapeado
      orderItems: orderData.orderItems || [
        {
          name: orderData.orderDescription || 'Pedido de entrega',
          quantity: 1,
          unitPrice: (orderData.totalOrderValue || 0) - (orderData.deliveryFee || 55)
        }
      ],
      deliveryFee: orderData.deliveryFee || 55,
      totalCost: orderData.totalOrderValue || 0,
      placementTime: timeline[timeline.length - 1]?.timestamp || orderData.createdAt?.toDate?.()?.toISOString() || orderData.createdAt,
      deliveryTime: (currentStatus === 'ALREADY_DELIVERED' || currentStatus === 'DELIVERED') 
        ? (timeline[0]?.timestamp || orderData.deliveredAt?.toDate?.()?.toISOString() || orderData.deliveredAt)
        : null,
      proofOfDelivery: proofOfDelivery, // Mapeado
      timeline // Mapeado
    };
    
    // Log para debugging
    console.log('[Tracking API] Response summary:', {
      orderNumber: trackingData.orderNumber,
      status: trackingData.status,
      hasDriver: !!trackingData.driver,
      driverName: trackingData.driver?.name,
      driverPhone: trackingData.driver?.phoneNumber,
      hasDriverLocation: !!trackingData.driverLocation,
      estimatedTime: trackingData.estimatedTime,
      timelineEvents: trackingData.timeline.length,
      trackingLink: trackingLink,
      shipdayOrderId: orderData.shipdayOrderId
    });

    return NextResponse.json(trackingData);

  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}