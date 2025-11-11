import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Order, ChatMessage } from '../../types';
import { useMockData } from '../../hooks/useMockData';
import { getGeminiQuickReplies } from '../../services/geminiService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomerChatProps {
    order: Order;
}

const CustomerChat: React.FC<CustomerChatProps> = ({ order }) => {
    const [messages, setMessages] = useState<ChatMessage[]>(order.chatHistory);
    const [input, setInput] = useState('');
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const { addChatMessage } = useMockData();
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        setMessages(order.chatHistory);
    }, [order.chatHistory]);

    const handleSend = (text: string) => {
        if (text.trim() === '') return;

        const newMessage: ChatMessage = {
            sender: 'customer',
            text: text,
            timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        };
        
        addChatMessage(order.id, newMessage);
        setInput('');
        setSuggestedReplies([]);
    };
    
    const handleSuggestReplies = async () => {
        const lastMessage = messages.slice().reverse().find(m => m.sender === 'driver' || m.sender === 'business');
        if (!lastMessage) return;
        
        setIsLoadingSuggestions(true);
        setSuggestedReplies([]);
        const replies = await getGeminiQuickReplies(lastMessage.text, 'customer');
        setSuggestedReplies(replies);
        setIsLoadingSuggestions(false);
    }

    const renderMessage = ({ item }: { item: ChatMessage }) => (
      <View style={[styles.messageRow, item.sender === 'customer' ? styles.customerRow : styles.otherRow]}>
            {item.sender === 'business' && <Building color="#718096" size={16} style={styles.icon} />}
            {item.sender === 'driver' && <View style={styles.driverAvatar} />}
            <View style={[styles.bubble, item.sender === 'customer' ? styles.customerBubble : styles.otherBubble]}>
                <Text style={item.sender === 'customer' ? styles.customerText : styles.otherText}>{item.text}</Text>
                <Text style={[styles.timestamp, item.sender === 'customer' ? styles.customerTimestamp : styles.otherTimestamp]}>{item.timestamp}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Chat de Entrega</Text>
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item, index) => index.toString()}
                style={styles.chatArea}
                contentContainerStyle={{ padding: 8 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
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
                    <Sparkles size={18} color="#3B82F6" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Escribe un mensaje..."
                    placeholderTextColor="#A0AEC0"
                />
                <TouchableOpacity
                    onPress={() => handleSend(input)}
                    disabled={input.trim() === ''}
                    style={[styles.sendButton, input.trim() === '' && styles.sendButtonDisabled]}
                >
                    <Send size={18} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 8,
    },
    chatArea: {
        backgroundColor: '#F7FAFC',
        borderRadius: 8,
        maxHeight: 160,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 4,
        maxWidth: '85%',
    },
    customerRow: {
        alignSelf: 'flex-end',
    },
    otherRow: {
        alignSelf: 'flex-start',
    },
    icon: {
        marginRight: 4,
        marginBottom: 4,
    },
    driverAvatar: {
        width: 20,
        height: 20,
        backgroundColor: '#00B894',
        borderRadius: 10,
        marginRight: 4,
        marginBottom: 4,
    },
    bubble: {
        padding: 10,
        borderRadius: 16,
    },
    customerBubble: {
        backgroundColor: '#3B82F6',
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
    },
    customerText: {
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
    customerTimestamp: {
        color: 'white',
        textAlign: 'right',
    },
    otherTimestamp: {
        color: '#718096',
        textAlign: 'left',
    },
    suggestionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 8,
    },
    suggestionChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 999,
        margin: 4,
    },
    suggestionText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
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

export default CustomerChat;
