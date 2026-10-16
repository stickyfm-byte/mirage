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

// ---------------------------------------------------------------------------
// Video rail: a smooth, endlessly looping strip of thumbnails.
// - Motion is driven by requestAnimationFrame with eased speed changes, so
//   hovering slows the rail to a gentle stop instead of freezing it.
// - Drag / swipe it; it keeps its momentum and eases back to cruising speed.
// - Thumbnails start on the always-available hqdefault image and quietly
//   upgrade to maxresdefault when it exists, so cards never show a gap.
// ---------------------------------------------------------------------------
const videoIds=[
  "hoPNEa9tVBw","cHDVYJYpFiE","3vRonNY7BSM","oLhEjk6Vc2A","uKXckokWTmM","M1Fe9Z4o0c0",
  "5jlf___qFsc","hEuv1v_b45M","XOhnFGmG_Q8","8gpw4hmgqpk","bkAkwNIf_jg","WIKkHbfah8g",
  "q-4HsTTwHV8"
];

(function initVideoRail(){
  const rail=document.getElementById("videoRail");
  const track=document.getElementById("videoTrack");
  if(!rail || !track) return;

  const PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6.2v11.6c0 .8.9 1.3 1.6.9l9.1-5.8c.6-.4.6-1.3 0-1.7L10.1 5.3c-.7-.4-1.6.1-1.6.9z" fill="currentColor"/></svg>';
  const OPEN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8.5 7H17v8.5"/></svg>';
  const thumb=(id,q)=>`https://i.ytimg.com/vi/${id}/${q}.jpg`;

  // Every <img> per video, so one successful maxres probe upgrades all copies.
  const imagesById=new Map();
  const probed=new Set();
  function upgradeThumb(id){
    if(probed.has(id)) return;
    probed.add(id);
    const hi=new Image();
    hi.onload=()=>{
      // A missing maxres can come back as a tiny placeholder; ignore those.
      if(hi.naturalWidth<=160) return;
      (imagesById.get(id)||[]).forEach(img=>{img.src=hi.src;});
    };
    hi.src=thumb(id,"maxresdefault");
  }

  function buildCard(id,index,clone){
    const a=document.createElement("a");
    a.className="vcard";
    a.href=`https://www.youtube.com/watch?v=${id}`;
    a.target="_blank";
    a.rel="noopener";
    a.draggable=false;
    a.style.setProperty("--i",Math.min(index,8));
    if(clone){a.setAttribute("aria-hidden","true");a.tabIndex=-1;}
    else a.setAttribute("aria-label",`Watch video ${index+1} on YouTube`);

    const img=document.createElement("img");
    img.alt="";
    img.draggable=false;
    img.decoding="async";
    if(index>5 && !clone) img.loading="lazy";
    img.addEventListener("load",()=>img.classList.add("is-loaded"));
    img.src=thumb(id,"hqdefault");
    if(img.complete && img.naturalWidth) img.classList.add("is-loaded");
    if(!imagesById.has(id)) imagesById.set(id,[]);
    imagesById.get(id).push(img);

    a.appendChild(img);
    a.insertAdjacentHTML("beforeend",`<span class="vshade"></span><span class="vopen">${OPEN}</span><span class="vplay">${PLAY}</span>`);
    return a;
  }

  videoIds.forEach((id,i)=>track.appendChild(buildCard(id,i,false)));
  videoIds.forEach(upgradeThumb);

  // ---- Looping geometry -------------------------------------------------
  const count=videoIds.length;
  let groupWidth=0;          // pixel width of one full set of cards (incl. gaps)
  let x=0;                   // current translateX (always in (-groupWidth, 0])

  function measure(){
    const cards=track.querySelectorAll(".vcard");
    if(cards.length<count) return;
    const gap=parseFloat(getComputedStyle(track).columnGap)||0;
    const first=cards[0], last=cards[count-1];
    groupWidth=(last.offsetLeft+last.offsetWidth+gap)-first.offsetLeft;
    if(!groupWidth) return;
    // Enough copies that the visible window is never left empty.
    const needed=Math.max(2,Math.ceil(rail.clientWidth/groupWidth)+1);
    const have=Math.floor(cards.length/count);
    for(let c=have;c<needed;c++){
      videoIds.forEach((id,i)=>track.appendChild(buildCard(id,i,true)));
    }
  }

  function wrap(){
    if(!groupWidth) return;
    x=x%groupWidth;
    if(x>0) x-=groupWidth;
  }

  // ---- Motion -----------------------------------------------------------
  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
  const CRUISE=()=>reduceMotion.matches?0:44;   // px per second, moving left
  let v=0;                    // current speed (px/s, positive = moving left)
  let hovering=false, focused=false, dragging=false;
  let raf=0, last=0;

  function frame(now){
    const dt=Math.min(.05,(now-last)/1000||0);
    last=now;
    if(!dragging){
      const target=(hovering||focused)?0:CRUISE();
      // Frame-rate independent easing toward the target speed.
      v+=(target-v)*(1-Math.exp(-dt*2.6));
      x-=v*dt;
    }
    wrap();
    track.style.transform=`translate3d(${x.toFixed(2)}px,0,0)`;
    raf=requestAnimationFrame(frame);
  }
  function start(){ if(!raf){ last=performance.now(); raf=requestAnimationFrame(frame);} }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf=0; } }

  // Only animate while the rail is on screen. The first time it appears,
  // cards stagger in.
  if("IntersectionObserver" in window){
    new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){ rail.classList.add("is-in"); start(); }
        else stop();
      });
    },{threshold:.12}).observe(rail);
  }else{
    rail.classList.add("is-in");
    start();
  }

  // ---- Pointer: hover slow-down, spotlight, drag with momentum ---------
  rail.addEventListener("pointerenter",e=>{ if(e.pointerType==="mouse") hovering=true; });
  rail.addEventListener("pointerleave",()=>{ hovering=false; });

  rail.addEventListener("pointermove",e=>{
    if(dragging) return;
    const card=e.target.closest?.(".vcard");
    if(!card) return;
    const r=card.getBoundingClientRect();
    card.style.setProperty("--mx",`${e.clientX-r.left}px`);
    card.style.setProperty("--my",`${e.clientY-r.top}px`);
  });

  let startX=0, startPos=0, moved=false, suppressClick=false;
  let lastX=0, lastT=0, flingV=0, activeId=null;

  rail.addEventListener("pointerdown",e=>{
    if(e.pointerType==="mouse" && e.button!==0) return;
    dragging=true; moved=false; activeId=e.pointerId;
    startX=lastX=e.clientX; startPos=x; lastT=performance.now(); flingV=0;
  });
  rail.addEventListener("pointermove",e=>{
    if(!dragging || e.pointerId!==activeId) return;
    const dx=e.clientX-startX;
    if(!moved && Math.abs(dx)>6){
      moved=true;
      try{rail.setPointerCapture(e.pointerId);}catch(_){}
      rail.classList.add("is-dragging");
    }
    if(!moved) return;
    x=startPos+dx;
    const now=performance.now(), dt=(now-lastT)/1000;
    if(dt>0){
      const inst=-(e.clientX-lastX)/dt;            // px/s in "moving left" terms
      flingV=flingV*.6+inst*.4;                    // smooth the estimate
    }
    lastX=e.clientX; lastT=now;
  });
  function endDrag(e){
    if(!dragging || (e && e.pointerId!==activeId)) return;
    dragging=false;
    rail.classList.remove("is-dragging");
    if(moved){
      v=Math.max(-2600,Math.min(2600,flingV));     // hand momentum to the easing loop
      suppressClick=true;
      setTimeout(()=>{suppressClick=false;},60);
      try{rail.releasePointerCapture(activeId);}catch(_){}
    }
    activeId=null;
  }
  rail.addEventListener("pointerup",endDrag);
  rail.addEventListener("pointercancel",endDrag);
  // A drag must never open a video.
  rail.addEventListener("click",e=>{ if(suppressClick){e.preventDefault();e.stopPropagation();} },true);
  rail.addEventListener("dragstart",e=>e.preventDefault());

  // ---- Keyboard focus: pause and keep the focused card in view ----------
  rail.addEventListener("focusin",e=>{
    focused=true;
    rail.scrollLeft=0;                              // browsers may try to scroll the clipped rail
    const card=e.target.closest?.(".vcard");
    if(!card) return;
    const rr=rail.getBoundingClientRect(), cr=card.getBoundingClientRect();
    const pad=Math.min(80,rr.width*.08);
    if(cr.left<rr.left+pad) x+=(rr.left+pad)-cr.left;
    else if(cr.right>rr.right-pad) x-=cr.right-(rr.right-pad);
  });
  rail.addEventListener("focusout",e=>{
    if(!rail.contains(e.relatedTarget)) focused=false;
  });

  // ---- Layout upkeep ----------------------------------------------------
  function relayout(){ measure(); wrap(); }
  if("ResizeObserver" in window) new ResizeObserver(relayout).observe(rail);
  window.addEventListener("resize",relayout);
  window.addEventListener("load",relayout);
  relayout();
})();

