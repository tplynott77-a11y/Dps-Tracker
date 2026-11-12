/* The DPS Throne - Team Damage Laboratory
 * Dynamic analysis using the owner's Google Sheets-loaded results only.
 * No test records or private sheet content are embedded in this public file.
 * Missing / inconsistent personal damage never gets invented.
 */
(function(){
'use strict';
const colors={Pyro:'#e98962',Hydro:'#67bde2',Anemo:'#7bc6a9',Electro:'#b58be8',Cryo:'#96d9f5',Dendro:'#92c977',Geo:'#d5ae6d','Multi-element':'#a7b9df',Unknown:'#8995b4'};
const synonyms={'Yae Miko':['Yae'],'Kaedehara Kazuha':['Kazuha'],'Yumemizuki Mizuki':['Mizuki'],'Raiden Shogun':['Raiden'],'Tartaglia':['Childe'],'Wanderer':['Benedict'],'Bennett':['Bennet'],'Bennet':['Bennett'],'Aether':['Traveler']};
const norm=v=>String(v==null?'':v).trim().toLowerCase().replace(/\s+/g,' ');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n===null||n===undefined||!Number.isFinite(Number(n))?'—':Number(n).toLocaleString('en-IE',{maximumFractionDigits:2});
const number=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(String(v).replace(/,/g,'')))?Number(String(v).replace(/,/g,'')):null;
const pct=(value,total)=>total>0?value/total*100:0;
const regexEscape=v=>v.replace(/[.*+?^$()|[\]{}\\]/g,'\\$&');
const people=t=>[t.carry,t.support1,t.support2,t.support3].filter(Boolean).filter((v,i,a)=>a.findIndex(x=>norm(x)===norm(v))===i);
const catalog=()=>Array.isArray(window.DPS_CHARACTER_CATALOG)?window.DPS_CHARACTER_CATALOG:[];
function element(name){
 const alias={'Kazuha':'Kaedehara Kazuha','Yae':'Yae Miko'};
 return catalog().find(c=>norm(c.name)===norm(alias[name]||name))?.element||'Unknown';
}
function aliases(name){return [name,...(synonyms[name]||[])];}
function candidates(notes,who,total,withPercent){
 let matches=[];
 for(const alias of aliases(who)){
  const body='(?:^|[^A-Za-z])'+regexEscape(alias)+'\\s*(?:personal\\s+|individual\\s+)?(?:DMG|damage)?\\s*[:=]?\\s*(\\d{1,3}(?:,\\d{3})+|\\d{4,9})';
  const re=new RegExp(body+(withPercent?'\\s*\\(\\s*(\\d+(?:\\.\\d+)?)%\\s*\\)':'(?!\\d)'),'ig');
  for(const m of String(notes||'').matchAll(re)){
   const damage=number(m[1]),p=withPercent?Number(m[2]):null;
   if(!damage||damage<0||damage>total)continue;
   if(withPercent&&Math.abs(pct(damage,total)-p)>0.4)continue;
   matches.push({amount:damage,at:m.index,kind:withPercent?'percentage':'number'});
  }
 }
 return matches.sort((a,b)=>a.at-b.at);
}
function analyze(test){
 const t=test||{},total=number(t.teamDamage),carryDamage=number(t.carryDamage),names=people(t);
 if(!total||total<=0||!names.length)return {status:'unavailable',total:total||null,entries:[],unattributed:total||null,notes:'The original log does not contain a usable team damage total.'};
 const notes=String(t.notes||'');
 const possible={};
 const supportFields=[['support1','support1Damage'],['support2','support2Damage'],['support3','support3Damage']];
 for(const name of names){
  if(norm(name)===norm(t.carry)&&carryDamage!==null&&carryDamage>=0&&carryDamage<=total){
   possible[name]=carryDamage;
   continue;
  }
  // New structured columns take priority over figures mentioned in historical observations.
  const corresponding=supportFields.find(([key])=>norm(t[key])===norm(name));
  const entered=corresponding?number(t[corresponding[1]]):null;
  if(entered!==null&&entered>=0&&entered<=total){possible[name]=entered;continue;}
  // Legacy runs still work when only their observation text records a breakdown.
  const found=candidates(notes,name,total,true);
  if(found.length)possible[name]=found[0].amount;
 }
 const knownSum=()=>Object.values(possible).reduce((sum,v)=>sum+v,0);
 const tolerance=Math.max(5,total*.00015);
 if(names.length===4&&Object.keys(possible).length!==4){
  // Older notes sometimes supply only unlabelled support damage without percentages.
  // Accept those numbers ONLY if all four values match the recorded team total.
  const tentative={...possible};
  for(const name of names){
   if(tentative[name]!=null)continue;
   const hits=candidates(notes,name,total,false);
   if(hits.length)tentative[name]=hits[0].amount;
  }
  if(Object.keys(tentative).length===4&&Math.abs(Object.values(tentative).reduce((a,b)=>a+b,0)-total)<=tolerance){
   Object.assign(possible,tentative);
  }
 }
 const complete=names.length===4&&Object.keys(possible).length===4&&Math.abs(knownSum()-total)<=tolerance;
 const overage=knownSum()>total+tolerance;
 const amounts=overage?(carryDamage!=null&&carryDamage<=total?{[t.carry]:carryDamage}:{}):possible;
 const entries=names.filter(name=>amounts[name]!==undefined).map(name=>({name,damage:amounts[name],percent:pct(amounts[name],total),element:element(name)}));
 const accounted=entries.reduce((sum,x)=>sum+x.damage,0);
 const unattributed=Math.max(0,total-accounted);
 return {status:complete?'complete':overage?'mismatch':entries.length?'partial':'unavailable',total,entries,unattributed,accounted,notes:complete?'Four individual damage values match the recorded team total.':overage?'Recorded individual values exceed the team total; check the spreadsheet.':'Only explicitly recorded damage is attributed to a character.',verification:t.verification||''};
}
function color(name){return colors[element(name)]||colors.Unknown;}
function card(t,avatar,opts){
 const report=analyze(t),compact=opts?.compact===true;
 const intro='<div class="dmg-card-head"><div><div class="eyebrow">TEAM DAMAGE COMPOSITION</div><h3>'+esc(t.carry||'Unknown')+' · '+esc(t.id||'')+'</h3><div class="dmg-caption">'+esc(t.team||'Unspecified team')+' · '+money(t.duration)+' seconds</div></div><strong class="dmg-total">'+money(report.total)+' <span>DMG</span></strong></div>';
 if(report.status==='unavailable')return '<section class="dmg-panel">'+intro+'<div class="dmg-empty">No verified individual damage breakdown recorded for this test. We will not invent support damage.</div></section>';
 const bar=report.entries.map(e=>'<div class="dmg-segment" style="width:'+Math.max(0,Math.min(e.percent,100)).toFixed(4)+'%;background:'+color(e.name)+'" title="'+esc(e.name)+' · '+money(e.damage)+' ('+e.percent.toFixed(1)+'%)"></div>').join('')
   +(report.unattributed>0?'<div class="dmg-segment muted" style="width:'+pct(report.unattributed,report.total).toFixed(4)+'%" title="Unattributed damage"></div>':'');
 const rows=report.entries.map(e=>'<div class="dmg-member"><div class="dmg-member-person">'+avatar(e.name,true)+'<span class="dmg-name">'+esc(e.name)+'</span></div><div class="dmg-member-data"><span>'+money(e.damage)+'</span><strong style="color:'+color(e.name)+'">'+e.percent.toFixed(1)+'%</strong></div></div>').join('');
 const missing=report.unattributed>0?'<div class="dmg-member unattributed"><div class="dmg-member-person"><span class="dmg-unknown-icon">?</span><span class="dmg-name">Unattributed / not documented</span></div><div class="dmg-member-data"><span>'+money(report.unattributed)+'</span><strong>'+pct(report.unattributed,report.total).toFixed(1)+'%</strong></div></div>':'';
 const better=report.status==='complete'?report.entries.filter(e=>norm(e.name)!==norm(t.carry)&&e.damage>(report.entries.find(x=>norm(x.name)===norm(t.carry))?.damage||0)).sort((a,b)=>b.damage-a.damage):[];
 const surprise=better.length?'<div class="dmg-surprise">⚡ '+esc(better[0].name)+' outdamaged the on-field carry in this run! Damage share does not measure buff or support value.</div>':'';
 const tag=report.status==='complete'?'<span class="badge good">Complete · total validated</span>':report.status==='mismatch'?'<span class="badge bad">Check mismatch in recorded damage</span>':'<span class="badge warn">Partial · other damage unattributed</span>';
 const footer='<div class="dmg-caption">'+tag+' <span class="dmg-source">· Derived from your Google Sheet test record; percentages calculated from total damage</span></div>'+surprise;
 return '<section class="dmg-panel'+(compact?' compact':'')+'">'+intro+'<div class="dmg-stack" aria-label="Team damage split">'+bar+'</div><div class="dmg-members">'+rows+missing+'</div>'+footer+'</section>';
}
function page(tests,selectedId,avatar){
 const all=tests||[];
 const reports=all.map(t=>({t,r:analyze(t)}));
 const done=reports.filter(x=>x.r.status==='complete');
 const partial=reports.filter(x=>x.r.status==='partial');
 const chosen=all.find(t=>t.id===selectedId)||all.find(t=>t.id==='SKI-FUR-N2D-01')||done.slice().sort((a,b)=>Number(b.t.dps)-Number(a.t.dps))[0]?.t||all[0];
 const selector='<div class="filters"><select class="select search" id="damageTest" aria-label="Choose a combat test to analyse">'+all.map(t=>{
   const st=analyze(t).status;
   return '<option value="'+esc(t.id)+'"'+(t.id===chosen?.id?' selected':'')+'>'+esc(t.carry)+' · '+esc(t.id)+' · '+money(t.dps)+' DPS'+(st==='complete'?' · 4/4 recorded':st==='partial'?' · partial':' · no split')+'</option>';
 }).join('')+'</select></div>';
 const common=['SKI-FUR-N2D-01','VES-AET-C6-01','KEQ-AGG-WF01','CHI-BASEMENT-01','MIT-00F','ARL-RAI-CHEV-01'].filter(id=>all.some(t=>t.id===id));
 const picks='<div class="dmg-quick">'+common.map(id=>{const t=all.find(x=>x.id===id);return '<button type="button" class="dmg-quick-btn'+(chosen?.id===id?' selected':'')+'" data-damage-test="'+esc(id)+'">'+avatar(t.carry,true)+'<span>'+esc(t.carry)+'</span><small>'+money(t.dps)+' DPS</small></button>';}).join('')+'</div>';
 const disclaimer='<div class="dmg-disclaimer"><strong>How to read this:</strong> Every bar uses damage from the selected combat run, not character DPS rankings. Individual damage numbers are extracted only when they reconcile to the recorded team total. Any missing breakdown is deliberately labelled unattributed. Comparing separate tests does not isolate buffs, weapons, RNG or rotation changes. The source Google Sheet is read-only.</div>';
 return '<div class="intro"><div class="eyebrow">THE DAMAGE LAB</div><h1 class="page-title">Team Damage Analysis</h1><div class="page-subtitle">Who actually dealt the damage? Four combatants, one total—without confusing team DPS with personal damage.</div></div>'
   +'<div class="dmg-stats"><div class="dmg-stat"><strong>'+all.length+'</strong><span>Recorded tests</span></div><div class="dmg-stat"><strong>'+done.length+'</strong><span>Full 4-character breakdowns</span></div><div class="dmg-stat"><strong>'+partial.length+'</strong><span>Partial breakdowns</span></div></div>'
   +(all.length?selector+card(chosen,avatar,{compact:false})+'<div class="section-head"><h2 class="section-title">Notable Combat Records</h2><div class="section-sub">Jump directly to documented battles</div></div>'+picks+disclaimer:'<div class="dmg-empty">No tests loaded. Connect Google Sheets using Drive Sync, then return here to see your individual-damage analysis.</div>');
}
window.DPSThroneDamage={analyze,card,page};
})();