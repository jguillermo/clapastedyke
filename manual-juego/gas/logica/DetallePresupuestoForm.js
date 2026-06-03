// Copia EXACTA del <script> propio de src/DetallePresupuestoForm.html. NO editar sin sincronizar.
  var ID = "<?= presupuestoId ?>";
  var P = null;

  function cargar(){
    S.call('detallePresupuesto', ID, function(d){ P=d; render(d); },
       function(e){ document.getElementById('cuerpo').innerHTML='<div class="empty">'+S.esc(e.message||String(e))+'</div>'; });
  }

  function render(d){
    document.getElementById('titulo').textContent='Presupuesto '+d.id;
    var ing=d.lineas.filter(function(l){ return l.tipo==='ingrediente'; });
    var mat=d.lineas.filter(function(l){ return l.tipo==='material'; });

    var h='<div class="card"><div class="meta">'
      + '<div><b>Cliente</b>'+S.esc(d.cliente_nombre)+'</div>'
      + '<div><b>Producto</b>'+S.esc(d.receta_nombre)+'</div>'
      + '<div><b>Escalado</b>'+S.esc(d.modo_escalado)+' = '+S.num4(d.valor_escalado)+' (factor '+S.num4(d.factor_aplicado)+')</div>'
      + '<div><b>Raciones</b>'+S.num4(d.raciones_resultantes)+'</div>'
      + '<div><b>Emisión</b>'+S.esc(d.fecha_emision)+'</div>'
      + '<div><b>Vence</b>'+S.esc(d.fecha_vencimiento)+'</div>'
      + '<div><b>Estado</b><span class="stbadge st-'+S.esc(d.estado)+'">'+S.esc(d.estado)+'</span></div></div>'
      + (d.motivo_rechazo?'<div class="note">Motivo de rechazo: '+S.esc(d.motivo_rechazo)+'</div>':'')
      + '</div>';

    if(d.estado==='Pendiente') h+='<div id="avisoFaltantes"></div>';

    h+='<div class="card"><div class="grp-title">Ingredientes</div>'+tabla(ing)+'</div>';
    if(mat.length) h+='<div class="card"><div class="grp-title">Empaque y materiales</div>'+tabla(mat)+'</div>';

    h+='<div class="card"><div class="grp-title">Costos y precio</div><div class="totbox">'
      + linea('Costo de ingredientes', d.costo_ingredientes)
      + linea('Costo de materiales', d.costo_materiales)
      + linea('Mano de obra', d.costo_mano_obra)
      + linea('Costo indirecto', d.costo_indirecto)
      + linea('Depreciación', d.costo_depreciacion)
      + linea('Costo total', d.costo_total)
      + linea('Precio con ganancia ('+S.num4(d.margen)+'%)', d.precio_con_margen)
      + (d.aplica_igv==='SI'?linea('IGV ('+S.num4(d.tasa_igv)+'%)', d.monto_igv):'')
      + linea('Redondeo', d.redondeo_aplicado)
      + '<div class="totline grand"><span>Precio final</span><span class="num">'+S.money(d.precio_final)+'</span></div>'
      + '</div>'
      + (d.notas?'<div class="note">Notas: '+S.esc(d.notas)+'</div>':'')
      + '</div>';

    document.getElementById('cuerpo').innerHTML=h;

    // Botones según estado.
    var pie=document.getElementById('pie');
    var extra='';
    if(d.estado==='Pendiente'){
      extra='<button class="btn mini no" style="font-size:13.5px;padding:9px 18px" onclick="rechazar()">Rechazar</button>'
          + '<button class="btn primary" onclick="aprobar()">Aprobar</button>';
    }
    pie.innerHTML='<button class="btn" onclick="volver()">Volver a la lista</button>'+extra;

    // Aviso de stock que quedaría en falta si se aprueba.
    if(d.estado==='Pendiente') cargarFaltantes();
  }

  function cargarFaltantes(){
    S.call('faltantesDePresupuesto', ID, function(f){
      var box=document.getElementById('avisoFaltantes'); if(!box) return;
      if(!f || !f.length){
        box.className='aviso ok'; box.innerHTML='<b>Hay stock suficiente.</b>Aprobar no dejará insumos en negativo.';
        return;
      }
      var lista=f.map(function(x){ return S.esc(x.nombre)+' (faltan '+S.num4(x.faltante)+' '+'; tienes '+S.num4(x.disponible)+')'; }).join(', ');
      box.className='aviso warn';
      box.innerHTML='<b>Al aprobar, quedará stock en falta:</b>'+lista+'. Tendrás que comprarlo (revísalo en Comprar materiales).';
    }, function(e){ /* si falla, no bloquea la pantalla */ });
  }

  function tabla(arr){
    var t='<table class="t"><tr><th>Detalle</th><th class="n">Cantidad</th><th class="n">P. unit.</th><th class="n">Subtotal</th></tr>';
    if(!arr.length) t+='<tr><td colspan="4" class="empty">Sin líneas</td></tr>';
    arr.forEach(function(l){
      t+='<tr><td>'+S.esc(l.nombre)+'</td><td class="n">'+S.num4(l.cantidad)+' '+S.esc(l.unidad)+'</td>'
       + '<td class="n">'+S.num4(l.precio_unitario)+'</td><td class="n">'+S.money(l.subtotal)+'</td></tr>';
    });
    return t+'</table>';
  }
  function linea(lbl,val){ return '<div class="totline"><span>'+S.esc(lbl)+'</span><span class="num">'+S.money(val)+'</span></div>'; }

  function aprobar(){
    if(!S.confirmar('¿Aprobar el presupuesto '+ID+'?')) return;
    S.call('aprobarPresupuesto', ID, function(r){ S.flash(r.mensaje,'ok'); cargar(); });
  }
  function rechazar(){
    var motivo=window.prompt('Motivo del rechazo (opcional):',''); if(motivo===null) return;
    google.script.run.withSuccessHandler(function(r){ S.flash(r.mensaje,'ok'); cargar(); })
      .withFailureHandler(function(e){ S.flash(e.message||String(e),'err'); })
      .rechazarPresupuesto(ID, motivo);
  }
  function volver(){ google.script.run.abrirVerPresupuestos(); }

  cargar();
