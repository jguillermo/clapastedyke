/**
 * Transporte, configuración y forma de las respuestas.
 *
 * No hay Express aquí a propósito: la función despacha tres rutas, y un router de verdad sería más
 * código que las rutas. Los tipos de petición y respuesta se declaran estructuralmente en vez de
 * importarse de `express`: solo se usan cuatro métodos, y los de verdad los satisfacen.
 */

/** Lo justo que estas utilidades necesitan de una respuesta HTTP. */
export interface HttpResponse {
  setHeader(name: string, value: string): unknown;
  status(code: number): HttpResponse;
  json(body: unknown): unknown;
  send(body: string): unknown;
  /** Si la respuesta ya empezó a viajar. Lo consulta el último recinto para no responder dos veces. */
  readonly headersSent?: boolean;
}

/** Lo justo que un manejador necesita de una petición. */
export interface HttpRequest {
  method: string;
  path: string;
  body: unknown;
  protocol?: string;
  headers: {
    cookie?: string | undefined;
    origin?: string | undefined;
    authorization?: string | undefined;
    "x-forwarded-proto"?: string | undefined;
  };
}

// ─── Configuración ───────────────────────────────────────────────────────────────────────────────

/**
 * Las dos mitades del cliente de OAuth de Google, del `.env` de esta carpeta.
 *
 * Ese fichero **no se versiona** (lo ignora `firebase/.gitignore`) y lleva los valores de verdad;
 * `.env.example` documenta las claves. Consecuencia: solo puede desplegar quien lo tenga en su
 * máquina. Se llama `.env` sin sufijo de proyecto a propósito — Firebase lo carga para cualquier
 * `--project`, así que el mismo código sirve para todos los ambientes.
 *
 * **No es Secret Manager** porque `defineSecret` metería dos APIs más de Google (Secret Manager y
 * Service Usage), con sus permisos y sus 403, en el camino de publicar. El coste que se acepta:
 * la variable la ve cualquiera con permiso de lectura sobre la función en la consola de Cloud.
 */
export interface OAuthClient {
  clientId: string;
  clientSecret: string;
}

/**
 * Se lee **dentro del manejador**, nunca al cargar el módulo: en un arranque en frío el entorno
 * puede no estar poblado todavía, y una constante de módulo se quedaría con la cadena vacía para
 * toda la vida del contenedor.
 */
export function oauthClient(): OAuthClient {
  const clientId = (process.env["GOOGLE_OAUTH_CLIENT_ID"] ?? "").trim();
  const clientSecret = (process.env["GOOGLE_OAUTH_CLIENT_SECRET"] ?? "").trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "La función auth no está configurada: faltan GOOGLE_OAUTH_CLIENT_ID o " +
        "GOOGLE_OAUTH_CLIENT_SECRET en firebase/functions/.env. Ver su README.md.",
    );
  }
  return {clientId, clientSecret};
}

/**
 * Los orígenes a los que esta función contesta, de `ALLOWED_ORIGINS` en el mismo `.env`.
 *
 * ## Por qué hace falta una lista
 *
 * Esta función responde con `Access-Control-Allow-Credentials: true`, así que el navegador manda la
 * cookie de sesión en peticiones de origen cruzado. Reflejando cualquier origen —como se hacía antes—
 * **cualquier web que visitara el usuario podía hacer `POST /refresh` desde su navegador y recibir un
 * token de acceso a su Drive**. La lista es lo único que lo impide: con `Allow-Credentials` la
 * especificación prohíbe el comodín, así que hay que nombrar los orígenes uno a uno.
 *
 * ## Vacía significa «no contestar a nadie»
 *
 * Es la opción segura de las dos, y falla de forma visible: la app no puede reanudar sesión y la
 * función deja dicho en su registro qué origen rechazó. Lo contrario —abrir cuando no está
 * configurada— convertiría un despliegue a medias en el agujero que esto viene a cerrar.
 *
 * Formato: orígenes separados por comas, con esquema y sin barra final.
 * `https://mi-app.web.app,http://localhost:4200`
 */
export function allowedOrigins(): ReadonlySet<string> {
  const configured = process.env["ALLOWED_ORIGINS"] ?? "";
  return new Set(
    configured
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  );
}

