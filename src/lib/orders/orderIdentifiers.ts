export type OrderSource = 'DELIVERY' | 'MARKET';

const PREFIXES = {
  DELIVERY: 'BF-DLV',
  MARKET: 'BM',  // BeFast Market uses BM prefix (e.g., BM01, BM02)
  SHIPDAY: 'SD'   // Shipday prefix
} as const;

function padTwo(value: number): string {
  return value.toString().padStart(2, '0');
}

function buildDateSegment(date: Date): string {
  return `${date.getFullYear()}${padTwo(date.getMonth() + 1)}${padTwo(date.getDate())}`;
}

function buildRandomSegment(): string {
  const segment = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return segment.slice(0, 6).padEnd(6, '0');
}

export function generateOrderNumber(source: OrderSource, referenceDate: Date = new Date()): string {
  const prefix = PREFIXES[source] ?? PREFIXES.DELIVERY;
  return `${prefix}-${buildDateSegment(referenceDate)}-${buildRandomSegment()}`;
}

export function inferSourceFromOrderNumber(orderNumber?: string | null): OrderSource {
  if (!orderNumber) {
    return 'DELIVERY';
  }

  const normalized = orderNumber.trim().toUpperCase();

  // BeFast Market: BM prefix (BM01, BM02) or #number patterns (#7, #123)
  if (normalized.startsWith(PREFIXES.MARKET) || /^#?\d+$/.test(normalized) || normalized.includes('#')) {
    return 'MARKET';
  }

  // BeFast Delivery: BF-DLV- prefix or SD (Shipday) prefix
  if (normalized.startsWith(PREFIXES.DELIVERY) || normalized.startsWith(PREFIXES.SHIPDAY) || 
      normalized.startsWith('BF-') || normalized.startsWith('SD-') || normalized.startsWith('SD')) {
    return 'DELIVERY';
  }

  return 'DELIVERY';
}

export function isDeliveryOrderNumber(orderNumber?: string | null): boolean {
  return inferSourceFromOrderNumber(orderNumber) === 'DELIVERY';
}

export function isMarketOrderNumber(orderNumber?: string | null): boolean {
  return inferSourceFromOrderNumber(orderNumber) === 'MARKET';
}

export function normalizeOrderNumber(orderNumber: string | undefined | null, fallbackSource: OrderSource = 'DELIVERY'): string {
  if (!orderNumber) {
    return generateOrderNumber(fallbackSource);
  }

  const trimmed = orderNumber.trim();
  if (!trimmed) {
    return generateOrderNumber(fallbackSource);
  }

  const upper = trimmed.toUpperCase();
  
  // Keep existing prefixes as-is
  if (upper.startsWith(PREFIXES.DELIVERY) || upper.startsWith(PREFIXES.MARKET) || 
      upper.startsWith(PREFIXES.SHIPDAY) || upper.startsWith('BF-') || 
      upper.startsWith('SD-') || upper.startsWith('SD')) {
    return upper;
  }

  // Market orders with # or just numbers - keep as-is (from BeFast Market external system)
  if (/^#?\d+$/.test(upper)) {
    return upper.startsWith('#') ? upper : `#${upper}`;
  }

  return upper;
}
