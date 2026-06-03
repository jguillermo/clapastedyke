// Copia EXACTA del <script> propio de src/VerPedidosForm.html. NO editar sin sincronizar.
  var datos=[];
  function cargar(){
    S.call('listarPedidos', null, function(r){ datos=r||[]; pintar(); });
    S.call('catalogoClientes', null, function(cs){
      S.autocomplete(document.getElementById('f_cliente'), document.getElementById('f_cliente_id'),
                     (cs||[]).map(function(c){ return {id:c.id,nombre:c.nombre}; }), function(){ pintar(); });
    });
  }
  function pintar(){
    var fe=document.getElementById('f_estado').value;
    var fc=document.getElementById('f_cliente').value.toLowerCase().trim();
    var rows=datos.filter(function(d){
      if(fe && d.estado!==fe) return false;
      if(fc && String(d.cliente_nombre).toLowerCase().indexOf(fc)<0) return false;
      return true;
    });
    var c=document.getElementById('lista');
    if(!rows.length){ c.innerHTML='<div class="empty">No hay pedidos con esos filtros.</div>'; return; }
    var t='<table class="t"><tr><th>N°</th><th>Presup.</th><th>Cliente</th><th>Producto</th><th>Creado</th><th>Estado</th><th></th></tr>';
    rows.forEach(function(d){
      var a='<button class="btn mini" onclick="ver(\''+d.id+'\')">Ver</button>';
      if(d.estado==='Pendiente') a+=' <button class="btn mini ok" onclick="prod(\''+d.id+'\')">Producción</button>';
      if(d.estado==='Producción') a+=' <button class="btn mini ok" onclick="entregar(\''+d.id+'\')">Entregar</button>';
      if(d.estado==='Pendiente'||d.estado==='Producción') a+=' <button class="btn mini no" onclick="cancelar(\''+d.id+'\')">Cancelar</button>';
      t+='<tr><td class="num">'+S.esc(d.id)+'</td><td class="num">'+S.esc(d.presupuesto_id)+'</td>'
       + '<td>'+S.esc(d.cliente_nombre)+'</td><td>'+S.esc(d.receta_nombre)+'</td>'
       + '<td>'+S.esc(d.fecha_creacion)+'</td>'
       + '<td><span class="stbadge st-'+S.esc(d.estado)+'">'+S.esc(d.estado)+'</span></td>'
       + '<td class="n rowact">'+a+'</td></tr>';
    });
    c.innerHTML=t+'</table>';
  }
  function ver(id){ google.script.run.abrirDetallePedido(id); }
  function prod(id){
    if(!S.confirmar('¿Pasar el pedido '+id+' a Producción? Esto puede descontar stock.')) return;
    S.call('iniciarProduccion', id, function(r){ S.flash(r.mensaje,'ok'); cargar(); });
  }
  function entregar(id){
    if(!S.confirmar('¿Marcar el pedido '+id+' como entregado? Se registrará la venta.')) return;
    S.call('marcarEntregado', id, function(r){ S.flash(r.mensaje,'ok'); cargar(); });
  }
  function cancelar(id){
    var m=window.prompt('Motivo de la cancelación (opcional):',''); if(m===null) return;
    google.script.run.withSuccessHandler(function(r){ S.flash(r.mensaje,'ok'); cargar(); })
      .withFailureHandler(function(e){ S.flash(e.message||String(e),'err'); })
      .cancelarPedido(id, m);
  }
  cargar();
