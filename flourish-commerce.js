/* ════════════════════════════════════════════════════════════════
   FLOURISH COMMERCE — Giving + Gift Shop
   "The Agriculture of the Soul: The Law of the Harvest."

   Flow:
   • Storefront (catalog.json) → product detail → cart → checkout
   • Giving center → campaigns → gift → history
   • Admin: catalog/orders + giving reports (leader-gated)

   Money: Stripe TEST MODE. Two paths:
     1. LIVE (backend up): POST to BACKEND → Stripe Checkout Session redirect.
     2. TEST/DEMO (backend down or no keys): full simulated flow,
        records written to Supabase with status 'test_*'. Clearly labeled.
   No real money ever moves in test mode.
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ── Config ──
  const BACKEND_URL = (function(){
    // Prefer explicit override, then the known JARVIS portal backend, then same-origin.
    try {
      const ov = localStorage.getItem('flourish-backend-url');
      if(ov) return ov;
    } catch(e){}
    return 'http://localhost:8784';
  })();

  // ── State (module-local) ──
  const C = {
    catalog: null,            // parsed catalog.json
    cart: loadCart(),          // [{product_id, variant_id, qty}]
    view: 'storefront',       // storefront | product | cart | checkout | giving | givingHistory | admin | orders
    adminTab: 'catalog',      // catalog | orders | giving
    lastCheckout: null,       // {order_id, session_url, mode}
    backendState: null,       // null | 'live' | 'demo' — cached health probe
  };

  function loadCart(){
    try { return JSON.parse(localStorage.getItem('flourish-cart')||'[]'); }
    catch(e){ return []; }
  }
  function saveCart(){ localStorage.setItem('flourish-cart', JSON.stringify(C.cart)); updateCartBadge(); }

  // ── Helpers (delegates to main app) ──
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  function esc(s){ if(s===0) return '0'; if(!s) return ''; const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
  function toast(msg, ms=3200){
    let t=$('#toast'); if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), ms);
  }
  const fmtMoney = c => '$' + (c/100).toFixed(2);
  const fmtDate = d => new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});

  // Access the Supabase client from main app (window.sb is not exposed; main app uses closure).
  // We add a global hook below via the integration patch.
  function sbClient(){
    return window.__flourishSb || null;
  }
  function user(){ return window.__flourishUser || null; }
  function isStoreAdmin(){
    const u = user();
    if(!u) return false;
    // store admin = a profile flag, or a church leader (pragmatic)
    if(window.__flourishIsLeader && window.__flourishIsLeader()) return true;
    try { return !!(JSON.parse(localStorage.getItem('flourish-profile')||'null')||{}).is_store_admin; } catch(e){ return false; }
  }

  // ── Catalog loading ──
  async function loadCatalog(){
    if(C.catalog) return C.catalog;
    try{
      const r = await fetch('data/catalog.json');
      if(!r.ok) throw new Error('catalog load failed');
      C.catalog = await r.json();
    }catch(e){
      C.catalog = { meta:{brand:'Flourish',currency:'usd',tagline:'',note:''}, categories:[], products:[], campaigns:[] };
    }
    return C.catalog;
  }
  function findProduct(id){ return (C.catalog?.products||[]).find(p=>p.id===id); }
  function findVariant(pid, vid){ const p=findProduct(pid); if(!p) return null; return (p.variants||[]).find(v=>v.id===vid); }

  // ── Backend probe (cached for session) ──
  async function probeBackend(){
    if(C.backendState) return C.backendState;
    try{
      const ctrl = new AbortController();
      const to = setTimeout(()=>ctrl.abort(), 2500);
      const r = await fetch(`${BACKEND_URL}/health`, {signal:ctrl.signal});
      clearTimeout(to);
      if(r.ok){
        const cfg = await fetch(`${BACKEND_URL}/api/stripe-config`).then(x=>x.json()).catch(()=>({}));
        // live only if a real (non-dummy) publishable key is configured
        const pk = cfg.publishableKey||'';
        C.backendState = (pk && !pk.includes('dummy')) ? 'live' : 'demo';
      } else { C.backendState = 'demo'; }
    }catch(e){ C.backendState = 'demo'; }
    return C.backendState;
  }

  function modeLabel(){
    return C.backendState === 'live' ? 'Stripe Test Mode (live checkout)' : 'Demo Test Mode (no live keys)';
  }

  // ════════════════════════════════════════════════════════════════
  // ROUTER — called from main app showPage('shop' | 'giving' | 'store-admin')
  // Sub-views via ?v= query
  // ════════════════════════════════════════════════════════════════
  async function routeShop(raw){
    await loadCatalog();
    const m = $('#main');
    if(!m) return;
    const qp = new URLSearchParams((raw||'').split('?')[1] || '');
    const v = qp.get('v') || 'storefront';
    const id = qp.get('p');
    C.view = v;
    if(v==='product' && id) return renderProduct(m, id);
    if(v==='cart') return renderCart(m);
    if(v==='checkout') return renderCheckout(m);
    if(v==='orders') return renderOrders(m);
    if(v==='giving') return renderGiving(m, qp.get('c'));
    if(v==='givingHistory') return renderGivingHistory(m);
    if(v==='admin') return renderAdmin(m, qp.get('tab'));
    return renderStorefront(m, qp.get('cat'));
  }

  // Giving can be its own page too
  async function routeGiving(raw){
    await loadCatalog();
    const m = $('#main'); if(!m) return;
    const qp = new URLSearchParams((raw||'').split('?')[1] || '');
    return renderGiving(m, qp.get('c'));
  }

  // ════════════════════════════════════════════════════════════════
  // STOREFRONT
  // ════════════════════════════════════════════════════════════════
  function subNav(active){
    const tabs = [
      ['storefront','Store','🌾'],
      ['giving','Give','🫙'],
      ['orders','My Orders','📜'],
      ['givingHistory','My Gifts','🪙'],
    ];
    if(isStoreAdmin()) tabs.push(['admin','Admin','⚒️']);
    return `<div class="shop-subnav card-enter">${tabs.map(([k,l,i])=>
      `<button class="shop-subnav-btn ${active===k?'active':''}" onclick="window.FlourishCommerce.go('${k}${k==='admin'?'?tab=catalog':''}')">${i} ${l}</button>`
    ).join('')}</div>`;
  }

  async function renderStorefront(m, cat){
    const cats = C.catalog.categories || [];
    const prods = (C.catalog.products || []).filter(p => !cat || p.category===cat);
    m.innerHTML = `
      ${subNav('storefront')}
      <div class="page">
        <div class="shop-hero card-enter">
          <div class="shop-hero-seal">${window.FlourishArt.seal({size:64})}</div>
          <div>
            <div class="shop-hero-eyebrow">${esc(C.catalog.meta.brand)} · ${esc(C.catalog.meta.tagline||'')}</div>
            <div class="shop-hero-title">The Harvest Store</div>
            <div class="shop-hero-sub">${esc(C.catalog.meta.note||'')}</div>
          </div>
        </div>
        <div class="shop-cats card-enter">
          <button class="shop-cat-chip ${!cat?'active':''}" onclick="window.FlourishCommerce.go('storefront')">All</button>
          ${cats.map(c=>`<button class="shop-cat-chip ${cat===c.id?'active':''}" onclick="window.FlourishCommerce.go('storefront?cat=${c.id}')">${c.icon} ${esc(c.name)}</button>`).join('')}
        </div>
        <div class="shop-grid">
          ${prods.map((p,i)=>productCard(p,i)).join('')}
        </div>
        <div class="shop-footnote card-enter">
          Every purchase funds the charitable works of the Flourish ministry — benevolence, prison shipments, and the printing press. You are not buying a shirt. You are sowing into a harvest.
        </div>
        <div style="height:20px"></div>
      </div>`;
  }

  function productCard(p, i){
    const v = (p.variants&&p.variants[0]) || {};
    const compare = p.compare_cents ? `<span class="pc-compare">${fmtMoney(p.compare_cents)}</span>` : '';
    const lowStock = (v.inventory_count != null && v.inventory_count <= 8) ? `<div class="pc-lowstock">Only ${v.inventory_count} left</div>` : '';
    return `<div class="shop-card card-enter" style="animation-delay:${0.04*i}s" onclick="window.FlourishCommerce.go('product?p=${p.id}')">
      <div class="pc-art">${window.FlourishArt.render(p.art_seed||p.id, p.motif, {label:p.name})}</div>
      <div class="pc-body">
        <div class="pc-cat">${esc(catName(p.category))}</div>
        <div class="pc-name">${esc(p.name)}</div>
        <div class="pc-blurb">${esc(p.blurb||'')}</div>
        <div class="pc-foot">
          <span class="pc-price">${fmtMoney(p.price_cents)} ${compare}</span>
          <span class="pc-add" onclick="event.stopPropagation();window.FlourishCommerce.quickAdd('${p.id}','${v.id||''}')">+ Cart</span>
        </div>
        ${lowStock}
      </div>
    </div>`;
  }
  function catName(id){ const c=(C.catalog.categories||[]).find(x=>x.id===id); return c?c.name:id; }

  // ════════════════════════════════════════════════════════════════
  // PRODUCT DETAIL
  // ════════════════════════════════════════════════════════════════
  function renderProduct(m, id){
    const p = findProduct(id);
    if(!p){ m.innerHTML = `<div class="page"><div class="error-state"><div class="error-icon">🌾</div><p class="error-msg">Product not found.</p></div></div>`; return; }
    const variants = p.variants || [];
    const compare = p.compare_cents ? `<span class="pc-compare">${fmtMoney(p.compare_cents)}</span>` : '';
    m.innerHTML = `
      <div class="page">
        <button class="btn btn-ghost shop-back" onclick="window.FlourishCommerce.go('storefront')">◀ Back to store</button>
        <div class="shop-detail card-enter">
          <div class="pd-art-wrap">
            <div class="pd-art">${window.FlourishArt.render(p.art_seed||p.id, p.motif, {w:500,h:500,label:p.name})}</div>
            <div class="pd-art-meta">${esc(catName(p.category))} · Flourish Harvest Goods</div>
          </div>
          <div class="pd-info">
            <div class="pc-cat">${esc(catName(p.category))}</div>
            <div class="pd-name">${esc(p.name)}</div>
            <div class="pd-price">${fmtMoney(p.price_cents)} ${compare}</div>
            <div class="pd-blurb">${esc(p.blurb||'')}</div>
            <div class="pd-desc">${esc(p.description||'')}</div>
            ${variants.length?`
              <div class="pd-label">Choose variant</div>
              <div class="pd-variants">
                ${variants.map((v,i)=>`<button class="pd-variant ${i===0?'active':''}" data-vid="${v.id}" onclick="window.FlourishCommerce.selectVariant(this)">${esc(v.title)}${v.inventory_count!=null?` <span class="vv-stock">· ${v.inventory_count} in stock</span>`:''}</button>`).join('')}
              </div>
              <div class="pd-qty-row">
                <div class="pd-label">Quantity</div>
                <div class="qty-stepper">
                  <button onclick="window.FlourishCommerce.qty(-1)">−</button>
                  <input id="pd-qty" type="number" min="1" value="1" readonly>
                  <button onclick="window.FlourishCommerce.qty(1)">+</button>
                </div>
              </div>
              <button class="btn btn-primary pd-add-btn" onclick="window.FlourishCommerce.addToCart('${p.id}')">Add to cart — ${fmtMoney(p.price_cents)}</button>
              ${p.stripe_link ? `<a href="${p.stripe_link}" class="btn btn-stripe pd-buy-btn" target="_blank" rel="noopener">⚡ Buy now with Stripe</a>` : ''}
            `:`<div class="empty-mini">This item is currently unavailable.</div>`}
            <div class="pd-trust">
              <div>🪙 Hand-finished goods, made to last the journey.</div>
              <div>📦 Ships in 5–7 days. Free US shipping over $75.</div>
              <div>↩️ 30-day returns on unworn goods.</div>
            </div>
          </div>
        </div>
        <div style="height:20px"></div>
      </div>`;
  }

  // ════════════════════════════════════════════════════════════════
  // CART
  // ════════════════════════════════════════════════════════════════
  async function renderCart(m){
    if(!C.cart.length){
      m.innerHTML = `${subNav('storefront')}<div class="page">
        <div class="shop-empty card-enter"><div class="e-icon">🌾</div><div class="e-title">Your cart is empty</div>
        <div class="e-sub">The store is open. Come fill it.</div>
        <button class="btn btn-primary" onclick="window.FlourishCommerce.go('storefront')">Browse the Harvest Store</button></div>
        <div style="height:20px"></div></div>`;
      return;
    }
    const lines = C.cart.map((it,i)=>{
      const p = findProduct(it.product_id); if(!p) return '';
      const v = (p.variants||[]).find(x=>x.id===it.variant_id) || {};
      return `<div class="cart-line card-enter" style="animation-delay:${0.04*i}s">
        <div class="cl-art">${window.FlourishArt.render(p.art_seed||p.id, p.motif, {w:120,h:120,label:p.name})}</div>
        <div class="cl-info">
          <div class="cl-name">${esc(p.name)}</div>
          <div class="cl-var">${esc(v.title||'')}</div>
          <div class="cl-price">${fmtMoney(p.price_cents)}</div>
        </div>
        <div class="cl-qty">
          <button class="cl-step" onclick="window.FlourishCommerce.setQty(${i},${it.qty-1})">−</button>
          <span class="cl-qnum">${it.qty}</span>
          <button class="cl-step" onclick="window.FlourishCommerce.setQty(${i},${it.qty+1})">+</button>
        </div>
        <div class="cl-line-total">${fmtMoney(p.price_cents*it.qty)}</div>
        <button class="cl-remove" onclick="window.FlourishCommerce.removeLine(${i})">✕</button>
      </div>`;
    }).join('');
    const subtotal = cartSubtotal();
    const shipping = subtotal >= 7500 || subtotal === 0 ? 0 : 499;
    const tax = Math.round(subtotal * 0.0); // configurable; 0 for now (religious/nonprofit + simple)
    const total = subtotal + shipping + tax;
    m.innerHTML = `${subNav('storefront')}<div class="page">
      <div class="shop-section-title">Your Cart</div>
      <div class="cart-list">${lines}</div>
      <div class="cart-totals card-enter">
        <div class="ct-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
        <div class="ct-row"><span>Shipping</span><span>${shipping===0?'Free':fmtMoney(shipping)}</span></div>
        <div class="ct-row"><span>Tax</span><span>${fmtMoney(tax)}</span></div>
        <div class="ct-row ct-total"><span>Total</span><span>${fmtMoney(total)}</span></div>
      </div>
      <div class="cart-actions">
        <button class="btn btn-ghost" onclick="window.FlourishCommerce.go('storefront')">Continue shopping</button>
        <button class="btn btn-primary" onclick="window.FlourishCommerce.go('checkout')">Proceed to checkout →</button>
      </div>
      <div style="height:20px"></div>
    </div>`;
  }
  function cartSubtotal(){
    return C.cart.reduce((s,it)=>{ const p=findProduct(it.product_id); return s + (p?p.price_cents*it.qty:0); },0);
  }
  function cartCount(){ return C.cart.reduce((n,it)=>n+it.qty,0); }

  function updateCartBadge(){
    const n = cartCount();
    let b = $('#cart-badge');
    if(!b){
      const header = document.querySelector('.app-header');
      if(header){
        b = document.createElement('button');
        b.id='cart-badge'; b.className='cart-badge';
        b.onclick = ()=>window.FlourishCommerce.go('cart');
        // insert before theme toggle (first child of the right cluster)
        const cluster = header.children[1];
        cluster.insertBefore(b, cluster.firstChild);
      }
    }
    if(b){ b.innerHTML = `🛒${n?`<span class="cb-count">${n}</span>`:''}`; b.style.display = n? 'inline-flex':'none'; }
  }

  // ════════════════════════════════════════════════════════════════
  // CHECKOUT — Stripe test mode (live backend) or demo
  // ════════════════════════════════════════════════════════════════
  async function renderCheckout(m){
    if(!C.cart.length){ return renderCart(m); }
    await probeBackend();
    const mode = C.backendState;
    const subtotal = cartSubtotal();
    const shipping = subtotal >= 7500 ? 0 : 499;
    const tax = 0;
    const total = subtotal + shipping + tax;

    m.innerHTML = `${subNav('storefront')}<div class="page">
      <div class="shop-section-title">Checkout</div>
      <div class="checkout-mode card-enter">
        <div class="cm-badge ${mode}">${mode==='live'?'LIVE TEST MODE':'DEMO TEST MODE'}</div>
        <div class="cm-text">${mode==='live'
          ? 'You will be redirected to Stripe Checkout. Use a Stripe test card (4242 4242 4242 4242). No real charge — this is the live Stripe test environment.'
          : 'Backend not reachable or no live Stripe keys configured. This is a fully simulated checkout so you can test the entire flow. No real money moves. Records are written with status <code>test_completed</code>.'}</div>
      </div>
      <div class="checkout-grid">
        <div class="checkout-form card-enter">
          <div class="cf-title">Shipping details</div>
          <input id="ck-name" class="cf-input" placeholder="Full name" autocomplete="name">
          <input id="ck-email" class="cf-input" type="email" placeholder="Email (for receipt)" autocomplete="email">
          <input id="ck-line1" class="cf-input" placeholder="Street address" autocomplete="address-line1">
          <div class="cf-row">
            <input id="ck-city" class="cf-input" placeholder="City" autocomplete="address-level2">
            <input id="ck-state" class="cf-input" placeholder="State" autocomplete="address-level1">
          </div>
          <div class="cf-row">
            <input id="ck-zip" class="cf-input" placeholder="ZIP" autocomplete="postal-code">
            <input id="ck-country" class="cf-input" value="US" placeholder="Country" autocomplete="country">
          </div>
          <div class="cf-title" style="margin-top:16px">Payment</div>
          ${mode==='live'
            ? `<div class="cf-note">You will enter your card on the secure Stripe page after clicking "Pay".</div>`
            : `<div class="cf-note">Demo mode — no card needed. Use test card <code>4242 4242 4242 4242</code> · any future date · any CVC.</div>
               <input id="ck-card" class="cf-input" placeholder="Card number" value="4242 4242 4242 4242">
               <div class="cf-row">
                 <input id="ck-exp" class="cf-input" placeholder="MM/YY" value="12/30">
                 <input id="ck-cvc" class="cf-input" placeholder="CVC" value="123">
               </div>`}
        </div>
        <div class="checkout-summary card-enter">
          <div class="cf-title">Order summary</div>
          <div class="cs-lines">
            ${C.cart.map(it=>{ const p=findProduct(it.product_id); const v=(p.variants||[]).find(x=>x.id===it.variant_id)||{}; return `<div class="cs-line"><span class="cs-qty">${it.qty}×</span> <span class="cs-name">${esc(p.name)} <span class="cs-var">${esc(v.title||'')}</span></span><span class="cs-price">${fmtMoney(p.price_cents*it.qty)}</span></div>`; }).join('')}
          </div>
          <div class="ct-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
          <div class="ct-row"><span>Shipping</span><span>${shipping===0?'Free':fmtMoney(shipping)}</span></div>
          <div class="ct-row"><span>Tax</span><span>${fmtMoney(tax)}</span></div>
          <div class="ct-row ct-total"><span>Total</span><span>${fmtMoney(total)}</span></div>
          <button class="btn btn-primary ck-pay-btn" id="ck-pay" onclick="window.FlourishCommerce.pay(${total})">${mode==='live'?'Pay with Stripe':'Complete test order — '+fmtMoney(total)}</button>
          <div class="cf-note" style="margin-top:10px">🔒 Secure checkout. ${modeLabel()}.</div>
        </div>
      </div>
      <div style="height:20px"></div>
    </div>`;
  }

  async function pay(total){
    const name = ($('#ck-name')?.value||'').trim();
    const email = ($('#ck-email')?.value||'').trim();
    const line1 = ($('#ck-line1')?.value||'').trim();
    const city = ($('#ck-city')?.value||'').trim();
    const state = ($('#ck-state')?.value||'').trim();
    const zip = ($('#ck-zip')?.value||'').trim();
    const country = ($('#ck-country')?.value||'US').trim();
    if(!name || !email || !line1 || !city || !state || !zip){
      toast('Please fill in all shipping fields.'); return;
    }
    const btn = $('#ck-pay'); if(btn){ btn.disabled=true; btn.textContent='Processing...'; }

    const items = C.cart.map(it=>{ const p=findProduct(it.product_id); const v=(p.variants||[]).find(x=>x.id===it.variant_id)||null; return { product_id:it.product_id, variant_id:it.variant_id, name:p.name, quantity:it.qty, unit_price_cents:p.price_cents, total_cents:p.price_cents*it.qty, variant_title: v?v.title:null }; });
    const order = {
      items, total_cents: total, subtotal_cents: cartSubtotal(),
      shipping_cents: total-cartSubtotal()-(Math.round(cartSubtotal()*0)),
      tax_cents: 0,
      shipping_name: name, shipping_email: email,
      shipping_address: { line1, city, state, postal_code: zip, country },
    };

    const mode = await probeBackend();
    try{
      if(mode==='live'){
        // LIVE: create order row + Stripe checkout session via backend
        const r = await fetch(`${BACKEND_URL}/api/create-order-session`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ order, success_url: successURL(), cancel_url: cancelURL() })
        });
        if(!r.ok) throw new Error('Backend error '+r.status);
        const data = await r.json();
        C.lastCheckout = { order_id: data.order_id, session_url: data.url, mode:'live' };
        // persist order locally as pending; backend webhook finalizes
        await persistOrder({ ...order, id: data.order_id, status:'pending', created_at:new Date().toISOString(), mode:'live' });
        toast('Redirecting to secure checkout...');
        window.location.href = data.url;
        return;
      } else {
        // DEMO: simulate a successful charge
        await sleep(900); // fake processing delay
        const orderId = 'ord_test_'+Date.now().toString(36);
        await persistOrder({ ...order, id: orderId, status:'test_completed', created_at:new Date().toISOString(), mode:'demo' });
        C.cart = []; saveCart();
        C.lastCheckout = { order_id: orderId, session_url:null, mode:'demo' };
        return renderOrderSuccess(m2(), orderId, 'order');
      }
    }catch(e){
      toast('⚠️ '+e.message);
      if(btn){ btn.disabled=false; btn.textContent='Retry payment'; }
    }
  }
  function m2(){ return $('#main'); }
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  function successURL(){ const o = location.origin+location.pathname; return `${o}#shop?v=success&type=order`; }
  function cancelURL(){ const o = location.origin+location.pathname; return `${o}#shop?v=checkout`; }

  // ════════════════════════════════════════════════════════════════
  // ORDER PERSISTENCE (Supabase if available, else localStorage)
  // ════════════════════════════════════════════════════════════════
  async function persistOrder(order){
    const sb = sbClient(); const u = user();
    if(sb && u){
      try{
        // Insert order + items. church_id null for global store.
        const { data:oRow, error } = await sb.from('orders').insert({
          user_id: u.id, church_id: null, total_cents: order.total_cents,
          tax_cents: order.tax_cents||0, shipping_cents: order.shipping_cents||0,
          status: order.status, shipping_name: order.shipping_name,
          shipping_address: order.shipping_address, email: order.shipping_email
        }).select().single();
        if(!error && oRow){
          for(const it of order.items){
            await sb.from('order_items').insert({
              order_id: oRow.id, product_id: it.product_id, variant_id: it.variant_id,
              name: it.name, quantity: it.quantity, unit_price_cents: it.unit_price_cents, total_cents: it.total_cents
            });
          }
          return oRow.id;
        }
      }catch(e){ /* fall through to local */ }
    }
    // local fallback
    const hist = JSON.parse(localStorage.getItem('flourish-orders')||'[]');
    hist.push(order); localStorage.setItem('flourish-orders', JSON.stringify(hist));
    return order.id;
  }

  async function loadOrders(){
    const sb = sbClient(); const u = user();
    if(sb && u){
      try{
        const { data, error } = await sb.from('orders').select('*,items:order_items(*)').eq('user_id', u.id).order('created_at',{ascending:false});
        if(!error && data) return data;
      }catch(e){}
    }
    return JSON.parse(localStorage.getItem('flourish-orders')||'[]');
  }

  async function renderOrders(m){
    m.innerHTML = `${subNav('orders')}<div class="page">
      <div class="shop-section-title">My Orders</div>
      <div class="sacred-loader card-enter"><div class="seed-glyph">📜</div><p class="loader-text">Gathering your orders...</p></div>
    </div>`;
    const orders = await loadOrders();
    if(!orders.length){
      m.innerHTML = `${subNav('orders')}<div class="page">
        <div class="shop-empty card-enter"><div class="e-icon">📜</div><div class="e-title">No orders yet</div>
        <div class="e-sub">When you place an order, it will appear here with a full record.</div>
        <button class="btn btn-primary" onclick="window.FlourishCommerce.go('storefront')">Browse the store</button></div>
        <div style="height:20px"></div></div>`;
      return;
    }
    m.innerHTML = `${subNav('orders')}<div class="page">
      <div class="shop-section-title">My Orders</div>
      ${orders.map(o=>orderCard(o)).join('')}
      <div style="height:20px"></div>
    </div>`;
  }
  function orderCard(o){
    const items = o.items || (o.items ? o.items : (o.items||[]));
    const total = o.total_cents ?? 0;
    const status = o.status || 'unknown';
    const dt = o.created_at ? fmtDate(o.created_at) : '';
    return `<div class="order-card card-enter">
      <div class="oc-head">
        <div class="oc-id">Order ${esc(String(o.id||'').slice(0,8))}</div>
        <div class="oc-date">${dt}</div>
        <div class="oc-status ${status}">${esc(status)}</div>
      </div>
      <div class="oc-items">${(items||[]).map(it=>`<div class="oc-item"><span class="oi-qty">${it.quantity||1}×</span> <span class="oi-name">${esc(it.name||'Item')}</span> <span class="oi-price">${fmtMoney(it.total_cents||it.unit_price_cents||0)}</span></div>`).join('') || '<div class="empty-mini">—</div>'}</div>
      <div class="oc-foot"><span>Total</span><span>${fmtMoney(total)}</span></div>
    </div>`;
  }

  // ════════════════════════════════════════════════════════════════
  // GIVING
  // ════════════════════════════════════════════════════════════════
  async function renderGiving(m, campaignId){
    const campaigns = C.catalog.campaigns || [];
    const sel = campaigns.find(c=>c.id===campaignId) || campaigns[0];
    m.innerHTML = `${subNav('giving')}<div class="page">
      <div class="giving-hero card-enter">
        <div class="gh-seal">${window.FlourishArt.seal({size:80})}</div>
        <div class="gh-title">The Law of the Harvest</div>
        <div class="gh-verse">"He who sows sparingly will also reap sparingly, and he who sows bountifully will also reap bountifully. Each one must give as he has decided in his heart, not reluctantly or under compulsion — for God loves a cheerful giver."</div>
        <div class="gh-ref">2 Corinthians 9:6-7</div>
        <div class="gh-sub">Your gift funds the charitable works of the Flourish ministry. Every dollar is tracked, every campaign is accounted for, and every gift is receipted.</div>
      </div>

      <div class="give-grid">
        <div class="give-form card-enter">
          <div class="gf-title">Make a gift</div>
          <div class="gf-label">Choose a fund</div>
          <div class="gf-campaigns">
            ${campaigns.map(c=>`<button class="gf-camp ${sel&&c.id===sel.id?'active':''}" data-cid="${c.id}" onclick="window.FlourishCommerce.selectCampaign('${c.id}')">
              <div class="gfc-name">${esc(c.title)}</div>
              <div class="gfc-desc">${esc((c.description||'').slice(0,90))}${(c.description||'').length>90?'…':''}</div>
            </button>`).join('')}
          </div>
          <div class="gf-label">Amount</div>
          <div class="gf-amounts">
            ${[2500,5000,10000,25000,50000].map(a=>`<button class="gf-amt" onclick="window.FlourishCommerce.setAmount(${a})">${fmtMoney(a)}</button>`).join('')}
            <input id="gf-custom" class="cf-input gf-custom-input" type="number" min="1" placeholder="Other $" oninput="window.FlourishCommerce.setCustom(this.value)">
          </div>
          <div class="gf-label">Type</div>
          <div class="gf-type-row">
            <button class="gf-type active" data-gt="tithe" onclick="window.FlourishCommerce.setGType(this)">Tithe</button>
            <button class="gf-type" data-gt="offering" onclick="window.FlourishCommerce.setGType(this)">Offering</button>
            <button class="gf-type" data-gt="mission" onclick="window.FlourishCommerce.setGType(this)">Mission</button>
          </div>
          <div class="gf-label">Method</div>
          <div class="gf-method-row">
            <button class="gf-method active" data-gm="card" onclick="window.FlourishCommerce.setGMethod(this)">💳 Card</button>
            <button class="gf-method" data-gm="bank" onclick="window.FlourishCommerce.setGMethod(this)">🏦 Bank (ACH)</button>
          </div>
          <div class="gf-label">Message (optional)</div>
          <input id="gf-message" class="cf-input" placeholder="In honor of / a note to the ministry">
          <div class="gf-anon-row">
            <label class="gf-check"><input type="checkbox" id="gf-anon"> Give anonymously</label>
          </div>
          <div class="gf-rec-row">
            <label class="gf-check"><input type="checkbox" id="gf-recurring"> Make this a <strong>monthly</strong> gift</label>
          </div>
          <div class="gf-summary">
            <span>You are giving</span>
            <span id="gf-total" class="gf-total-amount">$0.00</span>
            <span>to <span id="gf-camp-name">${esc(sel?sel.title:'')}</span></span>
          </div>
          <button class="btn btn-primary gf-give-btn" id="gf-give" onclick="window.FlourishCommerce.give()">Give now →</button>
          <div class="gf-footnote">You will receive an email receipt. ${C.backendState==='live'?'Stripe test cards welcome.':'Demo test mode — no real charge.'}</div>
        </div>
        <div class="give-campaigns card-enter">
          <div class="gf-title">Active campaigns</div>
          ${campaigns.map(c=>campaignCard(c)).join('')}
        </div>
      </div>
      <div style="height:20px"></div>
    </div>`;
    // init internal giving state
    G.state = { campaign_id: sel?sel.id:null, amount_cents: 0, giving_type:'tithe', giving_method:'card', message:'', is_anonymous:false, recurring:false };
    await probeBackend();
    updateGTotal();
  }

  const G = { state:{ amount_cents:0 } };

  function campaignCard(c){
    const goal = c.goal_cents || 0;
    const raised = c.raised_cents || Math.floor(goal*0.18); // demo: show some progress
    const pct = goal? Math.min(100, Math.round(raised/goal*100)) : 0;
    return `<div class="camp-card" onclick="window.FlourishCommerce.selectCampaign('${c.id}');window.FlourishCommerce.go('giving?c=${c.id}')">
      <div class="camp-name">${esc(c.title)}</div>
      <div class="camp-desc">${esc(c.description||'')}</div>
      <div class="camp-bar"><div class="camp-bar-fill" style="width:${pct}%"></div></div>
      <div class="camp-meta"><span>${fmtMoney(raised)} raised</span><span>${fmtMoney(goal)} goal</span></div>
    </div>`;
  }

  function setAmount(c){ G.state.amount_cents = c; $('#gf-custom').value=''; updateGTotal(); }
  function setCustom(v){ G.state.amount_cents = Math.round((parseFloat(v)||0)*100); updateGTotal(); }
  function setGType(btn){ $$('.gf-type').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); G.state.giving_type=btn.dataset.gt; }
  function setGMethod(btn){ $$('.gf-method').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); G.state.giving_method=btn.dataset.gm; }
  function selectCampaign(id){
    G.state.campaign_id = id;
    const c = (C.catalog.campaigns||[]).find(x=>x.id===id);
    const nm = $('#gf-camp-name'); if(nm&&c) nm.textContent = c.title;
    $$('.gf-camp').forEach(b=>b.classList.toggle('active', b.dataset.cid===id));
  }
  function updateGTotal(){
    const t = $('#gf-total'); if(t) t.textContent = fmtMoney(G.state.amount_cents||0);
  }

  async function give(){
    const amount = G.state.amount_cents||0;
    if(amount < 100){ toast('Please enter an amount of at least $1.00'); return; }
    G.state.message = $('#gf-message')?.value?.trim() || '';
    G.state.is_anonymous = !!$('#gf-anon')?.checked;
    G.state.recurring = !!$('#gf-recurring')?.checked;
    const btn = $('#gf-give'); if(btn){ btn.disabled=true; btn.textContent='Processing...'; }
    const mode = await probeBackend();
    try{
      if(mode==='live'){
        const r = await fetch(`${BACKEND_URL}/api/create-giving-session`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ ...G.state, success_url: successURLGive(), cancel_url: cancelURL() })
        });
        if(!r.ok) throw new Error('Backend error '+r.status);
        const data = await r.json();
        await persistGift({ ...G.state, id: data.giving_id||null, status:'pending', created_at:new Date().toISOString(), mode:'live' });
        toast('Redirecting to secure checkout...');
        window.location.href = data.url;
        return;
      } else {
        // DEMO MODE: if the selected campaign has a real Stripe Payment Link, use it.
        const camp = (C.catalog.campaigns||[]).find(c=>c.id===G.state.campaign_id);
        const stripeUrl = G.state.recurring ? (camp&&camp.stripe_monthly) : (camp&&camp.stripe_one_time);
        if(stripeUrl){
          await persistGift({ ...G.state, id: null, status:'pending_stripe', created_at:new Date().toISOString(), mode:'stripe-link', currency:'usd' });
          toast('Redirecting to secure Stripe checkout...');
          window.location.href = stripeUrl;
          return;
        }
        await sleep(900);
        const gid = 'gift_test_'+Date.now().toString(36);
        await persistGift({ ...G.state, id: gid, status:'test_completed', created_at:new Date().toISOString(), mode:'demo', currency:'usd' });
        return renderOrderSuccess(m2(), gid, 'gift');
      }
    }catch(e){
      toast('⚠️ '+e.message);
      if(btn){ btn.disabled=false; btn.textContent='Retry gift'; }
    }
  }
  function successURLGive(){ const o = location.origin+location.pathname; return `${o}#shop?v=success&type=gift`; }

  async function persistGift(g){
    const sb = sbClient(); const u = user();
    if(sb && u){
      try{
        const { data, error } = await sb.from('giving_records').insert({
          user_id: u.id, church_id: null, campaign_id: g.campaign_id,
          amount_cents: g.amount_cents, currency: g.currency||'usd',
          giving_type: g.giving_type, giving_method: g.giving_method,
          message: g.message||null, is_anonymous: g.is_anonymous,
          status: g.status, recurring: !!g.recurring
        }).select().single();
        if(!error && data) return data.id;
      }catch(e){}
    }
    const hist = JSON.parse(localStorage.getItem('flourish-gifts')||'[]');
    hist.push(g); localStorage.setItem('flourish-gifts', JSON.stringify(hist));
    return g.id;
  }

  async function loadGifts(){
    const sb = sbClient(); const u = user();
    if(sb && u){
      try{
        const { data, error } = await sb.from('giving_records').select('*').eq('user_id', u.id).order('created_at',{ascending:false});
        if(!error && data) return data;
      }catch(e){}
    }
    return JSON.parse(localStorage.getItem('flourish-gifts')||'[]');
  }

  async function renderGivingHistory(m){
    m.innerHTML = `${subNav('givingHistory')}<div class="page">
      <div class="shop-section-title">My Gifts</div>
      <div class="sacred-loader card-enter"><div class="seed-glyph">🪙</div><p class="loader-text">Gathering your gifts...</p></div>
    </div>`;
    const gifts = await loadGifts();
    const total = gifts.reduce((s,g)=>s+(g.status==='completed'||g.status==='test_completed'?(g.amount_cents||0):0),0);
    if(!gifts.length){
      m.innerHTML = `${subNav('givingHistory')}<div class="page">
        <div class="shop-empty card-enter"><div class="e-icon">🪙</div><div class="e-title">No gifts recorded yet</div>
        <div class="e-sub">When you give, a full record and receipt appear here.</div>
        <button class="btn btn-primary" onclick="window.FlourishCommerce.go('giving')">Make a gift →</button></div>
        <div style="height:20px"></div></div>`;
      return;
    }
    m.innerHTML = `${subNav('givingHistory')}<div class="page">
      <div class="shop-section-title">My Gifts</div>
      <div class="give-total card-enter"><div class="gt-label">Total given (recorded)</div><div class="gt-amount">${fmtMoney(total)}</div></div>
      ${gifts.map(giftCard).join('')}
      <div style="height:20px"></div>
    </div>`;
  }
  function giftCard(g){
    const camp = (C.catalog.campaigns||[]).find(c=>c.id===g.campaign_id);
    const dt = g.created_at?fmtDate(g.created_at):'';
    return `<div class="gift-card card-enter">
      <div class="gc-head">
        <div class="gc-amount">${fmtMoney(g.amount_cents||0)}</div>
        <div class="gc-status ${g.status}">${esc(g.status||'')}</div>
      </div>
      <div class="gc-meta">${esc(g.giving_type||'gift')}${camp?' · '+esc(camp.title):''} · ${dt}</div>
      ${g.message?`<div class="gc-msg">"${esc(g.message)}"</div>`:''}
      ${g.recurring?`<div class="gc-rec">↻ Monthly recurring gift</div>`:''}
    </div>`;
  }

  // ════════════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ════════════════════════════════════════════════════════════════
  function renderSuccess(type){
    const m = m2();
    const isGift = type==='gift';
    m.innerHTML = `${subNav(isGift?'givingHistory':'orders')}<div class="page">
      <div class="success-hero card-enter">
        <div class="su-icon">${isGift?'🪙':'📜'}</div>
        <div class="su-title">${isGift?'Gift received':'Order placed'}</div>
        <div class="su-sub">${isGift
          ? 'Thank you for sowing into the harvest. Your gift is recorded and a receipt has been emailed. God loves a cheerful giver.'
          : 'Your order is confirmed. A receipt has been emailed. Hand-finished goods ship in 5–7 days.'}</div>
        <div class="su-mode">${modeLabel()}</div>
        <div class="su-actions">
          <button class="btn btn-primary" onclick="window.FlourishCommerce.go('${isGift?'givingHistory':'orders'}')">View ${isGift?'my gifts':'my orders'} →</button>
          <button class="btn btn-ghost" onclick="window.FlourishCommerce.go('${isGift?'giving':'storefront'}')">${isGift?'Give again':'Continue shopping'}</button>
        </div>
      </div>
      <div style="height:20px"></div>
    </div>`;
  }
  function renderOrderSuccess(m, id, type){ return renderSuccess(type); }

  // ════════════════════════════════════════════════════════════════
  // ADMIN — catalog/orders/giving reports (store admin / leader)
  // ════════════════════════════════════════════════════════════════
  async function renderAdmin(m, tab){
    if(!isStoreAdmin()){
      m.innerHTML = `${subNav('admin')}<div class="page">
        <div class="error-state card-enter"><div class="error-icon">🔒</div>
        <p class="error-msg">Store admin access required.</p>
        <div class="e-sub">Ask your church leadership to grant access, or enable store admin in your profile.</div></div>
        <div style="height:20px"></div></div>`;
      return;
    }
    const t = tab || 'catalog';
    C.adminTab = t;
    const adminTabs = [['catalog','Catalog','📦'],['orders','Orders','📜'],['giving','Giving Reports','🪙']];
    m.innerHTML = `${subNav('admin')}<div class="page">
      <div class="admin-head card-enter">
        <div class="ah-title">Flourish Store — Admin</div>
        <div class="ah-sub">Manage the catalog, fulfill orders, and review giving.</div>
      </div>
      <div class="admin-tabs">${adminTabs.map(([k,l,i])=>`<button class="admin-tab ${t===k?'active':''}" onclick="window.FlourishCommerce.go('admin?tab=${k}')">${i} ${l}</button>`).join('')}</div>
      <div id="admin-body"><div class="sacred-loader card-enter"><div class="seed-glyph">⚒️</div><p class="loader-text">Loading...</p></div></div>
      <div style="height:20px"></div>
    </div>`;
    if(t==='catalog') return renderAdminCatalog();
    if(t==='orders') return renderAdminOrders();
    if(t==='giving') return renderAdminGiving();
  }
  function renderAdminCatalog(){
    const body = $('#admin-body'); if(!body) return;
    const prods = C.catalog.products || [];
    body.innerHTML = `<div class="admin-section">
      <div class="as-head"><span>${prods.length} products</span><button class="btn btn-primary" onclick="window.FlourishCommerce.exportCatalog()">+ Export catalog</button></div>
      <div class="admin-table">
        <div class="at-row at-head"><span>Art</span><span>Name</span><span>Category</span><span>Price</span><span>Variants</span><span>Stock</span></div>
        ${prods.map(p=>{ const stock=(p.variants||[]).reduce((s,v)=>s+(v.inventory_count||0),0); return `<div class="at-row">
          <span class="at-art">${window.FlourishArt.render(p.art_seed||p.id, p.motif, {w:40,h:40,label:p.name})}</span>
          <span class="at-name">${esc(p.name)}</span><span>${esc(catName(p.category))}</span>
          <span>${fmtMoney(p.price_cents)}</span><span>${(p.variants||[]).length}</span>
          <span class="${stock<=10?'low':''}">${stock}</span></div>`; }).join('')}
      </div>
      <div class="cf-note">Catalog is defined in <code>data/catalog.json</code>. Edit and redeploy to update.</div>
    </div>`;
  }
  async function renderAdminOrders(){
    const body = $('#admin-body'); if(!body) return;
    const orders = await loadAllOrders();
    const rev = orders.reduce((s,o)=>s+(o.total_cents||0),0);
    body.innerHTML = `<div class="admin-section">
      <div class="as-metrics"><div class="metric"><div class="m-num">${orders.length}</div><div class="m-label">Orders</div></div>
        <div class="metric"><div class="m-num">${fmtMoney(rev)}</div><div class="m-label">Revenue</div></div></div>
      <div class="admin-table">
        <div class="at-row at-head"><span>ID</span><span>Date</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span></div>
        ${orders.map(o=>`<div class="at-row"><span class="at-mono">${esc(String(o.id||'').slice(0,10))}</span><span>${o.created_at?fmtDate(o.created_at):'-'}</span><span>${esc(o.shipping_name||o.email||'-')}</span><span>${(o.items||[]).length}</span><span>${fmtMoney(o.total_cents||0)}</span><span class="at-status ${o.status}">${esc(o.status||'')}</span></div>`).join('') || '<div class="empty-mini">No orders yet.</div>'}
      </div>
    </div>`;
  }
  async function renderAdminGiving(){
    const body = $('#admin-body'); if(!body) return;
    const gifts = await loadAllGifts();
    const total = gifts.reduce((s,g)=>s+(g.amount_cents||0),0);
    const byCamp = {};
    gifts.forEach(g=>{ const k=g.campaign_id||'general'; byCamp[k]=(byCamp[k]||0)+(g.amount_cents||0); });
    body.innerHTML = `<div class="admin-section">
      <div class="as-metrics"><div class="metric"><div class="m-num">${fmtMoney(total)}</div><div class="m-label">Total given</div></div>
        <div class="metric"><div class="m-num">${gifts.length}</div><div class="m-label">Gifts</div></div></div>
      <div class="gf-title" style="margin-top:14px">By campaign</div>
      <div class="admin-table">
        <div class="at-row at-head"><span>Campaign</span><span>Amount</span><span>Share</span></div>
        ${Object.entries(byCamp).map(([k,v])=>{ const c=(C.catalog.campaigns||[]).find(x=>x.id===k); return `<div class="at-row"><span>${esc(c?c.title:k)}</span><span>${fmtMoney(v)}</span><span>${total?Math.round(v/total*100):0}%</span></div>`; }).join('') || '<div class="empty-mini">No gifts yet.</div>'}
      </div>
      <div class="gf-title" style="margin-top:14px">Recent gifts</div>
      <div class="admin-table">
        <div class="at-row at-head"><span>Date</span><span>Amount</span><span>Type</span><span>Campaign</span><span>Status</span></div>
        ${gifts.slice(0,20).map(g=>{ const c=(C.catalog.campaigns||[]).find(x=>x.id===g.campaign_id); return `<div class="at-row"><span>${g.created_at?fmtDate(g.created_at):'-'}</span><span>${fmtMoney(g.amount_cents||0)}</span><span>${esc(g.giving_type||'-')}</span><span>${esc(c?c.title:'-')}</span><span class="at-status ${g.status}">${esc(g.status||'')}</span></div>`; }).join('') || '<div class="empty-mini">No gifts yet.</div>'}
      </div>
    </div>`;
  }
  async function loadAllOrders(){
    const sb = sbClient();
    if(sb){ try{ const { data } = await sb.from('orders').select('*,items:order_items(*)').order('created_at',{ascending:false}); if(data) return data; }catch(e){} }
    return JSON.parse(localStorage.getItem('flourish-orders')||'[]');
  }
  async function loadAllGifts(){
    const sb = sbClient();
    if(sb){ try{ const { data } = await sb.from('giving_records').select('*').order('created_at',{ascending:false}); if(data) return data; }catch(e){} }
    return JSON.parse(localStorage.getItem('flourish-gifts')||'[]');
  }
  function exportCatalog(){
    const blob = new Blob([JSON.stringify(C.catalog,null,2)], {type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='flourish-catalog.json'; a.click();
    toast('📦 Catalog exported.');
  }

  // ════════════════════════════════════════════════════════════════
  // CART ACTIONS (public)
  // ════════════════════════════════════════════════════════════════
  function quickAdd(pid, vid){
    const p = findProduct(pid); if(!p) return;
    if(!vid) vid = (p.variants&&p.variants[0]&&p.variants[0].id) || '';
    // if same line exists, bump qty
    const ex = C.cart.find(it=>it.product_id===pid && it.variant_id===vid);
    if(ex){ ex.qty++; } else { C.cart.push({product_id:pid, variant_id:vid, qty:1}); }
    saveCart();
    toast(`🛒 Added ${p.name}`);
  }
  function addToCart(pid){
    const p = findProduct(pid); if(!p) return;
    const activeBtn = $('.pd-variant.active'); const vid = activeBtn?activeBtn.dataset.vid:((p.variants&&p.variants[0]&&p.variants[0].id)||'');
    if(!vid){ toast('Please choose a variant.'); return; }
    const qty = parseInt($('#pd-qty')?.value)||1;
    const ex = C.cart.find(it=>it.product_id===pid && it.variant_id===vid);
    if(ex){ ex.qty+=qty; } else { C.cart.push({product_id:pid, variant_id:vid, qty}); }
    saveCart();
    toast(`🛒 Added ${qty}× ${p.name}`);
    renderCart($('#main'));
  }
  function selectVariant(btn){ $$('.pd-variant').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
  function qty(delta){ const inp=$('#pd-qty'); if(!inp)return; let v=Math.max(1,(parseInt(inp.value)||1)+delta); inp.value=v; }
  function setQty(idx, n){ if(n<1){ return removeLine(idx); } C.cart[idx].qty=n; saveCart(); renderCart($('#main')); }
  function removeLine(idx){ C.cart.splice(idx,1); saveCart(); renderCart($('#main')); }

  function go(view){
    // view is like 'storefront', 'product?p=x', 'checkout', 'admin?tab=catalog'
    const base = view.split('?')[0];
    const qs = view.includes('?')?view.slice(view.indexOf('?')):'';
    if(base==='success'){
      const qp=new URLSearchParams(qs);
      return renderSuccess(qp.get('type')||'order');
    }
    location.hash = 'shop?v='+encodeURIComponent(base)+ (qs? qs.replace(/^\?/,'&'):'');
    // Let main app router pick it up; also render immediately for responsiveness
    routeShop(location.hash.replace('#',''));
  }

  // ════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════════════════════════
  window.FlourishCommerce = {
    route: routeShop,
    routeGiving,
    go,
    quickAdd, addToCart, selectVariant, qty, setQty, removeLine,
    selectCampaign, setAmount, setCustom, setGType, setGMethod, give,
    exportCatalog,
    cartCount: ()=>cartCount(),
    updateCartBadge,
    _state: C,
  };

  // initial badge
  setTimeout(updateCartBadge, 300);
})();