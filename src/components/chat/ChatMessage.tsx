'use client';

import React from 'react';
import { Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickAction {
  label: string;
  action: string;
  data?: any;
}

interface ChatMessageProps {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  actions?: QuickAction[];
  userRole: 'WELCOME' | 'DRIVER' | 'BUSINESS' | 'ADMIN';
  onActionClick?: (action: QuickAction) => void;
  isMobile?: boolean;
}

const ROLE_COLORS = {
  WELCOME: 'bg-befast-secondary',
  DRIVER: 'bg-befast-secondary',
  BUSINESS: 'bg-befast-primary',
  ADMIN: 'bg-befast-dark'
};

export function ChatMessage({
  id,
  content,
  sender,
  timestamp,
  status,
  actions,
  userRole,
  onActionClick,
  isMobile = false
}: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Loader2 className="w-3 h-3 animate-spin opacity-50" />;
      case 'error':
        return <span className="text-red-500 text-xs">⚠</span>;
      default:
        return null;
    }
  };

  const userBubbleColor = ROLE_COLORS[userRole];

  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex items-start gap-3 max-w-[85%] ${sender === 'user' ? 'flex-row-reverse' : 'flex-row'
          }`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${sender === 'user'
            ? 'bg-gray-100'
            : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}
        >
          {sender === 'user' ? (
            <User className="w-4 h-4 text-gray-600" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col space-y-2">
          {/* Message Bubble */}
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${sender === 'user'
              ? `${userBubbleColor} text-white shadow-lg`
              : 'bg-gray-50 text-gray-800 border border-gray-100'
              } ${sender === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
          >
            <div className="whitespace-pre-wrap font-medium">
              {content}
            </div>
            <div className={`flex items-center justify-between mt-2 text-xs ${sender === 'user' ? 'text-white/70' : 'text-gray-500'
              }`}>
              <span>{formatTime(timestamp)}</span>
              {sender === 'user' && getMessageStatusIcon(status)}
            </div>
          </div>

          {/* Quick Actions are now handled by the parent ChatWidget using QuickActions component */}
        </div>
      </div>
    </div>
  );
}