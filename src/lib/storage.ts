import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase'; // Assuming you have a firebase.ts file exporting the initialized app

const storage = getStorage(app);

// Función para generar UUID compatible con navegadores móviles
function generateUUID(): string {
  // Intentar usar crypto.randomUUID si está disponible
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback para navegadores que no soportan crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Uploads a file to Firebase Storage and returns its download URL.
 * @param file The file to upload.
 * @param path The path where the file should be stored (e.g., 'driver-applications/some-id').
 * @returns The public URL of the uploaded file.
 */
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // Create a unique filename to avoid collisions using timestamp
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${generateUUID()}.${fileExtension}`;
  const storageRef = ref(storage, `${path}/${uniqueFileName}`);

  try {
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file to storage.');
  }
};

/**
 * Uploads a file and returns both URL and metadata
 * @param file The file to upload
 * @param path The path where the file should be stored
 * @returns Object with downloadURL, storagePath, fileName, contentType, size, and uploadedAt
 */
export const uploadFileWithMetadata = async (file: File, path: string) => {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // BUG FIX: Better error handling for file upload
  // Validate file size (5MB limit as per storage rules)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error(`El archivo es demasiado grande. Máximo 5MB permitido. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Validate file type (images and PDFs only as per storage rules)
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    throw new Error(`Tipo de archivo no válido: ${file.type}. Solo se permiten imágenes (JPG, PNG, GIF) y PDF.`);
  }

  // Create a unique filename to avoid collisions using timestamp
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${generateUUID()}.${fileExtension}`;
  const fullPath = `${path}/${uniqueFileName}`;
  
  try {
    const downloadURL = await uploadFileToStorage(file, path);
    
    return {
      downloadURL,
      storagePath: fullPath,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Storage upload error:', error);
    // BUG FIX: Provide specific error messages with proper error handling
    if (error instanceof Error) {
      if (error.message.includes('unauthorized') || error.message.includes('permission-denied')) {
        throw new Error('Error de autenticación. Por favor, inicia sesión de nuevo e intenta subir el archivo.');
      }
      if (error.message.includes('storage/quota-exceeded')) {
        throw new Error('Límite de almacenamiento excedido. Contacta al soporte.');
      }
      if (error.message.includes('storage/retry-limit-exceeded')) {
        throw new Error('Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.');
      }
      if (error.message.includes('storage/invalid-format')) {
        throw new Error('Formato de archivo no válido. Por favor, selecciona un archivo válido.');
      }
      // Re-throw the original error message if it's already descriptive
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // Handle non-Error objects (strings, objects without message property, etc.)
    if (typeof error === 'string') {
      throw new Error(`Error al subir archivo: ${error}`);
    }

    if (error && typeof error === 'object' && 'message' in error) {
      throw new Error(`Error al subir archivo: ${String(error.message)}`);
    }

    // Fallback for unknown error types
    throw new Error('Error desconocido al subir archivo. Por favor, intenta de nuevo.');
  }
};
