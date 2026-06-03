// Copia EXACTA del <script> propio de src/ComprarMaterialesForm.html. NO editar sin sincronizar.
  var D=null;

  function cargar(){
    S.call('datosComprarMateriales', null, function(d){
      D=d;
      var sel=document.getElementById('pedido');
      if(!d.pedidos.length){ sel.innerHTML='<option value="">(no hay pedidos con faltantes)</option>'; }
      else sel.innerHTML='<option value="">Elige...</option>'+d.pedidos.map(function(p){
        return '<option value="'+S.esc(p.id)+'">'+S.esc(p.id)+' · '+S.esc(p.cliente_nombre)+'</option>'; }).join('');
      pintarManual();
    });
  }

  function cambioModo(){
    var m=document.getElementById('modo').value;
    document.getElementById('boxPedido').style.display=(m==='auto')?'':'none';
    document.getElementById('boxManual').style.display=(m==='manual')?'':'none';
    document.getElementById('resultado').innerHTML='<div class="empty">Elige un pedido o arma la lista manual.</div>';
  }

  function pintarManual(){
    var c=document.getElementById('listaManual');
    c.innerHTML=D.insumos.map(function(i){
      return '<div class="chk"><input type="checkbox" id="m_'+i.id+'" '+(i.bajo_minimo?'checked':'')+'>'
        + '<span>'+S.esc(i.nombre)+' <span style="color:var(--muted)">stock '+i.stock_actual+' '+S.esc(i.unidad_base)+'</span></span>'
        + '<input type="number" min="0" step="any" id="q_'+i.id+'" placeholder="cantidad"></div>';
    }).join('');
  }

  function generarAuto(){
    var id=document.getElementById('pedido').value;
    if(!id){ document.getElementById('resultado').innerHTML='<div class="empty">Elige un pedido.</div>'; return; }
    google.script.run.withSuccessHandler(function(items){
      render(items.map(function(it){ return {insumo_id:it.insumo_id, nombre:it.nombre, cantidad:it.faltante,
        precio:it.precio_presentacion, prov:it.proveedor_recomendado_id}; }));
    }).withFailureHandler(function(e){ S.flash(e.message||String(e),'err'); }).faltantesDePedido(id);
  }

  function generarManual(){
    var items=[];
    D.insumos.forEach(function(i){
      var chk=document.getElementById('m_'+i.id), q=document.getElementById('q_'+i.id);
      if(chk && chk.checked){
        var cant=Number(q.value)||0;
        if(cant>0) items.push({insumo_id:i.id, nombre:i.nombre, cantidad:cant, precio:i.precio_presentacion, prov:i.proveedor_recomendado_id});
      }
    });
    if(!items.length){ S.flash('Marca al menos un insumo y pon su cantidad.','err'); return; }
    render(items);
  }

  function render(items){
    if(!items.length){ document.getElementById('resultado').innerHTML='<div class="empty">Nada que comprar.</div>'; return; }
    // Agrupa por proveedor.
    var grupos={};
    items.forEach(function(it){
      var k=it.prov||'__sin__';
      (grupos[k]=grupos[k]||[]).push(it);
    });
    var html='';
    Object.keys(grupos).forEach(function(provId){
      var lista=grupos[provId];
      var info=(provId!=='__sin__' && D.proveedores[provId]) ? D.proveedores[provId] : null;
      var nombreProv=info?info.nombre:'Sin proveedor asignado';
      var filas=lista.map(function(it){
        return '<tr><td>'+S.esc(it.nombre)+'</td><td class="n">'+S.num4(it.cantidad)+'</td>'
             + '<td class="n">'+(it.precio?S.money(it.precio):'-')+'</td></tr>';
      }).join('');
      var wa='';
      if(info && info.whatsapp){
        var msg='Hola '+nombreProv+', quisiera consultar disponibilidad y precio de:\n'
          + lista.map(function(it){ return '- '+it.nombre+': '+it.cantidad; }).join('\n');
        var url='https://wa.me/'+String(info.whatsapp).replace(/[^\d]/g,'')+'?text='+encodeURIComponent(msg);
        wa='<span class="wa" onclick="window.open(\''+url+'\',\'_blank\')">WhatsApp</span>';
      } else {
        wa='<span class="wa off">sin WhatsApp</span>';
      }
      html+='<div class="prov"><h4><span>'+S.esc(nombreProv)+'</span>'+wa+'</h4>'
          + '<table class="t"><tr><th>Insumo</th><th class="n">Cantidad</th><th class="n">Último precio</th></tr>'
          + filas+'</table></div>';
    });
    document.getElementById('resultado').innerHTML=html;
  }

  function irRegistrar(){ google.script.run.abrirRegistrarCompra(); }

  cargar();
