/**
 * Tests del enrutado y del CORS, a través de `route()`.
 *
 * Se prueba por la puerta de entrada y no por funciones internas: así se cubre de paso lo que ninguna
 * ruta implementa por su cuenta —el preflight, el 405, el 404 y que las cabeceras de CORS viajen
 * TAMBIÉN en los errores—, que es justo donde un despiste no se nota hasta que el navegador descarta
 * una respuesta sin decir por qué.
 *
 * `/exchange`, `/refresh` y `/logout` no se llegan a ejecutar aquí: hablan con Google y con Firestore, y
 * eso se ejercita desde el emulador y desde los E2E.
 */
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {allowedOrigin, route} from "./router";
import type {HttpRequest, HttpResponse} from "./http";

// La lista de orígenes se lee del entorno en cada petición, igual que en producción: sin ella la
// función no contestaría a nadie y todo lo de abajo fallaría por el mismo motivo.
process.env["ALLOWED_ORIGINS"] = "https://ejemplo.test,http://localhost:4200";

function request(method: string, path: string, origin?: string): HttpRequest {
  return {method, path, body: null, headers: origin ? {origin} : {}};
}

/** Una respuesta de mentira que solo recuerda lo que le hicieron. */
function spy() {
  const state = {
    headers: {} as Record<string, string>,
    statusCode: null as number | null,
    body: null as unknown,
  };
  const res: HttpResponse = {
    setHeader(name: string, value: string) {
      state.headers[name] = value;
      return undefined;
    },
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: unknown) {
      state.body = body;
      return undefined;
    },
    send(body: string) {
      state.body = body;
      return undefined;
    },
  };
  return {res, state};
}

describe("allowedOrigin", () => {
  it("devuelve los orígenes de la lista, uno a uno", () => {
    assert.equal(allowedOrigin(request("POST", "/exchange", "https://ejemplo.test")), "https://ejemplo.test");
    assert.equal(allowedOrigin(request("POST", "/exchange", "http://localhost:4200")), "http://localhost:4200");
  });

  it("null ante un origen ajeno: es lo que impide que otra web pida un token con la cookie del usuario", () => {
    assert.equal(allowedOrigin(request("POST", "/refresh", "https://web-ajena.test")), null);
  });

  it("null ante un origen que solo se le parece: la comparación es exacta", () => {
    assert.equal(allowedOrigin(request("POST", "/refresh", "https://ejemplo.test.evil.test")), null);
    assert.equal(allowedOrigin(request("POST", "/refresh", "https://ejemplo.test/")), null);
  });

  it("null sin Origin: no hay navegador imponiendo la política (curl, servidor a servidor)", () => {
    assert.equal(allowedOrigin(request("POST", "/exchange")), null);
  });
});

describe("route · origen no autorizado", () => {
  it("no declara CORS, así que su navegador descarta la respuesta", async () => {
    const {res, state} = spy();

    await route(request("POST", "/refresh", "https://web-ajena.test"), res);

    assert.equal(state.headers["Access-Control-Allow-Origin"], undefined);
    assert.equal(state.headers["Access-Control-Allow-Credentials"], undefined);
  });
});

describe("route · preflight", () => {
  it("contesta OPTIONS con 204 y las cabeceras que el navegador espera", async () => {
    const {res, state} = spy();
    await route(request("OPTIONS", "/exchange", "https://ejemplo.test"), res);

    assert.equal(state.statusCode, 204);
    assert.equal(state.headers["Access-Control-Allow-Origin"], "https://ejemplo.test");
    assert.equal(state.headers["Access-Control-Allow-Credentials"], "true");
    assert.equal(state.headers["Access-Control-Allow-Methods"], "POST, OPTIONS");
    assert.equal(state.headers["Access-Control-Allow-Headers"], "Content-Type, Authorization");
  });

  it("nunca usa el comodín: con credenciales la especificación lo prohíbe", async () => {
    const {res, state} = spy();
    await route(request("OPTIONS", "/exchange", "https://ejemplo.test"), res);
    assert.notEqual(state.headers["Access-Control-Allow-Origin"], "*");
  });
});

describe("route · rutas y métodos", () => {
  it("404 con cuerpo JSON ante una ruta que no existe", async () => {
    const {res, state} = spy();
    await route(request("POST", "/nada"), res);

    assert.equal(state.statusCode, 404);
    assert.deepEqual((state.body as {error: string}).error, "not_found");
  });

  it("405 y Allow ante un método que no es POST", async () => {
    const {res, state} = spy();
    await route(request("GET", "/refresh"), res);

    assert.equal(state.statusCode, 405);
    assert.equal(state.headers["Allow"], "POST, OPTIONS");
  });

  it("los errores TAMBIÉN llevan las cabeceras de CORS, o el navegador no los entrega a la app", async () => {
    const {res, state} = spy();
    await route(request("POST", "/nada", "https://ejemplo.test"), res);

    assert.equal(state.headers["Access-Control-Allow-Origin"], "https://ejemplo.test");
    assert.equal(state.headers["Access-Control-Allow-Credentials"], "true");
  });

  it("ninguna respuesta se cachea: hay CDN por delante y un token no puede compartirse", async () => {
    const {res, state} = spy();
    await route(request("POST", "/nada"), res);

    assert.equal(state.headers["Cache-Control"], "private, no-store, max-age=0");
    assert.match(state.headers["Vary"] ?? "", /Cookie/);
  });
});
