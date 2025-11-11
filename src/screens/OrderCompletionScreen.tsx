import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Order, RootStackParamList } from '../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type OrderCompletionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderCompletion'>;
type OrderCompletionScreenRouteProp = RouteProp<RootStackParamList, 'OrderCompletion'>;

const OrderCompletionScreen: React.FC = () => {
    const navigation = useNavigation<OrderCompletionScreenNavigationProp>();
    const route = useRoute<OrderCompletionScreenRouteProp>();
    const { order } = route.params;

    const [photoTaken, setPhotoTaken] = useState(false);
    const [signatureObtained, setSignatureObtained] = useState(false);
    const [pinSent, setPinSent] = useState(false);
    const [customerPin, setCustomerPin] = useState('');
    const [enteredPin, setEnteredPin] = useState('');
    const [pinVerified, setPinVerified] = useState(false);

    const isCash = order.paymentMethod === 'CASH';
    const canComplete = photoTaken && (isCash ? signatureObtained : pinVerified);

    // Generate random 4-digit PIN
    const generatePin = () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    };

    const sendPinToCustomer = () => {
        const pin = generatePin();
        setCustomerPin(pin);
        setPinSent(true);
        // Simulate sending PIN to customer (SMS/WhatsApp/Push notification)
        Alert.alert(
            'PIN Enviado al Cliente',
            `Se ha enviado el PIN ${pin} al cliente ${order.customer?.name || order.customerName}`,
            [{ text: 'OK' }]
        );
    };

    const verifyPin = () => {
        if (enteredPin === customerPin) {
            setPinVerified(true);
            Alert.alert('PIN Correcto', 'El PIN ha sido verificado exitosamente');
        } else {
            Alert.alert('PIN Incorrecto', 'El PIN ingresado no es correcto. Inténtalo de nuevo.');
            setEnteredPin('');
        }
    };

    const handleCompleteOrder = () => {
        if (canComplete) {
            navigation.navigate('OrderRating', { order });
        }
    };

    const VerificationStep: React.FC<{
        icon: React.ElementType;
        title: string;
        subtitle: string;
        isCompleted: boolean;
        onPress: () => void;
        isDisabled?: boolean;
    }> = ({ title, subtitle, isCompleted, onPress, isDisabled = false }) => null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3748" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verificación de Entrega</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.orderInfo}>
                        <View style={styles.mapIconContainer}>
                            <MaterialCommunityIcons name="map-marker" size={32} color="#00B894"/>
                        </View>
                        <View style={styles.orderDetails}>
                            <Text style={styles.orderId}>Pedido #{order.id}</Text>
                            <Text style={styles.customerName}>{order.customerName}</Text>
                            <Text style={styles.address}>{order.deliveryAddress}</Text>
                            <View style={[styles.paymentChip, isCash ? styles.cashChip : styles.cardChip]}>
                               <MaterialCommunityIcons name={isCash ? 'cash' : 'credit-card'} size={12} color={isCash ? '#166534' : '#1E40AF'} />
                               <Text style={[styles.paymentText, isCash ? styles.cashText : styles.cardText]}>{isCash ? 'Pago en Efectivo' : 'Pago con Tarjeta'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => setPhotoTaken(true)}
                    disabled={photoTaken}
                    style={[styles.stepButton, photoTaken && styles.stepCompletedBorder]}
                >
                    <View style={styles.stepContent}>
                        <MaterialCommunityIcons name="camera" size={24} color={photoTaken ? '#00B894' : '#4A5568'} />
                        <View style={styles.stepTextContainer}>
                            <Text style={styles.stepTitle}>Capturar Foto del Paquete</Text>
                            <Text style={styles.stepSubtitle}>Obligatorio</Text>
                        </View>
                    </View>
                    <View style={[styles.checkBox, photoTaken && styles.checkBoxCompleted]}>
                        {photoTaken && <MaterialCommunityIcons name="check" size={16} color="white" />}
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setSignatureObtained(true)}
                    disabled={!isCash || signatureObtained}
                    style={[styles.stepButton, !isCash && styles.stepDisabled, signatureObtained && styles.stepCompletedBorder]}
                >
                    <View style={styles.stepContent}>
                        <MaterialCommunityIcons name="draw" size={24} color={signatureObtained ? '#00B894' : '#4A5568'} />
                        <View style={styles.stepTextContainer}>
                            <Text style={styles.stepTitle}>Obtener Firma de Recibido</Text>
                            <Text style={styles.stepSubtitle}>Si el pago es en efectivo</Text>
                        </View>
                    </View>
                    <View style={[styles.checkBox, signatureObtained && styles.checkBoxCompleted]}>
                        {signatureObtained && <MaterialCommunityIcons name="check" size={16} color="white" />}
                    </View>
                </TouchableOpacity>
                {!isCash && (
                    <View style={styles.pinSection}>
                        <View style={styles.card}>
                            <Text style={styles.pinTitle}>Verificación con PIN del Cliente</Text>
                            <Text style={styles.pinSubtitle}>El cliente recibirá un PIN de 4 dígitos para confirmar la entrega</Text>
                            
                            {!pinSent ? (
                                <TouchableOpacity onPress={sendPinToCustomer} style={styles.sendPinButton}>
                                    <MaterialCommunityIcons name="send" size={16} color="white" />
                                    <Text style={styles.sendPinText}>Enviar PIN al Cliente</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.pinInputSection}>
                                    <Text style={styles.pinSentText}>PIN enviado al cliente</Text>
                                    <View style={styles.pinInputContainer}>
                                        <TextInput
                                            style={styles.pinInput}
                                            value={enteredPin}
                                            onChangeText={setEnteredPin}
                                            placeholder="Ingresa el PIN del cliente"
                                            keyboardType="numeric"
                                            maxLength={4}
                                        />
                                        <TouchableOpacity 
                                            onPress={verifyPin} 
                                            disabled={enteredPin.length !== 4 || pinVerified}
                                            style={[styles.verifyButton, (enteredPin.length !== 4 || pinVerified) && styles.verifyButtonDisabled]}
                                        >
                                            <Text style={styles.verifyButtonText}>Verificar</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {pinVerified && (
                                        <View style={styles.pinVerifiedContainer}>
                                            <MaterialCommunityIcons name="check" size={16} color="#00B894" />
                                            <Text style={styles.pinVerifiedText}>PIN verificado correctamente</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
            
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleCompleteOrder}
                    disabled={!canComplete}
                    style={[styles.completeButton, !canComplete && styles.completeButtonDisabled]}
                >
                    <Text style={styles.completeButtonText}>Completar Entrega</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 16,
    },
    orderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mapIconContainer: {
        width: 64,
        height: 64,
        backgroundColor: '#F0FFF4',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderDetails: {
        marginLeft: 16,
        flex: 1,
    },
    orderId: {
        fontSize: 14,
        color: '#718096',
    },
    customerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    address: {
        fontSize: 14,
        color: '#4A5568',
    },
    paymentChip: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: 'flex-start',
    },
    cashChip: { backgroundColor: '#DCFCE7' },
    cardChip: { backgroundColor: '#DBEAFE' },
    paymentText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
    cashText: { color: '#166534' },
    cardText: { color: '#1E40AF' },
    stepButton: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    stepDisabled: {
        opacity: 0.5,
    },
    stepCompletedBorder: {
        borderColor: '#00B894',
    },
    stepContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepTextContainer: {
        marginLeft: 16,
    },
    stepTitle: {
        fontWeight: 'bold',
        color: '#2D3748',
        fontSize: 16,
    },
    stepSubtitle: {
        fontSize: 14,
        color: '#718096',
    },
    checkBox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CBD5E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkBoxCompleted: {
        backgroundColor: '#00B894',
        borderColor: '#00B894',
    },
    footer: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    completeButton: {
        width: '100%',
        backgroundColor: '#00B894',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    completeButtonDisabled: {
        backgroundColor: '#A0AEC0',
    },
    completeButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    pinSection: {
        marginBottom: 16,
    },
    pinTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 4,
    },
    pinSubtitle: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 16,
    },
    sendPinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    sendPinText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
    },
    pinInputSection: {
        marginTop: 16,
    },
    pinSentText: {
        fontSize: 14,
        color: '#00B894',
        fontWeight: '600',
        marginBottom: 12,
    },
    pinInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pinInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#CBD5E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        textAlign: 'center',
        marginRight: 12,
    },
    verifyButton: {
        backgroundColor: '#00B894',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    verifyButtonDisabled: {
        backgroundColor: '#A0AEC0',
    },
    verifyButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    pinVerifiedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 8,
        backgroundColor: '#F0FDF4',
        borderRadius: 6,
    },
    pinVerifiedText: {
        color: '#00B894',
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default OrderCompletionScreen;
