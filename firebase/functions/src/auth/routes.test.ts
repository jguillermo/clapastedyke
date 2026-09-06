/**
 * Tests de las tres rutas: `/exchange`, `/refresh` y `/logout`.
 *
 * Son las que deciden qué pasa con la sesión de una persona, y hasta ahora eran las únicas del
 * fichero sin una sola prueba: `google.ts`, `http.ts`, `router.ts` y `sessions.ts` sí las tenían.
 * `router.test.ts` llega hasta la puerta —enrutado, CORS, 405, 404— y se para justo antes de
 * ejecutarlas.
 *
 * ## Qué se prueba aquí que no cubre ningún E2E
 *
 * Los E2E de `e2e/specs/account/` ejercitan el **contrato tal como lo ve la app**, contra un doble.
 * Lo que no pueden ver es lo que este servicio decide por dentro, y ahí están las reglas caras:
 *
 * - **Google no reemite el refresh token** cuando la concesión ya existía. Si al reconectar la misma
 *   cuenta se guardara `null` encima del que había, la sesión quedaría sin poder renovarse nunca —
 *   el fallo original, con otra ropa, y sin ningún síntoma hasta la siguiente recarga.
 * - **`invalid_grant` es lo único que borra la concesión.** Cualquier otro fallo de Google es
 *   pasajero y no puede tocar la sesión: tratarlo como una expulsión echaría al usuario por un 502.
 * - **`/logout` contesta 204 pase lo que pase.** Si Firestore no responde, la cookie ya está limpia y
 *   el navegador queda desconectado igual; devolver un error solo conseguiría que la pantalla dijera
 *   que sigue conectada cuando no lo está.
 *
 * ## Cómo se doblan las dos puertas de salida
 *
 * Estas rutas hablan con Google (red) y con Firestore. Se sustituyen **las funciones exportadas de
 * `./google` y `./sessions`**, escribiendo sobre el objeto de exportaciones del módulo. En un paquete
 * CommonJS —que es lo que compila este `tsconfig`— cada llamada se resuelve contra ese objeto en el
 * momento de hacerla, así que sustituir una propiedad cambia lo que ejecuta la ruta.
 *
 * Se eligió esto sobre `mock.module()` de `node:test` porque esa API sigue siendo **experimental** y
 * exige arrancar el runner con `--experimental-test-module-mocks`: no parece un buen cambio para el
 * único backend que se despliega a mano. La contrapartida está anotada: **el día que este paquete
 * pase a ESM, esto deja de funcionar** y habrá que cambiarlo por el mock de módulos (o por inyectar
 * los colaboradores en las rutas).
 *
 * Lo que **no** se dobla es lo que decide sin hablar con nadie: las cookies, `readSessionId`,
 * `grants` y `GoogleOAuthError` son los de verdad. Un doble ahí solo probaría el doble.
 */
import {afterEach, describe, it} from "node:test";
import assert from "node:assert/strict";
import * as google from "./google";
import * as sessions from "./sessions";
import {GoogleOAuthError} from "./google";
import {SESSION_COOKIE} from "./sessions";
import {handleExchange, handleLogout, handleRefresh} from "./routes";
import type {GoogleTokens} from "./google";
import type {HttpRequest, HttpResponse} from "./http";

// `oauthClient()` los exige antes de hacer nada; sin ellos toda ruta fallaría por el mismo motivo.
process.env["GOOGLE_OAUTH_CLIENT_ID"] = "test-client.apps.googleusercontent.com";
process.env["GOOGLE_OAUTH_CLIENT_SECRET"] = "test-secret";

const SUB = "google-sub-1";
const SID = "sid-1";

const PROFILE = {sub: SUB, email: "cocina@example.com", name: "Cocina", picture: null};

const GRANT = {
  sub: SUB,
  email: PROFILE.email,
  name: PROFILE.name,
  picture: null,
  refreshToken: "refresh-guardado",
  scope: `openid email profile ${google.DRIVE_FILE_PERMISSION}`,
};

function tokens(overrides: Partial<GoogleTokens> = {}): GoogleTokens {
  return {
    accessToken: "access-1",
    expiresIn: 3600,
    scope: `openid email profile ${google.DRIVE_FILE_PERMISSION}`,
    refreshToken: "refresh-nuevo",
    idToken: "id-token",
    ...overrides,
  };
}

