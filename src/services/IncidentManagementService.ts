// Servicio de Gestión de Incidentes y Desactivación para BeFast GO
import { firestore, functions, COLLECTIONS, CLOUD_FUNCTIONS } from '../config/firebase';

/**
 * Tipos de incidentes según documento oficial
 */
export enum IncidentType {
  NO_REALIZACION_PEDIDO = 'NO_REALIZACION_PEDIDO',           // No realización de pedido aceptado
  ENTREGA_INCOMPLETA = 'ENTREGA_INCOMPLETA',                 // Entrega incompleta
  INCUMPLIMIENTO_INSTRUCCIONES = 'INCUMPLIMIENTO_INSTRUCCIONES', // Incumplimiento de instrucciones
  FALTA_ACTUALIZACION_DATOS = 'FALTA_ACTUALIZACION_DATOS'    // Falta de actualización de datos operativos
}

/**
 * Estados del proceso de revisión
 */
export enum ReviewStatus {
  PENDING_CLARIFICATION = 'PENDING_CLARIFICATION',  // Esperando aclaración del conductor
  UNDER_REVIEW = 'UNDER_REVIEW',                    // En revisión por comité
  JUSTIFIED = 'JUSTIFIED',                          // Incidente justificado
  NOT_JUSTIFIED = 'NOT_JUSTIFIED',                  // Incidente no justificado
  RESCISSION_INTENDED = 'RESCISSION_INTENDED',      // Intención de rescisión notificada
  FORMAL_REVIEW_REQUESTED = 'FORMAL_REVIEW_REQUESTED', // Revisión formal solicitada
  RESCISSION_CONFIRMED = 'RESCISSION_CONFIRMED',    // Rescisión confirmada
  RESCISSION_REVOKED = 'RESCISSION_REVOKED'         // Rescisión revocada
}

/**
 * Servicio de gestión de incidentes y procesos de desactivación
 * Implementa la Política de Gestión Algorítmica según documento oficial
 */
class IncidentManagementService {
  /**
   * Registra un incidente del conductor
   * Notifica al conductor en un plazo de 24 horas
   */
  async registerIncident(
    driverId: string,
    incidentType: IncidentType,
    description: string,
    orderId?: string,
    evidence?: any
  ): Promise<{
    success: boolean;
    incidentId: string;
    incidentCount: number;
    warning?: string;
  }> {
    try {
      // Registrar incidente en Firestore
      const incidentRef = await firestore()
        .collection(COLLECTIONS.INCIDENTS)
        .add({
          driverId,
          incidentType,
          description,
          orderId: orderId || null,
          evidence: evidence || {},
          status: ReviewStatus.PENDING_CLARIFICATION,
          registeredAt: firestore.FieldValue.serverTimestamp(),
          notifiedAt: null,
          clarificationDeadline: null,
          createdAt: firestore.FieldValue.serverTimestamp()
        });

      // Contar incidentes no justificados en los últimos 30 días
      const incidentCount = await this.countRecentIncidents(driverId);

      // Llamar a Cloud Function para procesar incidente
      await functions().httpsCallable(CLOUD_FUNCTIONS.PROCESS_INCIDENT)({
        driverId,
        incidentId: incidentRef.id,
        incidentType,
        incidentCount
      });

      // Verificar si se debe iniciar proceso de rescisión
      let warning: string | undefined;
      if (incidentCount >= 3) {
        warning = 'ADVERTENCIA: Tercer incumplimiento registrado. Se iniciará proceso de rescisión.';
        await this.initiateRescissionProcess(driverId, incidentRef.id);
      } else if (incidentCount === 2) {
        warning = 'ADVERTENCIA: Segundo incumplimiento registrado. Uno más iniciará proceso de rescisión.';
      }

      return {
        success: true,
        incidentId: incidentRef.id,
        incidentCount,
        warning
      };
    } catch (error) {
      console.error('Error registering incident:', error);
      throw new Error('Error al registrar incidente');
    }
  }

