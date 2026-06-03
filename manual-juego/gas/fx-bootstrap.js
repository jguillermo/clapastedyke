// Copia EXACTA del bootstrap de src/Estilos.html (va en <head>, sincrono, antes de pintar).
// Oculta los estados iniciales ANTES de pintar (evita el parpadeo desaparecer/reaparecer).
// Sincrono y en <head>: corre antes de que el cuerpo se pinte. Solo si hay movimiento permitido.
(function(){
  try{
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduce){
      document.documentElement.className += ' fx-anim';
      // Failsafe: si el motor no corre en 4s, no dejes nada oculto.
      setTimeout(function(){
        if(!(window.S && S._fx)){
          document.documentElement.className =
            document.documentElement.className.replace(/\s*\bfx-anim\b/,'');
        }
      }, 4000);
    }
  }catch(e){}
})();
