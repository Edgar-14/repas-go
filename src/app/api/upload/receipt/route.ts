/**
 * Upload Receipt API
 * Maneja la subida de comprobantes de transferencia bancaria
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { adminApp } from '@/lib/firebase/admin';
import { logger } from '@/utils/logger';

// Asegurar runtime Node.js para soporte de Buffer y Admin SDK
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    logger.debug('📤 Starting receipt upload...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const businessId = formData.get('businessId') as string;
    const transferDetails = formData.get('transferDetails') as string;

    logger.debug('📋 Form data received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      businessId: businessId ? 'provided' : 'missing',
      transferDetails: transferDetails ? 'provided' : 'missing'
    });

    if (!file) {
      logger.debug('❌ No file provided');
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    if (!businessId) {
      logger.debug('❌ No business ID provided');
      return NextResponse.json({
        success: false,
        error: 'No business ID provided'
      }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      logger.debug('❌ Invalid file type:', file.type);
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only JPG, PNG, and PDF files are allowed.'
      }, { status: 400 });
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      logger.debug('❌ File too large:', file.size);
      return NextResponse.json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      }, { status: 400 });
    }

    // Inicializar Firebase Admin Storage
    const storage = getStorage(adminApp);
    
    // Obtener configuración del proyecto
    const projectId = adminApp.options.projectId || 'befast-hfkbl';
    const bucketName = (adminApp.options as any).storageBucket || 'befast-hfkbl.firebasestorage.app';
    
    logger.debug('🪣 Storage config:', { projectId, bucketName });
    
    // Configurar bucket con userProject para requester pays
    // Siempre configurar userProject para evitar errores de requester pays
    const bucket = storage.bucket(bucketName);
    bucket.userProject = projectId;
    logger.debug('💰 Setting userProject for bucket:', projectId);

    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `receipts/${businessId}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    logger.debug('📁 Uploading file:', fileName);

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo usando Firebase Admin SDK
    const fileRef = bucket.file(fileName);
    
    try {
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            businessId,
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            transferDetails: transferDetails || '{}'
          }
        }
      });
      logger.debug('✅ File saved successfully to Firebase Storage');
    } catch (uploadError: any) {
      logger.error('❌ Error saving file to Firebase Storage:', {
        message: uploadError.message,
        code: uploadError.code,
        details: uploadError.details || uploadError.response?.data
      }, 'UPLOAD_RECEIPT');
      
      // Re-throw with more specific error message
      if (uploadError.message?.includes('requester pays')) {
        throw new Error('Storage bucket configuration error: requester pays not properly configured');
      }
      throw uploadError;
    }

    // Obtener URL de acceso al archivo
    let downloadURL: string;
    try {
      // Intentar hacer el archivo público (si el bucket no tiene UBLA)
      await fileRef.makePublic();
      downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    } catch (err: any) {
      logger.warn('⚠️ No se pudo hacer público el archivo, generando URL firmada...', undefined, {
        message: err?.message,
        code: err?.code,
      });
      // Fallback: generar URL firmada de larga duración
      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        // válido por ~10 años
        expires: '03-01-2035',
      });
      downloadURL = signedUrl;
    }

    logger.debug('✅ Receipt uploaded successfully:', { fileName, downloadURL: downloadURL.substring(0, 50) + '...' });

    return NextResponse.json({
      success: true,
      fileUrl: downloadURL,
      fileName: fileName,
      message: 'File uploaded successfully'
    });

  } catch (error: any) {
    logger.error('❌ Error uploading receipt:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.substring(0, 200)
    }, 'UPLOAD_RECEIPT');
    
    return NextResponse.json({
      success: false,
      error: 'Failed to upload file',
      details: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}