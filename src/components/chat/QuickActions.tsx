'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  ArrowRight, 
  Phone, 
  Mail, 
  Download, 
  Copy, 
  Share2,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  MessageSquare
} from 'lucide-react';

export interface QuickAction {
  label: string;
  action: string;
  data?: any;
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  icon?: string;
  external?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
  userRole: 'WELCOME' | 'DRIVER' | 'BUSINESS' | 'ADMIN';
  disabled?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'sm' | 'md' | 'lg';
}

const ACTION_ICONS = {
  redirect_portal: ArrowRight,
  external_link: ExternalLink,
  phone_call: Phone,
  send_email: Mail,
  download_file: Download,
  copy_text: Copy,
  share_content: Share2,
  send_message: MessageSquare,
  quick_action: Zap,
  default: Info
};

const ACTION_TYPES = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200',
  success: 'bg-green-500 hover:bg-green-600 text-white border-green-500',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500',
  info: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200'
};

const ROLE_COLORS = {
  WELCOME: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700',
  DRIVER: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700',
  BUSINESS: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-700',
  ADMIN: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
};

export function QuickActions({
  actions,
  onActionClick,
  userRole,
  disabled = false,
  layout = 'horizontal',
  size = 'md'
}: QuickActionsProps) {
  if (!actions || actions.length === 0) return null;

  const getActionIcon = (action: QuickAction) => {
    const iconName = action.icon || action.action || 'default';
    const IconComponent = ACTION_ICONS[iconName as keyof typeof ACTION_ICONS] || ACTION_ICONS.default;
    return <IconComponent className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />;
  };

  const getActionStyle = (action: QuickAction) => {
    if (action.type && ACTION_TYPES[action.type]) {
      return ACTION_TYPES[action.type];
    }
    return `bg-white ${ROLE_COLORS[userRole]} border`;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs h-7 px-2';
      case 'lg':
        return 'text-base h-12 px-4';
      default:
        return 'text-sm h-9 px-3';
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'flex flex-col space-y-2';
      case 'grid':
        return 'grid grid-cols-2 gap-2';
      default:
        return 'flex flex-wrap gap-2';
    }
  };

  const handleActionClick = async (action: QuickAction) => {
    if (disabled) return;

    // Handle special action types
    switch (action.action) {
      case 'copy_text':
        if (action.data?.text) {
          try {
            await navigator.clipboard.writeText(action.data.text);
            // Could show a toast here
          } catch (e) {
            console.warn('Failed to copy text:', e);
          }
        }
        break;
      
      case 'phone_call':
        if (action.data?.phone) {
          window.location.href = `tel:${action.data.phone}`;
        }
        break;
      
      case 'send_email':
        if (action.data?.email) {
          const subject = action.data.subject ? `?subject=${encodeURIComponent(action.data.subject)}` : '';
          window.location.href = `mailto:${action.data.email}${subject}`;
        }
        break;
      
      case 'external_link':
        if (action.data?.url) {
          window.open(action.data.url, '_blank', 'noopener,noreferrer');
        }
        break;
      
      case 'download_file':
        if (action.data?.url) {
          const link = document.createElement('a');
          link.href = action.data.url;
          link.download = action.data.filename || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        break;
      
      case 'share_content':
        if (navigator.share && action.data) {
          try {
            await navigator.share({
              title: action.data.title,
              text: action.data.text,
              url: action.data.url
            });
          } catch (e) {
            // Fallback to clipboard
            if (action.data.url) {
              await navigator.clipboard.writeText(action.data.url);
            }
          }
        }
        break;
      
      default:
        // Pass to parent handler
        onActionClick(action);
        break;
    }
  };

  return (
    <div className="mt-3">
      {/* Actions header for multiple actions */}
      {actions.length > 1 && (
        <div className="flex items-center space-x-2 mb-2">
          <Badge variant="outline" className="text-gray-500 border-gray-300">
            <Zap className="w-3 h-3 mr-1" />
            <span className="text-xs">Acciones rápidas</span>
          </Badge>
        </div>
      )}
      
      <div className={getLayoutClasses()}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className={`${getSizeClasses()} ${getActionStyle(action)} transition-all duration-200 hover:scale-105 active:scale-95 group relative overflow-hidden`}
            onClick={() => handleActionClick(action)}
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
              {getActionIcon(action)}
              <span className="font-medium">
                {action.label}
              </span>
              {action.external && (
                <ExternalLink className="w-3 h-3 opacity-60" />
              )}
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
          </Button>
        ))}
      </div>
      
      {/* Helper text for complex actions */}
      {actions.some(a => a.type === 'warning' || a.type === 'info') && (
        <div className="mt-2 text-xs text-gray-500">
          💡 Tip: Haz clic en las acciones para ejecutarlas directamente
        </div>
      )}
    </div>
  );
}