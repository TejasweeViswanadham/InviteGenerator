import { useEffect, useState } from "react";

/**
 * Event-specific ways of opening the invitation, used by Envelope.jsx.
 *
 * Openers decorate the standard envelope and replace its wax seal. Each one gets the
 * envelope's `phase` (closed → unsealing → opening) and calls `onOpen` when tapped; it
 * plays its own unseal animation while the phase is "unsealing".
 *
 *   balloon – birthday: pop the balloon tied to the flap
 *   ribbon  – baby shower: tap the bow and the ribbon unties
 *   heart   – anniversary: tap the heart padlock and it unlocks and drops away
 *   pass    – corporate: tap the guest pass, it is scanned and access is granted
 *
 * DoorReveal (housewarming) is a full replacement for the envelope: double doors that
 * swing open when the guest rings the bell.
 */

// Stage geometry shared with Envelope.jsx (fixed 720x900 stage, 600x800 card).
export const STAGE_W = 720;
export const STAGE_H = 900;
export const ENV_W = 680;
export const ENV_H = 460;
export const ENV_LEFT = (STAGE_W - ENV_W) / 2;
export const ENV_TOP = 300; // envelope sits in the lower part of the stage
export const CARD_LEFT = (STAGE_W - 600) / 2;
export const CARD_TOP = (STAGE_H - 800) / 2;
const TIE_X = STAGE_W / 2;
const TIE_Y = ENV_TOP + ENV_H * 0.62; // flap tip: where strings, bows and locks attach

// How long each opener's unseal animation runs before the flap opens.
export const UNSEAL_MS = { balloon: 450, ribbon: 750, heart: 850, pass: 1300 };

const CONFETTI_COLORS = ["#FFD166", "#4CC9F0", "#FF4D6D", "#9B5DE5", "#06D6A0"];

const sway = (dur, delay, x = TIE_X, y = TIE_Y) => ({
  transformBox: "view-box", transformOrigin: `${x}px ${y}px`,
  animation: `envSway ${dur}s ease-in-out ${delay}s infinite`,
});
const fly = (v, dur, ease, delay = 0) => ({
  "--dx": `${v.dx}px`, "--dy": `${v.dy}px`, "--rot": `${v.rot || 0}deg`,
  transformBox: "fill-box", transformOrigin: "center",
  animation: `envBurst ${dur}s ${ease} ${delay}s both`,
});
const burst = (n, dist, spread, extra = {}) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2 + 0.3;
  const d = dist + (i % 4) * spread;
  return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, rot: i * 47, ...extra, i };
});

function Stage({ children }) {
  return (
    <svg
      className="absolute inset-0"
      width={STAGE_W} height={STAGE_H} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      style={{ zIndex: 5, pointerEvents: "none", overflow: "visible" }}
    >
      {children}
    </svg>
  );
}

function HitArea({ x, y, w, h, onClick, label, round = true }) {
  return (
    <button
      onClick={onClick}
      className={`absolute ${round ? "rounded-full" : "rounded-lg"}`}
      style={{ left: x - w / 2, top: y - h / 2, width: w, height: h, zIndex: 6, cursor: "pointer", background: "transparent" }}
      data-testid="envelope-open-btn"
      aria-label={label}
    />
  );
}

// ------------------------------------------------------------------ balloon (birthday)
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

