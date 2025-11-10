// Servicio de Asignación de Pedidos para BeFast GO
import { firestore, functions, COLLECTIONS, CLOUD_FUNCTIONS } from '../config/firebase';
import PricingService from './PricingService';
import ValidationService from './ValidationService';

/**
 * Configuración del algoritmo de asignación
 * Según documento: "Difundir a todos", "Tan pronto como llegue el pedido"
 * Límite: Conductores con <= 3 pedidos activos
 */
interface AssignmentConfig {
  maxActiveOrdersPerDriver: number;
  broadcastToAll: boolean;
  sendImmediately: boolean;
  minAssignmentScore: number;
}

const DEFAULT_ASSIGNMENT_CONFIG: AssignmentConfig = {
  maxActiveOrdersPerDriver: 3,
  broadcastToAll: true,
  sendImmediately: true,
  minAssignmentScore: 0.3 // Score mínimo aceptable
};

interface DriverCandidate {
  driverId: string;
  driverData: any;
  distanceToPickup: number;
  activeOrdersCount: number;
  assignmentScore: number;
  validationResult: any;
}

/**
 * Servicio de asignación inteligente de pedidos
 * Implementa el algoritmo de selección de conductores según especificaciones
 */
class OrderAssignmentService {
  private config: AssignmentConfig;

  constructor() {
    this.config = DEFAULT_ASSIGNMENT_CONFIG;
  }

  /**
   * Encuentra y selecciona los mejores conductores para un pedido
   * Algoritmo: "Difundir a todos" con límite de 3 pedidos activos
   */
  async findBestDrivers(
    pickupLat: number,
    pickupLon: number,
    deliveryLat: number,
    deliveryLon: number,
    paymentMethod: 'CASH' | 'CARD'
  ): Promise<DriverCandidate[]> {
    try {
      // 1. Obtener todos los conductores ACTIVE y Online
      const driversSnapshot = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .where('administrative.befastStatus', '==', 'ACTIVE')
        .where('operational.isOnline', '==', true)
        .where('operational.status', '==', 'ACTIVE')
        .get();

      const candidates: DriverCandidate[] = [];

      // 2. Evaluar cada conductor
      for (const driverDoc of driversSnapshot.docs) {
        const driverId = driverDoc.id;
        const driverData = driverDoc.data();

        // Validar límite de pedidos activos
        const activeOrdersCount = await this.countActiveOrders(driverId);
        if (activeOrdersCount >= this.config.maxActiveOrdersPerDriver) {
          continue; // Saltar conductor con demasiados pedidos
        }

        // Validar estado del conductor (IMSS, deudas, etc.)
        const validationResult = await ValidationService.validateDriverForOrderAssignment(driverId);
        
        // Validación condicional de deudas para pedidos en efectivo
        if (paymentMethod === 'CASH') {
          const currentDebt = driverData.wallet?.pendingDebts || 0;
          const debtLimit = driverData.wallet?.creditLimit || 300;
          
          if (currentDebt >= debtLimit) {
            continue; // Saltar conductor con deuda excedida (solo para efectivo)
          }
        }

        if (!validationResult.canReceiveOrders) {
          continue; // Saltar conductor que no pasa validaciones
        }

        // Calcular distancia del conductor al pickup
        const driverLat = driverData.operational?.currentLocation?.latitude;
        const driverLon = driverData.operational?.currentLocation?.longitude;

        if (!driverLat || !driverLon) {
          continue; // Saltar conductor sin ubicación
        }

        const distanceToPickup = PricingService.calculateDriverToPickupDistance(
          driverLat,
          driverLon,
          pickupLat,
          pickupLon
        );

        // Calcular score de asignación
        const assignmentScore = PricingService.calculateAssignmentScore(
          distanceToPickup,
          activeOrdersCount,
          driverData.stats?.rating || 4.5,
          this.config.maxActiveOrdersPerDriver
        );

        // Solo incluir conductores con score mínimo
        if (assignmentScore >= this.config.minAssignmentScore) {
          candidates.push({
            driverId,
            driverData,
            distanceToPickup,
            activeOrdersCount,
            assignmentScore,
            validationResult
          });
        }
      }

      // 3. Ordenar candidatos por score de asignación (de mayor a menor)
      candidates.sort((a, b) => b.assignmentScore - a.assignmentScore);

      return candidates;
    } catch (error) {
      console.error('Error finding best drivers:', error);
      throw error;
    }
  }

