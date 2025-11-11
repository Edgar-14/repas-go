import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, Image } from 'react-native';

interface NavigationProps {
  navigation?: {
    navigate: (screen: string) => void;
  };
}

const LoginScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Mock login logic
    if (email.toLowerCase() === 'driver@befast.com' && password === 'password') {
      console.log('Login successful');
      navigation?.navigate('Main');
    } else {
      setError('Email o contraseña incorrectos.');
    }
  };
  
  const handleCreateAccount = () => {
    navigation?.navigate('Registration');
  };

  const handleForgotPassword = () => {
    navigation?.navigate('ForgotPassword');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
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
                <Text style={styles.title}>BeFast Go</Text>
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
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#A0AEC0"
                />
            </View>
            
            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    onPress={handleLogin}
                    style={styles.loginButton}
                >
                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                onPress={handleCreateAccount}
                style={styles.createAccountButton}
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