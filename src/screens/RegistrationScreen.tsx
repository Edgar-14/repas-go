import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// NOTE: For document picking, a library like 'react-native-document-picker' would be needed.
// import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';


const RegistrationScreen: React.FC = () => {
    const navigation = useNavigation();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '', email: '', phone: '', password: '', vehicleType: 'motorcycle',
        vehicleMake: '', vehicleModel: '', vehiclePlate: '', bankAccountHolder: '',
        bankAccountCLABE: '', termsAccepted: false,
        licenseDoc: null as any | null,
        registrationDoc: null as any | null,
        idDoc: null as any | null,
    });

    const handleNext = () => setStep(prev => Math.min(prev + 1, 6));
    const handleBack = () => setStep(prev => Math.max(prev - 1, 1));
    
    const handleInputChange = (name: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFilePick = async (name: string) => {
        // Mock file picker
        const mockFile = { name: `${name}.pdf`, size: 12345, type: 'application/pdf' };
        setFormData(prev => ({ ...prev, [name]: mockFile }));
    };
    
    const handleSubmit = () => {
        console.log('Submitting application:', formData);
        handleNext();
    };

    const FileUpload: React.FC<{ name: string; label: string; file: any | null;}> = ({ name, label, file }) => (
        <View style={[styles.fileUploadContainer, file && styles.fileUploadComplete]}>
            <View style={styles.fileInfo}>
                {file ? <TickCircle size={20} color="#00B894" /> : <DocumentUpload size={20} color="#718096" />}
                <View style={styles.fileTextContainer}>
                    <Text style={styles.fileLabel}>{label}</Text>
                    {file && <Text style={styles.fileName}>{file.name}</Text>}
                </View>
            </View>
            <TouchableOpacity onPress={() => handleFilePick(name)} style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>{file ? 'Cambiar' : 'Subir'}</Text>
            </TouchableOpacity>
        </View>
    );
    
    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                     <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Información Personal</Text>
                        <Text style={styles.stepSubtitle}>Comencemos con tus datos básicos.</Text>
                         <View style={styles.inputContainer}><Profile style={styles.inputIcon} size={20} color="#718096" /><TextInput placeholder="Nombre Completo" value={formData.fullName} onChangeText={v => handleInputChange('fullName', v)} style={styles.input} /></View>
                         <View style={styles.inputContainer}><Sms style={styles.inputIcon} size={20} color="#718096" /><TextInput placeholder="Email" value={formData.email} onChangeText={v => handleInputChange('email', v)} style={styles.input} keyboardType="email-address" /></View>
                         <View style={styles.inputContainer}><Call style={styles.inputIcon} size={20} color="#718096" /><TextInput placeholder="Teléfono" value={formData.phone} onChangeText={v => handleInputChange('phone', v)} style={styles.input} keyboardType="phone-pad" /></View>
                         <View style={styles.inputContainer}><Lock style={styles.inputIcon} size={20} color="#718096" /><TextInput placeholder="Contraseña" value={formData.password} onChangeText={v => handleInputChange('password', v)} style={styles.input} secureTextEntry /></View>
                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}><Text style={styles.nextButtonText}>Siguiente</Text></TouchableOpacity>
                    </View>
                );
            case 2:
                 return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Detalles del Vehículo</Text>
                        <Text style={styles.stepSubtitle}>¿Qué vehículo usarás?</Text>
                        <View style={styles.vehicleOptions}>
                            <TouchableOpacity onPress={() => handleInputChange('vehicleType', 'motorcycle')} style={[styles.vehicleButton, formData.vehicleType === 'motorcycle' && styles.vehicleButtonActive]}><CarIcon size={32} color={formData.vehicleType === 'motorcycle' ? '#00B894' : '#718096'} /><Text>Motocicleta</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleInputChange('vehicleType', 'car')} style={[styles.vehicleButton, formData.vehicleType === 'car' && styles.vehicleButtonActive]}><CarIcon size={32} color={formData.vehicleType === 'car' ? '#00B894' : '#718096'} /><Text>Automóvil</Text></TouchableOpacity>
                        </View>
                        <TextInput placeholder="Marca" value={formData.vehicleMake} onChangeText={v => handleInputChange('vehicleMake', v)} style={styles.input} />
                        <TextInput placeholder="Modelo" value={formData.vehicleModel} onChangeText={v => handleInputChange('vehicleModel', v)} style={styles.input} />
                        <TextInput placeholder="Placa" value={formData.vehiclePlate} onChangeText={v => handleInputChange('vehiclePlate', v)} style={styles.input} />
                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}><Text style={styles.nextButtonText}>Siguiente</Text></TouchableOpacity>
                    </View>
                );
            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Carga de Documentos</Text>
                        <Text style={styles.stepSubtitle}>Necesitamos verificar tu identidad.</Text>
                        <FileUpload name="licenseDoc" label="Licencia de Conducir" file={formData.licenseDoc} />
                        <FileUpload name="registrationDoc" label="Tarjeta de Circulación" file={formData.registrationDoc} />
                        <FileUpload name="idDoc" label="Identificación Oficial (INE)" file={formData.idDoc} />
                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}><Text style={styles.nextButtonText}>Siguiente</Text></TouchableOpacity>
                    </View>
                );
            case 4:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Información de Pago</Text>
                        <Text style={styles.stepSubtitle}>¿Dónde depositaremos tus ganancias?</Text>
                        <View style={styles.inputContainer}><Profile style={styles.inputIcon} size={20} color="#718096" /><TextInput placeholder="Nombre del Titular" value={formData.bankAccountHolder} onChangeText={v => handleInputChange('bankAccountHolder', v)} style={styles.input} /></View>
                        <View style={styles.inputContainer}><MoneyRecive style={styles.inputIcon} size={20} color="#718096" /><TextInput placeholder="CLABE Interbancaria (18 dígitos)" value={formData.bankAccountCLABE} onChangeText={v => handleInputChange('bankAccountCLABE', v)} style={styles.input} keyboardType="number-pad" /></View>
                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}><Text style={styles.nextButtonText}>Siguiente</Text></TouchableOpacity>
                    </View>
                );
            case 5:
                return (
                     <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Revisión Final</Text>
                        <Text style={styles.stepSubtitle}>Confirma que tu información es correcta.</Text>
                        <ScrollView style={styles.reviewBox}>
                            <Text><Text style={{fontWeight: 'bold'}}>Nombre:</Text> {formData.fullName}</Text>
                            <Text><Text style={{fontWeight: 'bold'}}>Email:</Text> {formData.email}</Text>
                            <Text><Text style={{fontWeight: 'bold'}}>Vehículo:</Text> {formData.vehicleMake} {formData.vehicleModel}</Text>
                            <Text><Text style={{fontWeight: 'bold'}}>Placa:</Text> {formData.vehiclePlate}</Text>
                            <Text><Text style={{fontWeight: 'bold'}}>Documentos:</Text> {formData.licenseDoc ? '✅' : '❌'} Licencia, {formData.registrationDoc ? '✅' : '❌'} Tarjeta Circ., {formData.idDoc ? '✅' : '❌'} ID</Text>
                            <Text><Text style={{fontWeight: 'bold'}}>Cuenta:</Text> ****{formData.bankAccountCLABE.slice(-4)}</Text>
                        </ScrollView>
                        <TouchableOpacity style={styles.termsRow} onPress={() => handleInputChange('termsAccepted', !formData.termsAccepted)}>
                           <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>{formData.termsAccepted && <TickSquare size={12} color="#FFFFFF" />}</View>
                           <Text style={styles.termsText}>Acepto los <Text style={styles.linkText}>Términos y Condiciones</Text>.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} disabled={!formData.termsAccepted} style={[styles.nextButton, !formData.termsAccepted && styles.disabledButton]}><Text style={styles.nextButtonText}>Enviar Solicitud</Text></TouchableOpacity>
                    </View>
                );
            case 6:
                return (
                    <View style={styles.stepContainer}>
                         <Send2 size={64} color="#00B894" style={{alignSelf: 'center'}} />
                         <Text style={styles.stepTitle}>Solicitud Enviada</Text>
                        <Text style={styles.stepSubtitle}>Gracias por registrarte. Revisaremos tu información y te notificaremos por correo electrónico en un plazo de 2-3 días hábiles.</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.nextButton}>
                            <Text style={styles.nextButtonText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                );
            default: return null;
        }
    }


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : (step <= 5 ? handleBack() : navigation.goBack())} style={styles.backButton}>
                    <ArrowLeft size={24} color="#2D3748" />
                </TouchableOpacity>
                {step <= 5 && (
                  <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${(step / 5) * 100}%` }]} />
                  </View>
                )}
            </View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              {renderStep()}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    backButton: { padding: 8 },
    progressBarContainer: { flex: 1, height: 10, backgroundColor: '#EDF2F7', borderRadius: 5, marginLeft: 16 },
    progressBar: { height: '100%', backgroundColor: '#00B894', borderRadius: 5 },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    stepContainer: { width: '100%' },
    stepTitle: { fontSize: 28, fontWeight: 'bold', color: '#2D3748', marginBottom: 8, textAlign: 'center' },
    stepSubtitle: { fontSize: 16, color: '#718096', marginBottom: 24, textAlign: 'center' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 16 },
    inputIcon: { position: 'absolute', left: 12 },
    input: { flex: 1, height: 50, paddingLeft: 40, paddingRight: 16, fontSize: 16 },
    nextButton: { backgroundColor: '#00B894', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    nextButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    disabledButton: { backgroundColor: '#A0AEC0' },
    vehicleOptions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    vehicleButton: { flex: 1, padding: 16, borderWidth: 2, borderRadius: 8, alignItems: 'center', borderColor: '#E2E8F0', marginHorizontal: 8 },
    vehicleButtonActive: { borderColor: '#00B894', backgroundColor: 'rgba(0, 184, 148, 0.1)' },
    fileUploadContainer: { width: '100%', padding: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E0', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    fileUploadComplete: { borderColor: '#00B894', borderStyle: 'solid' },
    fileInfo: { flexDirection: 'row', alignItems: 'center' },
    fileTextContainer: { marginLeft: 12 },
    fileLabel: { fontWeight: '600', color: '#2D3748' },
    fileName: { fontSize: 12, color: '#718096' },
    uploadButton: { backgroundColor: '#EDF2F7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    uploadButtonText: { color: '#4A5568', fontWeight: '600' },
    reviewBox: { backgroundColor: '#F7FAFC', padding: 16, borderRadius: 8, maxHeight: 200, marginBottom: 16 },
    termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#CBD5E0', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#00B894', borderColor: '#00B894' },
    termsText: { flex: 1, marginLeft: 12, color: '#718096', fontSize: 14 },
    linkText: { color: '#00B894', fontWeight: '600' },
});

export default RegistrationScreen;
