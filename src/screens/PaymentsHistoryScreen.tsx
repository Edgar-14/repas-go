import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SimpleIcon from '../components/ui/SimpleIcon';
import { auth, firestore, COLLECTIONS } from '../config/firebase';

interface PaymentItem {
  id: string;
  amount: number;
  method: string;
  date: string;
  status: 'Completado' | 'Pendiente' | 'Fallido';
}

const PaymentsHistoryScreen: React.FC = () => {
    const navigation = useNavigation();
    const [payments, setPayments] = useState<PaymentItem[]>([]);

    useEffect(() => {
        const uid = auth().currentUser?.uid;
        if (!uid) { setPayments([]); return; }
        const unsub = firestore()
            .collection(COLLECTIONS.WALLET_TRANSACTIONS)
            .where('driverId', '==', uid)
            .where('type', '==', 'WITHDRAWAL')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot(snap => {
                const list: PaymentItem[] = [];
                snap.forEach(d => {
                    const data: any = d.data();
                    list.push({
                        id: d.id,
                        amount: Math.abs(data.amount || 0),
                        method: data.method === 'bank_transfer' ? 'Transferencia SPEI' : 'Depósito a tarjeta',
                        date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                        status: (data.status === 'COMPLETED' ? 'Completado' : data.status === 'PENDING' ? 'Pendiente' : 'Fallido') as PaymentItem['status'],
                    });
                });
                setPayments(list);
            }, err => {
                console.error('Error loading payments history:', err);
                setPayments([]);
            });
        return () => unsub();
    }, []);

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'Completado': return <SimpleIcon type="check" size={20} color="#22C55E" />;
            case 'Pendiente': return <SimpleIcon type="clock" size={20} color="#F59E0B" />;
            case 'Fallido': return <SimpleIcon type="close" size={20} color="#EF4444" />;
            default: return <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#A0AEC0' }} />;
        }
    };

    const renderItem = ({ item }: { item: PaymentItem }) => (
        <View style={styles.paymentItem}>
            <View style={styles.itemContent}>
                {getStatusIcon(item.status)}
                <View style={styles.itemDetails}>
                    <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
                    <Text style={styles.method}>{item.method}</Text>
                    <Text style={styles.date}>{new Date(item.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                </View>
            </View>
            <Text style={styles.status}>{item.status}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backButton}>
                    <SimpleIcon type="arrow-left" size={24} color="#2D3748" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historial de Pagos</Text>
            </View>

            {payments.length === 0 ? (
                <View style={{ padding: 16 }}>
                    <Text style={{ color: '#4A5568' }}>Aún no hay retiros registrados.</Text>
                </View>
            ) : (
                <FlatList
                    data={payments}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
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
    paymentItem: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemDetails: {
        marginLeft: 16,
    },
    amount: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#2D3748',
    },
    method: {
        fontSize: 14,
        color: '#4A5568',
    },
    date: {
        fontSize: 12,
        color: '#A0AEC0',
    },
    status: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
    },

    separator: {
        height: 1,
        backgroundColor: '#EDF2F7',
    },
});

export default PaymentsHistoryScreen;
