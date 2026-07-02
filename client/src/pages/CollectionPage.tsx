import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getCollection, getCollectionStats } from '../utils/api';
import { getRarityColor } from '../utils/gacha';
import type { Card, UserCard, CollectionStats, GameMode, Rarity } from '../types';

const ALL_CARDS: Card[] = [
  { id: 'wp-ssr', name: '因果律反弹御守', rarity: 'SSR', mode: 'workplace', description: '装备后自动反弹一切甩锅、PUA和无效会议。使用者将获得长达24小时的职场和平光环。', emoji: '🛡️' },
  { id: 'wp-sr', name: '大厂黑话过滤器', rarity: 'SR', mode: 'workplace', description: '自动将"赋能""抓手""闭环""对齐"等黑话翻译成人话，节省80%的理解时间。', emoji: '🔍' },
  { id: 'wp-r', name: '疯狂星期四V我50', rarity: 'R', mode: 'workplace', description: '每周四自动向同事群发"V我50"请求，有一定概率真的收到红包。', emoji: '🍗' },
  { id: 'wp-n', name: '摆烂便利贴', rarity: 'N', mode: 'workplace', description: '一张写着"关我屁事"的便利贴。贴在显示器上可获得微弱的心理安慰。', emoji: '📝' },
  { id: 'ac-ssr', name: '导师已读乱回结界', rarity: 'SSR', mode: 'academic', description: '展开后导师的修改意见自动变成"挺好的，继续加油"。论文一次过的概率提升300%。', emoji: '🔮' },
  { id: 'ac-sr', name: 'DDL逆转时钟', rarity: 'SR', mode: 'academic', description: '将DDL逆转24小时。注意：每次使用后需要充电7天，请谨慎选择时机。', emoji: '⏰' },
  { id: 'ac-r', name: '降重符', rarity: 'R', mode: 'academic', description: '贴在论文封面，查重率自动下降15%。副作用：可能把"机器学习"降重成"机械学习"。', emoji: '📜' },
  { id: 'ac-n', name: '学术垃圾袋', rarity: 'N', mode: 'academic', description: '容量无限的垃圾袋，可装下你所有写废的论文草稿。自带除臭功能。', emoji: '🗑️' },
];

const CRAFT_EMOJIS = ['🤡','🤮','👿','💸','📅','🎓','💥','🔥','💀','👻','🤖','👾','🧠','💊','🔪','💣','🎭','🫠','🥴','😤','💢','🗿','🍺','🎮','⌛','🪷','⚡','🌈'];

const RARITY_NAMES: Record<Rarity, string> = {
  SSR: 'SSR · 至宝', SR: 'SR · 稀有', R: 'R · 精良', N: 'N · 普通',
};

