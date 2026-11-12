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
  document.body.classList.toggle("labels-on",!!c.site?.showLabels);
  if(c.site?.serverIp) SERVER_IP=c.site.serverIp;
  if(c.site?.discordUrl) document.querySelectorAll('a[href^="https://discord.gg/"]').forEach(a=>a.setAttribute("href",safeUrl(c.site.discordUrl)));
  if(Number.isFinite(c.videoRail?.speed)) RAIL_SPEED=c.videoRail.speed;

  // Alert banners (every page). Uses c.banners[]; falls back to the old single announcement.
  (function(){
    let list=Array.isArray(c.banners)?c.banners.slice():[];
    const an=c.site?.announcement;
    if(!list.length&&an?.enabled&&an.text) list=[{id:"legacy",enabled:true,level:"info",text:an.text,link:an.link,linkLabel:an.linkLabel}];
    const now=Date.now();
    const live=b=>{if(!b||!b.enabled||!b.text)return false;const s=b.start&&Date.parse(b.start),e=b.end&&Date.parse(b.end);return !(s&&now<s)&&!(e&&now>e);};
    let wrap=document.getElementById("alertStack");
    if(!wrap){wrap=el("div",{id:"alertStack",class:"alert-stack"});document.body.prepend(wrap);}
    wrap.textContent="";
    list.filter(live).forEach(b=>{
      const key="mirage-dismiss-"+(b.id||"x")+"-"+b.text.length;
      let gone=false;try{gone=b.dismissible&&localStorage.getItem(key);}catch(_){}
      if(gone)return;
      const lv=["info","success","warn","critical"].includes(b.level)?b.level:"info";
      const bar=el("div",{class:"alert-bar lv-"+lv,role:lv==="critical"?"alert":"status"},[el("span",{text:b.text})]);
      if(b.link)bar.appendChild(el("a",{href:safeUrl(b.link),target:"_blank",rel:"noopener",text:b.linkLabel||"Learn more ↗"}));
      if(b.dismissible){const x=el("button",{class:"alert-x",type:"button","aria-label":"Dismiss",text:"✕"});x.addEventListener("click",()=>{try{localStorage.setItem(key,"1");}catch(_){}bar.remove();});bar.appendChild(x);}
      wrap.appendChild(bar);
    });
  })();

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
  // Support page: checklist + contact cards
  const tips=document.getElementById("supportTips");
  if(tips&&Array.isArray(c.support?.tips)){tips.textContent="";c.support.tips.filter(Boolean).forEach(t=>tips.appendChild(el("li",{text:t})));}
  const sc=document.getElementById("supportContacts");
  if(sc&&(c.footer?.emails||c.site?.discordUrl)){
    const ICON={chat:'<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',mail:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'};
    const card=(href,icon,title,sub,ext)=>{
      const a=el("a",{class:"contact-card",href:safeUrl(href)});
      if(ext){a.target="_blank";a.rel="noopener noreferrer";}
      const ic=el("span",{class:"c-icon"});ic.innerHTML=ICON[icon];
      a.appendChild(ic);a.appendChild(el("span",{},[el("b",{text:title}),el("small",{text:sub})]));
      return a;
    };
    const names={contact:"General enquiries",applications:"Applications",staff:"Staff",support:"Support"};
    sc.textContent="";
    sc.appendChild(card(c.site?.discordUrl||"https://discord.gg/mirageevents","chat","Discord","Chat with the community and staff",true));
    (c.footer?.emails||[]).filter(Boolean).forEach(m=>{
      const local=m.split("@")[0];
      sc.appendChild(card("mailto:"+m,"mail",names[local.toLowerCase()]||local.charAt(0).toUpperCase()+local.slice(1),m,false));
    });
  }
  if(Array.isArray(c.forms?.roles) && c.forms.roles.some(r=>r.questions&&r.questions.length)) FORMS=Object.assign({},DEFAULT_FORMS,c.forms);
  if(Array.isArray(c.creators) && c.creators.length) creators=c.creators;
  if(Array.isArray(c.videos)){
    const ids=c.videos.map(v=>typeof v==="string"?v:v.id).filter(Boolean);
    if(ids.length) videoIds=ids;
  }
}
const IS_PREVIEW=/[?&]preview=1/.test(location.search);
const contentReady=(IS_PREVIEW
  ? Promise.resolve().then(()=>{try{return JSON.parse(localStorage.getItem("mirage-preview"));}catch(_){return null;}})
  : Promise.resolve(null)
).then(p=>p||fetch("/content.json",{cache:"no-cache"}).then(r=>r.ok?r.json():null).catch(()=>null));

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
  initRoles();
});

