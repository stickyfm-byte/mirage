/*
 * Mirage: terms acknowledgement + cookie choices.
 * Google Analytics is NOT loaded until the visitor chooses "Accept all".
 * "Essential only" keeps it off, and the footer's "Cookie settings" link lets
 * anyone change their mind later.
 */
(function(){
  "use strict";
  var GA_ID="G-8CP2K9MB7N";
  var POLICY_KEY="miragePoliciesAccepted";
  var GA_KEY="mirageAnalytics";            // "granted" | "denied"
  var banner=null;

  function read(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function write(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  function loadAnalytics(){
    window["ga-disable-"+GA_ID]=false;
    if(window.__mirageGA) return;
    window.__mirageGA=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){ window.dataLayer.push(arguments); };
    var s=document.createElement("script");
    s.async=true;
    s.src="https://www.googletagmanager.com/gtag/js?id="+GA_ID;
    document.head.appendChild(s);
    window.gtag("js",new Date());
    window.gtag("config",GA_ID);
  }

  function stopAnalytics(){
    window["ga-disable-"+GA_ID]=true;
    var names=document.cookie.split(";").map(function(c){return c.split("=")[0].trim();})
      .filter(function(n){return n==="_ga"||n.indexOf("_ga_")===0||n==="_gid"||n.indexOf("_gat")===0;});
    if(!names.length) return;
    var parts=location.hostname.split("."), domains=[""];
    domains.push(location.hostname);
    for(var i=1;i<parts.length-1;i++) domains.push("."+parts.slice(i).join("."));
    names.forEach(function(n){
      domains.forEach(function(d){
        document.cookie=n+"=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"+(d?"; domain="+d:"");
      });
    });
  }

  function build(){
    if(banner) return banner;
    banner=document.createElement("div");
    banner.id="policyBanner";
    banner.className="policy-banner hidden";
    banner.setAttribute("role","dialog");
    banner.setAttribute("aria-label","Mirage terms, policies and cookie choices");
    banner.setAttribute("aria-hidden","true");
    banner.innerHTML=
      '<div class="policy-banner-copy">'+
        '<strong>Welcome to Mirage</strong>'+
        '<p>By continuing to use Mirage, you acknowledge that you have read and agree to our <a href="/legal/#terms">Terms of Service</a> and acknowledge our other policies. '+
        'We would also like to use Google Analytics to see how the site is used so we can make it better. It stays off unless you choose <em>Accept all</em>. '+
        '<a href="/legal/#privacy">Privacy details</a></p>'+
      '</div>'+
      '<div class="policy-banner-actions">'+
        '<a class="button secondary policy-banner-review" href="/legal/">Review policies</a>'+
        '<button class="button secondary" type="button" data-consent="essential">Essential only</button>'+
        '<button class="button primary" type="button" id="acceptPolicies" data-consent="all">Accept all</button>'+
      '</div>';
    banner.addEventListener("click",function(e){
      var btn=e.target.closest&&e.target.closest("[data-consent]");
      if(!btn) return;
      e.preventDefault();
      choose(btn.getAttribute("data-consent"));
    });
    document.body.appendChild(banner);
    return banner;
  }

  function show(focus){
    build();
    banner.classList.remove("hidden");
    banner.removeAttribute("aria-hidden");
    if(focus){ var b=banner.querySelector('[data-consent="all"]'); if(b) b.focus(); }
  }
  function hide(){
    if(!banner) return;
    banner.classList.add("hidden");
    banner.setAttribute("aria-hidden","true");
  }
  function choose(level){
    write(POLICY_KEY,"1");
    if(level==="all"){ write(GA_KEY,"granted"); loadAnalytics(); }
    else{ write(GA_KEY,"denied"); stopAnalytics(); }
    hide();
  }

  function init(){
    build();
    var analytics=read(GA_KEY);
    if(analytics==="granted") loadAnalytics();
    // Ask if they have never chosen. Visitors from before analytics existed are asked once too.
    if(read(POLICY_KEY)!=="1" || analytics===null) show(false); else hide();
    document.addEventListener("click",function(e){
      var t=e.target.closest&&e.target.closest("[data-cookie-settings]");
      if(t){ e.preventDefault(); show(true); }
    });
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();
