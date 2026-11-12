/* Farming build dossiers — private-sheet snapshots and local GOOD imports.
 * No character inventory or user GOOD data is embedded in public GitHub.
 */
(function(){
'use strict';
const STORAGE='bankruptcy-archives-good-equipment-v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=x=>String(x??'').trim();
const norm=x=>val(x).toLowerCase().replace(/[^a-z0-9]/g,'');
const nameParts={TravelerCryo:'Cryo Traveler',KujouSara:'Kujou Sara',YaeMiko:'Yae Miko',RaidenShogun:'Raiden Shogun',KaedeharaKazuha:'Kaedehara Kazuha',YumemizukiMizuki:'Yumemizuki Mizuki',YunJin:'Yun Jin'};
const pretty=x=>val(x).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/\bOf\b/g,'of').replace(/\bThe\b/g,'the').replace(/\bA\b/g,'a').replace(/_/g,' ').trim();
const special={SerenitysCall:"Serenity's Call",CrimsonMoonsSemblance:"Crimson Moon's Semblance",FreedomSworn:"Freedom-Sworn",TheWidsith:"The Widsith",FinaleOfTheDeepGalleries:"Finale of the Deep Galleries",FragmentOfHarmonicWhimsy:"Fragment of Harmonic Whimsy",ViridescentVenerer:"Viridescent Venerer",GoldenTroupe:"Golden Troupe",SongOfDaysPast:"Song of Days Past",HeartOfTheFurnace:"Heart of the Furnace",DisenchantmentInDeepShadow:"Disenchantment in Deep Shadow",WanderersTroupe:"Wanderer's Troupe",TheViridescentHunt:"The Viridescent Hunt",LostPrayerToTheSacredWinds:"Lost Prayer to the Sacred Winds",SurfsUp:"Surf's Up",FavoniusLance:"Favonius Lance"};
const name=x=>special[x]||nameParts[x]||pretty(x)||'Not recorded';
const mainStat=x=>{
 const k=val(x),keys={hp:"HP",atk:"ATK",def:"DEF",hp_:"HP%",atk_:"ATK%",def_:"DEF%",eleMas:"Elemental Mastery",enerRech_:"Energy Recharge",critRate_:"CRIT Rate",critDMG_:"CRIT DMG",heal_:"Healing Bonus",physical_dmg_:"Physical DMG Bonus"};
 if(keys[k])return keys[k];
 if(k.endsWith('_dmg_'))return pretty(k.slice(0,-5))+' DMG Bonus';
 return name(k);
};
const fmt=n=>n===null||n===undefined||n===''?'—':Number(n).toLocaleString('en-IE');
const validLevel=n=>Number.isFinite(Number(n))&&n!==''&&n!==null&&n!==undefined?Number(n):null;
const canon=k=>norm(k).replace(/^travelercyo$/,'travelercryo');
function same(a,b){
 const x=canon(a),y=canon(b);
 if(x===y)return true;
 const aliases={'valeriy':'valeriymrdoor','raiden':'raidenshogun','kazuha':'kaedeharakazuha','mrmrdoor':'valeriymrdoor','cryoaether':'travelercryo','aether':'travelercryo'};
 return aliases[x]===y||aliases[y]===x;
}
function dateValue(x){return /^\d{4}-\d{2}-\d{2}$/.test(val(x))?val(x):''}
let local=null;
try{const raw=JSON.parse(localStorage.getItem(STORAGE)||'null');if(raw&&Array.isArray(raw.characters)&&raw.characters.length<200)local=raw}catch(e){}
function importGood(good,fileName){
 if(!good||good.format!=='GOOD'||!Array.isArray(good.characters)||!Array.isArray(good.weapons)||!Array.isArray(good.artifacts))throw Error('Choose a full GOOD character, weapon and artifact export. Material-only exports cannot populate builds.');
 if(good.characters.length>200||good.weapons.length>2000||good.artifacts.length>10000)throw Error('This file is larger than the supported Genshin equipment snapshot.');
 const tag=String(fileName||'GOOD export').replace(/[^a-zA-Z0-9_. -]/g,'').slice(0,100);
 const m=tag.match(/(\d{4})[_-](\d{2})[_-](\d{2})/);
 const date=m?m[1]+'-'+m[2]+'-'+m[3]:'';
 const characters=good.characters.map(c=>({key:val(c.key),level:validLevel(c.level),constellation:validLevel(c.constellation),talents:c.talent&&[c.talent.auto,c.talent.skill,c.talent.burst].map(x=>validLevel(x)??'?').join('/')||''})).filter(c=>c.key);
 const weapons=good.weapons.filter(w=>w.location).map(w=>({key:val(w.key),owner:val(w.location),level:validLevel(w.level),refinement:validLevel(w.refinement)}));
 const artifacts=good.artifacts.filter(a=>a.location).map(a=>({owner:val(a.location),slot:val(a.slotKey),set:val(a.setKey),main:val(a.mainStatKey),level:validLevel(a.level),substats:(a.substats||[]).slice(0,5).map(v=>[val(v.key),v.value])}));
 const candidate={date,filename:tag,characters,weapons,artifacts,importedAt:new Date().toISOString()};
 // Do not replace a usable snapshot when browser storage cannot save the new one.
 try{localStorage.setItem(STORAGE,JSON.stringify(candidate))}catch(e){throw Error('Unable to save this local GOOD snapshot. Browser storage may be full.')}
 local=candidate;
 return {characters:characters.length,weapons:weapons.length,artifacts:artifacts.length,date:date||'unknown'};
}
function findSnapshot(d,key){return (d.builds||[]).find(c=>same(c.key,key))||null}
function fromLocal(key){
 if(!local)return null;
 const ch=local.characters.find(c=>same(c.key,key)),weap=local.weapons.find(w=>same(w.owner,key)),a=local.artifacts.filter(a=>same(a.owner,key));
 if(!ch&&!weap&&!a.length)return null;
 return {date:local.date,filename:local.filename,character:ch,weapon:weap,artifacts:a};
}
function statRow(label,value){return '<div class="farm-build-stat"><span>'+esc(label)+'</span><strong>'+esc(value||'Not recorded')+'</strong></div>'}
const goalKey=goal=>val(goal).split(/\s+[—–-]\s+/)[0];
function goalsFor(d,key){return (d.projects||[]).filter(g=>same(goalKey(g.goal),key)).sort((a,b)=>{
 const order={active:0,later:1,done:2},aStatus=order[val(a.status).toLowerCase()]??3,bStatus=order[val(b.status).toLowerCase()]??3;
 return aStatus-bStatus||(a.rank??999)-(b.rank??999)
});}
function sourcesFor(d,key){
 const stored=findSnapshot(d,key),upload=fromLocal(key);
 const dateStored=dateValue(stored?.date),dateLocal=dateValue(upload?.date);
 // Existing private scan wins when newer than an older browser import.
 const useLocal=upload&&(dateLocal>dateStored||!dateStored||(dateLocal===dateStored&&(upload.artifacts.length>(d.buildArtifacts||[]).filter(a=>same(a.key,key)).length)));
 const art=useLocal?upload.artifacts.map(a=>({...a,key,source:'Local GOOD import'})):(d.buildArtifacts||[]).filter(a=>same(a.key,key));
 const weapon=useLocal?upload.weapon?.key||stored?.weapon:stored?.weapon;
 const weaponLevel=useLocal?upload.weapon?.level??stored?.weaponLevel:stored?.weaponLevel;
 const refinement=useLocal?upload.weapon?.refinement??stored?.refinement:stored?.refinement;
 const baseDate=useLocal?dateLocal:dateStored;
 const count=useLocal?upload.artifacts.length:stored?.artifactCount;
 // A recorded zero is different from no scan or unknown equipment.
 const verifiedEmpty=(useLocal&&upload.character&&art.length===0)||(!useLocal&&baseDate&&count===0);
 const noteSource=useLocal?'Local GOOD file '+upload.filename:stored?.source||'No full GOOD equipment record';
 const rep=stored&&dateValue(stored.reportDate)>=baseDate?stored:null;
 return {stored,upload,useLocal,art,weapon:rep?.reportedWeapon||weapon,weaponLevel:rep?.reportedWeaponLevel??weaponLevel,refinement:rep?.reportedRefinement??refinement,
 scanWeapon:weapon,scanWeaponLevel:weaponLevel,scanRefinement:refinement,
 verifiedEmpty,scanDate:baseDate,scanSource:noteSource,artifactCount:count,reportDate:rep?.reportDate||'',reportNote:rep?.note||'',
 reportArtifacts:rep?.reportedArtifacts||'',reportedLevel:rep?.reportedLevel,reportedCons:rep?.reportedCons,reportedTalents:rep?.reportedTalents,
 scannedLevel:upload?.character?.level,scannedCons:upload?.character?.constellation,scannedTalents:upload?.character?.talents};
}
function renderProfile(key,d,utils){
 const label=utils.displayCharacter(key),r=d.characters.find(c=>same(c.name,key))||{},b=sourcesFor(d,key),goals=goalsFor(d,key);
 const artifactMap=new Map(b.art.map(a=>[val(a.slot).toLowerCase(),a]));
 const slots=[['flower','Flower'],['plume','Feather'],['sands','Sands'],['goblet','Goblet'],['circlet','Circlet']];
 const verifiedPieces=slots.filter(([k])=>artifactMap.has(k)).length;
 const level=b.reportedLevel??r.level??b.scannedLevel;
 const cons=b.reportedCons??r.cons??b.scannedCons;
 const talents=b.reportedTalents||[r.na,r.skill,r.burst].filter(x=>val(x)).join('/')||b.scannedTalents;
 const artifactView=slots.map(([slot,slotLabel])=>{
  const a=artifactMap.get(slot);
  if(!a)return '<div class="farm-artifact empty"><div class="farm-artifact-label">'+slotLabel+'</div><div class="farm-artifact-none">'+(b.verifiedEmpty?'None equipped in scan':'Not recorded in available scan')+'</div></div>';
  const sub=Array.isArray(a.substats)?a.substats.map(x=>Array.isArray(x)?[mainStat(x[0]),x[1]].join(' '):x).join(' · '):val(a.substats);
  return '<div class="farm-artifact"><div class="farm-artifact-label">'+slotLabel+' <span>+'+esc(a.level??'?')+'</span></div><strong>'+esc(name(a.set))+'</strong><div class="farm-artifact-main">'+esc(mainStat(a.main))+'</div>'+(sub&&sub!=='Not transcribed from available extract'?'<small>'+esc(sub)+'</small>':'')+'</div>';
 }).join('');
 const active=goals.filter(g=>val(g.status).toLowerCase()==='active').length,done=goals.filter(g=>val(g.status).toLowerCase()==='done').length;
 const goalList=goals.length?goals.map(g=>{
  const related=(d.requirements||[]).filter(x=>x.goal===g.goal&&x.needed>0&&val(g.status).toLowerCase()!=='done');
  return '<article class="farm-build-goal"><div class="farm-build-goal-head"><strong>'+esc(g.goal)+'</strong><span class="farm-status '+(val(g.status).toLowerCase()==='active'?'active':val(g.status).toLowerCase()==='done'?'done':'later')+'">'+esc(g.status)+'</span></div><p>'+esc(g.target||'')+'</p><small>'+esc(g.focus||'')+'</small>'+(related.length?'<div class="farm-goal-shortages">'+related.length+' recorded shortage line'+(related.length===1?'':'s')+': '+esc(related.slice(0,3).map(x=>name(x.material)).join(' · '))+(related.length>3?'…':'')+'</div>':'')+'</article>';
 }).join(''):'<div class="farm-empty">No individual goals are currently listed for this character in Projects.</div>';
 const hasWeapon=Boolean(b.weapon),scanLabel=b.scanDate?'Equipment scan: '+b.scanDate:'No dated full equipment scan';
 const portrait=utils.portrait(key);
 return '<div class="farm-surface farm-dossier"><button class="farm-profile-back" type="button" data-farm-profile-back="1">‹ Back to characters</button>'
 +'<div class="farm-dossier-hero">'+portrait+'<div><div class="farm-eyebrow">CHARACTER BUILD DOSSIER</div><h1>'+esc(label)+'</h1><p>'+esc(scanLabel)+' · '+esc(b.scanSource)+'</p><div class="farm-dossier-tags"><span>Lv '+esc(level||'Not recorded')+'</span><span>C'+esc(cons??'?')+'</span><span>'+esc(utils.characterElement(key))+'</span></div></div></div>'
 +'<div class="farm-dossier-metrics">'+statRow('Talents (A/E/Q)',talents||'Not recorded')+statRow('Recorded artifact slots',b.verifiedEmpty?'0 / 5':verifiedPieces+' / 5')+statRow('Goals tracked',fmt(goals.length)+' ('+active+' active, '+done+' done)')+'</div>'
 +'<section class="farm-build-section"><div class="farm-build-heading"><div><div class="farm-eyebrow">LAST KNOWN LOADOUT</div><h2>Equipment</h2></div><span class="farm-build-provenance">'+esc(b.reportDate?'Updated report '+b.reportDate:scanLabel)+'</span></div>'
 +'<div class="farm-weapon-card"><div class="farm-weapon-symbol">⚔</div><div><small>Equipped weapon · last documented</small><strong>'+esc(hasWeapon?name(b.weapon):'Not recorded')+'</strong><span>'+(hasWeapon?'Lv '+esc(b.weaponLevel??'?')+' · R'+esc(b.refinement??'?'):'No equipped weapon verified')+'</span></div></div>'
 +'<div class="farm-build-heading"><h3>Artifact slots</h3><small>'+verifiedPieces+' slots documented in '+(b.scanDate?'dated scans':'available data')+'</small></div>'
 +'<div class="farm-artifact-grid">'+artifactView+'</div>'
 +(b.reportArtifacts?'<p class="farm-build-report"><strong>Newer artifact report:</strong> '+esc(b.reportArtifacts)+'</p>':'')
 +(b.reportNote?'<p class="farm-build-report"><strong>Latest build note:</strong> '+esc(b.reportNote)+'</p>':'')
 +'<p class="farm-fineprint">Artifact slots display their last documented scan, which may differ from the current in-game build. Blank slots mean unrecorded unless a complete scan explicitly confirms none equipped. Reported updates do not invent individual artifact rolls.</p></section>'
 +'<section class="farm-build-section"><div class="farm-build-heading"><div><div class="farm-eyebrow">OBJECTIVES & UPGRADES</div><h2>Character Goals</h2></div><span class="farm-build-provenance">'+goals.length+' from Projects</span></div><div class="farm-build-goal-list">'+goalList+'</div></section>'
 +'<div class="farm-build-actions"><button type="button" class="farm-btn secondary" data-open-character="'+esc(label)+'">Open DPS Profile →</button><button type="button" class="farm-btn secondary" data-farm-nav="farm-projects">Open Project Queue →</button></div>'
 +'<div class="farm-build-section farm-import-section"><div class="farm-eyebrow">UPDATE EQUIPMENT PRIVATELY</div><h3>GOOD Import</h3><p>Import a full Inventory Kamera GOOD JSON snapshot for your entire roster. Only equipment and character build fields are saved locally in this browser—not Mora, wishes, or the full inventory. This does not upload or change your private Google Sheet.</p>'
 +'<label class="farm-import-button" for="farmGoodFile">Choose GOOD JSON file</label><input id="farmGoodFile" type="file" accept=".json,application/json" aria-label="Import an Inventory Kamera GOOD JSON file"/><p id="farmGoodMessage" class="farm-import-message">'+(local?'Local equipment scan: '+esc(local.filename)+' · '+(local.date||'date unspecified'):'No local equipment scan imported yet')+'</p></div></div>';
}
function localStatus(){return local?{characters:local.characters.length,date:local.date,filename:local.filename}:null}
window.FarmingBuildDossiers={renderProfile,importGood,localStatus,findSnapshot,fromLocal,goalsFor};
})();