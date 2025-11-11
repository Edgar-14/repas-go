import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import SimpleIcon from '../components/ui/SimpleIcon';

interface NavigationProps {
  navigation?: {
    navigate: (screen: string) => void;
  };
}

const DashboardScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [todayOrders, setTodayOrders] = useState(3);
  const [todayEarnings, setTodayEarnings] = useState(245.50);
  const [balance, setBalance] = useState(1250.75);

  const handleToggleStatus = () => {
    setIsOnline(!isOnline);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <Text style={styles.cardTitle}>Tu Estado</Text>
            <View style={[styles.statusIndicator, isOnline ? styles.online : styles.offline]} />
          </View>
          <TouchableOpacity
            style={[styles.statusButton, isOnline ? styles.redButton : styles.greenButton]}
            onPress={handleToggleStatus}
          >
            <View style={styles.statusButtonContent}>
              <SimpleIcon 
                type={isOnline ? 'pause' : 'play'} 
                size={20} 
                color="white" 
              />
              <Text style={styles.statusButtonText}>
                {isOnline ? 'Desconectarse' : 'Conectarse'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Metrics */}
        <View style={styles.metricsContainer}>
          <View style={[styles.card, styles.metricCard]}>
            <Text style={styles.metricValue}>{todayOrders}</Text>
            <Text style={styles.metricLabel}>Pedidos Hoy</Text>
          </View>
          <View style={[styles.card, styles.metricCard]}>
            <Text style={styles.metricValue}>${todayEarnings.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Ganado Hoy</Text>
          </View>
        </View>

        {/* Wallet Summary */}
        <TouchableOpacity style={styles.card} onPress={() => navigation?.navigate('Payments')}>
          <View style={styles.walletContainer}>
            <View>
              <Text style={styles.walletLabel}>Saldo Disponible</Text>
              <Text style={styles.walletBalance}>${balance.toFixed(2)}</Text>
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
});

export default DashboardScreen;