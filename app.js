const creators=[
{name:"ykni", lookup:"ykni", uuid:"bf2501d592d9430884f66f7fd6c61735", skin:"assets/ykni-skin.png", profile:"https://namemc.com/profile/ykni.8", yt:"https://www.youtube.com/@yknimc"},
{name:"NaltRexo", lookup:"NaltRexo", profile:"https://namemc.com/profile/NaltRexo.2", yt:"https://www.youtube.com/@naltrexi"},
{name:"Kingstxn__", lookup:"Kingstxn__", profile:"https://namemc.com/profile/Kingstxn__.1", yt:"https://www.youtube.com/@Kingston_isGud"},
{name:"Vad0se_", lookup:"Vad0se_", profile:"https://namemc.com/profile/Vad0se_.1", yt:"https://www.youtube.com/@Vad0se-YT"}
];

document.getElementById("year").textContent=new Date().getFullYear();

const copyIpButton=document.getElementById("copyIp");
if(copyIpButton) copyIpButton.addEventListener("click",async e=>{
  const button=e.currentTarget;
  try{
    await navigator.clipboard.writeText("mc.miragesmp.org");
    button.textContent="✓ Copied";
    button.classList.add("copied");
    clearTimeout(button._copyTimer);
    button._copyTimer=setTimeout(()=>{
      button.textContent="Copy";
      button.classList.remove("copied");
    },1600);
  }catch{
    button.textContent="Copy failed";
    clearTimeout(button._copyTimer);
    button._copyTimer=setTimeout(()=>button.textContent="Copy",1600);
  }
});

function cleanMotd(d){
  const motd=d?.motd?.clean;
  if(Array.isArray(motd)) return motd.filter(Boolean).join(" ").trim() || "No MOTD provided";
  if(typeof motd === "string") return motd.trim() || "No MOTD provided";
  return "No MOTD provided";
}

function recordingFromMotd(motd){
  const text=motd.toLowerCase();
  if(/recording\s+session\s+(active|on|started|live)/i.test(motd) || /recording\s*[:\-]?\s*(active|on|started|live)/i.test(motd)) return true;
  if(/recording\s+session\s+(inactive|off|ended|offline)/i.test(motd) || /recording\s*[:\-]?\s*(inactive|off|ended|offline)/i.test(motd)) return false;
  return null;
}

function setRecordingState(active){
  const state=document.getElementById("recordingState"),dot=document.getElementById("recordingDot");
  const status=document.getElementById("statusRecording");
  if(!state && !status) return;
  const label=active===true?"Active":active===false?"Inactive":"Unknown";
  [state,status].forEach(el=>{if(el) el.textContent=label;});
  if(dot){dot.classList.toggle("active",active===true);dot.classList.toggle("inactive",active===false);}
}

async function serverStatus(){
  const state=document.getElementById("serverState"),online=document.getElementById("playerCount"),max=document.getElementById("playerMax");
  const statusText=document.getElementById("minecraftStatusText"),statusDot=document.getElementById("minecraftStatusDot");
  const statusPlayers=document.getElementById("statusPlayers"),statusServerState=document.getElementById("statusServerState");
  try{
    const r=await fetch("https://api.mcsrvstat.us/3/mc.miragesmp.org",{cache:"no-store"});
    const d=await r.json();
    const motd=cleanMotd(d);
    const recording=recordingFromMotd(motd);
    setRecordingState(recording);
    if(d.online){
      const players=d.players?.online??0, maximum=d.players?.max??"∞";
      if(online) online.textContent=players;
      if(max) max.textContent=maximum;
      if(state){state.textContent="Online";state.style.color="#62efae";}
      if(statusText){statusText.textContent="Operational";statusText.style.color="#75efa0";} if(statusServerState) statusServerState.textContent="Online";
      if(statusDot) statusDot.style.background="#55e88a";
      if(statusPlayers) statusPlayers.textContent=`${players} / ${maximum}`;
    }else{
      if(online) online.textContent="0";
      if(max) max.textContent="offline";
      if(state){state.textContent="Offline";state.style.color="#ff9b9b";}
      if(statusText){statusText.textContent="Offline";statusText.style.color="#ff9b9b";} if(statusServerState) statusServerState.textContent="Offline";
      if(statusDot) statusDot.style.background="#ff6b6b";
      if(statusPlayers) statusPlayers.textContent="Server offline";
    }
  }catch{
    if(online) online.textContent="Live";
    if(max) max.textContent="check";
    if(state){state.textContent="Unavailable";state.style.color="#f1c76c";}
    if(statusText){statusText.textContent="Unavailable";statusText.style.color="#f1c76c";}
    if(statusPlayers) statusPlayers.textContent="Unable to fetch"; if(statusServerState) statusServerState.textContent="Unavailable";
    setRecordingState(null);
  }
}
serverStatus();setInterval(serverStatus,30000);

const grid=document.getElementById("creatorGrid");

function headUrl(creator){
  if(creator.name === "ykni") return "assets/ykni-head.png";
  return `https://mc-heads.net/avatar/${encodeURIComponent(creator.lookup)}/256`;
}

if(grid) creators.forEach((creator,index)=>{
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
const generalApplicationLabel=document.getElementById("generalApplicationLabel");
const scriptRequiredFields=scriptWriterFields ? scriptWriterFields.querySelectorAll("[data-script-required]") : [];

function setRole(role){
  roleTabs.forEach(x=>x.classList.toggle("selected",x.dataset.role===role));
  if(roleField) roleField.value=role;
  if(subjectField) subjectField.value=`Mirage Productions application — ${role}`;
  const isWriter=role==="Script Writer";
  if(scriptWriterFields) scriptWriterFields.hidden=!isWriter;
  scriptRequiredFields.forEach(field=>field.required=isWriter);
  if(generalApplication) generalApplication.required=!isWriter;
  if(generalApplicationLabel) generalApplicationLabel.style.display=isWriter?"none":"block";
}

roleTabs.forEach(btn=>btn.addEventListener("click",()=>setRole(btn.dataset.role)));
if(roleTabs.length) setRole("Actor");

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


// Policy acknowledgement banner
(function(){
  const banner=document.getElementById("policyBanner");
  const accept=document.getElementById("acceptPolicies");
  if(!banner||!accept)return;
  if(localStorage.getItem("miragePoliciesAccepted")==="1") banner.classList.add("hidden");
  accept.addEventListener("click",()=>{
    localStorage.setItem("miragePoliciesAccepted","1");
    banner.classList.add("hidden");
  });
})();
