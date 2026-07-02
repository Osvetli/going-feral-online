import { useRef, useEffect, useState, useCallback } from 'react';
import Matter from 'matter-js';

const { Engine, Render, Bodies, Composite, Body, Events, Query } = Matter;

type Phase = 'preload' | 'shredding' | 'settle' | 'smashing' | 'settlement' | 'done';
type HammerState = 'idle' | 'charging' | 'slamming';

interface Props {
  inputType: 'text' | 'draw';
  inputContent: string;
  drawLabel?: string;
  onPhaseChange: (p: string) => void;
  onAllDestroyed: () => void;
}

const WALL_T = 20; const GHOST_R = 50;
const SMASH_TIMEOUT = 25000; const MIN_SMASHES = 1;
const MAX_CHARGE_MS = 1500;
const BODY_OPTS = { collisionFilter: { category: 0x0001, mask: 0xffffffff, group: 0 } };

function calcWorld(w: number) {
  const ww = Math.max(400, Math.min(w, 900));
  const wh = Math.round(ww * 0.78);
  const shredderY = Math.round(wh * 0.22);
  const potW = Math.round(ww * 0.44);
  const potH = Math.round(wh * 0.46);
  const potX = Math.round(ww / 2);
  const potY = Math.round(wh * 0.62);
  return { ww, wh, shredderY, potW, potH, potX, potY };
}

// ═══ SOUND ═══
let audioCtx: AudioContext | null = null;
const getCtx = () => { if (!audioCtx) audioCtx = new AudioContext(); return audioCtx; };
function shredTick() {
  try { const c=getCtx(),t=c.currentTime; const o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(60+Math.random()*80,t);o.frequency.exponentialRampToValueAtTime(20,t+.12);const g=c.createGain();g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.15); } catch {}
}
function heavySmash() {
  try{const c=getCtx(),t=c.currentTime;const b=c.createBuffer(1,c.sampleRate*.28,c.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,4);const n=c.createBufferSource();n.buffer=b;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=3000;bp.Q.value=.35;const g1=c.createGain();g1.gain.setValueAtTime(.95,t);g1.gain.exponentialRampToValueAtTime(.001,t+.28);n.connect(bp);bp.connect(g1);g1.connect(c.destination);n.start(t);n.stop(t+.3);const o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(100,t);o.frequency.exponentialRampToValueAtTime(12,t+.22);const g2=c.createGain();g2.gain.setValueAtTime(.85,t);g2.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g2);g2.connect(c.destination);o.start(t);o.stop(t+.25);const o2=c.createOscillator();o2.type='triangle';o2.frequency.setValueAtTime(4200,t);o2.frequency.exponentialRampToValueAtTime(350,t+.3);const g3=c.createGain();g3.gain.setValueAtTime(.4,t);g3.gain.exponentialRampToValueAtTime(.001,t+.3);o2.connect(g3);g3.connect(c.destination);o2.start(t);o2.stop(t+.35);}catch{}
}

