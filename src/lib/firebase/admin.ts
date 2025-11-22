import { initializeApp, getApps, cert, ServiceAccount, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as path from 'path';

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'befast-hfkbl.firebasestorage.app';

// Inicialización resiliente para entornos locales y GCP (Hosting/Cloud Run)
let app;

if (getApps().length) {
  app = getApps()[0];
} else {
  // Detectar ambiente GCP (Cloud Run/Functions v2) -> usar applicationDefault()
  const runningOnGcp = !!process.env.K_SERVICE || !!process.env.FUNCTION_TARGET || !!process.env.GOOGLE_CLOUD_PROJECT;
  if (runningOnGcp) {
    console.log('🔐 Inicializando Firebase Admin con applicationDefault (GCP runtime)');
    app = initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'befast-hfkbl',
      storageBucket,
    });
  } else {
    // Desarrollo/local: intentar credenciales por archivo y luego variables de entorno
    try {
      const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
      console.log('🔍 Intentando usar service-account.json desde:', serviceAccountPath);
      app = initializeApp({
        credential: cert(serviceAccountPath),
        projectId: process.env.FIREBASE_PROJECT_ID || 'befast-hfkbl',
        storageBucket,
      });
      console.log('✅ Firebase Admin SDK inicializado con service-account.json');
    } catch (error) {
      console.log('⚠️ No se encontró/leyó service-account.json. Probando variables de entorno...');
      const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || 'befast-hfkbl',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      };
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId,
        storageBucket,
      });
      console.log('✅ Firebase Admin SDK inicializado con variables de entorno');
    }
  }
}

// Exportar instancias de servicios
export const adminDb = getFirestore(app);
export const db = getFirestore(app); // Alias para compatibilidad
export const auth = getAuth(app);
export const storage = getStorage(app);
export const adminApp = app;

console.log('✅ Firebase Admin SDK inicializado exitosamente');
console.log('Project ID:', app.options.projectId);
console.log('Storage bucket:', (app.options as any).storageBucket);
