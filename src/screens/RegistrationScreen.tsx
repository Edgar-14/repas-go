// src/screens/RegistrationScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebase';
// CORRECCIÓN: Importar el tipo en lugar de re-definirlo
import {
  createAuthUserIfNeeded,
  uploadDocumentIfAny,
  createOrUpdateApplication,
  RegistrationPayload, // <-- Importar tipo
  refreshEmailVerified,
  sendVerificationEmail
} from '../services/registration';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// --- INICIO DE CORRECCIÓN: Definición de Iconos ---
const User = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="account-outline" size={props.size || 20} color={props.color} style={props.style} />;
const Mail = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="email-outline" size={props.size || 20} color={props.color} style={props.style} />;
const Phone = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="phone-outline" size={props.size || 20} color={props.color} style={props.style} />;
const Lock = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="lock-outline" size={props.size || 20} color={props.color} style={props.style} />;
const Bike = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="motorbike" size={props.size || 32} color={props.color} style={props.style} />;
const Car = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="car-outline" size={props.size || 32} color={props.color} style={props.style} />;
const Banknote = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="bank-outline" size={props.size || 20} color={props.color} style={props.style} />;
const FileUp = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="file-upload-outline" size={props.size || 24} color={props.color} style={props.style} />;
const CheckCircle = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="check-circle" size={props.size || 24} color={props.color} style={props.style} />;
const Check = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="check" size={props.size || 12} color={props.color} style={props.style} />;
const FileText = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="file-document-outline" size={props.size || 20} color={props.color} style={props.style} />;
const Video = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="video-outline" size={props.size || 48} color={props.color} style={props.style} />;
const Send = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="send-outline" size={props.size || 64} color={props.color} style={props.style} />;
const ArrowLeft = (props: { color: string, style?: any, size?: number }) => <MaterialCommunityIcons name="arrow-left" size={props.size || 24} color={props.color} style={props.style} />;
// --- FIN DE CORRECCIÓN ---


