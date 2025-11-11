import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, FlatList } from 'react-native';
import SimpleIcon from '../components/ui/SimpleIcon';

interface NavigationProps {
  navigation?: {
    navigate: (screen: string) => void;
  };
}

const PaymentsScreen: React.FC<NavigationProps> = ({ navigation }) => {
    const wallet = {
        balance: 1250.75,
        pendingDebts: 0,
        weeklyEarnings: 2450.30
    };
    
    const stats = {
        weeklyEarnings: 2450.30,
        monthlyEarnings: 8450.90,
        totalTips: 340.50,
        totalBonuses: 125.00,
        cardOrders: 18,
        cashOrders: 12
    };

    const transactions = [
        { id: '1', type: 'EARNING', amount: 85.50, description: 'Entrega #12345', date: '2024-01-15', status: 'COMPLETED' },
        { id: '2', type: 'WITHDRAWAL', amount: -500.00, description: 'Retiro a cuenta bancaria', date: '2024-01-14', status: 'COMPLETED' },
        { id: '3', type: 'EARNING', amount: 92.30, description: 'Entrega #12344', date: '2024-01-14', status: 'COMPLETED' },
        { id: '4', type: 'EARNING', amount: 67.80, description: 'Entrega #12343', date: '2024-01-13', status: 'COMPLETED' },
    ];

    const handleWithdraw = () => {
        navigation?.navigate('Withdraw');
    };

    const getTransactionIcon = (type: string): 'plus' | 'minus' | 'wallet' => {
        switch (type) {
            case 'EARNING': return 'plus';
            case 'WITHDRAWAL': return 'minus';
            default: return 'wallet';
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'EARNING': return '#00B894';
            case 'WITHDRAWAL': return '#D63031';
            default: return '#718096';
        }
    };

    const renderTransaction = ({ item }: { item: any }) => (
        <View style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
                <SimpleIcon 
                    type={getTransactionIcon(item.type)} 
                    size={24} 
                    color={getTransactionColor(item.type)} 
                />
                <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>{item.description}</Text>
                    <Text style={styles.transactionDate}>{item.date}</Text>
                </View>
            </View>
            <Text style={[styles.transactionAmount, { color: getTransactionColor(item.type) }]}>
                ${Math.abs(item.amount).toFixed(2)}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Billetera</Text>
            </View>
            
            <ScrollView style={styles.content}>
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Saldo Disponible</Text>
                    <Text style={styles.balanceAmount}>${wallet.balance.toFixed(2)}</Text>
                    <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
                        <SimpleIcon type="bank" size={20} color="white" />
                        <Text style={styles.withdrawButtonText}>Retirar</Text>
                    </TouchableOpacity>
                </View>

                {/* Earnings Widgets */}
                <View style={styles.widgetsContainer}>
                    <View style={[styles.earningsCard, styles.widget]}>
                        <Text style={styles.earningsLabel}>Semana</Text>
                        <Text style={styles.earningsAmount}>${stats.weeklyEarnings.toFixed(2)}</Text>
                    </View>
                    
                    <View style={[styles.earningsCard, styles.widget]}>
                        <Text style={styles.earningsLabel}>Mes</Text>
                        <Text style={styles.earningsAmount}>${stats.monthlyEarnings.toFixed(2)}</Text>
                    </View>
                </View>
                
                <View style={styles.widgetsContainer}>
                    <View style={[styles.earningsCard, styles.widget]}>
                        <Text style={styles.earningsLabel}>Propinas</Text>
                        <Text style={styles.earningsAmount}>${stats.totalTips.toFixed(2)}</Text>
                    </View>
                    
                    <View style={[styles.earningsCard, styles.widget]}>
                        <Text style={styles.earningsLabel}>Bonos</Text>
                        <Text style={styles.earningsAmount}>${stats.totalBonuses.toFixed(2)}</Text>
                    </View>
                </View>
                
                <View style={styles.widgetsContainer}>
                    <View style={[styles.earningsCard, styles.widget]}>
                        <Text style={styles.earningsLabel}>💳 Tarjeta</Text>
                        <Text style={styles.ordersAmount}>{stats.cardOrders}</Text>
                    </View>
                    
                    <View style={[styles.earningsCard, styles.widget]}>
                        <Text style={styles.earningsLabel}>💵 Efectivo</Text>
                        <Text style={styles.ordersAmount}>{stats.cashOrders}</Text>
                    </View>
                </View>

                {/* Transactions */}
                <View style={styles.transactionsSection}>
                    <Text style={styles.sectionTitle}>Historial de Transacciones</Text>
                    <View style={styles.transactionsList}>
                        <FlatList
                            data={transactions}
                            renderItem={renderTransaction}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
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
    header: {
        padding: 16,
        backgroundColor: 'white',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    balanceCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    balanceLabel: {
        fontSize: 16,
        color: '#718096',
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 20,
    },
    withdrawButton: {
        backgroundColor: '#00B894',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    withdrawButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    earningsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 24,
    },
    earningsLabel: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 4,
    },
    earningsAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00B894',
    },
    transactionsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 16,
    },
    transactionsList: {
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F7FAFC',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    transactionInfo: {
        marginLeft: 12,
        flex: 1,
    },
    transactionDescription: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2D3748',
    },
    transactionDate: {
        fontSize: 14,
        color: '#718096',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    widgetsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    widget: {
        flex: 0.48,
    },
    ordersAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2D3748',
    },


});

export default PaymentsScreen;