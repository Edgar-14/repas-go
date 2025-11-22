'use client';

import React from 'react';
import { ChatWidget } from './ChatWidget';
import { useAuth } from '@/hooks/useAuth';

interface DriverChatbotProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left';
  minimized?: boolean;
  contextData?: any;
}

export function DriverChatbot({
  className,
  position = 'bottom-right',
  minimized = false,
  contextData
}: DriverChatbotProps) {
  const { user } = useAuth();

  return (
    <ChatWidget
      userRole="DRIVER"
      userId={user?.uid}
      position={position}
      minimized={minimized}
      className={className}
      contextData={contextData}
    />
  );
}