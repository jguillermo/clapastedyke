// Copia EXACTA del <script> propio de src/InsumosForm.html. NO editar sin sincronizar.
  var datos=[], proveedores=[];

  function recalc(){
    var t=Number(document.getElementById('tamano_presentacion').value)||0;
    var p=Number(document.getElementById('precio_presentacion').value)||0;
    document.getElementById('ppu').value = S.num4(t>0?p/t:0);
    document.getElementById('uLbl').textContent = (document.getElementById('unidad_base').value==='u')?'unidad':'gramo';
  }
  function cargar(){
    S.call('listarInsumos',null,function(r){ datos=r||[]; pintar(); });
    S.call('catalogoProveedores',null,function(r){
      proveedores=(r||[]).map(function(p){ return {id:p.id,nombre:p.nombre}; });
      S.autocomplete(document.getElementById('prov_nombre'),
                     document.getElementById('proveedor_recomendado_id'), proveedores);
    });
  }
  function pintar(){
    var c=document.getElementById('lista');
    if(!datos.length){ c.innerHTML='<div class="empty">Aun no hay insumos.</div>'; return; }
    var f='<table class="t"><tr><th>Insumo</th><th>Tipo</th><th class="n">P. unitario</th>'
        + '<th class="n">Stock</th><th class="n">Minimo</th><th></th></tr>';
    datos.forEach(function(d){
      f+='<tr><td><span class="dot '+d.semaforo+'"></span>'+S.esc(d.nombre)+'</td>'
       + '<td>'+S.esc(d.tipo)+'</td>'
       + '<td class="n">'+S.num4(d.precio_por_unidad_base)+'</td>'
       + '<td class="n">'+d.stock_actual+' '+S.esc(d.unidad_base)+'</td>'
       + '<td class="n">'+d.stock_minimo+'</td>'
       + '<td class="n"><button class="btn mini" onclick="editar(\''+d.id+'\')">Editar</button></td></tr>';
    });
    c.innerHTML=f+'</table>';
  }
  function nuevo(){
    document.getElementById('id').value='';
    document.getElementById('nombre').value='';
    document.getElementById('tipo').value='ingrediente';
    document.getElementById('unidad_base').value='g';
    document.getElementById('tamano_presentacion').value='';
    document.getElementById('precio_presentacion').value='';
    document.getElementById('stock_inicial').value='';
    document.getElementById('stock_minimo').value='';
    document.getElementById('prov_nombre').value='';
    document.getElementById('proveedor_recomendado_id').value='';
    document.getElementById('formTitulo').textContent='Nuevo insumo';
    document.getElementById('boxStockIni').style.display='';
    document.getElementById('notaEdicion').style.display='none';
    recalc(); document.getElementById('nombre').focus();
  }
  function editar(id){
    var d=datos.filter(function(x){ return String(x.id)===String(id); })[0]; if(!d) return;
    document.getElementById('id').value=d.id;
    document.getElementById('nombre').value=d.nombre||'';
    document.getElementById('tipo').value=d.tipo||'ingrediente';
    document.getElementById('unidad_base').value=d.unidad_base||'g';
    document.getElementById('tamano_presentacion').value=d.tamano_presentacion||'';
    document.getElementById('precio_presentacion').value=d.precio_presentacion||'';
    document.getElementById('stock_minimo').value=d.stock_minimo||'';
    document.getElementById('proveedor_recomendado_id').value=d.proveedor_recomendado_id||'';
    var prov=proveedores.filter(function(p){ return String(p.id)===String(d.proveedor_recomendado_id); })[0];
    document.getElementById('prov_nombre').value=prov?prov.nombre:'';
    document.getElementById('formTitulo').textContent='Editar insumo';
    document.getElementById('boxStockIni').style.display='none';
    document.getElementById('notaEdicion').style.display='';
    recalc(); window.scrollTo(0,document.body.scrollHeight);
  }
  function guardar(){
    var n=document.getElementById('nombre'), t=document.getElementById('tamano_presentacion'),
        p=document.getElementById('precio_presentacion'), m=document.getElementById('stock_minimo');
    var ok=true;
    [[n,!n.value.trim()],[t,!(Number(t.value)>0)],[p,!(Number(p.value)>0)],[m,!(m.value!==''&&Number(m.value)>=0)]]
      .forEach(function(par){ S.bad(par[0],par[1]); if(par[1]) ok=false; });
    if(!ok){ S.flash('Revisa los campos marcados. Tamano y precio deben ser mayor que cero.','err'); return; }
    var btn=document.getElementById('btnGuardar'); btn.disabled=true;
    S.call('guardarInsumo',{
      id:document.getElementById('id').value, nombre:n.value,
      tipo:document.getElementById('tipo').value, unidad_base:document.getElementById('unidad_base').value,
      tamano_presentacion:t.value, precio_presentacion:p.value,
      stock_inicial:document.getElementById('stock_inicial').value, stock_minimo:m.value,
      proveedor_recomendado_id:document.getElementById('proveedor_recomendado_id').value
    }, function(r){ S.cerrar(); },
       function(e){ btn.disabled=false; S.flash(e.message||String(e),'err'); });
  }
  cargar(); recalc();
