import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json();

    // Configuración de WhatsApp Business API
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: 'WhatsApp Business API no está configurado' },
        { status: 500 }
      );
    }

    // Formatear número de teléfono
    const sanitizedPhone = to.replace(/[^\d]/g, '');
    const formattedPhone = sanitizedPhone.length === 10 ? `52${sanitizedPhone}` : sanitizedPhone;

    // Enviar mensaje usando WhatsApp Business API
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
          type: 'text',
          text: { body: message }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('WhatsApp API error:', errorData);
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id
    });

  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}