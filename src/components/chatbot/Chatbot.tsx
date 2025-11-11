import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, SafeAreaView, Linking } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getGeminiChatResponse } from '../../services/geminiService';
import { ChatMessage, MapGroundingChunk } from '../../types';

interface ChatbotProps {
  onClose: () => void;
  visible: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose, visible }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinkingMode, setUseThinkingMode] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setMessages([{ sender: 'model', text: "Hola, soy tu asistente BeFast. ¿Cómo puedo ayudarte hoy? Activa 'Maps' para preguntas sobre lugares o 'Complejo' para consultas difíciles.", timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) }])
  }, []);

  useEffect(() => {
    if (useMaps) {
      // NOTE: For location permissions, use a library like 'react-native-geolocation-service'
      // and request permissions via React Native's PermissionsAndroid API or in Info.plist (iOS).
      // This is a simplified version.
      // navigator.geolocation.getCurrentPosition(...);
    }
  }, [useMaps]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input, timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history = messages
      .filter(msg => msg.sender === 'user' || msg.sender === 'model')
      .map(msg => ({
        role: msg.sender as 'user' | 'model',
        parts: [{ text: msg.text }],
      }));
    
    try {
      const response = await getGeminiChatResponse(input, history, useThinkingMode, useMaps, location ?? undefined);
      const geminiMessage: ChatMessage = { 
          sender: 'model', 
          text: response.text, 
          timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          groundingChunks: response.groundingChunks,
      };
      setMessages(prev => [...prev, geminiMessage]);
    } catch (error) {
       const errorMessage: ChatMessage = { sender: 'model', text: "Lo siento, ocurrió un error al procesar tu solicitud.", timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) };
       setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
     <View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessageContainer : styles.modelMessageContainer]}>
        {item.sender === 'model' && <Bot color="#00B894" width={24} height={24} style={styles.avatar} />}
        <View style={styles.messageContent}>
            <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.modelBubble]}>
                <Text style={item.sender === 'user' ? styles.userText : styles.modelText}>{item.text}</Text>
            </View>
            {item.groundingChunks && item.groundingChunks.length > 0 && (
                <View style={styles.groundingContainer}>
                    {item.groundingChunks.map((chunk: any, idx) => (
                        <TouchableOpacity key={idx} onPress={() => Linking.openURL(chunk.maps.uri)} style={styles.groundingChunk}>
                            <MapPin color="#D63031" width={20} height={20} />
                            <View style={styles.groundingTextContainer}>
                                <Text style={styles.groundingTitle}>{chunk.maps.title}</Text>
                                <Text style={styles.groundingLink}>Ver en Google Maps</Text>
                            </View>
                            <ExternalLink color="#A0AEC0" width={16} height={16} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
        {item.sender === 'user' && <User color="#4A5568" width={24} height={24} style={styles.avatar} />}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Bot color="#00B894" />
                        <Text style={styles.headerTitle}>Asistente Virtual</Text>
                    </View>
                    <TouchableOpacity onPress={onClose}>
                        <X color="#718096" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item, index) => index.toString()}
                    style={styles.messageList}
                    contentContainerStyle={{ padding: 16 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
                {isLoading && (
                    <View style={styles.loadingIndicator}>
                        <ActivityIndicator size="small" color="#00B894" />
                    </View>
                )}
                <View style={styles.inputContainer}>
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity 
                            onPress={() => setUseMaps(!useMaps)}
                            style={[styles.toggleButton, useMaps && styles.toggleButtonActiveMaps]}
                        >
                            <MapPin size={14} color={useMaps ? '#FFF' : '#718096'} />
                            <Text style={[styles.toggleText, useMaps && styles.toggleTextActive]}>Maps</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setUseThinkingMode(!useThinkingMode)}
                            style={[styles.toggleButton, useThinkingMode && styles.toggleButtonActiveComplex]}
                        >
                            <BrainCircuit size={14} color={useThinkingMode ? '#FFF' : '#718096'} />
                            <Text style={[styles.toggleText, useThinkingMode && styles.toggleTextActive]}>Complejo</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            value={input}
                            onChangeText={setInput}
                            placeholder="Escribe tu mensaje..."
                            placeholderTextColor="#A0AEC0"
                            editable={!isLoading}
                        />
                        <TouchableOpacity onPress={handleSend} disabled={isLoading || input.trim() === ''} style={[styles.sendButton, (isLoading || input.trim() === '') && styles.sendButtonDisabled]}>
                            <Send color="#FFF" width={20} height={20} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    container: {
        height: '90%',
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginLeft: 8,
    },
    messageList: {
        flex: 1,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        maxWidth: '85%',
    },
    userMessageContainer: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    modelMessageContainer: {
        alignSelf: 'flex-start',
    },
    avatar: {
        marginHorizontal: 8,
        marginTop: 4,
    },
    messageContent: {
        flex: 1,
    },
    bubble: {
        padding: 12,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: '#00B894',
        borderBottomRightRadius: 4,
    },
    modelBubble: {
        backgroundColor: '#EDF2F7',
        borderBottomLeftRadius: 4,
    },
    userText: {
        color: 'white',
        fontSize: 14,
    },
    modelText: {
        color: '#2D3748',
        fontSize: 14,
    },
    groundingContainer: {
        marginTop: 8,
    },
    groundingChunk: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8
    },
    groundingTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    groundingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3748',
    },
    groundingLink: {
        fontSize: 12,
        color: '#3182CE',
    },
    loadingIndicator: {
        alignSelf: 'flex-start',
        marginLeft: 48,
        padding: 12,
        backgroundColor: '#EDF2F7',
        borderRadius: 20,
        borderBottomLeftRadius: 4,
    },
    inputContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#F7FAFC',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 8,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#EDF2F7',
        marginHorizontal: 8,
    },
    toggleButtonActiveMaps: {
        backgroundColor: '#3B82F6',
    },
    toggleButtonActiveComplex: {
        backgroundColor: '#8B5CF6',
    },
    toggleText: {
        fontSize: 12,
        marginLeft: 4,
        color: '#718096',
    },
    toggleTextActive: {
        color: 'white',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 44,
        backgroundColor: 'white',
        borderRadius: 22,
        paddingHorizontal: 16,
        borderColor: '#CBD5E0',
        borderWidth: 1,
        fontSize: 16,
        color: '#2D3748',
    },
    sendButton: {
        marginLeft: 8,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#00B894',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#A0AEC0',
    },
});

export default Chatbot;
