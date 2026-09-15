// ---------------------------------------------------------------------------
// bear-calculator.js — the Bear Squad Calculator, embedded into this
// dashboard's own "/bears" route (see renderBearCalculator in app.js).
//
// This is the exact same app you gave me (github.com/QueenTacos/
// bear-calculator, this specific no-backend build), with only two changes
// needed to run it without a build step, in this dashboard's plain
// <script> loading model instead of Vite:
//   1. The `import { useState, ... } from "react"` at the top is replaced
//      with a destructure off the global `React` (loaded via the React
//      UMD build in index.html, before this file).
//   2. `export default function App(){...}` is `function
//      BearSquadCalculatorApp(){...}` — no ES modules here, so no export;
//      renamed from the generic `App` so it can't collide with anything
//      else in this shared global script scope, and so it's obvious at
//      the call site (renderBearCalculator) what it is.
// Nothing about the calculator's own logic, layout, or styling below this
// point was touched — same recommendation engine, same troop math, same
// hero roster/portraits, same tabs. This file is loaded with
// type="text/babel" (see index.html), so the JSX below is transformed to
// plain JS right in the visitor's browser by Babel standalone — no Vite,
// no node_modules, nothing to build or deploy separately.
// ---------------------------------------------------------------------------
const { useState, useEffect, useMemo, useCallback } = React;

// ── PORTRAITS ─────────────────────────────────────────────────
const PORTRAITS={
  'ahmose':'/portraits/ahmose.png','aiden':'/portraits/aiden.png',
  'aisling':'/portraits/aisling.png','alonso':'/portraits/alonso.png',
  'bahiti':'/portraits/bahiti.png','bertha':'/portraits/bertha.png',
  'blanchette':'/portraits/blanchette.jpg','bradley':'/portraits/bradley.jpg',
  'cara':'/portraits/cara.png','charlie':'/portraits/charlie.png',
  'cloris':'/portraits/cloris.png','dominic':'/portraits/dominic.png',
  'edith':'/portraits/edith.jpg','eleanor':'/portraits/eleanor.png',
  'eleonora':'/portraits/eleonora.jpg','elif':'/portraits/elif.png',
  'estrella':'/portraits/estrella.png','eugene':'/portraits/eugene.png',
  'flint':'/portraits/flint.png','flora':'/portraits/flora.jpg',
  'fred':'/portraits/fred.jpg','freya':'/portraits/freya.jpg',
  'gatot':'/portraits/gatot.jpg','gina':'/portraits/gina.png',
  'gisela':'/portraits/gisela.jpg','gordon':'/portraits/gordon.jpg',
  'greg_s3':'/portraits/greg_s3.png','gregory':'/portraits/gregory.jpg',
  'gwen':'/portraits/gwen.jpg','hank':'/portraits/hank.png',
  'hector':'/portraits/hector.jpg','hendrik':'/portraits/hendrik.jpg',
  'hervor':'/portraits/hervor.jpg',
};
const getPortrait=id=>PORTRAITS[id]||null;

