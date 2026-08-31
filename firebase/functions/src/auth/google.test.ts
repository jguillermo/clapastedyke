/**
 * Tests de las piezas de decisión del diálogo con Google.
 *
 * No se prueba la red. Lo que importa aquí es que `invalid_grant` se reconozca como tal —es el único
 * fallo cuya reacción es olvidar la concesión en vez de reintentar—, que la comprobación del permiso
 * de Drive no se deje engañar por un prefijo, y que un `id_token` sin identidad NO produzca perfil:
 * aceptarlo abriría una sesión bajo una clave vacía en Firestore.
 */
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {DRIVE_FILE_PERMISSION, GoogleOAuthError, grants, readProfile} from "./google";

/** Un `id_token` de mentira: solo importa el segmento del medio, que es el que se lee. */
function idToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `cabecera.${body}.firma`;
}

describe("readProfile", () => {
  it("lee el perfil completo", () => {
    const profile = readProfile(
      idToken({sub: "108", email: "a@b.test", name: "Ana", picture: "https://x.test/a.png"}),
    );
    assert.deepEqual(profile, {
      sub: "108",
      email: "a@b.test",
      name: "Ana",
      picture: "https://x.test/a.png",
    });
  });

  it("tolera que falten nombre y foto: no son obligatorios", () => {
    assert.deepEqual(readProfile(idToken({sub: "108", email: "a@b.test"})), {
      sub: "108",
      email: "a@b.test",
      name: "",
      picture: null,
    });
  });

  it("null sin sub o sin email: sin identidad no hay sesión que abrir", () => {
    assert.equal(readProfile(idToken({email: "a@b.test"})), null);
    assert.equal(readProfile(idToken({sub: "108"})), null);
    assert.equal(readProfile(idToken({sub: "", email: "a@b.test"})), null);
  });

  it("null ante un token ausente o ilegible", () => {
    assert.equal(readProfile(null), null);
    assert.equal(readProfile("no-es-un-jwt"), null);
    assert.equal(readProfile("a.no-base64-valido!.c"), null);
  });

  it("ignora campos con el tipo equivocado en vez de propagarlos", () => {
    assert.deepEqual(readProfile(idToken({sub: "108", email: "a@b.test", name: 42, picture: {}})), {
      sub: "108",
      email: "a@b.test",
      name: "",
      picture: null,
    });
  });
});

describe("GoogleOAuthError", () => {
  it("reconoce invalid_grant, que es el único que se trata distinto", () => {
    assert.equal(new GoogleOAuthError("invalid_grant", "").isInvalidGrant, true);
    assert.equal(new GoogleOAuthError("invalid_client", "").isInvalidGrant, false);
    assert.equal(new GoogleOAuthError("network", "").isInvalidGrant, false);
  });

  it("conserva la causa para que la traza no se pierda", () => {
    const cause = new Error("socket cerrado");
    const error = new GoogleOAuthError("network", "no se pudo contactar", {cause});
    assert.equal(error.cause, cause);
    assert.equal(error.name, "GoogleOAuthError");
  });
});

describe("grants", () => {
  it("encuentra el permiso en la lista separada por espacios", () => {
    const scope = `openid email profile ${DRIVE_FILE_PERMISSION}`;
    assert.equal(grants(scope, DRIVE_FILE_PERMISSION), true);
  });

  it("false cuando el usuario no marcó la casilla de Drive", () => {
    assert.equal(grants("openid email profile", DRIVE_FILE_PERMISSION), false);
    assert.equal(grants("", DRIVE_FILE_PERMISSION), false);
  });

  it("no acepta un permiso que solo sea prefijo de otro", () => {
    // `drive.file` NO se concede porque haya `drive.file.readonly`: son alcances distintos.
    assert.equal(grants(`${DRIVE_FILE_PERMISSION}.readonly`, DRIVE_FILE_PERMISSION), false);
  });
});