function Balloons({ phase, onOpen }) {
  const popped = phase !== "closed";
  const main = { cx: TIE_X, cy: 215, r: 72 };
  const shards = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const d = 110 + (i % 3) * 30;
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, rot: (i % 2 ? 1 : -1) * (120 + i * 20) };
  });
  const confetti = burst(26, 140, 45).map((v) => ({ ...v, dy: v.dy + 60, color: CONFETTI_COLORS[v.i % 5] }));
  const floatAway = (dx) => ({
    transform: phase === "opening" ? `translate(${dx}px, -720px)` : "none",
    transition: "transform 2.2s cubic-bezier(.5,0,.75,.4)",
  });
  const pop = () => { playNoisePop(); onOpen(); };

  return (
    <>
      <Stage>
        <g style={floatAway(-140)}>
          <g style={sway(3.4, 0.4)}><BalloonShape cx={232} cy={290} r={50} color="#FFD166" /></g>
        </g>
        <g style={floatAway(160)}>
          <g style={sway(3.8, 0.9)}><BalloonShape cx={490} cy={285} r={52} color="#4CC9F0" /></g>
        </g>
        {!popped && <g style={sway(3, 0)}><BalloonShape {...main} color="#FF4D6D" /></g>}
        {popped && (
          <g>
            {shards.map((v, i) => (
              <path key={`s${i}`} d={`M${main.cx} ${main.cy} l12 -6 l4 14 Z`} fill="#FF4D6D" style={fly(v, 0.6, "ease-out")} />
            ))}
            {confetti.map((v) => (
              <rect
                key={`c${v.i}`} x={main.cx - 4} y={main.cy - 3} width="8" height="6" rx="1" fill={v.color}
                style={fly(v, 1.1, "cubic-bezier(.2,.8,.4,1)")}
              />
            ))}
            <text
              x={main.cx} y={main.cy + 14} textAnchor="middle" fill="#D63C6B"
              fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="52"
              style={{ transformBox: "fill-box", transformOrigin: "center", animation: "envPopText .7s ease-out forwards" }}
            >
              POP!
            </text>
          </g>
        )}
        <g style={{ opacity: phase === "opening" ? 0 : 1, transition: "opacity .3s" }}>
          <path d={`M${TIE_X} ${TIE_Y} l-16 -9 l0 18 Z M${TIE_X} ${TIE_Y} l16 -9 l0 18 Z`} fill="#D63C6B" />
          <circle cx={TIE_X} cy={TIE_Y} r="5" fill="#B02E57" />
        </g>
      </Stage>
      {!popped && (
        <HitArea x={main.cx} y={main.cy} w={main.r * 2} h={main.r * 2.4} onClick={pop} label="Pop the balloon to open the invitation" />
      )}
    </>
  );
}

// ------------------------------------------------------------------ ribbon (baby shower)
const RIBBON = "#F49AB9";
const RIBBON_DARK = "#E07FA2";