// ─── Doblar las dos puertas de salida ────────────────────────────────────────────────────────────

/** Lo que hay que deshacer al terminar cada test. Ver la cabecera del fichero. */
const undo: Array<() => void> = [];

function stub(module: unknown, name: string, implementation: unknown): void {
  const holder = module as Record<string, unknown>;
  const original = holder[name];
  holder[name] = implementation;
  undo.push(() => {
    holder[name] = original;
  });
}

afterEach(() => {
  while (undo.length > 0) {
    undo.pop()!();
  }
});

/** Anota que la llamaron y con qué. Es lo que permite asertar sobre lo que NO se llamó. */
function record<T>(result?: T) {
  const calls: unknown[][] = [];
  const fn = (...args: unknown[]): T => {
    calls.push(args);
    return result as T;
  };
  return {fn, calls};
}

// ─── Petición y respuesta ────────────────────────────────────────────────────────────────────────

function request(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {method: "POST", path: "/refresh", body: null, headers: {}, ...overrides};
}

/** Con el `sid` en la cabecera, que es la vía por la que llega en Safari y en iOS. */
function withSession(path: string, sid = SID): HttpRequest {
  return request({path, headers: {authorization: `Bearer ${sid}`}});
}

function spy() {
  const state = {
    headers: {} as Record<string, string>,
    statusCode: null as number | null,
    body: null as unknown,
  };
  const res: HttpResponse = {
    setHeader(name, value) {
      state.headers[name] = value;
      return undefined;
    },
    status(code) {
      state.statusCode = code;
      return res;
    },
    json(body) {
      state.body = body;
      return undefined;
    },
    send(body) {
      state.body = body;
      return undefined;
    },
  };
  return {res, state};
}

function errorCode(body: unknown): string {
  return (body as {error?: string}).error ?? "";
}

function cookie(headers: Record<string, string>): string {
  return headers["Set-Cookie"] ?? "";
}

// ─── POST /exchange ──────────────────────────────────────────────────────────────────────────────

describe("handleExchange", () => {
  it("sin código: 400, y no se llama a Google", async () => {
    const exchange = record<Promise<GoogleTokens>>();
    stub(google, "exchangeCode", exchange.fn);

    const {res, state} = spy();
    await handleExchange(request({path: "/exchange", body: "{}"}), res, true);

    assert.equal(state.statusCode, 400);
    assert.equal(errorCode(state.body), "invalid_request");
    assert.equal(exchange.calls.length, 0);
  });

  it("Google rechaza el canje: 502, y no se abre ninguna sesión", async () => {
    stub(google, "exchangeCode", () =>
      Promise.reject(new GoogleOAuthError("invalid_grant", "no")),
    );
    const open = record<Promise<string>>();
    stub(sessions, "openSession", open.fn);

    const {res, state} = spy();
    await handleExchange(request({path: "/exchange", body: {code: "abc"}}), res, true);

    assert.equal(state.statusCode, 502);
    assert.equal(open.calls.length, 0);
  });

  it("el id_token no identifica a nadie: 502 no_profile", async () => {
    stub(google, "exchangeCode", () => Promise.resolve(tokens()));
    stub(google, "readProfile", () => null);

    const {res, state} = spy();
    await handleExchange(request({path: "/exchange", body: {code: "abc"}}), res, true);

    assert.equal(state.statusCode, 502);
    assert.equal(errorCode(state.body), "no_profile");
  });

  it("concesión sin permiso de Drive: 403, y NO se guarda nada", async () => {
    stub(google, "exchangeCode", () => Promise.resolve(tokens({scope: "openid email profile"})));
    stub(google, "readProfile", () => PROFILE);
    const open = record<Promise<string>>();
    stub(sessions, "openSession", open.fn);

    const {res, state} = spy();
    await handleExchange(request({path: "/exchange", body: {code: "abc"}}), res, true);

    assert.equal(state.statusCode, 403);
    assert.equal(errorCode(state.body), "missing_permission");
    assert.equal(
      open.calls.length,
      0,
      "una concesión que no alcanza la hoja no puede quedar guardada",
    );
  });

  /**
   * La regla más cara del fichero. Google entrega el refresh token en la **primera** autorización y
   * en las siguientes puede no repetirlo: si aquí se guardara ese `null`, la sesión se quedaría sin
   * poder renovarse y nadie se enteraría hasta la siguiente recarga.
   */
  it("Google no repite el refresh token: se conserva el que ya había", async () => {
    stub(google, "exchangeCode", () => Promise.resolve(tokens({refreshToken: null})));
    stub(google, "readProfile", () => PROFILE);
    stub(sessions, "storedRefreshToken", () => Promise.resolve("refresh-guardado"));
    const open = record(Promise.resolve(SID));
    stub(sessions, "openSession", open.fn);

    const {res, state} = spy();
    await handleExchange(request({path: "/exchange", body: {code: "abc"}}), res, true);

    assert.equal(state.statusCode, 200);
    assert.deepEqual(open.calls[0]?.[1], "refresh-guardado");
  });

  it("ni nuevo ni guardado: 409, para que la persona retire el acceso y vuelva a conceder", async () => {
    stub(google, "exchangeCode", () => Promise.resolve(tokens({refreshToken: null})));
    stub(google, "readProfile", () => PROFILE);
    stub(sessions, "storedRefreshToken", () => Promise.resolve(null));
    const open = record<Promise<string>>();
    stub(sessions, "openSession", open.fn);

    const {res, state} = spy();
    await handleExchange(request({path: "/exchange", body: {code: "abc"}}), res, true);

    assert.equal(state.statusCode, 409);
    assert.equal(errorCode(state.body), "no_refresh_token");
    assert.equal(open.calls.length, 0);
  });

  it("camino feliz: abre sesión, manda la cookie y devuelve el mismo sid en el cuerpo", async () => {
    stub(google, "exchangeCode", () => Promise.resolve(tokens()));
    stub(google, "readProfile", () => PROFILE);
    const open = record(Promise.resolve(SID));
    stub(sessions, "openSession", open.fn);

    const {res, state} = spy();
    await handleExchange(request({path: "/exchange", body: {code: "abc"}}), res, true);

    assert.equal(state.statusCode, 200);
    assert.equal(open.calls[0]?.[1], "refresh-nuevo");
    assert.ok(cookie(state.headers).startsWith(`${SESSION_COOKIE}=${SID};`));

    const body = state.body as {session_token: string; account: {sub: string}; scope: string};
    assert.equal(
      body.session_token,
      SID,
      "el respaldo de la cookie: sin él no hay sesión en Safari ni en iOS",
    );
    assert.equal(body.account.sub, SUB);
  });
});

