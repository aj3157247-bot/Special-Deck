// Special Deck AI: role coverage + card synergy + elixir balance + collection constraints.
const WIN = new Set(['Hog Rider','Giant','Royal Giant','Balloon','Wall Breakers','Royal Hogs','Goblin Barrel','X-Bow','Mortar','Ram Rider','Goblin Giant','Graveyard','Lava Hound','Golem','Electro Giant','Minion Giant','Ronin']);
const AIR = new Set(['Archers','Minions','Hunter','Magic Archer','Ice Wizard','Musketeer','Baby Dragon','Electro Wizard','Inferno Dragon','Mega Minion','Phoenix','Firecracker','Flying Machine','Minion Horde','Skeleton Dragons','Executioner','Princess']);
const BUILDINGS = new Set(['Cannon','Tesla','Bomb Tower','Inferno Tower','Goblin Cage','Tombstone','Furnace','Goblin Hut','Barbarian Hut','Mortar','X-Bow','Elixir Collector']);
const CHEAP = new Set(['Skeletons','Goblins','Spear Goblins','Bats','Bomber','Zap','The Log','Giant Snowball','Rage','Barbarian Barrel','Mirror']);
const HEAVY = new Set(['Golem','Electro Giant','P.E.K.K.A','Mega Knight','Lava Hound','Three Musketeers','Royal Recruits','Goblin Giant','Minion Giant']);
const SPELLS = new Set(['Fireball','Arrows','Zap','Rocket','The Log','Poison','Lightning','Freeze','Tornado','Rage','Giant Snowball','Earthquake','Barbarian Barrel','Goblin Barrel','Graveyard','Mirror','Clone','Void','Vines']);
const role = c => ({
  win: WIN.has(c.name), air: AIR.has(c.name), building: BUILDINGS.has(c.name), cheap: CHEAP.has(c.name), heavy: HEAVY.has(c.name), spell: c.type==='Spell' || SPELLS.has(c.name), support: !WIN.has(c.name) && !BUILDINGS.has(c.name) && !CHEAP.has(c.name) && !HEAVY.has(c.name)
});
const weights = {
  Balanced:{win:1.15,def:1.05,air:1.05,cycle:1,spell:1},
  Cycle:{win:1.15,def:0.95,air:1,cycle:1.45,spell:1.05},
  Control:{win:1.1,def:1.35,air:1.2,cycle:1,spell:1.3},
  Beatdown:{win:1.45,def:1,air:1.2,cycle:0.7,spell:1.05},
  BridgeSpam:{win:1.3,def:1.1,air:1.05,cycle:1.25,spell:1.1}
};
const synergyPairs = new Map([
  ['Hog Rider|Earthquake',10],['Hog Rider|The Log',5],['Hog Rider|Firecracker',6],['Hog Rider|Cannon',5],
  ['Miner|Wall Breakers',11],['Miner|Poison',7],['Miner|Bats',4],['Miner|Inferno Tower',3],
  ['Graveyard|Poison',10],['Graveyard|Freeze',7],['Graveyard|Baby Dragon',6],['Graveyard|Tornado',4],
  ['Lava Hound|Balloon',11],['Lava Hound|Inferno Dragon',6],['Lava Hound|Tombstone',4],['Balloon|Freeze',6],
  ['Golem|Night Witch',10],['Golem|Baby Dragon',5],['Golem|Lightning',7],['Golem|Tornado',4],
  ['Royal Giant|Fisherman',8],['Royal Giant|Lightning',7],['Royal Giant|Hunter',6],['Royal Giant|The Log',4],
  ['X-Bow|Tesla',8],['X-Bow|Archers',5],['X-Bow|The Log',4],['Mortar|Miner',7],['Mortar|Archers',5],
  ['Goblin Barrel|Princess',8],['Goblin Barrel|The Log',-4],['Goblin Barrel|Rocket',5],
  ['Mega Knight|Miner',6],['Mega Knight|Wall Breakers',7],['Mega Knight|Bats',5],
  ['P.E.K.K.A|Battle Ram',8],['P.E.K.K.A|Magic Archer',6],['Battle Ram|Bandit',7],['Bandit|Magic Archer',4],
  ['Royal Hogs|Earthquake',9],['Royal Hogs|Firecracker',6],['Royal Hogs|Royal Recruits',5],
  ['Electro Giant|Tornado',9],['Electro Giant|Lightning',7],['Electro Giant|Baby Dragon',5],
  ['Giant|Prince',6],['Giant|Dark Prince',6],['Giant|Mini P.E.K.K.A',4],
  ['Poison|The Log',3],['Fireball|The Log',4],['Zap|Inferno Dragon',5],['Tornado|Executioner',9],['Tornado|Baby Dragon',7],['Tornado|Magic Archer',6],
  ['Knight|Archers',5],['Knight|The Log',3],['Valkyrie|Firecracker',6],['Valkyrie|Tornado',5],['Tesla|The Log',4],['Cannon|The Log',4],['Inferno Tower|Tornado',3],
]);
const pairKey=(a,b)=>a.name<b.name?`${a.name}|${b.name}`:`${b.name}|${a.name}`;
function pairScore(a,b){return synergyPairs.get(pairKey(a,b))||0}
function baseScore(c,style,owned){
  const w=weights[style]||weights.Balanced, r=role(c); let s=0;
  if(r.win)s+=24*w.win; if(r.air)s+=8*w.air; if(r.building)s+=12*w.def; if(r.spell)s+=7*w.spell; if(r.cheap)s+=7*w.cycle; if(r.heavy)s-=4*(1/w.cycle);
  if(c.evolution)s+=4; if(c.hero||c.champion)s+=3;
  const o=owned?.[c.id]; if(o?.level===16||o?.max)s+=10; else if(o?.level)s+=Math.min(6,o.level/3);
  s-=Math.max(0,c.elixir-4)*1.4;
  return s;
}
function deckScore(deck,style,owned){
  const w=weights[style]||weights.Balanced; let s=deck.reduce((t,c)=>t+baseScore(c,style,owned),0);
  let win=0,air=0,build=0,spells=0,cheap=0,heavy=0,total=0;
  for(const c of deck){const r=role(c);win+=r.win;air+=r.air;build+=r.building;spells+=r.spell;cheap+=r.cheap;heavy+=r.heavy;total+=c.elixir}
  for(let i=0;i<deck.length;i++)for(let j=i+1;j<deck.length;j++)s+=pairScore(deck[i],deck[j]);
  const avg=total/8;
  if(win===0)s-=55; if(win>2)s-=18*(win-2); if(air<2)s-=22*(2-air); if(build>2)s-=10*(build-2); if(spells<2)s-=14*(2-spells); if(spells>3)s-=8*(spells-3); if(cheap<2)s-=12*(2-cheap); if(avg>4.7)s-=18*(avg-4.7); if(avg<2.6)s-=12*(2.6-avg);
  if(style==='Beatdown'&&heavy<2)s-=18; if(style==='Cycle'&&cheap<4)s-=20; if(style==='Control'&&build<1)s-=10;
  return s + w.cycle*(cheap*2);
}
export function generateDeckAI(cards,owned,style='Balanced'){
  const max=cards.filter(c=>owned?.[c.id]?.max||owned?.[c.id]?.level===16);
  const pool=(max.length>=8?max:cards).slice().sort((a,b)=>baseScore(b,style,owned)-baseScore(a,style,owned));
  const candidates=pool.slice(0,Math.min(42,pool.length));
  let beam=[[]];
  for(let slot=0;slot<8;slot++){
    const next=[]; const seen=new Set();
    for(const deck of beam){
      for(const c of candidates){if(deck.some(x=>x.id===c.id))continue;
        const d=[...deck,c]; const key=d.map(x=>x.id).sort((a,b)=>a-b).join(','); if(seen.has(key))continue; seen.add(key);
        if(d.length===8 && role(d[0])){} next.push({deck:d,score:deckScore(d,style,owned)});
      }
    }
    next.sort((a,b)=>b.score-a.score); beam=next.slice(0,slot===7?24:90).map(x=>x.deck);
  }
  return (beam[0]||[]).slice(0,8);
}

