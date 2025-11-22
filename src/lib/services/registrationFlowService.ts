// =================
// REGISTRATION FLOW SERVICE - AUTOMATED EMAIL WORKFLOWS (with verificationCodes collection)
// =================

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { createAuditLog } from '@/lib/audit';

export interface RegistrationFlowConfig {
  businessWelcomeEnabled: boolean;
  verificationEnabled: boolean;
}

export interface BusinessRegistrationData {
  email: string;
  businessName: string;
  contactName: string;
  phone: string;
  address: string;
  businessType: string;
}

export interface DriverRegistrationData {
  nombre: string;
  email: string;
  telefono: string;
  rfc?: string;
  nss?: string;
  vehicleType: 'bici' | 'moto' | 'auto';
  ingresoBrutoMensual: number;
  imss: boolean;
}

export class RegistrationFlowService {
  private config: RegistrationFlowConfig = {
    businessWelcomeEnabled: true,
    verificationEnabled: true,
  };

  // Función para enviar emails via API
  private async sendEmailViaAPI(templateName: string, data: Record<string, any>): Promise<void> {
    try {
      // Usar estructura oficial del documento para mailQueue
      await addDoc(collection(db, COLLECTIONS.MAIL_QUEUE), {
        recipient: data.email,
        template: templateName,
        data: {
          userName: data.contactName,
          userEmail: data.email,
          code: data.verificationCode,
          businessName: data.businessName
        },
        status: 'PENDING',
        priority: 'HIGH',
        retries: 0,
        createdAt: new Date(),
        sentAt: null
      });
      
      console.log(`✅ Email ${templateName} queued for ${data.email}`);
    } catch (error) {
      console.error(`❌ Error sending email ${templateName}:`, error);
      throw error;
    }
  }

  // =================
  // BUSINESS REGISTRATION FLOW
  // =================

  async processBusinessRegistration(businessData: BusinessRegistrationData): Promise<{
    success: boolean;
    message: string;
    verificationCode: string;
  }> {
    try {
      // 1. Generate verification code
      const verificationCode = this.generateVerificationCode();

      // 2. Create business account in Firestore
      const businessRef = await addDoc(collection(db, COLLECTIONS.BUSINESSES), {
        ...businessData,
        status: 'PENDIENTE_VERIFICACION', // Corrected status
        credits: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: false,
      });

      // 3. Create verification code in Firestore
      await addDoc(collection(db, 'verificationCodes'), {
        email: businessData.email,
        code: verificationCode,
        verified: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // expires in 10 min
        businessId: businessRef.id,
      });

      // 4. Send welcome email with verification code
      if (this.config.businessWelcomeEnabled) {
        await this.sendEmailViaAPI('businessWelcome', {
          email: businessData.email,
          contactName: businessData.contactName,
          verificationCode
        });
      }

      // 5. Log audit
      await createAuditLog({
        action: 'BUSINESS_REGISTRATION_INITIATED',
        actor: 'SYSTEM',
        targetId: businessRef.id,
        entityType: 'business',
        details: {
          email: businessData.email,
          businessName: businessData.businessName,
          verificationCode,
        },
      });

      return {
        success: true,
        message: 'Business registration initiated successfully',
        verificationCode,
      };
    } catch (error) {
      console.error('❌ Error processing business registration:', error);
      throw new Error(`Business registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyBusinessEmail(email: string, verificationCode: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // 1. Find verification code in collection
      const codesSnapshot = await getDocs(
        query(
          collection(db, 'verificationCodes'),
          where('email', '==', email),
          where('code', '==', verificationCode),
          where('verified', '==', false)
        )
      );
      if (codesSnapshot.empty) throw new Error('Invalid or expired verification code');

      const codeDoc = codesSnapshot.docs[0];
      await updateDoc(codeDoc.ref, { verified: true, verifiedAt: new Date() });

      // 2. Find business by email
      const businessesSnapshot = await getDocs(
        query(collection(db, COLLECTIONS.BUSINESSES), where('email', '==', email))
      );
      if (businessesSnapshot.empty) throw new Error('Business not found');

      const businessDoc = businessesSnapshot.docs[0];
      await updateDoc(doc(db, COLLECTIONS.BUSINESSES, businessDoc.id), {
        status: 'ACTIVE',
        emailVerified: true,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      });

      // 3. Log audit
      await createAuditLog({
        action: 'BUSINESS_EMAIL_VERIFIED',
        actor: 'SYSTEM',
        targetId: businessDoc.id,
        entityType: 'business',
        details: {
          email,
          businessName: businessDoc.data().businessName,
        },
      });

      return {
        success: true,
        message: 'Business email verified successfully',
      };
    } catch (error) {
      console.error('❌ Error verifying business email:', error);
      throw new Error(`Email verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =================
  // DRIVER REGISTRATION FLOW
  // =================

  async processDriverRegistration(driverData: DriverRegistrationData): Promise<{
    success: boolean;
    message: string;
    applicationId?: string;
  }> {
    try {
      // 1. Create driver application in Firestore
      const applicationRef = await addDoc(collection(db, 'driverApplications'), {
        ...driverData,
        status: 'pending_review',
        createdAt: new Date(),
        updatedAt: new Date(),
        reviewedBy: null,
        reviewedAt: null,
        notes: null,
      });

      // 2. Log audit
      await createAuditLog({
        action: 'DRIVER_APPLICATION_SUBMITTED',
        actor: 'SYSTEM',
        targetId: applicationRef.id,
        entityType: 'driver_application',
        details: {
          driverName: driverData.nombre,
          email: driverData.email,
          vehicleType: driverData.vehicleType,
          grossIncome: driverData.ingresoBrutoMensual,
        },
      });

      return {
        success: true,
        message: 'Solicitud de repartidor enviada exitosamente',
        applicationId: applicationRef.id,
      };
    } catch (error) {
      console.error('❌ Error processing driver registration:', error);
      throw new Error(`Driver registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =================
  // UTILITY METHODS
  // =================

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

// =================
// SINGLETON INSTANCE
// =================

let registrationFlowInstance: RegistrationFlowService | null = null;

export const getRegistrationFlowService = (): RegistrationFlowService => {
  if (!registrationFlowInstance) {
    registrationFlowInstance = new RegistrationFlowService();
  }
  return registrationFlowInstance;
};