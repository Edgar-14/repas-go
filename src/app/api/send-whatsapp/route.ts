/**
 * API endpoint para enviar mensajes de WhatsApp
 * Implementa el flujo corregido para usar WhatsApp Business API
 */

import { NextRequest, NextResponse } from 'next/server';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

type TemplateFieldKey = 'customerName' | 'businessName' | 'orderNumber' | 'shippingCost' | 'totalAmount';

function resolveTemplateFields(): TemplateFieldKey[] {
  const raw = process.env.WHATSAPP_TEMPLATE_BODY_FIELDS || 'customerName,businessName,orderNumber,shippingCost';
  return raw
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean)
    .map((field) => field as TemplateFieldKey);
}

function buildBodyParameters(fields: TemplateFieldKey[], values: Record<TemplateFieldKey, string | undefined>) {
  return fields.map((field) => {
    const value = values[field];
    if (!value) {
      throw new Error(`Falta el valor requerido para el campo de plantilla: ${field}`);
    }
    return { type: 'text', text: value };
  });
}

export async function POST(request: NextRequest) {
  try {
    const {
      customerPhone,
      customerName,
      businessName,
      shippingCost,
      orderNumber,
      totalAmount
    } = await request.json();

    const shippingCostValue = typeof shippingCost === 'string' ? Number(shippingCost) : shippingCost;
    const totalAmountValue = typeof totalAmount === 'string' ? Number(totalAmount) : totalAmount;

    // Validar datos requeridos
    if (!customerPhone || !customerName || !businessName || !orderNumber) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: customerPhone, customerName, businessName, orderNumber' },
        { status: 400 }
      );
    }

    // Configuración de WhatsApp Business API
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.error('WhatsApp Business API credentials not configured');
      return NextResponse.json(
        { error: 'WhatsApp Business API no está configurado' },
        { status: 500 }
      );
    }

    // Configuración de plantilla aprobada en WhatsApp Business Manager
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
    const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es_MX';
    const templateHeader = process.env.WHATSAPP_TEMPLATE_HEADER_TEXT;
    const templateFields = resolveTemplateFields();

    if (!templateName) {
      console.error('WhatsApp template name not configured');
      return NextResponse.json(
        { error: 'Plantilla de WhatsApp no configurada' },
        { status: 500 }
      );
    }

    const bodyValues: Record<TemplateFieldKey, string | undefined> = {
      customerName,
      businessName,
      orderNumber: orderNumber ? `#${orderNumber}` : undefined,
      shippingCost: typeof shippingCostValue === 'number' && Number.isFinite(shippingCostValue)
        ? currencyFormatter.format(shippingCostValue)
        : undefined,
      totalAmount: typeof totalAmountValue === 'number' && Number.isFinite(totalAmountValue)
        ? currencyFormatter.format(totalAmountValue)
        : undefined
    };

    const components: Array<Record<string, any>> = [
      {
        type: 'body',
        parameters: buildBodyParameters(templateFields, bodyValues)
      }
    ];

    // Note: order_confirmation_v1 template has a fixed header "BeFast Ecosistema"
    // No header parameters needed as it's not parametrized

    // Enviar mensaje usando WhatsApp Business API
    const sanitizedPhone = customerPhone.replace(/[^\d]/g, '');
    const formattedPhone = sanitizedPhone.length === 10 ? `52${sanitizedPhone}` : sanitizedPhone;

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: templateLanguage },
            components
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('WhatsApp API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        to: formattedPhone
      });

      throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    console.log('✅ WhatsApp enviado exitosamente:', {
      customerPhone,
      customerName,
      orderNumber,
      messageId: result.messages?.[0]?.id
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp enviado exitosamente',
      messageId: result.messages?.[0]?.id,
      customerPhone,
      orderNumber
    });

  } catch (error) {
    console.error('Error enviando WhatsApp:', error);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}