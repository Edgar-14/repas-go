// Tracking en tiempo real para clientes - BeFast GO
// Basado en TRACKING_PAGE_SPECS.md

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBqJxKuoZ8X7X7X7X7X7X7X7X7X7X7X7X7",
    authDomain: "befast-hfkbl.firebaseapp.com",
    projectId: "befast-hfkbl",
    storageBucket: "befast-hfkbl.appspot.com",
    messagingSenderId: "897579485656",
    appId: "1:897579485656:web:abc123def456"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables globales
let map = null;
let driverMarker = null;
let destinationMarker = null;
let routeLine = null;
let unsubscribeOrder = null;
let unsubscribeDriver = null;

// Estados de pedido
const OrderStatus = {
    PENDING: 'PENDING',
    SEARCHING: 'SEARCHING',
    ASSIGNED: 'ASSIGNED',
    ACCEPTED: 'ACCEPTED',
    PICKED_UP: 'PICKED_UP',
    IN_TRANSIT: 'IN_TRANSIT',
    ARRIVED: 'ARRIVED',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED'
};

// Obtener orderId de la URL
function getOrderIdFromUrl() {
    const urlParts = window.location.pathname.split('/');
    return urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
}

// Inicializar tracking
async function initializeTracking() {
    const orderId = getOrderIdFromUrl();
    
    if (!orderId) {
        showError('ID de pedido no encontrado en la URL');
        return;
    }

    console.log('Tracking order:', orderId);

    // Escuchar cambios del pedido en tiempo real
    unsubscribeOrder = db.collection('orders').doc(orderId)
        .onSnapshot(
            (doc) => {
                if (!doc.exists) {
                    showError('Pedido no encontrado');
                    return;
                }

                const order = { id: doc.id, ...doc.data() };
                console.log('Order data:', order);
                updateUI(order);

                // Si tiene conductor, escuchar su ubicación
                if (order.driverId) {
                    listenToDriverLocation(order.driverId, order);
                }
            },
            (error) => {
                console.error('Error loading order:', error);
                showError('Error de conexión. Por favor recarga la página.');
            }
        );
}

// Actualizar UI con datos del pedido
function updateUI(order) {
    // Ocultar loading, mostrar contenido
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    // Información básica
    const orderNumber = order.orderNumber || order.id.slice(-8);
    document.getElementById('orderNumber').textContent = `#${orderNumber}`;
    document.getElementById('businessName').textContent = order.pickup?.businessName || 'Restaurante';
    document.getElementById('orderStatus').textContent = getStatusText(order.status);

    // Mostrar mapa solo si está en tránsito o llegado
    const showMap = (order.status === OrderStatus.IN_TRANSIT || order.status === OrderStatus.ARRIVED) 
                    && order.driverId 
                    && order.delivery?.coordinates;
    
    const mapSection = document.getElementById('mapSection');
    mapSection.style.display = showMap ? 'block' : 'none';

    if (showMap && !map) {
        initializeMap(order);
    }

    // Mostrar ETA
    const showETA = order.status === OrderStatus.IN_TRANSIT || order.status === OrderStatus.ARRIVED;
    const etaBadge = document.getElementById('etaBadge');
    etaBadge.style.display = showETA ? 'block' : 'none';
    
    if (showETA && order.estimatedDeliveryTime) {
        updateETA(order.estimatedDeliveryTime);
    }

    // Timeline
    updateTimeline(order);
}

// Escuchar ubicación del conductor en tiempo real
function listenToDriverLocation(driverId, order) {
    // Cancelar listener anterior si existe
    if (unsubscribeDriver) {
        unsubscribeDriver();
    }

    unsubscribeDriver = db.collection('drivers').doc(driverId)
        .onSnapshot(
            (doc) => {
                if (!doc.exists) return;

                const driver = doc.data();
                console.log('Driver data:', driver);

                // Actualizar info del conductor
                updateDriverInfo({
                    name: driver.personalData?.fullName || 'Repartidor',
                    rating: driver.stats?.rating || 0
                });

                // Actualizar ubicación en el mapa
                const location = driver.operational?.currentLocation;
                if (location && map) {
                    updateDriverMarkerOnMap(location, order.delivery.coordinates);
                }
            },
            (error) => {
                console.error('Error loading driver location:', error);
            }
        );
}

// Inicializar Google Maps
function initializeMap(order) {
    const deliveryCoords = {
        lat: order.delivery.coordinates.latitude,
        lng: order.delivery.coordinates.longitude
    };

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: deliveryCoords,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });

    // Marcador del destino
    destinationMarker = new google.maps.Marker({
        position: deliveryCoords,
        map: map,
        title: 'Tu ubicación',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4CAF50',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        }
    });
}

// Actualizar marcador del conductor en el mapa
function updateDriverMarkerOnMap(driverLocation, destinationCoords) {
    if (!map) return;

    const driverPos = {
        lat: driverLocation.latitude,
        lng: driverLocation.longitude
    };

    // Crear o actualizar marcador del conductor
    if (!driverMarker) {
        driverMarker = new google.maps.Marker({
            position: driverPos,
            map: map,
            title: 'Repartidor',
            icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 5,
                fillColor: '#667eea',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                rotation: 0
            },
            animation: google.maps.Animation.DROP
        });
    } else {
        driverMarker.setPosition(driverPos);
    }

    // Actualizar o crear línea de ruta
    const destPos = {
        lat: destinationCoords.latitude,
        lng: destinationCoords.longitude
    };

    if (!routeLine) {
        routeLine = new google.maps.Polyline({
            path: [driverPos, destPos],
            strokeColor: '#667eea',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map: map
        });
    } else {
        routeLine.setPath([driverPos, destPos]);
    }

    // Ajustar el mapa para mostrar ambos marcadores
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(driverPos);
    bounds.extend(destPos);
    map.fitBounds(bounds);
}

