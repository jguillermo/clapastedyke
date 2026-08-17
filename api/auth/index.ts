/**
 * La función `auth`: el cliente confidencial de OAuth de la app.
 *
 * Es **todo el backend de la sesión** y no hace nada más: custodia el refresh token de cada persona
 * y emite tokens de acceso frescos. Ni toca la hoja de cálculo, ni sabe qué es una receta — la
 * sincronización sigue entera en el navegador.
 *
 * ```
 * POST /api/auth/exchange    { code }   → abre sesión (cookie __session) y devuelve un token
 * POST /api/auth/token                  → token nuevo desde la cookie. Sin ventana, sin gesto
 * POST /api/auth/sign-out               → revoca en Google, borra todo, limpia la cookie
 * ```
 *
 * Se sirve en `/api/auth/**` por el rewrite de Firebase Hosting, así que para el navegador es
 * **mismo origen**: no hay CORS que configurar y la cookie viaja sola.
 */
import { onRequest, type Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';
import { logger } from 'firebase-functions';
import { normalizePath, sendError } from '../_common/http';
import { GOOGLE_OAUTH_CLIENT_SECRET } from './config';
import { handleExchange } from './exchange';
import { handleToken } from './token';
import { handleSignOut } from './sign-out';
import type { RouteContext } from './context';

const FUNCTION_NAME = 'auth';

type Route = (req: Request, res: Response, ctx: RouteContext) => Promise<void>;

const ROUTES: Record<string, Route> = {
  '/exchange': handleExchange,
  '/token': handleToken,
  '/sign-out': handleSignOut,
};

export const auth = onRequest(
  {
    // Declarar el secreto es lo que hace que `GOOGLE_OAUTH_CLIENT_SECRET.value()` tenga valor.
    secrets: [GOOGLE_OAUTH_CLIENT_SECRET],
    region: 'us-central1',
    // La app la llama en cada arranque; que un usuario espere un arranque en frío es aceptable,
    // pero no diez segundos.
    timeoutSeconds: 30,
    memory: '256MiB',
    // Sin `cors`: se sirve como mismo origen a través del rewrite de Hosting.
  },
  async (req, res) => {
    const path = normalizePath(req.path, FUNCTION_NAME);
    const route = ROUTES[path];

    if (!route) {
      sendError(res, 404, 'not_found', `La ruta ${path} no existe en la función auth.`);
      return;
    }
    // Todas mutan estado (abren, renuevan o cierran sesión): ninguna puede ser GET.
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      sendError(res, 405, 'method_not_allowed', 'Esta ruta solo acepta POST.');
      return;
    }

    const ctx: RouteContext = { secure: isSecure(req) };

    try {
      await route(req, res, ctx);
    } catch (error) {
      // El último recinto: sin esto, un fallo inesperado devolvería el HTML de error de Cloud
      // Functions y el navegador lo intentaría parsear como JSON.
      logger.error('fallo no controlado en la función auth', error, { path });
      if (!res.headersSent) {
        sendError(res, 500, 'internal', 'Ha fallado el servicio de sesión.');
      }
    }
  },
);

/**
 * Detrás de Hosting siempre es HTTPS, pero la petición llega a la función por HTTP: lo que lo
 * delata es `x-forwarded-proto`. En el emulador, sobre `http://localhost`, no hay ninguno de los
 * dos y la cookie se emite sin `Secure` para que el navegador la guarde.
 */
function isSecure(req: Request): boolean {
  const forwarded = req.get('x-forwarded-proto');
  return forwarded ? forwarded.split(',')[0]?.trim() === 'https' : req.protocol === 'https';
}
