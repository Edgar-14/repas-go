import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { Order, RootStackParamList } from '../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import { setActiveOrder } from '../store/slices/ordersSlice';

type OrderRatingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderRating'>;
type OrderRatingScreenRouteProp = RouteProp<RootStackParamList, 'OrderRating'>;

const OrderRatingScreen: React.FC = () => {
    const navigation = useNavigation<OrderRatingScreenNavigationProp>();
    const route = useRoute<OrderRatingScreenRouteProp>();
    const { order } = route.params;
    const dispatch = useDispatch();
    
    if (!order) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>No se encontró información del pedido.</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Dashboard')}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Volver al Panel</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }
    
    const handleBackToDashboard = () => {
        dispatch(setActiveOrder(null));
        navigation.navigate('Dashboard');
    }

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <MaterialCommunityIcons key={i} name="star" size={32} color={i < rating ? '#FBBF24' : '#E2E8F0'} />
        ));
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.content}>
                <MaterialCommunityIcons name="check-circle" size={80} color="#00B894" />
                <Text style={styles.title}>¡Entrega Completada!</Text>
                <Text style={styles.subtitle}>Buen trabajo, has finalizado el pedido #{order.id}.</Text>
            </View>

            <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                        <MaterialCommunityIcons name="currency-usd" size={20} color="#718096" />
                        <Text style={styles.detailLabel}>Ganancia Total</Text>
                    </View>
                    <Text style={styles.totalEarnings}>${(order.totalEarnings || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.divider}/>
                <View style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                         <MaterialCommunityIcons name="gift" size={20} color="#718096" />
                        <Text style={styles.detailLabel}>Propina del Cliente</Text>
                    </View>
                    <Text style={styles.tipValue}>${(order.earningsBreakdown?.tip || 0).toFixed(2)}</Text>
                </View>
                 <View style={styles.divider}/>
                 <View style={styles.ratingContainer}>
                     <Text style={styles.detailLabel}>Calificación del Cliente</Text>
                     <View style={styles.starsContainer}>
                        {renderStars(order.customerRating || 5)}
                     </View>
                 </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleBackToDashboard}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Buscar Nuevos Pedidos</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        padding: 32,
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2D3748',
        marginTop: 16,
    },
    subtitle: {
        color: '#718096',
        marginTop: 8,
        fontSize: 16,
    },
    detailsCard: {
        backgroundColor: '#F7FAFC',
        borderRadius: 20,
        padding: 24,
        marginVertical: 32,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailLabel: {
        color: '#4A5568',
        fontWeight: '500',
        fontSize: 16,
        marginLeft: 8,
    },
    totalEarnings: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00B894',
    },
    tipValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
    ratingContainer: {
        alignItems: 'center',
        paddingTop: 8,
    },
    starsContainer: {
        flexDirection: 'row',
        marginTop: 8,
    },
    footer: {
        width: '100%',
    },
    button: {
        width: '100%',
        backgroundColor: '#00B894',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default OrderRatingScreen;
