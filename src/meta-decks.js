export const META_DECKS = [
  {key:'gk-ram-ewiz',name:'GK Bandit Evo Ram EWiz',archetype:'Bridge Spam / Pressure',avgElixir:3.9,winRate:62.0,usage:'1d snapshot',sample:'1,355 battles',cards:['Arrows','Bandit','Battle Ram','Electro Wizard','Elite Barbarians','Golden Knight','Mother Witch','Royal Ghost']},
  {key:'hero-gobs-freeze',name:'HeroGobs Ghost Bait Freeze',archetype:'Bait / Control',avgElixir:3.0,winRate:60.0,usage:'1d snapshot',sample:'1,684 battles',cards:['Dart Goblin','Freeze','Goblins','Rascals','Royal Ghost','Skeleton Barrel','Suspicious Bush','The Log']},
  {key:'evo-mortar-cart',name:'EvoMortar Cart',archetype:'Siege / Bait',avgElixir:3.5,winRate:58.0,usage:'14d snapshot',sample:'19,014 battles',cards:['Barbarian Barrel','Cannon Cart','Fireball','Hero Berserker','Minions','Mortar','Rascals','Skeleton Barrel']},
  {key:'evo-mortar-bait',name:'EvoMortar Cart Bait',archetype:'Siege / Bait',avgElixir:3.6,winRate:61.0,usage:'2w snapshot',sample:'169 battles',cards:['Barbarian Barrel','Cannon Cart','Fireball','Goblin Gang','Minions','Mortar','Rascals','Skeleton Barrel']}
];

const aliases = {'Battle Ram':'Battle Ram','Elite Barbarians':'Elite Barbarians','Mortar':'Mortar','Skeleton Barrel':'Skeleton Barrel'};
function norm(s){return String(s).toLowerCase().replace(/\s+(evolution|ev|hero)$/,'').replace(/[^a-z0-9]+/g,'');}
export function resolveMetaDeck(meta,cards){
  return meta.cards.map(name=>{
    const target=norm(aliases[name]||name);
    return cards.find(c=>norm(c.name)===target) || cards.find(c=>norm(c.name).startsWith(target));
  }).filter(Boolean);
}
