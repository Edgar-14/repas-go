// Configuración financiera para clasificación laboral de repartidores
// Basado en la Matriz Cerebro BeFast Definitiva

export const financialConfig = {
  // Salario mínimo mensual en México (2025) según normativa oficial
  salarioMinimoMensual: 8364, // $8,364 MXN mensuales
  
  // Factores de exclusión por tipo de vehículo según normativa oficial mexicana
  factoresExclusion: {
    'auto': 0.36,      // 36% para vehículos de 4 ruedas
    'moto': 0.30,      // 30% para vehículos de 2 ruedas
    'bicicleta': 0.12, // 12% para sin medio de transporte
    'bici': 0.12       // Alias para bicicleta
  },
  
  // Umbrales para clasificación automática
  umbrales: {
    // Si el ingreso neto (después de factores de exclusión) es >= salario mínimo
    // → Empleado Cotizante
    // Si es < salario mínimo → Independiente
    empleadoCotizante: 8364,
    independiente: 8364
  },
  
  // Configuración de billetera
  wallet: {
    // Límite máximo de retiro diario
    maxDailyWithdrawal: 5000,
    // Comisión por retiro (porcentaje)
    withdrawalFee: 0.02, // 2%
    // Saldo mínimo requerido para operar
    minimumBalance: 100,
    // Límite máximo de adeudos para pedidos en efectivo
    debtLimitDefault: 300 // $300 MXN
  },
  
  // Configuración de incentivos
  incentives: {
    // Bonificación por completar pedidos en tiempo
    onTimeDelivery: 10,
    // Bonificación por alta calificación
    highRating: 15,
    // Bonificación por volumen mensual
    monthlyVolume: {
      threshold: 100, // pedidos
      bonus: 200 // pesos
    }
  },
  
  // Configuración de nómina
  payroll: {
    // Fecha de corte mensual
    cutOffDay: 25,
    // Días hábiles para procesar nómina
    processingDays: 3,
    // Porcentaje de retención para empleados cotizantes
    retentionRate: 0.10 // 10%
  }
};

export default financialConfig;
