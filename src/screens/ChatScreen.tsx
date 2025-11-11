// Pantalla de Chat para BeFast GO
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { firestore } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { NavigationProps } from '../types';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderType: 'DRIVER' | 'CUSTOMER' | 'SUPPORT';
  timestamp: Date;
  read: boolean;
}

interface ChatScreenProps extends NavigationProps {
  route: {
    params: {
      orderId?: string;
      recipientId?: string;
      recipientName?: string;
      chatType: 'ORDER' | 'SUPPORT';
    };
  };
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { orderId, recipientId, recipientName, chatType } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { driver } = useAuth();

  useEffect(() => {
    // Listener para mensajes en tiempo real
    let chatRef: any;
    
    if (chatType === 'ORDER' && orderId) {
      chatRef = firestore()
        .collection('chats')
        .doc(`order_${orderId}`)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(50);
    } else if (chatType === 'SUPPORT') {
      chatRef = firestore()
        .collection('chats')
        .doc(`support_${driver?.uid}`)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(50);
    }

    const unsubscribe = chatRef?.onSnapshot((snapshot: any) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc: any) => {
        msgs.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        });
      });
      setMessages(msgs.reverse());
    });

    return () => unsubscribe?.();
  }, [orderId, chatType, driver]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      const chatId = chatType === 'ORDER' ? `order_${orderId}` : `support_${user?.uid}`;
      
      await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add({
          text: newMessage.trim(),
          senderId: driver?.uid,
          senderName: driver?.personalData?.fullName || 'Conductor',
          senderType: 'DRIVER',
          timestamp: firestore.FieldValue.serverTimestamp(),
          read: false,
        });

      setNewMessage('');
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === driver?.uid;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>
        </View>
        <Text style={styles.messageTime}>
          {item.timestamp.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  // Mensajes predefinidos
  const quickMessages = [
    '¿Dónde está la dirección?',
    'Ya llegué',
    'Hay tráfico, llegaré en 5 minutos',
    '¿Pueden bajar por el pedido?',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {chatType === 'ORDER' ? recipientName || 'Cliente' : 'Soporte BeFast'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {chatType === 'ORDER' ? `Pedido #${orderId?.slice(-6)}` : 'Chat de soporte'}
          </Text>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Quick Messages */}
      {chatType === 'ORDER' && (
        <View style={styles.quickMessagesContainer}>
          <FlatList
            horizontal
            data={quickMessages}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.quickMessageButton}
                onPress={() => {
                  setNewMessage(item);
                }}
              >
                <Text style={styles.quickMessageText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Escribe un mensaje..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: '#FF6B35',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    fontSize: 24,
    color: '#FFFFFF',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 8,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '100%',
  },
  ownMessageBubble: {
    backgroundColor: '#FF6B35',
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 8,
  },
  quickMessagesContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
  },
  quickMessageButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  quickMessageText: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});

export default ChatScreen;
