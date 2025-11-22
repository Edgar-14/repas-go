# BeFast Chat Components

Este directorio contiene los componentes de chat unificados y mejorados para el ecosistema BeFast. Los componentes han sido diseñados siguiendo las mejores prácticas de UX/UI y la identidad visual de BeFast.

## Componentes Principales

### 1. ChatWidget
Componente principal que maneja toda la lógica de chat y la interfaz de usuario.

**Características:**
- ✅ Diseño profesional con colores BeFast
- ✅ Animaciones suaves y transiciones
- ✅ Responsive design (móvil y desktop)
- ✅ Soporte para 4 tipos de bot (WELCOME, DRIVER, BUSINESS, ADMIN)
- ✅ Integración con backend Vertex AI existente
- ✅ Persistencia de conversaciones
- ✅ Estados de mensaje (enviando, enviado, error)
- ✅ Indicador de escritura
- ✅ Sugerencias rápidas
- ✅ Minimizar/maximizar
- ✅ Posicionamiento configurable

### 2. ChatMessage
Componente modular para renderizar mensajes individuales.

**Características:**
- ✅ Burbujas diferenciadas por usuario/bot
- ✅ Avatares personalizados
- ✅ Timestamps formateados
- ✅ Estados visuales de mensaje
- ✅ Soporte para acciones rápidas
- ✅ Colores por tipo de portal

### 3. ChatInput
Componente de entrada mejorado con funcionalidades avanzadas.

**Características:**
- ✅ Textarea auto-expandible
- ✅ Contador de caracteres
- ✅ Sugerencias rápidas integradas
- ✅ Validación de entrada
- ✅ Estados de carga
- ✅ Soporte para Enter/Shift+Enter

### 4. ChatTyping
Indicador de escritura animado.

**Características:**
- ✅ Animación de puntos
- ✅ Mensaje personalizable
- ✅ Consistente con el diseño general

## Componentes Específicos por Portal

### WelcomeChatbot
Para la página principal - guía a nuevos usuarios.

### DriverChatbot
Para el portal de repartidores - consultas sobre billetera, documentos, entregas.

### BusinessChatbot
Para el portal de negocios - análisis de pedidos, créditos, métricas.

### AdminChatbot
Para el portal administrativo - reportes, métricas del sistema, gestión.

## Uso

### Importación
```typescript
import { 
  ChatWidget,
  WelcomeChatbot,
  DriverChatbot,
  BusinessChatbot,
  AdminChatbot 
} from '@/components/chat';
```

### Uso Básico
```typescript
// Chat genérico
<ChatWidget 
  userRole="WELCOME"
  userId={user?.uid}
  position="bottom-right"
  theme="light"
/>

// Chats específicos
<WelcomeChatbot />
<DriverChatbot contextData={driverData} />
<BusinessChatbot contextData={businessData} />
<AdminChatbot />
```

### Props Principales

#### ChatWidget
```typescript
interface ChatWidgetProps {
  userRole: 'WELCOME' | 'DRIVER' | 'BUSINESS' | 'ADMIN';
  userId?: string;
  initialMessage?: string;
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'light' | 'dark' | 'auto';
  minimized?: boolean;
  className?: string;
  contextData?: any;
}
```

## Integración con Backend

Los componentes se integran automáticamente con:
- ✅ `chatbotHandler.ts` (Cloud Function existente)
- ✅ Sistema de conversaciones en Firestore
- ✅ Logging y auditoría existente
- ✅ Function Calling para herramientas específicas

## Diseño Visual

### Colores por Portal
- **WELCOME**: Azul BeFast (`#1657F0`)
- **DRIVER**: Azul BeFast (`#1657F0`)
- **BUSINESS**: Naranja BeFast (`#FF7300`)
- **ADMIN**: Gris Oscuro BeFast (`#232A36`)

### Animaciones
- Entrada/salida suave del widget
- Bounce en el botón flotante
- Indicador de escritura animado
- Hover effects en botones
- Transiciones de estado

### Responsive Design
- **Móvil**: Pantalla completa cuando está abierto
- **Tablet**: 400x600px con bordes redondeados
- **Desktop**: 450x650px con sombras mejoradas

## Mejoras Implementadas

### Respecto a RealChatbot.tsx
- ✅ Diseño más profesional y moderno
- ✅ Mejor organización del código
- ✅ Componentes modulares reutilizables
- ✅ Animaciones más suaves
- ✅ Mejor manejo de estados

### Respecto a portal-chatbot.tsx
- ✅ Integración con backend real (no mock)
- ✅ Persistencia de conversaciones
- ✅ Mejor UX con sugerencias integradas
- ✅ Estados de mensaje más claros
- ✅ Diseño más consistente

## Testing

Para probar los componentes:

```bash
# Ejecutar en modo desarrollo
npm run dev

# Los componentes aparecerán automáticamente en:
# - Página principal (WelcomeChatbot)
# - Portal de repartidores (DriverChatbot)
# - Portal de negocios (BusinessChatbot)
# - Portal administrativo (AdminChatbot)
```

## Próximas Mejoras

- [ ] Soporte para archivos adjuntos
- [ ] Modo oscuro completo
- [ ] Notificaciones push
- [ ] Historial de conversaciones expandido
- [ ] Búsqueda en conversaciones
- [ ] Exportar conversaciones
- [ ] Integración con WhatsApp
- [ ] Comandos de voz

## Notas Técnicas

- Los componentes mantienen compatibilidad total con el sistema de auth existente
- Se reutiliza toda la lógica de Function Calling del backend
- No se duplica código, se mejora la experiencia de usuario
- Todos los componentes son TypeScript con tipos estrictos
- Siguen las convenciones de naming de BeFast