import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppDispatch, RootState } from '../store/index';
import { clearError, loginUser } from '../store/slices/authSlice';
import { auth } from '../config/firebase';
import { RootStackParamList } from '../types/index';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { isAuthenticated, isLoading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Main');
    }
  }, [isAuthenticated, navigation]);

  const handleLogin = (): void => {
    dispatch(clearError());
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    dispatch(loginUser({ email: normalizedEmail, password }));
  };

  const handleCreateAccount = (): void => {
    navigation.navigate('Registration');
  };

  const handleForgotPassword = async (): Promise<void> => {
    dispatch(clearError());
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    try {
      await auth().sendPasswordResetEmail(normalizedEmail);
      Alert.alert('Éxito', 'Se envió un enlace de recuperación a tu correo');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al enviar correo de recuperación');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../public/be repartidores.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>BeFast GO</Text>
            <Text style={styles.subtitle}>App para Repartidores</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#A0AEC0"
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#A0AEC0"
              editable={!isLoading}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleLogin}
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCreateAccount}
            style={styles.createAccountButton}
            disabled={isLoading}
          >
            <Text style={styles.createAccountButtonText}>Crear una cuenta nueva</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: StatusBar.currentHeight || 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 16,
  },
  form: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2D3748',
    marginBottom: 16,
  },
  errorText: {
    color: '#D63031',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 24,
  },
  loginButton: {
    backgroundColor: '#00B894',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  forgotPasswordButton: {
    marginTop: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#718096',
  },
  createAccountButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#00B894',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  createAccountButtonText: {
    color: '#00B894',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default LoginScreen;
