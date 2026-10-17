// Set true if a wrong guess should fail the captcha.
// false = user makes one guess, then they're let in.
const FAIL_ON_WRONG=true;
// Each round: 1 cake (looks like the object) + 3 real photos. Drop files into images/roundN/.
const round=n=>[{src:"images/round"+n+"/cake.jpg",cake:true},{src:"images/round"+n+"/real1.jpg"},{src:"images/round"+n+"/real2.jpg"},{src:"images/round"+n+"/real3.jpg"}];
const ROUNDS=[round(1),round(2),round(3)];
const EMOJI=["\uD83C\uDF55","\uD83C\uDF63","\uD83C\uDF54"]; // placeholder tiles shown until real images are added
const ph=e=>"data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e8ecef"/><text x="50" y="62" font-size="40" text-anchor="middle">'+e+'</text></svg>');
const grid=document.getElementById("grid"),go=document.getElementById("go"),box=document.getElementById("box"),msg=document.getElementById("msg");
// Pick one of the sets at random on every load, never the same one twice in a row.
function pickSet(){
  let last=-1;
  try{const v=localStorage.getItem("osbornSet");last=v===null?-1:+v}catch(e){}
  const c=[0,1,2].filter(i=>i!==last);
  const n=c[Math.floor(Math.random()*c.length)];
  try{localStorage.setItem("osbornSet",n)}catch(e){}
  return n;
}
let r=pickSet(),sel=null,wrong=false;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function render(){
  grid.innerHTML="";sel=null;go.disabled=true;
  shuffle(ROUNDS[r]).forEach(o=>{
    const b=document.createElement("button");b.type="button";b.className="tile";b.setAttribute("aria-label","Image option");
    const im=new Image();im.alt="";im.src=o.src;im.onerror=()=>{im.onerror=null;im.src=ph(EMOJI[r])};
    b.appendChild(im);
    b.onclick=()=>{[...grid.children].forEach(c=>c.classList.remove("sel"));b.classList.add("sel");sel=o;go.disabled=false};
    grid.appendChild(b);
  });
}
go.addEventListener("click",()=>{
  if(!sel)return;
  if(!sel.cake)wrong=true;
  grid.querySelectorAll("button").forEach(b=>b.disabled=true);go.disabled=true;
  if(FAIL_ON_WRONG&&wrong){
    box.className="box no";box.textContent="\u2715";msg.className="msg no";msg.textContent="Verification failed. Please try again with a new challenge.";
    const b=document.createElement("button");b.className="retry";b.textContent="Get a new challenge";b.onclick=()=>location.reload();
    msg.appendChild(document.createElement("br"));msg.appendChild(b);
  }else{
    go.className="check ok";box.textContent="\u2713";msg.className="msg ok";msg.textContent="Verification successful. You may continue.";
  }
});
render();
