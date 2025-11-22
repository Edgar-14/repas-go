/**
 * @file Implements the Next.js middleware for route protection and authentication checks.
 * @author Jules
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/utils/logger";

/**
 * BEFAST UNIFIED MIDDLEWARE
 * Basado en: BeFast Ecosistema - Documentación Técnica v6.0
 * 
 * Sistema único de autenticación para todo el ecosistema
 * Note: Edge Runtime compatible - Firebase Admin SDK verification moved to API routes
 */

// AuthMiddleware implementation
/**
 * A helper class containing static methods for authentication logic within the middleware.
 */
export class AuthMiddleware {
  /**
   * Checks if a given pathname is a public route that does not require authentication.
   * @param {string} pathname - The path to check.
   * @returns {boolean} True if the route is public.
   */
  static isPublicRoute(pathname: string): boolean {
    const publicRoutes = [
      '/admin/login', '/delivery/login', '/repartidores/login',
      '/admin/forgot-password', '/delivery/forgot-password', '/repartidores/forgot-password',
      // '/admin/reset-password' IS NO LONGER A GENERIC PUBLIC ROUTE
      '/admin/signup', '/delivery/signup', '/repartidores/signup',
      '/repartidores/signup/step-1', '/repartidores/signup/step-2', '/repartidores/signup/step-3', '/repartidores/signup/step-4', '/repartidores/signup/step-5',
      '/repartidores/solicitud-recibida', '/delivery/verify-code',
      '/', '/privacy', '/terms'
    ];
    return publicRoutes.includes(pathname);
  }

  static isPasswordResetRoute(req: NextRequest): boolean {
    const { pathname, searchParams } = req.nextUrl;
    const isResetPath = pathname.endsWith('/reset-password');
    const hasOobCode = searchParams.has('oobCode'); // Check for Firebase's oobCode
    return isResetPath && hasOobCode;
  }

  static hasValidToken(req: NextRequest): boolean {
    // Check for Firebase token in cookies
    const firebaseToken = req.cookies.get('firebase-token')?.value;
    const sessionToken = req.cookies.get('__session')?.value;
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    // If any token exists, assume it's valid (detailed verification happens in API routes)
    // This is a security trade-off for Edge Runtime compatibility
    const hasToken = !!(firebaseToken || sessionToken || bearerToken);
    
    if (hasToken) {
      logger.debug('Token found in middleware - allowing access', undefined, 'MIDDLEWARE');
    } else {
      logger.debug('No token found in middleware - checking cookies', {
        firebaseToken: !!firebaseToken,
        sessionToken: !!sessionToken,
        bearerToken: !!bearerToken,
        allCookies: req.cookies.getAll().map(c => c.name)
      }, 'MIDDLEWARE');
    }
    
    return hasToken;
  }

  static getLoginRedirect(pathname: string): string {
    if (pathname.startsWith('/admin')) return '/admin/login';
    if (pathname.startsWith('/delivery')) return '/delivery/login';
    if (pathname.startsWith('/repartidores')) return '/repartidores/login';
    return '/';
  }
}

/**
 * The main middleware function that runs on matching requests.
 *
 * It checks for the presence of an authentication token in cookies. If a token is not found
 * on a protected route, it redirects the user to the appropriate login page.
 * It allows access to public routes and password reset routes without a token.
 * Note: Full token *validation* is delegated to API routes and client-side hooks due to Edge Runtime limitations.
 *
 * @param {NextRequest} req The incoming request object.
 * @returns {NextResponse} The response object, which can be a redirect or a pass-through.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow password reset routes if they have a valid Firebase action code
  if (AuthMiddleware.isPasswordResetRoute(req)) {
    return NextResponse.next();
  }

  // Verificar si es ruta pública
  if (AuthMiddleware.isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Debug logging for production troubleshooting
  logger.debug('Middleware processing', { pathname }, 'MIDDLEWARE');

  // Check if user has a valid token (simplified check for Edge Runtime compatibility)
  const hasToken = AuthMiddleware.hasValidToken(req);

  // Si no hay token válido, redirigir al login correspondiente
  if (!hasToken) {
    const loginUrl = AuthMiddleware.getLoginRedirect(pathname);
    logger.debug('No token found, redirecting', { loginUrl, pathname }, 'MIDDLEWARE');
    
    // Evitar redirecciones infinitas - verificar si ya estamos en la página de login
    if (pathname === loginUrl) {
      logger.debug('Already at login page, allowing access to prevent infinite redirect', undefined, 'MIDDLEWARE');
      return NextResponse.next();
    }
    
    return NextResponse.redirect(new URL(loginUrl, req.url));
  }

  // Token exists - allow access (detailed verification happens in individual API routes/pages)
  logger.debug('Token found - allowing access', { pathname }, 'MIDDLEWARE');
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/delivery/:path*", "/repartidores/:path*"],
};