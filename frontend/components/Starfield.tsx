"use client";

import { useEffect, useRef } from "react";

export function Starfield({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const stars: { x: number; y: number; r: number; a: number; s: number }[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.scale(dpr, dpr);
      stars.length = 0;
      const count = Math.floor((w * h) / 9000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.2 + 0.2,
          a: Math.random() * 0.5 + 0.15,
          s: Math.random() * 0.02 + 0.005,
        });
      }
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        st.a += (Math.random() - 0.5) * 0.01;
        st.a = Math.min(0.75, Math.max(0.08, st.a));
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${st.a})`;
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
        st.y += st.s;
        if (st.y > h) st.y = 0;
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
