/**
 * tracking.js
 * 
 * Script para la página pública de tracking que se conecta al Firestore
 * existente del ecosistema BeFast para mostrar tracking en tiempo real.
 */

// Configuración de Firebase - usar las mismas credenciales del ecosistema
const firebaseConfig = {
    apiKey: "AIzaSyAEFo3RDFvqw0-HuSOOBD34NGruHI3hIBQ",
    authDomain: "befast-hfkbl.firebaseapp.com",
    projectId: "befast-hfkbl",
    storageBucket: "befast-hfkbl.firebasestorage.app",
    messagingSenderId: "1031006329166",
    appId: "1:1031006329166:web:aa77e24c7a5ee51f1a1989"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables globales
let map;
let driverMarker;
let pickupMarker;
let deliveryMarker;
let routePolyline;
let orderUnsubscribe;
let driverUnsubscribe;

/**
 * Obtener orderId de la URL
 */
function getOrderIdFromURL() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
}

/**
 * Inicializar mapa de Google Maps
 */
function initMap(lat = 19.4326, lng = -99.1332) {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat, lng },
        zoom: 14,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
            {
                featureType: 'poi',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
}

/**
 * Crear marcador del conductor
 */
function createDriverMarker(lat, lng) {
    if (driverMarker) {
        driverMarker.setPosition({ lat, lng });
    } else {
        driverMarker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: 'Repartidor',
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#00B894',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3
            },
            zIndex: 1000
        });
    }
}

/**
 * Crear marcador de pickup
 */
function createPickupMarker(lat, lng, title) {
    if (pickupMarker) {
        pickupMarker.setMap(null);
    }

    pickupMarker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: title || 'Restaurante',
        label: {
            text: '🏪',
            fontSize: '24px'
        },
        zIndex: 500
    });
}

/**
 * Crear marcador de delivery
 */
function createDeliveryMarker(lat, lng, title) {
    if (deliveryMarker) {
        deliveryMarker.setMap(null);
    }

    deliveryMarker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: title || 'Tu ubicación',
        label: {
            text: '📍',
            fontSize: '24px'
        },
        zIndex: 500
    });
}

/**
 * Ajustar mapa para mostrar todos los marcadores
 */
function fitMapToMarkers() {
    const bounds = new google.maps.LatLngBounds();

    if (driverMarker) bounds.extend(driverMarker.getPosition());
    if (pickupMarker) bounds.extend(pickupMarker.getPosition());
    if (deliveryMarker) bounds.extend(deliveryMarker.getPosition());

    if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        
        // Ajustar zoom si está muy cerca
        const listener = google.maps.event.addListener(map, 'idle', function() {
            if (map.getZoom() > 16) map.setZoom(16);
            google.maps.event.removeListener(listener);
        });
    }
}

/**
 * Formatear timestamp de Firestore a hora legible
 */
function formatTime(timestamp) {
    if (!timestamp) return '--';
    
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        return '--';
    }

    return date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Actualizar estado del timeline
 */
function updateTimeline(status, timing) {
    // Resetear todos los estados
    document.querySelectorAll('.timeline-item').forEach(item => {
        item.classList.remove('active', 'completed');
    });

    // Mapeo de estados a timeline items
    const statusMap = {
        'SEARCHING': ['searching'],
        'ASSIGNED': ['searching', 'assigned'],
        'ACCEPTED': ['searching', 'assigned'],
        'STARTED': ['searching', 'assigned', 'started'],
        'PICKED_UP': ['searching', 'assigned', 'started', 'picked-up'],
        'IN_TRANSIT': ['searching', 'assigned', 'started', 'picked-up', 'in-transit'],
        'ARRIVED': ['searching', 'assigned', 'started', 'picked-up', 'in-transit', 'arrived'],
        'DELIVERED': ['searching', 'assigned', 'started', 'picked-up', 'in-transit', 'arrived', 'delivered'],
        'COMPLETED': ['searching', 'assigned', 'started', 'picked-up', 'in-transit', 'arrived', 'delivered']
    };

    const activeStages = statusMap[status] || [];
    const currentStage = activeStages[activeStages.length - 1];

    // Marcar etapas completadas y activa
    activeStages.forEach((stage, index) => {
        const item = document.getElementById(`timeline-${stage}`);
        if (item) {
            if (index < activeStages.length - 1) {
                item.classList.add('completed');
            } else {
                item.classList.add('active');
            }
        }
    });

    // Actualizar tiempos
    if (timing) {
        if (timing.assignedAt) {
            document.getElementById('time-assigned').textContent = formatTime(timing.assignedAt);
        }
        if (timing.startedAt) {
            document.getElementById('time-started').textContent = formatTime(timing.startedAt);
        }
        if (timing.pickedUpAt) {
            document.getElementById('time-picked-up').textContent = formatTime(timing.pickedUpAt);
        }
        if (timing.arrivedAt) {
            document.getElementById('time-arrived').textContent = formatTime(timing.arrivedAt);
        }
        if (timing.deliveredAt) {
            document.getElementById('time-delivered').textContent = formatTime(timing.deliveredAt);
        }
    }

    // Actualizar badge de estado
    const statusBadge = document.getElementById('orderStatusBadge');
    const statusLabels = {
        'SEARCHING': 'Buscando repartidor',
        'ASSIGNED': 'Repartidor asignado',
        'ACCEPTED': 'Pedido aceptado',
        'STARTED': 'En camino al restaurante',
        'PICKED_UP': 'Pedido recogido',
        'IN_TRANSIT': 'En camino',
        'ARRIVED': 'Repartidor llegó',
        'DELIVERED': 'Entregado',
        'COMPLETED': 'Completado'
    };
    statusBadge.textContent = statusLabels[status] || status;
}

