## **Flujo Completo de Registro, Aprobación y Alta en IMSS**

Este flujo describe el camino del aspirante desde que inicia su solicitud hasta que está completamente habilitado para recibir pedidos, un proceso que culmina con la carga de su Acta IDSE como requisito indispensable para operar.

### **Paso 1: Proceso de Solicitud y Registro**
El aspirante completa su solicitud a través de varios pasos secuenciales en el portal. primero llena un formulario con sus datos basicos para crear un usuario auth, recibe un email con su codigo de verificacion y ya pasa al paso 1

*   **1.1: Datos Personales y Laborales** (en `/repartidores/signup/step-1`): Proporciona su información fundamental, información personal (, RFC, CURP, etc.), de su vehículo y bancaria (CLABE).
*   **1.2: Documentación Legal** (en `/repartidores/signup/step-2`): Carga los documentos requeridos, como INE, constancia de situación fiscal, licencia de conducir y tarjeta de circulación.
*   **1.3: Acuerdos Legales y Firma** (en `/repartidores/signup/step-3`): Revisa y firma digitalmente la Política de Gestión Algorítmica, el Instructivo de Llenado y el Modelo de Contrato.
*   **1.4: Capacitación Obligatoria** (en `/repartidores/signup/step-4`): Visualiza videos, aprueba un cuestionario y sube evidencia de su mochila térmica.
*   **1.5: Confirmación y Envío** (en `/repartidores/signup/step-5`): Envía su solicitud, la cual aparece para el administrador en `/admin/solicitudes` con estado `PENDING`.

### **Paso 2: Validación y Decisión Administrativa**
Una vez enviada la solicitud, comienza el proceso de validación interna.

*   **Validación Automática (Vertex AI):** Inmediatamente después del envío, el sistema utiliza Vertex AI Vision para analizar los documentos, extraer datos y verificar su autenticidad.
*   **Revisión Manual:** Un administrador revisa la solicitud en `/admin/solicitudes` y los resultados de la validación de Vertex.

**Decisión Final:**

*   **Si es Rechazado:** Se envía una notificación por correo electrónico al aspirante con el motivo del rechazo.
*   **Si es Aprobado:** El sistema ejecuta una secuencia de acciones:
    *   **Creación de Perfil:** Se crea el perfil completo del repartidor, visible para los administradores en la ruta `/admin/repartidores/[id]`.
    *   **Actualización de Estatus:** El estatus del repartidor se actualiza a `APPROVED`, lo que le da acceso al portal.
    *   **Disponibilidad para Alta en IMSS (IDSE):** El perfil del repartidor, ahora `APPROVED`, queda disponible en el sistema. El personal de Contabilidad puede acceder a la sección `/admin/payroll`, seleccionar al nuevo repartidor y subir manualmente los documentos de su alta en el IMSS (movimiento Tipo 08), como el Acta IDSE.
    *   **Correo de Bienvenida:** Se envía un correo de bienvenida al repartidor que incluye un enlace para que establezca su contraseña por primera vez (link de restablecimiento).

### **Paso 3: Activación y Habilitación Final**
Tras ser aprobado, el repartidor activa su cuenta, pero la habilitación para recibir pedidos depende del alta en el IMSS.

*   **Activación de la Cuenta:** El repartidor usa el enlace del correo para establecer su contraseña, iniciar sesión en su portal (`/repartidores/dashboard`) y descargar la app móvil usando el código QR.
*   **Habilitación para Operar:** Una vez que Contabilidad sube y registra el Acta IDSE en el perfil del repartidor, la cuenta es completamente habilitada. A partir de este momento, cuando se conecte a la aplicación, su estado será `ACTIVE` y podrá recibir pedidos.

**Nota Aclaratoria sobre los Estatus del Repartidor**
*   **APPROVED:** Estado tras la aceptación del admin. Permite acceso a la cuenta, pero no recibir pedidos.
*   **ACTIVE:** Estado operativo en tiempo real. Significa que el repartidor está conectado a la aplicación, en línea y disponible.
*   **Persona Trabajadora de Plataforma Digital:** Definición legal del repartidor durante su primer mes de trabajo.

---

## **Flujo Completo de Pedido**

### **Fase 1: Creación del Pedido**
El proceso inicia desde una de dos fuentes, cada una con su propia lógica de pago:

*   **Fuente 1: Portal BeFast Delivery:** Usado por negocios para gestionar sus envíos. Todos los pedidos desde aquí se consideran pagados en efectivo para la lógica del sistema.
*   **Fuente 2: Negocios de BeFast Market:** Pedidos generados desde el marketplace, que pueden ser pagados con Tarjeta o en Efectivo.

En ambos casos, el pedido se registra en el sistema y se envía a la app de logística para encontrar un repartidor.

### **Fase 2: Asignación y Validación Crítica 360°**
Cuando un repartidor acepta un pedido, se ejecuta una validación instantánea multicapa a través de la Cloud Function `validateOrderAssignment`:

