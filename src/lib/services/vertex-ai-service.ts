'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Document validation types
export interface DocumentValidationResult {
  isValid: boolean;
  extractedData: {
    name?: string;
    rfc?: string;
    curp?: string;
    expirationDate?: string;
    [key: string]: any;
  };
  confidence: number;
  discrepancies: string[];
}

export interface FinancialAuditResult {
  systemCalculation: number;
  aiCalculation: number;
  isMatch: boolean;
  discrepancy?: number;
  recommendation: string;
}

/**
 * Phase 1: Document Validation with Vertex AI Vision
 * Implements "Módulo de Validación de Repartidores Cero Errores"
 */
export class VertexAIDocumentValidator {
  private visionModel: any;

  constructor() {
    if (typeof window === 'undefined') {
      // Server-side: Use Vertex AI
      this.visionModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });
    } else {
      // Client-side: Use Gemini API
      this.visionModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });
    }
  }

  /**
   * Validates driver documents using AI vision
   */
  async validateDriverDocument(
    documentImage: string, // Base64 encoded image
    documentType: 'INE' | 'LICENSE' | 'INSURANCE' | 'CIRCULATION',
    formData: any
  ): Promise<DocumentValidationResult> {
    try {
      const prompt = this.generateDocumentPrompt(documentType, formData);
      
      const imagePart = {
        inlineData: {
          data: documentImage.split(',')[1], // Remove data:image/jpeg;base64, prefix
          mimeType: 'image/jpeg',
        },
      };

      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = result.response.text();

      return this.parseDocumentValidationResponse(response, formData);
    } catch (error) {
      console.error('Error validating document:', error);
      return {
        isValid: false,
        extractedData: {},
        confidence: 0,
        discrepancies: ['Error processing document with AI'],
      };
    }
  }

  private generateDocumentPrompt(documentType: string, formData: any): string {
    const basePrompt = `
Analiza este documento ${documentType} mexicano y extrae la información clave.
Compara los datos extraídos con la información proporcionada por el usuario:

Datos del formulario:
- Nombre: ${formData.name || 'N/A'}
- RFC: ${formData.rfc || 'N/A'}
- CURP: ${formData.curp || 'N/A'}

Por favor:
1. Extrae TODOS los datos visibles del documento
2. Compara con los datos del formulario
3. Identifica discrepancias
4. Evalúa la autenticidad del documento (0-100)

Responde ÚNICAMENTE en formato JSON:
{
  "extractedData": {
    "name": "nombre extraído",
    "rfc": "rfc extraído",
    "curp": "curp extraído",
    "expirationDate": "fecha de vigencia YYYY-MM-DD",
    "additionalInfo": "otros datos relevantes"
  },
  "confidence": número_de_0_a_100,
  "discrepancies": ["lista de discrepancias encontradas"],
  "authenticity": número_de_0_a_100
}
`;

    return basePrompt;
  }

  private parseDocumentValidationResponse(
    response: string,
    formData: any
  ): DocumentValidationResult {
    try {
      // Clean the response - sometimes AI adds extra text
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      const jsonStr = response.slice(jsonStart, jsonEnd + 1);
      
      const parsed = JSON.parse(jsonStr);
      
      return {
        isValid: parsed.confidence > 80 && parsed.authenticity > 70,
        extractedData: parsed.extractedData || {},
        confidence: parsed.confidence || 0,
        discrepancies: parsed.discrepancies || [],
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        isValid: false,
        extractedData: {},
        confidence: 0,
        discrepancies: ['Error parsing AI response'],
      };
    }
  }
}

/**
 * Phase 1: Financial Transaction Auditor with Gemini
 * Implements "Módulo de Auditoría Financiera Doble Contador"
 */
