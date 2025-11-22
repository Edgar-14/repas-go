"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Plus,
  ExternalLink,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { db } from '@/lib/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface Document {
  id: string
  name: string
  type: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  uploadDate: Date
  expiryDate?: Date
  url?: string
  notes?: string
  uploadedBy: string
  reviewedBy?: string
  reviewDate?: Date
  rejectionReason?: string
}

interface DocumentManagerProps {
  driverId: string
  driverName: string
}

const DOCUMENT_TYPES = [
  { id: 'INE', name: 'INE/Identificación Oficial', required: true, expiryDays: 365 },
  { id: 'LICENSE', name: 'Licencia de Conducir', required: true, expiryDays: 365 },
  { id: 'VEHICLE_REGISTRATION', name: 'Tarjeta de Circulación', required: true, expiryDays: 365 },
  { id: 'INSURANCE', name: 'Póliza de Seguro', required: true, expiryDays: 365 },
  { id: 'ADDRESS_PROOF', name: 'Comprobante de Domicilio', required: true, expiryDays: 90 },
  { id: 'TAX_CERTIFICATE', name: 'Constancia de Situación Fiscal', required: true, expiryDays: 90 },
  { id: 'MEDICAL_CERTIFICATE', name: 'Certificado Médico', required: false, expiryDays: 180 },
  { id: 'BACKGROUND_CHECK', name: 'Antecedentes Penales', required: false, expiryDays: 365 },
  { id: 'IMSS_CERTIFICATE', name: 'Certificado IMSS', required: false, expiryDays: 90 },
  { id: 'OTHER', name: 'Otro Documento', required: false, expiryDays: 365 }
]

export function DocumentManager({ driverId, driverName }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: '',
    notes: '',
    file: null as File | null
  })
  const { toast } = useToast()

  useEffect(() => {
    const documentsRef = collection(db, 'driverDocuments')
    const documentsQuery = query(
      documentsRef,
      where('driverId', '==', driverId),
      orderBy('uploadDate', 'desc')
    )

    const unsubscribe = onSnapshot(documentsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadDate: doc.data().uploadDate?.toDate() || new Date(),
        expiryDate: doc.data().expiryDate?.toDate(),
        reviewDate: doc.data().reviewDate?.toDate()
      })) as Document[]
      
      setDocuments(docs)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [driverId])

  const getStatusBadge = (status: string, expiryDate?: Date) => {
    const now = new Date()
    const isExpired = expiryDate && expiryDate < now

    if (isExpired) {
      return <Badge variant="destructive">Expirado</Badge>
    }

    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500">Aprobado</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rechazado</Badge>
      case 'PENDING':
        return <Badge variant="secondary">Pendiente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string, expiryDate?: Date) => {
    const now = new Date()
    const isExpired = expiryDate && expiryDate < now

    if (isExpired) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }

    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadForm(prev => ({ ...prev, file }))
    }
  }

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.type) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor selecciona un archivo y tipo de documento.'
      })
      return
    }

    try {
      // In a real implementation, you would upload the file to Google Drive or Firebase Storage
      // For now, we'll simulate the upload
      const documentData = {
        driverId,
        driverName,
        name: uploadForm.name || uploadForm.file.name,
        type: uploadForm.type,
        status: 'PENDING',
        uploadDate: new Date(),
        expiryDate: new Date(Date.now() + (DOCUMENT_TYPES.find(t => t.id === uploadForm.type)?.expiryDays || 365) * 24 * 60 * 60 * 1000),
        notes: uploadForm.notes,
        uploadedBy: 'SYSTEM', // In real implementation, this would be the current user
        url: `https://drive.google.com/file/d/simulated-${Math.floor(Math.random() * 1000000)}/view` // Simulated Google Drive URL
      }

      await addDoc(collection(db, 'driverDocuments'), documentData)

      toast({
        title: 'Documento Subido',
        description: 'El documento ha sido subido exitosamente y está pendiente de revisión.'
      })

      setShowUploadDialog(false)
      setUploadForm({ name: '', type: '', notes: '', file: null })
    } catch (error) {
      console.error('Error uploading document:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo subir el documento. Inténtalo de nuevo.'
      })
    }
  }

  const handleDownload = (document: Document) => {
    if (document.url) {
      window.open(document.url, '_blank')
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se encontró el enlace del documento.'
      })
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      await deleteDoc(doc(db, 'driverDocuments', documentId))
      toast({
        title: 'Documento Eliminado',
        description: 'El documento ha sido eliminado exitosamente.'
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el documento.'
      })
    }
  }

  const getDocumentTypeName = (typeId: string) => {
    return DOCUMENT_TYPES.find(t => t.id === typeId)?.name || typeId
  }

  const getRequiredDocuments = () => {
    return DOCUMENT_TYPES.filter(doc => doc.required)
  }

  const getUploadedDocuments = () => {
    return documents.map(doc => doc.type)
  }

  const getMissingRequiredDocuments = () => {
    const required = getRequiredDocuments().map(doc => doc.id)
    const uploaded = getUploadedDocuments()
    return required.filter(type => !uploaded.includes(type))
  }

  const missingRequired = getMissingRequiredDocuments()

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Documentos</h3>
          <p className="text-sm text-muted-foreground">
            Documentos de {driverName}
          </p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Nuevo Documento</DialogTitle>
              <DialogDescription>
                Sube un documento para {driverName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Tipo de Documento</Label>
                <select
                  id="documentType"
                  className="w-full p-2 border rounded-md"
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">Selecciona un tipo</option>
                  {DOCUMENT_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} {type.required && '(Requerido)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentName">Nombre del Documento</Label>
                <Input
                  id="documentName"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: INE_Frontal_2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Archivo</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Información adicional sobre el documento..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Subir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Missing Required Documents Alert */}
      {missingRequired.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Documentos Requeridos Faltantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-2">
              Los siguientes documentos son requeridos y no han sido subidos:
            </p>
            <div className="flex flex-wrap gap-2">
              {missingRequired.map(type => (
                <Badge key={type} variant="outline" className="border-orange-300 text-orange-700">
                  {getDocumentTypeName(type)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((document) => (
          <Card key={document.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(document.status, document.expiryDate)}
                  <CardTitle className="text-sm">{document.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(document.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tipo:</span>
                  <span className="text-xs font-medium">{getDocumentTypeName(document.type)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Estado:</span>
                  {getStatusBadge(document.status, document.expiryDate)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Subido:</span>
                  <span className="text-xs">{format(document.uploadDate, 'dd/MM/yyyy', { locale: es })}</span>
                </div>
                {document.expiryDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Expira:</span>
                    <span className="text-xs">{format(document.expiryDate, 'dd/MM/yyyy', { locale: es })}</span>
                  </div>
                )}
                {document.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">{document.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {documents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
            <p className="text-muted-foreground text-center mb-4">
              Aún no se han subido documentos para este repartidor.
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Subir Primer Documento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
