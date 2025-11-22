"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase";
import { doc, addDoc, collection, onSnapshot, query, orderBy, where, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import withAuth from "@/components/auth/withAuth";
import { useAuth } from '@/hooks/useAuth';
import { useDriverData } from '@/hooks/useRealtimeData';
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  AlertTriangle,
  CreditCard,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  TrendingDown,
  DollarSign,
  Banknote,
  BookText,
  ClipboardCopy,
  History
} from "lucide-react";

// --- Componente de Botón para Copiar ---
function CopyButton({ textToCopy }: { textToCopy: string }) {
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    toast({ title: "Copiado", description: "El dato ha sido copiado." });
  };
  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
      <ClipboardCopy className="h-4 w-4" />
    </Button>
  );
}

interface DebtPayment {
  id: string;
  amountPaid: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: any;
  proofUrl: string;
}

function LiquidateDebtPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { driver, transactions, loading: driverLoading } = useDriverData(user?.uid || null);
  const [amount, setAmount] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "debtPayments"), where('driverId', '==', user.uid), orderBy('requestDate', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDebtPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DebtPayment)));
      setLoadingPayments(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (driver && driver.walletBalance < 0) {
      setAmount(Math.abs(driver.walletBalance));
    }
  }, [driver]);

  const getStatusBadge = (status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    const statusConfig = {
      APPROVED: { icon: CheckCircle, className: "bg-green-100 text-green-800", text: "Aprobado" },
      PENDING: { icon: Clock, className: "bg-yellow-100 text-yellow-800", text: "Pendiente" },
      REJECTED: { icon: XCircle, className: "bg-red-100 text-red-800", text: "Rechazado" },
    };
    const config = statusConfig[status];
    const Icon = config.icon;
    return <Badge className={`${config.className} hover:${config.className}`}><Icon className="w-3 h-3 mr-1.5" />{config.text}</Badge>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !driver) return;
    if (!amount || amount <= 0) return toast({ variant: "destructive", title: "Monto inválido" });
    if (!file) return toast({ variant: "destructive", title: "Comprobante requerido" });
    
    setIsLoading(true);
    try {
      const proofRef = ref(storage, `debtPayments/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(proofRef, file);
      const proofUrl = await getDownloadURL(proofRef);
      await addDoc(collection(db, "debtPayments"), {
        driverId: user.uid,
        driverName: driver.fullName || user.email,
        amountPaid: amount,
        proofUrl,
        status: 'PENDING' as 'PENDING',
        requestDate: new Date(),
      });
      toast({ title: "Solicitud enviada", description: "Tu pago está en revisión." });
      setFile(null);
      if (document.getElementById('proof')) (document.getElementById('proof') as HTMLInputElement).value = '';
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la solicitud." });
    } finally {
      setIsLoading(false);
    }
  };

  if (driverLoading || loadingPayments) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-semibold">Error al Cargar Perfil</h3>
        <p className="text-muted-foreground">No pudimos encontrar tus datos.</p>
      </div>
    );
  }

  const currentDebt = driver.walletBalance < 0 ? Math.abs(driver.walletBalance) : 0;
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 text-sm font-semibold ${currentDebt > 0 ? 'text-red-800' : 'text-green-800'}`}>
            {currentDebt > 0 ? <TrendingDown className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            Estado Actual de la Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className={`text-4xl font-bold ${currentDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${currentDebt.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {currentDebt > 0 ? 'Deuda pendiente' : 'Sin deudas pendientes'}
            </p>
          </div>
        </CardContent>
      </Card>

      {currentDebt > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <DollarSign className="h-4 w-4" />
              Registrar un Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Monto Transferido (MXN)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input id="amount" type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} required />
                  <Button type="button" variant="outline" onClick={() => setAmount(currentDebt)}>Llenar</Button>
                </div>
              </div>
              <div>
                <Label htmlFor="proof">Comprobante de Pago</Label>
                <Input id="proof" type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} required className="mt-1" />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4" />
            Historial de Solicitudes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debtPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Monto</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead><TableHead>Comprobante</TableHead></TableRow></TableHeader>
                <TableBody>
                  {debtPayments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">${p.amountPaid.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell className="text-xs">{p.requestDate?.toDate?.().toLocaleDateString('es-MX') || 'N/A'}</TableCell>
                      <TableCell><Button variant="outline" size="sm" onClick={() => window.open(p.proofUrl, '_blank')}>Ver</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : <p className="text-center text-sm text-muted-foreground py-6">No has realizado solicitudes de pago.</p>}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Banknote className="h-4 w-4" />
            Datos para Transferencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Banco', value: 'BBVA MÉXICO' },
            { label: 'Cuenta', value: '0123456789' },
            { label: 'CLABE', value: '012345678901234567' },
            { label: 'Tarjeta', value: '4152313659461094' },
            { label: 'Titular', value: 'Rosio Arisema Uribe Macias' }
          ].map(({label, value}) => (
            <div key={label} className="flex justify-between items-center py-3 border-b last:border-b-0 text-sm">
              <span className="text-muted-foreground">{label}:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{value}</span>
                {['Cuenta', 'CLABE', 'Tarjeta'].includes(label) && <CopyButton textToCopy={value} />}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BookText className="h-4 w-4" />
            Instrucciones
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ol className="space-y-3">
            {[
              "Realiza la transferencia bancaria a la cuenta indicada.",
              "Guarda el comprobante (captura o PDF).",
              "Usa el formulario para registrar el monto y subir el comprobante.",
              "La validación del pago tomará de 24 a 48 horas hábiles.",
              "Recibirás una notificación cuando tu saldo se actualice."
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex items-center justify-center font-bold text-primary bg-primary/10 rounded-full h-5 w-5 text-xs">{i + 1}</span>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50 text-orange-900">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-orange-900">
                <AlertTriangle className="h-4 w-4"/>
                Información Importante
            </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 pl-8">
            <ul className="list-disc">
              <li>El monto del pago debe coincidir con el de tu comprobante.</li>
              <li>El comprobante debe ser claro y mostrar todos los datos.</li>
              <li>Tu cuenta podría ser suspendida si alcanzas el límite de deuda.</li>
              <li>Si tienes dudas, contacta a soporte **antes** de realizar el pago.</li>
            </ul>
        </CardContent>
      </Card>

    </div>
  );
}

export default withAuth(LiquidateDebtPage, {
  role: 'DRIVER',
  redirectTo: '/repartidores/login',
});