export class VertexAIFinancialAuditor {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });
  }

  /**
   * Audits financial transaction using AI double-checking
   */
  async auditTransaction(
    orderData: any,
    systemCalculation: number,
    businessRules: string
  ): Promise<FinancialAuditResult> {
    try {
      const prompt = `
Actúas como un auditor financiero experto. Analiza esta transacción y recalcula según las reglas de negocio:

DATOS DEL PEDIDO:
${JSON.stringify(orderData, null, 2)}

REGLAS DE NEGOCIO:
${businessRules}

CÁLCULO DEL SISTEMA: $${systemCalculation}

Por favor:
1. Recalcula la transacción paso a paso
2. Compara con el cálculo del sistema
3. Identifica cualquier discrepancia
4. Proporciona recomendación

Responde ÚNICAMENTE en formato JSON:
{
  "aiCalculation": número_calculado,
  "stepByStep": ["paso 1", "paso 2", "paso 3"],
  "isMatch": boolean,
  "discrepancy": diferencia_si_existe,
  "recommendation": "recomendación detallada"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return this.parseFinancialAuditResponse(response, systemCalculation);
    } catch (error) {
      console.error('Error auditing transaction:', error);
      return {
        systemCalculation,
        aiCalculation: systemCalculation,
        isMatch: false,
        recommendation: 'Error processing transaction with AI',
      };
    }
  }

  private parseFinancialAuditResponse(
    response: string,
    systemCalculation: number
  ): FinancialAuditResult {
    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      const jsonStr = response.slice(jsonStart, jsonEnd + 1);
      
      const parsed = JSON.parse(jsonStr);
      
      return {
        systemCalculation,
        aiCalculation: parsed.aiCalculation || systemCalculation,
        isMatch: parsed.isMatch || false,
        discrepancy: parsed.discrepancy || 0,
        recommendation: parsed.recommendation || 'No recommendation provided',
      };
    } catch (error) {
      console.error('Error parsing financial audit response:', error);
      return {
        systemCalculation,
        aiCalculation: systemCalculation,
        isMatch: false,
        recommendation: 'Error parsing AI audit response',
      };
    }
  }
}

/**
 * Phase 1: Intelligent Chat Support System
 * Implements "Módulo de Soporte Conversacional Inteligente"
 */
export class VertexAIChatSupport {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });
  }

  /**
   * Generate context-aware responses for different portals
   */
  async generateResponse(
    message: string,
    portal: 'driver' | 'business' | 'admin',
    userContext: any,
    systemData?: any
  ): Promise<string> {
    try {
      const prompt = this.generateChatPrompt(message, portal, userContext, systemData);
      
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating chat response:', error);
      return 'Lo siento, no puedo procesar tu consulta en este momento. Por favor contacta al soporte técnico.';
    }
  }

  private generateChatPrompt(
    message: string,
    portal: string,
    userContext: any,
    systemData?: any
  ): string {
    const portalContext = {
      driver: 'Eres el asistente de repartidores de BeFast. Ayudas con consultas sobre billetera, pedidos, documentos y pagos.',
      business: 'Eres el socio de negocios de BeFast. Ayudas con pedidos, créditos, facturación y métricas de delivery.',
      admin: 'Eres el orquestador administrativo de BeFast. Tienes acceso global y ayudas con análisis, reportes y gestión.'
    };

    return `
${portalContext[portal as keyof typeof portalContext]}

CONTEXTO DEL USUARIO:
${JSON.stringify(userContext, null, 2)}

${systemData ? `DATOS DEL SISTEMA:\n${JSON.stringify(systemData, null, 2)}\n` : ''}

MENSAJE DEL USUARIO: "${message}"

Proporciona una respuesta útil, precisa y en español mexicano. Si necesitas datos específicos que no tienes, indícalo claramente.
`;
  }
}

/**
 * Phase 1: Route Data Collection for Future Independence
 * Implements "Módulo de Recolección de Datos para App Nativa"
 */
export class VertexAIRouteAnalyzer {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });
  }

  /**
   * Analyze route data and predict delivery times
   */
  async analyzeRoute(
    routeData: any[],
    weatherData?: any,
    trafficData?: any
  ): Promise<{
    predictedTime: number;
    confidence: number;
    recommendations: string[];
  }> {
    try {
      const prompt = `
Analiza estos datos de ruta para predecir tiempo de entrega:

DATOS DE RUTA:
${JSON.stringify(routeData, null, 2)}

${weatherData ? `CLIMA: ${JSON.stringify(weatherData)}` : ''}
${trafficData ? `TRÁFICO: ${JSON.stringify(trafficData)}` : ''}

Calcula:
1. Tiempo estimado de entrega (minutos)
2. Nivel de confianza (0-100)
3. Recomendaciones para optimizar

Responde en JSON:
{
  "predictedTime": minutos,
  "confidence": porcentaje,
  "recommendations": ["recomendación 1", "recomendación 2"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return this.parseRouteAnalysis(response);
    } catch (error) {
      console.error('Error analyzing route:', error);
      return {
        predictedTime: 30,
        confidence: 0,
        recommendations: ['Error analyzing route data'],
      };
    }
  }

  private parseRouteAnalysis(response: string): any {
    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      const jsonStr = response.slice(jsonStart, jsonEnd + 1);
      
      return JSON.parse(jsonStr);
    } catch (error) {
      return {
        predictedTime: 30,
        confidence: 0,
        recommendations: ['Error parsing route analysis'],
      };
    }
  }
}

