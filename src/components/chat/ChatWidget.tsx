'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  RefreshCw,
  Send,
  Loader2,
  AlertCircle,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  feedback?: 'helpful' | 'not-helpful';
}

interface ChatWidgetProps {
  userRole: 'WELCOME' | 'DRIVER' | 'BUSINESS' | 'ADMIN';
  userId?: string;
  initialMessage?: string;
  position?: 'bottom-right' | 'bottom-left';
  minimized?: boolean;
  className?: string;
  contextData?: any;
}

const ROLE_CONFIGS = {
  WELCOME: {
    title: 'Asistente BeFast',
    description: 'Te ayudo con información',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    icon: '🤖',
    welcomeMessage: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?',
    suggestions: [
      '¿Cómo funciona BeFast?',
      'Quiero ser conductor',
      'Información para negocios',
      'Contactar soporte',
    ],
  },
  DRIVER: {
    title: 'Asistente Conductor',
    description: 'Ayuda para conductores',
    color: 'bg-gradient-to-r from-green-500 to-green-600',
    hoverColor: 'hover:from-green-600 hover:to-green-700',
    icon: '🚗',
    welcomeMessage: 'Hola conductor, ¿en qué puedo ayudarte hoy?',
    suggestions: [
      'Estado de mis pedidos',
      'Problemas con la app',
      'Información de pagos',
      'Reportar un problema',
    ],
  },
  BUSINESS: {
    title: 'Asistente Negocio',
    description: 'Soporte para negocios',
    color: 'bg-gradient-to-r from-orange-500 to-orange-600',
    hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    icon: '🏪',
    welcomeMessage: 'Hola, soy tu asistente para negocios. ¿Cómo puedo ayudarte?',
    suggestions: [
      'Ver mis pedidos',
      'Configurar mi negocio',
      'Reportes de ventas',
      'Soporte técnico',
    ],
  },
  ADMIN: {
    title: 'Asistente Admin',
    description: 'Panel administrativo',
    color: 'bg-gradient-to-r from-gray-600 to-gray-700',
    hoverColor: 'hover:from-gray-700 hover:to-gray-800',
    icon: '⚙️',
    welcomeMessage: 'Asistente administrativo listo. ¿Qué necesitas?',
    suggestions: [
      'Estadísticas del sistema',
      'Gestión de usuarios',
      'Configuración',
      'Reportes',
    ],
  },
};

