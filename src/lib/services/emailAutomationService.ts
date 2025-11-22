// =================
// EMAIL AUTOMATION SERVICE - TRIGGERS AND SCHEDULING
// =================

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, addDoc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { getGmailService } from './gmailService';
import { createAuditLog } from '@/lib/audit';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
export interface EmailTrigger {
  id: string;
  type: 'user_registration' | 'order_created' | 'driver_assigned' | 'payment_processed' | 'document_expiry' | 'payroll_processed' | 'system_alert';
  enabled: boolean;
  template: string;
  conditions?: Record<string, any>;
  recipients: string[];
  delay?: number; // minutes
  retryAttempts?: number;
  lastExecuted?: Date;
  nextExecution?: Date;
}

export interface EmailQueue {
  id: string;
  triggerId: string;
  recipient: string;
  template: string;
  data: Record<string, any>;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'retry';
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
}

export interface EmailStats {
  totalSent: number;
  totalFailed: number;
  successRate: number;
  averageDeliveryTime: number;
  last24Hours: number;
  lastWeek: number;
  lastMonth: number;
}

export class EmailAutomationService {
  private gmailService = getGmailService();
  private triggers: Map<string, EmailTrigger> = new Map();
  private isProcessing = false;

  constructor() {
    this.loadTriggers();
    this.startQueueProcessor();
  }

  // =================
  // TRIGGER MANAGEMENT
  // =================

  private async loadTriggers(): Promise<void> {
    try {
      const triggersSnapshot = await getDocs(collection(db, 'emailTriggers'));
      
      this.triggers.clear();
      triggersSnapshot.forEach((doc) => {
        const trigger = { id: doc.id, ...doc.data() } as EmailTrigger;
        this.triggers.set(trigger.id, trigger);
      });

      console.info(`📧 Loaded ${this.triggers.size} email triggers`);
    } catch (error) {
      console.error('Error loading email triggers:', error);
    }
  }

  async createTrigger(trigger: Omit<EmailTrigger, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'emailTriggers'), {
        ...trigger,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.loadTriggers();

      await createAuditLog({
        action: 'EMAIL_TRIGGER_CREATED',
        actor: 'SYSTEM',
        targetId: docRef.id,
        entityType: 'email_trigger',
        details: { triggerType: trigger.type, template: trigger.template },
      });

      console.info(`✅ Email trigger created: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating email trigger:', error);
      throw error;
    }
  }

  async updateTrigger(triggerId: string, updates: Partial<EmailTrigger>): Promise<void> {
    try {
      await updateDoc(doc(db, 'emailTriggers', triggerId), {
        ...updates,
        updatedAt: new Date(),
      });

      await this.loadTriggers();

      await createAuditLog({
        action: 'EMAIL_TRIGGER_UPDATED',
        actor: 'SYSTEM',
        targetId: triggerId,
        entityType: 'email_trigger',
        details: { updates },
      });

      console.info(`✅ Email trigger updated: ${triggerId}`);
    } catch (error) {
      console.error('Error updating email trigger:', error);
      throw error;
    }
  }

  // =================
  // EMAIL QUEUE MANAGEMENT
  // =================

  async addToQueue(emailData: {
    triggerId: string;
    recipient: string;
    template: string;
    data: Record<string, any>;
    scheduledFor?: Date;
  }): Promise<string> {
    try {
      const queueItem: Omit<EmailQueue, 'id'> = {
        triggerId: emailData.triggerId,
        recipient: emailData.recipient,
        template: emailData.template,
        data: emailData.data,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: emailData.scheduledFor || new Date(),
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.MAIL_QUEUE), queueItem);

      console.info(`📧 Email added to queue: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error adding email to queue:', error);
      throw error;
    }
  }

