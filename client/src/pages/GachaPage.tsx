import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { drawGacha } from '../utils/api';
import { randomRarity } from '../utils/gacha';
import GachaAnimation from '../components/GachaAnimation';
import type { Card, UserCard } from '../types';

const FALLBACK_CARDS: Record<string, Record<string, Card>> = {
  workplace: {
    SSR: { id: 'local-ssr-wp', name: '因果律反弹御守', rarity: 'SSR', mode: 'workplace', description: '装备后自动反弹一切甩锅、PUA和无效会议。', emoji: '🛡️' },
    SR: { id: 'local-sr-wp', name: '大厂黑话过滤器', rarity: 'SR', mode: 'workplace', description: '自动将黑话翻译成人话。', emoji: '🔍' },
    R: { id: 'local-r-wp', name: '疯狂星期四V我50', rarity: 'R', mode: 'workplace', description: '每周四自动向同事群发"V我50"请求。', emoji: '🍗' },
    N: { id: 'local-n-wp', name: '摆烂便利贴', rarity: 'N', mode: 'workplace', description: '一张写着"关我屁事"的便利贴。', emoji: '📝' },
  },
  academic: {
    SSR: { id: 'local-ssr-ac', name: '导师已读乱回结界', rarity: 'SSR', mode: 'academic', description: '展开后导师的修改意见自动变成"挺好的，继续加油"。', emoji: '🔮' },
    SR: { id: 'local-sr-ac', name: 'DDL逆转时钟', rarity: 'SR', mode: 'academic', description: '将DDL逆转24小时。注意：每次使用后需要充电7天。', emoji: '⏰' },
    R: { id: 'local-r-ac', name: '降重符', rarity: 'R', mode: 'academic', description: '贴在论文封面，查重率自动下降15%。', emoji: '📜' },
    N: { id: 'local-n-ac', name: '学术垃圾袋', rarity: 'N', mode: 'academic', description: '容量无限的垃圾袋，可装下你所有写废的论文草稿。', emoji: '🗑️' },
  },
};

export default function GachaPage() {
  const navigate = useNavigate();
  const { mode, currentRunId, setLastDraw, addToCollection, saveToCollection, addDiyCard, inputType, inputContent, user } = useGameStore();
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawComplete, setDrawComplete] = useState(false);
  const diySavedRef = useRef(false); // ⛔ prevent double-save from React strict mode

  if (!mode) { navigate('/'); return null; }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (user) {
          const result = await drawGacha(mode, currentRunId || undefined);
          setDrawnCard(result.card); setIsNew(result.isNew);
          setLastDraw(result.card, result.isNew);
          if (saveToCollection) {
            addToCollection({ id: result.userCardId, userId: user.id, cardId: result.card.id, card: result.card, createdAt: new Date().toISOString() });
          }
        } else {
          const card = FALLBACK_CARDS[mode][randomRarity()];
          setDrawnCard(card); setIsNew(true); setLastDraw(card, true);
        }
      } catch {
        const card = FALLBACK_CARDS[mode][randomRarity()];
        setDrawnCard(card); setIsNew(true); setLastDraw(card, true);
      } finally {
        setLoading(false);

        // ── DIY card: save the drawing as a collectible card (once only) ──
        if (inputType === 'draw' && inputContent && saveToCollection && !diySavedRef.current) {
          diySavedRef.current = true;
          const diyCard: Card = {
            id: 'diy_' + Date.now(),
            name: '我的手绘法器',
            rarity: 'SSR',
            mode: mode!,
            description: '由你的手绘注入灵魂的独有法器，世间仅此一件。',
            emoji: '🎨',
            imageData: inputContent,
            isDIY: true,
          };
          const userCard: UserCard = {
            id: 'diy_uc_' + Date.now(),
            userId: user?.id || 'local',
            cardId: diyCard.id,
            card: diyCard,
            createdAt: new Date().toISOString(),
          };
          addDiyCard(userCard);
        }
      }
    })();
  }, []);

  const handleStartOver = () => { useGameStore.getState().reset(); navigate('/input'); };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 w-full">
      <h2 className="text-3xl md:text-5xl font-extrabold text-neon-cyan mb-8">🎴 精神能量抽卡</h2>

      {loading && (
        <div className="text-center">
          <div className="text-6xl md:text-8xl animate-pulse">🔮</div>
          <p className="text-neon-cyan mt-4 text-lg">正在连接精神能量网络...</p>
        </div>
      )}

      {!loading && drawnCard && !drawComplete && (
        <GachaAnimation card={drawnCard} isNew={isNew} onComplete={() => setDrawComplete(true)} />
      )}

      {drawComplete && (
        <div className="flex flex-col items-center gap-5 mt-4">
          <p className="text-slate-400 text-base md:text-lg">
            {isNew ? '🎉 获得新卡牌！已收入图鉴' : '📋 重复卡牌，但仍计入你的能量值'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/collection')}
              className="px-8 py-4 rounded-xl bg-slate-900/80 border border-cyan-500/40 text-cyan-300
                         text-lg font-bold hover:bg-cyan-500/10 hover:shadow-[0_0_25px_rgba(0,240,255,0.3)]
                         transition-all cursor-pointer"
            >
              📚 查看我的图鉴
            </button>
            <button
              onClick={handleStartOver}
              className="px-8 py-4 rounded-xl text-lg font-bold text-white
                         bg-gradient-to-r from-purple-600 to-pink-500
                         hover:opacity-90 hover:scale-105 transition-all cursor-pointer
                         shadow-[0_0_25px_rgba(168,85,247,0.5)]"
            >
              🔄 再排一次毒
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
