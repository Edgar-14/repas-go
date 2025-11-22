import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
            phoneNumber: shipdayOrder.assignedCarrier.phoneNumber,
            photo: shipdayOrder.assignedCarrier.carrierPhoto,
            rating: 4.5 // shipday no provee rating
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
          phoneNumber: carrier.phoneNumber,
          photo: carrier.carrierPhoto,
          rating: 4.5 // shipday no provee rating
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
          phoneNumber: driver.phoneNumber,
          photo: driver.profilePhoto,
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

    // 1. Buscar el pedido base en Firebase
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderNumber', '==', orderNumber));
    const querySnapshot = await getDocs(q);

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
      latitude: orderData.customer?.coordinates?.latitude || 0,
      longitude: orderData.customer?.coordinates?.longitude || 0,
      phoneNumber: orderData.customer?.phoneNumber
    };
    let timeline = [];
    let currentStatus = orderData.status;
    let proofOfDelivery = orderData.proofOfDelivery || [];
    let estimatedTime = orderData.estimatedDeliveryTime;
    let driverLocation = null; // ¡Nuevo!

    // Cargar businessData de fallback
    if (orderData.businessId) {
      const businessDoc = await getDoc(doc(db, 'businesses', orderData.businessId));
      if (businessDoc.exists()) {
        const business = businessDoc.data();
        businessData = {
          name: business.businessName || business.name,
          address: business.address,
          latitude: business.coordinates?.latitude || 0,
          longitude: business.coordinates?.longitude || 0
        };
      }
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
        // CORRECCIÓN: El endpoint es /orders/{orderNumber}, no {orderId}
        // Usamos el orderNumber de la URL, que es el correcto según la doc.
        const shipdayResponse = await fetch(`https://api.shipday.com/orders/${orderNumber}`, {
          headers: {
            'Authorization': `Basic ${shipdayApiKey}`,
            'Accept': 'application/json'
          }
        });

        if (shipdayResponse.ok) {
          const shipdayOrder = await shipdayResponse.json();

          // --- Aquí está el "mapeo corregido" ---
          
          // MAPEO 1: Estado
          currentStatus = shipdayOrder.orderStatus?.orderState || currentStatus;
          
          // MAPEO 2: ETA (según doc, es etaTime)
          estimatedTime = shipdayOrder.etaTime || estimatedTime;

          // MAPEO 3: Datos del Conductor
          if (shipdayOrder.assignedCarrier) {
            driverData = {
              name: shipdayOrder.assignedCarrier.name,
              phoneNumber: shipdayOrder.assignedCarrier.phoneNumber,
              photo: shipdayOrder.assignedCarrier.carrierPhoto,
              rating: 4.5 // Nota: Shipday no proporciona rating en este objeto
            };
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

          // --- ¡NUEVO! OBTENER UBICACIÓN DEL CONDUCTOR PARA EL MAPA ---
          // Usamos el endpoint /order/progress/{trackingId}
          // (Asumimos que el trackingId es el mismo orderNumber, como sugiere la doc)
          try {
            const progressResponse = await fetch(`https://api.shipday.com/order/progress/${orderNumber}?isStaticDataRequired=false`, {
              headers: { 'accept': 'application/json' }
              // Este endpoint no requiere Auth según la doc
            });
            
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              if (progressData.dynamicData?.carrierLocation) {
                driverLocation = progressData.dynamicData.carrierLocation; // { latitude, longitude }
              }
            }
          } catch (progressError) {
            console.error('Error fetching driver location:', progressError);
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

    return NextResponse.json(trackingData);

  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}