const creators=[
{name:"ykni", lookup:"ykni", profile:"https://namemc.com/profile/ykni.8", yt:"https://www.youtube.com/@yknimc"},
{name:"NaltRexo", lookup:"NaltRexo", profile:"https://namemc.com/profile/NaltRexo.2", yt:"https://www.youtube.com/@naltrexi"},
{name:"Kingstxn__", lookup:"Kingstxn__", profile:"https://namemc.com/profile/Kingstxn__.1", yt:"https://www.youtube.com/@Kingston_isGud"},
{name:"Vad0se_", lookup:"Vad0se_", profile:"https://namemc.com/profile/Vad0se_.1", yt:"https://www.youtube.com/@Vad0se-YT"}
];

document.getElementById("year").textContent=new Date().getFullYear();

document.getElementById("copyIp").addEventListener("click",async e=>{
  try{await navigator.clipboard.writeText("miragemultiverse.datho.st");const old=e.currentTarget.textContent;e.currentTarget.textContent="Copied";setTimeout(()=>e.currentTarget.textContent=old,1300)}
  catch{e.currentTarget.textContent="miragemultiverse.datho.st"}
});

async function serverStatus(){
  const state=document.getElementById("serverState"),online=document.getElementById("playerCount"),max=document.getElementById("playerMax");
  try{
    const r=await fetch("https://api.mcsrvstat.us/3/miragemultiverse.datho.st",{cache:"no-store"});
    const d=await r.json();
    if(d.online){online.textContent=d.players?.online??0;max.textContent=d.players?.max??"∞";state.textContent="Online";state.style.color="#62efae"}
    else{online.textContent="0";max.textContent="offline";state.textContent="Offline";state.style.color="#ff9b9b"}
  }catch{online.textContent="Live";max.textContent="check";state.textContent="Unavailable";state.style.color="#f1c76c"}
}
serverStatus();setInterval(serverStatus,30000);

const grid=document.getElementById("creatorGrid");
const viewers=[];

creators.forEach((creator,index)=>{
  const card=document.createElement("article");
  card.className="creator-card";
  card.innerHTML=`<div class="skin-wrap" id="skin-${index}"></div><div class="creator-info"><div><b>${creator.name}</b><small>Minecraft creator</small></div><div class="creator-links"><a href="${creator.profile}" target="_blank" rel="noopener">NameMC ↗</a><a href="${creator.yt}" target="_blank" rel="noopener">YouTube ↗</a></div></div>`;
  grid.appendChild(card);
});

async function getSkinUrl(name){
  // Ashcon exposes the current Mojang profile and texture URL and avoids
  // the old username image endpoints that can fall back to Steve.
  try{
    const r=await fetch(`https://api.ashcon.app/mojang/v2/user/${encodeURIComponent(name)}`,{cache:"no-store"});
    if(r.ok){
      const d=await r.json();
      if(d.textures?.skin?.url) return d.textures.skin.url;
    }
  }catch(e){}
  const fallbacks=[
    `https://mc-heads.net/skin/${encodeURIComponent(name)}`,
    `https://minotar.net/skin/${encodeURIComponent(name)}`
  ];
  return fallbacks[0];
}

function makeViewer(index,skinUrl){
  if(!window.skinview3d)return;
  const mount=document.getElementById(`skin-${index}`);
  const canvas=document.createElement("canvas");
  mount.appendChild(canvas);
  try{
    const viewer=new skinview3d.SkinViewer({canvas,width:mount.clientWidth,height:430,skin:skinUrl});
    viewer.controls.enableZoom=false;
    viewer.controls.enablePan=false;
    viewer.controls.enableRotate=true;
    viewer.animation=new skinview3d.IdleAnimation();
    viewer.animation.speed=.55;
    viewer.playerObject.rotation.y=.45;
    viewers[index]=viewer;
  }catch(e){
    mount.innerHTML='<div style="height:100%;display:grid;place-items:center;color:#79a4b7;font-size:12px">Skin unavailable</div>';
  }
}

async function initCreators(){
  await Promise.all(creators.map(async(creator,index)=>{
    const skin=await getSkinUrl(creator.lookup);
    makeViewer(index,skin);
  }));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initCreators);else initCreators();

window.addEventListener("resize",()=>viewers.forEach((v,i)=>{if(v){const m=document.getElementById(`skin-${i}`);v.width=m.clientWidth}}));

document.querySelectorAll(".role-tab").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".role-tab").forEach(x=>x.classList.remove("selected"));
  btn.classList.add("selected");
  document.getElementById("roleField").value=btn.dataset.role;
}));
