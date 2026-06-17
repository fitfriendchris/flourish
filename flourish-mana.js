/* ════════════════════════════════════════════════════════════
   FLOURISH — Falling Mana + Cinematic Atmosphere Engine
   Canvas particle system: drifting golden motes (mana from heaven),
   depth parallax, additive glow, spiritual-amber palette.
   Honors reduced-motion; pauses when tab hidden.
   ════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const win = window;
  const doc = document;

  // ── Config ──
  const CFG = {
    moteCount: 70,          // base count, scaled by viewport
    maxMotes: 140,
    minMotes: 35,
    spawnRate: 0.55,        // probability per frame of spawning a new mote when below count
    fallSpeed: [0.18, 0.55],// px/frame baseline
    drift: 0.35,             // horizontal sway amplitude
    size: [0.6, 2.8],       // px radius
    glowMul: 3.2,            // glow halo multiplier
    parallaxLayers: 3,      // depth tiers (0=back..2=front)
    palette: [              // rgba stops — amber/gold + rare spiritual violet
      {r:201,g:168,b:76, a:0.85},  // accent gold
      {r:223,g:192,b:122,a:0.70},  // light gold
      {r:166,g:136,b:62, a:0.55},  // deep gold
      {r:139,g:90, b:124,a:0.40},  // spiritual violet (rare)
      {r:255,g:240,b:200,a:0.95},  // near-white spark (rare)
    ],
    violetChance: 0.08,
    sparkChance: 0.05,
    twinkle: 0.018,          // alpha oscillation speed
    fps: 60,
  };

  // ── State ──
  let canvas, ctx, motes=[], W=0, H=0, dpr=1, rafId=null;
  let running=false, hidden=false, reducedMotion=false;
  let lastT=0, frameAcc=0;

  // ── Helpers ──
  const rand = (a,b)=> a + Math.random()*(b-a);
  const pick = arr => arr[(Math.random()*arr.length)|0];

  function buildMote(opts={}){
    const depth = opts.depth!=null ? opts.depth : (Math.random()*CFG.parallaxLayers)|0;
    const isViolet = Math.random() < CFG.violetChance;
    const isSpark  = Math.random() < CFG.sparkChance;
    let c;
    if (isSpark)      c = CFG.palette[4];
    else if (isViolet) c = CFG.palette[3];
    else              c = pick(CFG.palette.slice(0,3));
    const size = rand(...CFG.size) * (0.6 + depth*0.35);
    return {
      x: rand(0, W),
      y: opts.y!=null ? opts.y : rand(-H*0.3, H),
      depth,
      size,
      vy: rand(...CFG.fallSpeed) * (0.55 + depth*0.5),
      vx: rand(-CFG.drift, CFG.drift) * (0.4 + depth*0.4),
      phase: rand(0, Math.PI*2),
      twk: rand(0.5, 1.5) * CFG.twinkle,
      c,                                          // color stop
      a: rand(0.35, 0.95) * (0.5 + depth*0.3),    // base alpha
      life: 0,
      maxLife: rand(900, 2400),
      glow: size * CFG.glowMul,
    };
  }

  function targetCount(){
    const area = W*H;
    const base = Math.round(Math.sqrt(area)/22);
    return Math.max(CFG.minMotes, Math.min(CFG.maxMotes, base));
  }

  function ensurePopulation(){
    const tgt = targetCount();
    while (motes.length < tgt && Math.random() < CFG.spawnRate){
      motes.push(buildMote({y: rand(-30, -2)}));
    }
  }

  // ── Render ──
  function draw(t){
    const dt = lastT ? Math.min(64, t-lastT) : 16; lastT = t;
    frameAcc += dt;
    // step physics in fixed-ish increments
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';

    for (let i=motes.length-1; i>=0; i--){
      const m = motes[i];
      m.life += dt;
      m.x += m.vx * (dt/16);
      m.y += m.vy * (dt/16);
      m.phase += m.twk * (dt/16);
      // gentle horizontal sway
      m.vx += Math.sin(m.phase*0.7) * 0.0012 * (dt/16);
      m.vx *= 0.985;
      const tw = 0.55 + 0.45*Math.sin(m.phase);
      const a = m.a * tw;
      const r = m.size;
      const g = m.glow;

      // outer glow halo
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, g);
      grad.addColorStop(0,   `rgba(${m.c.r},${m.c.g},${m.c.b},${a*0.9})`);
      grad.addColorStop(0.35,`rgba(${m.c.r},${m.c.g},${m.c.b},${a*0.35})`);
      grad.addColorStop(1,   `rgba(${m.c.r},${m.c.g},${m.c.b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(m.x, m.y, g, 0, Math.PI*2); ctx.fill();

      // bright core
      ctx.fillStyle = `rgba(${m.c.r},${m.c.g},${m.c.b},${Math.min(1,a*1.4)})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI*2); ctx.fill();

      // recycle
      if (m.y > H + 20 || m.life > m.maxLife || m.x < -40 || m.x > W+40){
        motes.splice(i,1);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    if (!hidden) ensurePopulation();
    rafId = requestAnimationFrame(draw);
  }

  // ── Resize ──
  function resize(){
    W = canvas.width  = Math.floor(doc.documentElement.clientWidth  * dpr);
    H = canvas.height = Math.floor(doc.documentElement.clientHeight * dpr);
    canvas.style.width  = doc.documentElement.clientWidth + 'px';
    canvas.style.height = doc.documentElement.clientHeight + 'px';
    // seed initial population scaled to new size
    while (motes.length < targetCount()*0.6) motes.push(buildMote());
  }

  // ── Visibility / motion preference ──
  function onVisibility(){
    hidden = doc.hidden;
    if (hidden){ if (rafId){ cancelAnimationFrame(rafId); rafId=null; } }
    else if (running && !reducedMotion){ lastT=0; rafId=requestAnimationFrame(draw); }
  }
  function checkMotion(){
    reducedMotion = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ── Boot ──
  function boot(){
    canvas = doc.createElement('canvas');
    canvas.id = 'mana-canvas';
    canvas.setAttribute('aria-hidden','true');
    // inserted FIRST inside #app so it sits behind content
    const app = doc.getElementById('app') || doc.body;
    app.insertBefore(canvas, app.firstChild);
    ctx = canvas.getContext('2d');
    dpr = Math.min(2, win.devicePixelRatio || 1);
    resize();
    checkMotion();

    win.addEventListener('resize', resize);
    doc.addEventListener('visibilitychange', onVisibility);
    if (win.matchMedia){ win.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', checkMotion); }

    // respect theme: dim mana in light mode for legibility
    const applyTheme = ()=>{
      const theme = doc.documentElement.getAttribute('data-theme') || 'dark';
      canvas.style.opacity = theme==='light' ? '0.55' : '1';
    };
    applyTheme();
    const obs = new MutationObserver(applyTheme);
    obs.observe(doc.documentElement, {attributes:true, attributeFilter:['data-theme']});

    if (!reducedMotion){
      running=true;
      rafId = requestAnimationFrame(draw);
    } else {
      // static shimmer frame
      for (let i=0;i<30;i++) motes.push(buildMote());
      draw(performance.now()); running=false;
    }
  }

  // ── Public API ──
  win.FlourishMana = {
    start(){ if(!running && !reducedMotion){ running=true; lastT=0; rafId=requestAnimationFrame(draw);} },
    stop(){ running=false; if(rafId){ cancelAnimationFrame(rafId); rafId=null;} },
    burst(x,y,n=18){ // tap/gesture sparkle
      for (let i=0;i<n;i++){
        const m = buildMote({y:y});
        m.x = x + rand(-8,8);
        m.vy = rand(-0.6, 0.2);
        m.vx = rand(-0.8, 0.8);
        m.a = 1; m.maxLife = rand(400,800);
        motes.push(m);
      }
    },
    count(){ return motes.length; },
  };

  // ── Autostart ──
  if (doc.readyState==='loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();