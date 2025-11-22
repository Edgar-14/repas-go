'use client';

import React from 'react';
import { Bot } from 'lucide-react';

interface ChatTypingProps {
  message?: string;
}

export function ChatTyping({ message = "Escribiendo..." }: ChatTypingProps) {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3 max-w-[85%]">
        {/* Bot Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>

        {/* Typing Bubble */}
        <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
          <div className="flex items-center space-x-2">
            {/* Animated Dots */}
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
            </div>
            
            {/* Optional Message */}
            {message && (
              <span className="text-sm text-gray-500 font-medium ml-2">
                {message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}