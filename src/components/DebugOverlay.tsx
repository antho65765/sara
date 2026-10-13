import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Zap, X } from 'lucide-react';

interface DebugOverlayProps {
  onClose?: () => void;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ onClose }) => {
  const [fps, setFps] = useState(60);
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let animationFrameId: number;

    const measureFps = (now: number) => {
      frames++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      setFrameCount((prev) => prev + 1);
      animationFrameId = requestAnimationFrame(measureFps);
    };

    animationFrameId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const memory = (performance as any).memory
    ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
    : null;

  return (
    <div className="fixed top-16 right-4 z-50 bg-slate-950/90 border border-cyan-500/60 text-cyan-300 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md font-mono text-[11px] flex items-center gap-3 animate-in fade-in duration-200">
      <div className="flex items-center gap-1.5 text-cyan-400">
        <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
        <span className="font-bold">{fps} FPS</span>
      </div>
      <div className="w-px h-3 bg-slate-800" />
      <div className="flex items-center gap-1 text-slate-300">
        <Cpu className="w-3 h-3 text-indigo-400" />
        <span>{memory ? `${memory} MB` : 'Heap OK'}</span>
      </div>
      <div className="w-px h-3 bg-slate-800" />
      <div className="flex items-center gap-1 text-slate-400">
        <Zap className="w-3 h-3 text-amber-400" />
        <span>Frames: {frameCount}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
          title="Cerrar overlay"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
