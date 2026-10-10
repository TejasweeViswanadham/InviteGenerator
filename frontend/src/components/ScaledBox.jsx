import { useLayoutEffect, useRef, useState } from "react";

/**
 * Shows fixed-size content (the 600x800 card, the 720x900 envelope) shrunk to
 * fit the available width, so invitations fit on phones without sideways
 * scrolling. Never scales up beyond `width`.
 */
export default function ScaledBox({ width, height, children, className = "" }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setScale(Math.min(1, el.clientWidth / width) || 1);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={ref} className={className} style={{ width: "100%", maxWidth: width }}>
      <div style={{ width: width * scale, height: height * scale, margin: "0 auto" }}>
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
      </div>
    </div>
  );
}
