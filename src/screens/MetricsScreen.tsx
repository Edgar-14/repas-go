import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SimpleIcon from '../components/ui/SimpleIcon';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { TransactionType } from '../types';

const MetricsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { driver } = useSelector((state: RootState) => state.auth);
    const { transactions } = useSelector((state: RootState) => state.wallet);

    const { earningsData, trends, weeklyEarnings, activityData } = useMemo(() => {
        // Calcular propinas y ganancias de la semana con transacciones reales
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        let weeklyTips = 0;
        let weeklyTotal = 0;
        const hourlyBuckets: number[] = new Array(12).fill(0); // 24h agrupado en bloques de 2h
        (transactions || []).forEach((tx) => {
            const ts = tx?.timestamp;
            const d: Date = tx?.date ? new Date(tx.date) : (ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date()));
            if (d >= startOfWeek) {
                const amount = tx.amount || 0;
                if (tx.type === TransactionType.TIP_CARD_TRANSFER) weeklyTips += amount;
                if (tx.type === TransactionType.CARD_ORDER_TRANSFER) weeklyTotal += amount;
                const hour = d.getHours();
                const bucket = Math.floor(hour / 2);
                if (bucket >= 0 && bucket < hourlyBuckets.length) hourlyBuckets[bucket] += Math.abs(amount);
            }
        });
        // Normalizar para gráfico de barras (0-100)
        const maxBucket = Math.max(1, ...hourlyBuckets);
        const activity = hourlyBuckets.map(v => Math.round((v / maxBucket) * 100));
        const other = Math.max(weeklyTotal - weeklyTips, 0);
        const ed = [
            { label: 'Propinas', value: weeklyTips, color: '#FBBF24' },
            { label: 'Otros', value: other, color: '#3B82F6' },
        ];
        const t = [
            { label: 'Calificación', value: driver?.kpis?.averageRating ? driver.kpis.averageRating.toFixed(1) : '-', trend: 'up', color: '#FBBF24' },
            { label: 'Aceptación', value: driver?.kpis?.acceptanceRate != null ? `${driver.kpis.acceptanceRate}%` : '-', trend: 'up', color: '#22C55E' },
            { label: 'Pedidos', value: driver?.kpis?.totalOrders || 0, trend: 'up', color: '#3B82F6' },
            { label: 'Puntualidad', value: driver?.kpis?.onTimeDeliveryRate != null ? `${driver.kpis.onTimeDeliveryRate}%` : '-', trend: 'up', color: '#10B981' }
        ];
        return { earningsData: ed, trends: t, weeklyEarnings: weeklyTotal, activityData: activity };
    }, [transactions, driver]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <SimpleIcon type="arrow-left" size={24} color="#2D3748" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Métricas de Rendimiento</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <SimpleIcon type="dollar-sign" size={18} color="#00B894" />
                        <Text style={styles.cardTitle}>Desglose de Ganancias (Semanal)</Text>
                    </View>
                    <View style={styles.earningsChartContainer}>
                        <View style={styles.earningsBar}>
                            {earningsData.map(item => (
                                <View key={item.label} style={{ backgroundColor: item.color, width: `${weeklyEarnings > 0 ? (item.value / weeklyEarnings) * 100 : 0}%` }} />
                            ))}
                        </View>
                        <View style={styles.legendContainer}>
                            {earningsData.map(item => (
                                <View key={item.label} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                    <Text style={styles.legendLabel}>{item.label}</Text>
                                    <Text style={styles.legendValue}>${item.value.toFixed(2)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <SimpleIcon type="trending-up" size={18} color="#00B894" />
                        <Text style={styles.cardTitle}>Tendencias de Rendimiento</Text>
                    </View>
                     <View style={styles.trendsGrid}>
                        {trends.map(item => (
                             <View key={item.label} style={styles.trendItem}>
                                <View style={styles.trendHeader}>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <SimpleIcon 
                                            type={item.label === 'Calificación' ? 'star' : item.label === 'Aceptación' ? 'check-circle' : item.label === 'Pedidos' ? 'package' : 'clock'} 
                                            size={16} 
                                            color={item.color} 
                                        />
                                        <Text style={styles.trendLabel}>{item.label}</Text>
                                    </View>
                                    <SimpleIcon 
                                        type={item.trend === 'up' ? 'trending-up' : 'trending-down'} 
                                        size={16} 
                                        color={item.trend === 'up' ? '#22C55E' : '#D63031'} 
                                    />
                                </View>
                                <Text style={styles.trendValue}>{item.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <SimpleIcon type="clock" size={18} color="#00B894" />
                        <Text style={styles.cardTitle}>Actividad por Horas</Text>
                    </View>
                    <View style={styles.activityChart}>
                        {activityData.map((height, index) => (
                             <View key={index} style={styles.activityBarContainer}>
                                <View style={[styles.activityBar, { height: `${height}%` }]} />
                                <Text style={styles.activityLabel}>{index * 2}h</Text>
                             </View>
                        ))}
                    </View>
                     <Text style={styles.activityCaption}>Horas de mayor demanda: 12 PM - 4 PM</Text>
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
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontWeight: 'bold',
        color: '#2D3748',
        marginLeft: 8,
    },
    earningsChartContainer: {
        
    },
    earningsBar: {
        flexDirection: 'row',
        height: 32,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#F7FAFC',
    },
    legendContainer: {
        marginTop: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendLabel: {
        color: '#718096',
        marginLeft: 8,
        flex: 1,
    },
    legendValue: {
        fontWeight: '600',
        color: '#2D3748',
    },
    trendsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    trendItem: {
        backgroundColor: '#F7FAFC',
        padding: 12,
        borderRadius: 8,
        width: '48%',
        marginBottom: 8,
    },
    trendHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    trendLabel: {
        color: '#718096',
        marginLeft: 8,
    },
    trendValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
        marginTop: 4,
    },
    activityChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 160,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        paddingLeft: 8,
        paddingBottom: 4,
    },
    activityBarContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    activityBar: {
        width: '80%',
        backgroundColor: '#00B894',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    activityLabel: {
        fontSize: 10,
        color: '#A0AEC0',
        marginTop: 4,
    },
    activityCaption: {
        fontSize: 12,
        textAlign: 'center',
        color: '#A0AEC0',
        marginTop: 8,
    },
});

export default MetricsScreen;