  private async startQueueProcessor(): Promise<void> {
    // Process queue every 30 seconds
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.processQueue();
      }
    }, 30000);

    console.info('📧 Email queue processor started');
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const now = new Date();
      const pendingEmails = await getDocs(
        query(
          collection(db, COLLECTIONS.MAIL_QUEUE),
          where('status', 'in', ['pending', 'retry']),
          where('scheduledFor', '<=', now),
          orderBy('scheduledFor', 'asc'),
          limit(10)
        )
      );

      for (const emailDoc of pendingEmails.docs) {
        const emailData = { id: emailDoc.id, ...emailDoc.data() } as EmailQueue;
        await this.processEmail(emailData);
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEmail(emailData: EmailQueue): Promise<void> {
    try {
      // Update status to processing
      await updateDoc(doc(db, 'emailQueue', emailData.id), {
        status: 'processing',
        attempts: emailData.attempts + 1,
      });

      // Send email based on template
      let result;
      switch (emailData.template) {
        case 'welcome':
          result = await this.gmailService.sendWelcomeEmail(
            emailData.recipient,
            emailData.data.userName,
            emailData.data.userType
          );
          break;
        case 'order_confirmation':
          result = await this.gmailService.sendOrderConfirmation(
            emailData.recipient,
            emailData.data.orderData
          );
          break;
        case 'driver_assignment':
          result = await this.gmailService.sendDriverAssignment(
            emailData.recipient,
            emailData.data.driverName,
            emailData.data.orderData
          );
          break;
        case 'payment_confirmation':
          result = await this.gmailService.sendPaymentConfirmation(
            emailData.recipient,
            emailData.data.paymentData
          );
          break;
        case 'document_reminder':
          result = await this.gmailService.sendDocumentReminder(
            emailData.recipient,
            emailData.data.userName,
            emailData.data.documentType,
            emailData.data.expiryDate
          );
          break;
        case 'payroll_notification':
          result = await this.gmailService.sendPayrollNotification(
            emailData.recipient,
            emailData.data.userName,
            emailData.data.payrollData
          );
          break;
        case 'system_alert':
          result = await this.gmailService.sendSystemAlert(
            emailData.recipient,
            emailData.data.alertData
          );
          break;
        default:
          throw new Error(`Unknown email template: ${emailData.template}`);
      }

      if (result.success) {
        // Mark as sent
        await updateDoc(doc(db, 'emailQueue', emailData.id), {
          status: 'sent',
          sentAt: new Date(),
        });

        console.info(`✅ Email sent successfully: ${emailData.id}`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if we should retry
      if (emailData.attempts < emailData.maxAttempts) {
        // Schedule for retry (exponential backoff)
        const retryDelay = Math.pow(2, emailData.attempts) * 5; // 5, 10, 20 minutes
        const retryTime = new Date(Date.now() + retryDelay * 60 * 1000);
        
        await updateDoc(doc(db, 'emailQueue', emailData.id), {
          status: 'retry',
          scheduledFor: retryTime,
          error: errorMsg,
        });

        console.info(`🔄 Email scheduled for retry: ${emailData.id} (attempt ${emailData.attempts + 1})`);
      } else {
        // Mark as failed
        await updateDoc(doc(db, 'emailQueue', emailData.id), {
          status: 'failed',
          error: errorMsg,
        });

        console.info(`❌ Email failed permanently: ${emailData.id}`);
      }
    }
  }

  // =================
  // TRIGGER EXECUTION
  // =================

  async triggerUserRegistration(userData: {
    email: string;
    userName: string;
    userType: 'driver' | 'business';
  }): Promise<void> {
    const trigger = this.triggers.get('user_registration');
    if (!trigger || !trigger.enabled) return;

    await this.addToQueue({
      triggerId: trigger.id,
      recipient: userData.email,
      template: 'welcome',
      data: {
        userName: userData.userName,
        userType: userData.userType,
      },
    });

    console.info(`📧 Welcome email queued for: ${userData.email}`);
  }

  async triggerOrderCreated(orderData: any): Promise<void> {
    const trigger = this.triggers.get('order_created');
    if (!trigger || !trigger.enabled) return;

    await this.addToQueue({
      triggerId: trigger.id,
      recipient: orderData.customerEmail,
      template: 'order_confirmation',
      data: { orderData },
    });

    console.info(`📧 Order confirmation queued for: ${orderData.customerEmail}`);
  }

  async triggerDriverAssignment(driverEmail: string, driverName: string, orderData: any): Promise<void> {
    const trigger = this.triggers.get('driver_assigned');
    if (!trigger || !trigger.enabled) return;

    await this.addToQueue({
      triggerId: trigger.id,
      recipient: driverEmail,
      template: 'driver_assignment',
      data: {
        driverName,
        orderData,
      },
    });

    console.info(`📧 Driver assignment queued for: ${driverEmail}`);
  }

  async triggerPaymentProcessed(paymentData: any): Promise<void> {
    const trigger = this.triggers.get('payment_processed');
    if (!trigger || !trigger.enabled) return;

    await this.addToQueue({
      triggerId: trigger.id,
      recipient: paymentData.customerEmail,
      template: 'payment_confirmation',
      data: { paymentData },
    });

    console.info(`📧 Payment confirmation queued for: ${paymentData.customerEmail}`);
  }

  async triggerDocumentExpiry(userEmail: string, userName: string, documentType: string, expiryDate: Date): Promise<void> {
    const trigger = this.triggers.get('document_expiry');
    if (!trigger || !trigger.enabled) return;

    // Schedule email 7 days before expiry
    const reminderDate = new Date(expiryDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    if (reminderDate > new Date()) {
      await this.addToQueue({
        triggerId: trigger.id,
        recipient: userEmail,
        template: 'document_reminder',
        data: {
          userName,
          documentType,
          expiryDate,
        },
        scheduledFor: reminderDate,
      });

      console.info(`📧 Document reminder scheduled for: ${userEmail}`);
    }
  }

  async triggerPayrollProcessed(userEmail: string, userName: string, payrollData: any): Promise<void> {
    const trigger = this.triggers.get('payroll_processed');
    if (!trigger || !trigger.enabled) return;

    await this.addToQueue({
      triggerId: trigger.id,
      recipient: userEmail,
      template: 'payroll_notification',
      data: {
        userName,
        payrollData,
      },
    });

    console.info(`📧 Payroll notification queued for: ${userEmail}`);
  }

  async triggerSystemAlert(alertData: any, adminEmails: string[]): Promise<void> {
    const trigger = this.triggers.get('system_alert');
    if (!trigger || !trigger.enabled) return;

    for (const adminEmail of adminEmails) {
      await this.addToQueue({
        triggerId: trigger.id,
        recipient: adminEmail,
        template: 'system_alert',
        data: { alertData },
      });
    }

    console.info(`📧 System alert queued for ${adminEmails.length} admins`);
  }

  // =================
  // STATISTICS AND MONITORING
  // =================

  async getEmailStats(): Promise<EmailStats> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [sentEmails, failedEmails, last24HoursEmails, lastWeekEmails, lastMonthEmails] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.MAIL_QUEUE), where('status', '==', 'sent'))),
        getDocs(query(collection(db, COLLECTIONS.MAIL_QUEUE), where('status', '==', 'failed'))),
        getDocs(query(collection(db, COLLECTIONS.MAIL_QUEUE), where('sentAt', '>=', last24Hours))),
        getDocs(query(collection(db, COLLECTIONS.MAIL_QUEUE), where('sentAt', '>=', lastWeek))),
        getDocs(query(collection(db, COLLECTIONS.MAIL_QUEUE), where('sentAt', '>=', lastMonth))),
      ]);

      const totalSent = sentEmails.size;
      const totalFailed = failedEmails.size;
      const successRate = totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0;

      // Calculate average delivery time
      let totalDeliveryTime = 0;
      let deliveryCount = 0;
      
      sentEmails.forEach((doc) => {
        const data = doc.data();
        if (data.sentAt && data.createdAt) {
          const deliveryTime = data.sentAt.toDate().getTime() - data.createdAt.toDate().getTime();
          totalDeliveryTime += deliveryTime;
          deliveryCount++;
        }
      });

      const averageDeliveryTime = deliveryCount > 0 ? totalDeliveryTime / deliveryCount : 0;

      return {
        totalSent,
        totalFailed,
        successRate,
        averageDeliveryTime,
        last24Hours: last24HoursEmails.size,
        lastWeek: lastWeekEmails.size,
        lastMonth: lastMonthEmails.size,
      };
    } catch (error) {
      console.error('Error getting email stats:', error);
      return {
        totalSent: 0,
        totalFailed: 0,
        successRate: 0,
        averageDeliveryTime: 0,
        last24Hours: 0,
        lastWeek: 0,
        lastMonth: 0,
      };
    }
  }

  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    retry: number;
    failed: number;
  }> {
    try {
      const [pending, processing, retry, failed] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.MAIL_QUEUE), where('status', '==', 'pending'))),
        getDocs(query(collection(db, COLLECTIONS.MAIL_QUEUE), where('status', '==', 'processing'))),
        getDocs(query(collection(db, COLLECTIONS.MAIL_QUEUE), where('status', '==', 'retry'))),
        getDocs(query(collection(db, COLLECTIONS.MAIL_QUEUE), where('status', '==', 'failed'))),
      ]);

      return {
        pending: pending.size,
        processing: processing.size,
        retry: retry.size,
        failed: failed.size,
      };
    } catch (error) {
      console.error('Error getting queue status:', error);
      return { pending: 0, processing: 0, retry: 0, failed: 0 };
    }
  }

  // =================
  // INITIALIZATION
  // =================

  async initializeDefaultTriggers(): Promise<void> {
    const defaultTriggers: Omit<EmailTrigger, 'id'>[] = [
      {
        type: 'user_registration',
        enabled: true,
        template: 'welcome',
        recipients: [],
        delay: 0,
        retryAttempts: 3,
      },
      {
        type: 'order_created',
        enabled: true,
        template: 'order_confirmation',
        recipients: [],
        delay: 0,
        retryAttempts: 3,
      },
      {
        type: 'driver_assigned',
        enabled: true,
        template: 'driver_assignment',
        recipients: [],
        delay: 0,
        retryAttempts: 3,
      },
      {
        type: 'payment_processed',
        enabled: true,
        template: 'payment_confirmation',
        recipients: [],
        delay: 0,
        retryAttempts: 3,
      },
      {
        type: 'document_expiry',
        enabled: true,
        template: 'document_reminder',
        recipients: [],
        delay: 0,
        retryAttempts: 3,
      },
      {
        type: 'payroll_processed',
        enabled: true,
        template: 'payroll_notification',
        recipients: [],
        delay: 0,
        retryAttempts: 3,
      },
      {
        type: 'system_alert',
        enabled: true,
        template: 'system_alert',
        recipients: [],
        delay: 0,
        retryAttempts: 3,
      },
    ];

    for (const trigger of defaultTriggers) {
      try {
        await this.createTrigger(trigger);
      } catch (error) {
        console.error(`Error creating default trigger ${trigger.type}:`, error);
      }
    }

    console.info('📧 Default email triggers initialized');
  }
}

// =================
// SINGLETON INSTANCE
// =================

let emailAutomationInstance: EmailAutomationService | null = null;

export const getEmailAutomationService = (): EmailAutomationService => {
  if (!emailAutomationInstance) {
    emailAutomationInstance = new EmailAutomationService();
  }
  return emailAutomationInstance;
};