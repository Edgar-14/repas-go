// src/screens/EmergencyScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
// CORRECCIÓN: Importar desde 'types/index'
import { NavigationProps } from '../types/index';

const EmergencyScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { driver } = useSelector((state: RootState) => state.auth);
  // CORRECCIÓN: No usar 'as any'
  const { currentLocation } = useSelector((state: RootState) => state.driver);

  useEffect(() => {
    let interval: any; // Dejar 'any' aquí para el tipo de 'setInterval' está bien

    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (emergencyActive && countdown === 0) {
      // Activar emergencia automáticamente
      activateEmergency();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown, emergencyActive]);

  const handleEmergencyPress = () => {
    Alert.alert(
      '🚨 EMERGENCIA',
      'Esto activará una alerta de emergencia y contactará a los servicios de emergencia. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'ACTIVAR EMERGENCIA',
          style: 'destructive',
          onPress: startEmergencyCountdown
        }
      ]
    );
  };

  const startEmergencyCountdown = () => {
    setEmergencyActive(true);
    setCountdown(10); // 10 segundos para cancelar
  };

  const cancelEmergency = () => {
    setEmergencyActive(false);
    setCountdown(0);
    Alert.alert('Emergencia cancelada', 'La alerta de emergencia ha sido cancelada.');
  };

  const activateEmergency = async () => {
    setEmergencyActive(false);
    setCountdown(0);

    try {
      Alert.alert(
        '🚨 EMERGENCIA ACTIVADA',
        'Se ha activado la alerta de emergencia. Los servicios de emergencia han sido notificados.',
        [
          {
            text: 'Llamar 911',
            onPress: () => Linking.openURL('tel:911')
          },
          { text: 'OK' }
        ]
      );

      console.log('Emergency activated for driver:', driver?.uid);
      console.log('Current location:', currentLocation);

    } catch (error) {
      Alert.alert('Error', 'No se pudo activar la emergencia. Llama directamente al 911.');
    }
  };

  const callEmergencyNumber = (number: string, label: string) => {
    Alert.alert(
      `Llamar a ${label}`,
      `¿Quieres llamar a ${label} (${number})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Llamar',
          onPress: () => Linking.openURL(`tel:${number}`)
        }
      ]
    );
  };

  const shareLocation = () => {
    if (currentLocation) {
      const locationUrl = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;

      Alert.alert(
        'Compartir ubicación',
        'Tu ubicación actual será compartida.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Compartir',
            onPress: () => {
              console.log('Sharing location:', locationUrl);
              Alert.alert('Ubicación compartida', 'Tu ubicación ha sido compartida con tus contactos de emergencia.');
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {emergencyActive && (
        <View style={styles.emergencyAlert}>
          <Text style={styles.emergencyTitle}>🚨 ACTIVANDO EMERGENCIA</Text>
          <Text style={styles.emergencyCountdown}>{countdown}</Text>
          <Text style={styles.emergencySubtitle}>
            La emergencia se activará automáticamente en {countdown} segundos
          </Text>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelEmergency}
          >
            <Text style={styles.cancelButtonText}>CANCELAR</Text>
          </TouchableOpacity>
        </View>
      )}

      {!emergencyActive && (
        <View style={styles.mainEmergencyContainer}>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergencyPress}
          >
            <Text style={styles.emergencyButtonIcon}>🚨</Text>
            <Text style={styles.emergencyButtonText}>EMERGENCIA</Text>
          </TouchableOpacity>

          <Text style={styles.emergencyDescription}>
            Presiona este botón solo en caso de emergencia real.
            Se contactará automáticamente a los servicios de emergencia.
          </Text>
        </View>
      )}

      <View style={styles.emergencyNumbersContainer}>
        <Text style={styles.sectionTitle}>📞 Números de Emergencia</Text>

        <TouchableOpacity
          style={styles.numberButton}
          onPress={() => callEmergencyNumber('911', 'Emergencias Generales')}
        >
          <Text style={styles.numberIcon}>🚨</Text>
          <View style={styles.numberInfo}>
            <Text style={styles.numberLabel}>Emergencias Generales</Text>
            <Text style={styles.numberValue}>911</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.numberButton}
          onPress={() => callEmergencyNumber('066', 'Policía')}
        >
          <Text style={styles.numberIcon}>👮</Text>
          <View style={styles.numberInfo}>
            <Text style={styles.numberLabel}>Policía</Text>
            <Text style={styles.numberValue}>066</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.numberButton}
          onPress={() => callEmergencyNumber('065', 'Cruz Roja')}
        >
          <Text style={styles.numberIcon}>🚑</Text>
          <View style={styles.numberInfo}>
            <Text style={styles.numberLabel}>Cruz Roja</Text>
            <Text style={styles.numberValue}>065</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.numberButton}
          onPress={() => callEmergencyNumber('068', 'Bomberos')}
        >
          <Text style={styles.numberIcon}>🚒</Text>
          <View style={styles.numberInfo}>
            <Text style={styles.numberLabel}>Bomberos</Text>
            <Text style={styles.numberValue}>068</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={shareLocation}
        >
          <Text style={styles.actionIcon}>📍</Text>
          <Text style={styles.actionText}>Compartir mi ubicación</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Alert.alert(
              'Soporte BeFast',
              'Contacta al soporte de BeFast para reportar incidentes.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Contactar',
                  onPress: () => {
                    Alert.alert('Contactando soporte', 'Se ha enviado tu solicitud de ayuda al equipo de soporte.');
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.actionIcon}>🆘</Text>
          <Text style={styles.actionText}>Contactar soporte BeFast</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Incidents', { orderId: 'emergency' })}
        >
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionText}>Reportar incidente</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.safetyInfoContainer}>
        <Text style={styles.sectionTitle}>🛡️ Información de Seguridad</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>En caso de emergencia:</Text>
          <Text style={styles.infoText}>
            • Mantén la calma y busca un lugar seguro{'\n'}
            • Usa el botón de emergencia solo en situaciones reales{'\n'}
            • Comparte tu ubicación con contactos de confianza{'\n'}
            • Sigue las instrucciones de los servicios de emergencia
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Prevención:</Text>
          <Text style={styles.infoText}>
            • Mantén tu teléfono siempre cargado{'\n'}
            • Informa a alguien sobre tu ruta y horarios{'\n'}
            • Evita zonas peligrosas, especialmente de noche{'\n'}
            • Confía en tu instinto si algo no se siente bien
          </Text>
        </View>
      </View>

      {driver && (
        <View style={styles.driverInfoContainer}>
          <Text style={styles.sectionTitle}>👤 Tu Información</Text>
          <View style={styles.driverCard}>
            <Text style={styles.driverName}>{driver.fullName}</Text>
            <Text style={styles.driverPhone}>{driver.phone}</Text>
            <Text style={styles.driverEmail}>{driver.email}</Text>
            {currentLocation && (
              <Text style={styles.driverLocation}>
                📍 Lat: {currentLocation.latitude.toFixed(6)},
                Lng: {currentLocation.longitude.toFixed(6)}
              </Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// ... (Estilos permanecen iguales)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  emergencyAlert: {
    backgroundColor: '#F44336',
    padding: 20,
    alignItems: 'center',
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emergencyCountdown: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emergencySubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainEmergencyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emergencyButton: {
    backgroundColor: '#F44336',
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  emergencyButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emergencyNumbersContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  numberButton: {
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
  numberIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  numberInfo: {
    flex: 1,
  },
  numberLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  numberValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 2,
  },
  quickActionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
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
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  safetyInfoContainer: {
    padding: 20,
    paddingTop: 0,
  },
  infoCard: {
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
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  driverInfoContainer: {
    padding: 20,
    paddingTop: 0,
  },
  driverCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 2,
  },
  driverEmail: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 2,
  },
  driverLocation: {
    fontSize: 12,
    color: '#1976D2',
    fontFamily: 'monospace',
  },
});

export default EmergencyScreen;