function RibbonBow({ phase, onOpen }) {
  const untied = phase !== "closed";
  const slide = (x, y) => ({
    transform: untied ? `translate(${x}px, ${y}px)` : "none",
    opacity: untied ? 0 : 1,
    transition: "transform .7s cubic-bezier(.5,0,.8,.5), opacity .6s ease .1s",
  });
  const floaters = Array.from({ length: 12 }, (_, i) => ({
    dx: (i - 5.5) * 26, delay: (i % 6) * 0.08, heart: i % 2 === 0, color: ["#F49AB9", "#9BD3E6", "#C9A7EB", "#FFD98E"][i % 4],
  }));
  const band = 24;
  const open = () => { playTones([1047, 1319, 1568], { gap: 0.11, dur: 0.7, vol: 0.12 }); onOpen(); };

  return (
    <>
      <Stage>
        {/* ribbon bands around the envelope, split at the bow so each piece can slide away */}
        <g style={slide(-460, 0)}>
          <rect x={ENV_LEFT} y={TIE_Y - band / 2} width={TIE_X - ENV_LEFT} height={band} fill={RIBBON} />
          <rect x={ENV_LEFT} y={TIE_Y - 2} width={TIE_X - ENV_LEFT} height="4" fill={RIBBON_DARK} opacity=".5" />
        </g>
        <g style={slide(460, 0)}>
          <rect x={TIE_X} y={TIE_Y - band / 2} width={TIE_X - ENV_LEFT} height={band} fill={RIBBON} />
          <rect x={TIE_X} y={TIE_Y - 2} width={TIE_X - ENV_LEFT} height="4" fill={RIBBON_DARK} opacity=".5" />
        </g>
        <g style={slide(0, -420)}>
          <rect x={TIE_X - band / 2} y={ENV_TOP} width={band} height={TIE_Y - ENV_TOP} fill={RIBBON} />
        </g>
        <g style={slide(0, 300)}>
          <rect x={TIE_X - band / 2} y={TIE_Y} width={band} height={ENV_TOP + ENV_H - TIE_Y} fill={RIBBON} />
        </g>
        {/* bow */}
        <g style={{
          transformBox: "view-box", transformOrigin: `${TIE_X}px ${TIE_Y}px`,
          transform: untied ? "scale(0.2) rotate(40deg)" : "none", opacity: untied ? 0 : 1,
          transition: "transform .45s ease-in, opacity .4s ease",
        }}>
          <g style={sway(4, 0)}>
            <path d={`M${TIE_X - 6} ${TIE_Y + 6} L${TIE_X - 40} ${TIE_Y + 70} L${TIE_X - 22} ${TIE_Y + 66} L${TIE_X - 14} ${TIE_Y + 82} L${TIE_X + 2} ${TIE_Y + 8} Z`} fill={RIBBON_DARK} />
            <path d={`M${TIE_X + 6} ${TIE_Y + 6} L${TIE_X + 40} ${TIE_Y + 70} L${TIE_X + 22} ${TIE_Y + 66} L${TIE_X + 14} ${TIE_Y + 82} L${TIE_X - 2} ${TIE_Y + 8} Z`} fill={RIBBON_DARK} />
            <ellipse cx={TIE_X - 36} cy={TIE_Y - 10} rx="38" ry="22" transform={`rotate(-22 ${TIE_X - 36} ${TIE_Y - 10})`} fill={RIBBON} stroke={RIBBON_DARK} strokeWidth="3" />
            <ellipse cx={TIE_X + 36} cy={TIE_Y - 10} rx="38" ry="22" transform={`rotate(22 ${TIE_X + 36} ${TIE_Y - 10})`} fill={RIBBON} stroke={RIBBON_DARK} strokeWidth="3" />
            <ellipse cx={TIE_X - 34} cy={TIE_Y - 10} rx="16" ry="7" transform={`rotate(-22 ${TIE_X - 34} ${TIE_Y - 10})`} fill={RIBBON_DARK} opacity=".45" />
            <ellipse cx={TIE_X + 34} cy={TIE_Y - 10} rx="16" ry="7" transform={`rotate(22 ${TIE_X + 34} ${TIE_Y - 10})`} fill={RIBBON_DARK} opacity=".45" />
            <rect x={TIE_X - 13} y={TIE_Y - 22} width="26" height="26" rx="8" fill={RIBBON_DARK} />
          </g>
        </g>
        {/* hearts and stars drifting up once the bow is untied */}
        {untied && floaters.map((f, i) => (
          <g key={i} style={{
            "--dx": `${f.dx}px`, transformBox: "fill-box", transformOrigin: "center",
            animation: `envFloatUp 1.5s ease-out ${f.delay}s both`,
          }}>
            {f.heart
              ? <path transform={`translate(${TIE_X} ${TIE_Y - 10}) scale(.5)`} d="M0 18 C-40 -8 -26 -40 0 -22 C26 -40 40 -8 0 18 Z" fill={f.color} />
              : <path transform={`translate(${TIE_X} ${TIE_Y - 10}) scale(.6)`} d="M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4 Z" fill={f.color} />}
          </g>
        ))}
      </Stage>
      {!untied && <HitArea x={TIE_X} y={TIE_Y} w={150} h={110} onClick={open} label="Untie the ribbon to open the invitation" />}
    </>
  );
}

// ------------------------------------------------------------------ heart lock (anniversary)
const GOLD = "#C9A24A";
const GOLD_DARK = "#9A7428";
const HEART = "M0 30 C-62 -10 -42 -62 0 -34 C42 -62 62 -10 0 30 Z";

