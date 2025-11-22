import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertCardProps {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved?: boolean;
  onResolve?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function AlertCard({
  title,
  message,
  severity,
  timestamp,
  resolved = false,
  onResolve,
  onDismiss,
  className
}: AlertCardProps) {
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadgeColor = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `hace ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      return 'hace un momento';
    }
  };

  return (
    <Card 
      className={cn(
        'border-l-4 transition-all duration-200',
        getSeverityColor(severity),
        resolved && 'opacity-60',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getSeverityIcon(severity)}
            <h3 className="font-semibold text-sm">{title}</h3>
            {resolved && <CheckCircle className="h-4 w-4 text-green-600" />}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', getSeverityBadgeColor(severity))}>
              {severity.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-700 mb-3">{message}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(timestamp)}
          </span>
          {!resolved && (
            <div className="flex gap-2">
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                >
                  Descartar
                </button>
              )}
              {onResolve && (
                <button
                  onClick={onResolve}
                  className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 rounded text-green-700 transition-colors"
                >
                  Resolver
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}