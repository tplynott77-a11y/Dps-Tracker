(function farmingApp(){
'use strict';
const SHEET='1zdi-5X6wL8J-6saDVOOxZLT5O7d52Gm5e0sFgP1p4Mc';
const CLIENT='568556229750-ap39oagpjs6gu432tfghgupujfukdooq.apps.googleusercontent.com';
const STORAGE='bankruptcy-archives-farming-cache-v1';
const API='https://sheets.googleapis.com/v4/spreadsheets/';
const SOURCE='https://docs.google.com/spreadsheets/d/'+SHEET+'/edit';
const SCOPES='https://www.googleapis.com/auth/spreadsheets.readonly';
const tabs=[
['priorities',"'⚡ Priority View'!A4:F95"],
['projects',"'Projects'!A4:E110"],
['requirements',"'Requirements'!A5:J850"],
['inventory',"'Inventory'!A4:C800"],
['field',"'Resin-Free Objectives'!A5:J175"],
['characters',"'Characters'!A4:G112"],
['dashboard',"'Dashboard'!A4:E9"]
];
const state={data:null,lastSync:null,source:'none',working:false,error:'',selected:0,search:'',filter:'all',stockSearch:'',fieldSearch:'',stockShow:60,resinFilter:'active'};
const esc=v=>String(v===null||v===undefined?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const val=v=>String(v===null||v===undefined?'':v).trim();
const num=v=>{const x=Number(val(v).replace(/,/g,''));return v===undefined||v===null||val(v)===''||!Number.isFinite(x)?null:x};
const fmt=v=>num(v)===null?'—':Number(v).toLocaleString('en-IE',{maximumFractionDigits:0});
const lower=v=>val(v).toLowerCase();
function rows(values){return Array.isArray(values)?values:[]}
function parse(values){
 const res={};
 for(let k=0;k<tabs.length;k++){res[tabs[k][0]]=rows(values[k]||[])}
 if(!res.priorities.length||!res.projects.length||!res.inventory.length)throw Error('Farming workbook returned incomplete tables. Existing cache retained.');
 const priorities=res.priorities.slice(1).filter(r=>num(r[0])!==null&&r[1]).map(r=>({rank:num(r[0]),goal:val(r[1]),status:val(r[2]),target:val(r[3]),focus:val(r[4]),order:num(r[5])})).sort((a,b)=>a.rank-b.rank);
 const projects=res.projects.slice(1).filter(r=>r[0]).map(r=>({goal:val(r[0]),rank:num(r[1]),status:val(r[2]),target:val(r[3]),focus:val(r[4])}));
 const requirements=res.requirements.slice(1).filter(r=>r[0]&&r[3]).map(r=>({goal:val(r[0]),priority:num(r[1]),status:val(r[2]),material:val(r[3]),required:num(r[4]),stock:num(r[5]),reserved:num(r[6]),available:num(r[7]),needed:num(r[8]),method:val(r[9])}));
 const inventory=res.inventory.slice(1).filter(r=>r[0]).map(r=>({key:val(r[0]),planning:num(r[1]),scan:num(r[2])}));
 const field=res.field.slice(1).filter(r=>r[1]&&r[2]).map(r=>({priority:num(r[0]),goal:val(r[1]),task:val(r[2]),material:val(r[3]),required:num(r[4]),stock:num(r[5]),needed:num(r[6]),type:val(r[7]),method:val(r[8]),progress:val(r[9])}));
 const characters=res.characters.slice(1).filter(r=>r[0]).map(r=>({name:val(r[0]),level:val(r[1]),asc:val(r[2]),cons:val(r[3]),na:val(r[4]),skill:val(r[5]),burst:val(r[6])}));
 const dashboard=res.dashboard;
 const counters={};for(const r of dashboard){if(r[0]&&r[1])counters[val(r[0])]=num(r[1]);if(r[3]&&r[4])counters[val(r[3])]=num(r[4]);}
 if(!priorities.length||!projects.length)throw Error('Cannot identify active farming project queue; no data changed.');
 return {priorities,projects,requirements,inventory,field,characters,counters};
}
function load(){
 try{const c=JSON.parse(localStorage.getItem(STORAGE)||'null');if(c?.data&&Array.isArray(c.data.priorities)){state.data=c.data;state.lastSync=c.when||null;state.source='cache'}}catch(e){}
}
load();
function statLabel(){return state.lastSync?'Last synced '+new Date(state.lastSync).toLocaleString('en-IE',{dateStyle:'medium',timeStyle:'short'}):'Not connected yet'}
function statusChip(status){const s=lower(status);return '<span class="farm-status '+(s==='active'?'active':s==='done'?'done':'later')+'">'+esc(status||'Unknown')+'</span>'}
function badge(tag,value,sub){return '<div class="farm-metric"><span>'+esc(tag)+'</span><strong>'+esc(value)+'</strong><small>'+esc(sub||'')+'</small></div>'}
function head(ey,title,desc){return '<div class="farm-pagehead"><div class="farm-eyebrow">'+esc(ey)+'</div><h1>'+esc(title)+'</h1><p>'+esc(desc)+'</p></div>'}
function connectBanner(){return '<div class="farm-connect"><span class="farm-connect-icon">☁</span><div><strong>'+(!state.data?'Connect your Farming Tracker':'Refresh Farming Tracker')+'</strong><p>Read the latest project priorities, material stock and resin-free objectives from your existing private Google Sheet. No spreadsheet edits or public dataset.</p><small>'+esc(statLabel())+(state.error?' · '+esc(state.error):'')+'</small></div><button type="button" class="farm-btn primary" data-farm-sync="1" '+(state.working?'disabled':'')+'>'+(state.working?'Syncing…':'☁ '+(state.data?'Refresh':'Connect Google'))+'</button></div>'}
function portrait(name){const catalog=window.DPS_CHARACTER_CATALOG||[];const n=val(name).split(' — ')[0];const c=catalog.find(x=>lower(x.name)===lower(n));return c&&/^[a-z0-9_]+$/i.test(c.icon)?'<span class="farm-portrait"><img loading="lazy" src="https://enka.network/ui/'+c.icon+'.png" alt="" onerror="this.style.display=\'none\'"></span>':'<span class="farm-portrait">'+esc(n.slice(0,1))+'</span>'}
function operationCard(){
 let best=null;try{const tests=window.DPSThrone?.getTests?.()||[];for(const t of tests){if(t.carry==='Skirk'&&Number(t.dps)>Number(best?.dps||0)&&Math.abs(Number(t.duration)-60)<0.01)best=t}}catch(e){}
 const record=best?fmt(best.dps)+' DPS':'Connect DPS to see the latest';
 return '<div class="farm-op"><div class="farm-op-symbol">✦</div><div><div class="farm-eyebrow">CROSS-DEPARTMENT OBJECTIVE</div><h3>Operation: 100K Skirk</h3><p>Performance target in the DPS Throne. Farming objectives stay in your existing project queue—not reordered by this card.</p><div class="farm-op-detail">Current measured record <strong>'+esc(record)+'</strong> · Target <strong>100,000 DPS</strong></div></div><button type="button" class="farm-btn secondary" data-farm-nav="home">Open DPS Throne</button></div>';
}
function queueCard(p){
 const req=state.data?.requirements.filter(r=>r.goal===p.goal&&r.needed!==null&&r.needed>0&&lower(r.status)==='active')||[];
 return '<button class="farm-queue-card" type="button" data-farm-item="'+esc(p.rank)+'"><span class="farm-rank">#'+fmt(p.rank)+'</span><div class="farm-queue-body"><strong>'+esc(p.goal)+'</strong><p>'+esc(p.target||p.focus||'Upgrade planned')+'</p><div><span class="farm-category">⚒ '+esc(p.focus||'Resource gathering')+'</span> '+statusChip(p.status)+(req.length?'<span class="farm-category">'+req.length+' active shortages</span>':'')+'</div></div><span class="farm-arrow">›</span></button>';
}
function overview(){
 if(!state.data)return '<div class="farm-surface">'+head('FARMING DEPARTMENT','Farming Operations','Your softer, quieter space for planning upgrades and managing Teyvat resources.')+connectBanner()+operationCard()+'</div>';
 const d=state.data,active=d.projects.filter(p=>lower(p.status)==='active').length,done=d.projects.filter(p=>lower(p.status)==='done').length,short=d.requirements.filter(r=>lower(r.status)==='active'&&r.needed>0).length;
 const inv=d.inventory;
 const mora=inv.find(i=>i.key==='Mora')?.planning;
 const wit=inv.find(i=>i.key==='HerosWit')?.planning;
 return '<div class="farm-surface">'+head('RESOURCE COMMAND','Farming Operations','Plan today, farm efficiently, and never lose sight of the next upgrade.')
 +connectBanner()+'<div class="farm-metrics">'+badge('Active projects',fmt(active),'Current project queue')+badge('Requirements outstanding',fmt(short),'Active shortfall lines')+badge('Planning Mora',fmt(mora),'Last logged, not a live wallet')+badge("Hero’s Wit",fmt(wit),'Last planning count')+'</div>'
 +operationCard()
 +'<div class="farm-sectionhead"><div><div class="farm-eyebrow">YOUR NEXT MOVES</div><h2>Priority Queue</h2><p>Automatically ordered by the source spreadsheet</p></div><button type="button" class="farm-textlink" data-farm-nav="farm-projects">All projects →</button></div>'
 +'<div class="farm-stack">'+d.priorities.slice(0,5).map(queueCard).join('')+'</div>'
 +'<div class="farm-dual"><div class="farm-shortcuts"><div class="farm-eyebrow">RESOURCE INTELLIGENCE</div><h3>Material shortages</h3><p>See exactly which known requirement lines still need materials. Stock numbers are planning snapshots, not live inventory.</p><div class="farm-shortcut-actions"><button type="button" class="farm-btn secondary" data-farm-nav="farm-materials">Explore materials →</button><button type="button" class="farm-btn secondary" data-farm-nav="farm-resin">Resin planner →</button></div></div><div class="farm-shortcuts"><div class="farm-eyebrow">NO RESIN REQUIRED</div><h3>Overworld objectives</h3><p>'+fmt(d.field.filter(f=>f.needed>0).length)+' gathering lines with shortages in your farming tracker.</p><button type="button" class="farm-btn secondary" data-farm-nav="farm-field">Explore objectives →</button></div></div>'
 +'<p class="farm-fineprint">'+fmt(done)+' completed projects retained in the source Sheet · '+fmt(d.characters.length)+' roster entries · '+fmt(d.inventory.length)+' inventory keys loaded. No materials have been deducted by this website.</p></div>';
}
function projectDetail(p){
 if(!p)return '';
 const d=state.data;const req=d.requirements.filter(r=>r.goal===p.goal);
 const cards=req.filter(r=>r.needed!==null&&r.needed>0);
 return '<section class="farm-detail"><div class="farm-detail-head"><div class="farm-eyebrow">SELECTED PROJECT · '+esc(p.status)+'</div><h3>'+esc(p.goal)+'</h3><p>'+esc(p.target||'')+'</p><p><strong>Farm focus:</strong> '+esc(p.focus||'Not specified')+'</p></div>'
 +'<div class="farm-detail-stats">'+badge('Required materials',req.length,'Tracked lines')+badge('Shortages',cards.length,'Based on existing calculations')+'</div>'
 +(req.length?'<div class="farm-table-wrap"><table><thead><tr><th>Material</th><th>Required</th><th>Available</th><th>Still needed</th><th>Where to farm</th></tr></thead><tbody>'+req.map(r=>'<tr><td>'+esc(r.material)+'</td><td>'+fmt(r.required)+'</td><td>'+fmt(r.available)+'</td><td class="'+(r.needed>0?'farm-shortage':'')+'">'+fmt(r.needed)+'</td><td>'+esc(r.method)+'</td></tr>').join('')+'</tbody></table></div>':'<p class="farm-empty">There are no matching material requirements for this exact project name in the source Sheet.</p>')
 +'<p class="farm-fineprint">Done project requirements may retain historical shortages. This is a read-only planning view.</p></section>';
}
function projects(){
 if(!state.data)return '<div class="farm-surface">'+head('WORKSTREAMS','Project Queue','Connect your private Sheet to show your active and later upgrades.')+connectBanner()+'</div>';
 const d=state.data,selected=d.priorities.find(p=>p.rank===state.selected)||d.priorities[0];
 const list=d.priorities.filter(p=>(state.filter==='all'||lower(p.status)===state.filter)&&lower(p.goal+' '+p.target+' '+p.focus).includes(lower(state.search)));
 const fields='<div class="farm-filters"><input id="farmSearch" class="farm-input" type="search" value="'+esc(state.search)+'" placeholder="Search upgrades or characters…" aria-label="Search projects"><select id="farmFilter" class="farm-input" aria-label="Filter project status"><option value="all">All live projects</option>'+['active','later'].map(x=>'<option value="'+x+'"'+(state.filter===x?' selected':'')+'>'+x.charAt(0).toUpperCase()+x.slice(1)+'</option>').join('')+'</select></div>';
 return '<div class="farm-surface">'+head('UPGRADE PLANNER','Project Queue','A live reflection of your Google Sheets priority order, not a replacement for it.')+connectBanner()+fields
 +'<div class="farm-project-layout"><div class="farm-stack">'+(list.length?list.map(queueCard).join(''):'<p class="farm-empty">No matching projects.</p>')+'</div>'+projectDetail(selected)+'</div></div>';
}
function materials(){
 if(!state.data)return '<div class="farm-surface">'+head('RESOURCE LEDGER','Material Inventory','Sync your private source spreadsheet to load inventory.')+connectBanner()+'</div>';
 const d=state.data,items=d.inventory.filter(x=>lower(x.key).includes(lower(state.stockSearch))),more=items.length>state.stockShow;
 const req=d.requirements.filter(r=>lower(r.status)==='active'&&r.needed>0).sort((a,b)=>(b.needed||0)-(a.needed||0));
 return '<div class="farm-surface">'+head('RESOURCE LEDGER','Materials & Inventory','Separate current planning stock from older scan counts. Unverified quantities remain estimates until checked in-game.')+connectBanner()
 +'<div class="farm-metrics">'+badge('Material keys',fmt(d.inventory.length),'Present in source inventory')+badge('Active shortages',fmt(req.length),'Requirement lines')+badge('Unverified counts',fmt(d.counters['Unverified stock entries']),'Source dashboard estimate')+'</div>'
 +'<div class="farm-sectionhead"><h2>Inventory Catalogue</h2></div><div class="farm-filters"><input id="farmInventorySearch" class="farm-input" type="search" placeholder="Search any material key…" value="'+esc(state.stockSearch)+'" aria-label="Search inventory"></div>'
 +'<div class="farm-table-wrap"><table><thead><tr><th>Material key</th><th>Planning stock</th><th>Older scan</th></tr></thead><tbody>'+items.slice(0,state.stockShow).map(x=>'<tr><td><strong>'+esc(x.key)+'</strong></td><td>'+fmt(x.planning)+'</td><td class="farm-muted">'+fmt(x.scan)+'</td></tr>').join('')+'</tbody></table></div>'
 +(more?'<button class="farm-btn secondary" data-farm-more="1">Load more materials ('+fmt(items.length-state.stockShow)+' remaining)</button>':'')
 +'<div class="farm-sectionhead"><h2>Active Material Bottlenecks</h2><p>'+fmt(req.length)+' lines</p></div><div class="farm-table-wrap"><table><thead><tr><th>Project</th><th>Material</th><th>Needed</th><th>Acquisition</th></tr></thead><tbody>'+req.slice(0,35).map(x=>'<tr><td>'+esc(x.goal)+'</td><td>'+esc(x.material)+'</td><td class="farm-shortage">'+fmt(x.needed)+'</td><td>'+esc(x.method)+'</td></tr>').join('')+'</tbody></table></div>'
 +'<p class="farm-fineprint">All counts are taken from the existing planning worksheet. The website does not deduct stock, reinterpret old scans as live totals, or claim a material is definitely absent when unverified.</p></div>';
}
function resin(){
 if(!state.data)return '<div class="farm-surface">'+head('PLANNING DESK','Resin Operations','Connect Google Sheets to review material bottlenecks and domain opportunities.')+connectBanner()+'</div>';
 const d=state.data,priorities=new Map(d.priorities.map(p=>[p.goal,p]));
 const all=d.requirements.filter(r=>r.needed!==null&&r.needed>0&&lower(r.status)===state.resinFilter)
  .sort((a,b)=>(priorities.get(a.goal)?.rank??999)-(priorities.get(b.goal)?.rank??999)||b.needed-a.needed);
 const resinFields=all.filter(r=>/domain|boss|ley line/i.test(r.method));
 const others=all.filter(r=>!/domain|boss|ley line/i.test(r.method));
 const group=new Map;
 for(const r of resinFields){const activity=r.method||'Unspecified source';if(!group.has(activity))group.set(activity,[]);group.get(activity).push(r)}
 const options=[['active','Active goals'],['later','Later goals']];
 const item=r=>'<div class="farm-resin-row"><div><strong>'+esc(r.material)+'</strong><small>'+esc(r.goal)+'</small></div><span class="farm-shortage">'+fmt(r.needed)+' needed</span></div>';
 return '<div class="farm-surface">'+head('PLANNING DESK','Resin Operations','Know which documented shortages deserve your resin. This is a priority-led plan, not a prediction of random material drops.')
  +connectBanner()+'<div class="farm-filters"><label class="farm-resin-caption" for="farmResinFilter">Planning lane</label><select id="farmResinFilter" class="farm-input">'+options.map(([id,text])=>'<option value="'+id+'"'+(state.resinFilter===id?' selected':'')+'>'+text+'</option>').join('')+'</select></div>'
  +'<div class="farm-metrics">'+badge('Resin activity shortages',fmt(resinFields.length),'Material lines')+badge('Other outstanding items',fmt(others.length),'Overworld, Mora, EXP, etc.')+badge('Relevant activity types',fmt(group.size),'From the source Sheet')+'</div>'
  +'<div class="farm-sectionhead"><div><div class="farm-eyebrow">SOURCE-VERIFIED ACQUISITION</div><h2>Priority Farming Activities</h2><p>Schedules shown below are copied from your sheet, not live domain-availability checks</p></div></div>'
  +(resinFields.length?'<div class="farm-activity-grid">'+[...group].map(([method,items])=>'<article class="farm-activity"><div class="farm-activity-top"><span>♧</span><strong>'+esc(method)+'</strong><small>'+items.length+' outstanding lines</small></div>'+items.map(item).join('')+'</article>').join('')+'</div>':'<div class="farm-empty">No qualifying resin-domain or boss shortages are currently listed in this project lane.</div>')
  +'<div class="farm-sectionhead"><h2>Other Bottlenecks</h2></div><div class="farm-activity-grid">'+[...new Map(others.map(r=>[r.method,r.method])).keys()].map(method=>'<article class="farm-activity"><div class="farm-activity-top"><span>◎</span><strong>'+esc(method||'Other acquisition')+'</strong></div>'+others.filter(r=>r.method===method).slice(0,16).map(item).join('')+'</article>').join('')+'</div>'
  +'<p class="farm-fineprint">These needs are copied from the existing Requirements formulas. Stock reservations and crafting conversions remain governed by that Sheet. No resin, currency or materials are spent here. Estimated claims or farming days are deliberately omitted until drop-rate assumptions are verified.</p></div>';
}
function field(){
 if(!state.data)return '<div class="farm-surface">'+head('RESIN-FREE OBJECTIVES','Overworld Fieldwork','Connect the tracker to see tasks and collection goals.')+connectBanner()+'</div>';
 const d=state.data,arr=d.field.filter(r=>lower(r.goal+' '+r.task+' '+r.material+' '+r.type).includes(lower(state.fieldSearch))).sort((a,b)=>(a.priority??999)-(b.priority??999));
 return '<div class="farm-surface">'+head('RESIN-FREE OBJECTIVES','Overworld Fieldwork','The gathering list from your spreadsheet: local specialties, enemy drops, fishing and other resin-free work.')+connectBanner()
 +'<div class="farm-filters"><input id="farmFieldSearch" class="farm-input" type="search" placeholder="Search collection tasks…" aria-label="Search fieldwork" value="'+esc(state.fieldSearch)+'"></div><div class="farm-field-grid">'+arr.map(r=>'<article class="farm-field-card"><div class="farm-field-top"><span class="farm-status later">'+esc(r.type||'Gather')+'</span><span>Priority '+fmt(r.priority)+'</span></div><h3>'+esc(r.task)+'</h3><p>'+esc(r.goal)+'</p><div class="farm-field-figs"><strong>'+fmt(r.needed)+'</strong><span>remaining · '+fmt(r.stock)+' / '+fmt(r.required)+' planning stock</span></div><small>'+esc(r.method)+'</small></article>').join('')+'</div>'
 +'<p class="farm-fineprint">Tasks are read-only mirrors. Completion controls remain in the original Google Sheet; clearing tasks here would not update that source.</p></div>';
}
function characters(){
 if(!state.data)return '<div class="farm-surface">'+head('CHARACTER READINESS','Character Roster','Connect to review the recorded character builds and levels.')+connectBanner()+'</div>';
 const d=state.data,items=d.characters.filter(c=>lower(c.name).includes(lower(state.search)));
 return '<div class="farm-surface">'+head('CHARACTER READINESS','Character Roster','Your last documented levels, constellations and talents. These values reflect the source scan, not guaranteed current builds.')+connectBanner()
 +'<div class="farm-filters"><input type="search" id="farmSearch" class="farm-input" aria-label="Search characters" placeholder="Find a character…" value="'+esc(state.search)+'"></div><div class="farm-character-grid">'+items.map(c=>'<div class="farm-char">'+portrait(c.name)+'<div><h3>'+esc(c.name)+'</h3><p>Lv '+esc(c.level)+' · C'+esc(c.cons)+' · Asc '+esc(c.asc)+'</p><span>Talents '+esc([c.na,c.skill,c.burst].join(' / '))+'</span></div></div>').join('')+'</div><p class="farm-fineprint">Character tab is a historical scan with later progress recorded elsewhere. For the latest verified upgrade, check Projects and its source evidence.</p></div>';
}
function render(page){
 let html=page==='farm-projects'?projects():page==='farm-materials'?materials():page==='farm-resin'?resin():page==='farm-field'?field():page==='farm-characters'?characters():overview();
 const nav=[['farming','Command Centre'],['farm-projects','Projects'],['farm-materials','Inventory'],['farm-resin','Resin Planner'],['farm-field','Fieldwork'],['farm-characters','Characters']];
 return '<section class="farm-root"><div class="farm-deptbar"><span>💸 BANKRUPTCY ARCHIVES</span><small>FARMING OPERATIONS · READ-ONLY MASTER SYNC</small><a href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">Open Source Sheet ↗</a></div><nav class="farm-subnav">'+nav.map(([id,label])=>'<button type="button" class="'+(page===id?'selected':'')+'" data-farm-nav="'+id+'">'+label+'</button>').join('')+'</nav>'+html+'</section>';
}
function hub(){
 let d=state.data;let count=d?.priorities?.length||0;let latest='';
 try{const tests=window.DPSThrone?.getTests?.()||[];let top=tests.filter(x=>x.duration===60||x.id==='MIT-00A').sort((a,b)=>Number(b.dps)-Number(a.dps))[0];if(top)latest=top.carry+' · '+fmt(top.dps)+' DPS'}catch(e){}
 return '<section class="archives-hub"><div class="archives-heading"><div class="farm-eyebrow">ONE WORLD · TWO DEPARTMENTS</div><h1>The Bankruptcy Archives<span>✦</span></h1><p>Your Teyvat command centre. Performance records and farming logistics, connected through your private Google Sheets.</p></div><div class="archives-cards"><button class="archives-tile throne" data-go="home" type="button"><span class="archives-symbol">♛</span><span class="archives-kicker">COMBAT INTELLIGENCE</span><strong>The DPS Throne</strong><small>Leaderboards, records, character profiles, team analysis and the Royal Chronicle.</small><span class="archives-tag">'+esc(latest||'Connect DPS to load records')+'</span><span class="archives-enter">Enter the Throne →</span></button><button class="archives-tile agriculture" data-go="farming" type="button"><span class="archives-symbol">🌿</span><span class="archives-kicker">LOGISTICS & UPGRADES</span><strong>Farming Operations</strong><small>Project priorities, resource shortages, overworld tasks and character readiness.</small><span class="archives-tag">'+(d?fmt(count)+' queued projects · '+fmt(d.inventory.length)+' inventory keys':'Private sheet · sign in to view')+'</span><span class="archives-enter">Open Farming →</span></button></div><div class="archives-cross"><span>✦</span><div><strong>Operation 100K Skirk</strong><p>One goal, two departments. Track damage performance in the Throne and material upgrades in Farming Operations—without mixing up your original project priorities.</p></div><button data-go="farming" type="button" class="farm-btn secondary">Plan upgrades →</button></div><p class="farm-fineprint">Both spreadsheets retain their original sharing permissions. The website is a read-only viewer, with browser-local caching after authorised sync.</p></section>';
}
async function fetchSync(accessToken){
 if(state.working)return;
 state.working=true;state.error='';refresh();
 const query=tabs.map((x,i)=>(i===0?'?':'&')+'ranges='+encodeURIComponent(x[1])).join('')+'&valueRenderOption=FORMATTED_VALUE';
 const url=API+encodeURIComponent(SHEET)+'/values:batchGet'+query;
 try{
 const r=await fetch(url,{headers:{Authorization:'Bearer '+accessToken},cache:'no-store'});
 let json=await r.json();
 if(!r.ok)throw Error(json?.error?.message||'Google Sheets API returned '+r.status);
 if(!json.valueRanges||json.valueRanges.length!==tabs.length)throw Error('Incomplete spreadsheet response.');
 const parsed=parse(json.valueRanges.map(x=>x.values||[]));
 state.data=parsed;state.lastSync=new Date().toISOString();state.source='live';state.error='';
 try{localStorage.setItem(STORAGE,JSON.stringify({when:state.lastSync,data:parsed}))}catch(e){state.error='Browser storage unavailable: data is available until this page closes.'}
 }catch(e){state.error=String(e?.message||e);state.source=state.data?'cache':'none'}
 finally{state.working=false;refresh()}
}
function freshToken(){
 try{const old=window.BankruptcyGoogleSession?.getToken?.();if(old)return old}catch(e){}
 return null;
}
function connect(){
 if(state.working)return;
 if(location.protocol==='file:'){state.error='Google sign-in requires the HTTPS site, not a local file.';refresh();return}
 const token=freshToken();if(token){fetchSync(token);return}
 if(!window.google?.accounts?.oauth2?.initTokenClient){state.error='Google sign-in has not loaded. Check the connection and retry.';refresh();return}
 const oauth=window.google.accounts.oauth2.initTokenClient({client_id:CLIENT,scope:SCOPES,callback:response=>{
  if(!response?.access_token){state.error='Google permission was not granted.';refresh();return}
  fetchSync(response.access_token);
 },error_callback:e=>{state.error='Google sign-in closed or failed: '+String(e?.type||'unknown');refresh()}});
 oauth.requestAccessToken();
}
function refresh(){const nav=window.BankruptcyArchives?.currentPage?.();if(nav&&nav.startsWith('farm'))window.BankruptcyArchives?.render?.();else if(nav==='archives')window.BankruptcyArchives?.render?.();}
function maybeRefresh(){if(state.working)return;if(state.source==='none'&&freshToken())fetchSync(freshToken());}
document.addEventListener('click',e=>{
 const nav=e.target.closest('[data-farm-nav]');if(nav){state.search='';window.BankruptcyArchives?.navigate?.(nav.dataset.farmNav);return}
 if(e.target.closest('[data-farm-sync]')){connect();return}
 const character=e.target.closest('[data-farm-character]');if(character){const aliases={'Kaedehara Kazuha':'Kazuha','Raiden Shogun':'Raiden','Tartaglia':'Childe','Yumemizuki Mizuki':'Mizuki'};state.search=aliases[character.dataset.farmCharacter]||character.dataset.farmCharacter;window.BankruptcyArchives?.navigate?.('farm-projects');return}
 const item=e.target.closest('[data-farm-item]');if(item){state.selected=num(item.dataset.farmItem);window.BankruptcyArchives?.navigate?.('farm-projects');return}
 if(e.target.closest('[data-farm-more]')){state.stockShow+=100;refresh();return}
});
document.addEventListener('input',e=>{
 let id=e.target.id;
 if(!['farmSearch','farmFieldSearch','farmInventorySearch'].includes(id))return;
 const value=e.target.value,pos=e.target.selectionStart;
 if(id==='farmSearch')state.search=value;else if(id==='farmFieldSearch')state.fieldSearch=value;else state.stockSearch=value;
 refresh();const node=document.getElementById(id);if(node){node.focus();try{node.setSelectionRange(pos,pos)}catch(e){}}
});
document.addEventListener('change',e=>{if(e.target.id==='farmFilter'){state.filter=e.target.value;refresh()}if(e.target.id==='farmResinFilter'){state.resinFilter=e.target.value;refresh()}});
window.FarmingOperations={render,hub,sync:connect,maybeRefresh,getData:()=>state.data,getStatus:()=>({source:state.source,lastSync:state.lastSync})};
})();