function HeartLock({ phase, onOpen }) {
  const unlocked = phase !== "closed";
  const sparkles = burst(14, 70, 22).map((v) => ({ ...v, color: v.i % 3 ? GOLD : "#F2D488" }));
  const open = () => { playTones([880, 1109, 1319], { gap: 0.14, dur: 0.9, vol: 0.12 }); onOpen(); };
  const cy = TIE_Y + 10;

  return (
    <>
      <Stage>
        <defs>
          <linearGradient id="env-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F2D488" />
            <stop offset=".55" stopColor={GOLD} />
            <stop offset="1" stopColor={GOLD_DARK} />
          </linearGradient>
        </defs>
        {/* swings gently while locked; once unlocked it drops away */}
        <g style={unlocked ? {
          transformBox: "view-box", transformOrigin: `${TIE_X}px ${cy}px`,
          animation: "envDrop .6s cubic-bezier(.5,0,.9,.5) .35s both",
        } : sway(4.5, 0, TIE_X, cy - 60)}>
          {/* shackle lifts first */}
          <path
            d={`M${TIE_X - 24} ${cy - 30} V${cy - 62} A24 24 0 0 1 ${TIE_X + 24} ${cy - 62} V${cy - 30}`}
            fill="none" stroke={GOLD_DARK} strokeWidth="9" strokeLinecap="round"
            style={{ transform: unlocked ? "translateY(-18px)" : "none", transition: "transform .25s ease-out" }}
          />
          <path transform={`translate(${TIE_X} ${cy})`} d={HEART} fill="url(#env-gold)" stroke={GOLD_DARK} strokeWidth="2" />
          <path transform={`translate(${TIE_X - 14} ${cy - 28}) scale(.35)`} d={HEART} fill="#fff" opacity=".25" />
          <circle cx={TIE_X} cy={cy - 8} r="6" fill="#4A2A12" />
          <path d={`M${TIE_X - 3} ${cy - 6} L${TIE_X - 5} ${cy + 8} L${TIE_X + 5} ${cy + 8} L${TIE_X + 3} ${cy - 6} Z`} fill="#4A2A12" />
        </g>
        {unlocked && sparkles.map((v) => (
          <g key={v.i} style={fly(v, 0.9, "ease-out", 0.15)}>
            <path
              transform={`translate(${TIE_X} ${cy - 10}) scale(.55)`}
              d="M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4 Z" fill={v.color}
            />
          </g>
        ))}
      </Stage>
      {!unlocked && <HitArea x={TIE_X} y={cy - 18} w={130} h={120} onClick={open} label="Unlock the heart to open the invitation" />}
    </>
  );
}

// ------------------------------------------------------------------ access pass (corporate)
function AccessPass({ phase, onOpen }) {
  const scanning = phase !== "closed";
  const w = 124;
  const h = 150;
  const x = TIE_X - w / 2;
  const y = TIE_Y - 10;
  const open = () => {
    playTones([1400], { type: "square", dur: 0.08, vol: 0.05 });
    playTones([1046, 1568], { type: "square", gap: 0.12, dur: 0.12, vol: 0.05, delay: 0.7 });
    onOpen();
  };
  const bars = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 1, 2, 3];

  return (
    <>
      <Stage>
        <g style={{ opacity: phase === "opening" ? 0 : 1, transition: "opacity .3s" }}>
          <g style={scanning ? undefined : sway(3.6, 0, TIE_X, TIE_Y - 14)}>
            {/* clip */}
            <rect x={TIE_X - 14} y={TIE_Y - 24} width="28" height="18" rx="4" fill="#9AA4B1" />
            <rect x={TIE_X - 6} y={TIE_Y - 10} width="12" height="14" rx="2" fill="#7B8592" />
            {/* badge */}
            <rect x={x} y={y} width={w} height={h} rx="10" fill="#FFFFFF" />
            <path d={`M${x} ${y + 10} A10 10 0 0 1 ${x + 10} ${y} H${x + w - 10} A10 10 0 0 1 ${x + w} ${y + 10} V${y + 34} H${x} Z`} fill="#5EC2B7" />
            <rect x={TIE_X - 14} y={y + 6} width="28" height="5" rx="2.5" fill="#1E2A3A" opacity=".35" />
            <text x={TIE_X} y={y + 27} textAnchor="middle" fill="#FFFFFF" fontFamily="'Outfit', sans-serif" fontWeight="700" fontSize="11" letterSpacing="2.5">GUEST PASS</text>
            <circle cx={TIE_X} cy={y + 62} r="17" fill="#E6EEF2" stroke="#5EC2B7" strokeWidth="2" />
            <circle cx={TIE_X} cy={y + 57} r="6" fill="#9AA4B1" />
            <path d={`M${TIE_X - 11} ${y + 73} A11 9 0 0 1 ${TIE_X + 11} ${y + 73}`} fill="#9AA4B1" />
            <rect x={TIE_X - 34} y={y + 88} width="68" height="7" rx="3.5" fill="#1E2A3A" opacity=".8" />
            <rect x={TIE_X - 24} y={y + 100} width="48" height="5" rx="2.5" fill="#1E2A3A" opacity=".3" />
            {bars.reduce((acc, bw, i) => {
              const bx = acc.x;
              acc.x += bw + 2;
              acc.els.push(<rect key={i} x={bx} y={y + 116} width={bw} height="22" fill="#1E2A3A" />);
              return acc;
            }, { x: TIE_X - 40, els: [] }).els}
            {scanning && (
              <>
                <rect
                  x={x + 4} y={y + 2} width={w - 8} height="4" rx="2" fill="#5EC2B7"
                  style={{ "--dist": `${h - 8}px`, filter: "drop-shadow(0 0 6px #5EC2B7)", animation: "envScan .65s ease-in-out both" }}
                />
                <g style={{ animation: "envFadeIn .25s ease .7s both" }}>
                  <rect x={x} y={y} width={w} height={h} rx="10" fill="#16A34A" opacity=".92" />
                  <path d={`M${TIE_X - 16} ${y + 58} l11 11 l21 -23`} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <text x={TIE_X} y={y + 102} textAnchor="middle" fill="#fff" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="13" letterSpacing="1.5">ACCESS</text>
                  <text x={TIE_X} y={y + 120} textAnchor="middle" fill="#fff" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="13" letterSpacing="1.5">GRANTED</text>
                </g>
              </>
            )}
          </g>
        </g>
      </Stage>
      {!scanning && <HitArea x={TIE_X} y={y + h / 2 - 8} w={w + 16} h={h + 30} onClick={open} round={false} label="Scan your pass to open the invitation" />}
    </>
  );
}

