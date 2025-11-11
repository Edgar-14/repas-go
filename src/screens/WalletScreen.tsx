import React from 'react';
// FIX: Import Platform from react-native.
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useMockData } from '../hooks/useMockData';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { TransactionType } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type WalletScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Wallet'>;

const WalletScreen: React.FC = () => {
    const { driver, transactions } = useMockData();
    const navigation = useNavigation<WalletScreenNavigationProp>();

    const transactionIcons = {
        [TransactionType.CARD_ORDER_TRANSFER]: { icon: ShoppingBag, color: '#3B82F6' },
        [TransactionType.TIP_CARD_TRANSFER]: { icon: Gift, color: '#F59E0B' },
        [TransactionType.DEBT_PAYMENT]: { icon: ArrowUpCircle, color: '#22C55E' },
        [TransactionType.CASH_ORDER_ADEUDO]: { icon: ArrowDownCircle, color: '#EF4444' },
        [TransactionType.WITHDRAWAL]: { icon: DollarSign, color: '#8B5CF6' },
    };

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
                        <Text style={styles.balanceAmount}>${driver.wallet.balance.toFixed(2)}</Text>
                    </View>
                    <View style={styles.walletCardFooter}>
                        <Text style={styles.cardBrand}>BEFASTGO CARD</Text>
                        <Lock color="white" size={20} />
                    </View>
                </View>

                <View style={[styles.card, styles.debtCard]}>
                    <View>
                        <Text style={styles.debtLabel}>Deuda Pendiente</Text>
                        <Text style={styles.debtAmount}>${driver.wallet.pendingDebts.toFixed(2)}</Text>
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
                    {transactions.slice(0, 5).map(tx => {
                        const { icon: Icon, color } = transactionIcons[tx.type];
                        const isPositive = tx.type !== TransactionType.CASH_ORDER_ADEUDO && tx.type !== TransactionType.WITHDRAWAL;
                        return (
                            <View key={tx.id} style={styles.transactionItem}>
                                <View style={styles.transactionLeft}>
                                    <Icon color={color} size={24} />
                                    <View style={styles.transactionDetails}>
                                        <Text style={styles.transactionDesc}>{tx.description}</Text>
                                        <Text style={styles.transactionDate}>{tx.date}</Text>
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
                <TouchableOpacity style={[styles.footerButton, styles.primaryButton]}>
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