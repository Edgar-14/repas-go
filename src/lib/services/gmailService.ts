// =================
// GMAIL SERVICE - EMAIL AUTOMATION
// =================

import { createTransport, Transporter } from 'nodemailer';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
export interface GmailConfig {
  user: string;
  pass: string;
  from: string;
  replyTo?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class GmailService {
  private transporter: Transporter;
  private config: GmailConfig;
  private baseUrl: string;

  constructor(config: GmailConfig, baseUrl: string = '') {
    this.config = config;
    this.baseUrl = baseUrl;

    // Crear transporter de Gmail
    this.transporter = createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.pass, // App password de Gmail
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verificar configuración
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.info('✅ Gmail service connected successfully');
    } catch (error) {
      console.error('❌ Gmail service connection failed:', error);
      throw new Error(`Gmail connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =================
  // EMAIL SENDING
  // =================

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      const mailOptions = {
        from: `${this.config.from} <${this.config.user}>`,
        replyTo: this.config.replyTo || this.config.user,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        cc: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc.join(', ') : emailData.cc) : undefined,
        bcc: emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc.join(', ') : emailData.bcc) : undefined,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: emailData.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.info(`✅ Email sent successfully to ${emailData.to}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Email sending failed to ${emailData.to}:`, errorMsg);
      
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  async sendBulkEmails(emails: EmailData[]): Promise<{
    success: number;
    failed: number;
    results: EmailResult[];
  }> {
    const results: EmailResult[] = [];
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
      
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    console.info(`📧 Bulk email completed: ${success} sent, ${failed} failed`);
    
    return { success, failed, results };
  }

  // =================
  // TEMPLATE HELPERS
  // =================

  private getLogoUrl(logoName: string): string {
    return `${this.baseUrl}/images/${logoName}`;
  }

  private getBaseTemplate(logoUrl: string, title: string, content: string, footer?: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 20px;
        }
        .content {
            padding: 30px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
        .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .highlight {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
        }
        .error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .header, .content, .footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoUrl}" alt="BeFast Logo" class="logo">
            <h1>${title}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        ${footer ? `<div class="footer">${footer}</div>` : ''}
    </div>
</body>
</html>`;
  }

  // =================
  // SPECIFIC TEMPLATES
  // =================

  async sendWelcomeEmail(to: string, userName: string, userType: 'driver' | 'business'): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = '¡Bienvenido a BeFast!';
    
    const content = `
      <h2>¡Hola ${userName}!</h2>
      <p>Te damos la bienvenida a la plataforma BeFast, tu aliado en el mundo de las entregas rápidas y eficientes.</p>
      
      <div class="highlight success">
        <h3>🎉 Tu cuenta ha sido activada</h3>
        <p>Ya puedes comenzar a usar todos los servicios de BeFast.</p>
      </div>
      
      <h3>Próximos pasos:</h3>
      <ul>
        ${userType === 'driver' ? `
          <li>Completa tu perfil de repartidor</li>
          <li>Sube tus documentos oficiales</li>
          <li>Configura tu método de pago</li>
          <li>¡Comienza a recibir pedidos!</li>
        ` : `
          <li>Configura tu perfil de negocio</li>
          <li>Agrega tus productos y servicios</li>
          <li>Configura tu zona de entrega</li>
          <li>¡Comienza a recibir pedidos!</li>
        `}
      </ul>
      
      <a href="${this.baseUrl}/${userType}/dashboard" class="button">Ir a mi Dashboard</a>
      
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
    `;
    
    const footer = `
      <p>Este es un correo automático de BeFast. Por favor, no respondas a este mensaje.</p>
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: '¡Bienvenido a BeFast! - Tu cuenta está activa',
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `¡Hola ${userName}! Bienvenido a BeFast. Tu cuenta ha sido activada y ya puedes comenzar a usar nuestros servicios.`,
    });
  }

  async sendOrderConfirmation(to: string, orderData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Confirmación de Pedido';
    
    const content = `
      <h2>¡Pedido Confirmado!</h2>
      <p>Hemos recibido tu pedido y está siendo procesado.</p>
      
      <div class="highlight">
        <h3>📋 Detalles del Pedido</h3>
        <p><strong>Número de pedido:</strong> ${orderData.id}</p>
        <p><strong>Fecha:</strong> ${new Date(orderData.createdAt).toLocaleString('es-MX')}</p>
        <p><strong>Total:</strong> $${orderData.total?.toFixed(2) || '0.00'} MXN</p>
        <p><strong>Estado:</strong> ${orderData.status}</p>
      </div>
      
      <h3>📍 Información de Entrega</h3>
      <p><strong>Dirección:</strong> ${orderData.deliveryAddress}</p>
      <p><strong>Método de pago:</strong> ${orderData.paymentMethod}</p>
      ${orderData.notes ? `<p><strong>Notas:</strong> ${orderData.notes}</p>` : ''}
      
      <a href="${this.baseUrl}/orders/${orderData.id}" class="button">Ver Pedido</a>
      
      <p>Te mantendremos informado sobre el estado de tu pedido.</p>
    `;
    
    const footer = `
      <p>Gracias por elegir BeFast para tus entregas.</p>
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `Confirmación de Pedido #${orderData.id}`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Pedido confirmado #${orderData.id}. Total: $${orderData.total?.toFixed(2) || '0.00'} MXN. Dirección: ${orderData.deliveryAddress}`,
    });
  }

  async sendDriverAssignment(to: string, driverName: string, orderData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Nuevo Pedido Asignado';
    
    const content = `
      <h2>¡Nuevo Pedido Asignado!</h2>
      <p>Hola ${driverName}, tienes un nuevo pedido asignado.</p>
      
      <div class="highlight success">
        <h3>🚚 Pedido #${orderData.id}</h3>
        <p><strong>Cliente:</strong> ${orderData.customerName}</p>
        <p><strong>Teléfono:</strong> ${orderData.customerPhone}</p>
        <p><strong>Dirección de entrega:</strong> ${orderData.deliveryAddress}</p>
        <p><strong>Método de pago:</strong> ${orderData.paymentMethod}</p>
        ${orderData.cashToCollect ? `<p><strong>Efectivo a cobrar:</strong> $${orderData.cashToCollect.toFixed(2)} MXN</p>` : ''}
        <p><strong>Comisión:</strong> $${orderData.commission?.toFixed(2) || '0.00'} MXN</p>
      </div>
      
      <h3>📍 Ubicación de Recogida</h3>
      <p><strong>Negocio:</strong> ${orderData.businessName}</p>
      <p><strong>Dirección:</strong> ${orderData.pickupAddress}</p>
      
      ${orderData.notes ? `
        <h3>📝 Notas Especiales</h3>
        <p>${orderData.notes}</p>
      ` : ''}
      
      <a href="${this.baseUrl}/repartidores/orders/${orderData.id}" class="button">Ver Detalles del Pedido</a>
      
      <p>¡Recuerda mantener una comunicación clara con el cliente!</p>
    `;
    
    const footer = `
      <p>Este pedido ha sido asignado automáticamente por el sistema BeFast.</p>
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `Nuevo Pedido Asignado #${orderData.id}`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Nuevo pedido #${orderData.id} asignado. Cliente: ${orderData.customerName}. Dirección: ${orderData.deliveryAddress}`,
    });
  }

  async sendPaymentConfirmation(to: string, paymentData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Confirmación de Pago';
    
    const content = `
      <h2>¡Pago Procesado Exitosamente!</h2>
      <p>Tu pago ha sido procesado y confirmado.</p>
      
      <div class="highlight success">
        <h3>💰 Detalles del Pago</h3>
        <p><strong>Monto:</strong> $${paymentData.amount.toFixed(2)} MXN</p>
        <p><strong>Fecha:</strong> ${new Date(paymentData.date).toLocaleString('es-MX')}</p>
        <p><strong>Método:</strong> ${paymentData.method}</p>
        <p><strong>Referencia:</strong> ${paymentData.reference}</p>
        <p><strong>Estado:</strong> ${paymentData.status}</p>
      </div>
      
      ${paymentData.orderId ? `
        <h3>📋 Pedido Relacionado</h3>
        <p><strong>Número de pedido:</strong> ${paymentData.orderId}</p>
      ` : ''}
      
      <a href="${this.baseUrl}/payments/${paymentData.id}" class="button">Ver Comprobante</a>
      
      <p>Gracias por tu pago. Tu transacción ha sido registrada exitosamente.</p>
    `;
    
    const footer = `
      <p>Este es un comprobante de pago automático de BeFast.</p>
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `Confirmación de Pago - $${paymentData.amount.toFixed(2)} MXN`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Pago confirmado por $${paymentData.amount.toFixed(2)} MXN. Referencia: ${paymentData.reference}`,
    });
  }

  async sendDocumentReminder(to: string, userName: string, documentType: string, expiryDate: Date): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Recordatorio de Documento';
    
    const content = `
      <h2>📄 Recordatorio de Documento</h2>
      <p>Hola ${userName}, este es un recordatorio sobre tu documento.</p>
      
      <div class="highlight warning">
        <h3>⚠️ Documento por Vencer</h3>
        <p><strong>Tipo de documento:</strong> ${documentType}</p>
        <p><strong>Fecha de vencimiento:</strong> ${expiryDate.toLocaleDateString('es-MX')}</p>
        <p><strong>Días restantes:</strong> ${Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días</p>
      </div>
      
      <h3>📝 Acción Requerida</h3>
      <p>Para mantener tu cuenta activa, necesitas actualizar este documento antes de la fecha de vencimiento.</p>
      
      <a href="${this.baseUrl}/documents/upload" class="button">Actualizar Documento</a>
      
      <p>Si no actualizas tu documento a tiempo, tu cuenta podría ser suspendida temporalmente.</p>
    `;
    
    const footer = `
      <p>Este es un recordatorio automático de BeFast.</p>
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `Recordatorio: ${documentType} por vencer`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Recordatorio: Tu ${documentType} vence el ${expiryDate.toLocaleDateString('es-MX')}. Actualiza tu documento para mantener tu cuenta activa.`,
    });
  }

  async sendPayrollNotification(to: string, userName: string, payrollData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Nómina Procesada';
    
    const content = `
      <h2>💰 Nómina Procesada</h2>
      <p>Hola ${userName}, tu nómina ha sido procesada exitosamente.</p>
      
      <div class="highlight success">
        <h3>📊 Resumen de Nómina</h3>
        <p><strong>Período:</strong> ${payrollData.period}</p>
        <p><strong>Ingreso bruto:</strong> $${payrollData.grossIncome.toFixed(2)} MXN</p>
        <p><strong>Deducciones:</strong> $${payrollData.deductions.toFixed(2)} MXN</p>
        <p><strong>Ingreso neto:</strong> $${payrollData.netIncome.toFixed(2)} MXN</p>
        <p><strong>Estado:</strong> ${payrollData.status}</p>
      </div>
      
      <h3>📋 Desglose de Deducciones</h3>
      <ul>
        <li>IMSS: $${payrollData.imss?.toFixed(2) || '0.00'} MXN</li>
        <li>ISR: $${payrollData.isr?.toFixed(2) || '0.00'} MXN</li>
        <li>INFONAVIT: $${payrollData.infonavit?.toFixed(2) || '0.00'} MXN</li>
      </ul>
      
      <a href="${this.baseUrl}/payroll/${payrollData.id}" class="button">Ver Comprobante de Nómina</a>
      
      <p>Tu pago será procesado según el método de pago configurado en tu cuenta.</p>
    `;
    
    const footer = `
      <p>Este es un comprobante de nómina automático de BeFast.</p>
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `Nómina Procesada - ${payrollData.period}`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Nómina procesada para ${payrollData.period}. Ingreso neto: $${payrollData.netIncome.toFixed(2)} MXN`,
    });
  }

  async sendSystemAlert(to: string, alertData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Alerta del Sistema';
    
    const content = `
      <h2>🚨 Alerta del Sistema</h2>
      <p>Se ha detectado una alerta en el sistema que requiere tu atención.</p>
      
      <div class="highlight ${alertData.severity === 'HIGH' ? 'error' : alertData.severity === 'MEDIUM' ? 'warning' : 'success'}">
        <h3>⚠️ ${alertData.title}</h3>
        <p><strong>Severidad:</strong> ${alertData.severity}</p>
        <p><strong>Tipo:</strong> ${alertData.type}</p>
        <p><strong>Fecha:</strong> ${new Date(alertData.timestamp).toLocaleString('es-MX')}</p>
        <p><strong>Descripción:</strong> ${alertData.description}</p>
      </div>
      
      ${alertData.actions ? `
        <h3>🔧 Acciones Recomendadas</h3>
        <ul>
          ${alertData.actions.map((action: string) => `<li>${action}</li>`).join('')}
        </ul>
      ` : ''}
      
      <a href="${this.baseUrl}/admin/alerts/${alertData.id}" class="button">Ver Alerta</a>
      
      <p>Por favor, revisa esta alerta y toma las acciones necesarias.</p>
    `;
    
    const footer = `
      <p>Esta es una alerta automática del sistema BeFast.</p>
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `Alerta del Sistema: ${alertData.title}`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Alerta del sistema: ${alertData.title}. Severidad: ${alertData.severity}. ${alertData.description}`,
    });
  }

  // =================
  // ADDITIONAL TEMPLATES FROM EMAIL-TEMPLATES.TS
  // =================

  async sendAdminWelcome(to: string, userName: string, resetLink: string): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Bienvenido al Equipo de Administración';
    
    const content = `
      <h2>¡Bienvenido al Equipo, ${userName}!</h2>
      <p>Tu cuenta de administrador para la plataforma BeFast ha sido creada.</p>
      
      <div class="highlight success">
        <h3>🔐 Configuración de Seguridad</h3>
        <p>Para garantizar la seguridad de tu cuenta, por favor, establece tu contraseña personal.</p>
      </div>
      
      <a href="${resetLink}" class="button">Establecer mi Contraseña</a>
      
      <p>Este enlace es de un solo uso y expirará pronto. Si no has solicitado este acceso, puedes ignorar este correo de forma segura.</p>
    `;
    
    const footer = `
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `¡Bienvenido al equipo de Administración de BeFast, ${userName}!`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Bienvenido al equipo de administración de BeFast, ${userName}. Establece tu contraseña: ${resetLink}`,
    });
  }

  async sendPasswordReset(data: { to: string; userName: string; resetLink: string; portal: string }): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Restablecer Contraseña';
    
    const portalNames = {
      admin: 'Panel Administrativo',
      delivery: 'Portal de Negocios', 
      drivers: 'Portal de Repartidores',
      default: 'BeFast'
    };
    const portalName = portalNames[data.portal as keyof typeof portalNames] || portalNames.default;
    
    const content = `
      <h2>🔐 Recuperar tu Contraseña</h2>
      <p>Hola ${data.userName},</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el ${portalName} de BeFast.</p>
      
      <div class="highlight info">
        <h3>🛡️ Seguridad de tu Cuenta</h3>
        <p>Si no solicitaste este cambio, puedes ignorar este correo. Tu cuenta permanecerá segura.</p>
      </div>
      
      <a href="${data.resetLink}" class="button">Restablecer mi Contraseña</a>
      
      <div class="highlight warning">
        <h3>⏰ Importante</h3>
        <p>Este enlace expirará en 1 hora por seguridad. Si necesitas un nuevo enlace, solicítalo nuevamente.</p>
      </div>
      
      <p>Una vez que restablezcas tu contraseña, podrás acceder normalmente a tu ${portalName}.</p>
    `;
    
    const footer = `
      <p>¿No solicitaste este cambio? Contacta a soporte inmediatamente: ${process.env.NEXT_PUBLIC_EMAIL_REPLY_TO || 'soporte@befastapp.com.mx'}</p>
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `🔐 Recuperar Contraseña - ${portalName} BeFast`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Recuperar contraseña de ${portalName} BeFast: ${data.resetLink}`,
    });
  }

  async sendOrderAssignment(to: string, driverName: string, orderData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = '¡Nuevo Pedido Asignado!';
    
    const content = `
      <h2>¡Nuevo Pedido Asignado!</h2>
      <p>Hola ${driverName}, tienes un nuevo pedido listo para ti.</p>
      
      <div class="highlight success">
        <h3>📦 Pedido #${orderData.id}</h3>
        <p><strong>Recoger en:</strong> ${orderData.pickupAddress}</p>
        <p><strong>Entregar a:</strong> ${orderData.deliveryAddress}</p>
        <p style="font-size: 18px; font-weight: bold; color: #10B981; margin-top: 15px;">Ganancia: $${orderData.earnings} MXN</p>
      </div>
      
      <p>Por favor, dirígete a la aplicación para aceptar y comenzar la entrega lo antes posible.</p>
      
      <a href="${this.baseUrl}/repartidores/dashboard?orderId=${orderData.id}" class="button">Ver Detalles del Pedido</a>
    `;
    
    const footer = `
      <p>Equipo BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: `¡Nuevo pedido asignado! #${orderData.id}`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Nuevo pedido asignado #${orderData.id}. Ganancia: $${orderData.earnings} MXN`,
    });
  }

  async sendWeeklyReport(to: string, userName: string, reportData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Tu Reporte Semanal';
    
    const content = `
      <h2>Tu Reporte Semanal</h2>
      <p>Hola ${userName}, aquí tienes tu resumen de actividad para la semana del <strong>${reportData.periodStart}</strong> al <strong>${reportData.periodEnd}</strong>.</p>
      
      <div class="highlight info">
        <h3>📊 Resumen de Actividad</h3>
        <table style="width: 100%; margin: 20px 0;">
          <tr>
            <td><strong>Total de Pedidos:</strong></td>
            <td style="text-align: right; font-weight: bold;">${reportData.totalOrders}</td>
          </tr>
          <tr>
            <td><strong>${reportData.amountLabel}:</strong></td>
            <td style="text-align: right; font-weight: bold; color: #10B981;">$${reportData.totalAmount} MXN</td>
          </tr>
          <tr>
            <td><strong>Calificación Promedio:</strong></td>
            <td style="text-align: right; font-weight: bold;">${reportData.averageRating} ★</td>
          </tr>
        </table>
      </div>
      
      <p>Para un análisis más detallado, visita tu panel de control.</p>
      
      <a href="${this.baseUrl}/dashboard/reports" class="button">Ver Reporte Completo</a>
    `;
    
    const footer = `
      <p>Equipo BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: "Tu resumen semanal en BeFast está listo",
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Resumen semanal: ${reportData.totalOrders} pedidos, $${reportData.totalAmount} MXN, ${reportData.averageRating} estrellas`,
    });
  }

  async sendPaymentReceipt(to: string, userName: string, paymentData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Recibo de Transacción';
    
    const content = `
      <h2>Recibo de Transacción</h2>
      <p>Hola ${userName}, te confirmamos que hemos procesado una transacción en tu cuenta.</p>
      
      <div class="highlight info">
        <h3>💰 Detalles de la Transacción</h3>
        <p><strong>ID de Transacción:</strong> #${paymentData.transactionId}</p>
        <p><strong>Fecha:</strong> ${paymentData.date}</p>
        <p><strong>Descripción:</strong> ${paymentData.description}</p>
        <p style="font-size: 18px; font-weight: bold; color: ${paymentData.amountColor || '#10B981'};">Monto: $${paymentData.amount} MXN</p>
      </div>
      
      <p>Puedes ver todos los detalles de esta transacción en tu billetera virtual.</p>
      
      <a href="${this.baseUrl}/dashboard/wallet?transactionId=${paymentData.transactionId}" class="button">Ver en mi Billetera</a>
    `;
    
    const footer = `
      <p>Equipo BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: `Recibo de tu transacción #${paymentData.transactionId}`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Recibo de transacción #${paymentData.transactionId}: $${paymentData.amount} MXN`,
    });
  }

  async sendAccountSuspension(to: string, userName: string, reason: string): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Notificación de Suspensión de Cuenta';
    
    const content = `
      <h2>Notificación de Suspensión de Cuenta</h2>
      <p>Hola ${userName}, te escribimos para informarte que tu cuenta ha sido suspendida temporalmente.</p>
      
      <div class="highlight error">
        <h3>⚠️ Motivo de la Suspensión</h3>
        <p>${reason}</p>
      </div>
      
      <p>Nuestro equipo revisará tu caso. Si crees que se trata de un error o necesitas más información, por favor, ponte en contacto con nuestro equipo de soporte.</p>
      
      <a href="mailto:${process.env.NEXT_PUBLIC_EMAIL_REPLY_TO || 'soporte@befastapp.com.mx'}" class="button">Contactar a Soporte</a>
    `;
    
    const footer = `
      <p>Equipo de Cumplimiento de BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: "Notificación Importante Sobre tu Cuenta BeFast",
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Tu cuenta ha sido suspendida. Motivo: ${reason}`,
    });
  }

  async sendBusinessWelcome(to: string, userName: string, verificationCode: string): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = '¡Bienvenido a BeFast!';
    
    const content = `
      <h2>¡Bienvenido a BeFast!</h2>
      <p>Hola ${userName}, tu cuenta ha sido creada.</p>
      
      <div class="highlight info">
        <h3>🔐 Código de Verificación</h3>
        <p>Usa el siguiente código para verificar tu cuenta en la aplicación:</p>
        <div style="background-color: #fffbeb; border: 2px dashed #fbbF24; color: #b45309; padding: 10px 20px; margin: 20px auto; display: inline-block; border-radius: 8px;">
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 0;">${verificationCode}</p>
        </div>
      </div>
      
      <p>Una vez verificado, podrás empezar a solicitar entregas y gestionar tus pedidos desde nuestro dashboard.</p>
      
      <a href="${this.baseUrl}/login" class="button">Acceder a mi Panel</a>
    `;
    
    const footer = `
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `¡Bienvenido a BeFast, ${userName}!`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Bienvenido a BeFast, ${userName}. Código de verificación: ${verificationCode}`,
    });
  }

  async sendDriverWelcome(to: string, userName: string): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Solicitud Recibida';
    
    const content = `
      <h2>Solicitud Recibida</h2>
      <p>Hola ${userName},</p>
      <p>Hemos recibido tu solicitud para unirte al equipo de repartidores de BeFast. ¡Gracias por tu interés!</p>
      
      <div class="highlight info">
        <h3>📋 Próximos Pasos</h3>
        <p>Nuestro equipo revisará tus documentos. Te notificaremos por correo tan pronto como tu solicitud sea aprobada (usualmente en 24-48 horas).</p>
      </div>
      
      <p>Mientras tanto, asegúrate de tener todos tus documentos listos para una revisión rápida.</p>
    `;
    
    const footer = `
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `¡Gracias por aplicar a BeFast, ${userName}!`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Solicitud recibida para repartidor. Revisión en 24-48 horas.`,
    });
  }

  async sendDriverApproved(to: string, userName: string, resetLink: string): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = '¡Tu cuenta ha sido aprobada!';
    
    const content = `
      <h2>¡Tu cuenta ha sido aprobada!</h2>
      <p>Hola ${userName},</p>
      <p>Tu solicitud para ser repartidor en BeFast ha sido aprobada. Para comenzar, debes establecer tu contraseña personal y completar tu perfil en la plataforma.</p>
      
      <div class="highlight success">
        <h3>🎉 ¡Bienvenido al Equipo!</h3>
        <p>Ya eres parte del equipo de repartidores de BeFast.</p>
      </div>
      
      <a href="${resetLink}" class="button">Establecer mi Contraseña</a>
      
      <p>Una vez que completes este paso, recibirás instrucciones adicionales y tu acceso operativo será habilitado por el equipo de BeFast.</p>
    `;
    
    const footer = `
      <p>¿Tienes dudas? Responde a este correo o contacta a soporte: ${process.env.NEXT_PUBLIC_EMAIL_REPLY_TO || 'soporte@befastapp.com.mx'}</p>
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `¡Bienvenido a BeFast, ${userName}! Tu cuenta de repartidor ha sido aprobada`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Tu cuenta de repartidor ha sido aprobada. Establece tu contraseña: ${resetLink}`,
    });
  }

  async sendVerificationCode(to: string, code: string, expirationMinutes: number = 10): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Código de Verificación';
    
    const content = `
      <h2>Código de Verificación</h2>
      <p>Tu código de verificación es:</p>
      
      <div class="highlight info">
        <div style="font-size: 32px; font-weight: bold; color: #059669; margin: 20px 0; text-align: center;">${code}</div>
      </div>
      
      <p>Este código expira en ${expirationMinutes} minutos.</p>
    `;
    
    const footer = `
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: 'Código de verificación - BeFast',
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Tu código de verificación es: ${code}. Expira en ${expirationMinutes} minutos.`,
    });
  }

  async sendEmailChangeVerification(to: string, code: string, expirationMinutes: number = 10): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Verifica tu nuevo correo electrónico';
    
    const content = `
      <h2>Verifica tu nuevo correo electrónico</h2>
      <p>Tu código de verificación es:</p>
      
      <div class="highlight info">
        <div style="font-size: 32px; font-weight: bold; color: #059669; margin: 20px 0; text-align: center;">${code}</div>
      </div>
      
      <p>Este código expira en ${expirationMinutes} minutos.</p>
    `;
    
    const footer = `
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: 'Verifica tu nuevo correo electrónico - BeFast',
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Código de verificación para cambio de email: ${code}. Expira en ${expirationMinutes} minutos.`,
    });
  }

  // =================
  // ADDITIONAL TEMPLATES FROM EMAIL-TEMPLATES.TS (MISSING TEMPLATES)
  // =================

  async sendLowCreditsAlert(to: string, businessName: string, totalAmount: number): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = '⚠️ Créditos Bajos';
    
    const content = `
      <h2>⚠️ Créditos Bajos</h2>
      <p>Hola ${businessName},</p>
      <p>Tu cuenta tiene <strong>menos de 5 créditos</strong> disponibles. Para evitar interrupciones en el servicio, te recomendamos recargar tu cuenta lo antes posible.</p>
      
      <div class="highlight error">
        <h3>💰 Créditos Restantes</h3>
        <p style="font-size: 18px; font-weight: bold; color: #dc2626; margin: 0;">Créditos Restantes: ${totalAmount}</p>
      </div>
      
      <a href="${this.baseUrl}/dashboard/credits" class="button">Recargar Ahora</a>
    `;
    
    const footer = `
      <p>Equipo BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: "⚠️ Alerta: Créditos bajos en tu cuenta BeFast",
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Alerta: Créditos bajos. Restantes: ${totalAmount}. Recarga tu cuenta para evitar interrupciones.`,
    });
  }

  async sendCriticalSystemAlert(to: string, alertData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = '🚨 ALERTA CRÍTICA DEL SISTEMA';
    
    const content = `
      <h2>🚨 ALERTA CRÍTICA DEL SISTEMA</h2>
      <p>Se ha detectado una alerta crítica que requiere atención inmediata.</p>
      
      <div class="highlight error">
        <h3>⚠️ Descripción del Error</h3>
        <p>${alertData.description}</p>
      </div>
      
      <p><strong>Hora del Incidente:</strong> ${alertData.date}</p>
      <p><strong>ID de Transacción/Pedido:</strong> ${alertData.transactionId || alertData.orderId || 'N/A'}</p>
      
      <a href="${this.baseUrl}/admin/dashboard" class="button">Revisar Dashboard</a>
    `;
    
    const footer = `
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `🚨 ALERTA CRÍTICA: ${alertData.description}`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `ALERTA CRÍTICA: ${alertData.description}. Hora: ${alertData.date}`,
    });
  }

  async sendNewDriverApplication(to: string, applicationData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = '📋 Nueva Solicitud de Repartidor';
    
    const content = `
      <h2>📋 Nueva Solicitud de Repartidor</h2>
      <p>Se ha recibido una nueva solicitud de repartidor que requiere revisión:</p>
      
      <div class="highlight info">
        <h3>👤 Información del Solicitante</h3>
        <p><strong>Solicitante:</strong> ${applicationData.userName}</p>
        <p><strong>Email:</strong> ${applicationData.userEmail}</p>
        <p><strong>Fecha de Solicitud:</strong> ${applicationData.date}</p>
      </div>
      
      <a href="${this.baseUrl}/admin/driver-applications" class="button">Revisar Solicitud</a>
    `;
    
    const footer = `
      <p>Sistema Automático BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: "📋 Nueva solicitud de repartidor pendiente de revisión",
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Nueva solicitud de repartidor: ${applicationData.userName} (${applicationData.userEmail})`,
    });
  }

  async sendDriverApplicationRejected(to: string, userName: string, reason: string): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Actualización de tu Solicitud';
    
    const content = `
      <h2>Actualización de tu Solicitud</h2>
      <p>Hola ${userName},</p>
      <p>Gracias por tu interés en formar parte del equipo de repartidores de BeFast. Después de revisar tu solicitud, hemos determinado que no podemos continuar con el proceso en este momento.</p>
      
      <div class="highlight error">
        <h3>📋 Motivo</h3>
        <p>${reason}</p>
      </div>
      
      <p>Si tienes preguntas sobre esta decisión o deseas aplicar nuevamente en el futuro, no dudes en contactarnos.</p>
      
      <a href="mailto:${process.env.NEXT_PUBLIC_EMAIL_REPLY_TO || 'soporte@befastapp.com.mx'}" class="button">Contactar Soporte</a>
    `;
    
    const footer = `
      <p>Equipo BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: "Actualización sobre tu solicitud para ser repartidor en BeFast",
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Actualización de solicitud: ${reason}`,
    });
  }

  async sendEmergencyTicket(to: string, ticketData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = '🚨 TICKET DE EMERGENCIA';
    
    const content = `
      <h2>🚨 TICKET DE EMERGENCIA</h2>
      <p>Se ha creado un nuevo ticket de emergencia que requiere atención inmediata:</p>
      
      <div class="highlight error">
        <h3>📋 Detalles del Ticket</h3>
        <p><strong>Reportado por:</strong> ${ticketData.userName}</p>
        <p><strong>Tipo de Usuario:</strong> ${ticketData.description}</p>
        <p><strong>Descripción:</strong> ${ticketData.reason}</p>
        <p><strong>Fecha:</strong> ${ticketData.date}</p>
      </div>
      
      <a href="${this.baseUrl}/admin/support" class="button">Atender Ticket</a>
    `;
    
    const footer = `
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: `🚨 TICKET DE EMERGENCIA: ${ticketData.description}`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `TICKET DE EMERGENCIA: ${ticketData.description}. Reportado por: ${ticketData.userName}`,
    });
  }

  async sendSupportTicketResponse(to: string, userName: string, ticketData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Respuesta a tu Solicitud';
    
    const content = `
      <h2>Respuesta a tu Solicitud</h2>
      <p>Hola ${userName},</p>
      <p>Hemos revisado tu ticket de soporte <strong>#${ticketData.transactionId}</strong> y tenemos una respuesta para ti:</p>
      
      <div class="highlight info">
        <h3>💬 Respuesta del Equipo</h3>
        <p style="font-style: italic;">"${ticketData.description}"</p>
      </div>
      
      <a href="${this.baseUrl}/dashboard/support" class="button">Ver Mis Tickets</a>
    `;
    
    const footer = `
      <p>Equipo de Soporte BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: `Respuesta a tu ticket de soporte #${ticketData.transactionId}`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Respuesta a ticket #${ticketData.transactionId}: ${ticketData.description}`,
    });
  }

  async sendSupportTicketClosed(to: string, userName: string, ticketData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Ticket Cerrado';
    
    const content = `
      <h2>Ticket Cerrado</h2>
      <p>Hola ${userName},</p>
      <p>Tu ticket de soporte <strong>#${ticketData.transactionId}</strong> ha sido marcado como resuelto y cerrado.</p>
      
      <div class="highlight success">
        <h3>✅ Resuelto</h3>
        <p>Tu consulta ha sido atendida exitosamente.</p>
      </div>
      
      <p>Si necesitas ayuda adicional o tienes nuevas consultas, no dudes en crear un nuevo ticket desde tu dashboard.</p>
      
      <a href="${this.baseUrl}/dashboard/support" class="button">Centro de Soporte</a>
    `;
    
    const footer = `
      <p>Equipo de Soporte BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: `Tu ticket de soporte #${ticketData.transactionId} ha sido cerrado`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Ticket #${ticketData.transactionId} cerrado. Consulta resuelta.`,
    });
  }

  async sendOrderStatusUpdate(to: string, businessName: string, orderData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Actualización de Pedido';
    
    const content = `
      <h2>Actualización de Pedido</h2>
      <p>Hola ${businessName},</p>
      <p>Tu pedido <strong>#${orderData.id}</strong> ha sido actualizado:</p>
      
      <div class="highlight info">
        <h3>📦 Estado Actual</h3>
        <p><strong>Estado Actual:</strong> <span style="color: #0ea5e9; font-weight: bold;">${orderData.description}</span></p>
        <p><strong>Repartidor Asignado:</strong> ${orderData.driverName}</p>
        <p><strong>Actualización:</strong> ${orderData.date}</p>
      </div>
      
      <a href="${this.baseUrl}/dashboard/orders/${orderData.id}" class="button">Seguir Pedido</a>
    `;
    
    const footer = `
      <p>Equipo BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: `Actualización de tu pedido #${orderData.id}`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Pedido #${orderData.id} actualizado: ${orderData.description}`,
    });
  }

  async sendPayrollProcessed(to: string, driverName: string, payrollData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Nómina Procesada';
    
    const content = `
      <h2>Nómina Procesada</h2>
      <p>Hola ${driverName},</p>
      <p>Tu nómina correspondiente al período <strong>${payrollData.periodStart} - ${payrollData.periodEnd}</strong> ha sido procesada exitosamente.</p>
      
      <div class="highlight info">
        <h3>💰 Resumen de Nómina</h3>
        <table style="width: 100%; margin: 20px 0;">
          <tr>
            <td><strong>Ingresos Brutos:</strong></td>
            <td style="text-align: right; font-weight: bold; color: #059669;">$${payrollData.earnings} MXN</td>
          </tr>
          <tr>
            <td><strong>Total de Entregas:</strong></td>
            <td style="text-align: right; font-weight: bold;">${payrollData.totalOrders}</td>
          </tr>
          <tr>
            <td><strong>Retenciones:</strong></td>
            <td style="text-align: right; font-weight: bold; color: #dc2626;">-$${payrollData.totalAmount} MXN</td>
          </tr>
        </table>
      </div>
      
      <a href="${this.baseUrl}/repartidores/dashboard/payroll" class="button">Ver Recibo Detallado</a>
    `;
    
    const footer = `
      <p>Departamento de Nómina BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: `Tu nómina de ${payrollData.periodStart} ha sido procesada`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `Nómina procesada: $${payrollData.earnings} MXN, ${payrollData.totalOrders} entregas`,
    });
  }

  async sendCampaignNotification(to: string, userName: string, campaignData: any): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = `🎉 ${campaignData.subject}`;
    
    const content = `
      <h2>🎉 ${campaignData.subject}</h2>
      <p>Hola ${userName},</p>
      
      <div class="highlight warning">
        <h3>🎯 Promoción Especial</h3>
        <p style="font-size: 18px; color: #92400e; margin: 0;">${campaignData.description}</p>
      </div>
      
      <a href="${this.baseUrl}/dashboard" class="button">Ver Más Detalles</a>
    `;
    
    const footer = `
      <p>Equipo de Marketing BeFast</p>
    `;

    return this.sendEmail({
      to,
      subject: `🎉 ${campaignData.subject}`,
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: `${campaignData.subject}: ${campaignData.description}`,
    });
  }

  // =================
  // UTILITY METHODS
  // =================

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Gmail connection test failed:', error);
      return false;
    }
  }


  async sendTestEmail(to: string): Promise<EmailResult> {
    const logoUrl = this.getLogoUrl('logo-befast.png');
    const title = 'Correo de Prueba';
    
    const content = `
      <h2>🧪 Correo de Prueba</h2>
      <p>Este es un correo de prueba para verificar que el servicio de Gmail está funcionando correctamente.</p>
      
      <div class="highlight success">
        <h3>✅ Configuración Correcta</h3>
        <p>Si recibes este correo, significa que la integración con Gmail está funcionando perfectamente.</p>
      </div>
      
      <p><strong>Fecha de envío:</strong> ${new Date().toLocaleString('es-MX')}</p>
      <p><strong>Servicio:</strong> Gmail SMTP</p>
      
      <p>¡El sistema de correos automáticos está listo para funcionar!</p>
    `;
    
    const footer = `
      <p>Este es un correo de prueba del sistema BeFast.</p>
      <p>© 2024 BeFast. Todos los derechos reservados.</p>
    `;

    return this.sendEmail({
      to,
      subject: '🧪 Correo de Prueba - BeFast Gmail Service',
      html: this.getBaseTemplate(logoUrl, title, content, footer),
      text: 'Correo de prueba del sistema BeFast. Si recibes este mensaje, la integración con Gmail está funcionando correctamente.',
    });
  }
}

// =================
// DEFAULT CONFIGURATION
// =================

export const getDefaultGmailConfig = (): GmailConfig => {
  return {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.NEXT_PUBLIC_EMAIL_FROM || 'BeFast',
    replyTo: process.env.NEXT_PUBLIC_EMAIL_REPLY_TO || process.env.SMTP_USER,
  };
};

// =================
// SINGLETON INSTANCE
// =================

let gmailServiceInstance: GmailService | null = null;

export const getGmailService = (baseUrl?: string): GmailService => {
  if (!gmailServiceInstance) {
    const config = getDefaultGmailConfig();
    const defaultBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
    gmailServiceInstance = new GmailService(config, baseUrl || defaultBaseUrl);
  }
  return gmailServiceInstance;
};