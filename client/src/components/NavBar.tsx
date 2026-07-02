import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { unregisterUser } from '../utils/api';

export default function NavBar() {
  const { pathname } = useLocation();
  const { mode, user, setUser } = useGameStore();
  const [showAuth, setShowAuth] = useState(false);
  const [delTab, setDelTab] = useState(false);
  const [delPassword, setDelPassword] = useState('');
  const [delError, setDelError] = useState('');
  const [delSubmitting, setDelSubmitting] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('crazy_user_id');
    localStorage.removeItem('crazy_nickname');
    setUser(null);
    setShowAuth(false);
  };

  const handleDelete = async () => {
    if (!delPassword) { setDelError('请输入密码以确认注销'); return; }
    setDelError(''); setDelSubmitting(true);
    try {
      await unregisterUser(delPassword);
      localStorage.clear();
      setUser(null);
      setShowAuth(false);
    } catch (e: any) { setDelError(e.message); }
    finally { setDelSubmitting(false); }
  };

  return (
    <>
      <nav className="w-full px-4 md:px-12 py-4 flex items-center justify-between
                      bg-gradient-to-r from-slate-950/90 via-indigo-950/80 to-slate-950/90
                      backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-40">
        <Link to="/" className="text-xl md:text-2xl font-extrabold
                                 hover:scale-105 transition-transform no-underline tracking-tight">
          <span className="inline-block">🔮</span>{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
            赛博排毒
          </span>
        </Link>

        <div className="flex items-center gap-4 md:gap-10">
          <NavLink to="/" current={pathname} label="🏠 首页" />
          <NavLink to="/collection" current={pathname} label="📚 图鉴" guest={!user} />

          {mode && (
            <span className="text-sm px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300
                             border border-purple-500/30 whitespace-nowrap hidden sm:inline">
              {mode === 'workplace' ? '👨‍💻 打工人' : '🎓 学术'}
            </span>
          )}

          {/* User button */}
          {user ? (
            <button onClick={() => { setShowAuth(true); setDelTab(false); setDelPassword(''); setDelError(''); }}
              className="w-9 h-9 rounded-full flex items-center justify-center
                         bg-gradient-to-br from-purple-500/30 to-cyan-500/30
                         border border-purple-400/40 text-lg
                         hover:scale-110 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]
                         transition-all cursor-pointer shrink-0"
              title={user.nickname}>
              🧙
            </button>
          ) : (
            <Link to="/collection"
              className="text-sm px-3 py-1.5 rounded-full bg-purple-500/15 text-purple-300
                         border border-purple-500/30 hover:border-neon-cyan hover:text-neon-cyan
                         transition-all cursor-pointer no-underline whitespace-nowrap">
              🔓 登录
            </Link>
          )}
        </div>
      </nav>

      {/* Auth modal for logged-in users */}
      {showAuth && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowAuth(false)}>
          <div className="rounded-2xl p-8 max-w-md w-full text-center border-2 border-purple-500/40
                          bg-gradient-to-b from-slate-900 to-indigo-950 shadow-[0_0_40px_rgba(168,85,247,0.4)]"
            onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">🧙</div>
            <h2 className="text-xl font-extrabold text-neon-cyan mb-1">{user.nickname}</h2>
            <p className="text-slate-500 text-sm mb-5">精神能量站 · 已登录</p>

            {!delTab ? (
              <div className="flex flex-col gap-2">
                <button onClick={handleLogout}
                  className="w-full py-3 rounded-xl text-base font-bold text-amber-400
                             bg-amber-400/10 border border-amber-400/30
                             hover:bg-amber-400/20 transition-colors cursor-pointer">
                  🚪 退出登录
                </button>
                <button onClick={() => { setDelTab(true); setDelPassword(''); setDelError(''); }}
                  className="w-full py-3 rounded-xl text-base font-bold text-red-400
                             bg-red-400/10 border border-red-400/30
                             hover:bg-red-400/20 transition-colors cursor-pointer">
                  💀 注销账户
                </button>
                <button onClick={() => setShowAuth(false)}
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
                <input type="password" value={delPassword} onChange={e => setDelPassword(e.target.value)}
                  placeholder="输入密码确认注销" maxLength={50}
                  onKeyDown={e => e.key === 'Enter' && handleDelete()}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-red-500/30 text-white
                             placeholder-slate-500 text-base text-center
                             focus:outline-none focus:border-red-400 transition-all" />
                {delError && <p className="text-red-400 text-sm">{delError}</p>}
                <button onClick={handleDelete} disabled={delSubmitting}
                  className="w-full py-3 rounded-xl text-base font-extrabold text-white
                             bg-red-600 hover:bg-red-700 transition-colors cursor-pointer
                             disabled:opacity-50">
                  {delSubmitting ? '注销中...' : '确认注销，永别了 👋'}
                </button>
                <button onClick={() => { setDelTab(false); setDelError(''); }}
                  className="w-full py-3 rounded-xl text-base text-slate-400
                             bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer">
                  我再想想
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ to, current, label, guest }: { to: string; current: string; label: string; guest?: boolean }) {
  const active = current === to;
  return (
    <Link to={to}
      className={`text-base md:text-lg font-bold transition-all duration-200 no-underline relative
                  ${active
                    ? 'text-purple-300 after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[3px] after:bg-purple-500 after:rounded-full after:shadow-[0_0_10px_rgba(168,85,247,0.6)]'
                    : guest
                      ? 'text-slate-500 hover:text-neon-cyan'
                      : 'text-slate-400 hover:text-neon-cyan'}`}>
      {label}
    </Link>
  );
}
