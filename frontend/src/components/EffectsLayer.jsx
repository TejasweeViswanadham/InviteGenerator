import { useMemo } from "react";

/**
 * Renders floating animated particles based on selected effects.
 * effects: ["petals", "flowers", "confetti", "sparkles", "bells"]
 */
export default function EffectsLayer({ effects = [] }) {
  const particles = useMemo(() => {
    const list = [];
    effects.forEach((eff) => {
      const cfg = PARTICLE_CONFIG[eff];
      if (!cfg) return;
      const count = cfg.count || 18;
      for (let i = 0; i < count; i++) {
        list.push({
          key: `${eff}-${i}`,
          left: Math.random() * 100,
          delay: Math.random() * cfg.duration,
          duration: cfg.duration + Math.random() * 4,
          size: cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize),
          rotate: Math.random() * 360,
          symbol: cfg.symbol,
          color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
          drift: (Math.random() - 0.5) * 60,
          type: cfg.type,
        });
      }
    });
    return list;
  }, [effects]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" data-testid="effects-layer">
      <style>{`
        @keyframes ic-fall {
          0% { transform: translate3d(var(--drift-start,0), -10vh, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate3d(var(--drift-end, 0), 110vh, 0) rotate(360deg); opacity: 0; }
        }
        @keyframes ic-sparkle {
          0%, 100% { opacity: 0.2; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>
      {particles.map((p) => (
        <span
          key={p.key}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: 0,
            fontSize: p.size,
            color: p.color,
            animation:
              p.type === "sparkle"
                ? `ic-sparkle ${p.duration}s ease-in-out ${p.delay}s infinite`
                : `ic-fall ${p.duration}s linear ${p.delay}s infinite`,
            ["--drift-start"]: "0px",
            ["--drift-end"]: `${p.drift}px`,
            textShadow: p.type === "sparkle" ? `0 0 8px ${p.color}` : "none",
            filter: p.type === "confetti" ? "saturate(1.2)" : "none",
            userSelect: "none",
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
}

const PARTICLE_CONFIG = {
  petals: {
    count: 20,
    duration: 12,
    minSize: 14,
    maxSize: 28,
    symbol: "❁",
    colors: ["#E7A5A5", "#D97757", "#C89F59", "#A03E3E"],
    type: "fall",
  },
  flowers: {
    count: 18,
    duration: 14,
    minSize: 18,
    maxSize: 30,
    symbol: "✿",
    colors: ["#E7A5A5", "#F1B7A6", "#C89F59", "#A03E3E", "#8A6D3B"],
    type: "fall",
  },
  confetti: {
    count: 45,
    duration: 6,
    minSize: 10,
    maxSize: 16,
    symbol: "▮",
    colors: ["#D97757", "#C89F59", "#4A6741", "#5B4A8C", "#2C5F5D", "#A03E3E"],
    type: "confetti",
  },
  sparkles: {
    count: 40,
    duration: 3,
    minSize: 12,
    maxSize: 22,
    symbol: "✦",
    colors: ["#E7C77D", "#F1E9DB", "#C89F59"],
    type: "sparkle",
  },
  bells: {
    count: 12,
    duration: 10,
    minSize: 22,
    maxSize: 34,
    symbol: "🔔",
    colors: ["#C89F59", "#E7C77D"],
    type: "fall",
  },
};
