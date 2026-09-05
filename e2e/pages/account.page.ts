import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object de `features/account` (`app-account`, ruta `/cuenta`): conectar la cuenta de Google y
 * ver el estado de la sincronización con la hoja.
 *
 * Dos tarjetas: **Cuenta** (conectar / cerrar sesión, con la lista de pasos de la conexión) y
 * **Sincronización** (rótulo de estado, última vez, cambios pendientes, enlace a la hoja, y los botones
 * de comprobar y sincronizar).
 *
 * Todas las acciones se localizan con `exact: true`. No es cosmético: bajo esta misma raíz se pintan
 * mensajes con el texto de los propios botones («pulsa Reintentar»), y `getByRole` coincide por
 * subcadena.
 */
export class AccountPage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.locator('app-account');

  readonly connect = this.root.getByRole('button', { name: 'Conectar con Google', exact: true });
  /** Pregunta; no cierra nada por sí solo. Quien cierra es {@link confirmDisconnect}. */
  readonly disconnect = this.root.getByRole('button', { name: 'Cerrar sesión', exact: true });
  /**
   * Confirma el cierre de sesión. Su rótulo es distinto del que pregunta a propósito (ver la vista),
   * así que `exact: true` los mantiene separados aunque uno contenga al otro por subcadena.
   */
  readonly confirmDisconnect = this.root.getByRole('button', {
    name: 'Sí, cerrar sesión',
    exact: true,
  });
  readonly cancelDisconnect = this.root.getByRole('button', { name: 'Cancelar', exact: true });

  /**
   * El aviso de lo que se pierde al cerrar sesión (`migo-alert variant="warning"` → `role="alert"`).
   * Aparece solo mientras se está preguntando.
   */
  readonly signOutWarning = this.root
    .getByRole('alert')
    .filter({ hasText: 'Se borrará todo lo de este dispositivo' });
  readonly retry = this.root.getByRole('button', { name: 'Reintentar', exact: true });
  readonly recreate = this.root.getByRole('button', { name: 'Crear una hoja nueva', exact: true });
  readonly check = this.root.getByRole('button', { name: 'Comprobar la hoja', exact: true });
  readonly syncAll = this.root.getByRole('button', { name: 'Sincronizar todo', exact: true });

  /** Lista de pasos de la conexión. Cada paso lleva su estado en un `sr-only` («— Hecho»). */
  readonly progress = this.root.getByRole('list', { name: 'Progreso de la conexión' });
  readonly steps = this.progress.getByRole('listitem');

  /** Aviso de éxito de la conexión (`migo-alert variant="success"` → `role="status"`). */
  readonly ready = this.root.getByRole('status').filter({ hasText: 'Conexión lista' });

  /** Resumen de «Comprobar la hoja» (`variant="info"` → `role="status"`). */
  readonly checkSummary = this.root
    .getByRole('status')
    .filter({ hasText: 'Comprobación de la hoja' });

  /** Cualquier aviso de error o degradación (`variant="error"`/`"warning"` → `role="alert"`). */
  readonly problems = this.root.getByRole('alert');

  /** Rótulo del estado de la sincronización («Al día», «Sincronizando…», «Error», «Reconectar»). */
  readonly statusLabel = this.root.locator('migo-badge');

  readonly sheetLink = this.root.getByRole('link', {
    name: 'Abrir la hoja en Google Sheets',
  });

  /** Subtítulo de la tarjeta de cuenta: dice si está conectada. */
  readonly accountSummary = this.root.locator('migo-card-subtitle').first();

  /**
   * Nombre visible de la cuenta conectada, tal como lo pinta la tarjeta.
   *
   * Se comprueba por el **nombre** y no por el correo a propósito: el correo aparece dos veces en la
   * vista —en la tarjeta y como detalle del primer paso de la conexión, que devuelve precisamente el
   * correo—, así que un `getByText(correo)` resuelve a dos elementos. El nombre solo está en la tarjeta.
   */
  connectedAs(displayName: string): Locator {
    return this.root.getByText(displayName, { exact: true });
  }

  /** Vuelve a `/home` **sin recargar** (es un `routerLink`), para no pagar otro arranque. */
  readonly backToKitchen = this.root.getByRole('link', { name: 'Volver a la cocina' });

  /**
   * Recarga el documento y espera a que la vista vuelva a estar montada.
   *
   * Es el gesto que prueba de verdad la reanudación: la credencial vive solo en memoria, así que una
   * recarga la borra y obliga a la app a recuperar la sesión contra el servicio.
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await expect(this.root).toBeVisible();
  }

  /** Valor de un dato de la lista de definición de la tarjeta de sincronización. */
  private field(term: string): Locator {
    return this.root.locator('dl > div').filter({ hasText: term }).locator('dd');
  }

  readonly pending = this.field('Cambios pendientes');
  readonly lastSynced = this.field('Última sincronización');

  /**
   * `/#/cuenta`, con hash: la app enruta por fragmento (`withHashLocation`), así que el servidor solo
   * ve `/`. Sin el `#` esto pediría al servidor una ruta que no existe y acabaría en la portada.
   */
  async goto(): Promise<void> {
    await this.page.goto('/#/cuenta');
    await expect(this.root).toBeVisible();
  }

  /**
   * Conecta la cuenta y espera a que los **cuatro** pasos hayan terminado.
   *
   * Se espera por el aviso de «Conexión lista» y no por el último paso: es el único estado que
   * significa que la ida y vuelta funcionó **y** el recetario está arriba. El plazo es amplio porque
   * son cuatro llamadas encadenadas contra el doble, incluida la creación de la hoja.
   */
  async connectAndWait(): Promise<void> {
    await this.connect.click();
    await expect(this.ready).toBeVisible({ timeout: 30_000 });
    await expect(this.steps).toHaveCount(4);
  }

  /**
   * Cierra la sesión de verdad: pregunta, confirma y espera al **rearranque**.
   *
   * Cerrar sesión borra todo el almacenamiento local, así que la app recarga el documento para
   * volver a sembrar y no quedarse hablando de datos que ya no existen. Por eso no basta con esperar
   * al botón de conectar: hay que esperar a que la vista se haya vuelto a montar tras la recarga, o
   * las aserciones siguientes se harían contra el DOM que está a punto de desaparecer.
   */
  async disconnectAndWait(): Promise<void> {
    await this.disconnect.click();
    await expect(this.signOutWarning).toBeVisible();

    // El `load` se espera desde ANTES del clic: la recarga la lanza la app cuando el cierre termina,
    // y esperarla después sería una carrera que a veces se resolvería contra el DOM anterior.
    await Promise.all([this.page.waitForEvent('load'), this.confirmDisconnect.click()]);

    await expect(this.root).toBeVisible();
    await expect(this.connect).toBeEnabled();
  }
}
