// Copia EXACTA del objeto S de src/Estilos.html. NO editar sin sincronizar con el export.
// Ayudantes compartidos.
var S = {
  esc: function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); },
  money: function(n){ n=Number(n)||0; return 'S/ '+n.toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2}); },
  num4: function(n){ n=Number(n)||0; return n.toLocaleString('es-PE',{minimumFractionDigits:4,maximumFractionDigits:4}); },
  flash: function(msg,tipo){
    var el=document.getElementById('flash'); if(!el) return;
    el.textContent=msg; el.className='flash show '+(tipo||'ok');
    if(tipo==='ok'){ setTimeout(function(){ el.className='flash'; },4000); }
    el.scrollIntoView({block:'nearest'});
  },
  cerrar: function(){ google.script.host.close(); },
  confirmar: function(msg){ return window.confirm(msg); },
  bad: function(el,on){ if(el) el.classList.toggle('bad',!!on); },
  // Llama a una funcion del servidor. onOk(resultado), onErr(error).
  call: function(fn,arg,onOk,onErr){
    google.script.run
      .withSuccessHandler(function(r){ if(onOk) onOk(r); })
      .withFailureHandler(function(e){ if(onErr) onErr(e); else S.flash(e.message||String(e),'err'); })
      [fn](arg);
  },
  // Autocompletado simple sobre una lista [{id,nombre}].
  autocomplete: function(input, hidden, items, onPick){
    var box=document.createElement('div'); box.className='ac-list';
    input.parentNode.appendChild(box);
    function render(txt){
      var t=(txt||'').toLowerCase();
      var res=items.filter(function(i){ return i.nombre.toLowerCase().indexOf(t)>=0; }).slice(0,30);
      if(!res.length){ box.innerHTML='<div class="ac-empty">Sin coincidencias</div>'; box.classList.add('show'); return; }
      box.innerHTML=res.map(function(i){ return '<div class="ac-item" data-id="'+S.esc(i.id)+'">'+S.esc(i.nombre)+'</div>'; }).join('');
      box.classList.add('show');
      Array.prototype.forEach.call(box.querySelectorAll('.ac-item'),function(d){
        d.onclick=function(){
          var it=items.filter(function(x){ return String(x.id)===d.getAttribute('data-id'); })[0];
          input.value=it.nombre; if(hidden) hidden.value=it.id; box.classList.remove('show');
          S.bad(input,false); if(onPick) onPick(it);
        };
      });
    }
    input.addEventListener('focus',function(){ render(input.value); });
    input.addEventListener('input',function(){ if(hidden) hidden.value=''; render(input.value); });
    input.addEventListener('blur',function(){ setTimeout(function(){ box.classList.remove('show'); },180); });
  },
  // Motor de fluidez: revelado de tarjetas (una sola vez) y barra de progreso.
  // El ocultado inicial lo hizo html.fx-anim antes de pintar; si esto no corre,
  // el failsafe quita fx-anim y todo queda visible.
  fx: function(){
    if(S._fx) return; S._fx=true;
    var root=document.documentElement;
    // Sin DOM real (p. ej. tests bajo Node): no hace nada.
    if(!root || !document.body || typeof document.body.insertBefore!=='function') return;
    var body=document.querySelector('.dlg-body');
    // anim solo si html.fx-anim fue activado en <head> (false con reduce-motion / sin JS)
    var anim = (root.className||'').indexOf('fx-anim')>=0;

    // Barra de progreso ligada al scroll del cuerpo (solo si hay desbordamiento)
    var bar=document.createElement('div'); bar.className='dlg-progress';
    var fill=document.createElement('i'); bar.appendChild(fill);
    document.body.insertBefore(bar, document.body.firstChild);
    function prog(){
      if(!body) return;
      var max=body.scrollHeight-body.clientHeight;
      if(max>4){ bar.classList.add('on'); fill.style.width=(body.scrollTop/max*100)+'%'; }
      else bar.classList.remove('on');
    }
    if(body) body.addEventListener('scroll',prog);
    window.addEventListener('resize',prog);
    setTimeout(prog,80);

    if(!anim || !body) return; // sin animacion: todo ya visible

    // Marca de stagger en las tarjetas (el ocultado ya lo puso html.fx-anim antes de pintar)
    var i=0;
    Array.prototype.forEach.call(body.querySelectorAll('.card'),function(el){
      if(!el.style.getPropertyValue('--i')) el.style.setProperty('--i', Math.min(i++,4));
    });

    // Revela UNA sola vez al entrar en vista (no se repite tras reflujos de fuentes)
    var sel='.card, .reveal, .steps li';
    if(!('IntersectionObserver' in window)){
      Array.prototype.forEach.call(body.querySelectorAll(sel),function(el){ el.classList.add('is-in'); });
      return;
    }
    var io=new IntersectionObserver(function(ents){
      ents.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { root: body, rootMargin:'0px 0px -8% 0px', threshold:.02 });
    Array.prototype.forEach.call(body.querySelectorAll(sel),function(el){ io.observe(el); });
  }
};
if(document.readyState!=='loading'){ S.fx(); }
else document.addEventListener('DOMContentLoaded', function(){ S.fx(); });
