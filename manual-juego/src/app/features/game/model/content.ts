import { Level, Mission, Step } from './tutorial-types';

/**
 * Content version. If it changes, progress saved in localStorage
 * is discarded (step ids may have changed meaning).
 * Aligned with `appVersion` from the repo root package.json.
 */
export const CONTENT_VERSION = 6;

/* ============================================================
 * BASIC LEVEL — "Prepara tu negocio"
 * ============================================================ */

const INSTALL: Mission = {
  id: 'f12',
  titleKey: 'tutorial.missions.f12.title',
  whyKey: 'tutorial.missions.f12.why',
  steps: [
    {
      id: 'f12-1',
      titleKey: 'tutorial.steps.f12-1.title',
      instructionKey: 'tutorial.steps.f12-1.instruction',
      detailKey: 'tutorial.steps.f12-1.detail',
      hintKey: 'tutorial.steps.f12-1.hint',
      scene: { type: 'menu', menuPath: ['Sistema', 'Mantenimiento', 'Instalar o reparar (todo)'] },
    },
    {
      id: 'f12-2',
      titleKey: 'tutorial.steps.f12-2.title',
      instructionKey: 'tutorial.steps.f12-2.instruction',
      detailKey: 'tutorial.steps.f12-2.detail',
      hintKey: 'tutorial.steps.f12-2.hint',
      scene: { type: 'sheet', tabs: ['Resumen', 'Config', 'Insumos', 'Presupuestos'], toastKey: 'tutorial.toasts.installDone' },
    },
    {
      id: 'f12-3',
      titleKey: 'tutorial.steps.f12-3.title',
      instructionKey: 'tutorial.steps.f12-3.instruction',
      whatHappensKey: 'tutorial.steps.f12-3.whatHappens',
      scene: { type: 'sheet', tabs: ['Resumen', 'Config', 'Insumos', 'Presupuestos', 'Pedidos', 'Clientes', 'Proveedores', 'Recetas'] },
    },
  ],
};

const CONFIGURE: Mission = {
  id: 'f13',
  titleKey: 'tutorial.missions.f13.title',
  whyKey: 'tutorial.missions.f13.why',
  steps: [
    {
      id: 'f13-1',
      titleKey: 'tutorial.steps.f13-1.title',
      instructionKey: 'tutorial.steps.f13-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Configuración'] },
    },
    {
      id: 'f13-2',
      titleKey: 'tutorial.steps.f13-2.title',
      instructionKey: 'tutorial.steps.f13-2.instruction',
      detailKey: 'tutorial.steps.f13-2.detail',
      scene: {
        type: 'form', form: 'configuracion',
        highlightIds: ['tarifa_mano_obra_hora'],
        sampleValues: { tarifa_mano_obra_hora: '10' },
        title: 'Configuración',
        fields: [{ labelKey: 'tutorial.fields.laborRatePerHour', kind: 'number', value: '10', highlighted: true }],
      },
    },
    {
      id: 'f13-3',
      titleKey: 'tutorial.steps.f13-3.title',
      instructionKey: 'tutorial.steps.f13-3.instruction',
      scene: {
        type: 'form', form: 'configuracion',
        highlightIds: ['costo_indirecto_pedido', 'depreciacion_pedido'],
        sampleValues: { tarifa_mano_obra_hora: '10', costo_indirecto_pedido: '3', depreciacion_pedido: '2' },
        title: 'Configuración',
        fields: [
          { labelKey: 'tutorial.fields.indirectCostPerOrder', kind: 'number', value: '3', highlighted: true },
          { labelKey: 'tutorial.fields.depreciationPerOrder', kind: 'number', value: '2', highlighted: true },
        ],
      },
    },
    {
      id: 'f13-4',
      titleKey: 'tutorial.steps.f13-4.title',
      instructionKey: 'tutorial.steps.f13-4.instruction',
      detailKey: 'tutorial.steps.f13-4.detail',
      scene: {
        type: 'form', form: 'configuracion',
        highlightIds: ['margen_defecto'],
        sampleValues: { margen_defecto: '30' },
        title: 'Configuración',
        fields: [{ labelKey: 'tutorial.fields.defaultMargin', kind: 'number', value: '30', highlighted: true }],
      },
    },
    {
      id: 'f13-5',
      titleKey: 'tutorial.steps.f13-5.title',
      instructionKey: 'tutorial.steps.f13-5.instruction',
      scene: {
        type: 'form', form: 'configuracion',
        highlightIds: ['aplicar_igv', 'tasa_igv', 'redondeo'],
        sampleValues: { tasa_igv: '18' },
        title: 'Configuración',
        fields: [
          { labelKey: 'tutorial.fields.applyIgv', kind: 'check', value: 'Sí', highlighted: true },
          { labelKey: 'tutorial.fields.igvRate', kind: 'number', value: '18' },
          { labelKey: 'tutorial.fields.rounding', kind: 'select', value: 'Múltiplo de 5', highlighted: true },
        ],
      },
    },
    {
      id: 'f13-6',
      titleKey: 'tutorial.steps.f13-6.title',
      instructionKey: 'tutorial.steps.f13-6.instruction',
      detailKey: 'tutorial.steps.f13-6.detail',
      scene: {
        type: 'form', form: 'configuracion',
        highlightIds: ['dias_vencimiento', 'momento_descuento_stock'],
        sampleValues: { dias_vencimiento: '7' },
        title: 'Configuración',
        fields: [
          { labelKey: 'tutorial.fields.expiryDays', kind: 'number', value: '7', highlighted: true },
          { labelKey: 'tutorial.fields.stockDiscount', kind: 'select', value: 'APROBAR', highlighted: true },
        ],
      },
    },
    {
      id: 'f13-7',
      titleKey: 'tutorial.steps.f13-7.title',
      instructionKey: 'tutorial.steps.f13-7.instruction',
      detailKey: 'tutorial.steps.f13-7.detail',
      scene: {
        type: 'form', title: 'Configuración',
        fields: [
          { labelKey: 'tutorial.fields.sizeSmallFactor', kind: 'number', value: '0.5', highlighted: true },
          { labelKey: 'tutorial.fields.sizeMediumFactor', kind: 'number', value: '1', highlighted: true },
          { labelKey: 'tutorial.fields.sizeLargeFactor', kind: 'number', value: '2', highlighted: true },
        ],
      },
    },
    {
      id: 'f13-8',
      titleKey: 'tutorial.steps.f13-8.title',
      instructionKey: 'tutorial.steps.f13-8.instruction',
      whatHappensKey: 'tutorial.steps.f13-8.whatHappens',
      scene: {
        type: 'form', form: 'configuracion',
        highlightIds: ['nombre_negocio', 'btnGuardar'],
        sampleValues: { nombre_negocio: 'Dulces Misa' },
        title: 'Configuración',
        fields: [{ labelKey: 'tutorial.fields.businessName', kind: 'text', value: 'Dulces Misa', highlighted: true }],
        button: 'save',
      },
    },
  ],
};

