import { AgregadoRaiz } from '../../../compartido/dominio/agregado';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { eventoDominio } from '../../../compartido/dominio/evento-dominio';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';

/** Forma persistible del agregado (documento plano para el repositorio). */
export interface ClientePrimitivos {
  id: string;
  nombre: string;
  telefono: string;
  notas: string;
  creadoEn: string; // ISO
}

/**
 * Cliente (CL-): a quién se le cotiza. Todo presupuesto va a nombre de un
 * cliente. El nombre es obligatorio; su UNICIDAD (case-insensitive) la
 * garantiza el caso de uso consultando el repositorio.
 */
export class Cliente extends AgregadoRaiz {
  private constructor(
    readonly id: IdEntidad,
    private _nombre: string,
    private _telefono: string,
    private _notas: string,
    readonly creadoEn: Date,
  ) {
    super();
  }

  static crear(id: IdEntidad, datos: { nombre: string; telefono?: string; notas?: string }): Cliente {
    const cliente = new Cliente(
      id,
      Cliente.nombreValido(datos.nombre),
      (datos.telefono ?? '').trim(),
      (datos.notas ?? '').trim(),
      new Date(),
    );
    cliente.registrarEvento(eventoDominio('ClienteCreado', id.valor, { nombre: cliente._nombre }));
    return cliente;
  }

  static desdePrimitivos(p: ClientePrimitivos): Cliente {
    return new Cliente(IdEntidad.desde(p.id), p.nombre, p.telefono, p.notas, new Date(p.creadoEn));
  }

  /** Corrige nombre, teléfono o notas (Flujo 07.2 del manual). */
  editar(datos: { nombre: string; telefono?: string; notas?: string }): void {
    this._nombre = Cliente.nombreValido(datos.nombre);
    this._telefono = (datos.telefono ?? '').trim();
    this._notas = (datos.notas ?? '').trim();
    this.registrarEvento(eventoDominio('ClienteEditado', this.id.valor, { nombre: this._nombre }));
  }

  get nombre(): string {
    return this._nombre;
  }
  get telefono(): string {
    return this._telefono;
  }
  get notas(): string {
    return this._notas;
  }

  aPrimitivos(): ClientePrimitivos {
    return {
      id: this.id.valor,
      nombre: this._nombre,
      telefono: this._telefono,
      notas: this._notas,
      creadoEn: this.creadoEn.toISOString(),
    };
  }

  private static nombreValido(nombre: string): string {
    const limpio = (nombre ?? '').trim();
    if (!limpio) throw new ErrorValidacion('El nombre del cliente es obligatorio.');
    return limpio;
  }
}