export const OPENERS = { balloon: Balloons, ribbon: RibbonBow, heart: HeartLock, pass: AccessPass };

// ------------------------------------------------------------------ doors (housewarming)
const WOOD = "linear-gradient(90deg, #7A4528, #8E5634 45%, #7A4528)";

function Door({ side, open }) {
  const left = side === "left";
  return (
    <div
      className="absolute"
      style={{
        left: left ? CARD_LEFT : CARD_LEFT + 300, top: CARD_TOP, width: 300, height: 800,
        background: WOOD,
        boxShadow: left ? "inset -2px 0 0 rgba(0,0,0,.35)" : "inset 2px 0 0 rgba(0,0,0,.35)",
        transformOrigin: left ? "left center" : "right center",
        transform: open ? `rotateY(${left ? -108 : 108}deg)` : "rotateY(0deg)",
        transition: "transform 1.15s cubic-bezier(.6,0,.25,1)",
        zIndex: 3,
      }}
    >
      {[[50, 90, 290], [50, 430, 300]].map(([pad, top, hgt], i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: left ? pad : 300 - pad - 200, top, width: 200, height: hgt, borderRadius: 6,
            border: "3px solid rgba(0,0,0,.22)", boxShadow: "inset 0 0 0 8px rgba(255,255,255,.05), inset 0 0 18px rgba(0,0,0,.25)",
          }}
        />
      ))}
      {/* handle beside the centre seam */}
      <div
        className="absolute rounded-full"
        style={{
          [left ? "right" : "left"]: 18, top: 400, width: 14, height: 70,
          background: "linear-gradient(90deg, #B68A2E, #F2D488, #B68A2E)", boxShadow: "0 2px 6px rgba(0,0,0,.4)",
        }}
      />
    </div>
  );
}

// A mango-leaf and marigold toran across the top of the door frame.
function Toran() {
  const items = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const x = CARD_LEFT - 10 + ((i + 0.5) / n) * 620;
    const y = CARD_TOP + 6 + Math.sin(((i + 0.5) / n) * Math.PI) * 14;
    if (i % 2) {
      items.push(<path key={i} d={`M${x} ${y} q12 22 0 46 q-12 -24 0 -46 Z`} fill={i % 4 === 1 ? "#4E8A3E" : "#6BA35A"} />);
    } else {
      items.push(<circle key={i} cx={x} cy={y + 12} r="11" fill="#F39A1E" />, <circle key={`${i}b`} cx={x} cy={y + 12} r="5" fill="#E07B12" />,
        <circle key={`${i}c`} cx={x} cy={y + 32} r="9" fill="#F7B733" />);
    }
  }
  return (
    <svg className="absolute inset-0" width={STAGE_W} height={STAGE_H} style={{ zIndex: 5, pointerEvents: "none" }}>
      <path d={`M${CARD_LEFT - 10} ${CARD_TOP + 4} Q${STAGE_W / 2} ${CARD_TOP + 34} ${CARD_LEFT + 610} ${CARD_TOP + 4}`} fill="none" stroke="#B5502B" strokeWidth="3" />
      {items}
    </svg>
  );
}

