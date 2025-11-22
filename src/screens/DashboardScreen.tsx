import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import SimpleIcon from '../components/ui/SimpleIcon';
import { RootState, AppDispatch } from '../store/index';
import { fetchTransactionHistory, listenToWalletBalance } from '../store/slices/walletSlice';
import { updateDriverStatus } from '../store/slices/driverSlice';
import { WalletTransaction, TransactionType } from '../types/index';

const DashboardScreen: React.FC = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();

  const { driver } = useSelector((state: RootState) => state.auth);
  const { balance, transactions, pendingDebts } = useSelector((state: RootState) => state.wallet);
  const { isLoading: isDriverLoading } = useSelector((state: RootState) => state.driver);

  const isOnline = driver?.operational?.status === 'ACTIVE' && driver?.operational?.isOnline;
  const driverStatus = driver?.administrative?.befastStatus || 'PENDING';

  useEffect(() => {
    if (driver?.uid) {
      dispatch(fetchTransactionHistory(driver.uid));
      dispatch(listenToWalletBalance(driver.uid));
    }
  }, [dispatch, driver?.uid]);

  const handleToggleOnline = (): void => {
    if (!driver?.uid || isDriverLoading) return;

    const newStatus = isOnline ? 'OFFLINE' : 'ACTIVE';

    dispatch(
      updateDriverStatus({
        driverId: driver.uid,
        status: newStatus,
        isOnline: !isOnline,
      })
    );
  };

  const { todayOrders, todayEarnings, weekOrders, rating, acceptanceRate } = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    let tOrders = 0;
    let tEarnings = 0;
    let wOrders = 0;

    (transactions || []).forEach((tx: WalletTransaction) => {
      const ts = tx?.timestamp;
      const d: Date = tx?.date
        ? new Date(tx.date)
        : ts && typeof (ts as any).toDate === 'function'
        ? (ts as any).toDate()
        : ts
        ? new Date(ts as any)
        : new Date();

      const type = tx.type;

      if (type === TransactionType.CARD_ORDER_TRANSFER || type === TransactionType.CASH_ORDER_ADEUDO) {
        if (d >= startOfDay) tOrders += 1;
        if (d >= startOfWeek) wOrders += 1;
      }

      if (type === TransactionType.CARD_ORDER_TRANSFER || type === TransactionType.TIP_CARD_TRANSFER) {
        if (d >= startOfDay) {
          tEarnings += Number(tx.amount || 0);
        }
      }
    });

    return {
      todayOrders: tOrders,
      todayEarnings: tEarnings,
      weekOrders: wOrders,
      rating: driver?.kpis?.averageRating ?? driver?.stats?.rating ?? null,
      acceptanceRate: driver?.kpis?.acceptanceRate ?? driver?.stats?.acceptanceRate ?? null,
    };
  }, [transactions, driver?.stats]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <Text style={styles.cardTitle}>Tu Estado</Text>
            <View style={[styles.statusIndicator, isOnline ? styles.online : styles.offline]} />
          </View>
          
          <Text style={styles.driverStatusText}>
            Estado: {driverStatus === 'ACTIVE' ? 'Activo' : driverStatus === 'PENDING' ? 'Pendiente' : 'Inactivo'}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              isOnline ? styles.redButton : styles.greenButton,
              isDriverLoading && styles.disabledButton,
            ]}
            onPress={handleToggleOnline}
            disabled={isDriverLoading || driverStatus !== 'ACTIVE'}
          >
            <View style={styles.statusButtonContent}>
              {isDriverLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <SimpleIcon
                  type={isOnline ? 'pause' : 'play'}
                  size={20}
                  color="white"
                />
              )}
              <Text style={styles.statusButtonText}>
                {isDriverLoading ? 'Actualizando...' : (isOnline ? 'Desconectarse' : 'Conectarse')}
              </Text>
            </View>
          </TouchableOpacity>
          
          {driverStatus !== 'ACTIVE' && (
            <Text style={styles.warningText}>
              Debes estar activo para conectarte
            </Text>
          )}
        </View>

        <View style={styles.metricsContainer}>
          <View style={[styles.card, styles.metricCard]}>
            <Text style={styles.metricValue}>{todayOrders}</Text>
            <Text style={styles.metricLabel}>Pedidos Hoy</Text>
          </View>
          <View style={[styles.card, styles.metricCard]}>
            <Text style={styles.metricValue}>${Number(todayEarnings || 0).toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Ganado Hoy</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.card} onPress={() => navigation?.navigate('Payments')}>
          <View style={styles.walletContainer}>
            <View>
              <Text style={styles.walletLabel}>Saldo Disponible</Text>
              <Text style={styles.walletBalance}>${Number(balance || 0).toFixed(2)}</Text>
              {pendingDebts > 0 && (
                <Text style={styles.debtText}>Deuda: ${Number(pendingDebts).toFixed(2)}</Text>
              )}
            </View>
            <SimpleIcon type="wallet" size={24} color="#00B894" />
          </View>
        </TouchableOpacity>

        {!isOnline && (
          <View style={[styles.card, styles.centeredCard]}>
            <SimpleIcon type="pause" size={48} color="#A0AEC0" />
            <Text style={styles.offlineTitle}>Estás desconectado</Text>
            <Text style={styles.offlineSubtitle}>Conéctate para recibir nuevos pedidos.</Text>
          </View>
        )}

        <View style={styles.widgetsContainer}>
          <View style={[styles.card, styles.widget]}>
            <Text style={styles.widgetTitle}>Calificación</Text>
            <Text style={styles.widgetValue}>{rating != null ? `${rating} ⭐` : '—'}</Text>
            <Text style={styles.widgetSubtext}>{rating != null ? 'Actual' : 'Sin datos'}</Text>
          </View>

          <View style={[styles.card, styles.widget]}>
            <Text style={styles.widgetTitle}>Aceptación</Text>
            <Text style={styles.widgetValue}>{acceptanceRate != null ? `${acceptanceRate}%` : '—'}</Text>
            <Text style={styles.widgetSubtext}>{acceptanceRate != null ? 'Últimos 7 días' : 'Sin datos'}</Text>
          </View>
        </View>

        <View style={styles.widgetsContainer}>
          <View style={[styles.card, styles.widget]}>
            <Text style={styles.widgetTitle}>Pedidos Semana</Text>
            <Text style={styles.widgetValue}>{weekOrders}</Text>
            <Text style={styles.widgetSubtext}>Últimos 7 días</Text>
          </View>

          <View style={[styles.card, styles.widget]}>
            <Text style={styles.widgetTitle}>Tiempo Promedio</Text>
            <Text style={styles.widgetValue}>—</Text>
            <Text style={styles.widgetSubtext}>Por entrega</Text>
          </View>
        </View>

        {isOnline && (
          <View style={[styles.card, styles.centeredCard]}>
            <SimpleIcon type="search" size={48} color="#00B894" />
            <Text style={styles.onlineTitle}>Buscando pedidos...</Text>
            <Text style={styles.onlineSubtitle}>Te notificaremos cuando haya un nuevo pedido.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  statusIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  online: { backgroundColor: '#22c55e' },
  offline: { backgroundColor: '#A0AEC0' },
  statusButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redButton: { backgroundColor: '#D63031' },
  greenButton: { backgroundColor: '#00B894' },
  disabledButton: {
    backgroundColor: '#A0AEC0',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 0.48,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00B894',
  },
  metricLabel: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  walletContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 14,
    color: '#718096',
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 4,
  },
  centeredCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  offlineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  offlineSubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  onlineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00B894',
    marginBottom: 8,
  },
  onlineSubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  widgetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  widget: {
    flex: 0.48,
    alignItems: 'center',
    paddingVertical: 20,
  },
  widgetTitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  widgetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  widgetSubtext: {
    fontSize: 12,
    color: '#00B894',
  },
  driverStatusText: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 12,
    color: '#D63031',
    marginTop: 8,
    textAlign: 'center',
  },
  debtText: {
    fontSize: 12,
    color: '#D63031',
    marginTop: 2,
  },
});

export default DashboardScreen;