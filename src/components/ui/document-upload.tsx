/**
 * Document Upload Component
 * Improved file upload with drag & drop, preview, and better UX
 */

import React, { useState, useRef } from 'react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Label } from './label'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  X, 
  Eye, 
  Download,
  Edit3,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentUploadProps {
  title: string
  description: string
  acceptedTypes?: string[]
  maxSize?: number // in MB
  currentDocument?: {
    url?: string
    name?: string
    uploadDate?: Date
    content?: string
  }
  onUpload: (file: File) => Promise<void>
  onRemove?: () => Promise<void>
  onCreateText?: () => void
  onView?: () => void
  isUploading?: boolean
  className?: string
}

export function DocumentUpload({
  title,
  description,
  acceptedTypes = ['pdf', 'doc', 'docx', 'txt'],
  maxSize = 10,
  currentDocument,
  onUpload,
  onRemove,
  onCreateText,
  onView,
  isUploading = false,
  className
}: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploadError(null)

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`El archivo es demasiado grande. Máximo ${maxSize}MB.`)
      return
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (fileExtension && !acceptedTypes.includes(fileExtension)) {
      setUploadError(`Tipo de archivo no permitido. Acepta: ${acceptedTypes.join(', ')}`)
      return
    }

    try {
      await onUpload(file)
    } catch (error) {
      setUploadError('Error al subir el archivo. Intenta de nuevo.')
    }
  }

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return FileText
    
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return File
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return Image
      default:
        return FileText
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className={cn("border-2 transition-colors", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <Label className="text-sm font-semibold text-gray-900">{title}</Label>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
            
            {/* Actions for existing document */}
            {(currentDocument?.url || currentDocument?.content) && (
              <div className="flex gap-2">
                {onView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onView}
                    className="flex-shrink-0"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                )}
                {onCreateText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCreateText}
                    className="flex-shrink-0"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
                {onRemove && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRemove}
                    className="flex-shrink-0 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Current Document Display */}
          {currentDocument?.url || currentDocument?.content ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              {React.createElement(getFileIcon(currentDocument.name), {
                className: "h-5 w-5 text-green-600 flex-shrink-0"
              })}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 truncate">
                  {currentDocument.name || `${title}.html`}
                </p>
                {currentDocument.uploadDate && (
                  <p className="text-xs text-green-600">
                    Subido: {
                      currentDocument.uploadDate instanceof Date 
                        ? currentDocument.uploadDate.toLocaleDateString()
                        : new Date(currentDocument.uploadDate).toLocaleDateString()
                    }
                  </p>
                )}
              </div>
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            </div>
          ) : (
            <>
              {/* Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                  isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                  isUploading && "pointer-events-none opacity-50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    <p className="text-sm text-gray-600">Subiendo archivo...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Arrastra un archivo aquí o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Acepta: {acceptedTypes.join(', ')} • Máximo {maxSize}MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Alternative: Create Text Document */}
              {onCreateText && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">o</span>
                  </div>
                </div>
              )}

              {onCreateText && (
                <Button
                  variant="outline"
                  onClick={onCreateText}
                  className="w-full"
                  disabled={isUploading}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Crear Documento de Texto
                </Button>
              )}
            </>
          )}

          {/* Error Display */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.map(type => `.${type}`).join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  )
}
