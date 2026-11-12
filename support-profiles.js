/* The DPS Throne — character performance across carry and support roles.
 * Live derived statistics only: never bundles any private Test Log records.
 * Personal DPS here is damage / actual test duration, not the game's team DPS.
 */
(function(){
'use strict';
const normalized = s => String(s??'').trim().toLowerCase().replace(/\s+/g,' ');
const aliased = {bennet:'bennett',kazuha:'kaedehara kazuha',childe:'tartaglia',traveler:'aether',traveller:'aether',yae:'yae miko',raiden:'raiden shogun'};
const key = s => aliased[normalized(s)] || normalized(s);
const toNumber = v => (v===undefined||v===null||v==='')?null:(Number.isFinite(Number(String(v).replace(/,/g,'')))?Number(String(v).replace(/,/g,'')):null);
const qualified = t => Math.abs(toNumber(t.duration)-60)<0.05 || t.id==='MIT-00A';
function appearances(name,tests){
 const character=key(name),reporter=window.DPSThroneDamage;
 if(!reporter || !Array.isArray(tests))return [];
 return tests.flatMap((t,index)=>{
   let role=null;
   if(key(t.carry)===character)role='carry';
   else if(['support1','support2','support3'].some(field=>key(t[field])===character))role='support';
   if(!role)return [];
   const analysis=reporter.analyze(t);
   // The Damage Lab already reconciles complete breakdowns and conservatively
   // exposes documented partial records. Never use the team score as personal DPS.
   const contribution=analysis.status==='mismatch'||analysis.status==='unavailable'
     ?null:analysis.entries.find(e=>key(e.name)===character);
   const damage=contribution?toNumber(contribution.damage):null;
   const duration=toNumber(t.duration);
   const personalDps=damage!==null&&duration!==null&&duration>0?damage/duration:null;
   return [{test:t,order:index,role,damage,personalDps,duration,teamDps:toNumber(t.dps),share:contribution?.percent??null,status:analysis.status}];
 });
}
function metrics(name,tests){
 const list=appearances(name,tests);
 const carry=list.filter(a=>a.role==='carry'),support=list.filter(a=>a.role==='support');
 const recorded=list.filter(a=>a.damage!==null);
 const highest=(items,get)=>items.length?items.reduce((best,item)=>get(item)>get(best)?item:best):null;
 const personalBest=highest(recorded,a=>a.damage);
 const personalDpsBest=highest(recorded.filter(a=>a.personalDps!==null),a=>a.personalDps);
 const bestTeam=highest(list.filter(a=>qualified(a.test)&&a.teamDps!==null),a=>a.teamDps);
 const last=[...list].filter(a=>a.test.date).sort((a,b)=>String(b.test.date).localeCompare(String(a.test.date))||b.order-a.order)[0]||null;
 return {list,carry,support,recorded,personalBest,personalDpsBest,bestTeam,last};
}
function render({name,tests,avatar,pageHead,table,fmt,esc,datefmt,chartSvg,verifyBadge}){
 const m=metrics(name,tests);
 const ranked=new Map();
 for(const t of tests){
   if(!qualified(t)||toNumber(t.dps)===null)continue;
   const k=key(t.carry);
   if(!ranked.has(k)||Number(t.dps)>Number(ranked.get(k).dps))ranked.set(k,t);
 }
 const ranking=[...ranked.values()].sort((a,b)=>Number(b.dps)-Number(a.dps));
 const rank=ranking.findIndex(t=>key(t.carry)===key(name)), bestCarry=rank>=0?ranking[rank]:null;
 const carryBest=[...m.carry].sort((a,b)=>(b.test.date||'').localeCompare(a.test.date||'')||b.order-a.order)[0]?.test||null;
 const latestRole=m.last?.role==='carry'?'On-field carry':m.last?.role==='support'?'Support':'No participation';
 const num=v=>v===null?'—':fmt(v);
 const kpi=(label,value,sub)=>'<div class="kpi"><div class="kpi-label">'+esc(label)+'</div><div class="kpi-number profile-value">'+esc(value)+'</div><div class="kpi-sub">'+esc(sub)+'</div></div>';
 const record=(title,value,desc,item,foot)=>{
   const id=item?.test?.id;
   return '<div class="profile-record"><div class="profile-record-heading">'+esc(title)+'</div><div class="profile-record-value">'+esc(value)+'</div><div class="profile-record-desc">'+esc(desc)+'</div>'
   +(id?'<button class="btn btn-secondary profile-test-link" data-test="'+esc(id)+'">View test '+esc(id)+' ↗</button>':'')
   +(foot?'<p class="note">'+esc(foot)+'</p>':'')+'</div>';
 };
 const personal=m.personalBest;
 const dps=m.personalDpsBest;
 const team=m.bestTeam;
 const bestRecords='<div class="profile-record-grid">'+
 record('Highest documented personal damage',num(personal?.damage??null)+' DMG',personal?((personal.role==='support'?'As support':'As carry')+' · '+esc(personal.test.team||'Unknown team')+' · '+fmt(personal.duration)+'s'):'No individual damage documented',personal)+
 record('Highest calculated personal DPS',dps?fmt(dps.personalDps)+' DPS':'—',dps?'Personal damage ÷ '+fmt(dps.duration)+'s · '+(dps.role==='support'?'support':'carry'):'No personal damage and duration recorded',dps,'Calculated from one test, not an independently measured in-game statistic.')+
 record('Highest-performing team',team?fmt(team.teamDps)+' team DPS':'—',team?(team.role==='support'?'Supporting '+team.test.carry:'As on-field carry')+' · '+(team.test.team||'Unnamed team'):'No qualifying team test',team,team&&team.damage===null?'Personal damage was not documented in this team’s run.':null)+
 '</div>';
 const history=[...m.list].sort((a,b)=>String(b.test.date||'').localeCompare(String(a.test.date||''))||b.order-a.order);
 const chronological=[...m.recorded].sort((a,b)=>String(a.test.date||'').localeCompare(String(b.test.date||''))||a.order-b.order);
 const chart=chronological.length?chartSvg(chronological.map(a=>({...a.test,personalDamage:a.damage,id:a.test.id})), 'personalDamage'):'<p class="muted">No individual damage recorded yet.</p>';
 const build=carryBest?
   [['Latest on-field team',carryBest.team],['Constellation',carryBest.constellation],['Character level',carryBest.level],['Weapon',carryBest.weapon],['Talents',carryBest.talents],['Supports',[carryBest.support1,carryBest.support2,carryBest.support3].filter(Boolean).join(' / ')||null]].map(([label,value])=>'<div class="detail-cell" style="margin-bottom:7px"><div class="detail-label">'+esc(label)+'</div><div class="detail-value">'+esc(value??'Unknown')+'</div></div>').join(''):
   '<div class="dmg-empty">No on-field build has been logged for this character. Support stats and equipment are not recorded in the Test Log, so they are not inferred from another character’s build.</div>';
 const rows=history.map(a=>{
   const t=a.test;
   return '<tr data-test="'+esc(t.id)+'"><td><strong>'+esc(t.id)+'</strong></td><td>'+datefmt(t.date)+'</td><td><span class="badge '+(a.role==='support'?'':'warn')+'">'+(a.role==='support'?'Support':'Carry')+'</span></td><td>'+esc(t.carry)+'</td><td>'+esc(t.team||'Unknown')+'</td><td class="gold num">'+fmt(t.dps)+'</td><td class="num">'+num(a.damage)+'</td><td class="num">'+num(a.personalDps)+'</td><td class="num">'+fmt(t.duration)+'s</td><td>›</td></tr>';
 }).join('');
 const sub='See actual personal damage in both carry and support roles. Team DPS and personal DPS are deliberately kept separate.';
 const summary=m.list.length?m.carry.length+' carry run'+(m.carry.length===1?'':'s')+' · '+m.support.length+' support appearance'+(m.support.length===1?'':'s'):'No test appearances recorded';
 const badge=rank>=0?'<span class="badge warn">ON-FIELD RANK #'+(rank+1)+'</span>':m.support.length?'<span class="badge good">SUPPORT CONTRIBUTOR</span>':'<span class="badge">NOT YET TESTED</span>';
 return pageHead('CHARACTER DOSSIER','Character Profiles',sub)
 +'<div class="filters"><select id="profileSelect" class="select" style="min-width:240px">'+[...new Set([...((window.DPS_CHARACTER_CATALOG||[]).map(c=>c.name)),...tests.flatMap(t=>[t.carry,t.support1,t.support2,t.support3].filter(Boolean))])].sort().map(c=>'<option value="'+esc(c)+'"'+(c===name?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select>'+badge+'</div>'
 +'<div class="profile-summary">'+avatar(name)+'<div><h2>'+esc(name)+'</h2><div class="muted">'+esc(summary)+'</div><div style="margin-top:8px"><span class="tag">'+esc(m.last?latestRole+' in '+m.last.test.id:'No team records')+'</span></div></div></div>'
 +'<div class="kpi-grid">'+kpi('Peak personal damage',num(personal?.damage??null),personal?personal.role==='support'?'As support':'As on-field carry':'Not documented')
 +kpi('Peak personal DPS',num(dps?.personalDps??null),dps?'Calculated, per test':'No measured damage')
 +kpi('Best team DPS',num(team?.teamDps??null),team?'Team-wide, '+(team.role==='support'?'support':'carry')+' role':'No qualifying run')
 +kpi('Team appearances',fmt(m.list.length),m.support.length+' support · '+m.carry.length+' carry')
 +'</div>'
 +'<div class="section-head"><div><h2 class="section-title">Personal Records & Best Teams</h2><div class="section-sub">Separate records with their original test IDs</div></div></div>'+bestRecords
 +'<div class="split-panel" style="margin-top:20px"><div class="panel"><div class="panel-title">PERSONAL DAMAGE HISTORY</div>'+chart+'<div class="note">'+m.recorded.length+' of '+m.list.length+' runs have documented individual damage. The chart shows damage per run, not team DPS.</div></div><div class="panel"><div class="panel-title">LAST RECORDED ON-FIELD BUILD</div>'+build+'</div></div>'
 +(bestCarry&&window.DPSThroneDamage?window.DPSThroneDamage.card(bestCarry,avatar,{compact:true}):'')
 +'<div class="section-head"><div><h2 class="section-title">Full Participation History</h2><div class="section-sub">Includes supporting other carries, even when personal damage is unknown</div></div></div>'
 +table(['Test ID','Date','Role','On-field carry','Team','Team DPS','Personal DMG','Personal DPS*','Duration',''],rows)
 +'<p class="note" style="margin-top:14px">* Personal DPS = recorded character damage ÷ test duration; not a separate combat-screen statistic. Unknown damage is shown as —. The highest-performing team is based on qualifying runs and measures the entire team, including other members.</p>';
}
function gallerySummary(name,tests){
 const m=metrics(name,tests);
 if(!m.list.length)return {tested:false,sub:'Not yet recorded'};
 const role=m.carry.length?m.carry.length+' carry':'';
 const supports=m.support.length?m.support.length+' support':'';
 const short=[role,supports].filter(Boolean).join(' · ');
 const value=m.personalBest?'Peak '+Math.round(m.personalBest.damage).toLocaleString('en-IE')+' personal DMG':m.bestTeam?'Best team '+Math.round(m.bestTeam.teamDps).toLocaleString('en-IE')+' DPS':'No individual DMG yet';
 return {tested:true,sub:short+' · '+value};
}
window.DPSSupportProfiles={appearances,metrics,render,gallerySummary};
})();