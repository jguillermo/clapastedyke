/**
 * Inicio.gs  -> ahora solo navegación al Resumen.
 * La antigua hoja Inicio (panel dibujado por código) se eliminó (sección 14 del
 * plan). En su lugar existe la hoja Resumen, 100% fórmulas, que el instalador
 * siembra y que se actualiza sola. No hay refresco por código.
 */

/** Lleva el foco a la hoja Resumen. */
function irAlResumen() {
  var h = ssOperacion().getSheetByName(HOJA.RESUMEN);
  if (h) ssOperacion().setActiveSheet(h);
  else toast('Aún no está instalado. Usa ' + nombreNegocio() + ' > Mantenimiento > Instalar o reparar.');
}
