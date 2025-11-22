'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  MessageSquare, 
  Zap, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Clock,
  Star
} from 'lucide-react';

interface QuickSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  userRole: 'WELCOME' | 'DRIVER' | 'BUSINESS' | 'ADMIN';
  disabled?: boolean;
  showTitle?: boolean;
  maxVisible?: number;
  variant?: 'compact' | 'expanded' | 'welcome';
}

const ROLE_CONFIGS = {
  WELCOME: {
    title: '¿En qué te puedo ayudar?',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    badgeColor: 'bg-blue-100 text-blue-700',
    buttonStyle: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700'
  },
  DRIVER: {
    title: 'Consultas frecuentes',
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
    buttonStyle: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700'
  },
  BUSINESS: {
    title: 'Acciones rápidas',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'bg-gradient-to-r from-orange-500 to-red-500',
    badgeColor: 'bg-orange-100 text-orange-700',
    buttonStyle: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-700'
  },
  ADMIN: {
    title: 'Herramientas admin',
    icon: <Star className="w-4 h-4" />,
    color: 'bg-gradient-to-r from-gray-600 to-gray-800',
    badgeColor: 'bg-gray-100 text-gray-700',
    buttonStyle: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
  }
};

export function QuickSuggestions({
  suggestions,
  onSuggestionClick,
  userRole,
  disabled = false,
  showTitle = true,
  maxVisible = 6,
  variant = 'expanded'
}: QuickSuggestionsProps) {
  const [showAll, setShowAll] = useState(false);
  const config = ROLE_CONFIGS[userRole];
  
  if (!suggestions || suggestions.length === 0) return null;

  const visibleSuggestions = showAll ? suggestions : suggestions.slice(0, maxVisible);
  const hasMore = suggestions.length > maxVisible;

  if (variant === 'welcome') {
    return (
      <div className="w-full max-w-md mx-auto">
        {showTitle && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 mb-2">
              {config.icon}
              <h3 className="text-lg font-semibold text-gray-800">
                {config.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Selecciona una opción o escribe tu pregunta
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          {visibleSuggestions.map((suggestion, idx) => (
            <Button
              key={idx}
              variant="outline"
              className={`w-full h-auto min-h-[3rem] px-4 py-3 rounded-xl ${config.buttonStyle} transition-all duration-200 text-left justify-start bg-white hover:shadow-md group relative overflow-hidden`}
              onClick={() => onSuggestionClick(suggestion)}
              disabled={disabled}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={`w-8 h-8 rounded-full ${config.badgeColor} flex items-center justify-center flex-shrink-0`}>
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium flex-1 text-left">
                  {suggestion}
                </span>
              </div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          ))}
          
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Ver más opciones ({suggestions.length - maxVisible})
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {showTitle && (
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="outline" className={config.badgeColor}>
              {config.icon}
              <span className="ml-1 text-xs">{config.title}</span>
            </Badge>
            <Badge variant="outline" className="text-gray-500 border-gray-200">
              <Clock className="w-3 h-3 mr-1" />
              <span className="text-xs">Rápido</span>
            </Badge>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {visibleSuggestions.map((suggestion, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className={`text-xs h-7 px-3 rounded-full ${config.buttonStyle} transition-all duration-200 hover:scale-105`}
              onClick={() => onSuggestionClick(suggestion)}
              disabled={disabled}
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              {suggestion.length > 25 ? suggestion.slice(0, 25) + '...' : suggestion}
            </Button>
          ))}
          
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-xs h-7 px-2 rounded-full text-gray-500 hover:text-gray-700"
            >
              {showAll ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <>+{suggestions.length - maxVisible}</>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Expanded variant (default)
  return (
    <div className={`rounded-xl p-4 border transition-all duration-200 ${
      userRole === 'WELCOME' 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-full ${config.color} flex items-center justify-center text-white`}>
              {config.icon}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {config.title}
            </span>
          </div>
          
          <Badge variant="outline" className="text-gray-500 border-gray-300">
            <Zap className="w-3 h-3 mr-1" />
            <span className="text-xs">{suggestions.length}</span>
          </Badge>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-2">
        {visibleSuggestions.map((suggestion, idx) => (
          <Button
            key={idx}
            variant="outline"
            className={`h-10 px-3 rounded-lg ${config.buttonStyle} transition-all duration-200 text-left justify-start bg-white/80 hover:bg-white shadow-sm hover:shadow-md group`}
            onClick={() => onSuggestionClick(suggestion)}
            disabled={disabled}
          >
            <HelpCircle className="w-4 h-4 mr-2 text-gray-400 group-hover:text-current" />
            <span className="text-sm font-medium truncate">
              {suggestion}
            </span>
          </Button>
        ))}
        
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="h-8 text-gray-500 hover:text-gray-700 hover:bg-white/50"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Ver {suggestions.length - maxVisible} más
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}