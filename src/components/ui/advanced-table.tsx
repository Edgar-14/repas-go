'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Filter,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkAction<TData> {
  label: string;
  action: (selectedItems: TData[]) => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface AdvancedTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  description?: string;
  enableGlobalSearch?: boolean;
  enableColumnFilters?: boolean;
  enableBulkActions?: boolean;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  exportFormats?: ('csv' | 'excel' | 'pdf')[];
  bulkActions?: BulkAction<TData>[];
  onRowClick?: (row: TData) => void;
  className?: string;
}

export function AdvancedTable<TData, TValue>({
  columns,
  data,
  title,
  description,
  enableGlobalSearch = true,
  enableColumnFilters = true,
  enableBulkActions = true,
  enableColumnVisibility = true,
  enableExport = true,
  exportFormats = ['csv'],
  bulkActions = [],
  onRowClick,
  className,
}: AdvancedTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [showColumnVisibility, setShowColumnVisibility] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  const hasActiveFilters = columnFilters.length > 0 || globalFilter.length > 0;

  const handleExport = async (format: string) => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setColumnFilters([]);
    setGlobalFilter('');
    setRowSelection({});
  };

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {title && (
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <p className="text-sm text-gray-600">{description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {enableExport && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Exportar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Exportar Datos</DialogTitle>
                        <DialogDescription>
                          Selecciona el formato de exportación
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        {exportFormats.map((format) => (
                          <Button
                            key={format}
                            variant="outline"
                            className="w-full justify-start gap-2"
                            onClick={() => handleExport(format)}
                            disabled={isExporting}
                          >
                            {isExporting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : format === 'csv' ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <FileSpreadsheet className="w-4 h-4" />
                            )}
                            Exportar como {format.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {enableColumnVisibility && (
                  <Dialog open={showColumnVisibility} onOpenChange={setShowColumnVisibility}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Columnas
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Visibilidad de Columnas</DialogTitle>
                        <DialogDescription>
                          Selecciona qué columnas mostrar
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        {table
                          .getAllColumns()
                          .filter((column) => column.getCanHide())
                          .map((column) => (
                            <div key={column.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={column.id}
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                              />
                              <Label htmlFor={column.id} className="text-sm font-medium">
                                {typeof column.columnDef.header === 'string'
                                  ? column.columnDef.header
                                  : column.id}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  {enableGlobalSearch && (
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar en todas las columnas..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-10 pr-4"
                      />
                      {globalFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setGlobalFilter('')}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}

                  {enableColumnFilters && (
                    <Button
                      variant={showFilters ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Filtros
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                          {columnFilters.length + (globalFilter ? 1 : 0)}
                        </Badge>
                      )}
                    </Button>
                  )}
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                    Limpiar
                  </Button>
                )}
              </div>

              {showFilters && enableColumnFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanFilter())
                    .map((column) => (
                      <div key={column.id} className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {typeof column.columnDef.header === 'string'
                            ? column.columnDef.header
                            : column.id}
                        </Label>
                        <Input
                          placeholder={`Filtrar ${column.id}...`}
                          value={(column.getFilterValue() as string) ?? ''}
                          onChange={(e) => column.setFilterValue(e.target.value)}
                          className="h-8"
                        />
                      </div>
                    ))}
                </div>
              )}

              {selectedRows.length > 0 && enableBulkActions && bulkActions.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {selectedRows.length} elemento(s) seleccionado(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {bulkActions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={() => action.action(selectedRows)}
                        className="gap-2"
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b border-gray-200 bg-gray-50/50">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-2">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-gray-200"
                                onClick={() =>
                                  header.column.toggleSorting(header.column.getIsSorted() === 'asc')
                                }
                              >
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ArrowUp className="w-3 h-3" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ArrowDown className="w-3 h-3" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={cn(
                        'border-b border-gray-100 hover:bg-gray-50/50 transition-colors',
                        onRowClick && 'cursor-pointer',
                        row.getIsSelected() && 'bg-blue-50/50'
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-6 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                        <p className="text-sm text-gray-500">No se encontraron resultados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination */}
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{' '}
                  de {table.getFilteredRowModel().rows.length} resultados
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="page-size" className="text-sm text-gray-600">
                    Filas por página:
                  </Label>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="gap-2"
                  >
                    <ChevronUp className="w-4 h-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="gap-2"
                  >
                    Siguiente
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
