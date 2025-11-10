// Pantalla de Registro para BeFast GO - 5 Pasos
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NavigationProps } from '../types';
import { firestore, storage, COLLECTIONS } from '../config/firebase';

interface RegistrationData {
  // Paso 1: Datos Personales y Laborales
  fullName: string;
  phone: string;
  rfc: string;
  curp: string;
  nss: string;
  vehicleType: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlates: string;
  clabe: string;
  
  // Paso 2: Documentos (URIs de archivos)
  ineDocument: string;
  satDocument: string;
  licenseDocument: string;
  vehicleCardDocument: string;
  
  // Paso 3: Aceptación de políticas
  acceptedPolicies: boolean;
  acceptedContract: boolean;
  signature: string;
  
  // Paso 4: Capacitación
  trainingCompleted: boolean;
  quizScore: number;
  equipmentEvidence: string;
}

const RegistrationScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegistrationData>({
    fullName: '',
    phone: '',
    rfc: '',
    curp: '',
    nss: '',
    vehicleType: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehiclePlates: '',
    clabe: '',
    ineDocument: '',
    satDocument: '',
    licenseDocument: '',
    vehicleCardDocument: '',
    acceptedPolicies: false,
    acceptedContract: false,
    signature: '',
    trainingCompleted: false,
    quizScore: 0,
    equipmentEvidence: '',
  });

  const updateFormData = (field: keyof RegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.fullName || !formData.phone || !formData.rfc || 
        !formData.curp || !formData.nss || !formData.vehicleType ||
        !formData.vehicleBrand || !formData.vehicleModel || 
        !formData.vehiclePlates || !formData.clabe) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return false;
    }
    
    // Validar RFC (13 caracteres)
    if (formData.rfc.length !== 13) {
      Alert.alert('Error', 'El RFC debe tener 13 caracteres');
      return false;
    }
    
    // Validar CURP (18 caracteres)
    if (formData.curp.length !== 18) {
      Alert.alert('Error', 'El CURP debe tener 18 caracteres');
      return false;
    }
    
    // Validar NSS (11 dígitos)
    if (formData.nss.length !== 11 || !/^\d+$/.test(formData.nss)) {
      Alert.alert('Error', 'El NSS debe tener 11 dígitos');
      return false;
    }
    
    // Validar CLABE (18 dígitos)
    if (formData.clabe.length !== 18 || !/^\d+$/.test(formData.clabe)) {
      Alert.alert('Error', 'La CLABE debe tener 18 dígitos');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!formData.ineDocument || !formData.satDocument || 
        !formData.licenseDocument || !formData.vehicleCardDocument) {
      Alert.alert('Error', 'Por favor sube todos los documentos requeridos');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.acceptedPolicies || !formData.acceptedContract || !formData.signature) {
      Alert.alert('Error', 'Debes aceptar las políticas y firmar el contrato');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.trainingCompleted || formData.quizScore < 80 || !formData.equipmentEvidence) {
      Alert.alert('Error', 'Debes completar la capacitación, aprobar el cuestionario con al menos 80% y subir evidencia');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
      case 5:
        handleSubmit();
        return;
    }
    
    if (isValid && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Crear solicitud de conductor en Firestore
      const applicationRef = await firestore()
        .collection(COLLECTIONS.DRIVER_APPLICATIONS)
        .add({
          personalData: {
            fullName: formData.fullName,
            phone: formData.phone,
            rfc: formData.rfc,
            curp: formData.curp,
            nss: formData.nss,
          },
          vehicle: {
            type: formData.vehicleType,
            brand: formData.vehicleBrand,
            model: formData.vehicleModel,
            plates: formData.vehiclePlates,
          },
          banking: {
            clabe: formData.clabe,
          },
          documents: {
            ine: formData.ineDocument,
            sat: formData.satDocument,
            license: formData.licenseDocument,
            vehicleCard: formData.vehicleCardDocument,
          },
          legal: {
            acceptedPolicies: formData.acceptedPolicies,
            acceptedContract: formData.acceptedContract,
            signature: formData.signature,
            signedAt: firestore.FieldValue.serverTimestamp(),
          },
          training: {
            completed: formData.trainingCompleted,
            quizScore: formData.quizScore,
            equipmentEvidence: formData.equipmentEvidence,
          },
          status: 'PENDING',
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      
      Alert.alert(
        '¡Solicitud Enviada!',
        'Tu solicitud ha sido enviada exitosamente. Recibirás un email cuando sea revisada.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Paso 1: Datos Personales y Laborales</Text>
      
      <Text style={styles.sectionTitle}>Información Personal</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre Completo *"
        value={formData.fullName}
        onChangeText={(text) => updateFormData('fullName', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Teléfono (10 dígitos) *"
        value={formData.phone}
        onChangeText={(text) => updateFormData('phone', text)}
        keyboardType="phone-pad"
        maxLength={10}
      />
      <TextInput
        style={styles.input}
        placeholder="RFC (13 caracteres) *"
        value={formData.rfc}
        onChangeText={(text) => updateFormData('rfc', text.toUpperCase())}
        maxLength={13}
        autoCapitalize="characters"
      />
      <TextInput
        style={styles.input}
        placeholder="CURP (18 caracteres) *"
        value={formData.curp}
        onChangeText={(text) => updateFormData('curp', text.toUpperCase())}
        maxLength={18}
        autoCapitalize="characters"
      />
      <TextInput
        style={styles.input}
        placeholder="NSS (11 dígitos) *"
        value={formData.nss}
        onChangeText={(text) => updateFormData('nss', text)}
        keyboardType="numeric"
        maxLength={11}
      />
      
      <Text style={styles.sectionTitle}>Información del Vehículo</Text>
      <TextInput
        style={styles.input}
        placeholder="Tipo de Vehículo (Moto, Auto) *"
        value={formData.vehicleType}
        onChangeText={(text) => updateFormData('vehicleType', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Marca *"
        value={formData.vehicleBrand}
        onChangeText={(text) => updateFormData('vehicleBrand', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Modelo *"
        value={formData.vehicleModel}
        onChangeText={(text) => updateFormData('vehicleModel', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Placas *"
        value={formData.vehiclePlates}
        onChangeText={(text) => updateFormData('vehiclePlates', text.toUpperCase())}
        autoCapitalize="characters"
      />
      
      <Text style={styles.sectionTitle}>Información Bancaria</Text>
      <TextInput
        style={styles.input}
        placeholder="CLABE (18 dígitos) *"
        value={formData.clabe}
        onChangeText={(text) => updateFormData('clabe', text)}
        keyboardType="numeric"
        maxLength={18}
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Paso 2: Documentación Legal</Text>
      <Text style={styles.infoText}>
        Sube los siguientes documentos en formato JPG, PNG o PDF (máximo 5MB cada uno)
      </Text>
      
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => {
          // Aquí iría la lógica de subida de archivos
          Alert.alert('Subir Documento', 'Funcionalidad de subida de INE');
          updateFormData('ineDocument', 'ine_documento.pdf');
        }}
      >
        <Text style={styles.uploadButtonText}>
          {formData.ineDocument ? '✅ INE Subida' : '📄 Subir INE'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => {
          Alert.alert('Subir Documento', 'Funcionalidad de subida de Constancia SAT');
          updateFormData('satDocument', 'sat_documento.pdf');
        }}
      >
        <Text style={styles.uploadButtonText}>
          {formData.satDocument ? '✅ Constancia SAT Subida' : '📄 Subir Constancia SAT'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => {
          Alert.alert('Subir Documento', 'Funcionalidad de subida de Licencia');
          updateFormData('licenseDocument', 'licencia_documento.pdf');
        }}
      >
        <Text style={styles.uploadButtonText}>
          {formData.licenseDocument ? '✅ Licencia Subida' : '📄 Subir Licencia de Conducir'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => {
          Alert.alert('Subir Documento', 'Funcionalidad de subida de Tarjeta de Circulación');
          updateFormData('vehicleCardDocument', 'tarjeta_circulacion.pdf');
        }}
      >
        <Text style={styles.uploadButtonText}>
          {formData.vehicleCardDocument ? '✅ Tarjeta de Circulación Subida' : '📄 Subir Tarjeta de Circulación'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Paso 3: Acuerdos Legales y Firma</Text>
      
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[styles.checkbox, formData.acceptedPolicies && styles.checkboxChecked]}
          onPress={() => updateFormData('acceptedPolicies', !formData.acceptedPolicies)}
        >
          {formData.acceptedPolicies && <Text style={styles.checkboxText}>✓</Text>}
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>
          Acepto la Política de Gestión Algorítmica
        </Text>
      </View>
      
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[styles.checkbox, formData.acceptedContract && styles.checkboxChecked]}
          onPress={() => updateFormData('acceptedContract', !formData.acceptedContract)}
        >
          {formData.acceptedContract && <Text style={styles.checkboxText}>✓</Text>}
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>
          Acepto el Contrato de Trabajo como empleado formal
        </Text>
      </View>
      
      <Text style={styles.sectionTitle}>Firma Digital</Text>
      <TouchableOpacity
        style={styles.signatureButton}
        onPress={() => {
          Alert.alert('Firma Digital', 'Funcionalidad de firma digital');
          updateFormData('signature', 'firma_digital_base64');
        }}
      >
        <Text style={styles.signatureButtonText}>
          {formData.signature ? '✅ Firmado' : '✍️ Firmar Digitalmente'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View>
      <Text style={styles.stepTitle}>Paso 4: Capacitación Obligatoria</Text>
      
      <TouchableOpacity
        style={styles.trainingButton}
        onPress={() => {
          Alert.alert('Capacitación', 'Ver videos de capacitación');
          updateFormData('trainingCompleted', true);
        }}
      >
        <Text style={styles.trainingButtonText}>
          {formData.trainingCompleted ? '✅ Videos Vistos' : '📹 Ver Videos de Capacitación'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.trainingButton}
        onPress={() => {
          Alert.alert('Cuestionario', 'Responder cuestionario');
          updateFormData('quizScore', 85);
        }}
      >
        <Text style={styles.trainingButtonText}>
          {formData.quizScore > 0 
            ? `✅ Cuestionario Aprobado (${formData.quizScore}%)` 
            : '📝 Responder Cuestionario'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => {
          Alert.alert('Evidencia', 'Subir foto de equipo de trabajo');
          updateFormData('equipmentEvidence', 'equipo_foto.jpg');
        }}
      >
        <Text style={styles.uploadButtonText}>
          {formData.equipmentEvidence ? '✅ Evidencia Subida' : '📷 Subir Foto de Equipo'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep5 = () => (
    <View>
      <Text style={styles.stepTitle}>Paso 5: Confirmación y Envío</Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen de tu Solicitud</Text>
        <Text style={styles.summaryText}>Nombre: {formData.fullName}</Text>
        <Text style={styles.summaryText}>Teléfono: {formData.phone}</Text>
        <Text style={styles.summaryText}>RFC: {formData.rfc}</Text>
        <Text style={styles.summaryText}>Vehículo: {formData.vehicleType} {formData.vehicleBrand} {formData.vehicleModel}</Text>
        <Text style={styles.summaryText}>Placas: {formData.vehiclePlates}</Text>
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxText}>
          ✅ Tu solicitud será revisada por nuestro equipo.
        </Text>
        <Text style={styles.infoBoxText}>
          📧 Recibirás un email con el resultado de la evaluación.
        </Text>
        <Text style={styles.infoBoxText}>
          ⏱️ El proceso toma de 2 a 5 días hábiles.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registro de Conductor</Text>
        <Text style={styles.headerSubtitle}>Paso {currentStep} de 5</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View
            key={step}
            style={[
              styles.progressStep,
              currentStep >= step && styles.progressStepActive,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === 5 ? 'Enviar Solicitud' : 'Siguiente'}
            </Text>
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
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
  },
  progressBar: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#FF6B35',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  signatureButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  signatureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trainingButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  trainingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  backButton: {
    flex: 1,
    marginRight: 10,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    marginLeft: 10,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  nextButtonFull: {
    marginLeft: 0,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegistrationScreen;
