// src/email-templates.ts
// Client-side email queue service for professional templates

import { COLLECTIONS } from '@/lib/collections';

// --- Tipos y Constantes Globales ---

/**
 * Define todas las posibles variables que pueden usar las plantillas.
 * Son opcionales ('?') para que no tengas que pasar todas las variables a cada plantilla.
 */
interface TemplateVariables {
  userName?: string;
  userEmail?: string;
  verificationCode?: string;
  resetLink?: string;
  loginUrl?: string;
  orderId?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  businessName?: string;
  driverName?: string;
  earnings?: string | number;
  periodStart?: string;
  periodEnd?: string;
  totalOrders?: number;
  amountLabel?: string;
  totalAmount?: string | number;
  averageRating?: number | string;
  transactionId?: string;
  date?: string;
  description?: string;
  amountColor?: string;
  amount?: string | number;
  reason?: string;
  supportEmail?: string;
  dashboardUrl?: string;
  orderUrl?: string;
  transactionUrl?: string;
  code?: string;
  expirationMinutes?: number;
  subject?: string;
  html?: string;
  portal?: 'admin' | 'delivery' | 'drivers' | 'default';
}

const WEB_APP_URL = process.env.WEB_APP_URL || 'https://befast-hfkbl.web.app';

/**
 * URLs de los logos específicos para cada portal
 */
const LOGOS = {
  admin: `${WEB_APP_URL}/befast-logo-admin.svg`,
  delivery: `${WEB_APP_URL}/logo-befast-delivery.svg`,
  drivers: `${WEB_APP_URL}/logo-befast-repartidores.svg`,
  default: `${WEB_APP_URL}/befast-logo-admin.svg`
};

