"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

const COLORS = [
  "#a78bfa", // purple
  "#f97316", // orange
  "#3b82f6", // blue
  "#22c55e", // green
  "#eab308", // yellow
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
];

interface Props {
  active: boolean;
  x?: number;
  y?: number;
}

export function Confetti({ active, x = 0.5, y = 0.3 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);

  const spawn = useCallback(() => {
    const particles: Particle[] = [];
    const count = 60;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width * x;
    const cy = canvas.height * y;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const maxLife = 40 + Math.random() * 60;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 6,
        life: maxLife,
        maxLife,
      });
    }
    particlesRef.current = particles;
  }, [x, y]);

  useEffect(() => {
    if (!active) {
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    spawn();

    let animating = true;
    function animate() {
      if (!animating) return;
      ctx!.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      let alive = false;

      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.life--;
        p.vy += 0.12; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;

        const alpha = p.life / p.maxLife;
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = p.color;
        ctx!.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx!.restore();
      }

      if (alive) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      animating = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [active, spawn]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden="true"
    />
  );
}
