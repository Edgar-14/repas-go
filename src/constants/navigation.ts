import { 
  HeartPulse, 
  ShieldCheck, 
  Users, 
  Activity, 
  DollarSign, 
  Settings, 
  UserPlus, 
  Sheet, 
  Gift, 
  BookUser, 
  History, 
  FileText, 
  Store, 
  Package, 
  Home, 
  List, 
  Wallet,
  LifeBuoy,
  UserCircle,
  Clock,
  Receipt,
  Plus,
  LucideIcon
} from 'lucide-react';
import { type PortalType } from './portal-colors';

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface PortalNavigation {
  portal: PortalType;
  items: NavigationItem[];
}

export const PORTAL_NAVIGATION: Record<PortalType, NavigationItem[]> = {
  admin: [
    { href: '/admin/dashboard', label: 'Panel', icon: HeartPulse },
    { href: '/admin/solicitudes', label: 'Solicitudes', icon: ShieldCheck },
    { href: '/admin/repartidores', label: 'Repartidores', icon: Users },
    { href: '/admin/negocios', label: 'Negocios', icon: Store },
    { href: '/admin/pedidos', label: 'Pedidos', icon: Package },
    { href: '/admin/shipday-monitor', label: 'Monitor Shipday', icon: Activity },
    { href: '/admin/payroll', label: 'Nómina', icon: Sheet },
    { href: '/admin/shipday', label: 'Shipday', icon: Package },
    { href: '/admin/support', label: 'Soporte', icon: BookUser },
    { href: '/admin/incentives', label: 'Incentivos', icon: Gift },
    { href: '/admin/training', label: 'Capacitación', icon: History },
    { href: '/admin/reports', label: 'Reportes', icon: FileText },
    { href: '/admin/stripe-recovery', label: 'Recuperar Pagos', icon: DollarSign },
    { href: '/admin/settings', label: 'Ajustes', icon: Settings },
    { href: '/admin/management', label: 'Gestión Admins', icon: UserPlus },
    { href: '/admin/activity', label: 'Bitácora', icon: Activity },
  ],
  delivery: [
    { href: '/delivery/dashboard', label: 'Dashboard', icon: Home },
    { href: '/delivery/new-order', label: 'Nuevo Pedido', icon: Plus },
    { href: '/delivery/orders', label: 'Mis Pedidos', icon: List },
    { href: '/delivery/history', label: 'Historial', icon: History },
    { href: '/delivery/billing', label: 'Paquetes', icon: Wallet },
    { href: '/delivery/settings', label: 'Ajustes', icon: Settings },
  ],
  repartidores: [
    { href: '/repartidores/dashboard', label: 'Panel', icon: UserCircle },
    { href: '/repartidores/wallet', label: 'Mi Billetera', icon: Wallet },
    { href: '/repartidores/profile', label: 'Mi Perfil', icon: FileText },
    { href: '/repartidores/payroll', label: 'Nómina', icon: Receipt },
    { href: '/repartidores/support', label: 'Soporte', icon: LifeBuoy },
    { href: '/repartidores/liquidate-debt', label: 'Liquidar Deuda', icon: Clock },
  ]
};

export const getNavigationForPortal = (portal: PortalType): NavigationItem[] => {
  return PORTAL_NAVIGATION[portal] || [];
};