/**
 * Phase 2: Document Compliance & Proactive Business Assistance
 */
export class VertexAIComplianceManager {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });
  }

  /**
   * Check document expiration and notify users
   */
  async checkDocumentCompliance(
    driverData: any
  ): Promise<{
    expiringDocs: Array<{
      type: string;
      daysUntilExpiration: number;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    }>;
    recommendations: string[];
  }> {
    try {
      const currentDate = new Date();
      const expiringDocs: any[] = [];
      const recommendations: string[] = [];

      // Check each document's expiration
      if (driverData.documents) {
        Object.entries(driverData.documents).forEach(([docType, docData]: [string, any]) => {
          if (docData?.expirationDate) {
            const expDate = new Date(docData.expirationDate);
            const diffTime = expDate.getTime() - currentDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 30 && diffDays > 0) {
              let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
              
              if (diffDays <= 3) priority = 'CRITICAL';
              else if (diffDays <= 7) priority = 'HIGH';
              else if (diffDays <= 15) priority = 'MEDIUM';

              expiringDocs.push({
                type: docType,
                daysUntilExpiration: diffDays,
                priority
              });

              if (priority === 'CRITICAL') {
                recommendations.push(`URGENTE: Renovar ${docType} inmediatamente - vence en ${diffDays} días`);
              } else if (priority === 'HIGH') {
                recommendations.push(`Renovar ${docType} esta semana - vence en ${diffDays} días`);
              }
            } else if (diffDays <= 0) {
              expiringDocs.push({
                type: docType,
                daysUntilExpiration: diffDays,
                priority: 'CRITICAL'
              });
              recommendations.push(`DOCUMENTO VENCIDO: ${docType} venció hace ${Math.abs(diffDays)} días`);
            }
          }
        });
      }

      return { expiringDocs, recommendations };
    } catch (error) {
      console.error('Error checking document compliance:', error);
      return { expiringDocs: [], recommendations: ['Error verificando documentos'] };
    }
  }

  /**
   * Predict business credit exhaustion
   */
  async predictCreditExhaustion(
    businessData: any,
    orderHistory: any[]
  ): Promise<{
    daysRemaining: number;
    recommendedAction: string;
    recommendedPackage: string;
    confidence: number;
  }> {
    try {
      const currentCredits = businessData.credits || 0;
      const last30DaysOrders = orderHistory.filter(order => {
        const orderDate = new Date(order.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return orderDate >= thirtyDaysAgo;
      });

      const avgOrdersPerDay = last30DaysOrders.length / 30;
      const daysRemaining = Math.floor(currentCredits / Math.max(avgOrdersPerDay, 1));

      let recommendedPackage = 'Básico (50 créditos)';
      let recommendedAction = 'Continuar con el patrón actual';

      if (avgOrdersPerDay > 8) {
        recommendedPackage = 'Corporativo (250 créditos)';
        recommendedAction = 'Considerar upgrade a plan corporativo para mayor ahorro';
      } else if (avgOrdersPerDay > 3) {
        recommendedPackage = 'Empresarial (100 créditos)';
        recommendedAction = 'Plan empresarial ofrece mejor valor para tu volumen';
      }

      if (daysRemaining <= 3) {
        recommendedAction = `URGENTE: Comprar créditos inmediatamente - solo quedan ${daysRemaining} días`;
      } else if (daysRemaining <= 7) {
        recommendedAction = `Comprar créditos esta semana - quedan ${daysRemaining} días`;
      }

      const confidence = last30DaysOrders.length >= 10 ? 90 : Math.min(last30DaysOrders.length * 9, 90);

      return {
        daysRemaining,
        recommendedAction,
        recommendedPackage,
        confidence
      };
    } catch (error) {
      console.error('Error predicting credit exhaustion:', error);
      return {
        daysRemaining: -1,
        recommendedAction: 'Error en predicción - revisar manualmente',
        recommendedPackage: 'Básico',
        confidence: 0
      };
    }
  }
}

/**
 * Phase 2: Biometric Document Verification
 */
export class VertexAIBiometricValidator {
  private visionModel: any;

