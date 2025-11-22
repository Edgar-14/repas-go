import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import SimpleIcon from '../components/ui/SimpleIcon';
import DriverChatWidget from '../components/ui/DriverChatWidget';
import NewOrderModal from '../components/modals/NewOrderModal';
import DebtWarningModal from '../components/modals/DebtWarningModal';
import DriverStatusAlertModal from '../components/modals/DriverStatusAlertModal'; // Importar el nuevo modal
import { hideNewOrderModal } from '../store/slices/notificationsSlice';
import { 
  showDebtWarningModal, 
  hideDebtWarningModal,
  showDriverStatusAlertModal, // Importar acciones de alerta de estado
  hideDriverStatusAlertModal,
} from '../store/slices/authSlice';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

// Screens
import {
  LoginScreen,
  DashboardScreen,
  OrderDetailScreen,
  OrdersScreen,
  MapsScreen,
  ProfileScreen,
  PaymentsScreen,
  PaymentsHistoryScreen,
  NotificationsScreen,
  EmergencyScreen,
  SettingsScreen,
  DocumentsScreen,
  DeliveryConfirmationScreen,
  IncidentsScreen,
  MetricsScreen,
  OrderCompletionScreen,
  OrderRatingScreen,
  OnboardingScreen,
  RegistrationScreen,
  NavigationScreen
} from '../screens';
import SplashScreen from '../screens/SplashScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();



// Main Tab Navigator with Professional Design
const MainTabNavigator = () => {
  const orders = useSelector((state: RootState) => state.orders);
  const notifications = useSelector((state: RootState) => state.notifications);
  const activeOrder = (orders as any)?.activeOrder;
  const unreadCount = (notifications as any)?.unreadCount || 0;
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1 }}>
      <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00B894',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          paddingBottom: 20,
          paddingTop: 12,
          height: 85,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen as any}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <SimpleIcon 
              type="home" 
              size={24} 
              color={focused ? '#00B894' : '#8E8E93'} 
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Orders"
        component={OrdersScreen as any}
        options={{
          tabBarLabel: 'Pedidos',
          tabBarIcon: ({ focused }) => (
            <SimpleIcon 
              type="package" 
              size={24} 
              color={focused ? '#00B894' : '#8E8E93'} 
            />
          ),
          tabBarBadge: activeOrder ? '!' : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF6B35', color: '#FFFFFF' },
        }}
      />
      
      <Tab.Screen
        name="Maps"
        component={MapsScreen as any}
        options={{
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ focused }) => (
            <SimpleIcon 
              type="navigation" 
              size={24} 
              color={focused ? '#00B894' : '#8E8E93'} 
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen as any}
        options={{
          tabBarLabel: 'Billetera',
          tabBarIcon: ({ focused }) => (
            <SimpleIcon 
              type="wallet" 
              size={24} 
              color={focused ? '#00B894' : '#8E8E93'} 
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen as any}
        options={{
          tabBarLabel: 'Avisos',
          tabBarIcon: ({ focused }) => (
            <SimpleIcon 
              type="bell" 
              size={24} 
              color={focused ? '#00B894' : '#8E8E93'} 
            />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF3B30', color: '#FFFFFF' },
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen as any}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <SimpleIcon 
              type="account" 
              size={24} 
              color={focused ? '#00B894' : '#8E8E93'} 
            />
          ),
        }}
      />
      </Tab.Navigator>
      <DriverChatWidget />
      </View>
    </SafeAreaView>
  );
};

