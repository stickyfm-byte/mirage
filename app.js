const creators=[
{name:"ykni", lookup:"ykni", uuid:"bf2501d592d9430884f66f7fd6c61735", skin:"assets/ykni-skin.png", profile:"https://namemc.com/profile/ykni.8", yt:"https://www.youtube.com/@yknimc"},
{name:"NaltRexo", lookup:"NaltRexo", profile:"https://namemc.com/profile/NaltRexo.2", yt:"https://www.youtube.com/@naltrexi"},
{name:"Kingstxn__", lookup:"Kingstxn__", profile:"https://namemc.com/profile/Kingstxn__.1", yt:"https://www.youtube.com/@Kingston_isGud"},
{name:"Vad0se_", lookup:"Vad0se_", profile:"https://namemc.com/profile/Vad0se_.1", yt:"https://www.youtube.com/@Vad0se-YT"}
];

const year=document.getElementById("year");
if(year) year.textContent=new Date().getFullYear();

// Copy the Minecraft server address. The control is only present on the homepage.
const copyIpButton=document.getElementById("copyIp");
if(copyIpButton){
  copyIpButton.addEventListener("click",async e=>{
    const button=e.currentTarget;
    const original=button.dataset.originalText || "Copy";
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText("mc.miragesmp.org");
      }else{
        const area=document.createElement("textarea");
        area.value="mc.miragesmp.org";
        area.setAttribute("readonly","");
        area.style.position="fixed";
        area.style.opacity="0";
        document.body.appendChild(area);
        area.select();
        const copied=document.execCommand("copy");
        area.remove();
        if(!copied) throw new Error("Copy unavailable");
      }
      button.textContent="✓ Copied";
      button.classList.add("copied");
      clearTimeout(button._copyTimer);
      button._copyTimer=setTimeout(()=>{
        button.textContent=original;
        button.classList.remove("copied");
      },1600);
    }catch{
      button.textContent="Copy failed";
      clearTimeout(button._copyTimer);
      button._copyTimer=setTimeout(()=>button.textContent=original,1600);
    }
  });
}

async function serverStatus(){
  const state=document.getElementById("serverState"),online=document.getElementById("playerCount"),max=document.getElementById("playerMax");
  // Only run the Minecraft request when the homepage server panel exists.
  if(!state && !online && !max) return;
  try{
    const r=await fetch("https://api.mcsrvstat.us/3/mc.miragesmp.org",{cache:"no-store"});
    if(!r.ok) throw new Error("Status request failed");
    const d=await r.json();
    if(d.online){
      const players=d.players?.online??0, maximum=d.players?.max??"∞";
      if(online) online.textContent=players;
      if(max) max.textContent=maximum;
      if(state){state.textContent="Online";state.style.color="#62efae";}
    }else{
      if(online) online.textContent="0";
      if(max) max.textContent="offline";
      if(state){state.textContent="Offline";state.style.color="#ff9b9b";}
    }
  }catch{
    if(online) online.textContent="—";
    if(max) max.textContent="—";
    if(state){state.textContent="Unavailable";state.style.color="#f1c76c";}
  }
}
serverStatus();
if(document.getElementById("serverState") || document.getElementById("playerCount") || document.getElementById("playerMax")){
  setInterval(serverStatus,30000);
}

const grid=document.getElementById("creatorGrid");
function headUrl(creator){
  if(creator.name === "ykni") return "assets/ykni-head.png";
  return `https://mc-heads.net/avatar/${encodeURIComponent(creator.lookup)}/256`;
}
if(grid){
  creators.forEach(creator=>{
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
      </div>`;
    grid.appendChild(card);
  });
}

// Application role switching. This is safe on every page; controls only exist on /forms/.
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

// Reveal effects only on elements that exist on the current page.
const revealTargets=document.querySelectorAll(".section-head, .video-card, .creator-card, .application-form, .info-card");
if("IntersectionObserver" in window){
  const revealer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add("in-view");revealer.unobserve(entry.target);}
    });
  },{threshold:.15,rootMargin:"0px 0px -8% 0px"});
  revealTargets.forEach(el=>{el.classList.add("reveal");revealer.observe(el);});

  // Only hash links can be observed as sections. Page links such as /forms/ are not CSS selectors.
  const navLinks=[...document.querySelectorAll("nav a")];
  const hashLinks=navLinks.filter(a=>{
    const href=a.getAttribute("href")||"";
    return href.startsWith("#") && href.length>1;
  });
  const sections=hashLinks.map(a=>document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
  if(sections.length){
    const navObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const link=hashLinks.find(a=>a.getAttribute("href")===`#${entry.target.id}`);
          navLinks.forEach(a=>a.classList.remove("active"));
          if(link) link.classList.add("active");
        }
      });
    },{rootMargin:"-45% 0px -50% 0px"});
    sections.forEach(s=>navObserver.observe(s));
  }
}else{
  revealTargets.forEach(el=>el.classList.add("in-view"));
}

// Policy acknowledgement banner. The homepage also defines this inline so it still works if this script is delayed.
(function(){
  const banner=document.getElementById("policyBanner");
  const accept=document.getElementById("acceptPolicies");
  if(!banner || !accept) return;
  const hide=()=>{
    banner.classList.add("hidden");
    banner.setAttribute("aria-hidden","true");
    try{localStorage.setItem("miragePoliciesAccepted","1");}catch(e){}
  };
  try{
    if(localStorage.getItem("miragePoliciesAccepted")==="1") hide();
  }catch(e){}
  if(!accept.dataset.bound){
    accept.dataset.bound="1";
    accept.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();hide();},{capture:true});
  }
})();