// ─── POST /refresh ───────────────────────────────────────────────────────────────────────────────

describe("handleRefresh", () => {
  it("sin sid: 401 sin tocar Firestore — es lo que pasa en cada visita de quien nunca conectó", async () => {
    const read = record<Promise<unknown>>();
    stub(sessions, "readGrant", read.fn);

    const {res, state} = spy();
    await handleRefresh(request({path: "/refresh"}), res, true);

    assert.equal(state.statusCode, 401);
    assert.equal(errorCode(state.body), "no_session");
    assert.equal(read.calls.length, 0);
  });

  it("sid que ya no tiene concesión: 401 y la cookie se limpia", async () => {
    stub(sessions, "readGrant", () => Promise.resolve(null));

    const {res, state} = spy();
    await handleRefresh(withSession("/refresh"), res, true);

    assert.equal(state.statusCode, 401);
    assert.ok(cookie(state.headers).includes("Max-Age=0"));
  });

  it("invalid_grant: se olvida la concesión entera y se echa a este navegador", async () => {
    stub(sessions, "readGrant", () => Promise.resolve(GRANT));
    stub(google, "refreshAccessToken", () =>
      Promise.reject(new GoogleOAuthError("invalid_grant", "revocado")),
    );
    const forget = record(Promise.resolve());
    stub(sessions, "forgetGrant", forget.fn);

    const {res, state} = spy();
    await handleRefresh(withSession("/refresh"), res, true);

    assert.equal(state.statusCode, 401);
    assert.equal(errorCode(state.body), "revoked");
    assert.deepEqual(forget.calls, [[SUB]]);
    assert.ok(cookie(state.headers).includes("Max-Age=0"));
  });

  /** Lo contrario del anterior, y por eso está aquí: un 502 no puede echar a nadie. */
  it("otro fallo de Google: 502 y la sesión NO se toca", async () => {
    stub(sessions, "readGrant", () => Promise.resolve(GRANT));
    stub(google, "refreshAccessToken", () =>
      Promise.reject(new GoogleOAuthError("backend_error", "ups")),
    );
    const forget = record(Promise.resolve());
    stub(sessions, "forgetGrant", forget.fn);
    const close = record(Promise.resolve());
    stub(sessions, "closeSession", close.fn);

    const {res, state} = spy();
    await handleRefresh(withSession("/refresh"), res, true);

    assert.equal(state.statusCode, 502);
    assert.equal(forget.calls.length, 0, "un fallo pasajero no puede borrar la concesión");
    assert.equal(close.calls.length, 0);
    assert.equal(cookie(state.headers), "", "ni limpiar la cookie");
  });

  it("camino feliz: el sid no rota, la sesión se alarga y la cookie se reemite", async () => {
    stub(sessions, "readGrant", () => Promise.resolve(GRANT));
    stub(google, "refreshAccessToken", () => Promise.resolve(tokens({refreshToken: null})));
    const extend = record(Promise.resolve());
    stub(sessions, "extendSession", extend.fn);

    const {res, state} = spy();
    await handleRefresh(withSession("/refresh"), res, true);

    assert.equal(state.statusCode, 200);
    const body = state.body as {session_token: string; account: {sub: string}};
    assert.equal(body.session_token, SID, "es la misma sesión: el sid no cambia al renovar");
    assert.equal(body.account.sub, SUB);
    assert.deepEqual(extend.calls, [[SID]], "usarla es lo que la mantiene viva");
    assert.ok(cookie(state.headers).startsWith(`${SESSION_COOKIE}=${SID};`));
  });

  /**
   * Google repite el `scope` al refrescar, pero si algún día no lo hiciera vale el de la concesión:
   * los permisos no cambian al renovar. Sin este respaldo, un `scope` vacío haría que el navegador
   * descartara por «sin permiso de Drive» un token perfectamente válido.
   */
  it("si Google no repite el scope, se usa el de la concesión", async () => {
    stub(sessions, "readGrant", () => Promise.resolve(GRANT));
    stub(google, "refreshAccessToken", () => Promise.resolve(tokens({scope: ""})));
    stub(sessions, "extendSession", () => Promise.resolve());

    const {res, state} = spy();
    await handleRefresh(withSession("/refresh"), res, true);

    assert.equal((state.body as {scope: string}).scope, GRANT.scope);
  });

  it("que no se pueda alargar la sesión no estropea la respuesta: el token ya está emitido", async () => {
    stub(sessions, "readGrant", () => Promise.resolve(GRANT));
    stub(google, "refreshAccessToken", () => Promise.resolve(tokens()));
    stub(sessions, "extendSession", () => Promise.reject(new Error("Firestore no contesta")));

    const {res, state} = spy();
    await handleRefresh(withSession("/refresh"), res, true);

    assert.equal(state.statusCode, 200);
  });
});

