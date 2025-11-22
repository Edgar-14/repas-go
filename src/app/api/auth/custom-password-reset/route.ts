import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';


export async function POST(request: NextRequest) {
  const { email, portal } = await request.json();
  
  if (!email || !portal) {
    return NextResponse.json({ error: 'Email and portal are required' }, { status: 400 });
  }

  try {
    const user = await auth.getUserByEmail(email);

    // Generate the password reset link using Firebase Admin SDK
    // Use a canonical URL from env vars to avoid localhost/origin issues.
    // This is critical in production as the origin would be the internal Cloud Run URL.
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`;
    const actionCodeSettings = {
      url: `${baseUrl}/${portal}/reset-password`,
      handleCodeInApp: true,
    };
    const resetLink = await auth.generatePasswordResetLink(email, actionCodeSettings);

    // Standardize access to environment variables, checking for multiple possible names
    const emailUser = process.env.EMAIL_USER || process.env.BEFAST_EMAIL_USER || process.env.GMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.BEFAST_EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

    if (!emailUser || !emailPass) {
      console.error('Email service credentials are not configured in environment variables.');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Setup nodemailer transporter (use environment variables for credentials)
    const transporter = nodemailer.createTransport({
        host: process.env.GMAIL_HOST || 'smtp.gmail.com', // fallback host
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: emailUser,
            pass: emailPass,
        },
    });

    // Send the email
    await transporter.sendMail({
        from: `"BeFast Support" <${emailUser}>`,
        to: email,
        subject: 'Restablecimiento de Contraseña',
        html: `<p>Hola,</p>
               <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
               <a href="${resetLink}">Restablecer Contraseña</a>
               <p>Si no solicitaste esto, por favor ignora este correo.</p>`,
    });

    return NextResponse.json({ success: true, message: 'Password reset email sent.' });

  } catch (error: any) {
    console.error('Password reset error:', error);
    if (error.code === 'auth/user-not-found') {
      // Still return a success message to prevent user enumeration
      return NextResponse.json({ success: true, message: 'If an account with this email exists, a reset link has been sent.' });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
