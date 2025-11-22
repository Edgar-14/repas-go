import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Order } from '../../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onComplete: (completionData: {
    photoUrl?: string;
    signature?: string;
    customerPin?: string;
    cashReceived?: number; // Añadir para el caso de efectivo
  }) => Promise<void>;
}

const OrderCompletionModal: React.FC<Props> = ({ visible, order, onClose, onComplete }) => {
  const [activeTab, setActiveTab] = useState<'photo' | 'signature' | 'pin' | 'cash'>('photo');
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [cashReceived, setCashReceived] = useState(''); // Para el monto en efectivo
  const [isCompleting, setIsCompleting] = useState(false);

  const signatureRef = useRef<SignatureViewRef>(null);

  // Resetear estados al abrir/cerrar el modal
  React.useEffect(() => {
    if (visible) {
      setActiveTab('photo');
      setPhoto(null);
      setSignature(null);
      setPin('');
      setCashReceived('');
    }
  }, [visible]);

  const handleTakePhoto = async () => {
    const result = await launchCamera({ mediaType: 'photo', quality: 0.5 });
    if (result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri || null);
    }
  };

  const handleConfirm = async () => {
    if (!order) return;

    // Validaciones
    if (!photo) {
      Alert.alert('Foto requerida', 'Debes tomar una foto de la entrega.');
      return;
    }

    let completionData: {
      photoUrl?: string;
      signature?: string;
      customerPin?: string;
      cashReceived?: number;
    } = { photoUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-hfkbl.appspot.com/o/delivery-proof%2Fsimulated-photo.jpg?alt=media' }; // Simular URL de foto

    if (activeTab === 'pin') {
      if (pin.length !== 4) {
        Alert.alert('PIN inválido', 'El PIN debe tener 4 dígitos.');
        return;
      }
      completionData.customerPin = pin;
    } else if (activeTab === 'signature') {
      if (!signature) {
        Alert.alert('Firma requerida', 'El cliente debe firmar para confirmar la entrega.');
        return;
      }
      completionData.signature = signature;
    } else if (activeTab === 'cash') {
      const amount = parseFloat(cashReceived);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Monto inválido', 'Ingresa el monto recibido en efectivo.');
        return;
      }
      if (amount < (order.total ?? 0)) {
        Alert.alert('Monto insuficiente', 'El monto recibido no puede ser menor al total del pedido.');
        return;
      }
      completionData.cashReceived = amount;
    }

    setIsCompleting(true);
    try {
      await onComplete(completionData);
      onClose(); // Cerrar modal al completar
    } catch (e) {
      // El error se maneja en la pantalla que llama a onComplete
    } finally {
      setIsCompleting(false);
    }
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'photo':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>1. Foto de Entrega (Obligatoria)</Text>
            <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
              <MaterialCommunityIcons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.photoButtonText}>{photo ? 'Tomar otra foto' : 'Tomar Foto'}</Text>
            </TouchableOpacity>
            {photo && <Image source={{ uri: photo }} style={styles.previewImage} />}
          </View>
        );
      case 'signature':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>2. Firma del Cliente</Text>
            <View style={styles.signatureBox}>
              <SignatureScreen
                ref={signatureRef}
                onOK={(sig) => setSignature(sig)}
                onEmpty={() => setSignature(null)}
                descriptionText="Firma aquí"
                clearText="Limpiar"
                confirmText="Guardar"
                webStyle={`.m-signature-pad--footer {box-shadow:none; margin-top:0;} .m-signature-pad--body {border-radius: 8px;}`}
              />
            </View>
          </View>
        );
      case 'pin':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>2. PIN de Confirmación</Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              placeholder="----"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
            <Text style={styles.pinNote}>El cliente debe proporcionar el PIN de 4 dígitos.</Text>
          </View>
        );
      case 'cash':
        const orderTotal = order?.total ?? 0;
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>2. Monto Recibido en Efectivo</Text>
            <TextInput
              style={styles.cashInput}
              value={cashReceived}
              onChangeText={setCashReceived}
              placeholder="Monto recibido"
              keyboardType="numeric"
            />
            <Text style={styles.cashNote}>Total a cobrar: ${orderTotal.toFixed(2)}</Text>
            {parseFloat(cashReceived) > orderTotal && (
              <Text style={styles.cashNote}>
                Cambio a entregar: ${(parseFloat(cashReceived) - orderTotal).toFixed(2)}
              </Text>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Finalizar Pedido #{order?.id.slice(-6)}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#718096" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'photo' && styles.activeTab]} 
              onPress={() => setActiveTab('photo')}>
              <Text style={[styles.tabText, activeTab === 'photo' && styles.activeTabText]}>Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'signature' && styles.activeTab]} 
              onPress={() => setActiveTab('signature')}>
              <Text style={[styles.tabText, activeTab === 'signature' && styles.activeTabText]}>Firma</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'pin' && styles.activeTab]} 
              onPress={() => setActiveTab('pin')}>
              <Text style={[styles.tabText, activeTab === 'pin' && styles.activeTabText]}>PIN</Text>
            </TouchableOpacity>
            {order?.paymentMethod === 'CASH' && ( // Solo mostrar tab de efectivo si el pago es en efectivo
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'cash' && styles.activeTab]} 
                onPress={() => setActiveTab('cash')}>
                <Text style={[styles.tabText, activeTab === 'cash' && styles.activeTabText]}>Efectivo</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={{ maxHeight: 300 }}>
            {renderTabContent()}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.confirmButton, (isCompleting || !photo) && styles.disabledButton]} 
              onPress={handleConfirm} 
              disabled={isCompleting || !photo}>
              {isCompleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirmar Entrega</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerText: { fontSize: 20, fontWeight: 'bold', color: '#2D3748' },
  tabContainer: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#F7FAFC', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  activeTab: { backgroundColor: '#00B894' },
  tabText: { fontWeight: '600', color: '#718096' },
  activeTabText: { color: '#FFFFFF' },
  tabContent: { minHeight: 250, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  tabTitle: { fontSize: 16, fontWeight: '600', color: '#4A5568', marginBottom: 16 },
  photoButton: { flexDirection: 'row', backgroundColor: '#00B894', padding: 16, borderRadius: 12, alignItems: 'center' },
  photoButtonText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 8 },
  previewImage: { width: 100, height: 100, borderRadius: 12, marginTop: 16 },
  signatureBox: { width: '100%', height: 200, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12 },
  pinInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 24, textAlign: 'center', width: '60%', letterSpacing: 10 },
  pinNote: { fontSize: 12, color: '#A0AEC0', marginTop: 8, textAlign: 'center' },
  cashInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 18, textAlign: 'center', width: '60%' },
  cashNote: { fontSize: 12, color: '#A0AEC0', marginTop: 8, textAlign: 'center' },
  actions: { marginTop: 16 },
  confirmButton: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, alignItems: 'center' },
  disabledButton: { backgroundColor: '#A0AEC0' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default OrderCompletionModal;