function seededRandom(seed){
  const x=Math.sin(seed*12.9898+78.233)*43758.5453;
  return x-Math.floor(x);
}
function variantKey(deck){return deck.map(c=>c.id).sort((a,b)=>a-b).join(',')}
function overlap(a,b){
  const A=new Set(a.map(c=>c.id)), B=new Set(b.map(c=>c.id));
  let n=0; for(const id of A)if(B.has(id))n++;
  return n/8;
}

/**
 * Build a large, deterministic pool of distinct 8-card candidates from every
 * MAX/high-level card in the user's collection. The page UI can expose this
 * pool 10 at a time without ever asking the user to hand-pick only 8 cards.
 */
export function generateDeckVariants(cards,owned,style='Balanced',count=10,offset=0){
  const max=cards.filter(c=>owned?.[c.id]?.max||owned?.[c.id]?.level===16);
  if(max.length<8)return [];
  const pool=max.slice().sort((a,b)=>baseScore(b,style,owned)-baseScore(a,style,owned));
  const target=Math.min(300,Math.max(count,offset+count));
  const candidates=[];
  const seen=new Set();

  for(let attempt=0;attempt<target*80 && candidates.length<target*3;attempt++){
    const seed=attempt+1+offset*9973;
    const deck=[];
    const available=pool.slice();
    while(deck.length<8&&available.length){
      const scored=available.map((c,index)=>{
        const synergy=deck.reduce((v,x)=>v+pairScore(c,x),0);
        const roleInfo=role(c);
        const roleBonus=
          (roleInfo.win&&!deck.some(x=>role(x).win)?28:0)+
          (roleInfo.air&&deck.filter(x=>role(x).air).length<2?12:0)+
          (roleInfo.spell&&deck.filter(x=>role(x).spell).length<2?10:0)+
          (roleInfo.building&&!deck.some(x=>role(x).building)?12:0)+
          (roleInfo.cheap&&deck.filter(x=>role(x).cheap).length<3?7:0);
        const jitter=(seededRandom(seed*(index+3)+deck.length*31)-0.5)*18;
        return {c,s:baseScore(c,style,owned)+synergy+roleBonus+jitter};
      }).sort((a,b)=>b.s-a.s);
      const pick=Math.min(scored.length-1,Math.floor(seededRandom(seed*17+deck.length*13)*Math.min(5,scored.length)));
      deck.push(scored[pick].c);
      available.splice(available.findIndex(x=>x.id===scored[pick].c.id),1);
    }
    if(deck.length!==8)continue;
    const key=variantKey(deck);
    if(seen.has(key))continue;
    seen.add(key);
    candidates.push({deck,score:Math.round(deckScore(deck,style,owned)*10)/10});
  }

  candidates.sort((a,b)=>b.score-a.score);
  const diverse=[];
  for(const item of candidates){
    if(diverse.every(x=>overlap(x.deck,item.deck)<0.875))diverse.push(item);
    if(diverse.length>=Math.min(300,candidates.length))break;
  }
  return diverse.slice(offset,offset+count);
}

