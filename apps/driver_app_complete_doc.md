
---

# 📱 Documentación Completa - App de Repartidores

---

## 📋 Índice

1.  [Pantallas de la App](#pantallas-de-la-app)
2.  [Resumen por Fase de Implementación](#resumen-por-fase-de-implementación)
3.  [Priorización Detallada](#priorización-detallada)
4.  [Métricas de Éxito por Fase](#métricas-de-éxito-por-fase)
5.  [Recomendaciones Técnicas](#recomendaciones-técnicas)
6.  [Próximos Pasos Sugeridos](#próximos-pasos-sugeridos)
7.  [Conclusión](#conclusión)
8.  [Mejoras con Vertex AI](#mejoras-con-vertex-ai)

---

## ✅ Pantallas de la App

### OnboardingScreen

**Descripción:** Introducción visual a la app para repartidores.

**Componentes:**

*   Slides informativos con imágenes y texto
*   Botón "Saltar" o "Continuar"

---

### RegistrationScreen

**Descripción:** Formulario de registro de repartidores en 5 pasos.

**Componentes:**

**Paso 1: Datos Personales y Laborales**

*   Campos: Nombre, RFC, CURP, NSS
*   Campos del vehículo: Tipo, marca, modelo, placas
*   Campos bancarios: CLABE

**Paso 2: Documentación Legal**

*   Subida de archivos: INE, constancia SAT, licencia de conducir, tarjeta de circulación

**Paso 3: Acuerdos Legales y Firma**

*   Checkboxes para aceptar políticas
*   Firma digital

**Paso 4: Capacitación Obligatoria**

*   Reproductor de videos
*   Cuestionario interactivo
*   Subida de evidencia (fotos)

**Paso 5: Confirmación y Envío**

*   Botón "Enviar solicitud"
*   Mensaje de confirmación

**Funcionalidades:**

*   Validación en tiempo real de campos obligatorios
*   Subida y validación de documentos (tamaño, formato, legibilidad)
*   Firma digital con validación
*   Cálculo automático de próximo mantenimiento
*   Notificaciones push de recordatorios
*   Sincronización de kilometraje con pedidos realizados
*   Exportación de gastos para declaración de impuestos
*   Integración con calendario del sistema

---

### LoginScreen

**Descripción:** Inicio de sesión para repartidores.

**Componentes:**

*   Campos: Email, contraseña
*   Botón de verificación biométrica (huella/Face ID)
*   Botón "Iniciar sesión"
*   Mensaje de error para credenciales inválidas

---

### DashboardScreen

**Descripción:** Pantalla principal con estado y pedidos disponibles.

**Componentes:**

*   Botón de estado: Online/Offline
*   Mapa interactivo con marcadores de pedidos cercanos
*   Tarjetas de métricas: Pedidos completados, ganancias del día
*   Lista de pedidos recientes

**Funcionalidades:**

*   Actualización en tiempo real de pedidos cercanos
*   Cálculo de métricas (ganancias, pedidos completados)

---

### OrdersScreen

**Descripción:** Lista de pedidos disponibles y en progreso.

**Componentes:**

*   Filtros: Pendientes, en camino, completados
*   Tarjetas de pedidos:
    *   Distancia
    *   Dirección
    *   Pago estimado
    *   Tiempo estimado
*   Botones: Aceptar, rechazar

**Funcionalidades:**

*   Filtro de pedidos por estado y distancia
*   Notificaciones push para nuevos pedidos

---

### NavigationScreen

**Descripción:** Navegación para entrega de pedidos.

**Componentes:**

*   Mapa con ruta optimizada
*   Indicaciones paso a paso (texto y voz)
*   Botones: Iniciar entrega, finalizar entrega
*   Alertas: Tráfico, clima

**Funcionalidades:**

*   Ruta optimizada para motos
*   Alertas de tráfico y clima en tiempo real

---

### ProfileScreen

**Descripción:** Perfil del repartidor.

**Componentes:**

*   Información personal: Nombre, foto, teléfono
*   Información del vehículo: Tipo, placas
*   Historial de pedidos: Lista con detalles
*   Ganancias: Gráficos y desglose por día/semana
*   Botón: Editar perfil

**Funcionalidades:**

*   Edición de información personal y del vehículo
*   Visualización de historial de pedidos y ganancias

---

### ChatScreen

**Descripción:** Comunicación con clientes y soporte.

**Componentes:**

*   Lista de chats: Clientes y soporte
*   Ventana de chat: Mensajes, hora, estado (leído/no leído)
*   Botón: Llamar al cliente

**Funcionalidades:**

*   Mensajería en tiempo real con clientes
*   Llamadas directas desde la app

---

### DeliveryConfirmationScreen

**Descripción:** Confirmación de entrega del pedido.

**Componentes:**

*   Botón: "Marcar como entregado"
*   Opción para subir foto del pedido entregado
*   Campo para notas adicionales
*   Comprobante digital generado automáticamente

**Funcionalidades:**

*   Generación automática de comprobante digital
*   Validación de foto subida (calidad, contenido)

---

### IncidentsScreen

**Descripción:** Reportar incidencias durante el reparto.

**Componentes:**

*   Formulario con opciones predefinidas: Cliente no disponible, dirección incorrecta, accidente
*   Campo para descripción detallada
*   Botón para subir fotos
*   Botón "Enviar reporte"

**Funcionalidades:**

*   Envío de reportes con fotos y descripción
*   Notificación automática al soporte

---

### PaymentsScreen

**Descripción:** Historial de pagos y ganancias.

**Componentes:**

*   Lista de pagos: Fecha, monto, tipo (tarjeta/efectivo)
*   Gráfico de ganancias por período
*   Botón: "Generar comprobante"

**Funcionalidades:**

*   Generación de comprobantes de pago en PDF
*   Desglose detallado de ganancias y comisiones

---

### ShiftScreen

**Descripción:** Inicio y fin de turno.

**Componentes:**

*   Botón: "Iniciar turno" / "Finalizar turno"
*   Registro de horas trabajadas: Hora de inicio, hora de fin

**Funcionalidades:**

*   Registro automático de horas trabajadas
*   Notificación al iniciar/finalizar turno

---

### EmergencyScreen

**Descripción:** Sistema de emergencia para repartidores.

**Componentes:**

*   Botón de pánico: "¡Emergencia!"
*   Compartir ubicación en tiempo real con soporte
*   Lista de contactos de emergencia

**Funcionalidades:**

*   Envío de alerta de emergencia con ubicación
*   Contacto directo con soporte o emergencias

---

### NotificationsScreen

**Descripción:** Centro de notificaciones con todas las alertas del sistema.

**Componentes:**

*   Lista de notificaciones agrupadas por tipo:
    *   Nuevos pedidos disponibles
    *   Mensajes de clientes
    *   Alertas del sistema
    *   Actualizaciones de pagos
    *   Recordatorios de turnos
*   Filtros: Todas, no leídas, importantes
*   Badge con contador de notificaciones no leídas
*   Botones: Marcar como leído / Marcar todas como leídas / Borrar
*   Timestamp de cada notificación
*   Acción rápida desde la notificación (ir al pedido, abrir chat, etc.)

**Funcionalidades:**

*   Notificaciones push en tiempo real
*   Sonido y vibración personalizables
*   Agrupación automática por categoría
*   Historial de notificaciones (últimos 30 días)
*   Deep linking a la pantalla correspondiente

---

### OrderDetailScreen

**Descripción:** Vista detallada de un pedido individual antes de aceptarlo.

**Componentes:**

*   **Mapa:**
    *   Ubicación actual del repartidor
    *   Punto de recolección (origen)
    *   Punto de entrega (destino)
    *   Ruta estimada dibujada
*   **Información del cliente:**
    *   Nombre
    *   Foto de perfil (si disponible)
    *   Calificación promedio
    *   Botón: Llamar / Enviar mensaje
*   **Detalles del pedido:**
    *   Tipo de pedido: Paquete, comida, documento
    *   Peso estimado
    *   Tamaño: Pequeño, mediano, grande
    *   Fragilidad: Sí/No
    *   Descripción breve del contenido
    *   Instrucciones especiales del cliente
*   **Información de pago:**
    *   Pago base estimado
    *   Propina sugerida
    *   Total estimado
    *   Método de pago: Efectivo, tarjeta, prepagado
*   **Información de tiempo/distancia:**
    *   Distancia total del recorrido
    *   Tiempo estimado de recolección
    *   Tiempo estimado de entrega
    *   Hora límite de entrega
*   **Botones de acción:**
    *   Botón grande "Aceptar pedido"
    *   Botón secundario "Rechazar" con razones:
        *   Muy lejos
        *   Mal pagado
        *   Fuera de mi zona
        *   No tengo tiempo
        *   Otro (campo de texto)

**Funcionalidades:**

*   Cálculo en tiempo real de distancia y tiempo
*   Actualización de disponibilidad del pedido (si otro repartidor lo toma)
*   Timer de expiración (cuánto tiempo tienes para decidir)
*   Historial: Guardar pedidos rechazados para análisis

---

### EarningsDetailScreen

**Descripción:** Desglose detallado de todas las ganancias del repartidor.

**Componentes:**

*   **Resumen principal:**
    *   Ganancias totales del período seleccionado
    *   Saldo disponible para retiro
    *   Próximo pago programado: Fecha y monto
*   **Selector de período:**
    *   Hoy
    *   Esta semana
    *   Este mes
    *   Rango personalizado (date picker)
*   **Desglose de ganancias:**
    *   Pago base por pedidos
    *   Propinas recibidas
    *   Bonos y incentivos
    *   Subtotal
    *   (-) Comisión de plataforma (%)
    *   (-) Otras deducciones (si aplica)
    *   **Total neto**
*   **Gráficos visuales:**
    *   Gráfico de barras: Ganancias por día
    *   Gráfico de pastel: Composición de ganancias (base vs propinas vs bonos)
    *   Gráfico de líneas: Tendencia semanal/mensual
*   **Lista de transacciones:**
    *   Cada pedido con:
        *   Fecha y hora
        *   ID del pedido
        *   Pago base
        *   Propina
        *   Total
        *   Estado: Pagado, pendiente
*   **Estadísticas adicionales:**
    *   Ganancia promedio por pedido
    *   Ganancia promedio por hora
    *   Total de pedidos en el período
*   **Botones:**
    *   "Solicitar retiro" (lleva a WithdrawalScreen)
    *   "Descargar reporte" (PDF/Excel)
    *   "Ver historial de retiros"

**Funcionalidades:**

*   Actualización en tiempo real
*   Exportación de datos en múltiples formatos
*   Filtros por tipo de ingreso
*   Comparación con períodos anteriores

---

### RatingScreen

**Descripción:** Calificación del cliente después de completar una entrega.

**Componentes:**

*   **Header:**
    *   Foto del cliente
    *   Nombre del cliente
    *   "¿Cómo fue tu experiencia con este cliente?"
*   **Sistema de calificación:**
    *   5 estrellas interactivas (tap para seleccionar)
    *   Animación al seleccionar
*   **Opciones rápidas (tags):**
    *   Positivas:
        *   Amable
        *   Puntual
        *   Buena comunicación
        *   Dirección clara
        *   Buena propina
    *   Negativas:
        *   Grosero
        *   Impuntual
        *   Dirección incorrecta
        *   No respondió llamadas
        *   Canceló en último momento
*   **Campo de comentarios:**
    *   Placeholder: "Cuéntanos más sobre tu experiencia (opcional)"
    *   Contador de caracteres: 0/500
    *   Solo visible para administración, no para el cliente
*   **Advertencia de profesionalismo:**
    *   Pequeño texto: "Tus comentarios son confidenciales y ayudan a mejorar el servicio"
*   **Botones:**
    *   "Enviar calificación" (botón principal)
    *   "Saltar" (solo si es opcional según políticas)

**Funcionalidades:**

*   Guardado automático si el repartidor sale de la pantalla
*   Recordatorio si no califica después de X tiempo
*   Validación: No permitir envío sin seleccionar estrellas
*   Analytics: Patrones de calificaciones por repartidor

---

### WithdrawalScreen

**Descripción:** Solicitud de retiro de ganancias acumuladas.

**Componentes:**

*   **Resumen de saldo:**
    *   Saldo total disponible (grande, destacado)
    *   Ganancias pendientes de confirmación
    *   Últimas ganancias: Últimos 3 días con montos
*   **Formulario de retiro:**
    *   Campo: "Monto a retirar"
        *   Validación: Mínimo $100, máximo = saldo disponible
        *   Sugerencias rápidas: 25%, 50%, 75%, 100%
    *   Método de retiro:
        *   Radio buttons:
            *   Transferencia bancaria SPEI (instantáneo)
            *   Depósito a tarjeta (24-48 hrs)
    *   Cuenta destino:
        *   Mostrar últimos 4 dígitos de la cuenta registrada
        *   Botón: "Cambiar cuenta"
*   **Información de comisiones:**
    *   Comisión por retiro: $X o Y%
    *   Monto neto a recibir: (destacado en verde)
*   **Fecha estimada:**
    *   "Recibirás tu dinero el [fecha]"
    *   Icono de calendario
*   **Historial de retiros:**
    *   Lista plegable "Ver historial"
    *   Últimos 10 retiros con:
        *   Fecha de solicitud
        *   Monto
        *   Estado: Procesando, completado, fallido
        *   Botón: Ver comprobante
*   **Advertencias/Notas:**
    *   "Los retiros se procesan de lunes a viernes"
    *   "Monto mínimo: $100 MXN"
*   **Botón principal:**
    *   "Confirmar retiro"
    *   Confirmación con PIN o biometría

**Funcionalidades:**

*   Validación en tiempo real del monto
*   Verificación de cuenta bancaria
*   Envío de comprobante por email
*   Notificación push cuando se complete el retiro
*   Sistema de retiros programados (opcional)

---

### TutorialScreen / HelpScreen

**Descripción:** Centro de ayuda con tutoriales, FAQs y soporte.

**Componentes:**

*   **Buscador:**
    *   Campo de búsqueda: "¿En qué podemos ayudarte?"
    *   Sugerencias automáticas mientras escribe
*   **Categorías de ayuda:**
    *   Gestión de pedidos
    *   Pagos y retiros
    *   Uso de la navegación
    *   Funciones de la app
    *   Emergencias
    *   Documentos y cuenta
*   **FAQs populares:**
    *   Lista de preguntas frecuentes con respuestas expandibles
    *   Ejemplos:
        *   "¿Cómo acepto un pedido?"
        *   "¿Cuándo recibo mi pago?"
        *   "¿Qué hago si el cliente no está?"
*   **Video tutoriales:**
    *   Miniaturas de videos con duración
    *   Categorías: Básico, intermedio, avanzado
*   **Guías interactivas:**
    *   Walkthrough paso a paso con screenshots
*   **Botón de contacto:**
    *   "Contactar soporte" (abre chat o llama)
    *   Horarios de atención
*   **Valoración de artículos:**
    *   "¿Te fue útil esta respuesta?"

**Funcionalidades:**

*   Búsqueda por palabras clave
*   Historial de artículos visitados
*   Sugerencias basadas en problemas comunes
*   Modo offline: FAQs descargadas

---

### SettingsScreen

**Descripción:** Configuración general de la aplicación.

**Componentes:**

*   **Cuenta:**
    *   Editar perfil
    *   Cambiar contraseña
    *   Verificación en dos pasos (activar/desactivar)
    *   Gestionar dispositivos vinculados
*   **Notificaciones:**
    *   Push notifications (on/off)
    *   Sonido (selector de tono)
    *   Vibración (on/off)
    *   Notificaciones por tipo:
        *   Nuevos pedidos
        *   Mensajes
        *   Pagos
        *   Promociones
*   **Navegación:**
    *   App de mapas preferida: Google Maps, Waze, Apple Maps
    *   Voz de navegación: Activar/desactivar
    *   Rutas: Más rápida, evitar autopistas, etc.
*   **Apariencia:**
    *   Tema: Claro, Oscuro, Automático (según hora del día)
    *   Tamaño de fuente: Pequeño, Mediano, Grande
*   **Idioma:**
    *   Selector de idioma
*   **Privacidad:**
    *   Permisos de ubicación: Siempre, solo en uso, nunca
    *   Permisos de cámara
    *   Permisos de micrófono
    *   Compartir datos de uso (análisis)
    *   Política de privacidad (link)
*   **Almacenamiento:**
    *   Espacio usado por la app
    *   Limpiar caché
    *   Eliminar datos temporales
*   **Acerca de:**
    *   Versión de la app
    *   Términos y condiciones
    *   Licencias de código abierto
    *   Contacto/Soporte
*   **Zona de peligro:**
    *   Cerrar sesión (con confirmación)
    *   Eliminar cuenta (con advertencia y confirmación múltiple)

**Funcionalidades:**

*   Sincronización de ajustes en la nube
*   Backup de configuración
*   Restaurar configuración predeterminada

---

### DocumentsScreen

**Descripción:** Gestión de documentos legales del repartidor.

**Componentes:**

*   **Lista de documentos:**
    *   Cada documento muestra:
        *   Icono según tipo de documento (visual, sin emoji)
        *   Nombre del documento
        *   Estado:
            *   Aprobado
            *   En revisión
            *   Rechazado
            *   Por vencer
            *   Vencido
        *   Fecha de vencimiento (si aplica)
        *   Fecha de subida
*   **Tipos de documentos:**
    *   INE/IFE
    *   Licencia de conducir
    *   Tarjeta de circulación
    *   Constancia de situación fiscal (SAT)
    *   Comprobante de domicilio
    *   Póliza de seguro del vehículo
    *   Fotografía del vehículo
*   **Acciones por documento:**
    *   Ver documento (modal con imagen o PDF)
    *   Resubir documento
    *   Descargar copia
*   **Filtros:**
    *   Todos
    *   Aprobados
    *   Pendientes
    *   Rechazados
    *   Por vencer
*   **Notificaciones:**
    *   Badge de documentos que requieren atención
    *   Alertas 30 días antes del vencimiento
    *   Alertas 7 días antes del vencimiento
    *   Bloqueo de cuenta si documentos vencen
*   **Razones de rechazo:**
    *   Si un documento fue rechazado, mostrar:
        *   Motivo detallado
        *   Fecha de rechazo
        *   Instrucciones para corrección
*   **Botón flotante:**
    *   "Subir nuevo documento"

**Funcionalidades:**

*   Compresión automática de imágenes
*   Validación de formato (JPG, PNG, PDF)
*   Validación de tamaño (max 10MB)
*   OCR para extracción automática de datos
*   Recordatorios automáticos de vencimiento

---

### RejectedOrdersHistoryScreen

**Descripción:** Historial de todos los pedidos que el repartidor ha rechazado.

**Componentes:**

*   **Estadísticas generales:**
    *   Tasa de aceptación: X% (visual con barra de progreso)
    *   Total de pedidos ofrecidos
    *   Total de pedidos aceptados
    *   Total de pedidos rechazados
    *   Comparativa con promedio de la plataforma
*   **Filtros de fecha:**
    *   Hoy
    *   Última semana
    *   Último mes
    *   Rango personalizado
*   **Lista de pedidos rechazados:**
    *   Cada item muestra:
        *   Fecha y hora del rechazo
        *   ID del pedido
        *   Origen -> Destino (breve)
        *   Distancia
        *   Pago que hubiera recibido
        *   Razón del rechazo
        *   Tiempo que tomó decidir
*   **Análisis de razones:**
    *   Gráfico circular con distribución:
        *   % Muy lejos
        *   % Mal pagado
        *   % Fuera de zona
        *   % Sin tiempo
        *   % Otras razones
*   **Impacto en ganancias:**
    *   "Podrías haber ganado $XXX adicionales"
    *   Comparativa con ganancias reales
*   **Recomendaciones:**
    *   Sugerencias personalizadas:
        *   "Aceptas más pedidos en zona norte"
        *   "Rechazas pedidos de >5km frecuentemente"
*   **Botón de acción:**
    *   "Ajustar preferencias de pedidos"

**Funcionalidades:**

*   Analytics en tiempo real
*   Exportación de datos
*   Insights con IA sobre patrones de rechazo
*   Alertas si tasa de rechazo es muy alta

---

### BonusScreen / IncentivesScreen

**Descripción:** Visualización de bonos, metas e incentivos disponibles.

**Componentes:**

*   **Bonos activos:**
    *   Tarjetas destacadas con:
        *   Nombre del bono
        *   Descripción breve
        *   Monto del bono
        *   Progreso visual (barra de progreso)
        *   Objetivo: "Completa X pedidos para ganar $Y"
        *   Tiempo restante: "Quedan 5 horas"
*   **Tipos de bonos:**
    *   **Por volumen:** "50 pedidos esta semana = $500 extra"
    *   **Por horario:** "3 pedidos entre 2-4 AM = $200"
    *   **Por zona:** "10 pedidos en Zona Centro = $300"
    *   **Por calificación:** "Mantén 4.8★ por 1 mes = $1000"
    *   **De bienvenida:** "Primeros 20 pedidos con 50% extra"
*   **Progreso actual:**
    *   Número de pedidos completados hacia la meta
    *   Pedidos faltantes
    *   Proyección: "Si continúas así, lo lograrás en X días"
*   **Bonos disponibles por zona/horario:**
    *   Mapa de calor con zonas de alto bono
    *   Tabla de horarios:
        *   Lunes 2-4 PM: +$20 por pedido
        *   Viernes 9-11 PM: +$50 por pedido
*   **Historial de bonos ganados:**
    *   Lista con:
        *   Fecha
        *   Tipo de bono
        *   Monto ganado
        *   Estado: Pagado, pendiente
*   **Próximos bonos:**
    *   "Próximamente: Fin de semana largo con bonos dobles"
*   **Notificaciones:**
    *   Alertas cuando está cerca de lograr un bono
    *   Felicitación cuando se logra un bono

**Funcionalidades:**

*   Actualización en tiempo real del progreso
*   Notificaciones push estratégicas
*   Gamificación con badges/logros
*   Comparativa social (opcional): "Estás en el top 10% de repartidores esta semana"

---

### VehicleMaintenanceScreen

**Descripción:** Gestión del mantenimiento del vehículo para repartidores.

**Componentes:**

*   Registro de kilometraje actual e histórico
*   Lista de mantenimientos realizados (fecha, tipo, costo)
*   Recordatorios de próximos servicios (aceite, llantas, etc.)
*   Registro de gastos (gasolina, reparaciones, seguros)
*   Gráficos de consumo y costos mensuales
*   Integración con calendario para recordatorios

**Funcionalidades:**

*   Cálculo automático de próximo mantenimiento basado en kilometraje
*   Notificaciones push de recordatorios
*   Sincronización de kilometraje con pedidos realizados
*   Exportación de gastos para declaración de impuestos
*   Integración con calendario del sistema para eventos de mantenimiento

---

### ReferralScreen

**Descripción:** Programa de referidos para invitar nuevos repartidores.

**Componentes:**

*   **Tu código de referido:**
    *   Código único destacado (grande, centrado)
    *   Botón: "Copiar código"
    *   Mensaje de confirmación al copiar
*   **Botones de compartir:**
    *   WhatsApp
    *   Facebook
    *   Twitter
    *   Mensaje SMS
    *   Email
    *   "Más opciones" (share nativo del sistema)
*   **Cómo funciona:**
    *   Infografía simple con pasos:
        1.  Comparte tu código
        2.  Tu amigo se registra con tu código
        3.  Tu amigo completa X pedidos
        4.  Ambos reciben $Y de bono
*   **Condiciones del programa:**
    *   "Gana $500 por cada amigo que complete 20 pedidos"
    *   "Tu amigo recibe $300 de bono de bienvenida"
    *   Términos y condiciones (link expandible)
*   **Tus referidos:**
    *   Contador: "Has referido a X personas"
    *   Lista/tabla con:
        *   Nombre del referido
        *   Fecha de registro
        *   Estado:
            *   Activo y calificado (bono pagado)
            *   En progreso (X/20 pedidos)
            *   Pendiente de activación
            *   No completó requisitos
        *   Pedidos completados: Barra de progreso
        *   Bono ganado por ese referido
*   **Ganancias totales por referidos:**
    *   Monto total ganado por referidos
    *   Gráfico de ganancias mensuales
    *   Promedio por referido
*   **Ranking (opcional):**
    *   "Eres el #X en referidos este mes"
    *   Top 10 de repartidores con más referidos
    *   Badge o insignia por logros
*   **Promociones especiales:**
    *   "¡Promoción de temporada! Doble bono por referidos hasta fin de mes"

**Funcionalidades:**

*   Deep linking para registro con código pre-cargado
*   Tracking completo del funnel de referidos
*   Notificaciones cuando un referido progresa
*   Gamificación con niveles y logros
*   Bonos escalonados (más referidos = bonos mayores)

---

### StatisticsScreen

**Descripción:** Dashboard con métricas avanzadas y analytics del desempeño del repartidor.

**Componentes:**

*   **KPIs principales:**
    *   Tarjetas con métricas destacadas:
        *   Pedidos completados (este mes)
        *   Calificación promedio
        *   Tasa de aceptación
        *   Ingreso promedio por hora
        *   Tiempo promedio de entrega
        *   Distancia total recorrida
*   **Gráficos de rendimiento:**
    *   **Por tiempo:**
        *   Pedidos por hora del día (gráfico de barras)
        *   Ganancias por día de la semana (gráfico de líneas)
        *   Tendencia mensual (últimos 6 meses)
    *   **Por zona:**
        *   Mapa de calor de zonas más trabajadas
        *   Top 5 zonas más rentables
        *   Tiempo promedio por zona
    *   **Por tipo de pedido:**
        *   Distribución: Documentos, paquetes, comida, etc.
        *   Ingreso promedio por tipo
*   **Análisis de eficiencia:**
    *   Km por pedido promedio
    *   Costo de gasolina vs ganancias
    *   Tiempo activo vs tiempo en entrega
    *   Pedidos por tanque de gasolina
*   **Comparativas:**
    *   Tu rendimiento vs promedio de la plataforma
    *   Evolución mensual (este mes vs mes anterior)
    *   Mejores días vs peores días
*   **Insights personalizados:**
    *   "Tus mejores horas son 2-5 PM"
    *   "Ganas 30% más los fines de semana"
    *   "La Zona Centro es tu más rentable"
*   **Selectores de período:**
    *   Última semana
    *   Último mes
    *   Últimos 3 meses
    *   Este año
    *   Personalizado
*   **Exportación:**
    *   Botón: "Descargar reporte" (PDF/Excel)

**Funcionalidades:**

*   Actualización en tiempo real
*   Machine Learning para predicciones
*   Visualizaciones interactivas
*   Comparación entre períodos

---

### ScheduleScreen

**Descripción:** Calendario para programar turnos de trabajo con anticipación.

**Componentes:**

*   **Vista de calendario:**
    *   Vista mensual con días
    *   Indicadores visuales:
        *   Turnos programados
        *   Turnos trabajados
        *   Días libres
        *   Bonos especiales ese día
*   **Acciones por día:**
    *   Tap en un día para:
        *   Programar turno
        *   Editar turno
        *   Cancelar turno
        *   Ver bonos disponibles
*   **Formulario de programación:**
    *   Fecha (selector)
    *   Hora de inicio (time picker)
    *   Hora de fin (time picker)
    *   Zona preferida (opcional)
    *   Recordatorio: X minutos antes
*   **Turnos programados:**
    *   Lista de próximos turnos
    *   Detalles: Fecha, horario, duración
    *   Botones: Editar, Cancelar, Iniciar (si es hoy)
*   **Recordatorios:**
    *   Notificación 30 min antes del turno
    *   Notificación si no ha iniciado el turno programado
*   **Historial de turnos:**
    *   Calendario con turnos pasados
    *   Estadísticas: Total de horas trabajadas por mes
*   **Metas semanales:**
    *   "Programa 40 horas esta semana"
    *   Progreso visual
*   **Sincronización:**
    *   Opción de sincronizar con calendario del sistema
    *   Exportar turnos a Google Calendar, iCal, etc.

**Funcionalidades:**

*   Gestión de disponibilidad
*   Prevención de doble programación
*   Integración con sistema de bonos
*   Recordatorios inteligentes

---

### ZonesMapScreen

**Descripción:** Mapa de calor con zonas de alta demanda y mejor rentabilidad.

**Componentes:**

*   **Mapa principal:**
    *   Mapa interactivo de la ciudad
    *   Overlay con colores (ej. Rojo: Alta demanda, Amarillo: Media, Verde: Baja)
    *   Marcadores con iconos de bonos especiales (visual, sin emoji)
*   **Leyenda:**
    *   Explicación de colores
    *   Intensidad de la demanda
*   **Filtros:**
    *   Por horario:
        *   Mañana (6-12)
        *   Tarde (12-18)
        *   Noche (18-24)
        *   Madrugada (0-6)
    *   Por día de la semana
    *   Histórico vs en tiempo real
*   **Información de zona:**
    *   Tap en una zona para ver:
        *   Nombre del barrio/colonia
        *   Demanda actual
        *   Pedidos promedio por hora
        *   Ingreso promedio por pedido
        *   Tiempo de espera promedio
        *   Bonos activos en esa zona
*   **Rutas sugeridas:**
    *   "Mejores zonas ahora mismo"
    *   Ruta optimizada entre zonas rentables
*   **Predicciones:**
    *   "Se espera alta demanda en Zona X en 2 horas"
    *   Basado en patrones históricos
*   **Tu posición:**
    *   Marcador de ubicación actual
    *   Distancia a zonas de alta demanda
*   **Estadísticas personales por zona:**
    *   Toggle: "Mostrar mis zonas más rentables"
    *   Comparar con datos globales

**Funcionalidades:**

*   Actualización en tiempo real
*   Predicción con IA de demanda futura
*   Navegación directa a zona seleccionada
*   Notificaciones de cambios de demanda

---

### TrainingScreen

**Descripción:** Centro de capacitación continua con cursos y certificaciones adicionales.

**Componentes:**

*   **Cursos disponibles:**
    *   Tarjetas de cursos con:
        *   Título del curso
        *   Descripción breve
        *   Duración estimada
        *   Nivel: Básico, intermedio, avanzado
        *   Icono/ilustración (visual, sin emoji)
        *   Estado: No iniciado, en progreso, completado
        *   Beneficio: "Desbloquea pedidos premium"
*   **Categorías:**
    *   Seguridad vial
    *   Atención al cliente
    *   Manejo de incidencias
    *   Primeros auxilios básicos
    *   Mantenimiento de vehículo
    *   Normativas legales
    *   Uso avanzado de la app
*   **Mis cursos:**
    *   Pestaña con cursos en progreso
    *   Barra de progreso por curso
    *   Botón: "Continuar curso"
*   **Certificaciones:**
    *   Sección de certificados obtenidos
    *   Certificado descargable en PDF
    *   Badge digital para perfil
    *   Fecha de emisión
    *   Fecha de vencimiento (si aplica)
*   **Contenido del curso:**
    *   Videos educativos
    *   Lecturas/artículos
    *   Infografías
    *   Casos prácticos
    *   Simulaciones interactivas
*   **Evaluaciones:**
    *   Cuestionarios de opción múltiple
    *   Puntaje mínimo para aprobar
    *   Intentos permitidos
    *   Retroalimentación en respuestas incorrectas
*   **Sistema de puntos:**
    *   XP por curso completado
    *   Niveles de repartidor:
        *   Bronce -> Plata -> Oro -> Platino
    *   Beneficios por nivel:
        *   Prioridad en pedidos premium
        *   Bonos exclusivos
        *   Soporte prioritario
*   **Leaderboard:**
    *   Ranking de repartidores más capacitados
    *   Comparativa social (opcional)

**Funcionalidades:**

*   Tracking de progreso
*   Gamificación con rewards
*   Certificados con blockchain (opcional)
*   Notificaciones de nuevos cursos
*   Modo offline para descargar contenido

---

## 📊 Resumen por Fase de Implementación

### Fase 1: MVP (Mínimo Viable)

**Objetivo:** Lanzar con funcionalidad core completa

**Duración estimada:** 3-4 meses

**Pantallas incluidas:**

1.  OnboardingScreen
2.  RegistrationScreen
3.  LoginScreen
4.  DashboardScreen
5.  OrdersScreen
6.  NavigationScreen
7.  ProfileScreen
8.  ChatScreen
9.  DeliveryConfirmationScreen
10. IncidentsScreen
11. PaymentsScreen
12. ShiftScreen
13. EmergencyScreen
14. NotificationsScreen
15. OrderDetailScreen
16. EarningsDetailScreen
17. RatingScreen
18. WithdrawalScreen
19. SettingsScreen
20. DocumentsScreen

**Total MVP: 20 pantallas**

---

### Fase 2: Mejoras y Optimización

**Objetivo:** Agregar funcionalidades que aumentan retención y satisfacción

**Duración estimada:** 2-3 meses

**Pantallas a agregar:**

21. TutorialScreen / HelpScreen
22. RejectedOrdersHistoryScreen
23. BonusScreen / IncentivesScreen
24. VehicleMaintenanceScreen
25. ReferralScreen

**Total después de Fase 2: 25 pantallas**

---

### Fase 3: Funcionalidades Avanzadas

**Objetivo:** Diferenciación competitiva y fidelización

**Duración estimada:** 2 meses

**Pantallas a agregar:**

26. StatisticsScreen
27. ScheduleScreen
28. ZonesMapScreen
29. TrainingScreen

**Total completo: 29 pantallas**

---

## 📈 Priorización Detallada

### Crítico - No puedes lanzar sin esto:

| # | Pantalla                 | Razón                                                    |
|---|--------------------------|----------------------------------------------------------|
| 1 | OrderDetailScreen        | Repartidores no pueden tomar decisiones informadas sin ver detalles completos |
| 2 | NotificationsScreen      | Se pierden pedidos y mensajes importantes                 |
| 3 | WithdrawalScreen         | Acceso al dinero es fundamental, causa de churn         |
| 4 | EarningsDetailScreen     | Transparencia financiera es obligatoria legalmente      |
| 5 | RatingScreen             | Sistema bidireccional de calificación es estándar de la industria |

---

### Importante - Lanzar pronto después del MVP:

| # | Pantalla                   | Razón                                        |
|---|----------------------------|----------------------------------------------|
| 6 | SettingsScreen             | Control de privacidad y personalización      |
| 7 | DocumentsScreen            | Compliance legal y renovaciones             |
| 8 | TutorialScreen             | Reduce tickets de soporte                    |
| 9 | BonusScreen                | Aumenta motivación y horas trabajadas        |
| 10| RejectedOrdersHistoryScreen| Mejora tasa de aceptación con insights       |
| 11| VehicleMaintenanceScreen   | Previene accidentes y reduce costos          |
| 12| ReferralScreen             | Adquisición de usuarios económica            |

---

### Opcional - Nice to have:

| # | Pantalla         | Razón                                     |
|---|------------------|-------------------------------------------|
| 13| StatisticsScreen | Power users aprecian analytics            |
| 14| ScheduleScreen   | Mejora planificación para algunos usuarios|
| 15| ZonesMapScreen   | Optimización de ganancias avanzada        |
| 16| TrainingScreen   | Diferenciación y calidad de servicio      |

---

## 🎯 Métricas de Éxito por Fase

### Fase 1 (MVP):

*   100% de repartidores pueden registrarse sin fricción
*   100% de repartidores pueden aceptar/rechazar pedidos
*   100% de repartidores pueden navegar y entregar
*   100% de repartidores pueden retirar sus ganancias
*   Tiempo promedio de registro: < 15 minutos
*   Tasa de abandono en registro: < 30%
*   Tickets de soporte: < 10 por día

### Fase 2:

*   Tasa de retención mes 1: > 60%
*   Uso de programa de referidos: > 20% de repartidores
*   Documentos actualizados a tiempo: > 90%
*   Bonos reclamados: > 50% de elegibles
*   Reducción de tickets de soporte: -40%

### Fase 3:

*   Engagement con estadísticas: > 30% semanal
*   Uso de programación de turnos: > 25%
*   Cursos completados: > 1 por repartidor activo
*   NPS (Net Promoter Score): > 50

---

## 🔧 Mejoras con Vertex AI

### 1. Asistente de Comunicación Inteligente para Repartidores (Vertex AI Generative AI - Gemini Pro)

**Contexto Actual:** Existe "Chat in-app bidireccional" y "Mensajes predefinidos".

**Mejora con Vertex AI:** Cuando el repartidor recibe un mensaje (del cliente, negocio, dispatcher) y está en tránsito o no puede teclear, Gemini Pro genera respuestas sugeridas contextuales con un solo toque.

**En el Backend (Cloud Functions):** La Cloud Function de chat envía el mensaje recibido, el orderId actual y el driverId a Gemini Pro. Gemini analiza el mensaje y el estado del pedido, generando 3-5 respuestas cortas y relevantes.

**Impacto en App Móvil:** Dentro de la conversación de chat, debajo del mensaje recibido, aparecen botones con opciones como: "Llego en [ETA actual]", "Estoy cerca de la dirección", "Hubo un pequeño retraso en el restaurante".

**Futuro:** Respuestas automáticas (con consentimiento) si el repartidor no responde en X segundos.

### 2. Predicción de ETA por IA y Optimización de Rutas (Vertex AI Custom Training / Optimizers)

**Contexto Actual:** "Predicción de ETA por IA" y "Rutas eficientes considerando tráfico en vivo" ya están en la sección de navegación.

**Mejora con Vertex AI:** Implementar modelos de ML personalizados para predicciones de ETA más precisas y rutas dinámicas.

**ETA Adaptativa:** Modelos entrenados con el historial de tus propios repartidores (tiempos reales, variables como clima, tipo de vehículo, hora del día) para predecir ETA más allá de lo que ofrece Google Maps.

**Rutas Inteligentes:** Sugerir rutas que no solo sean rápidas, sino que minimicen el riesgo (menos zonas peligrosas), sean eficientes en combustible/energía para EV/bicis, o eviten peajes, basándose en el perfil del repartidor y el contexto.

**Impacto en App Móvil:** El mapa de navegación muestra ETA más fiables y rutas personalizadas con explicaciones (ej. "Ruta sugerida para evitar zona de alto tráfico").

### 3. Hotspots de Demanda y Sugerencias de Zona para Repartidores (Vertex AI Forecasting)

**Contexto Actual:** "Información hotspots demanda (mapas/alertas para maximizar ganancias)" está en "Funciones adicionales".

**Mejora con Vertex AI:** Utilizar modelos de Forecasting para predecir dónde y cuándo habrá mayor demanda de pedidos (hotspots) con mucha más precisión.

**Mapas de Calor Predictivos:** La app muestra un mapa de calor no solo de la demanda actual, sino de la demanda futura en las próximas 1-2 horas, con una probabilidad asociada.

**Sugerencias Proactivas:** Vertex AI puede enviar notificaciones push personalizadas: "La demanda de pedidos en la [Zona X] aumentará un 30% en los próximos 30 minutos. Dirígete allí para maximizar tus ganancias."

**Impacto en App Móvil:** Un mapa de calor dinámico y alertas personalizadas que ayudan al repartidor a posicionarse estratégicamente para conseguir más pedidos.

### 4. Personalización de Metas, Incentivos y Niveles (Vertex AI Recommendation Engine)

**Contexto Actual:** "Niveles gamificados", "Leaderboards", "Sistema de puntos e incentivos" ya existen.

**Mejora con Vertex AI:** Personalizar las metas y sugerir el "próximo paso" óptimo para cada repartidor individual.

**Metas Inteligentes:** En lugar de metas fijas, Vertex AI analiza el rendimiento, el tipo de vehículo y la disponibilidad de cada repartidor para sugerir metas realistas y motivadoras que maximicen sus ganancias y lo ayuden a subir de nivel.

**Sugerencias de Incentivos:** La app puede sugerirle al repartidor "Activa el bono X, te ayudará a llegar al Nivel Plata más rápido."

**Impacto en App Móvil:** En el DashboardScreen o ProfileScreen, las metas e incentivos son dinámicos y adaptados a él, no genéricos. "Tu meta para esta semana: 42 pedidos para alcanzar el bonus de $200."

### 5. Detección de Comportamientos Anómalos y Seguridad (Vertex AI Custom Training / Anomaly Detection)

**Contexto Actual:** "Botón emergencia", "Alertas zonas riesgo", "Detección anomalías (multi-apping, rutas sospechosas)".

**Mejora con Vertex AI:** Potenciar la detección de anomalías y proactividad en seguridad.

**Detección de Multi-Apping (más allá de lo básico):** Modelos de ML que identifican patrones de comportamiento que sugieren el uso simultáneo de múltiples apps, no solo por la presencia de otras apps, sino por patrones de movimiento y aceptación/rechazo.

**Análisis Predictivo de Zonas de Riesgo:** Utilizar datos históricos (incidentes, quejas, reportes) para predecir con mayor granularidad zonas y horarios de riesgo, sugiriendo rutas alternativas o alertando proactivamente.

**Impacto en App Móvil:** Alertas más precisas en la ActiveOrderScreen ("Evita esta calle en este horario por riesgo de [tipo de incidente]"). Feedback sobre su cancellationRate si se detectan patrones anómalos.

### 6. Chatbot de Soporte Proactivo (Vertex AI Generative AI - Gemini Pro)

**Contexto Actual:** "Chatbot IA para consultas rápidas/briefings" y "Escalado a humano" ya están mencionados.

**Mejora con Vertex AI:** Un chatbot más conversacional, contextual y capaz de resolver un mayor porcentaje de consultas sin intervención humana.

**Soporte Autodirigido:** El chatbot integrado en la app (llamando a Gemini Pro) puede responder preguntas complejas sobre la billetera, cómo liquidar deudas, problemas con pedidos específicos, o cómo funciona el sistema de puntos, utilizando el contexto del repartidor (driverId, currentOrderId, walletBalance).

**Briefings Contextuales:** Antes de iniciar una jornada o en una pausa, el chatbot podría ofrecer un "briefing" con información relevante: "Hola [Nombre], la demanda es alta en [Zona X]. Recuerda revisar tu licencia que vence pronto."

**Impacto en App Móvil:** Acceso 24/7 a un asistente inteligente que reduce la necesidad de contactar a soporte humano, mejorando la experiencia del repartidor.

---

Espero que este formato sea mucho más claro y agradable a la vista. ¿Hay alguna otra sección que te gustaría que revisara o algún ajuste adicional que necesites?