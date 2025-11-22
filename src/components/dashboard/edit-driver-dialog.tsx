'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function EditDriverDialog({ driver, children }: { driver: any, children: React.ReactNode }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [debtLimit, setDebtLimit] = useState(driver.debtLimit || 0);

  const handleSaveChanges = async () => {
    try {
      const driverRef = doc(db, 'drivers', driver.id);
      await updateDoc(driverRef, { debtLimit });
      toast({ title: 'Éxito', description: 'El límite de deuda ha sido actualizado.' });
      setIsOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el límite de deuda.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Límite de Deuda</DialogTitle>
          <DialogDescription>
            Establece el límite de deuda para {driver.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="debt-limit" className="text-right">
              Límite de Deuda
            </Label>
            <Input
              id="debt-limit"
              type="number"
              value={debtLimit}
              onChange={(e) => setDebtLimit(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