// ═══ UTILS ═══
// Render text onto an A4-proportion "cyber paper" — glass morphism + neon glow
function renderPaperStrip(text: string): HTMLCanvasElement {
  const A4_RATIO = Math.SQRT2; // 1 : √2 ≈ 1 : 1.414
  const pw = 200;              // paper width
  const fs = 22;               // ~text-2xl in canvas
  const lh = fs * 1.6;
  const padding = 32;          // generous padding — no text touching edges
  const maxTextW = pw - padding * 2;

  // Measure text for word-wrap
  const tmpC = document.createElement('canvas');
  const tmpCtx = tmpC.getContext('2d')!;
  tmpCtx.font = `${fs}px "Microsoft YaHei","PingFang SC",sans-serif`;

  const lines: string[] = []; let cur = '';
  for (const ch of text.split('')) {
    const t = cur + ch;
    if (tmpCtx.measureText(t).width > maxTextW && cur.length) { lines.push(cur); cur = ch; } else cur = t;
  }
  if (cur) lines.push(cur);

  // Calculate paper height: A4 minimum, extend if text is long
  const textBlockH = lines.length * lh;
  const minPaperH = Math.round(pw * A4_RATIO);
  const ph = Math.max(minPaperH, textBlockH + padding * 2 + 20);

  const c = document.createElement('canvas');
  c.width = pw; c.height = ph;
  const ctx = c.getContext('2d')!;

  // ── Glass-morphism background ──
  const bgGrad = ctx.createLinearGradient(0, 0, pw, ph);
  bgGrad.addColorStop(0, 'rgba(15,23,42,0.92)');   // slate-900/80
  bgGrad.addColorStop(0.5, 'rgba(30,27,75,0.90)');  // indigo-950/80
  bgGrad.addColorStop(1, 'rgba(15,23,42,0.92)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, pw, ph);

  // Subtle vertical paper texture lines
  ctx.strokeStyle = 'rgba(99,102,241,0.04)';
  ctx.lineWidth = 0.5;
  for (let x = 10; x < pw; x += 12) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ph); ctx.stroke();
  }

  // ── Outer neon glow border ──
  ctx.strokeStyle = 'rgba(99,102,241,0.5)'; // indigo-500/50
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(99,102,241,0.25)';
  ctx.shadowBlur = 18;
  ctx.strokeRect(4, 4, pw - 8, ph - 8);
  ctx.shadowBlur = 0;

  // ── Inner thin accent border ──
  const innerPad = 14;
  ctx.strokeStyle = 'rgba(168,85,247,0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.strokeRect(innerPad, innerPad, pw - innerPad * 2, ph - innerPad * 2);
  ctx.setLineDash([]);

  // ── Corner accents (small neon brackets at 4 corners) ──
  const cornerLen = 20;
  ctx.strokeStyle = 'rgba(99,102,241,0.6)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(99,102,241,0.4)';
  ctx.shadowBlur = 8;
  const cx = innerPad - 2, cy = innerPad - 2;
  const rx = pw - innerPad + 2, by = ph - innerPad + 2;
  // Top-left
  ctx.beginPath(); ctx.moveTo(cx, cy + cornerLen); ctx.lineTo(cx, cy); ctx.lineTo(cx + cornerLen, cy); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(rx - cornerLen, cy); ctx.lineTo(rx, cy); ctx.lineTo(rx, cy + cornerLen); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(cx, by - cornerLen); ctx.lineTo(cx, by); ctx.lineTo(cx + cornerLen, by); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(rx - cornerLen, by); ctx.lineTo(rx, by); ctx.lineTo(rx, by - cornerLen); ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Text: perfectly centered vertical + horizontal ──
  const textStartY = (ph - textBlockH) / 2 + fs * 0.85;
  ctx.font = `${fs}px "Microsoft YaHei","PingFang SC",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text with subtle glow
  ctx.shadowColor = 'rgba(200,210,255,0.3)';
  ctx.shadowBlur = 3;

  // Aurora gradient text (cyan → purple → pink)
  const textGrad = ctx.createLinearGradient(0, textStartY - fs, 0, textStartY + textBlockH);
  textGrad.addColorStop(0, '#67e8f9');   // cyan-300
  textGrad.addColorStop(0.5, '#c4b5fd'); // purple-300
  textGrad.addColorStop(1, '#f9a8d4');   // pink-300
  ctx.fillStyle = textGrad;

  lines.forEach((l, i) => {
    const y = textStartY + i * lh;
    ctx.fillText(l, pw / 2, y);
  });
  ctx.shadowBlur = 0;

  return c;
}

// ═══ DRAWING PAPER — place drawing image on A4 cyber-paper ═══
function renderDrawingPaper(drawingImage: HTMLImageElement): HTMLCanvasElement {
  const A4_RATIO = Math.SQRT2;
  const pw = 200;
  const padding = 32;
  const ph = Math.round(pw * A4_RATIO);

  const c = document.createElement('canvas');
  c.width = pw; c.height = ph;
  const ctx = c.getContext('2d')!;

  // ── Same glass-morphism background as text paper ──
  const bgGrad = ctx.createLinearGradient(0, 0, pw, ph);
  bgGrad.addColorStop(0, 'rgba(15,23,42,0.92)');
  bgGrad.addColorStop(0.5, 'rgba(30,27,75,0.90)');
  bgGrad.addColorStop(1, 'rgba(15,23,42,0.92)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, pw, ph);

  // Subtle vertical paper texture lines
  ctx.strokeStyle = 'rgba(99,102,241,0.04)';
  ctx.lineWidth = 0.5;
  for (let x = 10; x < pw; x += 12) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ph); ctx.stroke();
  }

  // ── Outer neon glow border ──
  ctx.strokeStyle = 'rgba(99,102,241,0.5)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(99,102,241,0.25)';
  ctx.shadowBlur = 18;
  ctx.strokeRect(4, 4, pw - 8, ph - 8);
  ctx.shadowBlur = 0;

  // ── Inner thin accent border ──
  const innerPad = 14;
  ctx.strokeStyle = 'rgba(168,85,247,0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.strokeRect(innerPad, innerPad, pw - innerPad * 2, ph - innerPad * 2);
  ctx.setLineDash([]);

  // ── Corner accents ──
  const cornerLen = 20;
  ctx.strokeStyle = 'rgba(99,102,241,0.6)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(99,102,241,0.4)';
  ctx.shadowBlur = 8;
  const cx2 = innerPad - 2, cy2 = innerPad - 2;
  const rx2 = pw - innerPad + 2, by2 = ph - innerPad + 2;
  ctx.beginPath(); ctx.moveTo(cx2, cy2 + cornerLen); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2 + cornerLen, cy2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rx2 - cornerLen, cy2); ctx.lineTo(rx2, cy2); ctx.lineTo(rx2, cy2 + cornerLen); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx2, by2 - cornerLen); ctx.lineTo(cx2, by2); ctx.lineTo(cx2 + cornerLen, by2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rx2 - cornerLen, by2); ctx.lineTo(rx2, by2); ctx.lineTo(rx2, by2 - cornerLen); ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Drawing image: centered, scaled to fit within padding ──
  const imgAreaW = pw - padding * 2;
  const imgAreaH = ph - padding * 2;
  const scale = Math.min(imgAreaW / drawingImage.width, imgAreaH / drawingImage.height);
  const drawW = drawingImage.width * scale;
  const drawH = drawingImage.height * scale;
  const drawX = (pw - drawW) / 2;
  const drawY = (ph - drawH) / 2;

  // Subtle glow behind drawing
  ctx.shadowColor = 'rgba(200,210,255,0.2)';
  ctx.shadowBlur = 6;
  ctx.drawImage(drawingImage, drawX, drawY, drawW, drawH);
  ctx.shadowBlur = 0;

  return c;
}

// ═══ PAPER SLICE — extract one horizontal strip from the paper canvas ═══
function makePaperSlice(
  paperCanvas: HTMLCanvasElement,
  srcY: number, srcH: number,
): HTMLImageElement {
  const pad = 4;
  const sc = document.createElement('canvas');
  sc.width = paperCanvas.width + pad * 2;
  sc.height = srcH + pad * 2;
  const ctx = sc.getContext('2d')!;
  // Irregular torn-paper edge
  ctx.beginPath();
  const j = 3;
  ctx.moveTo(pad + (Math.random()-.5)*j, pad + (Math.random()-.5)*j);
  ctx.lineTo(paperCanvas.width + pad + (Math.random()-.5)*j, pad + (Math.random()-.5)*j);
  ctx.lineTo(paperCanvas.width + pad + (Math.random()-.5)*j, srcH + pad + (Math.random()-.5)*j);
  ctx.lineTo(pad + (Math.random()-.5)*j, srcH + pad + (Math.random()-.5)*j);
  ctx.closePath(); ctx.clip();
  // Draw exact portion of the paper (with text + background + borders)
  ctx.drawImage(paperCanvas, 0, srcY, paperCanvas.width, srcH, pad, pad, paperCanvas.width, srcH);
  const img = document.createElement('img');
  img.src = sc.toDataURL('image/png');
  return img;
}

// ═══ OVERLAY ═══
interface Overlay { el: HTMLElement; body: Matter.Body }
function mkOverlay(content: HTMLElement, size: number, ctn: HTMLElement, body: Matter.Body): Overlay {
  const w = document.createElement('div');
  w.style.cssText = `position:absolute;pointer-events:none;z-index:15;width:${size}px;height:${size}px;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;overflow:hidden;`;
  w.appendChild(content); ctn.appendChild(w);
  return { el: w, body };
}
function syncOv(ov: Overlay) {
  if (!ov.body.position) return;
  ov.el.style.left = `${ov.body.position.x}px`;
  ov.el.style.top = `${ov.body.position.y}px`;
  ov.el.style.transform = `translate(-50%,-50%) rotate(${ov.body.angle||0}rad)`;
}
function killOv(ov: Overlay) { if (ov.el.parentNode) ov.el.remove(); }

// ═══════════════════════════════════
// DRAWING SLICE — extract one horizontal strip from the original image
// ═══════════════════════════════════
function makeDrawingSlice(
  sourceImage: HTMLImageElement,
  srcX: number, srcY: number, srcW: number, srcH: number,
): HTMLImageElement {
  const pad = 4;
  const sc = document.createElement('canvas');
  sc.width = srcW + pad * 2; sc.height = srcH + pad * 2;
  const ctx = sc.getContext('2d')!;
  // Irregular polygon clip for torn-paper edge
  ctx.beginPath();
  const j = 4;
  ctx.moveTo(pad + (Math.random()-.5)*j, pad + (Math.random()-.5)*j);
  ctx.lineTo(srcW+pad + (Math.random()-.5)*j, pad + (Math.random()-.5)*j);
  ctx.lineTo(srcW+pad + (Math.random()-.5)*j, srcH+pad + (Math.random()-.5)*j);
  ctx.lineTo(pad + (Math.random()-.5)*j, srcH+pad + (Math.random()-.5)*j);
  ctx.closePath(); ctx.clip();
  // Draw the EXACT portion of the original image
  ctx.drawImage(sourceImage, srcX, srcY, srcW, srcH, pad, pad, srcW, srcH);
  const img = document.createElement('img');
  img.src = sc.toDataURL('image/png');
  return img;
}

// ═══ UI DOM ═══
function buildShredderDOM(ctn: HTMLElement, y: number, w: number) {
  const el = document.createElement('div');
  el.style.cssText = `position:absolute;left:50%;top:${y}px;transform:translate(-50%,-50%);z-index:22;pointer-events:none;width:${w}px;text-align:center;`;
  const slot = document.createElement('div');
  slot.style.cssText = `width:100%;height:clamp(32px,6vw,52px);background:linear-gradient(180deg,#1e1b4b,#312e81,#1e1b4b);border:3px solid #7c3aed;border-radius:6px;box-shadow:0 0 30px rgba(124,58,237,.6),inset 0 3px 10px rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;gap:6px;`;
  for(let i=0;i<10;i++){const t=document.createElement('div');t.style.cssText='width:5px;height:45%;background:#7c3aed;border-radius:3px;opacity:.7;';slot.appendChild(t);}
  const lb=document.createElement('p');lb.textContent='🗄️ 烦恼碎纸机';lb.style.cssText='color:#a855f7;font-size:clamp(13px,2.5vw,16px);font-weight:bold;margin-top:6px;text-shadow:0 0 10px rgba(168,85,247,.5);';
  el.appendChild(slot);el.appendChild(lb);ctn.appendChild(el);
  return {el,setActive(v:boolean){el.style.opacity=v?'1':'.4';},destroy(){el.remove();}};
}

