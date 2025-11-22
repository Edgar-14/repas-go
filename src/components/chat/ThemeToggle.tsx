'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button' | 'minimal';
  showLabel?: boolean;
}

const THEME_OPTIONS = [
  {
    value: 'light' as const,
    label: 'Claro',
    icon: Sun,
    description: 'Tema claro'
  },
  {
    value: 'dark' as const,
    label: 'Oscuro',
    icon: Moon,
    description: 'Tema oscuro'
  },
  {
    value: 'system' as const,
    label: 'Sistema',
    icon: Monitor,
    description: 'Usar configuración del sistema'
  }
];

export function ThemeToggle({ 
  size = 'md', 
  variant = 'icon',
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, setTheme, actualTheme } = useTheme();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-7 w-7';
      case 'lg':
        return 'h-10 w-10';
      default:
        return 'h-8 w-8';
    }
  };

  const getCurrentIcon = () => {
    switch (actualTheme) {
      case 'dark':
        return Moon;
      case 'light':
        return Sun;
      default:
        return Monitor;
    }
  };

  const CurrentIcon = getCurrentIcon();

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
        className={`${getSizeClasses()} p-0 hover:bg-white/20 text-white transition-colors`}
        title={`Cambiar a tema ${actualTheme === 'dark' ? 'claro' : 'oscuro'}`}
      >
        <CurrentIcon className="w-4 h-4" />
      </Button>
    );
  }

  if (variant === 'button') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-gray-200"
          >
            <Palette className="w-4 h-4" />
            {showLabel && <span className="text-sm">Tema</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs font-medium text-gray-500">
            Apariencia
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;
            
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTheme(option.value)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default icon variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`${getSizeClasses()} p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
        >
          <CurrentIcon className="w-4 h-4" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs font-medium text-gray-500">
          Tema
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span className="text-sm">{option.label}</span>
              </div>
              {isSelected && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}