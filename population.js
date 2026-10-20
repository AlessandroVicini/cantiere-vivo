(function(root){
'use strict';
const base=root.GameEngine;
const names=['Samir','Amina','Davide','Ion','Elisa','Carlos','Fatima','Adrian','Giulia','Youssef','Sara','Giorgio','Nadia','Diego','Moussa','Loredana','Ahmed','Cristina','Pavel','Mehdi','Silvia','Antonio','Radu','Sofia','Abdou','Daniela','Stefano','Mirela','Omar','Valentina','Giacomo','Irina','Hassan','Manuel','Anna','Karim','Leonardo','Daria','Tarek','Simone'];
const surnames=['Rossi','Marin','Conti','Diallo','Bianchi','Popescu','Ferrari','Benali','Costa','Ionescu','Moretti','Haddad','Greco','Esposito','Romano','Kone'];
const trades=['Carpentiere','Ferraiolo','Muratore','Ponteggiatore','Impiantista','Addetto alle finiture'];
const firms=['Edilnova','Orizzonte Costruzioni','Ponteverde','EdilFutura','Cantieri Uniti','Nuova Trave','Linea Edile','Fondamenta','Costruzioni Aurora','Impianti Nord','EdilOrizzonte','Strutture Italia','Nuovo Cantiere','Trave Solidale'];
const moods=['Disponibile','Diffidente','Di fretta','Preoccupato'];
const stable=['s','r','d'];
const pick=(s,a)=>a[Math.floor(base.rand(s)*a.length)];
const shuffle=(s,a)=>base.shuffle(s,a);
const phase=s=>s.day<=3?'Strutture e organizzazione':s.day<=6?'Nuove squadre e impianti':'Finiture e avvicendamenti';
function topic(s,id){return s.people[id]&&s.people[id].topic||id}
function area(s,id){return base.AREAS[topic(s,id)]||'Lavoratori'}
function rosterKeys(s){return (s.roster||[]).filter(id=>s.people[id]&&s.people[id].status!=='departed')}
function activeKeys(s){return stable.concat(rosterKeys(s).filter(id=>s.people[id].status==='present'))}
function allPresent(s,id){return !!s.people[id]&&s.people[id].status==='present'}
function availability(s,id){
 const p=s.people[id];if(!p)return 'Persona non disponibile';
 if(p.status==='departed')return 'Ha lasciato il cantiere';
 if(p.status==='absent')return 'Oggi fuori cantiere; rientro previsto domani';
 if(s.time<p.from)return 'Al lavoro: disponibile dalle '+format(p.from);
 if(s.time>=p.until)return 'Ha concluso il turno di oggi';
 return p.known?'Già incontrato · '+p.mood:'Nuovo contatto · '+p.mood;
}
function format(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}
function available(s,id){const p=s.people[id];return allPresent(s,id)&&s.time>=p.from&&s.time<p.until}
function personalPending(s,id){return s.pending.filter(p=>!p.done&&p.personId===id&&p.due<=s.day)}
function scope(s,id,fn){
 const p=s.people[id];if(!p)throw new Error('Unknown person '+id);const t=topic(s,id);
 const personBefore=s.people[t],encBefore=s.encounters[t],relBefore=s.relations[t],usedBefore=s.used,pendingBefore=s.pending;
 const relevant=pendingBefore.filter(x=>x.personId===id),other=pendingBefore.filter(x=>x.personId!==id);
 const aliases=relevant.map(x=>({...x,key:t}));
 s.people[t]=p;s.encounters[t]=s.encounters[id]||encBefore;s.relations[t]=s.relations[id]||0;
 s.used=usedBefore.includes(id)?[t]:[];s.pending=aliases;
 let result,consumed=false,newPending=[],relation;
 try{result=fn(t);consumed=s.used.includes(t);relation=s.relations[t];newPending=s.pending.map(x=>({...x,key:t,personId:id,personName:p.name,company:p.company,id:relevant.some(old=>old.id===x.id)?x.id:'person-'+id+'-'+(s.populationSeq++)}));}
 finally{s.people[t]=personBefore;s.encounters[t]=encBefore;s.relations[t]=relBefore;s.used=usedBefore;s.pending=pendingBefore;}
 s.relations[id]=relation;s.pending=other.concat(newPending);
 if(consumed&&!s.used.includes(id))s.used.push(id);
 return result;
}
function decorate(s,id,t,isStable){
 const p=s.people[id];p.id=id;p.topic=t;p.stable=!!isStable;p.status=p.status||'present';p.known=!!p.known;
 p.from=480;p.until=1020;p.joined=p.joined||s.day;p.mood=p.mood||pick(s,moods);
 p.skill=p.skill||pick(s,['Esperto','In affiancamento','Alla prima esperienza nel cantiere']);
 p.sprite=p.sprite===undefined?(['Amina','Elisa','Fatima','Giulia','Sara','Nadia','Loredana','Cristina','Silvia','Sofia','Daniela','Valentina','Mirela','Irina','Anna','Daria','Lucia','Marta','Chiara','Elena'].includes(p.name.split(' ')[0])?3:Math.floor(base.rand(s)*3)):p.sprite;p.bodyScale=p.bodyScale||(.92+base.rand(s)*.15);
 p.wanderPhase=p.wanderPhase===undefined?base.rand(s)*6.28:p.wanderPhase;p.visits=p.visits||0;
 if(!p.stable)p.role=p.trade||pick(s,trades);
}
function spawn(s,company,forceTopic){
 const id='p'+s.populationSeq++,t=forceTopic||pick(s,['f','f','a','w','r']),name=pick(s,s.nameDeck.length?s.nameDeck:names);
 s.nameDeck=s.nameDeck.filter(n=>n!==name);
 s.people[id]={name:name+' '+pick(s,surnames),company,topic:t,node:2,trade:pick(s,trades),joined:s.day,status:'present',known:false};
 decorate(s,id,t,false);s.relations[id]=0;s.roster.push(id);return id;
}
function assignCase(s,id,seen){
 const t=topic(s,id),pool=root.CASES[t];const options=pool.map((_,i)=>i).filter(i=>!(seen[t]||[]).includes(i));
 const index=pick(s,options.length?options:pool.map((_,i)=>i));(seen[t]||(seen[t]=[])).push(index);
 s.encounters[id]={index,order:shuffle(s,pool[index].options.map((_,i)=>i)),investigated:false,duration:pick(s,[45,55,65]),context:'La segnalazione riguarda '+s.people[id].company+'.'};
}
function assignPositions(s,keepEncounters){
 const taken=new Set();for(const id of stable){const p=s.people[id];p.status='present';p.from=480;p.until=1020;taken.add(p.node);}
 const seen={};for(const id of stable){const e=s.encounters[id];if(e)(seen[topic(s,id)]||(seen[topic(s,id)]=[])).push(e.index)}
 const zones={f:[2,13,14,16,17,0],a:[7,15,6,5,8],w:[11,12,16,17,13],r:[9,10,13,14]};
 for(const id of rosterKeys(s)){
  const p=s.people[id];if(p.status!=='present')continue;
  const preferred=shuffle(s,zones[p.topic]||zones.f),fallback=shuffle(s,Array.from({length:18},(_,i)=>i).filter(i=>i!==1));
  const node=preferred.concat(fallback).find(n=>!taken.has(n));if(node===undefined)throw new Error('Too many visible people');
  p.node=node;taken.add(node);const neighbours=root.Navigation.links[node];p.wanderNode=pick(s,neighbours);
  if(!keepEncounters||!s.encounters[id])assignCase(s,id,seen);
 }
}
function upgrade(s){
 if(!base.valid(s))return s;if(s.populationVersion===1)return s;
 s.populationVersion=1;s.populationSeq=1;s.roster=['f','a','w'];s.nameDeck=shuffle(s,names);s.populationNews=[];s.phase=phase(s);
 s.crewCounts={};for(const co of s.companies)s.crewCounts[co]=Math.floor(s.workers/s.companies.length);
 s.crewCounts[s.companies[0]]+=s.workers-Object.values(s.crewCounts).reduce((a,b)=>a+b,0);
 for(const id of base.KEYS){decorate(s,id,id,stable.includes(id));if(stable.includes(id))s.people[id].company=s.companies[0];}
 for(const p of s.pending){p.personId=p.personId||p.key;p.personName=s.people[p.personId]?s.people[p.personId].name:'Contatto precedente';p.company=s.people[p.personId]?s.people[p.personId].company:s.companies[0];}
 const goal=pick(s,[6,7,8]);while(s.roster.length<goal)spawn(s,pick(s,s.companies));
 // Preserve day, clock, scores, old decisions and existing follow-ups.
 assignPositions(s,true);return s;
}
function rotate(s){
 const changes=[];s.phase=phase(s);
 for(const id of rosterKeys(s)){const p=s.people[id];p.status='present';}
 // A real company change, including the workers attached to that company.
 if(s.day===4||s.day===7){
  const outgoing=pick(s,s.companies.slice(1)),incoming=pick(s,firms.filter(f=>!s.companies.includes(f)));
  for(const id of rosterKeys(s)){const p=s.people[id];if(p.company===outgoing){p.status='departed';p.left=s.day;changes.push(p.name+' termina la presenza con '+outgoing+'.');}}
  s.companies=s.companies.map(c=>c===outgoing?incoming:c);delete s.crewCounts[outgoing];s.crewCounts[incoming]=pick(s,[14,17,20,23]);
  s.attitudes[incoming]=pick(s,['disponibile al confronto','sulla difensiva','con referenti poco coordinati']);
  spawn(s,incoming,'a');spawn(s,incoming,pick(s,['f','w','r']));
  s.workers=Object.values(s.crewCounts).reduce((a,b)=>a+b,0);s.v.m=Math.min(s.v.m,s.workers);
  changes.unshift('Avvicendamento: esce '+outgoing+', entra '+incoming+'.');
 }
 const workers=rosterKeys(s),needJoin=workers.length<6||(s.day%2===0&&workers.length<9);
 if(needJoin){const id=spawn(s,pick(s,s.companies));changes.push('Nuovo ingresso: '+s.people[id].name+', '+s.people[id].role.toLowerCase()+' di '+s.people[id].company+'.');}
 else{
  const candidates=workers.filter(id=>s.people[id].joined<s.day);if(candidates.length){const id=pick(s,candidates),p=s.people[id];p.status='departed';p.left=s.day;changes.push(p.name+' passa a un altro cantiere. Le questioni aperte restano da seguire.');}
 }
 // Absences are temporary; identity, relationship and pending matters survive.
 for(const id of rosterKeys(s)){
  const p=s.people[id];if(p.joined<s.day&&base.rand(s)<.16){p.status='absent';changes.push(p.name+' oggi è fuori cantiere; è previsto un rientro.');}
  p.mood=pick(s,moods);p.from=p.known?480:pick(s,[480,480,510,540]);p.until=pick(s,[960,990,1020]);
 }
 // Nobody disappears simply because a topic has been exhausted.
 if(activeKeys(s).length<7){for(const id of rosterKeys(s)){s.people[id].status='present';if(activeKeys(s).length>=7)break;}}
 assignPositions(s,false);s.populationNews=changes;
 base.apply(s,{f:-Math.min(3,changes.filter(x=>x.includes('ingresso')||x.includes('Avvicendamento')).length)});
 return changes;
}
function create(seed){return upgrade(base.create(seed))}
function current(s,id){
 upgrade(s);const p=s.people[id];if(!p)return null;
 const c=scope(s,id,t=>base.current(s,t));if(!c)return c;
 const recognition=p.known?'Ti riconosce dai precedenti incontri.':'Non vi siete ancora presentati.';
 c.context=[c.context||'',p.role+' · '+p.skill+'.',recognition,'Disponibilità al confronto: '+p.mood.toLowerCase()+'.','Fase del cantiere: '+s.phase+'.'].filter(Boolean).join(' ');
 return c;
}
function canAct(s,id){return !s.ended&&available(s,id)&&!s.used.includes(id)&&s.time<1020}
function investigate(s,id){
 if(!canAct(s,id)||s.time+20>s.people[id].until)return false;
 const result=scope(s,id,t=>base.investigate(s,t));if(result){s.people[id].known=true;s.people[id].mood='Disponibile';}return result;
}
function decide(s,id,index){
 if(!canAct(s,id))return null;if(s.time+current(s,id).duration>s.people[id].until)return {error:'La persona non ha abbastanza tempo per questo colloquio: programma un altro incontro o segui le verifiche dai Contatti.'};const p=s.people[id],investigated=s.encounters[id]&&s.encounters[id].investigated,wasUnknown=!p.known;
 const result=scope(s,id,t=>base.decide(s,t,index));
 if(result&&!result.error){p.known=true;p.visits++;p.lastSeen=s.day;if(result.positive&&wasUnknown&&p.mood==='Diffidente'&&!investigated){const d=base.apply(s,{f:-2});result.effect.f=(result.effect.f||0)+d.f;result.feedback+=' Con una persona ancora diffidente, il prossimo incontro richiederà più ascolto.';}
  if(result.positive)p.mood='Disponibile';s.log[s.log.length-1].personId=id;s.log[s.log.length-1].effect={...result.effect};s.log[s.log.length-1].feedback=result.feedback;}
 return result;
}
function verify(s,id){return decide(s,id,0)}
function verifyRemote(s,id){
 if(s.ended||!s.people[id]||!personalPending(s,id).length||s.used.includes(id))return null;
 const result=scope(s,id,t=>base.verify(s,t));if(result&&!result.error){result.feedback='Hai ricontattato '+s.people[id].name+' con il supporto della struttura territoriale. '+result.feedback;s.log[s.log.length-1].feedback=result.feedback;s.log[s.log.length-1].personId=id;}return result;
}
function endDay(s){
 upgrade(s);const day=s.day,result=base.endDay(s);if(!result||s.day===day)return result;
 const changes=rotate(s);result.feedback+=' '+changes.join(' ');s.news.text=result.feedback;
 const log=s.log[s.log.length-1];if(log){log.feedback=result.feedback;log.population=changes.slice();}
 return result;
}
function valid(s){return base.valid(s)&&(!s.populationVersion||s.populationVersion===1&&Array.isArray(s.roster)&&s.roster.every(id=>s.people[id]&&s.people[id].topic))}
root.GameEngine={...base,create,upgrade,current,canAct,investigate,decide,verify,verifyRemote,endDay,valid,activeKeys,rosterKeys,area,topic,availability,available,personalPending,phase};
})(typeof window!=='undefined'?window:globalThis);
