let creators=[
{name:"ykni", lookup:"ykni", uuid:"bf2501d592d9430884f66f7fd6c61735", skin:"assets/ykni-skin.png", profile:"https://namemc.com/profile/ykni.8", yt:"https://www.youtube.com/@yknimc"},
{name:"NaltRexo", lookup:"NaltRexo", profile:"https://namemc.com/profile/NaltRexo.2", yt:"https://www.youtube.com/@naltrexi"},
{name:"Kingstxn__", lookup:"Kingstxn__", profile:"https://namemc.com/profile/Kingstxn__.1", yt:"https://www.youtube.com/@Kingston_isGud"}
];

// ---------------------------------------------------------------------------
// Editable content. Everything the Mirage Editor (/admin/) can change lives in
// /content.json. The HTML and the defaults below still work if it can't load.
// ---------------------------------------------------------------------------
let SERVER_IP="mc.miragesmp.org";
let RAIL_SPEED=44;
const getPath=(o,p)=>p.split(".").reduce((x,k)=>x==null?x:x[k],o);
const safeUrl=u=>/^(https?:|mailto:|\/|#|\.\.?\/|assets\/)/i.test(u||"")?u:"#";
function el(tag,props,kids){
  const n=document.createElement(tag);
  Object.entries(props||{}).forEach(([k,v])=>{ if(k==="text") n.textContent=v; else n.setAttribute(k,v); });
  (kids||[]).forEach(c=>n.appendChild(c));
  return n;
}
function applyContent(c){
  if(!c) return;
  document.querySelectorAll("[data-c]").forEach(n=>{
    const v=getPath(c,n.dataset.c);
    if(typeof v==="string" && v!=="") n.textContent=v;
  });
  document.querySelectorAll("[data-c-href]").forEach(n=>{
    const v=getPath(c,n.dataset.cHref);
    if(typeof v==="string" && v) n.setAttribute("href",safeUrl(v));
  });
  if(c.site?.serverIp) SERVER_IP=c.site.serverIp;
  if(c.site?.discordUrl) document.querySelectorAll('a[href^="https://discord.gg/"]').forEach(a=>a.setAttribute("href",safeUrl(c.site.discordUrl)));
  if(Number.isFinite(c.videoRail?.speed)) RAIL_SPEED=c.videoRail.speed;

  // Announcement banner (homepage only)
  const bar=document.getElementById("announceBar");
  const an=c.site?.announcement;
  if(bar && an?.enabled && an.text){
    bar.textContent="";
    bar.appendChild(el("span",{text:an.text}));
    if(an.link) bar.appendChild(el("a",{href:safeUrl(an.link),target:"_blank",rel:"noopener",text:an.linkLabel||"Learn more ↗"}));
    bar.hidden=false;
  }

  // Disclaimer paragraphs
  const dis=document.getElementById("disclaimerBody");
  if(dis && Array.isArray(c.disclaimer?.paragraphs) && c.disclaimer.paragraphs.length){
    dis.textContent="";
    c.disclaimer.paragraphs.forEach(t=>dis.appendChild(el("p",{text:t})));
  }

  // Status rows: homepage grid + status page list
  if(Array.isArray(c.status?.items) && c.status.items.length){
    const row=(i,cls)=>{
      const dot=el("span",{class:"status-dot"+(i.level==="warn"?" warn":i.level==="bad"?" bad":"")});
      return cls==="grid"
        ? el("div",{},[dot,el("b",{text:i.name}),el("span",{text:i.label})])
        : el("div",{class:"system-row"},[dot,el("b",{text:i.name}),el("span",{text:i.label})]);
    };
    const g=document.querySelector(".status-grid");
    if(g){ g.textContent=""; c.status.items.forEach(i=>g.appendChild(row(i,"grid"))); }
    const l=document.querySelector(".system-list");
    if(l){ l.textContent=""; c.status.items.forEach(i=>l.appendChild(row(i,"list"))); }
  }

  // Changelog
  const ul=document.querySelector(".update-list");
  if(ul && Array.isArray(c.updates?.items)){
    ul.textContent="";
    c.updates.items.forEach(u=>ul.appendChild(el("article",{class:"update-card"},[el("time",{text:u.date||""}),el("h2",{text:u.title||""}),el("p",{text:u.body||""})])));
  }

  // Footer (every page)
  const f=c.footer;
  if(f){
    const ol=document.querySelector(".official-links");
    if(ol && Array.isArray(f.officialLinks)){
      ol.textContent="";
      ol.appendChild(el("b",{text:"Official Links"}));
      f.officialLinks.forEach(l=>ol.appendChild(el("a",{href:safeUrl(l.url),target:"_blank",rel:"noopener",text:l.label})));
    }
    const oe=document.querySelector(".official-emails");
    if(oe && Array.isArray(f.emails)){
      oe.textContent="";
      oe.appendChild(el("b",{text:"Contact"}));
      f.emails.forEach(m=>oe.appendChild(el("a",{href:"mailto:"+m,text:m})));
    }
    const sm=document.querySelector("footer small");
    if(sm && f.copyright){ sm.textContent=""; sm.append("© ",el("span",{id:"year",text:String(new Date().getFullYear())})," "+f.copyright); }
  }
  if(Array.isArray(c.creators) && c.creators.length) creators=c.creators;
  if(Array.isArray(c.videos)){
    const ids=c.videos.map(v=>typeof v==="string"?v:v.id).filter(Boolean);
    if(ids.length) videoIds=ids;
  }
}
const contentReady=fetch("/content.json",{cache:"no-cache"}).then(r=>r.ok?r.json():null).catch(()=>null);

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
        await navigator.clipboard.writeText(SERVER_IP);
      }else{
        const area=document.createElement("textarea");
        area.value=SERVER_IP;
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
    const r=await fetch("https://api.mcsrvstat.us/3/"+encodeURIComponent(SERVER_IP),{cache:"no-store"});
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
contentReady.then(()=>serverStatus());
if(document.getElementById("serverState") || document.getElementById("playerCount") || document.getElementById("playerMax")){
  setInterval(serverStatus,30000);
}

const grid=document.getElementById("creatorGrid");
function headUrl(creator){
  if(creator.head) return creator.head;
  return `https://mc-heads.net/avatar/${encodeURIComponent(creator.lookup||creator.name)}/256`;
}
function renderCreators(){
  if(!grid) return;
  grid.textContent="";
  creators.forEach(creator=>{
    const card=document.createElement("article");
    card.className="creator-card";
    const src=headUrl(creator);
    const fallback=creator.head ? "" : ` onerror="this.onerror=null;this.src='https://minotar.net/avatar/${encodeURIComponent(creator.lookup||creator.name)}/256'"`;
    card.innerHTML=`
      <div class="skin-wrap head-wrap">
        <div class="head-glow"></div>
        <img class="creator-head" src="${src}" alt="${esc(creator.name)} Minecraft head" loading="lazy" draggable="false"${fallback}>
      </div>
      <div class="creator-info">
        <div><b>${esc(creator.name)}</b><small>${esc(creator.role||"Minecraft creator")}</small></div>
        <div class="creator-links" aria-label="Creator links">
          <a class="creator-icon-link" href="${safeUrl(creator.profile)}" target="_blank" rel="noopener" aria-label="${esc(creator.name)} on NameMC"><img src="assets/namemc-logo.png" alt="NameMC" draggable="false"></a>
          <a class="creator-icon-link" href="${safeUrl(creator.yt)}" target="_blank" rel="noopener" aria-label="${esc(creator.name)} on YouTube"><img src="assets/youtube-logo.png" alt="YouTube" draggable="false"></a>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}

// ---------------------------------------------------------------------------
// Video rail: a smooth, endlessly looping strip of thumbnails.
// - Motion is driven by requestAnimationFrame with eased speed changes, so
//   hovering slows the rail to a gentle stop instead of freezing it.
// - Drag / swipe it; it keeps its momentum and eases back to cruising speed.
// - Thumbnails start on the always-available hqdefault image and quietly
//   upgrade to maxresdefault when it exists, so cards never show a gap.
// ---------------------------------------------------------------------------
let videoIds=[
  "hoPNEa9tVBw","cHDVYJYpFiE","3vRonNY7BSM","uKXckokWTmM","M1Fe9Z4o0c0",
  "5jlf___qFsc","hEuv1v_b45M","XOhnFGmG_Q8","8gpw4hmgqpk","bkAkwNIf_jg","WIKkHbfah8g",
  "q-4HsTTwHV8","KRinQSDMH2A","Rbsx7DU7JdE"
];

function initVideoRail(){
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
  const CRUISE=()=>reduceMotion.matches?0:RAIL_SPEED;   // px per second, moving left
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
}

contentReady.then(c=>{
  applyContent(c);
  renderCreators();
  initVideoRail();
});

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
  // Hidden role sections must not submit: Script Writer and Moderator share field names
  // (Timezone, Availability), and the hidden copy would overwrite the visible answers.
  [scriptWriterFields,moderatorFields].forEach(sec=>{
    if(sec) sec.querySelectorAll("input,textarea,select").forEach(fld=>{fld.disabled=sec.hidden;});
  });
  const applyAs=document.getElementById("applyAs");
  if(applyAs) applyAs.textContent=role;
  const legend=document.getElementById("roleLegend"),sub=document.getElementById("roleSub");
  if(legend) legend.textContent=isWriter?"Writing experience":isModerator?"Staff experience":"Your application";
  if(sub) sub.textContent=isWriter||isModerator?"":"Tell us about yourself, your experience and your availability.";
  if(sub) sub.hidden=isWriter||isModerator;
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


// ---------------------------------------------------------------------------
// Forms: character counters + draft saving (answers only; never email/age/IDs)
// ---------------------------------------------------------------------------
(function formExtras(){
  const form=document.getElementById("applicationForm");
  if(!form) return;
  const KEY="mirage-application-draft";
  const areas=[...form.querySelectorAll("textarea")];
  areas.forEach(t=>{
    const c=document.createElement("span");c.className="count";c.setAttribute("aria-hidden","true");
    t.insertAdjacentElement("afterend",c);
    const upd=()=>{c.textContent=t.value.length?t.value.length+" characters":"";};
    t.addEventListener("input",upd);t._upd=upd;
  });
  const note=document.getElementById("draftNote");
  let timer;
  const save=()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{
      try{
        const d={role:document.getElementById("roleField")?.value,a:{}};
        areas.forEach(t=>{if(t.value.trim()) d.a[t.name+"|"+areas.indexOf(t)]=t.value;});
        if(Object.keys(d.a).length){localStorage.setItem(KEY,JSON.stringify(d));if(note)note.hidden=false;}
        else{localStorage.removeItem(KEY);if(note)note.hidden=true;}
      }catch(_){}
    },500);
  };
  form.addEventListener("input",e=>{if(e.target.tagName==="TEXTAREA") save();});
  window.clearApplicationDraft=()=>{try{localStorage.removeItem(KEY);}catch(_){} if(note)note.hidden=true; areas.forEach(t=>t._upd&&t._upd());};
  try{
    const d=JSON.parse(localStorage.getItem(KEY)||"null");
    if(d&&d.a){
      const tab=[...document.querySelectorAll(".role-tab")].find(x=>x.dataset.role===d.role);
      if(tab) tab.click();
      Object.entries(d.a).forEach(([k,v])=>{const t=areas[+k.split("|")[1]];if(t&&t.name===k.split("|")[0]){t.value=v;t._upd&&t._upd();}});
      if(note)note.hidden=false;
    }
  }catch(_){}
})();

// Mark the current page in the nav and add a status summary on /status/
(function pageExtras(){
  const path=location.pathname.replace(/index\.html$/,"");
  document.querySelectorAll(".topbar nav a").forEach(a=>{
    const h=a.getAttribute("href");
    if(h&&h!=="/"&&path.startsWith(h)){a.classList.add("active");a.setAttribute("aria-current","page");}
    if(h==="/"&&path==="/"){a.classList.add("active");a.setAttribute("aria-current","page");}
  });
  contentReady.then(()=>{
    const list=document.querySelector(".system-list");
    if(!list||document.querySelector(".status-summary")) return;
    const dots=[...list.querySelectorAll(".status-dot")];
    const bad=dots.some(d=>d.classList.contains("bad")),warn=dots.some(d=>d.classList.contains("warn"));
    const s=document.createElement("div");
    s.className="status-summary"+(bad?" bad":warn?" warn":"");
    s.setAttribute("role","status");
    s.innerHTML='<span class="status-dot'+(bad?" bad":warn?" warn":"")+'"></span><b>'+(bad?"Some systems are down":warn?"Some systems have issues":"All systems operational")+"</b>";
    list.insertAdjacentElement("beforebegin",s);
  });
})();
