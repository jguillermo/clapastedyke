/**
 * Errores del dominio del BC Costeo.
 * Los casos de uso los dejan subir; la UI decide cómo mostrarlos.
 */

export class ErrorDominio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

/** Violación de una regla o invariante de negocio. */
export class ErrorValidacion extends ErrorDominio {}

/** El agregado pedido no existe. */
export class ErrorNoEncontrado extends ErrorDominio {
  constructor(entidad: string, id: string) {
    super(`${entidad} «${id}» no existe.`);
  }
}

/** Choque de unicidad (p.ej. nombre repetido). */
export class ErrorDuplicado extends ErrorDominio {}