// ---------------------------------------------------------------------------
// Application form: built from the definition in content.json (forms.*).
// DEFAULT_FORMS is only used if content.json can't be loaded.
// ---------------------------------------------------------------------------
const DEFAULT_FORMS={"title": "Join the Mirage Team", "text": "Pick a role, tell us about yourself and send it in. Give accurate details so the team can review your application properly.", "rolesHeading": "Choose a role", "successTitle": "Application sent", "successText": "Thanks for applying to Mirage. The team will review it and get in touch on Discord or by email.", "roles": [{"name": "Actor", "open": true, "note": "", "closesOn": "", "color": "#5865F2", "legend": "Your application", "sub": "Tell us about yourself, your experience and your availability.", "introTitle": "", "introText": "", "questions": [{"id": "q31440510", "label": "Application", "type": "textarea", "required": true, "placeholder": "Tell us about yourself, your experience and your availability.", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "qd2364e7b", "label": "Additional Information", "type": "textarea", "required": false, "placeholder": "Anything else the team should know", "help": "", "width": "full", "maxLength": 1000, "options": []}]}, {"name": "Trusted", "open": true, "note": "", "closesOn": "", "color": "#57F287", "legend": "Your application", "sub": "Tell us about yourself, your experience and your availability.", "introTitle": "", "introText": "", "questions": [{"id": "qb4f11edb", "label": "Application", "type": "textarea", "required": true, "placeholder": "Tell us about yourself, your experience and your availability.", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "q7d68b3fc", "label": "Additional Information", "type": "textarea", "required": false, "placeholder": "Anything else the team should know", "help": "", "width": "full", "maxLength": 1000, "options": []}]}, {"name": "Builder", "open": true, "note": "", "closesOn": "", "color": "#FEE75C", "legend": "Your application", "sub": "Tell us about yourself, your experience and your availability.", "introTitle": "", "introText": "", "questions": [{"id": "qfb71dba6", "label": "Application", "type": "textarea", "required": true, "placeholder": "Tell us about yourself, your experience and your availability.", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "qcccb0820", "label": "Additional Information", "type": "textarea", "required": false, "placeholder": "Anything else the team should know", "help": "", "width": "full", "maxLength": 1000, "options": []}]}, {"name": "Script Writer", "open": true, "note": "", "closesOn": "", "color": "#EB459E", "legend": "Writing experience", "sub": "", "introTitle": "Script Writer", "introText": "Tell us about your writing experience, how you approach storytelling, and what you could bring to Mirage Events.", "questions": [{"id": "q9e1b6634", "label": "Timezone", "type": "text", "required": true, "placeholder": "e.g. GMT / BST", "help": "", "width": "half", "maxLength": 100, "options": []}, {"id": "qca2f6b61", "label": "Availability", "type": "text", "required": true, "placeholder": "e.g. 8–12 hours per week", "help": "", "width": "half", "maxLength": 300, "options": []}, {"id": "q8a39f996", "label": "Previous writing experience", "type": "textarea", "required": true, "placeholder": "Tell us about any scripts, stories, SMPs, events or other projects you have written for.", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "qd304bf9e", "label": "Portfolio / writing samples", "type": "textarea", "required": false, "placeholder": "Links to previous work, documents or videos (optional).", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "qc6f35e1c", "label": "Why do you want to join Mirage as a Script Writer?", "type": "textarea", "required": true, "placeholder": "Tell us what interests you about writing for Mirage Events.", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "q91be0fe7", "label": "How would you build a storyline for a Minecraft event?", "type": "textarea", "required": true, "placeholder": "Explain how you would develop characters, conflict, pacing and a satisfying conclusion.", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "q36ebafda", "label": "Writing sample", "type": "textarea", "required": true, "placeholder": "Write a short scene for a Minecraft event. Include at least two characters and a clear source of tension or conflict.", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "qf2349ae4", "label": "Working with a team", "type": "textarea", "required": true, "placeholder": "How do you handle feedback, changes to your writing and working from someone else's plot or ideas?", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "qac48faca", "label": "Additional Information", "type": "textarea", "required": false, "placeholder": "Anything else the team should know", "help": "", "width": "full", "maxLength": 1000, "options": []}]}, {"name": "Moderator", "open": true, "note": "", "closesOn": "", "color": "#ED4245", "legend": "Staff experience", "sub": "", "introTitle": "Moderator", "introText": "Tell us about your staff experience, judgement, and how you would help keep the Mirage community safe and welcoming. Previous staff experience is useful but not required.", "questions": [{"id": "qb6d58eaa", "label": "Timezone", "type": "text", "required": true, "placeholder": "e.g. GMT / BST", "help": "", "width": "half", "maxLength": 100, "options": []}, {"id": "q4a880045", "label": "Availability", "type": "text", "required": true, "placeholder": "e.g. evenings and weekends", "help": "", "width": "half", "maxLength": 300, "options": []}, {"id": "q2036f45c", "label": "Past staff experience", "type": "textarea", "required": true, "placeholder": "What servers or communities have you helped staff? Describe your role and responsibilities. If you have no past staff experience, explain that and share relevant skills.", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "qd89bc101", "label": "Moderation experience and tools", "type": "textarea", "required": true, "placeholder": "Describe experience with reports, rule enforcement, tickets, logs or moderation bots, or how you would learn.", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "q80332f1b", "label": "Why do you want to be a Mirage Moderator?", "type": "textarea", "required": true, "placeholder": "What interests you about helping this community, and what strengths would you bring?", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "q39db346b", "label": "Scenario: a player reports harassment, but you did not witness it. What would you do?", "type": "textarea", "required": true, "placeholder": "Explain how you would gather context, preserve evidence, protect privacy and decide whether to escalate.", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "q95acdaf8", "label": "Handling conflict and staying fair", "type": "textarea", "required": true, "placeholder": "How would you respond if a friend broke a rule, or a player disagreed with a moderation decision?", "help": "", "width": "full", "maxLength": 1000, "options": []}, {"id": "q69eac53d", "label": "Additional Information", "type": "textarea", "required": false, "placeholder": "Anything else the team should know", "help": "", "width": "full", "maxLength": 1000, "options": []}]}], "submitLabel": "Send application", "privacyNote": "Your details go to the Mirage team and are shared with authorised reviewers in a private Discord channel.", "minAge": 13, "core": {"legend": "About you", "sub": "Reviewers use these to find and contact you. You must be 13 or older to apply.", "fields": [{"key": "Minecraft Username", "label": "Minecraft username", "placeholder": "Your in-game name"}, {"key": "Email", "label": "Email", "placeholder": "you@example.com"}, {"key": "Discord", "label": "Discord username", "placeholder": "username"}, {"key": "Age", "label": "Age", "placeholder": "13 or older"}]}};
let FORMS=DEFAULT_FORMS;
const isClosed=r=>r.open===false||(r.closesOn&&new Date(r.closesOn+"T23:59:59")<new Date());
const subjectField=document.getElementById("subjectField");
let CURRENT_ROLE=null;
function buildField(q,nameOverride){
  const name=nameOverride||q.label;
  const half=q.width==="half"?"half":"full";
  const type=q.type||"text";
  const star=()=>q.required?el("span",{class:"req",text:"*"}):el("em",{class:"opt",text:"optional"});
  const help=()=>q.help?el("small",{class:"help",text:q.help}):null;
  if(["radio","yesno","checkbox"].includes(type)){
    const opts=type==="yesno"?["Yes","No"]:(q.options||[]);
    const g=el("fieldset",{class:"fld-group "+half});
    if(q.required) { g.dataset.required="1"; g.dataset.label=q.label; }
    const lg=el("legend",{text:q.label});lg.appendChild(star());g.appendChild(lg);
    const h=help();if(h) g.appendChild(h);
    const list=el("div",{class:"choices"});
    opts.forEach((o,i)=>{
      const inp=el("input",{type:type==="checkbox"?"checkbox":"radio",name:name,value:o});
      if(q.required&&type!=="checkbox"&&i===0) inp.required=true;
      list.appendChild(el("label",{class:"choice"},[inp,el("span",{text:o})]));
    });
    g.appendChild(list);return g;
  }
  const L=el("label",{class:"fld "+half});
  L.appendChild(document.createTextNode(q.label));L.appendChild(star());
  let inp;
  if(type==="textarea"){
    inp=el("textarea",{name:name,rows:q.rows||5});
  }else if(type==="select"){
    inp=el("select",{name:name});
    inp.appendChild(el("option",{value:"",text:q.placeholder||"Choose an option"}));
    (q.options||[]).forEach(o=>inp.appendChild(el("option",{value:o,text:o})));
  }else{
    inp=el("input",{type:["email","url","number"].includes(type)?type:"text",name:name});
    if(type==="number"){inp.setAttribute("inputmode","numeric");}
    inp.setAttribute("autocomplete",type==="email"?"email":"off");
  }
  if(q.placeholder&&type!=="select") inp.setAttribute("placeholder",q.placeholder);
  if(q.required) inp.required=true;
  if(q.maxLength&&type!=="number"&&type!=="select") inp.setAttribute("maxlength",String(q.maxLength));
  L.appendChild(inp);
  const h=help();if(h) L.appendChild(h);
  if(type==="textarea"){
    const c=el("span",{class:"count","aria-hidden":"true"});L.appendChild(c);
    const upd=()=>{c.textContent=q.maxLength?inp.value.length+" / "+q.maxLength:(inp.value.length?inp.value.length+" characters":"");};
    inp.addEventListener("input",upd);upd();
  }
  return L;
}
function renderCore(){
  const box=document.getElementById("coreBlock");
  if(!box) return;
  const core=FORMS.core||DEFAULT_FORMS.core;
  box.textContent="";
  box.appendChild(el("h3",{class:"form-legend",text:core.legend||"About you"}));
  if(core.sub) box.appendChild(el("p",{class:"form-sub",text:core.sub}));
  const grid=el("div",{class:"fld-grid"});
  const types={Email:"email",Age:"number"};
  (core.fields||[]).forEach(fd=>{
    const fld=buildField({label:fd.label||fd.key,type:types[fd.key]||"text",required:true,placeholder:fd.placeholder||"",help:fd.help||"",width:"half",maxLength:fd.key==="Email"?200:100},fd.key);
    if(fd.key==="Age"){const i=fld.querySelector("input");i.min=FORMS.minAge||13;i.max=99;}
    grid.appendChild(fld);
  });
  box.appendChild(grid);
}
function renderRole(cfg){
  const box=document.getElementById("roleBlock");
  if(!box) return;
  box.textContent="";
  box.appendChild(el("h3",{class:"form-legend",text:cfg.legend||"Your application"}));
  if(cfg.sub) box.appendChild(el("p",{class:"form-sub",text:cfg.sub}));
  if(cfg.introTitle||cfg.introText){
    const intro=el("div",{class:"role-intro"});
    if(cfg.introTitle) intro.appendChild(el("strong",{class:"intro-title",text:cfg.introTitle}));
    if(cfg.introText) intro.appendChild(el("p",{text:cfg.introText}));
    box.appendChild(intro);
  }
  const grid=el("div",{class:"fld-grid"});
  (cfg.questions||[]).forEach(q=>grid.appendChild(buildField(q)));
  box.appendChild(grid);
  restoreDraft(cfg.name);
}
function setRole(role){
  CURRENT_ROLE=role;
  document.querySelectorAll(".role-tab").forEach(x=>x.classList.toggle("selected",x.dataset.role===role));
  const cfg=(FORMS.roles||[]).find(r=>r.name===role)||(FORMS.roles||[])[0];
  if(!cfg) return;
  const closed=isClosed(cfg);
  const roleField=document.getElementById("roleField");
  if(roleField) roleField.value=cfg.name;
  if(subjectField) subjectField.value="Mirage Productions application — "+cfg.name;
  const form=document.getElementById("applicationForm"),cl=document.getElementById("roleClosed");
  if(form) form.classList.toggle("is-closed",!!closed);
  if(cl){cl.hidden=!closed;cl.textContent="";if(closed){cl.appendChild(el("h3",{text:cfg.name+" applications are closed"}));cl.appendChild(el("p",{text:cfg.note||"We're not taking applications for this role right now. Check back soon or ask in our Discord."}));}}
  const applyAs=document.getElementById("applyAs");
  if(applyAs) applyAs.textContent=cfg.name;
  if(!closed) renderRole(cfg); else {const rb=document.getElementById("roleBlock");if(rb) rb.textContent="";}
  const sb=document.getElementById("submitBtn");
  if(sb){sb.dataset.label=FORMS.submitLabel||"Send application";if(!sb.disabled) sb.textContent=sb.dataset.label;}
  const pn=document.getElementById("privacyNote");
  if(pn&&FORMS.privacyNote) pn.textContent=FORMS.privacyNote;
}
function buildRoleTabs(roles){
  const wrap=document.querySelector(".role-tabs");
  if(!wrap) return;
  wrap.textContent="";
  roles.forEach(r=>{
    const closed=isClosed(r);
    const b=el("button",{type:"button",class:"role-tab"+(closed?" closed":""),"data-role":r.name,text:r.name});
    if(closed) b.appendChild(el("small",{text:" · Closed"}));
    wrap.appendChild(b);
  });
}
const roleWrap=document.querySelector(".role-tabs");
if(roleWrap) roleWrap.addEventListener("click",e=>{const b=e.target.closest(".role-tab");if(b) setRole(b.dataset.role);});
function initRoles(){
  if(!document.getElementById("applicationForm")) return;
  if(!Array.isArray(FORMS.roles)||!FORMS.roles.length) FORMS=DEFAULT_FORMS;
  buildRoleTabs(FORMS.roles);
  renderCore();
  const want=new URLSearchParams(location.search).get("role");
  const d=readDraft();
  const pick=[want,d&&d.role].map(n=>FORMS.roles.find(r=>r.name===n&&!isClosed(r))).find(Boolean)
    ||(want&&FORMS.roles.find(r=>r.name===want))||FORMS.roles.find(r=>!isClosed(r))||FORMS.roles[0];
  setRole(pick.name);
}

