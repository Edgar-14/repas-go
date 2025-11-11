import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import SimpleIcon from '../components/ui/SimpleIcon';

interface NavigationProps {
  navigation?: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

const SettingsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSaveSettings = () => {
    Alert.alert(
      'Configuración guardada',
      'Tus preferencias han sido actualizadas correctamente.',
      [{ text: 'OK' }]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Restablecer configuración',
      '¿Estás seguro que deseas restablecer todas las configuraciones a sus valores por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            setPushNotifications(true);
            setSoundEnabled(true);
            setVibrationEnabled(true);
            setLocationSharing(true);
            setDarkMode(false);
            Alert.alert('Configuración restablecida', 'Se han restaurado los valores por defecto.');
          }
        }
      ]
    );
  };

  const SettingItem: React.FC<{
    icon: any;
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    onPress?: () => void;
    showArrow?: boolean;
  }> = ({ icon, title, subtitle, value, onValueChange, onPress, showArrow = false }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !onValueChange}
    >
      <View style={styles.settingLeft}>
        <SimpleIcon type={icon} size={24} color="#00B894" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {onValueChange && (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#E2E8F0', true: '#00B894' }}
            thumbColor={value ? '#FFFFFF' : '#CBD5E0'}
          />
        )}
        {showArrow && (
          <SimpleIcon type="arrow-right" size={20} color="#A0AEC0" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <SimpleIcon type="arrow-left" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notificaciones</Text>
          
          <SettingItem
            icon="bell"
            title="Notificaciones Push"
            subtitle="Recibir alertas de nuevos pedidos"
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          
          <SettingItem
            icon="bell"
            title="Sonido"
            subtitle="Reproducir sonido en notificaciones"
            value={soundEnabled}
            onValueChange={setSoundEnabled}
          />
          
          <SettingItem
            icon="bell"
            title="Vibración"
            subtitle="Vibrar al recibir notificaciones"
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
          />
        </View>

        {/* Privacidad y Ubicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Privacidad y Ubicación</Text>
          
          <SettingItem
            icon="navigation"
            title="Compartir ubicación"
            subtitle="Permitir que BeFast rastree tu ubicación"
            value={locationSharing}
            onValueChange={setLocationSharing}
          />
          
          <SettingItem
            icon="shield-check"
            title="Política de privacidad"
            subtitle="Ver términos y condiciones"
            onPress={() => Alert.alert('Política de privacidad', 'Aquí se mostraría la política de privacidad completa.')}
            showArrow
          />
        </View>

        {/* Apariencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Apariencia</Text>
          
          <SettingItem
            icon="cog"
            title="Modo oscuro"
            subtitle="Cambiar a tema oscuro"
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>

        {/* Cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Cuenta</Text>
          
          <SettingItem
            icon="account"
            title="Editar perfil"
            subtitle="Cambiar información personal"
            onPress={() => Alert.alert('Editar perfil', 'Función en desarrollo')}
            showArrow
          />
          
          <SettingItem
            icon="cog"
            title="Cambiar contraseña"
            subtitle="Actualizar tu contraseña"
            onPress={() => Alert.alert('Cambiar contraseña', 'Función en desarrollo')}
            showArrow
          />
          
          <SettingItem
            icon="file-text"
            title="Documentos"
            subtitle="Ver y actualizar documentos"
            onPress={() => navigation?.navigate('Documents')}
            showArrow
          />
        </View>

        {/* Soporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆘 Soporte</Text>
          
          <SettingItem
            icon="help-circle"
            title="Centro de ayuda"
            subtitle="Preguntas frecuentes y tutoriales"
            onPress={() => Alert.alert('Centro de ayuda', 'Función en desarrollo')}
            showArrow
          />
          
          <SettingItem
            icon="message-circle"
            title="Contactar soporte"
            subtitle="Enviar mensaje al equipo de soporte"
            onPress={() => navigation?.navigate('Chat')}
            showArrow
          />
          
          <SettingItem
            icon="shield-alert"
            title="Emergencia"
            subtitle="Acceso rápido a funciones de emergencia"
            onPress={() => navigation?.navigate('Emergency')}
            showArrow
          />
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSettings}
          >
            <SimpleIcon type="check" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetSettings}
          >
            <SimpleIcon type="close" size={20} color="#D63031" />
            <Text style={styles.resetButtonText}>Restablecer</Text>
          </TouchableOpacity>
        </View>

        {/* Información de la app */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>BeFast GO</Text>
          <Text style={styles.appInfoVersion}>Versión 1.0.0</Text>
          <Text style={styles.appInfoCopyright}>© 2024 BeFast. Todos los derechos reservados.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  settingRight: {
    alignItems: 'center',
  },
  actionButtons: {
    margin: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#00B894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resetButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D63031',
  },
  resetButtonText: {
    color: '#D63031',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 32,
  },
  appInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  appInfoCopyright: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
  },
});

export default SettingsScreen;