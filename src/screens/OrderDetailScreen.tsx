import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { useMockData } from '../hooks/useMockData';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TrackingMap from '../components/map/TrackingMap';
import { RootStackParamList } from '../types';

type OrderDetailsScreenRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;

const OrderDetailsScreen: React.FC = () => {
    const route = useRoute<OrderDetailsScreenRouteProp>();
    const { orderId } = route.params;
    const { getOrderById } = useMockData();
    const navigation = useNavigation();
    const order = orderId ? getOrderById(orderId) : undefined;

    if (!order) {
        return <View style={styles.centered}><Text>Pedido no encontrado.</Text></View>;
    }

    const earnings = [
        { label: 'Tarifa Base', value: order.earningsBreakdown?.baseFare || 0 },
        { label: 'Pago por Distancia', value: order.earningsBreakdown?.distancePay || 0 },
        { label: 'Propina', value: order.earningsBreakdown?.tip || 0 },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3748" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalles del Pedido</Text>
                <TouchableOpacity>
                    <MaterialCommunityIcons name="dots-vertical" size={24} color="#2D3748" />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.earningsBanner}>
                    <Text style={styles.earningsLabel}>Tu Ganancia Total</Text>
                    <Text style={styles.earningsValue}>${(order.totalEarnings || order.estimatedEarnings || 0).toFixed(2)}</Text>
                    <Text style={styles.dateText}>Completado el {order.date ? new Date(order.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} a las {order.date ? new Date(order.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Ruta del Pedido</Text>
                    <View style={styles.mapContainer}>
                         <TrackingMap 
                            orderId={order.id}
                            pickupLocation={order.pickup.location}
                            deliveryLocation={order.delivery.location}
                            driverId={order.driverId}
                            showRoute={true}
                            isPickupPhase={false}
                        />
                    </View>
                    <View style={styles.addressContainer}>
                        <View style={styles.addressRow}>
                            <MaterialCommunityIcons name="office-building" size={20} color="#00B894" />
                            <View style={styles.addressTextContainer}>
                                <Text style={styles.addressLabel}>Punto de Recogida</Text>
                                <Text style={styles.addressValue}>{order.pickupAddress || order.pickup.address}</Text>
                            </View>
                        </View>
                         <View style={styles.addressRow}>
                            <MaterialCommunityIcons name="home" size={20} color="#00B894" />
                            <View style={styles.addressTextContainer}>
                                <Text style={styles.addressLabel}>Punto de Entrega</Text>
                                <Text style={styles.addressValue}>{order.deliveryAddress || order.delivery.address}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                 <View style={styles.card}>
                     <Text style={styles.cardTitle}>Cliente</Text>
                     <View style={styles.customerInfo}>
                         <View style={styles.customerAvatar}>
                            <MaterialCommunityIcons name="account" size={20} color="#00B894" />
                         </View>
                         <Text style={styles.customerName}>{order.customerName || order.customer.name}</Text>
                     </View>
                 </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Desglose de Ganancias</Text>
                    <View>
                        {earnings.map((item, index) => (
                            <View key={index} style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>{item.label}</Text>
                                <Text style={styles.breakdownValue}>${item.value.toFixed(2)}</Text>
                            </View>
                        ))}
                        <View style={styles.divider} />
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownTotalLabel}>Total</Text>
                            <Text style={styles.breakdownTotalValue}>${(order.totalEarnings || order.estimatedEarnings || 0).toFixed(2)}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    scrollContent: {
        padding: 16,
    },
    earningsBanner: {
        backgroundColor: '#00B894',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    earningsLabel: {
        color: 'white',
        opacity: 0.8,
        fontSize: 14,
    },
    earningsValue: {
        color: 'white',
        fontSize: 48,
        fontWeight: 'bold',
    },
    dateText: {
        color: 'white',
        opacity: 0.8,
        fontSize: 12,
        marginTop: 4,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    cardTitle: {
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 12,
        fontSize: 16,
    },
    mapContainer: {
        height: 192,
        backgroundColor: '#E2E8F0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    addressContainer: {
        marginTop: 16,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    addressTextContainer: {
        marginLeft: 12,
    },
    addressLabel: {
        fontSize: 12,
        color: '#A0AEC0',
    },
    addressValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        padding: 12,
        borderRadius: 8,
    },
    customerAvatar: {
        width: 40,
        height: 40,
        backgroundColor: '#E6FFFA',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customerName: {
        fontWeight: '600',
        color: '#4A5568',
        marginLeft: 12,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },
    breakdownLabel: {
        color: '#718096',
        fontSize: 14,
    },
    breakdownValue: {
        fontWeight: '500',
        color: '#2D3748',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#EDF2F7',
        marginVertical: 8,
    },
    breakdownTotalLabel: {
        fontWeight: 'bold',
        color: '#2D3748',
        fontSize: 16,
    },
    breakdownTotalValue: {
        fontWeight: 'bold',
        color: '#00B894',
        fontSize: 18,
    },
});


export default OrderDetailsScreen;
