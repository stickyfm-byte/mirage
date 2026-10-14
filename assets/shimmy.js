/*
 * Shimmy: shared behaviour for the 404 and thank-you pages.
 * - the eyes follow the pointer (and look around on their own when idle)
 * - a speech bubble cycles through the lines in data-lines
 * - poking Shimmy (click / tap / Enter) squishes it and says data-poke's line
 */
(function(){
  "use strict";
  var stage=document.getElementById("nfStage"),
      mascot=document.getElementById("nfMascot"),
      reflect=document.getElementById("nfReflect"),
      poke=document.getElementById("nfPoke"),
      bubble=document.getElementById("nfBubble");
  if(!stage||!mascot) return;

  // Reflection: a flipped, rippling copy beneath Shimmy (the mirage on the ground).
  if(reflect) reflect.innerHTML=mascot.innerHTML;

  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var lastMove=0;
  function look(x,y){
    stage.style.setProperty("--ex",x.toFixed(2)+"px");
    stage.style.setProperty("--ey",y.toFixed(2)+"px");
  }
  window.addEventListener("pointermove",function(e){
    lastMove=performance.now();
    var r=mascot.getBoundingClientRect();
    var dx=(e.clientX-(r.left+r.width/2))/(window.innerWidth*.35);
    var dy=(e.clientY-(r.top+r.height*.4))/(window.innerHeight*.35);
    look(Math.max(-1,Math.min(1,dx))*.95,Math.max(-1,Math.min(1,dy))*.6);
  },{passive:true});
  var glances=[[-.9,0],[.9,-.1],[0,-.6],[.5,.4],[0,0],[-.6,.3]],gi=0;
  if(!reduce) setInterval(function(){
    if(performance.now()-lastMove>3200){ gi=(gi+1)%glances.length; look(glances[gi][0],glances[gi][1]); }
  },2300);

  var lines=[];
  try{ lines=JSON.parse(bubble&&bubble.getAttribute("data-lines")||"[]"); }catch(e){}
  var pokeLine=parseInt(bubble&&bubble.getAttribute("data-poke"),10);
  var li=0,swapTimer=0;
  function say(i){
    if(!bubble||!lines.length) return;
    clearTimeout(swapTimer);
    bubble.classList.add("swap");
    swapTimer=setTimeout(function(){ bubble.textContent=lines[i]; bubble.classList.remove("swap"); },reduce?0:380);
  }
  if(!reduce && lines.length>1) setInterval(function(){ li=(li+1)%lines.length; say(li); },5200);
  if(poke) poke.addEventListener("click",function(){
    poke.classList.remove("poked"); void poke.offsetWidth; poke.classList.add("poked");
    if(!isNaN(pokeLine) && lines[pokeLine]){ li=pokeLine; say(pokeLine); setTimeout(function(){ li=0; },2000); }
  });
})();
