
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  targetX: number;
  targetY: number;
  color: string;
}

export const ParticleLoader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let opacity = 1;
    let phase = 'gathering'; // gathering -> holding -> dispersing

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Init Particles
    const particleCount = window.innerWidth < 600 ? 60 : 120; // Optimization for mobile
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 100; // Start radius
      
      particles.push({
        x: centerX + Math.cos(angle) * (window.innerWidth / 1.5),
        y: centerY + Math.sin(angle) * (window.innerHeight / 1.5),
        vx: 0,
        vy: 0,
        size: Math.random() * 3 + 1,
        alpha: 0,
        targetX: centerX + Math.cos(angle) * radius * 0.5, // Tight cluster
        targetY: centerY + Math.sin(angle) * radius * 0.5,
        color: Math.random() > 0.5 ? '#818cf8' : '#c084fc' // Indigo / Purple
      });
    }

    const startTime = Date.now();

    const draw = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      // Background clear with trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Phase Management
      if (elapsed > 2000 && phase === 'gathering') phase = 'dispersing';
      
      if (phase === 'dispersing') {
        opacity -= 0.03;
        if (opacity <= 0) {
          onComplete();
          return; // Stop animation
        }
      }

      particles.forEach(p => {
        // Physics
        if (phase === 'gathering') {
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          p.vx += dx * 0.002; // Spring force
          p.vy += dy * 0.002;
          p.vx *= 0.92; // Friction
          p.vy *= 0.92;
          p.alpha = Math.min(p.alpha + 0.02, 1);
        } else {
          // Explosion
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          p.vx += (dx / dist) * 0.5;
          p.vy += (dy / dist) * 0.5;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * opacity;
        ctx.fill();
        
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[999] bg-black pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-10 left-0 right-0 text-center opacity-40">
         <p className="text-xs font-light text-white tracking-[0.3em] uppercase animate-pulse">Loading OS.26</p>
      </div>
    </div>
  );
};
