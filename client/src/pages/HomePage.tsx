import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import type { GameMode } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const { setMode, user } = useGameStore();

  const handleSelect = (mode: GameMode) => {
    setMode(mode);
    navigate('/input');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      {/* Title */}
      <div className="text-center mb-10 md:mb-16">
        <h1 className="text-5xl md:text-8xl font-black mb-4 tracking-tight leading-tight text-center">
          <span className="inline-block">🔮</span>{' '}
          <span className="text-transparent bg-clip-text
                           bg-gradient-to-r from-neon-cyan via-purple-400 to-neon-pink
                           glitch-text">赛博排毒</span>
        </h1>
        <p className="text-xl md:text-3xl text-purple-300 font-bold tracking-widest">精神能量站</p>
        <p className="text-slate-400 mt-4 text-base md:text-base max-w-2xl mx-auto leading-relaxed">
          把你的烦恼转化为能量，收集赛博法器，在崩溃的世界里活出仪式感
        </p>
      </div>

      {/* Mode Cards */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-10 w-full max-w-4xl">
        {/* Workplace */}
        <button
          onClick={() => handleSelect('workplace')}
          className="flex-1 group cursor-pointer rounded-2xl p-8 md:p-10 text-center
                     bg-gradient-to-b from-slate-900/90 to-indigo-950/80
                     border border-purple-500/30 glow-purple
                     hover:border-pink-400/60 hover:shadow-[0_0_40px_rgba(255,45,149,0.3)]
                     transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="text-6xl md:text-8xl mb-4 group-hover:animate-bounce">👨‍💻</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">精神打工人</h2>
          <p className="text-slate-400 text-base md:text-base leading-relaxed">
            被PUA了？被甩锅了？<br />无效会议开到怀疑人生？<br />来，把你的烦恼降维成法器。
          </p>
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            <Badge color="pink">SSR 因果律反弹御守</Badge>
            <Badge color="purple">SR 大厂黑话过滤器</Badge>
          </div>
        </button>

        {/* Academic */}
        <button
          onClick={() => handleSelect('academic')}
          className="flex-1 group cursor-pointer rounded-2xl p-8 md:p-10 text-center
                     bg-gradient-to-b from-slate-900/90 to-purple-950/80
                     border border-purple-500/30 glow-cyan
                     hover:border-cyan-400/60 hover:shadow-[0_0_40px_rgba(0,240,255,0.3)]
                     transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="text-6xl md:text-8xl mb-4 group-hover:animate-bounce">🎓</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">学术排毒者</h2>
          <p className="text-slate-400 text-base md:text-base leading-relaxed">
            论文写不出来？DDL追着跑？<br />导师已读乱回？<br />来，把你的焦虑转化成功德。
          </p>
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            <Badge color="cyan">SSR 导师已读乱回结界</Badge>
            <Badge color="purple">SR DDL逆转时钟</Badge>
          </div>
        </button>
      </div>

      <p className="text-slate-600 text-base mt-10">选择你的身份，开始赛博排毒修行 ✨</p>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: string }) {
  const colors: Record<string, string> = {
    pink: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  };
  return (
    <span className={`text-base px-2 py-1 rounded-full border ${colors[color] || colors.purple}`}>
      {children}
    </span>
  );
}
