// Copia EXACTA del <script> propio de src/ProveedoresForm.html. NO editar sin sincronizar.
  var datos=[];
  function cargar(){ S.call('listarProveedores',null,function(r){ datos=r||[]; pintar(); }); }
  function pintar(){
    var c=document.getElementById('lista');
    if(!datos.length){ c.innerHTML='<div class="empty">Aun no hay proveedores.</div>'; return; }
    var f='<table class="t"><tr><th>Nombre</th><th>WhatsApp</th><th>Notas</th><th></th></tr>';
    datos.forEach(function(d){
      f+='<tr><td>'+S.esc(d.nombre)+'</td><td class="num">'+S.esc(d.whatsapp)+'</td><td>'+S.esc(d.notas)+'</td>'
       + '<td class="n"><button class="btn mini" onclick="editar(\''+d.id+'\')">Editar</button></td></tr>';
    });
    c.innerHTML=f+'</table>';
  }
  function nuevo(){
    ['id','nombre','whatsapp','notas'].forEach(function(k){ document.getElementById(k).value=''; });
    document.getElementById('formTitulo').textContent='Nuevo proveedor';
    document.getElementById('nombre').focus();
  }
  function editar(id){
    var d=datos.filter(function(x){ return String(x.id)===String(id); })[0]; if(!d) return;
    document.getElementById('id').value=d.id;
    document.getElementById('nombre').value=d.nombre||'';
    document.getElementById('whatsapp').value=d.whatsapp||'';
    document.getElementById('notas').value=d.notas||'';
    document.getElementById('formTitulo').textContent='Editar proveedor';
    window.scrollTo(0,document.body.scrollHeight);
  }
  function guardar(){
    var nombre=document.getElementById('nombre'), wa=document.getElementById('whatsapp');
    var ok=true;
    if(!nombre.value.trim()){ S.bad(nombre,true); ok=false; } else S.bad(nombre,false);
    if(!wa.value.trim()){ S.bad(wa,true); ok=false; } else S.bad(wa,false);
    if(!ok){ S.flash('Completa los campos marcados.','err'); return; }
    var btn=document.getElementById('btnGuardar'); btn.disabled=true;
    S.call('guardarProveedor',{
      id:document.getElementById('id').value, nombre:nombre.value,
      whatsapp:wa.value, notas:document.getElementById('notas').value
    }, function(r){ S.cerrar(); },
       function(e){ btn.disabled=false; S.flash(e.message||String(e),'err'); });
  }
  cargar();
