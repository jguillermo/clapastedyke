/**
 * Menu.gs
 * Crea el menu "Sistema" al abrir el archivo. Toda la navegacion vive aqui,
 * tal como quedo decidido. Los items de fases que aun no existen muestran un
 * aviso, asi el menu se ve completo desde el dia uno.
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu(nombreNegocio());

  menu.addItem('Ir al Resumen', 'irAlResumen');
  menu.addSeparator();

  // Fase 2 (presupuestos): YA funcionan.
  menu.addItem('Nuevo presupuesto', 'abrirNuevoPresupuesto');
  menu.addItem('Ver presupuestos', 'abrirVerPresupuestos');
  // Fase 3 (pedidos):
  menu.addItem('Ver pedidos', 'abrirVerPedidos');
  menu.addSeparator();

  // Fase 3 (compras e inventario):
  menu.addItem('Comprar materiales', 'abrirComprarMateriales');
  menu.addItem('Registrar compra', 'abrirRegistrarCompra');
  menu.addItem('Ajustar inventario', 'abrirAjustarInventario');
  menu.addSeparator();

  // Fase 1 (catalogos): YA funcionan.
  menu.addItem('Clientes', 'abrirClientes');
  menu.addItem('Recetas', 'abrirRecetas');
  menu.addItem('Insumos', 'abrirInsumos');
  menu.addItem('Proveedores', 'abrirProveedores');
  menu.addItem('Reglas de empaque', 'abrirReglasEmpaque');
  menu.addItem('Configuracion', 'abrirConfiguracion');

  menu.addSeparator();
  menu.addItem('Manual de usuario', 'abrirManualDeUsuario');

  var admin = ui.createMenu('Mantenimiento')
    .addItem('Instalar o reparar (todo)', 'instalar')
    .addSeparator()
    .addItem('1. Crear tablas', 'instalarTablas')
    .addItem('2. Aplicar diseno', 'instalarDiseno')
    .addItem('3-5. Formulas, validaciones y protecciones', 'instalarRapidos')
    .addSeparator()
    .addItem('Ajustar ancho de columnas al texto (lento)', 'ajustarAnchos');
  menu.addSubMenu(admin);

  // Ultimo item: version de la app (se incrementa en cada deploy).
  menu.addSeparator();
  menu.addItem('Version ' + (typeof VERSION_APP !== 'undefined' ? VERSION_APP : 0), 'acercaDe');

  menu.addToUi();
  // La hoja Resumen es 100% fórmulas: no necesita refresco al abrir.
}

function abrirManualDeUsuario() {
  var url = 'https://jguillermo.github.io/clapastedyke/Manual_de_usuario.html';
  var html = HtmlService.createHtmlOutput(
    '<p style="font-family:sans-serif;padding:12px">Abriendo el manual...<br>' +
    '<a href="' + url + '" target="_blank">Haz clic aquí si no abre</a></p>' +
    '<script>window.open("' + url + '","_blank");setTimeout(function(){google.script.host.close();},1500);</script>'
  ).setWidth(320).setHeight(80);
  SpreadsheetApp.getUi().showModalDialog(html, 'Manual de usuario');
}

/** Muestra la version de la app (se incrementa en cada deploy). */
function acercaDe() {
  var v = (typeof VERSION_APP !== 'undefined') ? VERSION_APP : 0;
  SpreadsheetApp.getUi().alert(nombreNegocio(), 'Version ' + v, SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Aviso para las pantallas que llegan en fases siguientes. */
function proximamente() {
  SpreadsheetApp.getUi().alert(
    'Disponible en la siguiente fase',
    'Esta pantalla se entrega en la Fase 2 o 3. La Fase 1 deja listos los catalogos y la configuracion.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}
