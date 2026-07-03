(function(){
  'use strict';

  // ════════════════════════════════════════════
  // CONFIG
  // ════════════════════════════════════════════
  const SUPABASE_URL = 'https://rdnlorxsmyufaboftzus.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_j_DHEHR24w0Uyi_tbYT4TA_zgXuD58z';
  const TOTAL_DAYS = 1095;
  const YEAR_NAMES = {1:'Foundation', 2:'Deepening', 3:'Multiplication'};

  const sb = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

  // ════════════════════════════════════════════
  // QR CODE GENERATOR — Pure JS (no deps)
  // ════════════════════════════════════════════
  const QR = (function(){
    const EXP=[1,2,4,8,16,32,64,128,29,58,116,232,205,135,19,38,76,152,45,90,180,117,234,201,143,3,6,12,24,48,96,192,157,39,78,156,37,74,148,53,106,212,181,119,238,193,159,35,70,140,5,10,20,40,80,160,93,186,105,210,185,111,222,161,95,190,97,194,153,47,94,188,101,202,137,15,30,60,120,240,253,231,211,187,107,214,177,127,254,225,223,163,91,182,113,226,217,175,67,134,17,34,68,136,13,26,52,104,208,189,103,206,129,31,62,124,248,237,199,147,59,118,236,197,151,51,102,204,133,23,46,92,184,109,218,169,79,158,33,66,132,21,42,84,168,77,154,41,82,164,85,170,73,146,57,114,228,213,183,115,230,209,191,99,198,145,63,126,252,229,215,179,123,246,241,255,227,219,171,75,150,49,98,196,149,55,110,220,165,87,174,65,130,25,50,100,200,141,7,14,28,56,112,224,221,167,83,166,81,162,89,178,121,242,249,239,195,155,43,86,172,69,138,9,18,36,72,144,61,122,244,245,247,243,251,235,203,139,11,22,44,88,176,125,250,233,207,131,27,54,108,216,173,71,142];
    const LOG=Array(256).fill(0); for(let i=0;i<255;i++) LOG[EXP[i]]=i; LOG[0]=0;
    function mul(a,b){ if(!a||!b) return 0; return EXP[(LOG[a]+LOG[b])%255]; }
    function polyMul(a,b){ const r=Array(a.length+b.length-1).fill(0); for(let i=0;i<a.length;i++) for(let j=0;j<b.length;j++) r[i+j]^=mul(a[i],b[j]); return r; }
    function rsGen(n){ let g=[1]; for(let i=0;i<n;i++) g=polyMul(g,[1,EXP[i]]); return g; }
    function rsEnc(msg,ec){ const g=rsGen(ec); const out=msg.slice().concat(Array(ec).fill(0)); for(let i=0;i<msg.length;i++){ const c=out[i]; if(c) for(let j=0;j<g.length;j++) out[i+j]^=mul(g[j],c); } return out.slice(msg.length); }
    const SZ=29, D=26, E=10;
    function modeBits(data){ const bytes=new TextEncoder().encode(data); const bits=[0,1,0,0]; for(let i=7;i>=0;i--) bits.push((bytes.length>>>i)&1); for(const b of bytes) for(let i=7;i>=0;i--) bits.push((b>>>i)&1); while(bits.length%8) bits.push(0); const pad=[236,17]; while(bits.length/8<D) for(let j=7;j>=0;j--) bits.push((pad[(bits.length/8)%2]>>>j)&1); return bits; }
    function interleave(bits){ const cw=[]; for(let i=0;i<bits.length;i+=8){ let b=0; for(let j=0;j<8;j++) b=(b<<1)|bits[i+j]; cw.push(b); } const ec=rsEnc(cw.slice(0,D),E); return cw.concat(ec); }
    function create(data){ const m=Array.from({length:SZ},()=>Array(SZ).fill(-1));
      function finder(x,y){ for(let i=0;i<7;i++) for(let j=0;j<7;j++) m[y+i][x+j]=(i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4))?1:0; }
      finder(0,0); finder(SZ-7,0); finder(0,SZ-7);
      for(let i=0;i<8;i++) for(let j=0;j<8;j++){ if(i===7||j===7){ if(i<SZ&&j<SZ&&m[i][j]===-1) m[i][j]=0; } }
      for(let i=0;i<8;i++) for(let j=0;j<8;j++){ [[i,SZ-8+j],[SZ-8+i,j]].forEach(([px,py])=>{ if(px<SZ&&py<SZ&&m[py][px]===-1) m[py][px]=0; }); }
      for(let i=8;i<SZ-8;i++){ m[6][i]=i%2===0?1:0; m[i][6]=i%2===0?1:0; }
      m[SZ-8][8]=1;
      const words=interleave(modeBits(data)); let bi=0, dir=-1, col=SZ-1;
      while(col>0){ if(col===6) col--; for(let i=0;i<SZ;i++){ const row=dir===1?i:SZ-1-i; for(let c=0;c<2;c++){ const cc=col-c; if(m[row][cc]===-1){ m[row][cc]=(bi<words.length*8)?(words[Math.floor(bi/8)]>>>(7-(bi%8)))&1:0; bi++; } } } dir=-dir; col-=2; }
      return m;
    }
    function toSVG(data, opts={}){ const {size=200,color='#1a3c1a',bg='#f5f0e8'}=opts; const mod=create(data); const n=mod.length; const cell=Math.floor(size/n); const actual=cell*n; let paths=''; for(let y=0;y<n;y++) for(let x=0;x<n;x++) if(mod[y][x]) paths+=`M${x*cell},${y*cell}h${cell}v${cell}h-${cell}z`; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${actual} ${actual}" width="${actual}" height="${actual}"><rect width="${actual}" height="${actual}" fill="${bg}"/><path d="${paths}" fill="${color}"/></svg>`; }
    return { create: toSVG };
  })();

  // ════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════
  const state = {
    years: {1:null, 2:null, 3:null},
    plans: null,
    gender: 'men',
    currentDay: 1,
    progress: {},          // {dayNum: ts}
    planProg: {},          // {planId: {dayIdx: ts}}
    planEnroll: {},        // {planId: ts}
    theme: 'dark',
    user: null,
    profile: null,
    memberships: [],       // [{id, role, is_primary, churches:{...}}]
    activeChurchId: null,
    chatPoll: null,
    celebrated: {},
  };

  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  function esc(s){ if(s===0) return '0'; if(!s) return ''; const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
  function toast(msg, ms=3200){
    let t=$('#toast'); if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), ms);
  }
  const fmtDate = d => new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  const fmtDateTime = d => new Date(d).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});

  // ════════════════════════════════════════════
  // GEOLOCATION — church community by proximity
  // ════════════════════════════════════════════
  let geoPos = null; // {lat,lng} cached for the session
  function getGeo(){
    return new Promise((resolve, reject)=>{
      if(geoPos) return resolve(geoPos);
      if(!navigator.geolocation) return reject(new Error('Location is not supported on this device.'));
      navigator.geolocation.getCurrentPosition(
        p=>{ geoPos={lat:p.coords.latitude, lng:p.coords.longitude}; resolve(geoPos); },
        ()=>reject(new Error('Location permission denied. You can still search by name or city.')),
        {enableHighAccuracy:false, timeout:10000, maximumAge:600000}
      );
    });
  }
  function distMi(a, b){
    const R=3958.8, toR=x=>x*Math.PI/180;
    const dLat=toR(b.lat-a.lat), dLng=toR(b.lng-a.lng);
    const s=Math.sin(dLat/2)**2 + Math.cos(toR(a.lat))*Math.cos(toR(b.lat))*Math.sin(dLng/2)**2;
    return R*2*Math.asin(Math.sqrt(s));
  }
  const fmtMi = m => m==null ? '' : (m<10 ? m.toFixed(1) : Math.round(m)) + ' mi';
  const hasCoords = ch => typeof ch?.lat==='number' && typeof ch?.lng==='number';
  function withDistance(churches){
    return churches.map(ch=>({ ...ch, _mi: (geoPos && hasCoords(ch)) ? distMi(geoPos, ch) : null }));
  }
  function sortByDistance(churches){
    return withDistance(churches).sort((a,b)=>{
      if(a._mi==null && b._mi==null) return (a.name||'').localeCompare(b.name||'');
      if(a._mi==null) return 1;
      if(b._mi==null) return -1;
      return a._mi - b._mi;
    });
  }

  // ── Add-to-calendar (.ics) ──
  const evCache = {};
  function icsDownload(ev, churchName){
    const dt = t => new Date(t).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const end = ev.end_time || new Date(new Date(ev.start_time).getTime()+36e5).toISOString();
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Flourish//Church Hub//EN','BEGIN:VEVENT',
      'UID:'+ev.id+'@flourish','DTSTAMP:'+dt(Date.now()),'DTSTART:'+dt(ev.start_time),'DTEND:'+dt(end),
      'SUMMARY:'+(ev.title||'').replace(/[\n,;]/g,' '),
      'DESCRIPTION:'+((ev.description||'')+(churchName?' — '+churchName:'')).replace(/[\n;]/g,' ').replace(/,/g,'\\,'),
      'LOCATION:'+((ev.location_name||'')+(ev.location_address?', '+ev.location_address:'')).replace(/[\n,;]/g,' '),
      'END:VEVENT','END:VCALENDAR'].join('\r\n');
    const a=document.createElement('a');
    a.href='data:text/calendar;charset=utf-8,'+encodeURIComponent(ics);
    a.download=(ev.title||'event').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.ics';
    document.body.appendChild(a); a.click(); a.remove();
  }

  // ════════════════════════════════════════════
  // THE PROMISE — wisdom & biblical principles messaging
  // ════════════════════════════════════════════
  const PROMISE = {
    verse: '"By wisdom a house is built, and by understanding it is established; by knowledge the rooms are filled with all precious and pleasant riches."',
    ref: 'Proverbs 24:3-4',
    body: 'Flourish is built on one conviction: when everything in your life is governed by wisdom and biblical principles, your life gets better — not by accident, but by design. Every lesson you complete lays one more stone. Health, wealth, and relationships are not three separate projects; they are three rooms of one house, and wisdom builds them all.'
  };
  const AFFIRMATIONS = [
    '🌿 One more stone laid. Wisdom is building your house — Prov 24:3.',
    '🌱 Heard AND done. That is the house on the rock — Matt 7:24.',
    '⚒️ Discipline today, harvest of righteousness tomorrow — Heb 12:11.',
    '📖 You meditated on the Word today. Prosperity of soul follows — Psalm 1:3.',
    '🔥 Faithful in little. Being made ruler over much — Matt 25:21.',
    '🌳 Planted by streams of water. Your leaf will not wither — Psalm 1:3.',
    '👣 Your steps are being established. Keep walking — Prov 16:9.',
    '💪 The path of the righteous shines brighter and brighter — Prov 4:18.'
  ];
  const MILESTONES = {
    7:   {icon:'🌱', title:'One Week of Wisdom', verse:'"Blessed is the one who listens to me, watching daily at my doors."', ref:'Proverbs 8:34', body:'Seven days of watching daily at wisdom\'s door. Habits begin here. Your life is already turning toward the light — keep the streak sacred.'},
    21:  {icon:'🌿', title:'21 Days — A Habit Forged', verse:'"Let us not grow weary of doing good, for in due season we will reap."', ref:'Galatians 6:9', body:'Three weeks of daily obedience. What started as effort is becoming rhythm. The compounding has begun.'},
    50:  {icon:'🌳', title:'50 Days Planted', verse:'"He is like a tree planted by streams of water that yields its fruit in its season."', ref:'Psalm 1:3', body:'Fifty lessons applied. People around you are starting to notice something different. That is fruit — and it\'s just the first season.'},
    100: {icon:'⚒️', title:'100 Stones Laid', verse:'"By wisdom a house is built."', ref:'Proverbs 24:3', body:'One hundred days of building by wisdom and biblical principle. The house is taking shape: steadier mind, ordered money, deeper bonds.'},
    180: {icon:'🔥', title:'Half a Year of Faithfulness', verse:'"The path of the righteous is like the light of dawn, which shines brighter and brighter until full day."', ref:'Proverbs 4:18', body:'Six months. The dawn is unmistakable now. Review where you started — health, wealth, relationships — and give God the glory for the distance.'},
    365: {icon:'🏛️', title:'YEAR ONE COMPLETE — Foundation', verse:'"Everyone who hears these words of mine and does them will be like a wise man who built his house on the rock."', ref:'Matthew 7:24-25', body:'365 days heard AND done. The foundation is rock. Year Two — Deepening — will test it and build the walls. Enter it boldly.'},
    547: {icon:'⚔️', title:'Halfway Through the Journey', verse:'"Let your eyes look directly forward, and your gaze be straight before you."', ref:'Proverbs 4:25', body:'You are at the midpoint of 1,095 days. Most quit long before here. You didn\'t. Eyes forward — the second half builds the legacy.'},
    730: {icon:'🏗️', title:'YEAR TWO COMPLETE — Deepening', verse:'"And the one who had received the five talents made five talents more."', ref:'Matthew 25:20', body:'730 days. Disciplines stress-tested, streams multiplied, covenants deepened. Year Three — Multiplication — is where everything you built begins to flow through you to others.'},
    1000:{icon:'👑', title:'1,000 Days of Wisdom', verse:'"She is more precious than jewels, and nothing you desire can compare with her."', ref:'Proverbs 3:15', body:'One thousand days governed by wisdom and biblical principles. You are not the person who started this. Finish at full stride.'},
    1095:{icon:'🎓', title:'THE JOURNEY COMPLETE — Sent', verse:'"Well done, good and faithful servant. You have been faithful over a little; I will set you over much."', ref:'Matthew 25:21', body:'1,095 days. Foundation. Deepening. Multiplication. The house is built and the rooms are filled. Now the final command: go, and teach someone else to build. Your graduation is a commissioning.'}
  };

  // ════════════════════════════════════════════
  // STORAGE + JOURNEY ANCHOR
  // ════════════════════════════════════════════
  function lsGet(k, fb){ try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch(e){ return fb; } }
  function lsSet(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

  function loadLocal(){
    state.progress   = lsGet('flourish-progress', {});
    state.planProg   = lsGet('flourish-plan-progress', {});
    state.planEnroll = lsGet('flourish-plan-enrollments', {});
    state.celebrated = lsGet('flourish-milestones', {});
    const g = localStorage.getItem('flourish-gender'); if(g) state.gender = g;
    if(!localStorage.getItem('flourish-start-date')){
      // v9 users tracked by calendar day-of-year — anchor Jan 1 to preserve their day numbers
      const hasOld = Object.keys(state.progress).length > 0;
      const start = hasOld ? new Date(new Date().getFullYear(),0,1) : new Date();
      localStorage.setItem('flourish-start-date', start.toISOString().slice(0,10));
    }
  }
  function journeyStart(){ return new Date(localStorage.getItem('flourish-start-date') + 'T00:00:00'); }
  function todayIndex(){
    const diff = Math.floor((Date.now() - journeyStart().getTime()) / 864e5) + 1;
    return Math.max(1, Math.min(TOTAL_DAYS, diff));
  }
  function saveProgress(){ lsSet('flourish-progress', state.progress); }
  function doneCount(){ return Object.keys(state.progress).length; }

  // ════════════════════════════════════════════
  // DATA LOADING (3 years, lazy per-file)
  // ════════════════════════════════════════════
  const yearOf = day => day <= 365 ? 1 : day <= 730 ? 2 : 3;
  async function loadYear(y){
    if(state.years[y]) return state.years[y];
    const r = await fetch(`data/year${y}.json`);
    if(!r.ok) throw new Error(`Year ${y} data failed to load`);
    state.years[y] = await r.json();
    return state.years[y];
  }
  async function getDay(n){
    const y = yearOf(n);
    const data = await loadYear(y);
    return data[(n - 1) - (y - 1) * 365];
  }
  async function loadPlans(){
    if(state.plans) return state.plans;
    const r = await fetch('data/plans.json');
    state.plans = (await r.json());
    return state.plans;
  }

  // ════════════════════════════════════════════
  // THEME / GENDER
  // ════════════════════════════════════════════
  function loadTheme(){ const t=localStorage.getItem('flourish-theme'); if(t) state.theme=t; applyTheme(); }
  function applyTheme(){
    document.documentElement.setAttribute('data-theme', state.theme);
    const btn=$('#theme-toggle'); if(btn) btn.textContent = state.theme==='dark' ? '🌙' : '☀️';
  }
  function updateGenderUI(){ const t=$('#gender-toggle'); if(t) t.classList.toggle('women', state.gender==='women'); }

  // ════════════════════════════════════════════
  // SUPABASE: AUTH + SYNC
  // ════════════════════════════════════════════
  function updateAuthChip(){
    const chip = $('#auth-chip'); if(!chip) return;
    if(state.user){
      chip.textContent = state.profile?.display_name || state.user.email.split('@')[0];
      chip.classList.add('signed');
    } else { chip.textContent = 'Sign in'; chip.classList.remove('signed'); }
  }

  async function refreshIdentity(){
    if(!sb) return;
    const { data:{ session } } = await sb.auth.getSession();
    state.user = session?.user || null;
    if(state.user){
      const { data: prof } = await sb.from('profiles').select('*').eq('id', state.user.id).maybeSingle();
      state.profile = prof;
      if(prof?.gender && prof.gender !== state.gender){ state.gender = prof.gender; localStorage.setItem('flourish-gender', prof.gender); updateGenderUI(); }
      await loadMemberships();
      syncAll(); // fire and forget
    } else { state.profile=null; state.memberships=[]; state.activeChurchId=null; }
    updateAuthChip();
  }

  async function loadMemberships(){
    if(!sb || !state.user) return;
    const { data, error } = await sb.from('church_memberships')
      .select('id, role, is_primary, joined_at, church_id, churches(*)').order('joined_at');
    if(!error && data){
      state.memberships = data;
      if(!state.activeChurchId){
        const prim = data.find(m=>m.is_primary) || data[0];
        state.activeChurchId = prim?.church_id || null;
      }
    }
  }
  const myMembership = () => state.memberships.find(m=>m.church_id===state.activeChurchId);
  const isLeader = m => m && ['church_admin','pastor','super_admin'].includes(m.role);

  async function syncAll(){
    if(!sb || !state.user) return;
    try {
      // devotional progress: pull + push merge
      const { data: cloud } = await sb.from('user_progress').select('day_number, completed_at');
      const cloudSet = new Set((cloud||[]).map(r=>r.day_number));
      (cloud||[]).forEach(r=>{ if(!state.progress[r.day_number]) state.progress[r.day_number]=new Date(r.completed_at).getTime(); });
      saveProgress();
      const toPush = Object.entries(state.progress).filter(([d])=>!cloudSet.has(parseInt(d)))
        .map(([d,ts])=>({user_id: state.user.id, day_number: parseInt(d), completed_at: new Date(ts).toISOString()}));
      for(let i=0;i<toPush.length;i+=200)
        await sb.from('user_progress').upsert(toPush.slice(i,i+200), {onConflict:'user_id,day_number', ignoreDuplicates:true});
      // plan enrollments + progress
      const { data: pe } = await sb.from('plan_enrollments').select('plan_id, started_at');
      (pe||[]).forEach(r=>{ if(!state.planEnroll[r.plan_id]) state.planEnroll[r.plan_id]=new Date(r.started_at).getTime(); });
      const peCloud = new Set((pe||[]).map(r=>r.plan_id));
      const pePush = Object.entries(state.planEnroll).filter(([p])=>!peCloud.has(p))
        .map(([p,ts])=>({user_id: state.user.id, plan_id:p, started_at:new Date(ts).toISOString()}));
      if(pePush.length) await sb.from('plan_enrollments').upsert(pePush, {onConflict:'user_id,plan_id', ignoreDuplicates:true});
      const { data: pp } = await sb.from('plan_progress').select('plan_id, day_index, completed_at');
      (pp||[]).forEach(r=>{ (state.planProg[r.plan_id] ||= {})[r.day_index] ||= new Date(r.completed_at).getTime(); });
      const ppPush=[];
      Object.entries(state.planProg).forEach(([pid,days])=>Object.entries(days).forEach(([idx,ts])=>{
        if(!(pp||[]).some(r=>r.plan_id===pid && r.day_index===parseInt(idx)))
          ppPush.push({user_id: state.user.id, plan_id:pid, day_index:parseInt(idx), completed_at:new Date(ts).toISOString()});
      }));
      for(let i=0;i<ppPush.length;i+=200)
        await sb.from('plan_progress').upsert(ppPush.slice(i,i+200), {onConflict:'user_id,plan_id,day_index', ignoreDuplicates:true});
      lsSet('flourish-plan-progress', state.planProg);
      lsSet('flourish-plan-enrollments', state.planEnroll);
    } catch(e){ console.warn('sync failed', e); }
  }

  function requireAuth(msg){
    if(state.user) return true;
    openAuthSheet(msg || 'Sign in to connect with your church community.');
    return false;
  }

  function openAuthSheet(message){
    closeSheets();
    document.body.insertAdjacentHTML('beforeend', `
      <div class="auth-overlay" id="auth-overlay" onclick="if(event.target===this)this.remove()">
        <div class="auth-sheet">
          <h3 id="auth-title">Welcome back</h3>
          <div class="as-sub">${esc(message||'Your journey syncs across devices, and your church community lives here.')}</div>
          <div id="auth-fields">
            <input class="auth-input" id="auth-email" type="email" placeholder="Email" autocomplete="email">
            <input class="auth-input" id="auth-pass" type="password" placeholder="Password" autocomplete="current-password">
            <div id="auth-extra"></div>
          </div>
          <div class="auth-toggle-row">
            <span id="auth-switch-label">New to Flourish?</span>
            <span class="auth-link" id="auth-switch">Create account</span>
          </div>
          <button class="btn btn-primary" id="auth-go">Sign In</button>
          <div style="text-align:center;margin-top:12px"><span class="auth-link" id="auth-forgot" style="font-size:12px">Forgot password?</span></div>
        </div>
      </div>`);
    let mode='in';
    const sw=$('#auth-switch'), go=$('#auth-go');
    sw.onclick=()=>{
      mode = mode==='in' ? 'up' : 'in';
      $('#auth-title').textContent = mode==='in'?'Welcome back':'Begin your journey';
      $('#auth-switch-label').textContent = mode==='in'?'New to Flourish?':'Already have an account?';
      sw.textContent = mode==='in'?'Create account':'Sign in';
      go.textContent = mode==='in'?'Sign In':'Create Account';
      $('#auth-extra').innerHTML = mode==='up' ? `
        <input class="auth-input" id="auth-name" type="text" placeholder="Your name">
        <div class="chip-row" style="margin-bottom:4px">
          <button class="f-chip ${state.gender==='men'?'active':''}" data-g="men">Men's track</button>
          <button class="f-chip ${state.gender==='women'?'active':''}" data-g="women">Women's track</button>
        </div>` : '';
      $$('#auth-extra .f-chip').forEach(c=>c.onclick=()=>{ $$('#auth-extra .f-chip').forEach(x=>x.classList.remove('active')); c.classList.add('active'); });
    };
    $('#auth-forgot').onclick=async()=>{
      const email=$('#auth-email').value.trim();
      if(!email) return toast('Enter your email first');
      await sb.auth.resetPasswordForEmail(email, {redirectTo: location.origin + location.pathname});
      toast('📧 Reset link sent — check your email');
    };
    go.onclick=async()=>{
      const email=$('#auth-email').value.trim(), pass=$('#auth-pass').value;
      if(!email || !pass) return toast('Email and password required');
      go.disabled=true; go.textContent='...';
      try{
        if(mode==='in'){
          const { error } = await sb.auth.signInWithPassword({email, password:pass});
          if(error) throw error;
          $('#auth-overlay')?.remove();
          await refreshIdentity();
          toast('🌱 Welcome back to the Garden.');
          showPage();
        } else {
          const name=$('#auth-name')?.value?.trim() || email.split('@')[0];
          const g=$('#auth-extra .f-chip.active')?.dataset?.g || state.gender;
          const { data, error } = await sb.auth.signUp({email, password:pass, options:{data:{display_name:name, gender:g}}});
          if(error) throw error;
          if(data.session){
            $('#auth-overlay')?.remove();
            await refreshIdentity(); toast('🌱 Account created. Welcome to Flourish!'); showPage();
          } else {
            $('#auth-overlay')?.remove();
            toast('📧 Check your email to confirm your account, then sign in.', 6000);
          }
        }
      } catch(err){ toast('⚠️ ' + (err.message||'Authentication failed')); go.disabled=false; go.textContent= mode==='in'?'Sign In':'Create Account'; }
    };
  }
  function closeSheets(){ $('#auth-overlay')?.remove(); $('#milestone-overlay')?.remove(); }

  // ════════════════════════════════════════════
  // NAVIGATION
  // ════════════════════════════════════════════
  function showPage(override){
    if(state.chatPoll){ clearInterval(state.chatPoll); state.chatPoll=null; }
    const raw = override || location.hash.replace('#','') || 'devotional';
    const page = raw.split('?')[0];
    updateActiveNav(page);
    window.scrollTo(0,0);
    switch(page){
      case 'devotional': renderDevotional(); break;
      case 'progress':   renderProgress(); break;
      case 'pillars':    renderPillars(); break;
      case 'plans':      renderPlans(); break;
      case 'church':     renderChurch(); break;
      case 'profile':    renderProfile(); break;
      case 'why':        renderWhy(); break;
      case 'shop':       exposeForCommerce(); window.FlourishCommerce?.route(raw); break;
      case 'giving':     exposeForCommerce(); window.FlourishCommerce?.routeGiving(raw); break;
      default:           renderDevotional();
    }
  }

  // ── Expose Supabase client / user / leader status to FlourishCommerce ──
  // (Commerce module is sandboxed in its own IIFE; this bridges without leaking internals.)
  function exposeForCommerce(){
    window.__flourishSb = sb;
    window.__flourishUser = state.user;
    window.__flourishIsLeader = () => {
      try { const m = myMembership(); return !!(m && isLeader(m)); } catch(e){ return false; }
    };
  }
  function updateActiveNav(name){
    const map = {why:'progress'};
    const target = map[name]||name;
    $$('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.page===target));
  }

  // ════════════════════════════════════════════
  // PLANT SVG (carried from v9)
  // ════════════════════════════════════════════
  function plantStage(pct){
    let stage,name,next;
    if(pct>=100){stage=6;name='Fruitful Tree';next='You have borne much fruit!';}
    else if(pct>=85){stage=5;name='Mature Tree';next='Bearing fruit — press on!';}
    else if(pct>=70){stage=4;name='Young Tree';next='Growing tall in the Lord.';}
    else if(pct>=50){stage=3;name='Sapling';next='Deep roots forming...';}
    else if(pct>=25){stage=2;name='Seedling';next='A shoot springs up!';}
    else if(pct>=10){stage=1;name='Sprouting';next='The seed breaks ground.';}
    else {stage=0;name='Dormant Seed';next='Faith is the seed. Begin.';}
    const leaves=(n,c)=>Array.from({length:n},(_,i)=>`<circle cx="${100+Math.cos(i*Math.PI*2/n)*35}" cy="${160+Math.sin(i*Math.PI*2/n)*25}" r="${16+i*2}" fill="${c}" opacity="0.75"/>`).join('');
    const stages=[
      `<ellipse cx="100" cy="195" rx="14" ry="10" fill="#8B6914" opacity="0.6"/><path d="M 100 195 L 100 185" stroke="#5a8f6e" stroke-width="2" stroke-dasharray="4 2" opacity="0.4"/>`,
      `<ellipse cx="100" cy="198" rx="16" ry="10" fill="#6B520F" opacity="0.5"/><path d="M 100 195 Q 100 180 96 170 M 100 195 Q 102 178 106 172" stroke="#4a7a5e" stroke-width="2.5" fill="none"/><ellipse cx="96" cy="168" rx="4" ry="6" fill="#5a9e6f" opacity="0.6"/><ellipse cx="107" cy="170" rx="4" ry="5" fill="#5a9e6f" opacity="0.55"/>`,
      `<path d="M 100 200 Q 98 180 100 160 Q 102 140 100 120" stroke="#4a7a5e" stroke-width="3" fill="none"/><ellipse cx="100" cy="200" rx="18" ry="10" fill="#6B520F" opacity="0.4"/>${leaves(4,'#5a9e6f')}`,
      `<path d="M 100 200 Q 96 170 98 130 Q 100 100 100 80" stroke="#3d6b50" stroke-width="4" fill="none"/><ellipse cx="100" cy="200" rx="22" ry="11" fill="#5e4208" opacity="0.35"/>${leaves(7,'#5a9e6f')}<path d="M 100 140 Q 110 130 120 125 M 100 110 Q 90 100 82 95" stroke="#3d6b50" stroke-width="2.5" fill="none" opacity="0.7"/>`,
      `<path d="M 100 200 Q 94 160 96 110 Q 100 60 100 40" stroke="#2d5a40" stroke-width="5" fill="none"/><ellipse cx="100" cy="200" rx="28" ry="12" fill="#3a2a08" opacity="0.3"/>${leaves(10,'#4a8a5e')}<circle cx="100" cy="55" r="25" fill="#3d6b50" opacity="0.15"/><path d="M 100 90 Q 120 75 135 70 M 100 70 Q 80 55 70 50" stroke="#2d5a40" stroke-width="3" fill="none" opacity="0.6"/>`,
      `<path d="M 100 200 Q 92 150 94 90 Q 98 40 100 20" stroke="#1a4a30" stroke-width="6" fill="none"/><ellipse cx="100" cy="200" rx="35" ry="14" fill="#2a1905" opacity="0.25"/>${leaves(14,'#3a8a55')}<circle cx="100" cy="35" r="40" fill="#2d5a40" opacity="0.12"/><path d="M 100 75 Q 130 55 150 45 M 100 55 Q 70 38 55 30" stroke="#1a4a30" stroke-width="3" fill="none" opacity="0.5"/>`,
      `<path d="M 100 200 Q 90 140 92 70 Q 96 25 100 5" stroke="#143d28" stroke-width="7" fill="none"/><ellipse cx="100" cy="200" rx="42" ry="16" fill="#1f1403" opacity="0.2"/>${leaves(18,'#2a9e50')}<circle cx="100" cy="25" r="50" fill="#1a4a30" opacity="0.1"/><path d="M 100 60 Q 140 35 165 22 M 100 45 Q 60 22 38 12" stroke="#143d28" stroke-width="3.5" fill="none" opacity="0.5"/><circle cx="85" cy="50" r="5" fill="#c9a84c" opacity="0.8"/><circle cx="120" cy="65" r="4.5" fill="#c9a84c" opacity="0.75"/><circle cx="105" cy="35" r="5.5" fill="#c9a84c" opacity="0.85"/><circle cx="78" cy="80" r="4" fill="#c9a84c" opacity="0.7"/><circle cx="130" cy="85" r="4.5" fill="#c9a84c" opacity="0.72"/>`
    ];
    return {stage, name, next, svg: stages[stage]};
  }
  function renderPlant(pct){
    const {name, svg} = plantStage(pct);
    return `<svg class="plant-stage float" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style="width:180px;height:200px;margin:0 auto;display:block;" role="img" aria-label="${name}"><ellipse cx="100" cy="210" rx="45" ry="8" fill="var(--surface-2)" opacity="0.5"/>${svg}</svg>`;
  }

  // ════════════════════════════════════════════
  // PAGE: TODAY (DEVOTIONAL)
  // ════════════════════════════════════════════
  function yearTabs(activeYear, handler){
    return `<div class="year-tabs">${[1,2,3].map(y=>`
      <button class="year-tab ${y===activeYear?'active':''}" onclick="${handler}(${y})">Year ${y}<span class="yt-sub">${YEAR_NAMES[y]}</span></button>`).join('')}</div>`;
  }

  async function renderDevotional(){
    const m=$('#main');
    m.innerHTML = `<div class="sacred-loader card-enter"><div class="seed-glyph">🌱</div><p class="loader-text">Preparing your daily seed...</p><p class="loader-sub">Day ${state.currentDay} of ${TOTAL_DAYS}</p></div>`;
    let d;
    try { d = await getDay(state.currentDay); }
    catch(e){ m.innerHTML = `<div class="error-state card-enter"><div class="error-icon">📶</div><p class="error-msg">${esc(e.message)}</p><button class="btn btn-primary" style="width:auto" onclick="app.reload()">Try Again</button></div>`; return; }
    if(!d){ m.innerHTML='<div class="empty-state"><div class="e-icon">🌱</div>No seed for this day.</div>'; return; }

    const y = yearOf(d.day);
    const done = !!state.progress[d.day];
    const t = d[state.gender];
    const prev = d.day>1 ? d.day-1 : null;
    const next = d.day<TOTAL_DAYS ? d.day+1 : null;
    const newcomer = doneCount() < 7;

    m.innerHTML = `
      <div class="devotional-page">
        ${yearTabs(y, 'app.gotoYear')}
        ${newcomer ? `
        <div class="promise-hero card-enter">
          <div class="ph-eyebrow">The Flourish Promise</div>
          <div class="ph-verse">${PROMISE.verse}</div>
          <div class="ph-ref">${PROMISE.ref}</div>
          <div class="ph-body">${PROMISE.body}</div>
          <div style="margin-top:10px"><span class="auth-link" onclick="location.hash='why';app.showPage('why')">How this works →</span></div>
        </div>`:''}
        <div class="day-header card-enter" style="animation-delay:.05s">
          <div class="day-nav-wrap">
            <button class="btn-nav-round" ${prev?`onclick="app.gotoDay(${prev})"`:'disabled'}>◀</button>
            <button class="btn-nav-round" ${next?`onclick="app.gotoDay(${next})"`:'disabled'}>▶</button>
          </div>
          <div class="day-info">
            <div class="day-eyebrow">Year ${y} · ${esc(YEAR_NAMES[y])} · ${esc(d.pillar)} · Week ${d.week}</div>
            <div class="day-number">Day ${d.day}</div>
            <div class="day-topic">${esc(d.topic)}</div>
            <div class="day-meta">${esc(d.week_theme)}</div>
            <div style="margin-top:8px"><span class="pillar-chip ${d.pillar.toLowerCase()}">${d.pillar}</span></div>
            <div class="day-jump">
              <input type="number" id="day-jump-input" min="1" max="${TOTAL_DAYS}" placeholder="${d.day}">
              <button class="btn btn-ghost" style="width:auto;padding:8px 16px;font-size:13px" onclick="app.jumpToDay()">Go</button>
              <button class="btn btn-ghost" style="width:auto;padding:8px 16px;font-size:13px" onclick="app.gotoDay(${todayIndex()})">Today</button>
            </div>
          </div>
        </div>
        <div class="scripture-block card-enter" style="animation-delay:.1s">
          <div class="scripture-ref">${esc(d.scripture?.reference)} <span class="version">${esc(d.scripture?.version||'ESV')}</span></div>
          <div class="scripture-text">${esc(d.scripture?.text)}</div>
        </div>
        <div class="card track-card card-enter ${state.gender}" style="animation-delay:.15s">
          <div class="track-label">${state.gender==='men'?"💪 The Warrior's Word":"💜 The Beloved's Word"}</div>
          <div class="track-text">${esc(t?.lesson)}</div>
        </div>
        <div class="card card-enter" style="animation-delay:.2s">
          <div class="card-header"><span class="icon">💡</span> Understanding</div>
          <div style="line-height:1.75;font-size:15px;color:var(--text-muted)">${esc(t?.understanding)}</div>
        </div>
        <div class="card card-enter" style="animation-delay:.25s">
          <div class="card-header"><span class="icon">🙏</span> Prayer</div>
          <div style="line-height:1.75;font-style:italic;font-size:15px">${esc(t?.prayer)}</div>
        </div>
        <div class="card card-enter" style="animation-delay:.26s">
          <div class="card-header"><span class="icon">✅</span> Life Application — where wisdom becomes life</div>
          <div style="line-height:1.7;font-size:15px;color:var(--text-muted)">
            ${(Array.isArray(t?.application)?t.application:[]).map((a,i)=>`
              <div style="display:flex;gap:10px;margin-bottom:14px;align-items:flex-start">
                <span style="flex-shrink:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--accent);color:#1a1a1a;font-size:12px;font-weight:700">${i+1}</span>
                <span>${esc(a)}</span>
              </div>`).join('')}
          </div>
        </div>
        <div class="card cross-pillar-card card-enter" style="animation-delay:.3s">
          <div class="card-header"><span class="icon">🔗</span> Cross-Pillar Connection</div>
          <div style="line-height:1.65;color:var(--text-muted);font-size:14px">${esc(d.cross_pillar)}</div>
        </div>
        ${enrich(d)}
        <div class="devotional-actions card-enter" style="animation-delay:.5s">
          <button id="mark-complete" class="btn btn-primary ${done?'done':''}" onclick="app.toggleComplete(${d.day})">${done?'✅ Completed':'Mark Complete'}</button>
          <button class="btn btn-ghost" onclick="app.shareDay(${d.day})">📤</button>
        </div>
      </div>`;
  }

  function enrich(day){
    const e=day.enrichment||{}; const parts=[]; let delay=0.35;
    if(e.historical_context){ parts.push(`<div class="card context-card card-enter" style="animation-delay:${delay}s"><div class="card-header"><span class="icon">📜</span> Historical Context</div><div style="line-height:1.7;font-size:14px;color:var(--text-muted)">${esc(e.historical_context)}</div></div>`); delay+=.05; }
    if(e.word_study){ parts.push(`<div class="card word-card card-enter" style="animation-delay:${delay}s"><div class="card-header"><span class="icon">🔍</span> Word Study</div><div style="line-height:1.7;font-size:14px;color:var(--text-muted)">${esc(e.word_study)}</div></div>`); delay+=.05; }
    if(e.christ_connection){ parts.push(`<div class="card christ-card card-enter" style="animation-delay:${delay}s"><div class="card-header"><span class="icon">✝️</span> Christ Connection</div><div style="line-height:1.7;font-size:14px;color:var(--text-muted)">${esc(e.christ_connection)}</div></div>`); delay+=.05; }
    if(e.reflection_questions?.length){ parts.push(`<div class="card reflect-card card-enter" style="animation-delay:${delay}s"><div class="card-header"><span class="icon">💭</span> Reflection</div><div class="reflect-list">${e.reflection_questions.map((q,i)=>`<div class="reflect-q" data-n="${i+1}">${esc(q)}</div>`).join('')}</div></div>`); }
    return parts.join('');
  }

  // ════════════════════════════════════════════
  // PAGE: JOURNEY (PROGRESS)
  // ════════════════════════════════════════════
  function computeStreak(){
    let s=0, d=todayIndex();
    if(!state.progress[d]) d--; // today not done yet doesn't break streak
    while(d>0 && state.progress[d]){ s++; d--; }
    return s;
  }

  function renderProgress(){
    const m=$('#main');
    const done=doneCount();
    const totalPct=Math.min(100, Math.round((done/TOTAL_DAYS)*1000)/10);
    const today=todayIndex();
    const y=yearOf(today);
    const yearDone = Object.keys(state.progress).filter(d=>yearOf(parseInt(d))===y).length;
    const yearPct = Math.min(100, Math.round((yearDone/365)*100));
    const streak=computeStreak();

    const pillarsCount={Health:0,Wealth:0,Relationships:0,Integration:0};
    // count per pillar from loaded years only (approx if some years unloaded)
    Object.keys(state.progress).forEach(ds=>{
      const dn=parseInt(ds); const yy=yearOf(dn); const data=state.years[yy];
      if(data){ const day=data[(dn-1)-(yy-1)*365]; if(day && pillarsCount[day.pillar]!==undefined) pillarsCount[day.pillar]++; }
    });

    const perYear=[1,2,3].map(yy=>{
      const c=Object.keys(state.progress).filter(d=>yearOf(parseInt(d))===yy).length;
      return {y:yy, c, pct:Math.round((c/365)*100)};
    });

    m.innerHTML = `
      <div class="progress-page">
        <div class="progress-hero card-enter">
          ${renderPlant(yearPct)}
          <div class="progress-stat">${done}<span>/${TOTAL_DAYS}</span></div>
          <div class="progress-label">Days of Wisdom Applied</div>
        </div>
        <div class="living-bar card-enter" style="animation-delay:.1s"><div class="fill" style="width:${totalPct}%"></div></div>
        <div class="pct-label card-enter" style="animation-delay:.15s">${totalPct}% of the 3-Year Journey</div>
        <div class="growth-status card-enter" style="animation-delay:.2s"><span class="stage-name">${plantStage(yearPct).name}</span> · ${plantStage(yearPct).next}</div>
        <div class="stats-grid card-enter" style="animation-delay:.25s">
          <div class="stat-diamond"><div class="stat-num">${streak}</div><div class="stat-label">Current Streak</div></div>
          <div class="stat-diamond"><div class="stat-num">${today}</div><div class="stat-label">Journey Day</div></div>
          <div class="stat-diamond"><div class="stat-num">${yearDone}</div><div class="stat-label">Year ${y} Days</div></div>
          <div class="stat-diamond"><div class="stat-num">${Math.max(0,Math.floor((done/today)*100))}%</div><div class="stat-label">On Track</div></div>
        </div>
        <div class="card card-enter" style="animation-delay:.28s">
          <div class="card-header"><span class="icon">🏛️</span> The Three Years</div>
          ${perYear.map(py=>`
            <div class="pillar-row" style="cursor:pointer" onclick="app.gotoYear(${py.y})">
              <div class="pillar-icon">${py.y===1?'🪨':py.y===2?'🏗️':'👑'}</div>
              <div class="pillar-info">
                <div class="pillar-name">Year ${py.y} — ${YEAR_NAMES[py.y]}</div>
                <div class="pillar-track"><div class="pillar-fill" style="width:${py.pct}%"></div></div>
              </div>
              <div class="pillar-count">${py.c}/365</div>
            </div>`).join('')}
        </div>
        <div class="card card-enter" style="animation-delay:.32s">
          <div class="card-header"><span class="icon">🌿</span> The Four Gardens</div>
          <div class="pillar-garden">
            ${pillarBar('Health',pillarsCount.Health,'🌿')}
            ${pillarBar('Wealth',pillarsCount.Wealth,'⚜️')}
            ${pillarBar('Relationships',pillarsCount.Relationships,'💜')}
            ${pillarBar('Spiritual',pillarsCount.Integration,'🔥')}
          </div>
        </div>
        <div class="card card-enter" style="animation-delay:.36s">
          <div class="card-header"><span class="icon">📖</span> Why This Works</div>
          <div style="line-height:1.7;font-size:14px;color:var(--text-muted)">
            Scripture's pattern is simple: <strong>hear, do, flourish</strong>. The man who hears and does builds on rock
            (Matthew 7:24). The one who meditates day and night bears fruit in season (Psalm 1:2-3). Discipline yields
            "the peaceful fruit of righteousness" (Hebrews 12:11). Every day you complete is not an app streak — it is a
            stone laid by wisdom in the house of your life.
          </div>
          <button class="btn btn-ghost" style="margin-top:12px" onclick="location.hash='why';app.showPage('why')">Read the full promise →</button>
        </div>
        <div style="height:12px"></div>
        <button class="btn btn-danger card-enter" style="animation-delay:.4s" onclick="app.resetProgress()">Reset Journey</button>
      </div>`;
  }
  function pillarBar(name,count,icon){
    const total=doneCount()||1;
    const pct=Math.round((count/total)*100);
    return `<div class="pillar-row ${name.toLowerCase()}"><div class="pillar-icon">${icon}</div><div class="pillar-info"><div class="pillar-name">${esc(name)}</div><div class="pillar-track"><div class="pillar-fill" style="width:${pct}%"></div></div></div><div class="pillar-count">${count}</div></div>`;
  }

  // ════════════════════════════════════════════
  // PAGE: WHY (the wisdom promise, expanded)
  // ════════════════════════════════════════════
  function renderWhy(){
    $('#main').innerHTML = `
      <div class="page">
        <div class="promise-hero card-enter">
          <div class="ph-eyebrow">The Flourish Promise</div>
          <div class="ph-verse">${PROMISE.verse}</div>
          <div class="ph-ref">${PROMISE.ref}</div>
          <div class="ph-body">${PROMISE.body}</div>
        </div>
        <div class="card card-enter">
          <div class="card-header"><span class="icon">1️⃣</span> Hear — wisdom enters</div>
          <div style="line-height:1.7;font-size:14px;color:var(--text-muted)">Every day opens with Scripture — not motivation, not self-help, but the unchanging wisdom of God. "The fear of the LORD is the beginning of wisdom" (Proverbs 9:10). The devotional puts the Word in you before the world gets to you.</div>
        </div>
        <div class="card card-enter">
          <div class="card-header"><span class="icon">2️⃣</span> Do — wisdom takes flesh</div>
          <div style="line-height:1.7;font-size:14px;color:var(--text-muted)">"Be doers of the word, and not hearers only, deceiving yourselves" (James 1:22). Every lesson ends in concrete application — the workout scheduled, the budget written, the apology made. This is where most journeys fail and where Flourish insists: no day is complete until wisdom touches your actual life.</div>
        </div>
        <div class="card card-enter">
          <div class="card-header"><span class="icon">3️⃣</span> Flourish — life gets better by design</div>
          <div style="line-height:1.7;font-size:14px;color:var(--text-muted)">A body stewarded gets stronger. Money governed by biblical principle gets ordered, then free, then generous. Relationships built on covenant get deeper. None of this is magic — it is the harvest law: "Whatever one sows, that will he also reap" (Galatians 6:7). Sow wisdom daily for 1,095 days and the harvest is a transformed life.</div>
        </div>
        <div class="card card-enter">
          <div class="card-header"><span class="icon">🏛️</span> The three-year architecture</div>
          <div style="line-height:1.7;font-size:14px;color:var(--text-muted)">
            <strong>Year 1 — Foundation:</strong> identity, disciplines, first principles in every pillar.<br>
            <strong>Year 2 — Deepening:</strong> testing, healing, multiplication of skills and streams, covenant repair.<br>
            <strong>Year 3 — Multiplication:</strong> legacy, eldership, generational wealth, and passing the torch.<br><br>
            "The path of the righteous is like the light of dawn, which shines brighter and brighter until full day" (Proverbs 4:18).
          </div>
        </div>
        <button class="btn btn-primary card-enter" onclick="app.gotoDay(${todayIndex()})">Begin today's lesson →</button>
        <div style="height:20px"></div>
      </div>`;
  }

  // ════════════════════════════════════════════
  // PAGE: PILLARS (year-aware)
  // ════════════════════════════════════════════
  let pillarYear = null;
  async function renderPillars(){
    const m=$('#main');
    const qp=new URLSearchParams(location.hash.split('?')[1]||'');
    const p=qp.get('p'), w=qp.get('w');
    pillarYear = pillarYear || yearOf(todayIndex());
    m.innerHTML = `<div class="sacred-loader card-enter"><div class="seed-glyph">📚</div><p class="loader-text">Opening the library...</p></div>`;
    let data;
    try { data = await loadYear(pillarYear); }
    catch(e){ m.innerHTML=`<div class="error-state"><p class="error-msg">${esc(e.message)}</p></div>`; return; }

    if(p && w){ renderWeekDetail(data,p,parseInt(w)); return; }
    if(p){ renderPillarDetail(data,p); return; }

    const meta={
      Health:{icon:'🌿',color:'#5a8f6e',desc:'Spiritual vitality, mental discipline, and physical stewardship as acts of worship.'},
      Wealth:{icon:'⚜️',color:'#c9a84c',desc:'Biblical stewardship, debt freedom, enterprise, and generational legacy.'},
      Relationships:{icon:'💜',color:'#7a6fae',desc:'Covenant marriage, family discipleship, and community rooted in Scripture.'},
      Integration:{icon:'🔥',color:'#8b5a7c',desc:'Where Health, Wealth, and Relationships converge into one Kingdom life.'}
    };
    const counts={Health:0,Wealth:0,Relationships:0,Integration:0};
    data.forEach(d=>{ if(counts[d.pillar]!==undefined) counts[d.pillar]++; });

    m.innerHTML = `
      <div class="pillars-page">
        ${yearTabs(pillarYear,'app.setPillarYear')}
        <div class="page-title card-enter">The Four Pillars</div>
        <div class="page-subtitle card-enter" style="animation-delay:.05s">Year ${pillarYear} · ${YEAR_NAMES[pillarYear]} — ${TOTAL_DAYS}-day architecture of Biblical Life Mastery</div>
        <div class="pillars-grid card-enter" style="animation-delay:.1s">
          ${Object.entries(meta).map(([name,mt])=>`
            <div class="pillar-tile ${name.toLowerCase()}" onclick="app.showPillar('${name}')">
              <div class="pillar-tile-icon" style="background:${mt.color}20;color:${mt.color}">${mt.icon}</div>
              <div class="pillar-tile-name">${esc(name)}</div>
              <div class="pillar-tile-count">${counts[name]||0} days</div>
              <div class="pillar-tile-desc">${esc(mt.desc)}</div>
              <div class="pillar-tile-cta">Enter →</div>
            </div>`).join('')}
        </div>
        <div class="card card-enter" style="animation-delay:.2s;margin-top:8px">
          <div class="card-header"><span class="icon">🗺️</span> Focused Plans</div>
          <div style="line-height:1.7;font-size:14px;color:var(--text-muted)">Each pillar also holds <strong>guided plans</strong> — focused sprints like the 30-Day Debt Freedom Sprint or the 21-Day Marriage Renewal — that attack one area with concentrated wisdom.</div>
          <button class="btn btn-primary" style="margin-top:12px" onclick="location.hash='plans';app.showPage('plans')">Browse the Plans →</button>
        </div>
        <div class="card card-enter" style="animation-delay:.25s">
          <div class="card-header"><span class="icon">📖</span> How the Pillars Work</div>
          <div style="line-height:1.7;font-size:14px;color:var(--text-muted)">The pillars <strong>cross-pollinate</strong>: a lesson on identity (Health) reshapes how you steward money (Wealth) and lead your family (Relationships). The Integration weeks weave all three into unified Kingdom living — everything governed by wisdom and biblical principles.</div>
        </div>
      </div>`;
  }

  function renderPillarDetail(data,pillar){
    const m=$('#main');
    const meta={
      Health:{icon:'🌿',color:'#5a8f6e',title:'The Garden of Health',subtitle:'Spiritual, Mental & Physical Mastery'},
      Wealth:{icon:'⚜️',color:'#c9a84c',title:'The Treasury of Wealth',subtitle:'Stewardship, Multiplication & Legacy'},
      Relationships:{icon:'💜',color:'#7a6fae',title:'The Covenant of Relationships',subtitle:'Family, Friendship & Partnership'},
      Integration:{icon:'🔥',color:'#8b5a7c',title:'The Furnace of Integration',subtitle:'Unified Kingdom Living'}
    }[pillar]||{icon:'📖',color:'var(--accent)',title:pillar,subtitle:'Biblical Life Mastery'};
    const weeks={};
    data.forEach(d=>{ if(d.pillar===pillar){ (weeks[d.week] ||= {theme:d.week_theme, days:[]}).days.push(d); } });
    const sorted=Object.entries(weeks).sort((a,b)=>a[0]-b[0]);
    const doneIn=data.filter(d=>d.pillar===pillar&&state.progress[d.day]).length;
    const totalIn=Object.values(weeks).reduce((s,w)=>s+w.days.length,0);
    const pct=Math.round((doneIn/totalIn)*100)||0;
    m.innerHTML = `
      <div class="pillars-page">
        <div class="pillar-hero card-enter" style="border-color:${meta.color}40">
          <button class="btn-nav-round" onclick="location.hash='pillars';app.showPage('pillars')" style="position:absolute;top:14px;left:14px">◀</button>
          <div class="pillar-hero-icon" style="background:${meta.color}20;color:${meta.color}">${meta.icon}</div>
          <div class="pillar-hero-title">${esc(meta.title)}</div>
          <div class="pillar-hero-subtitle">Year ${pillarYear} · ${esc(meta.subtitle)}</div>
          <div class="pillar-hero-stats"><span>${totalIn} days</span> · <span>${doneIn} completed</span> · <span style="color:${meta.color}">${pct}%</span></div>
        </div>
        <div class="week-list">
          ${sorted.map(([wn,wd],i)=>{
            const wDone=wd.days.filter(d=>state.progress[d.day]).length;
            const wPct=Math.round((wDone/wd.days.length)*100);
            const cls=pillar.toLowerCase();
            return `<div class="week-card card-enter ${cls}" style="animation-delay:${i*0.04}s" onclick="app.showWeek('${pillar}',${wn})">
              <div class="week-card-header"><div class="week-num">Week ${wn}</div>
                <div class="week-progress"><div class="week-bar"><div class="week-fill ${cls}" style="width:${wPct}%"></div></div><span class="week-pct">${wPct}%</span></div></div>
              <div class="week-theme">${esc(wd.theme)}</div>
              <div class="week-days-preview">
                ${wd.days.slice(0,5).map(d=>`<span class="day-dot ${state.progress[d.day]?'done':''} ${d.day===state.currentDay?'today':''}">${d.day}</span>`).join('')}
                ${wd.days.length>5?'<span class="day-dot more">+'+(wd.days.length-5)+'</span>':''}
              </div></div>`;
          }).join('')}
        </div><div style="height:20px"></div>
      </div>`;
  }

  function renderWeekDetail(data,pillar,week){
    const m=$('#main');
    const days=data.filter(d=>d.pillar===pillar&&d.week===week);
    if(!days.length){ m.innerHTML='<div class="empty-state">No days found.</div>'; return; }
    const theme=days[0]?.week_theme||'';
    const done=days.filter(d=>state.progress[d.day]).length;
    const cls=pillar.toLowerCase();
    m.innerHTML = `
      <div class="pillars-page">
        <div class="week-detail-header card-enter">
          <button class="btn-nav-round" onclick="app.showPillar('${pillar}')">◀</button>
          <div class="week-detail-info">
            <div class="week-detail-eyebrow">Year ${pillarYear} · ${esc(pillar)} · Week ${week}</div>
            <div class="week-detail-theme">${esc(theme)}</div>
            <div class="week-detail-progress">${done}/${days.length} days complete</div>
          </div>
        </div>
        <div class="day-list">
          ${days.map((d,i)=>{
            const t=d[state.gender]; const isDone=!!state.progress[d.day];
            return `<div class="day-row card-enter ${isDone?'done':''} ${d.day===state.currentDay?'today':''}" style="animation-delay:${i*0.05}s" onclick="app.gotoDay(${d.day})">
              <div class="day-row-left"><div class="day-row-num ${cls}">${d.day}</div>
                <div class="day-row-info"><div class="day-row-topic">${esc(d.topic)}</div>
                  <div class="day-row-scripture">${esc(d.scripture?.reference)}</div>
                  <div class="day-row-excerpt">${esc((t?.lesson||'').substring(0,80))}${(t?.lesson||'').length>80?'...':''}</div></div></div>
              <div class="day-row-right"><div class="day-row-status ${isDone?'done':''}">${isDone?'✅':'○'}</div></div>
            </div>`;
          }).join('')}
        </div><div style="height:20px"></div>
      </div>`;
  }

  // ════════════════════════════════════════════
  // PAGE: PLANS
  // ════════════════════════════════════════════
  async function renderPlans(){
    const m=$('#main');
    const qp=new URLSearchParams(location.hash.split('?')[1]||'');
    const planId=qp.get('id');
    m.innerHTML=`<div class="sacred-loader card-enter"><div class="seed-glyph">🗺️</div><p class="loader-text">Unrolling the maps...</p></div>`;
    let P;
    try { P = await loadPlans(); }
    catch(e){ m.innerHTML=`<div class="error-state"><p class="error-msg">Plans failed to load.</p></div>`; return; }
    if(planId){
      const pl=P.plans.find(x=>x.id===planId);
      const qp2=new URLSearchParams(location.hash.split('?')[1]||'');
      const dayIdx=parseInt(qp2.get('d'),10);
      if(dayIdx && dayIdx>=1 && dayIdx<=(pl?.duration||0)){ renderLesson(pl, dayIdx); return; }
      renderPlanDetail(pl); return;
    }

    const byPillar={Health:[],Wealth:[],Relationships:[]};
    P.plans.forEach(pl=>{ (byPillar[pl.pillar] ||= []).push(pl); });
    const SUBCAT_LABELS={
      Spiritual:'🛡️ Spiritual Health', Mental:'🧠 Mental Health & the Mind', Emotional:'💗 Emotional Health', Physical:'💪 Physical Health',
      Income:'⚒️ Building Income', Stewardship:'📜 Stewardship & the Rules of Money', Saving:'🏺 Saving', Investing:'🌱 Investing', Generosity:'🎁 Generosity & Legacy',
      Romantic:'💍 Dating & Marriage', FamilySocial:'🏠 Family', Friendship:'🤝 Friendship & Boundaries', Community:'⛪ Community'
    };
    const planCard=pl=>{
      const prog=Object.keys(state.planProg[pl.id]||{}).length;
      const pct=Math.round((prog/pl.duration)*100);
      const enrolled=!!state.planEnroll[pl.id];
      return `<div class="plan-card card-enter" onclick="app.openPlan('${pl.id}')">
        <div class="pc-pillar ${pl.pillar.toLowerCase()}">${esc(pl.pillar)} · ${pl.duration} days</div>
        <div class="pc-title">${esc(pl.title)}</div>
        <div class="pc-tag">${esc(pl.tagline)}</div>
        <div class="pc-bar"><div class="pc-fill" style="width:${pct}%"></div></div>
        <div class="pc-meta"><span>${enrolled?(pct>=100?'✅ Completed':prog+'/'+pl.duration+' days'):'Not started'}</span><span>${pct}%</span></div>
      </div>`;
    };
    const taxonomy=P.meta?.taxonomy||{};
    m.innerHTML=`
      <div class="page">
        <div class="page-title card-enter">Guided Plans</div>
        <div class="page-subtitle card-enter">${esc(P.tagline)}</div>
        ${Object.entries(byPillar).map(([pillar,plans])=>{
          const tax=taxonomy[pillar];
          let inner;
          if(tax){
            const placed=new Set();
            inner=Object.entries(tax).map(([sub,ids])=>{
              const subPlans=ids.map(id=>plans.find(p=>p.id===id)).filter(Boolean);
              subPlans.forEach(p=>placed.add(p.id));
              if(!subPlans.length) return '';
              return `<div style="font-size:12px;font-weight:700;letter-spacing:.06em;color:var(--text-muted);margin:14px 2px 8px;text-transform:uppercase">${SUBCAT_LABELS[sub]||esc(sub)}</div>${subPlans.map(planCard).join('')}`;
            }).join('') + plans.filter(p=>!placed.has(p.id)).map(planCard).join('');
          } else {
            inner=plans.map(planCard).join('');
          }
          return `<div class="section-label">${pillar==='Health'?'🌿':pillar==='Wealth'?'⚜️':'💜'} ${esc(pillar)} Pillar</div>${inner}`;
        }).join('')}
        <div style="height:20px"></div>
      </div>`;
  }

  function renderPlanDetail(pl){
    const m=$('#main');
    if(!pl){ m.innerHTML='<div class="empty-state">Plan not found.</div>'; return; }
    const prog=state.planProg[pl.id]||{};
    const done=Object.keys(prog).length;
    const pct=Math.round((done/pl.duration)*100);
    const enrolled=!!state.planEnroll[pl.id];
    m.innerHTML=`
      <div class="page">
        <div class="week-detail-header card-enter">
          <button class="btn-nav-round" onclick="location.hash='plans';app.showPage('plans')">◀</button>
          <div class="week-detail-info">
            <div class="week-detail-eyebrow">${esc(pl.pillar)} · ${pl.duration}-day plan</div>
            <div class="week-detail-theme">${esc(pl.title)}</div>
            <div class="week-detail-progress">${done}/${pl.duration} complete · ${pct}%</div>
          </div>
        </div>
        <div class="card card-enter">
          <div class="card-header"><span class="icon">🌟</span> The Promise</div>
          <div style="line-height:1.7;font-size:14px;color:var(--text-muted)">${esc(pl.promise)}</div>
          ${!enrolled?`<button class="btn btn-primary" style="margin-top:14px" onclick="app.enrollPlan('${pl.id}')">Begin This Plan</button>`:''}
        </div>
        <div class="card card-enter">
          <div class="card-header"><span class="icon">📋</span> The Days</div>
          <div style="font-size:12px;color:var(--text-muted);margin:4px 0 12px;line-height:1.5">Tap any day to open the full lesson — scripture, teaching, reflection, and prayer. The ✓ marks it complete.</div>
          ${pl.days.map((d,i)=>{
            const idx=i+1; const isDone=!!prog[idx];
            return `<div class="plan-day ${isDone?'done':''}">
              <div class="pd-check" onclick="app.togglePlanDay('${pl.id}',${idx})">${isDone?'✓':idx}</div>
              <div style="flex:1;cursor:pointer" onclick="app.openLesson('${pl.id}',${idx})">
                <div class="pd-title">Day ${idx} — ${esc(d.t)}</div>
                <div class="pd-ref">📖 ${esc(d.s)}</div>
                <div class="pd-action">${esc(d.a)}</div>
                <div style="margin-top:6px;font-size:11px;color:var(--accent);font-weight:600;letter-spacing:.04em">OPEN LESSON →</div>
              </div>
            </div>`;
          }).join('')}\n        </div>
        <div style="height:20px"></div>
      </div>`;
  }

  // ── LESSON VIEW — full lesson content for a single plan day ──
  function renderLesson(pl, idx){
    const m=$('#main');
    if(!pl){ m.innerHTML='<div class="empty-state">Plan not found.</div>'; return; }
    const d=pl.days[idx-1];
    if(!d){ m.innerHTML='<div class="empty-state">Lesson not found.</div>'; return; }
    const prog=state.planProg[pl.id]||{};
    const isDone=!!prog[idx];
    const done=Object.keys(prog).length;
    const pct=Math.round((done/pl.duration)*100);
    const v=d.verse||{};
    m.innerHTML=`
      <div class="page">
        <div class="week-detail-header card-enter">
          <button class="btn-nav-round" onclick="app.openPlan('${pl.id}')">◀</button>
          <div class="week-detail-info">
            <div class="week-detail-eyebrow">${esc(pl.pillar)} · Day ${idx} of ${pl.duration}</div>
            <div class="week-detail-theme">${esc(d.t)}</div>
            <div class="week-detail-progress">${done}/${pl.duration} complete · ${pct}%</div>
          </div>
        </div>

        <div class="card card-enter">
          <div class="card-header"><span class="icon">📖</span> The Scripture</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;font-weight:600;letter-spacing:.04em">${esc(v.reference||d.s)} · ${esc(v.version||'ESV')}</div>
          <div style="line-height:1.8;font-size:16px;color:var(--text);font-style:italic;border-left:3px solid var(--accent);padding-left:14px;margin:6px 0">${esc(v.text||'')}</div>
        </div>

        <div class="card card-enter">
          <div class="card-header"><span class="icon">🕊️</span> The Teaching</div>
          <div style="line-height:1.8;font-size:15px;color:var(--text)">${esc(d.teaching||'')}</div>
        </div>

        <div class="card card-enter">
          <div class="card-header"><span class="icon">🪞</span> Reflection</div>
          <div style="line-height:1.7;font-size:14px;color:var(--text-muted)">${esc(d.reflection||'')}</div>
        </div>

        <div class="card card-enter">
          <div class="card-header"><span class="icon">👐</span> The Action</div>
          <div style="line-height:1.7;font-size:14px;color:var(--text)">${esc(d.a||'')}</div>
        </div>

        ${d.prayer?`<div class="card card-enter">
          <div class="card-header"><span class="icon">🙏</span> A Prayer for Today</div>
          <div style="line-height:1.8;font-size:14px;color:var(--text-muted);font-style:italic">${esc(d.prayer)}</div>
        </div>`:''}

        <div class="card card-enter" style="text-align:center">
          <button class="btn ${isDone?'btn-secondary':'btn-primary'}" style="width:100%;padding:14px;font-size:15px;font-weight:700" onclick="app.togglePlanDay('${pl.id}',${idx});app.openPlan('${pl.id}')">
            ${isDone?'✓ Completed — Tap to Undo':'Mark Day '+idx+' Complete'}
          </button>
          ${!isDone&&idx<pl.duration?`<button class="btn btn-secondary" style="width:100%;margin-top:10px" onclick="app.openLesson('${pl.id}',${idx+1})">Next Day →</button>`:''}
          ${isDone&&idx<pl.duration?`<button class="btn btn-primary" style="width:100%;margin-top:10px" onclick="app.openLesson('${pl.id}',${idx+1})">Continue to Day ${idx+1} →</button>`:''}
        </div>
        <div style="height:20px"></div>
      </div>`;
  }

  // ════════════════════════════════════════════
  // PAGE: CHURCH
  // ════════════════════════════════════════════
  async function renderChurch(){
    const m=$('#main');
    const qp=new URLSearchParams(location.hash.split('?')[1]||'');
    const view=qp.get('v')||'home';
    if(!sb){ m.innerHTML='<div class="error-state card-enter"><p class="error-msg">Community features need an internet connection.</p></div>'; return; }

    if(view==='directory'){ return renderDirectory(); }
    if(view==='community'){ return renderCommunity(); }
    if(view==='page'){ return renderChurchPage(qp.get('c')); }
    if(view==='group'){ return renderGroup(qp.get('g')); }
    if(view==='dashboard'){ return renderDashboard(); }
    if(view==='chat'){ return renderChat(qp.get('c')); }
    if(view==='requests'){ return renderRequestsInbox(); }

    // HOME: my church or directory invite
    if(!state.user || state.memberships.length===0){
      m.innerHTML=`
        <div class="page">
          <div class="page-title card-enter">Find Your Flock</div>
          <div class="promise-hero card-enter">
            <div class="ph-eyebrow">Better Together</div>
            <div class="ph-verse">"And let us consider how to stir up one another to love and good works, not neglecting to meet together."</div>
            <div class="ph-ref">Hebrews 10:24-25</div>
            <div class="ph-body">The journey is personal but never private. Join your church inside Flourish to share events, send requests to your leaders, and walk the three years together.</div>
            ${state.user?'' :'<button class="btn btn-primary" style="margin-top:14px" onclick="app.openAuth()">Sign in / Create account</button>'}
          </div>
          <button class="btn btn-primary card-enter" onclick="app.churchView('directory')">📍 Find Churches Near Me</button>
          <div style="height:8px"></div>
          <button class="btn btn-primary card-enter" onclick="app.churchView('community')">🌍 Community Hub — churches & events around you</button>
          <div style="height:8px"></div>
          ${state.user?`<button class="btn btn-ghost card-enter" onclick="app.registerChurchForm()">➕ Register your church</button>`:''}
          <div style="height:20px"></div>
        </div>`;
      return;
    }

    const mem=myMembership() || state.memberships[0];
    const ch=mem.churches;
    state.activeChurchId = mem.church_id;
    const leader=isLeader(mem);

    m.innerHTML=`<div class="sacred-loader card-enter"><div class="seed-glyph">⛪</div><p class="loader-text">Opening the church doors...</p></div>`;
    const [annRes, evRes, reqRes, wallRes, grpRes, campRes] = await Promise.all([
      sb.from('announcements').select('*').eq('church_id', ch.id).order('pinned',{ascending:false}).order('publish_at',{ascending:false}).limit(5),
      sb.from('events').select('*, event_rsvps(user_id, status), event_volunteers(user_id, role), event_checkins(user_id)').eq('church_id', ch.id).gte('start_time', new Date(Date.now()-864e5).toISOString()).is('cancelled_at', null).order('start_time').limit(8),
      sb.from('prayer_requests').select('id,status').eq('user_id', state.user.id).in('status',['active','urgent']),
      sb.from('prayer_requests').select('id,title,body,category,status,prayer_count,created_at').eq('church_id', ch.id).eq('privacy','church_wide').in('status',['active','urgent']).order('created_at',{ascending:false}).limit(8),
      sb.from('groups').select('*, group_members(user_id, role)').eq('church_id', ch.id).order('name'),
      sb.from('church_plan_campaigns').select('*').eq('church_id', ch.id).is('archived_at', null).order('created_at',{ascending:false}).limit(1)
    ]);
    await loadPlans().catch(()=>null);
    const camp=(campRes.data||[])[0];
    const campPlan=camp && state.plans?.plans?.find(p=>p.id===camp.plan_id);

    m.innerHTML=`
      <div class="page">
        <div class="church-hero card-enter">
          <div class="church-hero-icon">⛪</div>
          <div class="church-hero-name">${esc(ch.name)}</div>
          <div class="church-hero-meta">${esc(ch.city)}${ch.state?', '+esc(ch.state):''} · ${esc(ch.denomination||'')}</div>
          <div class="church-hero-pastor">${esc(ch.pastor_name||'')} ${leader?'· <span style="color:var(--accent)">You are a leader</span>':''}</div>
          ${ch.website?`<div style="margin-top:8px"><a class="auth-link" href="${esc(ch.website)}" target="_blank" rel="noopener" style="font-size:13px">🌐 ${esc(ch.website.replace(/^https?:\/\//,''))}</a></div>`:''}
          ${ch.sermons_url?`<div style="margin-top:6px"><a class="auth-link" href="${esc(ch.sermons_url)}" target="_blank" rel="noopener" style="font-size:13px">🎙️ Sermons & media</a></div>`:''}
          ${socialRow(ch)}
          ${state.memberships.length>1?`<div class="chip-row" style="justify-content:center;margin-top:10px">${state.memberships.map(mm=>`<button class="f-chip ${mm.church_id===ch.id?'active':''}" onclick="app.switchChurch('${mm.church_id}')">${esc(mm.churches.name)}</button>`).join('')}</div>`:''}
          ${!leader?`<div style="margin-top:10px;font-size:12px"><span class="auth-link" onclick="app.claimChurch('${ch.id}','${esc(ch.name)}')">Are you this church's pastor/admin? Claim leadership →</span></div>`:''}
          ${leader?`<div style="margin-top:10px"><button class="btn btn-ghost" style="width:auto;padding:8px 16px;font-size:12px" onclick="app.editChurchProfile()">✏️ Edit church profile & location</button></div>`:''}
        </div>

        ${leader?`<button class="btn btn-primary card-enter" onclick="app.churchView('dashboard')">📊 Church Plan Dashboard</button><div style="height:10px"></div>`:''}
        <button class="btn btn-ghost card-enter" onclick="app.churchView('community')">🌍 Community Hub — churches & events near you</button>
        <div style="height:10px"></div>

        ${ch.giving_url?`
        <div class="card card-enter" style="border-color:var(--accent)">
          <div class="card-header"><span class="icon">💝</span> Give to ${esc(ch.name)}</div>
          <div style="font-size:13px;color:var(--text-muted);line-height:1.6;margin-bottom:10px">${esc(ch.giving_note||'Tithes and offerings go directly to your church — Flourish never touches them.')}</div>
          <a class="btn btn-primary" style="display:block;text-align:center;text-decoration:none" href="${esc(ch.giving_url)}" target="_blank" rel="noopener">💝 Give / Tithe online</a>
        </div>`:leader?`
        <div class="card card-enter">
          <div class="card-header"><span class="icon">💝</span> Set up online giving</div>
          <div style="font-size:13px;color:var(--text-muted);line-height:1.6;margin-bottom:10px">Add your church's giving link (Stripe, Tithe.ly, Givelify, PayPal) and members can tithe from right here — funds go straight to your church.</div>
          <button class="btn btn-ghost" onclick="app.editChurchProfile()">Add giving link →</button>
        </div>`:''}

        <div class="card card-enter">
          <div class="card-header"><span class="icon">📢</span> Announcements</div>
          ${(annRes.data||[]).length?(annRes.data).map(a=>`
            <div class="announce-card">${a.pinned?'📌 ':''}<span class="an-title">${esc(a.title)}</span>
              <div class="an-body">${esc(a.body)}</div>
              <div class="an-meta">${fmtDate(a.publish_at)}</div>
            </div>`).join(''):'<div class="empty-mini">No announcements yet.</div>'}
          ${leader?`<button class="btn btn-ghost" onclick="app.composeAnnouncement()">+ Post announcement</button>`:''}
        </div>

        <div class="card card-enter">
          <div class="card-header"><span class="icon">📅</span> Community Events</div>
          ${(evRes.data||[]).length?(evRes.data).map(ev=>{
            const mine=(ev.event_rsvps||[]).find(r=>r.user_id===state.user.id);
            const yes=(ev.event_rsvps||[]).filter(r=>r.status==='yes').length;
            const dt=new Date(ev.start_time);
            evCache[ev.id]=ev;
            return `<div class="event-item">
              <div class="event-date-block"><div class="d-month">${dt.toLocaleString(undefined,{month:'short'}).toUpperCase()}</div><div class="d-day">${dt.getDate()}</div></div>
              <div class="event-body">
                <div class="event-title">${esc(ev.title)} ${ev.visibility==='public'?'<span title="Visible in the Community Hub" style="font-size:11px">🌍</span>':''}</div>
                <div class="event-meta">${fmtDateTime(ev.start_time)}${ev.location_name?' · '+esc(ev.location_name):''} · ${yes} going</div>
                ${ev.description?`<div style="font-size:12.5px;color:var(--text-muted);margin-top:4px;line-height:1.5">${esc(ev.description)}</div>`:''}
                <div class="rsvp-row">
                  ${['yes','maybe','no'].map(s=>`<button class="rsvp-btn ${mine?.status===s?'active':''}" onclick="app.rsvp('${ev.id}','${s}')">${s==='yes'?'✅ Going':s==='maybe'?'🤔 Maybe':'✖️ No'}</button>`).join('')}
                  <button class="rsvp-btn" onclick="app.addToCal('${ev.id}')">🗓️</button>
                  ${ev.fundraising_url?`<a class="rsvp-btn" style="text-decoration:none;border-color:var(--accent)" href="${esc(ev.fundraising_url)}" target="_blank" rel="noopener">💝 ${esc(ev.fundraising_label||'Support')}</a>`:''}
                  ${leader?`<button class="rsvp-btn" onclick="app.checkinQR('${ev.id}','${esc(ev.title)}')">📲 Check-in${(ev.event_checkins||[]).length?' · '+(ev.event_checkins||[]).length:''}</button>`:''}
                </div>
                ${(Array.isArray(ev.volunteer_roles)&&ev.volunteer_roles.length)?`
                <div class="rsvp-row" style="margin-top:6px">
                  <span style="font-size:11px;color:var(--text-dim);align-self:center">🤝 Serve:</span>
                  ${ev.volunteer_roles.map(r=>{
                    const vols=(ev.event_volunteers||[]).filter(v=>v.role===r);
                    const mineV=vols.some(v=>v.user_id===state.user.id);
                    return `<button class="rsvp-btn ${mineV?'active':''}" onclick="app.toggleServe('${ev.id}','${esc(r)}')">${esc(r)}${vols.length?' · '+vols.length:''}</button>`;
                  }).join('')}
                </div>`:''}
              </div>
            </div>`;
          }).join(''):'<div class="empty-mini">No upcoming events.</div>'}
          ${leader?`<button class="btn btn-ghost" onclick="app.composeEvent()">+ Create event</button>`:''}
        </div>

        ${camp?`
        <div class="card card-enter" style="border-color:var(--accent)">
          <div class="card-header"><span class="icon">📖</span> Reading Together</div>
          <div style="font-weight:700;font-size:15px">${esc(campPlan?.title||camp.plan_id)}</div>
          ${campPlan?`<div style="font-size:13px;color:var(--text-muted);line-height:1.6;margin-top:4px">${esc(campPlan.tagline)}</div>`:''}
          ${camp.note?`<div style="font-size:13px;color:var(--text-muted);line-height:1.6;margin-top:6px">💬 ${esc(camp.note)}</div>`:''}
          <div style="font-size:11.5px;color:var(--text-dim);margin-top:6px">Your whole church is walking this plan together — started ${fmtDate(camp.starts_on)}.</div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="btn btn-primary" style="flex:1" onclick="app.openPlan('${esc(camp.plan_id)}')">Open the plan →</button>
            ${leader?`<button class="btn btn-ghost" style="width:auto" onclick="app.archiveCampaign('${camp.id}')">End</button>`:''}
          </div>
        </div>`:leader?`
        <div class="card card-enter">
          <div class="card-header"><span class="icon">📖</span> Reading Together</div>
          <div style="font-size:13px;color:var(--text-muted);line-height:1.6;margin-bottom:10px">Pick one of the 26 guided plans for your whole church to walk through together — it appears here for every member.</div>
          <button class="btn btn-ghost" onclick="app.startCampaignForm()">📖 Start a church campaign</button>
        </div>`:''}

        <div class="card card-enter">
          <div class="card-header"><span class="icon">👥</span> Groups & Ministries</div>
          ${(grpRes.data||[]).length?(grpRes.data).map(g=>{
            const members=g.group_members||[];
            const joined=members.some(m=>m.user_id===state.user.id);
            return `<div class="conv-row" onclick="app.openGroup('${g.id}')">
              <div><div class="cr-title">${esc(g.emoji||'👥')} ${esc(g.name)} ${joined?'<span style="color:var(--accent);font-size:11px">✓ Joined</span>':''}</div>
              <div class="cr-sub">${members.length} member${members.length===1?'':'s'}${g.meeting_info?' · '+esc(g.meeting_info):''}</div></div>
              <div>→</div>
            </div>`;
          }).join(''):'<div class="empty-mini">No groups yet.'+(leader?' Create the first one below.':' Ask your leaders to create men\'s, women\'s, youth, or study groups.')+'</div>'}
          ${leader?`<button class="btn btn-ghost" onclick="app.createGroupForm()">+ Create group</button>`:''}
        </div>

        <div class="card card-enter">
          <div class="card-header"><span class="icon">🙏</span> Prayer Wall</div>
          <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px">Church-wide requests from your congregation. Tap 🙏 to let them know you're praying.</div>
          ${(wallRes.data||[]).length?(wallRes.data).map(r=>`
            <div class="card req-card ${r.status}" style="padding:12px;margin-bottom:8px">
              <div><span class="req-badge ${r.status}">${r.status}</span><span class="req-badge active">${esc(r.category)}</span></div>
              <div style="font-weight:700;font-size:14px;margin-top:5px">${esc(r.title)}</div>
              ${r.body?`<div style="font-size:13px;color:var(--text-muted);line-height:1.55;margin-top:4px">${esc(r.body)}</div>`:''}
              <div class="req-meta">${fmtDate(r.created_at)} · 🙏 ${r.prayer_count} praying</div>
              <button class="btn btn-ghost" style="font-size:12px;padding:6px 12px;width:auto;margin-top:8px" onclick="app.prayFor('${r.id}')">🙏 I'm praying</button>
            </div>`).join(''):'<div class="empty-mini">No church-wide requests right now. Share one with "⛪ Church-wide prayer" in New Request.</div>'}
        </div>

        <div class="card card-enter">
          <div class="card-header"><span class="icon">🕊️</span> Reach Your Leaders</div>
          <div style="font-size:13.5px;color:var(--text-muted);line-height:1.6;margin-bottom:12px">Send a private message or a request — prayer, counseling, a visit, benevolence. Your leaders see it; the congregation doesn't (unless you choose church-wide).</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" style="flex:1" onclick="app.messageLeaders()">💬 Message</button>
            <button class="btn btn-primary" style="flex:1" onclick="app.newRequestForm()">🙏 New Request</button>
          </div>
          ${(reqRes.data||[]).length?`<div style="margin-top:10px;font-size:12.5px;color:var(--text-dim)">You have ${(reqRes.data).length} open request${(reqRes.data).length>1?'s':''} — view them in <span class="auth-link" onclick="location.hash='profile';app.showPage('profile')">Me → My Requests</span>.</div>`:''}
          ${leader?`<button class="btn btn-ghost" style="margin-top:10px" onclick="app.churchView('requests')">📥 Requests Inbox (leaders)</button>`:''}
        </div>

        <div class="card card-enter">
          <div class="card-header"><span class="icon">🔗</span> Share & Integrate</div>
          <div style="display:flex;justify-content:center;padding:12px;background:var(--surface-2);border-radius:12px;margin-bottom:10px">${QR.create(joinURL(ch), {size:200, color:'#1a3c1a', bg:'#f5f0e8'})}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" style="flex:1;min-width:45%" onclick="app.copyText('${esc(joinURL(ch))}')">📋 Invite link</button>
            <button class="btn btn-primary" style="flex:1;min-width:45%" onclick="app.copyText('${esc(pageURL(ch))}')">🌍 Public page link</button>
          </div>
          ${leader?`
          <div style="font-size:12.5px;color:var(--text-muted);line-height:1.6;margin-top:12px">
            <strong>Put Flourish on your church's website:</strong> link the public page from your site, or paste this widget into any page — it shows your church card and upcoming events, and lets visitors join in one tap.
          </div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-ghost" style="flex:1" onclick="app.copyEmbed('${ch.id}')">📦 Copy embed code</button>
            <button class="btn btn-ghost" style="flex:1" onclick="app.openChurchPage('${esc(ch.slug||ch.id)}')">👁️ Preview page</button>
          </div>`:`
          <button class="btn btn-ghost" style="margin-top:8px" onclick="app.leaveChurch('${mem.id}','${esc(ch.name)}')">Leave church</button>`}
          ${leader?`<button class="btn btn-ghost" style="margin-top:8px" onclick="app.leaveChurch('${mem.id}','${esc(ch.name)}')">Leave church</button>`:''}
        </div>

        <button class="btn btn-ghost card-enter" onclick="app.churchView('directory')">⛪ Browse all churches</button>
        <div style="height:20px"></div>
      </div>`;
  }

  const joinURL = ch => location.origin + location.pathname + '?join=' + encodeURIComponent(ch.slug);
  const pageURL = ch => location.origin + location.pathname + '?church=' + encodeURIComponent(ch.slug||ch.id);
  const fmtServiceTime = t => typeof t==='string' ? t
    : [t?.label, [t?.day, t?.time].filter(Boolean).join(' ')].filter(Boolean).join(' — ') || '';
  const SOCIAL_ICONS = {youtube:'▶️ YouTube', facebook:'📘 Facebook', instagram:'📸 Instagram', podcast:'🎧 Podcast'};
  function socialRow(ch, style){
    const links = ch?.social_links || {};
    const entries = Object.entries(SOCIAL_ICONS).filter(([k])=>links[k]);
    if(!entries.length) return '';
    return `<div class="chip-row" style="${style||'justify-content:center;margin-top:10px'}">${entries.map(([k,label])=>
      `<a class="f-chip" style="text-decoration:none" href="${esc(links[k])}" target="_blank" rel="noopener">${label}</a>`).join('')}</div>`;
  }
  const embedURL = ch => location.origin + location.pathname.replace(/index\.html$/,'').replace(/\/$/,'') + '/embed.html?church=' + encodeURIComponent(ch.slug||ch.id);
  const embedCode = ch => `<iframe src="${embedURL(ch)}" style="width:100%;max-width:420px;height:520px;border:0;border-radius:16px" title="${(ch.name||'Church')} on Flourish" loading="lazy"></iframe>`;

  let directoryChurches = null;
  function churchCard(ch, opts={}){
    const memberOf=new Set(state.memberships.map(mm=>mm.church_id));
    const joined=memberOf.has(ch.id);
    return `<div class="card church-card ${joined?'joined':''}" style="margin:0;padding:14px" data-search="${esc((ch.name+' '+ch.city+' '+(ch.state||'')+' '+(ch.denomination||'')).toLowerCase())}">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div class="church-avatar">⛪</div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:15px;color:var(--text)">${esc(ch.name)} ${joined?'<span style="color:var(--accent);font-size:12px">✓ Member</span>':''}${ch.is_verified?' <span title="Verified" style="font-size:12px">☑️</span>':''}
            ${ch._mi!=null?`<span style="float:right;font-size:12px;color:var(--accent);font-weight:700">📍 ${fmtMi(ch._mi)}</span>`:''}</div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:2px">${esc(ch.city)}${ch.state?', '+esc(ch.state):''} · ${esc(ch.denomination||'')}</div>
          ${ch.pastor_name?`<div style="font-size:12px;color:var(--text-muted);margin-top:2px">${esc(ch.pastor_name)}</div>`:''}
          ${ch.description?`<div style="font-size:12.5px;color:var(--text-muted);margin-top:5px;line-height:1.5">${esc(ch.description)}</div>`:''}
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <button class="btn btn-ghost" style="font-size:12px;padding:6px 12px;width:auto" onclick="app.openChurchPage('${esc(ch.slug||ch.id)}')">View page</button>
            ${ch.website?`<a class="btn btn-ghost" style="font-size:12px;padding:6px 12px;width:auto;text-decoration:none;text-align:center" href="${esc(ch.website)}" target="_blank" rel="noopener">🌐 Website</a>`:''}
            ${joined
              ? `<button class="btn btn-ghost" style="font-size:12px;padding:6px 12px;width:auto" onclick="app.switchChurch('${ch.id}');app.churchView('home')">Open</button>`
              : `<button class="btn btn-primary" style="font-size:12px;padding:6px 12px;width:auto" onclick="app.joinChurch('${ch.id}','${esc(ch.name)}')">Join</button>`}
          </div>
        </div>
      </div>
    </div>`;
  }

  async function renderDirectory(){
    const m=$('#main');
    m.innerHTML=`<div class="sacred-loader card-enter"><div class="seed-glyph">⛪</div><p class="loader-text">Finding the flocks...</p></div>`;
    const { data: churches, error } = await sb.from('churches').select('*').eq('is_public', true).order('name');
    if(error){ m.innerHTML=`<div class="error-state"><p class="error-msg">${esc(error.message)}</p></div>`; return; }
    directoryChurches = churches;
    const sorted = geoPos ? sortByDistance(churches) : withDistance(churches);
    const located = churches.filter(hasCoords).length;
    m.innerHTML=`
      <div class="page">
        <div class="week-detail-header card-enter">
          <button class="btn-nav-round" onclick="app.churchView('home')">◀</button>
          <div class="week-detail-info"><div class="week-detail-theme">Church Directory</div>
          <div class="week-detail-progress">${churches.length} churches on Flourish${geoPos?' · sorted by distance':''}</div></div>
        </div>
        ${geoPos?'':`<button class="btn btn-primary card-enter" onclick="app.findNearMe('directory')">📍 Sort by distance from me</button><div style="height:10px"></div>`}
        <input type="text" class="search-box card-enter" placeholder="Search by name or city..." oninput="app.filterChurches(this.value)">
        ${geoPos && located<churches.length?`<div style="font-size:11.5px;color:var(--text-dim);margin-top:6px">Churches without a set location appear last — leaders can pin theirs in Church → Edit profile.</div>`:''}
        <div id="church-list" style="display:flex;flex-direction:column;gap:12px;margin-top:10px">
          ${sorted.map(ch=>churchCard(ch)).join('')}
        </div>
        <div style="height:12px"></div>
        <button class="btn btn-ghost card-enter" onclick="app.churchView('community')">🌍 Open the Community Hub</button>
        ${state.user?`<div style="height:8px"></div><button class="btn btn-ghost card-enter" onclick="app.registerChurchForm()">➕ My church isn't listed — register it</button>`:''}
        <div style="height:20px"></div>
      </div>`;
  }

  // ── COMMUNITY HUB — churches & public events around you ──
  async function renderCommunity(){
    const m=$('#main');
    m.innerHTML=`<div class="sacred-loader card-enter"><div class="seed-glyph">🌍</div><p class="loader-text">Gathering the body of Christ around you...</p></div>`;
    const [chRes, evRes] = await Promise.all([
      sb.from('churches').select('*').eq('is_public', true),
      sb.from('events').select('*, churches(id,name,slug,city,state,lat,lng,is_public)')
        .eq('visibility','public').gte('start_time', new Date(Date.now()-864e5).toISOString())
        .is('cancelled_at', null).order('start_time').limit(60)
    ]);
    if(chRes.error){ m.innerHTML=`<div class="error-state"><p class="error-msg">${esc(chRes.error.message)}</p></div>`; return; }
    const churches = sortByDistance(chRes.data||[]);
    const near = churches.filter(c=>c._mi!=null && c._mi<=60);
    const events = (evRes.data||[]).filter(ev=>ev.churches?.is_public!==false).map(ev=>{
      ev._mi = (geoPos && hasCoords(ev.churches)) ? distMi(geoPos, ev.churches) : null;
      evCache[ev.id]=ev;
      return ev;
    }).sort((a,b)=>{
      // near events first (within 60mi), then by date
      const an=a._mi!=null&&a._mi<=60, bn=b._mi!=null&&b._mi<=60;
      if(an!==bn) return an?-1:1;
      return new Date(a.start_time)-new Date(b.start_time);
    });
    m.innerHTML=`
      <div class="page">
        <div class="week-detail-header card-enter">
          <button class="btn-nav-round" onclick="app.churchView('home')">◀</button>
          <div class="week-detail-info"><div class="week-detail-theme">Community Hub</div>
          <div class="week-detail-progress">One body, many congregations — ${churches.length} churches · ${events.length} public events</div></div>
        </div>
        ${!geoPos?`
        <div class="card card-enter">
          <div class="card-header"><span class="icon">📍</span> Use your location</div>
          <div style="font-size:13.5px;color:var(--text-muted);line-height:1.6;margin-bottom:10px">See churches and gatherings near you, sorted by distance. Your location stays on your device — it is never uploaded.</div>
          <button class="btn btn-primary" onclick="app.findNearMe('community')">📍 Find the church near me</button>
        </div>`:''}
        <div class="card card-enter">
          <div class="card-header"><span class="icon">📅</span> Happening in the Body</div>
          <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px">Public events from every church on Flourish — visit, worship, and serve together across congregations.</div>
          ${events.length?events.map(ev=>{
            const dt=new Date(ev.start_time);
            return `<div class="event-item">
              <div class="event-date-block"><div class="d-month">${dt.toLocaleString(undefined,{month:'short'}).toUpperCase()}</div><div class="d-day">${dt.getDate()}</div></div>
              <div class="event-body">
                <div class="event-title">${esc(ev.title)}</div>
                <div class="event-meta">⛪ <span class="auth-link" onclick="app.openChurchPage('${esc(ev.churches?.slug||ev.church_id)}')">${esc(ev.churches?.name||'Church')}</span>${ev.churches?.city?' · '+esc(ev.churches.city):''}${ev._mi!=null?' · 📍 '+fmtMi(ev._mi):''}</div>
                <div class="event-meta">${fmtDateTime(ev.start_time)}${ev.location_name?' · '+esc(ev.location_name):''}</div>
                ${ev.description?`<div style="font-size:12.5px;color:var(--text-muted);margin-top:4px;line-height:1.5">${esc(ev.description)}</div>`:''}
                <div class="rsvp-row">
                  <button class="rsvp-btn" onclick="app.rsvpCommunity('${ev.id}')">✅ I'm coming</button>
                  <button class="rsvp-btn" onclick="app.addToCal('${ev.id}')">🗓️ Add to calendar</button>
                  ${ev.fundraising_url?`<a class="rsvp-btn" style="text-decoration:none;border-color:var(--accent)" href="${esc(ev.fundraising_url)}" target="_blank" rel="noopener">💝 ${esc(ev.fundraising_label||'Support')}</a>`:''}
                </div>
              </div>
            </div>`;
          }).join(''):'<div class="empty-mini">No public events yet. Church leaders: post your events as 🌍 Public and they appear here for the whole community.</div>'}
        </div>
        <div class="card card-enter">
          <div class="card-header"><span class="icon">⛪</span> ${geoPos?'Churches Near You':'Churches on Flourish'}</div>
          <div id="church-list" style="display:flex;flex-direction:column;gap:12px">
            ${(geoPos?(near.length?near:churches):churches).slice(0,15).map(ch=>churchCard(ch)).join('')}
          </div>
          ${geoPos&&!near.length?'<div class="empty-mini" style="margin-top:8px">No located churches within 60 miles yet — showing all. Invite your church to Flourish!</div>':''}
          <button class="btn btn-ghost" style="margin-top:10px" onclick="app.churchView('directory')">Full directory →</button>
        </div>
        ${state.user?`<button class="btn btn-ghost card-enter" onclick="app.registerChurchForm()">➕ Register your church</button>`:''}
        <div style="height:20px"></div>
      </div>`;
  }

  // ── PUBLIC CHURCH PAGE — shareable & linkable from church websites ──
  async function renderChurchPage(key){
    const m=$('#main');
    if(!key){ return app.churchView('directory'); }
    m.innerHTML=`<div class="sacred-loader card-enter"><div class="seed-glyph">⛪</div><p class="loader-text">Opening the church page...</p></div>`;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(key);
    const { data: ch, error } = await sb.from('churches').select('*')
      .eq(isUuid?'id':'slug', key).maybeSingle();
    if(error || !ch){ m.innerHTML=`<div class="error-state"><p class="error-msg">Church not found.</p></div>`; return; }
    const { data: events } = await sb.from('events').select('*')
      .eq('church_id', ch.id).eq('visibility','public')
      .gte('start_time', new Date(Date.now()-864e5).toISOString())
      .is('cancelled_at', null).order('start_time').limit(12);
    (events||[]).forEach(ev=>{ evCache[ev.id]=ev; ev.churches=ch; });
    const joined = state.memberships.some(mm=>mm.church_id===ch.id);
    const mi = (geoPos && hasCoords(ch)) ? distMi(geoPos, ch) : null;
    const times = Array.isArray(ch.service_times) ? ch.service_times : (ch.service_times?Object.values(ch.service_times):[]);
    const mapsQ = encodeURIComponent([ch.address, ch.city, ch.state].filter(Boolean).join(', ') || ch.name);
    m.innerHTML=`
      <div class="page">
        <div class="church-hero card-enter">
          <button class="btn-nav-round" onclick="app.churchView('community')" style="position:absolute;top:14px;left:14px">◀</button>
          <div class="church-hero-icon">⛪</div>
          <div class="church-hero-name">${esc(ch.name)} ${ch.is_verified?'<span title="Verified" style="font-size:14px">☑️</span>':''}</div>
          <div class="church-hero-meta">${esc(ch.city)}${ch.state?', '+esc(ch.state):''} · ${esc(ch.denomination||'')}${mi!=null?' · 📍 '+fmtMi(mi)+' from you':''}</div>
          <div class="church-hero-pastor">${esc(ch.pastor_name||'')}</div>
          ${ch.description?`<div style="font-size:13.5px;color:var(--text-muted);line-height:1.6;margin-top:10px">${esc(ch.description)}</div>`:''}
          <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;justify-content:center">
            ${joined
              ? `<button class="btn btn-ghost" style="width:auto;padding:10px 18px" onclick="app.switchChurch('${ch.id}');app.churchView('home')">Open my church</button>`
              : `<button class="btn btn-primary" style="width:auto;padding:10px 18px" onclick="app.joinChurch('${ch.id}','${esc(ch.name)}')">⛪ Join this church</button>`}
            ${ch.website?`<a class="btn btn-ghost" style="width:auto;padding:10px 18px;text-decoration:none" href="${esc(ch.website)}" target="_blank" rel="noopener">🌐 Website</a>`:''}
            ${ch.giving_url?`<a class="btn btn-ghost" style="width:auto;padding:10px 18px;text-decoration:none;border-color:var(--accent)" href="${esc(ch.giving_url)}" target="_blank" rel="noopener">💝 Give</a>`:''}
            ${ch.sermons_url?`<a class="btn btn-ghost" style="width:auto;padding:10px 18px;text-decoration:none" href="${esc(ch.sermons_url)}" target="_blank" rel="noopener">🎙️ Sermons</a>`:''}
          </div>
          ${socialRow(ch)}
        </div>
        ${(ch.address||times.length)?`
        <div class="card card-enter">
          <div class="card-header"><span class="icon">🕰️</span> Visit</div>
          ${ch.address?`<div style="font-size:13.5px;line-height:1.6">${esc(ch.address)}${ch.city?', '+esc(ch.city):''}${ch.state?', '+esc(ch.state):''} — <a class="auth-link" href="https://www.google.com/maps/search/?api=1&query=${mapsQ}" target="_blank" rel="noopener">Directions ↗</a></div>`:''}
          ${times.length?`<div style="margin-top:8px">${times.map(t=>`<div style="font-size:13px;color:var(--text-muted)">⛪ ${esc(fmtServiceTime(t))}</div>`).join('')}</div>`:''}
        </div>`:''}
        <div class="card card-enter">
          <div class="card-header"><span class="icon">📅</span> Upcoming Events</div>
          ${(events||[]).length?(events).map(ev=>{
            const dt=new Date(ev.start_time);
            return `<div class="event-item">
              <div class="event-date-block"><div class="d-month">${dt.toLocaleString(undefined,{month:'short'}).toUpperCase()}</div><div class="d-day">${dt.getDate()}</div></div>
              <div class="event-body">
                <div class="event-title">${esc(ev.title)}</div>
                <div class="event-meta">${fmtDateTime(ev.start_time)}${ev.location_name?' · '+esc(ev.location_name):''}</div>
                ${ev.description?`<div style="font-size:12.5px;color:var(--text-muted);margin-top:4px;line-height:1.5">${esc(ev.description)}</div>`:''}
                <div class="rsvp-row">
                  <button class="rsvp-btn" onclick="app.rsvpCommunity('${ev.id}')">✅ I'm coming</button>
                  <button class="rsvp-btn" onclick="app.addToCal('${ev.id}')">🗓️ Add to calendar</button>
                  ${ev.fundraising_url?`<a class="rsvp-btn" style="text-decoration:none;border-color:var(--accent)" href="${esc(ev.fundraising_url)}" target="_blank" rel="noopener">💝 ${esc(ev.fundraising_label||'Support')}</a>`:''}
                </div>
              </div>
            </div>`;
          }).join(''):'<div class="empty-mini">No upcoming public events.</div>'}
        </div>
        <div class="card card-enter">
          <div class="card-header"><span class="icon">📷</span> Share this church</div>
          <div style="display:flex;justify-content:center;padding:12px;background:var(--surface-2);border-radius:12px;margin-bottom:10px">${QR.create(pageURL(ch), {size:180, color:'#1a3c1a', bg:'#f5f0e8'})}</div>
          <button class="btn btn-primary" onclick="app.copyText('${esc(pageURL(ch))}')">📋 Copy page link</button>
        </div>
        <div style="height:20px"></div>
      </div>`;
  }

  // ── GROUP DETAIL — roster, meeting info, group chat ──
  async function renderGroup(groupId){
    const m=$('#main');
    if(!groupId || !state.user){ return app.churchView('home'); }
    m.innerHTML=`<div class="sacred-loader card-enter"><div class="seed-glyph">👥</div><p class="loader-text">Gathering the group...</p></div>`;
    const { data: g, error } = await sb.from('groups').select('*, group_members(user_id, role, joined_at)').eq('id', groupId).maybeSingle();
    if(error || !g){ toast('Group not found'); return app.churchView('home'); }
    const members=g.group_members||[];
    const joined=members.some(mm=>mm.user_id===state.user.id);
    const isGroupLeader=members.some(mm=>mm.user_id===state.user.id && mm.role==='leader');
    const chLeader=isLeader(myMembership());
    // roster names (graceful degrade if profiles unreadable)
    let names={};
    try {
      const { data: profs } = await sb.from('profiles').select('id, display_name').in('id', members.map(mm=>mm.user_id));
      (profs||[]).forEach(p=>names[p.id]=p.display_name);
    } catch(e){}
    m.innerHTML=`
      <div class="page">
        <div class="week-detail-header card-enter">
          <button class="btn-nav-round" onclick="app.churchView('home')">◀</button>
          <div class="week-detail-info">
            <div class="week-detail-eyebrow">Group · ${members.length} member${members.length===1?'':'s'}</div>
            <div class="week-detail-theme">${esc(g.emoji||'👥')} ${esc(g.name)}</div>
            ${g.meeting_info?`<div class="week-detail-progress">🗓️ ${esc(g.meeting_info)}</div>`:''}
          </div>
        </div>
        ${g.description?`<div class="card card-enter"><div style="line-height:1.7;font-size:14px;color:var(--text-muted)">${esc(g.description)}</div></div>`:''}
        <div style="display:flex;gap:8px" class="card-enter">
          ${joined
            ? `${g.conversation_id?`<button class="btn btn-primary" style="flex:1" onclick="app.openChat('${g.conversation_id}')">💬 Group chat</button>`:''}
               <button class="btn btn-ghost" style="flex:1" onclick="app.leaveGroup('${g.id}','${esc(g.name)}')">Leave group</button>`
            : `<button class="btn btn-primary" style="flex:1" onclick="app.joinGroup('${g.id}','${esc(g.name)}')">👥 Join this group</button>`}
        </div>
        <div style="height:10px"></div>
        <div class="card card-enter">
          <div class="card-header"><span class="icon">📋</span> Members</div>
          ${members.map(mm=>`<div class="member-row"><span>${esc(names[mm.user_id]||'Member')} ${mm.role==='leader'?'👑':''}</span><span style="font-size:12px;color:var(--text-dim)">since ${fmtDate(mm.joined_at)}</span></div>`).join('')||'<div class="empty-mini">No members yet.</div>'}
        </div>
        ${(isGroupLeader||chLeader)?`<button class="btn btn-danger card-enter" onclick="app.deleteGroup('${g.id}','${esc(g.name)}')">Delete group</button>`:''}
        <div style="height:20px"></div>
      </div>`;
  }

  function createGroupForm(){
    const mem=myMembership(); if(!mem||!isLeader(mem)) return toast('Leader access required');
    closeSheets();
    document.body.insertAdjacentHTML('beforeend',`
      <div class="auth-overlay" id="auth-overlay" onclick="if(event.target===this)this.remove()">
        <div class="auth-sheet">
          <h3>👥 New Group / Ministry</h3>
          <div class="as-sub">For ${esc(mem.churches.name)} — men's group, women's study, youth, worship team, any ministry.</div>
          <div style="display:flex;gap:8px">
            <input class="auth-input" id="gr-emoji" placeholder="Emoji" value="👥" style="width:72px">
            <input class="auth-input" id="gr-name" placeholder="Group name *" style="flex:1">
          </div>
          <textarea class="auth-input" id="gr-desc" rows="2" placeholder="What is this group about?"></textarea>
          <input class="auth-input" id="gr-meet" placeholder="Meeting rhythm (e.g., Tuesdays 7pm, Room 3)">
          <button class="btn btn-primary" id="gr-send">Create Group</button>
        </div>
      </div>`);
    $('#gr-send').onclick=async()=>{
      const name=$('#gr-name').value.trim();
      if(!name) return toast('Name required');
      const { data, error }=await sb.rpc('create_group',{
        p_church_id:mem.church_id, p_name:name,
        p_description:$('#gr-desc').value.trim()||null,
        p_emoji:$('#gr-emoji').value.trim()||'👥',
        p_meeting_info:$('#gr-meet').value.trim()||null});
      if(error) return toast('⚠️ '+error.message);
      $('#auth-overlay').remove();
      toast('👥 Group created.');
      app.openGroup(data);
    };
  }

  async function renderDashboard(){
    const m=$('#main');
    const mem=myMembership();
    if(!mem || !isLeader(mem)){ toast('Leader access required'); return app.churchView('home'); }
    const ch=mem.churches;
    m.innerHTML=`<div class="sacred-loader card-enter"><div class="seed-glyph">📊</div><p class="loader-text">Gathering the flock's numbers...</p></div>`;
    let dash;
    try {
      const { data, error } = await sb.rpc('church_dashboard', {p_church_id: ch.id});
      if(error) throw error;
      dash=data;
    } catch(e){ m.innerHTML=`<div class="error-state"><p class="error-msg">${esc(e.message)}</p></div>`; return; }
    const eng=dash.devotional_engagement||{};
    m.innerHTML=`
      <div class="page">
        <div class="week-detail-header card-enter">
          <button class="btn-nav-round" onclick="app.churchView('home')">◀</button>
          <div class="week-detail-info">
            <div class="week-detail-eyebrow">${esc(ch.name)}</div>
            <div class="week-detail-theme">Church Plan Dashboard</div>
            <div class="week-detail-progress">How your flock is flourishing</div>
          </div>
        </div>
        <div class="dash-grid card-enter">
          <div class="dash-stat"><div class="ds-num">${dash.member_count||0}</div><div class="ds-label">Members</div></div>
          <div class="dash-stat"><div class="ds-num">+${dash.new_members_30d||0}</div><div class="ds-label">New (30d)</div></div>
          <div class="dash-stat"><div class="ds-num">${eng.members_active_7d||0}</div><div class="ds-label">Active in Word (7d)</div></div>
          <div class="dash-stat"><div class="ds-num">${eng.days_completed_7d||0}</div><div class="ds-label">Lessons done (7d)</div></div>
          <div class="dash-stat"><div class="ds-num">${dash.active_requests||0}</div><div class="ds-label">Open Requests</div></div>
          <div class="dash-stat"><div class="ds-num" style="${(dash.urgent_requests||0)>0?'color:#e07370':''}">${dash.urgent_requests||0}</div><div class="ds-label">Urgent</div></div>
          <div class="dash-stat"><div class="ds-num">${dash.upcoming_events||0}</div><div class="ds-label">Upcoming Events</div></div>
          <div class="dash-stat"><div class="ds-num">${dash.total_rsvps_upcoming||0}</div><div class="ds-label">RSVPs</div></div>
        </div>
        <div style="display:flex;gap:8px" class="card-enter">
          <button class="btn btn-primary" style="flex:1" onclick="app.churchView('requests')">📥 Requests</button>
          <button class="btn btn-primary" style="flex:1" onclick="app.leaderConversations()">💬 Messages</button>
        </div>
        <div style="height:10px"></div>
        <div class="card card-enter">
          <div class="card-header"><span class="icon">🌿</span> Member Devotional Progress</div>
          ${(dash.member_progress||[]).length?(dash.member_progress).map(mp=>`
            <div class="member-row"><span>${esc(mp.display_name)}</span>
              <span><span class="mr-days">${mp.days_completed}</span> days · last ${mp.last_active?fmtDate(mp.last_active):'—'}</span></div>`).join('')
            :'<div class="empty-mini">No member progress yet. As members complete devotionals (signed in), their growth appears here.</div>'}
        </div>
        <div style="display:flex;gap:8px" class="card-enter">
          <button class="btn btn-ghost" style="flex:1" onclick="app.composeAnnouncement()">📢 Announce</button>
          <button class="btn btn-ghost" style="flex:1" onclick="app.composeEvent()">📅 New Event</button>
        </div>
        <div style="height:20px"></div>
      </div>`;
  }

  // ── Requests ──
  function newRequestForm(){
    if(!requireAuth('Sign in to send requests to your church leaders.')) return;
    const mem=myMembership(); if(!mem) return toast('Join a church first');
    closeSheets();
    document.body.insertAdjacentHTML('beforeend',`
      <div class="auth-overlay" id="auth-overlay" onclick="if(event.target===this)this.remove()">
        <div class="auth-sheet">
          <h3>Request to ${esc(mem.churches.name)} leaders</h3>
          <div class="as-sub">Goes privately to your pastors and church admins.</div>
          <div class="chip-row" id="req-cat">
            ${['prayer','counseling','benevolence','visit','other'].map((c,i)=>`<button class="f-chip ${i===0?'active':''}" data-c="${c}">${c==='prayer'?'🙏 Prayer':c==='counseling'?'💬 Counseling':c==='benevolence'?'🤝 Help/Benevolence':c==='visit'?'🏠 Visit':'✏️ Other'}</button>`).join('')}
          </div>
          <input class="auth-input" id="req-title" placeholder="Title (e.g., 'Mother's healing')">
          <textarea class="auth-input" id="req-body" rows="4" placeholder="Share what you can — your leaders are for you."></textarea>
          <div class="chip-row">
            <button class="f-chip active" id="req-urgent-no">Normal</button>
            <button class="f-chip" id="req-urgent-yes" style="border-color:#c0504d">🔴 Urgent</button>
          </div>
          <div class="chip-row">
            <button class="f-chip active" id="req-priv-pastoral">🔒 Leaders only</button>
            <button class="f-chip" id="req-priv-church">⛪ Church-wide prayer</button>
          </div>
          <button class="btn btn-primary" id="req-send">Send Request</button>
        </div>
      </div>`);
    $$('#req-cat .f-chip').forEach(c=>c.onclick=()=>{ $$('#req-cat .f-chip').forEach(x=>x.classList.remove('active')); c.classList.add('active'); });
    const u1=$('#req-urgent-no'),u2=$('#req-urgent-yes');
    u1.onclick=()=>{u1.classList.add('active');u2.classList.remove('active');};
    u2.onclick=()=>{u2.classList.add('active');u1.classList.remove('active');};
    const p1=$('#req-priv-pastoral'),p2=$('#req-priv-church');
    p1.onclick=()=>{p1.classList.add('active');p2.classList.remove('active');};
    p2.onclick=()=>{p2.classList.add('active');p1.classList.remove('active');};
    $('#req-send').onclick=async()=>{
      const title=$('#req-title').value.trim();
      if(!title) return toast('Add a title');
      const { error } = await sb.from('prayer_requests').insert({
        user_id: state.user.id, church_id: mem.church_id, title,
        body: $('#req-body').value.trim()||null,
        category: $('#req-cat .f-chip.active').dataset.c,
        status: u2.classList.contains('active')?'urgent':'active',
        privacy: p2.classList.contains('active')?'church_wide':'pastoral_only'
      });
      if(error) return toast('⚠️ '+error.message);
      $('#auth-overlay').remove();
      toast('🕊️ Request sent to your leaders.');
    };
  }

  async function renderRequestsInbox(){
    const m=$('#main');
    const mem=myMembership();
    if(!mem || !isLeader(mem)){ toast('Leader access required'); return app.churchView('home'); }
    m.innerHTML=`<div class="sacred-loader card-enter"><div class="seed-glyph">📥</div><p class="loader-text">Opening the inbox...</p></div>`;
    const { data: reqs, error } = await sb.from('prayer_requests')
      .select('*, profiles:user_id(display_name, email)')
      .eq('church_id', mem.church_id)
      .order('status', {ascending:false}).order('created_at', {ascending:false}).limit(100);
    if(error){ m.innerHTML=`<div class="error-state"><p class="error-msg">${esc(error.message)}</p></div>`; return; }
    const open=reqs.filter(r=>['active','urgent'].includes(r.status));
    const closed=reqs.filter(r=>!['active','urgent'].includes(r.status));
    const reqCard=r=>`
      <div class="card req-card ${r.status}" style="padding:14px">
        <div><span class="req-badge ${r.status}">${r.status}</span><span class="req-badge active">${esc(r.category)}</span>${r.privacy==='church_wide'?'<span class="req-badge active">⛪ church-wide</span>':''}</div>
        <div style="font-weight:700;font-size:15px;margin-top:6px">${esc(r.title)}</div>
        ${r.body?`<div style="font-size:13.5px;color:var(--text-muted);line-height:1.6;margin-top:4px">${esc(r.body)}</div>`:''}
        <div class="req-meta">From ${esc(r.profiles?.display_name||r.profiles?.email||'member')} · ${fmtDate(r.created_at)} · 🙏 ${r.prayer_count}</div>
        ${r.answered_note?`<div style="font-size:13px;color:var(--accent);margin-top:6px">✅ ${esc(r.answered_note)}</div>`:''}
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          <button class="btn btn-ghost" style="font-size:12px;padding:6px 12px;width:auto" onclick="app.prayFor('${r.id}')">🙏 Praying</button>
          ${['active','urgent'].includes(r.status)?`
            <button class="btn btn-ghost" style="font-size:12px;padding:6px 12px;width:auto" onclick="app.setRequestStatus('${r.id}','${r.status==='urgent'?'active':'urgent'}')">${r.status==='urgent'?'Clear urgent':'Mark urgent'}</button>
            <button class="btn btn-primary" style="font-size:12px;padding:6px 12px;width:auto" onclick="app.answerRequest('${r.id}')">✅ Mark answered</button>`:''}
        </div>
      </div>`;
    m.innerHTML=`
      <div class="page">
        <div class="week-detail-header card-enter">
          <button class="btn-nav-round" onclick="app.churchView('dashboard')">◀</button>
          <div class="week-detail-info">
            <div class="week-detail-eyebrow">${esc(mem.churches.name)}</div>
            <div class="week-detail-theme">Requests Inbox</div>
            <div class="week-detail-progress">${open.length} open · ${closed.length} resolved</div>
          </div>
        </div>
        ${open.length?open.map(reqCard).join(''):'<div class="empty-mini card-enter">No open requests. The flock is at peace. 🌿</div>'}
        ${closed.length?`<div class="section-label">Resolved</div>${closed.slice(0,10).map(reqCard).join('')}`:''}
        <div style="height:20px"></div>
      </div>`;
  }

  // ── Messaging ──
  async function messageLeaders(){
    if(!requireAuth('Sign in to message your church leaders.')) return;
    const mem=myMembership(); if(!mem) return toast('Join a church first');
    toast('Opening conversation...');
    const { data: convId, error } = await sb.rpc('get_or_create_pastoral_conversation', {p_church_id: mem.church_id});
    if(error) return toast('⚠️ '+error.message);
    location.hash=`church?v=chat&c=${convId}`;
    showPage();
  }

  async function leaderConversations(){
    const mem=myMembership();
    if(!mem || !isLeader(mem)) return toast('Leader access required');
    const m=$('#main');
    m.innerHTML=`<div class="sacred-loader card-enter"><div class="seed-glyph">💬</div><p class="loader-text">Gathering conversations...</p></div>`;
    const { data: convs, error } = await sb.from('conversations').select('*')
      .eq('church_id', mem.church_id).eq('type','pastoral')
      .order('last_message_at', {ascending:false, nullsFirst:false}).limit(50);
    if(error){ m.innerHTML=`<div class="error-state"><p class="error-msg">${esc(error.message)}</p></div>`; return; }
    m.innerHTML=`
      <div class="page">
        <div class="week-detail-header card-enter">
          <button class="btn-nav-round" onclick="app.churchView('dashboard')">◀</button>
          <div class="week-detail-info"><div class="week-detail-theme">Pastoral Conversations</div>
          <div class="week-detail-progress">${convs.length} threads</div></div>
        </div>
        <div class="card card-enter">
          ${convs.length?convs.map(c=>`
            <div class="conv-row" onclick="app.openChat('${c.id}')">
              <div><div class="cr-title">${esc(c.title||'Conversation')}</div>
              <div class="cr-sub">${c.last_message_at?'Last message '+fmtDateTime(c.last_message_at):'No messages yet'}</div></div>
              <div>→</div>
            </div>`).join(''):'<div class="empty-mini">No member conversations yet.</div>'}
        </div>
      </div>`;
  }

  async function renderChat(convId){
    const m=$('#main');
    if(!convId || !state.user){ return app.churchView('home'); }
    // make sure I'm a participant (leaders join on first open)
    await sb.from('conversation_participants').upsert({conversation_id: convId, user_id: state.user.id}, {onConflict:'conversation_id,user_id', ignoreDuplicates:true});
    const { data: conv } = await sb.from('conversations').select('*').eq('id', convId).maybeSingle();
    if(!conv){ toast('Conversation not found'); return app.churchView('home'); }
    m.innerHTML=`
      <div class="page">
        <div class="week-detail-header card-enter">
          <button class="btn-nav-round" onclick="app.churchView('home')">◀</button>
          <div class="week-detail-info">
            <div class="week-detail-theme">${esc(conv.title||'Conversation')}</div>
            <div class="week-detail-progress">Private · you and the church leaders</div>
          </div>
        </div>
        <div class="chat-wrap">
          <div class="chat-scroll" id="chat-scroll"><div class="empty-mini">Loading...</div></div>
          <div class="chat-input-row">
            <input id="chat-input" placeholder="Write a message..." onkeydown="if(event.key==='Enter')app.sendMessage('${convId}')">
            <button class="btn btn-primary" style="width:auto;padding:0 18px" onclick="app.sendMessage('${convId}')">➤</button>
          </div>
        </div>
      </div>`;
    const load=async()=>{
      const { data: msgs } = await sb.from('messages')
        .select('*, profiles:sender_id(display_name)').eq('conversation_id', convId)
        .order('created_at').limit(200);
      const sc=$('#chat-scroll'); if(!sc) return;
      const nearBottom = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 80;
      sc.innerHTML=(msgs||[]).length?(msgs).map(msg=>`
        <div class="chat-bubble ${msg.sender_id===state.user.id?'mine':'theirs'}">
          ${msg.sender_id!==state.user.id?`<div class="cb-sender">${esc(msg.profiles?.display_name||'Leader')}</div>`:''}
          <div>${esc(msg.content)}</div>
          <div class="cb-time">${fmtDateTime(msg.created_at)}</div>
        </div>`).join(''):'<div class="empty-mini">No messages yet. Say hello — your leaders will see it.</div>';
      if(nearBottom || !sc.dataset.scrolled) { sc.scrollTop=sc.scrollHeight; sc.dataset.scrolled='1'; }
    };
    await load();
    state.chatPoll=setInterval(load, 12000);
  }

  // ── Leader composers ──
  function composeAnnouncement(){
    const mem=myMembership(); if(!mem||!isLeader(mem)) return toast('Leader access required');
    closeSheets();
    document.body.insertAdjacentHTML('beforeend',`
      <div class="auth-overlay" id="auth-overlay" onclick="if(event.target===this)this.remove()">
        <div class="auth-sheet">
          <h3>📢 Announcement</h3>
          <div class="as-sub">Visible to all members of ${esc(mem.churches.name)}.</div>
          <input class="auth-input" id="an-title" placeholder="Title">
          <textarea class="auth-input" id="an-body" rows="4" placeholder="What does the church need to know?"></textarea>
          <div class="chip-row"><button class="f-chip" id="an-pin">📌 Pin to top</button></div>
          <button class="btn btn-primary" id="an-send">Publish</button>
        </div>
      </div>`);
    $('#an-pin').onclick=e=>e.target.classList.toggle('active');
    $('#an-send').onclick=async()=>{
      const title=$('#an-title').value.trim(), body=$('#an-body').value.trim();
      if(!title||!body) return toast('Title and body required');
      const { error }=await sb.from('announcements').insert({church_id:mem.church_id,title,body,pinned:$('#an-pin').classList.contains('active'),created_by:state.user.id});
      if(error) return toast('⚠️ '+error.message);
      $('#auth-overlay').remove(); toast('📢 Published.'); app.churchView('home');
    };
  }

  function composeEvent(){
    const mem=myMembership(); if(!mem||!isLeader(mem)) return toast('Leader access required');
    closeSheets();
    document.body.insertAdjacentHTML('beforeend',`
      <div class="auth-overlay" id="auth-overlay" onclick="if(event.target===this)this.remove()">
        <div class="auth-sheet">
          <h3>📅 New Community Event</h3>
          <div class="as-sub">For ${esc(mem.churches.name)}.</div>
          <input class="auth-input" id="ev-title" placeholder="Event title">
          <textarea class="auth-input" id="ev-desc" rows="3" placeholder="Description"></textarea>
          <input class="auth-input" id="ev-when" type="datetime-local">
          <input class="auth-input" id="ev-loc" placeholder="Location (e.g., Fellowship Hall)">
          <input class="auth-input" id="ev-fund" placeholder="Fundraising link (optional — Stripe/GoFundMe/etc.)">
          <input class="auth-input" id="ev-fund-label" placeholder="Fundraiser label (e.g., 'Youth Mission Trip Fund')">
          <input class="auth-input" id="ev-roles" placeholder="Serving roles, comma-separated (e.g., Setup, Greeting, Kitchen)">
          <div class="chip-row">
            <button class="f-chip active" id="ev-pub">🌍 Public</button>
            <button class="f-chip" id="ev-mem">🔒 Members only</button>
          </div>
          <button class="btn btn-primary" id="ev-send">Create Event</button>
        </div>
      </div>`);
    const a=$('#ev-pub'),b=$('#ev-mem');
    a.onclick=()=>{a.classList.add('active');b.classList.remove('active');};
    b.onclick=()=>{b.classList.add('active');a.classList.remove('active');};
    $('#ev-send').onclick=async()=>{
      const title=$('#ev-title').value.trim(), when=$('#ev-when').value;
      if(!title||!when) return toast('Title and date required');
      let fund=$('#ev-fund').value.trim()||null;
      if(fund && !/^https?:\/\//.test(fund)) fund='https://'+fund;
      const { error }=await sb.from('events').insert({
        church_id:mem.church_id, title, description:$('#ev-desc').value.trim()||null,
        start_time:new Date(when).toISOString(), location_name:$('#ev-loc').value.trim()||null,
        fundraising_url: fund, fundraising_label: $('#ev-fund-label').value.trim()||null,
        volunteer_roles: $('#ev-roles').value.split(',').map(s=>s.trim()).filter(Boolean),
        visibility: b.classList.contains('active')?'members_only':'public', created_by: state.user.id});
      if(error) return toast('⚠️ '+error.message);
      $('#auth-overlay').remove(); toast('📅 Event created.'); app.churchView('home');
    };
  }

  // ── Leader: edit church profile, website & location ──
  function editChurchProfile(){
    const mem=myMembership(); if(!mem||!isLeader(mem)) return toast('Leader access required');
    const ch=mem.churches;
    closeSheets();
    const times = Array.isArray(ch.service_times) ? ch.service_times.map(fmtServiceTime).join('\n') : '';
    document.body.insertAdjacentHTML('beforeend',`
      <div class="auth-overlay" id="auth-overlay" onclick="if(event.target===this)this.remove()">
        <div class="auth-sheet">
          <h3>✏️ ${esc(ch.name)}</h3>
          <div class="as-sub">Your public profile — what seekers see in the directory, the Community Hub, and your public page.</div>
          <input class="auth-input" id="ec-website" placeholder="Website (https://...)" value="${esc(ch.website||'')}">
          <input class="auth-input" id="ec-giving" placeholder="Online giving link (Stripe, Tithe.ly, Givelify, PayPal...)" value="${esc(ch.giving_url||'')}">
          <input class="auth-input" id="ec-giving-note" placeholder="Giving note (e.g., 'Tithes & offerings — Malachi 3:10')" value="${esc(ch.giving_note||'')}">
          <input class="auth-input" id="ec-sermons" placeholder="Sermons/media link (YouTube channel, podcast...)" value="${esc(ch.sermons_url||'')}">
          <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin:2px 0 6px">Connect your platforms (shown on your public page)</div>
          <div style="display:flex;gap:8px">
            <input class="auth-input" id="ec-yt" placeholder="YouTube" value="${esc(ch.social_links?.youtube||'')}" style="flex:1">
            <input class="auth-input" id="ec-fb" placeholder="Facebook" value="${esc(ch.social_links?.facebook||'')}" style="flex:1">
          </div>
          <div style="display:flex;gap:8px">
            <input class="auth-input" id="ec-ig" placeholder="Instagram" value="${esc(ch.social_links?.instagram||'')}" style="flex:1">
            <input class="auth-input" id="ec-pod" placeholder="Podcast" value="${esc(ch.social_links?.podcast||'')}" style="flex:1">
          </div>
          <input class="auth-input" id="ec-address" placeholder="Street address" value="${esc(ch.address||'')}">
          <div style="display:flex;gap:8px">
            <input class="auth-input" id="ec-city" placeholder="City" value="${esc(ch.city||'')}" style="flex:2">
            <input class="auth-input" id="ec-state" placeholder="State" value="${esc(ch.state||'')}" style="flex:1">
          </div>
          <input class="auth-input" id="ec-pastor" placeholder="Pastor's name" value="${esc(ch.pastor_name||'')}">
          <textarea class="auth-input" id="ec-desc" rows="2" placeholder="A sentence about your church">${esc(ch.description||'')}</textarea>
          <textarea class="auth-input" id="ec-times" rows="2" placeholder="Service times — one per line (e.g., Sunday 10:00 AM)">${esc(times)}</textarea>
          <div style="background:var(--surface-2);border-radius:12px;padding:12px;margin-bottom:10px">
            <div style="font-size:13px;font-weight:700;margin-bottom:6px">📍 Map location <span id="ec-coords" style="font-weight:400;color:var(--text-muted)">${hasCoords(ch)?`(${ch.lat.toFixed(4)}, ${ch.lng.toFixed(4)}) ✓`:'(not set — needed for "near me" search)'}</span></div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost" style="flex:1;font-size:12px;padding:8px" onclick="app.pinLocationHere()">Use my location</button>
              <button class="btn btn-ghost" style="flex:1;font-size:12px;padding:8px" onclick="app.pinLocationFromAddress()">Locate from address</button>
            </div>
          </div>
          <button class="btn btn-primary" id="ec-save">Save Profile</button>
        </div>
      </div>`);
    let pin = hasCoords(ch) ? {lat:ch.lat, lng:ch.lng} : null;
    window.__setPin = p => { pin=p; const el=$('#ec-coords'); if(el) el.textContent=`(${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}) ✓`; };
    $('#ec-save').onclick=async()=>{
      const upd={
        website: $('#ec-website').value.trim()||null,
        giving_url: $('#ec-giving').value.trim()||null,
        giving_note: $('#ec-giving-note').value.trim()||null,
        sermons_url: $('#ec-sermons').value.trim()||null,
        address: $('#ec-address').value.trim()||null,
        city: $('#ec-city').value.trim()||ch.city,
        state: $('#ec-state').value.trim()||null,
        pastor_name: $('#ec-pastor').value.trim()||null,
        description: $('#ec-desc').value.trim()||null,
        service_times: $('#ec-times').value.split('\n').map(s=>s.trim()).filter(Boolean),
        updated_at: new Date().toISOString()
      };
      ['website','giving_url','sermons_url'].forEach(k=>{
        if(upd[k] && !/^https?:\/\//.test(upd[k])) upd[k]='https://'+upd[k];
      });
      const socials={};
      [['youtube','#ec-yt'],['facebook','#ec-fb'],['instagram','#ec-ig'],['podcast','#ec-pod']].forEach(([k,sel])=>{
        let v=$(sel)?.value?.trim();
        if(v){ if(!/^https?:\/\//.test(v)) v='https://'+v; socials[k]=v; }
      });
      upd.social_links=socials;
      if(pin){ upd.lat=pin.lat; upd.lng=pin.lng; }
      const { error }=await sb.from('churches').update(upd).eq('id', ch.id);
      if(error) return toast('⚠️ '+error.message);
      Object.assign(ch, upd);
      $('#auth-overlay')?.remove();
      toast('⛪ Church profile updated.');
      app.churchView('home');
    };
  }

  async function geocodeAddress(q){
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q), {headers:{'Accept':'application/json'}});
    if(!r.ok) throw new Error('Geocoding service unavailable');
    const hits = await r.json();
    if(!hits.length) throw new Error('Address not found — try adding city and state');
    return {lat:parseFloat(hits[0].lat), lng:parseFloat(hits[0].lon)};
  }

  // ── Church plan campaign composer ──
  function startCampaignForm(){
    const mem=myMembership(); if(!mem||!isLeader(mem)) return toast('Leader access required');
    const plans=state.plans?.plans||[];
    if(!plans.length) return toast('Plans still loading — try again in a moment');
    closeSheets();
    document.body.insertAdjacentHTML('beforeend',`
      <div class="auth-overlay" id="auth-overlay" onclick="if(event.target===this)this.remove()">
        <div class="auth-sheet">
          <h3>📖 Reading Together</h3>
          <div class="as-sub">Choose a guided plan for all of ${esc(mem.churches.name)} to walk through together.</div>
          <select class="auth-input" id="camp-plan">
            ${plans.map(p=>`<option value="${p.id}">[${p.pillar}] ${esc(p.title)}</option>`).join('')}
          </select>
          <textarea class="auth-input" id="camp-note" rows="2" placeholder="A word to the church (e.g., 'We start Monday — bring your questions to home group')"></textarea>
          <button class="btn btn-primary" id="camp-send">Launch Campaign</button>
        </div>
      </div>`);
    $('#camp-send').onclick=async()=>{
      const { error }=await sb.from('church_plan_campaigns').insert({
        church_id:mem.church_id, plan_id:$('#camp-plan').value,
        note:$('#camp-note').value.trim()||null, created_by:state.user.id});
      if(error) return toast('⚠️ '+error.message);
      $('#auth-overlay').remove();
      toast('📖 Campaign launched — the whole church sees it now.');
      app.churchView('home');
    };
  }

  // ── Event check-in QR (leaders show; members scan) ──
  function checkinQR(eventId, title){
    closeSheets();
    const url = location.origin + location.pathname + '?checkin=' + encodeURIComponent(eventId);
    document.body.insertAdjacentHTML('beforeend',`
      <div class="auth-overlay" id="auth-overlay" onclick="if(event.target===this)this.remove()">
        <div class="auth-sheet" style="text-align:center">
          <h3>📲 Check-in — ${esc(title)}</h3>
          <div class="as-sub">Members scan this at the door. Each scan records attendance once.</div>
          <div style="display:flex;justify-content:center;padding:14px;background:var(--surface-2);border-radius:12px;margin:10px 0">${QR.create(url,{size:220,color:'#1a3c1a',bg:'#f5f0e8'})}</div>
          <button class="btn btn-primary" onclick="app.copyText('${esc(url)}')">📋 Copy check-in link</button>
        </div>
      </div>`);
  }

  async function handleCheckinFromURL(eventId){
    if(!state.user){ openAuthSheet('Sign in to check in to this event.'); return; }
    const { error } = await sb.from('event_checkins').insert({event_id:eventId, user_id:state.user.id});
    if(error){
      if(error.code==='23505') toast('✅ Already checked in — you\'re counted.');
      else toast('⚠️ '+error.message);
    } else {
      toast('✅ Checked in. Glad you\'re here!');
    }
    location.hash='church'; showPage();
  }

  function registerChurchForm(){
    if(!requireAuth('Sign in to register your church.')) return;
    closeSheets();
    document.body.insertAdjacentHTML('beforeend',`
      <div class="auth-overlay" id="auth-overlay" onclick="if(event.target===this)this.remove()">
        <div class="auth-sheet">
          <h3>⛪ Register your church</h3>
          <div class="as-sub">You become its first admin — you can post events, announcements, and receive member requests immediately.</div>
          <input class="auth-input" id="rc-name" placeholder="Church name *">
          <input class="auth-input" id="rc-city" placeholder="City *">
          <input class="auth-input" id="rc-state" placeholder="State / region">
          <input class="auth-input" id="rc-denom" placeholder="Denomination">
          <input class="auth-input" id="rc-pastor" placeholder="Pastor's name">
          <input class="auth-input" id="rc-website" placeholder="Website (https://...)">
          <input class="auth-input" id="rc-address" placeholder="Street address (for the map & 'near me')">
          <textarea class="auth-input" id="rc-desc" rows="3" placeholder="A sentence about your church"></textarea>
          <button class="btn btn-primary" id="rc-send">Create Church</button>
        </div>
      </div>`);
    $('#rc-send').onclick=async()=>{
      const name=$('#rc-name').value.trim(), city=$('#rc-city').value.trim();
      if(!name||!city) return toast('Name and city required');
      const { data, error }=await sb.rpc('create_church',{
        p_name:name, p_city:city, p_state:$('#rc-state').value.trim()||null,
        p_denomination:$('#rc-denom').value.trim()||null, p_pastor_name:$('#rc-pastor').value.trim()||null,
        p_description:$('#rc-desc').value.trim()||null});
      if(error) return toast('⚠️ '+error.message);
      // Enrich with website/address/coords (created churches: creator is admin, update allowed)
      let website=$('#rc-website').value.trim()||null;
      if(website && !/^https?:\/\//.test(website)) website='https://'+website;
      const address=$('#rc-address').value.trim()||null;
      const upd={};
      if(website) upd.website=website;
      if(address) upd.address=address;
      try {
        const q=[address, city, $('#rc-state').value.trim()].filter(Boolean).join(', ');
        if(q){ const pin=await geocodeAddress(q); upd.lat=pin.lat; upd.lng=pin.lng; }
      } catch(e){ /* geocode optional */ }
      if(Object.keys(upd).length) await sb.from('churches').update(upd).eq('id', data);
      $('#auth-overlay').remove();
      await loadMemberships();
      state.activeChurchId=data;
      toast('⛪ Church created — you are the admin!');
      app.churchView('home');
    };
  }

  async function checkJoinFromURL(){
    const params=new URLSearchParams(location.search);
    // ?checkin=<eventId> — event attendance QR
    const checkinId=params.get('checkin');
    if(checkinId && sb){
      history.replaceState({}, '', location.pathname);
      return handleCheckinFromURL(checkinId);
    }
    // ?church=<slug> — deep link to a public church page (from church websites, QR, embeds)
    const pageSlug=params.get('church');
    if(pageSlug){
      history.replaceState({}, '', location.pathname);
      location.hash=`church?v=page&c=${encodeURIComponent(pageSlug)}`;
      showPage();
      return;
    }
    const slug=params.get('join');
    if(!slug) return;
    history.replaceState({}, '', location.pathname + location.hash);
    if(!sb) return;
    const { data: ch } = await sb.from('churches').select('id,name,slug').or(`slug.eq.${slug},id.eq.${slug}`).maybeSingle();
    if(!ch) return toast('Church not found for this invite.');
    if(!state.user){ openAuthSheet(`Sign in to join ${ch.name}.`); return; }
    app.joinChurch(ch.id, ch.name);
  }

  // ════════════════════════════════════════════
  // PAGE: ME (PROFILE / MEMBERS AREA)
  // ════════════════════════════════════════════
  async function renderProfile(){
    const m=$('#main');
    const done=doneCount();
    const pct=Math.min(100,Math.round((done/TOTAL_DAYS)*100));
    const enrolledPlans=Object.keys(state.planEnroll);
    let requestsHTML='', convsHTML='';
    if(state.user && sb){
      const [{data:reqs},{data:convs}] = await Promise.all([
        sb.from('prayer_requests').select('*').eq('user_id',state.user.id).order('created_at',{ascending:false}).limit(20),
        sb.from('conversations').select('*').eq('created_by',state.user.id).order('last_message_at',{ascending:false,nullsFirst:false}).limit(10)
      ]);
      requestsHTML=(reqs||[]).length?(reqs).map(r=>`
        <div class="card req-card ${r.status}" style="padding:12px">
          <div><span class="req-badge ${r.status}">${r.status}</span><span class="req-badge active">${esc(r.category)}</span></div>
          <div style="font-weight:700;font-size:14px;margin-top:5px">${esc(r.title)}</div>
          <div class="req-meta">${fmtDate(r.created_at)} · 🙏 ${r.prayer_count} praying</div>
          ${r.answered_note?`<div style="font-size:12.5px;color:var(--accent);margin-top:4px">✅ ${esc(r.answered_note)}</div>`:''}
        </div>`).join(''):'<div class="empty-mini">No requests yet.</div>';
      convsHTML=(convs||[]).length?(convs).map(c=>`
        <div class="conv-row" onclick="app.openChat('${c.id}')">
          <div><div class="cr-title">${esc(c.title||'Conversation')}</div>
          <div class="cr-sub">${c.last_message_at?fmtDateTime(c.last_message_at):'No messages yet'}</div></div><div>→</div>
        </div>`).join(''):'<div class="empty-mini">No conversations yet.</div>';
    }

    m.innerHTML=`
      <div class="page card-enter">
        <div class="profile-hero">
          <div class="avatar-ring"><div class="avatar-inner">👤</div></div>
          <div class="profile-name">${esc(state.profile?.display_name || (state.user?state.user.email.split('@')[0]:'Guest Disciple'))}</div>
          <div class="profile-meta">${plantStage(Math.min(100,Math.round((done/365)*100))).name} · ${done} days · ${pct}% of journey</div>
          ${!state.user?`<button class="btn btn-primary" style="margin-top:12px" onclick="app.openAuth()">Sign in / Create account</button>
            <div style="font-size:12px;color:var(--text-dim);margin-top:8px">Guest mode works fully — sign in to sync across devices and join your church.</div>`:''}
        </div>

        ${state.user?`
        <div class="card">
          <div class="card-header"><span class="icon">🔔</span> Daily Reminder</div>
          <div style="font-size:13px;color:var(--text-muted);line-height:1.6;margin-bottom:10px">Get a morning nudge when your daily lesson is ready — the streak's best friend.</div>
          <button class="btn btn-primary" id="push-toggle" onclick="app.togglePush()">Checking...</button>
          <div id="push-status" style="font-size:11.5px;color:var(--text-dim);margin-top:8px"></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="icon">⚙️</span> Account</div>
          <div class="setting-row"><span class="s-label">Display name</span><span class="s-val auth-link" onclick="app.editName()">${esc(state.profile?.display_name||'Set name')} ✏️</span></div>
          <div class="setting-row"><span class="s-label">Email</span><span class="s-val">${esc(state.user.email)}</span></div>
          <div class="setting-row"><span class="s-label">Gender track</span><span class="s-val">${state.gender==='men'?'Man':'Woman'} (toggle in header)</span></div>
          <div class="setting-row"><span class="s-label">Churches</span><span class="s-val">${state.memberships.map(mm=>esc(mm.churches.name)+(isLeader(mm)?' 👑':'')).join(', ')||'None yet'}</span></div>
          <button class="btn btn-ghost" style="margin-top:10px" onclick="app.signOut()">Sign out</button>
          <div style="border-top:1px solid var(--surface-2);margin-top:14px;padding-top:12px">
            <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px">Your data, your rights</div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost" style="flex:1;font-size:12.5px" onclick="app.exportMyData()">📦 Export my data</button>
              <button class="btn btn-ghost" style="flex:1;font-size:12.5px;color:#e07370;border-color:#e0737055" onclick="app.deleteMyAccount()">🗑️ Delete account</button>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="icon">🙏</span> My Requests</div>
          ${requestsHTML}
          <button class="btn btn-ghost" onclick="app.newRequestForm()">+ New request</button>
        </div>
        <div class="card">
          <div class="card-header"><span class="icon">💬</span> My Conversations</div>
          ${convsHTML}
        </div>`:''}

        <div class="card">
          <div class="card-header"><span class="icon">🗺️</span> My Plans</div>
          ${enrolledPlans.length?enrolledPlans.map(pid=>{
            const pl=state.plans?.plans?.find(x=>x.id===pid);
            if(!pl) return '';
            const c=Object.keys(state.planProg[pid]||{}).length;
            return `<div class="conv-row" onclick="app.openPlan('${pid}')">
              <div><div class="cr-title">${esc(pl.title)}</div><div class="cr-sub">${c}/${pl.duration} days</div></div><div>→</div></div>`;
          }).join(''):'<div class="empty-mini">No plans started yet. <span class="auth-link" onclick="location.hash=\'plans\';app.showPage(\'plans\')">Browse plans →</span></div>'}
        </div>

        <div class="card">
          <div class="card-header"><span class="icon">🌟</span> The Promise</div>
          <div style="font-style:italic;font-size:13.5px;line-height:1.6;color:var(--text-muted)">${PROMISE.verse}<div style="color:var(--accent);font-style:normal;font-size:12px;margin-top:4px">${PROMISE.ref}</div></div>
          <button class="btn btn-ghost" style="margin-top:10px" onclick="location.hash='why';app.showPage('why')">Why doing the lessons changes your life →</button>
        </div>
        <div style="height:20px"></div>
      </div>`;
    refreshPushUI();
  }

  // ════════════════════════════════════════════
  // WEB PUSH — daily devotional nudge
  // ════════════════════════════════════════════
  const VAPID_PUBLIC = 'BA3lk2Tp2VelH8TBIYzQKEmcvBRzbR2hbfHqqTjZIcD5i92FkXYWyFQpaEFH0hNO2SSJuQOBiYiOr-l-nhx7REo';
  function vapidKeyBytes(){
    const pad='='.repeat((4 - VAPID_PUBLIC.length % 4) % 4);
    const raw=atob((VAPID_PUBLIC+pad).replace(/-/g,'+').replace(/_/g,'/'));
    return Uint8Array.from(raw, c=>c.charCodeAt(0));
  }
  async function pushSubscription(){
    if(!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  }
  async function refreshPushUI(){
    const btn=$('#push-toggle'), st=$('#push-status');
    if(!btn) return;
    if(!('PushManager' in window)){ btn.textContent='Not supported on this browser'; btn.disabled=true; return; }
    const sub = await pushSubscription();
    btn.textContent = sub ? '🔕 Turn off daily reminder' : '🔔 Turn on daily reminder';
    if(st) st.textContent = sub ? 'Reminders on — one gentle nudge each morning.' : (Notification.permission==='denied'?'Notifications are blocked in your browser settings.':'');
  }

  // ════════════════════════════════════════════
  // MILESTONES
  // ════════════════════════════════════════════
  function maybeCelebrate(){
    const done=doneCount();
    const ms=MILESTONES[done];
    if(!ms || state.celebrated[done]) return;
    state.celebrated[done]=Date.now();
    lsSet('flourish-milestones', state.celebrated);
    document.body.insertAdjacentHTML('beforeend',`
      <div class="milestone-overlay" id="milestone-overlay" onclick="if(event.target===this)this.remove()">
        <div class="milestone-card card-enter">
          <div class="m-icon">${ms.icon}</div>
          <div class="m-title">${ms.title}</div>
          <div class="m-verse">${ms.verse}</div>
          <div class="m-ref">${ms.ref}</div>
          <div class="m-body">${ms.body}</div>
          <button class="btn btn-primary" onclick="document.getElementById('milestone-overlay').remove()">Amen — keep building</button>
        </div>
      </div>`);
  }

  // ════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════
  window.app = {
    showPage,
    reload(){ location.reload(); },
    openAuth(){ openAuthSheet(); },
    async signOut(){ await sb?.auth.signOut(); state.user=null; state.profile=null; state.memberships=[]; updateAuthChip(); toast('Signed out.'); showPage(); },

    gotoDay(n){ state.currentDay=Math.max(1,Math.min(TOTAL_DAYS,n)); location.hash='devotional'; showPage('devotional'); },
    gotoYear(y){ const base=(y-1)*365+1; const t=todayIndex(); state.currentDay = yearOf(t)===y ? t : base; location.hash='devotional'; showPage('devotional'); },
    jumpToDay(){ const v=parseInt($('#day-jump-input')?.value); if(v>=1&&v<=TOTAL_DAYS) app.gotoDay(v); else toast(`Enter a day 1–${TOTAL_DAYS}`); },
    setPillarYear(y){ pillarYear=y; location.hash='pillars'; showPage('pillars'); },
    showPillar(p){ location.hash=`pillars?p=${encodeURIComponent(p)}`; showPage(); },
    showWeek(p,w){ location.hash=`pillars?p=${encodeURIComponent(p)}&w=${w}`; showPage(); },

    async toggleComplete(day){
      const was=!!state.progress[day];
      if(was){ delete state.progress[day]; } else { state.progress[day]=Date.now(); }
      saveProgress();
      renderDevotional();
      if(!was){
        toast(AFFIRMATIONS[doneCount()%AFFIRMATIONS.length]);
        maybeCelebrate();
        if(sb&&state.user) sb.from('user_progress').upsert({user_id:state.user.id,day_number:day},{onConflict:'user_id,day_number',ignoreDuplicates:true}).then(()=>{});
      } else {
        toast('Seed removed.');
        if(sb&&state.user) sb.from('user_progress').delete().eq('user_id',state.user.id).eq('day_number',day).then(()=>{});
      }
    },
    async shareDay(day){
      const d=await getDay(day); if(!d) return;
      const txt=`Flourish Day ${day}: ${d.scripture?.reference} — "${(d.scripture?.text||'').split(' ').slice(0,10).join(' ')}..." Building life on wisdom and biblical principles.`;
      navigator.share?.({title:`Flourish Day ${day}`,text:txt})||app.copyText(txt);
    },
    resetProgress(){
      if(!confirm('Reset your entire journey? This cannot be undone.'))return;
      state.progress={}; saveProgress();
      state.celebrated={}; lsSet('flourish-milestones',{});
      if(sb&&state.user) sb.from('user_progress').delete().eq('user_id',state.user.id).then(()=>{});
      toast('🌑 Garden cleared.'); renderProgress();
    },
    copyText(t){ navigator.clipboard?.writeText(t).then(()=>toast('📋 Copied')).catch(()=>toast('Copy failed')); },

    // plans
    openPlan(id){ location.hash=`plans?id=${id}`; showPage('plans'); },
    openLesson(id, day){ location.hash=`plans?id=${id}&d=${day}`; showPage('plans'); },
    enrollPlan(id){
      state.planEnroll[id]=Date.now(); lsSet('flourish-plan-enrollments', state.planEnroll);
      if(sb&&state.user) sb.from('plan_enrollments').upsert({user_id:state.user.id,plan_id:id},{onConflict:'user_id,plan_id',ignoreDuplicates:true}).then(()=>{});
      toast('🗺️ Plan begun. Day 1 awaits.');
      renderPlans();
    },
    togglePlanDay(id,idx){
      state.planProg[id] ||= {};
      const was=!!state.planProg[id][idx];
      if(was){ delete state.planProg[id][idx]; }
      else {
        state.planProg[id][idx]=Date.now();
        if(!state.planEnroll[id]){ state.planEnroll[id]=Date.now(); lsSet('flourish-plan-enrollments',state.planEnroll);
          if(sb&&state.user) sb.from('plan_enrollments').upsert({user_id:state.user.id,plan_id:id},{onConflict:'user_id,plan_id',ignoreDuplicates:true}).then(()=>{});
        }
      }
      lsSet('flourish-plan-progress', state.planProg);
      if(sb&&state.user){
        if(was) sb.from('plan_progress').delete().eq('user_id',state.user.id).eq('plan_id',id).eq('day_index',idx).then(()=>{});
        else sb.from('plan_progress').upsert({user_id:state.user.id,plan_id:id,day_index:idx},{onConflict:'user_id,plan_id,day_index',ignoreDuplicates:true}).then(()=>{});
      }
      const pl=state.plans?.plans?.find(x=>x.id===id);
      if(!was && pl && Object.keys(state.planProg[id]).length===pl.duration){
        toast('🎉 Plan complete! "'+pl.title+'" — well done, good and faithful servant.');
        if(sb&&state.user) sb.from('plan_enrollments').update({finished_at:new Date().toISOString()}).eq('user_id',state.user.id).eq('plan_id',id).then(()=>{});
      } else if(!was){ toast('🌿 Done. Wisdom applied is wisdom owned.'); }
      renderPlanDetail(pl);
    },

    // church
    churchView(v){ location.hash = v==='home' ? 'church' : `church?v=${v}`; showPage(); },
    switchChurch(id){ state.activeChurchId=id; },
    async joinChurch(id,name){
      if(!requireAuth(`Sign in to join ${name||'this church'}.`)) return;
      const { error }=await sb.from('church_memberships').insert({user_id:state.user.id,church_id:id,role:'member',is_primary:state.memberships.length===0});
      if(error){ if(error.code==='23505') toast('Already a member.'); else toast('⚠️ '+error.message); return; }
      await loadMemberships();
      state.activeChurchId=id;
      toast(`⛪ Welcome to ${name||'the church'}! You are part of the flock.`);
      app.churchView('home');
    },
    async leaveChurch(memId,name){
      if(!confirm(`Leave ${name}?`)) return;
      await sb.from('church_memberships').delete().eq('id',memId);
      await loadMemberships();
      state.activeChurchId=state.memberships[0]?.church_id||null;
      toast(`Left ${name}.`); app.churchView('home');
    },
    filterChurches(q){
      const term=q.toLowerCase();
      $$('#church-list .church-card').forEach(c=>{ c.style.display=(c.dataset.search||'').includes(term)?'':'none'; });
    },
    async claimChurch(id,name){
      if(!confirm(`Claim leadership of ${name}? This only succeeds if the church has no admin yet.`)) return;
      const { data, error }=await sb.rpc('claim_church',{p_church_id:id});
      if(error) return toast('⚠️ '+error.message);
      if(data){ await loadMemberships(); toast('👑 You are now the church admin.'); app.churchView('home'); }
      else toast('This church already has leadership. Ask them to promote you.');
    },
    registerChurchForm, newRequestForm, messageLeaders, leaderConversations,
    composeAnnouncement, composeEvent, editChurchProfile,

    // geolocation + community hub + integration
    async findNearMe(view){
      toast('📍 Finding you...');
      try { await getGeo(); toast('📍 Location found — sorting by distance.'); }
      catch(e){ toast('⚠️ '+e.message); return; }
      app.churchView(view==='community'?'community':'directory');
    },
    openChurchPage(slug){ location.hash=`church?v=page&c=${encodeURIComponent(slug)}`; showPage(); },
    addToCal(id){
      const ev=evCache[id]; if(!ev) return toast('Event not found');
      icsDownload(ev, ev.churches?.name);
      toast('🗓️ Calendar file downloaded.');
    },
    async rsvpCommunity(id){
      if(!requireAuth('Sign in to RSVP to community events.')) return;
      const { error }=await sb.from('event_rsvps').upsert({event_id:id,user_id:state.user.id,status:'yes'},{onConflict:'event_id,user_id'});
      if(error) return toast('⚠️ '+error.message);
      toast('✅ See you there! The host church will know you are coming.');
    },
    async pinLocationHere(){
      try {
        const p=await getGeo();
        window.__setPin?.(p);
        toast('📍 Location pinned. Save the profile to publish it.');
      } catch(e){ toast('⚠️ '+e.message); }
    },
    async pinLocationFromAddress(){
      const q=[$('#ec-address')?.value, $('#ec-city')?.value, $('#ec-state')?.value].map(v=>(v||'').trim()).filter(Boolean).join(', ');
      if(!q) return toast('Fill in the address and city first');
      toast('🔎 Locating address...');
      try {
        const p=await geocodeAddress(q);
        window.__setPin?.(p);
        toast('📍 Address located. Save the profile to publish it.');
      } catch(e){ toast('⚠️ '+e.message); }
    },
    // groups
    openGroup(id){ location.hash=`church?v=group&g=${id}`; showPage(); },
    createGroupForm, startCampaignForm, checkinQR,
    async archiveCampaign(id){
      if(!confirm('End this church campaign?')) return;
      const { error }=await sb.from('church_plan_campaigns').update({archived_at:new Date().toISOString()}).eq('id',id);
      if(error) return toast('⚠️ '+error.message);
      toast('Campaign ended.');
      app.churchView('home');
    },
    async joinGroup(id, name){
      if(!requireAuth(`Sign in to join ${name||'this group'}.`)) return;
      const { error }=await sb.rpc('join_group',{p_group_id:id});
      if(error) return toast('⚠️ '+error.message);
      toast(`👥 Welcome to ${name||'the group'}!`);
      app.openGroup(id);
    },
    async leaveGroup(id, name){
      if(!confirm(`Leave ${name}?`)) return;
      const { error }=await sb.rpc('leave_group',{p_group_id:id});
      if(error) return toast('⚠️ '+error.message);
      toast(`Left ${name}.`);
      app.churchView('home');
    },
    async deleteGroup(id, name){
      if(!confirm(`Delete ${name}? This removes the group for everyone.`)) return;
      const { error }=await sb.from('groups').delete().eq('id', id);
      if(error) return toast('⚠️ '+error.message);
      toast('Group deleted.');
      app.churchView('home');
    },
    async toggleServe(eventId, role){
      if(!requireAuth('Sign in to volunteer for this event.')) return;
      const { data: mine }=await sb.from('event_volunteers').select('role').eq('event_id',eventId).eq('user_id',state.user.id).eq('role',role);
      if(mine && mine.length){
        const { error }=await sb.from('event_volunteers').delete().eq('event_id',eventId).eq('user_id',state.user.id).eq('role',role);
        if(error) return toast('⚠️ '+error.message);
        toast('Removed from '+role+'.');
      } else {
        const { error }=await sb.from('event_volunteers').insert({event_id:eventId,user_id:state.user.id,role});
        if(error) return toast('⚠️ '+error.message);
        toast('🤝 You\'re serving: '+role+'. Thank you!');
      }
      app.churchView('home');
    },
    async togglePush(){
      if(!state.user) return openAuthSheet('Sign in to get your daily reminder.');
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if(existing){
          await sb.from('push_subscriptions').delete().eq('endpoint', existing.endpoint);
          await existing.unsubscribe();
          toast('🔕 Daily reminder off.');
        } else {
          const perm = await Notification.requestPermission();
          if(perm!=='granted') return toast('Notifications not allowed — check browser settings.');
          const sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey: vapidKeyBytes() });
          const j = sub.toJSON();
          const { error } = await sb.from('push_subscriptions').upsert(
            { user_id: state.user.id, endpoint: sub.endpoint, p256dh: j.keys?.p256dh||null, auth: j.keys?.auth||null },
            { onConflict: 'endpoint' });
          if(error){ await sub.unsubscribe(); return toast('⚠️ '+error.message); }
          toast('🔔 Daily reminder on. See you tomorrow morning.');
        }
      } catch(e){ toast('⚠️ '+(e.message||'Could not update reminders')); }
      refreshPushUI();
    },
    copyEmbed(churchId){
      const mm=state.memberships.find(x=>x.church_id===churchId);
      const ch=mm?.churches; if(!ch) return toast('Church not found');
      app.copyText(embedCode(ch));
      toast('📦 Embed code copied — paste it into your church website.');
    },
    openChat(id){ location.hash=`church?v=chat&c=${id}`; showPage(); },
    async sendMessage(convId){
      const inp=$('#chat-input'); const content=inp?.value?.trim();
      if(!content) return;
      inp.value='';
      const { error }=await sb.from('messages').insert({conversation_id:convId,sender_id:state.user.id,content});
      if(error){ toast('⚠️ '+error.message); inp.value=content; return; }
      const sc=$('#chat-scroll');
      if(sc){ sc.insertAdjacentHTML('beforeend',`<div class="chat-bubble mine"><div>${esc(content)}</div><div class="cb-time">now</div></div>`); sc.scrollTop=sc.scrollHeight; }
    },
    async rsvp(eventId,status){
      if(!requireAuth('Sign in to RSVP.')) return;
      const { error }=await sb.from('event_rsvps').upsert({event_id:eventId,user_id:state.user.id,status},{onConflict:'event_id,user_id'});
      if(error) return toast('⚠️ '+error.message);
      toast(status==='yes'?'✅ See you there!':status==='maybe'?'🤔 Marked maybe':'Noted.');
      app.churchView('home');
    },
    async prayFor(id){
      const { error }=await sb.rpc('increment_prayer_count',{p_prayer_id:id});
      if(error) return toast('⚠️ '+error.message);
      toast('🙏 They\'ll know you\'re praying.');
    },
    async setRequestStatus(id,status){
      const { error }=await sb.from('prayer_requests').update({status}).eq('id',id);
      if(error) return toast('⚠️ '+error.message);
      app.churchView('requests');
    },
    async answerRequest(id){
      const note=prompt('How did God answer? (shown to the member)');
      if(note===null) return;
      const { error }=await sb.from('prayer_requests').update({status:'answered',answered_at:new Date().toISOString(),answered_note:note||'Marked answered by your leaders.'}).eq('id',id);
      if(error) return toast('⚠️ '+error.message);
      toast('✅ Marked answered. Praise God.');
      app.churchView('requests');
    },
    // ── Data rights: portability + erasure ──
    async exportMyData(){
      if(!state.user) return;
      toast('📦 Gathering your data...');
      const tables=[['profiles','*'],['user_progress','*'],['plan_enrollments','*'],['plan_progress','*'],
        ['prayer_requests','*'],['church_memberships','*, churches(name)'],['group_members','*'],
        ['event_rsvps','*'],['event_volunteers','*'],['event_checkins','*'],['push_subscriptions','id,endpoint,created_at']];
      const out={ exported_at:new Date().toISOString(), user:{id:state.user.id, email:state.user.email},
        local:{ progress:state.progress, plan_progress:state.planProg, plan_enrollments:state.planEnroll } };
      for(const [t,sel] of tables){
        try {
          let q=sb.from(t).select(sel);
          q = (t==='profiles') ? q.eq('id', state.user.id) : q.eq('user_id', state.user.id);
          const { data }=await q;
          out[t]=data||[];
        } catch(e){ out[t]='unavailable'; }
      }
      const a=document.createElement('a');
      a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(out,null,1));
      a.download='flourish-my-data-'+new Date().toISOString().slice(0,10)+'.json';
      document.body.appendChild(a); a.click(); a.remove();
      toast('📦 Downloaded. That is everything Flourish stores about you.');
    },
    async deleteMyAccount(){
      if(!state.user) return;
      if(!confirm('Delete your Flourish account?\n\nThis permanently erases your profile, progress, prayer requests, memberships, and subscriptions on our servers. This cannot be undone.')) return;
      const typed=prompt('Type DELETE to confirm permanent erasure:');
      if(typed!=='DELETE') return toast('Deletion cancelled.');
      try {
        const { data:{ session } } = await sb.auth.getSession();
        const r=await fetch(SUPABASE_URL+'/functions/v1/delete-account', {
          method:'POST', headers:{ 'Authorization':'Bearer '+session.access_token, 'Content-Type':'application/json' }, body:'{}' });
        const j=await r.json();
        if(!r.ok || !j.deleted) throw new Error(j.error||'Deletion failed');
        localStorage.clear();
        await sb.auth.signOut().catch(()=>{});
        toast('Your account and data have been erased. Grace and peace to you. 🌱', 6000);
        setTimeout(()=>location.reload(), 2500);
      } catch(e){ toast('⚠️ '+e.message); }
    },
    async editName(){
      const name=prompt('Display name:', state.profile?.display_name||'');
      if(!name) return;
      const { error }=await sb.from('profiles').update({display_name:name}).eq('id',state.user.id);
      if(error) return toast('⚠️ '+error.message);
      state.profile.display_name=name; updateAuthChip(); renderProfile();
    },
  };

  // ════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════
  loadTheme();
  loadLocal();
  updateGenderUI();
  state.currentDay = todayIndex();

  $('#theme-toggle')?.addEventListener('click',()=>{
    state.theme=state.theme==='dark'?'light':'dark';
    localStorage.setItem('flourish-theme',state.theme); applyTheme();
  });
  $('#gender-toggle')?.addEventListener('click',()=>{
    state.gender=state.gender==='men'?'women':'men';
    localStorage.setItem('flourish-gender',state.gender);
    updateGenderUI();
    if(sb&&state.user) sb.from('profiles').update({gender:state.gender}).eq('id',state.user.id).then(()=>{});
    showPage();
  });
  $('#auth-chip')?.addEventListener('click',()=>{
    if(state.user){ location.hash='profile'; showPage('profile'); }
    else openAuthSheet();
  });
  $$('.nav-btn').forEach(b=>b.addEventListener('click',()=>{
    location.hash=b.dataset.page; showPage(b.dataset.page);
  }));
  window.addEventListener('hashchange',()=>showPage());

  sb?.auth.onAuthStateChange((_e,_s)=>{ refreshIdentity(); });

  (async()=>{
    loadPlans().catch(()=>{});
    await refreshIdentity().catch(()=>{});
    showPage();
    checkJoinFromURL();
  })();

  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
})();
