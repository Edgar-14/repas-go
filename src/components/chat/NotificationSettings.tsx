'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  Play,
  Check,
  Bell,
  BellOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { notificationSounds, NotificationSoundOptions } from '@/lib/utils/notification-sounds';

interface NotificationSettingsProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  showLabel?: boolean;
}

const SOUND_TYPES = [
  { value: 'subtle', label: 'Sutil', description: 'Sonido suave y discreto' },
  { value: 'standard', label: 'Estándar', description: 'Sonido de notificación normal' },
  { value: 'attention', label: 'Atención', description: 'Sonido más prominente' }
] as const;

export function NotificationSettings({ 
  size = 'md', 
  variant = 'icon',
  showLabel = false 
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSoundOptions>({
    enabled: false,
    volume: 0.3,
    type: 'subtle'
  });
  const [isTestPlaying, setIsTestPlaying] = useState(false);

  useEffect(() => {
    // Load current settings
    setSettings(notificationSounds.getSettings());
  }, []);

  const updateSettings = (newSettings: Partial<NotificationSoundOptions>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    notificationSounds.updateSettings(updated);
  };

  const testSound = async () => {
    setIsTestPlaying(true);
    try {
      await notificationSounds.testSound();
    } catch (e) {
      console.warn('Failed to test sound:', e);
    }
    setTimeout(() => setIsTestPlaying(false), 1000);
  };

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

  if (variant === 'button') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-gray-200"
          >
            {settings.enabled ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
            {showLabel && <span className="text-sm">Sonidos</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-4">
          <DropdownMenuLabel className="text-sm font-medium mb-3">
            Configuración de Sonidos
          </DropdownMenuLabel>
          
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium">Sonidos de notificación</div>
              <div className="text-xs text-gray-500">Reproducir sonidos para nuevos mensajes</div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
            />
          </div>

          {settings.enabled && (
            <>
              <DropdownMenuSeparator className="my-3" />
              
              {/* Volume Control */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Volumen</label>
                  <span className="text-xs text-gray-500">{Math.round(settings.volume * 100)}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <VolumeX className="w-4 h-4 text-gray-400" />
                  <Slider
                    value={[settings.volume]}
                    onValueChange={([volume]) => updateSettings({ volume })}
                    max={1}
                    min={0}
                    step={0.1}
                    className="flex-1"
                  />
                  <Volume2 className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Sound Type Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Tipo de sonido</label>
                <div className="space-y-2">
                  {SOUND_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                        settings.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateSettings({ type: type.value })}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                        {settings.type === type.value && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={testSound}
                disabled={isTestPlaying}
                className="w-full"
              >
                {isTestPlaying ? (
                  <>
                    <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                    Reproduciendo...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Probar sonido
                  </>
                )}
              </Button>
            </>
          )}
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
          {settings.enabled ? (
            <Bell className="w-4 h-4" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
          <span className="sr-only">Configurar sonidos</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-3">
        <DropdownMenuLabel className="text-sm font-medium mb-2">
          Sonidos
        </DropdownMenuLabel>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm">Activar sonidos</span>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
          />
        </div>

        {settings.enabled && (
          <>
            <DropdownMenuSeparator className="my-2" />
            
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Volumen</span>
                <span className="text-xs text-gray-500">{Math.round(settings.volume * 100)}%</span>
              </div>
              <Slider
                value={[settings.volume]}
                onValueChange={([volume]) => updateSettings({ volume })}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={testSound}
              disabled={isTestPlaying}
              className="w-full text-xs"
            >
              {isTestPlaying ? (
                <>
                  <Volume2 className="w-3 h-3 mr-1 animate-pulse" />
                  Probando...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Probar
                </>
              )}
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}