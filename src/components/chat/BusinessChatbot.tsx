'use client';

import React from 'react';
import { ChatWidget } from './ChatWidget';
import { useAuth } from '@/hooks/useAuth';

interface BusinessChatbotProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left';
  minimized?: boolean;
  contextData?: any;
}

export function BusinessChatbot({
  className,
  position = 'bottom-right',
  minimized = false,
  contextData
}: BusinessChatbotProps) {
  const { user } = useAuth();

  return (
    <ChatWidget
      userRole="BUSINESS"
      userId={user?.uid}
      position={position}
      minimized={minimized}
      className={className}
      contextData={contextData}
    />
  );
}