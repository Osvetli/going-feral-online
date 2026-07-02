import { useState, useEffect, useRef } from 'react';
import type { Card, Rarity } from '../types';

interface Props { card: Card; isNew: boolean; onComplete: () => void; }

const EFFECTS: Record<Rarity, { bg: string; glow: string; text: string; particle: string }> = {
  SSR: { bg: 'from-yellow-950/80 to-yellow-900/30', glow: 'shadow-[0_0_80px_rgba(255,215,0,0.7)]', text: 'rarity-text-SSR', particle: '#ffd700' },
  SR:  { bg: 'from-purple-950/80 to-purple-900/30', glow: 'shadow-[0_0_50px_rgba(192,160,255,0.6)]', text: 'rarity-text-SR', particle: '#c0a0ff' },
  R:   { bg: 'from-blue-950/80 to-blue-900/30',   glow: 'shadow-[0_0_30px_rgba(96,160,255,0.4)]',  text: 'rarity-text-R',  particle: '#60a0ff' },
  N:   { bg: 'from-gray-950/80 to-gray-900/30',   glow: '', text: 'rarity-text-N', particle: '#909090' },
};

// ═══ Web Audio: energy hum + reveal sparkle ═══
let actx: AudioContext | null = null;
const getCtx = () => { if (!actx) actx = new AudioContext(); return actx; };

function playHum() {
  try {
    const c = getCtx(); const t = c.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(200 + i * 80, t + i * 0.3);
      o.frequency.linearRampToValueAtTime(600 + i * 150, t + i * 0.3 + 0.25);
      const g = c.createGain(); g.gain.setValueAtTime(0.08, t + i * 0.3); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.3 + 0.25);
      o.connect(g); g.connect(c.destination); o.start(t + i * 0.3); o.stop(t + i * 0.3 + 0.3);
    }
  } catch {}
}
function playSparkle() {
  try {
    const c = getCtx(); const t = c.currentTime;
    for (let i = 0; i < 8; i++) {
      const o = c.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(2000 + Math.random() * 4000, t + i * 0.05);
      const g = c.createGain(); g.gain.setValueAtTime(0.12, t + i * 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.15);
      o.connect(g); g.connect(c.destination); o.start(t + i * 0.05); o.stop(t + i * 0.05 + 0.18);
    }
  } catch {}
}

