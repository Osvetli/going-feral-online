import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getShare } from '../utils/api';
import type { ShareData } from '../types';

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try { setData(await getShare(id)); }
      catch { setError('分享不存在或已过期'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-neon-cyan text-lg animate-pulse">加载中...</p></div>;
  if (error||!data) return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="text-6xl mb-4">😢</div>
      <p className="text-red-400 text-lg">{error||'分享不存在'}</p>
      <Link to="/" className="mt-4 text-neon-cyan hover:underline text-lg">返回首页</Link>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="rounded-2xl border border-purple-500/30 glow-purple bg-gradient-to-b from-slate-900/90 to-indigo-950/80 p-8 md:p-10 w-full max-w-lg text-center">
        <div className="text-5xl md:text-6xl mb-4">🔮</div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-neon-cyan mb-2">一份赛博精神能量</h2>
        {data.user && <p className="text-slate-400 text-base mb-4"><span className="text-purple-300 font-bold">{data.user.nickname}</span> 在赛博排毒中获得了功德</p>}

        {data.run && (
          <div className="bg-slate-950/80 rounded-xl p-5 mb-4 text-left">
            <p className="text-base text-slate-500 mb-2">
              {data.run.mode==='workplace'?'👨‍💻 精神打工人':'🎓 学术排毒者'} · {data.run.inputType==='text'?'文字排毒':'手绘排毒'}
            </p>
            {data.run.inputType==='text'
              ? <p className="text-base text-white whitespace-pre-wrap">{data.run.content}</p>
              : <div className="flex flex-col items-center gap-2">
                  <img src={data.run.content} alt={data.run.drawLabel||'涂鸦'} className="max-w-full rounded-lg border border-purple-500/30" style={{maxHeight:300}} />
                  {data.run.drawLabel && <p className="text-base text-slate-400">{data.run.drawLabel}</p>}
                </div>
            }
          </div>
        )}

        {data.card && (
          <div className={`bg-slate-950/80 rounded-xl p-5 border-2 rarity-${data.card.rarity}`}>
            <p className="text-base text-slate-500 mb-1">🎴 获得的法器</p>
            <div className="text-4xl mb-2">{data.card.emoji}</div>
            <p className={`text-base font-bold rarity-text-${data.card.rarity}`}>{data.card.rarity} · {data.card.name}</p>
            <p className="text-base text-slate-400 mt-1">{data.card.description}</p>
          </div>
        )}

        <p className="text-slate-600 text-base mt-4">{data.share&&new Date(data.share.createdAt).toLocaleString('zh-CN')}</p>
      </div>

      <Link to="/" className="mt-8 px-8 py-4 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40
                               text-lg font-bold hover:bg-purple-600/30 transition-all no-underline glow-purple">
        🔮 我也要来排毒
      </Link>
    </div>
  );
}