// Function to queue professional email (used by client-side)
export async function queueProfessionalEmail(
  to: string,
  templateName: string,
  templateData: Record<string, any> = {}
): Promise<boolean> {
  try {
    const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const { app } = await import('./lib/firebase');
    const db = getFirestore(app);

    await addDoc(collection(db, COLLECTIONS.MAIL_QUEUE), {
      to,
      template: {
        name: templateName,
        data: templateData
      },
      status: 'pending',
      createdAt: serverTimestamp()
    });

    console.info(`✅ Professional email queued: ${templateName} to ${to}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error queueing professional email:', error);
    return false;
  }
}

// --- Función Principal ---

type TemplateName = keyof typeof templates;

/**
 * Genera el asunto y el cuerpo HTML de un correo electrónico a partir de una plantilla.
 * @param templateName El nombre de la plantilla a usar.
 * @param variables Un objeto con los datos a insertar en la plantilla.
 * @returns Un objeto con `subject` y `html`.
 */
export function getEmailTemplate(
  templateName: TemplateName,
  variables: TemplateVariables = {}
): { subject: string; html: string } {
  const templateBuilder = templates[templateName];
  if (!templateBuilder) {
    throw new Error(`La plantilla de correo "${templateName}" no fue encontrada.`);
  }
  return templateBuilder(variables);
}

// --- Plantilla Base Reutilizable ---
const createEmailTemplate = (
  title: string,
  content: string,
  portal: string = 'default',
  primaryColor: string = '#dc2626'
) => {
  const logoUrl = LOGOS[portal as keyof typeof LOGOS] || LOGOS.default;
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustBrightness(primaryColor, -20)} 100%); padding: 40px 30px; text-align: center; }
    .logo { height: 50px; width: auto; margin-bottom: 20px; }
    .header-title { color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
    .content { padding: 40px 30px; }
    .footer { padding: 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
    .btn { display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustBrightness(primaryColor, -20)} 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; transition: all 0.3s ease; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
    .alert { padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid; }
    .alert-info { background-color: #eff6ff; border-color: #3b82f6; color: #1e40af; }
    .alert-success { background-color: #f0fdf4; border-color: #10b981; color: #065f46; }
    .alert-warning { background-color: #fffbeb; border-color: #f59e0b; color: #92400e; }
    .alert-error { background-color: #fef2f2; border-color: #ef4444; color: #991b1b; }
    .text-muted { color: #6b7280; font-size: 14px; }
    .text-small { font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="padding: 20px;">
    <div class="container" style="border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
      <div class="header">
        <img src="${logoUrl}" alt="BeFast" class="logo">
        <h1 class="header-title">${title}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p class="text-muted">© 2025 BeFast Delivery Platform. Todos los derechos reservados.</p>
        <p class="text-small" style="margin-top: 10px;">
          Este correo fue enviado desde una cuenta no monitoreada. Para soporte, contacta a 
          <a href="mailto:soporte@befastapp.com.mx" style="color: ${primaryColor};">soporte@befastapp.com.mx</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// Función auxiliar para ajustar brillo de colores
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// --- Colección de Plantillas ---

// Export function for verification email template
export const getVerificationEmailTemplate = (code: string, type: 'default' | 'delivery' = 'delivery') => {
  const primaryColor = '#FF7300'; // BeFast orange
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Código de Verificación - BeFast Delivery</title>
      <style>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
          .header { padding: 20px 15px !important; }
          .content { padding: 30px 20px !important; }
          .logo-svg { width: 120px !important; height: 120px !important; }
          .code-container { gap: 8px !important; }
          .code-digit { 
            width: 40px !important; 
            height: 40px !important; 
            font-size: 20px !important; 
          }
          .footer { padding: 15px !important; }
        }
        @media only screen and (max-width: 480px) {
          .code-digit { 
            width: 35px !important; 
            height: 35px !important; 
            font-size: 18px !important; 
          }
          .logo-svg { width: 100px !important; height: 100px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div class="container" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div class="header" style="background: linear-gradient(135deg, ${primaryColor} 0%, #ff9c00 100%); padding: 30px 20px; text-align: center;">
          <svg class="logo-svg" width="150" height="150" viewBox="0 0 250 250" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
            <defs>
              <linearGradient id="grad1" x1="22.92" y1="161.56" x2="187.49" y2="66.55" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#ffffff"/>
                <stop offset=".17" stop-color="#ffffff"/>
                <stop offset=".5" stop-color="#ffffff"/>
                <stop offset=".53" stop-color="#ffffff"/>
                <stop offset="1" stop-color="#ffffff"/>
              </linearGradient>
              <linearGradient id="grad2" x1="74.26" y1="192.92" x2="187.17" y2="127.74" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#ffffff"/>
                <stop offset=".17" stop-color="#ffffff"/>
                <stop offset=".5" stop-color="#ffffff"/>
                <stop offset=".53" stop-color="#ffffff"/>
                <stop offset="1" stop-color="#ffffff"/>
              </linearGradient>
            </defs>
            <path fill="url(#grad1)" d="m220.21,143.66c-.99-17.8-6.57-34.04-16.68-48.69-10.94-15.85-25.41-27.36-43.26-34.58-7.32-2.96-14.92-4.89-22.77-5.94-6.83-.91-13.67-1.17-20.51-.55-17.8,1.61-33.99,7.6-48.43,18.18-4.64,3.4-8.94,7.2-12.91,11.37-.26.27-.57.5-1.14,1,0-.84,0-1.04,0-1.54,0-19.11,0-38.23-.02-57.34,0-7.21-2.81-13.24-8.1-18.06-4.49-4.1-9.81-6.35-15.97-6.42-.24,0-.48.03-.91.06v1.97s.3,91.83.27,137.74c0,1.43.73,4.28.73,4.28v8.22c.08.58.2,1.16.25,1.75.13,1.66.16,3.33.36,4.97.83,6.56,2.17,13.01,4.3,19.29,6.17,18.13,16.8,33.1,31.87,44.9,10.1,7.92,21.4,13.48,33.79,16.8,2.77.74,5.59,1.27,8.05,1.82-1.95-2.12-3.9-4.47-6.08-6.58-9.88-9.53-19.69-19.11-28.26-29.88-5.71-7.18-10.76-14.74-14.61-23.05-6.07-13.11-8.23-27.79-5.92-42.05,1.54-9.54,4.83-18.47,9.74-26.86,6.14-10.5,14.26-19.06,24.66-25.4,10.19-6.21,21.24-9.65,33.18-10.3,6.7-.36,13.29.26,19.8,1.77,7.93,1.84,15.31,5.01,22.14,9.45,5.21,3.39,9.91,7.37,14.09,11.99,3.74,4.13,6.83,8.72,9.76,13.44.36.58,1.25.88,1.47,1.47,2.95,7.81,6.18,15.52,7.49,23.87,1.15,7.38,1.46,14.75.38,22.14-1.72,11.78-6.43,22.4-12.77,32.36-6.22,9.77-13.71,18.54-21.72,26.85-6.16,6.4-12.56,12.58-18.85,18.85-.51.51-1.01,1.02-1.68,1.71.52,0,.77.05.98,0,4.43-1.17,8.94-2.08,13.26-3.56,19.79-6.81,35.65-18.92,47.53-36.12,10.05-14.57,15.56-30.75,16.5-48.46.04-.7.19-1.4.28-2.1v-6.42c-.1-.78-.25-1.56-.29-2.35Z"/>
            <path fill="url(#grad2)" d="m171.3,202.47c6.88-8.72,12.83-17.99,16.61-28.53,1.8-5.01,3.12-10.17,3.48-15.47.55-8.16-.1-16.25-2.5-24.14-.48-1.57-1.03-3.11-1.63-4.91-.76.93-1.27,1.64-1.87,2.26-3.38,3.51-6.77,7-10.19,10.48-2.55,2.6-5.14,5.15-7.7,7.73-1.08,1.09-1.94,2.26-1.68,3.98.12.76-.15,1.58-.18,2.37-.2,4.89-1.46,9.52-3.44,13.97-2.65,5.99-6.53,11.05-11.67,15.1-5.06,4-10.76,6.67-17.13,7.79-7.87,1.38-15.52.56-22.83-2.72-6.36-2.85-11.55-7.16-15.7-12.76-4.51-6.09-7.09-12.94-7.72-20.45-.56-6.58.21-13.02,2.69-19.24,1.72-4.3,4.02-8.21,7.05-11.65,2.86-3.25,6.14-6.04,9.93-8.26,5.2-3.04,10.79-4.78,16.74-5.12,3.26-.19,6.58.23,9.85.56,3.26.32,6.3,1.48,9.26,2.86,1.04.48,1.11.88.34,1.67-3.02,3.13-6.04,6.26-9.08,9.38-3.76,3.87-7.53,7.72-11.29,11.58-4.05,4.14-8.09,8.29-12.15,12.42-2.21,2.25-4.47,4.47-6.7,6.7-1.3,1.3-2.58,2.62-3.89,3.92-.76.75-1.01,1.39-.03,2.26,1.07.95,1.94,2.11,2.93,3.15,2.75,2.89,5.53,5.77,8.29,8.66,1.93,2.02,3.85,4.04,5.92,6.22,1.2-1.3,2.26-2.48,3.35-3.63,2.81-2.95,5.63-5.89,8.46-8.83,3.18-3.31,6.38-6.61,9.57-9.92,2.91-3.02,5.81-6.04,8.72-9.06,3.27-3.39,6.54-6.78,9.81-10.17,2.74-2.84,5.48-5.69,8.22-8.54,3.36-3.47,6.71-6.95,10.08-10.41,1.56-1.6,3.15-3.18,4.74-4.76.4-.4.7-.72.23-1.31-2.13-2.71-4.08-5.59-6.38-8.15-3.08-3.43-6.51-6.51-10.31-9.19-4.11-2.89-8.39-5.47-13.07-7.26-3.6-1.37-7.33-2.49-11.09-3.32-3.38-.75-6.88-1.17-10.34-1.35-4.96-.25-9.93-.01-14.81,1.15-2.38.57-4.79,1.06-7.12,1.81-4.96,1.59-9.74,3.66-14.06,6.6-3.1,2.11-6.12,4.35-9.04,6.7-1.75,1.41-3.31,3.08-4.8,4.78-2.09,2.38-4.21,4.78-6.01,7.38-3.44,4.95-6.16,10.31-8.15,16.02-2.07,5.96-3.37,12.11-3.73,18.41-.32,5.55,0,11.09,1.21,16.54,1.91,8.62,5.45,16.58,10.06,24.06,6.19,10.05,13.77,19.03,22.04,27.39,8.86,8.95,17.98,17.64,26.98,26.45,1.74,1.7,3.43,3.46,5.15,5.2.28-.25.47-.4.64-.56,7.42-7.39,14.81-14.81,22.26-22.18,7.62-7.54,15.04-15.27,21.69-23.69Z"/>
          </svg>
        </div>
        
        <!-- Content -->
        <div class="content" style="padding: 40px 30px;">
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Hola,</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            Este es tu código de verificación:
          </p>
          
          <!-- Verification Code -->
          <div style="text-align: center; margin: 30px 0;">
            <div class="code-container" style="display: inline-flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              ${code.split('').map(digit => `
                <div class="code-digit" style="
                  width: 50px; 
                  height: 50px; 
                  border: 2px solid ${primaryColor}; 
                  border-radius: 8px; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  font-size: 24px; 
                  font-weight: bold; 
                  color: ${primaryColor};
                  background: linear-gradient(135deg, rgba(255, 115, 0, 0.1) 0%, rgba(255, 156, 0, 0.1) 100%);
                ">
                  ${digit}
                </div>
              `).join('')}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 30px;">
            Este código será válido solo por los próximos 10 minutos. Si el código no funciona, puedes solicitar uno nuevo desde la página de verificación.
          </p>
          
          <p style="color: #666; font-size: 14px; margin-bottom: 5px;">Gracias,</p>
          <p style="color: #666; font-size: 14px; margin-bottom: 30px;">Equipo BeFast</p>
          
          <p style="color: #999; font-size: 12px; line-height: 1.4;">
            Este email fue enviado para verificar tu cuenta en BeFast Delivery.
          </p>
        </div>
        
        <!-- Footer -->
        <div class="footer" style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 BeFast. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const templates = {
  adminWelcome: (vars: TemplateVariables) => ({
    subject: `Bienvenido al equipo administrativo de BeFast, ${vars.userName}`,
    html: createEmailTemplate(
      'Bienvenido al Equipo Administrativo',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Tu cuenta de administrador ha sido creada exitosamente en el sistema BeFast. 
          Estamos emocionados de tenerte como parte de nuestro equipo administrativo.
        </p>
        
        <div class="alert alert-info">
          <strong>Acceso Administrativo:</strong> Tu cuenta te da acceso completo al sistema BeFast, 
          incluyendo gestión de usuarios, órdenes, reportes y configuración del sistema.
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Para completar tu configuración y acceder al panel administrativo, establece tu contraseña personal:
        </p>
        
        <div style="text-align: center;">
          <a href="${vars.resetLink}" class="btn">Establecer Contraseña</a>
        </div>
      `,
      'admin',
      '#dc2626'
    )
  }),

  passwordReset: (vars: TemplateVariables) => {
    const portal = vars.portal || 'default';
    const portalNames = {
      admin: 'Panel Administrativo',
      delivery: 'Portal de Negocios', 
      drivers: 'Portal de Repartidores',
      default: 'BeFast'
    };
    const portalName = portalNames[portal as keyof typeof portalNames] || portalNames.default;
    
    return {
      subject: `Recuperar Contraseña - ${portalName} BeFast`,
      html: createEmailTemplate(
        'Recuperar Contraseña',
        `
          <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en 
            <strong style="color: #0ea5e9;">${portalName}</strong>. Para continuar con el proceso, 
            haz clic en el siguiente botón:
          </p>
          
          <div class="alert alert-warning">
            <strong>Importante:</strong> Este enlace es válido por 24 horas. 
            Si no solicitaste este cambio, puedes ignorar este mensaje.
          </div>
          
          <div style="text-align: center;">
            <a href="${vars.resetLink}" class="btn">Restablecer Contraseña</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center; margin-top: 30px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <span style="background-color: #f1f5f9; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all;">
              ${vars.resetLink}
            </span>
          </p>
        `,
        portal,
        '#0ea5e9'
      )
    };
  },

  orderConfirmation: (vars: TemplateVariables) => ({
    subject: `Confirmación de Pedido #${vars.orderId} - BeFast Delivery`,
    html: createEmailTemplate(
      'Pedido Confirmado',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.businessName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hemos recibido tu pedido <strong style="color: #16a34a;">#${vars.orderId}</strong> y nuestro equipo 
          ya está trabajando en procesarlo. Te mantendremos informado sobre el progreso.
        </p>
        
        <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; border: 2px solid #bbf7d0; margin: 20px 0;">
          <h3 style="color: #166534; font-size: 18px; margin-bottom: 15px;">Detalles del Pedido</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dcfce7;">
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">Número de Pedido:</td>
              <td style="padding: 8px 0; color: #166534;"><strong>#${vars.orderId}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid #dcfce7;">
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">Recoger en:</td>
              <td style="padding: 8px 0; color: #374151;">${vars.pickupAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">Entregar a:</td>
              <td style="padding: 8px 0; color: #374151;">${vars.deliveryAddress}</td>
            </tr>
          </table>
        </div>
        
        <div class="alert alert-warning">
          <strong>Próximo paso:</strong> Un repartidor será asignado en los próximos minutos. 
          Recibirás una notificación cuando tu pedido esté en camino.
        </div>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/delivery/dashboard/orders/${vars.orderId}" class="btn">Ver Estado del Pedido</a>
        </div>
      `,
      'delivery',
      '#16a34a'
    )
  }),

  orderAssignment: (vars: TemplateVariables) => ({
    subject: `Nuevo pedido asignado #${vars.orderId} - BeFast`,
    html: createEmailTemplate(
      'Nuevo Pedido Asignado',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.driverName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Tienes un nuevo pedido listo para ti. Revisa los detalles y acepta cuando estés listo.
        </p>
        
        <div style="background-color: #eff6ff; padding: 25px; border-radius: 8px; border: 2px solid #bfdbfe; margin: 20px 0;">
          <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px;">Detalles del Pedido</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dbeafe;">
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">Pedido:</td>
              <td style="padding: 8px 0; color: #1e40af;"><strong>#${vars.orderId}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid #dbeafe;">
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">Recoger en:</td>
              <td style="padding: 8px 0; color: #374151;">${vars.pickupAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">Entregar a:</td>
              <td style="padding: 8px 0; color: #374151;">${vars.deliveryAddress}</td>
            </tr>
          </table>
          
          <div style="background-color: #dcfce7; padding: 15px; border-radius: 6px; text-align: center; margin-top: 15px;">
            <p style="font-size: 20px; font-weight: 700; color: #166534; margin: 0;">
              Ganancia: $${vars.earnings} MXN
            </p>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/repartidores/dashboard?orderId=${vars.orderId}" class="btn">Ver Detalles del Pedido</a>
        </div>
      `,
      'drivers',
      '#3b82f6'
    )
  }),

  weeklyReport: (vars: TemplateVariables) => ({
    subject: "Tu resumen semanal en BeFast está listo",
    html: createEmailTemplate(
      'Resumen Semanal',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Aquí tienes tu resumen de actividad para la semana del <strong>${vars.periodStart}</strong> 
          al <strong>${vars.periodEnd}</strong>. ¡Excelente trabajo esta semana!
        </p>
        
        <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; border: 2px solid #bae6fd; margin: 20px 0;">
          <h3 style="color: #0c4a6e; font-size: 18px; margin-bottom: 15px;">Resumen de Actividad</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e0f2fe;">
              <td style="padding: 12px 0; color: #374151; font-weight: 600;">Total de Pedidos:</td>
              <td style="padding: 12px 0; font-weight: 700; text-align: right; color: #0c4a6e;">${vars.totalOrders}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0f2fe;">
              <td style="padding: 12px 0; color: #374151; font-weight: 600;">${vars.amountLabel}:</td>
              <td style="padding: 12px 0; font-weight: 700; text-align: right; color: #059669;">$${vars.totalAmount} MXN</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #374151; font-weight: 600;">Calificación Promedio:</td>
              <td style="padding: 12px 0; font-weight: 700; text-align: right; color: #0c4a6e;">${vars.averageRating} ★</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Para un análisis más detallado y estadísticas avanzadas, visita tu panel de control.
        </p>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/dashboard/reports" class="btn">Ver Reporte Completo</a>
        </div>
      `,
      'default',
      '#0ea5e9'
    )
  }),

  paymentReceipt: (vars: TemplateVariables) => ({
    subject: `Recibo de tu transacción #${vars.transactionId} - BeFast`,
    html: createEmailTemplate(
      'Recibo de Transacción',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Te confirmamos que hemos procesado una transacción en tu cuenta. Aquí tienes todos los detalles:
        </p>
        
        <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; border: 2px solid #bae6fd; margin: 20px 0;">
          <h3 style="color: #0c4a6e; font-size: 18px; margin-bottom: 15px;">Detalles de la Transacción</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e0f2fe;">
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">ID de Transacción:</td>
              <td style="padding: 8px 0; color: #0c4a6e;"><strong>#${vars.transactionId}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid #e0f2fe;">
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">Fecha:</td>
              <td style="padding: 8px 0; color: #374151;">${vars.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">Descripción:</td>
              <td style="padding: 8px 0; color: #374151;">${vars.description}</td>
            </tr>
          </table>
          
          <div style="background-color: ${vars.amountColor === '#dc2626' ? '#fef2f2' : '#dcfce7'}; border: 2px solid ${vars.amountColor || '#16a34a'}; border-radius: 6px; padding: 15px; margin-top: 15px; text-align: center;">
            <p style="font-size: 20px; font-weight: 700; color: ${vars.amountColor || '#15803d'}; margin: 0;">
              Monto: $${vars.amount} MXN
            </p>
          </div>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Puedes ver todos los detalles de esta transacción y tu historial completo en tu billetera virtual.
        </p>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/dashboard/wallet?transactionId=${vars.transactionId}" class="btn">Ver en mi Billetera</a>
        </div>
      `,
      'default',
      '#059669'
    )
  }),

  accountSuspension: (vars: TemplateVariables) => ({
    subject: "Notificación Importante Sobre tu Cuenta BeFast",
    html: createEmailTemplate(
      'Suspensión de Cuenta',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Te escribimos para informarte que tu cuenta ha sido suspendida temporalmente por motivos 
          de seguridad y cumplimiento de nuestras políticas.
        </p>
        
        <div class="alert alert-error">
          <strong>Motivo de la suspensión:</strong><br>
          ${vars.reason}
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Nuestro equipo de cumplimiento revisará tu caso detalladamente. Si crees que se trata de un error 
          o necesitas más información sobre cómo resolver esta situación, por favor, ponte en contacto 
          con nuestro equipo de soporte inmediatamente.
        </p>
        
        <div style="text-align: center;">
          <a href="mailto:${vars.supportEmail || 'soporte@befastapp.com.mx'}" class="btn" style="background: #6b7280;">Contactar Soporte</a>
        </div>
      `,
      'default',
      '#dc2626'
    )
  }),

  businessWelcome: (vars: TemplateVariables) => ({
    subject: `Bienvenido a BeFast, ${vars.userName}`,
    html: createEmailTemplate(
      'Bienvenido a BeFast',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Tu cuenta ha sido creada exitosamente. Usa el siguiente código para verificar tu cuenta:
        </p>
        
        <div style="display: flex; justify-content: center; gap: 10px; margin: 30px 0;">
          ${vars.verificationCode ? vars.verificationCode.split('').map(digit => 
            `<div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background-color: #fff7ed; border: 2px solid #ea580c; border-radius: 8px; font-size: 24px; font-weight: 700; color: #ea580c;">${digit}</div>`
          ).join('') : ''}
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Una vez verificado, podrás empezar a solicitar entregas y gestionar tus pedidos desde tu panel.
        </p>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/delivery/login" class="btn" style="background: #ea580c;">Acceder a mi Panel</a>
        </div>
      `,
      'delivery',
      '#ea580c'
    )
  }),

  driverWelcome: (vars: TemplateVariables) => ({
    subject: `Gracias por aplicar a BeFast, ${vars.userName}`,
    html: createEmailTemplate(
      'Solicitud Recibida',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hemos recibido tu solicitud para unirte al equipo de repartidores de BeFast.
        </p>
        
        <div class="alert alert-info">
          <strong>Próximos Pasos:</strong> Nuestro equipo revisará tus documentos. Te notificaremos por correo 
          tan pronto como tu solicitud sea aprobada (usualmente en 24-48 horas).
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Mientras tanto, puedes contactarnos si tienes alguna pregunta sobre el proceso.
        </p>
        
        <div style="text-align: center;">
          <a href="mailto:soporte@befastapp.com.mx" class="btn" style="background: #6b7280;">Contactar Soporte</a>
        </div>
      `,
      'drivers',
      '#3b82f6'
    )
  }),

  driverApproved: (vars: TemplateVariables) => ({
    subject: `Bienvenido a BeFast, ${vars.userName}! Tu cuenta ha sido aprobada`,
    html: createEmailTemplate(
      'Cuenta Aprobada',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          ¡Excelentes noticias! Tu solicitud para ser repartidor en BeFast ha sido aprobada. 
          Para comenzar, establece tu contraseña personal.
        </p>
        
        <div class="alert alert-success">
          <strong>¡Felicidades!</strong> Ahora eres parte oficial del equipo de repartidores BeFast. 
          Podrás comenzar a recibir pedidos una vez que completes tu configuración.
        </div>
        
        <div style="text-align: center;">
          <a href="${vars.resetLink}" class="btn" style="background: #16a34a;">Establecer Contraseña</a>
        </div>
      `,
      'drivers',
      '#16a34a'
    )
  }),

  verification: (vars: TemplateVariables) => ({
    subject: 'Código de verificación - BeFast',
    html: createEmailTemplate(
      'Verificación de Cuenta',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Este es tu código de verificación:
        </p>
        
        <div style="display: flex; justify-content: center; gap: 10px; margin: 30px 0;">
          ${vars.code ? vars.code.split('').map(digit => 
            `<div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; font-size: 24px; font-weight: 700; color: #1e40af;">${digit}</div>`
          ).join('') : ''}
        </div>
        
        <div class="alert alert-warning">
          <strong>Código válido por ${vars.expirationMinutes || 10} minutos.</strong> 
          Si el código no funciona, puedes usar el enlace de verificación que aparece abajo.
        </div>
        
        <div style="text-align: center;">
          <a href="${vars.loginUrl || '#'}" class="btn">Verificar Email</a>
        </div>
      `,
      'default',
      '#3b82f6'
    )
  }),

  emailChangeVerification: (vars: TemplateVariables) => ({
    subject: 'Verifica tu nuevo correo electrónico - BeFast',
    html: createEmailTemplate(
      'Verificar Nuevo Email',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Verificar cambio de email</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Para confirmar el cambio de tu dirección de correo electrónico, usa el siguiente código:
        </p>
        
        <div style="display: flex; justify-content: center; gap: 10px; margin: 30px 0;">
          ${vars.code ? vars.code.split('').map(digit => 
            `<div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; font-size: 24px; font-weight: 700; color: #1e40af;">${digit}</div>`
          ).join('') : ''}
        </div>
        
        <div class="alert alert-warning">
          <strong>Código válido por ${vars.expirationMinutes || 10} minutos.</strong> 
          Si no solicitaste este cambio, contacta a soporte inmediatamente.
        </div>
        
        <div style="text-align: center;">
          <a href="${vars.loginUrl || '#'}" class="btn">Verificar Email</a>
        </div>
      `,
      'default',
      '#3b82f6'
    )
  }),

  custom: (vars: TemplateVariables) => ({
    subject: vars.subject || 'Notificación de BeFast',
    html: vars.html || createEmailTemplate(
      'Notificación',
      '<p style="color: #374151; font-size: 16px; line-height: 1.6;">Este es un correo personalizado de BeFast.</p>',
      'default',
      '#6b7280'
    )
  }),

  // PLANTILLAS ADICIONALES

  lowCreditsAlert: (vars: TemplateVariables) => ({
    subject: "Alerta: Créditos bajos en tu cuenta BeFast",
    html: createEmailTemplate(
      'Créditos Bajos',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.businessName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Tu cuenta tiene menos de 5 créditos disponibles. Para evitar interrupciones en el servicio, 
          te recomendamos recargar tu cuenta.
        </p>
        
        <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; border: 2px solid #fecaca; margin: 20px 0; text-align: center;">
          <p style="font-size: 24px; font-weight: 700; color: #dc2626; margin: 0;">
            Créditos Restantes: ${vars.totalAmount}
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/delivery/dashboard/credits" class="btn" style="background: #dc2626;">Recargar Ahora</a>
        </div>
      `,
      'delivery',
      '#dc2626'
    )
  }),

  criticalSystemAlert: (vars: TemplateVariables) => ({
    subject: `ALERTA CRÍTICA: ${vars.description}`,
    html: createEmailTemplate(
      'Alerta Crítica del Sistema',
      `
        <h2 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">Alerta Crítica del Sistema</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Se ha detectado un incidente crítico que requiere atención inmediata del equipo de administración.
        </p>
        
        <div class="alert alert-error">
          <strong>Descripción del Error:</strong> ${vars.description}<br>
          <strong>Hora del Incidente:</strong> ${vars.date}<br>
          <strong>ID:</strong> ${vars.transactionId || vars.orderId || 'N/A'}
        </div>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/admin/dashboard" class="btn" style="background: #dc2626;">Revisar Dashboard</a>
        </div>
      `,
      'admin',
      '#dc2626'
    )
  }),

  newDriverApplication: (vars: TemplateVariables) => ({
    subject: "Nueva solicitud de repartidor pendiente de revisión",
    html: createEmailTemplate(
      'Nueva Solicitud de Repartidor',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Nueva Solicitud Recibida</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Se ha recibido una nueva solicitud de repartidor que requiere revisión y aprobación 
          del equipo administrativo.
        </p>
        
        <div class="alert alert-info">
          <strong>Solicitante:</strong> ${vars.userName}<br>
          <strong>Email:</strong> ${vars.userEmail}<br>
          <strong>Fecha de Solicitud:</strong> ${vars.date}
        </div>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/admin/driver-applications" class="btn">Revisar Solicitud</a>
        </div>
      `,
      'admin',
      '#3b82f6'
    )
  }),

  driverApplicationRejected: (vars: TemplateVariables) => ({
    subject: "Actualización sobre tu solicitud para ser repartidor en BeFast",
    html: createEmailTemplate(
      'Solicitud No Aprobada',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Gracias por tu interés en formar parte del equipo de repartidores de BeFast. 
          Después de una revisión cuidadosa, hemos determinado que no podemos continuar 
          con el proceso en este momento.
        </p>
        
        <div class="alert alert-error">
          <strong>Motivo del Rechazo:</strong><br>
          ${vars.reason}
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Si tienes preguntas sobre esta decisión o deseas aplicar nuevamente en el futuro 
          con documentación actualizada, no dudes en contactarnos.
        </p>
        
        <div style="text-align: center;">
          <a href="mailto:soporte@befastapp.com.mx" class="btn" style="background: #6b7280;">Contactar Soporte</a>
        </div>
      `,
      'drivers',
      '#dc2626'
    )
  }),

  emergencyTicket: (vars: TemplateVariables) => ({
    subject: `TICKET DE EMERGENCIA: ${vars.description}`,
    html: createEmailTemplate(
      'Ticket de Emergencia',
      `
        <h2 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">Ticket de Emergencia</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Se ha creado un nuevo ticket de emergencia que requiere atención inmediata 
          del equipo de soporte.
        </p>
        
        <div class="alert alert-error">
          <strong>Reportado por:</strong> ${vars.userName}<br>
          <strong>Tipo de Usuario:</strong> ${vars.description}<br>
          <strong>Descripción:</strong> ${vars.reason}<br>
          <strong>Fecha:</strong> ${vars.date}
        </div>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/admin/support" class="btn" style="background: #dc2626;">Atender Ticket</a>
        </div>
      `,
      'admin',
      '#dc2626'
    )
  }),

  supportTicketResponse: (vars: TemplateVariables) => ({
    subject: `Respuesta a tu ticket de soporte #${vars.transactionId} - BeFast`,
    html: createEmailTemplate(
      'Respuesta de Soporte',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hemos revisado tu ticket de soporte <strong>#${vars.transactionId}</strong> 
          y tenemos una respuesta para ti:
        </p>
        
        <div class="alert alert-info">
          <em>"${vars.description}"</em>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Si necesitas más información o tienes preguntas adicionales, no dudes en responder 
          a este correo o crear un nuevo ticket.
        </p>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/dashboard/support" class="btn" style="background: #16a34a;">Ver Mis Tickets</a>
        </div>
      `,
      'default',
      '#16a34a'
    )
  }),

  supportTicketClosed: (vars: TemplateVariables) => ({
    subject: `Tu ticket de soporte #${vars.transactionId} ha sido cerrado - BeFast`,
    html: createEmailTemplate(
      'Ticket Cerrado',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Tu ticket de soporte <strong>#${vars.transactionId}</strong> ha sido marcado 
          como resuelto y cerrado por nuestro equipo de soporte.
        </p>
        
        <div class="alert alert-success">
          <strong>¡Problema Resuelto!</strong> Esperamos que la solución proporcionada 
          haya resuelto tu consulta. Si tienes más preguntas, estamos aquí para ayudarte.
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Si necesitas ayuda adicional o tienes nuevas consultas, no dudes en crear 
          un nuevo ticket desde tu dashboard.
        </p>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/dashboard/support" class="btn" style="background: #6b7280;">Centro de Soporte</a>
        </div>
      `,
      'default',
      '#16a34a'
    )
  }),

  orderStatusUpdate: (vars: TemplateVariables) => ({
    subject: `Actualización de tu pedido #${vars.orderId} - BeFast`,
    html: createEmailTemplate(
      'Actualización de Pedido',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.businessName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Tu pedido <strong>#${vars.orderId}</strong> ha sido actualizado. 
          Aquí tienes la información más reciente:
        </p>
        
        <div class="alert alert-info">
          <strong>Estado Actual:</strong> ${vars.description}<br>
          <strong>Repartidor Asignado:</strong> ${vars.driverName}<br>
          <strong>Última Actualización:</strong> ${vars.date}
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Puedes seguir el progreso de tu pedido en tiempo real desde tu panel de control.
        </p>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/delivery/dashboard/orders/${vars.orderId}" class="btn">Seguir Pedido</a>
        </div>
      `,
      'delivery',
      '#3b82f6'
    )
  }),

  payrollProcessed: (vars: TemplateVariables) => ({
    subject: `Tu nómina de ${vars.periodStart} ha sido procesada - BeFast`,
    html: createEmailTemplate(
      'Nómina Procesada',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.driverName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Tu nómina correspondiente al período <strong>${vars.periodStart} - ${vars.periodEnd}</strong> 
          ha sido procesada exitosamente.
        </p>
        
        <div style="background-color: #eff6ff; padding: 25px; border-radius: 8px; border: 2px solid #bfdbfe; margin: 20px 0;">
          <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px;">Resumen de Nómina</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dbeafe;">
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">Ingresos Brutos:</td>
              <td style="padding: 8px 0; color: #059669; font-weight: 700; text-align: right;">$${vars.earnings} MXN</td>
            </tr>
            <tr style="border-bottom: 1px solid #dbeafe;">
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">Total de Entregas:</td>
              <td style="padding: 8px 0; color: #1e40af; font-weight: 700; text-align: right;">${vars.totalOrders}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">Retenciones:</td>
              <td style="padding: 8px 0; color: #dc2626; font-weight: 700; text-align: right;">-$${vars.totalAmount} MXN</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Puedes ver el recibo detallado y descargar tu comprobante de nómina desde tu panel de repartidor.
        </p>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/repartidores/dashboard/payroll" class="btn" style="background: #16a34a;">Ver Recibo Detallado</a>
        </div>
      `,
      'drivers',
      '#16a34a'
    )
  }),

  campaignNotification: (vars: TemplateVariables) => ({
    subject: `${vars.subject} - BeFast`,
    html: createEmailTemplate(
      vars.subject || 'Promoción Especial',
      `
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hola ${vars.userName},</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Tenemos excelentes noticias para ti. ¡No te pierdas esta oportunidad especial!
        </p>
        
        <div style="background-color: #fffbeb; padding: 25px; border-radius: 8px; border: 2px solid #fde047; margin: 20px 0; text-align: center;">
          <h3 style="color: #a16207; font-size: 20px; margin-bottom: 10px;">¡Oferta Especial!</h3>
          <p style="color: #92400e; font-size: 16px; margin: 0;">${vars.description}</p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Aprovecha esta promoción limitada y descubre todos los beneficios que tenemos para ti.
        </p>
        
        <div style="text-align: center;">
          <a href="${WEB_APP_URL}/dashboard" class="btn" style="background: #eab308;">Ver Más Detalles</a>
        </div>
      `,
      'default',
      '#eab308'
    )
  })
};