const CUSTOMER: Mission = {
  id: 'f07',
  titleKey: 'tutorial.missions.f07.title',
  whyKey: 'tutorial.missions.f07.why',
  steps: [
    {
      id: 'f07-1',
      titleKey: 'tutorial.steps.f07-1.title',
      instructionKey: 'tutorial.steps.f07-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Clientes'] },
    },
    {
      id: 'f07-2',
      titleKey: 'tutorial.steps.f07-2.title',
      instructionKey: 'tutorial.steps.f07-2.instruction',
      detailKey: 'tutorial.steps.f07-2.detail',
      scene: {
        type: 'form', form: 'clientes',
        highlightIds: ['nombre'],
        sampleValues: { nombre: 'Ana Torres' },
      },
    },
    {
      id: 'f07-3',
      titleKey: 'tutorial.steps.f07-3.title',
      instructionKey: 'tutorial.steps.f07-3.instruction',
      scene: {
        type: 'form', form: 'clientes',
        highlightIds: ['telefono', 'notas'],
        sampleValues: { nombre: 'Ana Torres', telefono: '999000111' },
      },
    },
    {
      id: 'f07-4',
      titleKey: 'tutorial.steps.f07-4.title',
      instructionKey: 'tutorial.steps.f07-4.instruction',
      whatHappensKey: 'tutorial.steps.f07-4.whatHappens',
      scene: {
        type: 'form', form: 'clientes',
        highlightIds: ['btnGuardar'],
        sampleValues: { nombre: 'Ana Torres', telefono: '999000111' },
        button: 'save',
      },
    },
  ],
};

