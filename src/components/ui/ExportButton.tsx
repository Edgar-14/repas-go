import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useExportData, ExportConfig, EXPORT_CONFIGS } from '@/hooks/useExportData';

type ExportType = keyof typeof EXPORT_CONFIGS;

interface ExportButtonProps {
  type: ExportType;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  customConfig?: ExportConfig<any>;
}

export function ExportButton({ 
  type, 
  variant = 'outline',
  size = 'sm',
  className = '',
  customConfig
}: ExportButtonProps) {
  const { exportToCsv, isExporting } = useExportData();
  
  const config = customConfig || EXPORT_CONFIGS[type];
  
  const getButtonText = () => {
    const typeLabels = {
      orders: 'Exportar Pedidos',
      drivers: 'Exportar Repartidores'
    };
    
    if (isExporting) {
      return 'Exportando...';
    }
    
    return `${typeLabels[type]} (CSV)`;
  };

  const getButtonClass = () => {
    const baseClass = "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 disabled:opacity-50";
    return `${baseClass} ${className}`;
  };

  const handleExport = async () => {
    await exportToCsv(config);
  };

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
      className={getButtonClass()}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {getButtonText()}
    </Button>
  );
}

// Componentes específicos para retrocompatibilidad
export function ExportOrdersButton({ 
  className, 
  ...props 
}: Omit<ExportButtonProps, 'type'>) {
  return (
    <ExportButton 
      type="orders" 
      className={className}
      {...props}
    />
  );
}

export function ExportDriversButton({ 
  className, 
  ...props 
}: Omit<ExportButtonProps, 'type'>) {
  return (
    <ExportButton 
      type="drivers" 
      className={className}
      {...props}
    />
  );
}
