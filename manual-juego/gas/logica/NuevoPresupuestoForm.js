// Copia EXACTA del <script> propio de src/NuevoPresupuestoForm.html. NO editar sin sincronizar.
  var D = null, empaquesCat = [], materiales = [], ultimoCalc = null;

  function cargar(){
    S.call('datosNuevoPresupuesto', null, function(d){
      D = d;
      S.autocomplete(document.getElementById('cli_nombre'), document.getElementById('cliente_id'),
                     d.clientes.map(function(c){ return {id:c.id,nombre:c.nombre}; }));
      S.autocomplete(document.getElementById('rec_nombre'), document.getElementById('receta_id'),
                     d.recetas.map(function(r){ return {id:r.id,nombre:r.nombre}; }), function(it){
        // Preselecciona el modo según el tipo de base de la receta.
        var rec=d.recetas.filter(function(r){ return String(r.id)===String(it.id); })[0];
        if(rec){ document.getElementById('modo').value = (rec.tipo_base==='tamano') ? 'tamano' : 'personas'; cambioModo(); }
        cambioReceta();
      });
      var fsel=document.getElementById('factor');
      fsel.innerHTML=d.factores.map(function(f){ return '<option value="'+f.codigo+'">'+S.esc(f.label)+'</option>'; }).join('');
      var tsel=document.getElementById('tamano');
      tsel.innerHTML='<option value="">(sin tamaño)</option>'+d.tamanos.map(function(t){ return '<option value="'+S.esc(t)+'">'+S.esc(t)+'</option>'; }).join('');
      document.getElementById('margen').value=d.config.margen_defecto;
      document.getElementById('aplica_igv').checked=(String(d.config.aplicar_igv)==='SI');
    });
    S.call('catalogoInsumos', 'empaque', function(r){
      empaquesCat=(r||[]).map(function(e){ return {id:e.id,nombre:e.nombre,precio:e.precio_por_unidad_base,unidad:e.unidad_base}; });
      S.autocomplete(document.getElementById('add_emp'), document.getElementById('add_emp_id'),
                     empaquesCat.map(function(e){ return {id:e.id,nombre:e.nombre}; }), function(it){
        agregarMaterial(it.id); document.getElementById('add_emp').value=''; document.getElementById('add_emp_id').value='';
      });
    });
  }

  function cambioModo(){
    var m=document.getElementById('modo').value;
    var esNumero = (m==='cantidad' || m==='personas');
    document.getElementById('boxRaciones').style.display = esNumero ? '' : 'none';
    document.getElementById('boxFactor').style.display = (m==='factor') ? '' : 'none';
    if(esNumero){
      document.getElementById('labValor').textContent = (m==='personas') ? 'Número de personas' : 'Cantidad';
    }
    // En modo "por tamaño" el factor sale del tamaño elegido abajo.
    document.getElementById('hintTamano').textContent = (m==='tamano') ? 'define el escalado y el empaque' : 'para sugerir empaque';
    recalc();
  }

  function cambioReceta(){
    var rid=document.getElementById('receta_id').value;
    var tam=document.getElementById('tamano').value;
    // empaquesSugeridos necesita dos argumentos, por eso se llama directo y no por S.call:
    if(rid){
      google.script.run.withSuccessHandler(function(sug){
        materiales = (sug||[]).map(function(s){ return {insumo_id:s.insumo_id,nombre:s.nombre,precio:s.precio,unidad:s.unidad,cantidad:s.cantidad,sugerido:true,incluido:true}; });
        pintarMateriales(); recalc();
      }).withFailureHandler(function(e){ S.flash(e.message||String(e),'err'); }).empaquesSugeridos(rid, tam);
    } else { recalc(); }
  }

  function agregarMaterial(insumoId){
    var e=empaquesCat.filter(function(x){ return String(x.id)===String(insumoId); })[0]; if(!e) return;
    if(materiales.some(function(m){ return String(m.insumo_id)===String(insumoId); })) return;
    materiales.push({insumo_id:e.id,nombre:e.nombre,precio:e.precio,unidad:e.unidad,cantidad:1,sugerido:false,incluido:true});
    pintarMateriales(); recalc();
  }
  function quitarMaterial(i){ materiales.splice(i,1); pintarMateriales(); recalc(); }
  function cambioCantMat(i,val){ materiales[i].cantidad=Number(val)||0; recalc(); }
  function toggleMat(i,on){ materiales[i].incluido=on; pintarMateriales(); recalc(); }

  function pintarMateriales(){
    var c=document.getElementById('materiales');
    if(!materiales.length){ c.innerHTML='<div class="empty">Sin empaque. Elige un tamaño con reglas, o agrega abajo.</div>'; return; }
    c.innerHTML=materiales.map(function(m,i){
      var inc = (m.incluido!==false);
      var chk='<input type="checkbox" '+(inc?'checked':'')+' onchange="toggleMat('+i+',this.checked)" title="Incluir este empaque" style="width:auto">';
      var cant='<input type="number" min="0" step="any" value="'+m.cantidad+'" '+(inc?'':'disabled')+' onchange="cambioCantMat('+i+',this.value)">';
      var acc = m.sugerido ? '<span class="pill">sugerido</span>'
                           : '<button class="btn mini no" onclick="quitarMaterial('+i+')">Quitar</button>';
      return '<div class="matrow"><div style="display:flex;align-items:center;gap:8px">'+chk+'<span style="'+(inc?'':'opacity:.5')+'">'+S.esc(m.nombre)+'</span></div>'
        + cant + '<div style="text-align:right">'+acc+'</div></div>';
    }).join('');
  }

  function armarPayload(){
    var modo=document.getElementById('modo').value;
    var valor = (modo==='factor') ? document.getElementById('factor').value
              : (modo==='tamano') ? '' : document.getElementById('raciones').value;
    return {
      cliente_id: document.getElementById('cliente_id').value,
      cliente_nombre: document.getElementById('cli_nombre').value,
      receta_id: document.getElementById('receta_id').value,
      receta_nombre: document.getElementById('rec_nombre').value,
      modo_escalado: modo, valor_escalado: valor,
      tamano: document.getElementById('tamano').value,
      empaques: materiales.filter(function(m){ return m.incluido!==false; })
                          .map(function(m){ return {insumo_id:m.insumo_id, cantidad:m.cantidad}; }),
      margen: document.getElementById('margen').value,
      aplica_igv: document.getElementById('aplica_igv').checked ? 'SI' : 'NO',
      notas: document.getElementById('notas').value
    };
  }

  // Para modo "por tamaño" el escalado lo define el tamaño elegido, no un número.
  function escaladoListo(p){
    return (p.modo_escalado==='tamano') ? !!p.tamano : (Number(p.valor_escalado)>0);
  }

  function recalc(){
    var p=armarPayload();
    if(!p.receta_id || !escaladoListo(p)){ return; }
    S.call('calcularPresupuesto', p, function(c){ ultimoCalc=c; render(c); },
       function(e){ /* errores menores de cálculo no molestan al escribir */ });
  }

  function render(c){
    var ing=(c.lineas||[]).filter(function(l){ return l.tipo==='ingrediente'; });
    var t='<table class="t"><tr><th>Ingrediente</th><th class="n">Cantidad</th><th class="n">P. unit.</th><th class="n">Subtotal</th></tr>';
    if(!ing.length) t+='<tr><td colspan="4" class="empty">Sin ingredientes</td></tr>';
    ing.forEach(function(l){
      t+='<tr><td>'+S.esc(l.nombre)+'</td><td class="n">'+S.num4(l.cantidad)+' '+S.esc(l.unidad)+'</td>'
       + '<td class="n">'+S.num4(l.precio_unitario)+'</td><td class="n">'+S.money(l.subtotal)+'</td></tr>';
    });
    document.getElementById('tablaIng').innerHTML=t+'</table>';

    document.getElementById('infoFactor').textContent='Factor '+S.num4(c.factor)+', rinde '+S.num4(c.raciones_resultantes)+' raciones.';
    document.getElementById('t_mo').textContent=S.money(c.costo_mano_obra);
    document.getElementById('t_ind').textContent=S.money(c.costo_indirecto);
    document.getElementById('t_dep').textContent=S.money(c.costo_depreciacion);
    document.getElementById('t_ing').textContent=S.money(c.costo_ingredientes);
    document.getElementById('t_mat').textContent=S.money(c.costo_materiales);
    document.getElementById('t_costo').textContent=S.money(c.costo_total);
    document.getElementById('t_margen').textContent=S.money(c.precio_con_margen);
    document.getElementById('t_igv').textContent=S.money(c.monto_igv);
    document.getElementById('lineaIgv').style.display=(c.aplica_igv==='SI')?'flex':'none';
    document.getElementById('t_red').textContent=S.money(c.redondeo_aplicado);
    document.getElementById('t_final').textContent=S.money(c.precio_final);
  }

  function nuevoCliente(){
    var nombre=window.prompt('Nombre del nuevo cliente:'); if(!nombre) return;
    S.call('crearClienteRapido', nombre, function(r){
      document.getElementById('cli_nombre').value=r.nombre;
      document.getElementById('cliente_id').value=r.id;
      S.flash('Cliente creado.','ok');
    });
  }

  function guardar(){
    var p=armarPayload();
    var ok=true;
    if(!p.cliente_id){ S.bad(document.getElementById('cli_nombre'),true); ok=false; } else S.bad(document.getElementById('cli_nombre'),false);
    if(!p.receta_id){ S.bad(document.getElementById('rec_nombre'),true); ok=false; } else S.bad(document.getElementById('rec_nombre'),false);
    if(!escaladoListo(p)){ ok=false; }
    if(!ok){ S.flash('Elige cliente, receta y el escalado.','err'); return; }
    if(!ultimoCalc){ S.flash('Espera a que termine el cálculo.','err'); return; }
    var btn=document.getElementById('btnGuardar'); btn.disabled=true;
    S.call('guardarPresupuesto', p, function(r){ S.cerrar(); },
      function(e){ btn.disabled=false; S.flash(e.message||String(e),'err'); });
  }

  function limpiarForm(){
    ['cli_nombre','cliente_id','rec_nombre','receta_id','raciones','notas'].forEach(function(k){ document.getElementById(k).value=''; });
    materiales=[]; pintarMateriales(); ultimoCalc=null;
    document.getElementById('tablaIng').innerHTML='<div class="empty">Elige una receta para ver los ingredientes.</div>';
    document.getElementById('infoFactor').textContent='';
    ['t_mo','t_ind','t_dep','t_ing','t_mat','t_costo','t_margen','t_igv','t_red','t_final'].forEach(function(k){ document.getElementById(k).textContent='S/ 0.00'; });
    if(D) document.getElementById('margen').value=D.config.margen_defecto;
  }

  cargar(); pintarMateriales();