// ─── POST /logout ────────────────────────────────────────────────────────────────────────────────

describe("handleLogout", () => {
  it("sin sid: 204 y cookie limpia, sin preguntarle nada a Firestore", async () => {
    const close = record(Promise.resolve());
    stub(sessions, "closeSession", close.fn);

    const {res, state} = spy();
    await handleLogout(request({path: "/logout"}), res, true);

    assert.equal(state.statusCode, 204);
    assert.equal(close.calls.length, 0);
    assert.ok(cookie(state.headers).includes("Max-Age=0"));
  });

  it("cierra SOLO la sesión de este navegador: la concesión y las demás sesiones se quedan", async () => {
    const close = record(Promise.resolve());
    stub(sessions, "closeSession", close.fn);
    const forget = record(Promise.resolve());
    stub(sessions, "forgetGrant", forget.fn);

    const {res, state} = spy();
    await handleLogout(withSession("/logout"), res, true);

    assert.equal(state.statusCode, 204);
    assert.deepEqual(close.calls, [[SID]]);
    assert.equal(forget.calls.length, 0, "cerrar sesión no retira la autorización");
  });

  it("si Firestore no contesta, 204 igual: el navegador queda desconectado y la cookie ya se fue", async () => {
    stub(sessions, "closeSession", () => Promise.reject(new Error("Firestore no contesta")));

    const {res, state} = spy();
    await handleLogout(withSession("/logout"), res, true);

    assert.equal(state.statusCode, 204);
    assert.ok(cookie(state.headers).includes("Max-Age=0"));
  });
});
