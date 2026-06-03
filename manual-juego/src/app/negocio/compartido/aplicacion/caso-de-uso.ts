/**
 * Contrato de un caso de uso (Application Service): coordina el modelo de
 * dominio para un escenario concreto. Delgado, sin lógica de negocio propia.
 */
export interface CasoDeUso<Peticion, Respuesta> {
  ejecutar(peticion: Peticion): Promise<Respuesta>;
}
