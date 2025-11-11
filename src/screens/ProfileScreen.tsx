import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import SimpleIcon from '../components/ui/SimpleIcon';

interface NavigationProps {
  navigation?: {
    navigate: (screen: string) => void;
    replace: (screen: string) => void;
  };
}

const ProfileScreen: React.FC<NavigationProps> = ({ navigation }) => {
    const driver = {
        personalData: {
            fullName: 'Juan Pérez Repartidor'
        },
        email: 'driver@befast.com'
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar Sesión', onPress: () => navigation?.replace('Login') }
            ]
        );
    };

    const menuItems = [
        { icon: 'cog' as const, label: 'Configuración de la cuenta' },
        { icon: 'bell' as const, label: 'Notificaciones' },
        { icon: 'shield-check' as const, label: 'Seguridad y Privacidad' },
        { icon: 'help-circle' as const, label: 'Centro de Ayuda' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Perfil</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                       <Text style={styles.avatarEmoji}>🧑</Text>
                    </View>
                    <View>
                        <Text style={styles.fullName}>{driver.personalData.fullName}</Text>
                        <Text style={styles.email}>{driver.email}</Text>
                    </View>
                </View>

                <View style={styles.menu}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity key={index} style={[styles.menuItem, index === menuItems.length - 1 && styles.lastMenuItem]}>
                           <View style={styles.menuItemContent}>
                               <SimpleIcon type={item.icon} color="#718096" size={22} />
                               <Text style={styles.menuItemLabel}>{item.label}</Text>
                           </View>
                            <SimpleIcon type="arrow-right" color="#A0AEC0" size={20} />
                        </TouchableOpacity>
                    ))}
                </View>
                
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <SimpleIcon type="logout" size={20} color="white" />
                    <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
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
    scrollContent: {
        padding: 16,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    avatar: {
        width: 64,
        height: 64,
        backgroundColor: '#EDF2F7',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarEmoji: {
        fontSize: 30,
    },
    fullName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    email: {
        fontSize: 14,
        color: '#718096',
    },
    menu: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginTop: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
    },
    lastMenuItem: {
        borderBottomWidth: 0,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemLabel: {
        color: '#4A5568',
        fontWeight: '500',
        marginLeft: 16,
        fontSize: 16,
    },
    logoutButton: {
        backgroundColor: '#D63031',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 24,
    },
    logoutButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
});

export default ProfileScreen;