// Reveal effects only on elements that exist on the current page.
const revealTargets=document.querySelectorAll(".section-head, .creator-card, .application-form, .info-card, .info-reveal");
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
// Forms: draft saving (long answers only; never email, age or usernames)
// ---------------------------------------------------------------------------
const DRAFT_KEY="mirage-application-draft";
function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");}catch(_){return null;}}
function restoreDraft(role){
  const note=document.getElementById("draftNote");
  const d=readDraft();
  if(!d||d.role!==role||!d.a){if(note)note.hidden=true;return;}
  document.querySelectorAll("#roleBlock textarea").forEach(t=>{
    if(d.a[t.name]){t.value=d.a[t.name];t.dispatchEvent(new Event("input"));}
  });
  if(note)note.hidden=false;
}
(function draftSaver(){
  const form=document.getElementById("applicationForm");
  if(!form) return;
  const note=document.getElementById("draftNote");
  let timer;
  form.addEventListener("input",e=>{
    if(e.target.tagName!=="TEXTAREA") return;
    clearTimeout(timer);
    timer=setTimeout(()=>{
      try{
        const a={};
        document.querySelectorAll("#roleBlock textarea").forEach(t=>{if(t.value.trim()) a[t.name]=t.value;});
        if(Object.keys(a).length){localStorage.setItem(DRAFT_KEY,JSON.stringify({role:CURRENT_ROLE,a}));if(note)note.hidden=false;}
        else{localStorage.removeItem(DRAFT_KEY);if(note)note.hidden=true;}
      }catch(_){}
    },500);
  });
  window.clearApplicationDraft=()=>{try{localStorage.removeItem(DRAFT_KEY);}catch(_){} if(note)note.hidden=true;};
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


// ---------------------------------------------------------------------------
// Navbar: mobile menu button + "scrolled" state
// ---------------------------------------------------------------------------
(function navbar(){
  const bar=document.querySelector(".topbar");
  const nav=bar&&bar.querySelector("nav");
  if(!bar||!nav) return;
  nav.id=nav.id||"siteNav";
  const btn=document.createElement("button");
  btn.type="button";btn.className="nav-toggle";
  btn.setAttribute("aria-label","Open menu");btn.setAttribute("aria-expanded","false");btn.setAttribute("aria-controls",nav.id);
  btn.innerHTML="<span></span><span></span><span></span>";
  bar.appendChild(btn);
  const set=open=>{
    bar.classList.toggle("nav-open",open);
    btn.setAttribute("aria-expanded",String(open));
    btn.setAttribute("aria-label",open?"Close menu":"Open menu");
  };
  btn.addEventListener("click",e=>{e.stopPropagation();set(!bar.classList.contains("nav-open"));});
  nav.addEventListener("click",e=>{if(e.target.closest("a"))set(false);});
  document.addEventListener("click",e=>{if(!bar.contains(e.target))set(false);});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")set(false);});
  window.addEventListener("resize",()=>{if(innerWidth>860)set(false);});
  const onScroll=()=>bar.classList.toggle("is-scrolled",scrollY>12);
  onScroll();addEventListener("scroll",onScroll,{passive:true});
})();
