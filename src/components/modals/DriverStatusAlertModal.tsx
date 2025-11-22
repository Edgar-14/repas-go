import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  visible: boolean;
  statusType: 'IMSS' | 'DOCUMENTS' | 'TRAINING' | 'GENERAL';
  message: string;
  onClose: () => void;
  onTakeAction: () => void; // Por ejemplo, navegar a la pantalla de documentos
}

const DriverStatusAlertModal: React.FC<Props> = ({ visible, statusType, message, onClose, onTakeAction }) => {
  if (!visible) return null;

  let iconName: string;
  let headerColor: string;
  let headerText: string;
  let actionButtonText: string;

  switch (statusType) {
    case 'IMSS':
      iconName = "account-alert";
      headerColor = "#D32F2F"; // Rojo
      headerText = "Estatus IMSS Inactivo";
      actionButtonText = "Verificar IMSS";
      break;
    case 'DOCUMENTS':
      iconName = "file-alert";
      headerColor = "#FFA000"; // Naranja
      headerText = "Documentos Pendientes";
      actionButtonText = "Actualizar Documentos";
      break;
    case 'TRAINING':
      iconName = "school-outline";
      headerColor = "#1976D2"; // Azul
      headerText = "Capacitación Pendiente";
      actionButtonText = "Completar Capacitación";
      break;
    default:
      iconName = "information";
      headerColor = "#757575"; // Gris
      headerText = "Alerta Importante";
      actionButtonText = "Ver Detalles";
      break;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.header, { backgroundColor: headerColor }]}>
            <MaterialCommunityIcons 
              name={iconName} 
              color="#FFFFFF" 
              size={28} 
            />
            <Text style={styles.headerText}>{headerText}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.message}>
              {message}
            </Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={onClose}>
              <Text style={styles.btnText}>Entendido</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.actionBtn]} onPress={onTakeAction}>
              <Text style={[styles.btnText, styles.actionBtnText]}>{actionButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 12,
  },
  body: {
    padding: 20,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    marginHorizontal: 5,
  },
  btnText: {
    color: '#2D3748',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionBtn: {
    backgroundColor: '#00B894',
  },
  actionBtnText: {
    color: '#FFFFFF',
  },
});

export default DriverStatusAlertModal;