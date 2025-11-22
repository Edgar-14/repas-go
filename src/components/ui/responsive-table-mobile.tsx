'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoints } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  width?: string;
}

interface ResponsiveTableMobileProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  exportable?: boolean;
  className?: string;
  emptyMessage?: string;
  title?: string;
  actions?: React.ReactNode;
  itemsPerPage?: number;
  searchPlaceholder?: string;
  getRowKey?: (row: T, index: number) => string;
}

export function ResponsiveTableMobile<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onRowClick,
  searchable = true,
  className = '',
  emptyMessage = 'No hay datos para mostrar',
  title,
  actions,
  itemsPerPage = 10,
  searchPlaceholder = 'Buscar...',
  getRowKey,
}: ResponsiveTableMobileProps<T>) {
  const { isMobile, isTablet } = useBreakpoints();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Filter columns based on device type
  const visibleColumns = useMemo(
    () =>
      columns.filter((column) => {
        if (isMobile && column.hideOnMobile) return false;
        if (isTablet && column.hideOnTablet) return false;
        return true;
      }),
    [columns, isMobile, isTablet]
  );

  // Process data (search, sort, paginate)
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        columns.some((column) => {
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

    // Sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (typeof aValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number') {
          return sortDirection === 'asc'
            ? aValue - (bValue as number)
            : (bValue as number) - aValue;
        }

        return 0;
      });
    }

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return { filtered, paginated };
  }, [data, searchTerm, sortColumn, sortDirection, currentPage, itemsPerPage, columns]);

  const totalPages = Math.ceil(processedData.filtered.length / itemsPerPage);

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleExpandRow = (rowKey: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey);
    } else {
      newExpanded.add(rowKey);
    }
    setExpandedRows(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  if (processedData.filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm md:text-base">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className={cn('space-y-4', className)}>
        {title && <h2 className="text-xl font-bold">{title}</h2>}
        
        {(searchable || actions) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {searchable && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 w-full"
                />
              </div>
            )}
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
        )}

        <div className="space-y-3">
          {processedData.paginated.map((row, index) => {
            const rowKey = getRowKey ? getRowKey(row, index) : index.toString();
            const isExpanded = expandedRows.has(rowKey);

            return (
              <div
                key={rowKey}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => {
                  if (onRowClick) onRowClick(row);
                  toggleExpandRow(rowKey);
                }}
              >
                <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Show first 2 columns always */}
                    {visibleColumns.slice(0, 2).map((column) => (
                      <div key={String(column.key)} className="flex justify-between items-start gap-2">
                        <span className="font-medium text-sm text-gray-600 flex-shrink-0">
                          {column.label}:
                        </span>
                        <span className="text-right text-sm font-medium break-words flex-1">
                          {column.render
                            ? column.render(row[column.key], row)
                            : String(row[column.key] || '-')}
                        </span>
                      </div>
                    ))}

                    {/* Show more button if has hidden columns */}
                    {visibleColumns.length > 2 && (
                      <button
                        className="w-full flex items-center justify-center gap-2 text-blue-600 text-sm font-medium py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandRow(rowKey);
                        }}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Ver más ({visibleColumns.length - 2})
                          </>
                        )}
                      </button>
                    )}

                    {/* Show remaining columns when expanded */}
                    {isExpanded && visibleColumns.length > 2 && (
                      <div className="border-t pt-3 space-y-3">
                        {visibleColumns.slice(2).map((column) => (
                          <div key={String(column.key)} className="flex justify-between items-start gap-2">
                            <span className="font-medium text-sm text-gray-600 flex-shrink-0">
                              {column.label}:
                            </span>
                            <span className="text-right text-sm font-medium break-words flex-1">
                              {column.render
                                ? column.render(row[column.key], row)
                                : String(row[column.key] || '-')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex-1"
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600 whitespace-nowrap px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex-1"
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Tablet: Horizontal scrolling table
  if (isTablet) {
    return (
      <div className={cn('space-y-4', className)}>
        {title && <h2 className="text-lg font-bold">{title}</h2>}
        
        {(searchable || actions) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            )}
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {visibleColumns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-sm"
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {column.sortable && sortColumn === column.key && (
                        <span>
                          {sortDirection === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.paginated.map((row, index) => (
                <TableRow
                  key={getRowKey ? getRowKey(row, index) : index}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onRowClick?.(row)}
                >
                  {visibleColumns.map((column) => (
                    <TableCell key={String(column.key)} className="text-sm whitespace-nowrap">
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop: Full table view
  return (
    <div className={cn('space-y-4', className)}>
      {title && <h2 className="text-xl font-bold">{title}</h2>}
      
      {(searchable || actions) && (
        <div className="flex items-center justify-between gap-4">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          )}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              {visibleColumns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(
                    'font-semibold cursor-pointer hover:bg-gray-100',
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <span>
                        {sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.paginated.map((row, index) => (
              <TableRow
                key={getRowKey ? getRowKey(row, index) : index}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onRowClick?.(row)}
              >
                {visibleColumns.map((column) => (
                  <TableCell key={String(column.key)} className={column.className}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] || '-')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 py-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages} ({processedData.filtered.length} resultados)
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
