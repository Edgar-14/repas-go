// Pantalla de confirmación de entrega para BeFast GO
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { completeOrder } from '../store/slices/ordersSlice';
import { NavigationProps } from '../types';
import OrderCompletionModal from '../components/modals/OrderCompletionModal'; // Importar el nuevo modal

interface DeliveryConfirmationScreenProps extends NavigationProps {
  route: {
    params: {
      orderId: string;
    };
  };
}

const DeliveryConfirmationScreen: React.FC<DeliveryConfirmationScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { orderId } = route.params;
  const [showCompletionModal, setShowCompletionModal] = useState(false); // Estado para controlar la visibilidad del modal
  const [isCompleting, setIsCompleting] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const activeOrder = useSelector((state: RootState) => state.orders.activeOrder);

  const handleCompleteOrder = async (completionData: {
    photoUrl?: string;
    signature?: string;
    customerPin?: string;
    cashReceived?: number;
  }) => {
    if (!activeOrder || !user?.uid) return;

    setIsCompleting(true);

    try {
      const result = await dispatch(completeOrder({
        orderId,
        driverId: user.uid,
        completionData
      }));

      if (completeOrder.fulfilled.match(result)) {
        Alert.alert(
          '¡Pedido completado!',
          'El pedido se ha completado exitosamente. Las ganancias se han agregado a tu billetera.',
          [
            {
              text: 'Ver billetera',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Main',
                      params: { screen: 'Payments' }
                    }
                  ]
                });
              }
            },
            {
              text: 'Ir al inicio',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }]
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', (result.payload as any)?.message || 'No se pudo completar el pedido. Intenta de nuevo.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar el pedido. Intenta de nuevo.');
    } finally {
      setIsCompleting(false);
      setShowCompletionModal(false); // Cerrar el modal después de intentar completar
    }
  };

  if (!activeOrder) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pedido no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Confirmar Entrega</Text>
          <Text style={styles.subtitle}>
            Pedido #{activeOrder.id.slice(-6)}
          </Text>
        </View>

        {/* Información del pedido */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderInfoTitle}>Información del pedido</Text>
          <Text style={styles.orderInfoText}>
            Cliente: {activeOrder.customer.name}
          </Text>
          <Text style={styles.orderInfoText}>
            Total: ${(activeOrder.total ?? 0).toFixed(2)}
          </Text>
          <Text style={styles.orderInfoText}>
            Método de pago: {activeOrder.payment.method === 'EFECTIVO' ? 'Efectivo' : 'Tarjeta'}
          </Text>
        </View>

        {/* Instrucciones adicionales */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>📝 Instrucciones</Text>
          <Text style={styles.instructionsText}>
            1. Asegúrate de que el cliente haya recibido todos los items{'\n'}
            2. Prepara la confirmación de entrega (foto, firma o PIN){'\n'}
            3. Confirma la entrega presionando el botón de abajo
          </Text>
        </View>
      </View>

      {/* Botón para abrir el modal de completar */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.completeButton, isCompleting && styles.completeButtonDisabled]}
          onPress={() => setShowCompletionModal(true)}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.completeButtonText}>
              ✅ Abrir Confirmación de Entrega
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <OrderCompletionModal
        visible={showCompletionModal}
        order={activeOrder}
        onClose={() => setShowCompletionModal(false)}
        onComplete={handleCompleteOrder}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  orderInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  orderInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  photoSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  photoButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  photoNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  confirmationSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 4,
  },
  cashInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 8,
  },
  confirmationNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  changeNote: {
    fontSize: 14,
    color: '#FF9800',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
  },
  instructionsSection: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#CCC',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DeliveryConfirmationScreen;