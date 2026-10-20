(function(root){
const nodes=[[800,939],[860,865],[846,743],[790,641],[703,554],[598,503],[523,450],[418,421],[315,349],[966,770],[1127,768],[1296,754],[1455,730],[685,742],[523,684],[420,586],[1045,868],[1223,877]];
const edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[2,9],[9,10],[10,11],[11,12],[2,13],[13,14],[14,15],[15,7],[1,16],[16,17]];
const links=nodes.map(()=>[]);for(const[a,b]of edges){links[a].push(b);links[b].push(a)}
function nearest(x,y){let best=0,d=Infinity;nodes.forEach((n,i)=>{let t=Math.hypot(n[0]-x,n[1]-y);if(t<d){d=t;best=i}});return best}
function route(a,b){if(a===b)return[];let q=[a],prev={[a]:null};for(let i=0;i<q.length;i++){let n=q[i];for(const v of links[n]){if(v in prev)continue;prev[v]=n;q.push(v);if(v===b){let p=[b];while(prev[p[0]]!==null)p.unshift(prev[p[0]]);return p.slice(1)}}}return[]}
root.Navigation={nodes,edges,links,nearest,route};
})(typeof window!=='undefined'?window:globalThis);
