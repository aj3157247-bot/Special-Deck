const KEY='special-deck-account-v1';

export function loadAccount(){
  try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}
}

export function saveAccount(account){
  localStorage.setItem(KEY,JSON.stringify(account));
  return account;
}

export function registerAccount(name,email){
  const cleanName=(name||'').trim();
  const cleanEmail=(email||'').trim().toLowerCase();
  if(!cleanName || !cleanEmail) throw new Error('Name and email are required.');
  const account={id:`local-${Date.now()}`,name:cleanName,email:cleanEmail,createdAt:new Date().toISOString()};
  return saveAccount(account);
}

export function logoutAccount(){localStorage.removeItem(KEY)}