// ── HERO DATA ─────────────────────────────────────────────────
const GRP={
  epic:{label:'Epic',bg:'#0a1f40',border:'#1e5a9a',accent:'#4a9adf'},
  rare:{label:'Rare',bg:'#1a0a3a',border:'#5a2a9a',accent:'#9a5adf'},
  s1:{label:'S1',bg:'#3a1400',border:'#cc5500',accent:'#ff7a20'},
  s2:{label:'S2',bg:'#3a1400',border:'#cc5500',accent:'#ff7a20'},
  s3:{label:'S3',bg:'#3a1400',border:'#cc5500',accent:'#ff8a30'},
  s4:{label:'S4',bg:'#3a1400',border:'#cc5500',accent:'#ff8a30'},
  s5:{label:'S5',bg:'#3a1600',border:'#bb5500',accent:'#ff9a40'},
  s6:{label:'S6',bg:'#361300',border:'#aa4a00',accent:'#dd7020'},
  s7:{label:'S7',bg:'#361300',border:'#aa4a00',accent:'#dd7020'},
  s8:{label:'S8',bg:'#361300',border:'#aa4a00',accent:'#dd7020'},
  s9:{label:'S9',bg:'#361300',border:'#aa4a00',accent:'#dd7020'},
  s10:{label:'S10',bg:'#200a30',border:'#7a2a9a',accent:'#bf4adf'},
  s11:{label:'S11',bg:'#200a30',border:'#7a2a9a',accent:'#bf4adf'},
  s12:{label:'S12',bg:'#200a30',border:'#7a2a9a',accent:'#bf4adf'},
  s13:{label:'S13',bg:'#150a35',border:'#5a2aaa',accent:'#9a5aff'},
  s14:{label:'S14',bg:'#150a35',border:'#5a2aaa',accent:'#9a5aff'},
  s15:{label:'S15',bg:'#150a35',border:'#5a2aaa',accent:'#9a5aff'},
  s16:{label:'S16',bg:'#150a35',border:'#5a2aaa',accent:'#9a5aff'},
  s17:{label:'S17',bg:'#150a35',border:'#5a2aaa',accent:'#9a5aff'},
};
const HEROES=[
  {id:'smith',name:'Smith',g:'epic',role:'slot3_cap',t:'i'},
  {id:'eugene',name:'Eugene',g:'epic',role:'slot3_cap',t:'i'},
  {id:'charlie',name:'Charlie',g:'epic',role:'slot3_cap',t:'l'},
  {id:'cloris',name:'Cloris',g:'epic',role:'slot3_cap',t:'m'},
  {id:'sergey',name:'Sergey',g:'rare',role:'join23',t:'i'},
  {id:'jessie',name:'Jessie',g:'rare',role:'join_s1',jp:1,t:'l'},
  {id:'patrick',name:'Patrick',g:'rare',role:'slot3_cap',t:'l'},
  {id:'lumak',name:'Lumak Bokan',g:'rare',role:'join23',t:'l'},
  {id:'ling_xue',name:'Ling Xue',g:'rare',role:'slot3_cap',t:'l'},
  {id:'gina',name:'Gina',g:'rare',role:'slot3_cap',t:'m'},
  {id:'bahiti',name:'Bahiti',g:'rare',role:'rally_s3',t:'m'},
  {id:'jasser',name:'Jasser',g:'rare',role:'join_s1',jp:2,t:'m'},
  {id:'seo_yoon',name:'Seo-yoon',g:'rare',role:'join_s1',jp:3,t:'m'},
  {id:'natalia',name:'Natalia',g:'s1',role:'slot3_cap',t:'i'},
  {id:'jeronimo',name:'Jeronimo',g:'s1',role:'rally_s1',minS:3,t:'i'},
  {id:'molly',name:'Molly',g:'s1',role:'rally_s2',t:'l'},
  {id:'zinman',name:'Zinman',g:'s1',role:'slot3_cap',t:'m'},
  {id:'flint',name:'Flint',g:'s2',role:'rally_s1',t:'i'},
  {id:'philly',name:'Philly',g:'s2',role:'join_s1',jp:4,t:'l'},
  {id:'alonso',name:'Alonso',g:'s2',role:'rally_s3',t:'m'},
  {id:'logan',name:'Logan',g:'s3',role:'join23',t:'i'},
  {id:'mia',name:'Mia',g:'s3',role:'rally_s2',minS:3,t:'l'},
  {id:'greg_s3',name:'Greg',g:'s3',role:'join23',t:'m'},
  {id:'ahmose',name:'Ahmose',g:'s4',role:'join23',t:'i'},
  {id:'reina',name:'Reina',g:'s4',role:'rally_s2',minS:4,t:'l'},
  {id:'lynn',name:'Lynn',g:'s4',role:'rally_s3',minS:4,t:'m'},
  {id:'hector',name:'Hector',g:'s5',role:'rally_s1',t:'i'},
  {id:'norah',name:'Norah',g:'s5',role:'join23',t:'l'},
  {id:'gwen',name:'Gwen',g:'s5',role:'rally_s3',minS:3,t:'m'},
  {id:'wu_ming',name:'Wu Ming',g:'s6',role:'join23',t:'i'},
  {id:'renee',name:'Renee',g:'s6',role:'rally_s2',t:'l'},
  {id:'wayne',name:'Wayne',g:'s6',role:'rally_s3',t:'m'},
  {id:'edith',name:'Edith',g:'s7',role:'join23',t:'i'},
  {id:'gordon',name:'Gordon',g:'s7',role:'join23',t:'l'},
  {id:'bradley',name:'Bradley',g:'s7',role:'rally_s3',t:'m'},
  {id:'gatot',name:'Gatot',g:'s8',role:'join23',t:'i'},
  {id:'sonya',name:'Sonya',g:'s8',role:'rally_s2',t:'l'},
  {id:'hendrik',name:'Hendrik',g:'s8',role:'join23',t:'m'},
  {id:'magnus',name:'Magnus',g:'s9',role:'rally_s1',t:'i'},
  {id:'fred',name:'Fred',g:'s9',role:'join23',t:'l'},
  {id:'xura',name:'Xura',g:'s9',role:'join23',t:'m'},
  {id:'gregory',name:'Gregory',g:'s10',role:'rally_s1',t:'i'},
  {id:'freya',name:'Freya',g:'s10',role:'join23',t:'l'},
  {id:'blanchette',name:'Blanchette',g:'s10',role:'rally_s3',t:'m'},
  {id:'eleonora',name:'Eleonora',g:'s11',role:'join23',t:'i'},
  {id:'lloyd',name:'Lloyd',g:'s11',role:'join23',t:'l'},
  {id:'rufus',name:'Rufus',g:'s11',role:'rally_s3',t:'m'},
  {id:'hervor',name:'Hervor',g:'s12',role:'join23',t:'i'},
  {id:'karol',name:'Karol',g:'s12',role:'join23',t:'l'},
  {id:'ligeia',name:'Ligeia',g:'s12',role:'rally_s3',t:'m'},
  {id:'gisela',name:'Gisela',g:'s13',role:'join23',t:'i'},
  {id:'flora',name:'Flora',g:'s13',role:'join23',t:'l'},
  {id:'vulcanus',name:'Vulcanus',g:'s13',role:'join23',t:'m'},
  {id:'elif',name:'Elif',g:'s14',role:'join23',t:'i'},
  {id:'dominic',name:'Dominic',g:'s14',role:'join23',t:'l'},
  {id:'cara',name:'Cara',g:'s14',role:'join23',t:'m'},
  {id:'hank',name:'Hank',g:'s15',role:'join23',t:'i'},
  {id:'estrella',name:'Estrella',g:'s15',role:'join23',t:'l'},
  {id:'viveca',name:'Viveca',g:'s15',role:'join23',t:'m'},
  {id:'seigel',name:'Seigel',g:'s16',role:'join23',t:'i'},
  {id:'ursar',name:'Ursar',g:'s16',role:'join23',t:'l'},
  {id:'aisling',name:'Aisling',g:'s16',role:'join23',t:'m'},
  {id:'aiden',name:'Aiden',g:'s17',role:'join23',t:'i'},
  {id:'bertha',name:'Bertha',g:'s17',role:'join23',t:'l'},
  {id:'eleanor',name:'Eleanor',g:'s17',role:'join23',t:'m'},
];
const HMAP=Object.fromEntries(HEROES.map(h=>[h.id,h]));
const GROUPS=['epic','rare','s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','s13','s14','s15','s16','s17'];

// ── TROOP TIERS ───────────────────────────────────────────────
const TIERS=[
  {id:'t1',s:'T1',label:'Rookie',mult:1,c:'#9ca3af'},
  {id:'t2',s:'T2',label:'Trained',mult:3,c:'#60a5fa'},
  {id:'t3',s:'T3',label:'Senior',mult:7,c:'#34d399'},
  {id:'t4',s:'T4',label:'Veteran',mult:14,c:'#a3e635'},
  {id:'t5',s:'T5',label:'Hardy',mult:25,c:'#fbbf24'},
  {id:'t6',s:'T6',label:'Heroic',mult:42,c:'#fb923c'},
  {id:'t7',s:'T7',label:'Brave',mult:65,c:'#f87171'},
  {id:'t8',s:'T8',label:'Elite',mult:95,c:'#a78bfa'},
  {id:'t9',s:'T9',label:'Supreme',mult:135,c:'#e879f9'},
  {id:'t10',s:'T10',label:'Apex',mult:185,c:'#fde68a'},
  {id:'fc1',s:'FC1',label:'Fire Crystal 1',mult:250,c:'#fef08a',fc:true},
  {id:'fc2',s:'FC2',label:'Fire Crystal 2',mult:330,c:'#fcd34d',fc:true},
  {id:'fc3',s:'FC3',label:'Fire Crystal 3',mult:425,c:'#facc15',fc:true},
  {id:'fc4',s:'FC4',label:'Fire Crystal 4',mult:535,c:'#f59e0b',fc:true},
  {id:'fc5',s:'FC5',label:'Fire Crystal 5',mult:660,c:'#f97316',fc:true},
  {id:'fc6',s:'FC6',label:'Fire Crystal 6',mult:800,c:'#ef4444',fc:true},
  {id:'fc7',s:'FC7',label:'Fire Crystal 7',mult:960,c:'#dc2626',fc:true},
  {id:'fc8',s:'FC8',label:'Fire Crystal 8',mult:1140,c:'#c026d3',fc:true},
  {id:'fc9',s:'FC9',label:'Fire Crystal 9',mult:1340,c:'#a855f7',fc:true},
  {id:'fc10',s:'FC10',label:'Fire Crystal 10',mult:1560,c:'#818cf8',fc:true},
];

