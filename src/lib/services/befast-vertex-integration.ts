import { httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { functions } from '@/lib/firebase';
import {
  documentValidator,
  financialAuditor,
  chatSupport,
  complianceManager,
  biometricValidator,
  fraudDetector,
  fleetOptimizer,
  marketingEngine,
  type DocumentValidationResult,
  type FinancialAuditResult
} from './vertex-ai-service';

// Helper: sanitize payloads before sending to httpsCallable to prevent circular refs and non-serializable values
function sanitizeForCallable(input: any, seen: WeakSet<object> = new WeakSet()): any {
  if (input === null || input === undefined) return input;
  const t = typeof input;
  if (t === 'string' || t === 'number' || t === 'boolean') return input;
  if (input instanceof Date) return input.toISOString();
  if (Array.isArray(input)) return input.map(v => sanitizeForCallable(v, seen)).filter(v => v !== undefined);
  if (t === 'object') {
    if (seen.has(input)) return undefined; // drop circular
    seen.add(input);
    const proto = Object.getPrototypeOf(input);
    // Allow plain objects and objects without prototype
    if (proto && proto !== Object.prototype) {
      if (typeof (input as any).toJSON === 'function') {
        try {
          return sanitizeForCallable((input as any).toJSON(), seen);
        } catch {
          return undefined;
        }
      }
      return undefined;
    }
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) {
      const sv = sanitizeForCallable(v as any, seen);
      if (sv !== undefined && typeof sv !== 'function') out[k] = sv;
    }
    return out;
  }
  return undefined; // drop functions, symbols, bigint, etc.
}

async function ensureFreshAuthToken() {
  const auth = getAuth();
  const currentUser = auth?.currentUser;
  if (!currentUser) return;
  try {
    await currentUser.getIdToken(true);
  } catch (error) {
    console.warn('No se pudo refrescar el token de Firebase para Vertex chat:', error);
  }
}

/**
 * Client-side service to integrate Vertex AI with BeFast operations
 */
export class BeFastVertexIntegration {
  
  /**
   * Phase 1: Enhanced Driver Validation with AI
   * Integrates with the existing driver onboarding process
   */
  async validateDriverDocuments(
    driverId: string,
    documents: {
      ine: string;
      license: string;
      insurance: string;
      circulation: string;
    },
    formData: any
  ): Promise<{
    overallValid: boolean;
    documentResults: Record<string, DocumentValidationResult>;
    nextSteps: string[];
  }> {
    try {
      // Validate each document with AI
      const results = await Promise.all([
        documentValidator.validateDriverDocument(documents.ine, 'INE', formData),
        documentValidator.validateDriverDocument(documents.license, 'LICENSE', formData),
        documentValidator.validateDriverDocument(documents.insurance, 'INSURANCE', formData),
        documentValidator.validateDriverDocument(documents.circulation, 'CIRCULATION', formData),
      ]);

      const documentResults = {
        ine: results[0],
        license: results[1],
        insurance: results[2],
        circulation: results[3],
      };

      // Determine overall validity
      const overallValid = Object.values(documentResults).every(result => result.isValid);
      
      // Generate next steps based on results
      const nextSteps = this.generateValidationNextSteps(documentResults);

      // Store validation results in Firestore via Cloud Function
      const storeValidation = httpsCallable(functions, 'storeDriverValidation');
      await storeValidation({
        driverId,
        validationResults: documentResults,
        timestamp: new Date().toISOString(),
        overallValid,
      });

      return {
        overallValid,
        documentResults,
        nextSteps,
      };
    } catch (error) {
      console.error('Error validating driver documents:', error);
      throw error;
    }
  }

  private generateValidationNextSteps(results: Record<string, DocumentValidationResult>): string[] {
    const steps: string[] = [];
    
    Object.entries(results).forEach(([docType, result]) => {
      if (!result.isValid) {
        if (result.discrepancies.length > 0) {
          steps.push(`Revisar ${docType.toUpperCase()}: ${result.discrepancies.join(', ')}`);
        }
        if (result.confidence < 50) {
          steps.push(`Solicitar nueva imagen de ${docType.toUpperCase()} (calidad insuficiente)`);
        }
      }
    });

    if (steps.length === 0) {
      steps.push('Todos los documentos validados correctamente');
      steps.push('Proceder con aprobación administrativa');
    }

    return steps;
  }