export function analyzeDeckAI(deck){
  if(!deck.length)return {synergy:0,coverage:0,balance:0,score:0};
  const roles=deck.map(role); const win=roles.filter(r=>r.win).length, air=roles.filter(r=>r.air).length, buildings=roles.filter(r=>r.building).length, spells=roles.filter(r=>r.spell).length;
  let synergy=0; for(let i=0;i<deck.length;i++)for(let j=i+1;j<deck.length;j++)synergy+=pairScore(deck[i],deck[j]);
  const avg=deck.reduce((s,c)=>s+c.elixir,0)/deck.length;
  const coverage=Math.min(100,win*28+air*18+buildings*15+spells*12);
  const balance=Math.max(0,100-Math.abs(avg-3.7)*22-Math.max(0,spells-3)*8-Math.max(0,1-win)*35);
  return {synergy:Math.min(100,Math.round(50+synergy*2)),coverage:Math.round(coverage),balance:Math.round(balance),score:Math.round((Math.min(100,50+synergy*2)+coverage+balance)/3)};
}


const COUNTERS = {
  'Hog Rider':['Cannon','Tesla','Bomb Tower','Tornado','Goblin Cage'],
  'Royal Hogs':['Bomb Tower','Valkyrie','Bowler','Fireball','The Log'],
  'Balloon':['Musketeer','Hunter','Tesla','Inferno Tower','Firecracker'],
  'Giant':['Inferno Tower','P.E.K.K.A','Mini P.E.K.K.A','Cannon'],
  'Golem':['Inferno Tower','P.E.K.K.A','Mini P.E.K.K.A','Inferno Dragon'],
  'Electro Giant':['Cannon','Tesla','Inferno Tower','P.E.K.K.A'],
  'Mega Knight':['P.E.K.K.A','Inferno Tower','Knight','Valkyrie'],
  'Goblin Barrel':['The Log','Arrows','Barbarian Barrel','Zap'],
  'Graveyard':['Poison','Valkyrie','Baby Dragon','Tornado'],
  'Lava Hound':['Musketeer','Hunter','Inferno Dragon','Tesla','Firecracker'],
  'X-Bow':['Tesla','Rocket','Lightning','P.E.K.K.A'],
  'Mortar':['Cannon','Tesla','Knight','Valkyrie'],
  'Wall Breakers':['Valkyrie','Bomb Tower','The Log','Barbarian Barrel'],
  'Ram Rider':['Cannon','Tesla','P.E.K.K.A','Tornado'],
  'Royal Giant':['Tesla','Cannon','Inferno Tower','Fisherman'],
  'Minion Giant':['Hunter','Inferno Tower','P.E.K.K.A','Tesla'],
  'Goblin Giant':['Mini P.E.K.K.A','P.E.K.K.A','Inferno Tower','Cannon'],
  'Bridge Spam':['P.E.K.K.A','Valkyrie','Bomb Tower']
};

