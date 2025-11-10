// Pantalla de documentos para BeFast GO
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { NavigationProps } from '../types';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'EXPIRED';
  uploadDate: Date;
  expirationDate?: Date;
  rejectionReason?: string;
  url?: string;
}

const DocumentsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const { driver } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    // Simular carga de documentos
    // En la implementación real, esto vendría de Firestore
    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'INE/IFE',
        type: 'identification',
        status: 'APPROVED',
        uploadDate: new Date('2024-01-15'),
        expirationDate: new Date('2029-01-15'),
      },
      {
        id: '2',
        name: 'Licencia de Conducir',
        type: 'license',
        status: 'APPROVED',
        uploadDate: new Date('2024-01-16'),
        expirationDate: new Date('2026-01-16'),
      },
      {
        id: '3',
        name: 'Tarjeta de Circulación',
        type: 'vehicle_registration',
        status: 'APPROVED',
        uploadDate: new Date('2024-01-17'),
        expirationDate: new Date('2025-12-31'),
      },
      {
        id: '4',
        name: 'Constancia de Situación Fiscal',
        type: 'tax_status',
        status: 'PENDING',
        uploadDate: new Date('2024-01-18'),
      },
      {
        id: '5',
        name: 'Comprobante de Domicilio',
        type: 'address_proof',
        status: 'EXPIRED',
        uploadDate: new Date('2023-12-01'),
        expirationDate: new Date('2024-12-01'),
      },
    ];
    
    setDocuments(mockDocuments);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return '#4CAF50';
      case 'PENDING': return '#FF9800';
      case 'REJECTED': return '#F44336';
      case 'EXPIRED': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Aprobado';
      case 'PENDING': return 'En revisión';
      case 'REJECTED': return 'Rechazado';
      case 'EXPIRED': return 'Vencido';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return '✅';
      case 'PENDING': return '⏳';
      case 'REJECTED': return '❌';
      case 'EXPIRED': return '⚠️';
      default: return '📄';
    }
  };

  const getDaysUntilExpiration = (expirationDate?: Date) => {
    if (!expirationDate) return null;
    
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const handleDocumentPress = (document: Document) => {
    if (document.status === 'REJECTED' && document.rejectionReason) {
      Alert.alert(
        'Documento rechazado',
        `Motivo: ${document.rejectionReason}\n\nContacta a soporte para más información sobre cómo corregir este documento.`,
        [
          { text: 'OK' },
          { text: 'Contactar soporte', onPress: () => {} }
        ]
      );
    } else if (document.url) {
      Alert.alert(
        document.name,
        'Opciones del documento',
        [
          { text: 'Ver documento', onPress: () => viewDocument(document) },
          { text: 'Descargar copia', onPress: () => downloadDocument(document) },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert(
        'Documento no disponible',
        'Este documento no está disponible para visualización.',
        [{ text: 'OK' }]
      );
    }
  };

  const viewDocument = (document: Document) => {
    // Aquí se implementaría la visualización del documento
    Alert.alert('Ver documento', `Abriendo ${document.name}...`);
  };

  const downloadDocument = (document: Document) => {
    // Aquí se implementaría la descarga del documento
    Alert.alert('Descargar', `Descargando ${document.name}...`);
  };

  const handleUploadDocument = () => {
    Alert.alert(
      'Subir documento',
      'Los documentos solo pueden ser actualizados a través del portal web de BeFast o contactando a soporte.',
      [
        { text: 'OK' },
        { text: 'Contactar soporte', onPress: () => {} }
      ]
    );
  };

  const renderDocument = (document: Document) => {
    const daysUntilExpiration = getDaysUntilExpiration(document.expirationDate);
    const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 30 && daysUntilExpiration > 0;
    const isExpired = daysUntilExpiration !== null && daysUntilExpiration <= 0;

    return (
      <TouchableOpacity
        key={document.id}
        style={[
          styles.documentCard,
          isExpired && styles.expiredCard,
          isExpiringSoon && styles.expiringSoonCard
        ]}
        onPress={() => handleDocumentPress(document)}
      >
        <View style={styles.documentHeader}>
          <View style={styles.documentLeft}>
            <Text style={styles.documentIcon}>
              {getStatusIcon(document.status)}
            </Text>
            <View style={styles.documentInfo}>
              <Text style={styles.documentName}>{document.name}</Text>
              <Text style={styles.documentUploadDate}>
                Subido: {document.uploadDate.toLocaleDateString()}
              </Text>
              {document.expirationDate && (
                <Text style={[
                  styles.documentExpirationDate,
                  isExpired && styles.expiredText,
                  isExpiringSoon && styles.expiringSoonText
                ]}>
                  Vence: {document.expirationDate.toLocaleDateString()}
                  {daysUntilExpiration !== null && (
                    isExpired 
                      ? ` (Vencido hace ${Math.abs(daysUntilExpiration)} días)`
                      : ` (${daysUntilExpiration} días)`
                  )}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.documentRight}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(document.status) }
            ]}>
              <Text style={styles.statusText}>
                {getStatusText(document.status)}
              </Text>
            </View>
          </View>
        </View>

        {document.status === 'REJECTED' && document.rejectionReason && (
          <View style={styles.rejectionReason}>
            <Text style={styles.rejectionText}>
              Motivo del rechazo: {document.rejectionReason}
            </Text>
          </View>
        )}

        {isExpiringSoon && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ Este documento vence pronto. Renuévalo para evitar interrupciones.
            </Text>
          </View>
        )}

        {isExpired && (
          <View style={styles.expiredBanner}>
            <Text style={styles.expiredBannerText}>
              🔴 Documento vencido. Renuévalo inmediatamente.
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getDocumentsSummary = () => {
    const approved = documents.filter(d => d.status === 'APPROVED').length;
    const pending = documents.filter(d => d.status === 'PENDING').length;
    const rejected = documents.filter(d => d.status === 'REJECTED').length;
    const expired = documents.filter(d => d.status === 'EXPIRED').length;
    const expiringSoon = documents.filter(d => {
      const days = getDaysUntilExpiration(d.expirationDate);
      return days !== null && days <= 30 && days > 0;
    }).length;

    return { approved, pending, rejected, expired, expiringSoon };
  };

  const summary = getDocumentsSummary();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Resumen de documentos */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>📊 Resumen de Documentos</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.approved}</Text>
            <Text style={styles.summaryLabel}>Aprobados</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
              {summary.pending}
            </Text>
            <Text style={styles.summaryLabel}>Pendientes</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: '#F44336' }]}>
              {summary.rejected}
            </Text>
            <Text style={styles.summaryLabel}>Rechazados</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: '#9E9E9E' }]}>
              {summary.expired}
            </Text>
            <Text style={styles.summaryLabel}>Vencidos</Text>
          </View>
        </View>

        {summary.expiringSoon > 0 && (
          <View style={styles.alertCard}>
            <Text style={styles.alertText}>
              ⚠️ Tienes {summary.expiringSoon} documento(s) que vencen en los próximos 30 días
            </Text>
          </View>
        )}
      </View>

      {/* Lista de documentos */}
      <View style={styles.documentsContainer}>
        <Text style={styles.sectionTitle}>📄 Mis Documentos</Text>
        
        {documents.map(renderDocument)}
        
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUploadDocument}
        >
          <Text style={styles.uploadButtonText}>📤 Subir nuevo documento</Text>
        </TouchableOpacity>
      </View>

      {/* Información importante */}
      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>ℹ️ Información Importante</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Documentos requeridos:</Text>
          <Text style={styles.infoText}>
            • INE/IFE vigente{'\n'}
            • Licencia de conducir vigente{'\n'}
            • Tarjeta de circulación del vehículo{'\n'}
            • Constancia de situación fiscal (SAT){'\n'}
            • Comprobante de domicilio (no mayor a 3 meses)
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Importante:</Text>
          <Text style={styles.infoText}>
            • Los documentos son de solo lectura después del registro inicial{'\n'}
            • Para actualizar documentos, contacta a soporte{'\n'}
            • Mantén tus documentos vigentes para evitar suspensiones{'\n'}
            • Recibirás notificaciones antes de que venzan
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  summaryContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertText: {
    fontSize: 14,
    color: '#E65100',
  },
  documentsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  expiredCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  expiringSoonCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentUploadDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  documentExpirationDate: {
    fontSize: 12,
    color: '#666',
  },
  expiredText: {
    color: '#F44336',
    fontWeight: '600',
  },
  expiringSoonText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  documentRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectionReason: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  rejectionText: {
    fontSize: 12,
    color: '#C62828',
  },
  warningBanner: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#E65100',
  },
  expiredBanner: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  expiredBannerText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default DocumentsScreen;