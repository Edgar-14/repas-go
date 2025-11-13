import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import SimpleIcon from '../components/ui/SimpleIcon';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logoutDriver } from '../store/slices/authSlice';
// **FIX 1:** Importamos los tipos necesarios para la navegación compuesta
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';

// **FIX 1:** Definimos el Stack de Navegación principal (de AppNavigator.tsx)
type RootStackParamList = {
  Login: undefined;
  Registration: undefined;
  Onboarding: undefined;
  Main: undefined; // Esta es la pantalla que contiene los Tabs
  OrderDetail: any;
  OrderCompletion: any;
  OrderRating: any;
  GPSNavigation: any;
  DeliveryConfirmation: any;
  PaymentsHistory: any;
  Metrics: any;
  Settings: any;
  Documents: any;
  Emergency: any;
  Incidents: any;
};

// **FIX 1:** Definimos el Tab Navigator (de AppNavigator.tsx)
type MainTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Navigation: undefined;
  Payments: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// **FIX 1:** Creamos las props compuestas.
// Le decimos que es una pantalla 'Profile' (del Tab)
// anidada dentro de un 'RootStackParamList' (del Stack).
type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  StackScreenProps<RootStackParamList>
>;


const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const dispatch = useDispatch();
    const authDriver = useSelector((state: RootState) => (state as any).auth?.driver);
    const user = useSelector((state: RootState) => (state as any).auth?.user);
    const fullName = authDriver?.personalData?.fullName || 'Conductor';
    const email = authDriver?.email || user?.email || '—';

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar Sesión', onPress: async () => {
                    try {
                        await (dispatch as any)(logoutDriver());
                        // **FIX 2:** Ahora 'navigation.replace' es válido
                        // porque el tipo 'CompositeScreenProps' incluye
                        // las acciones del Stack Navigator padre.
                        navigation.replace('Login');
                    } catch (e) {
                        // fallback de navegación aún si falla el signOut
                        navigation.replace('Login');
                    }
                } }
            ]
        );
    };

    const menuItems = [
        { icon: 'cog' as const, label: 'Configuración', screen: 'Settings' },
        { icon: 'file-text' as const, label: 'Mis Documentos', screen: 'Documents' },
        { icon: 'chart-bar' as const, label: 'Estadísticas', screen: 'Metrics' },
        { icon: 'shield-alert' as const, label: '🚨 EMERGENCIA', screen: 'Emergency' },
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
                        <Text style={styles.fullName}>{fullName}</Text>
                        <Text style={styles.email}>{email}</Text>
                    </View>
                </View>

                <View style={styles.menu}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={[styles.menuItem, index === menuItems.length - 1 && styles.lastMenuItem]}
                            // 'navigate' funciona para ir a otras pantallas del Stack
                            onPress={() => navigation.navigate(item.screen as any)}
                        >
                           <View style={styles.menuItemContent}>
                               <SimpleIcon 
                                   type={item.icon} 
                                   color={item.screen === 'Emergency' ? '#D63031' : '#718096'} 
                                   size={22} 
                               />
                               <Text style={[
                                   styles.menuItemLabel,
                                   item.screen === 'Emergency' && styles.emergencyLabel
                               ]}>{item.label}</Text>
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

// ... (Los estilos son exactamente los mismos, no necesitan cambios)
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
    emergencyLabel: {
        color: '#D63031',
        fontWeight: 'bold',
    },
});

export default ProfileScreen;