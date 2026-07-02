import { useRef, useState, useEffect, useCallback } from 'react';

interface CanvasDrawProps {
  onDraw: (dataUrl: string) => void;
}

const MIN_SIZE = 260;
const MAX_SIZE = 500;
const ASPECT = 0.56; // shorter canvas to avoid page scroll
const PEN_SIZE = 5;

export default function CanvasDraw({ onDraw }: CanvasDrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [hasContent, setHasContent] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 500, h: 380 });

  const presetColors = [
    { value: '#ffffff', label: '白' },
    { value: '#ff2d95', label: '暴躁红' },
    { value: '#00f0ff', label: '学术蓝' },
    { value: '#22c55e', label: '原谅绿' },
    { value: '#fbbf24', label: '能量金' },
  ];

  // Responsive resize
  useEffect(() => {
    const resize = () => {
      if (!wrapperRef.current) return;
      const w = wrapperRef.current.clientWidth;
      const size = Math.max(MIN_SIZE, Math.min(w, MAX_SIZE));
      const h = Math.round(size * ASPECT);
      setCanvasSize({ w: size, h });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Init canvas — transparent background, CSS provides visual surface
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [canvasSize]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = PEN_SIZE;
    setIsDrawing(true);
    setHasContent(true);
  }, [color, getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasContent) onDraw(canvas.toDataURL('image/png'));
  }, [hasContent, onDraw]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
    setHasContent(false);
    onDraw('');
  }, [onDraw, canvasSize]);

  return (
    <div className="flex flex-col items-center gap-3 w-full" ref={wrapperRef}>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {/* Native color picker */}
        <label className="relative cursor-pointer" title="无级调色盘">
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-10 h-10 rounded-full border-2 border-white cursor-pointer
                       shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all hover:scale-110"
          />
        </label>
        {/* Preset swatches */}
        {presetColors.map(c => (
          <button
            key={c.value}
            onClick={() => setColor(c.value)}
            className={`w-10 h-10 rounded-full border-2 transition-all cursor-pointer
                        ${color === c.value ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}
      </div>

      <div className="rounded-xl overflow-hidden border-2 border-purple-500/40 glow-purple">
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="cursor-crosshair block max-w-full"
          style={{ touchAction: 'none', background: 'rgba(15,7,32,0.85)' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>

      <button
        onClick={clearCanvas}
        className="px-5 py-2 rounded-lg border border-red-400/40 text-red-400
                   hover:bg-red-400/10 transition-colors cursor-pointer text-base"
      >
        🗑️ 清空
      </button>
    </div>
  );
}