const SUPPLY: Mission = {
  id: 'f08',
  titleKey: 'tutorial.missions.f08.title',
  whyKey: 'tutorial.missions.f08.why',
  steps: [
    {
      id: 'f08-1',
      titleKey: 'tutorial.steps.f08-1.title',
      instructionKey: 'tutorial.steps.f08-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Insumos'] },
    },
    {
      id: 'f08-2',
      titleKey: 'tutorial.steps.f08-2.title',
      instructionKey: 'tutorial.steps.f08-2.instruction',
      detailKey: 'tutorial.steps.f08-2.detail',
      scene: {
        type: 'form', form: 'insumos',
        highlightIds: ['nombre', 'tamano_presentacion', 'precio_presentacion', 'stock_minimo', 'btnGuardar'],
        sampleValues: { nombre: 'Harina', tamano_presentacion: '1000', precio_presentacion: '5', stock_minimo: '2000' },
        title: 'Nuevo insumo',
        fields: [
          { labelKey: 'tutorial.fields.name', kind: 'text', value: 'Harina', highlighted: true },
          { labelKey: 'tutorial.fields.type', kind: 'select', value: 'Ingrediente' },
          { labelKey: 'tutorial.fields.unit', kind: 'select', value: 'gramos' },
          { labelKey: 'tutorial.fields.presentation', kind: 'number', value: '1000', highlighted: true },
          { labelKey: 'tutorial.fields.price', kind: 'number', value: '5', highlighted: true },
          { labelKey: 'tutorial.fields.minStock', kind: 'number', value: '2000' },
        ],
        button: 'save',
      },
    },
    {
      id: 'f08-3',
      titleKey: 'tutorial.steps.f08-3.title',
      instructionKey: 'tutorial.steps.f08-3.instruction',
      detailKey: 'tutorial.steps.f08-3.detail',
      scene: {
        type: 'form', form: 'insumos',
        highlightIds: ['nombre', 'tamano_presentacion', 'precio_presentacion', 'stock_minimo', 'btnGuardar'],
        sampleValues: { nombre: 'Huevo', tamano_presentacion: '30', precio_presentacion: '15', stock_minimo: '30' },
        title: 'Nuevo insumo',
        fields: [
          { labelKey: 'tutorial.fields.name', kind: 'text', value: 'Huevo', highlighted: true },
          { labelKey: 'tutorial.fields.type', kind: 'select', value: 'Ingrediente' },
          { labelKey: 'tutorial.fields.presentation', kind: 'number', value: '30', highlighted: true },
          { labelKey: 'tutorial.fields.price', kind: 'number', value: '15', highlighted: true },
          { labelKey: 'tutorial.fields.minStock', kind: 'number', value: '30' },
        ],
        button: 'save',
      },
    },
    {
      id: 'f08-4',
      titleKey: 'tutorial.steps.f08-4.title',
      instructionKey: 'tutorial.steps.f08-4.instruction',
      whatHappensKey: 'tutorial.steps.f08-4.whatHappens',
      scene: {
        type: 'form', form: 'insumos',
        highlightIds: ['nombre', 'tipo', 'btnGuardar'],
        sampleValues: { nombre: 'Caja torta', tamano_presentacion: '25', precio_presentacion: '25', stock_inicial: '50', stock_minimo: '10' },
        title: 'Nuevo insumo',
        fields: [
          { labelKey: 'tutorial.fields.name', kind: 'text', value: 'Caja torta', highlighted: true },
          { labelKey: 'tutorial.fields.type', kind: 'select', value: 'Empaque', highlighted: true },
          { labelKey: 'tutorial.fields.presentation', kind: 'number', value: '25' },
          { labelKey: 'tutorial.fields.price', kind: 'number', value: '25' },
          { labelKey: 'tutorial.fields.initialStock', kind: 'number', value: '50' },
          { labelKey: 'tutorial.fields.minStock', kind: 'number', value: '10' },
        ],
        button: 'save',
      },
    },
  ],
};

