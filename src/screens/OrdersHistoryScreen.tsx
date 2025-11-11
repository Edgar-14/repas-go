import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SimpleIcon from '../components/ui/SimpleIcon';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface Order {
  id: string;
  customerName: string;
  paymentMethod: 'CASH' | 'CARD';
  totalEarnings: number;
  status: string;
}

const OrdersHistoryScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProps>();

    const orders: Order[] = [
        { id: '001', customerName: 'María González', paymentMethod: 'CARD', totalEarnings: 85.50, status: 'COMPLETED' },
        { id: '002', customerName: 'Carlos Rodríguez', paymentMethod: 'CASH', totalEarnings: 92.00, status: 'COMPLETED' },
        { id: '003', customerName: 'Ana Martínez', paymentMethod: 'CARD', totalEarnings: 68.00, status: 'COMPLETED' }
    ];

    const completedOrders = orders.filter(o => o.status === 'COMPLETED');

    const renderItem = ({ item }: { item: Order }) => {
        const isCash = item.paymentMethod === 'CASH';
        return (
            <TouchableOpacity 
                onPress={() => navigation.navigate('OrderDetails', { id: item.id })}
                style={styles.orderItem}
            >
                <View style={styles.itemContent}>
                    <Text style={styles.customerName}>{item.customerName}</Text>
                    <Text style={styles.orderId}>Pedido #{item.id}</Text>
                    <View style={[styles.paymentChip, isCash ? styles.cashChip : styles.cardChip]}>
                        <SimpleIcon 
                            type={isCash ? 'wallet' : 'wallet'} 
                            size={12} 
                            color={isCash ? '#166534' : '#1E40AF'} 
                        />
                        <Text style={[styles.paymentText, isCash ? styles.cashText : styles.cardText]}>
                            {isCash ? 'Efectivo' : 'Tarjeta'}
                        </Text>
                    </View>
                </View>
                <View style={styles.itemRight}>
                    <Text style={styles.earnings}>${item.totalEarnings.toFixed(2)}</Text>
                    <SimpleIcon type="arrow-right" size={20} color="#A0AEC0" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <SimpleIcon type="arrow-left" size={24} color="#2D3748" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historial de Pedidos</Text>
            </View>

            <FlatList
                data={completedOrders}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No tienes pedidos completados.</Text>
                    </View>
                }
            />
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
    listContainer: {
        padding: 16,
    },
    orderItem: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    itemContent: {
        flex: 1,
    },
    customerName: {
        fontWeight: 'bold',
        color: '#2D3748',
        fontSize: 16,
    },
    orderId: {
        fontSize: 14,
        color: '#718096',
    },
    paymentChip: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        alignSelf: 'flex-start',
    },
    cashChip: { backgroundColor: '#DCFCE7' },
    cardChip: { backgroundColor: '#DBEAFE' },
    paymentText: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
    cashText: { color: '#166534' },
    cardText: { color: '#1E40AF' },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    earnings: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#00B894',
        marginRight: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#718096',
        fontSize: 16,
    },
});

export default OrdersHistoryScreen;