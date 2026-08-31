/**
 * El identificador con el que este navegador le pide al backend que renueve su sesión.
 *
 * ## Por qué existe, si ya hay una cookie
 *
 * El backend emite una cookie `HttpOnly` con este mismo valor, y esa es la vía preferida: el
 * JavaScript de la app no puede leerla, y un XSS tampoco. Pero la función vive en otro dominio que
 * la app, así que su cookie es **de terceros**, y Safari e iOS las bloquean aunque estén bien
 * formadas. En esos navegadores la cookie no llegaría nunca y la sesión no sobreviviría a una
 * recarga — que es exactamente el fallo que el backend viene a arreglar.
 *
 * Por eso el backend devuelve además el identificador en el cuerpo, la app lo guarda aquí, y lo
 * manda en `Authorization` cuando la cookie no viajó.
 *
 * ## Qué NO es
 *
 * **No es una credencial de Google.** No abre nada por sí mismo: solo le dice al backend qué sesión
 * renovar, y el backend decide si esa sesión sigue viva. El token de acceso de Google sigue viviendo
 * **solo en memoria** y durando una hora ({@link Credential}), y el permiso duradero no sale nunca
 * del servidor.
 *
 * Aun así es un identificador de sesión persistido y legible por la app, así que un XSS podría
 * llevárselo. Es el precio de que la sesión funcione en móvil, y se asume a sabiendas.
 */
export abstract class SessionTokenRepository {
  /** El identificador guardado, o `null` si este navegador no tiene sesión que reanudar. */
  abstract read(): Promise<string | null>;
  abstract save(token: string): Promise<void>;
  abstract clear(): Promise<void>;
}