const RECIPE: Mission = {
  id: 'f10',
  titleKey: 'tutorial.missions.f10.title',
  whyKey: 'tutorial.missions.f10.why',
  steps: [
    {
      id: 'f10-1',
      titleKey: 'tutorial.steps.f10-1.title',
      instructionKey: 'tutorial.steps.f10-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Recetas'] },
    },
    {
      id: 'f10-2',
      titleKey: 'tutorial.steps.f10-2.title',
      instructionKey: 'tutorial.steps.f10-2.instruction',
      scene: {
        type: 'form', form: 'recetas',
        highlightIds: ['nombre', 'categoria'],
        sampleValues: { nombre: 'Torta chocolate', categoria: 'tortas' },
        title: 'Nueva receta',
        fields: [
          { labelKey: 'tutorial.fields.name', kind: 'text', value: 'Torta chocolate', highlighted: true },
          { labelKey: 'tutorial.fields.category', kind: 'text', value: 'tortas', highlighted: true },
        ],
      },
    },
    {
      id: 'f10-3',
      titleKey: 'tutorial.steps.f10-3.title',
      instructionKey: 'tutorial.steps.f10-3.instruction',
      detailKey: 'tutorial.steps.f10-3.detail',
      scene: {
        type: 'form', form: 'recetas',
        highlightIds: ['tipo_base', 'raciones_base'],
        sampleValues: { nombre: 'Torta chocolate', categoria: 'tortas', raciones_base: '10' },
        title: 'Nueva receta',
        fields: [
          { labelKey: 'tutorial.fields.baseType', kind: 'select', value: 'Por personas', highlighted: true },
          { labelKey: 'tutorial.fields.base', kind: 'number', value: '10', highlighted: true },
        ],
      },
    },
    {
      id: 'f10-4',
      titleKey: 'tutorial.steps.f10-4.title',
      instructionKey: 'tutorial.steps.f10-4.instruction',
      detailKey: 'tutorial.steps.f10-4.detail',
      scene: {
        type: 'form', form: 'recetas',
        highlightIds: ['tiempo'],
        sampleValues: { nombre: 'Torta chocolate', categoria: 'tortas', raciones_base: '10', tiempo: '2' },
        title: 'Nueva receta',
        fields: [{ labelKey: 'tutorial.fields.laborHours', kind: 'number', value: '2', highlighted: true }],
      },
    },
    {
      id: 'f10-5',
      titleKey: 'tutorial.steps.f10-5.title',
      instructionKey: 'tutorial.steps.f10-5.instruction',
      hintKey: 'tutorial.steps.f10-5.hint',
      scene: {
        type: 'form', form: 'recetas',
        highlightIds: ['ings'],
        sampleValues: { nombre: 'Torta chocolate', categoria: 'tortas', raciones_base: '10', tiempo: '2' },
        title: 'Nueva receta',
        fields: [
          { labelKey: 'tutorial.fields.ingredientFlourQty', kind: 'number', value: '300', highlighted: true },
          { labelKey: 'tutorial.fields.ingredientEggQty', kind: 'number', value: '4', highlighted: true },
        ],
      },
    },
    {
      id: 'f10-6',
      titleKey: 'tutorial.steps.f10-6.title',
      instructionKey: 'tutorial.steps.f10-6.instruction',
      whatHappensKey: 'tutorial.steps.f10-6.whatHappens',
      scene: {
        type: 'form', form: 'recetas',
        highlightIds: ['btnGuardar'],
        sampleValues: { nombre: 'Torta chocolate', categoria: 'tortas', raciones_base: '10', tiempo: '2' },
        title: 'Nueva receta',
        fields: [
          { labelKey: 'tutorial.fields.name', kind: 'text', value: 'Torta chocolate' },
          { labelKey: 'tutorial.fields.base', kind: 'number', value: '10 personas' },
        ],
        button: 'save',
      },
    },
  ],
};

/* ============================================================
 * INTERMEDIATE LEVEL — "Tu primera venta"
 * ============================================================ */