*   **Validación de Cumplimiento IMSS (IDSE) (Requisito Indispensable):** Como primer filtro, el sistema verifica que el repartidor tenga su Acta de alta en el IDSE válida y registrada. Si no se cumple, el pedido es rechazado automáticamente.
*   **Validación de Reglas de Negocio:**
    *   **Estatus Operativo:** Se verifica que el repartidor esté `ACTIVE` (conectado y disponible en la app).
    *   **Validación Financiera (Condicional):** Para pedidos en Efectivo, se comprueba que la deuda (`pendingDebts`) sea menor al límite de deuda permitido, que por defecto es de $300.00 MXN (`driverDebtLimit`). Para pedidos con Tarjeta, esta validación no aplica.
    *   **Cumplimiento General:** Se valida que la documentación (licencia, etc.) y la capacitación sigan vigentes.
*   **Validación de Eficiencia (Vertex AI):**
    *   El modelo de IA Logística de Vertex AI analiza la asignación, predice la ETA, evalúa el riesgo de retraso y calcula un Score de Asignación.
    *   Si el score es bajo, la asignación es rechazada por ineficiente y se busca a otro repartidor.

### **Fase 3: Ejecución y Seguimiento**
Si toda la validación es exitosa, el repartidor es confirmado y procede con la entrega. El estado del pedido se actualiza en tiempo real (`IN_TRANSIT`, `DELIVERED`).

### **Fase 4: Finalización y Auditoría Financiera**
Al confirmar la entrega, la Cloud Function `processOrderCompletion` aplica la lógica financiera.

*   **Auditoría "Doble Contador" (Vertex AI):** El modelo Gemini de Vertex AI recalcula la transacción de forma independiente. La transacción solo se escribe en la base de datos si ambos cálculos coinciden (`auditResult: "MATCH"`).
*   **Retroalimentación al Ecosistema:** Los datos de la ruta completada se guardan para entrenar las futuras apps nativas BeFast GO y BeFast EATS.

---

## **Flujo Derivado: Gestión de Incumplimientos y Revisión**
Este flujo se activa cuando un repartidor acumula incumplimientos, siguiendo el protocolo establecido en la Política de Gestión Algorítmica.

1.  **Registro y Notificación de Incumplimiento:** Cada vez que ocurre un incumplimiento, el sistema lo registra y notifica al repartidor en un plazo de 24 horas, detallando el evento y la evidencia.
2.  **Oportunidad de Aclaración:** El repartidor tiene un plazo de 2 días hábiles para presentar justificaciones o aclaraciones a través de los canales oficiales.
3.  **Tercer Incumplimiento No Justificado:** Al registrar el tercer incumplimiento no justificado en 30 días, el sistema notifica al repartidor la intención de rescindir la relación laboral, con al menos 3 días de anticipación.
4.  **Derecho a Audiencia y Revisión Formal:** El repartidor tiene 3 días hábiles para solicitar una revisión formal, presentando pruebas y solicitando una audiencia si lo desea.
5.  **Revisión por Comité Interno:** Un comité analiza el caso en un plazo máximo de 5 días hábiles.
6.  **Resolución Final:** El comité emite una resolución por escrito (confirmación o revocación de la rescisión) en un plazo no mayor a 7 días hábiles. Si es desfavorable, se informa al repartidor de su derecho a acudir a las autoridades laborales.

---

## **Flujo de Nómina y Pagos**
El sistema opera con dos ciclos: una "nómina semanal" para los ingresos por servicios y un proceso mensual para el cumplimiento legal.

### **Proceso Semanal: Cierre de Ingresos y Timbrado de Recibo (Nómina Semanal)**
Este ciclo, ejecutado cada viernes, formaliza las ganancias por los servicios prestados.

*   **Generación del Recibo de Pago:** El sistema genera un recibo detallado con el desglose de ganancias por tarjeta, propinas y adeudos de la semana.
*   **Timbrado (CFDI):** Este recibo semanal se timbra ante el SAT como un CFDI de ingresos a través de un PAC y se envía al repartidor.

### **Proceso Mensual: Clasificación Laboral, Cumplimiento y Prestaciones**
Este ciclo se ejecuta al inicio de cada mes para cumplir con la normativa laboral.

*   **Clasificación Laboral (Día 1 del mes):** La Cloud Function `monthlyDriverClassification` se activa. Tras finalizar el primer mes, se hace la evaluación de ingresos para determinar la clasificación final.
*   **Cumplimiento IMSS (Días 2-5 del mes):** Para los "trabajadores cotizando", la función `generateMonthlyIDSE` genera el archivo para los movimientos afiliatorios y lo envía al sistema IDSE.
*   **Transferencia de Prestaciones (Días 10-17 del mes):** La función `transferBenefitsOnly` transfiere únicamente las prestaciones de ley acumuladas a los "trabajadores cotizando".

