import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import SimpleIcon from '../components/ui/SimpleIcon';

interface NavigationProps {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

const GPSNavigationScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('12 min');
  const [distance, setDistance] = useState('3.2 km');

  // Mock route data
  const route = [
    { latitude: 19.4326, longitude: -99.1332 }, // Current location
    { latitude: 19.4356, longitude: -99.1302 },
    { latitude: 19.4386, longitude: -99.1272 },
    { latitude: 19.4416, longitude: -99.1242 }, // Destination
  ];

  const directions = [
    'Continúa por Av. Insurgentes Sur',
    'Gira a la derecha en Av. Universidad',
    'Gira a la izquierda en Calle Orizaba',
    'Has llegado a tu destino'
  ];

  const handleStartNavigation = () => {
    setIsNavigating(true);
    Alert.alert('Navegación iniciada', 'Sigue las instrucciones de voz y pantalla');
  };

  const handleEndNavigation = () => {
    Alert.alert(
      'Finalizar navegación',
      '¿Estás seguro que deseas finalizar la navegación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Finalizar', 
          onPress: () => {
            setIsNavigating(false);
            navigation?.goBack();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <SimpleIcon type="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Navegación GPS</Text>
          <Text style={styles.headerSubtitle}>{estimatedTime} • {distance}</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Alert.alert('Configuración', 'Opciones de navegación')}
        >
          <SimpleIcon type="cog" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: 19.4326,
            longitude: -99.1332,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
          followsUserLocation
          showsTraffic
        >
          {/* Route polyline */}
          <Polyline
            coordinates={route}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
          
          {/* Destination marker */}
          <Marker
            coordinate={route[route.length - 1]}
            title="Destino"
            description="Dirección de entrega"
          >
            <View style={styles.destinationMarker}>
              <SimpleIcon type="package" size={20} color="#FFFFFF" />
            </View>
          </Marker>
        </MapView>
      </View>

      {/* Navigation Instructions */}
      <View style={styles.instructionsContainer}>
        <View style={styles.currentInstruction}>
          <View style={styles.instructionIcon}>
            <SimpleIcon type="navigation" size={24} color="#007AFF" />
          </View>
          <View style={styles.instructionText}>
            <Text style={styles.instructionTitle}>
              {directions[currentStep]}
            </Text>
            <Text style={styles.instructionDistance}>En 200 metros</Text>
          </View>
        </View>

        {/* Next instruction preview */}
        {currentStep < directions.length - 1 && (
          <View style={styles.nextInstruction}>
            <Text style={styles.nextInstructionText}>
              Después: {directions[currentStep + 1]}
            </Text>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isNavigating ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartNavigation}
          >
            <SimpleIcon type="play" size={20} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Iniciar Navegación</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navigationControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => Alert.alert('Recentrar', 'Mapa recentrado en tu ubicación')}
            >
              <SimpleIcon type="navigation" size={20} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => Alert.alert('Silenciar', 'Instrucciones de voz silenciadas')}
            >
              <SimpleIcon type="bell" size={20} color="#718096" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, styles.endButton]}
              onPress={handleEndNavigation}
            >
              <SimpleIcon type="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation?.navigate('Chat')}
        >
          <SimpleIcon type="message-circle" size={18} color="#00B894" />
          <Text style={styles.quickActionText}>Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation?.navigate('Emergency')}
        >
          <SimpleIcon type="shield-alert" size={18} color="#D63031" />
          <Text style={styles.quickActionText}>Emergencia</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  settingsButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
  },
  destinationMarker: {
    backgroundColor: '#00B894',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currentInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  instructionDistance: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  nextInstruction: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  nextInstructionText: {
    fontSize: 14,
    color: '#718096',
  },
  controlsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#00B894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    backgroundColor: '#F8F9FA',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  endButton: {
    backgroundColor: '#D63031',
    borderColor: '#D63031',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 4,
  },
});

export default GPSNavigationScreen;