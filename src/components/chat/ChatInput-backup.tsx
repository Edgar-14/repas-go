'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, HelpCircle } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
  showSuggestions?: boolean;
  userRole: 'WELCOME' | 'DRIVER' | 'BUSINESS' | 'ADMIN';
  maxLength?: number;
  isMobile?: boolean;
}

const ROLE_COLORS = {
  WELCOME: 'bg-befast-secondary hover:bg-blue-700',
  DRIVER: 'bg-befast-secondary hover:bg-blue-700', 
  BUSINESS: 'bg-befast-primary hover:bg-orange-600',
  ADMIN: 'bg-befast-dark hover:bg-gray-800'
};

export function ChatInput({
  value,
  onChange,
  onSend,
  onSuggestionClick,
  disabled = false,
  placeholder = "Escribe tu pregunta...",
  suggestions = [],
  showSuggestions = false,
  userRole,
  maxLength = 500,
  isMobile = false
}: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const buttonColor = ROLE_COLORS[userRole];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSuggestionClick?.(suggestion);
  };

  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars < 50;

  return (
    <div className="space-y-3">
      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="px-1">
          {userRole === 'WELCOME' ? (
            // Sugerencias prominentes para WELCOME bot
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="text-sm text-gray-700 mb-3 font-medium text-center">
                ¿En qué te puedo ayudar? 😊
              </div>
              <div className="grid grid-cols-1 gap-3">
                {suggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="h-12 px-4 rounded-lg border-blue-200 hover:border-blue-400 hover:bg-blue-100 transition-all duration-200 text-left justify-start bg-white/80 hover:bg-white shadow-sm hover:shadow-md"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={disabled}
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {suggestion}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            // Sugerencias compactas para otros bots
            <div>
              <div className="text-xs text-gray-500 mb-2 font-medium">Sugerencias rápidas:</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-3 rounded-full border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={disabled}
                  >
                    <HelpCircle className="w-3 h-3 mr-1" />
                    {suggestion.length > 25 ? suggestion.slice(0, 25) + '...' : suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className={`border rounded-xl transition-all duration-200 ${
        isFocused ? 'border-blue-300 ring-2 ring-blue-200' : 'border-gray-200'
      } ${disabled ? 'opacity-50' : ''}`}>
        <div className="flex items-end space-x-3 p-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              className="w-full resize-none border-0 outline-none bg-transparent text-sm leading-relaxed min-h-[20px] max-h-[120px] placeholder-gray-400"
              rows={1}
              style={{
                fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
              }}
            />
            
            {/* Character Counter */}
            {isNearLimit && (
              <div className={`absolute -bottom-5 right-0 text-xs ${
                remainingChars < 0 ? 'text-red-500' : 'text-gray-400'
              }`}>
                {remainingChars} caracteres restantes
              </div>
            )}
          </div>

          <Button
            onClick={handleSend}
            disabled={!value.trim() || disabled || remainingChars < 0}
            size="sm"
            className={`${buttonColor} text-white rounded-xl px-4 py-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          >
            {disabled ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}