import express from 'express';
import crypto from 'node:crypto';
import cors from 'cors';
const app=express(); app.use(cors()); app.use(express.json({limit:'1mb'}));
const PORT=process.env.PORT||3000;
const URL=(process.env.SUPABASE_URL||'').replace(/\/$/,''); const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||''; const SECRET=process.env.AUTH_JWT_SECRET||'';
const configured=()=>!!(URL&&KEY&&SECRET);
async function sb(path,opt={}){if(!URL||!KEY)throw Error('Supabase is not configured');const r=await fetch(`${URL}/rest/v1/${path}`,{...opt,headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json',...(opt.headers||{})}});const t=await r.text();let d={};try{d=JSON.parse(t)}catch{}if(!r.ok)throw Error(d.message||d.error||`Supabase error ${r.status}`);return d}
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function token(u){const h=enc({alg:'HS256',typ:'JWT'}),p=enc({sub:u.id,email:u.email,exp:Math.floor(Date.now()/1000)+2592000}),b=`${h}.${p}`;return `${b}.${crypto.createHmac('sha256',SECRET).update(b).digest('base64url')}`}
function verify(t){const [a,b,s]=t.split('.');if(!a||!b||!s)throw Error('Invalid session');const e=crypto.createHmac('sha256',SECRET).update(`${a}.${b}`).digest('base64url');if(s.length!==e.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e)))throw Error('Invalid session');const p=JSON.parse(Buffer.from(b,'base64url'));if(p.exp<Date.now()/1000)throw Error('Session expired');return p}
function auth(req,res,next){try{const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))throw Error('Authentication required');req.user=verify(h.slice(7));next()}catch(e){res.status(401).json({error:e.message})}}
function hash(p){return new Promise((ok,no)=>{const salt=crypto.randomBytes(16).toString('hex');crypto.scrypt(p,salt,64,(e,k)=>e?no(e):ok(`${salt}:${k.toString('hex')}`))})}
function check(p,s){return new Promise((ok,no)=>{const [salt,hex]=s.split(':');crypto.scrypt(p,salt,64,(e,k)=>e?no(e):ok(k.length===Buffer.from(hex,'hex').length&&crypto.timingSafeEqual(k,Buffer.from(hex,'hex'))))})}
app.get('/api/health',(q,r)=>r.json({ok:true,service:'special-deck-api',cloud:configured()}));


