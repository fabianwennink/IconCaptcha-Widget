// All sound is synthesized with the Web Audio API, so no audio files are needed.
const NOTES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NATURALS=[0,2,4,5,7,9,11]; // the answer is always a natural note; the dropdown still lists all 12
const INSTRUMENTS=['Piano','Flute','Guitar','Bell'];
let ctx;
function audio(){ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx}
// semis = semitones above C4
function play(inst,semis){
  const ac=audio(),t=ac.currentTime,f=261.63*Math.pow(2,semis/12);
  const bus=ac.createGain();bus.gain.value=0.35;
  if(inst==='Guitar'){
    const lp=ac.createBiquadFilter();lp.type='lowpass';
    lp.frequency.setValueAtTime(3500,t);lp.frequency.exponentialRampToValueAtTime(500,t+0.7);
    bus.connect(lp);lp.connect(ac.destination);
  }else bus.connect(ac.destination);
  // w = [waveform, harmonic multiplier, volume]; a = attack secs; d = decay secs
  const P={
    Piano:{w:[['triangle',1,1],['sine',2,0.4],['sine',3,0.15]],a:0.005,d:1.8},
    Flute:{w:[['sine',1,1],['sine',2,0.12]],a:0.12,d:1.2,vib:true},
    Guitar:{w:[['sawtooth',1,0.6]],a:0.003,d:1.3},
    Bell:{w:[['sine',1,1],['sine',2.76,0.5],['sine',5.4,0.25]],a:0.003,d:3}
  }[inst];
  P.w.forEach(([type,m,v])=>{
    const o=ac.createOscillator(),g=ac.createGain(),end=t+P.a+P.d;
    o.type=type;o.frequency.value=f*m;
    if(P.vib){ // gentle wobble makes the flute sound breathy
      const l=ac.createOscillator(),lg=ac.createGain();
      l.frequency.value=5.5;lg.gain.value=f*m*0.006;
      l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(end+0.1);
    }
    g.gain.setValueAtTime(0.0001,t);
    g.gain.linearRampToValueAtTime(v,t+P.a);
    g.gain.exponentialRampToValueAtTime(0.0001,end);
    o.connect(g);g.connect(bus);o.start(t);o.stop(end+0.1);
  });
}
const $=id=>document.getElementById(id);
const playBtn=$("play"),noteSel=$("note"),instSel=$("inst"),go=$("go"),box=$("box"),msg=$("msg");
const pick=a=>a[Math.floor(Math.random()*a.length)];
noteSel.innerHTML='<option value="">Select a note</option>'+NOTES.map((n,i)=>'<option value="'+i+'">'+n+'</option>').join("");
instSel.innerHTML='<option value="">Select an instrument</option>'+INSTRUMENTS.map(n=>'<option value="'+n+'">'+n+'</option>').join("");
let target,done;
function fresh(){
  target={note:pick(NATURALS),inst:pick(INSTRUMENTS)};
  done=false;
  noteSel.value="";instSel.value="";noteSel.disabled=instSel.disabled=false;
  playBtn.disabled=false;go.disabled=true;go.className="check";box.className="box";box.textContent="";
  msg.className="msg";msg.textContent="";
}
playBtn.addEventListener("click",()=>play(target.inst,target.note)); // unlimited replays, even after answering
const chk=()=>{go.disabled=noteSel.value===""||instSel.value===""};
noteSel.addEventListener("change",chk);instSel.addEventListener("change",chk);
go.addEventListener("click",()=>{
  if(done||go.disabled)return;done=true;
  noteSel.disabled=instSel.disabled=go.disabled=true;
  if(+noteSel.value===target.note&&instSel.value===target.inst){
    go.className="check ok";box.textContent="\u2713";
    msg.className="msg ok";msg.textContent="Verification successful. You may continue.";
  }else{
    box.className="box no";box.textContent="\u2715";
    msg.className="msg no";msg.textContent="Verification failed. It was "+NOTES[target.note]+" on a "+target.inst.toLowerCase()+".";
    const b=document.createElement("button");b.className="retry";b.type="button";b.textContent="Get a new challenge";b.onclick=fresh;
    msg.appendChild(document.createElement("br"));msg.appendChild(b);
  }
});
fresh();