// Application role switching. This is safe on every page; controls only exist on /forms/.
const roleTabs=document.querySelectorAll(".role-tab");
const roleField=document.getElementById("roleField");
const subjectField=document.getElementById("subjectField");
const scriptWriterFields=document.getElementById("scriptWriterFields");
const moderatorFields=document.getElementById("moderatorFields");
const generalApplication=document.getElementById("generalApplication");
const generalApplicationLabel=document.getElementById("generalApplicationLabel");
const scriptRequiredFields=scriptWriterFields ? scriptWriterFields.querySelectorAll("[data-script-required]") : [];
const moderatorRequiredFields=moderatorFields ? moderatorFields.querySelectorAll("[data-moderator-required]") : [];
function setRole(role){
  roleTabs.forEach(x=>x.classList.toggle("selected",x.dataset.role===role));
  if(roleField) roleField.value=role;
  if(subjectField) subjectField.value=`Mirage Productions application — ${role}`;
  const isWriter=role==="Script Writer";
  const isModerator=role==="Moderator";
  if(scriptWriterFields) scriptWriterFields.hidden=!isWriter;
  if(moderatorFields) moderatorFields.hidden=!isModerator;
  scriptRequiredFields.forEach(field=>field.required=isWriter);
  moderatorRequiredFields.forEach(field=>field.required=isModerator);
  if(generalApplication) generalApplication.required=!isWriter&&!isModerator;
  if(generalApplicationLabel) generalApplicationLabel.style.display=(isWriter||isModerator)?"none":"block";
}
roleTabs.forEach(btn=>btn.addEventListener("click",()=>setRole(btn.dataset.role)));
if(roleTabs.length) setRole("Actor");

// Reveal effects only on elements that exist on the current page.
const revealTargets=document.querySelectorAll(".section-head, .creator-card, .application-form, .info-card");
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
