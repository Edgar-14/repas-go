# BeFast Ecosistema - Arquitectura Completa, Hoja de Ruta y Visión de Futuro
## Documentación Técnica, Operativa y Estratégica Definitiva v7.0
**Fecha:** 22 de septiembre de 2025

---

## 📋 ÍNDICE

### **PARTE 1: ECOSISTEMA OPERATIVO ACTUAL (EL AHORA)**
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Ecosistema (Actual)](#arquitectura-del-ecosistema)
3. [Estructura de Portales](#estructura-de-portales)
4. [Portal de Negocios (BeFast Delivery)](#portal-de-negocios)
5. [Portal de Repartidores](#portal-de-repartidores)
6. [Portal Administrativo](#portal-administrativo)
7. [Flujos Operativos Detallados (Actual)](#flujos-operativos-detallados)
8. [Lógica Central del Sistema](#logica-central-del-sistema)
9. [KPIs y Métricas de Desempeño](#kpis-y-metricas-de-desempeno)
10. [Validación de Pedidos](#validacion-de-pedidos)

### **PARTE 2: VISIÓN ESTRATÉGICA Y HOJA DE RUTA (EL FUTURO)**
11. [Introducción a la Visión de Futuro](#introduccion-a-la-vision-de-futuro)
12. [Arquitectura del Ecosistema Impulsado por IA](#arquitectura-del-ecosistema-impulsado-por-ia)
13. [Flujos de Desarrollo Acelerado por IA](#flujos-de-desarrollo-acelerado-por-ia)
14. [Mapa de Integración y Dependencias Críticas](#mapa-de-integracion-y-dependencias-criticas)
15. [Flujos de Error y Recuperación](#flujos-de-error-y-recuperacion)
16. [Monitoreo y Alertas Recomendadas](#monitoreo-y-alertas-recomendadas)

### **PARTE 3: BLUEPRINT TÉCNICO COMPLETO (EL CÓMO)**
17. [Base de Datos y Configuración Técnica](#base-de-datos-y-configuracion-tecnica)
18. [Cloud Functions Principales](#cloud-functions-principales)
19. [Integraciones Externas](#integraciones-externas)
20. [Guía de Implementación y Testing](#guia-de-implementacion-y-testing)
21. [Información de Contacto](#informacion-de-contacto)
22. [Conclusión](#conclusion)

---

## 🎯 RESUMEN EJECUTIVO {#resumen-ejecutivo}

### Concepto Central
BeFast es un **sistema de control inteligente** que supervisa y valida todas las operaciones de entrega, funcionando como el "cerebro controlador" que gestiona Shipday mientras mantiene control total sobre repartidores, finanzas y cumplimiento legal bajo la normativa mexicana para plataformas digitales. Actúa como una capa de inteligencia que permite escalar el negocio de manera sostenible, asegurando formalidad laboral, transparencia financiera y cumplimiento proactivo.

### Diferenciadores Clave
- **Formalidad Real:** Empleados formales bajo normativa mexicana, no contratistas.
- **Transparencia Total:** Estados financieros claros y expectativas definidas para negocios y repartidores.
- **Cumplimiento Proactivo:** Automatización completa de obligaciones legales (IMSS, SAT), con el **Acta IDSE** como requisito indispensable.
- **Control Operativo:** Validación inteligente de pedidos sin perder escalabilidad.

### Arquitectura de Alto Nivel (Actual)
```
FUENTES DE PEDIDOS
├── Portal BeFast Delivery
└── Negocios BeFast Market
         ↓
    SHIPDAY (Motor de Distribución)
         ↓
    BEFAST (Cerebro de Validación)
         ↓
    REPARTIDORES MÓVILES
```

### Visión de Futuro
BeFast evolucionará de gestionar Shipday a **reemplazarlo con un ecosistema autónomo impulsado por Vertex AI**, construyendo y entrenando en tiempo real sus propias aplicaciones nativas (`BeFast GO` para logística y `BeFast EATS` para consumo) con cada transacción.

---

## 🏗️ ARQUITECTURA DEL ECOSISTEMA (Actual) {#arquitectura-del-ecosistema}

### Fuentes de Pedidos y Su Flujo Financiero

#### Fuente 1: Portal BeFast Delivery
- **Características:** Todos los pedidos se consideran pagados en efectivo para la lógica interna.
- **Flujo:** El repartidor recauda el monto completo (costo del servicio + propina) y adquiere una deuda de 15 pesos con BeFast, registrada en pendingDebts.
- **Propinas en Efectivo:** Si el negocio instruye cobrar una propina en efectivo, el repartidor la conserva íntegramente. El sistema la registra únicamente con fines informativos en el resumen de ganancias (walletTransactions).

#### Fuente 2: Negocios BeFast Market
- **Pagos con Tarjeta:** BeFast recibe el pago completo (costo del servicio + propina) directamente del cliente. Se transfiere al walletBalance del repartidor la ganancia neta (tarifa total del servicio menos 15 pesos) y la propina íntegra en transacciones separadas (CARD_ORDER_TRANSFER, TIP_CARD_TRANSFER).
- **Pagos en Efectivo:** Flujo idéntico al Portal BeFast Delivery. El repartidor recauda el monto completo en efectivo, y se registra un adeudo de 15 pesos en pendingDebts.

---

## 🌐 ESTRUCTURA DE PORTALES {#estructura-de-portales}

### Portal de Bienvenida (/)
**Propósito:** Punto de entrada único con navegación inteligente hacia cada portal especializado.

**Botones de Acceso:**
- **BeFast Market** → https://order.befastmarket.com/ (externo)
- **BeFast Delivery** → /delivery/login (portal de negocios)
- **BeFast Repartidores** → /repartidores/login (portal de conductores)
- **Admin** → /admin/login (acceso administrativo en footer)

**Información de Contacto (Footer Universal):**
- **WhatsApp Soporte:** https://wa.me/5213121905494
- **Email Soporte:** soporte@befastapp.com.mx
- **Documentos Fiscales:** documentos@befastapp.com.mx
- **Apelaciones:** revisiones@befastapp.com.mx
- **Facebook:** https://www.facebook.com/befastmarket1/
- **Instagram:** https://www.instagram.com/befastmarket/

**Identidad Visual Unificada:** Toda la aplicación se rige por una identidad visual profesional, con una tarjeta central sobre fondo desenfocado y un footer consistente en todos los portales para reforzar la marca.

---

## 🏢 PORTAL DE NEGOCIOS (BeFast Delivery) {#portal-de-negocios}

### Filosofía: "Sistema de Créditos Prepago"
BeFast Delivery permite que los negocios generen pedidos mediante un sistema de créditos (1 crédito = 1 envío) que se integran al flujo principal de Shipday, donde BeFast mantiene control total sobre la validación de repartidores.

### Información Disponible para Negocios

#### Resumen General (en /delivery/dashboard):
- **Número total de pedidos procesados:** Total de pedidos registrados en Firestore (ORDERS).
- **Porcentaje de entregas a tiempo:** Calculado desde los datos de Shipday (onTimeDeliveryRate).
- **Promedio de calificación general del servicio:** Basado en el Reporte de Desempeño del Conductor de Shipday, almacenado en Firestore (ORDERS.rating).

#### KPIs Básicos (en /delivery/dashboard):
- **Tasa de éxito:** Entregas completadas (status: COMPLETED) vs totales en Firestore.
- **Tiempo promedio de entrega por zona:** Calculado desde los datos de Shipday y agrupado por zonas geográficas en Firestore (ORDERS.deliveryTime).

### Enrutamiento Completo - Portal de Negocios

#### Rutas de Autenticación
- `/delivery/login` - Inicio de sesión de negocios
- `/delivery/signup` - Registro completo de negocios
- `/delivery/verify-code` - Verificación de email (6 dígitos)
- `/delivery/forgot-password` - Recuperación de contraseña

#### Rutas Principales
- `/delivery/dashboard` - Dashboard del negocio con métricas
- `/delivery/new-order` - Crear nuevo pedido
- `/delivery/orders` - Lista de pedidos del negocio
- `/delivery/orders/[orderId]` - Detalles de pedido específico

#### Rutas Financieras
- `/delivery/buy-credits` - Compra de créditos prepago
- `/delivery/billing` - Estado de cuenta y pagos
- `/delivery/billing/success` - Confirmación de pago exitoso

#### Rutas de Configuración
- `/delivery/settings` - Configuración del negocio
- `/delivery/fiscal-documents` - Documentos fiscales y facturas

### FLUJO OPERATIVO COMPLETO - NEGOCIOS

#### Paso 1: Registro del Negocio 📝
1.  **Llegada a la Página Principal:** El dueño del negocio entra a la página de bienvenida de BeFast.
2.  **Selección de "BeFast Delivery":** Hace clic en el botón "BeFast Delivery".
3.  **Inicio de Registro:** En /delivery/login, elige "¿No tienes una cuenta? Regístrate aquí".
4.  **Llenado de Formulario:** Completa formulario con:
    -   **Datos de Contacto:** Nombre completo, correo electrónico y contraseña.
    -   **Datos del Negocio:** Nombre comercial, teléfono de contacto, dirección con mapa interactivo, RFC.
5.  **Verificación por Correo:** Recibe código de 6 dígitos en /delivery/verify-code, al confirmar queda activado.

#### Paso 2: Compra de Créditos 💳
1.  **Primer Acceso al Portal:** Ve que tiene cero créditos disponibles.
2.  **Ir a Facturación:** Navega a /delivery/buy-credits.
3.  **Elegir Paquete:** Selecciona entre los paquetes disponibles:
    -   **Básico:** 50 créditos ($750 MXN) + 15 gratis primera compra.
    -   **Empresarial:** 100 créditos ($1,500 MXN) + 25 gratis primera compra.
    -   **Corporativo:** 250 créditos ($3,750 MXN) + 35 gratis primera compra.
4.  **Pago por Transferencia:**
    -   Sistema muestra datos bancarios de BeFast:
        -   **Banco:** BBVA MÉXICO
        -   **Cuenta:** 0123456789
        -   **CLABE:** 012345678901234567
        -   **Beneficiario:** Rosio Arisema Uribe Macias
    -   Negocio realiza transferencia desde su banco.
    -   **Sube comprobante** en /delivery/billing.
    -   Administrador valida y acredita créditos manualmente.

#### Paso 3: Creación y Envío del Pedido 📦
1.  **Ir a "Nuevo Pedido":** Desde dashboard hace clic en /delivery/new-order.
2.  **Llenar Datos del Envío:**
    -   **Información de Recogida:** Sistema auto-rellena datos del negocio.
    -   **Información de Entrega:** Datos del cliente, dirección con mapa, monto a cobrar, método de pago (efectivo/tarjeta).
3.  **Confirmar y Enviar:** Al crear pedido, sistema automáticamente:
    -   Verifica cuenta activa y créditos disponibles.
    -   Resta 1 crédito del saldo.
    -   Registra pedido en Firestore (ORDERS) y envía a Shipday inmediatamente a través de la Cloud Function `createOrder`.

#### Paso 4: Seguimiento en Tiempo Real 🗺️
En /delivery/orders, el negocio monitorea estados del pedido con códigos de colores:
- **Pendiente (Gris):** Pedido recién creado.
- **Buscando Repartidor (Amarillo):** Sistema buscando repartidor ideal.
- **Asignado (Azul):** Repartidor validado y confirmado.
- **En Tránsito (Naranja):** Repartidor recogió pedido, en camino a entrega.
- **Entregado (Verde):** Repartidor llegó y entregó paquete.
- **Completado (Verde Oscuro):** Proceso finalizado exitosamente.

#### Paso 5: Gestión General y Soporte ⚙️
- **Configuración:** /delivery/settings para actualizar información.
- **Facturas:** /delivery/fiscal-documents con instrucciones para envío de datos fiscales.
- **Soporte:** Canales disponibles en footer (WhatsApp, correo).

---

## 🚴 PORTAL DE REPARTIDORES {#portal-de-repartidores}

### Filosofía: "Formalidad, Control Operativo y Gestión Financiera Personal"
Este portal se centra en la formalidad laboral, el control operativo inteligente y la gestión financiera transparente para los repartidores, asegurando cumplimiento con normativas mexicanas.

### Información Disponible para Repartidores

#### Desempeño (en /repartidores/dashboard):
- **Entregas Completadas:** Número total de pedidos entregados exitosamente (status: COMPLETED en ORDERS).
- **Entregas a Tiempo:** Número de entregas dentro del tiempo estimado (ORDERS.deliveryTime vs estimatedDeliveryTime).
- **Entregas Tardías:** Número de entregas después del tiempo estimado.
- **Entregas Fallidas:** Número de entregas no completadas (status: FAILED).
- **Promedio de Calificación (# de reseñas):** Calificación promedio otorgada por los clientes (ORDERS.rating).
- **Promedio de Tiempo de Entrega (minutos):** Tiempo promedio para completar entregas (ORDERS.deliveryTime).

#### Pagos (en /repartidores/wallet):
- **# de Entregas:** Número total de pedidos completados.
- **# de Entregas en Efectivo:** Número de entregas pagadas en efectivo (paymentMethod: CASH).
- **Ganancias:** Monto total ganado (honorarios + propinas, registrado en walletTransactions).
- **Pago al Conductor:** Honorarios base por servicios (CARD_ORDER_TRANSFER, TIP_CARD_TRANSFER).
- **Dinero Recogido:** Cantidad total de efectivo recibido de clientes (CASH_ORDER_ADEUDO).
- **Pago Después de Efectivo:** Saldo resultante en la billetera (walletBalance), negativo indica deuda.

### Enrutamiento Completo - Portal de Repartidores

#### Rutas de Autenticación
- `/repartidores/login` - Inicio de sesión de conductores
- `/repartidores/signup/step-1` - Paso 1: Datos personales
- `/repartidores/signup/step-2` - Paso 2: Documentos
- `/repartidores/signup/step-3` - Paso 3: Contrato y documentos legales
- `/repartidores/signup/step-4` - Paso 4: Capacitación y evidencia
- `/repartidores/signup/step-5` - Paso 5: Confirmación y envío
- `/repartidores/forgot-password` - Recuperación de contraseña

#### Rutas Principales
- `/repartidores/dashboard` - Dashboard del conductor con métricas
- `/repartidores/wallet` - Gestión de billetera digital
- `/repartidores/documents` - Gestión completa de documentos (incluye IMSS)
- `/repartidores/payroll` - Nómina y reportes de actividad con paginación
- `/repartidores/beneficiaries` - Gestión de beneficiarios
- `/repartidores/liquidate-debt` - Liquidación de deudas

#### Rutas de Configuración y Soporte
- `/repartidores/support` - Soporte completo (WhatsApp, email apelaciones, números contacto)
- `/repartidores/solicitud-recibida` - Confirmación de solicitud enviada
- `/repartidores/settings` - Configuración personal

## **FLUJO COMPLETO DE REGISTRO, APROBACIÓN Y ALTA EN IMSS**

Este flujo describe el camino del aspirante desde que inicia su solicitud hasta que está completamente habilitado para recibir pedidos, un proceso que culmina con la carga de su Acta IDSE como requisito indispensable para operar.

### **Paso 1: Proceso de Solicitud y Registro**
El aspirante completa su solicitud a través de varios pasos secuenciales en el portal. Primero llena un formulario con sus datos básicos para crear un usuario auth, recibe un email con su código de verificación y ya pasa al paso 1.

- **1.1: Datos Personales y Laborales** (en `/repartidores/signup/step-1`): Proporciona su información fundamental, información personal (, RFC, CURP, etc.), de su vehículo y bancaria (CLABE).
- **1.2: Documentación Legal** (en `/repartidores/signup/step-2`): Carga los documentos requeridos, como INE, constancia de situación fiscal, licencia de conducir y tarjeta de circulación.
- **1.3: Acuerdos Legales y Firma** (en `/repartidores/signup/step-3`): Revisa y firma digitalmente la Política de Gestión Algorítmica, el Instructivo de Llenado y el Modelo de Contrato.
- **1.4: Capacitación Obligatoria** (en `/repartidores/signup/step-4`): Visualiza videos, aprueba un cuestionario y sube evidencia de su mochila térmica.
- **1.5: Confirmación y Envío** (en `/repartidores/signup/step-5`): Envía su solicitud, la cual aparece para el administrador en `/admin/solicitudes` con estado `PENDING`.

### **Paso 2: Validación y Decisión Administrativa**
Una vez enviada la solicitud, comienza el proceso de validación interna.

- **Validación Automática (Vertex AI):** Inmediatamente después del envío, el sistema utiliza Vertex AI Vision para analizar los documentos, extraer datos y verificar su autenticidad.
- **Revisión Manual:** Un administrador revisa la solicitud en `/admin/solicitudes` y los resultados de la validación de Vertex.

**Decisión Final:**

- **Si es Rechazado:** Se envía una notificación por correo electrónico al aspirante con el motivo del rechazo.
- **Si es Aprobado:** El sistema ejecuta una secuencia de acciones:
  - **Creación de Perfil:** Se crea el perfil completo del repartidor, visible para los administradores en la ruta `/admin/repartidores/[id]`.
  - **Actualización de Estatus:** El estatus del repartidor se actualiza a `APPROVED`, lo que le da acceso al portal.
  - **Disponibilidad para Alta en IMSS (IDSE):** El perfil del repartidor, ahora `APPROVED`, queda disponible en el sistema. El personal de Contabilidad puede acceder a la sección `/admin/payroll`, seleccionar al nuevo repartidor y subir manualmente los documentos de su alta en el IMSS (movimiento Tipo 08), como el Acta IDSE.
  - **Correo de Bienvenida:** Se envía un correo de bienvenida al repartidor que incluye un enlace para que establezca su contraseña por primera vez (link de restablecimiento).

### **Paso 3: Activación y Habilitación Final**
Tras ser aprobado, el repartidor activa su cuenta, pero la habilitación para recibir pedidos depende del alta en el IMSS.

- **Activación de la Cuenta:** El repartidor usa el enlace del correo para establecer su contraseña, iniciar sesión en su portal (`/repartidores/dashboard`) y descargar la app móvil usando el código QR.
- **Habilitación para Operar:** Una vez que Contabilidad sube y registra el Acta IDSE en el perfil del repartidor, la cuenta es completamente habilitada. A partir de este momento, cuando se conecte a la aplicación, su estado será `ACTIVE` y podrá recibir pedidos.

**Nota Aclaratoria sobre los Estatus del Repartidor:**
- **APPROVED:** Estado tras la aceptación del admin. Permite acceso a la cuenta, pero no recibir pedidos.
- **ACTIVE:** Estado operativo en tiempo real. Significa que el repartidor está conectado a la aplicación, en línea y disponible.
- **Persona Trabajadora de Plataforma Digital:** Definición legal del repartidor durante su primer mes de trabajo.

---

## ⚙️ PORTAL ADMINISTRATIVO {#portal-administrativo}

### Filosofía: "Centro Neurálgico de Control Integral"
Portal de administración con acceso restringido para roles: SUPER_ADMIN, ADMIN, CONTADORA.

### Enrutamiento Completo - Portal Administrativo

#### Rutas de Acceso
- `/admin/login` - Acceso con verificación de roles
- `/admin/dashboard` - Dashboard principal con KPIs y alertas

#### Gestión de Usuarios
- `/admin/solicitudes` - Solicitudes de repartidores pendientes (proceso manual)
- `/admin/repartidores` - Gestión completa de conductores
- `/admin/repartidores/[id]` - Perfil individual del conductor
- `/admin/negocios` - Gestión de negocios
- `/admin/negocios/[id]` - Perfil individual del negocio

#### Operaciones
- `/admin/pedidos` - Monitoreo de órdenes
- `/admin/pedidos/[orderId]` - Detalle de pedido específico
- `/admin/billing` - Administración de créditos de negocios (proceso manual) FACTURACION
- `/admin/payroll` - Sistema de prestaciones y gestión de Actas IDSE (proceso manual) NOMINA

#### Integración Shipday
- `/admin/shipday` - Administración de Shipday con sincronización
- `/admin/shipday-monitoring` - Monitoreo en tiempo real de webhooks

#### Administración del Sistema
- `/admin/soporte` - Gestión de tickets de soporte (proceso manual)
- `/admin/incentives` - Programas de incentivos (proceso manual)
- `/admin/training` - Materiales de capacitación (proceso manual)
- `/admin/reports` - Reportes administrativos
- `/admin/ajustes` - Configuración global del sistema
- `/admin/management` - Gestión de usuarios administrativos
- `/admin/activity` - Registros de auditoría

### Funcionalidades Avanzadas

#### Funcionalidades Específicas para Rol CONTADORA
**Descarga de Reportes Financieros:**
- Página Nómina: Botón "Descargar Reporte de Cierre Mensual (.xlsx)".
- Perfil de Negocio: Botón "Descargar Historial de Créditos (.xlsx)".
- Cloud Functions: exportPayrollReport, exportCreditHistory.

**Gestión de Documentos:**
- Componente DocumentManager.jsx para registro de documentos externos.
- Input para enlace de Google Drive con descripción.
- Lista de dacumentos registrados por usuario.

**Gestión de Actas IDSE:**
- Acceso a la sección `/admin/payroll` para gestionar las Actas IDSE de los repartidores.
- Capacidad para seleccionar repartidores y subir manualmente los documentos de su alta en el IMSS (movimiento Tipo 08).
- Validación y registro del Acta IDSE como requisito indispensable para que un repartidor pueda recibir pedidos.

#### Perfil 360° del Repartidor (Detallado)
**Ubicación:** `/admin/repartidores/[id]`

**Sección 1: Información General**
- Campos: fullName, rfc, nss, curp, onboardingDate, status, imssStatus.

**Sección 2: Gestión Financiera**
- walletBalance: Visualización en tiempo real.
- driverDebtLimit: Campo editable para administradores.

**Sección 3: KPIs de Rendimiento**
- Visualización de datos del objeto kpis mediante gráficos y medidores.

**Sección 4: Gestión de Documentos IMSS**
- **Estado del Acta IDSE:** Indicador visual del estado del Acta IDSE (subida, pendiente, aprobada).
- **Subida de Documentos:** Funcionalidad para subir el Acta IDSE y otros documentos relacionados con el IMSS.
- **Historial de Movimientos IDSE:** Registro de todos los movimientos realizados en el sistema IDSE para el repartidor.

**Exportación de Reportes:** Botón "Exportar Reporte (.xlsx)" que genera archivo Excel con columnas:
- driverId, nombreCompleto, rfc, nss, curp.
- fechaDeAlta, estadoBeFast, estadoIMSS.
- saldoBilleteraActual, ingresoBrutoDelPeriodo.
- totalPedidosDelPeriodo, tasaAceptacionDelPeriodo.
- tasaEntregasATiempoDelPeriodo, distanciaTotalDelPeriodo.
- tiempoTotalEnEntregaDelPeriodo.
- estadoActaIDSE (subida, pendiente, aprobada).

---

## 🔄 FLUJOS OPERATIVOS DETALLADOS (Actual) {#flujos-operativos-detallados}

## **FLUJO COMPLETO DE PEDIDO**

### **Fase 1: Creación del Pedido**

### **FUENTES DE PEDIDOS Y CREACIÓN INICIAL**
1.1. **Fuente: Portal BeFast Delivery (Pagos en Efectivo)**

Características: Todos los pedidos se consideran pagados en efectivo para la lógica interna.
Flujo: El repartidor recauda el monto completo (costo del servicio y propina si es que aplica) y adquiere una deuda de 15 pesos con BeFast, registrada en pendingDebts.
Propinas en Efectivo: Si el negocio instruye cobrar una propina en efectivo, el repartidor la conserva íntegramente. El sistema la registra únicamente con fines informativos en el resumen de ganancias (walletTransactions).
Páginas Involucradas: Como en versiones previas (e.g., /delivery/new-order para creación).
Acciones y Funciones: createOrder crea en orders con Order # formato "BF-DLV-..." (e.g., BF-DLV-20251017-0ZG62X), envía a Shipday POST /orders.
Ejemplo Real Integrado: Payload llega a Shipday con orderNumber: "BF-DLV-20251017-0ZG62X", customer con coords implícitos, restaurant como pickup, items simples (e.g., "1 x Pedido de entrega"), payment_method: "CASH", delivery_fee: 55.00. Estados iniciales: 'CREATED' → 'PENDING'.
Cálculos Iniciales: Debitar crédito, estimar driving_duration basado en coords (e.g., de pickup/delivery locations).
Interacciones: CREATE/UPDATE en orders, etc.

1.2. **Fuente: Negocios de BeFast Market (Pagos con Tarjeta o en Efectivo)**

Pagos con Tarjeta: BeFast recibe el pago completo (costo del servicio y propina si es que aplica) directamente del cliente. Se transfiere al walletBalance del repartidor la ganancia neta (tarifa total del servicio menos 15 pesos) y la propina íntegra en transacciones separadas (CARD_ORDER_TRANSFER, TIP_CARD_TRANSFER).
Pagos en Efectivo: Flujo idéntico al Portal BeFast Delivery. El repartidor recauda el monto completo en efectivo, y se registra un adeudo de 15 pesos en pendingDebts.
Páginas Involucradas: Ninguna para creación (externa); solo monitoreo en /admin/*.
Acciones y Funciones: No creación directa; detectado via webhook (ver Fase 1 real abajo).
Ejemplo Real Integrado: Payload llega a Shipday con orderNumber: "#7", delivery_details descriptiva (e.g., "Casa naranja con buzón verde"), items complejos con extras en array (e.g., [{"text":"Elige tu carne","prices":[0],"answers":["Pura carne"],...}]), payment_method: "CASH", delivery_fee: 52.50. Timestamps N/A si fallido, pero en real procesa independientemente.
Cálculos Iniciales: Ninguno; se aplican post-registro en webhook.
Interacciones: CREATE reactivo en orders via webhook.

### **Fase 2: Asignación y Validación Crítica 360**
Cuando un repartidor acepta un pedido, se ejecuta una validación instantánea multicapa a través de la Cloud Function `validateOrderAssignment`:

- **Validación de Cumplimiento IMSS (IDSE) (Requisito Indispensable):** Como primer filtro, el sistema verifica que el repartidor tenga su Acta de alta en el IDSE válida y registrada. Si no se cumple, el pedido es rechazado automáticamente.
- **Validación de Reglas de Negocio:**
  - **Estatus Operativo:** Se verifica que el repartidor esté `ACTIVE` (conectado y disponible en la app).
  - **Validación Financiera (Condicional):** Para pedidos en Efectivo, se comprueba que la deuda (`pendingDebts`) sea menor al límite de deuda permitido, que por defecto es de $300.00 MXN (`driverDebtLimit`). Para pedidos con Tarjeta, esta validación no aplica.
  - **Cumplimiento General:** Se valida que la documentación (licencia, etc.) y la capacitación sigan vigentes.
- **Validación de Eficiencia (Vertex AI):**
  - El modelo de IA Logística de Vertex AI analiza la asignación, predice la ETA, evalúa el riesgo de retraso y calcula un Score de Asignación.
  - Si el score es bajo, la asignación es rechazada por ineficiente y se busca a otro repartidor.

### **Fase 3: Ejecución y Seguimiento**
Si toda la validación es exitosa, el repartidor es confirmado y procede con la entrega. El estado del pedido se actualiza en tiempo real (`IN_TRANSIT`, `DELIVERED`).

### **Fase 4: Finalización y Auditoría Financiera**
Al confirmar la entrega, la Cloud Function `processOrderCompletion` aplica la lógica financiera.

- **Auditoría "Doble Contador" (Vertex AI):** El modelo Gemini de Vertex AI recalcula la transacción de forma independiente. La transacción solo se escribe en la base de datos si ambos cálculos coinciden (`auditResult: "MATCH"`).
- **Retroalimentación al Ecosistema:** Los datos de la ruta completada se guardan para entrenar las futuras apps nativas BeFast GO y BeFast EATS.

---

## **FLUJO DERIVADO: GESTIÓN DE INCUMPLIMIENTOS Y REVISIÓN**

Este flujo se activa cuando un repartidor acumula incumplimientos, siguiendo el protocolo establecido en la Política de Gestión Algorítmica.

1. **Registro y Notificación de Incumplimiento:** Cada vez que ocurre un incumplimiento, el sistema lo registra y notifica al repartidor en un plazo de 24 horas, detallando el evento y la evidencia.
2. **Oportunidad de Aclaración:** El repartidor tiene un plazo de 2 días hábiles para presentar justificaciones o aclaraciones a través de los canales oficiales.
3. **Tercer Incumplimiento No Justificado:** Al registrar el tercer incumplimiento no justificado en 30 días, el sistema notifica al repartidor la intención de rescindir la relación laboral, con al menos 3 días de anticipación.
4. **Derecho a Audiencia y Revisión Formal:** El repartidor tiene 3 días hábiles para solicitar una revisión formal, presentando pruebas y solicitando una audiencia si lo desea.
5. **Revisión por Comité Interno:** Un comité analiza el caso en un plazo máximo de 5 días hábiles.
6. **Resolución Final:** El comité emite una resolución por escrito (confirmación o revocación de la rescisión) en un plazo no mayor a 7 días hábiles. Si es desfavorable, se informa al repartidor de su derecho a acudir a las autoridades laborales.

---

## **FLUJO DE NÓMINA Y PAGOS**

El sistema opera con dos ciclos: una "nómina semanal" para los ingresos por servicios y un proceso mensual para el cumplimiento legal.

### **Proceso Semanal: Cierre de Ingresos y Timbrado de Recibo (Nómina Semanal)**  
Este ciclo, ejecutado cada viernes, formaliza las ganancias por los servicios prestados.

- **Generación del Recibo de Pago:** El sistema genera un recibo detallado con el desglose de ganancias por tarjeta, propinas y adeudos de la semana.
- **Timbrado (CFDI):** Este recibo semanal se timbra ante el SAT como un CFDI de ingresos a través de un PAC y se envía al repartidor.

### **Proceso Mensual: Clasificación Laboral, Cumplimiento y Prestaciones**
Este ciclo se ejecuta al inicio de cada mes para cumplir con la normativa laboral.

- **Clasificación Laboral (Día 1 del mes):** La Cloud Function `monthlyDriverClassification` se activa. Tras finalizar el primer mes, se hace la evaluación de ingresos para determinar la clasificación final.
- **Cumplimiento IMSS (Días 2-5 del mes):** Para los "trabajadores cotizando", la función `generateMonthlyIDSE` genera el archivo para los movimientos afiliatorios y lo envía al sistema IDSE.
- **Transferencia de Prestaciones (Días 10-17 del mes):** La función `transferBenefitsOnly` transfiere únicamente las prestaciones de ley acumuladas a los "trabajadores cotizando".

---

## ⚙️ LÓGICA CENTRAL DEL SISTEMA {#logica-central-del-sistema}

## **LÓGICA CENTRAL DEL SISTEMA BEFAST**

### **Lógica de Clasificación Laboral y Estatus del Repartidor**
Esta lógica define el estatus legal y operativo de los repartidores dentro del sistema.

- **Estatus Inicial:** Cuando una persona se inscribe por primera vez y es aprobada, se convierte oficialmente en una Persona Trabajadora de Plataforma Digital. Este estatus se mantiene durante su primer mes de trabajo.
- **Evaluación de Ingresos (Fin del Primer Mes):** Tras finalizar el primer mes, se hace la evaluación de ingresos para determinar su clasificación permanente:
  - Si superó el salario mínimo de referencia ($8,364 MXN, después de aplicar el factor de exclusión), es clasificado como un trabajador cotizando en el régimen obligatorio del IMSS.
  - Si no alcanzó el salario mínimo, se le considera un trabajador independiente para efectos de seguridad social completa, aunque sigue cubierto por riesgos de trabajo durante el tiempo activo.

**Cálculo para la Clasificación:**
1. `Ingreso Neto = Ingreso Bruto Mensual - (Ingreso Bruto Mensual * Factor de Exclusión)`
2. `Resultado = Comparar Ingreso Neto vs. Salario Mínimo de Referencia ($8,364 MXN)`

**Factores de Exclusión (por tipo de vehículo):**
- Auto (4 ruedas): 36%
- Moto / Scooter (2 ruedas): 30%
- Bicicleta / Pie: 12%

**Tabla de Estatus del Repartidor:**

| Estatus en BD | Descripción | ¿Puede recibir pedidos? |
|---|---|---|
| `PENDING` | Solicitud enviada, en revisión. | No |
| `APPROVED` | Aprobado por admin, con acceso al portal. | No |
| `Persona Trabajadora de Plataforma Digital` | Estatus legal durante el primer mes. | Sí, si está `ACTIVE` en la app. |
| `Empleado Cotizante` | Clasificación post-primer mes (ingresos altos). | Sí, si está `ACTIVE` en la app. |
| `Trabajador Independiente` | Clasificación post-primer mes (ingresos bajos). | Sí, si está `ACTIVE` en la app. |
| `ACTIVE` | Estado operativo en tiempo real (conectado en la app). | Sí |
| `SUSPENDED` | Suspendido temporalmente por incumplimiento. | No |

### **Lógica de Validación de Pedidos y Repartidores**

Reglas y condiciones que se evalúan en tiempo real durante la asignación de un pedido.

**Validación Crítica 360° (`validateOrderAssignment`):**
- **IMSS Activo:** `imssStatus` debe ser `ACTIVO_COTIZANDO` o equivalente válido. (Requisito indispensable).
- **Estatus Operativo:** `status` del repartidor debe ser `ACTIVE`.
- **Validación Financiera (solo para efectivo):** `pendingDebts` < `driverDebtLimit` (default: $300.00 MXN).
- **Cumplimiento General:** Documentación y capacitación deben estar vigentes.
- **Score de Eficiencia IA:** `vertex_ai_assignment_score` debe ser mayor al umbral aceptable (ej. > 0.8).

**Lógica de Incumplimiento Reiterado:**
- **Regla:** `SI incumplimientos_documentados >= 3 DENTRO_DE 30_días_naturales ENTONCES iniciar_flujo_rescision`.
- **Se considera incumplimiento:**
  1. No realización o entrega incompleta de pedidos aceptados.
  2. Incumplimiento de instrucciones operativas (rutas, tiempos, protocolos).
  3. Falta de actualización de datos operativos (disponibilidad, geolocalización).

### **Lógica Financiera Central**

Reglas, modelos y cálculos que definen todas las transacciones monetarias del sistema.

**Modelo de Transacciones por Pedido:**

| Tipo de Pedido | Flujo de Dinero | Acción del Sistema |
|---|---|---|
| **Con Tarjeta** | BeFast cobra al cliente. | 1. Calcula ganancia neta del repartidor (Total pedido - $15).<br>2. Suma ganancia neta + propina al `walletBalance` del repartidor.<br>3. Registra transacciones `CARD_ORDER_TRANSFER` y `TIP_CARD_TRANSFER`. |
| **En Efectivo** | Repartidor cobra al cliente. | 1. No transfiere dinero al repartidor (ya lo tiene en efectivo).<br>2. Registra una deuda de $15 en `pendingDebts`.<br>3. Registra transacción `CASH_ORDER_ADEUDO`. |

**Control de Deuda (`pendingDebts`):**
- **Regla de Bloqueo:** `SI pendingDebts >= driverDebtLimit ENTONCES bloquear_asignacion_pedidos_efectivo`.
- **Recuperación Automática:** `SI walletBalance > 0 Y pendingDebts > 0 ENTONCES walletBalance -= pendingDebts Y pendingDebts = 0`.

**Tipos de Transacción (`walletTransactions`):**
- `CASH_ORDER_ADEUDO`: Registro de adeudo por pedido en efectivo.
- `CARD_ORDER_TRANSFER`: Transferencia de ganancias por pedido con tarjeta.
- `TIP_CARD_TRANSFER`: Transferencia de propina por pedido con tarjeta.
- `DEBT_PAYMENT`: Pago manual de deuda por parte del repartidor.
- `BENEFITS_TRANSFER`: Transferencia mensual de prestaciones de ley.

**Datos Bancarios Oficiales (para pagos y liquidaciones):**
- **Banco:** BBVA MÉXICO
- **Cuenta:** 0123456789
- **CLABE:** 012345678901234567
- **Beneficiario:** Rosio Arisema Uribe Macias

---

## 📊 KPIs Y MÉTRICAS DE DESEMPEÑO {#kpis-y-metricas-de-desempeno}

### Métricas de Desempeño Específicas

- **Calificación Mínima Esperada:** 4.2 estrellas basado en las valoraciones de los clientes. Debajo de este umbral, se activa un proceso de revisión y posible capacitación.

- **Otras Métricas Clave:**
  - Tasa de aceptación de pedidos: Mínimo 85%.
  - Entregas a tiempo: Mínimo 90%.
  - Distancia promedio por entrega: Optimizada por zona.
  - Tasa de cancelación: Máximo 5%.
  - Tiempo promedio de respuesta: Menos de 2 minutos.
  - Tiempo de entrega por zona.
  - Tasa de éxito de entregas.
  - Eficiencia de asignación de pedidos.
  - Retención de negocios y volumen de pedidos.
  - Retención de drivers, ingresos promedio y cumplimiento documental.

### Métricas Monitoreadas:
- Calificación promedio (mín. 4.2).
- Distancia total.
- Tasa de aceptación.
- Entregas a tiempo.

### Faltas Graves y Protocolos de Desactivación

#### Faltas Graves Incluyen:
- Fraude o robo comprobado.
- Acoso a clientes o personal.
- Multi-apping (usar otra app durante pedido activo de BeFast).
- Uso de sustancias prohibidas durante el servicio.
- Porte de armas sin autorización.
- Uso de cuenta por terceros no autorizados.
- Manipulación fraudulenta de la aplicación.

#### Protocolo de Desactivación:
- Desactivación inmediata de la cuenta.
- Notificación por email con motivos específicos.
- Proceso de revisión por comité de administración.
- Posibilidad de apelación dentro de los 5 días hábiles.
- Decisión final inapelable después de la revisión.

---

## ✅ VALIDACIÓN DE PEDIDOS {#validacion-de-pedidos}

### Flujo de Validación en Tiempo Real

**Momento de Validación**
Ocurre cuando el repartidor acepta el pedido en la app móvil, triggering un webhook automático a BeFast para validación instantánea. Estatus válidos del repartidor: ACTIVE, ACTIVO_COTIZANDO.

### Flujo de Asignación del Repartidor

1.  **Búsqueda del Repartidor:** Shipday ofrece el pedido a repartidores cercanos.
2.  **Aceptación del Repartidor:** Repartidor acepta en su app móvil.
3.  **Validación Crítica BeFast:** Sistema ejecuta validación automática verificando:
    -   **Validación de Cumplimiento IMSS (IDSE) (Requisito Indispensable):** Como primer filtro, el sistema verifica que el repartidor tenga su Acta de alta en el IDSE válida y registrada. Si no se cumple, el pedido es rechazado automáticamente.
    -   Estatus activo del repartidor (ACTIVE, ACTIVO_COTIZANDO).
    -   No esté suspendido.
    -   Cumplimiento de políticas financieras (pendingDebts < driverDebtLimit).
    -   Documentación vigente y aprobada.
    -   Cumplimiento de capacitación obligatoria.
4.  **Decisión Final:**
    -   Si es APROBADO: Repartidor confirmado oficialmente.
    -   Si es RECHAZADO: Sistema busca otro repartidor automáticamente.

### Criterios de Validación

**Estado del Repartidor:**
- Estatus válido: ACTIVE, ACTIVO_COTIZANDO.
- No suspendido temporalmente.

**Validación de Cumplimiento IMSS (IDSE):**
- Requisito indispensable: Acta IDSE válida y registrada en el sistema.
- Sin este documento, el repartidor no puede recibir pedidos.

**Validación Financiera:**
- Solo para pedidos en efectivo: Verificar pendingDebts < 300.00 MXN.
- Para pedidos con tarjeta: Sin restricción de deuda.

**Documentación y Cumplimiento:**
- Documentos vigentes y aprobados.
- Cumplimiento de capacitación obligatoria.

### Respuesta del Sistema

- **APPROVED:** Shipday confirma pedido al repartidor.
- **REJECTED:** Shipday quita pedido y lo ofrece a otros disponibles.

---
---

## **PARTE 2: VISIÓN ESTRATÉGICA Y HOJA DE RUTA (EL FUTURO)**

---

## 🚀 INTRODUCCIÓN A LA VISIÓN DE FUTURO {#introduccion-a-la-vision-de-futuro}

Habiendo establecido la robustez de la operación actual, BeFast no se conforma. La siguiente sección detalla la visión estratégica que transformará este ecosistema en un organismo autónomo e inteligente, capaz no solo de operar con eficiencia máxima, sino de construir y evolucionar su propio futuro.

Esta transición no es un proyecto a futuro; es una evolución activa que comienza el Día 1. Cada dato generado por la operación actual es el combustible que alimenta los motores de inteligencia artificial que definirán el BeFast del mañana.

---

## 🧠 ARQUITECTURA DEL ECOSISTEMA IMPULSADO POR IA {#arquitectura-del-ecosistema-impulsado-por-ia}

### Visión Ejecutiva: Un Ecosistema Autónomo desde el Día 1

Esta arquitectura describe a BeFast como un **ecosistema logístico completamente realizado e impulsado por IA desde su lanzamiento**. La estrategia no es una implementación progresiva, sino un despliegue total donde Vertex AI cumple un doble rol simultáneo:

1.  **Optimización y Blindaje Total:** Potencia al 100% la plataforma de gestión (Negocios, Repartidores, Admin) con todos los módulos de inteligencia, seguridad y eficiencia.
2.  **Construcción Acelerada por IA:** Utiliza cada dato generado por la operación para entrenar, desarrollar y desplegar en tiempo real dos aplicaciones nativas:
    *   **BeFast GO:** La app de logística y ruteo para repartidores (reemplazo de Shipday).
    *   **BeFast EATS:** La app de marketplace para el consumidor final (competidor de Didi/Rappi).

El sistema no "se prepara para el futuro"; **el sistema construye activamente su propio futuro con cada transacción.**

### Arquitectura del Ecosistema BeFast (Día 1)

```mermaid
graph TD
    subgraph "Vertex AI (Cerebro Central)"
        VA_CORE("Motor de IA y Modelos Fundacionales")
    end

    subgraph "Plataforma de Gestión (Operativa)"
        A[Portal BeFast Delivery (Negocios)]
        B[Portal BeFast Repartidores (Onboarding/Gestión)]
        C[Portal BeFast Admin (Control Total)]
    end

    subgraph "App Nativa de Logística (En construcción por IA)"
        GO[BeFast GO (App para Repartidores)]
    end

    subgraph "App Nativa de Consumo (En construcción por IA)"
        EATS[BeFast EATS (App para Clientes Finales)]
    end

    A -- "Genera Datos de Pedidos" --> VA_CORE
    B -- "Genera Datos de Repartidores/Rutas" --> VA_CORE
    C -- "Supervisa y Emite Comandos" --> VA_CORE

    VA_CORE -- "Entrena Modelo de Ruteo y Eficiencia" --> GO_MODELS
    VA_CORE -- "Entrena Modelo de Recomendación y Demanda" --> EATS_MODELS

    subgraph " "
        GO_MODELS("Modelos Logísticos")
        EATS_MODELS("Modelos de Marketplace")
    end

    GO_MODELS -- "Genera APIs Cognitivas de Logística" --> GO_API
    EATS_MODELS -- "Genera APIs Cognitivas de Consumo" --> EATS_API

    subgraph " "
        GO_API("APIs de BeFast GO")
        EATS_API("APIs de BeFast EATS")
    end

    GO_API -- "Construye y Actualiza App" --> GO
    EATS_API -- "Construye y Actualiza App" --> EATS
```

### Pilares de la Estrategia "Día 1"

**Pilar 1: OPERACIÓN CENTRAL BEFAST (Optimizada al 100%)**
La plataforma de gestión (portales Admin, Negocios, Repartidores) está completamente operativa con **todos los módulos de Vertex AI activados**, garantizando máxima seguridad, eficiencia y soporte.

**Pilar 2: DESARROLLO ACELERADO: BeFast GO (App de Logística)**
Cada dato de ruta, tiempo de entrega y comportamiento del repartidor capturado desde Shipday se utiliza en tiempo real para entrenar los **modelos fundacionales de logística** de BeFast. Vertex AI no solo aprende, sino que **genera y actualiza las APIs y componentes de la app `BeFast GO`**.

**Pilar 3: DESARROLLO ACELERADO: BeFast EATS (App de Consumo)**
Cada pedido, preferencia de cliente, y patrón de consumo de los negocios se utiliza para entrenar los **modelos fundacionales del marketplace**. Vertex AI genera las APIs de recomendación, búsqueda y pricing que construyen la app `BeFast EATS`.

---

## 🔄 FLUJOS DE DESARROLLO ACELERADO POR IA {#flujos-de-desarrollo-acelerado-por-ia}

### Flujo de Recolección y Envío de Datos a Vertex AI
El motor de datos fundamental que alimenta la inteligencia y el aprendizaje continuo del ecosistema.

*   **Activación Programada:** Un proceso programado (Google Cloud Scheduler) se ejecuta cada hora.
*   **Extracción de Datos:** La Cloud Function `collectDataForAI` consulta las colecciones clave de Firestore para extraer información relevante (`orders`, `drivers`, `customerProfiles`).
*   **Procesamiento y Envío:** Los datos se limpian, se anonimizan y se formatean en un esquema JSON optimizado. Se envían en lotes a un bucket de Google Cloud Storage (`gs://befast-ai-training-data/`), que actúa como la fuente de entrada para los pipelines de entrenamiento de Vertex AI.

### Lógica de Entrenamiento Continuo de Modelos Fundacionales
El ciclo de aprendizaje automático que permite al sistema volverse más inteligente con el tiempo.

*   **Disparador Automático:** Los pipelines de Vertex AI se configuran para activarse automáticamente cuando nuevos archivos de datos están disponibles en el bucket de GCS.
*   **Entrenamiento de Modelos Especializados:**
    *   **Modelo Logístico (`BeFast GO`):** Se entrena con datos de rutas, condiciones de tráfico, tiempos de entrega y rendimiento de repartidores para optimizar la asignación de pedidos, predecir ETAs y calcular la eficiencia de las rutas.
    *   **Modelo de Marketplace (`BeFast EATS`):** Se entrena con datos de clientes, negocios, pedidos y valoraciones para aprender patrones de demanda, preferencias de usuario y generar recomendaciones altamente personalizadas.
*   **Evaluación y Despliegue Continuo:** Después de cada entrenamiento, el sistema evalúa automáticamente el rendimiento del nuevo modelo. Si el nuevo modelo supera el rendimiento del modelo en producción, se despliega automáticamente como la nueva versión del API.

### Lógica de Detección Proactiva de Fraude y Anomalías
El sistema inmune del ecosistema, diseñado para identificar y mitigar riesgos en tiempo real.

*   **Análisis en Tiempo Real:** Un modelo de Vertex AI consume en tiempo real el flujo de eventos de pedidos y la telemetría de los repartidores a través de Pub/Sub.
*   **Patrones Monitoreados:** Cancelaciones sistemáticas, rutas anómalas, "multi-apping", patrones de calificación sospechosos.
*   **Generación de Alertas Automáticas:** Si el modelo detecta una anomalía con una alta probabilidad de fraude, crea automáticamente un ticket de soporte con prioridad `HIGH` en `/admin/soporte`, adjuntando toda la evidencia para su investigación inmediata.

---

## 🗺️ MAPA DE INTEGRACIÓN Y DEPENDENCIAS CRÍTICAS {#mapa-de-integracion-y-dependencias-criticas}

Entender estas dependencias es crucial porque si un componente falla, sabes exactamente qué más se verá afectado.

### Dependencias de Primer Nivel (Sistema no funciona sin estos)

**Shipday API**
Todo el sistema de distribución depende de Shipday. Sin Shipday:
- No se pueden asignar pedidos a repartidores.
- No hay tracking en tiempo real.
- No funcionan las notificaciones push a repartidores.
- No se puede validar la entrega.

Componentes que dependen directamente de Shipday:
- `validateOrderAssignment` - No puede aprobar repartidores.
- `createOrder` - No puede enviar pedidos.
- `handleShipdayWebhook` - No recibe actualizaciones.
- Portal de Negocios - No puede ver status de pedidos.

**Firebase Authentication**
Controla todo el acceso al sistema. Sin Firebase Auth:
- Nadie puede iniciar sesión.
- No se pueden crear nuevas cuentas.
- Los tokens expiran y no se renuevan.
- No hay control de roles.

**Firestore Database**
Es el cerebro del sistema. Sin Firestore:
- No hay persistencia de datos.
- No funcionan las validaciones.
- No se pueden procesar pagos.
- Todo el sistema está ciego.

### Dependencias de Segundo Nivel (Degradación parcial)

**Gmail SMTP Service**
Sin servicio de email:
- Nuevos usuarios no pueden verificar cuentas.
- No llegan notificaciones importantes.
- No se envían alertas de seguridad.
- Pero el sistema core sigue funcionando.

**Firebase Storage**
Sin almacenamiento:
- No se pueden subir documentos nuevos.
- Repartidores nuevos no pueden aplicar.
- Pero repartidores existentes siguen operando.

### Matriz de Impacto por Falla

| Componente Fallido | Impacto Inmediato | Funciones Afectadas | Workaround Disponible |
|-------------------|-------------------|---------------------|----------------------|
| Shipday API | CRÍTICO - Sistema inoperable | Todas las entregas | No hay alternativa |
| Firebase Auth | CRÍTICO - Sin acceso | Todos los logins | Cache temporal de tokens |
| Firestore | CRÍTICO - Sin datos | Todo el sistema | No hay alternativa |
| Gmail SMTP | ALTO - Sin verificaciones | Registros nuevos | Verificación manual por admin |
| Firebase Storage | MEDIO - Sin documentos | Aplicaciones nuevas | Upload manual por admin |
| Cloud Functions | ALTO - Sin automatización | Procesos automáticos | Ejecución manual |

---

## 🚨 FLUJOS DE ERROR Y RECUPERACIÓN {#flujos-de-error-y-recuperacion}

Esta sección es crítica porque muestra qué hacer cuando las cosas salen mal. Cada error tiene un plan de recuperación.

### Errores en Flujo de Registro

**Error: Email de verificación no llega**

Este es tu problema actual. El flujo de recuperación es:

1.  **Diagnóstico inmediato:**
    -   Verificar en Firestore que el código existe en `verificationCodes`.
    -   Revisar logs de Cloud Functions para errores de `generateVerificationCode`.
    -   Confirmar credenciales Gmail en variables de entorno.

2.  **Recuperación manual:**
    -   Admin puede ver el código en Firestore.
    -   Comunicar código al usuario por WhatsApp.
    -   Verificar manualmente en `/admin/negocios`.

3.  **Solución permanente:**
    -   Implementar reintentos automáticos.
    -   Agregar servicio de email de respaldo.
    -   Notificar a admin si falla 3 veces.

**Error: Registro de repartidor se queda cargando**

Flujo de diagnóstico y recuperación:

1.  **Identificar punto de falla:**
    ```javascript
    // Agregar estos logs en step-5
    console.log('1. Iniciando envío');
    console.log('2. Datos recopilados:', formData);
    console.log('3. Llamando Cloud Function');
    console.log('4. Respuesta:', response);
    ```

2.  **Recuperación:**
    -   Si falla upload de documentos: Reintentar con exponential backoff.
    -   Si falla Cloud Function: Guardar en localStorage y reintentar.
    -   Si falla todo: Botón "Guardar borrador" y completar después.

### Errores en Flujo de Pedidos

**Error: Validación rechaza repartidores válidos**

Diagnóstico estructurado:

1.  **Revisar validationLogs** para ver razones de rechazo.
2.  **Verificar sincronización** entre Firestore y Shipday.
3.  **Validar datos del repartidor:**
    -   Status correcto.
    -   Deuda dentro del límite.
    -   Documentos aprobados.

Recuperación:
- Admin puede forzar aprobación manual.
- Sistema reintenta con otro repartidor automáticamente.
- Notificación al repartidor sobre el problema.

**Error: Pedido perdido entre sistemas**

Plan de recuperación por capas:

1.  **Capa 1 - Verificación:**
    -   Existe en Firestore pero no en Shipday → Reenviar.
    -   Existe en Shipday pero no en Firestore → Importar.
    -   No existe en ninguno → Recrear desde logs.

2.  **Capa 2 - Recuperación:**
    -   Reembolsar crédito al negocio.
    -   Notificar al cliente.
    -   Crear pedido de compensación.

### Errores Financieros

**Error: Saldo incorrecto en billetera**

Proceso de auditoría y corrección:

1.  **Auditoría de transacciones:**
    ```sql
    // Pseudo-query para verificar
    SELECT SUM(amount) FROM walletTransactions 
    WHERE driverId = X AND type != 'CORRECTION'
    // Debe coincidir con walletBalance
    ```

2.  **Identificar discrepancia:**
    -   Transacciones duplicadas.
    -   Transacciones faltantes.
    -   Cálculos incorrectos.

3.  **Corrección:**
    -   Crear transacción tipo `BALANCE_CORRECTION`.
    -   Documentar razón en metadata.
    -   Notificar al repartidor.

---

## 📈 MONITOREO Y ALERTAS RECOMENDADAS {#monitoreo-y-alertas-recomendadas}

Para mantener estos flujos funcionando, necesitas visibilidad constante. Aquí está lo que debes monitorear:

### Métricas Críticas en Tiempo Real

**Salud del Sistema Principal**
- Latencia de Shipday API (debe ser < 2 segundos).
- Tasa de éxito de validaciones (debe ser > 85%).
- Tiempo de procesamiento de pedidos (< 1 minuto total).
- Disponibilidad de Cloud Functions (> 99.9%).

**Métricas de Negocio**
- Pedidos creados por hora.
- Tasa de conversión (pedidos completados/iniciados).
- Tiempo promedio de entrega por zona.
- Repartidores activos en tiempo real.

**Métricas Financieras**
- Total de deudas pendientes del sistema.
- Saldo promedio de billeteras.
- Créditos vendidos vs consumidos.
- Transacciones procesadas por día.

### Alertas Automáticas Configuradas

**Prioridad CRÍTICA (Notificación inmediata)**
```javascript
// Configurar en Cloud Functions
if (shipdayResponseTime > 5000) {
  sendAlert('CRITICAL', 'Shipday API lento o caído');
}

if (validationFailureRate > 0.2) {
  sendAlert('CRITICAL', 'Alta tasa de rechazos en validación');
}

if (firebaseAuthErrors > 10) {
  sendAlert('CRITICAL', 'Problemas de autenticación masivos');
}
```

**Prioridad ALTA (Notificación en 5 minutos)**
- Repartidor con deuda > 250 (cerca del límite).
- Negocio con < 5 créditos.
- Más de 5 pedidos en estado SEARCHING por > 10 minutos.
- Error rate de cualquier Cloud Function > 5%.

**Prioridad MEDIA (Resumen cada hora)**
- Documentos por vencer en próximos 7 días.
- Repartidores inactivos por > 3 días.
- Pagos manuales pendientes de verificación.
- Clasificación mensual próxima.

---
---

## **PARTE 3: BLUEPRINT TÉCNICO COMPLETO (EL CÓMO)**

---

## 🗄️ BASE DE DATOS Y CONFIGURACIÓN TÉCNICA {#base-de-datos-y-configuracion-tecnica}

# Estructura Completa de Colecciones Firestore - BeFast

## Colecciones Principales

### 1. `users`
**Descripción:** Almacena datos de todos los usuarios del sistema (negocios, repartidores, admins, contadora, soporte).

**Campos:**
- `userId` (string, clave única)
- `name` (string)
- `email` (string, único)
- `role` (string, valores: "BUSINESS", "DRIVER", "ADMIN", "ACCOUNTANT", "SUPPORT", "SUPER_ADMIN")
- `permissions` (array de strings)
- `status` (string, valores: "ACTIVE", "PENDING", "SUSPENDED")
- `type` (string, valores: "business", "driver", "admin")
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Subcolecciones:**
- `notifications`
- `activityLogs`
- `settings`
- `verificationCodes`
- `passwordResets`
- `supportTickets`

---

### 2. `businesses`
**Descripción:** Almacena datos de negocios registrados en la plataforma.

**Campos:**
- `businessId` (string, clave única)
- `uid` (string, referencia a Firebase UID)
- `name` (string)
- `businessName` (string)
- `contactName` (string)
- `email` (string, único)
- `phone` (string)
- `address` (string)
- `coordinates` (objeto: {lat: number, lng: number})
- `rfc` (string)
- `status` (string, valores: "ACTIVE", "PENDING", "SUSPENDED")
- `credits` (number)
- `availableCredits` (number)
- `totalCreditsUsed` (number)
- `totalOrders` (number)
- `totalSpent` (number)
- `defaultPickupAddress` (string)
- `savedAddresses` (array de objetos)
- `creditTransactions` (array de objetos)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Subcolecciones:**
- `orders`
- `billing`
- `credits`
- `settings`
- `notifications`
- `documents`
- `supportTickets`
- `kpis`
- `reports`

---

### 3. `orders`
**Descripción:** Pedidos globales - fuente de verdad del sistema.

**Campos:**
- `orderId` (string, clave única)
- `businessId` (string, referencia a businesses)
- `driverId` (string, referencia a drivers, nullable)
- `shipdayOrderId` (string, ID en Shipday para sincronización)
- `source` (string, valores: "BEFAST", "SHIPDAY")
- `customer` (objeto: {name, phone, address, coordinates})
- `pickup` (objeto: {name, address, coordinates})
- `paymentMethod` (string, valores: "CASH", "CARD")
- `deliveryFee` (number)
- `tip` (number, nullable)
- `totalAmount` (number)
- `totalOrderValue` (number)
- `amountToCollect` (number)
- `status` (string, valores: "PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED")
- `deliveryInstructions` (string, nullable)
- `estimatedDeliveryTime` (timestamp)
- `deliveryTime` (number)
- `rating` (number, nullable)
- `trackingLink` (string)
- `validationResult` (string, valores: "APPROVED", "REJECTED", nullable)
- `rejectionReason` (string, nullable)
- `createdAt` (timestamp)
- `assignedAt` (timestamp, nullable)
- `deliveredAt` (timestamp, nullable)
- `completedAt` (timestamp, nullable)
- `updatedAt` (timestamp)

**Subcolecciones:**
- `timeline`
- `transactions`
- `notifications`
- `logs`
- `reviews`
- `supportTickets`

---

### 4. `drivers`
**Descripción:** Repartidores registrados con información completa.

**Campos:**
- `driverId` (string, clave única)
- `uid` (string, referencia a Firebase UID)
- `email` (string, único)
- `fullName` (string)
- `phone` (string)
- `curp` (string)
- `rfc` (string)
- `nss` (string)
- `address` (string)
- `photoUrl` (string, URL de foto de perfil)
- `signature` (string, URL de firma digital)
- `vehicle` (objeto: {type, brand, model, year, plates, color})
- `bank` (objeto: {accountNumber, bankName, accountHolder, clabe})
- `status` (string, valores: "ACTIVE", "ACTIVO_COTIZANDO", "INACTIVE", "SUSPENDED")
- `walletBalance` (number)
- `pendingDebts` (number)
- `driverDebtLimit` (number)
- `ingreso_bruto_mensual` (number)
- `antiquityStartDate` (timestamp)
- `lastServiceDate` (timestamp)
- `annualWorkedHours` (number)
- `isActive` (boolean)
- `isActiveInShipday` (boolean)
- `shipdayDriverId` (string)
- `imssStatus` (string, valores: "REQUIRES_RISK_INSURANCE", "ACTIVO_COTIZANDO")
- `currentClassification` (string, valores: "Empleado Cotizante", "Trabajador Independiente")
- `onboardingDate` (timestamp)
- `approvedAt` (timestamp, nullable)
- `debtPaymentsCount` (number)
- `lastDebtPaymentDate` (timestamp, nullable)
- `performanceScore` (number)
- `emergencyContacts` (array de objetos: {name, phone})
- `trainingCompleted` (boolean)
- `appVersion` (string)
- `lastLogin` (timestamp)
- `idseStatus` (string, valores: "PENDING", "UPLOADED", "APPROVED")
- `idseUploadDate` (timestamp, nullable)
- `idseApprovalDate` (timestamp, nullable)
- `idseDocumentUrl` (string, nullable)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Subcolecciones:**
- `walletTransactions`
- `documents`
- `payroll`
- `kpis`
- `notifications`
- `beneficiaries`
- `supportTickets`
- `activityLogs`
- `training`
- `incidents`
- `legal`
- `deviceTokens`
- `blockedReasons`
- `documentsStatus`
- `idseDocuments`

---

### 5. `walletTransactions`
**Descripción:** Transacciones financieras globales (evidencias administrativas).

**Campos:**
- `transactionId` (string, clave única)
- `driverId` (string, referencia a drivers)
- `orderId` (string, referencia a orders, nullable)
- `amount` (number)
- `type` (string, valores: "CASH_ORDER_ADEUDO", "CARD_ORDER_TRANSFER", "TIP_CARD_TRANSFER", "DEBT_PAYMENT", "BENEFITS_TRANSFER", "BENEFITS_PTU_TRANSFER", "DEDUCTION_OTHER")
- `source` (string, valores: "INCENTIVE", "TIP", "ORDER")
- `description` (string)
- `previousBalance` (number)
- `newBalance` (number)
- `timestamp` (timestamp)
- `processedBy` (string)
- `metadata` (objeto con información adicional)

---

### 6. `clasificaciones_mensuales`
**Descripción:** Clasificaciones laborales mensuales para cumplimiento IMSS/SAT.

**Campos:**
- `clasificacionId` (string, clave única)
- `driverId` (string, referencia a drivers)
- `month` (string, formato "YYYY-MM")
- `grossIncome` (number)
- `exclusionPercentage` (number)
- `exclusionAmount` (number)
- `netIncome` (number)
- `minimumWageReference` (number)
- `classification` (string)
- `imssStatus` (string)
- `taxRetentions` (objeto: {isrRetention, imssWorkerContribution, imssEmployerContribution, totalDeductions})
- `benefits` (objeto: {vacationDays, vacationBonus, christmasBonus, totalBenefits})
- `idseFileGenerated` (boolean)
- `cfdiGenerated` (boolean)
- `cfdiUuid` (string)
- `benefitsTransferred` (boolean)
- `processedAt` (timestamp)
- `processedBy` (string)

---

### 7. `notifications`
**Descripción:** Notificaciones globales del sistema.

**Campos:**
- `notificationId` (string, clave única)
- `userId` (string, referencia a users)
- `userType` (string, valores: "BUSINESS", "DRIVER", "ADMIN")
- `title` (string)
- `message` (string)
- `type` (string, valores: "INFO", "SUCCESS", "WARNING", "ERROR")
- `actionType` (string, valores: "REDIRECT", "MODAL")
- `actionData` (objeto con parámetros de acción)
- `read` (boolean)
- `readAt` (timestamp, nullable)
- `createdAt` (timestamp)
- `expiresAt` (timestamp, nullable)

---

### 8. `systemLogs`
**Descripción:** Bitácora de eventos y auditoría global.

**Campos:**
- `logId` (string, clave única)
- `logType` (string, valores: "ERROR", "WARNING", "INFO", "AUDIT")
- `module` (string, valores: "AUTH", "ORDERS", "PAYMENTS")
- `message` (string)
- `details` (objeto)
- `userId` (string, nullable)
- `userType` (string, nullable)
- `ip` (string, nullable)
- `userAgent` (string, nullable)
- `createdAt` (timestamp)

---

### 9. `auditLogs`
**Descripción:** Auditoría específica de acciones críticas.

**Campos:**
- `auditId` (string, clave única)
- `actionType` (string)
- `entityType` (string)
- `entityId` (string)
- `performedBy` (string)
- `changes` (objeto con estado anterior y posterior)
- `reason` (string)
- `ipAddress` (string)
- `timestamp` (timestamp)

---

### 10. `mailQueue`
**Descripción:** Cola de correos pendientes de envío.

**Campos:**
- `queueId` (string, clave única)
- `recipient` (string)
- `template` (string, referencia a emailTemplates)
- `data` (objeto con variables del template)
- `status` (string, valores: "PENDING", "SENT", "FAILED")
- `retries` (number)
- `createdAt` (timestamp)
- `sentAt` (timestamp, nullable)

---

### 11. `supportTickets`
**Descripción:** Tickets de soporte globales.

**Campos:**
- `ticketId` (string, clave única)
- `ticketNumber` (string)
- `userId` (string, referencia a users)
- `userType` (string, valores: "BUSINESS", "DRIVER")
- `subject` (string)
- `description` (string)
- `category` (string, valores: "TECHNICAL", "FINANCIAL", "OPERATIONAL")
- `priority` (string, valores: "LOW", "MEDIUM", "HIGH", "URGENT")
- `status` (string, valores: "OPEN", "IN_PROGRESS", "CLOSED")
- `assignedTo` (string, nullable)
- `assignedAt` (timestamp, nullable)
- `resolution` (string, nullable)
- `resolvedAt` (timestamp, nullable)
- `resolvedBy` (string, nullable)
- `attachments` (array de strings con URLs)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

---

### 12. `payroll`
**Descripción:** Nómina global del sistema.

**Campos:**
- `payrollId` (string, clave única)
- `driverId` (string, referencia a drivers)
- `month` (string, formato "YYYY-MM")
- `salary` (number)
- `deductions` (number)
- `benefits` (number)
- `cfdi` (string)
- `cfdiUuid` (string)
- `transferAmount` (number)
- `transferDate` (timestamp, nullable)
- `status` (string, valores: "PENDING", "PROCESSED", "TRANSFERRED")
- `createdAt` (timestamp)
- `processedAt` (timestamp, nullable)

---

### 13. `documents`
**Descripción:** Documentos fiscales y legales globales.

**Campos:**
- `documentId` (string, clave única)
- `userId` (string, referencia a users)
- `userType` (string, valores: "BUSINESS", "DRIVER")
- `type` (string, valores: "CFDI", "INE", "LICENSE", "INSURANCE", "CONTRACT")
- `url` (string)
- `driveUrl` (string, nullable)
- `description` (string, nullable)
- `status` (string, valores: "PENDING", "APPROVED", "REJECTED")
- `expirationDate` (timestamp, nullable)
- `createdAt` (timestamp)
- `approvedAt` (timestamp, nullable)
- `approvedBy` (string, nullable)

---

### 14. `training`
**Descripción:** Materiales y registros de capacitación.

**Campos:**
- `trainingId` (string, clave única)
- `driverId` (string, referencia a drivers)
- `materialType` (string, valores: "VIDEO", "DOCUMENT", "QUIZ")
- `materialUrl` (string)
- `title` (string)
- `description` (string)
- `progress` (number, 0-100)
- `completed` (boolean)
- `score` (number, nullable)
- `timeSpent` (number, en minutos)
- `startedAt` (timestamp)
- `completedAt` (timestamp, nullable)

---

### 15. `reports`
**Descripción:** Reportes administrativos y financieros.

**Campos:**
- `reportId` (string, clave única)
- `type` (string, valores: "FINANCIAL", "OPERATIONAL", "PAYROLL", "DRIVER_PERFORMANCE")
- `scope` (string, valores: "GLOBAL", "DRIVER", "BUSINESS")
- `entityId` (string, nullable)
- `data` (objeto con datos del reporte)
- `format` (string, valores: "JSON", "XLSX", "PDF")
- `fileUrl` (string, nullable)
- `generatedBy` (string)
- `generatedAt` (timestamp)
- `parameters` (objeto con parámetros usados)

---

### 16. `incentives`
**Descripción:** Programas de incentivos y bonificaciones.

**Campos:**
- `incentiveId` (string, clave única)
- `driverId` (string, referencia a drivers)
- `campaignId` (string, nullable)
- `amount` (number)
- `description` (string)
- `type` (string, valores: "BONUS", "INCENTIVE", "PENALTY")
- `reason` (string)
- `applied` (boolean)
- `appliedAt` (timestamp, nullable)
- `createdAt` (timestamp)
- `createdBy` (string)

---

### 17. `activity`
**Descripción:** Registros de actividad global.

**Campos:**
- `activityId` (string, clave única)
- `userId` (string, nullable)
- `userType` (string, nullable)
- `action` (string)
- `description` (string)
- `entityType` (string, nullable)
- `entityId` (string, nullable)
- `metadata` (objeto)
- `timestamp` (timestamp)

---

### 18. `roles`
**Descripción:** Definición de roles y permisos del sistema.

**Campos:**
- `roleId` (string, clave única)
- `name` (string, valores: "BUSINESS", "DRIVER", "ADMIN", "ACCOUNTANT", "SUPPORT", "SUPER_ADMIN")
- `description` (string)
- `permissions` (array de strings)
- `isDefault` (boolean)
- `isActive` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

---

### 19. `metrics`
**Descripción:** Métricas globales del sistema.

**Campos:**
- `metricId` (string, clave única)
- `scope` (string, valores: "GLOBAL", "BUSINESS", "DRIVER", "ORDER")
- `entityId` (string, referencia según scope)
- `metric` (string)
- `value` (number)
- `unit` (string, nullable)
- `period` (string, formato "YYYY-MM" o "YYYY-MM-DD")
- `calculatedAt` (timestamp)
- `metadata` (objeto)

---

### 20. `emailTemplates`
**Descripción:** Plantillas de correo del sistema.

**Campos:**
- `templateId` (string, clave única)
- `name` (string)
- `subject` (string)
- `content` (string)
- `variables` (array de strings)
- `type` (string, valores: "NOTIFICATION", "WELCOME", "INVOICE", "REMINDER")
- `isActive` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

---

### 21. `verificationCodes`
**Descripción:** Códigos de verificación del sistema.

**Campos:**
- `codeId` (string, clave única)
- `code` (string)
- `userId` (string, referencia a users)
- `type` (string, valores: "EMAIL", "PHONE", "PASSWORD_RESET")
- `used` (boolean)
- `expiresAt` (timestamp)
- `createdAt` (timestamp)
- `usedAt` (timestamp, nullable)

---

### 22. `passwordResets`
**Descripción:** Solicitudes de recuperación de contraseña.

**Campos:**
- `resetId` (string, clave única)
- `token` (string)
- `userId` (string, referencia a users)
- `used` (boolean)
- `expiresAt` (timestamp)
- `createdAt` (timestamp)
- `usedAt` (timestamp, nullable)

---

### 23. `settings`
**Descripción:** Configuraciones globales del sistema.

**Campos:**
- `settingId` (string, clave única)
- `category` (string, valores: "FINANCIAL", "OPERATIONAL", "LEGAL", "NOTIFICATION")
- `name` (string)
- `value` (string o JSON)
- `type` (string, valores: "STRING", "NUMBER", "BOOLEAN", "JSON")
- `description` (string)
- `isEditable` (boolean)
- `updatedAt` (timestamp)
- `updatedBy` (string)

---

## Subcolecciones Detalladas

### drivers/{driverId}/idseDocuments
- `documentId` (string)
- `documentType` (string, valores: "ACTA_IDSE", "MOVIMIENTO_IDSE")
- `documentUrl` (string)
- `uploadDate` (timestamp)
- `status` (string, valores: "PENDING", "APPROVED", "REJECTED")
- `movementType` (string, valores: "08", "55", "54", "02")
- `approvedBy` (string, nullable)
- `approvalDate` (timestamp, nullable)
- `rejectionReason` (string, nullable)

---

## ⚙️ CLOUD FUNCTIONS PRINCIPALES {#cloud-functions-principales}

### validateOrderAssignment
```javascript
/**
 * Valida la asignación de un pedido a un repartidor
 * Verifica el estado del repartidor, documentación y cumplimiento de políticas
 */
exports.validateOrderAssignment = functions.https.onCall(async (data, context) => {
  const { orderId, driverId } = data;
  
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  try {
    // Obtener información del pedido
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return { result: 'REJECTED', reason: 'Pedido no encontrado' };
    }
    const order = orderDoc.data();
    
    // Obtener información del repartidor
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    if (!driverDoc.exists) {
      return { result: 'REJECTED', reason: 'Repartidor no encontrado' };
    }
    const driver = driverDoc.data();
    
    // VALIDACIÓN CRÍTICA: Acta IDSE
    if (driver.idseStatus !== 'APPROVED') {
      return { 
        result: 'REJECTED', 
        reason: 'Repartidor no cuenta con Acta IDSE aprobada' 
      };
    }
    
    // Validar estado del repartidor
    if (driver.status !== 'ACTIVE' && driver.status !== 'ACTIVO_COTIZANDO') {
      return { 
        result: 'REJECTED', 
        reason: `Repartidor con estado inválido: ${driver.status}` 
      };
    }
    
    // Validación financiera para pedidos en efectivo
    if (order.paymentMethod === 'CASH' && driver.pendingDebts >= driver.driverDebtLimit) {
      return { 
        result: 'REJECTED', 
        reason: 'Repartidor excede límite de deuda para pedidos en efectivo' 
      };
    }
    
    // Validación de documentación
    const docsSnapshot = await db.collection('drivers')
      .doc(driverId)
      .collection('documents')
      .where('status', '!=', 'APPROVED')
      .get();
    
    if (!docsSnapshot.empty) {
      return { 
        result: 'REJECTED', 
        reason: 'Repartidor con documentación pendiente de aprobar' 
      };
    }
    
    // Validación de capacitación
    if (!driver.trainingCompleted) {
      return { 
        result: 'REJECTED', 
        reason: 'Repartidor no ha completado capacitación obligatoria' 
      };
    }
    
    // Si pasa todas las validaciones, aprobar asignación
    await db.collection('orders').doc(orderId).update({
      driverId: driverId,
      status: 'ASSIGNED',
      assignedAt: admin.firestore.Timestamp.now(),
      validationResult: 'APPROVED'
    });
    
    return { result: 'APPROVED' };
    
  } catch (error) {
    console.error('Error en validateOrderAssignment:', error);
    return { 
      result: 'REJECTED', 
      reason: 'Error en el proceso de validación' 
    };
  }
});
```

### uploadIdseDocument
```javascript
/**
 * Sube y procesa el Acta IDSE de un repartidor
 * Actualiza el estado del repartidor para permitirle recibir pedidos
 */
exports.uploadIdseDocument = functions.https.onCall(async (data, context) => {
  const { driverId, documentUrl, movementType } = data;
  
  // Verificar autenticación y rol
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const userRecord = await admin.auth().getUser(context.auth.uid);
  const userRole = userRecord.customClaims?.role;
  
  if (userRole !== 'ADMIN' && userRole !== 'ACCOUNTANT' && userRole !== 'SUPER_ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Sin permisos para esta acción');
  }
  
  try {
    // Verificar que el repartidor existe
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    if (!driverDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Repartidor no encontrado');
    }
    
    // Crear registro del documento IDSE
    const idseDocRef = await db.collection('drivers')
      .doc(driverId)
      .collection('idseDocuments')
      .add({
        documentType: movementType === '08' ? 'ACTA_IDSE' : 'MOVIMIENTO_IDSE',
        documentUrl: documentUrl,
        uploadDate: admin.firestore.Timestamp.now(),
        status: 'PENDING',
        movementType: movementType,
        approvedBy: null,
        approvalDate: null,
        rejectionReason: null
      });
    
    // Actualizar estado del repartidor
    await db.collection('drivers').doc(driverId).update({
      idseStatus: 'UPLOADED',
      idseUploadDate: admin.firestore.Timestamp.now(),
      idseDocumentUrl: documentUrl,
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    // Si es un movimiento Tipo 08 (Alta inicial), crear notificación
    if (movementType === '08') {
      await db.collection('notifications').add({
        userId: driverId,
        userType: 'DRIVER',
        title: 'Acta IDSE Recibida',
        message: 'Hemos recibido tu Acta IDSE. Está en proceso de verificación.',
        type: 'INFO',
        read: false,
        createdAt: admin.firestore.Timestamp.now()
      });
    }
    
    return { 
      success: true, 
      documentId: idseDocRef.id,
      message: 'Documento IDSE subido correctamente' 
    };
    
  } catch (error) {
    console.error('Error en uploadIdseDocument:', error);
    throw new functions.https.HttpsError('internal', 'Error al subir documento IDSE');
  }
});
```

### approveIdseDocument
```javascript
/**
 * Aprueba un documento IDSE y habilita al repartidor para recibir pedidos
 */
exports.approveIdseDocument = functions.https.onCall(async (data, context) => {
  const { driverId, documentId } = data;
  
  // Verificar autenticación y rol
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const userRecord = await admin.auth().getUser(context.auth.uid);
  const userRole = userRecord.customClaims?.role;
  
  if (userRole !== 'ADMIN' && userRole !== 'ACCOUNTANT' && userRole !== 'SUPER_ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Sin permisos para esta acción');
  }
  
  try {
    // Verificar que el documento existe
    const docSnapshot = await db.collection('drivers')
      .doc(driverId)
      .collection('idseDocuments')
      .doc(documentId)
      .get();
    
    if (!docSnapshot.exists) {
      throw new functions.https.HttpsError('not-found', 'Documento IDSE no encontrado');
    }
    
    // Actualizar estado del documento
    await db.collection('drivers')
      .doc(driverId)
      .collection('idseDocuments')
      .doc(documentId)
      .update({
        status: 'APPROVED',
        approvedBy: context.auth.uid,
        approvalDate: admin.firestore.Timestamp.now()
      });
    
    // Actualizar estado del repartidor
    await db.collection('drivers').doc(driverId).update({
      idseStatus: 'APPROVED',
      idseApprovalDate: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    // Crear notificación para el repartidor
    await db.collection('notifications').add({
      userId: driverId,
      userType: 'DRIVER',
      title: 'Acta IDSE Aprobada',
      message: 'Tu Acta IDSE ha sido aprobada. Ya puedes recibir pedidos.',
      type: 'SUCCESS',
      read: false,
      createdAt: admin.firestore.Timestamp.now()
    });
    
    return { 
      success: true, 
      message: 'Documento IDSE aprobado correctamente' 
    };
    
  } catch (error) {
    console.error('Error en approveIdseDocument:', error);
    throw new functions.https.HttpsError('internal', 'Error al aprobar documento IDSE');
  }
});
```

---

## 🔌 INTEGRACIONES EXTERNAS {#integraciones-externas}

### Shipday API
- **Propósito:** Motor de distribución y asignación de pedidos.
- **Endpoint Principal:** https://api.shipday.com/orders
- **Webhook URL:** https://tudominio.com/api/shipday/webhook
- **Autenticación:** Bearer Token (SHIPDAY_API_KEY)

### Stripe Connect
- **Propósito:** Procesamiento de pagos y transferencias a repartidores.
- **Uso:** Compra de créditos, transferencia de ganancias y prestaciones.

### Facturapi (PAC)
- **Propósito:** Generación y timbrado de CFDI para nómina y comprobantes fiscales.
- **Uso:** Recibos semanales, nómina mensual, facturas para negocios.

### Vertex AI
- **Propósito:** Procesamiento de documentos con IA, extracción de datos y validación.
- **Modelos Utilizados:** Vision API para OCR, Gemini Pro para estructuración.

---

## 🧪 GUÍA DE IMPLEMENTACIÓN Y TESTING {#guia-de-implementacion-y-testing}

Para asegurarte de que todos estos flujos funcionen correctamente, aquí está tu checklist de implementación:

### Testing del Flujo Completo de Pedido

**Preparación del ambiente de prueba:**
1. Crear negocio de prueba con 10 créditos.
2. Crear 2 repartidores de prueba (uno con deuda alta, otro sin deuda).
3. Configurar Shipday en modo sandbox.

**Casos de prueba esenciales:**

*Caso 1: Camino feliz completo*
- Negocio crea pedido con pago tarjeta.
- Repartidor sin deuda acepta.
- Validación aprueba.
- Completar entrega.
- Verificar actualización financiera correcta.

*Caso 2: Rechazo por deuda*
- Crear pedido con pago efectivo.
- Repartidor con deuda > 300 intenta aceptar.
- Verificar rechazo automático.
- Confirmar que Shipday busca otro repartidor.
- Verificar logs de validación.

*Caso 3: Recuperación de errores*
- Simular timeout de Shipday.
- Verificar reintento automático.
- Confirmar que pedido no se pierde.
- Validar que crédito no se consume doble.

### Testing del Flujo de Registro

**Repartidor - Pruebas end-to-end:**
1. Completar registro con datos válidos.
2. Verificar creación en Firestore.
3. Simular aprobación administrativa.
4. Confirmar creación en Shipday.
5. Verificar login exitoso.
6. Confirmar aparición en lista de disponibles.

**Negocio - Pruebas de verificación:**
1. Registrar con email válido.
2. Verificar generación de código.
3. Probar código incorrecto (debe fallar).
4. Probar código correcto (debe activar).
5. Verificar login post-activación.
6. Confirmar créditos iniciales en 0.

### Scripts de Monitoreo Sugeridos

**Script 1: Health Check Completo**
```javascript
// Ejecutar cada 5 minutos
async function systemHealthCheck() {
  const checks = {
    firestore: await checkFirestoreConnection(),
    auth: await checkFirebaseAuth(),
    shipday: await checkShipdayAPI(),
    email: await checkEmailService(),
    storage: await checkFirebaseStorage()
  };
  
  const failures = Object.entries(checks)
    .filter(([_, status]) => !status)
    .map(([service]) => service);
  
  if (failures.length > 0) {
    await sendUrgentAlert(`Servicios caídos: ${failures.join(', ')}`);
  }
  
  return checks;
}
```

---

## 📞 INFORMACIÓN DE CONTACTO {#informacion-de-contacto}

- **WhatsApp Soporte:** https://wa.me/5213121905494
- **Email Soporte:** soporte@befastapp.com.mx
- **Documentos Fiscales:** documentos@befastapp.com.mx
- **Apelaciones:** revisiones@befastapp.com.mx
- **Facebook:** https://www.facebook.com/befastmarket1/
- **Instagram:** https://www.instagram.com/befastmarket/

---

## 🏁 CONCLUSIÓN {#conclusion}

BeFast representa una solución integral y formal para el mercado de entregas en México, combinando tecnología de punta con cumplimiento normativo estricto. Nuestra arquitectura modular nos permite escalar de manera sostenible mientras mantenemos el control total sobre la operación, las finanzas y el bienestar de nuestros repartidores.

La implementación del Acta IDSE como requisito indispensable refuerza nuestro compromiso con la formalidad laboral y la protección social de todos los miembros del ecosistema BeFast.

Al mismo tiempo, nuestra visión de futuro, impulsada por Vertex AI, asegura que no solo seremos líderes en eficiencia operativa hoy, sino que estaremos construyendo activamente la próxima generación de logística y marketplace, posicionando a BeFast como un organismo digital inteligente en constante evolución.
Con este blueprint técnico completo, estamos preparados para avanzar con confianza hacia la implementación y el crecimiento continuo de BeFast en el mercado mexicano. ¡El futuro de las entregas formales comienza ahora!