import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus } from '../../types';

interface OrderStatusTimelineProps {
    currentStatus: OrderStatus;
}

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ currentStatus }) => {
    const statuses = [
        { status: OrderStatus.ACCEPTED, label: 'Aceptado', icon: '✓' },
        { status: OrderStatus.PICKED_UP, label: 'Recogido', icon: '📦' },
        { status: OrderStatus.IN_TRANSIT, label: 'En Camino', icon: '🚚' },
        { status: OrderStatus.ARRIVED, label: 'Llegada', icon: '🏁' },
    ];

    const currentStatusIndex = statuses.findIndex(s => s.status === currentStatus);

    return (
        <View style={styles.container}>
            {statuses.map((item, index) => {
                const isActive = index <= currentStatusIndex;
                const isLineActive = index < currentStatusIndex;

                return (
                    <React.Fragment key={item.status}>
                        <View style={styles.statusItem}>
                            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                                <Text style={[styles.iconText, isActive && styles.iconTextActive]}>
                                    {item.icon}
                                </Text>
                            </View>
                            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
                        </View>
                        {index < statuses.length - 1 && (
                            <View style={styles.line}>
                                <View style={[styles.lineFill, isLineActive && { width: '100%' }]}/>
                            </View>
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    statusItem: {
        alignItems: 'center',
        width: 70, // Fixed width for each item
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        backgroundColor: 'white',
    },
    iconContainerActive: {
        backgroundColor: '#00B894',
        borderColor: '#00B894',
    },
    iconText: {
        fontSize: 20,
    },
    iconTextActive: {
        fontSize: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
        color: '#A0AEC0',
    },
    labelActive: {
        color: '#00B894',
    },
    line: {
        flex: 1,
        height: 2,
        backgroundColor: '#E2E8F0',
        marginTop: 19, // Align with center of icons
    },
    lineFill: {
        height: '100%',
        backgroundColor: '#00B894',
        width: '0%',
    }
});

export default OrderStatusTimeline;
