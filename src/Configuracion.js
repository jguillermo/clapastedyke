/**
 * Configuracion.gs  (Archivo 1)
 * Ventana 6.13 + lectura de la hoja Config por BLOQUES (seccion 13 del plan):
 *   - generales (parametro / valor)
 *   - factores de escalado (codigo / etiqueta / orden)
 *   - tamanos (nombre / factor)
 *   - tipos de ajuste (nombre / signo)
 * Config se edita a mano en la hoja; aqui se lee y, desde el formulario, se
 * editan los parametros generales.
 */

function abrirConfiguracion() {
  abrirModal('ConfiguracionForm', 'Configuracion', 760, 700);
}

// ---------- Lectura por bloques ----------

/** Definicion de un bloque por su clave. */
function bloqueDef(clave) {
  var def = buscarDef(HOJA.CONFIG);
  return (def.bloques || []).filter(function (b) { return b.clave === clave; })[0];
}

/** Filas de datos de un bloque, como arreglo de arreglos (sin cabecera). */
function filasBloque(clave) {
  var b = bloqueDef(clave);
  if (!b) return [];
  var sheet = hojaReq(HOJA.CONFIG);
  var filaT = filaTituloBloque(sheet, b.titulo);
  if (!filaT) return [];
  var nCols = b.cols.length;
  var max = sheet.getLastRow();
  var out = [];
  for (var r = filaT + 2; r <= max; r++) {
    var vals = sheet.getRange(r, 1, 1, nCols).getValues()[0];
    if (String(vals[0]) === '') break; // fin del bloque
    out.push(vals);
  }
  return out;
}

/** Config general como objeto {parametro: valor}. */
function getConfig() {
  var cfg = {};
  filasBloque('generales').forEach(function (r) { cfg[limpiar(r[0])] = r[1]; });
  return cfg;
}

/** Un solo valor de la config general. */
function getConfigValor(parametro) { return getConfig()[parametro]; }

/** Escribe un parametro del bloque generales (sin duplicar). */
function setConfigGeneral(parametro, valor) {
  var b = bloqueDef('generales');
  var sheet = hojaReq(HOJA.CONFIG);
  var filaT = filaTituloBloque(sheet, b.titulo);
  if (!filaT) return false;
  var max = sheet.getLastRow();
  for (var r = filaT + 2; r <= max; r++) {
    var k = String(sheet.getRange(r, 1).getValue());
    if (k === '') break;
    if (k === parametro) { sheet.getRange(r, 2).setValue(valor); return true; }
  }
  return false;
}

/** Factores de escalado: [{codigo, label, orden}]. */
function factoresDeConfig() {
  return filasBloque('factores').map(function (r) {
    return { codigo: numero(r[0]), label: limpiar(r[1]), orden: numero(r[2]) };
  }).sort(function (a, b) { return a.orden - b.orden; });
}

/** Tamanos: [{nombre, factor}]. */
function tamanosConfig() {
  return filasBloque('tamanos').map(function (r) {
    return { nombre: limpiar(r[0]), factor: numero(r[1]) };
  }).filter(function (t) { return t.nombre; });
}

/** Factor de un tamano por su nombre (0 si no existe). */
function factorDeTamano(nombre) {
  var t = tamanosConfig().filter(function (x) { return x.nombre === limpiar(nombre); })[0];
  return t ? t.factor : 0;
}

/** Tipos de ajuste: [{nombre, signo}]. signo: -1 resta, 1 suma, 0 usa el signo del numero. */
function tiposAjusteConfig() {
  return filasBloque('tipos_ajuste').map(function (r) {
    return { nombre: limpiar(r[0]), signo: numero(r[1]) };
  }).filter(function (t) { return t.nombre; });
}

// ---------- Formulario (parametros generales) ----------

/** Devuelve la config para llenar el formulario. */
function obtenerConfiguracion() { return getConfig(); }

/** Parametros generales que edita el formulario. */
function camposConfig() {
  return ['tarifa_mano_obra_hora', 'costo_indirecto_pedido', 'depreciacion_pedido',
          'margen_defecto', 'aplicar_igv', 'tasa_igv', 'redondeo', 'dias_vencimiento',
          'momento_descuento_stock', 'nombre_negocio'];
}

function guardarConfiguracion(datos) {
  return conBloqueo(function () {
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
    if (!limpiar(datos.nombre_negocio)) throw new Error('El nombre del negocio no puede quedar vacio.');

    var cfg = getConfig();
    camposConfig().forEach(function (k) {
      var nuevo = datos[k];
      var antes = cfg[k];
      if (String(antes) !== String(nuevo)) {
        setConfigGeneral(k, nuevo);
        auditar('editar', 'config', k, k, antes, nuevo, '');
      }
    });

    irAHojaDelDato(HOJA.CONFIG);
    return { ok: true, mensaje: 'Configuracion guardada.' };
  });
}