  /**
   * Phase 1: Financial Transaction Auditing
   * Integrates with existing order completion process
   */
  async auditOrderTransaction(
    orderId: string,
    orderData: any,
    systemCalculation: number
  ): Promise<{
    auditPassed: boolean;
    auditResult: FinancialAuditResult;
    shouldProceed: boolean;
    alertAdmin: boolean;
  }> {
    try {
      // Get business rules from environment or config
      const businessRules = this.getFinancialBusinessRules();

      // Perform AI audit
      const auditResult = await financialAuditor.auditTransaction(
        orderData,
        systemCalculation,
        businessRules
      );

      const discrepancy = Math.abs(auditResult.aiCalculation - auditResult.systemCalculation);
      const auditPassed = auditResult.isMatch && discrepancy < 0.01; // Allow 1 cent tolerance
      const alertAdmin = discrepancy > 5; // Alert for discrepancies over $5

      // Store audit result
      const storeAudit = httpsCallable(functions, 'storeFinancialAudit');
      await storeAudit({
        orderId,
        auditResult,
        auditPassed,
        timestamp: new Date().toISOString(),
        alertAdmin,
      });

      return {
        auditPassed,
        auditResult,
        shouldProceed: auditPassed,
        alertAdmin,
      };
    } catch (error) {
      console.error('Error auditing transaction:', error);
      // In case of audit error, allow transaction but alert admin
      return {
        auditPassed: false,
        auditResult: {
          systemCalculation,
          aiCalculation: systemCalculation,
          isMatch: false,
          recommendation: 'AI audit failed - manual review required',
        },
        shouldProceed: true, // Allow transaction to proceed
        alertAdmin: true, // But alert admin
      };
    }
  }

  private getFinancialBusinessRules(): string {
    return `
REGLAS FINANCIERAS BEFAST:

1. PEDIDOS CON TARJETA:
   - Ganancia del repartidor = Tarifa total - $15 pesos
   - Si hay propina, se suma completa a la ganancia
   - Se transfiere a walletBalance del repartidor

2. PEDIDOS EN EFECTIVO:
   - Repartidor ya tiene el dinero físicamente
   - Se registra deuda de $15 pesos en pendingDebts
   - NO se transfiere dinero a walletBalance
   - Si propina, repartidor la conserva

3. LÍMITES:
   - Deuda máxima para pedidos en efectivo: $300
   - Si deuda >= $300, bloquear para pedidos en efectivo
   
4. CÁLCULOS:
   - Tarifas base por zona y tipo de vehículo
   - Propinas opcionales del cliente
   - Comisión BeFast fija: $15 por pedido
`;
  }

  /**
   * Phase 1: Intelligent Chat Support
   * Updated to use unified handleChatMessage function with proper prompts
   */
  async getChatResponse(
    message: string,
    portal: 'driver' | 'business' | 'admin',
    userId: string,
    contextData?: any
  ): Promise<string> {
    try {
      await ensureFreshAuthToken();
      
      // Use unified handleChatMessage function with proper role mapping
      const handleChatMessage = httpsCallable(functions, 'handleChatMessage');
      const roleMap = { 
        admin: 'ADMIN', 
        business: 'BUSINESS', 
        driver: 'DRIVER' 
      } as const;
      
      const safeContext = sanitizeForCallable(contextData || {});
      const result = await handleChatMessage({ 
        userRole: roleMap[portal], 
        userId, 
        message, 
        context: safeContext 
      });
      
      const data = result.data as any;
      if (data?.response) return data.response;
      
      // Fallback response if no response received
      return 'Lo siento, no puedo procesar tu consulta en este momento. Por favor contacta al soporte técnico.';
      
    } catch (error) {
      console.error('Error getting chat response:', {
        portal,
        userId,
        message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        messageError: (error as Error)?.message,
      });
      
      try {
        // Final fallback to local Vertex AI
        return await chatSupport.generateResponse(message, portal, contextData ?? {});
      } catch (vertexError) {
        console.error('Vertex fallback also failed:', {
          portal,
          userId,
          message,
          messageError: (vertexError as Error)?.message,
        });
        return 'Lo siento, no puedo procesar tu consulta en este momento. Por favor contacta al soporte técnico.';
      }
    }
  }