const RegistrationScreen: React.FC = () => {
    const navigation = useNavigation();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        // Step 1
        fullName: '', email: '', phone: '', password: '',
        rfc: '', curp: '', nss: '',
        vehicleType: 'motorcycle', vehicleMake: '', vehicleModel: '', vehicleYear: '', vehiclePlate: '',
        bankAccountHolder: '', bankName: '', bankAccountCLABE: '',
        // Step 2
        ineFront: null as any | null,
        ineBack: null as any | null,
        satDoc: null as any | null,
        licenseDoc: null as any | null,
        registrationDoc: null as any | null,
        vehicleInsurance: null as any | null,
        // Step 3
        agreementsAccepted: false,
        // Step 4
        quizAnswer: '',
        equipmentPhoto: null as any | null,
        // Step 5
        termsAccepted: false,
    });
    const isQuizCorrect = formData.quizAnswer === 'B';

    const handleNext = () => setStep(prev => Math.min(prev + 1, 6));
    const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

    const handleInputChange = (name: string, value: string | boolean) => {
        if (name === 'vehicleYear') {
            const numericValue = (value as string).replace(/[^0-9]/g, '');
            if (numericValue.length <= 4) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFilePick = async (name: string) => {
        // Simulación.
        const mockFile = { name: `${name}-seleccionado.pdf`, size: 12345, type: 'application/pdf' };
        setFormData(prev => ({ ...prev, [name]: mockFile }));
    };

    const handleSubmit = async () => {
        try {
            setSubmitError(null);
            setSubmitting(true);

            const user = await createAuthUserIfNeeded(formData.email, formData.password);
            const uid = user.uid;

            let emailVerified = false;
            try {
                emailVerified = await refreshEmailVerified();
            } catch {}

            const ineFrontUrl = await uploadDocumentIfAny(uid, 'ineFront', formData.ineFront);
            const ineBackUrl = await uploadDocumentIfAny(uid, 'ineBack', formData.ineBack);
            const satUrl = await uploadDocumentIfAny(uid, 'sat', formData.satDoc);
            const licenseUrl = await uploadDocumentIfAny(uid, 'license', formData.licenseDoc);
            const circulationCardUrl = await uploadDocumentIfAny(uid, 'circulation', formData.registrationDoc);
            const vehicleInsuranceUrl = await uploadDocumentIfAny(uid, 'vehicleInsurance', formData.vehicleInsurance);
            const equipmentPhotoUrl = await uploadDocumentIfAny(uid, 'equipment', formData.equipmentPhoto);

            // CORRECCIÓN: Usar el tipo importado
            const payload: RegistrationPayload = {
                personalData: {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    rfc: formData.rfc,
                    curp: formData.curp,
                    nss: formData.nss,
                },
                vehicle: {
                    type: formData.vehicleType,
                    make: formData.vehicleMake,
                    model: formData.vehicleModel,
                    year: parseInt(formData.vehicleYear, 10),
                    plate: formData.vehiclePlate,
                },
                bank: {
                    accountHolder: formData.bankAccountHolder,
                    bankName: formData.bankName,
                    clabe: formData.bankAccountCLABE,
                },
                documents: {
                    ineFrontUrl,
                    ineBackUrl,
                    satUrl,
                    licenseUrl,
                    circulationCardUrl,
                    vehicleInsuranceUrl,
                    equipmentPhotoUrl,
                },
                agreements: {
                    accepted: !!formData.agreementsAccepted,
                },
                training: {
                    quizPassed: formData.quizAnswer === 'B' && !!formData.equipmentPhoto,
                },
                meta: { app: 'mobile', emailVerified },
            };

            await createOrUpdateApplication(uid, payload);

            setSubmitting(false);
            setStep(6);
        } catch (e: any) {
            setSubmitting(false);
            setSubmitError(e?.message || 'Error al enviar la solicitud. Inténtalo de nuevo.');
        }
    };

    const FileUpload: React.FC<{ name: string; label: string; file: any | null;}> = ({ name, label, file }) => (
        <View style={[styles.fileUploadContainer, file && styles.fileUploadComplete]}>
            <View style={styles.fileInfo}>
                {file ? <CheckCircle color="#00B894" /> : <FileUp color="#718096" />}
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
                        <Text style={styles.stepTitle}>Datos Personales y Laborales</Text>
                        <Text style={styles.stepSubtitle}>Completa tu información personal, de vehículo y bancaria.</Text>
                        <ScrollView>
                            <Text style={styles.sectionTitle}>Información Personal</Text>
                            <View style={styles.inputContainer}>
                                <User style={styles.inputIcon} color="#A0AEC0" />
                                <TextInput placeholder="Nombre Completo" value={formData.fullName} onChangeText={v => handleInputChange('fullName', v)} style={styles.input} placeholderTextColor="#A0AEC0" />
                            </View>
                            <View style={styles.inputContainer}>
                                <TextInput placeholder="RFC" value={formData.rfc} onChangeText={v => handleInputChange('rfc', v)} style={styles.input} placeholderTextColor="#A0AEC0" />
                            </View>
                            <View style={styles.inputContainer}>
                                <TextInput placeholder="CURP" value={formData.curp} onChangeText={v => handleInputChange('curp', v)} style={styles.input} placeholderTextColor="#A0AEC0" />
                            </View>
                            <View style={styles.inputContainer}>
                                <TextInput placeholder="NSS (Número de Seguro Social)" value={formData.nss} onChangeText={v => handleInputChange('nss', v)} style={styles.input} keyboardType="number-pad" placeholderTextColor="#A0AEC0" />
                            </View>
                            <View style={styles.inputContainer}>
                                <Mail style={styles.inputIcon} color="#A0AEC0" />
                                <TextInput placeholder="Email" value={formData.email} onChangeText={v => handleInputChange('email', v)} style={styles.input} keyboardType="email-address" placeholderTextColor="#A0AEC0" />
                            </View>
                            <View style={styles.inputContainer}>
                                <Phone style={styles.inputIcon} color="#A0AEC0" />
                                <TextInput placeholder="Teléfono" value={formData.phone} onChangeText={v => handleInputChange('phone', v)} style={styles.input} keyboardType="phone-pad" placeholderTextColor="#A0AEC0" />
                            </View>
                            <View style={styles.inputContainer}>
                                <Lock style={styles.inputIcon} color="#A0AEC0" />
                                <TextInput placeholder="Contraseña" value={formData.password} onChangeText={v => handleInputChange('password', v)} style={styles.input} secureTextEntry placeholderTextColor="#A0AEC0" />
                            </View>

                            <Text style={styles.sectionTitle}>Información del Vehículo</Text>
                            <View style={styles.vehicleOptions}>
                                <TouchableOpacity onPress={() => handleInputChange('vehicleType', 'motorcycle')} style={[styles.vehicleButton, formData.vehicleType === 'motorcycle' && styles.vehicleButtonActive]}>
                                    <Bike size={32} color={formData.vehicleType === 'motorcycle' ? '#00B894' : '#2D3748'} />
                                    <Text style={[styles.vehicleText, formData.vehicleType === 'motorcycle' && styles.vehicleTextActive]}>Motocicleta</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleInputChange('vehicleType', 'car')} style={[styles.vehicleButton, formData.vehicleType === 'car' && styles.vehicleButtonActive]}>
                                    <Car size={32} color={formData.vehicleType === 'car' ? '#00B894' : '#2D3748'} />
                                    <Text style={[styles.vehicleText, formData.vehicleType === 'car' && styles.vehicleTextActive]}>Automóvil</Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput placeholder="Marca" value={formData.vehicleMake} onChangeText={v => handleInputChange('vehicleMake', v)} style={styles.input} placeholderTextColor="#A0AEC0" />
                            <TextInput placeholder="Modelo" value={formData.vehicleModel} onChangeText={v => handleInputChange('vehicleModel', v)} style={styles.input} placeholderTextColor="#A0AEC0" />
                            <TextInput placeholder="Año" value={formData.vehicleYear} onChangeText={v => handleInputChange('vehicleYear', v)} style={styles.input} keyboardType="numeric" placeholderTextColor="#A0AEC0" />
                            <TextInput placeholder="Placa" value={formData.vehiclePlate} onChangeText={v => handleInputChange('vehiclePlate', v)} style={styles.input} placeholderTextColor="#A0AEC0" />

                            <Text style={styles.sectionTitle}>Información Bancaria</Text>
                            <View style={styles.inputContainer}>
                                <Banknote style={styles.inputIcon} color="#A0AEC0" />
                                <TextInput placeholder="Nombre del Banco" value={formData.bankName} onChangeText={v => handleInputChange('bankName', v)} style={styles.input} placeholderTextColor="#A0AEC0" />
                            </View>
                            <View style={styles.inputContainer}>
                                <User style={styles.inputIcon} color="#A0AEC0" />
                                <TextInput placeholder="Nombre del Titular" value={formData.bankAccountHolder} onChangeText={v => handleInputChange('bankAccountHolder', v)} style={styles.input} placeholderTextColor="#A0AEC0" />
                            </View>
                            <View style={styles.inputContainer}>
                                <Banknote style={styles.inputIcon} color="#A0AEC0" />
                                <TextInput placeholder="CLABE Interbancaria (18 dígitos)" value={formData.bankAccountCLABE} onChangeText={v => handleInputChange('bankAccountCLABE', v)} style={styles.input} keyboardType="number-pad" placeholderTextColor="#A0AEC0" />
                            </View>
                        </ScrollView>
                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}><Text style={styles.nextButtonText}>Siguiente</Text></TouchableOpacity>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Documentación Legal</Text>
                        <Text style={styles.stepSubtitle}>Sube tus documentos obligatorios.</Text>
                        <FileUpload name="ineFront" label="INE (Anverso)" file={formData.ineFront} />
                        <FileUpload name="ineBack" label="INE (Reverso)" file={formData.ineBack} />
                        <FileUpload name="satDoc" label="Constancia de Situación Fiscal (SAT)" file={formData.satDoc} />
                        <FileUpload name="licenseDoc" label="Licencia de Conducir Vigente" file={formData.licenseDoc} />
                        <FileUpload name="registrationDoc" label="Tarjeta de Circulación" file={formData.registrationDoc} />
                        <FileUpload name="vehicleInsurance" label="Seguro de Vehículo (Opcional)" file={formData.vehicleInsurance} />
                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}><Text style={styles.nextButtonText}>Siguiente</Text></TouchableOpacity>
                    </View>
                );
            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Acuerdos Legales y Firma</Text>
                        <Text style={styles.stepSubtitle}>Revisa y acepta los siguientes documentos para continuar.</Text>
                        <View style={styles.documentList}>
                            <View style={styles.documentItem}><FileText color="#4A5568" /><Text style={styles.documentText}>Política de Gestión Algorítmica</Text></View>
                            <View style={styles.documentItem}><FileText color="#4A5568" /><Text style={styles.documentText}>Instructivo de Llenado</Text></View>
                            <View style={styles.documentItem}><FileText color="#4A5568" /><Text style={styles.documentText}>Contrato de Trabajo</Text></View>
                        </View>
                        <TouchableOpacity style={styles.termsRow} onPress={() => handleInputChange('agreementsAccepted', !formData.agreementsAccepted)}>
                            <View style={[styles.checkbox, formData.agreementsAccepted && styles.checkboxChecked]}>{formData.agreementsAccepted && <Check color="white" size={12}/>}</View>
                            <Text style={styles.termsText}>He leído y firmo de conformidad los documentos listados.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleNext} disabled={!formData.agreementsAccepted} style={[styles.nextButton, !formData.agreementsAccepted && styles.disabledButton]}><Text style={styles.nextButtonText}>Firmar y Continuar</Text></TouchableOpacity>
                    </View>
                );
            case 4:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Capacitación Obligatoria</Text>
                        <Text style={styles.stepSubtitle}>Completa la capacitación para asegurar un servicio de calidad.</Text>
                        <View style={styles.videoPlaceholder}><Video size={48} color="#A0AEC0" /><Text style={styles.videoText}>Video de Capacitación</Text></View>

                        <View style={styles.quizContainer}>
                            <Text style={styles.quizQuestion}>¿Qué es lo primero que debes hacer al llegar al punto de entrega?</Text>
                            <TouchableOpacity onPress={() => handleInputChange('quizAnswer', 'A')} style={styles.quizOption}><View style={[styles.radio, formData.quizAnswer === 'A' && styles.radioChecked]} /><Text style={styles.quizOptionText}>A. Tocar el timbre</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleInputChange('quizAnswer', 'B')} style={styles.quizOption}><View style={[styles.radio, formData.quizAnswer === 'B' && styles.radioChecked]} /><Text style={styles.quizOptionText}>B. Verificar la dirección en la app</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleInputChange('quizAnswer', 'C')} style={styles.quizOption}><View style={[styles.radio, formData.quizAnswer === 'C' && styles.radioChecked]} /><Text style={styles.quizOptionText}>C. Llamar al cliente</Text></TouchableOpacity>
                            {formData.quizAnswer && !isQuizCorrect && <Text style={styles.quizFeedback}>Respuesta incorrecta. Intenta de nuevo.</Text>}
                        </View>

                        <FileUpload name="equipmentPhoto" label="Evidencia de Equipo de Trabajo" file={formData.equipmentPhoto} />
                        <TouchableOpacity onPress={handleNext} disabled={!isQuizCorrect || !formData.equipmentPhoto} style={[styles.nextButton, (!isQuizCorrect || !formData.equipmentPhoto) && styles.disabledButton]}><Text style={styles.nextButtonText}>Siguiente</Text></TouchableOpacity>
                    </View>
                );
            case 5:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Revisión Final</Text>
                        <Text style={styles.stepSubtitle}>Confirma que tu información es correcta.</Text>
                        <ScrollView style={styles.reviewBox}>
                            <Text style={styles.reviewText}><Text style={styles.reviewLabel}>Nombre:</Text> {formData.fullName}</Text>
                            <Text style={styles.reviewText}><Text style={styles.reviewLabel}>Email:</Text> {formData.email}</Text>
                            <Text style={styles.reviewText}><Text style={styles.reviewLabel}>RFC:</Text> {formData.rfc}</Text>
                            <Text style={styles.reviewText}><Text style={styles.reviewLabel}>Vehículo:</Text> {formData.vehicleMake} {formData.vehicleModel} {formData.vehicleYear} ({formData.vehiclePlate})</Text>
                            <Text style={styles.reviewText}><Text style={styles.reviewLabel}>Documentos:</Text> {formData.ineFront && formData.ineBack ? '✅' : '❌'} INE, {formData.satDoc ? '✅' : '❌'} SAT, {formData.licenseDoc ? '✅' : '❌'} Licencia, {formData.registrationDoc ? '✅' : '❌'} T. Circulación</Text>
                            <Text style={styles.reviewText}><Text style={styles.reviewLabel}>Acuerdos:</Text> {formData.agreementsAccepted ? '✅ Firmados' : '❌ Pendientes'}</Text>
                            <Text style={styles.reviewText}><Text style={styles.reviewLabel}>Capacitación:</Text> {isQuizCorrect && formData.equipmentPhoto ? '✅ Completada' : '❌ Incompleta'}</Text>
                            <Text style={styles.reviewText}><Text style={styles.reviewLabel}>Banco:</Text> {formData.bankName} - ****{formData.bankAccountCLABE.slice(-4)}</Text>
                        </ScrollView>
                        <TouchableOpacity style={styles.termsRow} onPress={() => handleInputChange('termsAccepted', !formData.termsAccepted)}>
                            <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>{formData.termsAccepted && <Check color="white" size={12}/>}</View>
                            <Text style={styles.termsText}>Confirmo que toda la información es correcta y acepto los <Text style={styles.linkText}>Términos y Condiciones</Text>.</Text>
                        </TouchableOpacity>
                        <Text style={[styles.reviewText, { marginTop: 8 }]}>Nota: Te enviaremos un correo para verificar tu cuenta. Si no lo ves, revisa tu carpeta de spam.</Text>
                        <TouchableOpacity onPress={() => sendVerificationEmail().catch(() => {})} style={[styles.uploadButton, { alignSelf: 'flex-start', marginTop: 8 }]}>
                            <Text style={styles.uploadButtonText}>Reenviar verificación de correo</Text>
                        </TouchableOpacity>
                        {submitError && <Text style={[styles.quizFeedback, { marginTop: 12 }]}>{submitError}</Text>}
                        <TouchableOpacity onPress={handleSubmit} disabled={!formData.termsAccepted || submitting} style={[styles.nextButton, (!formData.termsAccepted || submitting) && styles.disabledButton]}>
                            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.nextButtonText}>Enviar Solicitud</Text>}
                        </TouchableOpacity>
                    </View>
                );
            case 6:
                return (
                    <View style={styles.stepContainer}>
                        <Send size={64} color="#00B894" style={{alignSelf: 'center'}}/>
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
                    <ArrowLeft color="#2D3748" />
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

// ... (Estilos permanecen iguales)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    backButton: { padding: 8, marginRight: 8 },
    progressBarContainer: { flex: 1, height: 10, backgroundColor: '#EDF2F7', borderRadius: 5, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#00B894', borderRadius: 5 },
    scrollContainer: { flexGrow: 1, justifyContent: 'flex-start', padding: 24, paddingTop: 16 },
    stepContainer: { flex: 1, width: '100%', justifyContent: 'space-between' },
    stepTitle: { fontSize: 28, fontWeight: 'bold', color: '#2D3748', marginBottom: 8, textAlign: 'center' },
    stepSubtitle: { fontSize: 16, color: '#718096', marginBottom: 24, textAlign: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#4A5568', marginTop: 16, marginBottom: 12 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 16 },
    inputIcon: { marginLeft: 12 },
    input: { flex: 1, height: 50, paddingHorizontal: 16, fontSize: 16, color: '#2D3748' },
    nextButton: { backgroundColor: '#00B894', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 16, marginBottom: 16 },
    nextButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    disabledButton: { backgroundColor: '#A0AEC0' },
    vehicleOptions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    vehicleButton: { flex: 1, paddingVertical: 12, borderWidth: 2, borderRadius: 8, alignItems: 'center', borderColor: '#E2E8F0', marginHorizontal: 8, justifyContent: 'center' },
    vehicleButtonActive: { borderColor: '#00B894', backgroundColor: 'rgba(0, 184, 148, 0.1)' },
    vehicleText: { marginTop: 4, color: '#2D3748', fontWeight: '500' },
    vehicleTextActive: { color: '#00B894', fontWeight: '600' },
    fileUploadContainer: { width: '100%', padding: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E0', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    fileUploadComplete: { borderColor: '#00B894', borderStyle: 'solid', backgroundColor: '#F0FFF4' },
    fileInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    fileTextContainer: { marginLeft: 12, flex: 1 },
    fileLabel: { fontWeight: '600', color: '#2D3748', fontSize: 15 },
    fileName: { fontSize: 12, color: '#718096', marginTop: 2 },
    uploadButton: { backgroundColor: '#EDF2F7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
    uploadButtonText: { color: '#4A5568', fontWeight: '600' },
    reviewBox: { backgroundColor: '#F7FAFC', padding: 16, borderRadius: 8, maxHeight: 250, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    reviewText: { fontSize: 14, color: '#4A5568', marginBottom: 6 },
    reviewLabel: { fontWeight: 'bold', color: '#2D3748' },
    termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, marginTop: 16 },
    checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#CBD5E0', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
    checkboxChecked: { backgroundColor: '#00B894', borderColor: '#00B894' },
    termsText: { flex: 1, color: '#718096', fontSize: 14, lineHeight: 20 },
    linkText: { color: '#00B894', fontWeight: '600', textDecorationLine: 'underline' },
    documentList: { backgroundColor: '#F7FAFC', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    documentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    documentText: { marginLeft: 12, color: '#2D3748', fontSize: 16, fontWeight: '500' },
    videoPlaceholder: { height: 180, backgroundColor: '#EDF2F7', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    videoText: { color: '#A0AEC0', marginTop: 8, fontWeight: '500' },
    quizContainer: { backgroundColor: '#F7FAFC', padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    quizQuestion: { fontWeight: '600', color: '#2D3748', marginBottom: 12, fontSize: 15 },
    quizOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    quizOptionText: { color: '#4A5568', fontSize: 15 },
    radio: { width: 20, height: 20, borderWidth: 2, borderRadius: 10, borderColor: '#CBD5E0', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    radioChecked: { borderColor: '#00B894', borderWidth: 6 },
    quizFeedback: { color: '#D63031', fontSize: 13, marginTop: 8, fontWeight: '500' },
});

export default RegistrationScreen;