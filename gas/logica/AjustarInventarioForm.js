// Copia EXACTA del <script> propio de src/AjustarInventarioForm.html. NO editar sin sincronizar.
  var insumos=[];
  function cargar(){
    S.call('datosAjustarInventario', null, function(d){
      insumos=d.insumos||[];
      document.getElementById('tipo').innerHTML=(d.tipos||[]).map(function(t){
        return '<option value="'+S.esc(t)+'">'+S.esc(t)+'</option>'; }).join('');
      S.autocomplete(document.getElementById('ins_nombre'), document.getElementById('insumo_id'),
                     insumos.map(function(i){ return {id:i.id,nombre:i.nombre}; }), function(){ prev(); });
    });
    document.getElementById('fecha').value=new Date().toISOString().slice(0,10);
  }

  function prev(){
    var id=document.getElementById('insumo_id').value;
    var cant=document.getElementById('cantidad').value;
    if(!id || !(Number(cant)!==0)){ document.getElementById('preview').textContent='Elige un insumo y una cantidad para ver el efecto.'; return; }
    google.script.run.withSuccessHandler(function(r){
      document.getElementById('preview').innerHTML=
        'Stock: <span class="num">'+r.antes+'</span> '+S.esc(r.unidad)+
        ' → <span class="num">'+r.despues+'</span> '+S.esc(r.unidad)+
        ' <span class="dot '+r.semaforo+'"></span>';
    }).withFailureHandler(function(){}).previsualizarAjuste(id, document.getElementById('tipo').value, cant);
  }

  function guardar(){
    var id=document.getElementById('insumo_id').value;
    var cant=document.getElementById('cantidad').value;
    if(!id){ S.bad(document.getElementById('ins_nombre'),true); S.flash('Elige un insumo.','err'); return; }
    S.bad(document.getElementById('ins_nombre'),false);
    if(!(Number(cant)!==0)){ S.flash('La cantidad no puede ser cero.','err'); return; }
    if(!S.confirmar('¿Guardar este ajuste de inventario? Moverá el stock del insumo.')) return;
    var btn=document.getElementById('btnGuardar'); btn.disabled=true;
    S.call('ajustarInventario', {
      insumo_id:id, tipo:document.getElementById('tipo').value, cantidad:cant,
      motivo:document.getElementById('motivo').value, fecha:document.getElementById('fecha').value
    }, function(r){ S.cerrar(); },
       function(e){ btn.disabled=false; S.flash(e.message||String(e),'err'); });
  }

  cargar();