  constructor() {
    if (typeof window === 'undefined') {
      this.visionModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });
    } else {
      this.visionModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });
    }
  }

  /**
   * Compare selfie with ID photo using AI
   */
  async compareBiometricPhotos(
    selfieImage: string,
    idPhotoImage: string
  ): Promise<{
    isMatch: boolean;
    confidence: number;
    analysis: string;
    recommendations: string[];
  }> {
    try {
      const prompt = `
Analiza estas dos imágenes y determina si muestran a la misma persona:

Imagen 1: Selfie del usuario
Imagen 2: Foto del documento de identidad oficial

Por favor:
1. Compara características faciales (ojos, nariz, forma del rostro, etc.)
2. Ten en cuenta diferencias de iluminación, ángulo y calidad de imagen
3. Evalúa la probabilidad de que sean la misma persona (0-100)
4. Identifica cualquier inconsistencia notable

Responde ÚNICAMENTE en formato JSON:
{
  "isMatch": boolean,
  "confidence": número_0_a_100,
  "analysis": "descripción_del_análisis",
  "recommendations": ["recomendaciones_si_es_necesario"]
}
`;

      const selfieImagePart = {
        inlineData: {
          data: selfieImage.split(',')[1],
          mimeType: 'image/jpeg',
        },
      };

      const idImagePart = {
        inlineData: {
          data: idPhotoImage.split(',')[1],
          mimeType: 'image/jpeg',
        },
      };

      const result = await this.visionModel.generateContent([prompt, selfieImagePart, idImagePart]);
      const response = result.response.text();

      return this.parseBiometricResponse(response);
    } catch (error) {
      console.error('Error in biometric comparison:', error);
      return {
        isMatch: false,
        confidence: 0,
        analysis: 'Error procesando comparación biométrica',
        recommendations: ['Intentar nuevamente con mejores imágenes']
      };
    }
  }

  private parseBiometricResponse(response: string): any {
    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      const jsonStr = response.slice(jsonStart, jsonEnd + 1);
      
      const parsed = JSON.parse(jsonStr);
      
      return {
        isMatch: parsed.isMatch || false,
        confidence: parsed.confidence || 0,
        analysis: parsed.analysis || 'Análisis no disponible',
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      return {
        isMatch: false,
        confidence: 0,
        analysis: 'Error parseando respuesta de IA',
        recommendations: ['Contactar soporte técnico']
      };
    }
  }
}

/**
 * Phase 3: Advanced Fraud Detection
 */
