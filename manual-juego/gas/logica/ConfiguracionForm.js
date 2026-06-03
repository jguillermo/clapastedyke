// Copia EXACTA del <script> propio de src/ConfiguracionForm.html. NO editar sin sincronizar.
  // 'aplicar_igv' es una casilla, se trata aparte.
  var campos=['tarifa_mano_obra_hora','costo_indirecto_pedido','depreciacion_pedido','margen_defecto',
              'tasa_igv','redondeo','dias_vencimiento','momento_descuento_stock','nombre_negocio'];

  function cargar(){
    S.call('obtenerConfiguracion',null,function(cfg){
      campos.forEach(function(k){ if(document.getElementById(k)!=null && cfg[k]!=null) document.getElementById(k).value=cfg[k]; });
      document.getElementById('aplicar_igv').checked = (String(cfg.aplicar_igv)==='SI');
    });
  }
  function guardar(){
    var datos={}; campos.forEach(function(k){ datos[k]=document.getElementById(k).value; });
    datos.aplicar_igv = document.getElementById('aplicar_igv').checked ? 'SI' : 'NO';
    if(!datos.nombre_negocio.trim()){ S.bad(document.getElementById('nombre_negocio'),true); S.flash('El nombre del negocio no puede quedar vacio.','err'); return; }
    var btn=document.getElementById('btnGuardar'); btn.disabled=true;
    S.call('guardarConfiguracion',datos,
      function(r){ S.cerrar(); },
      function(e){ btn.disabled=false; S.flash(e.message||String(e),'err'); });
  }
  cargar();