function buildHammerDOM(ctn: HTMLElement) {
  const el=document.createElement('div');
  el.style.cssText=`position:absolute;left:50%;top:8%;transform:translate(-50%,0) rotate(-25deg);z-index:999;pointer-events:none;font-size:clamp(60px,11vw,110px);filter:drop-shadow(0 0 30px rgba(255,215,0,.8)) drop-shadow(0 8px 14px rgba(0,0,0,.9));transition:transform .3s ease-out,left .08s ease-out;opacity:0;`;
  el.textContent='🔨';ctn.appendChild(el);
  const barW=document.createElement('div');
  barW.style.cssText=`position:absolute;left:50%;top:calc(8% + clamp(65px,11vw,115px));transform:translate(-50%,0);z-index:999;pointer-events:none;width:clamp(150px,30vw,240px);height:10px;background:rgba(255,255,255,.06);border-radius:5px;overflow:hidden;opacity:0;border:1px solid rgba(255,255,255,.1);transition:left .08s ease-out;`;
  const barF=document.createElement('div');barF.style.cssText=`height:100%;width:0%;background:linear-gradient(90deg,#fbbf24,#ef4444,#fbbf24);border-radius:5px;box-shadow:0 0 18px rgba(251,191,36,.8);`;
  barW.appendChild(barF);ctn.appendChild(barW);
  let bid=0;
  let hammerX: number | null = null; // null = use default center, number = px from left
  const breathe=()=>{
    const t=performance.now()*.002;const dy=Math.sin(t)*7;
    const x = hammerX !== null ? `${hammerX}px` : '50%';
    const tx = hammerX !== null ? 'translate(0' : 'translate(-50%';
    el.style.left = x;
    el.style.transform = `${tx},${dy}px) rotate(-25deg) scale(1)`;
    barW.style.left = el.style.left;
    bid=requestAnimationFrame(breathe);
  };
  return {el,barW,barF,
    show(){el.style.opacity='1';bid=requestAnimationFrame(breathe);},
    hide(){el.style.opacity='0';cancelAnimationFrame(bid);barW.style.opacity='0';},
    setX(x:number){hammerX=x;el.style.left=`${x}px`;barW.style.left=`${x}px`;},
    lockX(){/* X stays at current position */},
    charge(p:number){
      cancelAnimationFrame(bid);barW.style.opacity='1';barF.style.width=`${p*100}%`;
      const s=Math.sin(performance.now()*.1)*(p*14);
      const x = hammerX !== null ? `${hammerX}px` : '50%';
      const tx = hammerX !== null ? 'translate(0' : 'translate(-50%';
      el.style.left = x; barW.style.left = x;
      el.style.filter=`drop-shadow(0 0 ${25+p*35}px rgba(255,215,0,${.7+p*.8})) drop-shadow(0 8px 14px rgba(0,0,0,.9))`;
      el.style.transform=`${tx},${s}px) rotate(${-25+(p-.5)*22}deg) scale(${1+p*.22})`;
      el.style.transition='transform .04s,filter .1s';
    },
    slam(){
      cancelAnimationFrame(bid);
      const tx = hammerX !== null ? 'translate(0' : 'translate(-50%';
      el.style.transition='transform .05s ease-in,filter .1s';
      el.style.transform=`${tx},190px) rotate(0deg) scale(1.45)`;
      el.style.filter='drop-shadow(0 0 60px rgba(255,255,200,1)) drop-shadow(0 8px 14px rgba(0,0,0,.9))';
      setTimeout(()=>{
        el.style.transition='transform .35s cubic-bezier(.34,1.56,.64,1),filter .3s';
        el.style.transform=`${tx},0) rotate(-25deg) scale(1)`;
        el.style.filter='drop-shadow(0 0 30px rgba(255,215,0,.8)) drop-shadow(0 8px 14px rgba(0,0,0,.9))';
        setTimeout(()=>bid=requestAnimationFrame(breathe),400);
      },80);
    },
    setIdle(){barW.style.opacity='0';barF.style.width='0%';},
    destroy(){cancelAnimationFrame(bid);el.remove();barW.remove();},
  };
}

