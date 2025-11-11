import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Notification } from '../../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNotification } from '../../App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NotificationContainerProps {
    notifications: Notification[];
}

const icons = {
    success: <CheckCircle color="#27ae60" />,
    error: <XCircle color="#D63031" />,
    info: <Info color="#2980b9" />,
};

const NotificationToast: React.FC<{ notification: Notification }> = ({ notification }) => {
    const { removeNotification } = useNotification();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => removeNotification(notification.id));
        }, 4000); // Notification stays for 4 seconds before auto-fading

        return () => clearTimeout(timer);
    }, [fadeAnim, notification.id, removeNotification]);

    return (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
            <View style={styles.iconContainer}>{icons[notification.type]}</View>
            <Text style={styles.messageText}>{notification.message}</Text>
            <TouchableOpacity onPress={() => removeNotification(notification.id)}>
                <X size={16} color="#A0AEC0" />
            </TouchableOpacity>
        </Animated.View>
    );
};

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications }) => {
    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.container, { top: insets.top || 10 }]}>
            {notifications.map(n => (
                <NotificationToast key={n.id} notification={n} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 1000,
        paddingHorizontal: 16,
    },
    toastContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 8,
    },
    iconContainer: {
        marginRight: 12,
    },
    messageText: {
        flex: 1,
        fontSize: 14,
        color: '#4A5568',
        fontWeight: '500',
    },
});


export default NotificationContainer;