const QUOTE: Mission = {
  id: 'f01',
  titleKey: 'tutorial.missions.f01.title',
  whyKey: 'tutorial.missions.f01.why',
  steps: [
    {
      id: 'f01-1',
      titleKey: 'tutorial.steps.f01-1.title',
      instructionKey: 'tutorial.steps.f01-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Nuevo presupuesto'] },
    },
    {
      id: 'f01-2',
      titleKey: 'tutorial.steps.f01-2.title',
      instructionKey: 'tutorial.steps.f01-2.instruction',
      hintKey: 'tutorial.steps.f01-2.hint',
      scene: {
        type: 'form', form: 'nuevo-presupuesto',
        highlightIds: ['cli_nombre'],
        sampleValues: { cli_nombre: 'Ana Torres' },
        title: 'Nuevo presupuesto',
        fields: [{ labelKey: 'tutorial.fields.customer', kind: 'select', value: 'Ana Torres', highlighted: true }],
      },
    },
    {
      id: 'f01-3',
      titleKey: 'tutorial.steps.f01-3.title',
      instructionKey: 'tutorial.steps.f01-3.instruction',
      detailKey: 'tutorial.steps.f01-3.detail',
      scene: {
        type: 'form', form: 'nuevo-presupuesto',
        highlightIds: ['rec_nombre'],
        sampleValues: { cli_nombre: 'Ana Torres', rec_nombre: 'Torta chocolate' },
        title: 'Nuevo presupuesto',
        fields: [
          { labelKey: 'tutorial.fields.customer', kind: 'select', value: 'Ana Torres' },
          { labelKey: 'tutorial.fields.recipe', kind: 'select', value: 'Torta chocolate', highlighted: true },
          { labelKey: 'tutorial.fields.scalingMode', kind: 'select', value: 'Por personas' },
        ],
      },
    },
    {
      id: 'f01-4',
      titleKey: 'tutorial.steps.f01-4.title',
      instructionKey: 'tutorial.steps.f01-4.instruction',
      detailKey: 'tutorial.steps.f01-4.detail',
      scene: {
        type: 'form', form: 'nuevo-presupuesto',
        highlightIds: ['raciones', 'tablaIng'],
        sampleValues: { cli_nombre: 'Ana Torres', rec_nombre: 'Torta chocolate', raciones: '20' },
        title: 'Nuevo presupuesto',
        fields: [
          { labelKey: 'tutorial.fields.people', kind: 'number', value: '20', highlighted: true },
          { labelKey: 'tutorial.fields.flourScaled', kind: 'number', value: '600 g' },
          { labelKey: 'tutorial.fields.eggScaled', kind: 'number', value: '8 u' },
        ],
      },
    },
    {
      id: 'f01-5',
      titleKey: 'tutorial.steps.f01-5.title',
      instructionKey: 'tutorial.steps.f01-5.instruction',
      detailKey: 'tutorial.steps.f01-5.detail',
      scene: {
        type: 'form', form: 'nuevo-presupuesto',
        highlightIds: ['modo', 'tamano', 'materiales'],
        sampleValues: { cli_nombre: 'Ana Torres', rec_nombre: 'Torta chocolate' },
        title: 'Nuevo presupuesto',
        fields: [
          { labelKey: 'tutorial.fields.scalingMode', kind: 'select', value: 'Por tamaño', highlighted: true },
          { labelKey: 'tutorial.fields.size', kind: 'select', value: 'grande', highlighted: true },
          { labelKey: 'tutorial.fields.suggestedPackagingCajaTorta', kind: 'check', value: 'Sí' },
        ],
      },
    },
    {
      id: 'f01-6',
      titleKey: 'tutorial.steps.f01-6.title',
      instructionKey: 'tutorial.steps.f01-6.instruction',
      detailKey: 'tutorial.steps.f01-6.detail',
      scene: {
        type: 'form', form: 'nuevo-presupuesto',
        highlightIds: ['margen', 'aplica_igv', 't_final'],
        sampleValues: { cli_nombre: 'Ana Torres', rec_nombre: 'Torta chocolate', margen: '30' },
        title: 'Nuevo presupuesto',
        fields: [
          { labelKey: 'tutorial.fields.margin', kind: 'number', value: '30', highlighted: true },
          { labelKey: 'tutorial.fields.applyIgv', kind: 'check', value: 'Sí', highlighted: true },
          { labelKey: 'tutorial.fields.finalPrice', kind: 'number', value: '95' },
        ],
      },
    },
    {
      id: 'f01-7',
      titleKey: 'tutorial.steps.f01-7.title',
      instructionKey: 'tutorial.steps.f01-7.instruction',
      whatHappensKey: 'tutorial.steps.f01-7.whatHappens',
      scene: {
        type: 'form', form: 'nuevo-presupuesto',
        highlightIds: ['notas', 'btnGuardar'],
        sampleValues: { cli_nombre: 'Ana Torres', rec_nombre: 'Torta chocolate', margen: '30' },
        title: 'Nuevo presupuesto',
        fields: [
          { labelKey: 'tutorial.fields.notes', kind: 'text', value: 'Entrega sábado' },
          { labelKey: 'tutorial.fields.finalPrice', kind: 'number', value: '95' },
        ],
        button: 'save',
      },
    },
  ],
};

const APPROVE: Mission = {
  id: 'f02',
  titleKey: 'tutorial.missions.f02.title',
  whyKey: 'tutorial.missions.f02.why',
  steps: [
    {
      id: 'f02-1',
      titleKey: 'tutorial.steps.f02-1.title',
      instructionKey: 'tutorial.steps.f02-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Ver presupuestos'] },
    },
    {
      id: 'f02-2',
      titleKey: 'tutorial.steps.f02-2.title',
      instructionKey: 'tutorial.steps.f02-2.instruction',
      detailKey: 'tutorial.steps.f02-2.detail',
      scene: {
        type: 'form', form: 'detalle-presupuesto',
        highlightIds: ['cuerpo'],
        title: 'Presupuesto P-0001',
        fields: [
          { labelKey: 'tutorial.fields.status', kind: 'text', value: 'Pendiente' },
          { labelKey: 'tutorial.fields.shortageFlour', kind: 'text', value: '−600 g', highlighted: true },
          { labelKey: 'tutorial.fields.shortageEgg', kind: 'text', value: '−8 u', highlighted: true },
        ],
      },
    },
    {
      id: 'f02-3',
      titleKey: 'tutorial.steps.f02-3.title',
      instructionKey: 'tutorial.steps.f02-3.instruction',
      whatHappensKey: 'tutorial.steps.f02-3.whatHappens',
      hintKey: 'tutorial.steps.f02-3.hint',
      scene: {
        type: 'form', form: 'detalle-presupuesto',
        highlightIds: ['pie'],
        title: 'Presupuesto P-0001',
        fields: [
          { labelKey: 'tutorial.fields.status', kind: 'text', value: 'Pendiente' },
          { labelKey: 'tutorial.fields.finalPrice', kind: 'number', value: '95' },
        ],
        button: 'save',
      },
    },
  ],
};