function buildGachaBtn(ctn: HTMLElement, cb: ()=>void) {
  const wr=document.createElement('div');
  wr.style.cssText=`position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(2,6,23,.92);backdrop-filter:blur(8px);opacity:0;transition:opacity 1s ease-in;pointer-events:none;`;
  const t=document.createElement('p');t.textContent='⚡ 大脑垃圾分类完成，提取好运！';t.style.cssText='color:#ffd700;font-size:clamp(26px,6vw,40px);font-weight:900;margin-bottom:12px;text-shadow:0 0 25px rgba(255,215,0,.6);';
  const s=document.createElement('p');s.textContent='你的烦恼已经转化为精神能量';s.style.cssText='color:#94a3b8;font-size:clamp(15px,3vw,22px);margin-bottom:36px;';
  const b=document.createElement('button');b.textContent='🔮 提取今日好运';
  b.style.cssText=`padding:20px 60px;font-size:clamp(20px,4vw,28px);font-weight:900;color:#fff;background:linear-gradient(135deg,#7c3aed,#ec4899);border:none;border-radius:50px;cursor:pointer;box-shadow:0 0 40px rgba(236,72,153,.7),0 0 80px rgba(124,58,237,.6);letter-spacing:3px;transition:transform .2s;`;
  b.onmouseenter=()=>{b.style.transform='scale(1.08)';};b.onmouseleave=()=>{b.style.transform='scale(1)';};
  b.onclick=(e)=>{e.stopPropagation();cb();};
  wr.appendChild(t);wr.appendChild(s);wr.appendChild(b);ctn.appendChild(wr);
  return {show(){wr.style.opacity='1';wr.style.pointerEvents='all';},destroy(){wr.remove();}};
}

