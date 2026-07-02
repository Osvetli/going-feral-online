import { getRarityColor } from '../utils/gacha';
import type { Card, Rarity } from '../types';

const RARITY_NAMES: Record<Rarity, string> = {
  SSR: 'SSR · 至宝',
  SR: 'SR · 稀有',
  R: 'R · 精良',
  N: 'N · 普通',
};

interface CardDetailProps {
  card: Card;
  count: number;
  onClose: () => void;
}

export default function CardDetail({ card, count, onClose }: CardDetailProps) {
  const color = getRarityColor(card.rarity);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-8 max-w-sm w-full text-center border-2 bg-gradient-to-b from-slate-900 to-indigo-950"
        style={{ borderColor: color }}
        onClick={(e) => e.stopPropagation()}
      >
        {card.isDIY && card.imageData ? (
          <img src={card.imageData} alt={card.name}
            className="w-48 h-48 object-contain rounded-xl mb-4 mx-auto border-2 border-purple-500/30"
          />
        ) : (
          <div className="text-7xl mb-4">{card.emoji}</div>
        )}
        <div
          className="text-base font-bold mb-1 px-3 py-1 rounded border inline-block"
          style={{ color, borderColor: color }}
        >
          {RARITY_NAMES[card.rarity]}
        </div>
        <h3 className={`text-2xl font-bold mt-2 rarity-text-${card.rarity}`}>
          {card.name}
        </h3>
        <p className="text-slate-400 text-base mt-3 leading-relaxed">{card.description}</p>

        <div className="flex gap-3 mt-4 text-base text-slate-400 justify-center">
          <span>模式：{card.mode === 'workplace' ? '👨‍💻 打工人' : '🎓 学术'}</span>
          <span>持有：{count} 张</span>
        </div>

        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 rounded-lg bg-neon-purple/20 text-neon-purple border border-neon-purple/40
                     hover:bg-neon-purple/30 transition-colors cursor-pointer"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
