// Pantalla de reportar incidentes para BeFast GO
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NavigationProps } from '../types';

interface IncidentsScreenProps extends NavigationProps {
  route: {
    params: {
      orderId: string;
    };
  };
}

const IncidentsScreen: React.FC<IncidentsScreenProps> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incidentTypes = [
    {
      id: 'customer_not_available',
      title: 'Cliente no disponible',
      description: 'El cliente no responde o no está en la ubicación',
      icon: '👤'
    },
    {
      id: 'wrong_address',
      title: 'Dirección incorrecta',
      description: 'La dirección proporcionada es incorrecta o no existe',
      icon: '📍'
    },
    {
      id: 'accident',
      title: 'Accidente',
      description: 'Accidente de tránsito o incidente de seguridad',
      icon: '🚗'
    },
    {
      id: 'vehicle_breakdown',
      title: 'Falla del vehículo',
      description: 'Problema mecánico o falla del vehículo',
      icon: '🔧'
    },
    {
      id: 'order_damaged',
      title: 'Pedido dañado',
      description: 'El pedido se dañó durante el transporte',
      icon: '📦'
    },
    {
      id: 'payment_issue',
      title: 'Problema de pago',
      description: 'Cliente no puede pagar o problema con el método de pago',
      icon: '💳'
    },
    {
      id: 'security_issue',
      title: 'Problema de seguridad',
      description: 'Situación de riesgo o problema de seguridad',
      icon: '🚨'
    },
    {
      id: 'other',
      title: 'Otro',
      description: 'Otro tipo de incidente no listado',
      icon: '❓'
    }
  ];

  const handleSubmitIncident = async () => {
    if (!selectedIncident) {
      Alert.alert('Error', 'Selecciona el tipo de incidente');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Describe el incidente');
      return;
    }

    setIsSubmitting(true);

    try {
      // Aquí se implementaría el envío del reporte
      // Por ahora simulamos el envío
      await new Promise((resolve: any) => setTimeout(resolve, 2000));

      const selectedType = incidentTypes.find(type => type.id === selectedIncident);
      
      Alert.alert(
        'Incidente reportado',
        `Tu reporte de "${selectedType?.title}" ha sido enviado exitosamente. El equipo de soporte se pondrá en contacto contigo pronto.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

      console.log('Incident reported:', {
        orderId,
        type: selectedIncident,
        description,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el reporte. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIncidentType = (incident: typeof incidentTypes[0]) => (
    <TouchableOpacity
      key={incident.id}
      style={[
        styles.incidentCard,
        selectedIncident === incident.id && styles.selectedIncidentCard
      ]}
      onPress={() => setSelectedIncident(incident.id)}
    >
      <View style={styles.incidentHeader}>
        <Text style={styles.incidentIcon}>{incident.icon}</Text>
        <View style={styles.incidentInfo}>
          <Text style={[
            styles.incidentTitle,
            selectedIncident === incident.id && styles.selectedIncidentTitle
          ]}>
            {incident.title}
          </Text>
          <Text style={styles.incidentDescription}>
            {incident.description}
          </Text>
        </View>
        {selectedIncident === incident.id && (
          <Text style={styles.selectedIndicator}>✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reportar Incidente</Text>
          <Text style={styles.subtitle}>
            {orderId !== 'emergency' 
              ? `Pedido #${orderId.slice(-6)}`
              : 'Reporte general'
            }
          </Text>
        </View>

        {/* Tipos de incidente */}
        <View style={styles.incidentTypesContainer}>
          <Text style={styles.sectionTitle}>¿Qué tipo de incidente ocurrió?</Text>
          {incidentTypes.map(renderIncidentType)}
        </View>

        {/* Descripción */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Describe el incidente</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe detalladamente lo que ocurrió..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.descriptionNote}>
            Proporciona todos los detalles posibles para ayudarnos a resolver el problema
          </Text>
        </View>

        {/* Información adicional */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ℹ️ Información importante</Text>
          <Text style={styles.infoText}>
            • Tu reporte será revisado por el equipo de soporte{'\n'}
            • Recibirás una respuesta en las próximas 24 horas{'\n'}
            • Para emergencias, usa el botón de emergencia{'\n'}
            • Mantén tu teléfono disponible por si necesitamos contactarte
          </Text>
        </View>

        {/* Acciones de emergencia */}
        <View style={styles.emergencyContainer}>
          <Text style={styles.emergencyTitle}>🚨 ¿Es una emergencia?</Text>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => navigation.navigate('Emergency')}
          >
            <Text style={styles.emergencyButtonText}>Ir a Emergencia</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Botón de enviar */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedIncident || !description.trim() || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitIncident}
          disabled={!selectedIncident || !description.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Enviar Reporte</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  incidentTypesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedIncidentCard: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF3E0',
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incidentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  incidentInfo: {
    flex: 1,
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedIncidentTitle: {
    color: '#E65100',
  },
  incidentDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedIndicator: {
    fontSize: 20,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  descriptionContainer: {
    padding: 20,
    paddingTop: 0,
  },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  descriptionNote: {
    fontSize: 12,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  emergencyContainer: {
    backgroundColor: '#FFEBEE',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default IncidentsScreen;