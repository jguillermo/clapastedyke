import { Mision, Nivel, Paso } from './tutorial.types';

/**
 * Versión del contenido. Si cambia, el progreso guardado en localStorage
 * se descarta (los ids de paso pueden haber cambiado de significado).
 * Alineada con `appVersion` del package.json raíz del repo.
 */
export const VERSION_CONTENIDO = 6;

/** Atajo para marcar botones del sistema dentro de las instrucciones. */
function t(s: string): string {
  return `<span class="tag">${s}</span>`;
}

/* ============================================================
 * NIVEL BÁSICO — "Prepara tu negocio"
 * ============================================================ */

const INSTALAR: Mision = {
  id: 'f12',
  titulo: 'Instalar el sistema',
  paraQue: 'Es el primer paso de todos: crea las pestañas, cabeceras y fórmulas donde vivirá tu negocio.',
  pasos: [
    {
      id: 'f12-1',
      titulo: 'Abre el instalador',
      instruccion: `En tu hoja de cálculo, abre el menú ${t('Sistema')}, entra a ${t('Mantenimiento')} y toca ${t('Instalar o reparar (todo)')}.`,
      detalle: 'El menú Sistema aparece en la barra de arriba de Google Sheets, junto a Ayuda.',
      pista: 'Si no ves el menú Sistema, cierra y vuelve a abrir el archivo: el menú se crea al abrir.',
      escena: { tipo: 'menu', ruta: ['Sistema', 'Mantenimiento', 'Instalar o reparar (todo)'] },
    },
    {
      id: 'f12-2',
      titulo: 'Espera el aviso «Listo»',
      instruccion: 'Espera sin cerrar el archivo hasta que aparezca el aviso <b>«Listo»</b> con el número de hojas creadas y revisadas.',
      detalle: 'La primera vez puede tardar varios minutos, porque crea todas las hojas.',
      pista: 'Si se corta por tiempo, en el manual completo está «Mantenimiento por partes» (Flujo 14).',
      escena: { tipo: 'hoja', pestanas: ['Resumen', 'Config', 'Insumos', 'Presupuestos'], aviso: 'Listo: hojas creadas y revisadas' },
    },
    {
      id: 'f12-3',
      titulo: 'Confirma las pestañas',
      instruccion: 'Mira abajo: debe aparecer la pestaña <b>Resumen</b> como primera, y detrás las demás (Config, Insumos, Presupuestos, Pedidos, Clientes, Proveedores, Recetas…).',
      quePasa: 'Quedan creadas todas las hojas con sus cabeceras y fórmulas. Las columnas que se calculan solas salen con cabecera <b>verde</b>. Es seguro repetir la instalación: nunca borra tus datos, solo repara lo que falte.',
      escena: { tipo: 'hoja', pestanas: ['Resumen', 'Config', 'Insumos', 'Presupuestos', 'Pedidos', 'Clientes', 'Proveedores', 'Recetas'] },
    },
  ],
};

