/**
 * Tests de las piezas puras del transporte HTTP: normalizar la ruta, leer el cuerpo y decidir si la
 * petición llegó por HTTPS (que es lo que fija los atributos de la cookie).
 */
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {isSecure, jsonBody, normalizePath, requiredString} from "./http";
import type {HttpRequest} from "./http";

function request(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {method: "POST", path: "/exchange", body: null, headers: {}, ...overrides};
}

describe("normalizePath", () => {
  it("deja la ruta como está", () => {
    assert.equal(normalizePath("/exchange"), "/exchange");
  });

  it("descarta la query", () => {
    assert.equal(normalizePath("/exchange?t=1"), "/exchange");
  });

  it("la barra final no crea otra ruta", () => {
    assert.equal(normalizePath("/exchange/"), "/exchange");
    assert.equal(normalizePath("/"), "/");
  });

  it("una ruta sin barra inicial la gana", () => {
    assert.equal(normalizePath("exchange"), "/exchange");
  });
});

describe("jsonBody", () => {
  it("acepta el objeto que Firebase ya parseó", () => {
    assert.deepEqual(jsonBody({code: "abc"}), {code: "abc"});
  });

  it("parsea el cuerpo si llegó como texto", () => {
    assert.deepEqual(jsonBody("{\"code\":\"abc\"}"), {code: "abc"});
  });

  it("devuelve null ante lo que no es un objeto", () => {
    assert.equal(jsonBody("no es json"), null);
    assert.equal(jsonBody("[1,2]"), null);
    assert.equal(jsonBody(null), null);
    assert.equal(jsonBody(42), null);
  });
});

describe("requiredString", () => {
  it("recorta y devuelve el valor", () => {
    assert.equal(requiredString({code: "  abc  "}, "code"), "abc");
  });

  it("devuelve null si falta, está en blanco o no es texto", () => {
    assert.equal(requiredString({}, "code"), null);
    assert.equal(requiredString({code: "   "}, "code"), null);
    assert.equal(requiredString({code: 7}, "code"), null);
    assert.equal(requiredString(null, "code"), null);
  });
});

describe("isSecure", () => {
  it("cree a x-forwarded-proto por encima del protocolo del socket", () => {
    // Es el caso real: detrás de Google la petición llega a la función por http.
    assert.equal(isSecure(request({protocol: "http", headers: {"x-forwarded-proto": "https"}})), true);
  });

  it("se queda con el primer valor de la lista", () => {
    assert.equal(
      isSecure(request({headers: {"x-forwarded-proto": "https, http"}})),
      true,
    );
    assert.equal(isSecure(request({headers: {"x-forwarded-proto": "http, https"}})), false);
  });

  it("sin cabecera, el protocolo del socket (el emulador en local)", () => {
    assert.equal(isSecure(request({protocol: "http"})), false);
    assert.equal(isSecure(request({protocol: "https"})), true);
    assert.equal(isSecure(request()), false);
  });
});