// ─── La respuesta que ve el navegador ────────────────────────────────────────────────────────────

/**
 * El **lenguaje publicado** entre esta función y `BackendAuthenticator` en el navegador: los dos
 * lados lo declaran por su cuenta (el front no importa de `firebase/`), así que cambiar un campo
 * aquí es cambiar un contrato, no un detalle interno.
 *
 * Los nombres son los de OAuth para que cualquiera que haya visto una respuesta de token la
 * reconozca. Lo que NO lleva, y no es un olvido: **el refresh token**. Nunca sale de Firestore, y
 * de todas formas al navegador no le serviría — renovar exige el `client_secret`.
 */
export interface SessionPayload {
  access_token: string;
  /** Segundos de validez que declara Google. */
  expires_in: number;
  /** Permisos concedidos, separados por espacios, tal cual los nombra Google. */
  scope: string;
  token_type: "Bearer";
  /**
   * El mismo identificador que va en la cookie `__session`, para los navegadores que la bloquean por
   * ser de terceros (Safari, iOS). La app lo guarda y lo manda en `Authorization`.
   */
  session_token: string;
  account: {
    /** El `sub` de Google: estable para siempre y único por cuenta. */
    sub: string;
    email: string;
    name: string;
    picture: string | null;
  };
}

export function sessionPayload(
  profile: {sub: string; email: string; name: string; picture: string | null},
  tokens: {accessToken: string; expiresIn: number},
  scope: string,
  sessionToken: string,
): SessionPayload {
  return {
    access_token: tokens.accessToken,
    expires_in: tokens.expiresIn,
    scope,
    token_type: "Bearer",
    session_token: sessionToken,
    account: {
      sub: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    },
  };
}

/** Lo que viaja en el cuerpo de un error. El cliente distingue por `error`, NUNCA por el texto. */
export interface ApiError {
  error: string;
  message: string;
}

// ─── Responder ───────────────────────────────────────────────────────────────────────────────────

/**
 * **Ninguna respuesta de esta función se cachea, nunca.**
 *
 * No es paranoia: una respuesta de `/refresh` cacheada por cualquier intermediario serviría el token
 * de una persona a la siguiente. `private` lo prohíbe a los intermediarios y `no-store` también al
 * navegador. El `Vary` declara de qué depende, para que nada crea que es igual para todo el mundo.
 */
export function noStore(res: HttpResponse): void {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "Origin, Cookie, Authorization");
}

export function sendJson(res: HttpResponse, status: number, payload: unknown): void {
  noStore(res);
  res.status(status).json(payload);
}

export function sendNoContent(res: HttpResponse): void {
  noStore(res);
  res.status(204).send("");
}

export function sendError(res: HttpResponse, status: number, error: string, message: string): void {
  sendJson(res, status, {error, message} satisfies ApiError);
}

// ─── Leer la petición ────────────────────────────────────────────────────────────────────────────

/** La ruta, sin query y sin barra final: `/exchange?t=1` y `/exchange/` son la misma. */
export function normalizePath(rawPath: string): string {
  let path = (rawPath.split("?")[0] ?? "").trim();
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/** El cuerpo como objeto, o `null` si no lo es. Firebase ya lo parsea cuando llega como JSON. */
export function jsonBody(body: unknown): Record<string, unknown> | null {
  if (typeof body === "string") {
    try {
      const parsed: unknown = JSON.parse(body);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isRecord(body) ? body : null;
}

/** Un campo de texto no vacío del cuerpo, ya recortado, o `null`. */
export function requiredString(body: Record<string, unknown> | null, field: string): string | null {
  const value = body?.[field];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * ¿La petición llegó por HTTPS?
 *
 * Detrás de cualquier proxy de Google la petición llega a la función por HTTP: lo que lo delata es
 * `x-forwarded-proto`. En el emulador, sobre `http://localhost`, no hay ninguno de los dos y la
 * respuesta es `false` — que es lo que permite emitir la cookie sin `Secure` y poder probar el ciclo
 * entero en local.
 */
export function isSecure(req: HttpRequest): boolean {
  const forwarded = req.headers["x-forwarded-proto"];
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() === "https";
  }
  return req.protocol === "https";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
