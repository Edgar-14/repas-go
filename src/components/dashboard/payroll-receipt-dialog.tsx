
'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, BadgeDollarSign, Gift, ArrowDownCircle, ArrowUpCircle, Banknote, Scale, BookUser } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

// The expected output structure from our new, simplified API route
export type GetPayrollReceiptOutput = {
  driverName: string;
  period: string;
  accruedIncome: {
    totalDeliveries: number;
    baseEarnings: number;
    legalBenefits: number;
    tips: number;
    totalGrossIncome: number;
  };
  walletReconciliation: {
    initialBalance: number;
    totalGrossIncome: number;
    commissionsDebit: number;
    manualAdjustments: number;
    finalBalance: number;
  };
};

export function PayrollReceiptDialog({ children, driverId, period }: { children: React.ReactNode, driverId: string, period: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [receipt, setReceipt] = useState<GetPayrollReceiptOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateReceipt = () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/generate-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ driverId, period }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate receipt');
        }
        
        const result: GetPayrollReceiptOutput = await response.json();
        setReceipt(result);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error al Generar Recibo',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      handleGenerateReceipt();
    } else {
      setReceipt(null);
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <FileText className="text-primary" />
            Recibo de Pago
          </DialogTitle>
           {receipt ? (
                <DialogDescription>
                    Recibo para {receipt.driverName} del periodo {receipt.period}.
                </DialogDescription>
            ) : (
                 <DialogDescription>
                    Generando recibo...
                </DialogDescription>
            )}
        </DialogHeader>
        
        {isPending && (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <p className="mt-4">Cargando datos del recibo...</p>
            </div>
        )}

        {receipt && !isPending && (
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
               
               {/* SECTION A */}
               <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                           <BookUser className="text-green-500"/> Sección A: Resumen de Ingresos Devengados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Entregas Realizadas</span> <span>{receipt.accruedIncome.totalDeliveries}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Ingresos Base (Honorarios)</span> <span>{formatCurrency(receipt.accruedIncome.baseEarnings)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Monto por Prestaciones de Ley</span> <span>{formatCurrency(receipt.accruedIncome.legalBenefits)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Propinas Recibidas</span> <span>{formatCurrency(receipt.accruedIncome.tips)}</span></div>
                        <Separator className="my-2"/>
                        <div className="flex justify-between font-bold">
                            <span>Total de Ingresos Brutos Devengados</span>
                            <span>{formatCurrency(receipt.accruedIncome.totalGrossIncome)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* SECTION B */}
                <Card>
                     <CardHeader>
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                           <Scale className="text-blue-500"/> Sección B: Conciliación con Billetera
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Saldo Inicial de la Billetera</span> <span>{formatCurrency(receipt.walletReconciliation.initialBalance)}</span></div>
                        <div className="flex justify-between text-green-600"><span className="flex items-center gap-1"><ArrowUpCircle size={14}/>Total de Ingresos Brutos Devengados</span> <span>+ {formatCurrency(receipt.walletReconciliation.totalGrossIncome)}</span></div>
                        <div className="flex justify-between text-red-600"><span className="flex items-center gap-1"><ArrowDownCircle size={14}/>Comisiones por Pedidos en Efectivo</span> <span>- {formatCurrency(receipt.walletReconciliation.commissionsDebit)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Ajustes Manuales</span> <span>{formatCurrency(receipt.walletReconciliation.manualAdjustments)}</span></div>
                    </CardContent>
                </Card>
                
                <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="flex justify-between items-center font-bold text-lg">
                        <span className="flex items-center gap-2 text-primary"><Banknote/>Monto Final a Transferir</span>
                        <span className={cn(receipt.walletReconciliation.finalBalance >= 0 ? 'text-primary' : 'text-destructive')}>
                            {formatCurrency(receipt.walletReconciliation.finalBalance)}
                        </span>
                    </div>
                </div>

            </div>
        )}

        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
