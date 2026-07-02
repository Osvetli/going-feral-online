import { useState, useEffect, type ReactNode } from 'react';
import { useGameStore } from '../store/gameStore';
import { registerUser, loginUser, unregisterUser, getMe } from '../utils/api';

export default function LoginGate({ children }: { children: ReactNode }) {
  const { user, setUser } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('crazy_user_id');
    const nick = localStorage.getItem('crazy_nickname');
    if (id && nick) {
      getMe().then(u => {
        if (u) setUser(u);
        else { localStorage.removeItem('crazy_user_id'); localStorage.removeItem('crazy_nickname'); }
      }).catch(() => setUser({ id, nickname: nick }))
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, [setUser]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-neon-cyan text-xl animate-pulse">加载中...</p></div>;

  if (!user) return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="rounded-2xl border border-purple-500/30 glow-purple bg-gradient-to-b from-slate-900/90 to-indigo-950/80 p-8 md:p-10 w-full max-w-md text-center">
        <div className="text-6xl md:text-7xl mb-4">🔮</div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-neon-cyan mb-2">身份登记</h2>
        <p className="text-amber-400/80 text-sm mb-1">🔒 封印未解除！</p>
        <p className="text-slate-400 mb-6 text-base">请先登录/注册账号以开启您的精神图鉴与熔炼法器</p>
        <AuthForm onSuccess={(u) => { setUser(u); setShowModal(false); }} />
      </div>
    </div>
  );

  return (
    <>
      {children}
      {/* Auth modal triggered from NavBar */}
      {showModal && <AuthModal user={user} onClose={() => setShowModal(false)} />}
    </>
  );
}

// ═══ Exported hook for NavBar to open the modal ═══
// We use a simple global event approach since the modal lives inside LoginGate
let _openAuthModal: (() => void) | null = null;
export function openAuthModal() { _openAuthModal?.(); }

// ═══ Inline Auth Form (register/login toggle) ═══
function AuthForm({ onSuccess }: { onSuccess: (u: any) => void }) {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!nickname.trim()) { setError('请输入代号'); return; }
    if (!password || password.length < 4) { setError('密码至少 4 位'); return; }
    setError(''); setSubmitting(true);
    try {
      if (tab === 'register') {
        onSuccess(await registerUser(nickname.trim(), password));
      } else {
        onSuccess(await loginUser(nickname.trim(), password));
      }
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <button onClick={() => { setTab('register'); setError(''); }}
          className={`flex-1 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer
                      ${tab === 'register' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          注册
        </button>
        <button onClick={() => { setTab('login'); setError(''); }}
          className={`flex-1 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer
                      ${tab === 'login' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          登录
        </button>
      </div>
      <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="输入你的代号..." maxLength={20}
        className="w-full px-5 py-4 rounded-xl bg-slate-950/80 border border-purple-500/30 text-white placeholder-slate-500
                   text-lg text-center focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all mb-3" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="输入密码（至少4位）" maxLength={50}
        className="w-full px-5 py-4 rounded-xl bg-slate-950/80 border border-purple-500/30 text-white placeholder-slate-500
                   text-lg text-center focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all mb-3" />
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
      <button onClick={handleSubmit} disabled={submitting}
        className="w-full py-4 rounded-xl text-lg font-extrabold text-white
                   bg-gradient-to-r from-purple-600 to-pink-500
                   hover:opacity-90 transition-opacity cursor-pointer
                   shadow-[0_0_25px_rgba(168,85,247,0.5)] disabled:opacity-50">
        {submitting ? '处理中...' : tab === 'register' ? '🔮 进入排毒工坊' : '🔮 登录'}
      </button>
    </div>
  );
}

// ═══ Auth Modal (for logged-in users) ═══
function AuthModal({ user, onClose }: { user: any; onClose: () => void }) {
  const { setUser } = useGameStore();
  const [tab, setTab] = useState<'info' | 'delete'>('info');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('crazy_user_id');
    localStorage.removeItem('crazy_nickname');
    setUser(null);
    onClose();
  };

  const handleDelete = async () => {
    if (!password) { setError('请输入密码以确认注销'); return; }
    setError(''); setSubmitting(true);
    try {
      await unregisterUser(password);
      localStorage.clear();
      setUser(null);
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="rounded-2xl p-8 max-w-md w-full text-center border-2 border-purple-500/40
                      bg-gradient-to-b from-slate-900 to-indigo-950 shadow-[0_0_40px_rgba(168,85,247,0.4)]"
        onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-3">🔮</div>
        <h2 className="text-xl font-extrabold text-neon-cyan mb-1">{user.nickname}</h2>
        <p className="text-slate-500 text-sm mb-5">精神能量站 · 已登录</p>

        {tab === 'info' ? (
          <div className="flex flex-col gap-2">
            <button onClick={handleLogout}
              className="w-full py-3 rounded-xl text-base font-bold text-amber-400
                         bg-amber-400/10 border border-amber-400/30
                         hover:bg-amber-400/20 transition-colors cursor-pointer">
              🚪 退出登录
            </button>
            <button onClick={() => setTab('delete')}
              className="w-full py-3 rounded-xl text-base font-bold text-red-400
                         bg-red-400/10 border border-red-400/30
                         hover:bg-red-400/20 transition-colors cursor-pointer">
              💀 注销账户
            </button>
            <button onClick={onClose}
              className="w-full py-3 rounded-xl text-base text-slate-400
                         bg-slate-800/50 border border-slate-700/30
                         hover:bg-slate-700/50 transition-colors cursor-pointer mt-2">
              关闭
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-red-400 text-sm leading-relaxed">
              ⚠️ 注销后，您辛苦收集的官方卡牌、所有的手绘法器以及精神能量都将<b>灰飞烟灭</b>，确定要离开吗？
            </p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="输入密码确认注销" maxLength={50}
              onKeyDown={e => e.key === 'Enter' && handleDelete()}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-red-500/30 text-white
                         placeholder-slate-500 text-base text-center
                         focus:outline-none focus:border-red-400 transition-all" />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handleDelete} disabled={submitting}
              className="w-full py-3 rounded-xl text-base font-extrabold text-white
                         bg-red-600 hover:bg-red-700 transition-colors cursor-pointer
                         disabled:opacity-50">
              {submitting ? '注销中...' : '确认注销，永别了 👋'}
            </button>
            <button onClick={() => { setTab('info'); setError(''); setPassword(''); }}
              className="w-full py-3 rounded-xl text-base text-slate-400
                         bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer">
              我再想想
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
