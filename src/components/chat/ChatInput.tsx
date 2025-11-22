'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Escribe tu pregunta...",
  maxLength = 500
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const remainingChars = maxLength - value.length;

  return (
    <div className="flex items-end space-x-3">
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className="w-full resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm leading-relaxed min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={1}
        />
        
        {/* Character Counter */}
        {remainingChars < 50 && (
          <div className={`absolute -bottom-5 right-0 text-xs ${
            remainingChars < 0 ? 'text-red-500' : 'text-gray-400'
          }`}>
            {remainingChars} caracteres restantes
          </div>
        )}
      </div>

      <Button
        onClick={onSend}
        disabled={!value.trim() || disabled || remainingChars < 0}
        size="sm"
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {disabled ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}