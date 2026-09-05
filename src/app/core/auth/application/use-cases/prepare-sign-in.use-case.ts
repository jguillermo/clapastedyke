import { inject, Injectable } from '@angular/core';
import { Logger } from '@core/_common/logger/logger';
import { UseCase } from '@core/_common/use-case';
import { Authenticator } from '../../domain/services/authenticator';

/**
 * Deja al proveedor listo para que conectar salga del clic sin esperas.
 *
 * ## Por qué es un caso de uso y no una llamada suelta
 *
 * Lo llama la pantalla de cuenta al montarse, y una feature solo puede inyectar casos de uso: el
 * detalle de qué hay que adelantar —descargar el SDK de Google, hoy— vive en `infrastructure/` y no
 * puede asomar a la vista. Cambiar de proveedor no debe tocar la pantalla.
 *
 * ## Por qué al montar la pantalla y no al arrancar la app
 *
 * Quien abre `/cuenta` es exactamente quien va a pulsar «Conectar». Adelantarlo en el arranque haría
 * que **todo el mundo descargara el script de Google**, incluido quien nunca conecta ninguna cuenta,
 * y retrasaría el arranque de un juego por algo que quizá no se use nunca.
 *
 * No hace nada visible y no puede fallar: es un adelanto. Si no sale, conectar lo hará por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class PrepareSignIn extends UseCase<void, void> {
  private readonly authenticator = inject(Authenticator);
  private readonly log = inject(Logger).scoped('auth/prepare-sign-in');

  async execute(): Promise<void> {
    this.log.debug('adelantando la carga del proveedor');
    this.authenticator.prepare();
  }
}
