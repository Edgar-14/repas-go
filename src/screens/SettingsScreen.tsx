// Pantalla de configuración para BeFast GO
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setSoundEnabled, setVibrationEnabled } from '../store/slices/notificationsSlice';
import { NavigationProps } from '../types';

const SettingsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector((state: RootState) => state.notifications);
  const { soundEnabled, vibrationEnabled } = notifications as any;
  
  const [darkMode, setDarkMode] = useState(false);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);

  const handleSoundToggle = (value: boolean) => {
    dispatch(setSoundEnabled(value));
  };

  const handleVibrationToggle = (value: boolean) => {
    dispatch(setVibrationEnabled(value));
  };

  const showComingSoon = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible en una próxima actualización.');
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (onPress && <Text style={styles.settingArrow}>›</Text>)}
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Notificaciones */}
      {renderSection('🔔 Notificaciones', (
        <>
          {renderSettingItem(
            '🔊',
            'Sonido',
            'Reproducir sonido para notificaciones',
            undefined,
            <Switch
              value={soundEnabled}
              onValueChange={handleSoundToggle}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={soundEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          )}
          
          {renderSettingItem(
            '📳',
            'Vibración',
            'Vibrar para notificaciones',
            undefined,
            <Switch
              value={vibrationEnabled}
              onValueChange={handleVibrationToggle}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={vibrationEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          )}
          
          {renderSettingItem(
            '📦',
            'Notificaciones de pedidos',
            'Recibir alertas de nuevos pedidos',
            showComingSoon
          )}
          
          {renderSettingItem(
            '💰',
            'Notificaciones de pagos',
            'Recibir alertas de pagos procesados',
            showComingSoon
          )}
        </>
      ))}

      {/* Navegación */}
      {renderSection('🗺️ Navegación', (
        <>
          {renderSettingItem(
            '📱',
            'App de mapas preferida',
            'Google Maps',
            () => {
              Alert.alert(
                'App de mapas',
                'Selecciona tu aplicación de mapas preferida',
                [
                  { text: 'Google Maps', onPress: () => {} },
                  { text: 'Waze', onPress: showComingSoon },
                  { text: 'Apple Maps', onPress: showComingSoon },
                  { text: 'Cancelar', style: 'cancel' }
                ]
              );
            }
          )}
          
          {renderSettingItem(
            '🔊',
            'Navegación por voz',
            'Instrucciones de voz durante la navegación',
            undefined,
            <Switch
              value={true}
              onValueChange={showComingSoon}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={'#FFFFFF'}
            />
          )}
          
          {renderSettingItem(
            '🛣️',
            'Tipo de ruta',
            'Más rápida',
            () => {
              Alert.alert(
                'Tipo de ruta',
                'Selecciona el tipo de ruta preferida',
                [
                  { text: 'Más rápida', onPress: () => {} },
                  { text: 'Evitar autopistas', onPress: showComingSoon },
                  { text: 'Más corta', onPress: showComingSoon },
                  { text: 'Cancelar', style: 'cancel' }
                ]
              );
            }
          )}
        </>
      ))}

      {/* Apariencia */}
      {renderSection('🎨 Apariencia', (
        <>
          {renderSettingItem(
            '🌙',
            'Modo oscuro',
            'Usar tema oscuro en la aplicación',
            undefined,
            <Switch
              value={darkMode}
              onValueChange={(value) => {
                setDarkMode(value);
                showComingSoon();
              }}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={darkMode ? '#FFFFFF' : '#f4f3f4'}
            />
          )}
          
          {renderSettingItem(
            '🔤',
            'Tamaño de fuente',
            'Mediano',
            () => {
              Alert.alert(
                'Tamaño de fuente',
                'Selecciona el tamaño de fuente',
                [
                  { text: 'Pequeño', onPress: showComingSoon },
                  { text: 'Mediano', onPress: () => {} },
                  { text: 'Grande', onPress: showComingSoon },
                  { text: 'Cancelar', style: 'cancel' }
                ]
              );
            }
          )}
          
          {renderSettingItem(
            '🌍',
            'Idioma',
            'Español',
            showComingSoon
          )}
        </>
      ))}

      {/* Privacidad y Seguridad */}
      {renderSection('🔒 Privacidad y Seguridad', (
        <>
          {renderSettingItem(
            '📍',
            'Compartir ubicación',
            'Permitir que BeFast acceda a tu ubicación',
            undefined,
            <Switch
              value={locationSharing}
              onValueChange={(value) => {
                if (!value) {
                  Alert.alert(
                    'Ubicación requerida',
                    'La ubicación es necesaria para recibir pedidos y navegar. ¿Estás seguro de desactivarla?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Desactivar', onPress: () => setLocationSharing(false) }
                    ]
                  );
                } else {
                  setLocationSharing(true);
                }
              }}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={locationSharing ? '#FFFFFF' : '#f4f3f4'}
            />
          )}
          
          {renderSettingItem(
            '📷',
            'Permisos de cámara',
            'Para fotos de entrega',
            showComingSoon
          )}
          
          {renderSettingItem(
            '🎤',
            'Permisos de micrófono',
            'Para navegación por voz',
            showComingSoon
          )}
          
          {renderSettingItem(
            '🔐',
            'Autenticación biométrica',
            'Usar huella dactilar o Face ID',
            showComingSoon
          )}
        </>
      ))}

      {/* Pedidos */}
      {renderSection('📦 Configuración de Pedidos', (
        <>
          {renderSettingItem(
            '⚡',
            'Aceptación automática',
            'Aceptar pedidos automáticamente (experimental)',
            undefined,
            <Switch
              value={autoAcceptOrders}
              onValueChange={(value) => {
                if (value) {
                  Alert.alert(
                    'Función experimental',
                    'La aceptación automática es una función experimental. ¿Quieres activarla?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Activar', onPress: () => setAutoAcceptOrders(true) }
                    ]
                  );
                } else {
                  setAutoAcceptOrders(false);
                }
              }}
              trackColor={{ false: '#767577', true: '#FF6B35' }}
              thumbColor={autoAcceptOrders ? '#FFFFFF' : '#f4f3f4'}
            />
          )}
          
          {renderSettingItem(
            '📏',
            'Radio de búsqueda',
            '10 km',
            () => {
              Alert.alert(
                'Radio de búsqueda',
                'Selecciona el radio máximo para recibir pedidos',
                [
                  { text: '5 km', onPress: showComingSoon },
                  { text: '10 km', onPress: () => {} },
                  { text: '15 km', onPress: showComingSoon },
                  { text: '20 km', onPress: showComingSoon },
                  { text: 'Cancelar', style: 'cancel' }
                ]
              );
            }
          )}
          
          {renderSettingItem(
            '💵',
            'Pedidos en efectivo',
            'Aceptar pedidos que se pagan en efectivo',
            showComingSoon
          )}
        </>
      ))}

      {/* Almacenamiento */}
      {renderSection('💾 Almacenamiento', (
        <>
          {renderSettingItem(
            '📱',
            'Espacio usado',
            '45 MB',
            showComingSoon
          )}
          
          {renderSettingItem(
            '🗑️',
            'Limpiar caché',
            'Eliminar archivos temporales',
            () => {
              Alert.alert(
                'Limpiar caché',
                '¿Quieres eliminar los archivos temporales? Esto puede liberar espacio de almacenamiento.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Limpiar',
                    onPress: () => {
                      Alert.alert('Caché limpiado', 'Se han eliminado los archivos temporales.');
                    }
                  }
                ]
              );
            }
          )}
        </>
      ))}

      {/* Acerca de */}
      {renderSection('ℹ️ Acerca de', (
        <>
          {renderSettingItem(
            '📱',
            'Versión de la app',
            '1.0.0 (Build 1)',
            showComingSoon
          )}
          
          {renderSettingItem(
            '📄',
            'Términos y condiciones',
            'Leer términos de uso',
            showComingSoon
          )}
          
          {renderSettingItem(
            '🔒',
            'Política de privacidad',
            'Leer política de privacidad',
            showComingSoon
          )}
          
          {renderSettingItem(
            '📞',
            'Contacto y soporte',
            'Obtener ayuda',
            () => {
              Alert.alert(
                'Soporte',
                'Contacta a nuestro equipo de soporte para obtener ayuda.',
                [
                  { text: 'OK' }
                ]
              );
            }
          )}
        </>
      ))}

      {/* Zona de peligro */}
      {renderSection('⚠️ Zona de Peligro', (
        <>
          {renderSettingItem(
            '🚪',
            'Cerrar sesión',
            'Salir de tu cuenta',
            () => {
              Alert.alert(
                'Cerrar sesión',
                '¿Estás seguro de que quieres cerrar sesión?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: () => navigation.navigate('Login')
                  }
                ]
              );
            }
          )}
          
          {renderSettingItem(
            '🗑️',
            'Eliminar cuenta',
            'Eliminar permanentemente tu cuenta',
            () => {
              Alert.alert(
                'Eliminar cuenta',
                'Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar tu cuenta permanentemente?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert(
                        'Confirmación final',
                        'Escribe "ELIMINAR" para confirmar la eliminación de tu cuenta.',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Contactar soporte', onPress: showComingSoon }
                        ]
                      );
                    }
                  }
                ]
              );
            }
          )}
        </>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginLeft: 20,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 20,
    color: '#CCC',
    marginLeft: 8,
  },
});

export default SettingsScreen;