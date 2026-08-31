/**
 * El enrutado y el CORS.
 *
 * Tres rutas, todas `POST`. Lo que hay alrededor —preflight, método equivocado, ruta inexistente,
 * fallo inesperado— se resuelve aquí una sola vez, para que ninguna ruta tenga que acordarse.
 *
 * ## CRITICAL: se refleja CUALQUIER origen, y eso tiene un coste conocido
 *
 * La app **no** llega por un rewrite de mismo origen: llama a la URL directa de la función, así que
 * cada petición es de origen cruzado y el navegador exige cabeceras CORS. Sin ellas descarta la
 * respuesta antes de que la app la vea, y lo hace sin error legible — lo que lo vuelve difícil de
 * diagnosticar.
 *
 * Con `Allow-Credentials: true` la especificación prohíbe el comodín `*`: hay que devolver el origen
 * concreto que pidió. Aquí se devuelve **el que venga, sea cual sea**.
 *
 * Eso significa que cualquier web que visite la persona puede hacer `POST /refresh` desde su
 * navegador, recibir un token de acceso válido y usarlo contra los ficheros que esta app creó en su
 * Drive. Es una decisión tomada a sabiendas, no un descuido: si algún día se quiere cerrar, el único
 * cambio es que `allowedOrigin` consulte una lista en vez de devolver lo que le dan.
 */
import * as logger from "firebase-functions/logger";
import {isSecure, normalizePath, sendError} from "./http";
import type {HttpRequest, HttpResponse} from "./http";
import {handleExchange, handleLogout, handleRefresh, type Route} from "./routes";

const ROUTES: Record<string, Route> = {
  "/exchange": handleExchange,
  "/refresh": handleRefresh,
  "/logout": handleLogout,
};

/** Cuánto puede el navegador reutilizar el resultado del preflight, en segundos. */
const PREFLIGHT_MAX_AGE = 3600;

export async function route(req: HttpRequest, res: HttpResponse): Promise<void> {
  // El preflight se contesta antes que nada: llega como OPTIONS a la misma URL, y si se le aplicara
  // la comprobación de método de más abajo respondería 405 y la petición de verdad no llegaría a
  // salir del navegador.
  if (req.method === "OPTIONS") {
    applyCors(req, res);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", String(PREFLIGHT_MAX_AGE));
    res.status(204).send("");
    return;
  }

  // En TODAS las respuestas, incluidos los errores. Un 401 sin estas cabeceras el navegador no se lo
  // entrega a la app: vería un fallo de red en vez del «hay que conectar» que ese 401 significa.
  applyCors(req, res);

  const path = normalizePath(req.path);
  const handler = ROUTES[path];

  if (!handler) {
    sendError(res, 404, "not_found", `La ruta ${path} no existe en la función auth.`);
    return;
  }
  // Las tres mutan estado (abren, renuevan o cierran sesión): ninguna puede ser GET.
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    sendError(res, 405, "method_not_allowed", "Esta ruta solo acepta POST.");
    return;
  }

  try {
    await handler(req, res, isSecure(req));
  } catch (error) {
    // El último recinto: sin esto, un fallo inesperado devolvería el HTML de error de Cloud
    // Functions y el navegador lo intentaría parsear como JSON.
    logger.error("fallo no controlado en la función auth", error, {path});
    // Si el manejador ya empezó a responder, insistir lanzaría encima del fallo original y borraría
    // la única pista de qué pasó.
    if (!res.headersSent) {
      sendError(res, 500, "internal", "Ha fallado el servicio de sesión.");
    }
  }
}

/**
 * El origen que se autoriza para esta petición: el que venga.
 *
 * `null` cuando no viene `Origin` — una llamada de servidor a servidor, o un `curl`. Ahí no hay CORS
 * que aplicar: el navegador es quien impone esta política, y si no hay navegador no hay nada que
 * declarar.
 */
export function allowedOrigin(req: HttpRequest): string | null {
  const origin = req.headers.origin;
  return origin && origin.length > 0 ? origin : null;
}

function applyCors(req: HttpRequest, res: HttpResponse): void {
  const origin = allowedOrigin(req);
  if (!origin) {
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
}
