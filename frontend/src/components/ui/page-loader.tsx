"use client";

import { useState, useEffect } from "react";

export function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("hold"), 600);
    const exitTimer = setTimeout(() => setPhase("exit"), 1800);
    const hideTimer = setTimeout(() => setVisible(false), 2400);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-up {
          0% { transform: translateY(30px) scale(0.9); opacity: 0; }
          60% { transform: translateY(-5px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.2), 0 0 60px rgba(99,102,241,0.3); }
          50% { box-shadow: 0 0 40px rgba(255,255,255,0.4), 0 0 80px rgba(99,102,241,0.5); }
        }
        @keyframes ring-expand {
          0% { transform: scale(0.6); opacity: 0.8; border-width: 3px; }
          100% { transform: scale(2.2); opacity: 0; border-width: 1px; }
        }
        @keyframes ring-expand-2 {
          0% { transform: scale(0.6); opacity: 0.5; border-width: 2px; }
          100% { transform: scale(2.8); opacity: 0; border-width: 0.5px; }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes progress-fill {
          0% { width: 0%; }
          20% { width: 30%; }
          60% { width: 70%; }
          90% { width: 95%; }
          100% { width: 100%; }
        }
        @keyframes text-reveal {
          0% { clip-path: inset(0 100% 0 0); opacity: 0; }
          100% { clip-path: inset(0 0% 0 0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes particle-float {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
          50% { opacity: 1; }
          100% { transform: translateY(-80px) translateX(var(--tx)) scale(0); opacity: 0; }
        }
        @keyframes checkmark-draw {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes loader-bounce {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }

        .loader-bg {
          background: linear-gradient(-45deg, #4f46e5, #7c3aed, #6366f1, #8b5cf6, #4f46e5);
          background-size: 400% 400%;
          animation: gradient-shift 3s ease infinite;
        }
        .loader-float { animation: float-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .loader-glow { animation: glow-pulse 2s ease-in-out infinite; }
        .loader-ring-1 { animation: ring-expand 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
        .loader-ring-2 { animation: ring-expand-2 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) 0.3s infinite; }
        .loader-spin { animation: spin-slow 8s linear infinite; }
        .loader-progress { animation: progress-fill 2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .loader-text-reveal { animation: text-reveal 0.6s ease-out forwards; }
        .loader-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.8);
          animation: particle-float 1.5s ease-out infinite;
        }
        .checkmark-path {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: checkmark-draw 0.4s ease-out 2s forwards;
        }
        .exit-fade {
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          transform: scale(1.05);
        }
      ` }} />

      <div
        className={`fixed inset-0 z-[9999] loader-bg flex flex-col items-center justify-center overflow-hidden transition-all duration-600 ${
          phase === "exit" ? "exit-fade" : ""
        }`}
      >
        {/* Decorative background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 h-40 w-40 rounded-full bg-indigo-400/5 blur-2xl" />
        </div>

        {/* Spinning dotted ring */}
        <div className="absolute loader-spin pointer-events-none">
          <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
            <circle cx="140" cy="140" r="130" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle cx="140" cy="10" r="3" fill="rgba(255,255,255,0.5)" />
            <circle cx="270" cy="140" r="2.5" fill="rgba(255,255,255,0.35)" />
            <circle cx="140" cy="270" r="2" fill="rgba(255,255,255,0.25)" />
            <circle cx="10" cy="140" r="2.5" fill="rgba(255,255,255,0.4)" />
          </svg>
        </div>

        <div className="relative flex flex-col items-center gap-8 loader-float">
          {/* Logo with expanding rings */}
          <div className="relative">
            <div className="absolute inset-[-20px] rounded-full border-2 border-white/30 loader-ring-1" />
            <div className="absolute inset-[-20px] rounded-full border border-white/20 loader-ring-2" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.25rem] bg-white/95 loader-glow backdrop-blur-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="ApnaKit"
                className="h-14 w-auto"
                draggable={false}
              />
            </div>
          </div>

          {/* Brand text with staggered reveal */}
          <div className="flex flex-col items-center gap-3">
            <h1
              className="text-3xl font-extrabold text-white tracking-tight loader-text-reveal"
              style={{ animationDelay: "0.3s", opacity: 0 }}
            >
              ApnaKit
            </h1>
            <p
              className="text-sm font-medium text-indigo-100/80 tracking-wide loader-text-reveal"
              style={{ animationDelay: "0.5s", opacity: 0 }}
            >
              Your One-Stop Shopping Destination
            </p>
          </div>

          {/* Progress bar with shimmer */}
          <div
            className="w-48 loader-text-reveal"
            style={{ animationDelay: "0.7s", opacity: 0 }}
          >
            <div className="h-1 w-full rounded-full bg-white/15 overflow-hidden">
              <div className="h-full rounded-full bg-white/80 loader-progress relative">
                <div className="absolute inset-0 loader-shimmer" />
              </div>
            </div>
          </div>

          {/* Animated dots */}
          <div className="flex gap-2 loader-text-reveal" style={{ animationDelay: "0.9s", opacity: 0 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-white/70"
                style={{
                  animation: "loader-bounce 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${15 + i * 10}%`,
                bottom: "10%",
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${1.5 + Math.random() * 1}s`,
                "--tx": `${(Math.random() - 0.5) * 60}px`,
                width: `${3 + Math.random() * 3}px`,
                height: `${3 + Math.random() * 3}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </>
  );
}
