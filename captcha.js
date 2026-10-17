const DODGES=10;
const arena=document.getElementById("arena"),go=document.getElementById("go"),box=document.getElementById("box"),msg=document.getElementById("msg");
let n=0,last={x:.5,y:.5};
function jump(){
  const aw=arena.clientWidth,ah=arena.clientHeight,bw=go.offsetWidth,bh=go.offsetHeight;
  const minX=bw/2+4,maxX=aw-bw/2-4,minY=bh/2+4,maxY=ah-bh/2-4;
  let x,y,tries=0;
  do{x=minX+Math.random()*(maxX-minX);y=minY+Math.random()*(maxY-minY);tries++}
  while(tries<30&&Math.hypot(x-last.x*aw,y-last.y*ah)<70);
  last={x:x/aw,y:y/ah};
  go.style.left=x+"px";go.style.top=y+"px";
}
go.addEventListener("click",()=>{
  if(n<DODGES){
    n++;jump();
    go.classList.remove("shake");void go.offsetWidth;go.classList.add("shake");
  }else{
    go.disabled=true;go.classList.add("ok");box.textContent="\u2713";
    msg.className="msg ok";msg.textContent="Verification successful. You may continue.";
  }
});
window.addEventListener("resize",()=>{if(n>0&&!go.disabled){go.style.left=last.x*arena.clientWidth+"px";go.style.top=last.y*arena.clientHeight+"px"}});
