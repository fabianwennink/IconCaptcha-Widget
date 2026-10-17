const ONES=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const TENS=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
const words=n=>n<20?ONES[n]:TENS[Math.floor(n/10)]+(n%10?" "+ONES[n%10]:"");
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function make(){
  const t=rnd(0,2);let a,b,text,ans;
  if(t===0){a=rnd(6,49);b=rnd(4,45);ans=a+b;text=a+" + "+b}
  else if(t===1){a=rnd(25,99);b=rnd(6,a-4);ans=a-b;text=a+" \u2212 "+b}
  else{a=rnd(3,9);b=rnd(3,9);ans=a*b;text=a+" \u00D7 "+b}
  return {text:"What is "+text+"?",ans:words(ans).replace(/[^a-z]/g,"")};
}
const qEl=document.getElementById("q"),ans=document.getElementById("ans"),go=document.getElementById("go"),box=document.getElementById("box"),msg=document.getElementById("msg");
let cur,done=false;
function fresh(){
  cur=make();qEl.textContent=cur.text;
  ans.value="";ans.disabled=false;ans.className="ans";
  go.disabled=true;go.className="check";box.className="box";box.textContent="";
  msg.className="msg";msg.textContent="";done=false;ans.focus();
}
// Letters, spaces and hyphens only. Digits are silently ignored, so people have to spell the answer out.
const clean=()=>{const v=ans.value.replace(/[^a-zA-Z \-]/g,"");if(v!==ans.value)ans.value=v;go.disabled=ans.value.replace(/[^a-zA-Z]/g,"").length===0};
ans.addEventListener("input",clean);
ans.addEventListener("keydown",e=>{if(e.key==="Enter")submit()});
function submit(){
  if(done||go.disabled)return;done=true;
  const guess=ans.value.toLowerCase().replace(/[^a-z]/g,"");
  ans.disabled=true;go.disabled=true;
  if(guess===cur.ans){
    ans.classList.add("win");go.className="check ok";box.textContent="\u2713";
    msg.className="msg ok";msg.textContent="Verification successful. You may continue.";
  }else{
    box.className="box no";box.textContent="\u2715";
    msg.className="msg no";msg.textContent="Verification failed. Please try again with a new challenge.";
    const b=document.createElement("button");b.className="retry";b.type="button";b.textContent="Get a new challenge";b.onclick=fresh;
    msg.appendChild(document.createElement("br"));msg.appendChild(b);
  }
}
go.addEventListener("click",submit);
fresh();
