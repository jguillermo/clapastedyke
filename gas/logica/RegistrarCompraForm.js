// Copia EXACTA del <script> propio de src/RegistrarCompraForm.html. NO editar sin sincronizar.
  var insumos=[], rid=0;

  function cargar(){
    S.call('datosRegistrarCompra', null, function(d){
      insumos=d.insumos||[];
      S.autocomplete(document.getElementById('prov_nombre'), document.getElementById('proveedor_id'),
                     (d.proveedores||[]).map(function(p){ return {id:p.id,nombre:p.nombre}; }));
      addLinea();
    });
    var hoy=new Date(); document.getElementById('fecha').value=hoy.toISOString().slice(0,10);
  }

  function addLinea(){
    rid++;
    var wrap=document.createElement('div'); wrap.className='linea'; wrap.id='l'+rid;
    wrap.innerHTML=
      '<div class="ac"><input placeholder="Buscar insumo..." id="in'+rid+'"><input type="hidden" id="inid'+rid+'">'
      + '<div class="hint" id="hint'+rid+'"></div></div>'
      + '<input type="number" min="0" step="any" placeholder="Present." id="cant'+rid+'">'
      + '<input type="number" min="0" step="any" placeholder="Precio present." id="prec'+rid+'">'
      + '<button class="btn mini no" onclick="this.parentNode.remove()">Quitar</button>';
    document.getElementById('lineas').appendChild(wrap);
    var input=document.getElementById('in'+rid), hid=document.getElementById('inid'+rid), hint=document.getElementById('hint'+rid);
    S.autocomplete(input, hid, insumos.map(function(i){ return {id:i.id,nombre:i.nombre}; }), function(it){
      var full=insumos.filter(function(x){ return String(x.id)===String(it.id); })[0];
      if(full) hint.textContent='Presentación de '+full.tamano_presentacion+' '+full.unidad_base+', último precio '+S.money(full.precio_presentacion);
    });
  }

  function recoger(){
    var res=[];
    Array.prototype.forEach.call(document.querySelectorAll('#lineas .linea'), function(row){
      var idn=row.querySelector('input[type=hidden]').value;
      var nums=row.querySelectorAll('input[type=number]');
      var cant=nums[0].value, prec=nums[1].value;
      if(idn && Number(cant)>0 && Number(prec)>0) res.push({insumo_id:idn, cantidad_recibida_present:cant, precio_presentacion_pagado:prec});
    });
    return res;
  }

  function guardar(){
    var pid=document.getElementById('proveedor_id').value;
    if(!pid){ S.bad(document.getElementById('prov_nombre'),true); S.flash('Elige un proveedor.','err'); return; }
    S.bad(document.getElementById('prov_nombre'),false);
    var lineas=recoger();
    if(!lineas.length){ S.flash('Agrega al menos una línea con cantidad y precio.','err'); return; }
    if(!S.confirmar('¿Guardar esta compra? Subirá el stock y actualizará los precios de los insumos.')) return;
    var btn=document.getElementById('btnGuardar'); btn.disabled=true;
    S.call('registrarCompra', {
      proveedor_id: pid, proveedor_nombre: document.getElementById('prov_nombre').value,
      fecha: document.getElementById('fecha').value, lineas: lineas
    }, function(r){ S.cerrar(); },
       function(e){ btn.disabled=false; S.flash(e.message||String(e),'err'); });
  }

  function limpiar(){
    document.getElementById('lineas').innerHTML=''; addLinea();
  }

  cargar();
