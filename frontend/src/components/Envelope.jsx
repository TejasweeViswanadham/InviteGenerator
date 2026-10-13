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
 * Styles: 'classic' (paper), 'indian' (gold + red shubh vivah), 'modern' (mono),
 * 'balloon' (birthday: a balloon is tied to the flap; popping it opens the envelope).
 */
const PALETTES = {
  classic: { body: "#F1E9DB", pocket: "#EADFC9", flap: "#E4D6BC", accent: "#8A6D3B", seal: "#A03E3E", label: "Open the envelope" },
  indian: { body: "#7E0D18", pocket: "#8B0F1A", flap: "#6E0812", accent: "#E7C77D", seal: "#C9A24A", label: "श्री गणेशाय नमः · Tap to open" },
  modern: { body: "#202022", pocket: "#1A1A1A", flap: "#0F0F10", accent: "#D97757", seal: "#D97757", label: "Tap to open" },
  balloon: { body: "#FFD1DC", pocket: "#FFC2D1", flap: "#FFB0C4", accent: "#D63C6B", seal: "#FF4D6D", label: "Pop the balloon!" },
};

const STAGE_W = 720;
const STAGE_H = 900;
const ENV_W = 680;
const ENV_H = 460;
const ENV_LEFT = (STAGE_W - ENV_W) / 2;
const ENV_TOP = 300; // envelope sits in the lower part of the stage
const CARD_LEFT = (STAGE_W - 600) / 2;
const CARD_TOP = (STAGE_H - 800) / 2;

const TIE_X = STAGE_W / 2;
const TIE_Y = ENV_TOP + ENV_H * 0.62; // flap tip, where the balloon strings are tied

export default function Envelope({ style = "classic", children }) {
  const p = PALETTES[style] || PALETTES.classic;
  const balloon = style === "balloon";
  const [phase, setPhase] = useState("closed"); // closed | popping | opening | fading | open

  // popping: the balloon bursts (balloon style only, 0.45s)
  // opening: flap swings up and the card slides out (1.6s)
  // fading:  envelope fades away behind the card (0.6s)
  // open:    envelope removed; only the card remains
  useEffect(() => {
    const next = { popping: ["opening", 450], opening: ["fading", 1600], fading: ["open", 600] }[phase];
    if (!next) return undefined;
    const t = setTimeout(() => setPhase(next[0]), next[1]);
    return () => clearTimeout(t);
  }, [phase]);

  const closed = phase === "closed" || phase === "popping";
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
        {balloon && POCKET_CONFETTI.map(([x, y, c], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill={c} opacity=".8" />
        ))}
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

      {balloon && phase !== "fading" && !opened && (
        <Balloons phase={phase} onPop={() => { playPop(); setPhase("popping"); }} />
      )}

      {/* Wax seal */}
      {closed && !balloon && (
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
          style={{ top: balloon ? 24 : ENV_TOP - 70, zIndex: 5, color: p.accent === "#E7C77D" ? "#8A6D3B" : p.accent }}
        >
          <div className="font-display text-3xl" style={{ color: "#3A2A1A" }}>You have an invitation</div>
          <div className="mt-2 text-xs uppercase tracking-[0.3em]">
            {balloon ? "Pop the balloon to open" : "Tap the seal to open"}
          </div>
        </div>
      )}
    </div>
  );
}

const POCKET_CONFETTI = [
  [70, 330, "#FFD166"], [130, 400, "#4CC9F0"], [210, 350, "#FF4D6D"], [470, 360, "#FFD166"],
  [550, 410, "#4CC9F0"], [610, 340, "#FF4D6D"], [300, 420, "#9B5DE5"], [400, 410, "#06D6A0"],
];
const CONFETTI_COLORS = ["#FFD166", "#4CC9F0", "#FF4D6D", "#9B5DE5", "#06D6A0"];

// One balloon on a string tied at the flap tip. (cx, cy) is the centre of the balloon body.
function BalloonShape({ cx, cy, r, color }) {
  const ry = r * 1.2;
  const knotY = cy + ry;
  const midY = (knotY + TIE_Y) / 2;
  return (
    <>
      <path
        d={`M${cx} ${knotY + 6} C${cx + 18} ${midY - 30} ${TIE_X - 18} ${midY + 30} ${TIE_X} ${TIE_Y}`}
        fill="none" stroke="#8A6D7A" strokeWidth="1.6"
      />
      <ellipse cx={cx} cy={cy} rx={r} ry={ry} fill={color} />
      <ellipse
        cx={cx - r * 0.35} cy={cy - ry * 0.4} rx={r * 0.18} ry={r * 0.32} fill="#fff" opacity=".45"
        transform={`rotate(-25 ${cx - r * 0.35} ${cy - ry * 0.4})`}
      />
      <path d={`M${cx - 7} ${knotY + 7} L${cx} ${knotY - 2} L${cx + 7} ${knotY + 7} Z`} fill={color} />
    </>
  );
}

