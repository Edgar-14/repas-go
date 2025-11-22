# 🤖 Sistema de Prompts BeFast

Este directorio contiene todos los prompts centralizados para los chatbots de BeFast. Cada bot tiene su personalidad, tono y reglas específicas definidas aquí.

## 📁 Estructura

```
src/lib/prompts/
├── welcome.prompt.ts    # Bot público de bienvenida
├── driver.prompt.ts     # Asistente para repartidores  
├── business.prompt.ts   # Asistente para negocios
├── admin.prompt.ts      # Asistente administrativo
├── index.ts            # Exportaciones centralizadas
├── integration-example.ts # Ejemplo de integración
└── README.md           # Esta documentación
```

## 🚀 Uso en el Frontend

```typescript
import { getPromptForRole, getConfigForRole } from '@/lib/prompts';

// Obtener configuración UI
const config = getConfigForRole('DRIVER');

// Obtener prompt completo
const userData = { /* datos del usuario */ };
const systemPrompt = getPromptForRole('DRIVER', userData);
```

## 🔧 Integración con Backend

El ChatWidget ahora envía el prompt completo en el contexto:

```typescript
const response = await handleChatMessage({
  userRole: 'DRIVER',
  userId: 'user123',
  message: 'Hola',
  context: {
    systemPrompt: getPromptForRole('DRIVER', userData),
    conversationHistory: messages.slice(-10),
    // ... otros datos de contexto
  }
});
```

## 🤖 Bots Disponibles

### WELCOME Bot 🚀
- **Propósito**: Asistente público en befastapp.com
- **Personalidad**: Profesional, amable, directo
- **Funciones**: Canalizar usuarios a portales específicos

### DRIVER Bot 🚗  
- **Propósito**: Asistente para repartidores
- **Personalidad**: Copiloto experto, servicial
- **Funciones**: Billetera, pedidos, documentos, registro

### BUSINESS Bot 🏢
- **Propósito**: Asistente para negocios afiliados  
- **Personalidad**: Asesor de cuentas amigable
- **Funciones**: Créditos, pedidos, tarifas, portal

### ADMIN Bot ⚙️
- **Propósito**: Asistente operativo interno
- **Personalidad**: Analista de datos preciso
- **Funciones**: KPIs, reportes, validaciones, búsquedas

## 📋 Características de los Prompts

### ✅ Todos los prompts incluyen:
- **Identidad clara** del bot
- **Tono y personalidad** específicos  
- **Reglas críticas** obligatorias
- **Escenarios de ayuda** detallados
- **Contactos de escalamiento**
- **Prohibición de jerga técnica**

### 🎯 Reglas universales:
- Respuestas conversacionales y claras
- Mensajes cortos (burbujas de chat)
- Uso moderado de emojis específicos
- No inventar datos que no estén en el contexto
- Escalamiento a soporte cuando sea necesario

## 🔄 Flujo de Actualización

1. **Modificar prompts** en los archivos `.prompt.ts`
2. **Probar localmente** con el ChatWidget
3. **Verificar** que el backend use `context.systemPrompt`
4. **Desplegar** cambios

## 🚨 Importante

- Los prompts se envían desde el frontend al backend
- El backend debe priorizar `context.systemPrompt` sobre prompts locales
- Cada prompt incluye el contexto de datos del usuario
- Los prompts son específicos para cada rol de usuario

## 📞 Contactos de Escalamiento

- **Soporte General**: https://wa.me/5213121905494
- **Ventas/Socios**: https://wa.me/5213122137033  
- **Email Soporte**: soporte@befastapp.com.mx
- **Documentos**: documentos@befastapp.com.mx