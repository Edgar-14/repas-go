// src/lib/email-service.ts
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { app } from './firebase';
import { COLLECTIONS } from './collections';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
const db = getFirestore(app);

// Interface para cola de emails
interface EmailQueueData {
  to: string;
  template: {
    name: string;
    data: Record<string, any>;
  };
  status: 'pending';
  createdAt: any;
}

// Tipos de plantillas disponibles
export type EmailTemplate = 
  | 'businessWelcome'
  | 'driverWelcome' 
  | 'driverApproved'
  | 'verification'
  | 'emailChangeVerification'
  | 'passwordReset'
  | 'orderConfirmation'
  | 'orderAssignment'
  | 'weeklyReport'
  | 'paymentReceipt'
  | 'accountSuspension'
  | 'adminWelcome'
  | 'custom';

// Función principal para enviar emails profesionales
export async function sendProfessionalEmail(
  to: string,
  template: EmailTemplate,
  data: Record<string, any> = {}
): Promise<boolean> {
  try {
    console.info(`📧 Queueing professional email: ${template} to ${to}`);
    
    const emailData: EmailQueueData = {
      to,
      template: {
        name: template,
        data
      },
      status: 'pending',
      createdAt: serverTimestamp()
    };

    // Agregar a la cola de emails en Firestore
    await addDoc(collection(db, COLLECTIONS.MAIL_QUEUE), emailData);
    
    console.info(`✅ Professional email queued successfully: ${template} to ${to}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error queueing professional email:', error);
    return false;
  }
}

// Función específica para email de bienvenida de negocios
export async function sendBusinessWelcomeEmail(
  email: string,
  businessName: string,
  contactName?: string,
  verificationCode?: string
): Promise<boolean> {
  return sendProfessionalEmail(email, 'businessWelcome', {
    userName: contactName || businessName,
    businessName,
    userEmail: email,
    verificationCode
  });
}

// Función específica para códigos de verificación
export async function sendVerificationCodeEmail(
  email: string,
  code: string,
  expirationMinutes: number = 10
): Promise<boolean> {
  return sendProfessionalEmail(email, 'verification', {
    code,
    expirationMinutes
  });
}

// Función específica para confirmación de pedidos
export async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  businessName: string,
  pickupAddress: string,
  deliveryAddress: string
): Promise<boolean> {
  return sendProfessionalEmail(email, 'orderConfirmation', {
    businessName,
    orderId,
    pickupAddress,
    deliveryAddress
  });
}

// Función específica para asignación de pedidos a repartidores
export async function sendOrderAssignmentEmail(
  email: string,
  driverName: string,
  orderId: string,
  pickupAddress: string,
  deliveryAddress: string,
  earnings: string | number
): Promise<boolean> {
  return sendProfessionalEmail(email, 'orderAssignment', {
    driverName,
    orderId,
    pickupAddress,
    deliveryAddress,
    earnings
  });
}

// Función específica para reset de password
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetLink: string
): Promise<boolean> {
  return sendProfessionalEmail(email, 'passwordReset', {
    userName,
    resetLink
  });
}

// Función específica para bienvenida de repartidores
export async function sendDriverWelcomeEmail(
  email: string,
  userName: string
): Promise<boolean> {
  return sendProfessionalEmail(email, 'driverWelcome', {
    userName
  });
}

// Función específica para aprobación de repartidores
export async function sendDriverApprovedEmail(
  email: string,
  userName: string,
  resetLink: string
): Promise<boolean> {
  return sendProfessionalEmail(email, 'driverApproved', {
    userName,
    resetLink
  });
}