const CONFIGURAR: Mision = {
  id: 'f13',
  titulo: 'Configurar el negocio',
  paraQue: 'Defines las reglas con las que se arma el precio: margen, IGV, redondeo y los tamaños que venderás.',
  pasos: [
    {
      id: 'f13-1',
      titulo: 'Abre la configuración',
      instruccion: `Abre el menú ${t('Sistema')} y entra a ${t('Configuración')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Configuración'] },
    },
    {
      id: 'f13-2',
      titulo: 'Tu hora de trabajo',
      instruccion: 'Escribe la <b>tarifa de mano de obra por hora</b>: cuánto vale una hora de tu trabajo.',
      detalle: 'Alimenta el costo de cada presupuesto: las horas de la receta se multiplican por esta tarifa.',
      escena: {
        tipo: 'formulario', formulario: 'configuracion',
        resaltarIds: ['tarifa_mano_obra_hora'],
        valoresEjemplo: { tarifa_mano_obra_hora: '10' },
        titulo: 'Configuración',
        campos: [{ etiqueta: 'Tarifa mano de obra (S/ por hora)', tipo: 'numero', valor: '10', resaltado: true }],
      },
    },
    {
      id: 'f13-3',
      titulo: 'Costos fijos por pedido',
      instruccion: 'Pon el <b>costo indirecto</b> y la <b>depreciación</b> por pedido: montos fijos por luz, gas o desgaste de tus equipos.',
      escena: {
        tipo: 'formulario', formulario: 'configuracion',
        resaltarIds: ['costo_indirecto_pedido', 'depreciacion_pedido'],
        valoresEjemplo: { tarifa_mano_obra_hora: '10', costo_indirecto_pedido: '3', depreciacion_pedido: '2' },
        titulo: 'Configuración',
        campos: [
          { etiqueta: 'Costo indirecto por pedido (S/)', tipo: 'numero', valor: '3', resaltado: true },
          { etiqueta: 'Depreciación por pedido (S/)', tipo: 'numero', valor: '2', resaltado: true },
        ],
      },
    },
    {
      id: 'f13-4',
      titulo: 'Tu ganancia',
      instruccion: 'Define el <b>margen por defecto</b>, en porcentaje. Es tu ganancia sobre la venta.',
      detalle: 'Cada presupuesto lo trae puesto y lo puedes cambiar caso por caso.',
      escena: {
        tipo: 'formulario', formulario: 'configuracion',
        resaltarIds: ['margen_defecto'],
        valoresEjemplo: { margen_defecto: '30' },
        titulo: 'Configuración',
        campos: [{ etiqueta: 'Margen por defecto (%)', tipo: 'numero', valor: '30', resaltado: true }],
      },
    },
    {
      id: 'f13-5',
      titulo: 'IGV y redondeo',
      instruccion: 'Decide si <b>aplicar IGV</b> (y su tasa) y deja el <b>redondeo</b> en «múltiplo de 5 hacia arriba» para precios redonditos.',
      escena: {
        tipo: 'formulario', formulario: 'configuracion',
        resaltarIds: ['aplicar_igv', 'tasa_igv', 'redondeo'],
        valoresEjemplo: { tasa_igv: '18' },
        titulo: 'Configuración',
        campos: [
          { etiqueta: 'Aplicar IGV', tipo: 'check', valor: 'Sí', resaltado: true },
          { etiqueta: 'Tasa IGV (%)', tipo: 'numero', valor: '18' },
          { etiqueta: 'Redondeo', tipo: 'select', valor: 'Múltiplo de 5', resaltado: true },
        ],
      },
    },
    {
      id: 'f13-6',
      titulo: 'Vigencia y stock',
      instruccion: 'Pon los <b>días de vencimiento</b> del presupuesto y elige el <b>momento de descuento de stock</b>: al aprobar o al iniciar producción.',
      detalle: 'Cuántos días vale tu cotización, y cuándo el sistema descuenta los materiales del inventario.',
      escena: {
        tipo: 'formulario', formulario: 'configuracion',
        resaltarIds: ['dias_vencimiento', 'momento_descuento_stock'],
        valoresEjemplo: { dias_vencimiento: '7' },
        titulo: 'Configuración',
        campos: [
          { etiqueta: 'Días de vencimiento', tipo: 'numero', valor: '7', resaltado: true },
          { etiqueta: 'Descuento de stock', tipo: 'select', valor: 'APROBAR', resaltado: true },
        ],
      },
    },
    {
      id: 'f13-7',
      titulo: 'Tus tamaños',
      instruccion: 'Revisa la <b>lista de tamaños</b> con su factor: <b>chico 0.5</b>, <b>mediano 1</b>, <b>grande 2</b>.',
      detalle: 'El factor multiplica la receta: un grande lleva el doble de ingredientes que un mediano.',
      escena: {
        tipo: 'formulario', titulo: 'Configuración',
        campos: [
          { etiqueta: 'Tamaño: chico · factor', tipo: 'numero', valor: '0.5', resaltado: true },
          { etiqueta: 'Tamaño: mediano · factor', tipo: 'numero', valor: '1', resaltado: true },
          { etiqueta: 'Tamaño: grande · factor', tipo: 'numero', valor: '2', resaltado: true },
        ],
      },
    },
    {
      id: 'f13-8',
      titulo: 'Nombre y guardar',
      instruccion: `Escribe el <b>nombre de tu negocio</b> y toca ${t('Guardar')}.`,
      quePasa: 'Caes en la hoja Config, con 4 bloques editables: Parámetros generales, Factores de escalado, Tamaños y Tipos de ajuste. Lo que cambies aquí afecta los presupuestos <b>nuevos</b>, nunca los ya guardados.',
      escena: {
        tipo: 'formulario', formulario: 'configuracion',
        resaltarIds: ['nombre_negocio', 'btnGuardar'],
        valoresEjemplo: { nombre_negocio: 'Dulces Misa' },
        titulo: 'Configuración',
        campos: [{ etiqueta: 'Nombre del negocio', tipo: 'texto', valor: 'Dulces Misa', resaltado: true }],
        boton: 'guardar',
      },
    },
  ],
};

const CLIENTE: Mision = {
  id: 'f07',
  titulo: 'Tu primer cliente',
  paraQue: 'Todo presupuesto va a nombre de un cliente. Sin cliente no hay a quién cotizarle.',
  pasos: [
    {
      id: 'f07-1',
      titulo: 'Abre los clientes',
      instruccion: `Abre el menú ${t('Sistema')}, entra a ${t('Clientes')} y toca ${t('Nuevo cliente')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Clientes'] },
    },
    {
      id: 'f07-2',
      titulo: 'Su nombre',
      instruccion: 'Escribe el <b>nombre</b>: por ejemplo <b>Ana Torres</b>.',
      detalle: 'Es obligatorio y no se puede repetir exacto con otro cliente.',
      escena: {
        tipo: 'formulario', formulario: 'clientes',
        resaltarIds: ['nombre'],
        valoresEjemplo: { nombre: 'Ana Torres' },
      },
    },
    {
      id: 'f07-3',
      titulo: 'Su teléfono',
      instruccion: 'Pon su <b>teléfono</b> (<b>999000111</b>) y notas si quieres. Ambos son opcionales.',
      escena: {
        tipo: 'formulario', formulario: 'clientes',
        resaltarIds: ['telefono', 'notas'],
        valoresEjemplo: { nombre: 'Ana Torres', telefono: '999000111' },
      },
    },
    {
      id: 'f07-4',
      titulo: 'Guarda',
      instruccion: `Toca ${t('Guardar')}.`,
      quePasa: 'Aparece la fila <b>CL-0001</b> en la hoja Clientes. Ya tienes a quién cotizarle.',
      escena: {
        tipo: 'formulario', formulario: 'clientes',
        resaltarIds: ['btnGuardar'],
        valoresEjemplo: { nombre: 'Ana Torres', telefono: '999000111' },
        boton: 'guardar',
      },
    },
  ],
};

const INSUMO: Mision = {
  id: 'f08',
  titulo: 'Tus primeros insumos',
  paraQue: 'Los insumos (ingredientes y empaques) son la base de todos los costos: aquí vive su precio y su stock.',
  pasos: [
    {
      id: 'f08-1',
      titulo: 'Abre los insumos',
      instruccion: `Abre el menú ${t('Sistema')}, entra a ${t('Insumos')} y toca ${t('Nuevo insumo')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Insumos'] },
    },
    {
      id: 'f08-2',
      titulo: 'La harina',
      instruccion: `Crea <b>Harina</b>: tipo <b>ingrediente</b>, unidad <b>gramos</b>, presentación <b>1000</b>, precio <b>S/ 5</b>, mínimo <b>2000</b>. Toca ${t('Guardar')}.`,
      detalle: 'Verás «Precio por unidad base» = 0.005 (5÷1000) y el semáforo en rojo (stock 0).',
      escena: {
        tipo: 'formulario', formulario: 'insumos',
        resaltarIds: ['nombre', 'tamano_presentacion', 'precio_presentacion', 'stock_minimo', 'btnGuardar'],
        valoresEjemplo: { nombre: 'Harina', tamano_presentacion: '1000', precio_presentacion: '5', stock_minimo: '2000' },
        titulo: 'Nuevo insumo',
        campos: [
          { etiqueta: 'Nombre', tipo: 'texto', valor: 'Harina', resaltado: true },
          { etiqueta: 'Tipo', tipo: 'select', valor: 'Ingrediente' },
          { etiqueta: 'Unidad', tipo: 'select', valor: 'gramos' },
          { etiqueta: 'Presentación', tipo: 'numero', valor: '1000', resaltado: true },
          { etiqueta: 'Precio (S/)', tipo: 'numero', valor: '5', resaltado: true },
          { etiqueta: 'Stock mínimo', tipo: 'numero', valor: '2000' },
        ],
        boton: 'guardar',
      },
    },
    {
      id: 'f08-3',
      titulo: 'Los huevos',
      instruccion: `Crea <b>Huevo</b>: ingrediente, presentación <b>30</b>, precio <b>S/ 15</b>, mínimo <b>30</b>. Toca ${t('Guardar')}.`,
      detalle: '«Precio por unidad base» = 0.5 (15÷30): cada huevo te cuesta 50 céntimos.',
      escena: {
        tipo: 'formulario', formulario: 'insumos',
        resaltarIds: ['nombre', 'tamano_presentacion', 'precio_presentacion', 'stock_minimo', 'btnGuardar'],
        valoresEjemplo: { nombre: 'Huevo', tamano_presentacion: '30', precio_presentacion: '15', stock_minimo: '30' },
        titulo: 'Nuevo insumo',
        campos: [
          { etiqueta: 'Nombre', tipo: 'texto', valor: 'Huevo', resaltado: true },
          { etiqueta: 'Tipo', tipo: 'select', valor: 'Ingrediente' },
          { etiqueta: 'Presentación', tipo: 'numero', valor: '30', resaltado: true },
          { etiqueta: 'Precio (S/)', tipo: 'numero', valor: '15', resaltado: true },
          { etiqueta: 'Stock mínimo', tipo: 'numero', valor: '30' },
        ],
        boton: 'guardar',
      },
    },
    {
      id: 'f08-4',
      titulo: 'La caja',
      instruccion: `Crea <b>Caja torta</b>: tipo <b>empaque</b>, presentación <b>25</b>, precio <b>S/ 25</b>, stock <b>50</b>, mínimo <b>10</b>. Toca ${t('Guardar')}.`,
      quePasa: 'Las columnas calculadas («Precio por unidad base» y «Semáforo») se actualizan solas cuando cambia el precio o el stock. <b>No las toques a mano.</b> El semáforo de la caja sale verde (50 > 10).',
      escena: {
        tipo: 'formulario', formulario: 'insumos',
        resaltarIds: ['nombre', 'tipo', 'btnGuardar'],
        valoresEjemplo: { nombre: 'Caja torta', tamano_presentacion: '25', precio_presentacion: '25', stock_inicial: '50', stock_minimo: '10' },
        titulo: 'Nuevo insumo',
        campos: [
          { etiqueta: 'Nombre', tipo: 'texto', valor: 'Caja torta', resaltado: true },
          { etiqueta: 'Tipo', tipo: 'select', valor: 'Empaque', resaltado: true },
          { etiqueta: 'Presentación', tipo: 'numero', valor: '25' },
          { etiqueta: 'Precio (S/)', tipo: 'numero', valor: '25' },
          { etiqueta: 'Stock inicial', tipo: 'numero', valor: '50' },
          { etiqueta: 'Stock mínimo', tipo: 'numero', valor: '10' },
        ],
        boton: 'guardar',
      },
    },
  ],
};

const RECETA: Mision = {
  id: 'f10',
  titulo: 'Tu primera receta',
  paraQue: 'La receta define qué lleva tu producto y para cuántas raciones rinde. Es lo que el presupuesto escala.',
  pasos: [
    {
      id: 'f10-1',
      titulo: 'Abre las recetas',
      instruccion: `Abre el menú ${t('Sistema')}, entra a ${t('Recetas')} y toca ${t('Nueva receta')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Recetas'] },
    },
    {
      id: 'f10-2',
      titulo: 'Nombre y categoría',
      instruccion: 'Escribe el nombre <b>Torta chocolate</b> y la categoría <b>tortas</b>.',
      escena: {
        tipo: 'formulario', formulario: 'recetas',
        resaltarIds: ['nombre', 'categoria'],
        valoresEjemplo: { nombre: 'Torta chocolate', categoria: 'tortas' },
        titulo: 'Nueva receta',
        campos: [
          { etiqueta: 'Nombre', tipo: 'texto', valor: 'Torta chocolate', resaltado: true },
          { etiqueta: 'Categoría', tipo: 'texto', valor: 'tortas', resaltado: true },
        ],
      },
    },
    {
      id: 'f10-3',
      titulo: 'Para cuántos rinde',
      instruccion: 'Tipo de base <b>«Por personas»</b>, base <b>10</b>.',
      detalle: 'Es la clave del escalado: si luego te piden 20 personas, el sistema multiplica todo por 2.',
      escena: {
        tipo: 'formulario', formulario: 'recetas',
        resaltarIds: ['tipo_base', 'raciones_base'],
        valoresEjemplo: { nombre: 'Torta chocolate', categoria: 'tortas', raciones_base: '10' },
        titulo: 'Nueva receta',
        campos: [
          { etiqueta: 'Tipo de base', tipo: 'select', valor: 'Por personas', resaltado: true },
          { etiqueta: 'Base', tipo: 'numero', valor: '10', resaltado: true },
        ],
      },
    },
    {
      id: 'f10-4',
      titulo: 'Tu trabajo',
      instruccion: 'Pon la <b>mano de obra</b>: <b>2 horas</b>.',
      detalle: 'Se multiplica por la tarifa por hora que pusiste en Configuración.',
      escena: {
        tipo: 'formulario', formulario: 'recetas',
        resaltarIds: ['tiempo'],
        valoresEjemplo: { nombre: 'Torta chocolate', categoria: 'tortas', raciones_base: '10', tiempo: '2' },
        titulo: 'Nueva receta',
        campos: [{ etiqueta: 'Mano de obra (horas)', tipo: 'numero', valor: '2', resaltado: true }],
      },
    },
    {
      id: 'f10-5',
      titulo: 'Los ingredientes',
      instruccion: 'Agrega los ingredientes: <b>Harina 300</b> (la unidad sale sola: g) y <b>Huevo 4</b> (u).',
      pista: 'Si no aparecen en el desplegable, vuelve a la misión anterior: primero hay que crear los insumos.',
      escena: {
        tipo: 'formulario', formulario: 'recetas',
        resaltarIds: ['ings'],
        valoresEjemplo: { nombre: 'Torta chocolate', categoria: 'tortas', raciones_base: '10', tiempo: '2' },
        titulo: 'Nueva receta',
        campos: [
          { etiqueta: 'Ingrediente: Harina · cantidad', tipo: 'numero', valor: '300', resaltado: true },
          { etiqueta: 'Ingrediente: Huevo · cantidad', tipo: 'numero', valor: '4', resaltado: true },
        ],
      },
    },
    {
      id: 'f10-6',
      titulo: 'Guarda',
      instruccion: `Toca ${t('Guardar')}. El formulario pide al menos un ingrediente.`,
      quePasa: 'Queda la receta <b>RC-0001</b>. Escríbela siempre para una base cómoda: el sistema la escala solo al cotizar. Cambiarla después no afecta los presupuestos ya guardados.',
      escena: {
        tipo: 'formulario', formulario: 'recetas',
        resaltarIds: ['btnGuardar'],
        valoresEjemplo: { nombre: 'Torta chocolate', categoria: 'tortas', raciones_base: '10', tiempo: '2' },
        titulo: 'Nueva receta',
        campos: [
          { etiqueta: 'Nombre', tipo: 'texto', valor: 'Torta chocolate' },
          { etiqueta: 'Base', tipo: 'numero', valor: '10 personas' },
        ],
        boton: 'guardar',
      },
    },
  ],
};

/* ============================================================
 * NIVEL INTERMEDIO — "Tu primera venta"
 * ============================================================ */

const COTIZAR: Mision = {
  id: 'f01',
  titulo: 'Cotizar',
  paraQue: 'Poner precio a lo que te piden: eliges cliente y receta, escalas la cantidad y el sistema saca el precio.',
  pasos: [
    {
      id: 'f01-1',
      titulo: 'Abre el formulario',
      instruccion: `Abre el menú ${t('Sistema')} y toca ${t('Nuevo presupuesto')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Nuevo presupuesto'] },
    },
    {
      id: 'f01-2',
      titulo: 'El cliente',
      instruccion: 'En <b>Cliente</b>, elige <b>Ana Torres</b>.',
      pista: 'Si llega alguien nuevo en plena cotización, el botón «+» junto a Cliente lo crea sin salir del formulario.',
      escena: {
        tipo: 'formulario', formulario: 'nuevo-presupuesto',
        resaltarIds: ['cli_nombre'],
        valoresEjemplo: { cli_nombre: 'Ana Torres' },
        titulo: 'Nuevo presupuesto',
        campos: [{ etiqueta: 'Cliente', tipo: 'select', valor: 'Ana Torres', resaltado: true }],
      },
    },
    {
      id: 'f01-3',
      titulo: 'La receta',
      instruccion: 'En <b>Receta</b>, elige <b>Torta chocolate</b>.',
      detalle: 'El modo de escalado se pone solo en «Por personas» y la tabla trae Harina y Huevo con su precio.',
      escena: {
        tipo: 'formulario', formulario: 'nuevo-presupuesto',
        resaltarIds: ['rec_nombre'],
        valoresEjemplo: { cli_nombre: 'Ana Torres', rec_nombre: 'Torta chocolate' },
        titulo: 'Nuevo presupuesto',
        campos: [
          { etiqueta: 'Cliente', tipo: 'select', valor: 'Ana Torres' },
          { etiqueta: 'Receta', tipo: 'select', valor: 'Torta chocolate', resaltado: true },
          { etiqueta: 'Modo de escalado', tipo: 'select', valor: 'Por personas' },
        ],
      },
    },
    {
      id: 'f01-4',
      titulo: 'La cantidad',
      instruccion: 'Escala a <b>20 personas</b>.',
      detalle: 'La base de la receta es 10, así que el factor es 2: Harina pasa a 600 g y Huevo a 8 u. El costo se recalcula al instante.',
      escena: {
        tipo: 'formulario', formulario: 'nuevo-presupuesto',
        resaltarIds: ['raciones', 'tablaIng'],
        valoresEjemplo: { cli_nombre: 'Ana Torres', rec_nombre: 'Torta chocolate', raciones: '20' },
        titulo: 'Nuevo presupuesto',
        campos: [
          { etiqueta: 'Personas', tipo: 'numero', valor: '20', resaltado: true },
          { etiqueta: 'Harina (escalada)', tipo: 'numero', valor: '600 g' },
          { etiqueta: 'Huevo (escalado)', tipo: 'numero', valor: '8 u' },
        ],
      },
    },
    {
      id: 'f01-5',
      titulo: 'Prueba por tamaño',
      instruccion: 'Cambia el modo a <b>«Por tamaño»</b> y elige <b>grande</b>.',
      detalle: 'El factor de «grande» también es 2. Si la receta tiene regla de empaque (la definirás en el nivel avanzado), aparece el empaque sugerido con su casilla marcada.',
      escena: {
        tipo: 'formulario', formulario: 'nuevo-presupuesto',
        resaltarIds: ['modo', 'tamano', 'materiales'],
        valoresEjemplo: { cli_nombre: 'Ana Torres', rec_nombre: 'Torta chocolate' },
        titulo: 'Nuevo presupuesto',
        campos: [
          { etiqueta: 'Modo de escalado', tipo: 'select', valor: 'Por tamaño', resaltado: true },
          { etiqueta: 'Tamaño', tipo: 'select', valor: 'grande', resaltado: true },
          { etiqueta: 'Empaque sugerido: Caja torta', tipo: 'check', valor: 'Sí' },
        ],
      },
    },
    {
      id: 'f01-6',
      titulo: 'Margen e IGV',
      instruccion: 'Revisa los costos (mano de obra, indirecto, depreciación), <b>ajusta el margen</b> y marca <b>Aplicar IGV</b>.',
      detalle: 'El precio final se actualiza solo y se redondea hacia arriba al múltiplo de 5.',
      escena: {
        tipo: 'formulario', formulario: 'nuevo-presupuesto',
        resaltarIds: ['margen', 'aplica_igv', 't_final'],
        valoresEjemplo: { cli_nombre: 'Ana Torres', rec_nombre: 'Torta chocolate', margen: '30' },
        titulo: 'Nuevo presupuesto',
        campos: [
          { etiqueta: 'Margen (%)', tipo: 'numero', valor: '30', resaltado: true },
          { etiqueta: 'Aplicar IGV', tipo: 'check', valor: 'Sí', resaltado: true },
          { etiqueta: 'Precio final (S/)', tipo: 'numero', valor: '95' },
        ],
      },
    },
    {
      id: 'f01-7',
      titulo: 'Guarda',
      instruccion: `Escribe notas si hace falta y toca ${t('Guardar')}.`,
      quePasa: 'Nace el presupuesto <b>P-0001</b> en estado <b>Pendiente</b>, con emisión hoy y el vencimiento de tu Configuración. Sus precios quedan <b>congelados</b>: aunque cambies tus costos después, este no se mueve. Todavía no toca el inventario.',
      escena: {
        tipo: 'formulario', formulario: 'nuevo-presupuesto',
        resaltarIds: ['notas', 'btnGuardar'],
        valoresEjemplo: { cli_nombre: 'Ana Torres', rec_nombre: 'Torta chocolate', margen: '30' },
        titulo: 'Nuevo presupuesto',
        campos: [
          { etiqueta: 'Notas', tipo: 'texto', valor: 'Entrega sábado' },
          { etiqueta: 'Precio final (S/)', tipo: 'numero', valor: '95' },
        ],
        boton: 'guardar',
      },
    },
  ],
};

const APROBAR: Mision = {
  id: 'f02',
  titulo: 'Aprobar',
  paraQue: 'El momento de decidir: si el cliente acepta, apruebas y nace el pedido con su lista de materiales.',
  pasos: [
    {
      id: 'f02-1',
      titulo: 'Abre tus presupuestos',
      instruccion: `Abre el menú ${t('Sistema')} y toca ${t('Ver presupuestos')}. Luego abre el detalle de <b>P-0001</b> con ${t('Ver')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Ver presupuestos'] },
    },
    {
      id: 'f02-2',
      titulo: 'Lee los faltantes',
      instruccion: 'En el detalle, <b>lee el aviso de faltantes</b>.',
      detalle: 'Verás que Harina y Huevo quedarán en negativo, porque su stock es 0. Es informativo: no impide aprobar.',
      escena: {
        tipo: 'formulario', formulario: 'detalle-presupuesto',
        resaltarIds: ['cuerpo'],
        titulo: 'Presupuesto P-0001',
        campos: [
          { etiqueta: 'Estado', tipo: 'texto', valor: 'Pendiente' },
          { etiqueta: 'Faltante: Harina', tipo: 'texto', valor: '−600 g', resaltado: true },
          { etiqueta: 'Faltante: Huevo', tipo: 'texto', valor: '−8 u', resaltado: true },
        ],
      },
    },
    {
      id: 'f02-3',
      titulo: 'Aprueba',
      instruccion: `Toca ${t('Aprobar')} y confirma.`,
      quePasa: 'P-0001 pasa a <b>Aprobado</b> y nace el pedido <b>PD-0001</b> (Pendiente) con su lista de requerimientos. Si tu configuración descuenta el stock al aprobar, baja ahora; si no, bajará al iniciar producción.',
      pista: 'Si el cliente no acepta, el botón Rechazar guarda el motivo y no nace ningún pedido.',
      escena: {
        tipo: 'formulario', formulario: 'detalle-presupuesto',
        resaltarIds: ['pie'],
        titulo: 'Presupuesto P-0001',
        campos: [
          { etiqueta: 'Estado', tipo: 'texto', valor: 'Pendiente' },
          { etiqueta: 'Precio final (S/)', tipo: 'numero', valor: '95' },
        ],
        boton: 'guardar',
      },
    },
  ],
};

const ENTREGAR: Mision = {
  id: 'f03',
  titulo: 'Producir y entregar',
  paraQue: 'Llevar el pedido de Pendiente a Producción y a Entregado. Al entregar, la venta se registra sola.',
  pasos: [
    {
      id: 'f03-1',
      titulo: 'Abre tus pedidos',
      instruccion: `Abre el menú ${t('Sistema')} y toca ${t('Ver pedidos')}. Abre el detalle de <b>PD-0001</b> con ${t('Ver')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Ver pedidos'] },
    },
    {
      id: 'f03-2',
      titulo: 'A producción',
      instruccion: `Sobre PD-0001 (Pendiente), toca ${t('Producción')} y confirma.`,
      detalle: 'Si tu sistema descuenta el stock al iniciar producción, aquí es donde baja.',
      quePasa: 'El pedido pasa a <b>Producción</b>. A partir de aquí ya estás trabajando el encargo.',
      escena: {
        tipo: 'formulario', formulario: 'detalle-pedido',
        resaltarIds: ['pie'],
        titulo: 'Pedido PD-0001',
        campos: [
          { etiqueta: 'Estado', tipo: 'texto', valor: 'Pendiente', resaltado: true },
          { etiqueta: 'Cliente', tipo: 'texto', valor: 'Ana Torres' },
        ],
        boton: 'guardar',
      },
    },
    {
      id: 'f03-3',
      titulo: 'Entrega',
      instruccion: `Cuando termines el encargo, sobre el pedido en Producción toca ${t('Entregar')} y confirma.`,
      quePasa: 'Se registra la fecha de entrega y nace la venta <b>VT-0001</b> con el precio final del presupuesto. Cerraste el ciclo: de cotizar a vender. Si el pedido se cae, «Cancelar» devuelve solo el stock consumido (un Entregado ya no se puede cancelar).',
      escena: {
        tipo: 'formulario', formulario: 'detalle-pedido',
        resaltarIds: ['pie'],
        titulo: 'Pedido PD-0001',
        campos: [
          { etiqueta: 'Estado', tipo: 'texto', valor: 'Producción', resaltado: true },
          { etiqueta: 'Cliente', tipo: 'texto', valor: 'Ana Torres' },
        ],
        boton: 'guardar',
      },
    },
  ],
};

const RESUMEN: Mision = {
  id: 'f04',
  titulo: 'Revisar el negocio',
  paraQue: 'Tu tablero del día a día: de un vistazo ves qué necesita tu atención, sin tocar nada.',
  pasos: [
    {
      id: 'f04-1',
      titulo: 'Ve al Resumen',
      instruccion: `Abre el menú ${t('Sistema')} y toca ${t('Ir al Resumen')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Ir al Resumen'] },
    },
    {
      id: 'f04-2',
      titulo: 'Léelo de un vistazo',
      instruccion: 'Mira los presupuestos <b>pendientes, por vencer y vencidos</b>; los pedidos <b>pendientes, en producción y entregados</b>; los insumos <b>agotados o bajo el mínimo</b>; y la lista de <b>alertas</b>.',
      quePasa: 'El panel es de solo lectura y se vuelve a dibujar solo: al abrir el archivo y después de cada acción que mueva algo (aprobar, entregar…). No escribas sobre él.',
      escena: { tipo: 'hoja', pestanas: ['Resumen', 'Config', 'Insumos', 'Presupuestos', 'Pedidos'], aviso: '1 en producción · 2 alertas de stock' },
    },
  ],
};

/* ============================================================
 * NIVEL AVANZADO — "Domina la operación"
 * ============================================================ */

const PROVEEDOR: Mision = {
  id: 'f09',
  titulo: 'Tu proveedor',
  paraQue: 'Su WhatsApp te deja pedirle con un clic desde «Comprar materiales».',
  pasos: [
    {
      id: 'f09-1',
      titulo: 'Abre los proveedores',
      instruccion: `Abre el menú ${t('Sistema')}, entra a ${t('Proveedores')} y toca ${t('Nuevo proveedor')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Proveedores'] },
    },
    {
      id: 'f09-2',
      titulo: 'Su nombre',
      instruccion: 'Escribe el <b>nombre</b>: <b>Molinos SAC</b>.',
      detalle: 'Es obligatorio y no se puede repetir exacto.',
      escena: {
        tipo: 'formulario', formulario: 'proveedores',
        resaltarIds: ['nombre'],
        valoresEjemplo: { nombre: 'Molinos SAC' },
        titulo: 'Nuevo proveedor',
        campos: [{ etiqueta: 'Nombre', tipo: 'texto', valor: 'Molinos SAC', resaltado: true }],
      },
    },
    {
      id: 'f09-3',
      titulo: 'Su WhatsApp',
      instruccion: 'Pon su <b>WhatsApp con código de país</b>: <b>51999111222</b>, sin espacios ni signos.',
      detalle: 'Es lo que arma el enlace para pedirle con un clic.',
      escena: {
        tipo: 'formulario', formulario: 'proveedores',
        resaltarIds: ['whatsapp'],
        valoresEjemplo: { nombre: 'Molinos SAC', whatsapp: '51999111222' },
        titulo: 'Nuevo proveedor',
        campos: [
          { etiqueta: 'Nombre', tipo: 'texto', valor: 'Molinos SAC' },
          { etiqueta: 'WhatsApp', tipo: 'texto', valor: '51999111222', resaltado: true },
        ],
      },
    },
    {
      id: 'f09-4',
      titulo: 'Guarda',
      instruccion: `Notas opcionales y toca ${t('Guardar')}.`,
      quePasa: 'Aparece la fila <b>PR-0001</b>. Ahora puedes ponerlo como «proveedor recomendado» en tus insumos.',
      escena: {
        tipo: 'formulario', formulario: 'proveedores',
        resaltarIds: ['btnGuardar'],
        valoresEjemplo: { nombre: 'Molinos SAC', whatsapp: '51999111222' },
        titulo: 'Nuevo proveedor',
        campos: [
          { etiqueta: 'Nombre', tipo: 'texto', valor: 'Molinos SAC' },
          { etiqueta: 'WhatsApp', tipo: 'texto', valor: '51999111222' },
        ],
        boton: 'guardar',
      },
    },
  ],
};

const COMPRAR: Mision = {
  id: 'f05',
  titulo: 'Comprar y registrar',
  paraQue: 'Reponer el stock: pides al proveedor por WhatsApp y, cuando llega el material, registras la compra.',
  pasos: [
    {
      id: 'f05-1',
      titulo: 'Arma el pedido',
      instruccion: `Abre el menú ${t('Sistema')} y toca ${t('Comprar materiales')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Comprar materiales'] },
    },
    {
      id: 'f05-2',
      titulo: 'Elige los faltantes',
      instruccion: 'En <b>modo automático</b>, elige el pedido <b>PD-0001</b>.',
      detalle: 'Aparecen los faltantes (Harina, Huevo) agrupados por proveedor, con el último precio pagado. El modo manual lista todos los insumos, con los que están bajo el mínimo ya marcados.',
      escena: {
        tipo: 'formulario', formulario: 'comprar-materiales',
        resaltarIds: ['modo', 'pedido'],
        titulo: 'Comprar materiales',
        campos: [
          { etiqueta: 'Modo', tipo: 'select', valor: 'Automático (por pedido)', resaltado: true },
          { etiqueta: 'Pedido', tipo: 'select', valor: 'PD-0001', resaltado: true },
          { etiqueta: 'Faltantes', tipo: 'texto', valor: 'Harina · Huevo' },
        ],
      },
    },
    {
      id: 'f05-3',
      titulo: 'Pide por WhatsApp',
      instruccion: `Toca ${t('WhatsApp')} en Molinos SAC.`,
      detalle: 'Se abre el chat con el mensaje ya escrito para preguntar disponibilidad y precio.',
      quePasa: 'Esto todavía <b>no</b> cambia el stock: solo arma el pedido al proveedor. El stock sube cuando registres la compra recibida.',
      escena: {
        tipo: 'formulario', formulario: 'comprar-materiales',
        resaltarIds: ['resultado'],
        titulo: 'Comprar materiales',
        campos: [
          { etiqueta: 'Proveedor', tipo: 'texto', valor: 'Molinos SAC' },
          { etiqueta: 'Mensaje', tipo: 'texto', valor: 'Hola, ¿tienes harina y…' },
        ],
        boton: 'guardar',
      },
    },
    {
      id: 'f05-4',
      titulo: 'Llegó el material',
      instruccion: `Cuando recibas la compra, abre el menú ${t('Sistema')} y toca ${t('Registrar compra')}. Proveedor <b>Molinos SAC</b>, fecha de hoy.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Registrar compra'] },
    },
    {
      id: 'f05-5',
      titulo: 'Las líneas y guarda',
      instruccion: `Línea <b>Harina</b>: cantidad <b>5</b> (presentaciones), precio <b>5.50</b>. Línea <b>Huevo</b>: cantidad <b>2</b>, precio <b>15</b>. Toca ${t('Guardar')} y confirma.`,
      detalle: 'Recibes en presentaciones, no en gramos: 5 bolsas de 1000 g.',
      quePasa: 'Queda la compra <b>CMP-0001</b>. La Harina sube su precio de presentación a 5.50 (unidad base 0.0055), el stock sube 5×1000 = 5000 g y el semáforo deja de estar rojo. Costos al día y faltantes cubiertos.',
      escena: {
        tipo: 'formulario', formulario: 'registrar-compra',
        resaltarIds: ['lineas', 'btnGuardar'],
        valoresEjemplo: { prov_nombre: 'Molinos SAC' },
        titulo: 'Registrar compra',
        campos: [
          { etiqueta: 'Proveedor', tipo: 'select', valor: 'Molinos SAC' },
          { etiqueta: 'Harina · cantidad × precio', tipo: 'numero', valor: '5 × 5.50', resaltado: true },
          { etiqueta: 'Huevo · cantidad × precio', tipo: 'numero', valor: '2 × 15', resaltado: true },
        ],
        boton: 'guardar',
      },
    },
  ],
};

const AJUSTAR: Mision = {
  id: 'f06',
  titulo: 'Ajustar el inventario',
  paraQue: 'Para cuando algo se daña, vence o el conteo real no cuadra con el sistema.',
  pasos: [
    {
      id: 'f06-1',
      titulo: 'Abre el ajuste',
      instruccion: `Abre el menú ${t('Sistema')} y toca ${t('Ajustar inventario')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Ajustar inventario'] },
    },
    {
      id: 'f06-2',
      titulo: 'El insumo y el ajuste',
      instruccion: 'Busca <b>Caja torta</b>. Tipo de ajuste <b>merma</b>, cantidad <b>5</b>, motivo <b>«se dañaron»</b>.',
      detalle: 'Merma, daño y vencimiento sacan stock; devolución lo regresa; conteo lo escribes con signo (un menos para quitar).',
      escena: {
        tipo: 'formulario', formulario: 'ajustar-inventario',
        resaltarIds: ['ins_nombre', 'tipo', 'cantidad', 'motivo'],
        valoresEjemplo: { ins_nombre: 'Caja torta', cantidad: '5', motivo: 'se dañaron' },
        titulo: 'Ajustar inventario',
        campos: [
          { etiqueta: 'Insumo', tipo: 'select', valor: 'Caja torta', resaltado: true },
          { etiqueta: 'Tipo de ajuste', tipo: 'select', valor: 'Merma', resaltado: true },
          { etiqueta: 'Cantidad', tipo: 'numero', valor: '5', resaltado: true },
          { etiqueta: 'Motivo', tipo: 'texto', valor: 'se dañaron' },
        ],
      },
    },
    {
      id: 'f06-3',
      titulo: 'Vista previa y guarda',
      instruccion: `Mira la <b>vista previa</b> (cómo quedan el stock y el semáforo) y toca ${t('Guardar')}.`,
      quePasa: 'Queda registrado en Movimientos con fecha, tipo y motivo, y el stock de Caja torta baja 5. Siempre podrás rastrear por qué el inventario está como está.',
      escena: {
        tipo: 'formulario', formulario: 'ajustar-inventario',
        resaltarIds: ['preview', 'btnGuardar'],
        valoresEjemplo: { ins_nombre: 'Caja torta', cantidad: '5', motivo: 'se dañaron' },
        titulo: 'Ajustar inventario',
        campos: [
          { etiqueta: 'Stock actual', tipo: 'numero', valor: '50' },
          { etiqueta: 'Stock después', tipo: 'numero', valor: '45', resaltado: true },
          { etiqueta: 'Semáforo', tipo: 'texto', valor: 'Verde (45 > 10)' },
        ],
        boton: 'guardar',
      },
    },
  ],
};

const REGLA_EMPAQUE: Mision = {
  id: 'f11',
  titulo: 'Reglas de empaque',
  paraQue: 'Para que el presupuesto sugiera solo el empaque correcto según el tamaño, sin que tengas que acordarte.',
  pasos: [
    {
      id: 'f11-1',
      titulo: 'Abre las reglas',
      instruccion: `Abre el menú ${t('Sistema')}, entra a ${t('Reglas de empaque')} y toca ${t('Nueva regla')}.`,
      escena: { tipo: 'menu', ruta: ['Sistema', 'Reglas de empaque'] },
    },
    {
      id: 'f11-2',
      titulo: 'Receta y tamaño',
      instruccion: 'Receta <b>Torta chocolate</b>, tamaño <b>grande</b>.',
      detalle: 'El desplegable solo muestra los tamaños definidos en Configuración.',
      escena: {
        tipo: 'formulario', formulario: 'reglas-empaque',
        resaltarIds: ['rec_nombre', 'tamano'],
        valoresEjemplo: { rec_nombre: 'Torta chocolate' },
        titulo: 'Nueva regla de empaque',
        campos: [
          { etiqueta: 'Receta', tipo: 'select', valor: 'Torta chocolate', resaltado: true },
          { etiqueta: 'Tamaño', tipo: 'select', valor: 'grande', resaltado: true },
        ],
      },
    },
    {
      id: 'f11-3',
      titulo: 'Empaque y guarda',
      instruccion: `Empaque <b>Caja torta</b>, cantidad <b>1</b>. Toca ${t('Guardar')}.`,
      quePasa: 'Queda la regla <b>RL-0001</b>. Al cotizar Torta chocolate en tamaño grande, el sistema propondrá <b>1 Caja torta</b> automáticamente (con una casilla que puedes desmarcar). ¡Y con esto dominas toda la operación!',
      escena: {
        tipo: 'formulario', formulario: 'reglas-empaque',
        resaltarIds: ['emp_nombre', 'cantidad', 'btnGuardar'],
        valoresEjemplo: { rec_nombre: 'Torta chocolate', emp_nombre: 'Caja torta', cantidad: '1' },
        titulo: 'Nueva regla de empaque',
        campos: [
          { etiqueta: 'Empaque', tipo: 'select', valor: 'Caja torta', resaltado: true },
          { etiqueta: 'Cantidad sugerida', tipo: 'numero', valor: '1', resaltado: true },
        ],
        boton: 'guardar',
      },
    },
  ],
};

/* ============================================================
 * CONTENIDO COMPLETO
 * ============================================================ */

export const CONTENIDO: Nivel[] = [
  {
    id: 'basico',
    titulo: 'Prepara tu negocio',
    lema: 'Instala el sistema y carga lo mínimo para poder vender.',
    orden: 1,
    misiones: [INSTALAR, CONFIGURAR, CLIENTE, INSUMO, RECETA],
  },
  {
    id: 'intermedio',
    titulo: 'Tu primera venta',
    lema: 'El ciclo completo: cotiza, aprueba, entrega y revisa.',
    orden: 2,
    misiones: [COTIZAR, APROBAR, ENTREGAR, RESUMEN],
  },
  {
    id: 'avanzado',
    titulo: 'Domina la operación',
    lema: 'Proveedores, compras, inventario y reglas de empaque.',
    orden: 3,
    misiones: [PROVEEDOR, COMPRAR, AJUSTAR, REGLA_EMPAQUE],
  },
];

/** Todos los pasos en orden global de juego. */
export const PASOS_PLANOS: Paso[] = CONTENIDO.flatMap(n => n.misiones).flatMap(m => m.pasos);

/** Búsquedas frecuentes precalculadas. */
export const MISION_DE_PASO = new Map<string, Mision>(
  CONTENIDO.flatMap(n => n.misiones).flatMap(m => m.pasos.map(p => [p.id, m] as const)),
);
export const NIVEL_DE_MISION = new Map<string, Nivel>(
  CONTENIDO.flatMap(n => n.misiones.map(m => [m.id, n] as const)),
);

export function buscarMision(misionId: string): Mision | undefined {
  return CONTENIDO.flatMap(n => n.misiones).find(m => m.id === misionId);
}