/**
 * Balloon bunch for the birthday envelope. The big middle balloon is the button: tapping
 * it bursts it (shards, confetti, "POP!"); the two side balloons then float away.
 */
function Balloons({ phase, onPop }) {
  const popped = phase !== "closed";
  const main = { cx: TIE_X, cy: 215, r: 72 };
  const shards = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const d = 110 + (i % 3) * 30;
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, rot: (i % 2 ? 1 : -1) * (120 + i * 20) };
  });
  const confetti = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 + 0.3;
    const d = 140 + (i % 4) * 45;
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d + 60, color: CONFETTI_COLORS[i % 5], rot: i * 47 };
  });
  const sway = (dur, delay) => ({
    transformBox: "view-box", transformOrigin: `${TIE_X}px ${TIE_Y}px`,
    animation: `balloonSway ${dur}s ease-in-out ${delay}s infinite`,
  });
  const floatAway = (dx) => ({
    transform: phase === "opening" ? `translate(${dx}px, -720px)` : "none",
    transition: "transform 2.2s cubic-bezier(.5,0,.75,.4)",
  });
  const fly = (v, dur, ease) => ({
    "--dx": `${v.dx}px`, "--dy": `${v.dy}px`, "--rot": `${v.rot}deg`,
    transformBox: "fill-box", transformOrigin: "center",
    animation: `balloonShard ${dur}s ${ease} forwards`,
  });

  return (
    <>
      <svg
        className="absolute inset-0"
        width={STAGE_W} height={STAGE_H} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
        style={{ zIndex: 5, pointerEvents: "none", overflow: "visible" }}
      >
        <g style={floatAway(-140)}>
          <g style={sway(3.4, 0.4)}><BalloonShape cx={232} cy={290} r={50} color="#FFD166" /></g>
        </g>
        <g style={floatAway(160)}>
          <g style={sway(3.8, 0.9)}><BalloonShape cx={490} cy={285} r={52} color="#4CC9F0" /></g>
        </g>
        {!popped && (
          <g style={sway(3, 0)}><BalloonShape {...main} color="#FF4D6D" /></g>
        )}
        {popped && (
          <g>
            {shards.map((v, i) => (
              <path key={`s${i}`} d={`M${main.cx} ${main.cy} l12 -6 l4 14 Z`} fill="#FF4D6D" style={fly(v, 0.6, "ease-out")} />
            ))}
            {confetti.map((v, i) => (
              <rect
                key={`c${i}`} x={main.cx - 4} y={main.cy - 3} width="8" height="6" rx="1" fill={v.color}
                style={fly(v, 1.1, "cubic-bezier(.2,.8,.4,1)")}
              />
            ))}
            <text
              x={main.cx} y={main.cy + 14} textAnchor="middle" fill="#D63C6B"
              fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="52"
              style={{ transformBox: "fill-box", transformOrigin: "center", animation: "balloonPopText .7s ease-out forwards" }}
            >
              POP!
            </text>
          </g>
        )}
        {/* little bow where the strings meet */}
        <g style={{ opacity: phase === "opening" ? 0 : 1, transition: "opacity .3s" }}>
          <path d={`M${TIE_X} ${TIE_Y} l-16 -9 l0 18 Z M${TIE_X} ${TIE_Y} l16 -9 l0 18 Z`} fill="#D63C6B" />
          <circle cx={TIE_X} cy={TIE_Y} r="5" fill="#B02E57" />
        </g>
      </svg>
      {!popped && (
        <button
          onClick={onPop}
          className="absolute rounded-full"
          style={{
            left: main.cx - main.r, top: main.cy - main.r * 1.2, width: main.r * 2, height: main.r * 2.4,
            zIndex: 6, cursor: "pointer", background: "transparent",
          }}
          data-testid="envelope-open-btn"
          aria-label="Pop the balloon to open the invitation"
        />
      )}
    </>
  );
}

// Short "pop": a burst of decaying noise through a low-pass filter. It plays on the guest's
// tap, so browsers allow the audio without an autoplay prompt.
function playPop() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const len = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    src.connect(lp).connect(gain).connect(ctx.destination);
    src.start();
    src.onended = () => ctx.close();
  } catch (e) {
    // the sound is a nicety; ignore failures
  }
}
