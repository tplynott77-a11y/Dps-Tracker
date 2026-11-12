/* The DPS Throne — Royal Chronicle & Hall of Records
 * Historical reconstruction from dates + the order of rows in the player's
 * private Test Log. No private results are published in this script.
 * An unknown date cannot be placed chronologically.
 */
(function(){
'use strict';
const esc=v=>String(v===undefined||v===null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v===undefined||v===null||v===''?'—':Number(v).toLocaleString('en-IE',{maximumFractionDigits:1});
const num=v=>v===undefined||v===null||v===''?null:(Number.isFinite(Number(String(v).replace(/,/g,'')))?Number(String(v).replace(/,/g,'')):null);
const key=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ').replace(/^bennet$/,'bennett');
const qualified=t=>Boolean(t&&t.carry&&t.id&&num(t.dps)>0&&(Math.abs(num(t.duration)-60)<0.05||t.id==='MIT-00A'));
const months={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
function dateKey(input){
 if(input===null||input===undefined||input==='')return null;
 if(typeof input==='number'&&Number.isFinite(input)){
  const dt=new Date(Date.UTC(1899,11,30)+Math.round(input)*86400000);
  return !isNaN(dt.getTime())?dt.toISOString().slice(0,10):null;
 }
 const s=String(input).trim();
 let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
 if(m){
  const y=+m[1],mo=+m[2],d=+m[3],dt=new Date(Date.UTC(y,mo-1,d));
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()===mo-1&&dt.getUTCDate()===d?dt.toISOString().slice(0,10):null;
 }
 m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
 if(m){const y=+m[3],mo=+m[2],d=+m[1],dt=new Date(Date.UTC(y,mo-1,d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()===mo-1&&dt.getUTCDate()===d?dt.toISOString().slice(0,10):null;}
 m=s.match(/^(\d{1,2})\s+([a-z]{3,9})\s+(\d{4})$/i);
 if(m){const mo=months[m[2].slice(0,3).toLowerCase()],y=+m[3],d=+m[1];if(mo!==undefined){const dt=new Date(Date.UTC(y,mo,d));return dt.getUTCMonth()===mo&&dt.getUTCDate()===d?dt.toISOString().slice(0,10):null}}
 return null;
}
function niceDate(iso){
 if(!iso)return 'Date not recorded';
 return new Intl.DateTimeFormat('en-IE',{timeZone:'UTC',day:'numeric',month:'short',year:'numeric'}).format(new Date(iso+'T12:00:00Z'));
}
function build(tests){
 const records=Array.isArray(tests)?tests:[];
 const undated=records.filter(t=>qualified(t)&&!dateKey(t.date));
 const eligible=records.map((test,index)=>({test,index,date:dateKey(test.date)})).filter(x=>qualified(x.test)&&x.date);
 eligible.sort((a,b)=>a.date.localeCompare(b.date)||a.index-b.index);
 let incumbent=null,peak=-Infinity;
 const milestones=[];
 for(const row of eligible){
  const dps=num(row.test.dps);
  if(dps<=peak)continue;
  const prior=incumbent;
  const event={test:row.test,date:row.date,index:row.index,dps,previous:prior?.test||null,previousDps:prior?.dps||null,
   type:!prior?'first':key(row.test.carry)===key(prior.test.carry)?'defence':'takeover',
   delta:prior?dps-prior.dps:0,
   deltaPct:prior?100*(dps-prior.dps)/prior.dps:null};
  milestones.push(event);
  peak=dps;incumbent=event;
 }
 const monarchs=new Map;
 for(const event of milestones){
  if(!monarchs.has(key(event.test.carry)))monarchs.set(key(event.test.carry),{name:event.test.carry,first:event.date,records:0,coronations:0,highest:event.dps});
  const m=monarchs.get(key(event.test.carry));
  m.records++;m.highest=event.dps;
  if(event.type!=='defence')m.coronations++;
 }
 return {milestones,monarchs:[...monarchs.values()],coronations:milestones.filter(x=>x.type==='takeover').length,
  defences:milestones.filter(x=>x.type==='defence').length,undatedCount:undated.length,eligibleCount:eligible.length,
  current:milestones[milestones.length-1]||null};
}
function recordBook(tests){
 const rows=Array.isArray(tests)?tests:[];
 const valid=rows.filter(qualified);
 const sorted=valid.slice().sort((a,b)=>num(b.dps)-num(a.dps));
 const leader=sorted[0]||null;
 const challenger=sorted.find(x=>leader&&key(x.carry)!==key(leader.carry))||null;
 const biggestHit=rows.filter(t=>num(t.highestHit)!==null).reduce((b,t)=>!b||num(t.highestHit)>num(b.highestHit)?t:b,null);
 const appearances=new Map;
 for(const t of rows){
  const people=[t.carry,t.support1,t.support2,t.support3].filter(Boolean),seen=new Set;
  for(const person of people){
   const id=key(person);if(seen.has(id))continue;seen.add(id);
   const record=appearances.get(id)||{name:person,count:0,support:0,carry:0};
   record.count++;if(key(t.carry)===id)record.carry++;else record.support++;
   appearances.set(id,record);
  }
 }
 const mostPlayed=[...appearances.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
 let personal=null,support=null,carry=null,largestSupportShare=null;
 const analyzer=window.DPSThroneDamage;
 if(analyzer&&typeof analyzer.analyze==='function'){
  for(const t of rows){
   const report=analyzer.analyze(t);
   if(report.status==='mismatch'||report.status==='unavailable')continue;
   for(const entry of report.entries){
    if(entry.damage===null||entry.damage===undefined||!Number.isFinite(entry.damage))continue;
    const ref={test:t,name:entry.name,damage:entry.damage,percent:entry.percent,role:key(t.carry)===key(entry.name)?'carry':'support'};
    if(!personal||ref.damage>personal.damage)personal=ref;
    if(ref.role==='carry'&&(!carry||ref.damage>carry.damage))carry=ref;
    if(ref.role==='support'&&(!support||ref.damage>support.damage))support=ref;
    if(ref.role==='support'&&report.status==='complete'&&(!largestSupportShare||ref.percent>largestSupportShare.percent))largestSupportShare=ref;
   }
  }
 }
 const basement=valid.slice().sort((a,b)=>num(a.dps)-num(b.dps))[0]||null;
 // Completed records only: do not assign an end date to the reigning current record.
 const milestones=build(rows).milestones;
 const pastMilestones=milestones.slice(0,-1).map((ev,i)=>{
  const next=milestones[i+1];
  const days=Math.max(0,Math.round((Date.parse(next.date+'T00:00:00Z')-Date.parse(ev.date+'T00:00:00Z'))/86400000));
  return {event:ev,next,days};
 });
 const longestRetired=pastMilestones.sort((a,b)=>b.days-a.days||a.event.index-b.event.index)[0]||null;
 return {leader,challenger,biggestHit,mostPlayed:mostPlayed.filter(x=>x.count===mostPlayed[0]?.count),personal,carry,support,largestSupportShare,basement,longestRetired};
}
function graph(milestones){
 if(!milestones.length)return '';
 const pts=milestones.map((event,i)=>({x:45+(milestones.length===1?.5:i/(milestones.length-1))*620,y:155-(event.dps/Math.max(...milestones.map(x=>x.dps))*120),event}));
 const steps=pts.map((p,i)=>i===0?'M'+p.x+' '+p.y:'H'+p.x+' V'+p.y).join(' ');
 const grad='royalGold'+milestones.length;
 const bars=pts.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="5" fill="#f2cf8b" stroke="#614929" stroke-width="2"><title>'+esc(p.event.test.carry)+' · '+fmt(p.event.dps)+' team DPS · '+niceDate(p.event.date)+'</title></circle>').join('');
 return '<svg class="royal-chart" viewBox="0 0 710 185" role="img" aria-label="Progression of historical throne record DPS"><defs><linearGradient id="'+grad+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1c778" stop-opacity=".2"/><stop offset="1" stop-color="#f1c778" stop-opacity="0"/></linearGradient></defs>'
 +[0,1,2,3].map(i=>'<line x1="45" y1="'+(35+i*40)+'" x2="670" y2="'+(35+i*40)+'" stroke="#38435a" stroke-dasharray="4 5"/>').join('')
 +'<path d="'+steps+'" fill="none" stroke="#f0c77f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+bars+'</svg>';
}
function render(args){
 const tests=args.tests||[],avatar=args.avatar,pageHead=args.pageHead;
 const history=build(tests),book=recordBook(tests);
 const current=history.current;
 const latest=current?.test?.carry||'Not yet recorded';
 const filter=args.filter||'all';
 const events=history.milestones.filter(x=>filter==='all'||(filter==='coronations'&&x.type!=='defence')||(filter==='defences'&&x.type==='defence')).slice().reverse();
 const intro=pageHead('THE ROYAL CHRONICLE','History of the Crown','A timeline reconstructed from dated Test Log results—who led, who took the crown, and every new all-time team DPS record.');
 const heading='<section class="royal-hero"><div><div class="eyebrow">♛ THE REIGNING RECORD HOLDER</div><div class="royal-lead">'+(current?avatar(latest):'♛')+'<div><div class="royal-lead-name">'+esc(latest)+'</div><div class="royal-lead-score">'+fmt(current?.dps)+' <span>TEAM DPS</span></div><div class="royal-lead-sub">'+(current?'Record first logged '+niceDate(current.date)+' · '+esc(current.test.id):'Connect Google Sheets to restore the crown')+'</div></div></div></div><span class="royal-crown" aria-hidden="true">♛</span></section>';
 const stats='<div class="royal-stats">'+[
 ['Record milestones',history.milestones.length,'All-time benchmark improvements'],
 ['Crown changes',history.coronations,'Different carry takes the lead'],
 ['Record extensions',history.defences,'Leader beats their own record'],
 ['Recorded monarchs',history.monarchs.length,'Distinct historical leaders']
 ].map(([h,n,s])=>'<div class="royal-stat"><strong>'+fmt(n)+'</strong><span>'+esc(h)+'</span><small>'+esc(s)+'</small></div>').join('')+'</div>';
 const timeline=events.map(ev=>{
  const title=ev.type==='first'?'Earliest dated leader':ev.type==='takeover'?'THE CROWN CHANGES HANDS':'RECORD DEFENDED';
  const subtitle=ev.type==='takeover'?'Dethroned '+ev.previous.carry:ev.type==='defence'?'Extended the existing record':'First dated benchmark in this archive';
  return '<article class="royal-event '+ev.type+'"><div class="royal-event-icon">'+avatar(ev.test.carry,true)+'</div><div class="royal-event-body"><div class="royal-event-upper"><span class="royal-event-type">'+title+'</span><time>'+niceDate(ev.date)+'</time></div>'
   +'<div class="royal-event-name">'+esc(ev.test.carry)+'</div><div class="royal-event-sub">'+esc(subtitle)+' · '+esc(ev.test.team||'Team unknown')+'</div>'
   +'<div class="royal-event-bottom"><strong>'+fmt(ev.dps)+' TEAM DPS</strong>'+(ev.deltaPct!==null?'<span class="royal-gain">+'+fmt(ev.delta)+' DPS ('+ev.deltaPct.toFixed(1)+'%)</span>':'<span>First recorded crown benchmark</span>')+'</div>'
   +'<button class="royal-testlink" data-test="'+esc(ev.test.id)+'" type="button">View source test '+esc(ev.test.id)+' ↗</button></div></article>';
 }).join('');
 const warning='<div class="royal-caveat"><strong>Archive reconstruction, not a literal reign clock.</strong> '
 +fmt(history.undatedCount)+' eligible test'+(history.undatedCount===1?' has':'s have')+' no recorded date and cannot be positioned historically. Same-day test ordering follows the spreadsheet, not known clock times. Only qualifying 60-second results (plus the explicitly approved MIT-00A exception) can set a record. A higher personal damage number is not team DPS.</div>';
 const timelineHtml='<div class="royal-timeline-area"><div class="section-head"><h2 class="section-title">Royal Succession</h2><span class="section-sub">Based on '+fmt(history.eligibleCount)+' dated qualifying tests</span></div>'
 +'<div class="royal-filter"><label for="royalFilter">Show:</label><select id="royalFilter" class="select"><option value="all"'+(filter==='all'?' selected':'')+'>All milestones</option><option value="coronations"'+(filter==='coronations'?' selected':'')+'>Coronations</option><option value="defences"'+(filter==='defences'?' selected':'')+'>Record defences</option></select></div>'
 +'<div class="royal-timeline">'+(timeline||'<p class="dmg-empty">No dated milestone matches this filter.</p>')+'</div>'+warning+'</div>';
 const record=(glyph,title,value,info,character,test)=>'<div class="royal-record"><div class="royal-record-title">'+glyph+' '+esc(title)+'</div><div class="royal-record-number">'+esc(value)+'</div><div class="royal-record-name">'+(character?avatar(character,true):'')+'<span>'+esc(info||'—')+'</span></div>'
 +(test?'<button class="royal-testlink" data-test="'+esc(test.id)+'" type="button">Open '+esc(test.id)+' ↗</button>':'')+'</div>';
 const most=book.mostPlayed||[];
 const titleRecords='<div class="section-head"><h2 class="section-title">The Royal Record Book</h2><span class="section-sub">Updates with your next Drive Sync</span></div>'
 +'<div class="royal-record-grid">'+
 record('⚔','Biggest single hit',fmt(book.biggestHit&&num(book.biggestHit.highestHit))+' DMG',book.biggestHit?.carry+' · '+(book.biggestHit?.team||'Team unknown'),book.biggestHit?.carry,book.biggestHit)+
 record('✦','Highest personal damage',fmt(book.personal?.damage)+' DMG',(book.personal?.name||'Unknown')+' · '+(book.personal?.role||'Role unknown'),book.personal?.name,book.personal?.test)+
 record('◇','Highest support damage',fmt(book.support?.damage)+' DMG',(book.support?.name||'Unknown')+' in '+(book.support?.test?.carry||'Unknown')+' team',book.support?.name,book.support?.test)+
 record('▣','Most appearances',most.length?fmt(most[0].count)+' tests':'—',most.map(m=>m.name).join(' & ')||'Unknown',most[0]?.name,null)+
 record('★','Largest support share',book.largestSupportShare?book.largestSupportShare.percent.toFixed(1)+'%':'—',(book.largestSupportShare?.name||'Unknown')+' of team damage',book.largestSupportShare?.name,book.largestSupportShare?.test)+
 record('♟','The Basement™',fmt(book.basement&&num(book.basement.dps))+' DPS',(book.basement?.carry||'Unknown')+' · lowest qualifying recorded team benchmark',book.basement?.carry,book.basement)+
 record('⌛','Longest superseded DPS record',book.longestRetired?fmt(book.longestRetired.days)+' days':'—',book.longestRetired?book.longestRetired.event.test.carry+' · '+fmt(book.longestRetired.event.dps)+' DPS until '+niceDate(book.longestRetired.next.date):'Not enough dated milestones',book.longestRetired?.event?.test?.carry,book.longestRetired?.event?.test)+
 '</div><p class="note">Basement records reflect the builds and tests you logged—not overall character strength. Personal damage records use only documented character-level contributions; unknown values remain unknown. The longest superseded record counts calendar days between dated benchmarks, not exact reign hours.</p>';
 const challenger=book.leader&&book.challenger?'<div class="royal-challenger"><div class="eyebrow">THE NEXT THREAT TO THE CROWN</div><div class="royal-challenger-body">'+avatar(book.challenger.carry)+'<div><strong>'+esc(book.challenger.carry)+'</strong><span>'+fmt(book.challenger.dps)+' DPS · best qualifying run</span></div><div class="royal-gap"><strong>'+fmt(num(book.leader.dps)-num(book.challenger.dps))+'</strong><span>DPS behind</span></div></div><div class="royal-challenger-foot">To surpass '+esc(book.leader.carry)+'’s record, a challenger needs at least '+fmt(num(book.leader.dps)+1)+' team DPS.</div></div>':'';
 return intro+heading+stats+(history.milestones.length?'<div class="royal-graphbox"><h2 class="section-title">The Record Staircase</h2>'+graph(history.milestones)+'<div class="royal-graphlabels"><span>'+niceDate(history.milestones[0].date)+'</span><span>'+niceDate(history.current.date)+'</span></div></div>':'<div class="dmg-empty">Your Chronicle will appear after a successful Google Sheets sync. No private test data is embedded in this public website.</div>')
 +challenger+timelineHtml+titleRecords;
}
function preview(tests,avatar){
 const history=build(tests);
 if(!history.current)return '<div class="royal-preview"><div class="eyebrow">♛ Royal Chronicle</div><p class="note">Connect Google Sheets to uncover the history of the throne.</p><button class="btn btn-secondary" data-go="chronicle" type="button">Open Chronicle →</button></div>';
 const last=history.current;
 return '<div class="royal-preview"><div><div class="eyebrow">♛ ROYAL CHRONICLE</div><h2>Every crown has a history.</h2><p>'+esc(history.monarchs.length)+' recorded monarchs · '+history.coronations+' dethronings · '+history.defences+' record extensions</p></div><div class="royal-preview-right">'+avatar(last.test.carry,true)+'<div><strong>'+esc(last.test.carry)+'</strong><small>Current record: '+fmt(last.dps)+' DPS</small></div><button class="btn btn-gold" type="button" data-go="chronicle">Read the Chronicle →</button></div></div>';
}
window.DPSRoyalChronicle={dateKey,build,recordBook,render,preview};
})();