'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import withAuth from '@/components/auth/withAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useConfirmation } from '@/components/ui/confirmation-dialog';
import { Section, PageToolbar } from '@/components/layout/primitives';

function AdminTrainingPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [previewVideo, setPreviewVideo] = useState<string|null>(null);
  const [quizError, setQuizError] = useState<string|null>(null);
  const [newModule, setNewModule] = useState({ title: '', description: '', videoUrl: '', quiz: '' });
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();

  useEffect(() => {
    const q = query(collection(db, "trainingModules"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const modulesData: any[] = [];
      querySnapshot.forEach((doc) => {
        modulesData.push({ id: doc.id, ...doc.data() });
      });
      setModules(modulesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateOrEditModule = async () => {
    // Validar JSON del cuestionario
    setQuizError(null);
    if (newModule.quiz) {
      try {
        JSON.parse(newModule.quiz);
      } catch {
        setQuizError('El cuestionario debe ser un JSON válido.');
        return;
      }
    }
    try {
      if (isEdit && editId) {
        await updateDoc(doc(db, "trainingModules", editId), {
          ...newModule,
        });
        toast({ title: 'Éxito', description: 'El módulo ha sido actualizado.' });
      } else {
        await addDoc(collection(db, "trainingModules"), {
          ...newModule,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Éxito', description: 'El módulo de capacitación ha sido creado.' });
      }
      setIsOpen(false);
      setIsEdit(false);
      setEditId(null);
      setNewModule({ title: '', description: '', videoUrl: '', quiz: '' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el módulo.' });
    }
  };

  const handleEdit = (module: any) => {
    setIsEdit(true);
    setEditId(module.id);
    setNewModule({
      title: module.title || '',
      description: module.description || '',
      videoUrl: module.videoUrl || '',
      quiz: module.quiz || '',
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Módulo de Capacitación',
      description: '¿Estás seguro de que deseas eliminar este módulo? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'No, cancelar',
      variant: 'destructive'
    });

    if (!confirmed) return;
    
    try {
      await deleteDoc(doc(db, "trainingModules", id));
      toast({ title: 'Eliminado', description: 'El módulo ha sido eliminado.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el módulo.' });
    }
  };

  return (
    <div className="space-y-6">
      <Section>
        <PageToolbar
          right={
            <Dialog>
              <DialogTrigger asChild>
                <Button>Crear Módulo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Módulo de Capacitación</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título</Label>
                    <Input id="title" value={newModule.title} onChange={(e) => setNewModule({ ...newModule, title: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea id="description" value={newModule.description} onChange={(e) => setNewModule({ ...newModule, description: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="videoUrl">URL del Video</Label>
                    <Input id="videoUrl" value={newModule.videoUrl} onChange={(e) => setNewModule({ ...newModule, videoUrl: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quiz">Cuestionario (JSON)</Label>
                    <Textarea id="quiz" value={newModule.quiz} onChange={(e) => setNewModule({ ...newModule, quiz: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateOrEditModule}>Crear Módulo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
      </Section>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p>Cargando módulos...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell>{module.title}</TableCell>
                    <TableCell>{module.description}</TableCell>
                    <TableCell>
                      {module.videoUrl ? (
                        <Button size="sm" variant="outline" onClick={() => setPreviewVideo(module.videoUrl)}>Ver Video</Button>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(module)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(module.id)}>Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setIsEdit(false); setEditId(null); setQuizError(null); setNewModule({ title: '', description: '', videoUrl: '', quiz: '' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Módulo de Capacitación' : 'Crear Nuevo Módulo de Capacitación'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={newModule.title} onChange={(e) => setNewModule({ ...newModule, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={newModule.description} onChange={(e) => setNewModule({ ...newModule, description: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="videoUrl">URL del Video</Label>
              <Input id="videoUrl" value={newModule.videoUrl} onChange={(e) => setNewModule({ ...newModule, videoUrl: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quiz">Cuestionario (JSON)</Label>
              <Textarea id="quiz" value={newModule.quiz} onChange={(e) => setNewModule({ ...newModule, quiz: e.target.value })} />
              {quizError && <span className="text-red-500 text-xs">{quizError}</span>}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateOrEditModule}>{isEdit ? 'Guardar Cambios' : 'Crear Módulo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vista previa de video */}
      <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vista Previa del Video</DialogTitle>
          </DialogHeader>
          {previewVideo && (
            <div className="aspect-video w-full">
              <iframe src={previewVideo} title="Video de capacitación" className="w-full h-64" allowFullScreen />
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <ConfirmationComponent />
    </div>
  );
}

export default withAuth(AdminTrainingPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
