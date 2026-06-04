<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Diseño visual del sistema</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Figtree:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{
    --paper:#f7f1e8;
    --sheet:#ffffff;
    --ink:#2a2420;
    --muted:#8c8278;
    --line:#e7ddcf;
    --line-soft:#f0e8db;
    --accent:#bb5530;
    --accent-deep:#9a4324;
    --accent-soft:#f6e3d6;
    --green:#4f8a5b;
    --green-soft:#e1efe2;
    --amber:#cf9a32;
    --amber-soft:#f7ecd1;
    --red:#bf412c;
    --red-soft:#f7ddd6;
    --chrome:#fbfaf8;
    --chrome-line:#e4e0d9;
    --shadow:0 10px 30px -12px rgba(60,40,25,.28);
    --shadow-sm:0 2px 8px -3px rgba(60,40,25,.22);
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{
    margin:0;
    background:
      radial-gradient(1200px 600px at 80% -10%, #fbeede 0%, transparent 60%),
      var(--paper);
    color:var(--ink);
    font-family:"Figtree",sans-serif;
    line-height:1.5;
    -webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:1080px;margin:0 auto;padding:46px 24px 90px}
  .num{font-family:"Space Mono",monospace}

  /* Intro */
  .intro{margin-bottom:40px}
  .kicker{font-family:"Space Mono",monospace;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin:0 0 10px}
  .intro h1{font-family:"Fraunces",serif;font-weight:600;font-size:clamp(30px,5vw,46px);line-height:1.05;margin:0 0 12px;letter-spacing:-.01em}
  .intro p{max-width:62ch;color:#5d544b;margin:0;font-size:16px}

  /* Legend */
  .legend{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 0}
  .tag{font-family:"Space Mono",monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;padding:3px 8px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--muted)}
  .tag b{color:var(--accent);font-weight:700}

  .sectlabel{font-family:"Space Mono",monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin:54px 0 14px;display:flex;align-items:center;gap:12px}
  .sectlabel::after{content:"";flex:1;height:1px;background:var(--line)}

  /* Browser / Sheets chrome */
  .app{border-radius:14px;overflow:hidden;box-shadow:var(--shadow);border:1px solid var(--chrome-line);background:#fff;opacity:0;transform:translateY(14px);animation:rise .7s cubic-bezier(.2,.7,.2,1) forwards}
  .topbar{background:var(--chrome);border-bottom:1px solid var(--chrome-line);padding:9px 16px;display:flex;align-items:center;gap:10px}
  .dot{width:11px;height:11px;border-radius:50%}
  .dot.r{background:#e57a6a}.dot.y{background:#e6bd5c}.dot.g{background:#7bbf86}
  .fname{font-size:13px;color:#574e45;margin-left:8px;font-weight:600}
  .fname span{color:var(--muted);font-weight:400}
  .menubar{background:#fff;border-bottom:1px solid var(--chrome-line);padding:0 14px;display:flex;align-items:center;gap:2px;position:relative;flex-wrap:wrap}
  .mi{font-size:13px;color:#5d544b;padding:9px 9px;border-radius:6px}
  .mi.sys{color:#fff;background:var(--accent);font-weight:600;margin:5px 2px;padding:6px 12px;border-radius:7px}
  .menudrop{position:absolute;top:46px;left:calc(100% - 0px);}
  .menudrop{position:absolute;top:44px;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);padding:7px;width:230px;z-index:5}
  .menudrop{left:auto}
  .drop-anchor{position:relative}
  .md-item{font-size:13px;padding:7px 10px;border-radius:7px;color:#473f37;display:flex;justify-content:space-between;align-items:center}
  .md-item:hover{background:var(--accent-soft);color:var(--accent-deep)}
  .md-item .ico{opacity:.55;font-size:12px}
  .md-sep{height:1px;background:var(--line-soft);margin:6px 4px}
  .md-head{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding:6px 10px 3px;font-family:"Space Mono",monospace}

  /* Sheet body */
  .sheet{background:
      linear-gradient(var(--line-soft) 1px, transparent 1px) 0 0/100% 34px,
      var(--sheet);
    padding:30px 30px 38px;min-height:300px}
  .sheet-inner{background:#fff;border:1px solid var(--line);border-radius:14px;padding:26px;box-shadow:var(--shadow-sm)}

  .home-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:8px}
  .home-head h2{font-family:"Fraunces",serif;font-weight:600;font-size:26px;margin:0}
  .home-head .date{font-family:"Space Mono",monospace;font-size:12px;color:var(--muted)}
  .zonelbl{font-family:"Space Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:26px 0 12px}

  /* Cards */
  .cards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
  .card{border:1px solid var(--line);border-radius:12px;padding:14px;background:#fff;position:relative;overflow:hidden}
  .card .big{font-family:"Space Mono",monospace;font-size:26px;font-weight:700;line-height:1}
  .card .lbl{font-size:12px;color:var(--muted);margin-top:6px}
  .card .strip{position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--accent)}
  .card.g .strip{background:var(--green)} .card.g .big{color:var(--green)}
  .card.a .strip{background:var(--amber)} .card.a .big{color:var(--amber)}
  .card.r .strip{background:var(--red)} .card.r .big{color:var(--red)}

  /* Nav buttons */
  .navgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .navbtn{border:1px solid var(--line);border-radius:12px;padding:16px 14px;background:#fff;cursor:pointer;text-decoration:none;color:var(--ink);display:block;transition:.18s}
  .navbtn:hover{border-color:var(--accent);background:var(--accent-soft);transform:translateY(-2px)}
  .navbtn .ic{width:34px;height:34px;border-radius:9px;background:var(--accent-soft);color:var(--accent-deep);display:grid;place-items:center;font-size:17px;margin-bottom:10px}
  .navbtn .t{font-weight:600;font-size:14px}
  .navbtn .s{font-size:11.5px;color:var(--muted);margin-top:2px}

  /* Alerts */
  .alerts{border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .alert{display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid var(--line-soft);font-size:13.5px}
  .alert:last-child{border-bottom:0}
  .pill{font-family:"Space Mono",monospace;font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:3px 8px;border-radius:999px;white-space:nowrap}
  .pill.r{background:var(--red-soft);color:var(--red)}
  .pill.a{background:var(--amber-soft);color:#9c7415}
  .pill.b{background:var(--accent-soft);color:var(--accent-deep)}
  .alert .lk{margin-left:auto;color:var(--accent);font-weight:600;font-size:12.5px}

  /* Dialog mockups */
  .dialog{max-width:560px;margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);overflow:hidden}
  .dialog.wide{max-width:680px}
  .dlg-head{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;border-bottom:1px solid var(--line);background:linear-gradient(#fff,#fdfaf6)}
  .dlg-head h3{font-family:"Fraunces",serif;font-size:18px;font-weight:600;margin:0}
  .dlg-head .x{color:var(--muted);font-size:18px}
  .dlg-body{padding:20px}
  .dlg-foot{padding:14px 20px;border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:10px;background:#fdfaf6}
  .btn{font-family:"Figtree";font-size:13.5px;font-weight:600;padding:9px 18px;border-radius:9px;border:1px solid var(--line);background:#fff;color:#5d544b;cursor:pointer}
  .btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
  .btn.danger{background:#fff;border-color:var(--red);color:var(--red)}
  .btn.go{background:var(--green);border-color:var(--green);color:#fff}

  .grp-title{font-family:"Space Mono",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin:4px 0 12px;padding-top:4px}
  .grp-title.mt{margin-top:22px;border-top:1px dashed var(--line);padding-top:18px}

  .field{margin-bottom:14px}
  .field .lab{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap}
  .field .lab b{font-size:13px;font-weight:600}
  .field .req{color:var(--accent);font-weight:700}
  .field .opt{font-size:11px;color:var(--muted)}
  .typetag{font-family:"Space Mono",monospace;font-size:9.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:1px 7px;margin-left:auto}
  .input{border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-size:13.5px;color:var(--ink);background:#fff;display:flex;align-items:center;gap:8px}
  .input.ph{color:var(--muted)}
  .input.ro{background:#f8f3ec;color:#6f655b}
  .input .car{margin-left:auto;color:var(--muted);font-size:11px}
  .input.calc{background:var(--accent-soft);border-color:#eecdba;color:var(--accent-deep);font-family:"Space Mono",monospace;font-weight:700}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .three{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:10px}

  .checks{display:flex;flex-direction:column;gap:8px}
  .chk{display:flex;align-items:center;gap:10px;font-size:13px;border:1px solid var(--line);border-radius:9px;padding:8px 11px}
  .box{width:16px;height:16px;border-radius:5px;border:1.5px solid var(--line)}
  .box.on{background:var(--accent);border-color:var(--accent);position:relative}
  .box.on::after{content:"✓";color:#fff;font-size:11px;position:absolute;left:2px;top:-2px}
  .chk .qty{margin-left:auto;font-family:"Space Mono",monospace;font-size:12px;color:var(--muted)}

  /* data tables inside dialogs */
  table.t{width:100%;border-collapse:collapse;font-size:12.5px;margin:4px 0}
  table.t th{text-align:left;font-family:"Space Mono",monospace;font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);font-weight:400;padding:7px 8px;border-bottom:1px solid var(--line)}
  table.t td{padding:8px;border-bottom:1px solid var(--line-soft)}
  table.t td.n,table.t th.n{text-align:right;font-family:"Space Mono",monospace}
  .stbadge{font-family:"Space Mono",monospace;font-size:10px;text-transform:uppercase;padding:2px 8px;border-radius:999px}
  .st-pend{background:#f0ece4;color:#7a7166}
  .st-apr{background:var(--green-soft);color:var(--green)}
  .st-prod{background:var(--accent-soft);color:var(--accent-deep)}
  .st-ent{background:#e5eef6;color:#3f6f9c}
  .st-rech{background:var(--red-soft);color:var(--red)}

  .rowact{display:flex;gap:6px;justify-content:flex-end}
  .mini{font-size:11px;padding:4px 9px;border-radius:7px;border:1px solid var(--line);color:#5d544b;background:#fff}
  .mini.ok{border-color:var(--green);color:var(--green)}
  .mini.no{border-color:var(--red);color:var(--red)}

  .total-line{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:#5d544b}
  .total-line.grand{border-top:2px solid var(--ink);margin-top:8px;padding-top:10px;font-weight:700;font-size:16px;color:var(--ink)}
  .total-line .num{font-family:"Space Mono",monospace}
  .total-box{background:#fbf6ef;border:1px solid var(--line);border-radius:11px;padding:14px 16px;margin-top:6px}

  .wa{display:flex;align-items:center;gap:8px;background:var(--green-soft);color:var(--green);border:1px solid #c4e0c8;border-radius:9px;padding:8px 12px;font-size:12.5px;font-weight:600}
  .prov-block{border:1px solid var(--line);border-radius:11px;padding:14px;margin-bottom:12px}
  .prov-block h4{margin:0 0 10px;font-size:13.5px;font-family:"Figtree";display:flex;justify-content:space-between;align-items:center}

  .note{font-size:12.5px;color:var(--muted);margin-top:14px;padding:11px 13px;background:#fbf6ef;border-radius:10px;border:1px dashed var(--line)}
  .caption{text-align:center;font-size:13px;color:var(--muted);margin:14px 0 0}
  .caption b{color:var(--ink)}

  /* nav map */
  pre.map{background:#241f1b;color:#f3e7d7;border-radius:14px;padding:24px;font-family:"Space Mono",monospace;font-size:12.5px;line-height:1.7;overflow-x:auto;box-shadow:var(--shadow)}
  pre.map b{color:#e9a06f}

  @keyframes rise{to{opacity:1;transform:none}}
  .app:nth-of-type(1){animation-delay:.05s}
  .reveal{opacity:0;transform:translateY(14px);animation:rise .6s cubic-bezier(.2,.7,.2,1) forwards}

  @media(max-width:740px){
    .cards{grid-template-columns:repeat(2,1fr)}
    .navgrid{grid-template-columns:repeat(2,1fr)}
    .two,.three{grid-template-columns:1fr}
    .menudrop{position:static;width:auto;margin:8px 0}
  }
</style>
</head>
<body>
<div class="wrap">

  <div class="intro reveal">
    <p class="kicker">Diseño visual · cómo va a quedar</p>
    <h1>El sistema, pantalla por pantalla</h1>
    <p>Esta es una maqueta de cómo se verá todo cuando esté construido sobre Google Sheets. Arriba, la barra de Sheets con el menú propio. Luego la hoja de Inicio, y debajo cada ventana de formulario con datos de ejemplo de una pastelería. Sirve como referencia visual del documento de interfaz.</p>
    <div class="legend">
      <span class="tag"><b>Obligatorio</b> se marca con *</span>
      <span class="tag">autocompletado</span>
      <span class="tag">dropdown</span>
      <span class="tag">checkboxes</span>
      <span class="tag">texto</span>
      <span class="tag">número</span>
      <span class="tag">fecha</span>
      <span class="tag">casilla</span>
      <span class="tag">solo lectura</span>
    </div>
  </div>

  <!-- ============ SHEETS CHROME + HOME ============ -->
  <div class="sectlabel">La ventana de Google Sheets y el menú Sistema</div>
  <div class="app">
    <div class="topbar">
      <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
      <span class="fname">Costeo Pastelería <span>· Google Sheets</span></span>
    </div>
    <div class="menubar">
      <span class="mi">Archivo</span><span class="mi">Editar</span><span class="mi">Ver</span>
      <span class="mi">Insertar</span><span class="mi">Formato</span><span class="mi">Datos</span>
      <span class="drop-anchor">
        <span class="mi sys">Sistema ▾</span>
        <div class="menudrop">
          <div class="md-item">Ir al Inicio <span class="ico">⌂</span></div>
          <div class="md-sep"></div>
          <div class="md-item">Nuevo presupuesto <span class="ico">＋</span></div>
          <div class="md-item">Ver presupuestos <span class="ico">▤</span></div>
          <div class="md-item">Ver pedidos <span class="ico">▤</span></div>
          <div class="md-sep"></div>
          <div class="md-item">Comprar materiales <span class="ico">🛒</span></div>
          <div class="md-item">Registrar compra <span class="ico">↓</span></div>
          <div class="md-item">Ajustar inventario <span class="ico">±</span></div>
          <div class="md-sep"></div>
          <div class="md-head">Catálogos</div>
          <div class="md-item">Clientes</div>
          <div class="md-item">Recetas</div>
          <div class="md-item">Insumos</div>
          <div class="md-item">Proveedores</div>
          <div class="md-item">Reglas de empaque</div>
          <div class="md-sep"></div>
          <div class="md-item">Configuración <span class="ico">⚙</span></div>
        </div>
      </span>
    </div>

    <div class="sheet">
      <div class="sheet-inner">
        <div class="home-head">
          <h2>Inicio</h2>
          <span class="date">lunes 01 jun 2026</span>
        </div>

        <div class="zonelbl">Resumen de hoy</div>
        <div class="cards">
          <div class="card"><div class="strip"></div><div class="big num">7</div><div class="lbl">Presupuestos pendientes</div></div>
          <div class="card a"><div class="strip"></div><div class="big num">2</div><div class="lbl">Vencen esta semana</div></div>
          <div class="card"><div class="strip"></div><div class="big num">3</div><div class="lbl">Pedidos en producción</div></div>
          <div class="card g"><div class="strip"></div><div class="big num">1</div><div class="lbl">Por entregar</div></div>
          <div class="card r"><div class="strip"></div><div class="big num">4</div><div class="lbl">Insumos en rojo</div></div>
        </div>

        <div class="zonelbl">Accesos</div>
        <div class="navgrid">
          <a class="navbtn" href="#presupuesto"><div class="ic">＋</div><div class="t">Nuevo presupuesto</div><div class="s">Crear y congelar precios</div></a>
          <a class="navbtn" href="#presupuestos"><div class="ic">▤</div><div class="t">Ver presupuestos</div><div class="s">Aprobar o rechazar</div></a>
          <a class="navbtn" href="#pedidos"><div class="ic">📦</div><div class="t">Ver pedidos</div><div class="s">Producción y entrega</div></a>
          <a class="navbtn" href="#compras"><div class="ic">🛒</div><div class="t">Comprar materiales</div><div class="s">Lista por proveedor</div></a>
          <a class="navbtn" href="#recepcion"><div class="ic">↓</div><div class="t">Registrar compra</div><div class="s">Sube stock y precio</div></a>
          <a class="navbtn" href="#ajuste"><div class="ic">±</div><div class="t">Ajustar inventario</div><div class="s">Mermas y conteos</div></a>
          <a class="navbtn" href="#insumos"><div class="ic">🧂</div><div class="t">Catálogos</div><div class="s">Recetas, insumos, más</div></a>
          <a class="navbtn" href="#config"><div class="ic">⚙</div><div class="t">Configuración</div><div class="s">Tarifas, IGV, margen</div></a>
        </div>

        <div class="zonelbl">Necesita tu atención</div>
        <div class="alerts">
          <div class="alert"><span class="pill a">vence en 2 días</span> Presupuesto P-0042 · María Quispe <span class="lk">Ver →</span></div>
          <div class="alert"><span class="pill r">agotado</span> Cacao en polvo · stock 0 g <span class="lk">Comprar →</span></div>
          <div class="alert"><span class="pill a">bajo mínimo</span> Mantequilla · 180 g de 500 g <span class="lk">Comprar →</span></div>
          <div class="alert"><span class="pill b">por entregar</span> Pedido PD-0019 · entrega hoy <span class="lk">Ver →</span></div>
        </div>
      </div>
    </div>
  </div>
  <p class="caption"><b>Hoja Inicio.</b> Único lugar pensado para mirarse: resumen, accesos y alertas. Todo lo demás se abre en ventanas.</p>

  <!-- ============ 6.1 NUEVO PRESUPUESTO ============ -->
  <div class="sectlabel" id="presupuesto">6.1 · Nuevo presupuesto</div>
  <div class="dialog wide reveal">
    <div class="dlg-head"><h3>Nuevo presupuesto</h3><span class="x">✕</span></div>
    <div class="dlg-body">
      <div class="grp-title">1 · Cliente y producto</div>
      <div class="two">
        <div class="field"><div class="lab"><b>Cliente</b><span class="req">*</span><span class="typetag">autocompletado</span></div><div class="input">María Quispe <span class="car">▾</span></div></div>
        <div class="field"><div class="lab"><b>Producto o receta</b><span class="req">*</span><span class="typetag">autocompletado</span></div><div class="input">Torta de chocolate <span class="car">▾</span></div></div>
      </div>

      <div class="grp-title mt">2 · Escalado</div>
      <div class="two">
        <div class="field"><div class="lab"><b>Modo de escalado</b><span class="req">*</span><span class="typetag">dropdown</span></div><div class="input">Número de personas <span class="car">▾</span></div></div>
        <div class="field"><div class="lab"><b>Valor</b><span class="req">*</span><span class="typetag">número</span></div><div class="input">25</div></div>
      </div>
      <div class="note" style="margin-top:0">Base de la receta: 10 personas. Factor aplicado: <b class="num">2.5×</b></div>

      <div class="grp-title mt">3 · Ingredientes <span style="color:var(--muted);text-transform:none;letter-spacing:0">(solo lectura, escalados)</span></div>
      <table class="t">
        <tr><th>Ingrediente</th><th class="n">Cantidad</th><th class="n">P. unitario</th><th class="n">Subtotal</th></tr>
        <tr><td>Harina</td><td class="n">937 g</td><td class="n">0.0032</td><td class="n">3.00</td></tr>
        <tr><td>Huevos</td><td class="n">12 u</td><td class="n">0.469</td><td class="n">5.63</td></tr>
        <tr><td>Azúcar</td><td class="n">750 g</td><td class="n">0.0040</td><td class="n">3.00</td></tr>
        <tr><td>Mantequilla</td><td class="n">500 g</td><td class="n">0.0240</td><td class="n">12.00</td></tr>
        <tr><td>Cacao en polvo</td><td class="n">300 g</td><td class="n">0.0070</td><td class="n">2.10</td></tr>
        <tr><td>Vainilla</td><td class="n">15 g</td><td class="n">0.0180</td><td class="n">0.27</td></tr>
      </table>
      <div class="total-line"><span>Costo de ingredientes</span><span class="num">S/ 26.00</span></div>

      <div class="grp-title mt">4 · Empaque y materiales</div>
      <div class="field"><div class="lab"><b>Empaques sugeridos</b><span class="opt">opcional</span><span class="typetag">checkboxes</span></div>
        <div class="checks">
          <div class="chk"><span class="box on"></span> Caja para torta grande <span class="qty">1 × S/ 3.50</span></div>
          <div class="chk"><span class="box on"></span> Base de cartón <span class="qty">1 × S/ 1.20</span></div>
          <div class="chk"><span class="box"></span> Cinta decorativa <span class="qty">0 × S/ 0.80</span></div>
        </div>
      </div>
      <div class="total-line"><span>Costo de materiales</span><span class="num">S/ 4.70</span></div>

      <div class="grp-title mt">5 · Otros costos <span style="color:var(--muted);text-transform:none;letter-spacing:0">(solo lectura, desde Config)</span></div>
      <div class="total-line"><span>Mano de obra · 1.5 h × S/ 12</span><span class="num">S/ 18.00</span></div>
      <div class="total-line"><span>Costos indirectos · fijo por pedido</span><span class="num">S/ 5.00</span></div>
      <div class="total-line"><span>Depreciación · fija por pedido</span><span class="num">S/ 3.00</span></div>

      <div class="grp-title mt">6 · Ganancia y precio</div>
      <div class="two">
        <div class="field"><div class="lab"><b>Margen de ganancia</b><span class="req">*</span><span class="typetag">número %</span></div><div class="input">35 %</div></div>
        <div class="field"><div class="lab"><b>Aplicar IGV</b><span class="opt">opcional</span><span class="typetag">casilla</span></div><div class="input"><span class="box on"></span> 18 % (desde Config)</div></div>
      </div>
      <div class="field"><div class="lab"><b>Notas</b><span class="opt">opcional</span><span class="typetag">texto</span></div><div class="input ph">Entrega para el sábado, sin nueces…</div></div>

      <div class="total-box">
        <div class="total-line"><span>Costo total de producción</span><span class="num">S/ 56.70</span></div>
        <div class="total-line"><span>Precio con margen (35 % sobre venta)</span><span class="num">S/ 87.23</span></div>
        <div class="total-line"><span>IGV 18 %</span><span class="num">S/ 15.70</span></div>
        <div class="total-line"><span>Redondeo al múltiplo de 5</span><span class="num">+ S/ 2.07</span></div>
        <div class="total-line grand"><span>Precio final</span><span class="num">S/ 105.00</span></div>
      </div>
    </div>
    <div class="dlg-foot"><span class="btn">Cancelar</span><span class="btn primary">Guardar presupuesto</span></div>
  </div>
  <p class="caption"><b>La pantalla central.</b> Una sola ventana con secciones; lo gris se calcula solo y se congela al guardar.</p>

  <!-- ============ 6.2 VER PRESUPUESTOS ============ -->
  <div class="sectlabel" id="presupuestos">6.2 · Ver presupuestos</div>
  <div class="dialog wide reveal">
    <div class="dlg-head"><h3>Presupuestos</h3><span class="x">✕</span></div>
    <div class="dlg-body">
      <div class="three">
        <div class="field" style="margin:0"><div class="lab"><b>Estado</b><span class="typetag">dropdown</span></div><div class="input">Todos <span class="car">▾</span></div></div>
        <div class="field" style="margin:0"><div class="lab"><b>Cliente</b><span class="typetag">autocompletado</span></div><div class="input ph">Todos <span class="car">▾</span></div></div>
        <div class="field" style="margin:0"><div class="lab"><b>Desde</b><span class="typetag">fecha</span></div><div class="input ph">01/05/2026 <span class="car">▦</span></div></div>
      </div>
      <table class="t" style="margin-top:14px">
        <tr><th>N°</th><th>Cliente</th><th>Emisión</th><th>Vence</th><th class="n">Precio</th><th>Estado</th><th></th></tr>
        <tr><td class="num">P-0042</td><td>María Quispe</td><td>30/05</td><td>14/06</td><td class="n">105.00</td><td><span class="stbadge st-pend">Pendiente</span></td><td><div class="rowact"><span class="mini">Ver</span><span class="mini ok">Aprobar</span><span class="mini no">Rechazar</span></div></td></tr>
        <tr><td class="num">P-0041</td><td>Café Luna</td><td>28/05</td><td>12/06</td><td class="n">240.00</td><td><span class="stbadge st-apr">Aprobado</span></td><td><div class="rowact"><span class="mini">Ver</span></div></td></tr>
        <tr><td class="num">P-0039</td><td>J. Torres</td><td>20/05</td><td>04/06</td><td class="n">68.00</td><td><span class="stbadge st-rech">Rechazado</span></td><td><div class="rowact"><span class="mini">Ver</span></div></td></tr>
      </table>
    </div>
  </div>

  <!-- ============ 6.3 DETALLE / APROBAR ============ -->
  <div class="sectlabel" id="detalle">6.3 · Detalle de presupuesto (aprobar o rechazar)</div>
  <div class="dialog reveal">
    <div class="dlg-head"><h3>Presupuesto P-0042 · solo lectura</h3><span class="x">✕</span></div>
    <div class="dlg-body">
      <div class="total-line"><span>Cliente</span><span>María Quispe</span></div>
      <div class="total-line"><span>Producto</span><span>Torta de chocolate · 25 personas</span></div>
      <div class="total-line"><span>Emitido / vence</span><span class="num">30/05 · 14/06</span></div>
      <div class="total-box">
        <div class="total-line"><span>Costo total</span><span class="num">S/ 56.70</span></div>
        <div class="total-line"><span>Margen 35 % · IGV 18 %</span><span class="num"></span></div>
        <div class="total-line grand"><span>Precio final</span><span class="num">S/ 105.00</span></div>
      </div>
      <div class="note">Al aprobar quedarán en negativo: <b>Cacao −180 g</b>, <b>Mantequilla −20 g</b>. Eso será tu lista de compras.</div>
    </div>
    <div class="dlg-foot"><span class="btn">Cerrar</span><span class="btn danger">Rechazar</span><span class="btn go">Aprobar → crear pedido</span></div>
  </div>

  <!-- ============ 6.4 VER PEDIDOS ============ -->
  <div class="sectlabel" id="pedidos">6.4 · Ver pedidos</div>
  <div class="dialog wide reveal">
    <div class="dlg-head"><h3>Pedidos</h3><span class="x">✕</span></div>
    <div class="dlg-body">
      <table class="t">
        <tr><th>N°</th><th>Origen</th><th>Cliente</th><th>Estado</th><th></th></tr>
        <tr><td class="num">PD-0019</td><td>P-0041</td><td>Café Luna</td><td><span class="stbadge st-prod">Producción</span></td><td><div class="rowact"><span class="mini">Ver</span><span class="mini ok">Marcar entregado</span><span class="mini no">Cancelar</span></div></td></tr>
        <tr><td class="num">PD-0018</td><td>P-0040</td><td>R. Díaz</td><td><span class="stbadge st-pend">Pendiente</span></td><td><div class="rowact"><span class="mini">Ver</span><span class="mini ok">Iniciar producción</span><span class="mini no">Cancelar</span></div></td></tr>
        <tr><td class="num">PD-0015</td><td>P-0036</td><td>María Quispe</td><td><span class="stbadge st-ent">Entregado</span></td><td><div class="rowact"><span class="mini">Ver</span></div></td></tr>
      </table>
      <div class="note">Solo aparecen las acciones que aplican a cada estado. Un entregado ya no se puede cancelar.</div>
    </div>
  </div>

  <!-- ============ 6.5 COMPRAR MATERIALES ============ -->
  <div class="sectlabel" id="compras">6.5 · Comprar materiales (lista por proveedor)</div>
  <div class="dialog reveal">
    <div class="dlg-head"><h3>Comprar materiales</h3><span class="x">✕</span></div>
    <div class="dlg-body">
      <div class="field"><div class="lab"><b>Modo</b><span class="typetag">dropdown</span></div><div class="input">Desde un pedido (PD-0018) <span class="car">▾</span></div></div>
      <div class="prov-block">
        <h4>Distribuidora El Molino <span class="wa">🟢 WhatsApp</span></h4>
        <table class="t" style="margin:0">
          <tr><th>Producto</th><th class="n">Comprar</th><th class="n">Últ. precio</th></tr>
          <tr><td>Cacao en polvo</td><td class="n">1 kg</td><td class="n">7.00</td></tr>
          <tr><td>Harina</td><td class="n">2 kg</td><td class="n">3.20</td></tr>
        </table>
      </div>
      <div class="prov-block">
        <h4>Lácteos San José <span class="wa">🟢 WhatsApp</span></h4>
        <table class="t" style="margin:0">
          <tr><th>Producto</th><th class="n">Comprar</th><th class="n">Últ. precio</th></tr>
          <tr><td>Mantequilla</td><td class="n">500 g</td><td class="n">12.00</td></tr>
        </table>
      </div>
    </div>
    <div class="dlg-foot"><span class="btn">Cerrar</span><span class="btn primary">Registrar compra →</span></div>
  </div>

  <!-- ============ 6.6 REGISTRAR COMPRA ============ -->
  <div class="sectlabel" id="recepcion">6.6 · Registrar compra (recepción)</div>
  <div class="dialog reveal">
    <div class="dlg-head"><h3>Registrar compra</h3><span class="x">✕</span></div>
    <div class="dlg-body">
      <div class="two">
        <div class="field"><div class="lab"><b>Proveedor</b><span class="req">*</span><span class="typetag">autocompletado</span></div><div class="input">Lácteos San José <span class="car">▾</span></div></div>
        <div class="field"><div class="lab"><b>Fecha</b><span class="req">*</span><span class="typetag">fecha</span></div><div class="input">01/06/2026 <span class="car">▦</span></div></div>
      </div>
      <div class="grp-title mt">Líneas</div>
      <table class="t">
        <tr><th>Producto *</th><th class="n">Cant. recibida *</th><th class="n">Precio present. *</th></tr>
        <tr><td>Mantequilla (500 g)</td><td class="n">1</td><td class="n">12.00</td></tr>
        <tr><td>+ agregar línea</td><td class="n"></td><td class="n"></td></tr>
      </table>
      <div class="note">Al guardar: sube stock, actualiza el precio de la presentación y recalcula el precio por gramo (0.0240) solo.</div>
    </div>
    <div class="dlg-foot"><span class="btn">Cancelar</span><span class="btn primary">Guardar compra</span></div>
  </div>

  <!-- ============ 6.7 AJUSTAR INVENTARIO ============ -->
  <div class="sectlabel" id="ajuste">6.7 · Ajustar inventario</div>
  <div class="dialog reveal">
    <div class="dlg-head"><h3>Ajustar inventario</h3><span class="x">✕</span></div>
    <div class="dlg-body">
      <div class="field"><div class="lab"><b>Producto</b><span class="req">*</span><span class="typetag">autocompletado</span></div><div class="input">Cacao en polvo <span class="car">▾</span></div></div>
      <div class="two">
        <div class="field"><div class="lab"><b>Tipo de ajuste</b><span class="req">*</span><span class="typetag">dropdown</span></div><div class="input">Merma <span class="car">▾</span></div></div>
        <div class="field"><div class="lab"><b>Cantidad</b><span class="req">*</span><span class="typetag">número</span></div><div class="input">− 120 g</div></div>
      </div>
      <div class="two">
        <div class="field"><div class="lab"><b>Motivo</b><span class="opt">opcional</span><span class="typetag">texto</span></div><div class="input ph">Se humedeció…</div></div>
        <div class="field"><div class="lab"><b>Fecha</b><span class="req">*</span><span class="typetag">fecha</span></div><div class="input">01/06/2026 <span class="car">▦</span></div></div>
      </div>
    </div>
    <div class="dlg-foot"><span class="btn">Cancelar</span><span class="btn primary">Guardar ajuste</span></div>
  </div>

  <!-- ============ 6.10 INSUMOS ============ -->
  <div class="sectlabel" id="insumos">6.10 · Catálogo de Insumos</div>
  <div class="dialog reveal">
    <div class="dlg-head"><h3>Insumo · Harina</h3><span class="x">✕</span></div>
    <div class="dlg-body">
      <div class="two">
        <div class="field"><div class="lab"><b>Nombre</b><span class="req">*</span><span class="typetag">texto</span></div><div class="input">Harina</div></div>
        <div class="field"><div class="lab"><b>Tipo</b><span class="req">*</span><span class="typetag">dropdown</span></div><div class="input">Ingrediente <span class="car">▾</span></div></div>
      </div>
      <div class="two">
        <div class="field"><div class="lab"><b>Unidad base</b><span class="req">*</span><span class="typetag">dropdown</span></div><div class="input">Gramos <span class="car">▾</span></div></div>
        <div class="field"><div class="lab"><b>Tamaño presentación</b><span class="req">*</span><span class="typetag">número</span></div><div class="input">1000 g</div></div>
      </div>
      <div class="two">
        <div class="field"><div class="lab"><b>Precio presentación</b><span class="req">*</span><span class="typetag">número</span></div><div class="input">S/ 3.20</div></div>
        <div class="field"><div class="lab"><b>Precio por gramo</b><span class="typetag">solo lectura</span></div><div class="input calc">0.0032</div></div>
      </div>
      <div class="three">
        <div class="field"><div class="lab"><b>Stock inicial</b><span class="opt">al crear</span><span class="typetag">número</span></div><div class="input">2500 g</div></div>
        <div class="field"><div class="lab"><b>Stock mínimo</b><span class="req">*</span><span class="typetag">número</span></div><div class="input">500 g</div></div>
        <div class="field"><div class="lab"><b>Proveedor rec.</b><span class="opt">opc.</span><span class="typetag">autocompl.</span></div><div class="input">El Molino <span class="car">▾</span></div></div>
      </div>
    </div>
    <div class="dlg-foot"><span class="btn">Cancelar</span><span class="btn primary">Guardar insumo</span></div>
  </div>
  <p class="caption">Los catálogos de <b>Clientes, Recetas, Proveedores y Reglas de empaque</b> siguen este mismo molde de ventana con lista y formulario.</p>

  <!-- ============ 6.13 CONFIG ============ -->
  <div class="sectlabel" id="config">6.13 · Configuración</div>
  <div class="dialog reveal">
    <div class="dlg-head"><h3>Configuración</h3><span class="x">✕</span></div>
    <div class="dlg-body">
      <div class="two">
        <div class="field"><div class="lab"><b>Tarifa mano de obra / hora</b><span class="req">*</span><span class="typetag">número</span></div><div class="input">S/ 12.00</div></div>
        <div class="field"><div class="lab"><b>Costo indirecto / pedido</b><span class="req">*</span><span class="typetag">número</span></div><div class="input">S/ 5.00</div></div>
      </div>
      <div class="two">
        <div class="field"><div class="lab"><b>Depreciación / pedido</b><span class="req">*</span><span class="typetag">número</span></div><div class="input">S/ 3.00</div></div>
        <div class="field"><div class="lab"><b>Margen por defecto</b><span class="req">*</span><span class="typetag">número %</span></div><div class="input">35 %</div></div>
      </div>
      <div class="two">
        <div class="field"><div class="lab"><b>Aplicar IGV</b><span class="req">*</span><span class="typetag">casilla</span></div><div class="input"><span class="box on"></span> Sí</div></div>
        <div class="field"><div class="lab"><b>Tasa de IGV</b><span class="req">*</span><span class="typetag">número</span></div><div class="input">18 %</div></div>
      </div>
      <div class="two">
        <div class="field"><div class="lab"><b>Redondeo del precio</b><span class="req">*</span><span class="typetag">dropdown</span></div><div class="input">Múltiplo de 5 hacia arriba <span class="car">▾</span></div></div>
        <div class="field"><div class="lab"><b>Días de vencimiento</b><span class="req">*</span><span class="typetag">número</span></div><div class="input">15</div></div>
      </div>
      <div class="two">
        <div class="field"><div class="lab"><b>Descuento de stock</b><span class="req">*</span><span class="typetag">dropdown</span></div><div class="input">Al aprobar el pedido <span class="car">▾</span></div></div>
        <div class="field"><div class="lab"><b>Lista de tamaños</b><span class="req">*</span><span class="typetag">texto</span></div><div class="input">chico, mediano, grande</div></div>
      </div>
    </div>
    <div class="dlg-foot"><span class="btn">Cancelar</span><span class="btn primary">Guardar configuración</span></div>
  </div>

  <!-- ============ NAV MAP ============ -->
  <div class="sectlabel">Mapa de navegación</div>
  <pre class="map">  Abrir archivo
      │
      ▼
  <b>Hoja INICIO</b>  (resumen · accesos · alertas)
      │
      ├─ Menú <b>Sistema</b> (siempre visible arriba)
      │
      ├─ Nuevo presupuesto ........ ventana 6.1
      ├─ Ver presupuestos ......... ventana 6.2 ─▶ Detalle 6.3 (aprobar / rechazar)
      ├─ Ver pedidos .............. ventana 6.4 (producción / entregar / cancelar)
      ├─ Comprar materiales ....... ventana 6.5 ─▶ Registrar compra 6.6
      ├─ Registrar compra ......... ventana 6.6
      ├─ Ajustar inventario ....... ventana 6.7
      ├─ Catálogos
      │     ├─ Clientes  ├─ Recetas  ├─ Insumos
      │     ├─ Proveedores  └─ Reglas de empaque
      └─ Configuración ............ ventana 6.13

  Cada ventana se cierra y devuelve al INICIO.</pre>

</div>
</body>
</html>
