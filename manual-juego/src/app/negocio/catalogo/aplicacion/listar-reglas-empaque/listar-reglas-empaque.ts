import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { ReglaEmpaquePrimitivos } from '../../dominio/regla-empaque/regla-empaque';
import { RepositorioReglasEmpaque } from '../../dominio/regla-empaque/repositorio-reglas-empaque';

export class ListarReglasEmpaque implements CasoDeUso<void, ReglaEmpaquePrimitivos[]> {
  constructor(private readonly reglas: RepositorioReglasEmpaque) {}

  async ejecutar(): Promise<ReglaEmpaquePrimitivos[]> {
    const todas = await this.reglas.todos();
    return todas.map(r => r.aPrimitivos());
  }
}
