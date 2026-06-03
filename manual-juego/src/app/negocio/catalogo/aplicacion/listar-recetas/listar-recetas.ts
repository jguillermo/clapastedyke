import { CasoDeUso } from '../../../compartido/aplicacion/caso-de-uso';
import { RecetaPrimitivos } from '../../dominio/receta/receta';
import { RepositorioRecetas } from '../../dominio/receta/repositorio-recetas';

export class ListarRecetas implements CasoDeUso<void, RecetaPrimitivos[]> {
  constructor(private readonly recetas: RepositorioRecetas) {}

  async ejecutar(): Promise<RecetaPrimitivos[]> {
    const todas = await this.recetas.todos();
    return todas
      .map(r => r.aPrimitivos())
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
}
