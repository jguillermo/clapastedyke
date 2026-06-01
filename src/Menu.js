/**
 * Menu.gs
 * Crea el menu "Sistema" al abrir el archivo. Toda la navegacion vive aqui,
 * tal como quedo decidido. Los items de fases que aun no existen muestran un
 * aviso, asi el menu se ve completo desde el dia uno.
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu(nombreNegocio());

  menu.addItem('Ir al Inicio', 'irAlInicio');
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
  var catalogos = ui.createMenu('Catalogos')
    .addItem('Clientes', 'abrirClientes')
    .addItem('Recetas', 'abrirRecetas')
    .addItem('Insumos', 'abrirInsumos')
    .addItem('Proveedores', 'abrirProveedores')
    .addItem('Reglas de empaque', 'abrirReglasEmpaque');
  menu.addSubMenu(catalogos);
  menu.addItem('Configuracion', 'abrirConfiguracion');

  menu.addSeparator();
  menu.addItem('Manual de usuario', 'abrirManualDeUsuario');

  var admin = ui.createMenu('Mantenimiento')
    .addItem('Instalar o reparar', 'instalar');
  menu.addSubMenu(admin);

  menu.addToUi();

  // Refresca el panel de Inicio al abrir, sin romper el menú si algo falla.
  if (typeof refrescarInicioSeguro === 'function') refrescarInicioSeguro();
}

/** Lleva el foco a la hoja Inicio y la refresca. */
function irAlInicio() {
  var h = hoja(HOJA.INICIO);
  if (h) {
    if (typeof refrescarInicioSeguro === 'function') refrescarInicioSeguro();
    ssOperacion().setActiveSheet(h);
  } else {
    toast('Aun no esta instalado. Usa Mantenimiento > Instalar o reparar.');
  }
}

function abrirManualDeUsuario() {
  abrirModal('Manual_de_usuario', 'Manual de usuario', 900, 600);
}

/** Aviso para las pantallas que llegan en fases siguientes. */
function proximamente() {
  SpreadsheetApp.getUi().alert(
    'Disponible en la siguiente fase',
    'Esta pantalla se entrega en la Fase 2 o 3. La Fase 1 deja listos los catalogos y la configuracion.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}
