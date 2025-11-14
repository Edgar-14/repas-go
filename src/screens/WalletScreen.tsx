// src/screens/WalletScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList, TransactionType, WalletTransaction } from '../types/index'; // Importar tipos unificados
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store'; // Importar AppDispatch
import { fetchTransactionHistory, listenToWalletBalance } from '../store/slices/walletSlice';

// --- INICIO DE CORRECCIÓN DE ICONOS ---
// Definir los iconos que faltaban usando MaterialCommunityIcons
const ArrowLeft = (props: { color: string, size?: number }) => <MaterialCommunityIcons name="arrow-left" size={props.size || 24} color={props.color} />;
const WalletIcon = (props: { color: string, size?: number }) => <MaterialCommunityIcons name="wallet" size={props.size || 24} color={props.color} />;
const Wifi = (props: { color: string, size?: number }) => <MaterialCommunityIcons name="wifi" size={props.size || 24} color={props.color} />;
const Lock = (props: { color: string, size?: number }) => <MaterialCommunityIcons name="lock" size={props.size || 24} color={props.color} />;
const AlertCircle = (props: { color: string, size?: number }) => <MaterialCommunityIcons name="alert-circle-outline" size={props.size || 24} color={props.color} />;
const Clock = (props: { color: string, size?: number }) => <MaterialCommunityIcons name="clock-outline" size={props.size || 24} color={props.color} />;
const ShoppingBag = (props: { color: string, size?: number }) => <MaterialCommunityIcons name="shopping-outline" size={props.size || 24} color={props.color} />;
const Gift = (props: { color: string, size?: number }) => <MaterialCommunityIcons name="gift-outline" size={props.size || 24} color={props.color} />;
const ArrowUpCircle = (props: { color: string, size?: number }) => <MaterialCommunityIcons name="arrow-up-circle-outline" size={props.size || 24} color={props.color} />;
const ArrowDownCircle = (props: { color: string, size?: number }) => <MaterialCommunityIcons name="arrow-down-circle-outline" size={props.size || 24} color={props.color} />;
const DollarSign = (props: { color: string, size?: number }) => <MaterialCommunityIcons name="currency-usd" size={props.size || 24} color={props.color} />;
// --- FIN DE CORRECCIÓN DE ICONOS ---

type WalletScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Wallet'>;

