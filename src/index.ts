/**
 * BeFast Frontend Index
 * Exports all components and utilities for the BeFast platform
 */

// Re-export Firebase configuration
export { auth, db, storage, functions } from './lib/firebase';

// Re-export authentication utilities
export { useAuth } from './hooks/useAuth';

// Re-export UI components
export * from './components/ui/button';
export * from './components/ui/card';
export * from './components/ui/Input';
export * from './components/ui/label';
export * from './components/ui/badge';
export * from './components/ui/progress';

// Re-export dashboard components
export * from './components/dashboard/header';
export * from './components/ui/metric-card';
export * from './components/dashboard/user-nav';

// Re-export auth components
export * from './components/auth/AuthForm';
export * from './components/auth/AuthUI';
export * from './components/auth/withAuth';

// Re-export layout components
export * from './components/layout/MainLayout';
export * from './components/navigation/PortalNavigation';

// Re-export driver components
export * from './components/drivers/DocumentManager';
export * from './components/drivers/DriverKPIs';
export * from './components/drivers/HistorialPedidos';
export * from './components/drivers/HistorialTransacciones';

// Re-export admin components
export * from './components/admin/AuditLogViewer';
export * from './components/admin/DriverProfile360';

// Re-export business components
export * from './components/business/OrderPanel';

// Re-export utilities
export * from './lib/utils';
export * from './lib/auth';
export * from './lib/orders';

// Re-export hooks
export * from './hooks/use-toast';
export * from './hooks/use-mobile';
export * from './hooks/use-portal-theme';
export * from './hooks/useButtonActions';
export * from './hooks/useBeFastSystem';

// Re-export constants
export * from './constants/driver';
export * from './constants/portal-colors';

// Re-export types
export * from './types/index';

// Re-export services
export * from './lib/services/befast-vertex-integration';