/**
 * Actualizar información del pedido en la UI
 */
function updateOrderInfo(orderData) {
    // Order Number
    document.getElementById('orderNumber').textContent = `#${orderData.orderNumber || 'N/A'}`;

    // Business Name
    document.getElementById('businessName').textContent = orderData.restaurant?.name || 'Restaurante';

    // Delivery Address
    document.getElementById('deliveryAddress').textContent = orderData.customer?.address || 'Dirección no disponible';

    // Payment Method
    const paymentMethod = orderData.paymentMethod === 'CARD' ? 'Tarjeta' : 'Efectivo';
    document.getElementById('paymentMethod').textContent = paymentMethod;

    // Total Amount
    const total = orderData.pricing?.totalAmount || 0;
    document.getElementById('totalAmount').textContent = `$${total.toFixed(2)} MXN`;

    // Timeline
    updateTimeline(orderData.status, orderData.timing);

    // Marcadores del mapa
    if (orderData.restaurant?.coordinates) {
        createPickupMarker(
            orderData.restaurant.coordinates.lat,
            orderData.restaurant.coordinates.lng,
            orderData.restaurant.name
        );
    }

    if (orderData.customer?.coordinates) {
        createDeliveryMarker(
            orderData.customer.coordinates.lat,
            orderData.customer.coordinates.lng,
            'Tu ubicación'
        );
    }

    // ETA y distancia (si están disponibles)
    if (orderData.logistics) {
        if (orderData.logistics.estimatedDuration) {
            document.getElementById('etaTime').textContent = `${Math.round(orderData.logistics.estimatedDuration)} min`;
        }
        if (orderData.logistics.distance) {
            document.getElementById('etaDistance').textContent = `${orderData.logistics.distance.toFixed(1)} km`;
        }
    }
}

/**
 * Escuchar ubicación del conductor en tiempo real
 */
function listenToDriverLocation(driverId) {
    if (driverUnsubscribe) {
        driverUnsubscribe();
    }

    driverUnsubscribe = db.collection('drivers')
        .doc(driverId)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const driverData = doc.data();
                const location = driverData.operational?.currentLocation;

                if (location && location.latitude && location.longitude) {
                    createDriverMarker(location.latitude, location.longitude);
                    fitMapToMarkers();

                    // Actualizar info del conductor
                    const driverInfo = document.getElementById('driverInfo');
                    driverInfo.style.display = 'block';

                    const fullName = `${driverData.personalInfo?.firstName || ''} ${driverData.personalInfo?.lastName || ''}`.trim();
                    document.getElementById('driverName').textContent = fullName || 'Repartidor';

                    // Iniciales
                    const initials = fullName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                    document.getElementById('driverInitials').textContent = initials || 'RD';

                    // Rating (si está disponible)
                    if (driverData.kpis?.rating) {
                        document.getElementById('driverRating').textContent = driverData.kpis.rating.toFixed(1);
                    }
                }
            }
        }, (error) => {
            console.error('Error listening to driver location:', error);
        });
}

/**
 * Escuchar cambios en el pedido en tiempo real
 */
function listenToOrder(orderId) {
    if (orderUnsubscribe) {
        orderUnsubscribe();
    }

    orderUnsubscribe = db.collection('orders')
        .doc(orderId)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const orderData = doc.data();
                updateOrderInfo(orderData);

                // Si hay conductor asignado, escuchar su ubicación
                if (orderData.assignedDriverId) {
                    listenToDriverLocation(orderData.assignedDriverId);
                }

                // Ocultar loading y mostrar info
                document.getElementById('loading').style.display = 'none';
                document.getElementById('orderInfo').style.display = 'block';
            } else {
                // Pedido no encontrado
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
            }
        }, (error) => {
            console.error('Error listening to order:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
        });
}

/**
 * Inicialización al cargar la página
 */
window.addEventListener('DOMContentLoaded', () => {
    const orderId = getOrderIdFromURL();

    if (!orderId || orderId === 'track') {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        return;
    }

    // Inicializar mapa
    initMap();

    // Escuchar pedido
    listenToOrder(orderId);
});

/**
 * Limpiar listeners al cerrar la página
 */
window.addEventListener('beforeunload', () => {
    if (orderUnsubscribe) orderUnsubscribe();
    if (driverUnsubscribe) driverUnsubscribe();
});
