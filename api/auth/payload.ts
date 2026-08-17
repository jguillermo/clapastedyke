/**
 * La forma de la respuesta que ven `/auth/exchange` y `/auth/token`.
 *
 * Es el **lenguaje publicado** entre esta función y `BackendAuthenticator` en el navegador: los dos
 * lados lo declaran por su cuenta (el front no importa de `api/`), así que cambiar un campo aquí es
 * cambiar un contrato, no un detalle interno.
 *
 * Lo que NO lleva, y no es un olvido: el refresh token. Nunca sale de Firestore.
 */
export interface SessionPayload {
  account: {
    id: string;
    email: string;
    name: string;
    pictureUrl: string | null;
  };
  accessToken: string;
  /** Segundos de validez que declara Google. */
  expiresIn: number;
  /** Permisos concedidos, separados por espacios, tal cual los nombra Google. */
  scope: string;
}

export function sessionPayload(
  profile: { sub: string; email: string; name: string; picture: string | null },
  tokens: { accessToken: string; expiresIn: number },
  scope: string,
): SessionPayload {
  return {
    account: {
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      pictureUrl: profile.picture,
    },
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
    scope,
  };
}
