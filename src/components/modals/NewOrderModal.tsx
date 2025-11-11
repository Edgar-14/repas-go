import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { Order } from '../../types';
import SimpleIcon from '../ui/SimpleIcon';

interface NewOrderModalProps {
    order: Order | null;
    onAccept: (order: Order) => void;
    onDecline: (order: Order) => void;
}

const NewOrderModal: React.FC<NewOrderModalProps> = ({ order, onAccept, onDecline }) => {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        if (!order) return;

        setTimeLeft(30); // Reset timer when a new order comes in
        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    onDecline(order);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [order, onDecline]);

    if (!order) {
        return null;
    }

    const progress = (timeLeft / 30) * 100;
    const isCash = order.paymentMethod === 'CASH';

    return (
        <Modal
            visible={!!order}
            transparent={true}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.timerBarBackground}>
                        <View style={[styles.timerBarFill, { width: `${progress}%` }]} />
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>¡Nuevo Pedido!</Text>
                        <Text style={styles.subtitle}>Tienes {timeLeft} segundos para aceptar.</Text>
                    </View>

                    <View style={styles.detailsCard}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.businessName}>{order.pickupBusiness}</Text>
                                <View style={[styles.paymentChip, isCash ? styles.cashChip : styles.cardChip]}>
                                   <SimpleIcon type="credit-card" size={12} />
                                   <Text style={[styles.paymentText, isCash ? styles.cashText : styles.cardText]}>
                                       {isCash ? 'Pago en Efectivo' : 'Pago con Tarjeta'}
                                   </Text>
                                </View>
                            </View>
                            <View style={styles.earningsContainer}>
                                <Text style={styles.earningsText}>${(order.totalEarnings || 0).toFixed(2)}</Text>
                                <Text style={styles.distanceText}>2.5 km</Text>
                            </View>
                        </View>
                        <View style={styles.mapContainer}>
                            <Image source={{ uri: "https://picsum.photos/400/200?map" }} style={styles.mapImage} />
                        </View>
                        <View style={styles.addressContainer}>
                            <View style={styles.addressRow}>
                                <SimpleIcon type="home" size={16} />
                                <Text style={styles.addressText} numberOfLines={1}>
                                    <Text style={{fontWeight: 'bold'}}>Recogida:</Text> {order.pickupAddress}
                                </Text>
                            </View>
                            <View style={styles.addressRow}>
                                <SimpleIcon type="home" size={16} />
                                <Text style={styles.addressText} numberOfLines={1}>
                                    <Text style={{fontWeight: 'bold'}}>Entrega:</Text> {order.deliveryAddress}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity onPress={() => onDecline(order)} style={[styles.button, styles.declineButton]}>
                            <SimpleIcon type="close" size={24} />
                            <Text style={styles.buttonText}>Rechazar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onAccept(order)} style={[styles.button, styles.acceptButton]}>
                            <SimpleIcon type="check" size={24} />
                            <Text style={styles.buttonText}>Aceptar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'space-between',
        padding: 24,
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    timerBarBackground: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 4,
    },
    timerBarFill: {
        height: '100%',
        backgroundColor: '#1EE09A',
        borderRadius: 4,
    },
    header: {
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    subtitle: {
        fontSize: 18,
        color: '#E2E8F0',
        marginTop: 8,
    },
    detailsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    businessName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
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
    cashChip: { backgroundColor: 'rgba(74, 222, 128, 0.3)' },
    cardChip: { backgroundColor: 'rgba(96, 165, 250, 0.3)' },
    paymentText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
    cashText: { color: '#DCFCE7' },
    cardText: { color: '#DBEAFE' },
    earningsContainer: {
        alignItems: 'flex-end',
    },
    earningsText: {
        fontWeight: 'bold',
        fontSize: 28,
        color: '#1EE09A',
    },
    distanceText: {
        fontSize: 14,
        color: '#E2E8F0',
    },
    mapContainer: {
        height: 96,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 8,
        overflow: 'hidden',
        marginVertical: 12,
    },
    mapImage: {
        width: '100%',
        height: '100%',
        opacity: 0.5,
    },
    addressContainer: {
        
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 4,
    },
    addressText: {
        color: 'white',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    actionsContainer: {
        flexDirection: 'row',
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineButton: {
        backgroundColor: '#D63031',
        marginRight: 8,
    },
    acceptButton: {
        backgroundColor: '#00B894',
        marginLeft: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 8,
    },
});


export default NewOrderModal;
