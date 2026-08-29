/**
 * El acceso a Firestore de la función `auth`.
 *
 * Se inicializa **una sola vez por instancia** y de forma perezosa: mientras nadie toque Firestore no
 * se paga el arranque del Admin SDK. `initializeApp()` sin argumentos toma las credenciales del
 * entorno de ejecución (y las del emulador cuando corre en local), así que no hay ninguna clave que
 * custodiar aquí.
 *
 * Las reglas de seguridad **deniegan todo**: a estas colecciones solo llega el Admin SDK, que se las
 * salta por diseño. Ver `deploy/firestore.rules`.
 *
 * > **Por qué está aquí y no en `api/_common/`.** Importa `firebase-admin`, y `_common/` vive fuera
 * > del directorio de cualquier función: desde allí TypeScript no encuentra
 * > `api/auth/node_modules` (`TS2307`), aunque en ejecución sí funcionara. La regla que sale de eso
 * > —`_common/` solo con módulos nativos de Node— está explicada en `api/_common/http.ts`. Si algún
 * > día otra función necesita Firestore, se copia este fichero: son diez líneas, y compartirlo
 * > obligaría a todas a declarar el SDK.
 */
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let cached: Firestore | null = null;

export function firestore(): Firestore {
  if (cached) {
    return cached;
  }
  if (getApps().length === 0) {
    initializeApp();
  }
  cached = getFirestore();
  return cached;
}
