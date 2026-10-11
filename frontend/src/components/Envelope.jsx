import { useEffect, useState } from "react";

/**
 * Envelope that hides the invitation card until the guest taps the seal.
 *
 *   closed  → only the envelope (back, front pocket, flap, wax seal) is visible
 *   opening → the flap swings open and the card slides up out of the envelope
 *   open    → the envelope fades away, leaving the full card
 *
 * Laid out on a fixed 720x900 stage (the parent ScaledBox shrinks it on phones);
 * the card is the usual 600x800 InviteCanvas.
 *
 * Styles: 'classic' (paper), 'indian' (gold + red shubh vivah), 'modern' (mono).
 */
const PALETTES = {
  classic: { body: "#F1E9DB", pocket: "#EADFC9", flap: "#E4D6BC", accent: "#8A6D3B", seal: "#A03E3E", label: "Open the envelope" },
  indian: { body: "#7E0D18", pocket: "#8B0F1A", flap: "#6E0812", accent: "#E7C77D", seal: "#C9A24A", label: "श्री गणेशाय नमः · Tap to open" },
  modern: { body: "#202022", pocket: "#1A1A1A", flap: "#0F0F10", accent: "#D97757", seal: "#D97757", label: "Tap to open" },
};

const STAGE_W = 720;
const STAGE_H = 900;
const ENV_W = 680;
const ENV_H = 460;
const ENV_LEFT = (STAGE_W - ENV_W) / 2;
const ENV_TOP = 300; // envelope sits in the lower part of the stage
const CARD_LEFT = (STAGE_W - 600) / 2;
const CARD_TOP = (STAGE_H - 800) / 2;

export default function Envelope({ style = "classic", children }) {
  const p = PALETTES[style] || PALETTES.classic;
  const [phase, setPhase] = useState("closed"); // closed | opening | fading | open

  // opening: flap swings up and the card slides out (1.6s)
  // fading:  envelope fades away behind the card (0.6s)
  // open:    envelope removed; only the card remains
  useEffect(() => {
    const next = { opening: ["fading", 1600], fading: ["open", 600] }[phase];
    if (!next) return undefined;
    const t = setTimeout(() => setPhase(next[0]), next[1]);
    return () => clearTimeout(t);
  }, [phase]);

  const closed = phase === "closed";
  const opened = phase === "open";
  const out = phase === "fading" || opened; // card fully out of the envelope

  // Card: starts tucked inside the envelope (invisible), rises to its final spot.
  const cardStyle = closed
    ? { transform: `translate(0, ${ENV_TOP + 40 - CARD_TOP}px) scale(0.78)`, opacity: 0 }
    : { transform: "translate(0, 0) scale(1)", opacity: 1 };

  return (
    <div className="relative mx-auto" style={{ width: STAGE_W, height: STAGE_H, perspective: 1600 }} data-testid="envelope">
      {!opened && (
      <>
      {/* Envelope back (behind the card) */}
      <div
        className="absolute rounded-md"
        style={{
          left: ENV_LEFT, top: ENV_TOP, width: ENV_W, height: ENV_H, background: p.body,
          boxShadow: "0 30px 60px rgba(0,0,0,0.28)",
          opacity: out ? 0 : 1, transition: "opacity .6s ease", zIndex: 1,
        }}
      />

      </>
      )}

      {/* The card. While it slides out, anything below the envelope's bottom edge
          is clipped so it never pokes out underneath. */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: out ? 6 : 2,
          clipPath: out ? "none" : `inset(0 0 ${STAGE_H - (ENV_TOP + ENV_H)}px 0)`,
          pointerEvents: opened ? "auto" : "none",
        }}
        aria-hidden={closed}
      >
        <div
          className="absolute"
          style={{
            left: CARD_LEFT, top: CARD_TOP, width: 600, height: 800, transformOrigin: "50% 100%",
            transition: "transform 1s cubic-bezier(.2,.9,.2,1) .55s, opacity .3s ease .45s",
            ...cardStyle,
          }}
        >
          {children}
        </div>
      </div>

      {!opened && (
      <>
      {/* Front pocket (in front of the card) */}
      <svg
        className="absolute"
        width={ENV_W}
        height={ENV_H}
        viewBox={`0 0 ${ENV_W} ${ENV_H}`}
        style={{ left: ENV_LEFT, top: ENV_TOP, zIndex: 3, opacity: out ? 0 : 1, transition: "opacity .6s ease", pointerEvents: "none" }}
      >
        <path d={`M0 ${ENV_H} L0 70 L${ENV_W / 2} ${ENV_H * 0.62} L${ENV_W} 70 L${ENV_W} ${ENV_H}Z`} fill={p.pocket} />
        <path d={`M0 ${ENV_H} L${ENV_W / 2} ${ENV_H * 0.55} L${ENV_W} ${ENV_H}`} fill="none" stroke={p.accent} strokeOpacity=".35" strokeWidth="2" />
        <path d={`M0 70 L${ENV_W / 2} ${ENV_H * 0.62} L${ENV_W} 70`} fill="none" stroke="#000" strokeOpacity=".12" strokeWidth="2" />
        <text x={ENV_W / 2} y={ENV_H - 30} textAnchor="middle" fill={p.accent} fontSize="13" letterSpacing="5" fontFamily="'Outfit', sans-serif">
          {p.label.toUpperCase()}
        </text>
      </svg>

      {/* Flap: closed it covers the top of the envelope, then swings up and back */}
      <div
        className="absolute"
        style={{
          left: ENV_LEFT, top: ENV_TOP, width: ENV_W, height: ENV_H * 0.62,
          background: p.flap,
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          transformOrigin: "top",
          transform: closed ? "rotateX(0deg)" : "rotateX(180deg)",
          transition: "transform .7s cubic-bezier(.4,0,.2,1), opacity .6s ease",
          opacity: out ? 0 : 1,
          zIndex: closed ? 4 : 0,
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,.25))",
        }}
      />

      </>
      )}

      {/* Wax seal */}
      {closed && (
        <button
          onClick={() => setPhase("opening")}
          className="absolute flex items-center justify-center rounded-full hover-lift smooth"
          style={{
            left: STAGE_W / 2 - 52, top: ENV_TOP + ENV_H * 0.62 - 52, width: 104, height: 104, zIndex: 5,
            background: `radial-gradient(circle at 35% 30%, ${p.seal}, ${p.seal} 45%, rgba(0,0,0,0.45))`,
            border: `2px solid ${p.accent}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            color: p.accent, fontFamily: "'Cormorant Garamond', serif", fontSize: 30, cursor: "pointer",
          }}
          data-testid="envelope-open-btn"
          aria-label="Open the invitation"
        >
          ✧
        </button>
      )}
      {closed && (
        <div
          className="absolute w-full text-center"
          style={{ top: ENV_TOP - 70, zIndex: 5, color: p.accent === "#E7C77D" ? "#8A6D3B" : p.accent }}
        >
          <div className="font-display text-3xl" style={{ color: "#3A2A1A" }}>You have an invitation</div>
          <div className="mt-2 text-xs uppercase tracking-[0.3em]">Tap the seal to open</div>
        </div>
      )}
    </div>
  );
}