const DELIVER: Mission = {
  id: 'f03',
  titleKey: 'tutorial.missions.f03.title',
  whyKey: 'tutorial.missions.f03.why',
  steps: [
    {
      id: 'f03-1',
      titleKey: 'tutorial.steps.f03-1.title',
      instructionKey: 'tutorial.steps.f03-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Ver pedidos'] },
    },
    {
      id: 'f03-2',
      titleKey: 'tutorial.steps.f03-2.title',
      instructionKey: 'tutorial.steps.f03-2.instruction',
      detailKey: 'tutorial.steps.f03-2.detail',
      whatHappensKey: 'tutorial.steps.f03-2.whatHappens',
      scene: {
        type: 'form', form: 'detalle-pedido',
        highlightIds: ['pie'],
        title: 'Pedido PD-0001',
        fields: [
          { labelKey: 'tutorial.fields.status', kind: 'text', value: 'Pendiente', highlighted: true },
          { labelKey: 'tutorial.fields.customer', kind: 'text', value: 'Ana Torres' },
        ],
        button: 'save',
      },
    },
    {
      id: 'f03-3',
      titleKey: 'tutorial.steps.f03-3.title',
      instructionKey: 'tutorial.steps.f03-3.instruction',
      whatHappensKey: 'tutorial.steps.f03-3.whatHappens',
      scene: {
        type: 'form', form: 'detalle-pedido',
        highlightIds: ['pie'],
        title: 'Pedido PD-0001',
        fields: [
          { labelKey: 'tutorial.fields.status', kind: 'text', value: 'Producción', highlighted: true },
          { labelKey: 'tutorial.fields.customer', kind: 'text', value: 'Ana Torres' },
        ],
        button: 'save',
      },
    },
  ],
};

const OVERVIEW: Mission = {
  id: 'f04',
  titleKey: 'tutorial.missions.f04.title',
  whyKey: 'tutorial.missions.f04.why',
  steps: [
    {
      id: 'f04-1',
      titleKey: 'tutorial.steps.f04-1.title',
      instructionKey: 'tutorial.steps.f04-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Ir al Resumen'] },
    },
    {
      id: 'f04-2',
      titleKey: 'tutorial.steps.f04-2.title',
      instructionKey: 'tutorial.steps.f04-2.instruction',
      whatHappensKey: 'tutorial.steps.f04-2.whatHappens',
      scene: { type: 'sheet', tabs: ['Resumen', 'Config', 'Insumos', 'Presupuestos', 'Pedidos'], toastKey: 'tutorial.toasts.overviewStatus' },
    },
  ],
};

/* ============================================================
 * ADVANCED LEVEL — "Domina la operación"
 * ============================================================ */

const SUPPLIER: Mission = {
  id: 'f09',
  titleKey: 'tutorial.missions.f09.title',
  whyKey: 'tutorial.missions.f09.why',
  steps: [
    {
      id: 'f09-1',
      titleKey: 'tutorial.steps.f09-1.title',
      instructionKey: 'tutorial.steps.f09-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Proveedores'] },
    },
    {
      id: 'f09-2',
      titleKey: 'tutorial.steps.f09-2.title',
      instructionKey: 'tutorial.steps.f09-2.instruction',
      detailKey: 'tutorial.steps.f09-2.detail',
      scene: {
        type: 'form', form: 'proveedores',
        highlightIds: ['nombre'],
        sampleValues: { nombre: 'Molinos SAC' },
        title: 'Nuevo proveedor',
        fields: [{ labelKey: 'tutorial.fields.name', kind: 'text', value: 'Molinos SAC', highlighted: true }],
      },
    },
    {
      id: 'f09-3',
      titleKey: 'tutorial.steps.f09-3.title',
      instructionKey: 'tutorial.steps.f09-3.instruction',
      detailKey: 'tutorial.steps.f09-3.detail',
      scene: {
        type: 'form', form: 'proveedores',
        highlightIds: ['whatsapp'],
        sampleValues: { nombre: 'Molinos SAC', whatsapp: '51999111222' },
        title: 'Nuevo proveedor',
        fields: [
          { labelKey: 'tutorial.fields.name', kind: 'text', value: 'Molinos SAC' },
          { labelKey: 'tutorial.fields.whatsapp', kind: 'text', value: '51999111222', highlighted: true },
        ],
      },
    },
    {
      id: 'f09-4',
      titleKey: 'tutorial.steps.f09-4.title',
      instructionKey: 'tutorial.steps.f09-4.instruction',
      whatHappensKey: 'tutorial.steps.f09-4.whatHappens',
      scene: {
        type: 'form', form: 'proveedores',
        highlightIds: ['btnGuardar'],
        sampleValues: { nombre: 'Molinos SAC', whatsapp: '51999111222' },
        title: 'Nuevo proveedor',
        fields: [
          { labelKey: 'tutorial.fields.name', kind: 'text', value: 'Molinos SAC' },
          { labelKey: 'tutorial.fields.whatsapp', kind: 'text', value: '51999111222' },
        ],
        button: 'save',
      },
    },
  ],
};

