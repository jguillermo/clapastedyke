/**
 * El router y la cookie: dos piezas diminutas de las que depende que la sesión funcione **igual**
 * detrás de Firebase Hosting y detrás del proxy de `ng serve`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { jsonBody, normalizePath, requiredString } from './http';
import { clearedSessionCookie, readCookie, sessionCookie, SESSION_COOKIE } from './cookies';

describe('normalizePath', () => {
  it('acepta la ruta completa que entrega el rewrite de Hosting', () => {
    assert.equal(normalizePath('/api/auth/exchange', 'auth'), '/exchange');
    assert.equal(normalizePath('/api/auth/sign-out', 'auth'), '/sign-out');
  });

  it('acepta la ruta corta que entrega el proxy de ng serve', () => {
    assert.equal(normalizePath('/exchange', 'auth'), '/exchange');
  });

  it('las dos formas caen en la misma ruta, que es todo el objetivo', () => {
    assert.equal(normalizePath('/api/auth/token', 'auth'), normalizePath('/token', 'auth'));
  });

  it('tolera la barra final y la cadena de consulta', () => {
    assert.equal(normalizePath('/api/auth/token/', 'auth'), '/token');
    assert.equal(normalizePath('/token?x=1', 'auth'), '/token');
  });

  it('no confunde otra función con el prefijo de esta', () => {
    // Si `auth` se tragara `/api/authors/...` responderÍa 404 en la ruta equivocada.
    assert.equal(normalizePath('/api/authors/lista', 'auth'), '/api/authors/lista');
  });

  it('la raíz de la función se queda en la raíz', () => {
    assert.equal(normalizePath('/api/auth', 'auth'), '/');
    assert.equal(normalizePath('/', 'auth'), '/');
  });
});

describe('cuerpo de la petición', () => {
  it('acepta el objeto ya parseado y también el texto', () => {
    assert.deepEqual(jsonBody({ code: 'x' }), { code: 'x' });
    assert.deepEqual(jsonBody('{"code":"x"}'), { code: 'x' });
  });

  it('lo que no es un objeto no es un cuerpo', () => {
    assert.equal(jsonBody('roto{'), null);
    assert.equal(jsonBody(['a']), null);
    assert.equal(jsonBody(null), null);
  });

  it('requiredString rechaza vacíos y espacios', () => {
    assert.equal(requiredString({ code: '  abc  ' }, 'code'), 'abc');
    assert.equal(requiredString({ code: '   ' }, 'code'), null);
    assert.equal(requiredString({ code: 7 }, 'code'), null);
    assert.equal(requiredString(null, 'code'), null);
  });
});

describe('cookie de sesión', () => {
  it('se llama __session porque es la única que Hosting deja pasar', () => {
    assert.equal(SESSION_COOKIE, '__session');
  });

  it('la emite HttpOnly y SameSite=Lax, con Secure solo si procede', () => {
    const secure = sessionCookie('sid-1', true);
    assert.match(secure, /^__session=sid-1;/);
    assert.match(secure, /HttpOnly/);
    assert.match(secure, /SameSite=Lax/);
    assert.match(secure, /Secure/);

    // Sin `Secure` en local: Safari no guarda cookies seguras servidas por http.
    assert.doesNotMatch(sessionCookie('sid-1', false), /Secure/);
  });

  it('borrarla es emitirla con Max-Age=0', () => {
    assert.match(clearedSessionCookie(true), /^__session=; .*Max-Age=0/);
  });

  it('la lee de entre las demás cookies', () => {
    assert.equal(readCookie('a=1; __session=abc; b=2', SESSION_COOKIE), 'abc');
    assert.equal(readCookie('__session=abc', SESSION_COOKIE), 'abc');
    assert.equal(readCookie('a=1', SESSION_COOKIE), null);
    assert.equal(readCookie('__session=', SESSION_COOKIE), null);
    assert.equal(readCookie(undefined, SESSION_COOKIE), null);
  });

  it('no confunde una cookie cuyo nombre acaba igual', () => {
    assert.equal(readCookie('x__session=otro', SESSION_COOKIE), null);
  });
});