export default function GachaAnimation({ card, isNew, onComplete }: Props) {
  const [stage, setStage] = useState<'idle' | 'humming' | 'burst' | 'flipped'>('idle');
  const [flip, setFlip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fx = EFFECTS[card.rarity];

  const startReveal = () => {
    // Stage 1: card back vibrates with energy hum (1.2s)
    setStage('humming');
    playHum();
    setTimeout(() => {
      // Stage 2: particle burst + shake (0.6s)
      setStage('burst');
      playSparkle();
      if (containerRef.current) {
        containerRef.current.style.transform = `translate(${(Math.random()-.5)*6}px, ${(Math.random()-.5)*6}px)`;
        setTimeout(() => { containerRef.current!.style.transform = 'translate(0,0)'; }, 40);
        setTimeout(() => { containerRef.current!.style.transform = `translate(${(Math.random()-.5)*4}px, ${(Math.random()-.5)*4}px)`; }, 50);
        setTimeout(() => { containerRef.current!.style.transform = 'translate(0,0)'; }, 90);
      }
      setTimeout(() => {
        // Stage 3: 3D flip reveal — stays until user clicks button
        setFlip(true);
        setStage('flipped');
        // NO auto-timer here — user must click "确认/收下好运" button
      }, 600);
    }, 1200);
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center" style={{ perspective: '1000px' }}>
      {/* Idle: click to start */}
      {stage === 'idle' && (
        <div className="text-center cursor-pointer" onClick={startReveal}>
          <div className="w-56 h-80 rounded-2xl border-4 border-purple-500/50 flex items-center justify-center
                          bg-gradient-to-b from-slate-900 to-indigo-950
                          animate-pulse hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all">
            <div className="text-center">
              <div className="text-5xl mb-2">🎴</div>
              <p className="text-purple-300 text-base font-bold">未翻转卡牌</p>
            </div>
          </div>
          <p className="text-neon-cyan mt-4 text-lg animate-pulse font-bold">👆 点击翻牌！</p>
        </div>
      )}

      {/* Stage 1: Card back vibrating */}
      {stage === 'humming' && (
        <div className="text-center">
          <div className="w-56 h-80 rounded-2xl border-4 border-purple-500/50 flex items-center justify-center
                          bg-gradient-to-b from-slate-900 to-indigo-950 shadow-[0_0_40px_rgba(168,85,247,0.4)]"
               style={{ animation: 'shake 0.08s ease infinite' }}>
            <div className="text-5xl animate-pulse">🎴</div>
          </div>
          <p className="text-purple-300 mt-4 text-lg font-bold animate-pulse">⚡ 能量汇聚中...</p>
          {/* Energy particles */}
          <div className="flex gap-1 mt-2 justify-center">
            {Array.from({length:8}).map((_,i)=>(
              <span key={i} className="text-base animate-pulse"
                    style={{color:fx.particle,animationDelay:`${i*0.12}s`,opacity:0.6+Math.random()*0.4}}>✦</span>
            ))}
          </div>
        </div>
      )}

      {/* Stage 2: Burst + flip */}
      {stage === 'burst' && (
        <div className="text-center">
          <div className={`w-56 h-80 rounded-2xl border-2 flex items-center justify-center
                          bg-gradient-to-b ${fx.bg} ${fx.glow}`}
               style={{ borderColor: fx.particle, animation: 'shake 0.05s ease infinite' }}>
            <div className="text-6xl" style={{ animation: 'pulse 0.3s ease-in-out infinite' }}>💥</div>
          </div>
          <p className="text-yellow-300 mt-4 text-lg font-extrabold animate-pulse">🔥 开！！！</p>
          {/* Particle rays */}
          <div className="flex gap-1 mt-2 justify-center flex-wrap max-w-xs">
            {Array.from({length:16}).map((_,i)=>(
              <span key={i} className="text-base"
                    style={{color:fx.particle,transform:`rotate(${i*22.5}deg)`,display:'inline-block',animation:'pulse 0.2s ease-in-out infinite',animationDelay:`${i*0.04}s`}}>✦</span>
            ))}
          </div>
        </div>
      )}

      {/* Stage 3: 3D flipped card with confirm button */}
      {stage === 'flipped' && (
        <div className="text-center">
          <div
            className={`w-64 h-96 rounded-2xl border-2 ${fx.glow} flex flex-col items-center justify-center p-6 text-center
                        bg-gradient-to-b ${fx.bg}`}
            style={{
              borderColor: card.rarity === 'SSR' ? '#ffd700' : card.rarity === 'SR' ? '#c0a0ff' : card.rarity === 'R' ? '#60a0ff' : '#808080',
              animation: flip ? 'flipIn 0.6s ease-out' : '',
            }}
          >
            <div className="text-6xl mb-3">{card.emoji}</div>
            <div className="text-base font-bold mb-2 px-3 py-1 rounded-full border"
                 style={{ color: fx.particle, borderColor: fx.particle }}>
              {card.rarity === 'SSR' ? 'SSR · 至宝' : card.rarity === 'SR' ? 'SR · 稀有' : card.rarity === 'R' ? 'R · 精良' : 'N · 普通'}
            </div>
            <h3 className={`text-3xl font-extrabold ${fx.text}`}>{card.name}</h3>
            <p className="text-slate-300 text-lg mt-2 leading-relaxed">{card.description}</p>
            {isNew && (
              <span className="mt-2 px-3 py-0.5 bg-pink-500/20 text-pink-300 text-base rounded-full font-bold border border-pink-500/40">
                ⭐ NEW!
              </span>
            )}
          </div>
          {/* Confirmation button — user MUST click to proceed */}
          <button
            onClick={onComplete}
            className="mt-6 px-10 py-4 rounded-full text-xl font-extrabold text-white
                       bg-gradient-to-r from-purple-600 to-pink-500
                       hover:scale-105 transition-all cursor-pointer
                       shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:shadow-[0_0_50px_rgba(255,45,149,0.7)]"
          >
            ✅ 确认 / 收下好运
          </button>
        </div>
      )}
    </div>
  );
}
