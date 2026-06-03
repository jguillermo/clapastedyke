var t = require('./helpers/microtest');
var loader = require('./helpers/loader');
var ctx = loader.loadServer();
ctx.ejecutarInstalacion();

// Datos base (precio por gramo se siembra como número; en la hoja real es fórmula).
loader.seedSheet(ctx, ctx.HOJA.INSUMOS, [
  { id: 'IN-0001', nombre: 'Harina', tipo: 'ingrediente', unidad_base: 'g',
    tamano_presentacion: 1000, precio_presentacion: 500, precio_por_unidad_base: 0.5,
    stock_actual: 100000, stock_minimo: 1000 }
]);
loader.seedSheet(ctx, ctx.HOJA.RECETAS, [
  { id: 'RC-0001', nombre: 'Torta', categoria: 'tortas', tipo_base: 'personas',
    raciones_base: 10, tiempo_mano_obra_horas: 2 }
]);
loader.seedSheet(ctx, ctx.HOJA.RECETA_ING, [
  { id_linea: 'RI-0001', receta_id: 'RC-0001', insumo_id: 'IN-0001', cantidad_base: 100 }
]);

function base(extra) {
  var p = { receta_id: 'RC-0001', empaques: [], margen: 35, aplica_igv: 'NO' };
  for (var k in extra) p[k] = extra[k];
  return p;
}

t.suite('Presupuestos (motor de cálculo)');

t.test('modo personas: factor = valor / base', function () {
  var c = ctx.calcularPresupuesto(base({ modo_escalado: 'personas', valor_escalado: 20 }));
  t.eq(c.factor, 2);
  t.almost(c.costo_ingredientes, 100);     // 100g*2 * 0.5
  t.almost(c.costo_mano_obra, 48);          // 2h*2 * tarifa 12
  t.almost(c.costo_total, 156);             // 100+0+48+5+3
  t.almost(c.precio_con_margen, 240);       // 156 / (1-0.35)
  t.eq(c.precio_final, 240);
});

t.test('modo tamaño: factor desde Config (grande=2)', function () {
  var c = ctx.calcularPresupuesto(base({ modo_escalado: 'tamano', tamano: 'grande' }));
  t.eq(c.factor, 2);
  t.eq(c.precio_final, 240);
});

t.test('modo tamaño sin factor configurado lanza error', function () {
  t.throws(function () {
    ctx.calcularPresupuesto(base({ modo_escalado: 'tamano', tamano: 'gigante' }));
  });
});

t.test('modo factor directo', function () {
  var c = ctx.calcularPresupuesto(base({ modo_escalado: 'factor', valor_escalado: 2 }));
  t.eq(c.factor, 2);
  t.eq(c.precio_final, 240);
});

t.test('IGV se suma y redondea al múltiplo de 5 hacia arriba', function () {
  var c = ctx.calcularPresupuesto(base({ modo_escalado: 'personas', valor_escalado: 20, aplica_igv: 'SI' }));
  t.almost(c.monto_igv, 240 * 0.18);        // 43.2
  t.eq(c.precio_final, 285);                // ceil(283.2/5)*5
});

t.test('margen fuera de rango lanza error', function () {
  t.throws(function () {
    ctx.calcularPresupuesto(base({ modo_escalado: 'factor', valor_escalado: 1, margen: 120 }));
  });
});

t.test('guardarPresupuesto congela y deja estado Pendiente', function () {
  loader.seedSheet(ctx, ctx.HOJA.CLIENTES, [{ id: 'CL-0001', nombre: 'Ana' }]);
  var r = ctx.guardarPresupuesto(base({
    cliente_id: 'CL-0001', cliente_nombre: 'Ana', receta_nombre: 'Torta',
    modo_escalado: 'factor', valor_escalado: 2
  }));
  t.ok(r.ok);
  var p = ctx.leerHoja(ctx.HOJA.PRESUPUESTOS).filas;
  t.eq(p.length, 1);
  t.eq(ctx.limpiar(p[0].estado), 'Pendiente');
  t.eq(ctx.numero(p[0].precio_final), 240);
  var det = ctx.leerHoja(ctx.HOJA.PRESUPUESTO_DETALLE).filas;
  t.ok(det.length >= 1, 'debe guardar líneas de detalle congeladas');
});
