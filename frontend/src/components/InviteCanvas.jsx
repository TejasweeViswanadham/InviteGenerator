import { forwardRef } from "react";
import { fileUrl } from "@/lib/templates";

/**
 * The visual invitation card. This DOM node is what we export to PNG/PDF.
 * Kept fixed 600x800 (3:4) to make export predictable.
 */
const InviteCanvas = forwardRef(function InviteCanvas(
  { data, className = "", interactivePhotos = false, onPhotoUpdate, onPhotoSelect, selectedPhotoId },
  ref
) {
  const {
    title,
    subtitle,
    hosts,
    date_text,
    time_text,
    venue,
    rsvp,
    message,
    background_url,
    background_data,
    accent_color,
    text_color,
    heading_font,
    body_font,
    overlay_opacity,
    photos = [],
  } = data;

  const bg = background_data || background_url || "";
  const opacity = Math.max(0, Math.min(1, Number(overlay_opacity ?? 0.35)));

  const startDrag = (e, photo) => {
    if (!interactivePhotos) return;
    e.preventDefault();
    onPhotoSelect?.(photo.id);
    const container = e.currentTarget.parentElement;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startXPct = photo.x_pct;
    const startYPct = photo.y_pct;

    const onMove = (ev) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      onPhotoUpdate?.({
        ...photo,
        x_pct: Math.max(0, Math.min(100, startXPct + dx)),
        y_pct: Math.max(0, Math.min(100, startYPct + dy)),
      });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden canvas-frame ${className}`}
      style={{
        width: 600,
        height: 800,
        background: "#FFFFFF",
        color: text_color || "#1A1A1A",
      }}
      data-testid="invite-canvas"
    >
      {bg ? (
        <img
          src={bg}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ userSelect: "none" }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #F5EDE0 0%, #FAF9F6 45%, #EFE6D6 100%)",
          }}
        />
      )}

      {bg && (
        <div
          className="absolute inset-0"
          style={{ background: "#000", opacity }}
        />
      )}

      {/* Photos overlay */}
      {photos.map((p) => {
        const src = fileUrl(p.url);
        const shape = p.shape || "circle";
        const border = 4;
        return (
          <div
            key={p.id}
            onMouseDown={(e) => startDrag(e, p)}
            className={`absolute ${interactivePhotos ? "cursor-move" : ""} ${
              selectedPhotoId === p.id ? "ring-2 ring-[#D97757]" : ""
            }`}
            style={{
              left: `${p.x_pct}%`,
              top: `${p.y_pct}%`,
              width: `${p.w_pct}%`,
              transform: `translate(-50%, -50%) rotate(${p.rotation || 0}deg)`,
              zIndex: 5 + (p.z_index || 1),
            }}
            data-testid={`invite-photo-${p.id}`}
          >
            <div
              style={{
                aspectRatio: "1 / 1",
                overflow: "hidden",
                borderRadius: shape === "circle" ? "50%" : shape === "rounded" ? 16 : 4,
                border: `${border}px solid ${accent_color || "#D97757"}`,
                background: "#fff",
              }}
            >
              <img src={src} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
            </div>
          </div>
        );
      })}

      {/* Inner frame */}
      <div
        className="absolute pointer-events-none"
        style={{ inset: 28, border: `1px solid ${text_color || "#1A1A1A"}22` }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ inset: 36, border: `1px solid ${text_color || "#1A1A1A"}11` }}
      />

      <div
        className="relative flex h-full flex-col items-center justify-between px-12 py-16 text-center pointer-events-none"
        style={{ fontFamily: body_font }}
      >
        <div className="w-full">
          <div className="mx-auto mb-2 h-px w-16" style={{ background: accent_color }} />
          <div
            className="text-[10px] uppercase"
            style={{ letterSpacing: "0.42em", color: accent_color }}
            data-testid="invite-hosts"
          >
            {hosts}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <h1
            className="text-5xl leading-tight"
            style={{ fontFamily: heading_font, fontWeight: 400 }}
            data-testid="invite-title"
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-3 text-sm italic opacity-80"
              style={{ fontFamily: heading_font }}
              data-testid="invite-subtitle"
            >
              {subtitle}
            </p>
          )}

          <div className="mx-auto my-6 h-px w-12" style={{ background: accent_color }} />

          {message && (
            <p className="mx-auto max-w-[80%] text-sm leading-relaxed opacity-90" data-testid="invite-message">
              {message}
            </p>
          )}

          <div className="mt-8 space-y-1 text-sm">
            {date_text && (
              <div style={{ letterSpacing: "0.12em" }} data-testid="invite-date">
                {date_text.toUpperCase()}
              </div>
            )}
            {time_text && (
              <div className="opacity-80" data-testid="invite-time">
                {time_text}
              </div>
            )}
          </div>

          {venue && (
            <div className="mt-6 max-w-[85%] text-sm opacity-90" data-testid="invite-venue">
              {venue}
            </div>
          )}
        </div>

        <div className="w-full">
          {rsvp && (
            <p
              className="text-[11px]"
              style={{ letterSpacing: "0.24em", color: accent_color }}
              data-testid="invite-rsvp"
            >
              {rsvp.toUpperCase()}
            </p>
          )}
          <div className="mx-auto mt-3 h-px w-16" style={{ background: accent_color }} />
        </div>
      </div>
    </div>
  );
});

export default InviteCanvas;
