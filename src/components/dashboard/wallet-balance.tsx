import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

interface WalletBalanceProps {
  balance: number;
  currency?: string;
  pendingEarnings?: number;
  lastTransactionDate?: Date;
  classification?: string;
  recentTransactions?: Array<{
    id: string;
    type: 'commission' | 'bonus' | 'withdrawal' | 'adjustment';
    amount: number;
    description: string;
    date: Date;
    status: 'completed' | 'pending' | 'failed';
  }>;
}

export function WalletBalance({
  balance,
  currency = 'MXN',
  pendingEarnings = 0,
  lastTransactionDate,
  classification,
  recentTransactions = []
}: WalletBalanceProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'commission':
      case 'bonus':
        return <ArrowUp className="h-3 w-3 text-green-600" />;
      case 'withdrawal':
        return <ArrowDown className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'commission':
      case 'bonus':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Mi Billetera</h3>
          </div>
          {classification && (
            <StatusBadge status={classification} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance principal */}
        <div className="text-center py-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Saldo disponible</p>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(balance)}</p>
          {pendingEarnings > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              + {formatCurrency(pendingEarnings)} pendiente
            </p>
          )}
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total disponible</p>
            <p className="font-semibold">{formatCurrency(balance + pendingEarnings)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Última transacción</p>
            <p className="font-semibold">
              {lastTransactionDate ? formatDate(lastTransactionDate) : 'Sin transacciones'}
            </p>
          </div>
        </div>

        {/* Transacciones recientes */}
        {recentTransactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Transacciones recientes</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="text-xs font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'withdrawal' ? '-' : '+'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <StatusBadge status={transaction.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="flex gap-2 pt-2">
          <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-md transition-colors">
            Ver historial
          </button>
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-md transition-colors">
            Retirar fondos
          </button>
        </div>
      </CardContent>
    </Card>
  );
}