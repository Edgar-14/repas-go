import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, SafeAreaView, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MockOrder, ChatMessage } from '../../types';
import { useMockData } from '../../hooks/useMockData';
import { getGeminiQuickReplies } from '../../services/geminiService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface DriverChatModalProps {
    order: MockOrder;
    onClose: () => void;
    visible: boolean;
}

const DriverChatModal: React.FC<DriverChatModalProps> = ({ order, onClose, visible }) => {
    const [messages, setMessages] = useState<ChatMessage[]>(order.chatHistory);
    const [input, setInput] = useState('');
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const { addChatMessage } = useMockData();
    const flatListRef = useRef<FlatList>(null);
    
    useEffect(() => {
        setMessages(order.chatHistory);
    }, [order.chatHistory]);

    const handleSend = async (text: string) => {
        if (text.trim() === '') return;
        const newMessage: ChatMessage = {
            sender: 'driver',
            text: text,
            timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        };
        addChatMessage(order.id, newMessage);
        setInput('');
        setSuggestedReplies([]);
    };
    
    const handleSuggestReplies = async () => {
        const lastCustomerMessage = messages.slice().reverse().find(m => m.sender === 'customer' || m.sender === 'business');
        if (!lastCustomerMessage) return;
        
        setIsLoadingSuggestions(true);
        setSuggestedReplies([]);
        const replies = await getGeminiQuickReplies(lastCustomerMessage.text, 'driver');
        setSuggestedReplies(replies);
        setIsLoadingSuggestions(false);
    }
    
    const renderMessage = ({ item }: { item: ChatMessage }) => (
        <View style={[styles.messageRow, item.sender === 'driver' ? styles.driverRow : styles.otherRow]}>
            {item.sender === 'customer' && <User color="#718096" size={20} style={styles.icon} />}
            <View style={[styles.bubble, item.sender === 'driver' ? styles.driverBubble : styles.otherBubble]}>
                <Text style={item.sender === 'driver' ? styles.driverText : styles.otherText}>{item.text}</Text>
                <Text style={[styles.timestamp, item.sender === 'driver' ? styles.driverTimestamp : styles.otherTimestamp]}>{item.timestamp}</Text>
            </View>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <SafeAreaView style={styles.modalView}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Chat con {order.customerName}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#718096" />
                        </TouchableOpacity>
                    </View>
                    
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item, index) => index.toString()}
                        style={styles.chatArea}
                        contentContainerStyle={{ padding: 12 }}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />
                    
                    <View style={styles.inputContainer}>
                        {(suggestedReplies.length > 0 || isLoadingSuggestions) && (
                            <View style={styles.suggestionsContainer}>
                                {isLoadingSuggestions && <ActivityIndicator color="#00B894" />}
                                {suggestedReplies.map(reply => (
                                    <TouchableOpacity key={reply} onPress={() => handleSend(reply)} style={styles.suggestionChip}>
                                        <Text style={styles.suggestionText}>{reply}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                       
                        <View style={styles.inputRow}>
                            <TouchableOpacity onPress={handleSuggestReplies} disabled={isLoadingSuggestions} style={styles.sparkleButton}>
                                <Sparkles size={20} color="#00B894" />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.input}
                                value={input}
                                onChangeText={setInput}
                                placeholder="Escribe tu mensaje..."
                                placeholderTextColor="#A0AEC0"
                            />
                            <TouchableOpacity
                                onPress={() => handleSend(input)}
                                disabled={input.trim() === ''}
                                style={[styles.sendButton, input.trim() === '' && styles.sendButtonDisabled]}
                            >
                                <Send size={20} color="white" />
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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        height: '95%',
        maxHeight: 700,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
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
    },
    chatArea: {
        flex: 1,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 4,
        maxWidth: '85%',
    },
    driverRow: {
        alignSelf: 'flex-end',
    },
    otherRow: {
        alignSelf: 'flex-start',
    },
    icon: {
        marginRight: 8,
        marginBottom: 8,
    },
    bubble: {
        padding: 10,
        borderRadius: 16,
    },
    driverBubble: {
        backgroundColor: '#00B894',
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: '#EDF2F7',
        borderBottomLeftRadius: 4,
    },
    driverText: {
        color: 'white',
        fontSize: 14,
    },
    otherText: {
        color: '#2D3748',
        fontSize: 14,
    },
    timestamp: {
        fontSize: 10,
        opacity: 0.7,
        marginTop: 4,
    },
    driverTimestamp: {
        color: 'white',
        textAlign: 'right',
    },
    otherTimestamp: {
        color: '#718096',
        textAlign: 'left',
    },
    inputContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#F7FAFC',
    },
    suggestionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    suggestionChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(0, 184, 148, 0.1)',
        borderRadius: 999,
        margin: 4,
    },
    suggestionText: {
        color: '#00B894',
        fontWeight: '600',
        fontSize: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sparkleButton: {
        padding: 12,
        borderRadius: 999,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    input: {
        flex: 1,
        height: 44,
        backgroundColor: 'white',
        borderRadius: 22,
        paddingHorizontal: 16,
        borderColor: '#CBD5E0',
        borderWidth: 1,
        fontSize: 14,
        marginHorizontal: 8,
    },
    sendButton: {
        padding: 12,
        borderRadius: 999,
        backgroundColor: '#00B894',
    },
    sendButtonDisabled: {
        backgroundColor: '#A0AEC0',
    },
});

export default DriverChatModal;
