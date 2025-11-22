import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const EmergencyModal: React.FC<Props> = ({ visible, onClose }) => {
  const callEmergency = () => Linking.openURL('tel:911');
  const callSupport = () => Linking.openURL('tel:+525512345678');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="alert" color="#FFFFFF" size={22} />
            <Text style={styles.headerText}>Emergencia</Text>
          </View>
          <Text style={styles.bodyText}>Selecciona una opción. Te ayudaremos de inmediato.</Text>
          <TouchableOpacity style={[styles.action, styles.emergency]} onPress={callEmergency}>
            <MaterialCommunityIcons name="phone" color="#FFFFFF" size={20} />
            <Text style={styles.actionText}>Llamar al 911</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, styles.support]} onPress={callSupport}>
            <MaterialCommunityIcons name="headset" color="#FFFFFF" size={20} />
            <Text style={styles.actionText}>Contactar Soporte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  card: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' },
  header: { backgroundColor: '#FF3B30', padding: 16, flexDirection: 'row', alignItems: 'center' },
  headerText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  bodyText: { padding: 16, color: '#4A5568' },
  action: { marginHorizontal: 16, marginBottom: 12, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  emergency: { backgroundColor: '#FF3B30' },
  support: { backgroundColor: '#00B894' },
  actionText: { color: '#FFFFFF', fontWeight: '600', marginLeft: 8 },
  close: { alignSelf: 'flex-end', padding: 12 },
  closeText: { color: '#718096', fontWeight: '600' }
});

export default EmergencyModal;
