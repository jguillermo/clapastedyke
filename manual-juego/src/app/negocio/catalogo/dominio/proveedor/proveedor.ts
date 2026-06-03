import { AgregadoRaiz } from '../../../compartido/dominio/agregado';
import { ErrorValidacion } from '../../../compartido/dominio/errores';
import { eventoDominio } from '../../../compartido/dominio/evento-dominio';
import { IdEntidad } from '../../../compartido/dominio/id-entidad';

/**
 * VO Whatsapp: número con código de país, solo dígitos, mínimo 8.
 * Es lo que arma el enlace «pedir por WhatsApp» en compras
 * (normalización de src/Proveedores.js).
 */
export class Whatsapp {
  private constructor(readonly numero: string) {}

  static desde(texto: string): Whatsapp {
    const digitos = String(texto ?? '').replace(/\D/g, '');
    if (digitos.length < 8) {
      throw new ErrorValidacion('El WhatsApp necesita código de país y al menos 8 dígitos.');
    }
    return new Whatsapp(digitos);
  }

  get enlaceChat(): string {
    return `https://wa.me/${this.numero}`;
  }

  esIgualA(otro: Whatsapp): boolean {
    return this.numero === otro.numero;
  }
}

export interface ProveedorPrimitivos {
  id: string;
  nombre: string;
  whatsapp: string;
  notas: string;
  creadoEn: string;
}

/**
 * Proveedor (PR-): suministra insumos. Su WhatsApp permite pedirle con un
 * clic desde «Comprar materiales». Nombre único (lo garantiza el caso de uso).
 */
export class Proveedor extends AgregadoRaiz {
  private constructor(
    readonly id: IdEntidad,
    private _nombre: string,
    private _whatsapp: Whatsapp,
    private _notas: string,
    readonly creadoEn: Date,
  ) {
    super();
  }

  static crear(id: IdEntidad, datos: { nombre: string; whatsapp: string; notas?: string }): Proveedor {
    const proveedor = new Proveedor(
      id,
      Proveedor.nombreValido(datos.nombre),
      Whatsapp.desde(datos.whatsapp),
      (datos.notas ?? '').trim(),
      new Date(),
    );
    proveedor.registrarEvento(eventoDominio('ProveedorCreado', id.valor, { nombre: proveedor._nombre }));
    return proveedor;
  }

  static desdePrimitivos(p: ProveedorPrimitivos): Proveedor {
    return new Proveedor(IdEntidad.desde(p.id), p.nombre, Whatsapp.desde(p.whatsapp), p.notas, new Date(p.creadoEn));
  }

  editar(datos: { nombre: string; whatsapp: string; notas?: string }): void {
    this._nombre = Proveedor.nombreValido(datos.nombre);
    this._whatsapp = Whatsapp.desde(datos.whatsapp);
    this._notas = (datos.notas ?? '').trim();
    this.registrarEvento(eventoDominio('ProveedorEditado', this.id.valor, { nombre: this._nombre }));
  }

  get nombre(): string {
    return this._nombre;
  }
  get whatsapp(): Whatsapp {
    return this._whatsapp;
  }
  get notas(): string {
    return this._notas;
  }

  aPrimitivos(): ProveedorPrimitivos {
    return {
      id: this.id.valor,
      nombre: this._nombre,
      whatsapp: this._whatsapp.numero,
      notas: this._notas,
      creadoEn: this.creadoEn.toISOString(),
    };
  }

  private static nombreValido(nombre: string): string {
    const limpio = (nombre ?? '').trim();
    if (!limpio) throw new ErrorValidacion('El nombre del proveedor es obligatorio.');
    return limpio;
  }
}
