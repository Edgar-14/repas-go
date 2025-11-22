import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { db } from '@/lib/firebase';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
// AuditService for tracking changes in Firestore
export class AuditService {
  static async logActivity(action: string, details: any = {}) {
    try {
      await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
        action,
        ...details,
        createdAt: serverTimestamp(),
        timestamp: new Date().toISOString()
      });
      
      console.info(`[AUDIT] ${action}:`, details);
      
      return {
        success: true,
        timestamp: new Date(),
        action,
        details
      };
    } catch (error) {
      console.error('Error creating audit log:', error);
      // No throw error to avoid breaking main functionality
      return {
        success: false,
        error: error,
        timestamp: new Date(),
        action,
        details
      };
    }
  }

  static async getAuditLogs(limitCount = 100) {
    try {
      const q = query(
        collection(db, COLLECTIONS.AUDIT_LOGS),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }
}

// Export the function that other services expect
export const logAuditAction = AuditService.logActivity;

export default AuditService;