  /**
   * Permite al conductor presentar aclaraciones o justificaciones
   * Plazo: 2 días hábiles después de la notificación
   */
  async submitClarification(
    incidentId: string,
    driverId: string,
    clarification: string,
    attachments?: any[]
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Actualizar incidente con aclaración
      await firestore()
        .collection(COLLECTIONS.INCIDENTS)
        .doc(incidentId)
        .update({
          clarification,
          clarificationAttachments: attachments || [],
          clarificationSubmittedAt: firestore.FieldValue.serverTimestamp(),
          status: ReviewStatus.UNDER_REVIEW
        });

      // Llamar a Cloud Function para notificar al comité
      await functions().httpsCallable(CLOUD_FUNCTIONS.NOTIFY_INCIDENT_CLARIFICATION)({
        incidentId,
        driverId
      });

      return {
        success: true,
        message: 'Aclaración enviada. Será revisada por el comité en un plazo de 5 días hábiles.'
      };
    } catch (error) {
      console.error('Error submitting clarification:', error);
      throw new Error('Error al enviar aclaración');
    }
  }

  /**
   * Solicita revisión formal por el comité
   * Disponible después de recibir notificación de intención de rescisión
   */
  async requestFormalReview(
    driverId: string,
    reason: string,
    requestAudience: boolean,
    evidence?: any[]
  ): Promise<{
    success: boolean;
    reviewId: string;
    message: string;
  }> {
    try {
      // Crear solicitud de revisión formal
      const reviewRef = await firestore()
        .collection(COLLECTIONS.FORMAL_REVIEWS)
        .add({
          driverId,
          reason,
          requestAudience,
          evidence: evidence || [],
          status: ReviewStatus.FORMAL_REVIEW_REQUESTED,
          requestedAt: firestore.FieldValue.serverTimestamp(),
          reviewDeadline: this.calculateDeadline(7), // 7 días hábiles
          createdAt: firestore.FieldValue.serverTimestamp()
        });

      // Llamar a Cloud Function para iniciar revisión formal
      await functions().httpsCallable(CLOUD_FUNCTIONS.INITIATE_FORMAL_REVIEW)({
        driverId,
        reviewId: reviewRef.id,
        requestAudience
      });

      return {
        success: true,
        reviewId: reviewRef.id,
        message: 'Revisión formal solicitada. El comité resolverá en un plazo máximo de 7 días hábiles.'
      };
    } catch (error) {
      console.error('Error requesting formal review:', error);
      throw new Error('Error al solicitar revisión formal');
    }
  }

  /**
   * Suspende al conductor temporalmente por acumulación de incidentes
   */
  async suspendDriver(
    driverId: string,
    reason: string,
    durationDays: number
  ): Promise<{
    success: boolean;
    suspensionEndsAt: Date;
  }> {
    try {
      const suspensionEndsAt = new Date();
      suspensionEndsAt.setDate(suspensionEndsAt.getDate() + durationDays);

      // Actualizar estado del conductor
      await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .update({
          'administrative.befastStatus': 'SUSPENDED',
          'administrative.suspendedUntil': firestore.Timestamp.fromDate(suspensionEndsAt),
          'administrative.suspensionReason': reason,
          'administrative.suspendedAt': firestore.FieldValue.serverTimestamp()
        });

      // Llamar a Cloud Function para notificar suspensión
      await functions().httpsCallable(CLOUD_FUNCTIONS.NOTIFY_DRIVER_SUSPENSION)({
        driverId,
        reason,
        durationDays,
        suspensionEndsAt: suspensionEndsAt.toISOString()
      });

      return {
        success: true,
        suspensionEndsAt
      };
    } catch (error) {
      console.error('Error suspending driver:', error);
      throw new Error('Error al suspender conductor');
    }
  }

  /**
   * Desactiva permanentemente al conductor (rescisión confirmada)
   */
  async deactivateDriver(
    driverId: string,
    reason: string,
    formalReviewId?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Actualizar estado del conductor
      await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .update({
          'administrative.befastStatus': 'DEACTIVATED',
          'administrative.deactivatedAt': firestore.FieldValue.serverTimestamp(),
          'administrative.deactivationReason': reason,
          'administrative.formalReviewId': formalReviewId || null
        });

      // Llamar a Cloud Function para procesar desactivación
      await functions().httpsCallable(CLOUD_FUNCTIONS.PROCESS_DRIVER_DEACTIVATION)({
        driverId,
        reason,
        formalReviewId
      });

      return {
        success: true,
        message: 'Conductor desactivado. Se ha informado de su derecho a acudir a autoridades laborales.'
      };
    } catch (error) {
      console.error('Error deactivating driver:', error);
      throw new Error('Error al desactivar conductor');
    }
  }

  /**
   * Cuenta incidentes no justificados en los últimos 30 días
   */
  private async countRecentIncidents(driverId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshot = await firestore()
      .collection(COLLECTIONS.INCIDENTS)
      .where('driverId', '==', driverId)
      .where('status', '==', ReviewStatus.NOT_JUSTIFIED)
      .where('registeredAt', '>=', firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    return snapshot.size;
  }

  /**
   * Inicia proceso de rescisión (tercer incumplimiento)
   * Notifica con al menos 3 días de anticipación
   */
  private async initiateRescissionProcess(
    driverId: string,
    incidentId: string
  ): Promise<void> {
    try {
      // Actualizar incidente
      await firestore()
        .collection(COLLECTIONS.INCIDENTS)
        .doc(incidentId)
        .update({
          status: ReviewStatus.RESCISSION_INTENDED,
          rescissionIntendedAt: firestore.FieldValue.serverTimestamp(),
          rescissionDeadline: this.calculateDeadline(3) // 3 días hábiles
        });

      // Llamar a Cloud Function para notificar intención de rescisión
      await functions().httpsCallable(CLOUD_FUNCTIONS.NOTIFY_RESCISSION_INTENT)({
        driverId,
        incidentId
      });
    } catch (error) {
      console.error('Error initiating rescission process:', error);
      throw error;
    }
  }

  /**
   * Calcula fecha límite considerando días hábiles
   */
  private calculateDeadline(businessDays: number): Date {
    const deadline = new Date();
    let daysAdded = 0;

    while (daysAdded < businessDays) {
      deadline.setDate(deadline.getDate() + 1);
      const dayOfWeek = deadline.getDay();
      
      // Excluir sábados (6) y domingos (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }

    return deadline;
  }

  /**
   * Obtiene historial de incidentes del conductor
   */
  async getDriverIncidents(
    driverId: string,
    limit: number = 20
  ): Promise<any[]> {
    const snapshot = await firestore()
      .collection(COLLECTIONS.INCIDENTS)
      .where('driverId', '==', driverId)
      .orderBy('registeredAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}

export default new IncidentManagementService();
