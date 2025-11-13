import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Order, OrderStatus, RootStackParamList } from '../types';
import TrackingMap from '../components/map/TrackingMap';
import CustomerChat from '../components/chat/CustomerChat';
import OrderStatusTimeline from '../components/ui/OrderStatusTimeline';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

type CustomerTrackingScreenRouteProp = RouteProp<RootStackParamList, 'CustomerTracking'>;

const CustomerTrackingScreen: React.FC = () => {
    const route = useRoute<CustomerTrackingScreenRouteProp>();
    const { id } = route.params;
    const [order, setOrder] = useState<Order | null>(null);
    const orderFromStore = useSelector((state: RootState) => {
        const ordersState = (state as any).orders || {};
        const pool = [ordersState.activeOrder, ...(ordersState.availableOrders || []), ...(ordersState.orderHistory || [])].filter(Boolean);
        return pool.find((o: any) => o?.id === id) || null;
    });

    useEffect(() => {
        if (id) {
            if (orderFromStore) {
                setOrder((o: Order | null) => o ? { ...o, status: orderFromStore.status } : orderFromStore);
            } else {
                setOrder(null);
            }
        }
    }, [id, orderFromStore]);


    if (!order) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <Text style={styles.errorText}>Pedido no encontrado o inválido.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                 <Text style={styles.headerTitle}>Sigue tu Pedido</Text>
                 <Text style={styles.headerSubtitle}>#{order.id}</Text>
            </View>
            
            <View style={styles.mapContainer}>
                <TrackingMap 
                    orderId={order.id}
                    pickupLocation={order.pickup.location}
                    deliveryLocation={order.delivery.location}
                    driverId={order.driverId}
                    showRoute={true}
                    isPickupPhase={order.status === OrderStatus.ACCEPTED || order.status === OrderStatus.ASSIGNED}
                />
            </View>

            <ScrollView style={styles.infoCard}>
                <View style={styles.driverInfo}>
                    <View>
                        <Text style={styles.driverLabel}>Repartidor Asignado</Text>
                        <Text style={styles.driverName}>{order?.driverId || '—'}</Text>
                    </View>
                    <TouchableOpacity style={styles.phoneButton}>
                        <MaterialCommunityIcons name="phone" size={20} color="#4A5568" />
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />
                
                <OrderStatusTimeline currentStatus={order.status} />
                
                <CustomerChat order={order} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E2E8F0',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#718096',
        fontSize: 16,
    },
    header: {
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#718096',
    },
    mapContainer: {
        flex: 1,
    },
    infoCard: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '50%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    driverInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    driverLabel: {
        fontSize: 12,
        color: '#A0AEC0',
        textTransform: 'uppercase',
    },
    driverName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    phoneButton: {
        width: 40,
        height: 40,
        backgroundColor: '#EDF2F7',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
});

export default CustomerTrackingScreen;