export function analyzeMatchups(deck=[], opponent=[]){
  const enemyNames=new Set(opponent.map(c=>c.name));
  const threats=deck.filter(c=>COUNTERS[c.name]);
  const countered=opponent.filter(c=>COUNTERS[c.name]);
  let coverage=0, gaps=[];
  for(const enemy of countered){
    const list=COUNTERS[enemy.name]||[];
    const found=deck.filter(c=>list.includes(c.name)).length;
    coverage += found ? 1 : 0;
    if(!found) gaps.push(enemy.name);
  }
  const score=countered.length?Math.round(100*coverage/countered.length):50;
  const suggested=opponent.flatMap(c=>COUNTERS[c.name]||[]).filter((n,i,a)=>a.indexOf(n)===i)
    .filter(n=>!enemyNames.has(n)).map(name=>deck.find(c=>c.name===name)||{name});
  return {score, gaps, suggested, threats: threats.map(c=>c.name)};
}

export function findDeckWeaknesses(deck=[]){
  const r=deck.map(role), avg=deck.length?deck.reduce((s,c)=>s+c.elixir,0)/deck.length:0;
  const weaknesses=[];
  if(!r.some(x=>x.win)) weaknesses.push({key:'win',title:'No Win Condition',detail:'Add a reliable way to damage the enemy tower.'});
  if(r.filter(x=>x.air).length<2) weaknesses.push({key:'air',title:'Light Air Defense',detail:'Add another reliable anti-air card.'});
  if(r.filter(x=>x.building).length===0) weaknesses.push({key:'building',title:'No Defensive Building',detail:'Consider a building or a strong defensive unit.'});
  if(r.filter(x=>x.spell).length<2) weaknesses.push({key:'spell',title:'Low Spell Coverage',detail:'Two spells often give broader utility across matchups.'});
  if(avg>4.6) weaknesses.push({key:'elixir',title:'Heavy Elixir',detail:`Average elixir is ${avg.toFixed(1)}; consider a cheaper cycle/support card.`});
  if(avg<2.7) weaknesses.push({key:'light',title:'Very Fast Cycle',detail:`Average elixir is ${avg.toFixed(1)}; make sure the deck has enough stopping power.`});
  if(r.filter(x=>x.win).length>2) weaknesses.push({key:'wins',title:'Too Many Win Conditions',detail:'Trim redundant win conditions for stronger role coverage.'});
  return weaknesses;
}

export function suggestReplacements(deck,cards,owned,style='Balanced'){
  const weak=findDeckWeaknesses(deck); if(!weak.length)return [];
  const candidates=(cards||[]).filter(c=>!deck.some(d=>d.id===c.id));
  const available=candidates.filter(c=>owned?.[c.id]?.max||owned?.[c.id]?.level===16);
  const pool=(available.length>=5?available:candidates).sort((a,b)=>baseScore(b,style,owned)-baseScore(a,style,owned));
  return weak.slice(0,4).map(w=>{
    const scored=pool.map(c=>({c,s:baseScore(c,style,owned)+(w.key==='air'&&role(c).air?25:0)+(w.key==='building'&&role(c).building?25:0)+(w.key==='spell'&&role(c).spell?18:0)+(w.key==='win'&&role(c).win?30:0)-(w.key==='elixir'&&c.elixir>3?10:0)})).sort((a,b)=>b.s-a.s)[0];
    return scored?{weakness:w,replacement:scored.c}:null;
  }).filter(Boolean);
}
