// Navegación principal de BeFast GO
import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Screens
import {
  LoginScreen,
  DashboardScreen,
  OrderDetailScreen,
  OrdersScreen,
  NavigationScreen,
  ProfileScreen,
  PaymentsScreen,
  NotificationsScreen,
  EmergencyScreen,
  SettingsScreen,
  DocumentsScreen,
  DeliveryConfirmationScreen,
  IncidentsScreen
} from '../screens';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator para pantallas principales
const MainTabNavigator = () => {
  const orders = useSelector((state: RootState) => state.orders);
  const activeOrder = (orders as any)?.activeOrder;
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarLabel: 'Pedidos',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📦</Text>,
          tabBarBadge: activeOrder ? '!' : undefined,
        }}
      />
      
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{
          tabBarLabel: 'Billetera',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💰</Text>,
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator principal
const AppNavigator = () => {
  const { isAuthenticated, canReceiveOrders } = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FF6B35',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated || !canReceiveOrders ? (
          // Pantallas de autenticación
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // Pantallas principales
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen as any}
              options={{
                title: 'Detalles del Pedido',
              }}
            />
            
            <Stack.Screen
              name="Navigation"
              component={NavigationScreen as any}
              options={{
                title: 'Navegación',
                gestureEnabled: false, // Evitar que salga accidentalmente
              }}
            />
            
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                title: 'Notificaciones',
              }}
            />
            
            <Stack.Screen
              name="Emergency"
              component={EmergencyScreen}
              options={{
                title: 'Emergencia',
                headerStyle: {
                  backgroundColor: '#F44336',
                },
              }}
            />
            
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Configuración',
              }}
            />
            
            <Stack.Screen
              name="Documents"
              component={DocumentsScreen}
              options={{
                title: 'Mis Documentos',
              }}
            />
            
            <Stack.Screen
              name="DeliveryConfirmation"
              component={DeliveryConfirmationScreen as any}
              options={{
                title: 'Confirmar Entrega',
                gestureEnabled: false, // Evitar que salga accidentalmente
              }}
            />
            
            <Stack.Screen
              name="Incidents"
              component={IncidentsScreen as any}
              options={{
                title: 'Reportar Incidente',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;