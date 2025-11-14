// Pantalla de confirmación de entrega para BeFast GO
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { completeOrder } from '../store/slices/ordersSlice';
import { NavigationProps } from '../types';

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
  const [customerPin, setCustomerPin] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  // --- CORRECCIÓN 1: Selector de Redux directo y tipo-seguro ---
  const activeOrder = useSelector((state: RootState) => state.orders.activeOrder);

  const handleCompleteOrder = async () => {
    if (!activeOrder || !user?.uid) return;

    // --- CORRECCIÓN 2: Usar activeOrder.payment.method y 'TARJETA' ---
    if (activeOrder.payment.method === 'TARJETA' && !customerPin.trim()) {
      Alert.alert('Error', 'Ingresa el PIN del cliente para pedidos con tarjeta');
      return;
    }

    // --- CORRECCIÓN 2: Usar activeOrder.payment.method y 'EFECTIVO' ---
    if (activeOrder.payment.method === 'EFECTIVO') {
      const amount = parseFloat(cashReceived);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Ingresa el monto recibido en efectivo');
        return;
      }
      // --- CORRECCIÓN 3: Usar (activeOrder.total ?? 0) ---
      if (amount < (activeOrder.total ?? 0)) {
        Alert.alert('Error', 'El monto recibido no puede ser menor al total del pedido');
        return;
      }
    }

    setIsCompleting(true);

    try {
      // Simular captura de foto (en implementación real sería con cámara)
      const photoUrl = 'https://example.com/delivery-photo.jpg';

      const completionData = {
        photoUrl,
        // --- CORRECCIÓN 2 (Lógica) ---
        ...(activeOrder.payment.method === 'TARJETA' && { customerPin }),
        ...(activeOrder.payment.method === 'EFECTIVO' && {
          cashReceived: parseFloat(cashReceived)
        }),
      };

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
                // --- CORRECCIÓN 4: Navegar a la pestaña 'Payments' dentro de 'Main' ---
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Main',
                      params: { screen: 'Payments' } // Navega al tab 'Payments'
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
        // Mostrar error si el thunk fue rechazado
        Alert.alert('Error', (result.payload as any)?.message || 'No se pudo completar el pedido. Intenta de nuevo.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar el pedido. Intenta de nuevo.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleTakePhoto = () => {
    Alert.alert(
      'Foto de entrega',
      'En la implementación completa, aquí se abriría la cámara para tomar una foto de la entrega.',
      [{ text: 'OK' }]
    );
  };

  if (!activeOrder) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pedido no encontrado</Text>
      </View>
    );
  }

  // --- CORRECCIÓN 3: Usar (activeOrder.total ?? 0) ---
  const orderTotal = activeOrder.total ?? 0;

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
            {/* --- CORRECCIÓN 3 --- */}
            Total: ${orderTotal.toFixed(2)}
          </Text>
          <Text style={styles.orderInfoText}>
            {/* --- CORRECCIÓN 2 --- */}
            Método de pago: {activeOrder.payment.method === 'EFECTIVO' ? 'Efectivo' : 'Tarjeta'}
          </Text>
        </View>

        {/* Foto de entrega */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>📷 Foto de entrega (obligatorio)</Text>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={handleTakePhoto}
          >
            <Text style={styles.photoButtonText}>Tomar foto de la entrega</Text>
          </TouchableOpacity>
          <Text style={styles.photoNote}>
            Toma una foto que muestre que el pedido fue entregado correctamente
          </Text>
        </View>

        {/* Confirmación según método de pago */}
        {/* --- CORRECCIÓN 2 --- */}
        {activeOrder.payment.method === 'TARJETA' ? (
          <View style={styles.confirmationSection}>
            <Text style={styles.sectionTitle}>💳 PIN del cliente</Text>
            <TextInput
              style={styles.pinInput}
              value={customerPin}
              onChangeText={setCustomerPin}
              placeholder="Ingresa el PIN del cliente"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
            <Text style={styles.confirmationNote}>
              El cliente debe proporcionarte un PIN de 4 dígitos para confirmar la entrega
            </Text>
          </View>
        ) : (
          <View style={styles.confirmationSection}>
            <Text style={styles.sectionTitle}>💵 Monto recibido en efectivo</Text>
            <TextInput
              style={styles.cashInput}
              value={cashReceived}
              onChangeText={setCashReceived}
              placeholder="Monto recibido"
              keyboardType="numeric"
            />
            <Text style={styles.confirmationNote}>
              {/* --- CORRECCIÓN 3 --- */}
              Total a cobrar: ${orderTotal.toFixed(2)}
            </Text>
            {/* --- CORRECCIÓN 3 --- */}
            {parseFloat(cashReceived) > orderTotal && (
              <Text style={styles.changeNote}>
                Cambio a entregar: ${(parseFloat(cashReceived) - orderTotal).toFixed(2)}
              </Text>
            )}
          </View>
        )}

        {/* Instrucciones adicionales */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>📝 Instrucciones</Text>
          <Text style={styles.instructionsText}>
            1. Asegúrate de que el cliente haya recibido todos los items{'\n'}
            2. Toma una foto clara de la entrega{'\n'}
            {/* --- CORRECCIÓN 2 --- */}
            3. {activeOrder.payment.method === 'TARJETA'
              ? 'Solicita el PIN de confirmación al cliente'
              : 'Cobra el monto exacto y entrega el cambio si es necesario'
            }{'\n'}
            4. Confirma la entrega presionando el botón de abajo
          </Text>
        </View>
      </View>

      {/* Botón de completar */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.completeButton, isCompleting && styles.completeButtonDisabled]}
          onPress={handleCompleteOrder}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.completeButtonText}>
              ✅ Confirmar entrega completada
            </Text>
          )}
        </TouchableOpacity>
      </View>
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