let topDeckCache={at:0,data:[]};
app.get('/api/top-decks',async(req,res)=>{
  try{
    const apiToken=process.env.CLASH_ROYALE_API_TOKEN||'';
    if(!apiToken)return res.status(503).json({error:'Clash Royale API is not configured. Add CLASH_ROYALE_API_TOKEN to Render.'});
    if(Date.now()-topDeckCache.at<10*60*1000&&topDeckCache.data.length)return res.json({source:'live-cache',decks:topDeckCache.data});
    const headers={Authorization:`Bearer ${apiToken}`};
    const rankRes=await fetch('https://api.clashroyale.com/v1/locations/global/rankings/players?limit=300',{headers});
    const rankText=await rankRes.text();let rankData={};try{rankData=JSON.parse(rankText)}catch{}
    if(!rankRes.ok)throw Error(rankData.message||`Leaderboard error ${rankRes.status}`);
    const players=Array.isArray(rankData.items)?rankData.items.slice(0,300):[];
    const out=[];
    for(let i=0;i<players.length;i+=8){
      const chunk=players.slice(i,i+8);
      const rows=await Promise.all(chunk.map(async p=>{
        try{
          const tag=String(p.tag||'').replace(/^#/,'');
          const r=await fetch(`https://api.clashroyale.com/v1/players/%23${encodeURIComponent(tag)}`,{headers});
          const t=await r.text();let d={};try{d=JSON.parse(t)}catch{}
          if(!r.ok||!Array.isArray(d.currentDeck)||d.currentDeck.length!==8)return null;
          return {rank:p.rank||i+1,tag:p.tag,name:p.name,score:p.trophies||0,deck:d.currentDeck.map(c=>({id:c.id,name:c.name,level:c.level,maxLevel:c.maxLevel,maxed:c.maxed}))};
        }catch{return null}
      }));
      for(const x of rows)if(x)out.push(x);
    }
    topDeckCache={at:Date.now(),data:out};
    res.json({source:'live',decks:out});
  }catch(e){res.status(502).json({error:e.message})}
});
app.get('/api/player/:tag/cards',async(req,res)=>{
  try{
    const apiToken=process.env.CLASH_ROYALE_API_TOKEN||'';
    if(!apiToken)return res.status(503).json({error:'Clash Royale API is not configured. Add CLASH_ROYALE_API_TOKEN to Render environment variables.'});
    const raw=String(req.params.tag||'').trim().replace(/^%23/,'').replace(/^#/,'');
    if(!/^[0289PYLQGRJCUV]+$/i.test(raw))return res.status(400).json({error:'Invalid Player Tag.'});
    const r=await fetch(`https://api.clashroyale.com/v1/players/%23${encodeURIComponent(raw)}/cards`,{headers:{Authorization:`Bearer ${apiToken}`}});
    const text=await r.text();let d={};try{d=JSON.parse(text)}catch{}
    if(!r.ok)return res.status(r.status).json({error:d.message||`Clash Royale API error ${r.status}`});
    res.json({cards:Array.isArray(d)?d:[]});
  }catch(e){res.status(500).json({error:e.message})}
});
app.get('/api/deck-link',(q,r)=>{const ids=String(q.query.ids||'').split(',').filter(Boolean);r.json({url:`clashroyale-inbox://copyDeck?deck=${ids.join(';')}`})});
app.post('/api/auth/register',async(q,r)=>{try{if(!configured())return r.status(503).json({error:'Cloud auth is not configured.'});const name=String(q.body.name||'').trim(),email=String(q.body.email||'').trim().toLowerCase(),password=String(q.body.password||'');if(name.length<2)throw Error('Name must contain at least 2 characters.');if(!/^\S+@\S+\.\S+$/.test(email))throw Error('Enter a valid email.');if(password.length<8)throw Error('Password must be at least 8 characters.');const ex=await sb(`special_users?select=id&email=eq.${encodeURIComponent(email)}&limit=1`);if(ex.length)throw Error('An account with this email already exists.');const rows=await sb('special_users',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name,email,pass_hash:await hash(password)})});const u=rows[0];await sb('special_user_data',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({user_id:u.id})});r.json({token:token(u),user:{id:u.id,name:u.name,email:u.email,createdAt:u.created_at}})}catch(e){r.status(400).json({error:e.message})}});
app.post('/api/auth/login',async(q,r)=>{try{if(!configured())return r.status(503).json({error:'Cloud auth is not configured.'});const email=String(q.body.email||'').trim().toLowerCase(),password=String(q.body.password||'');const rows=await sb(`special_users?select=id,name,email,pass_hash,created_at&email=eq.${encodeURIComponent(email)}&limit=1`);if(!rows.length||!(await check(password,rows[0].pass_hash)))throw Error('Email or password is incorrect.');const u=rows[0];r.json({token:token(u),user:{id:u.id,name:u.name,email:u.email,createdAt:u.created_at}})}catch(e){r.status(401).json({error:e.message})}});
app.get('/api/account/data',auth,async(q,r)=>{try{const x=await sb(`special_user_data?select=owned,saved,updated_at&user_id=eq.${q.user.sub}&limit=1`);const d=x[0]||{};r.json({owned:d.owned||{},saved:d.saved||[],updatedAt:d.updated_at||null})}catch(e){r.status(500).json({error:e.message})}});
app.put('/api/account/sync',auth,async(q,r)=>{try{const owned=q.body.owned&&typeof q.body.owned==='object'?q.body.owned:{},saved=Array.isArray(q.body.saved)?q.body.saved.slice(0,100):[];await sb(`special_user_data?user_id=eq.${q.user.sub}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({owned,saved,updated_at:new Date().toISOString()})});r.json({ok:true})}catch(e){r.status(500).json({error:e.message})}});
app.listen(PORT,()=>console.log(`Special Deck API listening on ${PORT}`));
