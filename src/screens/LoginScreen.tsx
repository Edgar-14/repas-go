// Pantalla de Login para BeFast GO
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loginDriver, clearError } from '../store/slices/authSlice';
import { NavigationProps } from '../types';

const LoginScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated, canReceiveOrders, blockingReason } = useSelector(
    (state: RootState) => state.auth
  );

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    try {
      const result = await dispatch(loginDriver({ email: email.trim(), password }));
      
      if (loginDriver.fulfilled.match(result)) {
        if (canReceiveOrders) {
          navigation.replace('Dashboard');
        } else {
          // Mostrar mensaje de bloqueo
          Alert.alert(
            'Cuenta no habilitada',
            getBlockingMessage(blockingReason),
            [
              {
                text: 'Contactar Soporte',
                onPress: () => {
                  // Aquí se podría abrir chat de soporte o llamada
                }
              },
              {
                text: 'OK',
                style: 'cancel'
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const getBlockingMessage = (reason?: string): string => {
    switch (reason) {
      case 'IDSE_NOT_APPROVED':
        return 'Tu alta en IMSS está pendiente. Contacta a soporte para más información.';
      case 'NOT_ACTIVE':
        return 'Tu cuenta no está activa. Contacta a soporte para activarla.';
      case 'IMSS_NOT_ACTIVE':
        return 'Tu estatus en IMSS no está activo. Contacta a soporte.';
      case 'DOCUMENTS_NOT_APPROVED':
        return 'Tus documentos están pendientes de aprobación. Revisa tu perfil.';
      default:
        return 'Tu cuenta no está habilitada para recibir pedidos. Contacta a soporte.';
    }
  };

  React.useEffect(() => {
    if (error) {
      Alert.alert('Error de Login', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  React.useEffect(() => {
    if (isAuthenticated && canReceiveOrders) {
      navigation.replace('Dashboard');
    }
  }, [isAuthenticated, canReceiveOrders, navigation]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>BeFast GO</Text>
          <Text style={styles.subtitle}>Repartidores</Text>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Tu contraseña"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => {
              Alert.alert(
                'Recuperar Contraseña',
                'Contacta a soporte para recuperar tu contraseña.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>

        {/* Información adicional */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            ¿Eres nuevo? El registro se realiza en el portal web de BeFast.
          </Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Registro de Conductores',
                'Para registrarte como conductor, visita el portal web de BeFast o contacta a soporte.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.linkText}>Más información</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  eyeText: {
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#CCC',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#FF6B35',
    fontSize: 14,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  linkText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;