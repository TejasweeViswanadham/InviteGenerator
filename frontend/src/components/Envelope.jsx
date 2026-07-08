import { useState } from "react";

/**
 * Envelope component wraps children (the invite card) and shows a decorative
 * envelope with a flap. Clicking the envelope opens the flap and reveals
 * the invite with a smooth animation.
 *
 * Styles: 'classic' (paper), 'indian' (gold + red shubh vivah), 'modern' (mono).
 */
export default function Envelope({ style = "classic", children }) {
  const [open, setOpen] = useState(false);

  const palette = {
    classic: {
      body: "#F1E9DB",
      flap: "#E4D6BC",
      accent: "#8A6D3B",
      seal: "#A03E3E",
      label: "Open the envelope",
    },
    indian: {
      body: "#8B0F1A",
      flap: "#6E0812",
      accent: "#E7C77D",
      seal: "#E7C77D",
      label: "श्री गणेशाय नमः",
    },
    modern: {
      body: "#1A1A1A",
      flap: "#0F0F10",
      accent: "#D97757",
      seal: "#D97757",
      label: "Tap to open",
    },
  }[style] || {
    body: "#F1E9DB",
    flap: "#E4D6BC",
    accent: "#8A6D3B",
    seal: "#A03E3E",
    label: "Open the envelope",
  };

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: 720, maxWidth: "100%", perspective: 1600 }}
      data-testid="envelope"
    >
      {/* Envelope stage — sized slightly larger than invite */}
      <div
        className="relative"
        style={{
          width: 700,
          height: 900,
          maxWidth: "100%",
        }}
      >
        {/* Envelope body (behind invite) */}
        <div
          className="absolute inset-0 rounded-md shadow-2xl"
          style={{
            background: palette.body,
            transform: open ? "translateY(0) scale(1)" : "translateY(0) scale(1)",
            transition: "transform 0.6s ease",
          }}
        />
        {/* Decorative diagonals */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox="0 0 700 900"
          preserveAspectRatio="none"
        >
          <path
            d="M0 130 L350 550 L700 130"
            fill="none"
            stroke={palette.accent}
            strokeOpacity="0.35"
            strokeWidth="2"
          />
          <path d="M0 800 L350 550 L700 800" fill="none" stroke={palette.accent} strokeOpacity="0.15" strokeWidth="2" />
        </svg>

        {/* Invite content — rises out when opened */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            transform: open
              ? "translate(-50%, -60%) scale(1)"
              : "translate(-50%, -30%) scale(0.95)",
            opacity: open ? 1 : 0.85,
            transition: "transform 0.9s cubic-bezier(0.2, 0.9, 0.2, 1) 0.15s, opacity 0.4s ease",
            filter: open ? "none" : "brightness(0.9)",
          }}
        >
          {children}
        </div>

        {/* Top flap */}
        <div
          className="absolute left-0 top-0 origin-top"
          style={{
            width: "100%",
            height: "50%",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            background: palette.flap,
            transform: open ? "rotateX(180deg) translateY(-2px)" : "rotateX(0deg)",
            transformOrigin: "top",
            transition: "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: open ? "none" : "inset 0 -20px 40px rgba(0,0,0,0.15)",
            zIndex: open ? 1 : 20,
          }}
        />

        {/* Wax seal — visible when closed */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 hover-lift smooth"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 30%, ${palette.seal}, ${palette.seal} 45%, rgba(0,0,0,0.4))`,
              border: `2px solid ${palette.accent}`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              zIndex: 30,
              color: palette.accent,
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              cursor: "pointer",
              letterSpacing: "0.15em",
            }}
            data-testid="envelope-open-btn"
            aria-label={palette.label}
          >
            ✧
          </button>
        )}

        {/* Label under seal */}
        {!open && (
          <div
            className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none"
            style={{
              bottom: 40,
              color: palette.accent,
              letterSpacing: "0.32em",
              fontSize: 11,
              textTransform: "uppercase",
              zIndex: 25,
            }}
          >
            {palette.label}
          </div>
        )}
      </div>
    </div>
  );
}
