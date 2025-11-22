import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  where,
  Timestamp,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';

export interface ConversationHistory {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
}

export interface ConversationMetadata {
  id: string;
  userRole: string;
  userId: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  messageCount: number;
  firstMessageAt?: Timestamp;
  conversationDuration?: string;
  isActive?: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  actions?: any[];
}

/**
 * Service for managing conversation persistence in Firestore
 * Integrates with the existing backend conversation storage system
 */
export class ConversationPersistenceService {
  
  /**
   * Generate a persistent conversation ID based on user and role
   */
  static generatePersistentConversationId(userId: string, userRole: string): string {
    return `${userRole.toLowerCase()}_${userId}_persistent`;
  }

  /**
   * Generate a session-based conversation ID for temporary conversations
   */
  static generateSessionConversationId(userId: string, userRole: string): string {
    return `${userRole.toLowerCase()}_${userId}_${Date.now()}`;
  }

  /**
   * Check if a conversation exists and has messages
   */
  static async checkConversationExists(conversationId: string): Promise<boolean> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        return false;
      }

      // Check if it has messages
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messagesQuery = query(messagesRef, limit(1));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      return !messagesSnapshot.empty;
    } catch (error) {
      console.error('Error checking conversation existence:', error);
      return false;
    }
  }

  /**
   * Load conversation history from Firestore
   * Returns messages in chronological order (oldest first)
   * Enhanced with better error handling and pagination support
   */
  static async loadConversationHistory(
    conversationId: string, 
    messageLimit: number = 50,
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<ChatMessage[]> {
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      let messagesQuery = query(
        messagesRef, 
        orderBy('timestamp', 'asc'), 
        limit(messageLimit)
      );

      // Add pagination support
      if (startAfterDoc) {
        messagesQuery = query(
          messagesRef, 
          orderBy('timestamp', 'asc'), 
          startAfter(startAfterDoc),
          limit(messageLimit)
        );
      }

      const messagesSnapshot = await getDocs(messagesQuery);
      
      if (messagesSnapshot.empty) {
        return [];
      }

      const historyMessages: ChatMessage[] = messagesSnapshot.docs.map((doc, index) => {
        const data = doc.data() as ConversationHistory;
        
        // Enhanced message validation
        if (!data.content || !data.role) {
          console.warn(`Invalid message data in conversation ${conversationId}:`, data);
          return null;
        }

        return {
          id: `history_${conversationId}_${doc.id}`,
          content: data.content,
          sender: data.role === 'user' ? 'user' : 'bot',
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
          status: 'sent'
        };
      }).filter(Boolean) as ChatMessage[];

      return historyMessages;
    } catch (error) {
      console.error('Error loading conversation history:', error);
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          conversationId,
          messageLimit
        });
      }
      
      return [];
    }
  }

  /**
   * Get conversation metadata (last message, count, etc.)
   * Enhanced with conversation duration and activity status
   */
  static async getConversationMetadata(conversationId: string): Promise<ConversationMetadata | null> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        return null;
      }

      const conversationData = conversationDoc.data();
      
      // Get message count, first and last messages
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const [lastMessageSnapshot, firstMessageSnapshot, allMessagesSnapshot] = await Promise.all([
        getDocs(query(messagesRef, orderBy('timestamp', 'desc'), limit(1))),
        getDocs(query(messagesRef, orderBy('timestamp', 'asc'), limit(1))),
        getDocs(messagesRef)
      ]);
      
      const messageCount = allMessagesSnapshot.size;
      
      let lastMessage = '';
      let lastMessageAt = Timestamp.now();
      let firstMessageAt: Timestamp | undefined;
      let conversationDuration: string | undefined;
      
      if (!lastMessageSnapshot.empty) {
        const lastMessageData = lastMessageSnapshot.docs[0].data() as ConversationHistory;
        lastMessage = lastMessageData.content;
        lastMessageAt = lastMessageData.timestamp;
      }

      if (!firstMessageSnapshot.empty) {
        const firstMessageData = firstMessageSnapshot.docs[0].data() as ConversationHistory;
        firstMessageAt = firstMessageData.timestamp;
        
        // Calculate conversation duration
        if (firstMessageAt && lastMessageAt) {
          const durationMs = lastMessageAt.toMillis() - firstMessageAt.toMillis();
          conversationDuration = this.formatDuration(durationMs);
        }
      }

      // Determine if conversation is active (last message within 24 hours)
      const now = new Date();
      const lastMessageTime = lastMessageAt.toDate();
      const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
      const isActive = hoursSinceLastMessage <= 24;

      return {
        id: conversationId,
        userRole: conversationData.userRole || '',
        userId: conversationData.userId || '',
        lastMessage: this.truncateMessage(lastMessage, 100),
        lastMessageAt,
        messageCount,
        firstMessageAt,
        conversationDuration,
        isActive
      };
    } catch (error) {
      console.error('Error getting conversation metadata:', error);
      return null;
    }
  }

  /**
   * Get recent conversations for a user and role
   */
  static async getRecentConversations(
    userId: string, 
    userRole: string, 
    limit: number = 10
  ): Promise<ConversationMetadata[]> {
    try {
      // Note: This would require a composite index on conversations collection
      // For now, we'll use the persistent conversation approach
      const persistentConversationId = this.generatePersistentConversationId(userId, userRole);
      const metadata = await this.getConversationMetadata(persistentConversationId);
      
      return metadata ? [metadata] : [];
    } catch (error) {
      console.error('Error getting recent conversations:', error);
      return [];
    }
  }

  /**
   * Clear conversation history (for starting fresh)
   * Note: This doesn't delete from Firestore, just returns a new conversation ID
   */
  static clearConversationHistory(userId: string, userRole: string): string {
    return this.generateSessionConversationId(userId, userRole);
  }

  /**
   * Validate conversation continuity
   * Checks if the conversation should be continued based on time elapsed
   */
  static async shouldContinueConversation(
    conversationId: string, 
    maxAgeHours: number = 24
  ): Promise<boolean> {
    try {
      const metadata = await this.getConversationMetadata(conversationId);
      
      if (!metadata) {
        return false;
      }

      const lastMessageTime = metadata.lastMessageAt.toDate();
      const now = new Date();
      const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceLastMessage <= maxAgeHours;
    } catch (error) {
      console.error('Error validating conversation continuity:', error);
      return false;
    }
  }

  /**
   * Format conversation history for display
   * Enhanced with more detailed information
   */
  static formatConversationSummary(metadata: ConversationMetadata): string {
    const timeAgo = this.getTimeAgo(metadata.lastMessageAt.toDate());
    const messageText = metadata.messageCount === 1 ? 'mensaje' : 'mensajes';
    
    let summary = `${metadata.messageCount} ${messageText} • ${timeAgo}`;
    
    if (metadata.conversationDuration && metadata.messageCount > 2) {
      summary += ` • Duración: ${metadata.conversationDuration}`;
    }
    
    if (metadata.isActive) {
      summary += ' • Activa';
    }
    
    return summary;
  }

  /**
   * Get a detailed conversation summary for display
   */
  static getDetailedConversationSummary(metadata: ConversationMetadata): {
    title: string;
    subtitle: string;
    status: 'active' | 'recent' | 'old';
    lastMessage: string;
  } {
    const timeAgo = this.getTimeAgo(metadata.lastMessageAt.toDate());
    const messageText = metadata.messageCount === 1 ? 'mensaje' : 'mensajes';
    
    let status: 'active' | 'recent' | 'old' = 'old';
    const hoursSinceLastMessage = (new Date().getTime() - metadata.lastMessageAt.toDate().getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastMessage <= 1) {
      status = 'active';
    } else if (hoursSinceLastMessage <= 24) {
      status = 'recent';
    }

    return {
      title: `Conversación con ${metadata.messageCount} ${messageText}`,
      subtitle: `${timeAgo}${metadata.conversationDuration ? ` • ${metadata.conversationDuration}` : ''}`,
      status,
      lastMessage: metadata.lastMessage
    };
  }

  /**
   * Helper function to get human-readable time ago
   */
  static getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'hace un momento';
    } else if (diffMinutes < 60) {
      return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    }
  }

  /**
   * Helper function to format duration in human-readable format
   */
  private static formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      return 'menos de 1 minuto';
    }
  }

  /**
   * Helper function to truncate message content for display
   */
  private static truncateMessage(message: string, maxLength: number): string {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Load conversation history with enhanced loading states
   * Returns both messages and loading metadata
   */
  static async loadConversationHistoryWithMetadata(
    conversationId: string, 
    messageLimit: number = 50
  ): Promise<{
    messages: ChatMessage[];
    metadata: ConversationMetadata | null;
    hasMore: boolean;
    totalMessages: number;
  }> {
    try {
      const [messages, metadata] = await Promise.all([
        this.loadConversationHistory(conversationId, messageLimit),
        this.getConversationMetadata(conversationId)
      ]);

      const hasMore = metadata ? metadata.messageCount > messageLimit : false;
      const totalMessages = metadata ? metadata.messageCount : messages.length;

      return {
        messages,
        metadata,
        hasMore,
        totalMessages
      };
    } catch (error) {
      console.error('Error loading conversation history with metadata:', error);
      return {
        messages: [],
        metadata: null,
        hasMore: false,
        totalMessages: 0
      };
    }
  }

  /**
   * Check if conversation should show continuation indicator
   */
  static async shouldShowContinuationIndicator(
    conversationId: string,
    currentMessageCount: number
  ): Promise<boolean> {
    try {
      const metadata = await this.getConversationMetadata(conversationId);
      
      if (!metadata) {
        return false;
      }

      // Show indicator if there are more messages than currently displayed
      // and the conversation was active recently
      return metadata.messageCount > currentMessageCount && 
             metadata.isActive === true;
    } catch (error) {
      console.error('Error checking continuation indicator:', error);
      return false;
    }
  }

  /**
   * Get conversation statistics for analytics
   */
  static async getConversationStats(conversationId: string): Promise<{
    messageCount: number;
    userMessages: number;
    botMessages: number;
    averageResponseTime?: number;
    conversationLength?: string;
  } | null> {
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      
      if (messagesSnapshot.empty) {
        return null;
      }

      let userMessages = 0;
      let botMessages = 0;
      const messages = messagesSnapshot.docs.map(doc => doc.data() as ConversationHistory);
      
      messages.forEach(msg => {
        if (msg.role === 'user') {
          userMessages++;
        } else {
          botMessages++;
        }
      });

      // Calculate conversation length
      const firstMessage = messages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())[0];
      const lastMessage = messages.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
      
      let conversationLength: string | undefined;
      if (firstMessage && lastMessage && messages.length > 1) {
        const durationMs = lastMessage.timestamp.toMillis() - firstMessage.timestamp.toMillis();
        conversationLength = this.formatDuration(durationMs);
      }

      return {
        messageCount: messages.length,
        userMessages,
        botMessages,
        conversationLength
      };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return null;
    }
  }
}