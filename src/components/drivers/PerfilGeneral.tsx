

// ...existing code...

// CORRECCIÓN: Tipo específico para timestamp
function formatDate(ts?: any) {
  if (!ts) return 'N/A';
  try {
    // Verificar si es un Timestamp de Firestore
    if (ts && typeof ts.toDate === 'function') {
      return ts.toDate().toLocaleString();
    }
    // Si es una fecha normal
    if (ts instanceof Date) {
      return ts.toLocaleString();
    }
    // Intentar convertir string a fecha
    const date = new Date(ts);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    return String(ts);
  } catch {
    return String(ts);
  }
}

function getStatusAlert(driver: any) {
  if (driver.status === 'banned' || driver.status === 'prohibido' || driver.status === 'suspended') {
    return { color: 'red', msg: 'Repartidor suspendido o prohibido. No puede tomar pedidos.' };
  }
  if (!driver.isActive) {
    return { color: 'orange', msg: 'Repartidor inactivo. No puede tomar pedidos.' };
  }
  if (driver.imssStatus && driver.imssStatus !== 'PROVISIONAL' && driver.imssStatus !== 'ACTIVO') {
    return { color: 'orange', msg: `IMSS pendiente o irregular: ${driver.imssStatus}` };
  }
  return null;
}

function getDebtAlert(driver: any) {
  if (typeof driver.pendingDebts === 'number' && typeof driver.driverDebtLimit === 'number') {
    if (driver.pendingDebts > driver.driverDebtLimit) {
      return { color: 'red', msg: `Adeudos excesivos para aceptar pedidos en efectivo. Adeudos: $${driver.pendingDebts}, Límite: $${driver.driverDebtLimit}` };
    }
    if (driver.pendingDebts > 0) {
      return { color: 'orange', msg: `El repartidor tiene adeudos pendientes: $${driver.pendingDebts}` };
    }
  }
  return null;
}

function getDocsAlert(faltantes: string[]) {
  if (faltantes.length > 0) {
    return { color: 'red', msg: `Faltan documentos: ${faltantes.join(', ')}` };
  }
  return null;
}

// Documentos requeridos (debe coincidir con Documentos.tsx)
const REQUIRED_DOCS = [
  'INE',
  'Licencia de conducir',
  'Comprobante de domicilio',
  'Tarjeta de circulación',
  'Foto de perfil',
  'CURP',
  'RFC',
  'IMSS',
];

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
// ...existing code...

