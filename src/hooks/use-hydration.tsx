import { useState, useEffect } from 'react';

/**
 * Hook para manejar la hidratación de manera segura
 * Evita errores de hidratación al asegurar que el contenido se renderice
 * de manera consistente entre servidor y cliente
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook para renderizar contenido solo después de la hidratación
 * Útil para contenido que depende de APIs del navegador
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook para generar IDs únicos de manera segura para SSR
 */
export function useUniqueId(prefix: string = 'id'): string {
  const [id, setId] = useState(`${prefix}-server`);

  useEffect(() => {
    setId(`${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
  }, [prefix]);

  return id;
}
