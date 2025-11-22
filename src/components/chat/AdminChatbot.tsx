'use client';

import React from 'react';
import { ChatWidget } from './ChatWidget';
import { useAuth } from '@/hooks/useAuth';

interface AdminChatbotProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left';
  minimized?: boolean;
  contextData?: any;
}

export function AdminChatbot({
  className,
  position = 'bottom-right',
  minimized = false,
  contextData
}: AdminChatbotProps) {
  const { user } = useAuth();

  return (
    <ChatWidget
      userRole="ADMIN"
      userId={user?.uid}
      position={position}
      minimized={minimized}
      className={className}
      contextData={contextData}
    />
  );
}