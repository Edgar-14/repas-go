// Pantalla de navegación para BeFast GO
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { updateOrderStatus, completeOrder } from '../store/slices/ordersSlice';
import { NavigationProps, OrderStatus } from '../types';
import TrackingMap from '../components/TrackingMap';
import LocationService from '../services/LocationService';

interface NavigationScreenProps extends NavigationProps {
  route: {
    params: {
      orderId: string;
    };
  };
}

const NavigationScreen: React.FC<NavigationScreenProps> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [currentStep, setCurrentStep] = useState<OrderStatus>(OrderStatus.ACCEPTED);

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const orders = useSelector((state: RootState) => state.orders);
  const { activeOrder } = orders as any;

  useEffect(() => {
    if (activeOrder) {
      setCurrentStep(activeOrder.status);
    }
  }, [activeOrder]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!user?.uid) return;

    try {
      await dispatch(updateOrderStatus({
        orderId,
        status: newStatus,
        driverId: user.uid
      }));
      setCurrentStep(newStatus);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
    }
  };

  const handleCompleteOrder = () => {
    navigation.navigate('DeliveryConfirmation', { orderId });
  };

  const openInMaps = (latitude: number, longitude: number, label: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${label}`;
    Linking.openURL(url);
  };

  const callCustomer = () => {
    if (activeOrder?.customer.phone) {
      Linking.openURL(`tel:${activeOrder.customer.phone}`);
    }
  };

  const getStepColor = (step: OrderStatus) => {
    const stepOrder = [
      OrderStatus.ACCEPTED,
      OrderStatus.PICKED_UP,
      OrderStatus.IN_TRANSIT,
      OrderStatus.ARRIVED,
      OrderStatus.DELIVERED
    ];
    
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex <= currentIndex) {
      return '#4CAF50';
    }
    return '#E0E0E0';
  };

  const getNextAction = () => {
    switch (currentStep) {
      case OrderStatus.ACCEPTED:
        return {
          text: 'Llegué al restaurante',
          action: () => handleStatusUpdate(OrderStatus.PICKED_UP)
        };
      case OrderStatus.PICKED_UP:
        return {
          text: 'Pedido recogido',
          action: () => handleStatusUpdate(OrderStatus.IN_TRANSIT)
        };
      case OrderStatus.IN_TRANSIT:
        return {
          text: 'Llegué al destino',
          action: () => handleStatusUpdate(OrderStatus.ARRIVED)
        };
      case OrderStatus.ARRIVED:
        return {
          text: 'Entregar pedido',
          action: handleCompleteOrder
        };
      default:
        return null;
    }
  };

  if (!activeOrder) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pedido no encontrado</Text>
      </View>
    );
  }

  const nextAction = getNextAction();
  const isPickupPhase = currentStep === OrderStatus.ACCEPTED || currentStep === OrderStatus.PICKED_UP;
  const currentLocation = isPickupPhase ? activeOrder.pickup : activeOrder.delivery;

  // Iniciar tracking de ubicación cuando acepta el pedido
  useEffect(() => {
    if (user?.uid && activeOrder) {
      LocationService.startTracking(user.uid);
    }

    return () => {
      LocationService.stopTracking();
    };
  }, [user?.uid, activeOrder]);

  return (
    <View style={styles.container}>
      {/* Mapa interactivo en tiempo real */}
      <View style={styles.mapContainer}>
        <TrackingMap
          orderId={orderId}
          pickupLocation={{
            latitude: activeOrder.pickup.location.latitude,
            longitude: activeOrder.pickup.location.longitude,
          }}
          deliveryLocation={{
            latitude: activeOrder.delivery.location.latitude,
            longitude: activeOrder.delivery.location.longitude,
          }}
          driverId={user?.uid}
          showRoute={true}
          isPickupPhase={isPickupPhase}
        />
      </View>

      {/* Contenedor scrollable con información */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header con información del pedido */}
        <View style={styles.header}>
          <Text style={styles.orderId}>Pedido #{activeOrder.id.slice(-6)}</Text>
          <Text style={styles.earnings}>${activeOrder.estimatedEarnings}</Text>
        </View>

      {/* Progreso del pedido */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Progreso del pedido</Text>
        
        <View style={styles.progressSteps}>
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, { backgroundColor: getStepColor(OrderStatus.ACCEPTED) }]}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepText}>Aceptado</Text>
          </View>
          
          <View style={[styles.stepLine, { backgroundColor: getStepColor(OrderStatus.PICKED_UP) }]} />
          
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, { backgroundColor: getStepColor(OrderStatus.PICKED_UP) }]}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepText}>Recogido</Text>
          </View>
          
          <View style={[styles.stepLine, { backgroundColor: getStepColor(OrderStatus.IN_TRANSIT) }]} />
          
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, { backgroundColor: getStepColor(OrderStatus.IN_TRANSIT) }]}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepText}>En camino</Text>
          </View>
          
          <View style={[styles.stepLine, { backgroundColor: getStepColor(OrderStatus.ARRIVED) }]} />
          
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, { backgroundColor: getStepColor(OrderStatus.ARRIVED) }]}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <Text style={styles.stepText}>Entregado</Text>
          </View>
        </View>
      </View>

      {/* Información de destino actual */}
      <View style={styles.destinationContainer}>
        <Text style={styles.destinationTitle}>
          {isPickupPhase ? '📍 Punto de recogida' : '🏠 Punto de entrega'}
        </Text>
        
        <View style={styles.destinationCard}>
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationName}>
              {isPickupPhase ? activeOrder.pickup.businessName : activeOrder.customer.name}
            </Text>
            <Text style={styles.destinationAddress}>
              {currentLocation.address}
            </Text>
            {isPickupPhase && activeOrder.pickup.specialInstructions && (
              <Text style={styles.specialInstructions}>
                💡 {activeOrder.pickup.specialInstructions}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => openInMaps(
              currentLocation.location.latitude,
              currentLocation.location.longitude,
              isPickupPhase ? activeOrder.pickup.businessName : 'Destino'
            )}
          >
            <Text style={styles.mapButtonText}>🗺️ Navegar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Información del cliente */}
      <View style={styles.customerContainer}>
        <Text style={styles.customerTitle}>👤 Cliente</Text>
        <View style={styles.customerCard}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{activeOrder.customer.name}</Text>
            <Text style={styles.customerPhone}>{activeOrder.customer.phone}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.callButton}
            onPress={callCustomer}
          >
            <Text style={styles.callButtonText}>📞 Llamar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Información de pago */}
      <View style={styles.paymentContainer}>
        <Text style={styles.paymentTitle}>💳 Información de pago</Text>
        <View style={styles.paymentCard}>
          <Text style={styles.paymentMethod}>
            {activeOrder.paymentMethod === 'CASH' ? '💵 Efectivo' : '💳 Tarjeta'}
          </Text>
          <Text style={styles.paymentTotal}>
            Total: ${activeOrder.total.toFixed(2)}
          </Text>
          {activeOrder.paymentMethod === 'CASH' && (
            <Text style={styles.paymentNote}>
              ⚠️ Cobrar en efectivo al cliente
            </Text>
          )}
        </View>
      </View>

      {/* Botón de acción principal */}
      {nextAction && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={nextAction.action}
          >
            <Text style={styles.actionButtonText}>{nextAction.text}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botón de emergencia */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => navigation.navigate('Emergency')}
      >
        <Text style={styles.emergencyButtonText}>🚨 Emergencia</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mapContainer: {
    height: 300,
    width: '100%',
  },
  scrollContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  earnings: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  destinationContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  destinationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  specialInstructions: {
    fontSize: 14,
    color: '#FF6B35',
    fontStyle: 'italic',
  },
  mapButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  customerContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  customerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  customerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  callButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  paymentCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  paymentNote: {
    fontSize: 14,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  actionContainer: {
    padding: 16,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyButton: {
    backgroundColor: '#F44336',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NavigationScreen;