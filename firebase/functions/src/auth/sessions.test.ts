/**
 * Tests de la cookie de sesión y de las dos vías por las que llega el `sid`.
 *
 * Firestore no se dobla: lo que se prueba aquí es lo que decide algo sin hablar con nadie.
 *
 * Lo que se protege aquí es la regla que hace que la sesión sobreviva en Safari: si la cookie no
 * llega, el `sid` tiene que salir de `Authorization`.
 */
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {
  clearedSessionCookie,
  readBearer,
  readCookie,
  readSessionId,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  sessionCookie,
} from "./sessions";
import type {HttpRequest} from "./http";

function request(headers: HttpRequest["headers"]): HttpRequest {
  return {method: "POST", path: "/refresh", body: null, headers};
}

describe("sessionCookie", () => {
  it("sobre https: SameSite=None y Secure, porque es una cookie de terceros", () => {
    const cookie = sessionCookie("sid-1", true);
    assert.match(cookie, /^__session=sid-1;/);
    assert.ok(cookie.includes("SameSite=None; Secure"));
    assert.ok(cookie.includes("HttpOnly"));
    assert.ok(cookie.includes("Path=/"));
    assert.ok(cookie.includes(`Max-Age=${SESSION_MAX_AGE_SECONDS}`));
  });

  it("sobre http cae a Lax SIN Secure: el emulador no podría guardarla si no", () => {
    const cookie = sessionCookie("sid-1", false);
    assert.ok(cookie.includes("SameSite=Lax"));
    assert.ok(!cookie.includes("Secure"));
  });

  it("escapa el valor", () => {
    assert.ok(sessionCookie("a b/c", true).startsWith("__session=a%20b%2Fc;"));
  });

  it("seis meses", () => {
    assert.equal(SESSION_MAX_AGE_SECONDS, 180 * 24 * 60 * 60);
  });
});

describe("clearedSessionCookie", () => {
  it("es la misma cookie con Max-Age=0, que es la única forma de borrarla", () => {
    const cookie = clearedSessionCookie(true);
    assert.ok(cookie.startsWith("__session=;"));
    assert.ok(cookie.includes("Max-Age=0"));
    assert.ok(cookie.includes("SameSite=None; Secure"));
  });
});

describe("readCookie", () => {
  it("encuentra la cookie entre varias", () => {
    assert.equal(readCookie("a=1; __session=sid-9; b=2", SESSION_COOKIE), "sid-9");
  });

  it("desescapa el valor", () => {
    assert.equal(readCookie("__session=a%20b", SESSION_COOKIE), "a b");
  });

  it("null si no está, está vacía o no hay cabecera", () => {
    assert.equal(readCookie("a=1", SESSION_COOKIE), null);
    assert.equal(readCookie("__session=", SESSION_COOKIE), null);
    assert.equal(readCookie(undefined, SESSION_COOKIE), null);
  });

  it("no confunde una cookie cuyo nombre contiene al buscado", () => {
    assert.equal(readCookie("x__session=otro", SESSION_COOKIE), null);
  });
});

describe("readBearer", () => {
  it("lee el token, sin distinguir mayúsculas en el esquema", () => {
    assert.equal(readBearer("Bearer sid-9"), "sid-9");
    assert.equal(readBearer("bearer sid-9"), "sid-9");
  });

  it("null ante otro esquema, sin token, o sin cabecera", () => {
    assert.equal(readBearer("Basic sid-9"), null);
    assert.equal(readBearer("Bearer"), null);
    assert.equal(readBearer("Bearer   "), null);
    assert.equal(readBearer(undefined), null);
  });
});

describe("readSessionId", () => {
  it("prefiere la cookie", () => {
    assert.equal(
      readSessionId(request({cookie: "__session=de-cookie", authorization: "Bearer de-cabecera"})),
      "de-cookie",
    );
  });

  it("cae a la cabecera cuando el navegador bloqueó la cookie de terceros (Safari)", () => {
    assert.equal(readSessionId(request({authorization: "Bearer de-cabecera"})), "de-cabecera");
  });

  it("null cuando no llega ninguna de las dos: es quien nunca ha conectado", () => {
    assert.equal(readSessionId(request({})), null);
  });
});
