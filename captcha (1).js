const P=[
 {a:"GHOUL",c:"Halloween",g:["GRAVE","SKULL","BROOM"]},
 {a:"WITCH",c:"Halloween",g:["TRICK","HAUNT","SPOOK"]},
 {a:"GREED",c:"Goblin",g:["GOLDS","HORDE","TROLL"]},
 {a:"FANGS",c:"Goblin",g:["CLAWS","GRAVE","FIEND"]},
 {a:"SLIME",c:"Green goblin",g:["GREEN","SLUGS","MAGIC"]}
];
const p=P[Math.floor(Math.random()*P.length)];
function score(g,a){const r=Array(5).fill("");const u=a.split("");
 for(let i=0;i<5;i++)if(g[i]===a[i]){r[i]="g";u[i]=null}
 for(let i=0;i<5;i++)if(!r[i]){const j=u.indexOf(g[i]);if(j>-1){r[i]="y";u[j]=null}}
 return r}

const board=document.getElementById("board");
p.g.forEach(w=>{const s=score(w,p.a);const d=document.createElement("div");d.className="row";
 w.split("").forEach((ch,i)=>{const t=document.createElement("div");t.className="t "+s[i];t.textContent=ch;d.appendChild(t)});
 board.appendChild(d)});
const gr=document.getElementById("guess"),go=document.getElementById("go"),msg=document.getElementById("msg"),box=document.getElementById("box");
const ins=[];
for(let i=0;i<5;i++){const e=document.createElement("input");e.className="t";e.maxLength=1;e.autocomplete="off";e.autocapitalize="characters";e.setAttribute("aria-label","Letter "+(i+1));
 e.addEventListener("input",()=>{e.value=e.value.replace(/[^a-zA-Z]/g,"").toUpperCase();if(e.value&&i<4)ins[i+1].focus();chk()});
 e.addEventListener("keydown",k=>{if(k.key==="Backspace"&&!e.value&&i>0){ins[i-1].focus()}if(k.key==="Enter")submit()});
 ins.push(e);gr.appendChild(e)}
ins[0].focus();
function word(){return ins.map(e=>e.value).join("")}
function chk(){go.disabled=word().length<5}
let done=false;
function submit(){if(done||word().length<5)return;done=true;
 ins.forEach(e=>e.disabled=true);go.disabled=true;
 if(word()===p.a){ins[4].classList.add("win");go.className="check ok";box.className="box ok";box.textContent="\u2713";msg.className="msg ok";msg.textContent="Verification successful. You may continue."}
 else{box.className="box no";box.textContent="\u2715";msg.className="msg no";msg.textContent="Verification failed. Please try again with a new challenge.";
  const b=document.createElement("button");b.className="retry";b.textContent="Get a new challenge";b.onclick=()=>location.reload();msg.appendChild(document.createElement("br"));msg.appendChild(b)}}
go.addEventListener("click",submit);
