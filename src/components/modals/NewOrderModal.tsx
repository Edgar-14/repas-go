import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { acceptOrder } from '../../store/slices/ordersSlice';
import Toast from 'react-native-toast-message';

interface Props {
  visible: boolean;
  data: any;
  onClose: () => void;
}

const toNumber = (v: any, def = 0) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return isNaN(n) ? def : n;
};

const get = (obj: any, keys: string[], def?: any) => {
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k];
  }
  return def;
};

const NewOrderModal: React.FC<Props> = ({ visible, data, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(60);
  const [showCancel, setShowCancel] = React.useState(false);
  const QUICK_CANCEL_REASONS = [
    'Muy lejos del punto de recogida',
    'Tráfico o cierre de calles',
    'Problema con el vehículo',
    'Restaurante saturado o cerrado',
    'Otro'
  ];

  React.useEffect(() => {
    if (!visible) {
      setTimeLeft(60);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onClose(); // Auto-close after 60 seconds
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, onClose]);
  const order = data?.order || data; // soporta payloads variados

  // Campos con tolerancia a nombres distintos en el payload (FCM/Firestore)
  const total = toNumber(get(order, ['total', 'amountTotal', 'grandTotal'], 0));
  const deliveryFee = toNumber(get(order, ['deliveryFee', 'shipping', 'fee'], 0));
  const subtotal = total > 0 ? Math.max(0, total - deliveryFee - toNumber(get(order, ['tip', 'gratuity'], 0))) : toNumber(get(order, ['subtotal'], 0));
  const tip = toNumber(get(order, ['tip', 'gratuity'], 0));
  const paymentMethod = get(order, ['paymentMethod', 'payment', 'payMethod'], 'TARJETA/EFECTIVO');
  const distanceKm = toNumber(get(order, ['distanceKm', 'km', 'distance'], 0));
  const pickupAddress = get(order, ['pickupAddress', 'storeAddress', 'originAddress'], '--');
  const deliveryAddress = get(order, ['deliveryAddress', 'customerAddress', 'destinationAddress'], '--');
  const storeName = get(order, ['storeName', 'merchantName', 'branchName'], 'Restaurante');

  // Cálculo de ganancia estimada para el repartidor según reglas
  // TARJETA: (Total - 15) + 100% propina; EFECTIVO: cobra Total y genera adeudo de $15
  const isCard = String(paymentMethod).toUpperCase().includes('TARJ');
  const befastFee = 15; // fee plano según documento
  const estimatedEarning = isCard ? Math.max(0, total - befastFee) + tip : total; // efectivo: efectivo a cobrar
  const cashDebt = isCard ? 0 : befastFee;

  const handleAccept = async () => {
    if (!order?.id || !user?.uid) return;
    setLoading(true);
    try {
      await dispatch(acceptOrder({ orderId: order.id, driverId: user.uid })).unwrap();
      Toast.show({
        type: 'success',
        text1: '¡Pedido aceptado!',
        text2: 'Dirígete al punto de recogida.',
      });
      Vibration.vibrate(500); // Vibración corta para éxito
      onClose();
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Error al aceptar pedido',
        text2: e.message || 'Intenta de nuevo.',
      });
      Vibration.vibrate([0, 500, 200, 500]); // Patrón de vibración para error
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    Toast.show({
      type: 'info',
      text1: 'Pedido rechazado',
      text2: 'Puedes esperar por otro.',
    });
    Vibration.vibrate(200); // Vibración corta para rechazo
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleReject}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="package-variant-closed" color="#FFFFFF" size={22} />
            <Text style={styles.headerText}>Nuevo pedido disponible</Text>
            <View style={styles.timer}>
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{storeName}</Text>
            <Text style={styles.line}><Text style={styles.label}>Método:</Text> {paymentMethod}</Text>
            <Text style={styles.line}><Text style={styles.label}>Distancia:</Text> {distanceKm ? `${distanceKm.toFixed(2)} km` : '--'}</Text>
            <Text style={[styles.line, styles.addr]} numberOfLines={2}><Text style={styles.label}>Recogida:</Text> {pickupAddress}</Text>
            <Text style={[styles.line, styles.addr]} numberOfLines={2}><Text style={styles.label}>Entrega:</Text> {deliveryAddress}</Text>

            <View style={styles.breakdown}>
              <View style={styles.row}><Text style={styles.label}>Subtotal</Text><Text style={styles.value}>${subtotal.toFixed(2)}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Envío</Text><Text style={styles.value}>${deliveryFee.toFixed(2)}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Propina</Text><Text style={styles.value}>${tip.toFixed(2)}</Text></View>
              <View style={styles.divider} />
              <View style={styles.row}><Text style={[styles.label, styles.totalLabel]}>Total</Text><Text style={styles.total}>${total.toFixed(2)}</Text></View>
            </View>

            <View style={[styles.breakdown, { marginTop: 8 }] }>
              {isCard ? (
                <View style={styles.row}><Text style={styles.label}>Ganancia estimada</Text><Text style={styles.earning}>${estimatedEarning.toFixed(2)}</Text></View>
              ) : (
                <>
                  <View style={styles.row}><Text style={styles.label}>Efectivo a cobrar</Text><Text style={styles.earning}>${estimatedEarning.toFixed(2)}</Text></View>
                  <View style={styles.row}><Text style={styles.label}>Adeudo BeFast (fee)</Text><Text style={styles.value}>${cashDebt.toFixed(2)}</Text></View>
                </>
              )}
            </View>
          </View>
          <View style={styles.actions}>
            {/* El botón de Cancelar pedido se mueve a la pantalla de navegación (pedido en curso) */}
            <TouchableOpacity style={[styles.btn, styles.reject]} onPress={handleReject} disabled={loading}>
              <Text style={styles.btnText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.accept]} onPress={handleAccept} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Asignando…' : 'Aceptar'}</Text>
            </TouchableOpacity>
          </View>
          {/* Respuestas rápidas de cancelación eliminadas en el modal inicial */}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  header: { backgroundColor: '#00B894', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, marginLeft: 8, flex: 1 },
  timer: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timerText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  body: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#2D3748', marginBottom: 6 },
  label: { color: '#718096', fontWeight: '600' },
  line: { color: '#4A5568', marginBottom: 6 },
  addr: { color: '#2D3748' },
  breakdown: { backgroundColor: '#F7FAFC', borderRadius: 12, padding: 12, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 },
  value: { color: '#2D3748', fontWeight: '600' },
  total: { color: '#2D3748', fontWeight: '800' },
  totalLabel: { color: '#2D3748' },
  earning: { color: '#00B894', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 6 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: 4 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  reject: { backgroundColor: '#E2E8F0', marginRight: 8 },
  accept: { backgroundColor: '#00B894', marginLeft: 8 },
  btnText: { color: '#2D3748', fontWeight: '700' },
});

export default NewOrderModal;
