import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import SimpleIcon from '../components/ui/SimpleIcon';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logoutUser } from '../store/slices/authSlice';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, MainTabParamList } from '../types/index';



type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  StackScreenProps<RootStackParamList>
>;


const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const dispatch = useDispatch();
    const { driver } = useSelector((state: RootState) => state.auth);
    
    // Usar estructura real del ecosistema
    const fullName = driver?.personalData?.fullName || driver?.fullName || 'Conductor';
    const email = driver?.email || '—';
    const phone = driver?.personalData?.phone || driver?.phone || '—';
    const status = driver?.administrative?.befastStatus || driver?.status || 'PENDING';
    const walletBalance = driver?.wallet?.balance || driver?.walletBalance || 0;
    const totalOrders = driver?.stats?.totalOrders || driver?.kpis?.totalOrders || 0;
    const rating = driver?.stats?.rating || driver?.kpis?.averageRating || 0;

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar Sesión', onPress: () => {
                    dispatch(logoutUser() as any);
                    navigation.replace('Login');
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
                    <View style={styles.profileInfo}>
                        <Text style={styles.fullName}>{fullName}</Text>
                        <Text style={styles.email}>{email}</Text>
                        <Text style={styles.phone}>{phone}</Text>
                        <View style={styles.statusContainer}>
                            <View style={[styles.statusDot, { backgroundColor: status === 'ACTIVE' ? '#22C55E' : '#EF4444' }]} />
                            <Text style={styles.statusText}>
                                {status === 'ACTIVE' ? 'Activo' : status === 'PENDING' ? 'Pendiente' : 'Inactivo'}
                            </Text>
                        </View>
                    </View>
                </View>
                
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>${walletBalance.toFixed(2)}</Text>
                        <Text style={styles.statLabel}>Saldo</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{totalOrders}</Text>
                        <Text style={styles.statLabel}>Pedidos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
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
    profileInfo: {
        flex: 1,
    },
    email: {
        fontSize: 14,
        color: '#718096',
        marginTop: 2,
    },
    phone: {
        fontSize: 14,
        color: '#718096',
        marginTop: 2,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4A5568',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    statCard: {
        backgroundColor: 'white',
        flex: 1,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    statLabel: {
        fontSize: 12,
        color: '#718096',
        marginTop: 4,
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