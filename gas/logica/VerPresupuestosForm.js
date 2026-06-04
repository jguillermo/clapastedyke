// Copia EXACTA del <script> propio de src/VerPresupuestosForm.html. NO editar sin sincronizar.
  var datos=[];

  function cargar(){
    S.call('listarPresupuestos', null, function(r){ datos=r||[]; pintar(); });
    S.call('catalogoClientes', null, function(cs){
      S.autocomplete(document.getElementById('f_cliente'), document.getElementById('f_cliente_id'),
                     (cs||[]).map(function(c){ return {id:c.id,nombre:c.nombre}; }), function(){ pintar(); });
    });
  }

  function aFecha(txt){ // dd/MM/yyyy -> Date
    if(!txt) return null; var p=txt.split('/'); if(p.length!==3) return null;
    return new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
  }

  function pintar(){
    var fe=document.getElementById('f_estado').value;
    var fc=document.getElementById('f_cliente').value.toLowerCase().trim();
    var fd=document.getElementById('f_desde').value ? new Date(document.getElementById('f_desde').value) : null;
    var fh=document.getElementById('f_hasta').value ? new Date(document.getElementById('f_hasta').value) : null;

    var rows=datos.filter(function(d){
      if(fe && d.estado!==fe) return false;
      if(fc && String(d.cliente_nombre).toLowerCase().indexOf(fc)<0) return false;
      var em=aFecha(d.fecha_emision);
      if(fd && em && em<fd) return false;
      if(fh && em && em>fh) return false;
      return true;
    });

    var c=document.getElementById('lista');
    if(!rows.length){ c.innerHTML='<div class="empty">No hay presupuestos con esos filtros.</div>'; return; }
    var t='<table class="t"><tr><th>N°</th><th>Cliente</th><th>Producto</th><th>Emisión</th><th>Vence</th>'
        + '<th class="n">Precio</th><th>Estado</th><th></th></tr>';
    rows.forEach(function(d){
      var acciones='<button class="btn mini" onclick="ver(\''+d.id+'\')">Ver</button>';
      if(d.estado_real==='Pendiente'){
        acciones+=' <button class="btn mini ok" onclick="aprobar(\''+d.id+'\')">Aprobar</button>'
                + ' <button class="btn mini no" onclick="rechazar(\''+d.id+'\')">Rechazar</button>';
      }
      t+='<tr><td class="num">'+S.esc(d.id)+'</td><td>'+S.esc(d.cliente_nombre)+'</td>'
       + '<td>'+S.esc(d.receta_nombre)+'</td><td>'+S.esc(d.fecha_emision)+'</td>'
       + '<td>'+S.esc(d.fecha_vencimiento)+'</td><td class="n">'+S.money(d.precio_final)+'</td>'
       + '<td><span class="stbadge st-'+S.esc(d.estado)+'">'+S.esc(d.estado)+'</span></td>'
       + '<td class="n rowact">'+acciones+'</td></tr>';
    });
    c.innerHTML=t+'</table>';
  }

  function ver(id){ google.script.run.abrirDetallePresupuesto(id); }

  function aprobar(id){
    if(!S.confirmar('¿Aprobar el presupuesto '+id+'?')) return;
    S.call('aprobarPresupuesto', id, function(r){ S.flash(r.mensaje,'ok'); cargar(); });
  }
  function rechazar(id){
    var motivo=window.prompt('Motivo del rechazo (opcional):','');
    if(motivo===null) return;
    google.script.run.withSuccessHandler(function(r){ S.flash(r.mensaje,'ok'); cargar(); })
      .withFailureHandler(function(e){ S.flash(e.message||String(e),'err'); })
      .rechazarPresupuesto(id, motivo);
  }

  cargar();
