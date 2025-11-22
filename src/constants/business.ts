/**
 * @fileoverview Constantes de negocio centralizadas para el ecosistema BeFast.
 * ÚNICA FUENTE DE VERDAD para valores de negocio críticos.
 * 
 * Basado en documentación oficial:
 * - docs/BeFast (1).md
 * - docs/FLUJOS_Y_LOGICA_BEFAST.md
 */

/**
 * COMISIÓN DE SERVICIO POR PEDIDO
 * Esta es la comisión fija que BeFast cobra por cada pedido entregado.
 * Documentado en: [BeFast (1).md - "Modelo de Negocio", sección "Comisión por Pedido"](../docs/BeFast%20(1).md#comisión-por-pedido)
 * (Asegúrate de actualizar este valor si la documentación oficial cambia)
 */
export const SERVICE_FEE = 15; // MXN por pedido

/**
 * LÍMITE DE DEUDA POR DEFECTO PARA REPARTIDORES
 * Límite máximo de adeudos que un repartidor puede acumular
 * antes de ser bloqueado para aceptar nuevos pedidos en efectivo.
 * Documentado en: FLUJOS_Y_LOGICA_BEFAST.md - "Validación Financiera"
 */
export const DEFAULT_DEBT_LIMIT = 300; // MXN

/**
 * SALARIO MÍNIMO MENSUAL EN MÉXICO (2025)
 * Base para cálculo de clasificación laboral de repartidores.
 * Fuente: Normativa oficial mexicana 2025
 */
export const MINIMUM_SALARY_2025 = 8364; // MXN mensuales

/**
 * PAQUETES DE CRÉDITOS PARA NEGOCIOS
 * Estructura de precios para la compra de créditos.
 * Documentado en: BeFast (1).md - "Compra de Créditos"
 */
export const CREDIT_PACKAGES = {
  BASICO: {
    name: 'Básico',
    credits: 50,
    price: 750,
    bonus: 15,
    totalCredits: 65, // 50 + 15 bonus
    pricePerCredit: 15,
  },
  EMPRESARIAL: {
    name: 'Empresarial',
    credits: 100,
    price: 1500,
    bonus: 25,
    totalCredits: 125, // 100 + 25 bonus
    pricePerCredit: 15,
  },
  CORPORATIVO: {
    name: 'Corporativo',
    credits: 250,
    price: 3750,
    bonus: 35,
    totalCredits: 285, // 250 + 35 bonus
    pricePerCredit: 15,
  },
} as const;

/**
 * FACTORES DE EXCLUSIÓN POR TIPO DE VEHÍCULO
 * Para cálculo de clasificación laboral según normativa mexicana.
 * Documentado en: Matriz.md - "Clasificación Laboral"
 */
export const VEHICLE_EXCLUSION_FACTORS = {
  AUTO: 0.36,      // 36% para vehículos de 4 ruedas
  MOTO: 0.30,      // 30% para vehículos de 2 ruedas
  BICICLETA: 0.12, // 12% para bicicleta
  SCOOTER: 0.30,   // 30% para scooter (igual que moto)
  PIE: 0.12,       // 12% para entrega a pie
} as const;

/**
 * TIPOS DE MOVIMIENTO IMSS
 * Códigos oficiales para movimientos afiliatorios en el IDSE.
 * Documentado en: FLUJOS_Y_LOGICA_BEFAST.md - "Proceso Mensual"
 */
export const IMSS_MOVEMENT_TYPES = {
  REINGRESO: '08',                   // Alta / Reingreso
  MODIFICACION_SALARIO: '55',        // Modificación de salario
  CANCELACION_INDEPENDIENTE: '54',   // Cancelación de independiente
  BAJA_DEFINITIVA: '02',             // Baja definitiva
} as const;

/**
 * CONFIGURACIÓN FINANCIERA
 * Constantes para cálculos financieros y comisiones.
 */
export const FINANCIAL_CONFIG = {
  // Comisión por transacción (Stripe, etc.)
  TRANSACTION_FEE: 0.029, // 2.9%
  
  // IVA en México
  IVA_RATE: 0.16, // 16%
  
  // Comisión del repartidor por defecto
  DEFAULT_DRIVER_COMMISSION: 0.15, // 15%
  
  // Auto-liquidar deudas
  AUTO_LIQUIDATE_DEBTS: true,
  
  // Límites de billetera
  MINIMUM_WALLET_BALANCE: 0,
  MAXIMUM_WALLET_BALANCE: 10000,
  
  // Retiro máximo diario
  MAX_DAILY_WITHDRAWAL: 5000,
  
  // Comisión por retiro
  WITHDRAWAL_FEE: 0.02, // 2%
} as const;

/**
 * CONFIGURACIÓN DE NÓMINA
 * Parámetros para el procesamiento de nómina.
 */
export const PAYROLL_CONFIG = {
  // Día de corte mensual
  CUT_OFF_DAY: 25,
  
  // Días hábiles para procesar nómina
  PROCESSING_DAYS: 3,
  
  // Porcentaje de retención para empleados cotizantes
  RETENTION_RATE: 0.10, // 10%
  
  // Ciclo de nómina (días)
  PAYROLL_CYCLE_DAYS: 7, // Semanal
} as const;

/**
 * DATOS BANCARIOS DE BEFAST
 * Para transferencias y pagos.
 * Documentado en: BeFast (1).md - "Compra de Créditos"
 */
export const BEFAST_BANK_INFO = {
  BANK_NAME: process.env.BEFAST_BANK_NAME || 'BBVA',
  CLABE: process.env.BEFAST_CLABE || '',
  BENEFICIARY: process.env.BEFAST_BENEFICIARY || '',
  CONCEPT: process.env.BEFAST_CONCEPT || 'Compra de créditos BeFast',
} as const;

/**
 * UMBRALES PARA ALERTAS
 */
export const ALERT_THRESHOLDS = {
  // Créditos bajos para negocios
  LOW_CREDITS: 5,
  
  // Deuda alta para repartidores (% del límite)
  HIGH_DEBT_PERCENTAGE: 0.8, // 80% del límite
  
  // Pedidos sin asignar (minutos)
  UNASSIGNED_ORDER_MINUTES: 10,
  
  // Retraso en entrega (minutos)
  DELIVERY_DELAY_MINUTES: 30,
} as const;
