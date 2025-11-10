import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Pantalla de marca inicial con fondo no sólido (dos tonos) y espacio para el logo
const BrandScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const t = setTimeout(() => {
      // Ir al flujo de Login/Registro (sin Onboarding)
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, 900);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Fondo no sólido: dos bloques en diagonal para simular degradado simple sin dependencias */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Placeholder del logo */}
      <View style={styles.logoWrap}>
        <Text style={styles.logoText}>BeFast GO</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#FF8240', // tono más claro
    transform: [{ skewY: '-6deg' }],
  },
  bgBottom: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    right: -40,
    height: '55%',
    backgroundColor: '#E85E2F', // tono más oscuro
    transform: [{ skewY: '8deg' }],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  logoWrap: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});

export default BrandScreen;