---

# ⚙️ **LÓGICA CENTRAL DEL SISTEMA BEFAST**

## **Lógica de Clasificación Laboral y Estatus del Repartidor**
Esta lógica define el estatus legal y operativo de los repartidores dentro del sistema.

*   **Estatus Inicial:** Cuando una persona se inscribe por primera vez y es aprobada, se convierte oficialmente en una Persona Trabajadora de Plataforma Digital. Este estatus se mantiene durante su primer mes de trabajo.
*   **Evaluación de Ingresos (Fin del Primer Mes):** Tras finalizar el primer mes, se hace la evaluación de ingresos para determinar su clasificación permanente:
    *   Si superó el salario mínimo de referencia ($8,364 MXN, después de aplicar el factor de exclusión), es clasificado como un trabajador cotizando en el régimen obligatorio del IMSS.
    *   Si no alcanzó el salario mínimo, se le considera un trabajador independiente para efectos de seguridad social completa, aunque sigue cubierto por riesgos de trabajo durante el tiempo activo.

**Cálculo para la Clasificación:**
1.  `Ingreso Neto = Ingreso Bruto Mensual - (Ingreso Bruto Mensual * Factor de Exclusión)`
2.  `Resultado = Comparar Ingreso Neto vs. Salario Mínimo de Referencia ($8,364 MXN)`

**Factores de Exclusión (por tipo de vehículo):**
*   Auto (4 ruedas): 36%
*   Moto / Scooter (2 ruedas): 30%
*   Bicicleta / Pie: 12%

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

---

## **Lógica de Validación de Pedidos y Repartidores**
Reglas y condiciones que se evalúan en tiempo real durante la asignación de un pedido.

**Validación Crítica 360° (`validateOrderAssignment`):**
*   **IMSS Activo:** `imssStatus` debe ser `ACTIVO_COTIZANDO` o equivalente válido. (Requisito indispensable).
*   **Estatus Operativo:** `status` del repartidor debe ser `ACTIVE`.
*   **Validación Financiera (solo para efectivo):** `pendingDebts` < `driverDebtLimit` (default: $300.00 MXN).
*   **Cumplimiento General:** Documentación y capacitación deben estar vigentes.
*   **Score de Eficiencia IA:** `vertex_ai_assignment_score` debe ser mayor al umbral aceptable (ej. > 0.8).

**Lógica de Incumplimiento Reiterado:**
*   **Regla:** `SI incumplimientos_documentados >= 3 DENTRO_DE 30_días_naturales ENTONCES iniciar_flujo_rescision`.
*   **Se considera incumplimiento:**
    1.  No realización o entrega incompleta de pedidos aceptados.
    2.  Incumplimiento de instrucciones operativas (rutas, tiempos, protocolos).
    3.  Falta de actualización de datos operativos (disponibilidad, geolocalización).

---

## **Lógica Financiera Central**
Reglas, modelos y cálculos que definen todas las transacciones monetarias del sistema.

**Modelo de Transacciones por Pedido:**

| Tipo de Pedido | Flujo de Dinero | Acción del Sistema |
|---|---|---|
| **Con Tarjeta** | BeFast cobra al cliente. | 1. Calcula ganancia neta del repartidor (Total pedido - $15).<br>2. Suma ganancia neta + propina al `walletBalance` del repartidor.<br>3. Registra transacciones `CARD_ORDER_TRANSFER` y `TIP_CARD_TRANSFER`. |
| **En Efectivo** | Repartidor cobra al cliente. | 1. No transfiere dinero al repartidor (ya lo tiene en efectivo).<br>2. Registra una deuda de $15 en `pendingDebts`.<br>3. Registra transacción `CASH_ORDER_ADEUDO`. |

**Control de Deuda (`pendingDebts`):**
*   **Regla de Bloqueo:** `SI pendingDebts >= driverDebtLimit ENTONCES bloquear_asignacion_pedidos_efectivo`.
*   **Recuperación Automática:** `SI walletBalance > 0 Y pendingDebts > 0 ENTONCES walletBalance -= pendingDebts Y pendingDebts = 0`.

**Tipos de Transacción (`walletTransactions`):**
*   `CASH_ORDER_ADEUDO`: Registro de adeudo por pedido en efectivo.
*   `CARD_ORDER_TRANSFER`: Transferencia de ganancias por pedido con tarjeta.
*   `TIP_CARD_TRANSFER`: Transferencia de propina por pedido con tarjeta.
*   `DEBT_PAYMENT`: Pago manual de deuda por parte del repartidor.
*   `BENEFITS_TRANSFER`: Transferencia mensual de prestaciones de ley.

**Datos Bancarios Oficiales (para pagos y liquidaciones):**
*   **Banco:** BBVA MÉXICO
*   **Cuenta:** 0123456789
*   **CLABE:** 012345678901234567
*   **Beneficiario:** Rosio Arisema Uribe Macias