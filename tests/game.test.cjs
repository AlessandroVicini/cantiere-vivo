const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');const box={window:{}};vm.createContext(box);for(const f of ['cases.js','engine.js','navigation.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),box);const G=box.window.GameEngine,N=box.window.Navigation;
assert.equal(JSON.stringify(G.create(31415)),JSON.stringify(G.create(31415)),'same seed is reproducible');
const fingerprints=new Set();let completed=0,good=0,followups=0,scenes=new Set();
for(let seed=1;seed<=160;seed++){
 const s=G.create(seed);assert(G.valid(s));fingerprints.add(JSON.stringify([s.people,s.v,s.encounters,s.weather]));
 for(let day=1;day<=10;day++){
  assert.equal(s.day,day);const visited=new Set();
  for(const k of G.KEYS){
   let c=G.current(s,k);assert(c.title&&c.text);scenes.add(k+'-'+s.encounters[k].index);
   if(c.followup)followups++;else if(s.time+c.duration+20<=1020)assert(G.investigate(s,k));
   c=G.current(s,k);let i=0;if(!c.followup){i=c.options.reduce((a,o,j)=>Object.values(o.effect).reduce((x,y)=>x+y,0)>Object.values(c.options[a].effect).reduce((x,y)=>x+y,0)?j:a,0)}
   let result=G.decide(s,k,i);assert(result);if(result.error)continue;
   assert(!visited.has(k));visited.add(k);assert.equal(G.decide(s,k,0),null,'no double action');
   Object.entries(s.v).forEach(([key,v])=>assert(Number.isFinite(v)&&v>=0&&v<=(key==='m'?s.workers:100)));
   assert(G.valid(JSON.parse(JSON.stringify(s))),'saved state can be restored');
  }
  const result=G.endDay(s);assert(result);if(day===10)assert(result.ending);else assert.equal(s.time,480);
 }
 assert(s.ended);completed++;if(s.v.s>=65&&s.v.f>=65&&s.v.r>=65&&s.v.d>=60&&s.v.m>=20)good++;
}
assert.equal(fingerprints.size,160,'different seeds yield distinct campaigns');assert.equal(scenes.size,24,'all cases reachable');assert(good>100,'good decisions can meet all objectives');assert(followups>0);
for(let a=0;a<N.nodes.length;a++)for(let b=0;b<N.nodes.length;b++){let route=N.route(a,b);if(a===b)assert.equal(route.length,0);else{assert.equal(route[route.length-1],b);let prev=a;for(const n of route){assert(N.links[prev].includes(n));prev=n}}}
const s=G.create(600);s.time=1010;const snapshot=JSON.stringify(s.v);let r=G.decide(s,'s',0);assert(r.error);assert.equal(JSON.stringify(s.v),snapshot,'no cost or benefit for impossible action');s.time=1020;assert.equal(G.decide(s,'s',0),null);
const expired=G.create(601);expired.pending.push({key:'s',title:'Test',due:1,deadline:1,done:false});G.endDay(expired);assert(expired.pending[0].done,'missed followup is recorded');
assert(!G.valid(null));assert(!G.valid({version:3}));
console.log(`PASS: ${completed} full campaigns, ${fingerprints.size} distinct starts, ${scenes.size} cases, ${followups} followups; ${good} campaigns achieved every objective. All navigation paths connected.`);
