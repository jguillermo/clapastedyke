// Copia EXACTA del <script> propio de src/RecetasForm.html. NO editar sin sincronizar.
  var datos=[], insumos=[], rowId=0;

  function actualizarLabelBase(){
    var tipo=document.getElementById('tipo_base').value;
    var lab=document.getElementById('labBase'), inp=document.getElementById('raciones_base');
    if(tipo==='tamano'){ lab.textContent='Tamano base (referencia)'; inp.placeholder='Valor de referencia del tamano base'; }
    else { lab.textContent='Personas base'; inp.placeholder='Personas que rinde tal cual'; }
  }

  function cargar(){
    S.call('catalogoInsumos','ingrediente',function(r){
      // se permiten todos los insumos como ingrediente, no solo tipo ingrediente
      S.call('catalogoInsumos',null,function(all){ insumos=all||[]; });
    });
    S.call('listarRecetas',null,function(r){ datos=r||[]; pintar(); });
  }
  function pintar(){
    var c=document.getElementById('lista');
    if(!datos.length){ c.innerHTML='<div class="empty">Aun no hay recetas.</div>'; return; }
    var f='<table class="t"><tr><th>Receta</th><th>Categoria</th><th class="n">Raciones</th>'
        + '<th class="n">Ingred.</th><th></th></tr>';
    datos.forEach(function(d){
      f+='<tr><td>'+S.esc(d.nombre)+'</td><td>'+S.esc(d.categoria)+'</td>'
       + '<td class="n">'+d.raciones_base+'</td><td class="n">'+d.ingredientes.length+'</td>'
       + '<td class="n"><button class="btn mini" onclick="editar(\''+d.id+'\')">Editar</button></td></tr>';
    });
    c.innerHTML=f+'</table>';
  }
  function addRow(ing){
    rowId++;
    var wrap=document.createElement('div');
    wrap.className='row-add'; wrap.style.gridTemplateColumns='1.6fr .9fr .6fr auto';
    wrap.id='row'+rowId;
    wrap.innerHTML=
      '<div class="ac"><input placeholder="Buscar insumo..." id="in'+rowId+'">'
      + '<input type="hidden" id="inid'+rowId+'"></div>'
      + '<input type="number" min="0" step="any" placeholder="Cantidad" id="cant'+rowId+'">'
      + '<input class="ro" readonly placeholder="unidad" id="uni'+rowId+'">'
      + '<button class="btn mini no" onclick="this.parentNode.remove()">Quitar</button>';
    document.getElementById('ings').appendChild(wrap);
    var input=document.getElementById('in'+rowId), hid=document.getElementById('inid'+rowId),
        uni=document.getElementById('uni'+rowId);
    S.autocomplete(input,hid,insumos.map(function(i){ return {id:i.id,nombre:i.nombre}; }),function(it){
      var full=insumos.filter(function(x){ return String(x.id)===String(it.id); })[0];
      uni.value=full?(full.unidad_base==='u'?'unidad':'gramo'):'';
    });
    if(ing){
      input.value=ing.insumo_nombre||''; hid.value=ing.insumo_id||'';
      document.getElementById('cant'+rowId).value=ing.cantidad_base||'';
      uni.value=(ing.unidad==='u'?'unidad':(ing.unidad?'gramo':''));
    }
  }
  function nuevo(){
    document.getElementById('id').value='';
    ['nombre','categoria','raciones_base','tiempo'].forEach(function(k){ document.getElementById(k).value=''; });
    document.getElementById('tipo_base').value='personas'; actualizarLabelBase();
    document.getElementById('ings').innerHTML=''; addRow();
    document.getElementById('formTitulo').textContent='Nueva receta';
    document.getElementById('nombre').focus();
  }
  function editar(id){
    var d=datos.filter(function(x){ return String(x.id)===String(id); })[0]; if(!d) return;
    document.getElementById('id').value=d.id;
    document.getElementById('nombre').value=d.nombre||'';
    document.getElementById('categoria').value=d.categoria||'';
    document.getElementById('tipo_base').value=d.tipo_base||'personas'; actualizarLabelBase();
    document.getElementById('raciones_base').value=d.raciones_base||'';
    document.getElementById('tiempo').value=d.tiempo_mano_obra_horas||'';
    document.getElementById('ings').innerHTML='';
    (d.ingredientes||[]).forEach(function(g){ addRow(g); });
    if(!d.ingredientes||!d.ingredientes.length) addRow();
    document.getElementById('formTitulo').textContent='Editar receta';
    window.scrollTo(0,document.body.scrollHeight);
  }
  function recogerIngredientes(){
    var res=[];
    Array.prototype.forEach.call(document.querySelectorAll('#ings .row-add'),function(row){
      var idn=row.querySelector('input[type=hidden]').value;
      var cant=row.querySelector('input[type=number]').value;
      if(idn && Number(cant)>0) res.push({insumo_id:idn, cantidad_base:cant});
    });
    return res;
  }
  function guardar(){
    var n=document.getElementById('nombre'), rb=document.getElementById('raciones_base'),
        tm=document.getElementById('tiempo');
    var ok=true;
    S.bad(n,!n.value.trim()); if(!n.value.trim()) ok=false;
    S.bad(rb,!(Number(rb.value)>0)); if(!(Number(rb.value)>0)) ok=false;
    S.bad(tm,!(tm.value!==''&&Number(tm.value)>=0)); if(!(tm.value!==''&&Number(tm.value)>=0)) ok=false;
    var ings=recogerIngredientes();
    if(!ings.length){ ok=false; S.flash('Agrega al menos un ingrediente con cantidad.','err'); }
    if(!ok){ if(n.value.trim()&&Number(rb.value)>0) {} else S.flash('Revisa los campos marcados.','err'); return; }
    var btn=document.getElementById('btnGuardar'); btn.disabled=true;
    S.call('guardarReceta',{
      id:document.getElementById('id').value, nombre:n.value,
      categoria:document.getElementById('categoria').value,
      tipo_base:document.getElementById('tipo_base').value,
      raciones_base:rb.value, tiempo_mano_obra_horas:tm.value, ingredientes:ings
    }, function(r){ S.cerrar(); },
       function(e){ btn.disabled=false; S.flash(e.message||String(e),'err'); });
  }
  cargar(); addRow(); actualizarLabelBase();
