'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Wrench } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { useToast } from '@/hooks/use-toast';
import withAuth from '@/components/auth/withAuth';

function FixTransactionsPage() {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    updated: number;
    errors: number;
    details: string[];
  } | null>(null);

  const fixTransactions = async () => {
    setIsFixing(true);
    setResults(null);
    
    try {
      console.log('🔧 Iniciando corrección de transacciones...');
      
      // Obtener todas las transacciones
      const transactionsRef = collection(db, COLLECTIONS.CREDIT_TRANSACTIONS);
      const transactionsSnap = await getDocs(transactionsRef);
      
      const total = transactionsSnap.size;
      let updated = 0;
      let errors = 0;
      const details: string[] = [];
      
      console.log(`📊 Encontradas ${total} transacciones`);
      details.push(`📊 Encontradas ${total} transacciones`);
      
      for (const transactionDoc of transactionsSnap.docs) {
        const transactionData = transactionDoc.data();
        
        // Verificar si ya tiene businessName
        if (transactionData.businessName) {
          details.push(`✅ Transacción ${transactionDoc.id} ya tiene businessName`);
          continue;
        }
        
        try {
          // Obtener información del negocio
          const businessRef = doc(db, 'businesses', transactionData.businessId);
          const businessSnap = await getDoc(businessRef);
          
          let businessName = 'Negocio desconocido';
          if (businessSnap.exists()) {
            const businessData = businessSnap.data();
            businessName = businessData.businessName || businessData.name || 'Negocio desconocido';
          }
          
          // Preparar datos para actualizar
          const updateData: any = {
            businessName: businessName
          };
          
          // Agregar amount en nivel raíz si no existe
          if (!transactionData.amount && transactionData.transferDetails?.amount) {
            updateData.amount = transactionData.transferDetails.amount;
          }
          
          // Agregar description si no existe
          if (!transactionData.description) {
            const credits = transactionData.credits || 0;
            const packageName = transactionData.packageInfo?.name || 'Paquete';
            updateData.description = `Compra de ${credits} créditos - ${packageName}`;
          }
          
          // Actualizar documento
          await updateDoc(doc(db, COLLECTIONS.CREDIT_TRANSACTIONS, transactionDoc.id), updateData);
          
          details.push(`✅ Actualizada transacción ${transactionDoc.id} para ${businessName}`);
          updated++;
          
        } catch (error: any) {
          details.push(`❌ Error actualizando transacción ${transactionDoc.id}: ${error.message}`);
          errors++;
        }
      }
      
      setResults({ total, updated, errors, details });
      
      toast({
        title: "Corrección completada",
        description: `Actualizadas ${updated} transacciones de ${total} total`,
      });
      
    } catch (error: any) {
      console.error('❌ Error general:', error);
      toast({
        variant: 'destructive',
        title: 'Error en la corrección',
        description: error.message || 'Error desconocido',
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Wrench className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold">Corrección de Transacciones</h1>
          <p className="text-gray-600">Agregar campos faltantes a transacciones existentes</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Problema Detectado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Las transacciones de créditos existentes no tienen el campo <code className="bg-gray-100 px-2 py-1 rounded">businessName</code> 
            que necesita la interfaz de admin para mostrarlas correctamente.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 mb-2">Esta herramienta agregará:</h4>
            <ul className="list-disc list-inside text-amber-700 space-y-1">
              <li><code>businessName</code> - Nombre del negocio desde la colección businesses</li>
              <li><code>amount</code> - Monto en nivel raíz (si falta)</li>
              <li><code>description</code> - Descripción de la transacción (si falta)</li>
            </ul>
          </div>

          <Button 
            onClick={fixTransactions}
            disabled={isFixing}
            className="w-full"
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Corrigiendo transacciones...
              </>
            ) : (
              <>
                <Wrench className="mr-2 h-4 w-4" />
                Corregir Transacciones
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resultados de la Corrección
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.updated}</div>
                <div className="text-sm text-gray-600">Actualizadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.errors}</div>
                <div className="text-sm text-gray-600">Errores</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h4 className="font-semibold mb-2">Detalles:</h4>
              {results.details.map((detail, index) => (
                <div key={index} className="text-sm font-mono text-gray-700 mb-1">
                  {detail}
                </div>
              ))}
            </div>

            {results.updated > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">
                  ✅ <strong>¡Corrección exitosa!</strong> Ahora las transacciones deberían aparecer correctamente en el portal de admin.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withAuth(FixTransactionsPage, { 
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'] 
});