// Main Stack Navigator with All Screens
const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { 
    isAuthenticated, 
    driver, 
    showDebtWarningModal,
    showDriverStatusAlertModal, // Nuevo estado
    driverStatusAlertType,      // Nuevo estado
    driverStatusAlertMessage,   // Nuevo estado
  } = useSelector((state: RootState) => state.auth);
  const { newOrderToShow } = useSelector((state: RootState) => state.notifications);
  const [showSplash, setShowSplash] = React.useState(true);

  // Lógica para mostrar el modal de advertencia de deuda
  useEffect(() => {
    if (isAuthenticated && driver && driver.wallet) {
      const { pendingDebts, creditLimit } = driver.wallet;
      const warningThreshold = creditLimit * 0.8;

      if (pendingDebts >= warningThreshold && !showDebtWarningModal) {
        dispatch(showDebtWarningModal());
      } else if (pendingDebts < warningThreshold && showDebtWarningModal) {
        dispatch(hideDebtWarningModal());
      }
    }
  }, [isAuthenticated, driver, showDebtWarningModal, dispatch]);

  // Lógica para mostrar el modal de alerta de estado del conductor
  useEffect(() => {
    if (isAuthenticated && driver && driver.administrative) {
      const { imssStatus, documentsStatus, trainingStatus } = driver.administrative;

      // Prioridad: IMSS > Documentos > Capacitación
      if (imssStatus !== 'ACTIVO_COTIZANDO' && !showDriverStatusAlertModal) {
        dispatch(showDriverStatusAlertModal({ 
          type: 'IMSS', 
          message: 'Tu estatus en el IMSS no está activo. No podrás recibir pedidos hasta que se regularice.' 
        }));
      } else if (documentsStatus !== 'APPROVED' && !showDriverStatusAlertModal) {
        dispatch(showDriverStatusAlertModal({ 
          type: 'DOCUMENTS', 
          message: 'Tienes documentos pendientes o no aprobados. Por favor, revisa y actualiza tu información.' 
        }));
      } else if (trainingStatus !== 'COMPLETED' && !showDriverStatusAlertModal) {
        dispatch(showDriverStatusAlertModal({ 
          type: 'TRAINING', 
          message: 'Tienes capacitación pendiente. Complétala para poder recibir pedidos.' 
        }));
      } else if (showDriverStatusAlertModal && imssStatus === 'ACTIVO_COTIZANDO' && documentsStatus === 'APPROVED' && trainingStatus === 'COMPLETED') {
        // Si todo está bien y el modal estaba visible, ocultarlo
        dispatch(hideDriverStatusAlertModal());
      }
    }
  }, [isAuthenticated, driver, showDriverStatusAlertModal, dispatch]);

  const handleLiquidateDebt = () => {
    dispatch(hideDebtWarningModal());
    navigation.navigate('Payments');
  };

  const handleDriverStatusAction = () => {
    dispatch(hideDriverStatusAlertModal());
    // Navegar a la pantalla de documentos o perfil para que el conductor tome acción
    navigation.navigate('Documents'); 
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }
  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E5EA',
          },
          headerTintColor: '#2D3748',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }}
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
      >
        {!isAuthenticated && (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen as any}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Registration"
              component={RegistrationScreen as any}
              options={{ title: 'Registro de Conductor' }}
            />
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen as any}
              options={{ headerShown: false }}
            />
          </>
        )}

        {isAuthenticated && (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            {/* Order Management */}
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen as any}
              options={{ title: 'Detalles del Pedido' }}
            />
            <Stack.Screen
              name="OrderCompletion"
              component={OrderCompletionScreen as any}
              options={{ title: 'Completar Pedido' }}
            />
            <Stack.Screen
              name="OrderRating"
              component={OrderRatingScreen as any}
              options={{ title: 'Calificar Cliente' }}
            />
            {/* Navigation & Delivery */}
            <Stack.Screen
              name="Navigation"
              component={NavigationScreen as any}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="DeliveryConfirmation"
              component={DeliveryConfirmationScreen as any}
              options={{
                title: 'Confirmar Entrega',
                gestureEnabled: false,
                headerStyle: { backgroundColor: '#00B894' },
                headerTintColor: '#FFFFFF'
              }}
            />
            {/* Financial */}
            <Stack.Screen
              name="PaymentsHistory"
              component={PaymentsHistoryScreen as any}
              options={{ title: 'Historial de Pagos' }}
            />
            <Stack.Screen
              name="Metrics"
              component={MetricsScreen as any}
              options={{ title: 'Mis Estadísticas' }}
            />
            {/* Settings & Profile */}
            <Stack.Screen
              name="Settings"
              component={SettingsScreen as any}
              options={{ title: 'Configuración' }}
            />
            <Stack.Screen
              name="Documents"
              component={DocumentsScreen as any}
              options={{ title: 'Mis Documentos' }}
            />
            {/* Emergency & Support */}
            <Stack.Screen
              name="Emergency"
              component={EmergencyScreen as any}
              options={{ title: 'Emergencia', headerStyle: { backgroundColor: '#FF3B30' }, headerTintColor: '#FFFFFF' }}
            />
            <Stack.Screen
              name="Incidents"
              component={IncidentsScreen as any}
              options={{ title: 'Reportar Incidente' }}
            />
          </>
        )}
      </Stack.Navigator>
      <NewOrderModal
        visible={!!newOrderToShow}
        data={newOrderToShow}
        onClose={() => dispatch(hideNewOrderModal())}
      />
      <DebtWarningModal
        visible={showDebtWarningModal}
        currentDebt={driver?.wallet?.pendingDebts || 0}
        creditLimit={driver?.wallet?.creditLimit || 300}
        onClose={() => dispatch(hideDebtWarningModal())}
        onLiquidateDebt={handleLiquidateDebt}
      />
      <DriverStatusAlertModal
        visible={showDriverStatusAlertModal}
        statusType={driverStatusAlertType || 'GENERAL'}
        message={driverStatusAlertMessage || 'Hay un problema con tu cuenta. Por favor, revisa tu perfil.'}
        onClose={() => dispatch(hideDriverStatusAlertModal())}
        onTakeAction={handleDriverStatusAction}
      />
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -4,
  },
  tabIconFocused: {
    backgroundColor: '#00B894',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default AppNavigator;