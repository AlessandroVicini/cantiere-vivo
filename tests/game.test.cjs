const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.resolve(__dirname,'..'),box={window:{}};vm.createContext(box);
for(const f of ['cases.js','engine.js','navigation.js'])vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),box);
const legacy=box.window.GameEngine;vm.runInContext(fs.readFileSync(path.join(dir,'population.js'),'utf8'),box);
function populationChecks(G,N,legacy){
 const assert=(v,m)=>{if(!v)throw new Error(m)};
 assert(JSON.stringify(G.create(31415))===JSON.stringify(G.create(31415)),'Deterministic seeds');
 let completed=0,entries=0,exits=0,absences=0,returns=0,followups=0,successes=0;const starts=new Set(),casesSeen=new Set();
 for(let seed=1;seed<=120;seed++){
  const s=G.create(seed),refs=['s','r','d'].map(k=>JSON.stringify([s.people[k].name,s.people[k].sprite]));let lastIds=new Set(G.rosterKeys(s)),absentBefore=[];
  starts.add(JSON.stringify([s.site,s.roster.map(k=>s.people[k].name),s.v]));assert(G.valid(s),'Valid population state');
  for(let day=1;day<=10;day++){
   const today=G.activeKeys(s),nodes=today.map(k=>s.people[k].node);
   assert(new Set(nodes).size===nodes.length,'People have separate positions');
   assert(today.length>=7&&today.length<=16,'Variable but bounded population');
   for(let i=0;i<3;i++)assert(refs[i]===JSON.stringify([s.people[['s','r','d'][i]].name,s.people[['s','r','d'][i]].sprite]),'Stable reference identity');
   const roster=new Set(G.rosterKeys(s));entries+=[...roster].filter(k=>!lastIds.has(k)).length;exits+=[...lastIds].filter(k=>!roster.has(k)).length;
   const absent=G.rosterKeys(s).filter(k=>s.people[k].status==='absent');absences+=absent.length;returns+=absentBefore.filter(k=>s.people[k].status==='present').length;absentBefore=absent;lastIds=roster;
   for(const k of today){
    if(!G.available(s,k))continue;
    let c=G.current(s,k);assert(c.title&&c.text&&c.context,'Rich personal context');casesSeen.add(G.topic(s,k)+'-'+s.encounters[k].index);if(c.followup)followups++;
    else if(s.time+c.duration+20<=Math.min(1020,s.people[k].until))G.investigate(s,k);
    if(!G.canAct(s,k))continue;c=G.current(s,k);
    let index=0;if(!c.followup)index=c.options.reduce((a,o,j)=>Object.values(o.effect).reduce((x,y)=>x+y,0)>Object.values(c.options[a].effect).reduce((x,y)=>x+y,0)?j:a,0);
    const result=G.decide(s,k,index);assert(result,'Valid encounter response');if(result.error)continue;
    assert(!G.decide(s,k,0),'No double consumption');assert(s.people[k].known,'Personal encounter memory');
    for(const [key,v]of Object.entries(s.v))assert(Number.isFinite(v)&&v>=0&&v<=(key==='m'?s.workers:100),'Bounded scores');
    for(const p of s.pending)assert(p.personId&&s.people[p.personId]&&p.personName===s.people[p.personId].name,'Pending follows real identity');
    assert(G.valid(JSON.parse(JSON.stringify(s))),'Roundtrip state');
   }
   const remote=[...new Set(s.pending.filter(p=>!p.done&&p.due<=day&&!G.available(s,p.personId)).map(p=>p.personId))];
   for(const id of remote){if(s.time+40<=1020&&!s.used.includes(id)){const r=G.verifyRemote(s,id);assert(r&&!r.error,'Follow-up outside site remains possible');}}
   const result=G.endDay(s);assert(result,'Day transition');if(day===10)assert(result.ending,'Campaign ends');else assert(s.populationNews.length>0,'Every new visit has population events');
  }
  completed++;if(s.v.s>=65&&s.v.r>=65&&s.v.f>=65&&s.v.d>=60&&s.v.m>=20)successes++;
 }
 assert(starts.size===120,'Unique starts');assert(entries>0&&exits>0&&absences>0&&returns>0,'Entry exit absence return all exercised');assert(casesSeen.size===24,'All scenarios reachable');assert(followups>0&&successes>20,'Follow-ups and campaign objectives reachable');
 const s=G.create(999),id=G.rosterKeys(s)[0];s.time=600;s.people[id].from=480;s.people[id].until=1020;
 const c=G.current(s,id),index=c.options.reduce((a,o,j)=>Object.values(o.effect).reduce((x,y)=>x+y,0)>Object.values(c.options[a].effect).reduce((x,y)=>x+y,0)?j:a,0);
 G.decide(s,id,index);const pending=s.pending.find(p=>p.personId===id&&!p.done);assert(pending,'Person has follow-up');s.day=pending.due;s.time=480;s.used=[];s.people[id].status='departed';const other=G.rosterKeys(s).find(k=>k!==id&&G.topic(s,k)===G.topic(s,id));
 if(other)assert(!G.personalPending(s,other).some(p=>p.personId===id),'New worker never inherits old matters');
 const r=G.verifyRemote(s,id);assert(r&&!r.error&&r.feedback.includes(s.people[id].name),'Departed worker can be reached by name');
 const old=legacy.create(901),before=JSON.stringify([old.v,old.day,old.time,old.log]);G.upgrade(old);assert(before===JSON.stringify([old.v,old.day,old.time,old.log]),'Migration keeps saved progress');assert(old.populationVersion===1,'Old save migrated');
 for(let a=0;a<N.nodes.length;a++)for(let b=0;b<N.nodes.length;b++)assert(a===b||N.route(a,b).at(-1)===b,'Connected walking routes');
 return {completed,entries,exits,absences,returns,followups,successes,scenarios:casesSeen.size};
}
console.log('PASS:',populationChecks(box.window.GameEngine,box.window.Navigation,legacy));