// ── HELPERS ───────────────────────────────────────────────────
const ni=v=>parseInt(v)||0;
const fmt=v=>v>0?Number(v).toLocaleString():'0';
const fmtP=v=>v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(0)}K`:`${v}`;
const ini=n=>n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
const initTroops=()=>Object.fromEntries(TIERS.map(t=>[t.id,'']));
const initHS=()=>Object.fromEntries(HEROES.map(h=>[h.id,{owned:false,stars:0}]));

// ── LOCAL STORAGE ─────────────────────────────────────────────
const LS={
  get:k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};

// ── RECOMMENDATION ENGINE ─────────────────────────────────────
function recommendAll(heroStates,isRally,joinCount,override={}){
  const o=id=>heroStates[id]?.owned, s=id=>heroStates[id]?.stars??0;
  const used=new Set();
  const htype=id=>HMAP[id]?.t;
  const capOnly=new Set(HEROES.filter(h=>h.role==='slot3_cap').map(h=>h.id));
  const j1lock=new Set(['jessie','jasser','seo_yoon','philly']);
  const pri=h=>h.g==='epic'?0:h.g==='rare'?1:(parseInt(h.g.slice(1))||0)+2;
  const desc=(a,b)=>pri(b)-pri(a);
  const pick=cands=>{for(const{id,minS=0}of cands)if(o(id)&&s(id)>=minS&&!used.has(id)){used.add(id);return id;}return null;};
  const flexT=exT=>[...HEROES].sort(desc).filter(h=>!exT.has(h.t)&&!capOnly.has(h.id)&&!j1lock.has(h.id)&&o(h.id)&&!used.has(h.id)).map(h=>({id:h.id}));
  const anyT=exT=>[...HEROES].sort(desc).filter(h=>!exT.has(h.t)&&!j1lock.has(h.id)&&o(h.id)&&!used.has(h.id)).map(h=>({id:h.id}));

  const rally={s1:null,s2:null,s3:null};
  if(isRally){
    ['s1','s2','s3'].forEach(slot=>{
      const id=override[slot];
      if(id&&o(id)&&!used.has(id)&&!j1lock.has(id)){rally[slot]=id;used.add(id);}
    });
    if(!rally.s1) rally.s1=pick([{id:'jeronimo',minS:3},{id:'hector'},{id:'magnus'},{id:'gregory'}]);
    if(rally.s1||override.s1){
      const ut=new Set([htype(rally.s1),htype(override.s1)].filter(Boolean));
      if(!rally.s2){
        if(o('mia')&&s('mia')>=5&&!used.has('mia')&&!ut.has('l')){rally.s2='mia';used.add('mia');}
        else{rally.s2=pick([{id:'molly'},{id:'mia',minS:3},{id:'reina',minS:4},{id:'sonya'},{id:'renee'},{id:'reina'}].filter(c=>!ut.has(htype(c.id))));
          if(!rally.s2)rally.s2=pick(flexT(ut));}
      }
      if(rally.s2)ut.add(htype(rally.s2));
      if(!rally.s3){
        rally.s3=pick([{id:'ligeia'},{id:'rufus'},{id:'blanchette'},{id:'bradley'},{id:'wayne'},{id:'gwen',minS:3},{id:'lynn',minS:4},{id:'alonso'},{id:'bahiti'}].filter(c=>!ut.has(htype(c.id))));
        if(!rally.s3)rally.s3=pick(anyT(ut));
      }
    }
  }
  const ded=['jessie','jasser','seo_yoon','philly'];
  const joins=[];
  for(let i=0;i<joinCount;i++){
    let s1=null;
    if(i<4){const hid=ded[i];if(o(hid)&&!used.has(hid)){s1=hid;used.add(hid);}}
    else s1=pick([{id:'jessie'},{id:'jasser'},{id:'seo_yoon'},{id:'philly'}]);
    if(!s1){joins.push({s1:null,s2:null,s3:null});continue;}
    const sq=new Set([htype(s1)]);
    const s2=pick(flexT(sq));if(s2)sq.add(htype(s2));
    const s3pool=i<3?[...HEROES].sort(desc).filter(h=>h.g!=='epic'&&!j1lock.has(h.id)&&!sq.has(h.t)&&o(h.id)&&!used.has(h.id)).map(h=>({id:h.id})):anyT(sq);
    const s3=pick(s3pool);
    joins.push({s1,s2,s3});
  }
  return{rally,joins};
}

// ── TROOP DISTRIBUTION ────────────────────────────────────────
function calcDistribution(inf,lan,mark,marchCap,isRally,joinCount,rallyRatio,joinRatio){
  const tI=TIERS.reduce((s,t)=>s+ni(inf[t.id]),0);
  const tL=TIERS.reduce((s,t)=>s+ni(lan[t.id]),0);
  const tM=TIERS.reduce((s,t)=>s+ni(mark[t.id]),0);
  const cap=ni(marchCap);
  const rR={m:(ni(rallyRatio?.mark)||90)/100,l:(ni(rallyRatio?.lan)||5)/100,i:(ni(rallyRatio?.inf)||5)/100};
  const jR={m:(ni(joinRatio?.mark)||80)/100,l:(ni(joinRatio?.lan)||10)/100,i:(ni(joinRatio?.inf)||10)/100};
  function fill(avI,avL,avM,r,c){
    const lim=Math.min(avI+avL+avM,c>0?c:Infinity);
    let sM=Math.min(Math.floor(lim*r.m),avM),sL=Math.min(Math.floor(lim*r.l),avL),sI=Math.min(Math.floor(lim*r.i),avI);
    let tot=sM+sL+sI;
    if(c>0&&tot<c){const a=Math.min(c-tot,avL-sL);sL+=a;tot+=a;}
    if(c>0&&tot<c){const a=Math.min(c-tot,avI-sI);sI+=a;tot+=a;}
    if(c>0&&tot<c){const a=Math.min(c-tot,avM-sM);sM+=a;tot+=a;}
    const total=sI+sL+sM;
    return{inf:sI,lan:sL,mark:sM,total,fillPct:cap>0?Math.round(total/cap*100):0};
  }
  let rI=tI,rL=tL,rM=tM,rallyOut=null;
  if(isRally&&cap>0){rallyOut=fill(rI,rL,rM,rR,cap);rI-=rallyOut.inf;rL-=rallyOut.lan;rM-=rallyOut.mark;}
  const joins=[];
  if(joinCount>0){
    const pI=Math.floor(rI/joinCount),pL=Math.floor(rL/joinCount),pM=Math.floor(rM/joinCount);
    for(let i=0;i<joinCount;i++){
      const last=i===joinCount-1;
      joins.push(fill(last?rI-pI*(joinCount-1):pI,last?rL-pL*(joinCount-1):pL,last?rM-pM*(joinCount-1):pM,jR,cap>0?cap:9999999));
    }
  }
  const totalUsed=(rallyOut?.total||0)+joins.reduce((s,j)=>s+j.total,0);
  return{rally:rallyOut,joins,tI,tL,tM,cap,totalUsed,totalAvail:tI+tL+tM,efficiency:tI+tL+tM>0?Math.round(totalUsed/(tI+tL+tM)*100):0};
}

// ── MINI COMPONENTS ───────────────────────────────────────────
function Stars({val,onChange,color='#fbbf24',size=13}){
  return(
    <div style={{display:'flex',gap:1}} onClick={e=>e.stopPropagation()}>
      {[1,2,3,4,5].map(n=>(
        <span key={n} onClick={()=>onChange&&onChange(n===val?n-1:n)}
          style={{fontSize:size,cursor:onChange?'pointer':'default',color:n<=val?color:'#3d2060',lineHeight:1}}>
          {n<=val?'★':'☆'}
        </span>
      ))}
    </div>
  );
}

function HeroCard({hero,state,onToggle,onStars}){
  const g=GRP[hero.g],owned=state?.owned??false,stars=state?.stars??0;
  const imgSrc=getPortrait(hero.id);
  const typeIcon={i:'🛡',l:'⚔',m:'🏹'}[hero.t]||'';
  return(
    <div onClick={()=>onToggle(hero.id)} style={{
      background:owned?g.bg:'#0a0615',border:`1.5px solid ${owned?g.border:'#1d0d30'}`,
      borderRadius:10,padding:'8px 6px',display:'flex',flexDirection:'column',
      alignItems:'center',gap:4,cursor:'pointer',userSelect:'none',
      opacity:owned?1:0.4,boxShadow:owned?`0 2px 8px ${g.accent}22`:'none',
    }}>
      <div style={{width:52,height:52,borderRadius:9,overflow:'hidden',
        border:`2px solid ${owned?g.accent:'#2d1040'}`,flexShrink:0,
        background:`linear-gradient(135deg,${g.bg},${g.accent}55)`,
        display:'flex',alignItems:'center',justifyContent:'center'}}>
        {imgSrc?<img src={imgSrc} alt={hero.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          :<span style={{fontSize:13,fontWeight:900,color:owned?g.accent:'#3d2060'}}>{ini(hero.name)}</span>}
      </div>
      <div style={{fontSize:9,fontWeight:700,color:owned?'#f0e6ff':'#4d2a70',textAlign:'center',lineHeight:1.2}}>
        {hero.name}
      </div>
      <div style={{display:'flex',gap:3}}>
        <span style={{fontSize:7,color:owned?g.accent:'#3d2060',background:owned?`${g.accent}22`:'#0d0920',borderRadius:3,padding:'1px 3px',fontWeight:700}}>{g.label}</span>
        <span style={{fontSize:7,color:'#6d4a90',background:'#0d0920',borderRadius:3,padding:'1px 3px'}}>{typeIcon}</span>
      </div>
      {owned?<Stars val={stars} onChange={v=>onStars(hero.id,v)} color={g.accent} size={12}/>
        :<div style={{fontSize:7,color:'#3d2060'}}>tap to own</div>}
    </div>
  );
}

function MiniHero({heroId,heroStates,label}){
  if(!heroId)return(
    <div style={{background:'#0a0615',border:'1px dashed #2d1a4a',borderRadius:8,padding:'8px 4px',textAlign:'center'}}>
      <div style={{fontSize:8,color:'#6d4a90',marginBottom:2}}>{label}</div>
      <div style={{fontSize:10,color:'#3d2060'}}>—</div>
    </div>
  );
  const hero=HMAP[heroId],g=GRP[hero.g],stars=heroStates?.[heroId]?.stars??0;
  const imgSrc=getPortrait(heroId);
  return(
    <div style={{background:g.bg,border:`1.5px solid ${g.border}`,borderRadius:8,padding:'8px 4px',textAlign:'center',boxShadow:`0 2px 8px ${g.accent}20`}}>
      <div style={{fontSize:8,color:'#9d78c0',marginBottom:4,letterSpacing:'0.06em'}}>{label}</div>
      <div style={{width:36,height:36,borderRadius:7,margin:'0 auto 4px',overflow:'hidden',
        border:`1.5px solid ${g.accent}`,background:`linear-gradient(135deg,${g.bg},${g.accent}55)`,
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:g.accent}}>
        {imgSrc?<img src={imgSrc} alt={hero.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:ini(hero.name)}
      </div>
      <div style={{fontSize:9,fontWeight:700,color:'#f0e6ff',marginBottom:2}}>{hero.name}</div>
      <Stars val={stars} size={9}/>
    </div>
  );
}

function CB({checked,onChange,label,accent='#a855f7'}){
  return(
    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none',
      padding:'9px 12px',background:checked?`${accent}18`:'#0d0920',
      border:`1.5px solid ${checked?accent:'#2d1a4a'}`,borderRadius:9,transition:'all .2s'}}>
      <div style={{width:16,height:16,borderRadius:4,flexShrink:0,
        border:`2px solid ${checked?accent:'#4a2a7a'}`,background:checked?accent:'transparent',
        display:'flex',alignItems:'center',justifyContent:'center'}}>
        {checked&&<svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>}
      </div>
      <span style={{fontSize:12,color:checked?'#f0e6ff':'#9d78c0',fontWeight:checked?600:400}}>{label}</span>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{display:'none'}}/>
    </label>
  );
}

function TroopSection({label,color,data,onChange}){
  const [open,setOpen]=useState(false);
  const total=TIERS.reduce((s,t)=>s+ni(data[t.id]),0);
  const power=TIERS.reduce((s,t)=>s+ni(data[t.id])*t.mult,0);
  const topTier=TIERS.slice().reverse().find(t=>ni(data[t.id])>0);
  return(
    <div style={{background:'#0a0615',border:'1px solid #2d1a4a',borderRadius:10,marginBottom:10,overflow:'hidden'}}>
      <div onClick={()=>setOpen(!open)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',background:open?'#130928':'transparent'}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0}}/>
        <span style={{fontSize:12,fontWeight:700,color:'#f0e6ff',flex:1}}>{label}</span>
        {topTier&&<span style={{fontSize:9,color:topTier.c,background:`${topTier.c}22`,borderRadius:4,padding:'2px 6px',fontWeight:700}}>Top: {topTier.s}</span>}
        <span style={{fontSize:10,color:'#9d78c0'}}>{fmt(total)}</span>
        <span style={{fontSize:10,color,fontWeight:700}}>{fmtP(power)}</span>
        <span style={{color:'#6d4a90',fontSize:11}}>{open?'▲':'▼'}</span>
      </div>
      {open&&(
        <div style={{padding:'0 14px 12px'}}>
          <div style={{fontSize:9,color:'#6d4a90',letterSpacing:'0.07em',margin:'8px 0 6px',fontWeight:700}}>STANDARD TIERS</div>
          {TIERS.filter(t=>!t.fc).map(t=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontSize:9,color:t.c,background:`${t.c}22`,borderRadius:4,padding:'2px 6px',fontWeight:700,minWidth:34,textAlign:'center'}}>{t.s}</span>
              <span style={{fontSize:10,color:'#9d78c0',flex:1}}>{t.label}</span>
              <input type="number" min="0" value={data[t.id]} onChange={e=>onChange({...data,[t.id]:e.target.value})}
                placeholder="0" style={{width:90,background:'#0d0920',border:'1px solid #3d1f60',borderRadius:6,color:'#f0e6ff',fontSize:12,padding:'4px 8px',outline:'none',fontFamily:'inherit'}}/>
              {ni(data[t.id])>0&&<span style={{fontSize:9,color:t.c,minWidth:38,textAlign:'right'}}>{fmtP(ni(data[t.id])*t.mult)}</span>}
            </div>
          ))}
          <div style={{fontSize:9,color:'#f59e0b',letterSpacing:'0.07em',margin:'10px 0 6px',fontWeight:700}}>🔥 FIRE CRYSTAL</div>
          {TIERS.filter(t=>t.fc).map(t=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontSize:9,color:t.c,background:`${t.c}22`,borderRadius:4,padding:'2px 6px',fontWeight:700,minWidth:34,textAlign:'center'}}>{t.s}</span>
              <span style={{fontSize:10,color:'#9d78c0',flex:1}}>{t.label}</span>
              <input type="number" min="0" value={data[t.id]} onChange={e=>onChange({...data,[t.id]:e.target.value})}
                placeholder="0" style={{width:90,background:'#0d0920',border:'1px solid #f59e0b44',borderRadius:6,color:'#fbbf24',fontSize:12,padding:'4px 8px',outline:'none',fontFamily:'inherit'}}/>
              {ni(data[t.id])>0&&<span style={{fontSize:9,color:t.c,minWidth:38,textAlign:'right'}}>{fmtP(ni(data[t.id])*t.mult)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
function BearSquadCalculatorApp(){
  const [tab,setTab]=useState('heroes');
  const [heroStates,setHS]=useState(()=>LS.get('bsc_hero_states')||initHS());
  const [marchCap,setMC]=useState('');
  const [joinCount,setJC]=useState(5);
  const [isRally,setIR]=useState(false);
  const [maxSend,setMS]=useState(false);
  const [infantry,setInf]=useState(()=>LS.get('bsc_troops_inf')||initTroops());
  const [lancer,setLan]=useState(()=>LS.get('bsc_troops_lan')||initTroops());
  const [marksman,setMark]=useState(()=>LS.get('bsc_troops_mark')||initTroops());
  const [rallyRatio,setRR]=useState({inf:5,lan:5,mark:90});
  const [joinRatio,setJR]=useState({inf:10,lan:10,mark:80});
  const [rallyOverride,setRO]=useState({s1:null,s2:null,s3:null});
  const [pickerSlot,setPicker]=useState(null);
  const [submitted,setSubmitted]=useState(false);

  // Load setup from localStorage
  useEffect(()=>{
    const s=LS.get('bsc_setup');
    if(s){setMC(s.marchCap||'');setJC(s.joinCount||5);setIR(s.isRally||false);setMS(s.maxSend||false);setRR(s.rallyRatio||{inf:5,lan:5,mark:90});setJR(s.joinRatio||{inf:10,lan:10,mark:80});}
  },[]);

  // Auto-save
  useEffect(()=>{LS.set('bsc_hero_states',heroStates);},[heroStates]);
  useEffect(()=>{LS.set('bsc_troops_inf',infantry);},[infantry]);
  useEffect(()=>{LS.set('bsc_troops_lan',lancer);},[lancer]);
  useEffect(()=>{LS.set('bsc_troops_mark',marksman);},[marksman]);
  useEffect(()=>{LS.set('bsc_setup',{marchCap,joinCount,isRally,maxSend,rallyRatio,joinRatio});},[marchCap,joinCount,isRally,maxSend,rallyRatio,joinRatio]);

  const toggleOwned=useCallback(id=>setHS(p=>({...p,[id]:{...p[id],owned:!p[id]?.owned}})),[]);
  const setStars=useCallback((id,s)=>setHS(p=>({...p,[id]:{...p[id],stars:s}})),[]);

  const ownedCount=useMemo(()=>Object.values(heroStates).filter(s=>s?.owned).length,[heroStates]);
  const recs=useMemo(()=>recommendAll(heroStates,isRally,joinCount,rallyOverride),[heroStates,isRally,joinCount,rallyOverride]);
  const dist=useMemo(()=>calcDistribution(infantry,lancer,marksman,marchCap,isRally,joinCount,rallyRatio,joinRatio),[infantry,lancer,marksman,marchCap,isRally,joinCount,rallyRatio,joinRatio]);

  const grouped=useMemo(()=>{const m={};HEROES.forEach(h=>{if(!m[h.g])m[h.g]=[];m[h.g].push(h);});return m;},[]);
  const totalPower=useMemo(()=>TIERS.reduce((s,t)=>s+ni(infantry[t.id])*t.mult+ni(lancer[t.id])*t.mult+ni(marksman[t.id])*t.mult,0),[infantry,lancer,marksman]);

  const iStyle={width:'100%',boxSizing:'border-box',background:'#0a0615',border:'1.5px solid #3d1f60',borderRadius:8,color:'#f0e6ff',fontSize:14,fontWeight:600,padding:'9px 12px',outline:'none',fontFamily:'inherit'};
  const j1Locked=new Set(['jessie','jasser','seo_yoon','philly']);

  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0d0918,#080512)',fontFamily:"'Nunito','Century Gothic',sans-serif",color:'#f0e6ff',paddingBottom:40}}>
      {/* Header */}
      <div style={{background:'linear-gradient(90deg,#130924,#0d0618,#130924)',borderBottom:'1px solid #2d1a4a',padding:'12px 16px',position:'sticky',top:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 4px 14px rgba(245,158,11,.35)'}}>🐻</div>
          <div>
            <div style={{fontSize:16,fontWeight:900}}>Bear Squad Calculator</div>
            <div style={{fontSize:9,color:'#7c5fa0'}}>{ownedCount}/65 heroes · {fmtP(totalPower)} power</div>
          </div>
        </div>
        <button onClick={()=>{setHS(initHS());setInf(initTroops());setLan(initTroops());setMark(initTroops());setSubmitted(false);}} style={{background:'transparent',border:'1px solid #3d1f60',color:'#7c5fa0',borderRadius:8,padding:'5px 12px',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Reset</button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',background:'#0d0918',borderBottom:'1px solid #2d1a4a',padding:'0 12px',position:'sticky',top:62,zIndex:190}}>
        {[{id:'heroes',l:'🦸 Heroes'},{id:'setup',l:'⚙️ Setup'},{id:'results',l:'📊 Results'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:'transparent',border:'none',cursor:'pointer',padding:'11px 14px',fontSize:11,fontWeight:700,fontFamily:'inherit',color:tab===t.id?'#e879f9':'#7c5fa0',borderBottom:`2px solid ${tab===t.id?'#e879f9':'transparent'}`}}>{t.l}</button>
        ))}
      </div>

      <div style={{maxWidth:700,margin:'0 auto',padding:'18px 14px'}}>

        {/* ── HEROES TAB ── */}
        {tab==='heroes'&&(
          <div>
            <div style={{background:'#1a0b35',border:'1px solid #3d1f60',borderRadius:12,padding:'12px 16px',marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:14,fontWeight:800}}>Hero Roster</div>
                <div style={{fontSize:11,color:'#7c5fa0'}}>Tap to own · tap ★ to set stars · 🛡 Infantry · ⚔ Lancer · 🏹 Marksman</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:20,fontWeight:900,color:'#e879f9'}}>{ownedCount}<span style={{fontSize:11,color:'#6d4a90'}}>/65</span></div>
              </div>
            </div>
            {GROUPS.map(gid=>{
              const heroes=grouped[gid];if(!heroes)return null;
              const g=GRP[gid];const ownedInG=heroes.filter(h=>heroStates[h.id]?.owned).length;
              return(
                <div key={gid} style={{marginBottom:20}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,borderBottom:`1px solid ${g.border}44`,paddingBottom:6}}>
                    <div style={{background:g.accent,borderRadius:5,padding:'2px 9px',fontSize:10,fontWeight:900,color:'#fff'}}>{g.label}</div>
                    <span style={{fontSize:10,color:'#6d4a90'}}>{ownedInG}/{heroes.length} owned</span>
                    {ownedInG>0&&<button onClick={()=>{const u={};heroes.forEach(h=>{u[h.id]={...heroStates[h.id],owned:false};});setHS(p=>({...p,...u}));}} style={{marginLeft:'auto',background:'transparent',border:'none',color:'#4d2a70',fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>clear</button>}
                    <button onClick={()=>{const u={};heroes.forEach(h=>{u[h.id]={...heroStates[h.id],owned:true};});setHS(p=>({...p,...u}));}} style={{background:`${g.accent}22`,border:`1px solid ${g.accent}66`,borderRadius:6,color:g.accent,fontSize:9,fontWeight:700,padding:'2px 8px',cursor:'pointer',fontFamily:'inherit'}}>✓ All</button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))',gap:7}}>
                    {heroes.map(h=><HeroCard key={h.id} hero={h} state={heroStates[h.id]} onToggle={toggleOwned} onStars={setStars}/>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SETUP TAB ── */}
        {tab==='setup'&&(
          <div>
            <div style={{background:'linear-gradient(145deg,#160d2e,#110821)',border:'1.5px solid #3d1f60',borderRadius:16,padding:'20px',marginBottom:14,boxShadow:'0 4px 20px rgba(0,0,0,.4)'}}>
              <div style={{fontSize:14,fontWeight:800,marginBottom:16}}>⚙️ Squad Role</div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:'#9d78c0',letterSpacing:'0.08em',fontWeight:700,marginBottom:5}}>MARCH CAPACITY</div>
                <input type="number" min="0" value={marchCap} onChange={e=>setMC(e.target.value)} placeholder="e.g. 1200000" style={iStyle}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:12}}>
                <CB checked={isRally} onChange={v=>{setIR(v);if(!v)setMS(false);}} label="Rally Throw Squad — I'm opening the rally" accent="#f59e0b"/>
                <CB checked={maxSend} onChange={v=>{setMS(v);if(v)setIR(true);}} label="Max Send on Rally — fill to march capacity" accent="#f59e0b"/>
              </div>
              <div style={{fontSize:10,color:'#9d78c0',letterSpacing:'0.08em',fontWeight:700,marginBottom:7}}>JOIN SQUAD COUNT</div>
              <div style={{display:'flex',gap:8}}>
                {[4,5,6].map(v=>(
                  <button key={v} onClick={()=>setJC(v)} style={{flex:1,padding:'10px 0',fontFamily:'inherit',cursor:'pointer',background:joinCount===v?'linear-gradient(135deg,#7c3aed,#a855f7)':'#0d0920',border:`1.5px solid ${joinCount===v?'#a855f7':'#2d1a4a'}`,borderRadius:9,color:joinCount===v?'#fff':'#6d4a90',fontSize:18,fontWeight:900}}>{v}</button>
                ))}
              </div>
            </div>

            <div style={{background:'linear-gradient(145deg,#13092a,#0f0620)',border:'1.5px solid #3d1f60',borderRadius:16,padding:'20px',marginBottom:14,boxShadow:'0 4px 20px rgba(0,0,0,.4)'}}>
              <div style={{fontSize:14,fontWeight:800,marginBottom:4}}>💥 Troop Composition</div>
              <div style={{fontSize:11,color:'#6d4a90',marginBottom:14}}>Expand each type · T1–T10 standard · FC1–FC10 Fire Crystal</div>
              <TroopSection label="Infantry" color="#c084fc" data={infantry} onChange={setInf}/>
              <TroopSection label="Lancer" color="#e879f9" data={lancer} onChange={setLan}/>
              <TroopSection label="Marksman" color="#fb923c" data={marksman} onChange={setMark}/>
              <div style={{background:'#0a0615',border:'1px solid #2d1a4a',borderRadius:10,padding:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,color:'#7c5fa0'}}>Total Combat Power</span>
                <span style={{fontSize:18,fontWeight:900,color:'#a855f7'}}>{fmtP(totalPower)}</span>
              </div>
            </div>

            <div style={{background:'linear-gradient(145deg,#13092a,#0f0620)',border:'1.5px solid #3d1f60',borderRadius:16,padding:'20px',marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:800,marginBottom:14}}>📊 Troop Ratios</div>
              {[{label:'RALLY LEAD RATIO',ratio:rallyRatio,setR:setRR,accent:'#f59e0b',show:isRally},{label:'JOIN SQUADS RATIO',ratio:joinRatio,setR:setJR,accent:'#a855f7',show:true}].filter(r=>r.show).map(({label,ratio,setR,accent})=>{
                const sum=ni(ratio.mark)+ni(ratio.lan)+ni(ratio.inf);
                const valid=sum===100;
                return(
                  <div key={label} style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <div style={{fontSize:10,color:'#9d78c0',letterSpacing:'0.07em',fontWeight:700}}>{label}</div>
                      <div style={{fontSize:10,fontWeight:700,color:valid?'#34d399':'#ef4444'}}>{sum}% {valid?'✓':`← needs ${100-sum}% more`}</div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                      {[{k:'mark',l:'Marksmen',c:'#fb923c'},{k:'lan',l:'Lancers',c:'#e879f9'},{k:'inf',l:'Infantry',c:'#c084fc'}].map(({k,l,c})=>(
                        <div key={k}>
                          <div style={{fontSize:9,color:c,fontWeight:700,marginBottom:4}}>{l} %</div>
                          <div style={{display:'flex',alignItems:'center',gap:3}}>
                            <input type="number" min="0" max="100" value={ratio[k]??''} onChange={e=>setR(p=>({...p,[k]:e.target.value}))}
                              style={{flex:1,background:'#0a0615',border:`1.5px solid ${valid?c+'55':'#ef444455'}`,borderRadius:7,color:c,fontSize:16,fontWeight:800,padding:'7px 8px',outline:'none',fontFamily:'inherit',textAlign:'center'}}/>
                            <span style={{fontSize:11,color:'#6d4a90'}}>%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={()=>{setSubmitted(true);setTab('results');}} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#7c3aed,#a855f7)',border:'none',color:'#fff',fontSize:14,fontWeight:900,letterSpacing:'.04em',borderRadius:10,cursor:'pointer',fontFamily:'inherit'}}>
              🐻 CALCULATE SQUADS
            </button>
          </div>
        )}

        {/* ── RESULTS TAB ── */}
        {tab==='results'&&(
          <div>
            {!submitted?(
              <div style={{textAlign:'center',padding:'40px 20px',color:'#4d2a70',border:'1px dashed #2d1a4a',borderRadius:12}}>
                <div style={{fontSize:24,marginBottom:8}}>📊</div>
                <div>Go to Setup and tap Calculate Squads</div>
              </div>
            ):(
              <>
                {/* Summary */}
                <div style={{background:'#1a0b35',border:'1.5px solid #5b21b6',borderRadius:14,padding:'14px',marginBottom:14,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                  {[{l:'Total Avail',v:fmt(dist.totalAvail),c:'#f0e6ff'},{l:'Troops Used',v:fmt(dist.totalUsed),c:'#a855f7'},{l:'Efficiency',v:`${dist.efficiency}%`,c:'#34d399'},{l:'Squads',v:(isRally?1:0)+joinCount,c:'#f59e0b'}].map(({l,v,c})=>(
                    <div key={l} style={{textAlign:'center'}}>
                      <div style={{fontSize:9,color:'#6d4a90',marginBottom:3,letterSpacing:'0.06em'}}>{l.toUpperCase()}</div>
                      <div style={{fontSize:16,fontWeight:900,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Rally */}
                {isRally&&(
                  <div style={{background:'linear-gradient(145deg,#1e1035,#120b25)',border:'1.5px solid #f59e0b55',borderRadius:14,padding:'14px',marginBottom:10,boxShadow:'0 0 20px rgba(245,158,11,.08)'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                      <div style={{fontSize:13,fontWeight:800,color:'#fbbf24'}}>🐻 Rally Lead</div>
                      {dist.rally&&<div style={{fontSize:12,color:'#f59e0b'}}>{fmt(dist.rally.total)} troops · {dist.rally.fillPct}% fill</div>}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
                      <MiniHero heroId={recs.rally.s1} heroStates={heroStates} label="⚔ Slot 1"/>
                      <MiniHero heroId={recs.rally.s2} heroStates={heroStates} label="🏇 Slot 2"/>
                      <MiniHero heroId={recs.rally.s3} heroStates={heroStates} label="🎯 Slot 3"/>
                    </div>
                    {dist.rally&&(
                      <div style={{background:'#0a0615',borderRadius:8,padding:'10px 12px'}}>
                        {[{l:'🛡 Infantry',v:dist.rally.inf,c:'#c084fc'},{l:'⚔ Lancer',v:dist.rally.lan,c:'#e879f9'},{l:'🏹 Marksman',v:dist.rally.mark,c:'#fb923c'}].map(({l,v,c})=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'2px 0'}}>
                            <span style={{color:c}}>{l}</span><span style={{fontWeight:700}}>{fmt(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Override section */}
                    <div style={{marginTop:10,paddingTop:8,borderTop:'1px solid #2d1a4a'}}>
                      <div style={{fontSize:10,color:'#9d78c0',fontWeight:700,marginBottom:8}}>✏️ OVERRIDE RALLY HEROES</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                        {[{slot:'s1',label:'Slot 1'},{slot:'s2',label:'Slot 2'},{slot:'s3',label:'Slot 3'}].map(({slot,label})=>{
                          const ovId=rallyOverride[slot];const autoId=recs.rally[slot];const displayId=ovId||autoId;
                          const isOpen=pickerSlot===slot;
                          const takenByOther=new Set(['s1','s2','s3'].filter(s=>s!==slot).map(s=>rallyOverride[s]).filter(Boolean));
                          const eligible=HEROES.filter(h=>heroStates[h.id]?.owned&&!j1Locked.has(h.id)&&!takenByOther.has(h.id));
                          return(
                            <div key={slot} style={{position:'relative'}}>
                              <div style={{fontSize:8,color:'#6d4a90',marginBottom:3,textAlign:'center'}}>{label}</div>
                              <div onClick={()=>setPicker(isOpen?null:slot)} style={{border:`1.5px solid ${ovId?'#e879f9':isOpen?'#7c3aed':'#3d1f60'}`,borderRadius:8,padding:'6px 4px',textAlign:'center',cursor:'pointer',background:ovId?'#1a0b35':'#0a0615'}}>
                                {displayId?(()=>{const h=HMAP[displayId],g=GRP[h.g];return(
                                  <div>
                                    <div style={{width:28,height:28,borderRadius:5,margin:'0 auto 3px',overflow:'hidden',border:`1px solid ${g.accent}`,background:`linear-gradient(135deg,${g.bg},${g.accent}55)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:900,color:g.accent}}>
                                      {getPortrait(displayId)?<img src={getPortrait(displayId)} alt={h.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:ini(h.name)}
                                    </div>
                                    <div style={{fontSize:8,color:ovId?'#e879f9':'#9d78c0'}}>{h.name}</div>
                                    {ovId&&<div style={{fontSize:7,color:'#7c3aed'}}>override</div>}
                                  </div>);
                                })():<div style={{color:'#3d2060',fontSize:9,padding:'6px 0'}}>tap to set</div>}
                              </div>
                              {ovId&&<div onClick={()=>setRO(p=>({...p,[slot]:null}))} style={{fontSize:8,color:'#6d4a90',textAlign:'center',marginTop:2,cursor:'pointer'}}>✕ clear</div>}
                              {isOpen&&(
                                <div style={{position:'absolute',top:'100%',left:0,zIndex:999,background:'#130928',border:'1.5px solid #7c3aed',borderRadius:10,padding:8,maxHeight:240,overflowY:'auto',width:180,boxShadow:'0 8px 24px rgba(0,0,0,.7)',marginTop:3}}>
                                  <div onClick={()=>{setRO(p=>({...p,[slot]:null}));setPicker(null);}} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 7px',marginBottom:5,cursor:'pointer',borderRadius:6,background:'#1a0b35',border:'1px solid #5b21b6'}}>
                                    <span style={{fontSize:10,color:'#a855f7',fontWeight:700}}>⚡ Auto (recommended)</span>
                                  </div>
                                  {eligible.map(h=>{const g=GRP[h.g],sel=ovId===h.id;return(
                                    <div key={h.id} onClick={()=>{setRO(p=>({...p,[slot]:h.id}));setPicker(null);}} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 6px',marginBottom:3,borderRadius:6,cursor:'pointer',background:sel?`${g.accent}22`:'#0a0615',border:`1px solid ${sel?g.accent:'#2d1a4a'}`}}>
                                      <div style={{width:22,height:22,borderRadius:4,flexShrink:0,overflow:'hidden',border:`1px solid ${g.accent}`,background:`linear-gradient(135deg,${g.bg},${g.accent}55)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:900,color:g.accent}}>
                                        {getPortrait(h.id)?<img src={getPortrait(h.id)} alt={h.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:ini(h.name)}
                                      </div>
                                      <div><div style={{fontSize:9,fontWeight:700,color:sel?'#f0e6ff':'#9d78c0'}}>{h.name}</div><div style={{fontSize:7,color:g.accent}}>{g.label}</div></div>
                                    </div>
                                  );})}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Join squads */}
                {recs.joins.map((j,i)=>{
                  const d=dist.joins[i]||{inf:0,lan:0,mark:0,total:0,fillPct:0};
                  return(
                    <div key={i} style={{background:'#13092a',border:'1px solid #3d1f60',borderRadius:13,padding:'13px',marginBottom:9}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                        <div style={{fontSize:12,fontWeight:800,color:'#a855f7'}}>🔵 Join {i+1}</div>
                        <div style={{fontSize:11,color:'#6d4a90'}}>{fmt(d.total)} troops · {d.fillPct}% fill</div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:9}}>
                        <MiniHero heroId={j.s1} heroStates={heroStates} label="Slot 1"/>
                        <MiniHero heroId={j.s2} heroStates={heroStates} label="Slot 2"/>
                        <MiniHero heroId={j.s3} heroStates={heroStates} label="Slot 3"/>
                      </div>
                      <div style={{background:'#0a0615',borderRadius:7,padding:'8px 10px'}}>
                        {[{l:'🛡 Infantry',v:d.inf,c:'#c084fc'},{l:'⚔ Lancer',v:d.lan,c:'#e879f9'},{l:'🏹 Marksman',v:d.mark,c:'#fb923c'}].map(({l,v,c})=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:10,padding:'2px 0'}}>
                            <span style={{color:c}}>{l}</span><span style={{fontWeight:700}}>{fmt(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
