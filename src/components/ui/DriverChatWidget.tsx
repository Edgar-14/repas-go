import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Linking, // --- CORRECCIÓN 3: Importar Linking aquí
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigationState } from '@react-navigation/native';
import { emitMapAction } from '../../utils/EventBus';
import geminiService from '../../services/geminiService'; // --- CORRECCIÓN 3: Importar servicio aquí

// ============================================================================
// TIPOS Y CONFIGURACIÓN
// ============================================================================

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface DriverChatWidgetProps {}

// ... (El resto de la configuración DRIVER_CONFIG y getDriverPromptTemplate no cambia)
const DRIVER_CONFIG = {
  title: 'BeFast GO 🛵',
  description: 'Tu Aliado en Ruta',
  primaryColor: '#00B894',
  secondaryColor: '#00A383',
  welcomeMessage: '¡Hola! Soy BeFast GO, tu copiloto en ruta. Puedo ayudarte con tu billetera, pedidos, documentos y cualquier duda. ¿Cómo te puedo ayudar? 🚗',
  suggestions: [
    '¿Cuál es mi saldo disponible?',
    '¿Cómo liquido mi deuda?',
    'Estado de mi registro',
    '¿Cuáles son mis ganancias?'
  ],
};

const getDriverPromptTemplate = (userData: Record<string, any>) => `
---
IDENTIDAD Y MISIÓN
---
Eres "BeFast GO", el Aliado en Ruta oficial de BeFast.
Tu identidad es la de un copiloto experto, servicial e intuitivo. Tu misión es dar al repartidor la información que necesita de forma clara y rápida, resolver sus dudas operativas, explicar sus saldos y ayudarlo a superar cualquier obstáculo. Debes aprender de cada interacción para anticiparte a sus necesidades.

---
TONO Y PERSONALIDAD (Toque BeFast - Aliado)
---
1.  **Aliado en Ruta (80%):** Eres servicial, claro y respetuoso. Tu meta es ser el mejor copiloto y dar confianza. Usas un tono que inspira calma y eficiencia.
2.  **Lenguaje Natural:** Usas frases como "¡Con gusto!", "Aquí te ayudo", "Vamos a resolverlo", "¡Excelente trabajo!", "Así es, tu saldo es...", "Veo que tu solicitud está en...".
3.  **Emojis:** Usa emojis con moderación para dar energía: 🛵 💰 ✅ 👍.

---
REGLAS CRÍTICAS DEL SISTEMA (OBLIGATORIAS)
---
1.  **REGLA DE RESPUESTA DIRECTA:** Responde directamente al repartidor de forma conversacional, amable y muy clara.

2.  **REGLA DE FORMATO (TOQUE BEFAST):** Tu respuesta DEBE ser conversacional, amable y muy clara.
    * **NUNCA PÁRRAFOS LARGOS:** Divide siempre tus respuestas en varios mensajes cortos (burbujas de chat).
    * **ENFATIZA NATURALMENTE:** Resalta la información clave (como cifras, fechas o IDs) usando el contexto de la frase, no con formatos especiales como asteriscos.
    * **USA LISTAS VISUALES:** Usa emojis (ej: 🛵, 💰, ✅) para desglosar información de forma natural.

3.  **PROHIBICIÓN DE JERGA:** Tienes terminantemente prohibido usar palabras como "JSON", "API", "endpoint", "base de datos", "código" o cualquier jerga técnica en tu respuesta.

4.  **REGLA DE DATOS:** Solo puedes usar la información proporcionada en el contexto. No inventes números, saldos ni estados de pedido.

5.  **REGLA DE ESCALAMIENTO:** Si hay problemas técnicos que no puedes resolver (ej: "la app se traba", "no me deja cerrar pedido"), tu acción SIEMPRE es guiarlo a contactar a Soporte Técnico de Repartidores por WhatsApp.

---
CONTEXTO DE DATOS DISPONIBLES
---
-   Datos del repartidor: ${JSON.stringify(userData.driver || {})}
-   Transacciones recientes: ${JSON.stringify(userData.recentTransactions || [])}
-   Pedidos recientes: ${JSON.stringify(userData.recentOrders || [])}

---
ESCENARIOS DE AYUDA (QUÉ HACER)
---
1.  **Consulta de Saldo o Deuda (Billetera):**
    * Usa los números exactos del contexto (Dashboard/Billetera).
    * Describe "saldo" como dinero a tu favor (ganancias, propinas) y "deuda" como efectivo pendiente de liquidar.
    * Ej: "¡Claro! Te confirmo tu billetera: Tienes un saldo a favor de $150.00 y una deuda de efectivo por $80.00."

2.  **Liquidación de Deuda (Pagos Manuales):**
    * Si pregunta cómo pagar, guíalo: "Para liquidar tu deuda, puedes hacer una transferencia y subir tu comprobante en la app."
    * "Tu pago quedará pendiente hasta que el equipo de admin lo revise y apruebe."
    * "Una vez aprobado, tu deuda se actualizará. ✅"

3.  **Problema con Pedido en Ruta:**
    * Si pregunta "dónde es el pedido 123", busca en recentOrders y da la dirección.
    * Si reporta un problema (ej: "cliente no contesta"), valida la emoción ("Entiendo, es frustrante") y dale el siguiente paso (ej: "Intenta llamar una vez más. Si no, contacta a Soporte").

4.  **Consulta sobre Registro (Nuevos Aspirantes):**
    * Si pregunta "¿en qué paso voy?" o "¿por qué me rechazaron?":
    * Busca su estado (ej: "Pendiente de revisión", "Rechazado").
    * Explica los 5 pasos: 1. Datos Personales, 2. Documentos, 3. Contratos, 4. Capacitación, 5. Envío Final.
    * Ej: "¡Claro! Veo que tu solicitud está en el Paso 2: Documentos. Solo asegúrate de que las fotos de tu INE y licencia se vean súper claras."
    * Ej: "Tu solicitud fue rechazada. El motivo es: 'El cuestionario de capacitación no fue aprobado (tuviste 70%)'. Por favor, repasa los videos y vuelve a intentarlo."

5.  **Consulta sobre Dashboard:**
    * Si pregunta "¿cómo voy hoy?" o "¿cuál es mi calificación?":
    * Usa los datos del contexto para dar las métricas: Entregas, % a tiempo, Calificación, Ganancias.

---
CONTACTOS DE ESCALAMIENTO
---
- **Soporte Técnico Repartidores:** https://wa.me/5213121905494
- **Documentos y Registro:** documentos@befastapp.com.mx
- **Revisiones:** revisiones@befastapp.com.mx
`;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const DriverChatWidget: React.FC<DriverChatWidgetProps> = () => {
  const userId = 'driver123';
  const userData = { driver: { name: 'Juan Pérez' } };
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const chatAnimation = useRef(new Animated.Value(0)).current;

  // --- CORRECCIÓN 1: Mover useNavigationState al nivel superior ---
  const navState = useNavigationState((state: any) => state);

  // Detectar si estamos en pantalla de mapa para ajustar posición del botón
  const isMapScreen = useMemo(() => {
    try {
      const getActiveRouteName = (state: any): string | undefined => {
        if (!state) return undefined;
        const route = state.routes?.[state.index ?? 0];
        if (!route) return undefined;
        if (route.state) return getActiveRouteName(route.state);
        return route.name;
      };
      const activeRouteName = getActiveRouteName(navState);
      return [
        'Navigation',
        'GPSNavigation',
        'CustomerTracking',
        'OrderDetail',
      ].includes(activeRouteName || '');
    } catch (error) {
      // Si navState es undefined (porque no está en un Navigator), esto fallará
      return false;
    }
  }, [navState]); // Recalcular solo cuando el estado de navegación cambie

  // ============================================================================
  // FUNCIONES DE ANIMACIÓN Y CONTROL
  // ============================================================================

  const toggleChat = () => {
    if (isOpeningChat) return;
    setIsOpeningChat(true);

    if (isChatExpanded) {
      // Cerrar chat
      Animated.timing(chatAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setIsChatExpanded(false);
        setIsOpeningChat(false);
      });
    } else {
      // Abrir chat
      setIsChatExpanded(true);
      Animated.timing(chatAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setIsOpeningChat(false);
        // Agregar mensaje de bienvenida si es la primera vez
        if (messages.length === 0) {
          const welcomeMessage: ChatMessage = {
            id: 'welcome',
            content: DRIVER_CONFIG.welcomeMessage,
            sender: 'bot',
            timestamp: new Date(),
            status: 'sent',
          };
          setMessages([welcomeMessage]);
        }
      });
    }
  };

  // Auto-scroll cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  // Contador de mensajes no leídos
  useEffect(() => {
    if (!isChatExpanded && messages.length > 0 && messages[messages.length - 1].sender === 'bot') {
      setUnreadCount(prev => prev + 1);
    } else if (isChatExpanded) {
      setUnreadCount(0);
    }
  }, [messages, isChatExpanded]);

  // --- CORRECCIÓN 2: Eliminar el useEffect de isTyping ---
  // Esta lógica es redundante y conflictiva. El 'finally' en sendMessage
  // ya maneja el estado de isTyping correctamente.

  // ============================================================================
  // LÓGICA DE ENVÍO DE MENSAJES
  // ============================================================================

  // --- CORRECCIÓN 4: Modificar sendMessage para aceptar el texto ---
  const sendMessage = async (textToSend: string) => {
    const messageText = textToSend.trim();
    if (!messageText || isLoading) return;

    const userMessageId = `user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      content: messageText,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput(''); // Limpiar el input visualmente
    setIsLoading(true);
    setIsTyping(true);

    try {
      // (Ya importado en el top)
      // const geminiService = require('../../services/geminiService').default;
      const prompt = getDriverPromptTemplate(userData);

      // Si estamos en pantalla de mapa, activar modo mapas con ubicación base Colima
      let response: any;
      if (isMapScreen && geminiService.chatMaps) {
        response = await geminiService.chatMaps(messageText, {
          location: { latitude: 19.2433, longitude: -103.7240 } // Colima, MX por defecto
        });
      } else {
        response = await geminiService.generateResponse(messageText, prompt);
      }

      // Actualizar estado del mensaje del usuario
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessageId ? { ...msg, status: 'sent' } : msg
        )
      );

      let responseContent = 'Lo siento, no pude procesar tu consulta. Intenta de nuevo o contacta a soporte.';

      if (response && typeof response === 'string') {
        responseContent = response;
      } else if (response?.response) {
        responseContent = response.response;
      }

      // Intentar extraer una acción de mapa
      try {
        const match = /MAP_ACTION:\s*(\{[\s\S]*\})/m.exec(responseContent);
        if (match && match[1]) {
          const payload = JSON.parse(match[1]);
          emitMapAction(payload);
        }
      } catch (err) {
        // Ignorar parse errors de MAP_ACTION sin romper el chat
      }

      // --- CORRECCIÓN 5: Dividir la respuesta en múltiples burbujas ---
      // (Cumpliendo la REGLA DE FORMATO del prompt)
      const responseBubbles = responseContent
        .split('\n') // Dividir por saltos de línea
        .map(line => line.trim())
        .filter(line => line.length > 0); // Eliminar líneas vacías

      const aiMessages: ChatMessage[] = responseBubbles.map((bubble, index) => ({
        id: `bot_${Date.now()}_${index}`,
        content: bubble,
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent',
      }));

      // Agregar todas las burbujas nuevas al estado
      setMessages(prev => [...prev, ...aiMessages]);

    } catch (error) {
      console.error('Chatbot error:', error);

      // Marcar mensaje del usuario como error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessageId ? { ...msg, status: 'error' } : msg
        )
      );

      // Agregar mensaje de error
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: '⚠️ Hubo un problema al enviar tu mensaje. Verifica tu conexión e intenta de nuevo.',
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // --- CORRECCIÓN 4: Enviar la sugerencia directamente ---
    // Poner el texto en el input es solo visual, lo importante
    // es enviar el texto correcto a la función.
    setInput(suggestion);
    sendMessage(suggestion);
    // No usar setTimeout, eso causa una race condition.
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {/* Botón Flotante de Chat */}
      <TouchableOpacity
        style={[
          styles.fab,
          isMapScreen ? styles.chatTop : styles.chat,
        ]}
        onPress={toggleChat}
        disabled={isOpeningChat}
        accessibilityLabel="Abrir chatbot BeFast GO"
        accessibilityRole="button"
      >
        <Text style={{ fontSize: 24, color: '#FFFFFF' }}>
          {isChatExpanded ? "✕" : "💬"}
        </Text>
        {unreadCount > 0 && !isChatExpanded && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Ventana de Chat Expandible */}
      {isChatExpanded && (
        <Animated.View
          style={[
            styles.chatWindow,
            {
              opacity: chatAnimation,
              transform: [{
                scale: chatAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }
          ]}
        >
          <KeyboardAvoidingView
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            {/* Header del Chat */}
            <View style={[styles.chatHeader, { backgroundColor: DRIVER_CONFIG.primaryColor }]}>
              <Text style={{ fontSize: 20, color: '#FFFFFF' }}>🤖</Text>
              <View style={styles.headerTextContainer}>
                <Text style={styles.chatHeaderTitle}>{DRIVER_CONFIG.title}</Text>
                <Text style={styles.chatHeaderSubtitle}>{DRIVER_CONFIG.description}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  // --- CORRECCIÓN 3: Usar Linking importado ---
                  Linking.openURL('tel:911');
                }}
                style={styles.emergencyButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 16, color: '#FFFFFF' }}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleChat} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={{ fontSize: 20, color: '#FFFFFF' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Área de Mensajes */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Sugerencias iniciales */}
              {messages.length === 1 && !isLoading && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionHeader}>💡 Prueba preguntar:</Text>
                  {DRIVER_CONFIG.suggestions.map((suggestion, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSuggestionClick(suggestion)}
                      disabled={isLoading}
                      style={styles.suggestionButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                      <Text style={{ fontSize: 14, color: '#999' }}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Lista de mensajes */}
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.sender === 'user' ? styles.userMessageRow : styles.botMessageRow
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.sender === 'user'
                        ? [styles.userMessage, { backgroundColor: DRIVER_CONFIG.primaryColor }]
                        : styles.botMessage,
                      message.status === 'error' && styles.errorMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.sender === 'user' ? styles.userMessageText : styles.botMessageText
                      ]}
                    >
                      {message.content}
                    </Text>
                    <View style={styles.messageFooter}>
                      <Text
                        style={[
                          styles.messageTime,
                          message.sender === 'user' ? styles.userMessageTime : styles.botMessageTime
                        ]}
                      >
                        {formatTime(message.timestamp)}
                      </Text>
                      {message.status === 'sending' && (
                        <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={styles.sendingIndicator} />
                      )}
                      {message.status === 'error' && (
                        <Text style={[styles.errorIcon, { fontSize: 10, color: '#FF3B30' }]}>⚠</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}

              {/* Indicador de escritura */}
              {isTyping && (
                <View style={[styles.messageRow, styles.botMessageRow]}>
                  <View style={styles.typingBubble}>
                    <View style={styles.typingDots}>
                      <View style={[styles.dot, styles.dot1]} />
                      <View style={[styles.dot, styles.dot2]} />
                      <View style={[styles.dot, styles.dot3]} />
                    </View>
                    <Text style={styles.typingText}>Escribiendo...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Área de Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Escribe tu mensaje..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={500}
                  editable={!isLoading}
                  returnKeyType="send"
                  // --- CORRECCIÓN 4: Actualizar onSubmitEditing ---
                  onSubmitEditing={() => sendMessage(input)}
                  blurOnSubmit={false}
                />
                {input.length > 0 && (
                  <Text style={styles.characterCount}>{input.length}/500</Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: DRIVER_CONFIG.primaryColor },
                  (!input.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                // --- CORRECCIÓN 4: Actualizar onPress ---
                onPress={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 18, color: '#FFFFFF' }}>➤</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </View>
  );
};

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 10000,
  },
  chat: {
    right: 24,
    bottom: 100,
    backgroundColor: '#00B894',
  },
  chatTop: {
    right: 24,
    top: 100,
    backgroundColor: '#00B894',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatWindow: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: screenWidth - 32,
    maxWidth: 380,
    height: Math.min(screenHeight * 0.65, 500),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    zIndex: 10001,
    overflow: 'hidden',
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messagesContent: {
    padding: 12,
    paddingBottom: 20,
  },
  suggestionsContainer: {
    marginBottom: 16,
  },
  suggestionHeader: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '500',
    flex: 1,
  },
  messageRow: {
    marginBottom: 12,
  },
  userMessageRow: {
    alignItems: 'flex-end',
  },
  botMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userMessage: {
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  errorMessage: {
    borderColor: '#FF3B30',
    borderWidth: 2,
    backgroundColor: '#FFF5F5',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  botMessageText: {
    color: '#2D3748',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  messageTime: {
    fontSize: 11,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botMessageTime: {
    color: '#9CA3AF',
  },
  sendingIndicator: {
    marginLeft: 4,
  },
  errorIcon: {
    marginLeft: 4,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginRight: 4,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.8 },
  typingText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 50,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
    color: '#2D3748',
  },
  characterCount: {
    position: 'absolute',
    bottom: 6,
    right: 12,
    fontSize: 10,
    color: '#9CA3AF',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});

export default DriverChatWidget;