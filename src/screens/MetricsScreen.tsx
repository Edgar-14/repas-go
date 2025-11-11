import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SvgUri } from 'react-native-svg';
import { useMockData } from '../hooks/useMockData';

const MetricsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { driver, weeklySummary } = useMockData();

    const earningsData = [
        { label: 'Tarifas Base', value: 850.25, color: '#3B82F6' },
        { label: 'Distancia', value: 350.50, color: '#22C55E' },
        { label: 'Propinas', value: 150.00, color: '#FBBF24' },
    ];

    const performanceTrends = [
        { label: 'Calificación', value: driver.stats.rating, trend: 'up', color: '#FBBF24' },
        { label: 'Aceptación', value: `${driver.stats.acceptanceRate}%`, trend: 'down', color: '#22C55E' }
    ];

    const activityData = [ 8, 12, 18, 25, 30, 45, 60, 90, 75, 50, 30, 15 ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <SvgUri uri="../public/icon/iconsax-arrow-square-left-15wxd229-.svg" width={24} height={24} fill="#2D3748" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Métricas de Rendimiento</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <SvgUri uri="../public/icon/iconsax-ai-tag-price-ctzyz4kw-.svg" width={18} height={18} fill="#00B894" />
                        <Text style={styles.cardTitle}>Desglose de Ganancias (Semanal)</Text>
                    </View>
                    <View style={styles.earningsChartContainer}>
                        <View style={styles.earningsBar}>
                            {earningsData.map(item => (
                                <View key={item.label} style={{ backgroundColor: item.color, width: `${(item.value / weeklySummary.earnings) * 100}%` }} />
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
                        <SvgUri uri="../public/icon/iconsax-chart-success-bmrq5dwv-.svg" width={18} height={18} fill="#00B894" />
                        <Text style={styles.cardTitle}>Tendencias de Rendimiento</Text>
                    </View>
                     <View style={styles.trendsContainer}>
                        {performanceTrends.map(item => (
                             <View key={item.label} style={styles.trendItem}>
                                <View style={styles.trendHeader}>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <SvgUri uri={item.label === 'Calificación' ? "../public/icon/iconsax-enhance-prize-6wptzzu9-.svg" : "../public/icon/iconsax-ai-tag-price-ctzyz4kw-.svg"} width={16} height={16} fill={item.color} />
                                        <Text style={styles.trendLabel}>{item.label}</Text>
                                    </View>
                                    <SvgUri uri={item.trend === 'up' ? "../public/icon/iconsax-chart-success-bmrq5dwv-.svg" : "../public/icon/iconsax-direct-down-0iqtpp73-.svg"} width={18} height={18} fill={item.trend === 'up' ? '#22C55E' : '#D63031'} />
                                </View>
                                <Text style={styles.trendValue}>{item.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <SvgUri uri="../public/icon/iconsax-ai-sand-timer-9ufyu10k-.svg" width={18} height={18} fill="#00B894" />
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
    trendsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    trendItem: {
        backgroundColor: '#F7FAFC',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
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
