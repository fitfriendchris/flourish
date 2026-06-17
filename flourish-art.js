/* ════════════════════════════════════════════════════════════════
   FLOURISH ART ENGINE — deterministic SVG generators
   "The Agriculture of the Soul: The Law of the Harvest."
   Motifs: roots tearing stone, wheat, olive, fig/pomegranate/grape,
   chiseled obsidian/basalt, gold & bronze veins, chiaroscuro light.
   ZERO flowers. ZERO petals. ZERO pastels. Heavy, architectural.
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // Seeded PRNG (mulberry32) — deterministic per product
  function rng(seed){
    let s = 0;
    const str = String(seed || 'flourish');
    for(let i=0;i<str.length;i++) s = (s*31 + str.charCodeAt(i)) >>> 0;
    if(s===0) s=1;
    return function(){
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t>>>15), t | 1);
      t ^= t + Math.imul(t ^ (t>>>7), t | 61);
      return ((t ^ (t>>>14)) >>> 0) / 4294967296;
    };
  }

  // Chiseled stone slab — the foundation for every card
  function stoneSlab(w,h,r, dark){
    const x0=8, y0=8, x1=w-8, y1=h-8;
    const blocks = [
      [x0, y0, w*0.5-4, h*0.5-4],
      [w*0.5+2, y0, x1-(w*0.5+2), h*0.5-4],
      [x0, h*0.5+2, w*0.32-4, y1-(h*0.5+2)],
      [w*0.32+2, h*0.5+2, (w*0.68)-(w*0.32+2), y1-(h*0.5+2)],
      [w*0.68+2, h*0.5+2, x1-(w*0.68+2), y1-(h*0.5+2)]
    ];
    const base = dark ? '#0a140b' : '#e8dcc8';
    const mortar = dark ? '#06100a' : '#d8cbb0';
    const edge = dark ? '#16291a' : '#c9bc9f';
    let s = `<defs>
      <radialGradient id="chiro-${r}" cx="32%" cy="22%" r="85%">
        <stop offset="0%" stop-color="${dark?'#2a3a26':'#fffaf2'}" stop-opacity="0.95"/>
        <stop offset="45%" stop-color="${dark?'#1a2a18':'#efe5d2'}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${dark?'#070f08':'#d0c3a4'}" stop-opacity="0.85"/>
      </radialGradient>
      <filter id="crack-${r}"><feTurbulence baseFrequency="0.012 0.02" numOctaves="2" seed="${(r*7)%1000}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    </defs>
    <rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" rx="6" fill="url(#chiro-${r})"/>
    <g stroke="${edge}" stroke-width="1.2" opacity="0.55">`;
    blocks.forEach(b=>{ s += `<rect x="${b[0]}" y="${b[2]?b[0]:b[0]}" width="${b[2]}" height="${b[3]}"/>`; });
    // re-do blocks correctly
    s = s.replace(/<g stroke[^>]*>[\s\S]*$/,'');
    s += `<rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" rx="6" fill="url(#chiro-${r})"/>`;
    s += `<g stroke="${edge}" stroke-width="1.1" opacity="0.5">`;
    const bx=[x0, w*0.5-2, w*0.68+2];
    const by=[y0, h*0.5+2];
    // vertical mortar lines
    bx.slice(1).forEach(x=>{ s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`; });
    // horizontal mortar line
    by.slice(1).forEach(y=>{ s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>`; });
    s += `</g>`;
    // cracks
    s += `<g opacity="0.18" stroke="${dark?'#000':'#7a6a45'}" stroke-width="0.6" fill="none">`;
    s += `<path d="M ${w*0.3} ${h*0.5} q 6 -8 14 -2 t 10 6"/>`;
    s += `<path d="M ${w*0.62} ${h*0.62} q 4 6 0 12 t -6 8"/>`;
    s += `</g>`;
    return s;
  }

  // Gold/bronze metallic gradient defs (shared)
  function metalDefs(r){
    return `<linearGradient id="gold-${r}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#dfc07a"/><stop offset="35%" stop-color="#c9a84c"/>
      <stop offset="60%" stop-color="#a6883e"/><stop offset="100%" stop-color="#8a6e2c"/>
    </linearGradient>
    <linearGradient id="bronze-${r}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b08d57"/><stop offset="50%" stop-color="#7a5e34"/>
      <stop offset="100%" stop-color="#4f3d20"/>
    </linearGradient>
    <linearGradient id="bark-${r}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3a2a16"/><stop offset="50%" stop-color="#5a4222"/>
      <stop offset="100%" stop-color="#2a1d0e"/>
    </linearGradient>`;
  }

  // ── MOTIF: ROOTS — thick roots tearing through foundational stone ──
  function motifRoots(w,h,rnd,r){
    const cx=w/2, cy=h*0.62;
    const gold=`url(#gold-${r})`, bronze=`url(#bronze-${r})`, bark=`url(#bark-${r})`;
    let s='';
    // deep taproot
    s += `<path d="M ${cx} ${cy} C ${cx-6} ${cy+24}, ${cx+10} ${cy+42}, ${cx-4} ${cy+70} S ${cx+8} ${cy+98}, ${cx} ${cy+120}" stroke="${bark}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    // lateral roots tearing sideways through stone (with fracture lines)
    const laterals = [
      `M ${cx} ${cy+30} C ${cx-26} ${cy+22}, ${cx-48} ${cy+30}, ${cx-66} ${cy+14}`,
      `M ${cx} ${cy+44} C ${cx+24} ${cy+36}, ${cx+46} ${cy+44}, ${cx+62} ${cy+30}`,
      `M ${cx-4} ${cy+72} C ${cx-22} ${cy+68}, ${cx-40} ${cy+80}, ${cx-58} ${cy+70}`,
      `M ${cx+6} ${cy+88} C ${cx+20} ${cy+82}, ${cx+38} ${cy+96}, ${cx+54} ${cy+86}`
    ];
    laterals.forEach(d=>{ s += `<path d="${d}" stroke="${bark}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`; });
    // root flare at trunk base
    s += `<ellipse cx="${cx}" cy="${cy-4}" rx="22" ry="11" fill="${bark}"/>`;
    // trunk rising (heavy, ancient)
    s += `<path d="M ${cx-9} ${cy} C ${cx-7} ${cy-40}, ${cx-11} ${cy-72}, ${cx-6} ${cy-98} L ${cx+7} ${cy-98} C ${cx+10} ${cy-72}, ${cx+9} ${cy-40}, ${cx+9} ${cy} Z" fill="${bark}"/>`;
    // bark ridges
    s += `<g stroke="#1a1208" stroke-width="0.7" opacity="0.7" fill="none">`;
    for(let i=0;i<5;i++){ const yy=cy-16-i*18; s += `<path d="M ${cx-7} ${yy} q 7 3 14 0"/>`; }
    s += `</g>`;
    // fracture lines where roots burst stone
    s += `<g stroke="#000" stroke-width="0.8" opacity="0.35" fill="none">`;
    s += `<path d="M ${cx-66} ${cy+16} l -10 -4 M ${cx-66} ${cy+16} l -8 6"/>`;
    s += `<path d="M ${cx+62} ${cy+32} l 9 -5 M ${cx+62} ${cy+32} l 7 7"/>`;
    s += `</g>`;
    // bronze vein accents woven into roots
    s += `<g stroke="${bronze}" stroke-width="1.4" opacity="0.85" fill="none">`;
    s += `<path d="M ${cx} ${cy+12} q -3 20 -4 36"/>`;
    s += `<path d="M ${cx-4} ${cy+70} q 6 14 4 30"/>`;
    s += `</g>`;
    return s;
  }

  // ── MOTIF: SAPLING — young tree, deep roots forming ──
  function motifSapling(w,h,rnd,r){
    const cx=w/2, cy=h*0.55;
    const gold=`url(#gold-${r})`, bronze=`url(#bronze-${r})`, bark=`url(#bark-${r})`;
    let s='';
    // ground line (chiseled)
    s += `<line x1="${w*0.12}" y1="${cy+58}" x2="${w*0.88}" y2="${cy+58}" stroke="${bronze}" stroke-width="1.5" opacity="0.7"/>`;
    // trunk
    s += `<path d="M ${cx-4} ${cy+58} C ${cx-3} ${cy+30}, ${cx-5} ${cy+0}, ${cx-2} ${cy-26} L ${cx+3} ${cy-26} C ${cx+5} ${cy+0}, ${cx+4} ${cy+30}, ${cx+4} ${cy+58} Z" fill="${bark}"/>`;
    // branches
    s += `<g stroke="${bark}" stroke-width="2.2" fill="none" stroke-linecap="round">`;
    s += `<path d="M ${cx-1} ${cy-14} q -16 -10 -28 -8"/>`;
    s += `<path d="M ${cx+1} ${cy-20} q 14 -8 26 -10"/>`;
    s += `<path d="M ${cx-2} ${cy-4} q -10 -14 -22 -18"/>`;
    s += `</g>`;
    // leaves (olive-shaped, NOT flower petals) — elongated almond leaves
    const leaves=[
      [cx-30,cy-22, -0.7],[cx+28,cy-30, 0.7],[cx-24,cy-20,-0.5],[cx+22,cy-14,0.5],
      [cx-18,cy-36,-0.3],[cx+18,cy-40,0.4],[cx,cy-30,0]
    ];
    leaves.forEach(([lx,ly,rot])=>{
      s += `<g transform="translate(${lx},${ly}) rotate(${rot*60})"><ellipse cx="0" cy="0" rx="9" ry="3.2" fill="#3d6b50" opacity="0.85"/><path d="M -8 0 L 8 0" stroke="#2a4d3a" stroke-width="0.5"/></g>`;
    });
    // roots below ground (forming)
    s += `<g stroke="${bark}" stroke-width="2.5" fill="none" stroke-linecap="round">`;
    s += `<path d="M ${cx-2} ${cy+60} q -8 10 -12 22"/>`;
    s += `<path d="M ${cx+2} ${cy+60} q 8 10 14 20"/>`;
    s += `<path d="M ${cx} ${cy+62} q 0 14 2 26"/>`;
    s += `</g>`;
    // gold leaf sheen accents
    s += `<circle cx="${cx-30}" cy="${cy-22}" r="2" fill="${gold}" opacity="0.8"/>`;
    s += `<circle cx="${cx+28}" cy="${cy-30}" r="2" fill="${gold}" opacity="0.8"/>`;
    return s;
  }

  // ── MOTIF: ARMOR — bronze armor over chiseled stone ──
  function motifArmor(w,h,rnd,r){
    const cx=w/2, cy=h*0.52;
    const gold=`url(#gold-${r})`, bronze=`url(#bronze-${r})`;
    let s='';
    // breastplate
    s += `<path d="M ${cx-34} ${cy-36} C ${cx-40} ${cy}, ${cx-30} ${cy+34}, ${cx-14} ${cy+40} L ${cx+14} ${cy+40} C ${cx+30} ${cy+34}, ${cx+40} ${cy}, ${cx+34} ${cy-36} C ${cx+20} ${cy-44}, ${cx-20} ${cy-44}, ${cx-34} ${cy-36} Z" fill="${bronze}" stroke="#4f3d20" stroke-width="1.5"/>`;
    // plate ridges
    s += `<g stroke="#4f3d20" stroke-width="1" fill="none" opacity="0.7">`;
    for(let i=0;i<3;i++){ const yy=cy-24+i*18; s += `<path d="M ${cx-30} ${yy} q 30 6 60 0"/>`; }
    s += `</g>`;
    // center ridge (gold)
    s += `<path d="M ${cx} ${cy-40} L ${cx} ${cy+38}" stroke="${gold}" stroke-width="2.5" opacity="0.9"/>`;
    // shoulder pauldrons
    s += `<ellipse cx="${cx-34}" cy="${cy-34}" rx="12" ry="8" fill="${bronze}" stroke="#4f3d20" stroke-width="1.2"/>`;
    s += `<ellipse cx="${cx+34}" cy="${cy-34}" rx="12" ry="8" fill="${bronze}" stroke="#4f3d20" stroke-width="1.2"/>`;
    // belt with forged buckle
    s += `<rect x="${cx-32}" y="${cy+30}" width="64" height="8" fill="${bronze}" stroke="#4f3d20" stroke-width="1"/>`;
    s += `<rect x="${cx-6}" y="${cy+28}" width="12" height="12" fill="${gold}" stroke="#8a6e2c" stroke-width="1"/>`;
    // rivets
    s += `<g fill="${gold}">`;
    [[cx-26,cy-22],[cx+26,cy-22],[cx-26,cy+8],[cx+26,cy+8]].forEach(([rx,ry])=>{ s+=`<circle cx="${rx}" cy="${ry}" r="2.2"/>`; });
    s += `</g>`;
    // helmet crest above
    s += `<path d="M ${cx-18} ${cy-50} q 18 -10 36 0" stroke="${gold}" stroke-width="2" fill="none"/>`;
    return s;
  }

  // ── MOTIF: WHEAT — heavy wheat stalks ──
  function motifWheat(w,h,rnd,r){
    const gold=`url(#gold-${r})`, bronze=`url(#bronze-${r})`;
    let s='';
    const stalks=[w*0.32,w*0.5,w*0.68];
    stalks.forEach((sx,i)=>{
      const baseY=h*0.92, topY=h*0.16+i*6;
      // stalk
      s += `<path d="M ${sx} ${baseY} C ${sx+ (i-1)*2} ${h*0.6}, ${sx-(i-1)*2} ${h*0.4}, ${sx} ${topY}" stroke="${bronze}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      // grain heads (heavy, weighted) — pairs along the top third
      const grainTop = topY+6;
      for(let g=0; g<8; g++){
        const gy = grainTop + g*7;
        const angle = (g%2===0)? -1 : 1;
        s += `<g transform="translate(${sx},${gy}) rotate(${angle*22})"><ellipse cx="${0}" cy="0" rx="3.2" ry="6" fill="${gold}" stroke="#8a6e2c" stroke-width="0.5"/></g>`;
        s += `<g transform="translate(${sx},${gy}) rotate(${-angle*22})"><ellipse cx="${0}" cy="0" rx="3.2" ry="6" fill="${gold}" stroke="#8a6e2c" stroke-width="0.5"/></g>`;
      }
      // beard (awns)
      s += `<g stroke="${bronze}" stroke-width="0.7" opacity="0.7" fill="none">`;
      s += `<path d="M ${sx} ${topY-2} q 4 -8 8 -10"/>`;
      s += `<path d="M ${sx} ${topY-2} q -4 -8 -8 -10"/>`;
      s += `<path d="M ${sx} ${topY-2} q 0 -10 0 -14"/>`;
      s += `</g>`;
    });
    // bronze ground sheaf binding
    s += `<rect x="${w*0.3}" y="${h*0.88}" width="${w*0.4}" height="6" rx="2" fill="${bronze}"/>`;
    return s;
  }

  // ── MOTIF: STONE — chiseled stone slab with struck verse ──
  function motifStone(w,h,rnd,r){
    const gold=`url(#gold-${r})`, bronze=`url(#bronze-${r})`;
    let s='';
    // central recessed tablet
    const tx=w*0.18, ty=h*0.24, tw=w*0.64, th=h*0.52;
    s += `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="4" fill="#0a140b" opacity="0.5"/>`;
    s += `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="4" fill="none" stroke="${bronze}" stroke-width="1.5"/>`;
    // chisel marks (corner notches)
    [[tx,ty],[tx+tw,ty],[tx,ty+th],[tx+tw,ty+th]].forEach(([cx,cy])=>{ s+=`<circle cx="${cx}" cy="${cy}" r="2" fill="${gold}"/>`; });
    // struck-gold text lines (faux type)
    const ly = ty+th*0.5;
    s += `<g fill="${gold}" opacity="0.9">`;
    s += `<rect x="${tx+tw*0.12}" y="${ly-14}" width="${tw*0.76}" height="2.4"/>`;
    s += `<rect x="${tx+tw*0.18}" y="${ly-4}" width="${tw*0.64}" height="2.4"/>`;
    s += `<rect x="${tx+tw*0.22}" y="${ly+6}" width="${tw*0.56}" height="2.4"/>`;
    s += `<rect x="${tx+tw*0.3}" y="${ly+16}" width="${tw*0.4}" height="2.4"/>`;
    s += `</g>`;
    // struck-metal seal at top
    s += `<circle cx="${w/2}" cy="${ty-6}" r="6" fill="${gold}" stroke="#8a6e2c" stroke-width="1"/>`;
    s += `<circle cx="${w/2}" cy="${ty-6}" r="2.5" fill="#8a6e2c"/>`;
    return s;
  }

  // ── MOTIF: OLIVE — olive branch bearing fruit (fig, olive, grape, pomegranate) ──
  function motifOlive(w,h,rnd,r){
    const gold=`url(#gold-${r})`, bronze=`url(#bronze-${r})`, bark=`url(#bark-${r})`;
    let s='';
    const cx=w*0.5, cy=h*0.5;
    // main branch (twisting)
    s += `<path d="M ${w*0.12} ${h*0.88} C ${w*0.3} ${h*0.7}, ${w*0.4} ${h*0.55}, ${cx} ${cy} S ${w*0.78} ${h*0.2}, ${w*0.9} ${h*0.12}" stroke="${bark}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    // leaves (olive-shaped, elongated, sage)
    const leafSet=[
      [w*0.28,h*0.66,-40],[w*0.4,h*0.5,30],[w*0.52,h*0.38,-25],
      [w*0.64,h*0.28,45],[w*0.72,h*0.2,-35],[w*0.36,h*0.58,20]
    ];
    leafSet.forEach(([lx,ly,rot])=>{
      s += `<g transform="translate(${lx},${ly}) rotate(${rot})"><ellipse cx="0" cy="0" rx="11" ry="3.4" fill="#4a7a5e" opacity="0.85"/><path d="M -10 0 L 10 0" stroke="#2a4d3a" stroke-width="0.5"/></g>`;
    });
    // fruit — weighted olives (SSS-glow via radial gradient)
    s += `<defs><radialGradient id="olive-${r}" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#6a4a2a"/><stop offset="60%" stop-color="#3a2410"/><stop offset="100%" stop-color="#1a0e06"/></radialGradient></defs>`;
    const olives=[[w*0.34,h*0.6,5],[w*0.48,h*0.46,6],[w*0.6,h*0.34,5],[w*0.7,h*0.24,6],[w*0.42,h*0.54,5]];
    olives.forEach(([ox,oy,rr])=>{
      s += `<circle cx="${ox}" cy="${oy}" r="${rr}" fill="url(#olive-${r})" stroke="#1a0e06" stroke-width="0.5"/>`;
      s += `<circle cx="${ox-1.5}" cy="${oy-1.5}" r="${rr*0.35}" fill="#9a7a4a" opacity="0.6"/>`;
    });
    // a single fig (deep, weighted)
    s += `<ellipse cx="${w*0.32}" cy="${h*0.72}" rx="8" ry="11" fill="#4a2418" stroke="#2a1408" stroke-width="0.8"/>`;
    s += `<path d="M ${w*0.3} ${h*0.66} q 2 4 4 6 q 2 -4 2 -8" stroke="#2a1408" stroke-width="0.6" fill="none"/>`;
    return s;
  }

  // ── MOTIF: SCROLL — rolled scroll with seal ──
  function motifScroll(w,h,rnd,r){
    const gold=`url(#gold-${r})`, bronze=`url(#bronze-${r})`;
    let s='';
    const sx=w*0.16, ex=w*0.84, topY=h*0.3, midY=h*0.5, botY=h*0.7;
    // scroll body
    s += `<rect x="${sx}" y="${topY}" width="${ex-sx}" height="${botY-topY}" fill="#e8dcc8" opacity="0.92" stroke="${bronze}" stroke-width="1.2"/>`;
    // top & bottom rollers
    s += `<rect x="${sx-4}" y="${topY-6}" width="${ex-sx+8}" height="12" rx="4" fill="${bronze}" stroke="#4f3d20" stroke-width="1"/>`;
    s += `<rect x="${sx-4}" y="${botY-6}" width="${ex-sx+8}" height="12" rx="4" fill="${bronze}" stroke="#4f3d20" stroke-width="1"/>`;
    // roller end caps (gold)
    s += `<circle cx="${sx-4}" cy="${topY}" r="5" fill="${gold}"/><circle cx="${ex+4}" cy="${topY}" r="5" fill="${gold}"/>`;
    s += `<circle cx="${sx-4}" cy="${botY}" r="5" fill="${gold}"/><circle cx="${ex+4}" cy="${botY}" r="5" fill="${gold}"/>`;
    // text lines (struck)
    s += `<g fill="#5a4a2a" opacity="0.6">`;
    for(let i=0;i<5;i++){ const yy=midY-18+i*9; s+=`<rect x="${sx+8}" y="${yy}" width="${(ex-sx-16)*(0.6+0.08*i%0.3)}" height="1.6"/>`; }
    s += `</g>`;
    // wax seal
    s += `<circle cx="${(sx+ex)/2}" cy="${topY+8}" r="6" fill="#8b2a2a" stroke="#5a1818" stroke-width="1"/>`;
    s += `<path d="M ${(sx+ex)/2-3} ${topY+8} h 6 m -3 -3 v 6" stroke="#5a1818" stroke-width="1"/>`;
    return s;
  }

  // ── MOTIF: BRASS — solid brass objects (markers) ──
  function motifBrass(w,h,rnd,r){
    const gold=`url(#gold-${r})`, bronze=`url(#bronze-${r})`;
    let s='';
    const items=[w*0.3,w*0.5,w*0.7];
    items.forEach((ix,i)=>{
      const iy=h*0.7;
      // marker rod
      s += `<rect x="${ix-1.5}" y="${h*0.3}" width="3" height="${iy-h*0.3}" rx="1.5" fill="${bronze}"/>`;
      // finial (varied: wheat, olive-shape, vine)
      if(i===0){
        // wheat finial
        s += `<g transform="translate(${ix},${h*0.28})">`;
        for(let g=0;g<3;g++){ s+=`<ellipse cx="${0}" cy="${-g*4}" rx="3" ry="5" fill="${gold}" transform="rotate(${(g%2?-1:1)*25})"/>`; }
        s += `</g>`;
      } else if(i===1){
        // olive leaf finial
        s += `<g transform="translate(${ix},${h*0.26}) rotate(20)"><ellipse cx="0" cy="0" rx="4" ry="10" fill="${gold}"/></g>`;
      } else {
        // vine finial (twist)
        s += `<path d="M ${ix} ${h*0.28} q 6 -4 0 -10 q -6 -6 0 -12" stroke="${gold}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      }
    });
    // kraft sleeve at base
    s += `<rect x="${w*0.24}" y="${h*0.74}" width="${w*0.52}" height="14" rx="2" fill="#9a7a4a" stroke="#5a4222" stroke-width="1" opacity="0.85"/>`;
    return s;
  }

  // ── MOTIF: WOOD — olive wood grain ──
  function motifWood(w,h,rnd,r){
    const bark=`url(#bark-${r})`, bronze=`url(#bronze-${r})`, gold=`url(#gold-${r})`;
    let s='';
    // cross
    const cx=w/2, cy=h*0.5;
    s += `<rect x="${cx-4}" y="${h*0.12}" width="8" height="${h*0.76}" rx="2" fill="${bark}" stroke="#1a1208" stroke-width="0.8"/>`;
    s += `<rect x="${w*0.22}" y="${cy-4}" width="${w*0.56}" height="8" rx="2" fill="${bark}" stroke="#1a1208" stroke-width="0.8"/>`;
    // grain lines
    s += `<g stroke="#1a1208" stroke-width="0.5" opacity="0.6" fill="none">`;
    for(let i=0;i<4;i++){ const yy=h*0.16+i*(h*0.18); s+=`<path d="M ${cx-3} ${yy} q 3 3 0 6 q -3 3 0 6"/>`; }
    s += `<path d="M ${w*0.24} ${cy} q 30 2 56 0"/>`;
    s += `</g>`;
    // bronze hanging ring
    s += `<circle cx="${cx}" cy="${h*0.1}" r="4" fill="none" stroke="${bronze}" stroke-width="2"/>`;
    // grain knot (the sermon)
    s += `<ellipse cx="${cx}" cy="${cy}" rx="4" ry="3" fill="#2a1d0e" opacity="0.7"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="1.5" fill="${gold}" opacity="0.5"/>`;
    return s;
  }

  // ── MOTIF: VINE — twisting vine lattice ──
  function motifVine(w,h,rnd,r){
    const bark=`url(#bark-${r})`, bronze=`url(#bronze-${r})`, gold=`url(#gold-${r})`;
    let s='';
    // main twisting vine
    s += `<path d="M ${w*0.15} ${h*0.85} C ${w*0.3} ${h*0.7}, ${w*0.25} ${h*0.5}, ${w*0.45} ${h*0.45} S ${w*0.7} ${h*0.3}, ${w*0.85} ${h*0.15}" stroke="${bark}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    // secondary vine
    s += `<path d="M ${w*0.2} ${h*0.2} C ${w*0.4} ${h*0.3}, ${w*0.5} ${h*0.55}, ${w*0.6} ${h*0.6} S ${w*0.8} ${h*0.75}, ${w*0.82} ${h*0.85}" stroke="${bark}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    // tendrils
    s += `<g stroke="${bark}" stroke-width="1.6" fill="none" opacity="0.8" stroke-linecap="round">`;
    s += `<path d="M ${w*0.4} ${h*0.47} q 6 -8 4 -14 q -2 -6 4 -8"/>`;
    s += `<path d="M ${w*0.6} ${h*0.6} q -6 -8 -4 -14 q 2 -6 -4 -8"/>`;
    s += `<path d="M ${w*0.3} ${h*0.7} q 8 6 14 4 q 6 -2 8 4"/>`;
    s += `</g>`;
    // leaves (olive-shaped, dark sage)
    [[w*0.35,h*0.55,-30],[w*0.55,h*0.5,40],[w*0.5,h*0.62,-20],[w*0.7,h*0.4,30]].forEach(([lx,ly,rot])=>{
      s += `<g transform="translate(${lx},${ly}) rotate(${rot})"><ellipse cx="0" cy="0" rx="8" ry="3" fill="#3d6b50" opacity="0.85"/></g>`;
    });
    // a heavy grape cluster
    s += `<defs><radialGradient id="grape-${r}" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#5a2a4a"/><stop offset="100%" stop-color="#2a0e2a"/></radialGradient></defs>`;
    const gx=w*0.68, gy=h*0.62;
    const grapes=[[0,0],[5,4],[-5,4],[2,8],[-4,10],[6,10],[0,14],[3,18]];
    grapes.forEach(([dx,dy])=>{ s+=`<circle cx="${gx+dx}" cy="${gy+dy}" r="3.2" fill="url(#grape-${r})"/>`; });
    // bronze accent vein
    s += `<path d="M ${w*0.45} ${h*0.45} q 10 8 18 16" stroke="${bronze}" stroke-width="1.2" opacity="0.7" fill="none"/>`;
    return s;
  }

  const MOTIFS = {
    roots: motifRoots, sapling: motifSapling, armor: motifArmor, wheat: motifWheat,
    stone: motifStone, olive: motifOlive, scroll: motifScroll, brass: motifBrass,
    wood: motifWood, vine: motifVine
  };
  // product.motif aliases
  const ALIAS = { harvest:'wheat', fruitful:'olive', wisdom:'stone', anoint:'olive',
    markers:'brass', bookmark:'wheat', cover:'vine', journal:'scroll', cross:'wood',
    cards:'stone', guide:'scroll' };

  function render(seed, motif, opts){
    opts = opts || {};
    const w = opts.w || 360, h = opts.h || 360;
    const dark = opts.dark !== false; // default dark (card art)
    const r = (Math.abs(hashCode(String(seed)))) % 100000;
    const rnd = rng(String(seed) + (motif||''));
    const fn = MOTIFS[motif] || MOTIFS[ALIAS[motif]] || motifRoots;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${opts.label||'Flourish'}">
      ${metalDefs(r)}
      ${stoneSlab(w,h,r,dark)}
      ${fn(w,h,rnd,r)}
      <!-- chiaroscuro vignette -->
      <radialGradient id="vig-${r}" cx="30%" cy="20%" r="90%"><stop offset="0%" stop-color="transparent"/><stop offset="70%" stop-color="#000" stop-opacity="0.15"/><stop offset="100%" stop-color="#000" stop-opacity="0.55"/></radialGradient>
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#vig-${r})"/>
    </svg>`;
    return svg;
  }
  function hashCode(s){ let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h+s.charCodeAt(i))|0; } return h; }

  // The Harvest seal — used on Giving + headers. A wheat sheaf bound in bronze.
  function seal(opts){
    opts = opts || {};
    const size = opts.size || 120;
    const gold='#c9a84c', bronze='#7a5e34';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="Flourish Harvest Seal">
      <defs>
        <linearGradient id="sealg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#dfc07a"/><stop offset="100%" stop-color="#8a6e2c"/></linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="${bronze}" stroke-width="2.5"/>
      <circle cx="60" cy="60" r="50" fill="none" stroke="url(#sealg)" stroke-width="1" opacity="0.7"/>
      ${motifWheat(120,120,rng('seal'), Math.abs(hashCode('seal'))%100000)}
    </svg>`;
  }

  window.FlourishArt = { render, seal, rng };
})();