const BUY: Mission = {
  id: 'f05',
  titleKey: 'tutorial.missions.f05.title',
  whyKey: 'tutorial.missions.f05.why',
  steps: [
    {
      id: 'f05-1',
      titleKey: 'tutorial.steps.f05-1.title',
      instructionKey: 'tutorial.steps.f05-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Comprar materiales'] },
    },
    {
      id: 'f05-2',
      titleKey: 'tutorial.steps.f05-2.title',
      instructionKey: 'tutorial.steps.f05-2.instruction',
      detailKey: 'tutorial.steps.f05-2.detail',
      scene: {
        type: 'form', form: 'comprar-materiales',
        highlightIds: ['modo', 'pedido'],
        title: 'Comprar materiales',
        fields: [
          { labelKey: 'tutorial.fields.mode', kind: 'select', value: 'Automático (por pedido)', highlighted: true },
          { labelKey: 'tutorial.fields.order', kind: 'select', value: 'PD-0001', highlighted: true },
          { labelKey: 'tutorial.fields.shortages', kind: 'text', value: 'Harina · Huevo' },
        ],
      },
    },
    {
      id: 'f05-3',
      titleKey: 'tutorial.steps.f05-3.title',
      instructionKey: 'tutorial.steps.f05-3.instruction',
      detailKey: 'tutorial.steps.f05-3.detail',
      whatHappensKey: 'tutorial.steps.f05-3.whatHappens',
      scene: {
        type: 'form', form: 'comprar-materiales',
        highlightIds: ['resultado'],
        title: 'Comprar materiales',
        fields: [
          { labelKey: 'tutorial.fields.supplier', kind: 'text', value: 'Molinos SAC' },
          { labelKey: 'tutorial.fields.message', kind: 'text', value: 'Hola, ¿tienes harina y…' },
        ],
        button: 'save',
      },
    },
    {
      id: 'f05-4',
      titleKey: 'tutorial.steps.f05-4.title',
      instructionKey: 'tutorial.steps.f05-4.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Registrar compra'] },
    },
    {
      id: 'f05-5',
      titleKey: 'tutorial.steps.f05-5.title',
      instructionKey: 'tutorial.steps.f05-5.instruction',
      detailKey: 'tutorial.steps.f05-5.detail',
      whatHappensKey: 'tutorial.steps.f05-5.whatHappens',
      scene: {
        type: 'form', form: 'registrar-compra',
        highlightIds: ['lineas', 'btnGuardar'],
        sampleValues: { prov_nombre: 'Molinos SAC' },
        title: 'Registrar compra',
        fields: [
          { labelKey: 'tutorial.fields.supplier', kind: 'select', value: 'Molinos SAC' },
          { labelKey: 'tutorial.fields.flourQtyTimesPrice', kind: 'number', value: '5 × 5.50', highlighted: true },
          { labelKey: 'tutorial.fields.eggQtyTimesPrice', kind: 'number', value: '2 × 15', highlighted: true },
        ],
        button: 'save',
      },
    },
  ],
};

const ADJUST: Mission = {
  id: 'f06',
  titleKey: 'tutorial.missions.f06.title',
  whyKey: 'tutorial.missions.f06.why',
  steps: [
    {
      id: 'f06-1',
      titleKey: 'tutorial.steps.f06-1.title',
      instructionKey: 'tutorial.steps.f06-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Ajustar inventario'] },
    },
    {
      id: 'f06-2',
      titleKey: 'tutorial.steps.f06-2.title',
      instructionKey: 'tutorial.steps.f06-2.instruction',
      detailKey: 'tutorial.steps.f06-2.detail',
      scene: {
        type: 'form', form: 'ajustar-inventario',
        highlightIds: ['ins_nombre', 'tipo', 'cantidad', 'motivo'],
        sampleValues: { ins_nombre: 'Caja torta', cantidad: '5', motivo: 'se dañaron' },
        title: 'Ajustar inventario',
        fields: [
          { labelKey: 'tutorial.fields.supply', kind: 'select', value: 'Caja torta', highlighted: true },
          { labelKey: 'tutorial.fields.adjustmentType', kind: 'select', value: 'Merma', highlighted: true },
          { labelKey: 'tutorial.fields.quantity', kind: 'number', value: '5', highlighted: true },
          { labelKey: 'tutorial.fields.reason', kind: 'text', value: 'se dañaron' },
        ],
      },
    },
    {
      id: 'f06-3',
      titleKey: 'tutorial.steps.f06-3.title',
      instructionKey: 'tutorial.steps.f06-3.instruction',
      whatHappensKey: 'tutorial.steps.f06-3.whatHappens',
      scene: {
        type: 'form', form: 'ajustar-inventario',
        highlightIds: ['preview', 'btnGuardar'],
        sampleValues: { ins_nombre: 'Caja torta', cantidad: '5', motivo: 'se dañaron' },
        title: 'Ajustar inventario',
        fields: [
          { labelKey: 'tutorial.fields.currentStock', kind: 'number', value: '50' },
          { labelKey: 'tutorial.fields.stockAfter', kind: 'number', value: '45', highlighted: true },
          { labelKey: 'tutorial.fields.semaphore', kind: 'text', value: 'Verde (45 > 10)' },
        ],
        button: 'save',
      },
    },
  ],
};