const WalletScreen: React.FC = () => {
    // CORRECCIÓN: Usar AppDispatch y RootState
    const dispatch = useDispatch<AppDispatch>();
    const driver = useSelector((state: RootState) => state.auth.driver);
    const { balance, pendingDebts, transactions } = useSelector((state: RootState) => state.wallet);
    const navigation = useNavigation<WalletScreenNavigationProp>();

    useEffect(() => {
        // CORRECCIÓN: Quitar (driver as any)
        const driverId = driver?.uid;
        if (!driverId) return;
        // CORRECCIÓN: Quitar 'as any' de los dispatch
        dispatch(fetchTransactionHistory(driverId));
        dispatch(listenToWalletBalance(driverId));
    }, [dispatch, driver]);

    const transactionIcons = {
        [TransactionType.CARD_ORDER_TRANSFER]: { icon: ShoppingBag, color: '#3B82F6' },
        [TransactionType.TIP_CARD_TRANSFER]: { icon: Gift, color: '#F59E0B' },
        [TransactionType.DEBT_PAYMENT]: { icon: ArrowUpCircle, color: '#22C55E' },
        [TransactionType.CASH_ORDER_ADEUDO]: { icon: ArrowDownCircle, color: '#EF4444' },
        [TransactionType.WITHDRAWAL]: { icon: DollarSign, color: '#8B5CF6' },
        // Añadir fallbacks para otros tipos
        [TransactionType.ADJUSTMENT]: { icon: DollarSign, color: '#718096' },
        [TransactionType.BENEFITS_TRANSFER]: { icon: ArrowUpCircle, color: '#22C55E' },
        [TransactionType.BONUS]: { icon: Gift, color: '#F59E0B' },
        [TransactionType.PENALTY]: { icon: ArrowDownCircle, color: '#EF4444' },
    };

    const getTransactionIcon = (type: TransactionType) => {
        return transactionIcons[type] || { icon: DollarSign, color: '#718096' };
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#2D3748" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Billetera</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.walletCard}>
                    <View style={styles.walletCardHeader}>
                        <WalletIcon color="white" size={32} />
                        <Wifi color="white" size={24} />
                    </View>
                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Saldo Disponible</Text>
                        <Text style={styles.balanceAmount}>${Number(balance || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.walletCardFooter}>
                        <Text style={styles.cardBrand}>BEFASTGO CARD</Text>
                        <Lock color="white" size={20} />
                    </View>
                </View>

                <View style={[styles.card, styles.debtCard]}>
                    <View>
                        <Text style={styles.debtLabel}>Deuda Pendiente</Text>
                        <Text style={styles.debtAmount}>${Number(pendingDebts || 0).toFixed(2)}</Text>
                    </View>
                    <AlertCircle color="#D63031" size={28} />
                </View>

                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PaymentsHistory')}>
                     <View style={styles.historyButton}>
                        <Text style={styles.historyButtonText}>Historial de Pagos</Text>
                        <Clock size={20} color="#00B894" />
                    </View>
                </TouchableOpacity>

                <View style={styles.card}>
                     <Text style={styles.activityTitle}>Actividad Reciente</Text>
                    {transactions.slice(0, 5).map((tx: WalletTransaction) => {
                        // CORRECCIÓN: Usar la función getTransactionIcon para evitar crashes
                        const { icon: Icon, color } = getTransactionIcon(tx.type);
                        const isPositive = tx.type !== TransactionType.CASH_ORDER_ADEUDO && tx.type !== TransactionType.WITHDRAWAL && tx.type !== TransactionType.PENALTY;

                        // CORRECCIÓN: Manejar timestamp de Firestore o string de fecha
                        const date = tx.timestamp ? (tx.timestamp as any).toDate ? (tx.timestamp as any).toDate().toLocaleDateString() : new Date(tx.timestamp as any).toLocaleDateString() : tx.date;

                        return (
                            <View key={tx.id} style={styles.transactionItem}>
                                <View style={styles.transactionLeft}>
                                    <Icon color={color} size={24} />
                                    <View style={styles.transactionDetails}>
                                        <Text style={styles.transactionDesc}>{tx.description}</Text>
                                        <Text style={styles.transactionDate}>{date}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.transactionAmount, isPositive ? styles.amountPositive : styles.amountNegative]}>
                                    {isPositive ? '+' : ''}${tx.amount.toFixed(2)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.footerButton, styles.secondaryButton]}>
                    <Text style={[styles.footerButtonText, styles.secondaryButtonText]}>Pagar Deuda</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.footerButton, styles.primaryButton]}
                    onPress={() => navigation.navigate('Withdrawal')} // CORRECCIÓN: Navegar a pantalla de retiro
                >
                    <Text style={[styles.footerButtonText, styles.primaryButtonText]}>Solicitar Retiro</Text>
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
        paddingBottom: 100,
    },
    walletCard: {
        backgroundColor: '#00B894',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    walletCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    balanceContainer: { marginTop: 16 },
    balanceLabel: { color: 'white', opacity: 0.8, fontSize: 14 },
    balanceAmount: { color: 'white', fontSize: 36, fontWeight: 'bold', letterSpacing: 1 },
    walletCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24 },
    cardBrand: { fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', color: 'white', fontSize: 14, letterSpacing: 2 },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
    },
    debtCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    debtLabel: { fontSize: 14, color: '#718096' },
    debtAmount: { fontSize: 24, fontWeight: 'bold', color: '#D63031' },
    historyButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyButtonText: { fontWeight: 'bold', color: '#2D3748', fontSize: 16 },
    activityTitle: { fontWeight: 'bold', color: '#2D3748', fontSize: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 8 },
    transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    transactionLeft: { flexDirection: 'row', alignItems: 'center' },
    transactionDetails: { marginLeft: 16 },
    transactionDesc: { fontWeight: '600', color: '#2D3748' },
    transactionDate: { fontSize: 14, color: '#718096' },
    transactionAmount: { fontWeight: 'bold' },
    amountPositive: { color: '#22C55E' },
    amountNegative: { color: '#EF4444' },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    footerButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    secondaryButton: { borderWidth: 1, borderColor: '#00B894', marginRight: 8 },
    primaryButton: { backgroundColor: '#00B894', marginLeft: 8 },
    footerButtonText: { fontWeight: 'bold', fontSize: 16 },
    secondaryButtonText: { color: '#00B894' },
    primaryButtonText: { color: 'white' },
});

export default WalletScreen;
