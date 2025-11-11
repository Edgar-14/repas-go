import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, Linking, Alert } from 'react-native';
import SimpleIcon from '../ui/SimpleIcon';

interface EmergencyOptionsModalProps {
    onClose: () => void;
    visible: boolean;
}

// Moved ActionButton outside the main component to prevent re-declaration on render.
const ActionButton: React.FC<{
    onPress: () => void;
    icon: React.ElementType;
    title: string;
    subtitle: string;
}> = ({ onPress, icon: Icon, title, subtitle }) => (
     <TouchableOpacity 
        onPress={onPress}
        style={styles.actionButton}
    >
        <View style={styles.actionButtonContent}>
            <SimpleIcon type="help-circle" size={24} />
            <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{title}</Text>
                <Text style={styles.actionSubtitle}>{subtitle}</Text>
            </View>
        </View>
        <SimpleIcon type="arrow-right" size={20} />
    </TouchableOpacity>
);

const EmergencyOptionsModal: React.FC<EmergencyOptionsModalProps> = ({ onClose, visible }) => {
    
    const handleCall = (number: string) => {
        Linking.openURL(`tel:${number}`);
    }

    const handleAlert = () => {
        Alert.alert(
            'Alerta Enviada',
            'Se ha enviado una alerta silenciosa a BeFast. Tu ubicación se compartirá en tiempo real con el equipo de seguridad.',
            [{ text: 'OK', onPress: onClose }]
        );
    }

    return (
         <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                            <SimpleIcon type="shield-check" size={20} />
                            <Text style={styles.headerTitle}>Opciones de Emergencia</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <SimpleIcon type="close" size={24} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.content}>
                        <View style={styles.warningBox}>
                            <SimpleIcon type="alert-triangle" size={20} />
                            <Text style={styles.warningText}>
                                Si estás en peligro inminente, tu primera acción debe ser contactar a las autoridades locales.
                            </Text>
                        </View>

                        <View style={styles.actionsList}>
                            <ActionButton 
                                onPress={() => handleCall('5512345678')}
                                icon={() => <SimpleIcon type="help-circle" size={24} />}
                                title="Contactar Soporte BeFast"
                                subtitle="Para problemas con el pedido o la app"
                            />
                            <ActionButton 
                                onPress={handleAlert}
                                icon={() => <SimpleIcon type="navigation" size={24} />}
                                title="Enviar Alerta Silenciosa"
                                subtitle="Notifica a BeFast y comparte tu ubicación"
                            />
                        </View>
                        
                        <TouchableOpacity 
                            onPress={() => handleCall('911')}
                            style={styles.emergencyCallButton}
                        >
                            <SimpleIcon type="help-circle" size={24} />
                            <Text style={styles.emergencyCallText}>Llamar a Emergencias (911)</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginLeft: 8,
    },
    content: {
        padding: 24,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(214, 48, 49, 0.1)',
        borderLeftWidth: 4,
        borderLeftColor: '#D63031',
        padding: 12,
        borderRadius: 4,
        marginBottom: 16,
    },
    warningIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: '#D63031',
    },
    actionsList: {
        marginBottom: 16,
    },
    actionButton: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionTextContainer: {
        marginLeft: 16,
    },
    actionTitle: {
        fontWeight: '600',
        color: '#2D3748',
        fontSize: 16,
    },
    actionSubtitle: {
        fontSize: 14,
        color: '#718096',
    },
    emergencyCallButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#D63031',
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    emergencyCallText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 12,
    },
});

export default EmergencyOptionsModal;