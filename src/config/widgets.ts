// Registro central de widgets por pantalla

export type WidgetStatus = 'ready' | 'planned' | 'in-progress';

export interface WidgetDefinition {
  key: string;
  title: string;
  status: WidgetStatus;
  // Ventana estimada (hora local) para activación o limpieza
  window?: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
}

export interface ScreenWidgets {
  screen: string;
  widgets: WidgetDefinition[];
}

// Nota: mantener minimal; esto sirve como hoja de ruta visible desde el Dashboard
export const WIDGETS_REGISTRY: ScreenWidgets[] = [
  {
    screen: 'Dashboard',
    widgets: [
      { key: 'status-toggle', title: 'Interruptor Online/Offline', status: 'in-progress', window: { start: '04:00', end: '05:00' } },
      { key: 'today-metrics', title: 'Pedidos y Ganancias de Hoy', status: 'ready' },
      { key: 'week-orders', title: 'Pedidos de la Semana', status: 'ready' },
      { key: 'rating', title: 'Calificación Actual', status: 'ready' },
      { key: 'acceptance', title: 'Tasa de Aceptación', status: 'ready' },
    ],
  },
  {
    screen: 'Payments',
    widgets: [
      { key: 'balance', title: 'Saldo Disponible', status: 'ready' },
      { key: 'transactions', title: 'Historial de Transacciones', status: 'ready' },
      { key: 'aggregates', title: 'Agregados (Semana/Mes/Propinas/Bonos)', status: 'ready' },
    ],
  },
  {
    screen: 'Metrics',
    widgets: [
      { key: 'earnings-breakdown', title: 'Desglose Semanal', status: 'ready' },
      { key: 'performance-trends', title: 'Tendencias de Rendimiento', status: 'ready' },
      { key: 'hourly-activity', title: 'Actividad por Horas', status: 'ready' },
    ],
  },
  {
    screen: 'Profile',
    widgets: [
      { key: 'driver-info', title: 'Datos del Conductor', status: 'ready' },
      { key: 'menu-shortcuts', title: 'Accesos Rápidos', status: 'ready' },
    ],
  },
];

export const getWidgetsForScreen = (screen: string): WidgetDefinition[] => {
  return WIDGETS_REGISTRY.find(s => s.screen === screen)?.widgets || [];
};