export function DoorReveal({ children }) {
  const [phase, setPhase] = useState("closed"); // closed | opening | open
  useEffect(() => {
    if (phase !== "opening") return undefined;
    const t = setTimeout(() => setPhase("open"), 1500);
    return () => clearTimeout(t);
  }, [phase]);
  const closed = phase === "closed";
  const opened = phase === "open";
  const ring = () => { playTones([784, 622], { gap: 0.42, dur: 1.1, vol: 0.2 }); setPhase("opening"); };

  return (
    <div className="relative mx-auto" style={{ width: STAGE_W, height: STAGE_H, perspective: 1800 }} data-testid="envelope">
      <div
        className="absolute"
        style={{
          left: CARD_LEFT, top: CARD_TOP, width: 600, height: 800, zIndex: 1,
          transform: closed ? "scale(.94)" : "scale(1)", transition: "transform 1s ease .3s",
          pointerEvents: opened ? "auto" : "none",
        }}
        aria-hidden={closed}
      >
        {children}
      </div>

      {!opened && (
        <>
          {/* door frame (hollow, so the card shows through once the doors swing open) */}
          <div
            className="absolute"
            style={{
              left: CARD_LEFT - 22, top: CARD_TOP - 22, width: 644, height: 844, zIndex: 2, borderRadius: 6,
              border: "22px solid #5A321D", boxShadow: "0 30px 60px rgba(0,0,0,.3)",
              opacity: closed ? 1 : 0, transition: "opacity .6s ease .8s",
            }}
          />
          <Door side="left" open={!closed} />
          <Door side="right" open={!closed} />
          <div style={{ opacity: closed ? 1 : 0, transition: "opacity .3s" }}>
            <Toran />
            {/* welcome plaque across the seam */}
            <div
              className="absolute text-center"
              style={{
                left: STAGE_W / 2 - 120, top: CARD_TOP + 120, width: 240, padding: "16px 12px", zIndex: 5,
                background: "#FFF6E5", border: "3px solid #C9A24A", borderRadius: 10, boxShadow: "0 8px 20px rgba(0,0,0,.35)",
                color: "#5A321D",
              }}
            >
              <div style={{ fontFamily: "'Great Vibes', cursive", fontSize: 38, lineHeight: 1 }}>Welcome Home</div>
              <div className="mt-2 text-[10px] uppercase" style={{ letterSpacing: "0.3em", color: "#9A7428" }}>You have an invitation</div>
            </div>
            <div
              className="absolute text-center text-[11px] uppercase"
              style={{ left: 0, right: 0, top: CARD_TOP + 740, zIndex: 5, letterSpacing: "0.3em", color: "#FFF6E5" }}
            >
              Ring the bell to come in
            </div>
          </div>
          {/* doorbell on the frame */}
          {closed && (
            <div
              className="absolute rounded-full"
              style={{
                left: CARD_LEFT + 600 - 2, top: CARD_TOP + 360, width: 26, height: 60, zIndex: 5,
                background: "linear-gradient(#B68A2E, #E7C77D, #B68A2E)", boxShadow: "0 3px 8px rgba(0,0,0,.4)",
              }}
            >
              <div className="absolute rounded-full" style={{ left: 5, top: 19, width: 16, height: 16, background: "#FFF6E5", animation: "envPulse 1.6s ease-out infinite" }} />
            </div>
          )}
        </>
      )}
      {closed && (
        <button
          onClick={ring}
          className="absolute"
          style={{ left: CARD_LEFT, top: CARD_TOP, width: 640, height: 800, zIndex: 6, cursor: "pointer", background: "transparent" }}
          data-testid="envelope-open-btn"
          aria-label="Ring the bell to open the invitation"
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ sounds
// Sounds play on the guest's tap, so browsers allow them without an autoplay prompt.
// They are a nicety: any failure is ignored.
function audio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  return Ctx ? new Ctx() : null;
}

// Short "pop": a burst of decaying noise through a low-pass filter.
function playNoisePop() {
  try {
    const ctx = audio();
    if (!ctx) return;
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
    // ignore
  }
}

// A sequence of bell-like tones (each decays away), e.g. a "ding-dong" doorbell.
function playTones(freqs, { type = "sine", gap = 0.2, dur = 0.6, vol = 0.15, delay = 0 } = {}) {
  try {
    const ctx = audio();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f;
      const start = t0 + i * gap;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(vol, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
    setTimeout(() => ctx.close(), (delay + freqs.length * gap + dur + 0.3) * 1000);
  } catch (e) {
    // ignore
  }
}