const PerfilGeneral = ({ driver, documentos }: { driver: any, documentos?: any[] }) => {
  const { toast } = useToast();
  // Validación de documentos
  const entregados = documentos ? documentos.map(d => d.type) : [];
  const faltantes = REQUIRED_DOCS.filter(req => !entregados.includes(req));

  // Alertas
  const statusAlert = getStatusAlert(driver);
  const debtAlert = getDebtAlert(driver);
  const docsAlert = getDocsAlert(faltantes);

  // KPIs extendidos (puedes agregar más si tienes datos)
  const kpis = driver.kpis || {};

  // Reportes externos (Shipday)
  const shipdayLinks = driver.email ? [
    {
      label: 'Reporte de pagos Shipday',
      url: `https://app.shipday.com/drivers/${driver.email}/payments`
    },
    {
      label: 'Reporte de desempeño Shipday',
      url: `https://app.shipday.com/drivers/${driver.email}/performance`
    }
  ] : [];

  // --- Lógica para cambiar estado y editar límite de adeudos ---
  const [editLimit, setEditLimit] = useState(false);
  const [newLimit, setNewLimit] = useState(driver.driverDebtLimit ?? 300);
  const [savingLimit, setSavingLimit] = useState(false);
  const [status, setStatus] = useState(driver.status);
  const [savingStatus, setSavingStatus] = useState(false);

  const estadosValidos = [
    'ACTIVE',
    'ACTIVO_COTIZANDO',
    'ALTA_PROVISIONAL',
    'SUSPENDED',
    'INACTIVE',
  ];

  const handleSaveLimit = async () => {
    setSavingLimit(true);
    try {
      await updateDoc(doc(db, 'DRIVER', driver.id), { driverDebtLimit: Number(newLimit) });
      setEditLimit(false);
      toast({
        title: 'Límite actualizado',
        description: 'El límite de deuda se ha guardado correctamente',
        variant: 'default'
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Error al guardar límite',
        variant: 'destructive'
      });
    }
    setSavingLimit(false);
  };

  const handleChangeStatus = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setSavingStatus(true);
    try {
      await updateDoc(doc(db, 'DRIVER', driver.id), { status: newStatus });
      setStatus(newStatus);
      toast({
        title: 'Estado actualizado',
        description: 'El estado del repartidor se ha cambiado correctamente',
        variant: 'default'
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Error al cambiar estado',
        variant: 'destructive'
      });
    }
    setSavingStatus(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 w-full">
      {/* Alertas principales */}
      <div className="space-y-2">
        {statusAlert && <div className={`rounded px-3 py-2 font-bold bg-red-100 text-red-700`}>{statusAlert.msg}</div>}
        {debtAlert && <div className={`rounded px-3 py-2 font-bold bg-yellow-100 text-yellow-700`}>{debtAlert.msg}</div>}
        {docsAlert && <div className={`rounded px-3 py-2 font-bold bg-orange-100 text-orange-700`}>{docsAlert.msg}</div>}
      </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 w-full">
  <div className="bg-white rounded-lg shadow p-4 w-full">
          <h2 className="text-lg font-semibold mb-2">Datos Generales</h2>
          <ul className="space-y-1">
            <li><b>Nombre:</b> {driver.name}</li>
            <li><b>Correo electrónico:</b> {driver.email}</li>
            <li><b>Teléfono:</b> {driver.phone}</li>
            <li>
              <b>Estado:</b>{' '}
              <select value={status} onChange={handleChangeStatus} disabled={savingStatus} className="ml-2 border rounded px-2 py-1">
                {estadosValidos.map(est => <option key={est} value={est}>{est}</option>)}
              </select>
              {savingStatus && <span className="ml-2 text-xs text-gray-500">Guardando...</span>}
            </li>
            <li><b>IMSS:</b> {driver.imssStatus || 'N/A'}</li>
            <li><b>Fecha de alta:</b> {formatDate(driver.createdAt)}</li>
            <li><b>Fecha de onboarding:</b> {formatDate(driver.onboardingDate)}</li>
            <li><b>Última actualización:</b> {formatDate(driver.updatedAt)}</li>
            <li><b>CURP:</b> {driver.curp || 'N/A'}</li>
            <li><b>RFC:</b> {driver.rfc || 'N/A'}</li>
            <li><b>Dirección:</b> {driver.address ? `${driver.address.street}, ${driver.address.city}, ${driver.address.state}, ${driver.address.zipCode}` : 'N/A'}</li>
          </ul>
        </div>
          <div className="bg-white rounded-lg shadow p-4 w-full">
          <h2 className="text-lg font-semibold mb-2">Finanzas</h2>
          <ul className="space-y-1">
            <li><b>Balance de billetera:</b> ${driver.walletBalance ?? 0}</li>
            <li><b>Adeudos pendientes:</b> ${driver.pendingDebts ?? 0}</li>
            <li>
              <b>Límite de adeudos:</b>{' '}
              {editLimit ? (
                <>
                  <input type="number" value={newLimit} onChange={e => setNewLimit(Number(e.target.value))} className="w-20 border rounded px-2 py-1" />
                  <button onClick={handleSaveLimit} disabled={savingLimit} className="ml-2 px-2 py-1 bg-blue-500 text-white rounded">Guardar</button>
                  <button onClick={() => setEditLimit(false)} className="ml-2 px-2 py-1 bg-gray-300 rounded">Cancelar</button>
                  {savingLimit && <span className="ml-2 text-xs text-gray-500">Guardando...</span>}
                </>
              ) : (
                <>
                  ${driver.driverDebtLimit ?? 300} <button onClick={() => setEditLimit(true)} className="ml-2 px-2 py-1 bg-blue-500 text-white rounded">Editar</button>
                </>
              )}
            </li>
            <li><b>Ingreso bruto mensual:</b> ${driver.ingreso_bruto_mensual ?? 0}</li>
            <li><b>Saldo bloqueado:</b> ${driver.lockedBalance ?? 0}</li>
            <li><b>Saldo disponible:</b> ${typeof driver.walletBalance === 'number' && typeof driver.lockedBalance === 'number' ? driver.walletBalance - driver.lockedBalance : 'N/A'}</li>
            <li><b>Banco:</b> {driver.bankName || 'N/A'}</li>
            <li><b>Cuenta bancaria:</b> {driver.bankAccount || 'N/A'}</li>
            <li><b>CLABE:</b> {driver.clabe || 'N/A'}</li>
          </ul>
        </div>
      </div>

  <div className="bg-white rounded-lg shadow p-4 mt-6 w-full">
        <h3 className="text-lg font-semibold mb-2">Vehículo</h3>
        <ul className="space-y-1">
          <li><b>Tipo:</b> {driver.vehicleInfo?.type || 'N/A'}</li>
          <li><b>Marca:</b> {driver.vehicleInfo?.brand || 'N/A'}</li>
          <li><b>Modelo:</b> {driver.vehicleInfo?.model || 'N/A'}</li>
          <li><b>Año:</b> {driver.vehicleInfo?.year || 'N/A'}</li>
          <li><b>Placas:</b> {driver.vehicleInfo?.licensePlate || 'N/A'}</li>
        </ul>
      </div>

  <div className="bg-white rounded-lg shadow p-4 mt-6 w-full">
        <h3 className="text-lg font-semibold mb-2">KPI's</h3>
        <ul className="space-y-1">
          <li><b>Órdenes totales:</b> {kpis.totalOrders ?? 0}</li>
          <li><b>Órdenes canceladas:</b> {kpis.cancelledOrders ?? 'N/A'}</li>
          <li><b>Calificación promedio:</b> {kpis.averageRating ?? 'N/A'}</li>
          <li><b>Tasa de aceptación:</b> {kpis.acceptanceRate ?? 'N/A'}%</li>
          <li><b>Tasa a tiempo:</b> {kpis.onTimeRate ?? 'N/A'}%</li>
          <li><b>Ganancias netas:</b> ${kpis.netEarnings ?? 'N/A'}</li>
          <li><b>Propinas totales:</b> ${kpis.totalTips ?? 'N/A'}</li>
          <li><b>Total comisión:</b> ${kpis.totalCommission ?? 'N/A'}</li>
          <li><b>Éxito:</b> {kpis.successRate ?? 'N/A'}%</li>
          <li><b>Tiempo promedio de entrega:</b> {kpis.avgDeliveryTime ?? 'N/A'} min</li>
        </ul>
      </div>

      {/* Acceso directo a reportes externos */}
      {shipdayLinks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mt-6 w-full">
          <h4 className="text-lg font-semibold mb-2">Reportes Shipday</h4>
          <ul className="space-y-1">
            {shipdayLinks.map(link => (
              <li key={link.label} className="flex items-center justify-between flex-wrap">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{link.label}</a>
                <button onClick={() => window.open(link.url, '_blank')} className="ml-2 px-2 py-1 bg-green-500 text-white rounded">Descargar</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Acciones manuales y automáticas */}
      <div className="flex flex-col md:flex-row gap-2 mt-6 w-full">
        <button className="px-4 py-2 bg-blue-600 text-white rounded w-full md:w-auto" onClick={() => window.print()}>
          Descargar perfil (PDF)
        </button>
        <button className="px-4 py-2 bg-gray-600 text-white rounded w-full md:w-auto" onClick={() => window.location.href = `/admin/repartidores/${driver.id}/edit`}>Editar manualmente</button>
        <button className="px-4 py-2 bg-green-600 text-white rounded w-full md:w-auto" onClick={() => window.location.href = `/admin/repartidores/${driver.id}/auto-sync`}>Sincronizar con Shipday</button>
      </div>
    </div>
  );
};

export default PerfilGeneral;
