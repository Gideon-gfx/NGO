(() => {
const $ = id => document.getElementById(id), gate = $('gate');
let token = '', challenge = '', urls = [], expiry;
async function api(url, body, auth = false) {
 const response = await fetch(url, { method: body ? 'POST' : 'GET', headers: { 'Content-Type':'application/json', ...(auth ? {Authorization:'Bearer ' + token} : {}) }, ...(body ? {body:JSON.stringify(body)} : {}), cache:'no-store', signal:AbortSignal.timeout(25000) }).catch(()=>{throw Error('The connection to Lagos Sistema was interrupted. Please try again when the site is available.');});
 const data = await response.json(); if (!response.ok) { if(response.status === 401) lock(); throw Error(data.error || 'Please try again.'); } return data;
}
function step(id) { for (const n of ['privacy','email-step','code-step']) $(n).hidden = n !== id; $('gate-status').textContent = ''; $(id).querySelector('input,button').focus(); }
function lock() { clearTimeout(expiry); if(token) fetch('/api/gallery/logout',{method:'POST',headers:{Authorization:'Bearer '+token},keepalive:true}).catch(()=>{}); token=''; urls.forEach(URL.revokeObjectURL); urls=[]; $('media').replaceChildren(); $('unlock').hidden=false; $('gallery-status').textContent='Please verify your email to view the gallery.'; $('privacy').reset(); $('code-step').reset(); step('privacy'); if(!gate.open) gate.showModal(); }
async function busy(form, fn) { const buttons=form.querySelectorAll('button'); buttons.forEach(b=>b.disabled=true); $('gate-status').textContent='Please wait…'; try{await fn();}catch(e){$('gate-status').textContent=e.message;}finally{buttons.forEach(b=>b.disabled=false);} }
$('privacy').onsubmit=e=>{e.preventDefault();step('email-step');};
$('email-step').onsubmit=e=>{e.preventDefault();busy(e.currentTarget,async()=>{const data=await api('/api/gallery/otp',{email:$('email').value,agreed:true});challenge=data.challenge;step('code-step');$('gate-status').textContent='Code sent. Please check your Gmail inbox and spam folder.';});};
$('resend').onclick=()=>step('email-step');
$('code-step').onsubmit=e=>{e.preventDefault();busy(e.currentTarget,async()=>{
 const data=await api('/api/gallery/verify',{challenge,code:$('code').value}); token=data.token; expiry=setTimeout(lock,data.expiresIn);
 const items=await api('/api/gallery/media',null,true); gate.close(); $('unlock').hidden=true; $('gallery-status').textContent=items.length?'Thank you for verifying and respecting our community’s privacy.':'Thank you for verifying. Photos and videos will appear here when added.';
 for(const item of items){const response=await fetch('/api/gallery/media/'+encodeURIComponent(item.id),{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!response.ok){if(response.status===401)lock();throw Error('Could not load gallery media.');}const blob=await response.blob();if(!token)return;const url=URL.createObjectURL(blob);urls.push(url);const figure=document.createElement('figure'),media=document.createElement(item.type.startsWith('video/')?'video':'img'),caption=document.createElement('figcaption'); media.src=url;media.draggable=false;if(media.tagName==='VIDEO'){media.controls=true;media.controlsList='nodownload noremoteplayback';media.disablePictureInPicture=true;}else media.alt=item.title;caption.textContent=item.title||'';if(item.caption){const text=document.createElement('span');text.className='gallery-caption-text';text.textContent=item.caption;caption.append(text);}figure.append(media,caption);$('media').append(figure);}
 });};
$('media').oncontextmenu=e=>e.preventDefault(); $('media').ondragstart=e=>e.preventDefault(); $('unlock').onclick=lock;
$('close-gate').onclick=()=>{gate.close();$('unlock').focus();};
gate.addEventListener('cancel',()=>{$('gallery-status').textContent='Gallery closed. Select Open gallery to verify your email.';});
window.addEventListener('pagehide',lock);window.addEventListener('pageshow',e=>{if(e.persisted)lock();});gate.showModal();
})();