// ═══ Card Detail Modal ═══
function CardDetailModal({ card, count, isDIY, onClose, onDelete, onShare }: {
  card: Card; count: number; isDIY: boolean; onClose: () => void;
  onDelete?: () => void; onShare: () => void;
}) {
  const color = isDIY ? '#22d3ee' : getRarityColor(card.rarity);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-sm w-full text-center border-2 bg-gradient-to-b from-slate-900 to-indigo-950"
        style={{ borderColor: color }} onClick={(e) => e.stopPropagation()}>

        {card.isDIY && card.imageData ? (
          <img src={card.imageData} alt={card.name}
            className="w-40 h-40 object-contain rounded-xl mb-3 mx-auto border-2 border-purple-500/30" />
        ) : (
          <div className="text-6xl mb-3">{card.emoji}</div>
        )}

        {isDIY ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 mb-2 inline-block">
            🎨 独创法器
          </span>
        ) : (
          <div className="text-sm font-bold mb-1 px-3 py-1 rounded border inline-block"
            style={{ color, borderColor: color }}>
            {RARITY_NAMES[card.rarity]}
          </div>
        )}

        <h3 className={`text-xl font-bold mt-2 ${isDIY ? 'text-cyan-300' : `rarity-text-${card.rarity}`}`}>
          {card.name}
        </h3>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">{card.description}</p>

        <div className="flex gap-3 mt-3 text-sm text-slate-400 justify-center">
          <span>模式：{card.mode === 'workplace' ? '👨‍💻 打工人' : '🎓 学术'}</span>
          <span>持有：{count} 张</span>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <button onClick={onShare}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-bold text-white
                       bg-gradient-to-r from-purple-600 to-pink-500
                       hover:opacity-90 transition-all cursor-pointer
                       shadow-[0_0_15px_rgba(236,72,153,0.4)]">
            💾 保存法器并分享
          </button>

          {isDIY && (
            confirmDelete ? (
              <div className="flex gap-2">
                <button onClick={onDelete}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-red-600/80 text-white
                             hover:bg-red-600 transition-colors cursor-pointer">
                  确认销毁
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm bg-slate-700 text-slate-300
                             hover:bg-slate-600 transition-colors cursor-pointer">
                  取消
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full px-4 py-2 rounded-lg text-sm border border-red-400/40 text-red-400
                           hover:bg-red-400/10 transition-colors cursor-pointer">
                🗑️ 销毁此法器
              </button>
            )
          )}

          <button onClick={onClose}
            className="w-full px-4 py-2 rounded-lg text-sm bg-purple-500/15 text-purple-300
                       border border-purple-500/30 hover:bg-purple-500/25 transition-colors cursor-pointer">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ Craft Editor Modal ═══
const CRAFT_CANVAS_W = 260;
const CRAFT_CANVAS_H = 368; // 1:1.414 A4 ratio

