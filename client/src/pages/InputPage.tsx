import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import CanvasDraw from '../components/CanvasDraw';
import type { InputType } from '../types';

export default function InputPage() {
  const navigate = useNavigate();
  const { mode, setInput } = useGameStore();
  const [activeTab, setActiveTab] = useState<InputType>('text');
  const [textContent, setTextContent] = useState('');
  const [drawData, setDrawData] = useState('');
  const [saveToCollection, setSaveToCollection] = useState(true);
  const [error, setError] = useState('');

  if (!mode) { navigate('/'); return null; }

  const handleSubmit = () => {
    setError('');
    if (activeTab === 'text') {
      if (textContent.trim().length < 1) {
        setError('至少写点什么吧...哪怕是两个字也好 🔥');
        return;
      }
      const finalText = textContent.length > 200 ? textContent.slice(0, 200) : textContent;
      setInput('text', finalText);
    } else {
      if (!drawData) { setError('请先在画布上画点什么吧 🎨'); return; }
      setInput('draw', drawData, '', saveToCollection);
    }
    navigate('/physics');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-5xl font-extrabold text-neon-cyan">
          {mode === 'workplace' ? '👨‍💻 精神打工人' : '🎓 学术排毒者'}
        </h2>
        <p className="text-slate-400 mt-2 text-base md:text-lg">把你的烦恼倒出来吧...</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <TabBtn active={activeTab === 'text'} onClick={() => setActiveTab('text')}>
          ⌨️ 文字排毒
        </TabBtn>
        <TabBtn active={activeTab === 'draw'} onClick={() => setActiveTab('draw')}>
          🎨 手绘排毒
        </TabBtn>
      </div>

      {/* Content */}
      <div className="w-full max-w-3xl mx-auto">
        <div className="rounded-2xl border border-purple-500/30 glow-purple
                        bg-gradient-to-b from-slate-900/90 to-indigo-950/80 p-6 md:p-10">
          {activeTab === 'text' ? (
            <div>
              <textarea
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder={`尽情发泄吧...（最多200字）\n\n例如：今天又被甩锅了，明明不是我的bug非说是我写的！产品经理第18次改需求，我直接原地升天！！！`}
                rows={7}
                maxLength={200}
                className="w-full px-5 py-4 rounded-xl bg-slate-950/80 border border-purple-500/30
                           text-white placeholder-slate-500 text-lg md:text-xl leading-relaxed
                           focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_20px_rgba(0,240,255,0.2)]
                           transition-all resize-none"
              />
              <div className="flex justify-end mt-2">
                <span className="text-base text-slate-500">{textContent.length}/200 字</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <CanvasDraw onDraw={setDrawData} />
              <label className="flex items-center gap-3 cursor-pointer select-none
                                text-slate-300 text-lg hover:text-neon-cyan transition-colors">
                <input
                  type="checkbox"
                  checked={saveToCollection}
                  onChange={e => setSaveToCollection(e.target.checked)}
                  className="w-5 h-5 rounded accent-purple-500 cursor-pointer"
                />
                📚 加入精神图鉴
              </label>
            </div>
          )}

          {error && <p className="text-red-400 text-base mt-4 text-center">{error}</p>}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="mt-8 px-12 md:px-16 py-4 rounded-full text-xl md:text-2xl font-extrabold text-white
                   bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500
                   hover:opacity-90 hover:scale-105 transition-all
                   shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_50px_rgba(255,45,149,0.6)]
                   cursor-pointer tracking-wider"
      >
        🔥 开始排毒
      </button>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-3 rounded-full text-lg font-bold transition-all cursor-pointer tracking-wide
                  ${active
                    ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                    : 'bg-slate-900/70 text-slate-400 border border-purple-500/30 hover:text-neon-cyan hover:border-neon-cyan/40'
                  }`}
    >
      {children}
    </button>
  );
}