// ═══════════════════════════════════
// MAIN
// ═══════════════════════════════════
export default function PhysicsWorld({ inputType, inputContent, onPhaseChange, onAllDestroyed }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const [dims, setDims] = useState(() => calcWorld(Math.min(window.innerWidth * .9, 900)));
  const potRef = useRef({ potX: 350, potY: 310, potW: 300, potH: 230 });
  const onDoneRef = useRef(onAllDestroyed); onDoneRef.current = onAllDestroyed;

  const handleResize = useCallback(() => {
    if (!containerRef.current||!renderRef.current||!engineRef.current||!potRef.current) return;
    const w=containerRef.current.clientWidth; const d=calcWorld(w); setDims(d);
    const r=renderRef.current;r.canvas.width=d.ww;r.canvas.height=d.wh;r.options.width=d.ww;r.options.height=d.wh;r.bounds.max.x=d.ww;r.bounds.max.y=d.wh;
  },[]);
  useEffect(()=>{window.addEventListener('resize',handleResize);return()=>window.removeEventListener('resize',handleResize);},[handleResize]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctn = containerRef.current;
    const d = calcWorld(ctn.clientWidth); setDims(d);
    const { ww, wh, shredderY, potW, potH, potX, potY } = d;
    potRef.current = { potX, potY, potW, potH };

    // Clean
    const oc=ctn.querySelector('canvas');if(oc)oc.remove();
    ctn.querySelectorAll('.shredder,.hammer,.hmr-flash').forEach(e=>(e as HTMLElement).remove());

    const engine = Engine.create({ gravity: { x: 0, y: 1, scale: .005 } });
    engineRef.current = engine;
    const render = Render.create({ element: ctn, engine, options: { width: ww, height: wh, wireframes: false, background: '#020617', pixelRatio: 1 } });
    renderRef.current = render;

    // Pot walls — extended with invisible side barriers (funnel)
    const wallH = potH + 120; // extend upward for anti-escape
    const wallY = potY - 60;
    const lW=Bodies.rectangle(potX-potW/2, wallY, WALL_T, wallH, {isStatic:true,...BODY_OPTS,render:{fillStyle:'#7c3aed'},label:'wall'});
    const rW=Bodies.rectangle(potX+potW/2, wallY, WALL_T, wallH, {isStatic:true,...BODY_OPTS,render:{fillStyle:'#7c3aed'},label:'wall'});
    const bW=Bodies.rectangle(potX, potY+potH/2, potW+WALL_T*2, WALL_T, {isStatic:true,...BODY_OPTS,render:{fillStyle:'#7c3aed'},label:'bottom'});

    // Thick invisible funnel walls from shredder down to pot — prevents ANY shard from escaping
    // Width = 80px to prevent Matter.js tunneling for small text fragments
    const FUNNEL_W = 80;
    const funnelTop = shredderY + 30;
    const funnelBot = potY - potH/2;
    const funnelMid = (funnelTop + funnelBot) / 2;
    const funnelH = Math.abs(funnelTop - funnelBot) + 20;
    const funnelL = Bodies.rectangle(potX - potW/2 - FUNNEL_W/2 + 5, funnelMid, FUNNEL_W, funnelH, {isStatic:true,...BODY_OPTS,render:{fillStyle:'transparent'},label:'funnel',collisionFilter:{category:0x0001,mask:0xffffffff,group:0}});
    const funnelR = Bodies.rectangle(potX + potW/2 + FUNNEL_W/2 - 5, funnelMid, FUNNEL_W, funnelH, {isStatic:true,...BODY_OPTS,render:{fillStyle:'transparent'},label:'funnel',collisionFilter:{category:0x0001,mask:0xffffffff,group:0}});
    Composite.add(engine.world,[lW,rW,bW,funnelL,funnelR]);

    // Ghost body — invisible in Matter renderer (DOM overlay handles visuals)
    const ghost = Bodies.circle(potX, wh*.04, GHOST_R, { density:.0005,friction:.1,restitution:.15,...BODY_OPTS,render:{fillStyle:'transparent',strokeStyle:'transparent',lineWidth:0},label:'bigGhost'});
    // For text: overlay uses paper canvas height so full strip is visible
    let gOvSz = GHOST_R*2+24; // default; overridden for text mode
    const gInner = document.createElement('div');
    gInner.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
    let ghostOv = mkOverlay(gInner, gOvSz, ctn, ghost);

    // Preload image for drawing mode
    let drawingImage: HTMLImageElement | null = null;
    let preloadDone = false;
    // ── Paper strip (shared between text and drawing mode) ──
    // MUST be declared here so the async onload can update it for drawing mode
    let paperCanvas: HTMLCanvasElement | null = null;

    if (inputType === 'draw' && inputContent) {
      drawingImage = new Image();
      drawingImage.onload = () => {
        preloadDone = true;
        // Render drawing on A4 cyber-paper — same as text mode
        paperCanvas = renderDrawingPaper(drawingImage!);
        (ghost as any)._paperCanvas = paperCanvas;
        gOvSz = Math.max(GHOST_R*2+24, paperCanvas.height + 20);
        ghostOv.el.style.width = `${gOvSz}px`; ghostOv.el.style.height = `${gOvSz}px`;
        const img = document.createElement('img'); img.src = paperCanvas.toDataURL();
        img.style.cssText = 'width:auto;height:auto;max-width:100%;display:block;';
        gInner.appendChild(img);
      };
      drawingImage.src = inputContent;
    } else if (inputType === 'text' && inputContent) {
      preloadDone = true;
      paperCanvas = renderPaperStrip(inputContent);
      (ghost as any)._paperCanvas = paperCanvas;
      gOvSz = Math.max(GHOST_R*2+24, paperCanvas.height + 20);
      ghostOv.el.style.width = `${gOvSz}px`; ghostOv.el.style.height = `${gOvSz}px`; // resize overlay for paper
      const img = document.createElement('img'); img.src = paperCanvas.toDataURL();
      img.style.cssText = 'width:auto;height:auto;max-width:100%;display:block;';
      gInner.appendChild(img);
      (ghost as any)._paperCanvas = paperCanvas;
    } else {
      preloadDone = true;
    }

    Composite.add(engine.world, [ghost]);

    const shredderDOM = buildShredderDOM(ctn, shredderY, d.ww > 500 ? Math.round(d.ww * .5) : 260);
    const hammerDOM = buildHammerDOM(ctn);
    const gachaBtn = buildGachaBtn(ctn, () => { gachaBtn.destroy(); onPhaseChange('done'); setTimeout(() => onDoneRef.current(), 400); });

    // ── State ──
    let phase: Phase = drawingImage && !preloadDone ? 'preload' : 'shredding';
    const allOverlays: Overlay[] = [ghostOv];
    let shredStartTime = preloadDone ? performance.now() : 0; // init immediately for text mode
    // Both text and drawing use A4 paper — same therapeutic shredding feel
    const shredDuration = 3800;
    const SHRED_SLICES = 14;
    let spawnedCount = 0;
    let shatterBodies: Matter.Body[] = [];
    let shatterOverlays: Overlay[] = [];
    let smashCount = 0;
    let smashPhaseStart = 0;
    let hammerState: HammerState = 'idle';
    let chargeStart = 0;
    let chargeAnimId = 0;

    const forceSettlement = () => {
      if (phase === 'settlement' || phase === 'done') return;
      phase = 'settlement'; onPhaseChange('settlement');
      hammerDOM.hide();
      for (const b of shatterBodies) { try { Composite.remove(engine.world, b); } catch {} }
      for (const o of shatterOverlays) killOv(o);
      shatterBodies = []; shatterOverlays = [];
      setTimeout(() => gachaBtn.show(), 1000);
    };

    // ── spawnDrawingSlice: creates Matter bodies for one horizontal strip ──
    const spawnDrawingSlice = (sliceIdx: number) => {
      if (!drawingImage) return;
      const img = drawingImage;
      const totalH = img.height;
      const stripH = totalH / SHRED_SLICES;
      const srcY = sliceIdx * stripH;
      const srcH = stripH;
      const cols = SLICE_COLS;
      const stripW = img.width / cols;

      for (let col = 0; col < cols; col++) {
        const srcX = col * stripW;
        const srcW = stripW;
        const sImg = makeDrawingSlice(img, srcX, srcY, srcW, srcH);
        // Body radius = display-sized fragment, not source-pixel-sized
        const bodyR = Math.max(targetFragR * 0.7, Math.min(targetFragR * 1.5, targetFragR));
        const bx = potX + (Math.random() - .5) * potW * .4;
        const by = shredderY + 45 + Math.random() * 20;
        const cx = Math.max(potX - potW/2 + bodyR + 5, Math.min(potX + potW/2 - bodyR - 5, bx));
        const cy = Math.max(potY - potH/2 + bodyR + 5, Math.min(potY + potH/2 - bodyR - 5, by));
        const body = Bodies.circle(cx, cy, bodyR, {
          density: .0007, friction: .25, restitution: .06, ...BODY_OPTS,
          render: { fillStyle: 'transparent', strokeStyle: 'transparent', lineWidth: 0 }, label: 'drawShard',
        });
        Composite.add(engine.world, body);
        shatterBodies.push(body);
        const ov = mkOverlay(sImg, bodyR*2+6, ctn, body);
        shatterOverlays.push(ov); allOverlays.push(ov);
      }
    };

    // ── spawnTextSlice: creates visible paper-strip fragments ──
    const spawnTextSlice = (sliceIdx: number) => {
      if (!paperCanvas) return;
      const totalH = paperCanvas.height;
      const stripH = totalH / SHRED_SLICES;
      const srcY = sliceIdx * stripH;
      const srcH = stripH;

      // One wide fragment per row so paper content stays readable
      const bodyR = 18 + Math.random() * 8; // 18-26px body → 48-64px overlay
      const sImg = makePaperSlice(paperCanvas, srcY, srcH);
      const bx = potX + (Math.random() - .5) * potW * .5;
      const by = shredderY + 40 + Math.random() * 30;
      const cx = Math.max(potX - potW/2 + bodyR + 8, Math.min(potX + potW/2 - bodyR - 8, bx));
      const cy = Math.max(potY - potH/2 + bodyR + 8, Math.min(potY + potH/2 - bodyR - 8, by));

      const body = Bodies.circle(cx, cy, bodyR, {
        density: .001, friction: .5, restitution: .02, ...BODY_OPTS,
        render: { fillStyle: 'transparent', strokeStyle: 'transparent', lineWidth: 0 }, label: 'charShard',
      });
      Composite.add(engine.world, body);
      shatterBodies.push(body);
      const ov = mkOverlay(sImg, bodyR * 2 + 12, ctn, body);
      shatterOverlays.push(ov); allOverlays.push(ov);
    };

    const spawnSlice = (idx: number) => {
      shredTick();
      // Both text and drawing now use A4 paper — same shredding
      spawnTextSlice(idx);
    };

    // ── Hammer charge ──
    const chargeLoop = () => {
      if (hammerState !== 'charging') return;
      const p = Math.min((performance.now() - chargeStart) / MAX_CHARGE_MS, 1);
      hammerDOM.charge(p);
      chargeAnimId = requestAnimationFrame(chargeLoop);
    };

    // Mouse tracking for hammer
    let mouseX = potX;
    const onMMove = (e: MouseEvent) => {
      if (!renderRef.current) return;
      const cv = renderRef.current.canvas; const r = cv.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      if (phase === 'smashing' && hammerState === 'idle') {
        hammerDOM.setX(Math.max(potX-potW/2+5, Math.min(potX+potW/2-5, mouseX)));
      }
    };

    const onPDown = (e: MouseEvent|TouchEvent) => {
      if (phase !== 'smashing' || hammerState !== 'idle') return;
      e.preventDefault();
      // Lock hammer at current X position
      if ('clientX' in e && renderRef.current) {
        const cv = renderRef.current.canvas; const r = cv.getBoundingClientRect();
        mouseX = e.clientX - r.left;
      }
      hammerDOM.setX(Math.max(potX-potW/2+5, Math.min(potX+potW/2-5, mouseX)));
      hammerState = 'charging'; chargeStart = performance.now();
      chargeAnimId = requestAnimationFrame(chargeLoop);
    };
    const onPUp = (e: MouseEvent|TouchEvent) => {
      if (phase !== 'smashing' || hammerState !== 'charging') return;
      e.preventDefault(); hammerState = 'slamming'; cancelAnimationFrame(chargeAnimId);
      const charge = Math.min((performance.now() - chargeStart) / MAX_CHARGE_MS, 1);
      heavySmash(); smashCount++; hammerDOM.slam(); hammerDOM.setIdle();

      // Shake
      const intensity = 12 + charge * 28;
      ctn.style.transition = 'transform .03s ease-out';
      ctn.style.transform = `translate(${(Math.random()-.5)*intensity}px,${(Math.random()-.5)*intensity}px)`;
      setTimeout(()=>{ctn.style.transform=`translate(${(Math.random()-.5)*intensity*.5}px,${(Math.random()-.5)*intensity*.5}px)`;},30);
      setTimeout(()=>{ctn.style.transform='translate(0,0)';ctn.style.transition='';},80);

      // Flash
      const fl=document.createElement('div');fl.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:5;background:rgba(255,255,220,.85);opacity:1;transition:opacity .2s;';
      ctn.appendChild(fl);setTimeout(()=>{fl.style.opacity='0';},25);setTimeout(()=>{if(fl.parentNode)fl.remove();},250);

      // Particles
      const pC=Math.round(30+charge*40);
      for(let i=0;i<pC;i++){const a=(Math.PI*2/pC)*i;const p=Bodies.circle(potX+Math.cos(a)*4,potY+Math.sin(a)*4,Math.random()*5+2,{isStatic:false,density:.0001,restitution:.9,...BODY_OPTS,render:{fillStyle:`hsl(${30+Math.random()*30},100%,${55+Math.random()*45}%)`},label:'particle'});Body.applyForce(p,p.position,{x:Math.cos(a)*(.02+Math.random()*.05*charge),y:Math.sin(a)*(.02+Math.random()*.05*charge)-.014*charge});Composite.add(engine.world,p);setTimeout(()=>{try{Composite.remove(engine.world,p);}catch{}},800);}

      // Destroy fragments near hammer impact point
      const impactX = mouseX; // hammer's locked X position
      const impactRadius = 50 + charge * 40; // wider radius with more charge
      const toKill: Matter.Body[] = [];
      const remaining: Matter.Body[] = [];
      for (const b of shatterBodies) {
        const dx = Math.abs(b.position.x - impactX);
        if (dx < impactRadius && toKill.length < Math.round(4 + charge * 8)) {
          toKill.push(b);
        } else {
          remaining.push(b);
        }
      }
      for (const b of toKill) {
        try { Composite.remove(engine.world, b); } catch {}
        const oi = shatterOverlays.findIndex(o => o.body === b);
        if (oi > -1) { killOv(shatterOverlays[oi]); shatterOverlays.splice(oi, 1); }
      }
      shatterBodies = remaining;

      if (shatterBodies.length===0&&smashCount>=MIN_SMASHES) setTimeout(()=>forceSettlement(), 1200);
      else setTimeout(()=>{hammerState='idle';},500);
    };

    document.addEventListener('mousemove', onMMove);
    document.addEventListener('mousedown',onPDown);
    document.addEventListener('mouseup',onPUp);
    document.addEventListener('touchstart',onPDown,{passive:false});
    document.addEventListener('touchend',onPUp,{passive:false});
    render.canvas.style.cursor='none';

    // ── LOOP ──
    let animId = 0;
    const loop = () => {
      const now = performance.now();

      // Preload: wait for drawing image
      if (phase === 'preload') {
        if (preloadDone) { phase = 'shredding'; shredStartTime = performance.now(); }
      }

      // Shredding
      if (phase === 'shredding') {
        const elapsed = now - shredStartTime;
        const progress = Math.min(elapsed / shredDuration, 1.0);

        // Move ghost down through the shredder
        const ghostStartY = wh * .04;
        const ghostEndY = shredderY + gOvSz / 2; // paper fully below shredder
        const targetY = ghostStartY + progress * (ghostEndY - ghostStartY);
        Body.setPosition(ghost, { x: potX, y: targetY });
        Body.setVelocity(ghost, { x: 0, y: .6 });

        // Clip from BOTTOM: hide the portion of the paper that has passed through the shredder.
        // Paper moves DOWN → its bottom edge enters the shredder first → clip the bottom.
        if (ghostOv) {
          const paperBottom = targetY + gOvSz / 2;  // bottom edge of overlay
          const shredSlot = shredderY + 8;           // where shredder blades "cut"
          const passed = paperBottom - shredSlot;     // how much has passed below the blades
          if (passed > 0) {
            const clipPx = Math.min(passed, gOvSz);
            gInner.style.clipPath = `inset(0 0 ${clipPx}px 0)`;
          } else {
            gInner.style.clipPath = '';
          }
        }

        // Spawn slices in REVERSE order: paper bottom first, paper top last
        const targetCount = Math.floor(progress * SHRED_SLICES);
        while (spawnedCount < targetCount) {
          spawnSlice(SHRED_SLICES - 1 - spawnedCount);
          spawnedCount++;
        }

        // Done
        if (progress >= 1.0) {
          while (spawnedCount < SHRED_SLICES) {
            spawnSlice(SHRED_SLICES - 1 - spawnedCount);
            spawnedCount++;
          }
          Composite.remove(engine.world, ghost);
          if (ghostOv) { killOv(ghostOv); ghostOv = null; }
          shredderDOM.setActive(false);
          phase = 'settle';
          setTimeout(() => {
            phase = 'smashing'; smashPhaseStart = performance.now();
            smashCount = 0; hammerState = 'idle';
            onPhaseChange('smashing');
            shredderDOM.destroy();
            hammerDOM.show();
          }, 2200);
        }
      }

      // Sync
      for (const ov of allOverlays) syncOv(ov);

      // Timeout
      if (phase==='smashing'&&smashPhaseStart>0&&now-smashPhaseStart>SMASH_TIMEOUT) forceSettlement();

      // Particle cleanup
      for (const b of Composite.allBodies(engine.world)) {
        if (b.label==='particle'&&b.position.y>wh+120) Composite.remove(engine.world,b);
      }

      animId = requestAnimationFrame(loop);
    };

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Render.run(render);
    animId = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove', onMMove);
      document.removeEventListener('mousedown',onPDown);
      document.removeEventListener('mouseup',onPUp);
      document.removeEventListener('touchstart',onPDown);
      document.removeEventListener('touchend',onPUp);
      cancelAnimationFrame(animId);cancelAnimationFrame(chargeAnimId);
      Matter.Runner.stop(runner);Render.stop(render);Engine.clear(engine);
      render.canvas.remove();
      for(const ov of allOverlays) killOv(ov);
      shredderDOM.destroy();hammerDOM.destroy();gachaBtn.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputType, inputContent]);

  return (
    <div className="relative w-full flex flex-col items-center">
      <div ref={containerRef}
        className="relative rounded-xl overflow-hidden border-2 border-purple-500/40 glow-purple w-full"
        style={{ maxWidth: '900px', height: dims.wh || 500 }} />
    </div>
  );
}