  /**
   * Cuenta los pedidos activos de un conductor
   */
  async countActiveOrders(driverId: string): Promise<number> {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.ORDERS)
        .where('driverId', '==', driverId)
        .where('status', 'in', ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'])
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('Error counting active orders:', error);
      return 0;
    }
  }

  /**
   * Difunde un pedido a todos los conductores elegibles
   * Según especificación: "Difundir a todos", "Tan pronto como llegue"
   */
  async broadcastOrderToDrivers(
    orderId: string,
    candidates: DriverCandidate[]
  ): Promise<void> {
    try {
      // Enviar notificación push a cada conductor elegible
      const notificationPromises = candidates.map(async (candidate) => {
        try {
          // Llamar Cloud Function para enviar notificación
          await functions().httpsCallable(CLOUD_FUNCTIONS.SEND_NOTIFICATION)({
            driverId: candidate.driverId,
            type: 'NEW_ORDER',
            title: 'Nuevo Pedido Disponible',
            body: `Pedido a ${candidate.distanceToPickup.toFixed(1)} km de ti`,
            data: {
              orderId,
              distanceToPickup: candidate.distanceToPickup,
              assignmentScore: candidate.assignmentScore
            }
          });
        } catch (error) {
          console.error(`Error sending notification to ${candidate.driverId}:`, error);
        }
      });

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error broadcasting order:', error);
      throw error;
    }
  }

  /**
   * Valida la asignación de un pedido usando Vertex AI
   * Llama a la Cloud Function que valida con el modelo de IA Logística
   */
  async validateAssignmentWithAI(
    orderId: string,
    driverId: string,
    estimatedETA: number,
    assignmentScore: number
  ): Promise<{
    approved: boolean;
    aiScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reason?: string;
  }> {
    try {
      // Llamar a Cloud Function que integra con Vertex AI
      const result = await functions().httpsCallable('validateAssignmentWithVertexAI')({
        orderId,
        driverId,
        estimatedETA,
        assignmentScore,
        timestamp: new Date().toISOString()
      });

      const data = result.data as any;

      return {
        approved: data.approved || false,
        aiScore: data.aiScore || 0,
        riskLevel: data.riskLevel || 'MEDIUM',
        reason: data.reason
      };
    } catch (error) {
      console.error('Error validating with Vertex AI:', error);
      // En caso de error de IA, aprobar por defecto si score manual es bueno
      return {
        approved: assignmentScore >= 0.6,
        aiScore: assignmentScore,
        riskLevel: 'MEDIUM',
        reason: 'AI validation unavailable, using manual score'
      };
    }
  }

  /**
   * Asigna un pedido al mejor conductor disponible
   * Incluye validación 360° y validación con Vertex AI
   */
  async assignOrderToDriver(
    orderId: string,
    driverId: string,
    orderData: any
  ): Promise<{
    success: boolean;
    message: string;
    assignmentDetails?: any;
  }> {
    try {
      // 1. Validación 360° (IMSS, documentos, deudas, etc.)
      const validation = await ValidationService.validateDriverForOrderAssignment(driverId);
      
      if (!validation.canReceiveOrders) {
        return {
          success: false,
          message: validation.message || 'Conductor no elegible'
        };
      }

      // 2. Verificar límite de pedidos activos
      const activeOrdersCount = await this.countActiveOrders(driverId);
      if (activeOrdersCount >= this.config.maxActiveOrdersPerDriver) {
        return {
          success: false,
          message: 'Conductor tiene el máximo de pedidos activos'
        };
      }

      // 3. Calcular score de asignación
      const driverDoc = await firestore().collection(COLLECTIONS.DRIVERS).doc(driverId).get();
      const driverData = driverDoc.data();

      const distanceToPickup = PricingService.calculateDriverToPickupDistance(
        driverData?.operational?.currentLocation?.latitude,
        driverData?.operational?.currentLocation?.longitude,
        orderData.pickup.location.latitude,
        orderData.pickup.location.longitude
      );

      const assignmentScore = PricingService.calculateAssignmentScore(
        distanceToPickup,
        activeOrdersCount,
        driverData?.stats?.rating || 4.5,
        this.config.maxActiveOrdersPerDriver
      );

      // 4. Estimar ETA
      const orderDistance = PricingService.calculateOrderDistance(
        orderData.pickup.location.latitude,
        orderData.pickup.location.longitude,
        orderData.delivery.location.latitude,
        orderData.delivery.location.longitude
      );

      const estimatedETA = PricingService.estimateDeliveryTime(
        distanceToPickup + orderDistance
      );

      // 5. Validación con Vertex AI
      const aiValidation = await this.validateAssignmentWithAI(
        orderId,
        driverId,
        estimatedETA,
        assignmentScore
      );

      if (!aiValidation.approved) {
        return {
          success: false,
          message: aiValidation.reason || 'Asignación rechazada por modelo de IA'
        };
      }

      // 6. Llamar Cloud Function oficial para validar y asignar
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.VALIDATE_ORDER_ASSIGNMENT)({
        orderId,
        driverId,
        action: 'ACCEPT',
        assignmentScore,
        aiValidation,
        estimatedETA,
        distanceToPickup
      });

      const resultData = result.data as any;

      if (resultData.approved) {
        return {
          success: true,
          message: 'Pedido asignado exitosamente',
          assignmentDetails: {
            assignmentScore,
            aiScore: aiValidation.aiScore,
            estimatedETA,
            distanceToPickup,
            orderDistance
          }
        };
      } else {
        return {
          success: false,
          message: resultData.reason || 'Asignación rechazada por el sistema'
        };
      }
    } catch (error: any) {
      console.error('Error assigning order:', error);
      return {
        success: false,
        message: error.message || 'Error al asignar pedido'
      };
    }
  }

  /**
   * Actualiza la configuración del algoritmo de asignación
   */
  updateConfig(config: Partial<AssignmentConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): AssignmentConfig {
    return { ...this.config };
  }
}

// Exportar instancia singleton
export default new OrderAssignmentService();
