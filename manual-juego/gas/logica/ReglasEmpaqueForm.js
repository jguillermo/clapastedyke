// Copia EXACTA del <script> propio de src/ReglasEmpaqueForm.html. NO editar sin sincronizar.
  var datos=[], recetas=[], empaques=[], tamanos=[];

  function cargar(){
    S.call('datosReglasEmpaque',null,function(d){
      recetas=d.recetas||[]; empaques=d.empaques||[]; tamanos=d.tamanos||[];
      var sel=document.getElementById('tamano');
      sel.innerHTML=tamanos.map(function(t){ return '<option value="'+S.esc(t)+'">'+S.esc(t)+'</option>'; }).join('');
      if(!tamanos.length) sel.innerHTML='<option value="">define tamanos en Configuracion</option>';
      S.autocomplete(document.getElementById('rec_nombre'),document.getElementById('receta_id'),
                     recetas.map(function(r){ return {id:r.id,nombre:r.nombre}; }));
      S.autocomplete(document.getElementById('emp_nombre'),document.getElementById('insumo_empaque_id'),
                     empaques.map(function(e){ return {id:e.id,nombre:e.nombre}; }));
    });
    S.call('listarReglasEmpaque',null,function(r){ datos=r||[]; pintar(); });
  }
  function pintar(){
    var c=document.getElementById('lista');
    if(!datos.length){ c.innerHTML='<div class="empty">Aun no hay reglas de empaque.</div>'; return; }
    var f='<table class="t"><tr><th>Receta</th><th>Tamano</th><th>Empaque</th><th class="n">Cant.</th><th></th></tr>';
    datos.forEach(function(d){
      f+='<tr><td>'+S.esc(d.receta_nombre)+'</td><td>'+S.esc(d.tamano)+'</td>'
       + '<td>'+S.esc(d.insumo_nombre)+'</td><td class="n">'+d.cantidad+'</td>'
       + '<td class="n"><button class="btn mini" onclick="editar(\''+d.id_regla+'\')">Editar</button></td></tr>';
    });
    c.innerHTML=f+'</table>';
  }
  function nuevo(){
    document.getElementById('id_regla').value='';
    document.getElementById('rec_nombre').value=''; document.getElementById('receta_id').value='';
    document.getElementById('emp_nombre').value=''; document.getElementById('insumo_empaque_id').value='';
    document.getElementById('cantidad').value='';
    document.getElementById('formTitulo').textContent='Nueva regla';
  }
  function editar(id){
    var d=datos.filter(function(x){ return String(x.id_regla)===String(id); })[0]; if(!d) return;
    document.getElementById('id_regla').value=d.id_regla;
    document.getElementById('receta_id').value=d.receta_id;
    document.getElementById('rec_nombre').value=d.receta_nombre;
    document.getElementById('tamano').value=d.tamano;
    document.getElementById('insumo_empaque_id').value=d.insumo_empaque_id;
    document.getElementById('emp_nombre').value=d.insumo_nombre;
    document.getElementById('cantidad').value=d.cantidad;
    document.getElementById('formTitulo').textContent='Editar regla';
    window.scrollTo(0,document.body.scrollHeight);
  }
  function guardar(){
    var rid=document.getElementById('receta_id'), rn=document.getElementById('rec_nombre'),
        eid=document.getElementById('insumo_empaque_id'), en=document.getElementById('emp_nombre'),
        cant=document.getElementById('cantidad');
    var ok=true;
    S.bad(rn,!rid.value); if(!rid.value) ok=false;
    S.bad(en,!eid.value); if(!eid.value) ok=false;
    S.bad(cant,!(Number(cant.value)>0)); if(!(Number(cant.value)>0)) ok=false;
    if(!ok){ S.flash('Elige receta, empaque y una cantidad mayor que cero.','err'); return; }
    var btn=document.getElementById('btnGuardar'); btn.disabled=true;
    S.call('guardarReglaEmpaque',{
      id_regla:document.getElementById('id_regla').value, receta_id:rid.value,
      tamano:document.getElementById('tamano').value, insumo_empaque_id:eid.value, cantidad:cant.value
    }, function(r){ S.cerrar(); },
       function(e){ btn.disabled=false; S.flash(e.message||String(e),'err'); });
  }
  cargar();
