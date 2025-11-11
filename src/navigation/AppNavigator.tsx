import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import SimpleIcon from '../components/ui/SimpleIcon';

// Screens
import {
  LoginScreen,
  DashboardScreen,
  OrderDetailScreen,
  OrdersScreen,
  NavigationScreen,
  ProfileScreen,
  PaymentsScreen,
  PaymentsHistoryScreen,
  OrdersHistoryScreen,
  NotificationsScreen,
  EmergencyScreen,
  SettingsScreen,
  DocumentsScreen,
  DeliveryConfirmationScreen,
  IncidentsScreen,
  ChatScreen,
  MetricsScreen,
  OrderCompletionScreen,
  OrderRatingScreen,
  OnboardingScreen,
  RegistrationScreen,
  WalletScreen
} from '../screens';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();



// Main Tab Navigator with Professional Design
const MainTabNavigator = () => {
  const orders = useSelector((state: RootState) => state.orders);
  const notifications = useSelector((state: RootState) => state.notifications);
  const activeOrder = (orders as any)?.activeOrder;
  const unreadCount = (notifications as any)?.unreadCount || 0;
  
  return (
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
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
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
        component={OrdersScreen}
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
        name="Payments"
        component={PaymentsScreen}
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
        component={NotificationsScreen}
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
        component={ProfileScreen}
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
  );
};

// Main Stack Navigator with All Screens
const AppNavigator = () => {
  return (
    <NavigationContainer>
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
          headerBackTitleVisible: false,
        }}
        initialRouteName="Login"
      >
        {/* Authentication Flow */}
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

        {/* Main App Flow */}
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
        <Stack.Screen
          name="OrdersHistory"
          component={OrdersHistoryScreen as any}
          options={{ title: 'Historial de Pedidos' }}
        />

        {/* Navigation & Delivery */}
        <Stack.Screen
          name="Navigation"
          component={NavigationScreen as any}
          options={{ 
            title: 'Navegación GPS',
            gestureEnabled: false,
            headerStyle: { backgroundColor: '#007AFF' },
            headerTintColor: '#FFFFFF'
          }}
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
          name="Wallet"
          component={WalletScreen as any}
          options={{ title: 'Mi Billetera' }}
        />
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

        {/* Communication */}
        <Stack.Screen
          name="Chat"
          component={ChatScreen as any}
          options={{ 
            headerShown: false,
            gestureEnabled: false
          }}
        />

        {/* Settings & Profile */}
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Configuración' }}
        />
        <Stack.Screen
          name="Documents"
          component={DocumentsScreen}
          options={{ title: 'Mis Documentos' }}
        />

        {/* Emergency & Support */}
        <Stack.Screen
          name="Emergency"
          component={EmergencyScreen}
          options={{ 
            title: 'Emergencia',
            headerStyle: { backgroundColor: '#FF3B30' },
            headerTintColor: '#FFFFFF'
          }}
        />
        <Stack.Screen
          name="Incidents"
          component={IncidentsScreen as any}
          options={{ title: 'Reportar Incidente' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
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