/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Script para actualizar transacciones existentes con businessName faltante
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, getDoc } = require('firebase/firestore');

// Configuración de Firebase (usar las mismas variables que en tu app)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixTransactions() {
  try {
    console.log('🔧 Iniciando corrección de transacciones...');
    
    // Obtener todas las transacciones
    const transactionsRef = collection(db, 'creditTransactions');
    const transactionsSnap = await getDocs(transactionsRef);
    
    console.log(`📊 Encontradas ${transactionsSnap.size} transacciones`);
    
    let updated = 0;
    let errors = 0;
    
    for (const transactionDoc of transactionsSnap.docs) {
      const transactionData = transactionDoc.data();
      
      // Verificar si ya tiene businessName
      if (transactionData.businessName) {
        console.log(`✅ Transacción ${transactionDoc.id} ya tiene businessName`);
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
        const updateData = {
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
        await updateDoc(doc(db, 'creditTransactions', transactionDoc.id), updateData);
        
        console.log(`✅ Actualizada transacción ${transactionDoc.id} para ${businessName}`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Error actualizando transacción ${transactionDoc.id}:`, error);
        errors++;
      }
    }
    
    console.log(`\n🎉 Proceso completado:`);
    console.log(`   ✅ Actualizadas: ${updated}`);
    console.log(`   ❌ Errores: ${errors}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
fixTransactions();