// Actualizar información del conductor
function updateDriverInfo(driver) {
    const driverCard = document.getElementById('driverCard');
    driverCard.style.display = 'block';

    // Avatar con iniciales
    const nameParts = driver.name.split(' ');
    const initials = nameParts.map(p => p.charAt(0)).join('').substring(0, 2);
    document.getElementById('driverAvatar').textContent = initials;
    
    document.getElementById('driverName').textContent = driver.name;
    document.getElementById('driverRating').textContent = `⭐ ${driver.rating.toFixed(1)}`;
}

// Actualizar ETA
function updateETA(estimatedDeliveryTime) {
    if (!estimatedDeliveryTime) return;

    const eta = estimatedDeliveryTime.toDate();
    const now = new Date();
    const minutesLeft = Math.round((eta - now) / 60000);

    const etaText = minutesLeft > 0 ? minutesLeft : '<1';
    document.getElementById('etaTime').textContent = etaText;
}

// Actualizar timeline
function updateTimeline(order) {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    const timelineSteps = [
        { status: OrderStatus.PENDING, label: 'Pendiente', icon: '⏳' },
        { status: OrderStatus.SEARCHING, label: 'Buscando repartidor', icon: '🔍' },
        { status: OrderStatus.ASSIGNED, label: 'Repartidor asignado', icon: '👤' },
        { status: OrderStatus.ACCEPTED, label: 'Pedido aceptado', icon: '✅' },
        { status: OrderStatus.PICKED_UP, label: 'Recogido', icon: '📦' },
        { status: OrderStatus.IN_TRANSIT, label: 'En camino', icon: '🚚' },
        { status: OrderStatus.ARRIVED, label: 'Llegó a tu ubicación', icon: '📍' },
        { status: OrderStatus.DELIVERED, label: 'Entregado', icon: '🎉' }
    ];

    const currentStatusIndex = timelineSteps.findIndex(s => s.status === order.status);

    timelineSteps.forEach((step, index) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const dot = document.createElement('div');
        dot.className = 'timeline-dot';
        
        if (index < currentStatusIndex) {
            dot.classList.add('completed');
        } else if (index === currentStatusIndex) {
            dot.classList.add('current');
        }

        const content = document.createElement('div');
        content.className = 'timeline-content';

        const title = document.createElement('h4');
        title.textContent = `${step.icon} ${step.label}`;

        const timestamp = document.createElement('p');
        const time = getTimestampForStatus(order, step.status);
        timestamp.textContent = time || '';

        content.appendChild(title);
        if (time) content.appendChild(timestamp);

        item.appendChild(dot);
        item.appendChild(content);

        // Línea conectora
        if (index < timelineSteps.length - 1) {
            const line = document.createElement('div');
            line.className = 'timeline-line';
            if (index < currentStatusIndex) {
                line.classList.add('completed');
            }
            item.appendChild(line);
        }

        timeline.appendChild(item);
    });
}

// Obtener timestamp para un estado específico
function getTimestampForStatus(order, status) {
    if (!order.timestamps) return null;

    const statusMap = {
        [OrderStatus.PENDING]: 'created',
        [OrderStatus.SEARCHING]: 'created',
        [OrderStatus.ASSIGNED]: 'assigned',
        [OrderStatus.ACCEPTED]: 'accepted',
        [OrderStatus.PICKED_UP]: 'pickedUp',
        [OrderStatus.IN_TRANSIT]: 'inTransit',
        [OrderStatus.ARRIVED]: 'arrived',
        [OrderStatus.DELIVERED]: 'delivered'
    };

    const timestampField = statusMap[status];
    if (!timestampField || !order.timestamps[timestampField]) return null;

    const timestamp = order.timestamps[timestampField].toDate();
    return timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// Obtener texto del estado
function getStatusText(status) {
    const statusTexts = {
        [OrderStatus.PENDING]: '⏳ Pendiente',
        [OrderStatus.SEARCHING]: '🔍 Buscando repartidor',
        [OrderStatus.ASSIGNED]: '👤 Repartidor asignado',
        [OrderStatus.ACCEPTED]: '✅ Aceptado',
        [OrderStatus.PICKED_UP]: '📦 Recogido',
        [OrderStatus.IN_TRANSIT]: '🚚 En camino',
        [OrderStatus.ARRIVED]: '📍 En tu ubicación',
        [OrderStatus.DELIVERED]: '🎉 Entregado',
        [OrderStatus.COMPLETED]: '✨ Completado',
        [OrderStatus.FAILED]: '❌ Fallido',
        [OrderStatus.CANCELLED]: '🚫 Cancelado'
    };

    return statusTexts[status] || status;
}

// Mostrar error
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').querySelector('p').textContent = message;
}

// Cleanup al cerrar la página
window.addEventListener('beforeunload', () => {
    if (unsubscribeOrder) unsubscribeOrder();
    if (unsubscribeDriver) unsubscribeDriver();
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTracking);
} else {
    initializeTracking();
}
