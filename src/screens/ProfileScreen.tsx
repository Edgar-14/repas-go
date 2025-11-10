// Pantalla de perfil para BeFast GO
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logoutDriver } from '../store/slices/authSlice';
import { NavigationProps } from '../types';

const ProfileScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { driver } = useSelector((state: RootState) => state.auth);
  const driverState = useSelector((state: RootState) => state.driver);
  const { stats, kpis } = driverState as any;

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => dispatch(logoutDriver())
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#4CAF50';
      case 'APPROVED': return '#FF9800';
      case 'PENDING': return '#FFC107';
      case 'SUSPENDED': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activo';
      case 'APPROVED': return 'Aprobado';
      case 'PENDING': return 'Pendiente';
      case 'SUSPENDED': return 'Suspendido';
      default: return status;
    }
  };

  if (!driver) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error al cargar perfil</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header del perfil */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>👤</Text>
        </View>
        <Text style={styles.name}>{driver.personalData.fullName}</Text>
        <Text style={styles.email}>{driver.email}</Text>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.administrative.befastStatus) }]}>
          <Text style={styles.statusText}>
            {getStatusText(driver.administrative.befastStatus)}
          </Text>
        </View>
      </View>

      {/* Estadísticas principales */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>📊 Mis Estadísticas</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Pedidos totales</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completedOrders}</Text>
            <Text style={styles.statLabel}>Completados</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.rating.toFixed(1)} ⭐</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.totalEarnings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Ganancias totales</Text>
          </View>
        </View>
      </View>

      {/* KPIs de rendimiento */}
      <View style={styles.kpisContainer}>
        <Text style={styles.sectionTitle}>🎯 Indicadores de Rendimiento</Text>
        
        <View style={styles.kpiCard}>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Tasa de aceptación</Text>
            <Text style={[styles.kpiValue, { color: kpis.acceptanceRate >= 85 ? '#4CAF50' : '#FF9800' }]}>
              {kpis.acceptanceRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.kpiProgress}>
            <View style={[styles.kpiProgressFill, { 
              width: `${kpis.acceptanceRate}%`,
              backgroundColor: kpis.acceptanceRate >= 85 ? '#4CAF50' : '#FF9800'
            }]} />
          </View>
          <Text style={styles.kpiNote}>Mínimo requerido: 85%</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Entregas a tiempo</Text>
            <Text style={[styles.kpiValue, { color: kpis.onTimeDeliveryRate >= 90 ? '#4CAF50' : '#FF9800' }]}>
              {kpis.onTimeDeliveryRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.kpiProgress}>
            <View style={[styles.kpiProgressFill, { 
              width: `${kpis.onTimeDeliveryRate}%`,
              backgroundColor: kpis.onTimeDeliveryRate >= 90 ? '#4CAF50' : '#FF9800'
            }]} />
          </View>
          <Text style={styles.kpiNote}>Mínimo requerido: 90%</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiRow}>
            <Text style={styles.kpiLabel}>Tasa de finalización</Text>
            <Text style={[styles.kpiValue, { color: kpis.completionRate >= 95 ? '#4CAF50' : '#FF9800' }]}>
              {kpis.completionRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.kpiProgress}>
            <View style={[styles.kpiProgressFill, { 
              width: `${kpis.completionRate}%`,
              backgroundColor: kpis.completionRate >= 95 ? '#4CAF50' : '#FF9800'
            }]} />
          </View>
          <Text style={styles.kpiNote}>Mínimo requerido: 95%</Text>
        </View>
      </View>

      {/* Información personal */}
      <View style={styles.personalInfoContainer}>
        <Text style={styles.sectionTitle}>👤 Información Personal</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{driver.personalData.phone}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>RFC:</Text>
            <Text style={styles.infoValue}>{driver.personalData.rfc}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CURP:</Text>
            <Text style={styles.infoValue}>{driver.personalData.curp}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>NSS:</Text>
            <Text style={styles.infoValue}>{driver.personalData.nss}</Text>
          </View>
        </View>
      </View>

      {/* Estado administrativo */}
      <View style={styles.adminContainer}>
        <Text style={styles.sectionTitle}>📋 Estado Administrativo</Text>
        
        <View style={styles.adminCard}>
          <View style={styles.adminRow}>
            <Text style={styles.adminLabel}>Estado BeFast:</Text>
            <View style={[styles.adminBadge, { backgroundColor: getStatusColor(driver.administrative.befastStatus) }]}>
              <Text style={styles.adminBadgeText}>
                {getStatusText(driver.administrative.befastStatus)}
              </Text>
            </View>
          </View>
          
          <View style={styles.adminRow}>
            <Text style={styles.adminLabel}>IMSS:</Text>
            <View style={[styles.adminBadge, { 
              backgroundColor: driver.administrative.imssStatus === 'ACTIVO_COTIZANDO' ? '#4CAF50' : '#FF9800' 
            }]}>
              <Text style={styles.adminBadgeText}>
                {driver.administrative.imssStatus === 'ACTIVO_COTIZANDO' ? 'Activo' : 'Pendiente'}
              </Text>
            </View>
          </View>
          
          <View style={styles.adminRow}>
            <Text style={styles.adminLabel}>IDSE Aprobado:</Text>
            <Text style={[styles.adminValue, { 
              color: driver.administrative.idseApproved ? '#4CAF50' : '#F44336' 
            }]}>
              {driver.administrative.idseApproved ? '✅ Sí' : '❌ No'}
            </Text>
          </View>
          
          <View style={styles.adminRow}>
            <Text style={styles.adminLabel}>Documentos:</Text>
            <View style={[styles.adminBadge, { 
              backgroundColor: driver.administrative.documentsStatus === 'APPROVED' ? '#4CAF50' : '#FF9800' 
            }]}>
              <Text style={styles.adminBadgeText}>
                {driver.administrative.documentsStatus === 'APPROVED' ? 'Aprobados' : 'Pendientes'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Opciones del perfil */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => navigation.navigate('Documents')}
        >
          <Text style={styles.optionIcon}>📄</Text>
          <Text style={styles.optionText}>Mis Documentos</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.optionIcon}>⚙️</Text>
          <Text style={styles.optionText}>Configuración</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            Alert.alert(
              'Soporte',
              'Contacta a nuestro equipo de soporte para ayuda.',
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.optionIcon}>🆘</Text>
          <Text style={styles.optionText}>Soporte</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de cerrar sesión */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
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
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  kpisContainer: {
    padding: 20,
    paddingTop: 0,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  kpiProgress: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 4,
  },
  kpiProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  kpiNote: {
    fontSize: 12,
    color: '#666',
  },
  personalInfoContainer: {
    padding: 20,
    paddingTop: 0,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  adminContainer: {
    padding: 20,
    paddingTop: 0,
  },
  adminCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  adminRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  adminLabel: {
    fontSize: 14,
    color: '#666',
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  adminValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  optionArrow: {
    fontSize: 20,
    color: '#CCC',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;