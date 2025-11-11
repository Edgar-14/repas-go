import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Chatbot from '../chatbot/Chatbot';
import EmergencyOptionsModal from '../modals/EmergencyOptionsModal';

const FloatingButtons: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
    const animation = useState(new Animated.Value(0))[0];

    const toggleMenu = () => {
        const toValue = isMenuOpen ? 0 : 1;
        Animated.spring(animation, {
            toValue,
            friction: 5,
            useNativeDriver: true,
        }).start();
        setIsMenuOpen(!isMenuOpen);
    };

    const openChatbot = () => {
        toggleMenu();
        setIsChatbotOpen(true);
    };

    const openEmergency = () => {
        toggleMenu();
        setIsEmergencyModalOpen(true);
    };
    
    // FIX: Simplified transform and added opacity to avoid complex type errors with Animated styles.
    const assistantStyle = {
        opacity: animation,
        transform: [
            {
                translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -60],
                }),
            },
        ],
    };
    
    // FIX: Simplified transform and added opacity to avoid complex type errors with Animated styles.
     const emergencyStyle = {
        opacity: animation,
        transform: [
            {
                translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -120],
                }),
            },
        ],
    };

    const rotation = {
        transform: [{
            rotate: animation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '45deg']
            })
        }]
    };


    return (
        <>
            <View style={styles.container}>
                <Animated.View style={[styles.secondaryButtonContainer, emergencyStyle]}>
                    <TouchableOpacity 
                        onPress={openEmergency} 
                        style={[styles.secondaryButton, styles.emergencyButton]}
                        aria-label="Opciones de Emergencia"
                    >
                        <MaterialCommunityIcons name="alert-triangle" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.labelContainer}>
                        <Text style={styles.labelText}>Emergencia</Text>
                    </View>
                </Animated.View>

                 <Animated.View style={[styles.secondaryButtonContainer, assistantStyle]}>
                    <TouchableOpacity 
                        onPress={openChatbot} 
                        style={[styles.secondaryButton, styles.chatbotButton]}
                        aria-label="Abrir Asistente Virtual"
                    >
                        <MaterialCommunityIcons name="robot" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.labelContainer}>
                        <Text style={styles.labelText}>Asistente</Text>
                    </View>
                </Animated.View>

                <TouchableOpacity 
                    onPress={toggleMenu} 
                    style={styles.menuButton}
                    aria-label="Abrir menú de ayuda"
                >
                    <Animated.View style={rotation}>
                       <MaterialCommunityIcons name={isMenuOpen ? 'close' : 'lifebuoy'} size={28} color="white" />
                    </Animated.View>
                </TouchableOpacity>
            </View>
            <Chatbot visible={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
            <EmergencyOptionsModal visible={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 80, // Adjust based on tab bar height
        right: 16,
        alignItems: 'center',
    },
    menuButton: {
        backgroundColor: '#00B894',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    secondaryButtonContainer: {
        position: 'absolute',
        left: 5,
        top: 5,
        alignItems: 'center',
    },
    secondaryButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    chatbotButton: {
        backgroundColor: '#2D3748',
    },
    emergencyButton: {
        backgroundColor: '#D63031',
    },
    labelContainer: {
        position: 'absolute',
        right: 60,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
    },
    labelText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    }
});

export default FloatingButtons;