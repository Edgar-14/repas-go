import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  visible: boolean;
  currentDebt: number;
  creditLimit: number;
  onClose: () => void;
  onLiquidateDebt: () => void;
}

const DebtWarningModal: React.FC<Props> = ({ visible, currentDebt, creditLimit, onClose, onLiquidateDebt }) => {
  const isCritical = currentDebt >= creditLimit;
  const warningThreshold = creditLimit * 0.8; // Advertir cuando la deuda supera el 80% del límite

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.header, isCritical ? styles.criticalHeader : styles.warningHeader]}>
            <MaterialCommunityIcons 
              name={isCritical ? "alert-octagon" : "alert-circle"} 
              color="#FFFFFF" 
              size={28} 
            />
            <Text style={styles.headerText}>
              {isCritical ? '¡Límite de Deuda Excedido!' : 'Advertencia de Deuda'}
            </Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.message}>
              {isCritical
                ? `Tu deuda actual de $${currentDebt.toFixed(2)} MXN ha excedido el límite de $${creditLimit.toFixed(2)} MXN. No podrás aceptar pedidos en efectivo hasta que liquides tu deuda.`
                : `Tu deuda actual es de $${currentDebt.toFixed(2)} MXN. Estás cerca de tu límite de $${creditLimit.toFixed(2)} MXN. Liquida tu deuda pronto para evitar restricciones.`
              }
            </Text>
            <View style={styles.debtInfo}>
              <Text style={styles.debtLabel}>Deuda Actual:</Text>
              <Text style={styles.debtValue}>${currentDebt.toFixed(2)} MXN</Text>
            </View>
            <View style={styles.debtInfo}>
              <Text style={styles.debtLabel}>Límite Permitido:</Text>
              <Text style={styles.debtValue}>${creditLimit.toFixed(2)} MXN</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={onClose}>
              <Text style={styles.btnText}>Entendido</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.liquidateBtn]} onPress={onLiquidateDebt}>
              <Text style={[styles.btnText, styles.liquidateBtnText]}>Liquidar Deuda</Text>
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
  criticalHeader: {
    backgroundColor: '#D32F2F', // Rojo oscuro
  },
  warningHeader: {
    backgroundColor: '#FFA000', // Naranja oscuro
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
  debtInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  debtLabel: {
    fontSize: 15,
    color: '#718096',
    fontWeight: '600',
  },
  debtValue: {
    fontSize: 15,
    color: '#2D3748',
    fontWeight: 'bold',
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
  liquidateBtn: {
    backgroundColor: '#00B894',
  },
  liquidateBtnText: {
    color: '#FFFFFF',
  },
});

export default DebtWarningModal;