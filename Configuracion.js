/**
 * Configuracion.gs  (Archivo 1)
 * Ventana 6.13. Todos los parametros del negocio. Cambiar algo aqui afecta los
 * presupuestos nuevos, nunca los ya guardados (esos quedan congelados en Fase 2).
 */

function abrirConfiguracion() {
  abrirModal('ConfiguracionForm', 'Configuracion', 760, 700);
}

/** Devuelve la config como objeto para llenar el formulario. */
function obtenerConfiguracion() {
  return getConfig();
}

/** Definicion de los campos, para validar y para que la version no se pierda. */
function camposConfig() {
  return ['tarifa_mano_obra_hora', 'costo_indirecto_pedido', 'depreciacion_pedido',
          'margen_defecto', 'aplicar_igv', 'tasa_igv', 'redondeo', 'dias_vencimiento',
          'momento_descuento_stock', 'lista_tamanos', 'nombre_negocio'];
}

function guardarConfiguracion(datos) {
  return conBloqueo(function () {
    // Validaciones de los numericos.
    var numericos = {
      tarifa_mano_obra_hora: 'Tarifa de mano de obra',
      costo_indirecto_pedido: 'Costo indirecto',
      depreciacion_pedido: 'Depreciacion',
      margen_defecto: 'Margen por defecto',
      tasa_igv: 'Tasa de IGV',
      dias_vencimiento: 'Dias de vencimiento'
    };
    Object.keys(numericos).forEach(function (k) {
      var v = numero(datos[k]);
      if (v < 0) throw new Error(numericos[k] + ' no puede ser negativo.');
      if (k === 'dias_vencimiento' && v < 1) throw new Error('Los dias de vencimiento deben ser al menos 1.');
    });
    if (['SI', 'NO'].indexOf(datos.aplicar_igv) < 0) throw new Error('Aplicar IGV debe ser SI o NO.');
    if (['NINGUNO', 'MULTIPLO_5'].indexOf(datos.redondeo) < 0) throw new Error('Redondeo invalido.');
    if (['APROBAR', 'PRODUCCION'].indexOf(datos.momento_descuento_stock) < 0) throw new Error('Momento de descuento invalido.');
    if (!limpiar(datos.lista_tamanos)) throw new Error('La lista de tamanos no puede quedar vacia.');
    if (!limpiar(datos.nombre_negocio)) throw new Error('El nombre del negocio no puede quedar vacio.');

    // Escribe cada parametro en su fila, sin crear duplicados.
    var datosHoja = leerHoja(HOJA.CONFIG);
    var porParam = {};
    datosHoja.filas.forEach(function (f) { porParam[f.parametro] = f; });

    camposConfig().forEach(function (k) {
      var nuevo = datos[k];
      if (porParam[k]) {
        var antes = porParam[k].valor;
        if (String(antes) !== String(nuevo)) {
          actualizarFila(HOJA.CONFIG, porParam[k]._fila, { valor: nuevo });
          auditar('editar', 'config', k, k, antes, nuevo, '');
        }
      } else {
        agregarFila(HOJA.CONFIG, { parametro: k, valor: nuevo, descripcion: '' });
        auditar('crear', 'config', k, k, '', nuevo, '');
      }
    });

    return { ok: true, mensaje: 'Configuracion guardada.' };
  });
}