function CraftEditor({ onCraft, onClose }: {
  onCraft: (card: Card) => void; onClose: () => void;
}) {
  const [emoji, setEmoji] = useState('🔥');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [mode, setMode] = useState<GameMode>('workplace');
  const [drawMode, setDrawMode] = useState(false);
  const [drawData, setDrawData] = useState('');
  const [drawColor, setDrawColor] = useState('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const craftPresetColors = [
    { value: '#ffffff', label: '白' },
    { value: '#ff2d95', label: '暴躁红' },
    { value: '#00f0ff', label: '学术蓝' },
    { value: '#22c55e', label: '原谅绿' },
    { value: '#fbbf24', label: '能量金' },
  ];

  const startDraw = (e: React.MouseEvent) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    setIsDrawing(true);
    const r = c.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  };
  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const r = c.getBoundingClientRect();
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    ctx.strokeStyle = drawColor; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke();
  };
  const stopDraw = () => {
    setIsDrawing(false);
    if (canvasRef.current) setDrawData(canvasRef.current.toDataURL('image/png'));
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, CRAFT_CANVAS_W, CRAFT_CANVAS_H);
  }, [drawMode]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const card: Card = {
      id: 'craft_' + Date.now(),
      name: title.trim(),
      rarity: 'SSR',
      mode,
      description: desc.trim() || '由你的灵感熔炼而成的独有法器。',
      emoji: drawMode ? '🎨' : emoji,
      imageData: drawMode ? drawData : null,
      isDIY: true,
    };
    onCraft(card);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-lg w-full border-2 border-cyan-500/40 bg-gradient-to-b from-slate-900 to-indigo-950
                      shadow-[0_0_60px_rgba(34,211,238,0.3)] max-h-[95vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-extrabold text-cyan-400 text-center mb-4">⚒️ 高级熔炼：创造神卡</h3>

        {/* Emoji picker vs draw toggle */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setDrawMode(false)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer
                        ${!drawMode ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            😀 选贴纸
          </button>
          <button onClick={() => setDrawMode(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer
                        ${drawMode ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            ✏️ 手绘专属图标
          </button>
        </div>

        {drawMode ? (
          <div className="flex flex-col items-center gap-3 mb-4">
            {/* Color picker for craft canvas */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <label className="relative cursor-pointer" title="无级调色盘">
                <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)}
                  className="w-9 h-9 rounded-full border-2 border-white cursor-pointer
                             shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all hover:scale-110" />
              </label>
              {craftPresetColors.map(c => (
                <button key={c.value} onClick={() => setDrawColor(c.value)}
                  className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer
                              ${drawColor === c.value ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }} title={c.label} />
              ))}
            </div>
            <canvas ref={canvasRef} width={CRAFT_CANVAS_W} height={CRAFT_CANVAS_H}
              className="rounded-xl border-2 border-cyan-500/40 cursor-crosshair shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              style={{ width: CRAFT_CANVAS_W + 'px', height: CRAFT_CANVAS_H + 'px', background: 'rgba(15,7,32,0.85)' }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} />
            <button onClick={() => {
              const c = canvasRef.current;
              if (c) { const ctx = c.getContext('2d'); if (ctx) { ctx.clearRect(0, 0, CRAFT_CANVAS_W, CRAFT_CANVAS_H); setDrawData(''); } }
            }}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors">🗑️ 清空重画</button>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2.5 mb-4 max-h-44 overflow-y-auto p-3 bg-slate-950/60 rounded-lg">
            {CRAFT_EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`text-3xl p-2 rounded-lg transition-all cursor-pointer
                            ${emoji === e ? 'bg-cyan-600/50 scale-125 shadow-[0_0_12px_rgba(34,211,238,0.5)]' : 'hover:bg-slate-800'}`}>
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Preview — no SSR badge, focus on content */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/60 border border-cyan-500/20 mb-4">
          {drawMode && drawData ? (
            <img src={drawData} className="w-14 h-14 rounded-lg object-contain border border-cyan-500/30" alt="preview" />
          ) : (
            <span className="text-4xl">{emoji}</span>
          )}
          <div className="flex-1">
            <p className="text-xs text-cyan-400 font-bold">🎨 独创法器</p>
            <p className="text-white text-base font-bold">{title || '输入卡牌名称...'}</p>
            <p className="text-slate-500 text-xs">{desc || '底部文案...'}</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
            {mode === 'workplace' ? '👨‍💻 职场' : '🎓 学术'}
          </span>
        </div>

        {/* Title + Description + Category */}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="卡牌标题（如：周五下班符）"
          maxLength={12}
          className="w-full px-4 py-2.5 rounded-lg bg-slate-950/80 border border-purple-500/30 text-white
                     placeholder-slate-500 text-sm mb-3 focus:outline-none focus:border-cyan-400" />

        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="底部文案（如：独有法器 ×1）"
          maxLength={30}
          className="w-full px-4 py-2.5 rounded-lg bg-slate-950/80 border border-purple-500/30 text-white
                     placeholder-slate-500 text-sm mb-4 focus:outline-none focus:border-cyan-400" />

        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('workplace')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer
                        ${mode === 'workplace' ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(255,45,149,0.4)]' : 'bg-slate-800 text-slate-400'}`}>
            👨‍💻 职场
          </button>
          <button onClick={() => setMode('academic')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer
                        ${mode === 'academic' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-slate-800 text-slate-400'}`}>
            🎓 学术
          </button>
        </div>

        <button onClick={handleSubmit} disabled={!title.trim()}
          className="w-full py-3 rounded-xl text-base font-extrabold text-white
                     bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-600
                     hover:opacity-90 transition-all cursor-pointer
                     shadow-[0_0_25px_rgba(34,211,238,0.5)] disabled:opacity-40 disabled:cursor-not-allowed">
          ⚡ 熔炼成器
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
export default function CollectionPage() {
  const navigate = useNavigate();
  const { user, diyCards, loadDiyCards, addDiyCard, removeDiyCard, consumedCardIds, consumeCards, loadConsumedCards } = useGameStore();
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedIsDiy, setSelectedIsDiy] = useState(false);
  const [filter, setFilter] = useState<'all'|'workplace'|'academic'|'diy'>('all');
  const [loading, setLoading] = useState(true);
  const [showCraft, setShowCraft] = useState(false);
  const [craftedMsg, setCraftedMsg] = useState('');

  if (!user) { navigate('/'); return null; }

  useEffect(() => {
    (async () => {
      try {
        const [cards, st] = await Promise.all([getCollection(user.id), getCollectionStats(user.id)]);
        setUserCards(cards); setStats(st);
      } catch { setUserCards(useGameStore.getState().collection); }
      finally { setLoading(false); }
    })();
    loadDiyCards();
    loadConsumedCards();
  }, [user.id]);

  // ── Inventory with consumption tracking ──
  const consumedSet = new Set(consumedCardIds);
  const activeUserCards = userCards.filter(uc => !consumedSet.has(uc.id));

  // Build collMap from active cards
  const collMap = new Map<string, { card: Card; count: number }>();
  for (const uc of activeUserCards) {
    const key = uc.card?.name || uc.cardId;
    const ex = collMap.get(key);
    if (ex) ex.count++;
    else collMap.set(key, { card: uc.card || ALL_CARDS.find(c => c.id === uc.cardId) || ALL_CARDS[0], count: 1 });
  }

  // ── Crafting inventory check ──
  const srCards = activeUserCards.filter(uc => (uc.card?.rarity || 'N') === 'SR');
  const rCards = activeUserCards.filter(uc => (uc.card?.rarity || 'N') === 'R');
  const nCards = activeUserCards.filter(uc => (uc.card?.rarity || 'N') === 'N');
  const canCraft = srCards.length >= 1 && rCards.length >= 5 && nCards.length >= 10;

  // ── System cards display (hidden when 'diy' filter active) ──
  const showSystem = filter !== 'diy';
  const displayCards = showSystem
    ? ALL_CARDS.filter(c => filter === 'all' || c.mode === filter).map(card => {
        const c = collMap.get(card.name);
        return { card, collected: !!c, count: c?.count || 0 };
      })
    : [];

  // ── DIY cards filtered ──
  const filteredDiyCards = diyCards.filter(uc => {
    if (filter === 'diy') return true;
    if (filter === 'all') return true;
    return uc.card.mode === filter;
  }).map(uc => ({
    card: uc.card,
    collected: true,
    count: 1,
    isDIY: true,
  }));

  const handleSelect = (card: Card, count: number, isDIY = false) => {
    setSelectedCard(card);
    setSelectedCount(count);
    setSelectedIsDiy(isDIY);
  };

  const handleDelete = () => {
    if (selectedCard) {
      removeDiyCard(selectedCard.id);
      setSelectedCard(null);
    }
  };

  // ── Craft handler ──
  const handleCraft = (card: Card) => {
    const toConsume = [
      ...srCards.slice(0, 1).map(c => c.id),
      ...rCards.slice(0, 5).map(c => c.id),
      ...nCards.slice(0, 10).map(c => c.id),
    ];
    consumeCards(toConsume);

    const userCard: UserCard = {
      id: card.id,
      userId: user?.id || 'local',
      cardId: card.id,
      card,
      createdAt: new Date().toISOString(),
    };
    addDiyCard(userCard);
    setShowCraft(false);
    setCraftedMsg('神卡熔炼成功！已在图鉴中可见 ✨');
    setTimeout(() => setCraftedMsg(''), 3000);
  };

  // ── Share poster generator ──
  const handleShare = useCallback(() => {
    if (!selectedCard) return;
    const card = selectedCard;
    const c = document.createElement('canvas');
    c.width = 600; c.height = 840;
    const ctx = c.getContext('2d')!;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, 840);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(0.5, '#1e1b4b'); bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 600, 840);

    // Neon border
    const borderColor = card.isDIY ? '#22d3ee' : getRarityColor(card.rarity);
    ctx.strokeStyle = borderColor; ctx.lineWidth = 6;
    ctx.shadowColor = borderColor; ctx.shadowBlur = 30;
    ctx.strokeRect(12, 12, 576, 816);
    ctx.shadowBlur = 0;

    // Inner border
    ctx.strokeStyle = 'rgba(168,85,247,0.4)'; ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(30, 30, 540, 780);
    ctx.setLineDash([]);

    // Corner accents
    const cl = 40;
    ctx.strokeStyle = borderColor; ctx.lineWidth = 3;
    ctx.shadowColor = borderColor; ctx.shadowBlur = 15;
    [
      [40,40,40,40+cl,40,40,40+cl,40],
      [560,40,560-cl,40,560,40,560,40+cl],
      [40,800,40,800-cl,40,800,40+cl,800],
      [560,800,560-cl,800,560,800,560,800-cl],
    ].forEach(([x1,y1,x2,y2,x3,y3,x4,y4]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.moveTo(x3,y3); ctx.lineTo(x4,y4); ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Badge
    if (card.isDIY) {
      ctx.fillStyle = 'rgba(34,211,238,0.15)'; ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2;
      const badgeW = 180, badgeH = 40;
      const badgeX = (600 - badgeW) / 2, badgeY = 80;
      ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#22d3ee'; ctx.font = 'bold 18px "Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('🎨 独创法器', 300, badgeY + 28);
    } else {
      const rarityColor = getRarityColor(card.rarity);
      ctx.fillStyle = rarityColor + '20'; ctx.strokeStyle = rarityColor;
      ctx.lineWidth = 2;
      const badgeW = 180, badgeH = 40;
      const badgeX = (600 - badgeW) / 2, badgeY = 80;
      ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20); ctx.fill(); ctx.stroke();
      ctx.fillStyle = rarityColor; ctx.font = 'bold 18px "Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(RARITY_NAMES[card.rarity], 300, badgeY + 28);
    }

    // Card visual
    const renderVisual = () => {
      if (card.isDIY && card.imageData) {
        const img = new Image();
        img.onload = () => {
          const iw = 280, ih = 280, ix = (600 - iw) / 2, iy = 160;
          ctx.fillStyle = '#1e1b4b'; ctx.fillRect(ix - 4, iy - 4, iw + 8, ih + 8);
          ctx.strokeStyle = 'rgba(34,211,238,0.5)'; ctx.lineWidth = 2;
          ctx.strokeRect(ix - 4, iy - 4, iw + 8, ih + 8);
          ctx.drawImage(img, ix, iy, iw, ih);
          drawTextAndDownload(ctx, c, card);
        };
        img.src = card.imageData;
        if (img.complete) {
          const iw = 280, ih = 280, ix = (600 - iw) / 2, iy = 160;
          ctx.fillStyle = '#1e1b4b'; ctx.fillRect(ix - 4, iy - 4, iw + 8, ih + 8);
          ctx.strokeStyle = 'rgba(34,211,238,0.5)'; ctx.lineWidth = 2;
          ctx.strokeRect(ix - 4, iy - 4, iw + 8, ih + 8);
          ctx.drawImage(img, ix, iy, iw, ih);
          drawTextAndDownload(ctx, c, card);
        }
      } else {
        ctx.font = '140px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(card.emoji, 300, 320);
        drawTextAndDownload(ctx, c, card);
      }
    };
    renderVisual();
  }, [selectedCard]);

  const totalDiy = diyCards.length;

  return (
    <div className="flex-1 px-3 py-3 w-full max-w-5xl mx-auto overflow-hidden flex flex-col" style={{ maxHeight: '100vh' }}>
      {/* Header */}
      <div className="text-center mb-3 shrink-0">
        <h2 className="text-4xl font-extrabold text-neon-cyan drop-shadow-[0_0_12px_rgba(0,240,255,0.5)]">📚 精神能量图鉴</h2>
        <p className="text-slate-300 text-lg font-medium mt-1">
          {stats
            ? `已收集 ${stats.totalUnique + totalDiy} 种，共 ${stats.totalCards + totalDiy} 张`
            : `已收集 ${collMap.size + totalDiy} 种`
          }
        </p>
        {craftedMsg && <p className="text-cyan-400 text-lg font-bold mt-1 animate-pulse">{craftedMsg}</p>}
      </div>

      {/* Filters (left) + Craft button (right) */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {([
            { key: 'all', label: '全部' },
            { key: 'workplace', label: '👨‍💻 职场' },
            { key: 'academic', label: '🎓 学术' },
            { key: 'diy', label: '🎨 自创法器' },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-6 py-2.5 rounded-full text-lg font-semibold transition-all cursor-pointer
                          ${filter===key
                            ? key==='diy'
                              ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                              : 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                            : 'bg-slate-900/70 text-slate-400 border border-purple-500/30 hover:text-neon-cyan'}`}>
              {label}
            </button>
          ))}
        </div>

        <button onClick={() => setShowCraft(true)}
          disabled={!canCraft}
          className={`px-6 py-2.5 rounded-full text-base font-bold transition-all cursor-pointer shrink-0
                      ${canCraft
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:scale-105'
                        : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'}`}>
          ⚒️ 熔炼神卡 {canCraft ? '' : `(${srCards.length}/1SR ${rCards.length}/5R ${nCards.length}/10N)`}
        </button>
      </div>

      <p className="text-center text-base font-semibold tracking-wide text-zinc-300 mb-3 shrink-0">
        消耗 1SR + 5R + 10N → <span className="text-cyan-400">🎨 独创神卡</span>
        {!canCraft && <span className="text-slate-500">（库存不足，继续抽卡吧）</span>}
      </p>

      {/* Stats bars */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-2 shrink-0">
          {[
            { label: '👨‍💻 职场', s: stats.workplace, from: 'from-pink-500', to: 'to-purple-500' },
            { label: '🎓 学术', s: stats.academic, from: 'from-cyan-500', to: 'to-purple-500' },
          ].map(({ label, s, from, to }) => (
            <div key={label} className="rounded-lg p-2.5 bg-slate-900/70 border border-purple-500/20">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{label}</span>
                <span>{s.collected}/{s.total}{s.complete && ' ✅'}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className={`bg-gradient-to-r ${from} ${to} h-2 rounded-full transition-all`}
                  style={{ width: `${(s.collected / s.total) * 100}%` }} />
              </div>
            </div>
          ))
        }
        </div>
      )}

      {/* ═══════════════ CARD GRID — scrollable ═══════════════ */}
      {loading ? (
        <p className="text-center text-slate-400 text-sm">加载中...</p>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-5">
          {/* ── UPPER: System cards ── */}
          {showSystem && (
          <div className="grid grid-cols-4 gap-6">
            {displayCards.map(({ card, collected, count }) => (
              <button key={card.id}
                onClick={() => collected && handleSelect(card, count)}
                disabled={!collected}
                className={`rounded-xl p-3 text-center border-2 transition-all
                           aspect-[1/1.414] flex flex-col items-center justify-center gap-1
                           ${collected ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}
                style={collected
                  ? { borderColor: getRarityColor(card.rarity), boxShadow: `0 0 15px ${getRarityColor(card.rarity)}40`, background: 'rgba(15,23,42,0.8)' }
                  : { borderColor: 'rgba(51,65,85,0.4)', background: 'rgba(15,23,42,0.5)', opacity: 0.5 }
                }>
                <div className="text-4xl md:text-5xl leading-none">{collected ? card.emoji : '❓'}</div>
                <p className={`text-sm font-bold ${collected ? `rarity-text-${card.rarity}` : 'text-slate-600'}`}>
                  {collected ? card.rarity : '???'}
                </p>
                <p className="text-sm text-white font-bold truncate w-full">{collected ? card.name : '???'}</p>
                {collected && count > 0 && <p className="text-sm text-slate-400">×{count}</p>}
                {!collected && <p className="text-sm text-slate-600">未获得</p>}
              </button>
            ))}
          </div>
          )}

          {/* ── DIVIDER + LOWER: DIY cards ── */}
          {filteredDiyCards.length > 0 && (
            <>
              {showSystem && (
                <div className="flex items-center gap-3 px-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                  <span className="text-sm text-cyan-400 font-bold whitespace-nowrap tracking-wider">—— 玩家自创法器 ——</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                </div>
              )}

              <div className="grid grid-cols-4 gap-6">
                {filteredDiyCards.map(({ card }) => (
                  <button key={card.id} onClick={() => handleSelect(card, 1, true)}
                    className="rounded-xl p-3 text-center border-2 transition-all cursor-pointer hover:scale-105
                               aspect-[1/1.414] flex flex-col items-center justify-center gap-1
                               bg-white/5 backdrop-blur-sm"
                    style={{
                      borderColor: '#22d3ee',
                      boxShadow: '0 0 14px rgba(34,211,238,0.3), inset 0 0 24px rgba(34,211,238,0.06)',
                    }}>
                    {card.imageData ? (
                      <img src={card.imageData} alt={card.name}
                        className="w-full flex-1 object-contain rounded-lg border border-cyan-500/15 min-h-0" />
                    ) : (
                      <div className="text-4xl md:text-5xl leading-none">{card.emoji}</div>
                    )}
                    <p className="text-sm font-bold text-cyan-400">🎨 独创</p>
                    <p className="text-sm text-white font-bold truncate w-full">{card.name}</p>
                    <p className="text-sm text-cyan-400/60">独有 ×1</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {displayCards.length + filteredDiyCards.length === 0 && (
            <p className="text-center text-slate-600 text-sm py-8">该分类下暂无卡牌</p>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          count={selectedCount}
          isDIY={selectedIsDiy}
          onClose={() => setSelectedCard(null)}
          onDelete={selectedIsDiy ? handleDelete : undefined}
          onShare={handleShare}
        />
      )}

      {showCraft && <CraftEditor onCraft={handleCraft} onClose={() => setShowCraft(false)} />}
    </div>
  );
}

// ─── Helper: finalize poster text + trigger download ───
function drawTextAndDownload(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, card: Card) {
  const textColor = card.isDIY ? '#22d3ee' : '#fff';

  // Card name
  ctx.fillStyle = textColor; ctx.font = 'bold 36px "Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center'; ctx.fillText(card.name, 300, 500);

  // Description
  ctx.fillStyle = '#94a3b8'; ctx.font = '18px "Microsoft YaHei",sans-serif';
  const desc = card.description.length > 28 ? card.description.slice(0, 28) + '...' : card.description;
  ctx.fillText(desc, 300, 545);

  // Mode + date
  ctx.fillStyle = '#64748b'; ctx.font = '16px "Microsoft YaHei",sans-serif';
  const modeLabel = card.mode === 'workplace' ? '👨‍💻 职场法器' : '🎓 学术法器';
  ctx.fillText(`${modeLabel}  ·  ${new Date().toLocaleDateString('zh-CN')}`, 300, 590);

  // Bottom tagline
  ctx.fillStyle = '#ec4899'; ctx.font = 'bold 20px "Microsoft YaHei",sans-serif';
  ctx.fillText('⚡ 赛博排毒 · 精神能量站', 300, 660);

  // Decorative line
  ctx.strokeStyle = 'rgba(168,85,247,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(100, 700); ctx.lineTo(500, 700); ctx.stroke();
  ctx.fillStyle = '#475569'; ctx.font = '14px "Microsoft YaHei",sans-serif';
  ctx.fillText('法器已封印至相册，快去分享给你的脆皮搭子吧！', 300, 735);

  // Badge
  if (card.isDIY) {
    const ugcW = 120, ugcH = 30;
    ctx.fillStyle = 'rgba(34,211,238,0.15)'; ctx.strokeStyle = 'rgba(34,211,238,0.5)';
    ctx.beginPath(); ctx.roundRect((600 - ugcW) / 2, 760, ugcW, ugcH, 15); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#22d3ee'; ctx.font = 'bold 14px "Microsoft YaHei",sans-serif';
    ctx.fillText('🎨 独创法器', 300, 782);
  }

  // Download
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${card.name}_赛博排毒.png`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