const PACKAGING_RULE: Mission = {
  id: 'f11',
  titleKey: 'tutorial.missions.f11.title',
  whyKey: 'tutorial.missions.f11.why',
  steps: [
    {
      id: 'f11-1',
      titleKey: 'tutorial.steps.f11-1.title',
      instructionKey: 'tutorial.steps.f11-1.instruction',
      scene: { type: 'menu', menuPath: ['Sistema', 'Reglas de empaque'] },
    },
    {
      id: 'f11-2',
      titleKey: 'tutorial.steps.f11-2.title',
      instructionKey: 'tutorial.steps.f11-2.instruction',
      detailKey: 'tutorial.steps.f11-2.detail',
      scene: {
        type: 'form', form: 'reglas-empaque',
        highlightIds: ['rec_nombre', 'tamano'],
        sampleValues: { rec_nombre: 'Torta chocolate' },
        title: 'Nueva regla de empaque',
        fields: [
          { labelKey: 'tutorial.fields.recipe', kind: 'select', value: 'Torta chocolate', highlighted: true },
          { labelKey: 'tutorial.fields.size', kind: 'select', value: 'grande', highlighted: true },
        ],
      },
    },
    {
      id: 'f11-3',
      titleKey: 'tutorial.steps.f11-3.title',
      instructionKey: 'tutorial.steps.f11-3.instruction',
      whatHappensKey: 'tutorial.steps.f11-3.whatHappens',
      scene: {
        type: 'form', form: 'reglas-empaque',
        highlightIds: ['emp_nombre', 'cantidad', 'btnGuardar'],
        sampleValues: { rec_nombre: 'Torta chocolate', emp_nombre: 'Caja torta', cantidad: '1' },
        title: 'Nueva regla de empaque',
        fields: [
          { labelKey: 'tutorial.fields.packaging', kind: 'select', value: 'Caja torta', highlighted: true },
          { labelKey: 'tutorial.fields.suggestedQuantity', kind: 'number', value: '1', highlighted: true },
        ],
        button: 'save',
      },
    },
  ],
};

/* ============================================================
 * FULL CONTENT
 * ============================================================ */

export const CONTENT: Level[] = [
  {
    id: 'basic',
    titleKey: 'tutorial.levels.basic.title',
    mottoKey: 'tutorial.levels.basic.motto',
    order: 1,
    missions: [INSTALL, CONFIGURE, CUSTOMER, SUPPLY, RECIPE],
  },
  {
    id: 'intermediate',
    titleKey: 'tutorial.levels.intermediate.title',
    mottoKey: 'tutorial.levels.intermediate.motto',
    order: 2,
    missions: [QUOTE, APPROVE, DELIVER, OVERVIEW],
  },
  {
    id: 'advanced',
    titleKey: 'tutorial.levels.advanced.title',
    mottoKey: 'tutorial.levels.advanced.motto',
    order: 3,
    missions: [SUPPLIER, BUY, ADJUST, PACKAGING_RULE],
  },
];

/** All steps in global game order. */
export const FLAT_STEPS: Step[] = CONTENT.flatMap(l => l.missions).flatMap(m => m.steps);

/** Frequently used lookups, precomputed. */
export const MISSION_OF_STEP = new Map<string, Mission>(
  CONTENT.flatMap(l => l.missions).flatMap(m => m.steps.map(s => [s.id, m] as const)),
);
export const LEVEL_OF_MISSION = new Map<string, Level>(
  CONTENT.flatMap(l => l.missions.map(m => [m.id, l] as const)),
);

export function findMission(missionId: string): Mission | undefined {
  return CONTENT.flatMap(l => l.missions).find(m => m.id === missionId);
}
