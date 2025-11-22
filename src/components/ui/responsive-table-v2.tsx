/**
 * Enhanced Responsive Table Component
 * Complete mobile-first table implementation with card layouts
 */

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoints } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Download, 
  SortAsc,
  SortDesc,
  ChevronDown
} from 'lucide-react';

interface ResponsiveTableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  width?: string;
}

interface ResponsiveTableProps<T = any> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  className?: string;
  emptyMessage?: string;
  title?: string;
  actions?: React.ReactNode;
  itemsPerPage?: number;
  enableMobileCards?: boolean;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onRowClick,
  searchable = true,
  filterable = false,
  exportable = false,
  className = '',
  emptyMessage = 'No hay datos para mostrar',
  title,
  actions,
  itemsPerPage = 10,
  enableMobileCards = true
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet } = useBreakpoints();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter columns based on device type
  const visibleColumns = useMemo(() => 
    columns.filter(column => {
      if (isMobile && column.hideOnMobile) return false;
      if (isTablet && column.hideOnTablet) return false;
      return true;
    }), [columns, isMobile, isTablet]);

  // Process data (search, sort, paginate)
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = row[column.key];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          if (typeof value === 'number') {
            return value.toString().includes(searchTerm);
          }
          return false;
        })
      );
    }

    // Sort data
    if (sortColumn) {
      filtered = filtered.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection, columns]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  const handleSort = (column: ResponsiveTableColumn<T>) => {
    if (!column.sortable) return;

    if (sortColumn === column.key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (row: T) => {
    if (isMobile && enableMobileCards) {
      setSelectedRow(row);
      setShowMobileDetails(true);
    } else if (onRowClick) {
      onRowClick(row);
    }
  };

  const renderCellValue = (column: ResponsiveTableColumn<T>, row: T) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return value?.toString() || '';
  };

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mobile Card Layout
  if (isMobile && enableMobileCards) {
    return (
      <>
        <div className={cn("w-full space-y-4", className)}>
          {/* Header */}
          <Card>
            <CardHeader className="pb-3 space-y-3">
              {(title || actions) && (
                <div className="flex items-center justify-between">
                  {title && <CardTitle className="text-lg">{title}</CardTitle>}
                  <div className="flex items-center gap-2">
                    {actions}
                  </div>
                </div>
              )}
              
              {searchable && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {filterable && (
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{processedData.length} elementos</span>
                {exportable && (
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Mobile Cards */}
          <div className="space-y-3">
            {paginatedData.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  {emptyMessage}
                </CardContent>
              </Card>
            ) : (
              paginatedData.map((row, index) => (
                <div 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-all duration-200 active:scale-95 bg-white rounded-lg border border-gray-200 mb-3"
                  onClick={() => handleRowClick(row)}
                >
                  <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {visibleColumns.slice(0, 3).map((column, colIndex) => (
                        <div key={colIndex} className="flex justify-between items-start gap-2">
                          <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                            {column.label}:
                          </span>
                          <div className="text-sm text-right flex-1">
                            {renderCellValue(column, row)}
                          </div>
                        </div>
                      ))}
                      {visibleColumns.length > 3 && (
                        <div className="pt-2 border-t flex items-center justify-center">
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500 ml-1">Toca para ver más</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Details Modal */}
        <Dialog open={showMobileDetails} onOpenChange={setShowMobileDetails}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle>Detalles Completos</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              {selectedRow && (
                <div className="space-y-4">
                  {columns.map((column, index) => (
                    <div key={index} className="pb-3 border-b last:border-b-0">
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        {column.label}
                      </div>
                      <div className="text-sm">
                        {renderCellValue(column, selectedRow)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop/Tablet Table Layout
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {title && <CardTitle className="text-xl">{title}</CardTitle>}
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
            {exportable && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {filterable && (
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            )}
            <div className="text-sm text-gray-600">
              {processedData.length} elementos
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map((column, index) => (
                  <th
                    key={index}
                    className={cn(
                      "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                      column.sortable && "cursor-pointer hover:bg-gray-100 select-none",
                      column.className
                    )}
                    onClick={() => handleSort(column)}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          {sortColumn === column.key ? (
                            sortDirection === 'asc' ? 
                              <SortAsc className="h-4 w-4 text-gray-900" /> : 
                              <SortDesc className="h-4 w-4 text-gray-900" />
                          ) : (
                            <div className="h-4 w-4 text-gray-300">
                              <SortAsc className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-gray-300 mb-2">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      {emptyMessage}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {visibleColumns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={cn(
                          "px-6 py-4 whitespace-nowrap text-sm text-gray-900",
                          column.className
                        )}
                      >
                        {renderCellValue(column, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length} resultados
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Anterior
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={i}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
