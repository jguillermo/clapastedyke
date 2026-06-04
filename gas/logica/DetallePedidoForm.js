// Copia EXACTA del <script> propio de src/DetallePedidoForm.html. NO editar sin sincronizar.
  var ID = "<?= pedidoId ?>";
  function cargar(){ S.call('detallePedido', ID, render, function(e){
    document.getElementById('cuerpo').innerHTML='<div class="empty">'+S.esc(e.message||String(e))+'</div>'; }); }

  function render(d){
    document.getElementById('titulo').textContent='Pedido '+d.id;
    var h='<div class="card"><div class="meta">'
      + '<div><b>Cliente</b>'+S.esc(d.cliente_nombre)+'</div>'
      + '<div><b>Producto</b>'+S.esc(d.receta_nombre)+'</div>'
      + '<div><b>Presupuesto</b>'+S.esc(d.presupuesto_id)+'</div>'
      + '<div><b>Estado</b><span class="stbadge st-'+S.esc(d.estado)+'">'+S.esc(d.estado)+'</span></div>'
      + '<div><b>Creado</b>'+S.esc(d.fecha_creacion)+'</div>'
      + '<div><b>Entregado</b>'+S.esc(d.fecha_entrega||'-')+'</div></div>'
      + (d.motivo_cancelacion?'<div class="note">Cancelación: '+S.esc(d.motivo_cancelacion)+'</div>':'')
      + '</div>';

    var t='<table class="t"><tr><th>Insumo</th><th class="n">Necesario</th><th class="n">Faltaba</th></tr>';
    if(!d.requerimientos.length) t+='<tr><td colspan="3" class="empty">Sin requerimientos</td></tr>';
    d.requerimientos.forEach(function(r){
      t+='<tr><td>'+S.esc(r.insumo_nombre)+'</td><td class="n">'+S.num4(r.cantidad_necesaria)+'</td>'
       + '<td class="n '+(r.faltante>0?'falta':'')+'">'+(r.faltante>0?S.num4(r.faltante):'-')+'</td></tr>';
    });
    h+='<div class="card"><div class="grp-title">Requerimiento de materiales</div>'+t+'</table></div>';
    document.getElementById('cuerpo').innerHTML=h;

    var extra='';
    if(d.estado==='Pendiente') extra='<button class="btn primary" onclick="prod()">Iniciar producción</button>';
    if(d.estado==='Producción') extra='<button class="btn primary" onclick="entregar()">Marcar entregado</button>';
    var cancelBtn=(d.estado==='Pendiente'||d.estado==='Producción')
      ? '<button class="btn mini no" style="font-size:13.5px;padding:9px 18px" onclick="cancelar()">Cancelar</button>' : '';
    document.getElementById('pie').innerHTML='<button class="btn" onclick="volver()">Volver a la lista</button>'+cancelBtn+extra;
  }

  function prod(){ if(!S.confirmar('¿Pasar a Producción? Puede descontar stock.')) return;
    S.call('iniciarProduccion', ID, function(r){ S.flash(r.mensaje,'ok'); cargar(); }); }
  function entregar(){ if(!S.confirmar('¿Marcar entregado? Se registra la venta.')) return;
    S.call('marcarEntregado', ID, function(r){ S.flash(r.mensaje,'ok'); cargar(); }); }
  function cancelar(){ var m=window.prompt('Motivo (opcional):',''); if(m===null) return;
    google.script.run.withSuccessHandler(function(r){ S.flash(r.mensaje,'ok'); cargar(); })
      .withFailureHandler(function(e){ S.flash(e.message||String(e),'err'); }).cancelarPedido(ID, m); }
  function volver(){ google.script.run.abrirVerPedidos(); }

  cargar();