  /**
   * Phase 1: Route Data Collection
   * Silently collect route data for future app development
   */
  async collectRouteData(
    orderId: string,
    routePoints: Array<{
      lat: number;
      lng: number;
      timestamp: number;
      speed?: number;
      accuracy?: number;
    }>
  ): Promise<void> {
    try {
      const storeRouteData = httpsCallable(functions, 'storeRouteData');
      await storeRouteData({
        orderId,
        routePoints,
        collectedAt: new Date().toISOString(),
      });
    } catch (error) {
      // Silently fail - don't interrupt main flow
      console.warn('Failed to collect route data:', error);
    }
  }

  /**
   * Phase 2: Proactive Business Assistance
   * Predict when business will run out of credits
   */
  async predictCreditExhaustion(
    businessId: string
  ): Promise<{
    daysRemaining: number;
    recommendedPackage: string;
    confidence: number;
  }> {
    try {
      const predictCredits = httpsCallable(functions, 'predictBusinessCredits');
      const result = await predictCredits({ businessId });
      return result.data as any;
    } catch (error) {
      console.error('Error predicting credit exhaustion:', error);
      return {
        daysRemaining: -1,
        recommendedPackage: 'Error calculating',
        confidence: 0,
      };
    }
  }

  /**
   * Phase 2: Document Compliance Management
   */
  async checkDriverCompliance(
    driverId: string
  ): Promise<{
    complianceStatus: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
    expiringDocs: any[];
    recommendations: string[];
    nextCheckDate: string;
  }> {
    try {
      const getDriverData = httpsCallable(functions, 'getDriverComplianceData');
      const result = await getDriverData({ driverId });
      const driverData = result.data;

      const complianceResult = await complianceManager.checkDocumentCompliance(driverData);
      
      let complianceStatus: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' = 'COMPLIANT';
      
      const criticalDocs = complianceResult.expiringDocs.filter(doc => doc.priority === 'CRITICAL');
      const warningDocs = complianceResult.expiringDocs.filter(doc => ['HIGH', 'MEDIUM'].includes(doc.priority));

      if (criticalDocs.length > 0) {
        complianceStatus = 'NON_COMPLIANT';
      } else if (warningDocs.length > 0) {
        complianceStatus = 'WARNING';
      }

      // Store compliance check
      const storeCompliance = httpsCallable(functions, 'storeComplianceCheck');
      await storeCompliance({
        driverId,
        complianceStatus,
        expiringDocs: complianceResult.expiringDocs,
        recommendations: complianceResult.recommendations,
        timestamp: new Date().toISOString()
      });

      // Calculate next check date (weekly for non-compliant, monthly for compliant)
      const nextCheck = new Date();
      nextCheck.setDate(nextCheck.getDate() + (complianceStatus === 'COMPLIANT' ? 30 : 7));

      return {
        complianceStatus,
        expiringDocs: complianceResult.expiringDocs,
        recommendations: complianceResult.recommendations,
        nextCheckDate: nextCheck.toISOString()
      };
    } catch (error) {
      console.error('Error checking driver compliance:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Proactive Business Credit Management
   */
  async checkBusinessCreditStatus(
    businessId: string
  ): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    daysRemaining: number;
    recommendedAction: string;
    recommendedPackage: string;
    shouldNotify: boolean;
  }> {
    try {
      const getBusinessData = httpsCallable(functions, 'getBusinessCreditData');
      const result = await getBusinessData({ businessId });
      const { businessData, orderHistory } = result.data as any;

      const prediction = await complianceManager.predictCreditExhaustion(businessData, orderHistory);
      
      let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      let shouldNotify = false;

      if (prediction.daysRemaining <= 3) {
        status = 'CRITICAL';
        shouldNotify = true;
      } else if (prediction.daysRemaining <= 7) {
        status = 'WARNING';
        shouldNotify = true;
      }

      // Store prediction and send notification if needed
      const storePrediction = httpsCallable(functions, 'storeCreditPrediction');
      await storePrediction({
        businessId,
        prediction,
        status,
        shouldNotify,
        timestamp: new Date().toISOString()
      });

      return {
        status,
        daysRemaining: prediction.daysRemaining,
        recommendedAction: prediction.recommendedAction,
        recommendedPackage: prediction.recommendedPackage,
        shouldNotify
      };
    } catch (error) {
      console.error('Error checking business credit status:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Biometric Document Verification
   */
  async performBiometricVerification(
    driverId: string,
    selfieImage: string,
    idPhotoImage: string
  ): Promise<{
    verificationPassed: boolean;
    confidence: number;
    analysis: string;
    requiresManualReview: boolean;
  }> {
    try {
      const biometricResult = await biometricValidator.compareBiometricPhotos(
        selfieImage,
        idPhotoImage
      );

      const verificationPassed = biometricResult.isMatch && biometricResult.confidence >= 80;
      const requiresManualReview = !verificationPassed || biometricResult.confidence < 90;

      // Store biometric verification result
      const storeBiometric = httpsCallable(functions, 'storeBiometricVerification');
      await storeBiometric({
        driverId,
        biometricResult,
        verificationPassed,
        requiresManualReview,
        timestamp: new Date().toISOString()
      });

      return {
        verificationPassed,
        confidence: biometricResult.confidence,
        analysis: biometricResult.analysis,
        requiresManualReview
      };
    } catch (error) {
      console.error('Error performing biometric verification:', error);
      throw error;
    }
  }

  /**
   * Phase 3: Advanced Fraud Detection
   */
  async performFraudAnalysis(
    driverId: string,
    analysisType: 'ROUTINE' | 'TRIGGERED' | 'DEEP_ANALYSIS'
  ): Promise<{
    fraudRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number;
    flags: string[];
    recommendedActions: string[];
    requiresImmedateAction: boolean;
  }> {
    try {
      const getFraudData = httpsCallable(functions, 'getDriverFraudData');
      const result = await getFraudData({ driverId, analysisType });
      const { driverData, recentOrders, routeData } = result.data as any;

      const fraudAnalysis = await fraudDetector.detectFraud(
        driverData,
        recentOrders,
        routeData
      );

      const requiresImmedateAction = fraudAnalysis.fraudRisk === 'CRITICAL';

      // Store fraud analysis
      const storeFraud = httpsCallable(functions, 'storeFraudAnalysis');
      await storeFraud({
        driverId,
        analysisType,
        fraudAnalysis,
        requiresImmedateAction,
        timestamp: new Date().toISOString()
      });

      // Create alert if high risk
      if (fraudAnalysis.fraudRisk === 'CRITICAL' || fraudAnalysis.fraudRisk === 'HIGH') {
        const createAlert = httpsCallable(functions, 'createFraudAlert');
        await createAlert({
          driverId,
          fraudRisk: fraudAnalysis.fraudRisk,
          riskScore: fraudAnalysis.riskScore,
          flags: fraudAnalysis.flags,
          priority: fraudAnalysis.fraudRisk === 'CRITICAL' ? 'URGENT' : 'HIGH'
        });
      }

      return {
        fraudRisk: fraudAnalysis.fraudRisk,
        riskScore: fraudAnalysis.riskScore,
        flags: fraudAnalysis.flags,
        recommendedActions: fraudAnalysis.recommendedActions,
        requiresImmedateAction
      };
    } catch (error) {
      console.error('Error performing fraud analysis:', error);
      throw error;
    }
  }

  /**
   * Phase 3: Intelligent Assignment Optimization
   */
  async optimizeOrderAssignment(
    orderId: string,
    currentAssignment: any
  ): Promise<{
    shouldApprove: boolean;
    efficiency: number;
    alternativeDriver?: any;
    reasoning: string;
    estimatedDeliveryTime: number;
  }> {
    try {
      const getAssignmentData = httpsCallable(functions, 'getOrderAssignmentData');
      const result = await getAssignmentData({ orderId, currentAssignment });
      const { orderData, assignedDriverData, availableDrivers, historicalData } = result.data as any;

      const optimization = await fleetOptimizer.analyzeAssignment(
        orderData,
        assignedDriverData,
        availableDrivers,
        historicalData
      );

      const shouldApprove = optimization.recommendation === 'APPROVE' || 
                           (optimization.recommendation === 'SUGGEST_ALTERNATIVE' && optimization.efficiency >= 70);

      // Store optimization analysis
      const storeOptimization = httpsCallable(functions, 'storeAssignmentOptimization');
      await storeOptimization({
        orderId,
        currentAssignment,
        optimization,
        shouldApprove,
        timestamp: new Date().toISOString()
      });

      return {
        shouldApprove,
        efficiency: optimization.efficiency,
        alternativeDriver: optimization.alternativeDriver,
        reasoning: optimization.reasoning,
        estimatedDeliveryTime: optimization.estimatedDeliveryTime
      };
    } catch (error) {
      console.error('Error optimizing assignment:', error);
      throw error;
    }
  }

  /**
   * Phase 3: Personalized Driver Incentives
   */
  async generatePersonalizedIncentive(
    driverId: string
  ): Promise<{
    incentive: any;
    shouldActivate: boolean;
    estimatedImpact: string;
  }> {
    try {
      const getDriverProfile = httpsCallable(functions, 'getDriverProfile');
      const result = await getDriverProfile({ driverId });
      const { driverProfile, performanceData } = result.data as any;

      const incentive = await marketingEngine.generateDriverIncentive(
        driverProfile,
        performanceData
      );

      // Validate incentive budget and rules
      const validateIncentive = httpsCallable(functions, 'validateIncentive');
      const validation = await validateIncentive({ driverId, incentive });
      const shouldActivate = (validation.data as any).approved;

      if (shouldActivate) {
        // Activate incentive
        const activateIncentive = httpsCallable(functions, 'activateDriverIncentive');
        await activateIncentive({
          driverId,
          incentive,
          validUntil: incentive.validUntil
        });
      }

      return {
        incentive,
        shouldActivate,
        estimatedImpact: `Esperado: +${Math.round(incentive.reward * 0.1)} pedidos adicionales`
      };
    } catch (error) {
      console.error('Error generating personalized incentive:', error);
      throw error;
    }
  }

  /**
   * Phase 3: AI-Powered Marketing Campaigns
   */
  async createMarketingCampaign(
    campaignObjective: string,
    targetAudience?: string
  ): Promise<{
    campaign: any;
    estimatedReach: number;
    estimatedCost: number;
    approvalRequired: boolean;
  }> {
    try {
      const getCustomerData = httpsCallable(functions, 'getCustomerProfiles');
      const result = await getCustomerData({ targetAudience });
      const customerProfiles = result.data as any[];

      const campaign = await marketingEngine.generateMarketingCampaign(
        customerProfiles,
        campaignObjective
      );

      const estimatedReach = Math.floor(customerProfiles.length * (campaign.expectedResponse / 100));
      const estimatedCost = estimatedReach * 5; // Estimated $5 per customer reached
      const approvalRequired = estimatedCost > 1000 || campaign.incentiveOffer.includes('%');

      // Store campaign proposal
      const storeCampaign = httpsCallable(functions, 'storeMarketingCampaign');
      await storeCampaign({
        campaign,
        estimatedReach,
        estimatedCost,
        approvalRequired,
        status: 'PENDING_APPROVAL',
        timestamp: new Date().toISOString()
      });

      return {
        campaign,
        estimatedReach,
        estimatedCost,
        approvalRequired
      };
    } catch (error) {
      console.error('Error creating marketing campaign:', error);
      throw error;
    }
  }

  /**
   * Advanced Route Data Collection & Analysis
   */
  async analyzeRouteEfficiency(
    orderId: string,
    actualRoute: any[]
  ): Promise<{
    efficiency: number;
    optimizationSuggestions: string[];
    estimatedTimeSaved: number;
    learningInsights: string[];
  }> {
    try {
      const routeAnalyzer = new (await import('./vertex-ai-service')).VertexAIRouteAnalyzer();
      const routeAnalysis = await routeAnalyzer.analyzeRoute(
        actualRoute,
        undefined, // weather data - can be added later
        undefined  // traffic data - can be added later
      );

      // Store route analysis for machine learning
      const storeRouteAnalysis = httpsCallable(functions, 'storeRouteAnalysis');
      await storeRouteAnalysis({
        orderId,
        actualRoute,
        analysis: routeAnalysis,
        timestamp: new Date().toISOString()
      });

      // Calculate efficiency based on predicted vs actual time
      const efficiency = Math.min(100, Math.max(0, 
        100 - ((actualRoute.length - routeAnalysis.predictedTime) / routeAnalysis.predictedTime * 100)
      ));

      return {
        efficiency,
        optimizationSuggestions: routeAnalysis.recommendations,
        estimatedTimeSaved: Math.max(0, actualRoute.length - routeAnalysis.predictedTime),
        learningInsights: [
          `Ruta analizada: ${actualRoute.length} minutos`,
          `Predicción AI: ${routeAnalysis.predictedTime} minutos`,
          `Confianza: ${routeAnalysis.confidence}%`
        ]
      };
    } catch (error) {
      console.error('Error analyzing route efficiency:', error);
      return {
        efficiency: 0,
        optimizationSuggestions: ['Error en análisis de ruta'],
        estimatedTimeSaved: 0,
        learningInsights: ['Datos insuficientes para análisis']
      };
    }
  }
}

// Export singleton instance
export const vertexIntegration = new BeFastVertexIntegration();
