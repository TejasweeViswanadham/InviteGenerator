import { useEffect, useRef, useState } from "react";

/**
 * Scratch-to-reveal overlay. Renders a canvas over the children. User scratches
 * with mouse/touch. Once ~40% of pixels are scratched, we fade the canvas out.
 */
export default function ScratchReveal({ children, coverColor = "#C89F59", label = "Scratch here to reveal" }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const scratchingRef = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas || revealed) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      // Fill with cover color + subtle pattern
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, coverColor);
      grad.addColorStop(1, shade(coverColor, -22));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 30 + 5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      // Label
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = `${18 * window.devicePixelRatio}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, canvas.width / 2, canvas.height / 2);
      ctx.font = `${11 * window.devicePixelRatio}px 'Outfit', sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("(hold and drag)", canvas.width / 2, canvas.height / 2 + 28 * window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [revealed, coverColor, label]);

  const scratchAt = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    const rx = (x - rect.left) * window.devicePixelRatio;
    const ry = (y - rect.top) * window.devicePixelRatio;
    ctx.beginPath();
    ctx.arc(rx, ry, 38 * window.devicePixelRatio, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkReveal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    // sample every 32 pixels for perf
    const step = 32 * window.devicePixelRatio;
    const data = ctx.getImageData(0, 0, w, h).data;
    let cleared = 0;
    let total = 0;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        total++;
        if (data[i + 3] < 8) cleared++;
      }
    }
    if (cleared / total > 0.38) setRevealed(true);
  };

  const onDown = (e) => {
    scratchingRef.current = true;
    const p = pt(e);
    scratchAt(p.x, p.y);
  };
  const onMove = (e) => {
    if (!scratchingRef.current) return;
    const p = pt(e);
    scratchAt(p.x, p.y);
  };
  const onUp = () => {
    if (scratchingRef.current) {
      scratchingRef.current = false;
      checkReveal();
    }
  };

  return (
    <div ref={wrapRef} className="relative" style={{ display: "inline-block" }} data-testid="scratch-reveal">
      {children}
      {!revealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair rounded-md smooth"
          style={{
            touchAction: "none",
            opacity: revealed ? 0 : 1,
            transition: "opacity 0.5s ease",
          }}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
          data-testid="scratch-canvas"
        />
      )}
    </div>
  );
}

function pt(e) {
  if (e.touches && e.touches[0]) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function shade(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (Math.max(0, Math.min(255, R)) << 16) +
      (Math.max(0, Math.min(255, G)) << 8) +
      Math.max(0, Math.min(255, B))
    )
      .toString(16)
      .slice(1)
  );
}
