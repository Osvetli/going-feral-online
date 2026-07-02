import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import PhysicsWorld from '../components/PhysicsWorld';
import { saveRun } from '../utils/api';

export default function PhysicsPage() {
  const navigate = useNavigate();
  const { mode, inputType, inputContent, drawLabel, setPhysicsPhase, setCurrentRunId, user } = useGameStore();

  if (!mode || !inputType || !inputContent) { navigate('/input'); return null; }

  const handlePhaseChange = (phase: string) => { setPhysicsPhase(phase as any); };

  const handleAllDestroyed = async () => {
    if (user) {
      try {
        const run = await saveRun({ mode, inputType, content: inputContent, drawLabel: drawLabel || undefined });
        setCurrentRunId(run.id);
      } catch (err) { console.error('Failed to save run:', err); }
    }
    setTimeout(() => { navigate('/gacha'); }, 600);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 w-full">
      <h2 className="text-2xl md:text-4xl font-extrabold text-pink-400 mb-2">💥 烦恼降维打击中...</h2>
      <p className="text-slate-400 text-base md:text-base mb-6">
        {mode === 'workplace' ? '打工人的烦恼正在高压锅中降维' : '学术的压力正在高压锅中降维'}
      </p>
      <div className="w-full flex justify-center">
        <PhysicsWorld
          inputType={inputType}
          inputContent={inputContent}
          drawLabel={drawLabel || undefined}
          onPhaseChange={handlePhaseChange}
          onAllDestroyed={handleAllDestroyed}
        />
      </div>
    </div>
  );
}
