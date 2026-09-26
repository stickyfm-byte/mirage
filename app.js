const creators=[
{name:"ykni", lookup:"ykni", uuid:"bf2501d592d9430884f66f7fd6c61735", skin:"assets/ykni-skin.png", profile:"https://namemc.com/profile/ykni.8", yt:"https://www.youtube.com/@yknimc"},
{name:"NaltRexo", lookup:"NaltRexo", profile:"https://namemc.com/profile/NaltRexo.2", yt:"https://www.youtube.com/@naltrexi"},
{name:"Kingstxn__", lookup:"Kingstxn__", profile:"https://namemc.com/profile/Kingstxn__.1", yt:"https://www.youtube.com/@Kingston_isGud"},
{name:"Vad0se_", lookup:"Vad0se_", profile:"https://namemc.com/profile/Vad0se_.1", yt:"https://www.youtube.com/@Vad0se-YT"}
];

document.getElementById("year").textContent=new Date().getFullYear();

document.getElementById("copyIp").addEventListener("click",async e=>{
  try{await navigator.clipboard.writeText("mc.miragesmp.org");const old=e.currentTarget.textContent;e.currentTarget.textContent="Copied";setTimeout(()=>e.currentTarget.textContent=old,1300)}
  catch{e.currentTarget.textContent="mc.miragesmp.org"}
});

async function serverStatus(){
  const state=document.getElementById("serverState"),online=document.getElementById("playerCount"),max=document.getElementById("playerMax");
  try{
    const r=await fetch("https://api.mcsrvstat.us/3/mc.miragesmp.org",{cache:"no-store"});
    const d=await r.json();
    if(d.online){online.textContent=d.players?.online??0;max.textContent=d.players?.max??"∞";state.textContent="Online";state.style.color="#62efae"}
    else{online.textContent="0";max.textContent="offline";state.textContent="Offline";state.style.color="#ff9b9b"}
  }catch{online.textContent="Live";max.textContent="check";state.textContent="Unavailable";state.style.color="#f1c76c"}
}
serverStatus();setInterval(serverStatus,30000);

const grid=document.getElementById("creatorGrid");

function headUrl(creator){
  if(creator.name === "ykni") return "assets/ykni-head.png";
  return `https://mc-heads.net/avatar/${encodeURIComponent(creator.lookup)}/256`;
}

creators.forEach((creator,index)=>{
  const card=document.createElement("article");
  card.className="creator-card";
  const src=headUrl(creator);
  const fallback=creator.name === "ykni" ? "" : ` onerror="this.onerror=null;this.src='https://minotar.net/avatar/${encodeURIComponent(creator.lookup)}/256'"`;
  card.innerHTML=`
    <div class="skin-wrap head-wrap">
      <div class="head-glow"></div>
      <img class="creator-head" src="${src}" alt="${creator.name} Minecraft head" loading="lazy" draggable="false"${fallback}>
    </div>
    <div class="creator-info">
      <div><b>${creator.name}</b><small>Minecraft creator</small></div>
      <div class="creator-links" aria-label="Creator links">
        <a class="creator-icon-link" href="${creator.profile}" target="_blank" rel="noopener" aria-label="${creator.name} on NameMC"><img src="assets/namemc-logo.png" alt="NameMC" draggable="false"></a>
        <a class="creator-icon-link" href="${creator.yt}" target="_blank" rel="noopener" aria-label="${creator.name} on YouTube"><img src="assets/youtube-logo.png" alt="YouTube" draggable="false"></a>
      </div>
    </div>
    `;
  grid.appendChild(card);
});

const roleTabs=document.querySelectorAll(".role-tab");
const roleField=document.getElementById("roleField");
const subjectField=document.getElementById("subjectField");
const scriptWriterFields=document.getElementById("scriptWriterFields");
const generalApplication=document.getElementById("generalApplication");
const scriptRequiredFields=scriptWriterFields.querySelectorAll("[data-script-required]");

function setRole(role){
  roleTabs.forEach(x=>x.classList.toggle("selected",x.dataset.role===role));
  roleField.value=role;
  subjectField.value=`Mirage Productions application — ${role}`;

  const isWriter=role==="Script Writer";
  scriptWriterFields.hidden=!isWriter;
  scriptRequiredFields.forEach(field=>field.required=isWriter);
  generalApplication.required=!isWriter;
  generalApplication.closest("label").style.display=isWriter?"none":"block";
}

roleTabs.forEach(btn=>btn.addEventListener("click",()=>setRole(btn.dataset.role)));
setRole("Actor");

// Gentle reveal-on-scroll for section content, and highlight the nav link
// for whichever section is currently in view.
const revealTargets=document.querySelectorAll(".section-head, .video-card, .creator-card, .application-form, .info-card");
if("IntersectionObserver" in window){
  const revealer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("in-view");revealer.unobserve(entry.target)}});
  },{threshold:.15,rootMargin:"0px 0px -8% 0px"});
  revealTargets.forEach(el=>{el.classList.add("reveal");revealer.observe(el)});

  const navLinks=[...document.querySelectorAll("nav a")];
  const sections=navLinks.map(a=>document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const navObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const link=navLinks.find(a=>a.getAttribute("href")===`#${entry.target.id}`);
        navLinks.forEach(a=>a.classList.remove("active"));
        link?.classList.add("active");
      }
    });
  },{rootMargin:"-45% 0px -50% 0px"});
  sections.forEach(s=>navObserver.observe(s));
}else{
  revealTargets.forEach(el=>el.classList.add("in-view"));
}