export function ChatWidget({
  userRole,
  userId,
  initialMessage,
  position = 'bottom-right',
  minimized = false,
  className = '',
  contextData,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(minimized);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialMessage || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const config = ROLE_CONFIGS[userRole];

  // 🔥 SOLUCIÓN: Cerrar widget al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Auto-scroll mejorado
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping, isOpen]);

  // Contador de mensajes no leídos
  useEffect(() => {
    if (!isOpen && messages.length > 0 && messages[messages.length - 1].sender === 'bot') {
      setUnreadCount(prev => prev + 1);
    } else if (isOpen) {
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Efecto de escritura para mensajes del bot
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => setIsTyping(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  // Inicializar con mensaje de bienvenida
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      if (userRole !== 'WELCOME' && config.welcomeMessage) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          content: config.welcomeMessage,
          sender: 'bot',
          timestamp: new Date(),
          status: 'sent',
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [isOpen, userRole, config.welcomeMessage, messages.length]);

  // Auto-ajustar altura del textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = async (messageText?: string) => {
    const messageToSend = messageText || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessageId = `user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      content: messageToSend,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const handleChatMessage = httpsCallable(functions, 'handleChatMessage');

      const response = await handleChatMessage({
        userRole: userRole,
        userId: userId || user?.uid || 'anonymous',
        message: messageToSend,
        context: {
          uid: user?.uid ?? userId ?? 'anonymous',
          email: user?.email ?? '',
          displayName: user?.displayName ?? 'Usuario',
          ...contextData,
        },
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId ? { ...msg, status: 'sent' } : msg
        )
      );

      const responseData = response.data as any;
      let responseContent = 'Lo siento, no pude procesar tu consulta.';

      if (responseData?.response) {
        responseContent = responseData.response;
      } else if (typeof responseData === 'string') {
        responseContent = responseData;
      }

      const aiMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        content: responseContent,
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent',
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId ? { ...msg, status: 'error' } : msg
        )
      );

      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.',
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent',
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: 'Error en el chat',
        description: 'No se pudo procesar la consulta. Verifica tu conexión.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const clearConversation = () => {
    setMessages([]);
    if (userRole !== 'WELCOME' && config.welcomeMessage) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome_new',
        content: config.welcomeMessage,
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent',
      };
      setMessages([welcomeMessage]);
    }

    toast({
      title: 'Nueva conversación',
      description: 'Se ha iniciado una nueva conversación.',
      duration: 3000,
    });
  };

  const handleFeedback = (messageId: string, feedback: 'helpful' | 'not-helpful') => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );
    
    toast({
      title: '¡Gracias por tu feedback!',
      description: 'Tu opinión nos ayuda a mejorar.',
      duration: 2000,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <div
      ref={widgetRef}
      // CAMBIO CRÍTICO: z-index reducido y pointer-events controlado
      className={`fixed ${
        position === 'bottom-left' ? 'bottom-4 left-4' : 'bottom-4 right-4'
      } z-20 md:z-30 ${className} ${!isOpen ? 'pointer-events-none' : ''}`}
    >
      {/* Contenedor de la Ventana del Chat - RESPONSIVE */}
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-gray-200/80 transition-all duration-300 ease-in-out ${
          isMinimized 
            ? 'w-80 h-16' 
            : 'w-[95vw] max-w-sm md:w-96 h-[80vh] md:h-[600px]' // 🔥 CAMBIO: Responsive en móviles
        } ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()} // 🔥 Previene propagación
      >
        {/* Header */}
        <div
          className={`${config.color} text-white p-4 rounded-t-2xl flex items-center justify-between`}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base truncate flex items-center">
                {config.title}
                <Badge
                  variant="outline"
                  className="ml-2 text-white border-white/30 bg-white/10 text-xs font-semibold py-0 h-5"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  IA
                </Badge>
              </h3>
              <p className="text-sm opacity-90 truncate">
                {config.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0">
            {messages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 p-0 transition-all duration-200 rounded-lg"
                title="Nueva conversación"
              >
                <RefreshCw size={16} />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 p-0 transition-all duration-200 rounded-lg"
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 p-0 transition-all duration-200 rounded-lg"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex flex-col h-full" style={{ height: 'calc(100% - 72px)' }}>
            {/* Área de Mensajes */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {/* Sugerencias de Bienvenida */}
                {userRole === 'WELCOME' && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] px-2">
                    <div className="w-full max-w-sm">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center text-2xl mb-3 mx-auto">
                          {config.icon}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          ¡Hola! Soy tu asistente
                        </h3>
                        <p className="text-sm text-gray-600">
                          Estoy aquí para ayudarte con cualquier consulta
                        </p>
                      </div>

                      <div className="space-y-2">
                        {config.suggestions.map((suggestion: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isLoading}
                            className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group hover:shadow-md flex items-center justify-between bg-white"
                          >
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 flex-1">
                              {suggestion}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensajes */}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    } group`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-200 ${
                        message.sender === 'user'
                          ? `${config.color} text-white rounded-br-md shadow-lg`
                          : 'bg-gray-50 text-gray-900 rounded-bl-md border border-gray-100 shadow-sm'
                      } ${message.status === 'error' ? 'border-2 border-red-200 bg-red-50' : ''}`}
                    >
                      <div className="whitespace-pre-wrap font-medium">
                        {message.content}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className={`text-xs ${
                          message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                          {message.status === 'sending' && (
                            <Loader2 className="w-3 h-3 animate-spin inline ml-1" />
                          )}
                          {message.status === 'error' && (
                            <span className="text-red-300 text-xs flex items-center gap-1 ml-1">
                              <AlertCircle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </div>
                        
                        {/* Feedback para mensajes del bot */}
                        {message.sender === 'bot' && message.status === 'sent' && (
                          <div className="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => handleFeedback(message.id, 'helpful')}
                              className={`p-1 rounded ${
                                message.feedback === 'helpful' 
                                  ? 'text-green-600 bg-green-100' 
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, 'not-helpful')}
                              className={`p-1 rounded ${
                                message.feedback === 'not-helpful' 
                                  ? 'text-red-600 bg-red-100' 
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Indicador de "Escribiendo..." */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%] border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.1s' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          Escribiendo...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Área de Input Corregida */}
            <div className="border-t border-gray-200/60 p-3 bg-white">
              {/* Sugerencias rápidas */}
              {userRole !== 'WELCOME' && messages.length <= 1 && !isLoading && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-2 font-semibold flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Prueba preguntar:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config.suggestions.slice(0, 3).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isLoading}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-700 hover:text-gray-900 font-medium"
                      >
                        {suggestion.length > 25 ? suggestion.slice(0, 25) + '...' : suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Group - Estructura Corregida */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Escribe tu mensaje..."
                    disabled={isLoading}
                    maxLength={500}
                    className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[44px] max-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                    rows={1}
                  />
                  {/* Contador de caracteres - Posición corregida */}
                  <div className="absolute bottom-1 right-1">
                    <span className={`text-xs ${
                      input.length > 450 ? 'text-orange-500' : 
                      input.length > 480 ? 'text-red-500' : 'text-gray-400'
                    } bg-white px-1 rounded`}>
                      {input.length}/500
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className={`flex-shrink-0 w-10 h-10 ${config.color} ${config.hoverColor} text-white`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón Flotante - Tamaño reducido en móviles */}
      <div
        className={`absolute bottom-0 ${
          position === 'bottom-left' ? 'left-0' : 'right-0'
        } transition-all duration-300 ${
          isOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'
        }`}
      >
        <div className="relative">
          <Button
            onClick={toggleChat}
            // 🔥 CAMBIO: Botón más pequeño en móviles
            className={`rounded-full shadow-lg ${config.color} ${config.hoverColor} text-white w-12 h-12 md:w-14 md:h-14 pointer-events-auto`}
            size="icon"
          >
            <MessageCircle size={20} className="md:w-6 md:h-6" />
          </Button>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}