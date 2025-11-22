

# 🚀 BEFAST GO - DOCUMENTACIÓN COMPLETA UNIFICADA

*Última actualización: 12 de noviembre de 2025*  
*Versión: 3.0 - Documento Maestro Definitivo*  
*Basado en: BeFast Ecosistema - Documentación Técnica v7.0*

---

## 📋 **ÍNDICE COMPLETO**

### **PARTE 1: INTRODUCCIÓN Y PROPÓSITO**
1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Propósito del Documento](#2-propósito-del-documento)
3. [Filosofía de Diseño y Principios](#3-filosofía-de-diseño-y-principios)

### **PARTE 2: ARQUITECTURA Y SISTEMA**
4. [Arquitectura General del Sistema](#4-arquitectura-general-del-sistema)
5. [Stack Tecnológico 100% Real Producción 2025](#5-stack-tecnológico-100-real-producción-2025)
6. [Estructura de Carpetas y Código](#6-estructura-de-carpetas-y-código)
7. [Configuración de Firebase](#7-configuración-de-firebase)

### **PARTE 3: FLUJOS OPERATIVOS COMPLETOS**
8. [Flujo Completo de un Pedido (Algoritmo Real)](#8-flujo-completo-de-un-pedido-algoritmo-real)
9. [Flujo de Autenticación y Registro](#9-flujo-de-autenticación-y-registro)
10. [Flujo de Operación Principal](#10-flujo-de-operación-principal)
11. [Flujo de Pedido Activo (Crítico)](#11-flujo-de-pedido-activo-crítico)
12. [Flujos de Soporte y Emergencia](#12-flujos-de-soporte-y-emergencia)

### **PARTE 4: PANTALLAS DETALLADAS**
13. [LoginScreen](#13-loginscreen)
14. [RegistrationScreen (5 Pasos)](#14-registrationscreen-5-pasos)
15. [DashboardScreen](#15-dashboardscreen)
16. [OrdersScreen](#16-ordersscreen)
17. [WalletScreen](#17-walletscreen)
18. [NavigationScreen](#18-navigationscreen)
19. [ProfileScreen](#19-profilescreen)
20. [OrderDetailScreen](#20-orderdetailscreen)
21. [DeliveryConfirmationScreen](#21-deliveryconfirmationscreen)
22. [ChatScreen](#22-chatscreen)
23. [EmergencyScreen](#23-emergencyscreen)
24. [Componentes Críticos](#24-componentes-críticos)

### **PARTE 5: LÓGICA Y DATOS**
25. [Modelo de Datos Unificado Firestore](#25-modelo-de-datos-unificado-firestore)
26. [Arquitectura del Estado Global (Redux)](#26-arquitectura-del-estado-global-redux)
27. [Matriz de Flujo de Datos (UI → Backend)](#27-matriz-de-flujo-de-datos-ui--backend)
28. [Validaciones y Reglas de Negocio](#28-validaciones-y-reglas-de-negocio)

### **PARTE 6: LÓGICA CRÍTICA IMPLEMENTADA**
29. [Lógica Financiera Central](#29-lógica-financiera-central)
30. [Lógica de Asignación de Pedidos](#30-lógica-de-asignación-de-pedidos)
31. [Lógica de Clasificación Laboral](#31-lógica-de-clasificación-laboral)
32. [Validación Crítica 360°](#32-validación-crítica-360)
33. [Auditoría "Doble Contador"](#33-auditoría-doble-contador)

### **PARTE 7: IMPLEMENTACIÓN Y MVP**
34. [Funcionalidades Obligatorias (22 Críticas + Extras)](#34-funcionalidades-obligatorias-22-críticas--extras)
35. [Resumen Rápido MVP](#35-resumen-rápido-mvp)
36. [Checklist de Dependencias del Backend](#36-checklist-de-dependencias-del-backend)
37. [Configuración Técnica y Deployment](#37-configuración-técnica-y-deployment)

---

## **PARTE 1: INTRODUCCIÓN Y PROPÓSITO**

### 1. Resumen Ejecutivo

BeFast GO es la aplicación móvil nativa (Android/iOS) para repartidores del ecosistema BeFast. Esta aplicación conecta repartidores con pedidos de manera eficiente, segura y formal, siendo el **motor único de distribución y validación** del ecosistema. La aplicación cubre registro, funcionalidades, pantallas, flujos, recomendaciones técnicas, implementación y mejoras con IA.

**Objetivo Principal:** Proporcionar una herramienta escalable para desarrolladores, stakeholders y usuarios, maximizando ganancias, seguridad y eficiencia, cumpliendo con las normativas mexicanas (RFC, CURP, NSS, SAT/IMSS, Acta IDSE obligatoria para pedidos). La aplicación integra geolocalización en tiempo real, notificaciones push, gamificación y formalidad laboral (empleados con prestaciones).

### 2. Propósito del Documento

Este documento **NO modifica tu app existente**. Su propósito es definir exactamente **cómo integrar tu BeFast GO actual con el ecosistema BeFast** para operar como sistema único y completo.

**IMPORTANTE**: El registro de conductores está **disponible tanto en portal web como en la app móvil** con el mismo proceso de 5 pasos. Los documentos son **solo lectura** después del registro inicial.

### 3. Filosofía de Diseño y Principios

**Principios Fundamentales:**
1. **El Backend es el Cerebro:** La app móvil solo muestra datos y dispara acciones
2. **Validación 360°:** IDSE aprobado obligatorio para operar
3. **Límite de Deuda:** 300 MXN máximo para pedidos efectivo
4. **Auditoría Doble:** BeFast + Vertex AI independiente en cada transacción
5. **Tiempo Real:** Listeners Firestore para estado inmediato

---

## **PARTE 2: ARQUITECTURA Y SISTEMA**

### 4. Arquitectura General del Sistema

```
Cliente (App/Web BeFast) ←→ Firebase (Firestore RT + Cloud Functions 22 críticas)
Negocio (Panel BeFast) ←→ Firebase (Firestore RT + Cloud Functions)
BeFast GO (esta app) ←→ Firebase (Auth + Firestore listeners + FCM + Storage) 
                           + Cloud Functions (validateOrderAssignment, handleOrderWorkflow, processOrderCompletion, auditFinancialTransaction, etc.)
                           + Vertex AI Gemini Pro (auditoría doble, scoring, OCR, chatbot)
                           + Google Maps SDK + Mapbox + Navigation SDK
```

**Flujo de Comunicación:**
- **App Móvil → Firestore:** Listeners en tiempo real para orders, driver status, wallet
- **App Móvil → Cloud Functions:** Acciones de negocio (acceptOrder, completeOrder, etc.)
- **Cloud Functions → Vertex AI:** Validaciones, auditorías, scoring, OCR
- **Cloud Functions → APIs Externas:** Conekta, Stripe, Mapbox
- **Firestore → App Móvil:** Actualizaciones en tiempo real via listeners

### 5. Stack Tecnológico 100% Real Producción 2025

| Capa | Tecnología Exacta Usada | Justificación Técnica Real | Versión |
|------|------------------------|---------------------------|---------|
| **Frontend Móvil** | React Native 0.74+ (Expo) + TypeScript | Un solo código base, hot reload desarrollo | 0.74.1 |
| **Estado Global** | Redux Toolkit + RTK Query | Gestión estado predecible, cache automático | 1.9.7 |
| **Navegación** | React Navigation 6.x + Deep Linking | Navegación nativa, links FCM a pantallas específicas | 6.5.9 |
| **Backend Services** | Firebase Cloud Functions (Node.js 18) | Escalabilidad automática, sin gestión servidores | 11.5.0 |
| **Base de Datos** | Firestore + Redis Cache | Listeners RT, queries complejas, cache sesión | 10.1.0 |
| **Autenticación** | Firebase Auth + Custom Claims | Login social, verificación email/teléfono | 10.1.0 |
| **Notificaciones** | FCM (Foreground/Background) | Modal 60s, sonido, vibración, deep linking | 12.1.0 |
| **Mapas y Rutas** | Google Maps SDK + Mapbox + Navigation SDK | Turn-by-turn, polylines, geofencing, ETA tráfico | 9.2.0 |
| **Pagos** | Conekta + Stripe Connect + SPEI CLABE | Límite 300 MXN, retiros 2FA, compliance México | 4.12.0 |
| **Inteligencia Artificial** | Vertex AI Gemini Pro 1.5 | Auditoría doble, scoring riesgo, OCR documentos | 1.0.0 |
| **Almacenamiento** | Firebase Storage | Fotos entrega, documentos, firmas canvas | 10.1.0 |
| **Monitoreo** | Sentry + Firebase Performance | Crash reporting, métricas rendimiento | 5.15.0 |

### 6. Estructura de Carpetas y Código

```
src/
├── assets/                 # Recursos estáticos
│   ├── images/            # PNG, JPG, SVG
│   ├── fonts/             # Tipografías custom
│   └── lottie/            # Animaciones JSON
├── components/            # Componentes reutilizables
│   ├── ui/                # Componentes base (Button, Input, Card)
│   ├── shared/            # Componentes negocio (KpiCard, OrderListItem)
│   ├── modals/            # Modales (NewOrderModal, StatusModal)
│   └── maps/              # Componentes mapa (LiveRoute, Heatmap)
├── config/                # Configuraciones
│   ├── firebase.ts        # Firebase configuration
│   ├── maps.ts            # Mapbox/Google Maps keys
│   └── constants.ts       # Constantes app
├── navigation/            # Navegación completa
│   ├── AppNavigator.tsx   # Navegador principal
│   ├── AuthNavigator.tsx  # Stack login/registro
│   ├── MainTabNavigator.tsx # 5 pestañas principales
│   ├── OrderStackNavigator.tsx # Stack pedido activo
│   └── types.ts           # TypeScript navigation types
├── screens/               # Todas las pantallas
│   ├── Auth/              # Autenticación
│   │   ├── LoginScreen.tsx
│   │   ├── RegistrationScreen.tsx
│   │   └── ForgotPasswordScreen.tsx
│   ├── Main/              # Pestañas principales
│   │   ├── DashboardScreen.tsx
│   │   ├── OrdersScreen.tsx
│   │   ├── WalletScreen.tsx
│   │   ├── NavigationScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── OrderFlow/         # Flujo pedido activo
│   │   ├── OrderDetailScreen.tsx
│   │   ├── DeliveryConfirmationScreen.tsx
│   │   └── OrderRatingScreen.tsx
│   └── Support/           # Soporte y ayuda
│       ├── ChatScreen.tsx
│       ├── EmergencyScreen.tsx
│       └── DocumentsScreen.tsx
├── services/              # Servicios y APIs
│   ├── DriverService.ts   # Cloud Functions driver
│   ├── OrderService.ts    # Cloud Functions orders
│   ├── PaymentService.ts  # Conekta/Stripe
│   ├── MapService.ts      # Google Maps/Mapbox
│   └── NotificationService.ts # FCM handling
├── store/                 # Estado global Redux
│   ├── index.ts           # Store configuration
│   └── slices/            # Redux slices
│       ├── authSlice.ts   # Auth y datos driver
│       ├── ordersSlice.ts # Orders y pedidos
│       ├── navigationSlice.ts # Estado navegación
│       └── notificationsSlice.ts # Notificaciones
├── types/                 # TypeScript types
│   ├── driver.ts          # Tipos driver
│   ├── order.ts           # Tipos order
│   ├── navigation.ts      # Tipos navegación
│   └── global.ts          # Tipos globales
└── utils/                 # Utilidades
    ├── validators.ts      # Validaciones formularios
    ├── formatters.ts      # Formato fechas/números
    ├── geolocation.ts     # Utilidades ubicación
    └── emergency.ts       # Utilidades emergencia
```

### 7. Configuración de Firebase

#### 1. Configuración del Proyecto

```typescript
// firebase.config.ts (en tu app existente)
const firebaseConfig = {
  apiKey: "AIzaSyBqJxKuoZ8X7X7X7X7X7X7X7X7X7X7X7X7",
  authDomain: "befast-hfkbl.firebaseapp.com",
  projectId: "befast-hfkbl",                    // ← MISMO PROYECTO
  storageBucket: "befast-hfkbl.appspot.com",
  messagingSenderId: "897579485656",
  appId: "1:897579485656:android:abc123def456"
};
```

#### 2. Colecciones de Firestore (Usar las existentes)

```typescript
// collections.ts (usar exactamente estas)
export const COLLECTIONS = {
  // Conductores
  DRIVERS: 'drivers',
  DRIVER_APPLICATIONS: 'driverApplications',
  
  // Pedidos
  ORDERS: 'orders',
  ORDER_TIMELINE: 'orderTimeline',
  
  // Financiero
  WALLET_TRANSACTIONS: 'walletTransactions',
  CREDIT_TRANSACTIONS: 'creditTransactions',
  
  // Sistema
  SYSTEM_LOGS: 'systemLogs',
  AUDIT_LOGS: 'auditLogs'
};
```

---

## **PARTE 3: FLUJOS OPERATIVOS COMPLETOS**

### 8. Flujo Completo de un Pedido (Algoritmo Real)

```pseudo
1. 🏁 PEDIDO CREADO (status = SEARCHING)
   ├── Fuente 1: Portal Delivery (/delivery/new-order)
   ├── Fuente 2: Webhook Market (BeFast Market)
   └── Cloud Function: createOrder

2. 🔍 VALIDACIÓN Y FILTRADO CONDUCTORES
   ├── Cloud Function: validateOrderAssignment
   ├── Filtros OBLIGATORIOS:
   │   ├── isOnline = true
   │   ├── befastStatus = ACTIVE  
   │   ├── ≤3 pedidos activos simultáneos
   │   ├── idseApproved = true (GATE CRÍTICO)
   │   ├── documentsStatus = APPROVED
   │   ├── trainingStatus = COMPLETED
   │   └── CASH → pendingDebts < 300 MXN

3. 🧠 SCORING Y ASIGNACIÓN INTELIGENTE
   ├── Score inicial: distancia 50% + carga trabajo 30% + rating 20%
   ├── Vertex AI Gemini: aiScore ≥0.5 + risk = LOW
   └── Lista final ordenada por score descendente

4. 📢 BROADCAST A CONDUCTORES ELEGIBLES
   ├── FCM simultáneo a todos elegibles
   ├── Payload: orderId, pickup, delivery, earnings, paymentMethod
   └── Tiempo respuesta: 60 segundos

5. ✅ ACEPTACIÓN Y ASIGNACIÓN FINAL
   ├── Primer aceptador válido → status ACCEPTED + driverId asignado
   ├── Cloud Function: validateOrderAssignment (validación final <2s)
   ├── Otros reciben cancelación automática
   └── Nadie acepta → re-difusión (aumenta radio) o FAILED

6. 🚗 INICIO DE RUTA
   ├── Repartidor → "Iniciar ruta" → STARTED
   ├── Tracking GPS: cada 10 segundos o 10 metros
   └── Actualización ETA en tiempo real

7. 🏪 LLEGADA A PICKUP
   ├── Geofence trigger (100m radio)
   ├── "Llegué restaurante" → PICKED_UP
   └── WhatsApp automático al cliente

8. 🏠 LLEGADA A ENTREGA
   ├── Geofence trigger (100m radio) 
   ├── "Llegué destino" → foto obligatoria + PIN/firma + cobro efectivo si CASH
   └── Validación evidencia en tiempo real

9. 🔐 COMPLETACIÓN Y AUDITORÍA DOBLE
   ├── "Completar entrega" → processOrderCompletion
   ├── Valida evidencia → PricingService calcula ganancia
   ├── AUDITORÍA DOBLE:
   │   ├── BeFast cálculo interno
   │   └── Vertex AI independiente
   │   ├── MATCH → escribe wallet/deuda + transacciones
   │   └── MISMATCH → rechaza + alerta soporte
   └── Cloud Function: auditFinancialTransaction

10. 📊 POST-PROCESAMIENTO
    ├── Status COMPLETED
    ├── Recuperación deuda automática si saldo > 0
    ├── Calificación mutua + propina post-entrega (100% repartidor)
    └── Actualización KPIs y stats en tiempo real
```

**Estados del Pedido:**
```typescript
type OrderStatus = 
  | 'SEARCHING'      // Buscando repartidor
  | 'ASSIGNED'       // Asignado, esperando confirmación
  | 'ACCEPTED'       // Aceptado por repartidor
  | 'STARTED'        // En ruta a pickup
  | 'PICKED_UP'      // Pedido recolectado
  | 'IN_TRANSIT'     // En camino a entrega
  | 'ARRIVED'        // Llegó a destino
  | 'COMPLETED'      // Entregado y pagado
  | 'CANCELLED'      // Cancelado
  | 'FAILED';        // Falló asignación
```

### 9. Flujo de Autenticación y Registro

#### Flujo de Login
```pseudo
1. 📱 Pantalla Login
   ├── Input: email + password
   ├── Botón: "Iniciar Sesión"
   ├── Botón: "Crear Cuenta" → RegistrationScreen
   └── Link: "¿Olvidaste contraseña?" → ForgotPasswordScreen

2. 🔐 Autenticación Firebase
   ├── firebase.auth().signInWithEmailAndPassword(email, password)
   ├── ✅ Éxito → Obtiene uid
   ├── ❌ Error → Muestra mensaje específico
   └── Loading state durante proceso

3. 📊 Carga Perfil Conductor
   ├── db.collection('drivers').doc(uid).get()
   ├── Verifica administrative.idseApproved === true
   ├── Verifica documentsStatus === 'APPROVED'
   ├── Verifica trainingStatus === 'COMPLETED'
   └── Carga wallet, stats, operational status

4. 🚦 Validación 360° Bloqueante
   ├── Si !idseApproved → Modal bloqueante + botón soporte
   ├── Si documentsStatus !== 'APPROVED' → Modal documentos pendientes
   ├── Si trainingStatus !== 'COMPLETED' → Modal capacitación pendiente
   └── Si pendingDebts >= 300 → Modal deuda + recuperación

5. 🏠 Navegación a Dashboard
   ├── dispatch(setDriver(data)) → Redux state
   └── navigation.navigate('Main')
```

#### Flujo de Registro (5 Pasos Detallados)

**Paso 1: Datos Personales y Vehículo**
```typescript
// Campos requeridos:
interface Step1Data {
  fullName: string;
  email: string;
  phone: string;
  rfc: string;
  curp: string;
  nss?: string;
  vehicle: {
    type: 'MOTORCYCLE' | 'CAR' | 'BICYCLE';
    plates: string;
    model: string;
    year: number;
  };
  bankAccount: {
    clabe: string;  // CLABE BBVA fija
    bankName: string;
  };
}
```

**Paso 2: Documentos Obligatorios**
```typescript
// Documentos a subir:
interface Step2Data {
  ineFront: File;           // INE frente
  ineBack: File;            // INE reverso
  rfcDocument: File;        // Constancia situación fiscal
  driversLicense: File;     // Licencia conducir
  vehicleCirculation: File; // Tarjeta circulación
  vehicleInsurance?: File;  // Seguro (opcional)
  
  // Vertex AI OCR validation automática
  ocrResults: {
    ineValid: boolean;
    rfcMatch: boolean;
    licenseValid: boolean;
  };
}
```

**Paso 3: Contrato y Términos Legales**
```typescript
// Contratos a aceptar:
interface Step3Data {
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedAlgorithmicPolicy: boolean;
  acceptedContract: boolean;
  
  // Documentos legales:
  documents: {
    termsUrl: string;
    privacyUrl: string;
    algorithmicPolicyUrl: string;
    contractUrl: string;
  };
}
```

**Paso 4: Capacitación y Evaluación**
```typescript
interface Step4Data {
  // Video capacitación visto
  trainingVideoWatched: boolean;
  
  // Quiz evaluación (mínimo 80%)
  quizScore: number;
  quizAnswers: {
    question1: string;
    question2: string;
    // ... 10 preguntas total
  };
  
  // Foto equipo obligatorio
  equipmentPhoto: File;  // Mochila/equipo BeFast
}
```

**Paso 5: Revisión y Envío**
```typescript
interface Step5Data {
  // Resumen de toda la información
  reviewData: {
    personal: Step1Data;
    documents: Step2Data;
    legal: Step3Data;
    training: Step4Data;
  };
  
  // Confirmación final
  finalConfirmation: boolean;
}
```

**Lógica de Envío Registration:**
```pseudo
1. 📤 "Enviar Solicitud"
   ├── Valida todos los campos completos
   ├── Sube archivos a Firebase Storage
   │   ├── documents/{driverId}/ine_front.jpg
   │   ├── documents/{driverId}/ine_back.jpg
   │   └── ... todos los documentos
   └── Muestra loading state

2. 🧠 Cloud Function: submitDriverApplication
   ├── Recibe todos los datos + URLs documentos
   ├── Crea documento en drivers/{uid}/application
   ├── Estado inicial: applicationStatus = 'UNDER_REVIEW'
   └── Dispara Vertex AI OCR validation

3. 🔍 Vertex AI: documentValidator
   ├── Procesa cada documento con Gemini Pro
   ├── Valida INE: nombre, CURP, fecha expedición
   ├── Valida RFC: coincide con nombre y datos
   ├── Valida Licencia: vigencia, tipo correcto
   └── Guarda resultados en application ocrResults

4. 📊 Revisión Admin (Backend)
   ├── Admin recibe notificación nueva solicitud
   ├── Ve resultados OCR + documentos
   ├── Aprueba/rechaza manualmente si es necesario
   └── Actualiza applicationStatus

5. 📱 Notificación a Usuario
   ├── FCM: "Solicitud aprobada" → Login
   ├── FCM: "Solicitud rechazada" → Motivos + rehacer
   └── Estado visible en app durante proceso
```

### 10. Flujo de Operación Principal

#### Flujo Dashboard Principal
```pseudo
1. 🔄 Carga Inicial Dashboard
   ├── Listeners Firestore en tiempo real:
   │   ├── drivers/{uid} → wallet, status, kpis
   │   ├── orders → activeOrder, unacceptedOrders
   │   └── walletTransactions → últimas transacciones
   ├── Verifica canReceiveOrders === true
   └── Si !canReceiveOrders → muestra modal bloqueante

2. 🎛️ Botón ONLINE/OFFLINE
   ├── Toggle cambia operational.isOnline
   ├── Cloud Function: updateDriverStatus
   │   ├── Actualiza Firestore
   │   └── Notifica sistema asignación
   ├── ONLINE → Empieza a recibir FCM pedidos
   └── OFFLINE → Stop recepción pedidos

3. 📊 Actualización KPIs Tiempo Real
   ├── todayCompletedOrders → Pedidos hoy
   ├── acceptanceRate → % aceptación
   ├── avgDeliveryTime → Tiempo promedio
   ├── rating → Calificación promedio
   └── Se actualizan automáticamente vía listeners

4. 🔔 Notificaciones FCM
   ├── Foreground: Modal NewOrderModal 60s
   ├── Background: Notificación sistema + deep link
   ├── Data payload: orderId, pickup, delivery, earnings
   └── Sonido + vibración obligatorios
```

#### Flujo Recepción y Aceptación Pedidos
```pseudo
1. 📢 Nueva Orden Disponible
   ├── Sistema encuentra conductores elegibles
   ├── FCM a todos conductores elegibles simultáneamente
   ├── Payload normalizado:
   │   ├── type: 'NEW_ORDER'
   │   ├── orderId: '12345'
   │   ├── pickup: { address, name, phone }
   │   ├── delivery: { address, customerName, phone }
   │   ├── earnings: 85.50
   │   ├── paymentMethod: 'CARD' | 'CASH'
   │   └── expiresIn: 60 // segundos
   └── Timestamp para evitar duplicados

2. 🗣️ Modal NewOrderModal
   ├── Fullscreen overlay 60s countdown
   ├── Muestra información esencial pedido
   ├── Botones grandes "ACEPTAR" / "RECHAZAR"
   ├── Sonido fuerte + vibración continua
   └── Auto-rechaza si se acaba tiempo

3. ✅ Aceptación Pedido
   ├── Botón "ACEPTAR" → dispatch(acceptOrder(orderId))
   ├── Cloud Function: validateOrderAssignment
   │   ├── Valida IDSE aprobado (GATE CRÍTICO)
   │   ├── Valida documentsStatus === 'APPROVED'
   │   ├── Valida trainingStatus === 'COMPLETED'
   │   ├── Valida pendingDebts < 300 (si CASH)
   │   ├── Vertex AI: orderValidationEnhanced
   │   └── Si todo OK → asigna pedido
   ├── Otros conductores reciben "order_assigned_to_other"
   └── Navegación automática a OrderDetailScreen

4. ❌ Rechazo Pedido
   ├── Botón "RECHAZAR" → dispatch(rejectOrder(orderId))
   ├── Registra motivo (opcional)
   ├── Actualiza KPIs acceptanceRate
   ├── Sistema busca siguiente conductor
   └── Modal se cierra, vuelve a Dashboard
```

### 11. Flujo de Pedido Activo (Crítico)

#### Flujo Navegación y Estados Pedido
```pseudo
1. 🗺️ OrderDetailScreen - Estado ASSIGNED
   ├── Mapa con ruta a pickup
   ├── Botón: "Iniciar Ruta" → status STARTED
   ├── Timeline: "Asignado" → "En camino a tienda"
   ├── Info: Tienda, dirección, teléfono
   └── Botones: Llamar, WhatsApp, Chat

2. 🏪 OrderDetailScreen - Estado STARTED
   ├── Mapa con polyline animada a tienda
   ├── Tracking GPS cada 10s/10m
   ├── ETA actualizado con tráfico real
   ├── Geofence trigger 100m radio tienda
   └── Auto-activa "Llegué a tienda" en geofence

3. 📦 OrderDetailScreen - Estado PICKED_UP
   ├── Botón: "Confirmar Recogida"
   ├── WhatsApp automático a cliente: "Pedido en camino"
   ├── Cambia ruta a dirección entrega
   ├── Timeline: "Pedido recolectado" → "En camino a entrega"
   └── Inicia countdown tiempo entrega

4. 🚚 OrderDetailScreen - Estado IN_TRANSIT
   ├── Mapa con polyline a destino
   ├── ETA cliente actualizado en tiempo real
   ├── Geofence trigger 100m radio destino
   ├── Auto-activa "Llegué al destino"
   └── Botones contacto cliente activos

5. 🏠 OrderDetailScreen - Estado ARRIVED
   ├── Botón: "Confirmar Entrega" 
   ├── Navegación a DeliveryConfirmationScreen
   ├── Timeline: "Llegó a destino" → "Confirmando entrega"
   └── Preparación para evidencia
```

#### Flujo Confirmación Entrega y Auditoría
```pseudo
1. 📸 DeliveryConfirmationScreen
   ├── Si paymentMethod === 'CASH':
   │   ├── Muestra "Monto a cobrar: $XXX"
   │   ├── Input: "Efectivo recibido"
   │   └── Valida monto ≥ monto pedido
   ├── Cámara: Foto obligatoria evidencia entrega
   │   ├── Calidad mínima 720p
   │   ├── Must include package + location
   │   └── Validación AI de calidad foto
   ├── SignaturePad: Firma cliente (tablet)
   ├── PIN: Código confirmación 4 dígitos
   └── Botón: "Completar Entrega"

2. 🔐 Proceso Completación
   ├── Sube foto y firma a Storage
   ├── dispatch(completeOrder(orderId, proofData))
   ├── Cloud Function: processOrderCompletion
   │   ├── Valida evidencia completa
   │   ├── PricingService.calculateEarnings()
   │   ├── Vertex AI: financialAuditor (auditoría doble)
   │   ├── manageFinancialOperationsConsolidated
   │   └── Vertex AI: routeDataCollector
   └── Loading state durante procesamiento

3. 🧾 Auditoría Doble Financiera
   ├── BeFast cálculo:
   │   ├── baseFee + distanceFee + timeFee + tips
   │   └── cashHandlingFee si efectivo
   ├── Vertex AI cálculo independiente:
   │   ├── Analiza misma data
   │   ├── Considera factores contexto
   │   └── Devuelve amount + confidence
   ├── MATCH (diferencia < 5%):
   │   ├── Aprobar transacción
   │   ├── Escribir walletTransactions
   │   └── Actualizar walletBalance/pendingDebts
   └── MISMATCH (diferencia ≥ 5%):
   │   ├── Rechazar transacción
   │   ├── Alertar soporte WhatsApp
   │   └── Pedir revisión manual

4. 💰 Actualización Wallet
   ├── Si paymentMethod === 'CARD':
   │   ├── walletBalance += earnings
   │   ├── Transacción: CARD_ORDER_TRANSFER
   │   └── Recuperación deuda automática si balance > 0
   ├── Si paymentMethod === 'CASH':
   │   ├── pendingDebts += earnings
   │   ├── Transacción: CASH_ORDER_ADEUDO
   │   └── Límite 300 MXN enforced
   └── Listeners actualizan UI tiempo real

5. ⭐ Rating y Propina
   ├── Pantalla OrderRatingScreen post-entrega
   ├── Califica cliente de 1-5 estrellas
   ├── Propina opcional (100% repartidor)
   ├── Actualiza rating promedio conductor
   └── Navegación a Dashboard
```

### 12. Flujos de Soporte y Emergencia

#### Flujo Chatbot IA 24/7
```pseudo
1. 💬 Inicio ChatScreen
   ├── Lista mensajes anterior vacía
   ├── Input texto + botón enviar
   ├── Sugerencias rápidas:
   │   ├── "Problema con pedido"
   │   ├── "Error en wallet"
   │   ├── "Documentos rechazados"
   │   └── "Emergencia en ruta"

2. 🧠 Procesamiento Mensaje
   ├── dispatch(sendChatMessage(text))
   ├── Cloud Function: chatbotHandler
   │   ├── Contexto: driver data, active order, location
   │   ├── Vertex AI Gemini con grounding:
   │   │   ├── Conocimiento políticas BeFast
   │   │   ├── Datos específicos conductor
   │   │   ├── Estado pedido activo
   │   │   └── MAP_ACTION si necesita navegación
   │   └── Respuesta contextual personalizada
   ├── Muestra typing indicator
   └── Actualiza lista mensajes

3. 🗺️ Acciones Contextuales (MAP_ACTION)
   ├── Si mensaje contiene "mostrar ruta":
   │   └── Deep link a NavigationScreen
   ├── Si mensaje contiene "documentos":
   │   └── Navegación a DocumentsScreen
   ├── Si mensaje contiene "wallet":
   │   └── Navegación a WalletScreen
   └── Si mensaje contiene "emergencia":
   │   └── Navegación a EmergencyScreen
```

#### Flujo Emergencia y Botón Pánico
```pseudo
1. 🆘 EmergencyScreen
   ├── Botón grande rojo "BOTÓN PÁNICO"
   ├── Botón "Llamar 911"
   ├── Botón "Contactar Soporte BeFast"
   ├── Botón "Reportar Incidente"
   └── Status ubicación compartida

2. 🚨 Acción Botón Pánico
   ├── dispatch(triggerEmergency())
   ├── Comparte ubicación en tiempo real:
   │   ├── drivers/{uid}/emergencyLocation
   │   ├── Actualización cada 5 segundos
   │   └── 15 minutos automático o hasta cancelar
   ├── Notificación inmediata a soporte:
   │   ├── FCM a todos admins
   │   ├── WhatsApp mensaje urgente
   │   ├── Datos: conductor, ubicación, pedido activo
   │   └── Botón llamada directa
   ├── Llamada automática a soporte BeFast
   └── Registro en incidentes con timestamp

3. 📞 Llamadas de Emergencia
   ├── "Llamar 911" → Linking.openURL('tel:911')
   ├── "Contactar Soporte" → Linking.openURL('tel:+522221234567')
   ├── Llamada enmascarada si necesario
   └── Registro llamadas en analytics

4. 📋 Reporte Incidente
   ├── Formulario detalles incidente
   ├── Fotos opcionales
   ├── Tipo: Accidente, Robo, Enfermedad, Otro
   ├── Envío a soporte para seguimiento
   └── Número caso para referencia
```

---

## **PARTE 4: PANTALLAS DETALLADAS**

### 13. LoginScreen

**Archivo:** `src/screens/Auth/LoginScreen.tsx`

**Componentes UI:**
```jsx
<View style={styles.container}>
  {/* Header */}
  <Image source={require('assets/logo-befast.png')} style={styles.logo} />
  <Text style={styles.title}>BeFast Repartidores</Text>
  
  {/* Form */}
  <TextInput
    placeholder="Correo electrónico"
    value={email}
    onChangeText={setEmail}
    autoCapitalize="none"
    keyboardType="email-address"
  />
  <TextInput
    placeholder="Contraseña"
    value={password}
    onChangeText={setPassword}
    secureTextEntry
  />
  
  {/* Actions */}
  <Button 
    title="Iniciar Sesión" 
    onPress={handleLogin}
    loading={isLoading}
  />
  
  <Button 
    title="Crear una cuenta" 
    type="outline"
    onPress={() => navigation.navigate('Registration')}
  />
  
  <Text 
    style={styles.forgotPassword}
    onPress={() => navigation.navigate('ForgotPassword')}
  >
    ¿Olvidaste tu contraseña?
  </Text>
</View>
```

**Estados y Validaciones:**
```typescript
interface LoginState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}

const validateForm = (email: string, password: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && password.length >= 6;
};
```

**Lógica de Conexión:**
```typescript
const handleLogin = async () => {
  if (!validateForm(email, password)) {
    setError('Por favor ingresa un email y contraseña válidos');
    return;
  }
  
  setIsLoading(true);
  setError(null);
  
  try {
    const result = await dispatch(loginUser({ email, password })).unwrap();
    
    // Redux actualiza estado automáticamente
    // Listeners se activan para datos en tiempo real
    
  } catch (error: any) {
    setError(getLoginErrorMessage(error.code));
  } finally {
    setIsLoading(false);
  }
};
```

### 14. RegistrationScreen (5 Pasos)

**Archivo:** `src/screens/Auth/RegistrationScreen.tsx`

**Estructura Principal:**
```jsx
<View style={styles.container}>
  {/* Progress Header */}
  <View style={styles.progressHeader}>
    <Text style={styles.stepTitle}>Paso {currentStep} de 5</Text>
    <Progress.Bar 
      progress={currentStep / 5} 
      width={null} 
    />
    <Text style={styles.stepSubtitle}>{getStepTitle(currentStep)}</Text>
  </View>

  {/* Step Content */}
  {renderStepContent()}

  {/* Navigation Buttons */}
  <View style={styles.navigationButtons}>
    {currentStep > 1 && (
      <Button 
        title="Anterior" 
        onPress={handlePrevious}
        type="outline"
      />
    )}
    <Button 
      title={currentStep === 5 ? "Enviar Solicitud" : "Siguiente"} 
      onPress={handleNext}
      loading={isSubmitting}
    />
  </View>
</View>
```

**Lógica de Envío Registration:**
```typescript
const handleSubmitApplication = async () => {
  if (!formData.finalConfirmation) {
    Alert.alert('Confirmación requerida', 'Debes confirmar que la información es correcta');
    return;
  }

  setIsSubmitting(true);

  try {
    // 1. Subir documentos a Storage
    const documentUrls = await uploadDocumentsToStorage(formData.documents);
    
    // 2. Llamar Cloud Function
    const result = await dispatch(submitDriverApplication({
      personalData: formData.personal,
      documents: documentUrls,
      legal: formData.legal,
      training: formData.training
    })).unwrap();

    // 3. Navegar a pantalla de éxito
    navigation.navigate('ApplicationSubmitted', {
      applicationId: result.applicationId
    });

  } catch (error) {
    Alert.alert(
      'Error al enviar',
      'No pudimos procesar tu solicitud. Intenta nuevamente.',
      [{ text: 'OK' }]
    );
  } finally {
    setIsSubmitting(false);
  }
};
```

### 15. DashboardScreen

**Archivo:** `src/screens/Main/DashboardScreen.tsx`

**Componentes Principales:**
```jsx
<View style={styles.container}>
  
  {/* Header con Status */}
  <View style={styles.header}>
    <Text style={styles.greeting}>¡Hola, {driver?.fullName}!</Text>
    <DriverStatusToggle />
  </View>

  <ScrollView showsVerticalScrollIndicator={false}>
    
    {/* Wallet Widget */}
    <WalletWidget 
      balance={driver?.wallet.balance || 0}
      pendingDebts={driver?.wallet.pendingDebts || 0}
      onPress={() => navigation.navigate('Wallet')}
    />

    {/* Today's Stats */}
    <TodayStatsWidget 
      completedOrders={driver?.kpis.todayCompletedOrders || 0}
      todayEarnings={driver?.kpis.todayTotal || 0}
      onPress={() => navigation.navigate('Orders')}
    />

    {/* Status Module */}
    <DriverStatusModule 
      status={driver?.operational.status}
      canReceiveOrders={driver?.operational.canReceiveOrders}
      blockReason={driver?.operational.blockReason}
    />

    {/* KPIs Grid */}
    <View style={styles.kpisSection}>
      <Text style={styles.sectionTitle}>Tus Métricas</Text>
      <View style={styles.kpisGrid}>
        <KpiCard
          title="Aceptación"
          value={`${driver?.kpis.acceptanceRate || 0}%`}
          subtitle="Tasa de aceptación"
          trend={driver?.kpis.acceptanceTrend}
        />
        <KpiCard
          title="Calificación"
          value={driver?.kpis.rating?.toFixed(1) || '0.0'}
          subtitle="Promedio estrellas"
          icon="star"
        />
        <KpiCard
          title="Tiempo Prom."
          value={`${driver?.kpis.avgDeliveryTime || 0}m`}
          subtitle="Minutos por entrega"
          trend="down"
        />
        <KpiCard
          title="Pedidos Activos"
          value={activeOrdersCount}
          subtitle="En progreso"
          onPress={() => navigation.navigate('Orders')}
        />
      </View>
    </View>

    {/* Quick Actions */}
    <View style={styles.quickActions}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.actionsGrid}>
        <QuickActionButton
          icon="document"
          title="Mis Documentos"
          onPress={() => navigation.navigate('Documents')}
        />
        <QuickActionButton
          icon="help"
          title="Soporte"
          onPress={() => navigation.navigate('Chat')}
        />
        <QuickActionButton
          icon="map"
          title="Zonas Activas"
          onPress={() => navigation.navigate('Navigation')}
        />
        <QuickActionButton
          icon="cash"
          title="Retirar Fondos"
          onPress={() => navigation.navigate('Withdraw')}
          disabled={!canWithdrawFunds}
        />
      </View>
    </View>

  </ScrollView>

  {/* Floating Action Buttons */}
  <FloatingButtons />
</View>
```

### 16. OrdersScreen

**Archivo:** `src/screens/Main/OrdersScreen.tsx`

**Estructura con Tabs:**
```jsx
<Tab.Navigator
  screenOptions={{
    tabBarLabelStyle: styles.tabLabel,
    tabBarIndicatorStyle: styles.tabIndicator,
  }}
>
  <Tab.Screen 
    name="Active" 
    component={ActiveOrdersTab}
    options={{ title: 'Nuevas y Activas' }}
  />
  <Tab.Screen 
    name="History" 
    component={OrderHistoryTab}
    options={{ title: 'Historial' }}
  />
</Tab.Navigator>
```

**NewOrderCard con Timer:**
```jsx
const NewOrderCard = ({ order, onAccept, onReject }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onReject();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, onReject]);

  return (
    <View style={styles.newOrderCard}>
      
      {/* Header con Timer */}
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>¡Nuevo Pedido!</Text>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      </View>

      {/* Order Info */}
      <View style={styles.orderInfo}>
        <InfoRow icon="store" text={order.pickup.name} />
        <InfoRow icon="location" text={order.pickup.address} />
        <InfoRow icon="person" text={order.delivery.customerName} />
        <InfoRow icon="location" text={order.delivery.address} />
        <InfoRow icon="cash" text={`$${order.estimatedEarnings}`} />
        <InfoRow icon="payment" text={order.paymentMethod === 'CASH' ? 'Efectivo' : 'Tarjeta'} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Rechazar"
          onPress={onReject}
          type="outline"
          style={styles.rejectButton}
        />
        <Button
          title="Aceptar"
          onPress={onAccept}
          style={styles.acceptButton}
        />
      </View>

    </View>
  );
};
```

### 17. WalletScreen

**Archivo:** `src/screens/Main/WalletScreen.tsx`

**Estructura Principal:**
```jsx
<View style={styles.container}>
  
  {/* Balance Header */}
  <View style={styles.balanceHeader}>
    <Text style={styles.balanceLabel}>Saldo Disponible</Text>
    <Text style={styles.balanceAmount}>
      ${driver?.wallet.balance || 0}
    </Text>
    
    {/* Pending Debts Warning */}
    {driver?.wallet.pendingDebts > 0 && (
      <View style={styles.debtWarning}>
        <Icon name="warning" size={16} color="#FF6B6B" />
        <Text style={styles.debtText}>
          Deuda pendiente: ${driver.wallet.pendingDebts}
        </Text>
        {driver.wallet.pendingDebts >= 300 && (
          <Text style={styles.debtAlert}>
            Límite alcanzado. No podrás aceptar pedidos en efectivo.
          </Text>
        )}
      </View>
    )}
  </View>

  <ScrollView>
    
    {/* Quick Actions */}
    <View style={styles.quickActions}>
      <Button
        title="Retirar Fondos"
        onPress={() => navigation.navigate('Withdraw')}
        disabled={!driver?.wallet.balance || driver.wallet.balance < 50}
      />
      <Button
        title="Pagar Deuda"
        onPress={() => navigation.navigate('PayDebt')}
        type="outline"
        disabled={!driver?.wallet.pendingDebts}
      />
    </View>

    {/* Period Summary */}
    <View style={styles.periodSummary}>
      <Text style={styles.sectionTitle}>Resumen por Período</Text>
      <View style={styles.periodGrid}>
        <PeriodCard
          title="Hoy"
          orders={driver?.kpis.todayCompletedOrders || 0}
          amount={driver?.kpis.todayTotal || 0}
        />
        <PeriodCard
          title="Esta Semana"
          orders={driver?.kpis.weekCompletedOrders || 0}
          amount={driver?.kpis.weekTotal || 0}
        />
        <PeriodCard
          title="Este Mes"
          orders={driver?.kpis.monthCompletedOrders || 0}
          amount={driver?.kpis.monthTotal || 0}
        />
      </View>
    </View>

    {/* Income Breakdown */}
    <View style={styles.breakdownSection}>
      <Text style={styles.sectionTitle}>Desglose de Ingresos</Text>
      <IncomeBreakdownChart transactions={recentTransactions} />
    </View>

    {/* Transaction History */}
    <View style={styles.transactionSection}>
      <Text style={styles.sectionTitle}>Historial de Movimientos</Text>
      <TransactionHistoryList />
    </View>

  </ScrollView>
</View>
```

### 18. NavigationScreen

**Archivo:** `src/screens/Main/NavigationScreen.tsx`

**Estructura Principal:**
```jsx
<View style={styles.container}>
  
  {/* Map View */}
  <MapView
    style={styles.map}
    provider={PROVIDER_GOOGLE}
    region={mapRegion}
    showsUserLocation={true}
    showsMyLocationButton={false}
    onRegionChangeComplete={handleRegionChange}
  >
    
    {/* Heatmap Layer cuando no hay pedido activo */}
    {!activeOrder && (
      <HeatmapLayer data={heatmapData} />
    )}

    {/* Order Tracking cuando hay pedido activo */}
    {activeOrder && (
      <OrderTrackingLayer 
        order={activeOrder}
        userLocation={userLocation}
      />
    )}

    {/* User Location Marker */}
    <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={styles.userMarker}>
        <Icon name="navigation" size={16} color="#FFFFFF" />
      </View>
    </Marker>

  </MapView>

  {/* Floating Controls */}
  <View style={styles.floatingControls}>
    
    {/* Center on User Button */}
    <TouchableOpacity 
      style={styles.controlButton}
      onPress={centerOnUser}
    >
      <Icon name="locate" size={24} color="#333333" />
    </TouchableOpacity>

    {/* Zoom Controls */}
    <View style={styles.zoomControls}>
      <TouchableOpacity 
        style={styles.zoomButton}
        onPress={zoomIn}
      >
        <Icon name="add" size={20} color="#333333" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.zoomButton}
        onPress={zoomOut}
      >
        <Icon name="remove" size={20} color="#333333" />
      </TouchableOpacity>
    </View>

  </View>

  {/* Bottom Info Card */}
  {activeOrder && (
    <OrderMiniCard 
      order={activeOrder}
      onPress={() => navigation.navigate('OrderDetail', { orderId: activeOrder.id })}
    />
  )}

  {/* Heatmap Legend */}
  {!activeOrder && (
    <HeatmapLegend data={heatmapData} />
  )}

</View>
```

### 19. ProfileScreen

**Archivo:** `src/screens/Main/ProfileScreen.tsx`

**Estructura Completa:**
```jsx
<ScrollView style={styles.container}>
  
  {/* Profile Header */}
  <View style={styles.profileHeader}>
    <View style={styles.avatarContainer}>
      <Image 
        source={driver?.photoURL ? { uri: driver.photoURL } : require('assets/avatar-default.png')}
        style={styles.avatar}
      />
      <TouchableOpacity style={styles.editAvatarButton}>
        <Icon name="camera" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
    
    <Text style={styles.profileName}>{driver?.fullName}</Text>
    <Text style={styles.profileEmail}>{driver?.email}</Text>
    
    <View style={styles.ratingContainer}>
      <Icon name="star" size={16} color="#FFD700" />
      <Text style={styles.ratingText}>{driver?.kpis.rating?.toFixed(1) || '0.0'}</Text>
      <Text style={styles.ratingCount}>({driver?.kpis.ratingCount || 0} evaluaciones)</Text>
    </View>
  </View>

  {/* Quick Stats */}
  <View style={styles.quickStats}>
    <StatItem label="Pedidos Hoy" value={driver?.kpis.todayCompletedOrders || 0} />
    <StatItem label="Tasa Aceptación" value={`${driver?.kpis.acceptanceRate || 0}%`} />
    <StatItem label="En línea" value={`${driver?.kpis.onlineHours || 0}h`} />
  </View>

  {/* Menu Sections */}
  <View style={styles.menuSections}>
    
    {/* Documents Section */}
    <MenuSection
      title="Documentos y Verificación"
      icon="document-text"
      onPress={() => navigation.navigate('Documents')}
      badge={getDocumentsBadge()}
    />
    
    {/* Vehicle Section */}
    <MenuSection
      title="Mi Vehículo"
      icon="car"
      onPress={() => navigation.navigate('Vehicle')}
      subtitle={driver?.vehicle?.model}
    />
    
    {/* Bank Account Section */}
    <MenuSection
      title="Cuenta Bancaria"
      icon="card"
      onPress={() => navigation.navigate('BankAccount')}
      subtitle={driver?.bankAccount?.bankName}
    />
    
    {/* Settings Section */}
    <MenuSection
      title="Configuración"
      icon="settings"
      onPress={() => navigation.navigate('Settings')}
    />
    
    {/* Help Section */}
    <MenuSection
      title="Ayuda y Soporte"
      icon="help-circle"
      onPress={() => navigation.navigate('Help')}
    />
    
    {/* Legal Section */}
    <MenuSection
      title="Legal"
      icon="shield-checkmark"
      onPress={() => navigation.navigate('Legal')}
    />

  </View>

  {/* App Version */}
  <View style={styles.versionContainer}>
    <Text style={styles.versionText}>
      BeFast GO v{Constants.manifest.version}
    </Text>
  </View>

  {/* Logout Button */}
  <Button
    title="Cerrar Sesión"
    onPress={handleLogout}
    type="outline"
    style={styles.logoutButton}
  />

</ScrollView>
```

### 20. OrderDetailScreen

**Archivo:** `src/screens/OrderFlow/OrderDetailScreen.tsx`

**Estructura Completa:**
```jsx
<View style={styles.container}>
  
  {/* Map View */}
  <View style={styles.mapContainer}>
    <OrderTrackingMap 
      order={order}
      userLocation={userLocation}
    />
  </View>

  {/* Bottom Card */}
  <View style={styles.bottomCard}>
    
    {/* Order Status Timeline */}
    <OrderStatusTimeline status={order.status} />
    
    {/* Order Information */}
    <ScrollView style={styles.orderInfo} showsVerticalScrollIndicator={false}>
      
      {/* Pickup Information */}
      <InfoCard
        title="Recoger en"
        location={order.pickup}
        type="pickup"
      />
      
      {/* Delivery Information */}
      <InfoCard
        title="Entregar a" 
        location={order.delivery}
        type="delivery"
      />
      
      {/* Order Items */}
      {order.items && (
        <OrderItemsCard items={order.items} />
      )}
      
      {/* Special Instructions */}
      {order.specialInstructions && (
        <InstructionsCard instructions={order.specialInstructions} />
      )}
      
      {/* Payment Information */}
      <PaymentCard 
        paymentMethod={order.paymentMethod}
        amountToCollect={order.amountToCollect}
        estimatedEarnings={order.estimatedEarnings}
      />
      
      {/* Customer Contact */}
      <ContactCard 
        customer={order.delivery.customerName}
        phone={order.delivery.phone}
        orderId={order.id}
      />

    </ScrollView>
    
    {/* Action Button */}
    <View style={styles.actionContainer}>
      <OrderActionButton 
        order={order}
        onStatusUpdate={handleStatusUpdate}
      />
    </View>

  </View>

</View>
```

### 21. DeliveryConfirmationScreen

**Archivo:** `src/screens/OrderFlow/DeliveryConfirmationScreen.tsx`

**Estructura Completa:**
```jsx
<ScrollView style={styles.container}>
  
  {/* Header */}
  <View style={styles.header}>
    <Text style={styles.title}>Confirmar Entrega</Text>
    <Text style={styles.subtitle}>
      Completa todos los pasos para finalizar el pedido
    </Text>
  </View>

  {/* Cash Collection (if applicable) */}
  {order.paymentMethod === 'CASH' && (
    <CashCollectionSection 
      amountToCollect={order.amountToCollect}
      onAmountReceived={setReceivedAmount}
    />
  )}

  {/* Photo Evidence */}
  <PhotoEvidenceSection 
    onPhotoTaken={setDeliveryPhoto}
    photoRequired={true}
  />

  {/* Signature */}
  <SignatureSection 
    onSignatureComplete={setCustomerSignature}
    signatureRequired={true}
  />

  {/* Confirmation Code */}
  <ConfirmationCodeSection 
    onCodeEntered={setConfirmationCode}
    codeRequired={order.requiresConfirmationCode}
  />

  {/* Summary */}
  <DeliverySummary 
    order={order}
    photoTaken={!!deliveryPhoto}
    signatureCompleted={!!customerSignature}
    codeEntered={!!confirmationCode}
    receivedAmount={receivedAmount}
  />

  {/* Submit Button */}
  <View style={styles.submitSection}>
    <Button
      title="Completar Entrega"
      onPress={handleCompleteDelivery}
      disabled={!canCompleteDelivery()}
      loading={isSubmitting}
      style={styles.submitButton}
    />
  </View>

</ScrollView>
```

### 22. ChatScreen

**Archivo:** `src/screens/Support/ChatScreen.tsx`

**Estructura Completa:**
```jsx
<View style={styles.container}>
  
  {/* Header */}
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Soporte BeFast</Text>
    <Text style={styles.headerSubtitle}>Asistente IA 24/7</Text>
  </View>

  {/* Messages List */}
  <FlatList
    ref={messagesListRef}
    data={messages}
    keyExtractor={(item) => item.id}
    renderItem={renderMessage}
    style={styles.messagesList}
    contentContainerStyle={styles.messagesContent}
    onContentSizeChange={() => messagesListRef.current?.scrollToEnd()}
    ListEmptyComponent={EmptyState}
  />

  {/* Quick Suggestions */}
  {messages.length === 0 && (
    <QuickSuggestions onSuggestionSelect={handleSuggestionSelect} />
  )}

  {/* Input Area */}
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.textInput}
      placeholder="Escribe tu mensaje..."
      value={inputText}
      onChangeText={setInputText}
      multiline
      maxLength={500}
    />
    
    <TouchableOpacity 
      style={[
        styles.sendButton,
        (!inputText.trim() || isSending) && styles.sendButtonDisabled
      ]}
      onPress={handleSendMessage}
      disabled={!inputText.trim() || isSending}
    >
      {isSending ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Icon name="send" size={20} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  </View>

</View>
```

### 23. EmergencyScreen

**Archivo:** `src/screens/Support/EmergencyScreen.tsx`

**Estructura Completa:**
```jsx
<View style={styles.container}>
  
  {/* Status Bar */}
  <View style={styles.statusBar}>
    <View style={styles.locationStatus}>
      <Icon 
        name={isSharingLocation ? 'location' : 'location-outline'} 
        size={20} 
        color={isSharingLocation ? '#4CAF50' : '#FF6B6B'} 
      />
      <Text style={styles.locationStatusText}>
        {isSharingLocation ? 'Ubicación compartida' : 'Ubicación no compartida'}
      </Text>
    </View>
    
    {isSharingLocation && (
      <Text style={styles.sharingTime}>
        Compartiendo por {formatSharingTime(sharingStartTime)}
      </Text>
    )}
  </View>

  {/* Emergency Options */}
  <View style={styles.emergencyOptions}>
    
    {/* Panic Button */}
    <TouchableOpacity 
      style={styles.panicButton}
      onPress={handlePanicButton}
      disabled={isSharingLocation}
    >
      <View style={styles.panicButtonInner}>
        <Icon name="warning" size={48} color="#FFFFFF" />
        <Text style={styles.panicButtonText}>BOTÓN DE PÁNICO</Text>
        <Text style={styles.panicButtonSubtext}>
          {isSharingLocation ? 'Activado' : 'Presiona en caso de emergencia'}
        </Text>
      </View>
    </TouchableOpacity>

    {/* Emergency Contacts */}
    <View style={styles.emergencyContacts}>
      
      <EmergencyContact
        icon="call"
        title="Llamar al 911"
        subtitle="Emergencias"
        onPress={() => Linking.openURL('tel:911')}
        color="#F44336"
      />
      
      <EmergencyContact
        icon="call"
        title="Contactar Soporte BeFast"
        subtitle="Asistencia inmediata"
        onPress={() => Linking.openURL('tel:+522221234567')}
        color="#2196F3"
      />
      
      <EmergencyContact
        icon="document"
        title="Reportar Incidente"
        subtitle="Registro formal"
        onPress={() => navigation.navigate('ReportIncident')}
        color="#FF9800"
      />

    </View>

  </View>

  {/* Active Emergency Info */}
  {activeEmergency && (
    <View style={styles.activeEmergency}>
      <Text style={styles.activeEmergencyTitle}>
        Emergencia Activa
      </Text>
      <Text style={styles.activeEmergencyText}>
        El equipo de soporte ha sido notificado y está monitoreando tu ubicación.
      </Text>
      <Button
        title="Cancelar Emergencia"
        onPress={handleCancelEmergency}
        type="outline"
      />
    </View>
  )}

  {/* Safety Tips */}
  <View style={styles.safetyTips}>
    <Text style={styles.safetyTipsTitle}>Consejos de Seguridad</Text>
    
    <SafetyTip
      icon="eye"
      text="Mantente en áreas bien iluminadas"
    />
    <SafetyTip
      icon="people"
      text="Informa tu ubicación a contactos de confianza"
    />
    <SafetyTip
      icon="car"
      text="Ten una ruta de escape identificada"
    />
    <SafetyTip
      icon="phone"
      text="Mantén tu teléfono cargado y contigo"
    />
  </View>

</View>
```

### 24. Componentes Críticos

#### NewOrderModal (Componente Global)
```jsx
const NewOrderModal = () => {
  const dispatch = useDispatch();
  const { newOrderToShow } = useSelector(state => state.notifications);
  const [timeLeft, setTimeLeft] = useState(60);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    if (newOrderToShow) {
      startTimer();
      playNotificationSound();
    } else {
      stopSound();
    }
    
    return () => {
      stopSound();
    };
  }, [newOrderToShow]);

  const startTimer = () => {
    setTimeLeft(60);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playNotificationSound = async () => {
    try {
      const { sound: notificationSound } = await Audio.Sound.createAsync(
        require('assets/sounds/order-notification.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      setSound(notificationSound);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  const handleAccept = async () => {
    await stopSound();
    dispatch(acceptOrder(newOrderToShow.id));
    dispatch(clearNewOrder());
  };

  const handleReject = async () => {
    await stopSound();
    dispatch(rejectOrder(newOrderToShow.id));
    dispatch(clearNewOrder());
  };

  if (!newOrderToShow) return null;

  return (
    <Modal visible={!!newOrderToShow} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>¡Nuevo Pedido!</Text>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>
          </View>

          {/* Order Info */}
          <View style={styles.orderInfo}>
            <InfoRow icon="store" text={newOrderToShow.pickup.name} />
            <InfoRow icon="location" text={newOrderToShow.pickup.address} />
            <InfoRow icon="person" text={newOrderToShow.delivery.customerName} />
            <InfoRow icon="location" text={newOrderToShow.delivery.address} />
            <InfoRow icon="cash" text={`$${newOrderToShow.estimatedEarnings}`} />
            <InfoRow 
              icon="payment" 
              text={newOrderToShow.paymentMethod === 'CASH' ? 'Efectivo' : 'Tarjeta'} 
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Rechazar"
              onPress={handleReject}
              type="outline"
              style={styles.rejectButton}
            />
            <Button
              title="Aceptar"
              onPress={handleAccept}
              style={styles.acceptButton}
            />
          </View>

        </View>
      </View>
    </Modal>
  );
};
```

#### FloatingButtons (Componente Global)
```jsx
const FloatingButtons = () => {
  const { activeOrder } = useSelector(state => state.orders);

  return (
    <View style={styles.floatingContainer}>
      
      {/* Emergency Button */}
      <TouchableOpacity 
        style={styles.emergencyFloatingButton}
        onPress={() => navigation.navigate('Emergency')}
      >
        <Icon name="warning" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Chat Button */}
      <TouchableOpacity 
        style={styles.chatFloatingButton}
        onPress={() => navigation.navigate('Chat')}
      >
        <Icon name="chatbubble" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Active Order Quick Access */}
      {activeOrder && (
        <TouchableOpacity 
          style={styles.orderFloatingButton}
          onPress={() => navigation.navigate('OrderDetail', { orderId: activeOrder.id })}
        >
          <Icon name="navigate" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

    </View>
  );
};
```

---

## **PARTE 5: LÓGICA Y DATOS**

### 25. Modelo de Datos Unificado Firestore

**Estructura Completa Collections:**

```typescript
// DRIVERS - Datos conductor en tiempo real
drivers/{driverId} → {
  // Identificación básica
  uid: string;
  phone: string;
  email: string;
  fullName: string;
  photoURL?: string;
  
  // Información fiscal
  rfc: string;
  curp: string;
  nss?: string;
  
  // Vehículo
  vehicle: {
    type: 'MOTORCYCLE' | 'CAR' | 'BICYCLE';
    plates: string;
    model: string;
    year: number;
    color: string;
  };
  
  // Estado operacional
  operational: {
    isOnline: boolean;
    status: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
    currentLocation: {
      lat: number;
      lng: number;
      timestamp: Date;
      accuracy?: number;
    };
    canReceiveOrders: boolean;
    blockReason?: string;
    lastStatusUpdate: Date;
  };
  
  // Wallet y finanzas
  wallet: {
    balance: number;           // Saldo disponible
    pendingDebts: number;      // Deuda pedidos efectivo
    creditLimit: number;       // 300 MXN
    totalEarnings: number;     // Ganancias históricas
    lastWithdrawal?: Date;
  };
  
  // Administrativo (validaciones)
  administrative: {
    idseApproved: boolean;     // GATE CRÍTICO
    imssStatus: 'PENDING' | 'VALID' | 'EXPIRED' | 'INVALID';
    documentsStatus: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
    trainingStatus: 'PENDING' | 'COMPLETED' | 'EXPIRED';
    backgroundCheck: 'PENDING' | 'CLEAR' | 'ISSUE';
    contractSigned: boolean;
  };
  
  // Documentos
  documents: {
    ineFront: string;          // Storage URL
    ineBack: string;
    rfcDocument: string;
    driversLicense: string;
    vehicleCirculation: string;
    vehicleInsurance?: string;
    imssDocument?: string;
  };
  
  // Estadísticas y KPIs
  stats: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalDistance: number;     // km
    totalEarnings: number;
    averageRating: number;
    acceptanceRate: number;    // %
    onTimeRate: number;        // %
  };
  
  // KPIs tiempo real (calculados diariamente)
  kpis: {
    todayCompletedOrders: number;
    todayTotal: number;
    weekCompletedOrders: number;
    weekTotal: number;
    monthCompletedOrders: number;
    monthTotal: number;
    acceptanceRate: number;
    rating: number;
    ratingCount: number;
    avgDeliveryTime: number;   // minutos
    onlineHours: number;
  };
  
  // Datos bancarios
  bankAccount: {
    clabe: string;            // CLABE BBVA fija
    bankName: string;
    accountHolder: string;
  };
  
  // Configuración
  settings: {
    notifications: {
      newOrders: boolean;
      promotions: boolean;
      updates: boolean;
    };
    appSettings: {
      darkMode: boolean;
      language: string;
      unitSystem: 'METRIC' | 'IMPERIAL';
    };
  };
  
  // Metadata
  fcmToken: string;
  appVersion: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
}

// ORDERS - Flujo completo del pedido
orders/{orderId} → {
  // Identificación
  id: string;
  shortCode: string;          // #BFS-1234
  type: 'DELIVERY' | 'MARKET';
  
  // Estado y flujo
  status: OrderStatus;
  driverId?: string;
  timeline: {
    createdAt: Date;
    assignedAt?: Date;
    acceptedAt?: Date;
    startedAt?: Date;
    pickedUpAt?: Date;
    inTransitAt?: Date;
    arrivedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
  };
  
  // Ubicaciones
  pickup: {
    name: string;
    address: string;
    location: { lat: number; lng: number };
    phone: string;
    instructions?: string;
  };
  
  delivery: {
    customerName: string;
    address: string;
    location: { lat: number; lng: number };
    phone: string;
    instructions?: string;
  };
  
  // Información del pedido
  items?: {
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }[];
  
  // Pricing y pagos
  pricing: {
    baseFee: number;
    distanceFee: number;
    timeFee: number;
    tips: number;
    cashHandlingFee?: number;
    total: number;
  };
  
  payment: {
    method: 'CARD' | 'CASH';
    amountToCollect: number;   // Para efectivo
    customerPaid?: number;     // Monto realmente recibido
    change?: number;           // Cambio dado
  };
  
  // Información de entrega
  deliveryProof: {
    photoUrl?: string;
    signatureUrl?: string;
    confirmationCode?: string;
    deliveredAt?: Date;
  };
  
  // Validaciones y auditoría
  validation: {
    idseChecked: boolean;
    debtChecked: boolean;
    aiScore: number;          // 0-1 de Vertex AI
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    auditorApproved: boolean;
  };
  
  // Métricas
  metrics: {
    distance: number;         // km
    estimatedDuration: number; // minutos
    actualDuration?: number;
    driverDistance?: number;  // km recorridos por repartidor
  };
  
  // Rating
  rating?: {
    driverRating?: number;    // 1-5
    driverComment?: string;
    customerRating?: number;  // 1-5
    customerComment?: string;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;            // Para orders searching
}

// WALLET TRANSACTIONS - Historial financiero
walletTransactions/{txId} → {
  id: string;
  driverId: string;
  orderId?: string;
  
  // Información de transacción
  type: 
    | 'CARD_ORDER_TRANSFER'    // Pago por pedido con tarjeta
    | 'CASH_ORDER_ADEUDO'      // Adeudo por pedido en efectivo  
    | 'TIP_CARD_TRANSFER'      // Propina de pedido con tarjeta
    | 'TIP_CASH'               // Propina en efectivo
    | 'INCENTIVE'              // Incentivo/bono
    | 'DEDUCTION'              // Deducción por incidencia
    | 'DEBT_PAYMENT'           // Pago de deuda
    | 'WITHDRAWAL'             // Retiro de fondos
    | 'REFUND'                 // Reembolso
    | 'ADJUSTMENT';            // Ajuste manual
  
  amount: number;
  description: string;
  
  // Balances
  balanceBefore: number;
  balanceAfter: number;
  pendingDebtsBefore: number;
  pendingDebtsAfter: number;
  
  // Auditoría
  audit: {
    befastAmount: number;
    vertexAmount: number;
    match: boolean;
    difference: number;
    approvedBy: 'SYSTEM' | 'MANUAL' | 'OVERRIDE';
  };
  
  // Metadata
  timestamp: Date;
  processedAt: Date;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}

// APPLICATIONS - Solicitudes de conductor
driverApplications/{appId} → {
  id: string;
  driverId: string;
  
  // Datos de la solicitud
  personalData: { /* same as driver */ };
  documents: { /* same as driver */ };
  legal: {
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
    acceptedAlgorithmicPolicy: boolean;
    acceptedContract: boolean;
  };
  training: {
    trainingVideoWatched: boolean;
    quizScore: number;
    quizAnswers: Record<string, string>;
    equipmentPhoto: string;
  };
  
  // Proceso de revisión
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  review: {
    reviewedBy?: string;
    reviewedAt?: Date;
    notes?: string;
    rejectionReason?: string;
  };
  
  // Validación IA
  ocrResults: {
    ineValid: boolean;
    rfcMatch: boolean;
    licenseValid: boolean;
    confidence: number;
    processedAt: Date;
  };
  
  // Metadata
  submittedAt: Date;
  updatedAt: Date;
}

// SYSTEM - Datos del sistema
system/heatmap → {
  zones: {
    zoneId: string;
    coordinates: { lat: number; lng: number }[];
    intensity: number;        // 0-1
    ordersPerHour: number;
    averageEarnings: number;
    lastUpdated: Date;
  }[];
  lastCalculation: Date;
}

// EMERGENCIES - Registro de emergencias
emergencies/{emergencyId} → {
  id: string;
  driverId: string;
  orderId?: string;
  
  // Información de emergencia
  type: 'PANIC_BUTTON' | 'ACCIDENT' | 'ROBBERY' | 'HEALTH' | 'OTHER';
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  
  // Ubicación
  location: {
    lat: number;
    lng: number;
    address?: string;
    timestamp: Date;
  };
  
  // Tracking en tiempo real
  locationUpdates: {
    lat: number;
    lng: number;
    timestamp: Date;
  }[];
  
  // Respuesta
  response: {
    notifiedAt: Date;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    resolvedBy?: string;
    resolvedAt?: Date;
    notes?: string;
  };
  
  // Metadata
  triggeredAt: Date;
  updatedAt: Date;
}
```

### 26. Arquitectura del Estado Global (Redux)

**Store Configuration:**
```typescript
// store/index.ts
export const store = configureStore({
  reducer: {
    auth: authSlice,
    orders: ordersSlice,
    navigation: navigationSlice,
    notifications: notificationsSlice,
    wallet: walletSlice,
    chat: chatSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'firebase/authChanged'],
        ignoredPaths: ['firebase.auth', 'firebase.firestore'],
      },
    }).concat(
      listenerMiddleware.middleware,
      rtkQueryMiddleware
    ),
});

// Tipado completo del estado
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Auth Slice Completo:**
```typescript
// store/slices/authSlice.ts
interface AuthState {
  driver: Driver | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  fcmToken: string | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    driver: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    fcmToken: null,
  } as AuthState,
  
  reducers: {
    // Login actions
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    
    loginSuccess: (state, action: PayloadAction<Driver>) => {
      state.driver = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    
    loginFailure: (state, action: PayloadAction<string>) => {
      state.driver = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
    },
    
    // Logout
    logout: (state) => {
      state.driver = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    
    // Update driver data
    updateDriver: (state, action: PayloadAction<Partial<Driver>>) => {
      if (state.driver) {
        state.driver = { ...state.driver, ...action.payload };
      }
    },
    
    // FCM token
    setFcmToken: (state, action: PayloadAction<string>) => {
      state.fcmToken = action.payload;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Thunks para operaciones async
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { dispatch }) => {
    try {
      dispatch(loginStart());
      
      // 1. Firebase Auth
      const userCredential = await auth().signInWithEmailAndPassword(
        credentials.email, 
        credentials.password
      );
      
      // 2. Obtener datos driver
      const driverDoc = await firestore()
        .collection('drivers')
        .doc(userCredential.user.uid)
        .get();
      
      if (!driverDoc.exists) {
        throw new Error('No se encontró perfil de conductor');
      }
      
      const driverData = driverDoc.data() as Driver;
      
      // 3. Validaciones críticas
      if (!driverData.administrative.idseApproved) {
        throw new Error('IDSE no aprobado. Contacta a soporte.');
      }
      
      if (driverData.documentsStatus !== 'APPROVED') {
        throw new Error('Documentos pendientes de aprobación.');
      }
      
      // 4. Actualizar último login
      await firestore()
        .collection('drivers')
        .doc(userCredential.user.uid)
        .update({
          lastLogin: new Date(),
        });
      
      // 5. Dispatch success
      dispatch(loginSuccess(driverData));
      
      return driverData;
      
    } catch (error: any) {
      dispatch(loginFailure(error.message));
      throw error;
    }
  }
);

export const updateDriverStatus = createAsyncThunk(
  'auth/updateDriverStatus',
  async (status: 'ONLINE' | 'OFFLINE' | 'PAUSED', { getState }) => {
    const state = getState() as RootState;
    const driverId = state.auth.driver?.uid;
    
    if (!driverId) {
      throw new Error('No driver logged in');
    }
    
    // Llamar Cloud Function
    const updateStatus = httpsCallable(functions, 'updateDriverStatus');
    await updateStatus({ status });
    
    return status;
  }
);
```

### 27. Matriz de Flujo de Datos (UI → Backend)

| Pantalla/Componente | Acción de Usuario | Cloud Function | Lógica Backend | Actualización Estado |
|---------------------|-------------------|----------------|----------------|---------------------|
| **LoginScreen** | "Iniciar Sesión" | (Firebase Auth) | Valida credenciales, carga perfil driver | authSlice → driver, isAuthenticated |
| **RegistrationScreen** | "Enviar Solicitud" | `submitDriverApplication` | Vertex AI OCR, crea aplicación | Navegación a pending screen |
| **DashboardScreen** | Toggle ONLINE/OFFLINE | `updateDriverStatus` | Actualiza Firestore, notifica sistema | authSlice → operational.isOnline |
| **NewOrderModal** | "Aceptar Pedido" | `validateOrderAssignment` | Valida IDSE, deuda, Vertex AI scoring | ordersSlice → move to activeOrders |
| **OrderDetailScreen** | "Llegué a Tienda" | `handleOrderWorkflow` | Actualiza status, notifica cliente | ordersSlice → update order status |
| **DeliveryConfirmationScreen** | "Completar Entrega" | `processOrderCompletion` | Vertex AI auditoría, cálculos wallet | ordersSlice → completed, walletSlice update |
| **WalletScreen** | "Retirar Fondos" | `processWithdrawal` | Valida saldo, transfere SPEI | walletSlice → balance update |
| **ChatScreen** | "Enviar Mensaje" | `chatbotHandler` | Vertex AI con contexto driver | chatSlice → add message |
| **EmergencyScreen** | "Botón Pánico" | `triggerEmergency` | Notifica soporte, comparte ubicación | emergencySlice → active emergency |

### 28. Validaciones y Reglas de Negocio

**Validaciones Críticas para Operar:**
```typescript
const canReceiveOrders = (driver: Driver): { canOperate: boolean; reason?: string } => {
  // 1. IDSE aprobado (GATE CRÍTICO)
  if (!driver.administrative.idseApproved) {
    return { 
      canOperate: false, 
      reason: 'IDSE no aprobado. Contacta a soporte.' 
    };
  }
  
  // 2. Documentos aprobados
  if (driver.documentsStatus !== 'APPROVED') {
    return {
      canOperate: false,
      reason: 'Documentos pendientes de aprobación.'
    };
  }
  
  // 3. Capacitación completada
  if (driver.trainingStatus !== 'COMPLETED') {
    return {
      canOperate: false,
      reason: 'Capacitación pendiente.'
    };
  }
  
  // 4. Límite de deuda para efectivo
  if (driver.wallet.pendingDebts >= 300) {
    return {
      canOperate: false,
      reason: 'Límite de deuda alcanzado. Realiza un pago.'
    };
  }
  
  // 5. IMSS vigente
  if (driver.imssStatus !== 'VALID') {
    return {
      canOperate: false,
      reason: 'IMSS no válido. Actualiza tu documentación.'
    };
  }
  
  return { canOperate: true };
};

// Validación antes de aceptar pedido efectivo
const canAcceptCashOrder = (driver: Driver, orderAmount: number): boolean => {
  const currentDebt = driver.wallet.pendingDebts || 0;
  const newTotalDebt = currentDebt + orderAmount;
  
  return newTotalDebt <= 300; // Límite de 300 MXN
};
```

**Reglas de Auditoría Doble:**
```typescript
interface AuditResult {
  befastAmount: number;
  vertexAmount: number;
  difference: number;
  percentageDifference: number;
  match: boolean;
  approved: boolean;
}

const performFinancialAudit = async (order: Order, proofData: any): Promise<AuditResult> => {
  // 1. Cálculo BeFast
  const befastAmount = calculateOrderEarnings(order);
  
  // 2. Cálculo Vertex AI
  const vertexAmount = await vertexAI.auditOrder(order, proofData);
  
  // 3. Comparación
  const difference = Math.abs(befastAmount - vertexAmount);
  const percentageDifference = (difference / befastAmount) * 100;
  
  const match = percentageDifference <= 5; // 5% de tolerancia
  
  return {
    befastAmount,
    vertexAmount,
    difference,
    percentageDifference,
    match,
    approved: match || manualOverride, // Puede ser aprobado manualmente
  };
};
```

---

## **PARTE 6: LÓGICA CRÍTICA IMPLEMENTADA**

### 29. Lógica Financiera Central

### Configuración de Tarifas (PricingService)

```typescript
Tarifa Base: 45.0 MXN (hasta 3.0 km)
Tarifa Adicional: 2.5 MXN por km (después de 3.0 km)
Comisión BeFast: 15.0 MXN por pedido
Propinas: 100% al conductor
```

### Cálculo de Precio Total

**Fórmula**:
```
SI distancia <= 3 km:
  Total = 45 MXN + propina

SI distancia > 3 km:
  Distancia Extra = distancia - 3 km
  Total = 45 MXN + (Distancia Extra × 2.5 MXN) + propina
```

**Ejemplo 1 - 2 km**:
```
Distancia: 2 km
Tarifa base: 45 MXN
Tarifa adicional: 0 MXN (no excede 3 km)
Propina: 10 MXN
Total: 55 MXN
```

**Ejemplo 2 - 8 km**:
```
Distancia: 8 km
Tarifa base: 45 MXN
Tarifa adicional: (8 - 3) × 2.5 = 12.5 MXN
Propina: 20 MXN
Total: 77.5 MXN
```

### Modelo de Transacciones por Pedido

#### Pedido con TARJETA

```
Cliente paga: 77.5 MXN (ejemplo)
BeFast cobra al cliente automáticamente

CÁLCULO DE GANANCIAS CONDUCTOR:
- Monto bruto: 77.5 - 20 (propina) = 57.5 MXN
- Comisión BeFast: 15 MXN
- Ganancia neta: 57.5 - 15 = 42.5 MXN
- Propina: 20 MXN (100% al conductor)
- Total conductor: 42.5 + 20 = 62.5 MXN

TRANSACCIONES REGISTRADAS:
1. CARD_ORDER_TRANSFER: +42.5 MXN → walletBalance
2. TIP_CARD_TRANSFER: +20 MXN → walletBalance
3. walletBalance += 62.5 MXN (transfer inmediato)

AUDITORÍA "DOBLE CONTADOR":
- Sistema BeFast calcula: 62.5 MXN
- Vertex AI Gemini calcula independientemente: 62.5 MXN
- SI coinciden (MATCH): Transacción se escribe en BD
- SI no coinciden (MISMATCH): Transacción rechazada, alerta a soporte
```

#### Pedido en EFECTIVO

```
Cliente paga: 77.5 MXN (ejemplo)
Conductor cobra al cliente directamente

LÓGICA:
- Conductor YA TIENE el efectivo (77.5 MXN)
- NO se transfiere dinero al saldo del conductor
- BeFast debe cobrar su comisión: 15 MXN
- Sistema registra DEUDA de 15 MXN

TRANSACCIONES REGISTRADAS:
1. CASH_ORDER_ADEUDO: Deuda de 15 MXN
2. pendingDebts += 15 MXN
3. walletBalance no cambia (conductor ya tiene el efectivo)

RECUPERACIÓN DE DEUDA:
- Conductor puede pagar manualmente
- O sistema aplica recuperación automática:
  SI walletBalance > 0 Y pendingDebts > 0:
    monto = MIN(walletBalance, pendingDebts)
    walletBalance -= monto
    pendingDebts -= monto
    Registra: DEBT_PAYMENT (auto)
```

### Control de Deuda

**Regla de Bloqueo**:
```
Límite de deuda: 300 MXN (driverDebtLimit)

SI pendingDebts >= 300 MXN:
  - Conductor NO puede aceptar pedidos en EFECTIVO
  - Conductor SÍ puede aceptar pedidos con TARJETA
  - Debe pagar deuda para desbloquear pedidos efectivo

NOTA CRÍTICA:
Esta validación SOLO aplica para pedidos en EFECTIVO.
Pedidos con TARJETA no validan deudas porque no generan deuda nueva.
```

**Pago de Deuda**:
```
Opciones para pagar:
1. Pago manual en efectivo (presencial)
2. Transferencia bancaria a cuenta BeFast
3. Recuperación automática del saldo

Al pagar:
- Registra transacción: DEBT_PAYMENT
- pendingDebts -= monto_pagado
- Si tiene comprobante: Adjunta receiptUrl
- Sistema genera recibo de pago
```

### 30. Lógica de Asignación de Pedidos

### Algoritmo de Selección de Conductores

**Configuración según documento**:
```
Método: "Difundir a todos"
Cuándo: "Tan pronto como llegue el pedido"
Límite: Conductores con <= 3 pedidos activos
```

### Proceso de Asignación (OrderAssignmentService)

#### 1. Filtrado Inicial

```typescript
Query Firestore:
- administrative.befastStatus == 'ACTIVE'
- operational.isOnline == true
- operational.status == 'ACTIVE'

Para cada conductor:
  Contar pedidos activos (ASSIGNED, ACCEPTED, PICKED_UP, IN_TRANSIT, ARRIVED)
  SI activeOrdersCount >= 3:
    RECHAZAR (límite excedido)
```

#### 2. Validación 360° Crítica

```typescript
Para cada conductor elegible:

A. Validación IMSS/IDSE (INDISPENSABLE):
   - administrative.idseApproved == true
   - administrative.imssStatus == 'ACTIVO_COTIZANDO'
   - SI falla: RECHAZAR inmediatamente

B. Validación Documentos:
   - administrative.documentsStatus == 'APPROVED'
   - SI falla: RECHAZAR

C. Validación Capacitación:
   - administrative.trainingStatus != 'EXPIRED'
   - SI falla: RECHAZAR

D. Validación Financiera CONDICIONAL:
   SI pedido es EFECTIVO:
     - wallet.pendingDebts < wallet.creditLimit (300 MXN)
     - SI falla: RECHAZAR
   
   SI pedido es TARJETA:
     - NO validar deudas (saltar esta validación)
```

#### 3. Cálculo de Score de Asignación

```typescript
Factor Distancia (50% peso):
  - Calcular distancia conductor → pickup
  - maxReasonableDistance = 10 km
  - distanceFactor = 1 - (distancia / 10)
  - Más cerca = mejor score

Factor Carga (30% peso):
  - activeOrdersCount vs maxActiveOrders (3)
  - loadFactor = 1 - (activeOrders / 3)
  - Menos pedidos = mejor score

Factor Rating (20% peso):
  - ratingFactor = rating / 5.0
  - Rating más alto = mejor score

Score Final:
  score = (distanceFactor × 0.5) + (loadFactor × 0.3) + (ratingFactor × 0.2)

Umbral mínimo: 0.3
SI score < 0.3: RECHAZAR
```

**Ejemplo de Score**:
```
Conductor A:
- Distancia al pickup: 2 km
- Pedidos activos: 1
- Rating: 4.8

Cálculos:
- distanceFactor = 1 - (2/10) = 0.8
- loadFactor = 1 - (1/3) = 0.67
- ratingFactor = 4.8/5.0 = 0.96

Score = (0.8 × 0.5) + (0.67 × 0.3) + (0.96 × 0.2)
Score = 0.4 + 0.201 + 0.192
Score = 0.793 ✅ (Excelente)
```

#### 4. Validación con Vertex AI

```typescript
Para cada candidato con score >= 0.3:

Llamar Cloud Function: validateAssignmentWithVertexAI({
  orderId,
  driverId,
  estimatedETA,
  assignmentScore
})

Vertex AI (Modelo IA Logística) analiza:
- Historial de entregas del conductor
- Patrones de tráfico en la zona
- Hora del día y día de la semana
- Predicción de retraso
- Riesgo de incumplimiento

Retorna:
- aiScore: 0.0 - 1.0
- riskLevel: LOW | MEDIUM | HIGH
- approved: boolean

SI aiScore < umbral (ej. 0.5):
  RECHAZAR (asignación ineficiente)
```

#### 5. Difusión del Pedido

```typescript
Candidatos ordenados por score (mayor a menor)

Para cada candidato APROBADO:
  Enviar notificación push:
    - Título: "Nuevo Pedido Disponible"
    - Cuerpo: "Pedido a X km de ti"
    - Data: { orderId, distancia, score }
  
  Actualizar estado pedido: SEARCHING
  
  Conductor puede:
    - Aceptar (llama validateOrderAssignment)
    - Rechazar (pedido sigue disponible para otros)
    - Ignorar (expira en X minutos)
```

### Flujo Completo de Asignación

```
1. Pedido creado → status: SEARCHING

2. OrderAssignmentService.findBestDrivers():
   - Filtra conductores ACTIVE y Online
   - Valida IMSS/IDSE, documentos, capacitación
   - Valida deudas SI es efectivo
   - Calcula score de cada conductor
   - Filtra score >= 0.3
   - Ordena por score (mayor a menor)

3. Para cada candidato:
   - Valida con Vertex AI
   - SI aprobado: Envía notificación push

4. Conductor acepta:
   - Llama Cloud Function validateOrderAssignment
   - Validación 360° completa
   - Actualiza estado: ACCEPTED
   - Asigna driverId al pedido
   - Inicia tracking GPS

5. Si nadie acepta en X minutos:
   - Aumenta rango de búsqueda
   - Recalcula candidatos
   - O marca como FAILED
```

### 31. Lógica de Clasificación Laboral

### Factores de Exclusión por Vehículo

```typescript
Auto (4 ruedas): 36%
Moto / Scooter (2 ruedas): 30%
Bicicleta / A pie: 12%
```

### Cálculo de Clasificación (Primer Mes)

```typescript
Al finalizar el primer mes:

1. Calcular ingreso bruto mensual:
   ingresosBruto = SUM(todas las ganancias del mes)

2. Aplicar factor de exclusión:
   ingresosNeto = ingresosBruto - (ingresosBruto × factorExclusion)

3. Comparar con salario mínimo:
   salarioMinimo = 8,364 MXN

4. Clasificar:
   SI ingresosNeto >= 8,364 MXN:
     Clasificación: EMPLEADO_COTIZANTE
     Régimen IMSS: Obligatorio
   
   SI NO

   ```typescript
   Clasificación: TRABAJADOR_INDEPENDIENTE
     Régimen IMSS: Solo riesgos de trabajo
```

**Ejemplo**:
```
Conductor con MOTO:
- Ingresos brutos del mes: 12,000 MXN
- Factor de exclusión: 30%
- Ingresos netos: 12,000 - (12,000 × 0.30) = 8,400 MXN
- Salario mínimo: 8,364 MXN
- Resultado: 8,400 >= 8,364 ✅
- Clasificación: EMPLEADO_COTIZANTE
```

### 32. Validación Crítica 360°

### Al Login

```
1. Usuario existe en Firebase Auth ✅
2. Perfil en Firestore existe ✅
3. administrative.idseApproved == true ✅ CRÍTICO
4. administrative.befastStatus == 'ACTIVE' ✅
5. administrative.imssStatus == 'ACTIVO_COTIZANDO' ✅
6. administrative.documentsStatus == 'APPROVED' ✅

SI cualquiera falla:
  - canReceiveOrders = false
  - blockingReason = código específico
  - message = mensaje para el conductor
  - Conductor puede acceder al portal pero NO recibir pedidos
```

### Al Aceptar Pedido

```
Cloud Function: validateOrderAssignment()

Validaciones en orden:
1. IMSS/IDSE aprobado (INDISPENSABLE)
2. Estado ACTIVE y Online
3. Documentos APPROVED y vigentes
4. Capacitación no expirada
5. Máximo 3 pedidos activos
6. SI efectivo: Deuda < 300 MXN ⚠️ CONDICIONAL
7. Score de asignación >= 0.3
8. Validación Vertex AI aprobada

SI todas pasan:
  - approved = true
  - Asigna pedido al conductor
  - Actualiza estado: ACCEPTED
  - Inicia tracking

SI alguna falla:
  - approved = false
  - reason = razón específica
  - Pedido vuelve a SEARCHING
```

### Al Completar Pedido

```
Cloud Function: processOrderCompletion()

1. Verificar foto obligatoria
2. Verificar firma (efectivo) o PIN (tarjeta)
3. Verificar monto recibido (efectivo)
4. Calcular ganancias del conductor
5. Vertex AI (Gemini) calcula independientemente
6. Comparar resultados (Doble Contador):
   SI coinciden (MATCH):
     - Crear transacciones
     - Actualizar saldo/deuda
     - Estado: COMPLETED
   SI NO coinciden (MISMATCH):
     - Rechazar transacción
     - Alertar a soporte
     - Requiere revisión manual
```

### 33. Auditoría "Doble Contador"

```
Concepto: Dos sistemas independientes calculan la misma transacción

Sistema 1: BeFast Backend (TypeScript)
- Calcula ganancias del conductor
- Registra transacciones
- Actualiza saldo/deuda

Sistema 2: Vertex AI Gemini (Cloud Function)
- Recibe mismos datos de entrada
- Calcula independientemente
- Retorna resultado esperado

Comparación:
SI resultado_sistema1 == resultado_sistema2:
  auditResult = 'MATCH'
  Transacción se escribe en base de datos
SINO:
  auditResult = 'MISMATCH'
  Transacción rechazada
  Alerta enviada a equipo de soporte

Beneficios:
- Previene errores de cálculo
- Detecta manipulación
- Garantiza precisión financiera
- Cumplimiento auditable
```

---

## **PARTE 7: IMPLEMENTACIÓN Y MVP**

### 34. Funcionalidades Obligatorias (22 Críticas + Extras)

| Categoría | Funcionalidad | Estado | Prioridad | Complejidad |
|-----------|---------------|---------|-----------|-------------|
| **🔐 Autenticación** | Login/Logout | ✅ | CRÍTICA | Baja |
| | Registro 5 pasos | 🟡 | CRÍTICA | Alta |
| | Validación 360° bloqueante | ✅ | CRÍTICA | Media |
| **📱 Dashboard** | Toggle ONLINE/OFFLINE | ✅ | CRÍTICA | Baja |
| | KPIs tiempo real | ✅ | CRÍTICA | Media |
| | Wallet resumen | ✅ | CRÍTICA | Media |
| **🔔 Notificaciones** | FCM new order modal | ✅ | CRÍTICA | Alta |
| | Timer 60s aceptación | ✅ | CRÍTICA | Media |
| | Sonido + vibración | ✅ | CRÍTICA | Baja |
| **🗺️ Navegación** | Mapa con ruta activa | 🟡 | CRÍTICA | Alta |
| | Geofence triggers | 🟡 | CRÍTICA | Alta |
| | Polyline animada | 🔴 | ALTA | Alta |
| **📦 Pedidos** | Flujo 6 estados | ✅ | CRÍTICA | Media |
| | Foto evidencia entrega | ✅ | CRÍTICA | Media |
| | Firma cliente | ✅ | CRÍTICA | Media |
| **💳 Pagos** | Wallet con deuda | ✅ | CRÍTICA | Alta |
| | Límite 300 MXN | ✅ | CRÍTICA | Media |
| | Recuperación auto | ✅ | CRÍTICA | Alta |
| **🧠 IA** | Auditoría doble | 🟡 | CRÍTICA | Alta |
| | Vertex AI scoring | 🟡 | CRÍTICA | Alta |
| | Chatbot contextual | 🔴 | MEDIA | Alta |
| **🆘 Emergencia** | Botón pánico | ✅ | ALTA | Media |
| | Compartir ubicación | ✅ | ALTA | Media |
| | Contactos emergencia | ✅ | ALTA | Baja |

**Leyenda:**
- ✅ **Completado** - 🟡 **En Progreso** - 🔴 **Pendiente**
- **CRÍTICA** - Must have para MVP
- **ALTA** - Should have, importante para UX
- **MEDIA** - Could have, mejora experiencia

### 35. Resumen Rápido MVP

**6 Componentes Críticos para Operar:**

1. **🚀 Login + 360° Bloqueo Modal**
    - Valida IDSE aprobado, documentos, capacitación, deuda <300
    - Modal bloqueante con razón específica + botón soporte

2. **📊 Dashboard con Botón ONLINE + KPIs + Wallet RT**
    - Toggle ONLINE/OFFLINE/PAUSA
    - Listeners tiempo real a wallet, stats, orders
    - Widgets rápidos: saldo, deuda, pedidos hoy

3. **🔔 FCM Modal 60s + Aceptar/Rechazar**
    - Notificación fullscreen con timer
    - Sonido fuerte + vibración
    - Validación backend antes de asignar

4. **🗺️ NavigationCanvas con 6 Estados + Geofence + Foto Entrega**
    - Mapa con ruta activa y polyline
    - Geofence auto-activa botones "Llegué"
    - Cámara integrada para foto evidencia

5. **💳 Wallet con Deuda Visible + Recuperación Auto**
    - Saldo disponible vs deuda pendiente
    - Límite 300 MXN enforcement
    - Recuperación automática post-pedidos

6. **🔐 Auditoría Doble + Transacciones Post-Complete**
    - BeFast cálculo + Vertex AI independiente
    - MATCH/MISMATCH handling
    - Transacciones detalladas en wallet

**Flujo MVP Completado:**
```
Login → Dashboard (ONLINE) → FCM Modal (Aceptar) → Navigation (6 estados) → 
Foto Entrega → Auditoría → Wallet Update → Dashboard
```

### 36. Checklist de Dependencias del Backend

**Cloud Functions Críticas (Deben Estar Desplegadas):**

- [ ] `submitDriverApplication` + `documentValidator` (Vertex AI OCR)
- [ ] `updateDriverStatus` (actualización estado conductor)
- [ ] `validateOrderAssignment` + `orderValidationEnhanced` (Vertex AI scoring)
- [ ] `handleOrderWorkflow` (gestión estados pedido)
- [ ] `processOrderCompletion` + `financialAuditor` (Vertex AI auditoría)
- [ ] `manageFinancialOperationsConsolidated` (cálculos wallet)
- [ ] `chatbotHandler` (Vertex AI soporte)
- [ ] `triggerEmergency` + `cancelEmergency` (gestión emergencias)

**Servicios Externos (Configuración):**

- [ ] **Firebase Project** con Auth, Firestore, Storage, Functions
- [ ] **Vertex AI** con modelo Gemini Pro habilitado
- [ ] **Google Maps** API keys con Directions, Distance Matrix, Geocoding
- [ ] **Mapbox** access token para mapas alternativos
- [ ] **Conekta** + **Stripe** configurados para pagos México
- [ ] **FCM** configurado para notificaciones push

**Estructura Firestore (Collections Requeridas):**

- [ ] `drivers/{driverId}` - Con todos los campos del modelo
- [ ] `orders/{orderId}` - Con timeline y status management
- [ ] `walletTransactions/{txId}` - Para historial financiero
- [ ] `driverApplications/{appId}` - Para proceso registro
- [ ] `system/heatmap` - Para datos mapa calor
- [ ] `emergencies/{emergencyId}` - Para gestión emergencias

### 37. Configuración Técnica y Deployment

**Environment Variables (.env):**
```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# APIs
EXPO_PUBLIC_CONEXTA_PUBLIC_KEY=your_conekta_key

# Environment
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_API_BASE_URL=https://us-central1-your-project.cloudfunctions.net
```

**package.json Dependencies Críticas:**
```json
{
  "dependencies": {
    "react-native": "0.74.0",
    "expo": "~50.0.0",
    "@react-native-firebase/app": "^18.0.0",
    "@react-native-firebase/auth": "^18.0.0",
    "@react-native-firebase/firestore": "^18.0.0",
    "@react-native-firebase/functions": "^18.0.0",
    "@react-native-firebase/messaging": "^18.0.0",
    "@react-native-firebase/storage": "^18.0.0",
    "@reduxjs/toolkit": "^1.9.7",
    "react-redux": "^8.1.3",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/bottom-tabs": "^6.5.2",
    "react-native-maps": "^1.7.1",
    "react-native-maps-directions": "^1.9.0",
    "react-native-geolocation-service": "^5.3.1",
    "lottie-react-native": "^6.4.1",
    "react-native-camera": "^4.2.1"
  }
}
```

**Build Configuration (app.json):**
```json
{
  "expo": {
    "name": "BeFast GO",
    "slug": "befast-go",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.befast.driver",
      "buildNumber": "1",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Esta app necesita acceso a tu ubicación para mostrar rutas y recibir pedidos cercanos.",
        "NSLocationAlwaysUsageDescription": "Esta app necesita acceso a tu ubicación en segundo plano para tracking de pedidos activos.",
        "NSCameraUsageDescription": "Esta app necesita acceso a la cámara para tomar fotos de evidencia de entrega."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.befast.driver",
      "versionCode": 1,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED",
        "WAKE_LOCK"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}"
        }
      }
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow BeFast GO to use your location."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow BeFast GO to access your camera for delivery proof."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": [
            "./assets/sounds/order-notification.wav"
          ]
        }
      ]
    ]
  }
}
```

---

## **🎯 CONCLUSIÓN**

Este documento unificado contiene **TODO** lo necesario para desarrollar, entender y mantener la aplicación BeFast GO. Desde la arquitectura de alto nivel hasta los detalles de implementación de cada pantalla, incluyendo flujos completos, lógica de negocio, modelos de datos y configuraciones técnicas.

**Puntos Clave a Recordar:**

1. **El backend es el cerebro** - La app móvil solo muestra datos y dispara acciones
2. **IDSE es GATE CRÍTICO** - Sin IDSE aprobado, no se puede operar
3. **Límite 300 MXN de deuda** - Enforcement estricto para pedidos efectivo
4. **Auditoría doble en cada transacción** - BeFast + Vertex AI independiente
5. **Tiempo real via listeners** - Firestore listeners para estado inmediato

**Próximos Pasos Inmediatos:**
1. Revisar que todas las Cloud Functions críticas estén desplegadas
2. Configurar environment variables para desarrollo/producción
3. Implementar los 6 componentes críticos del MVP en orden de prioridad
4. Configurar monitoreo y analytics desde día 1

**Este documento vive** y debe actualizarse con cada cambio significativo en la arquitectura o funcionalidades de BeFast GO.

---

**Versión**: 3.0  
**Fecha**: 12 de Noviembre 2025  
**Status**: ✅ **COMPLETO Y CORRECTO**