import React, { useState, useEffect } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, AlignLeft, AlignCenter } from 'lucide-react';

interface TextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  title: string;
  initialContent?: string;
}

export function TextEditorModal({
  isOpen,
  onClose,
  onSave,
  title,
  initialContent = ''
}: TextEditorModalProps) {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, isOpen]);

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  const handleClose = () => {
    setIsPreview(false);
    onClose();
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    // Restaurar foco y selección
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] h-auto sm:h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b">
          <DialogTitle className="text-lg sm:text-xl">Crear {title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 border-b bg-gray-50 overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('<h1>', '</h1>')}
              title="Título 1"
            >
              H1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('<h2>', '</h2>')}
              title="Título 2"
            >
              H2
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('<h3>', '</h3>')}
              title="Título 3"
            >
              H3
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('<strong>', '</strong>')}
              title="Negrita"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('<em>', '</em>')}
              title="Cursiva"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('<ul>\n<li>', '</li>\n</ul>')}
              title="Lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertText('<p>', '</p>')}
              title="Párrafo"
            >
              P
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
              className={isPreview ? 'bg-blue-100' : ''}
            >
              {isPreview ? 'Editor' : 'Vista Previa'}
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0">
            {isPreview ? (
              <div className="h-full overflow-auto border rounded-b p-3 sm:p-4 bg-white">
                <div 
                  className="prose prose-sm sm:prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                  role="document"
                  aria-label="Vista previa del documento"
                />
              </div>
            ) : (
              <textarea
                id="content-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full p-3 sm:p-6 border-0 resize-none text-sm sm:text-base leading-relaxed"
                placeholder="Escribe aquí el contenido de tu documento...

Usa los botones de arriba para dar formato:
• H1, H2, H3 para títulos
• B para texto en negrita  
• I para texto en cursiva
• P para párrafos
• Lista para listas con viñetas

¡Es muy fácil! Solo escribe tu texto y usa los botones para darle formato."
                aria-label="Editor de contenido"
              />
            )}
          </div>
        </div>

        {/* Footer con información y botones */}
        <div className="border-t bg-gray-50 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <div className="text-xs text-gray-500">
              <p><strong>Tip:</strong> Usa botones arriba para insertar HTML fácilmente</p>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              Caracteres: {content.length}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={handleClose} size="lg" className="w-full sm:w-auto touch-target">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!content.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto touch-target"
              size="lg"
            >
              Guardar Documento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}