import { fallbackCards } from './fallbackCards';
export const REMOTE_CARDS_URL = 'https://raw.githubusercontent.com/RoyaleAPI/cr-api-data/master/docs/json/cards.json';
export async function loadCards(){
  try{
    const r=await fetch(REMOTE_CARDS_URL,{cache:'no-store'}); if(!r.ok) throw new Error('remote cards unavailable');
    const data=await r.json();
    if(Array.isArray(data)&&data.length>20) return data.filter(c=>c.id&&c.name).map(c=>({...c,arena:Number(c.arena||0)}));
  }catch(e){}
  return fallbackCards;
}
