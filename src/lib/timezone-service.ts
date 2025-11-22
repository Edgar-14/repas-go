/**
 * TimeZone Service - Manejo de zonas horarias para BeFast
 * Proporciona utilidades para manejar fechas y horas de forma segura y consistente.
 *
 * PRINCIPIO CLAVE:
 * Los objetos `Date` de JavaScript son internamente siempre UTC.
 * No se "convierten". Solo se "formatean" para mostrarlos en una zona horaria específica.
 * Toda la lógica de negocio y comunicación con APIs debe usar UTC para evitar errores.
 */
export class TimeZoneService {
  private static readonly DEFAULT_TIMEZONE = 'America/Mexico_City';
  private static readonly SUPPORTED_TIMEZONES = [
    'America/Mexico_City',
    'America/Tijuana',
    'America/Cancun',
    'America/Merida',
    'America/Monterrey',
    'America/Chihuahua',
    'America/Hermosillo',
    'America/Mazatlan',
    'America/Guadalajara',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'America/Denver',
  ];

  /**
   * Obtiene la zona horaria por defecto del sistema.
   */
  static getDefaultTimezone(): string {
    return this.DEFAULT_TIMEZONE;
  }

  /**
   * Obtiene la zona horaria del navegador del usuario de forma segura.
   */
  static getBrowserTimezone(): string {
    try {
      // Esta es la forma estándar y correcta de obtener la zona horaria del cliente.
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.warn('No se pudo obtener la zona horaria del navegador. Usando la de por defecto.', error);
      return this.DEFAULT_TIMEZONE;
    }
  }

  /**
   * Formatea una fecha (un momento en el tiempo) a un string legible en una zona horaria específica.
   * Este es el método correcto para "mostrar" una fecha a un usuario.
   */
  static formatInTimezone(
    date: Date,
    timezone: string = this.DEFAULT_TIMEZONE,
    options: Intl.DateTimeFormatOptions = {}
  ): string {
    // Validamos que la zona horaria sea soportada por el navegador.
    if (!this.isValidTimezone(timezone)) {
      console.warn(`La zona horaria "${timezone}" no es válida. Usando la de por defecto.`);
      timezone = this.DEFAULT_TIMEZONE;
    }

    try {
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone, // La magia ocurre aquí.
        ...options,
      };

      return new Intl.DateTimeFormat('es-MX', defaultOptions).format(date);
    } catch (error) {
      console.error(`Error al formatear fecha en zona horaria ${timezone}:`, error);
      // Si todo falla, devuelve el formato estándar ISO que es inequívoco (UTC).
      return date.toISOString();
    }
  }

  /**
   * Verifica si una zona horaria es válida y soportada por el entorno de ejecución (navegador/servidor).
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene la lista de zonas horarias soportadas por la aplicación.
   */
  static getSupportedTimezones(): string[] {
    return [...this.SUPPORTED_TIMEZONES];
  }

  /**
   * Formatea los datos de tiempo para la API de Shipday de forma robusta y consistente.
   * Esta función ahora trabaja exclusivamente en UTC para eliminar cualquier ambigüedad.
   * Para órdenes inmediatas: se procesan AL INSTANTE, el tiempo de entrega al cliente es un estimado.
   * IMPORTANTE: Para pedidos inmediatos NO enviamos scheduledDate/scheduledTime para evitar programación.
   */
  static formatForShipday(serviceTimeMinutes: number = 20) {
    try {
      // 1. Obtener la hora actual. `new Date()` siempre es un timestamp UTC.
      const nowUTC = new Date();

      // 2. Calcular la hora de entrega estimada sumando los minutos al timestamp actual.
      const deliveryTimeUTC = new Date(nowUTC.getTime() + serviceTimeMinutes * 60 * 1000);

      // El tiempo estimado de entrega debe estar en formato ISO 8601 para la API.
      const estimatedDeliveryTime = deliveryTimeUTC.toISOString();

      console.log('TimeZoneService.formatForShipday - Orden INMEDIATA (valores en UTC):', {
        now: nowUTC.toISOString(),
        deliveryTime: deliveryTimeUTC.toISOString(),
        serviceTimeMinutes,
        note: 'NO se envían scheduledDate/scheduledTime para pedidos inmediatos'
      });

      // Para pedidos inmediatos, NO enviamos NINGÚN campo de tiempo
      // Esto evita que Shipday los programe en lugar de ponerlos en cola inmediata
      return {
        // NO enviamos ningún campo de tiempo para pedidos inmediatos
        // Shipday manejará automáticamente el tiempo de entrega
        // Solo enviamos campos de configuración básica
        orderType: 'immediate',
        processingMode: 'instant'
      };
    } catch (error) {
      console.error('Error catastrófico al formatear datos para Shipday. Se usará un fallback.', error);
      
      // Un fallback simple en caso de un error inesperado, aunque es muy poco probable.
      const now = new Date();
      const deliveryTime = new Date(now.getTime() + (20 * 60 * 1000));
      
      return {
        estimatedDeliveryTime: deliveryTime.toISOString(),
        timezone: 'UTC',
        isImmediate: true,
        isScheduled: false,
        processingTime: 'immediate',
        deliveryTimeToCustomer: 20
      };
    }
  }
}

// --- Funciones de Conveniencia Exportadas ---

/**
 * Formatea una fecha para ser mostrada en la zona horaria de la Ciudad de México.
 * Útil para interfaces de usuario.
 */
export const formatInMexicoTimezone = (date: Date, options?: Intl.DateTimeFormatOptions) =>
  TimeZoneService.formatInTimezone(date, 'America/Mexico_City', options);