export class VertexAIFraudDetector {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });
  }

  /**
   * Analyze driver behavior for fraud patterns
   */
  async detectFraud(
    driverData: any,
    recentOrders: any[],
    routeData?: any[]
  ): Promise<{
    fraudRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number;
    flags: string[];
    detailedAnalysis: string;
    recommendedActions: string[];
  }> {
    try {
      const prompt = `
Analiza los datos de este repartidor para detectar posibles fraudes o comportamientos anómalos:

DATOS DEL REPARTIDOR:
${JSON.stringify(driverData, null, 2)}

ÚLTIMAS ÓRDENES:
${JSON.stringify(recentOrders, null, 2)}

${routeData ? `DATOS DE RUTAS: ${JSON.stringify(routeData, null, 2)}` : ''}

Analiza:
1. Patrones de tiempo inusuales
2. Rutas sospechosas o ineficientes
3. Multi-apping (trabajar para múltiples plataformas simultáneamente)
4. Cancelaciones excesivas
5. Tiempos de entrega anómalos
6. Comportamientos que sugieran fraude

Responde ÚNICAMENTE en formato JSON:
{
  "riskScore": número_0_a_100,
  "flags": ["lista_de_banderas_rojas"],
  "detailedAnalysis": "análisis_detallado",
  "recommendedActions": ["acciones_recomendadas"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return this.parseFraudResponse(response);
    } catch (error) {
      console.error('Error detecting fraud:', error);
      return {
        fraudRisk: 'LOW',
        riskScore: 0,
        flags: ['Error en análisis de fraude'],
        detailedAnalysis: 'No se pudo completar el análisis',
        recommendedActions: ['Revisar manualmente']
      };
    }
  }

  private parseFraudResponse(response: string): any {
    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      const jsonStr = response.slice(jsonStart, jsonEnd + 1);
      
      const parsed = JSON.parse(jsonStr);
      
      let fraudRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      const riskScore = parsed.riskScore || 0;

      if (riskScore >= 80) fraudRisk = 'CRITICAL';
      else if (riskScore >= 60) fraudRisk = 'HIGH';
      else if (riskScore >= 35) fraudRisk = 'MEDIUM';

      return {
        fraudRisk,
        riskScore,
        flags: parsed.flags || [],
        detailedAnalysis: parsed.detailedAnalysis || '',
        recommendedActions: parsed.recommendedActions || []
      };
    } catch (error) {
      return {
        fraudRisk: 'LOW' as const,
        riskScore: 0,
        flags: ['Error parseando análisis'],
        detailedAnalysis: 'Error en el análisis',
        recommendedActions: ['Contactar soporte']
      };
    }
  }
}

/**
 * Phase 3: Intelligent Assignment & Fleet Optimization
 */
export class VertexAIFleetOptimizer {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });
  }

  /**
   * Analyze assignment efficiency
   */
  async analyzeAssignment(
    orderData: any,
    assignedDriverData: any,
    availableDrivers: any[],
    historicalData: any[]
  ): Promise<{
    efficiency: number;
    recommendation: 'APPROVE' | 'SUGGEST_ALTERNATIVE' | 'REJECT';
    alternativeDriver?: any;
    reasoning: string;
    estimatedDeliveryTime: number;
  }> {
    try {
      const prompt = `
Analiza esta asignación de pedido y determina su eficiencia:

PEDIDO:
${JSON.stringify(orderData, null, 2)}

REPARTIDOR ASIGNADO:
${JSON.stringify(assignedDriverData, null, 2)}

REPARTIDORES DISPONIBLES:
${JSON.stringify(availableDrivers, null, 2)}

DATOS HISTÓRICOS:
${JSON.stringify(historicalData.slice(-20), null, 2)}

Evalúa:
1. Proximidad geográfica del repartidor al punto de recogida
2. Historial de rendimiento del repartidor en esa zona
3. Carga actual de trabajo del repartidor
4. Eficiencia comparativa con otros repartidores disponibles
5. Probabilidad de entrega a tiempo

Responde ÚNICAMENTE en formato JSON:
{
  "efficiency": número_0_a_100,
  "recommendation": "APPROVE" | "SUGGEST_ALTERNATIVE" | "REJECT",
  "alternativeDriverId": "id_si_existe_mejor_opcion",
  "reasoning": "explicación_detallada",
  "estimatedDeliveryTime": minutos_estimados
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return this.parseAssignmentResponse(response, availableDrivers);
    } catch (error) {
      console.error('Error analyzing assignment:', error);
      return {
        efficiency: 50,
        recommendation: 'APPROVE',
        reasoning: 'Error en análisis - proceder con asignación actual',
        estimatedDeliveryTime: 30
      };
    }
  }

  private parseAssignmentResponse(response: string, availableDrivers: any[]): any {
    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      const jsonStr = response.slice(jsonStart, jsonEnd + 1);
      
      const parsed = JSON.parse(jsonStr);
      
      let alternativeDriver = undefined;
      if (parsed.alternativeDriverId) {
        alternativeDriver = availableDrivers.find(d => d.id === parsed.alternativeDriverId);
      }

      return {
        efficiency: parsed.efficiency || 50,
        recommendation: parsed.recommendation || 'APPROVE',
        alternativeDriver,
        reasoning: parsed.reasoning || 'Análisis completado',
        estimatedDeliveryTime: parsed.estimatedDeliveryTime || 30
      };
    } catch (error) {
      return {
        efficiency: 50,
        recommendation: 'APPROVE' as const,
        reasoning: 'Error parseando análisis',
        estimatedDeliveryTime: 30
      };
    }
  }
}

/**
 * Phase 3: Advanced Marketing & Growth Intelligence
 */
