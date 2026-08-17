/**
 * Lo que se prueba aquí es el trato con Google, que es donde están los detalles que no se pueden
 * deducir leyendo: `redirect_uri: 'postmessage'`, `invalid_grant` como caso propio, y los dos
 * respaldos que evitan que un token perfectamente válido se descarte.
 */
import { after, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  DRIVE_FILE_PERMISSION,
  exchangeCode,
  GoogleOAuthError,
  grants,
  readProfile,
  refreshAccessToken,
} from './google-oauth';

const CLIENT = { clientId: 'cliente-123', clientSecret: 'secreto' };

/** El último cuerpo enviado a Google, ya parseado. */
let lastForm: URLSearchParams | null = null;

function stubGoogle(status: number, payload: unknown): void {
  mock.method(globalThis, 'fetch', (_url: string, init: { body: string }) => {
    lastForm = new URLSearchParams(init.body);
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(payload),
    } as Response);
  });
}

function idToken(claims: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  return `cabecera.${payload}.firma`;
}

beforeEach(() => {
  mock.restoreAll();
  lastForm = null;
});

after(() => mock.restoreAll());

describe('canje del código', () => {
  it('manda redirect_uri=postmessage y devuelve los tres tokens', async () => {
    stubGoogle(200, {
      access_token: 'at',
      refresh_token: 'rt',
      expires_in: 3599,
      scope: `openid email ${DRIVE_FILE_PERMISSION}`,
      id_token: idToken({ sub: '123', email: 'a@b.c', name: 'Ana' }),
    });

    const tokens = await exchangeCode('el-codigo', CLIENT);

    // Sin `postmessage` Google contesta `redirect_uri_mismatch`; es el fallo más habitual al montar
    // el flujo de código por ventana emergente, y no se deduce del mensaje.
    assert.equal(lastForm?.get('redirect_uri'), 'postmessage');
    assert.equal(lastForm?.get('grant_type'), 'authorization_code');
    assert.equal(lastForm?.get('code'), 'el-codigo');
    assert.equal(tokens.accessToken, 'at');
    assert.equal(tokens.refreshToken, 'rt');
    assert.equal(tokens.expiresIn, 3599);
  });

  it('un expires_in ausente no crea una credencial nacida caducada', async () => {
    stubGoogle(200, { access_token: 'at', scope: DRIVE_FILE_PERMISSION });

    const tokens = await exchangeCode('c', CLIENT);

    assert.equal(tokens.expiresIn, 3600);
  });

  it('traduce el error de Google conservando su código', async () => {
    stubGoogle(400, { error: 'invalid_client', error_description: 'no cuadra' });

    const error = await exchangeCode('c', CLIENT).then(
      () => null,
      (reason: unknown) => reason,
    );

    assert.ok(error instanceof GoogleOAuthError);
    assert.equal(error.code, 'invalid_client');
    assert.equal(error.isInvalidGrant, false);
  });
});

describe('refresco', () => {
  it('usa grant_type=refresh_token y no espera refresh token de vuelta', async () => {
    stubGoogle(200, { access_token: 'nuevo', expires_in: 3599, scope: DRIVE_FILE_PERMISSION });

    const tokens = await refreshAccessToken('rt', CLIENT);

    assert.equal(lastForm?.get('grant_type'), 'refresh_token');
    assert.equal(lastForm?.get('refresh_token'), 'rt');
    assert.equal(tokens.accessToken, 'nuevo');
    assert.equal(tokens.refreshToken, null);
  });

  it('reconoce invalid_grant como caso propio', async () => {
    stubGoogle(400, { error: 'invalid_grant', error_description: 'Token has been expired' });

    const error = await refreshAccessToken('rt', CLIENT).then(
      () => null,
      (reason: unknown) => reason,
    );

    // De esto depende que la sesión muerta se olvide en vez de reintentarse para siempre.
    assert.ok(error instanceof GoogleOAuthError);
    assert.equal(error.isInvalidGrant, true);
  });
});

describe('perfil del id_token', () => {
  it('lo lee sin necesitar la firma', () => {
    const profile = readProfile(
      idToken({ sub: '99', email: 'ana@ejemplo.com', name: 'Ana', picture: 'https://p' }),
    );

    assert.deepEqual(profile, {
      sub: '99',
      email: 'ana@ejemplo.com',
      name: 'Ana',
      picture: 'https://p',
    });
  });

  it('sin sub o sin correo no hay perfil', () => {
    assert.equal(readProfile(idToken({ sub: '99' })), null);
    assert.equal(readProfile(idToken({ email: 'a@b.c' })), null);
    assert.equal(readProfile(null), null);
    assert.equal(readProfile('esto-no-es-un-jwt'), null);
  });
});

describe('permisos', () => {
  it('exige el permiso completo, no un prefijo', () => {
    assert.equal(grants(`openid email ${DRIVE_FILE_PERMISSION}`, DRIVE_FILE_PERMISSION), true);
    assert.equal(grants('openid email', DRIVE_FILE_PERMISSION), false);
    assert.equal(grants('', DRIVE_FILE_PERMISSION), false);
  });
});
