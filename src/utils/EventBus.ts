// Sencillo EventBus para comunicación global sin dependencias

type Handler<T = any> = (payload?: T) => void;

type Events = {
  NEW_ORDER: any;
  EMERGENCY: void;
  MAP_ACTION: {
    intent: 'VIEW_LOCATION' | 'SEARCH_PLACES' | 'DIRECTIONS' | 'CLEAR';
    params?: any;
  };
};

class EventBus {
  private listeners: { [K in keyof Events]?: Handler<Events[K]>[] } = {};

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    if (!this.listeners[event]) this.listeners[event] = [] as any;
    (this.listeners[event] as Handler<Events[K]>[]).push(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    const arr = this.listeners[event];
    if (!arr) return;
    this.listeners[event] = arr.filter(h => h !== handler) as any;
  }

  emit<K extends keyof Events>(event: K, payload?: Events[K]) {
    const arr = this.listeners[event];
    if (!arr) return;
    arr.forEach(h => {
      try { (h as any)(payload); } catch (e) { console.warn('EventBus handler error', e); }
    });
  }
}

const eventBus = new EventBus();
export default eventBus;
export const emitNewOrder = (data: any) => eventBus.emit('NEW_ORDER', data);
export const emitEmergency = () => eventBus.emit('EMERGENCY');
export const emitMapAction = (payload: { intent: 'VIEW_LOCATION' | 'SEARCH_PLACES' | 'DIRECTIONS' | 'CLEAR'; params?: any; }) => eventBus.emit('MAP_ACTION', payload);