export class VertexAIMarketingEngine {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });
  }

  /**
   * Generate personalized driver incentives
   */
  async generateDriverIncentive(
    driverProfile: any,
    performanceData: any
  ): Promise<{
    incentiveType: 'BONUS' | 'MISSION' | 'CHALLENGE' | 'REWARD';
    description: string;
    requirements: string[];
    reward: number;
    validUntil: string;
    personalizationReason: string;
  }> {
    try {
      const prompt = `
Genera un incentivo personalizado para este repartidor basado en su perfil y rendimiento:

PERFIL DEL REPARTIDOR:
${JSON.stringify(driverProfile, null, 2)}

DATOS DE RENDIMIENTO:
${JSON.stringify(performanceData, null, 2)}

Crea un incentivo que:
1. Sea atractivo y alcanzable
2. Mejore sus áreas débiles
3. Aproveche sus fortalezas
4. Esté alineado con necesidades del negocio

Responde ÚNICAMENTE en formato JSON:
{
  "incentiveType": "BONUS" | "MISSION" | "CHALLENGE" | "REWARD",
  "description": "descripción_atractiva_del_incentivo",
  "requirements": ["requisito_1", "requisito_2"],
  "reward": cantidad_en_pesos,
  "validUntil": "fecha_ISO_string",
  "personalizationReason": "por_qué_este_incentivo_es_perfecto_para_él"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return this.parseIncentiveResponse(response);
    } catch (error) {
      console.error('Error generating incentive:', error);
      return {
        incentiveType: 'BONUS',
        description: 'Bono por buen desempeño',
        requirements: ['Completar 5 entregas'],
        reward: 50,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        personalizationReason: 'Incentivo estándar por rendimiento'
      };
    }
  }

  /**
   * Generate business marketing campaign
   */
  async generateMarketingCampaign(
    customerProfiles: any[],
    campaignObjective: string
  ): Promise<{
    campaignName: string;
    targetSegments: string[];
    message: string;
    incentiveOffer: string;
    expectedResponse: number;
    estimatedROI: number;
    recommendations: string[];
  }> {
    try {
      const prompt = `
Genera una campaña de marketing personalizada:

PERFILES DE CLIENTES:
${JSON.stringify(customerProfiles.slice(0, 50), null, 2)}

OBJETIVO DE CAMPAÑA: ${campaignObjective}

Diseña una campaña que:
1. Segmente clientes apropiadamente
2. Ofrezca incentivos relevantes
3. Use mensajes personalizados
4. Maximice ROI

Responde ÚNICAMENTE en formato JSON:
{
  "campaignName": "nombre_de_campaña",
  "targetSegments": ["segmento_1", "segmento_2"],
  "message": "mensaje_personalizado",
  "incentiveOffer": "oferta_específica",
  "expectedResponse": porcentaje_de_respuesta,
  "estimatedROI": multiplicador_de_retorno,
  "recommendations": ["recomendación_1", "recomendación_2"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return this.parseMarketingResponse(response);
    } catch (error) {
      console.error('Error generating marketing campaign:', error);
      return {
        campaignName: 'Campaña de Retención',
        targetSegments: ['Clientes inactivos'],
        message: 'Te extrañamos - vuelve con nosotros',
        incentiveOffer: '20% de descuento en tu próximo pedido',
        expectedResponse: 15,
        estimatedROI: 2.5,
        recommendations: ['Segmentar por tiempo de inactividad']
      };
    }
  }

  private parseIncentiveResponse(response: string): any {
    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      const jsonStr = response.slice(jsonStart, jsonEnd + 1);
      
      const parsed = JSON.parse(jsonStr);
      
      return {
        incentiveType: parsed.incentiveType || 'BONUS',
        description: parsed.description || 'Incentivo personalizado',
        requirements: parsed.requirements || [],
        reward: parsed.reward || 50,
        validUntil: parsed.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        personalizationReason: parsed.personalizationReason || 'Incentivo basado en rendimiento'
      };
    } catch (error) {
      return {
        incentiveType: 'BONUS' as const,
        description: 'Error generando incentivo',
        requirements: [],
        reward: 0,
        validUntil: new Date().toISOString(),
        personalizationReason: 'Error en personalización'
      };
    }
  }

  private parseMarketingResponse(response: string): any {
    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      const jsonStr = response.slice(jsonStart, jsonEnd + 1);
      
      return JSON.parse(jsonStr);
    } catch (error) {
      return {
        campaignName: 'Error en campaña',
        targetSegments: [],
        message: 'Error generando mensaje',
        incentiveOffer: 'Sin oferta disponible',
        expectedResponse: 0,
        estimatedROI: 0,
        recommendations: ['Revisar configuración']
      };
    }
  }
}

// Export singleton instances for easy use throughout the app
export const documentValidator = new VertexAIDocumentValidator();
export const financialAuditor = new VertexAIFinancialAuditor();
export const chatSupport = new VertexAIChatSupport();
export const routeAnalyzer = new VertexAIRouteAnalyzer();

// Phase 2 & 3 Services
export const complianceManager = new VertexAIComplianceManager();
export const biometricValidator = new VertexAIBiometricValidator();
export const fraudDetector = new VertexAIFraudDetector();
export const fleetOptimizer = new VertexAIFleetOptimizer();
export const marketingEngine = new VertexAIMarketingEngine();
