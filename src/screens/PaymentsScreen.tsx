// Pantalla de billetera y pagos para BeFast GO
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { 
  listenToWalletBalance, 
  fetchTransactionHistory, 
  processWithdrawal,
  payDebt 
} from '../store/slices/walletSlice';
import { NavigationProps, WalletTransaction, TransactionType } from '../types';

const PaymentsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showDebtPaymentModal, setShowDebtPaymentModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [debtPaymentAmount, setDebtPaymentAmount] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const wallet = useSelector((state: RootState) => state.wallet);
  const { balance, pendingDebts, creditLimit, transactions, isLoading } = wallet as any;

  useEffect(() => {
    if (user?.uid) {
      dispatch(listenToWalletBalance(user.uid));
      dispatch(fetchTransactionHistory(user.uid));
    }
  }, [dispatch, user?.uid]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.uid) {
      await dispatch(fetchTransactionHistory(user.uid));
    }
    setRefreshing(false);
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    if (amount < 100) {
      Alert.alert('Error', 'El monto mínimo de retiro es $100 MXN');
      return;
    }

    if (amount > balance) {
      Alert.alert('Error', 'No tienes saldo suficiente');
      return;
    }

    Alert.alert(
      'Confirmar retiro',
      `¿Confirmas el retiro de $${amount.toFixed(2)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            if (user?.uid) {
              try {
                await dispatch(processWithdrawal({
                  driverId: user.uid,
                  amount,
                  method: 'bank_transfer'
                }));
                setShowWithdrawalModal(false);
                setWithdrawalAmount('');
                Alert.alert('Éxito', 'Retiro procesado exitosamente');
              } catch (error) {
                Alert.alert('Error', 'No se pudo procesar el retiro');
              }
            }
          }
        }
      ]
    );
  };

  const handleDebtPayment = async () => {
    const amount = parseFloat(debtPaymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    if (amount > pendingDebts) {
      Alert.alert('Error', 'El monto no puede ser mayor a tu deuda');
      return;
    }

    Alert.alert(
      'Confirmar pago',
      `¿Confirmas el pago de $${amount.toFixed(2)} de tu deuda?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            if (user?.uid) {
              try {
                await dispatch(payDebt({
                  driverId: user.uid,
                  amount,
                  paymentMethod: 'bank_transfer'
                }));
                setShowDebtPaymentModal(false);
                setDebtPaymentAmount('');
                Alert.alert('Éxito', 'Pago procesado exitosamente');
              } catch (error) {
                Alert.alert('Error', 'No se pudo procesar el pago');
              }
            }
          }
        }
      ]
    );
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.CARD_ORDER_TRANSFER: return '💳';
      case TransactionType.CASH_ORDER_ADEUDO: return '💵';
      case TransactionType.TIP_CARD_TRANSFER: return '🎁';
      case TransactionType.DEBT_PAYMENT: return '💸';
      case TransactionType.BENEFITS_TRANSFER: return '🏥';
      case TransactionType.ADJUSTMENT: return '⚖️';
      case TransactionType.PENALTY: return '⚠️';
      case TransactionType.BONUS: return '🎉';
      default: return '💰';
    }
  };

  const getTransactionTitle = (type: TransactionType) => {
    switch (type) {
      case TransactionType.CARD_ORDER_TRANSFER: return 'Ganancia pedido tarjeta';
      case TransactionType.CASH_ORDER_ADEUDO: return 'Deuda pedido efectivo';
      case TransactionType.TIP_CARD_TRANSFER: return 'Propina tarjeta';
      case TransactionType.DEBT_PAYMENT: return 'Pago de deuda';
      case TransactionType.BENEFITS_TRANSFER: return 'Prestaciones IMSS';
      case TransactionType.ADJUSTMENT: return 'Ajuste manual';
      case TransactionType.PENALTY: return 'Penalización';
      case TransactionType.BONUS: return 'Bonificación';
      default: return 'Transacción';
    }
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionIcon}>{getTransactionIcon(item.type)}</Text>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{getTransactionTitle(item.type)}</Text>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.amount >= 0 ? '#4CAF50' : '#F44336' }
      ]}>
        {item.amount >= 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
      </Text>
    </View>
  );

  const availableBalance = balance;
  const canWithdraw = availableBalance >= 100;
  const debtPercentage = (pendingDebts / creditLimit) * 100;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Resumen de billetera */}
      <View style={styles.walletSummary}>
        <Text style={styles.sectionTitle}>💰 Mi Billetera</Text>
        
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balanceAmount}>${availableBalance.toFixed(2)}</Text>
          
          <TouchableOpacity
            style={[styles.withdrawButton, !canWithdraw && styles.withdrawButtonDisabled]}
            onPress={() => setShowWithdrawalModal(true)}
            disabled={!canWithdraw}
          >
            <Text style={styles.withdrawButtonText}>
              {canWithdraw ? 'Retirar' : 'Mínimo $100'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Información de deuda */}
        {pendingDebts > 0 && (
          <View style={styles.debtCard}>
            <View style={styles.debtHeader}>
              <Text style={styles.debtTitle}>Deuda pendiente</Text>
              <Text style={styles.debtAmount}>${pendingDebts.toFixed(2)}</Text>
            </View>
            
            <View style={styles.debtProgress}>
              <View style={styles.debtProgressBar}>
                <View 
                  style={[
                    styles.debtProgressFill, 
                    { 
                      width: `${Math.min(debtPercentage, 100)}%`,
                      backgroundColor: debtPercentage >= 90 ? '#F44336' : '#FF9800'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.debtProgressText}>
                ${(creditLimit - pendingDebts).toFixed(2)} disponible
              </Text>
            </View>

            <TouchableOpacity
              style={styles.payDebtButton}
              onPress={() => setShowDebtPaymentModal(true)}
            >
              <Text style={styles.payDebtButtonText}>Pagar deuda</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Información del sistema dual */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Sistema de Pagos</Text>
          <Text style={styles.infoText}>
            • Pedidos con tarjeta: Ganancia + propina se transfiere a tu billetera
          </Text>
          <Text style={styles.infoText}>
            • Pedidos en efectivo: Cobras directamente, se registra deuda de $15
          </Text>
          <Text style={styles.infoText}>
            • Límite de deuda: $300 MXN
          </Text>
        </View>
      </View>

      {/* Historial de transacciones */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>📋 Historial de Transacciones</Text>
        
        {transactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <Text style={styles.emptyText}>No hay transacciones aún</Text>
            <Text style={styles.emptySubtext}>
              Aquí aparecerán tus ganancias y movimientos
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Modal de retiro */}
      <Modal
        visible={showWithdrawalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Retirar dinero</Text>
            
            <Text style={styles.modalLabel}>Saldo disponible: ${availableBalance.toFixed(2)}</Text>
            
            <TextInput
              style={styles.modalInput}
              value={withdrawalAmount}
              onChangeText={setWithdrawalAmount}
              placeholder="Monto a retirar"
              keyboardType="numeric"
            />
            
            <Text style={styles.modalNote}>Monto mínimo: $100 MXN</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowWithdrawalModal(false);
                  setWithdrawalAmount('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleWithdrawal}
                disabled={isLoading}
              >
                <Text style={styles.modalConfirmText}>
                  {isLoading ? 'Procesando...' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de pago de deuda */}
      <Modal
        visible={showDebtPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDebtPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pagar deuda</Text>
            
            <Text style={styles.modalLabel}>Deuda pendiente: ${pendingDebts.toFixed(2)}</Text>
            
            <TextInput
              style={styles.modalInput}
              value={debtPaymentAmount}
              onChangeText={setDebtPaymentAmount}
              placeholder="Monto a pagar"
              keyboardType="numeric"
            />
            
            <Text style={styles.modalNote}>
              Puedes pagar parcial o totalmente tu deuda
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowDebtPaymentModal(false);
                  setDebtPaymentAmount('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleDebtPayment}
                disabled={isLoading}
              >
                <Text style={styles.modalConfirmText}>
                  {isLoading ? 'Procesando...' : 'Pagar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  walletSummary: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  withdrawButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  withdrawButtonDisabled: {
    backgroundColor: '#CCC',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debtCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debtTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
  },
  debtProgress: {
    marginBottom: 12,
  },
  debtProgressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  debtProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  debtProgressText: {
    fontSize: 14,
    color: '#666',
  },
  payDebtButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payDebtButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
  transactionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  transactionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyTransactions: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  modalNote: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentsScreen;