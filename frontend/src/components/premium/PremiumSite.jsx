import { useEffect, useRef, useState } from "react";
import { CalendarPlus, MapPin, Music, Share2, Volume2, VolumeX, X } from "lucide-react";
import EffectsLayer from "@/components/EffectsLayer";
import { fileUrl } from "@/lib/templates";
import { themeOf } from "@/lib/premium";

/**
 * "Sacred Vows" premium wedding website: sealed envelope -> hero card -> story ->
 * events timeline -> venue + map -> countdown -> gallery -> RSVP -> blessings.
 *
 * `embedded` renders inside the editor's phone frame: overlays are absolute
 * instead of fixed, events are shown revealed, and music stays off.
 */
export default function PremiumSite({ data, embedded = false, rsvpSlot = null, shareLink = "" }) {
  const w = data.website || {};
  const t = themeOf(data.theme);
  const [opened, setOpened] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);

  const vars = {
    "--p": t.primary,
    "--pd": t.primaryDark,
    "--g": t.gold,
    "--gl": t.goldLight,
    "--paper": t.paper,
    "--ink": t.ink,
  };
  const pos = embedded ? "absolute" : "fixed";
  const music = data.music_url ? fileUrl(data.music_url) : "";

  const open = () => {
    setOpened(true);
    // The seal tap is a user gesture, so browsers allow audio with sound here.
    if (!embedded && audioRef.current) audioRef.current.play().catch(() => {});
  };
  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !muted;
    if (a.paused) a.play().catch(() => {});
    setMuted(!muted);
  };

  return (
    <div
      // In the editor frame, keep the closed envelope to one screen instead of the page's full length.
      className={`relative overflow-x-hidden ${embedded && !opened ? "h-full overflow-y-hidden" : "min-h-full"}`}
      style={{ ...vars, background: "var(--paper)", color: "var(--ink)", fontFamily: "'Cormorant Garamond', serif" }}
      data-testid="premium-site"
    >
      <style>{PREMIUM_CSS}</style>
      <div className="ps-pattern pointer-events-none absolute inset-0" />
      <EffectsLayer effects={data.effects || []} contained={embedded} />

      {!opened && <EnvelopeScreen w={w} pos={pos} onOpen={open} embedded={embedded} />}

      <main className={`relative mx-auto max-w-[640px] px-4 pb-28 pt-6 ${opened || embedded ? "ps-shown" : "ps-hidden"}`}>
        <HeroCard w={w} />
        <Story w={w} />
        <Events w={w} revealAll={embedded} />
        <Venue v={w.venue || {}} embedded={embedded} />
        <Countdown w={w} title={data.title} shareLink={shareLink} />
        <Gallery images={w.gallery || []} onOpen={setLightbox} />
        {/* The RSVP form brings its own "Kindly reply" heading. */}
        {rsvpSlot && <section className="ps-rsvp flex justify-center">{rsvpSlot}</section>}
        <Blessings w={w} />
      </main>

      {lightbox && (
        <div className={`${pos} inset-0 z-[60] flex items-center justify-center bg-black/85 p-4`} onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Close photo">
            <X className="h-5 w-5" />
          </button>
          <img src={fileUrl(lightbox)} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}

      {music && !embedded && (
        <>
          <audio ref={audioRef} src={music} loop preload="auto" />
          {opened && (
            <button
              onClick={toggleMute}
              className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-xs shadow-lg"
              style={{ background: "var(--p)", color: "var(--gl)", fontFamily: "'Outfit', sans-serif" }}
              data-testid="premium-music-toggle"
            >
              <Music className="h-3.5 w-3.5" /> {data.music_label || "Music"}
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function EnvelopeScreen({ w, pos, onOpen, embedded }) {
  return (
    <div className={`${pos} inset-0 z-50 flex flex-col items-center overflow-y-auto`} style={{ background: "var(--paper)" }}>
      <div className="ps-pattern pointer-events-none absolute inset-0" />
      {/* envelope flap */}
      <div className="relative h-16 w-full shrink-0" style={{ background: "var(--p)", clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
      <div className="relative mx-4 -mt-2 w-full max-w-[400px] rounded-sm bg-white px-6 pb-8 pt-4 text-center shadow-2xl">
        <Ticks />
        <div className="ps-invocation mt-4">{w.invocation}</div>
        <div className="mt-2 text-sm italic opacity-70">The wedding invitation of</div>
        <div className="mx-auto mt-5 overflow-hidden rounded-md border-2" style={{ borderColor: "var(--g)" }}>
          {w.hero_image ? (
            <img src={fileUrl(w.hero_image)} alt="" className="h-64 w-full object-cover object-top" />
          ) : (
            <div className="flex h-56 items-center justify-center" style={{ background: "linear-gradient(160deg, var(--p), var(--pd))" }}>
              <Monogram w={w} size={130} />
            </div>
          )}
        </div>
        <div className="ps-script mt-5 text-4xl" style={{ color: "var(--p)" }}>
          {firstName(w.bride)} &amp; {firstName(w.groom)}
        </div>
        <Divider />
        <div className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--g)" }}>
          {[shortDate(w.countdown_at), placeShort(w)].filter(Boolean).join(" · ")}
        </div>
        <button onClick={onOpen} className="ps-seal mx-auto mt-6" aria-label="Open invitation" data-testid="premium-seal-btn">
          {w.seal_symbol || "♥"}
        </button>
        <div className="mt-4 text-sm italic" style={{ color: "var(--p)" }}>
          — tap the seal to open —
        </div>
        {embedded && <div className="mt-2 text-[11px] opacity-50">(guests see this first)</div>}
      </div>
    </div>
  );
}

function HeroCard({ w }) {
  return (
    <section className="ps-hero relative overflow-hidden rounded-2xl px-6 py-8 text-center shadow-xl">
      <Ticks light />
      <div className="mx-auto mt-5 h-36 w-36 overflow-hidden rounded-full border-4" style={{ borderColor: "var(--g)", background: "var(--paper)" }}>
        {w.hero_image ? (
          <img src={fileUrl(w.hero_image)} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <div className="flex h-full items-center justify-center" style={{ background: "var(--pd)" }}>
            <Monogram w={w} size={70} />
          </div>
        )}
      </div>
      <div className="ps-invocation mt-5" style={{ color: "var(--gl)" }}>{w.invocation}</div>
      {w.blessing_line && <p className="mx-auto mt-3 max-w-sm text-[15px] leading-snug text-white/90">{w.blessing_line}</p>}
      <div className="mt-4 text-3xl font-medium sm:text-4xl" style={{ color: "var(--gl)" }}>{w.bride}</div>
      <div className="my-1 text-sm italic text-white/80">— weds —</div>
      <div className="text-3xl font-medium sm:text-4xl" style={{ color: "var(--gl)" }}>{w.groom}</div>
      {w.date_line && <div className="mt-5 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--gl)" }}>{w.date_line}</div>}
      {w.time_line && <div className="mt-2 text-base italic text-white/90">{w.time_line}</div>}
      {w.extra_line && <div className="mt-2 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--gl)" }}>{w.extra_line}</div>}
      <Divider light />
      {w.place_line && <div className="text-sm text-white/90">{w.place_line}</div>}
      <div className="mt-6"><Ticks light /></div>
    </section>
  );
}

function Story({ w }) {
  const when = parseWhen(w.countdown_at);
  if (!w.story_title && !w.story_text) return null;
  return (
    <section className="mt-16">
      <SectionHead eyebrow="Save the date" title={w.story_title || "Our Story"} />
      <div className="ps-card px-6 py-8 text-center">
        <div className="text-3xl" style={{ color: "var(--g)" }}>❦</div>
        {w.story_quote && <p className="mt-3 text-xl italic" style={{ color: "var(--p)" }}>“{w.story_quote}”</p>}
        {w.story_text && <p className="mx-auto mt-4 max-w-md text-[17px] leading-relaxed">{w.story_text}</p>}
        {when && (
          <div className="mt-6 grid grid-cols-3 divide-x" style={{ borderColor: "var(--g)" }}>
            {[
              ["Date", when.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", " · ")],
              ["Day", when.toLocaleDateString("en-GB", { weekday: "long" })],
              ["Time", when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })],
            ].map(([k, v]) => (
              <div key={k} className="px-2" style={{ borderColor: "color-mix(in srgb, var(--g) 50%, transparent)" }}>
                <div className="ps-eyebrow">{k}</div>
                <div className="mt-1 text-[15px]">{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Events({ w, revealAll }) {
  const events = (w.events || []).filter((e) => e.name);
  const [revealed, setRevealed] = useState({});
  if (!events.length) return null;
  const canReveal = w.reveal_events && !revealAll;
  return (
    <section className="mt-16">
      <SectionHead eyebrow="Celebrations" title="Wedding Events" hint={canReveal ? "Tap each card to reveal the celebration" : ""} />
      <ol className="relative ml-3 border-l pl-6" style={{ borderColor: "var(--g)" }}>
        {events.map((e) => {
          const hidden = canReveal && !revealed[e.id];
          return (
            <li key={e.id} className="relative mb-6">
              <span className="absolute -left-[33px] top-6 h-4 w-4 rounded-full border-2" style={{ background: "var(--g)", borderColor: "var(--paper)" }} />
              {hidden ? (
                <button
                  onClick={() => setRevealed((r) => ({ ...r, [e.id]: true }))}
                  className="ps-hero ps-reveal flex h-36 w-full flex-col items-center justify-center rounded-2xl shadow-lg"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--gl)" }}>Reveal · {e.name}</span>
                  <span className="mt-3 text-sm italic text-white/80">✦ tap to reveal ✦</span>
                </button>
              ) : (
                <div className="ps-card ps-pop px-5 py-5">
                  <div className="text-2xl font-semibold" style={{ color: "var(--p)" }}>{e.name}</div>
                  {(e.date || e.time) && (
                    <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--g)" }}>
                      {[e.date, e.time].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {e.venue && (
                    <div className="mt-2 flex items-start gap-1.5 text-[15px]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--p)" }} /> {e.venue}
                    </div>
                  )}
                  {e.note && <div className="mt-2 text-[15px] italic opacity-75">{e.note}</div>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Venue({ v, embedded }) {
  if (!v.name && !v.address) return null;
  const q = encodeURIComponent(v.map_query || [v.name, v.address].filter(Boolean).join(", "));
  return (
    <section className="mt-16">
      <SectionHead eyebrow="The venue" title={v.title || "Join Us At"} />
      <div className="ps-card overflow-hidden">
        {v.photo && <img src={fileUrl(v.photo)} alt="" className="h-48 w-full object-cover" />}
        <div className="px-5 py-5">
          <div className="flex items-center gap-2 text-2xl font-semibold" style={{ color: "var(--p)" }}>
            <MapPin className="h-5 w-5" /> {v.name}
          </div>
          {v.address && <div className="mt-1 text-[15px] opacity-80">{v.address}</div>}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${q}`}
            target="_blank"
            rel="noreferrer"
            className="ps-btn mt-4 inline-flex"
          >
            <MapPin className="h-4 w-4" /> Get directions
          </a>
        </div>
        {q && (
          <iframe
            title="Venue map"
            src={`https://maps.google.com/maps?q=${q}&output=embed`}
            className="h-56 w-full border-0"
            loading="lazy"
            style={embedded ? { pointerEvents: "none" } : undefined}
          />
        )}
      </div>
    </section>
  );
}

function Countdown({ w, title, shareLink }) {
  const target = parseWhen(w.countdown_at);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target) return null;
  const left = Math.max(0, target.getTime() - now);
  const parts = [
    ["Days", Math.floor(left / 864e5)],
    ["Hrs", Math.floor(left / 36e5) % 24],
    ["Min", Math.floor(left / 6e4) % 60],
    ["Sec", Math.floor(left / 1e3) % 60],
  ];
  const share = async () => {
    const url = shareLink || window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        alert("Link copied");
      }
    } catch {}
  };
  return (
    <section className="mt-16 text-center">
      <div className="flex items-center justify-center gap-2">
        {parts.map(([k, n], i) => (
          <div key={k} className="flex items-center gap-2">
            <div className="ps-card w-16 py-2">
              <div className="text-2xl font-semibold" style={{ color: "var(--p)" }}>{String(n).padStart(2, "0")}</div>
              <div className="ps-eyebrow !text-[9px]">{k}</div>
            </div>
            {i < 3 && <span style={{ color: "var(--g)" }}>:</span>}
          </div>
        ))}
      </div>
      <div className="mt-8"><SectionHead eyebrow="Save the date" title="We'd Love Your Presence" /></div>
      <div className="mx-auto flex max-w-sm flex-col gap-3">
        <button className="ps-btn justify-center" onClick={() => downloadIcs(w, title)} data-testid="premium-calendar-btn">
          <CalendarPlus className="h-4 w-4" /> Add to calendar
        </button>
        <button className="ps-btn ps-btn-outline justify-center" onClick={share} data-testid="premium-share-btn">
          <Share2 className="h-4 w-4" /> Share invitation
        </button>
      </div>
    </section>
  );
}

function Gallery({ images, onOpen }) {
  const list = images.filter(Boolean);
  if (!list.length) return null;
  return (
    <section className="mt-16">
      <SectionHead eyebrow="Moments" title="Gallery" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {list.map((src, i) => (
          <button key={`${src}-${i}`} onClick={() => onOpen(src)} className="overflow-hidden rounded-lg">
            <img src={fileUrl(src)} alt="" loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-105" />
          </button>
        ))}
      </div>
    </section>
  );
}

function Blessings({ w }) {
  return (
    <section className="mt-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl shadow-md" style={{ background: "linear-gradient(145deg, var(--gl), var(--g))", color: "var(--p)" }}>
        {w.seal_symbol || "♥"}
      </div>
      <div className="mt-4"><SectionHead eyebrow="With love & gratitude" title="Family Blessings" /></div>
      {w.blessings_text && <p className="mx-auto max-w-md text-lg italic leading-relaxed">{w.blessings_text}</p>}
      {w.family && <p className="mt-4 text-[15px] opacity-80">{w.family}</p>}
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--p)" }}>
        ♥ {firstName(w.bride)} · {firstName(w.groom)} ♥
      </div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--g)" }}>
        {[shortDate(w.countdown_at), placeShort(w)].filter(Boolean).join(" · ")}
      </div>
      {w.closing && (
        <div className="mt-8 border-t pt-5 text-sm tracking-[0.15em]" style={{ borderColor: "var(--g)", color: "var(--g)" }}>
          ❙ {w.closing} ❙
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

function SectionHead({ eyebrow, title, hint }) {
  return (
    <div className="mb-6 text-center">
      <div className="ps-eyebrow">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-medium sm:text-4xl" style={{ color: "var(--p)" }}>{title}</h2>
      {hint && <div className="mt-2 text-sm italic" style={{ color: "var(--g)" }}>✨ {hint} ✨</div>}
      <Divider />
    </div>
  );
}

function Divider({ light }) {
  const c = light ? "var(--gl)" : "var(--g)";
  return (
    <div className="mx-auto my-4 flex max-w-[260px] items-center gap-3">
      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${c})` }} />
      <span className="h-2 w-2 rounded-full border" style={{ borderColor: c }} />
      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${c}, transparent)` }} />
    </div>
  );
}

function Ticks({ light }) {
  return (
    <div className="flex justify-center gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="h-4 w-1 rounded-full" style={{ background: light ? "var(--gl)" : "var(--g)", opacity: 0.85 }} />
      ))}
    </div>
  );
}

function Monogram({ w, size }) {
  const a = (w.bride || "?").trim()[0] || "?";
  const b = (w.groom || "?").trim()[0] || "?";
  return (
    <div className="ps-script leading-none" style={{ fontSize: size * 0.5, color: "var(--gl)" }}>
      {a}
      <span style={{ fontSize: size * 0.3 }}> &amp; </span>
      {b}
    </div>
  );
}

const firstName = (n) => (n || "").trim().split(/\s+/)[0] || "";

function parseWhen(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function shortDate(s) {
  const d = parseWhen(s);
  if (!d) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())} · ${p(d.getMonth() + 1)} · ${d.getFullYear()}`;
}

function placeShort(w) {
  const addr = w.venue?.address || "";
  const parts = addr.split(",").map((x) => x.trim()).filter(Boolean);
  // "Tirumala, Andhra Pradesh 517504" -> "TIRUMALA"; fall back to the venue name.
  return (parts[parts.length >= 2 ? parts.length - 2 : 0] || w.venue?.name || "").replace(/\d+/g, "").trim();
}

function downloadIcs(w, title) {
  const start = parseWhen(w.countdown_at);
  if (!start) return;
  const end = new Date(start.getTime() + 3 * 36e5);
  const fmt = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
  };
  const esc = (s) => (s || "").replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//InviteCraft//Wedding//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@invitecraft`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(`Wedding of ${firstName(w.bride)} & ${firstName(w.groom)}` || title)}`,
    `LOCATION:${esc([w.venue?.name, w.venue?.address].filter(Boolean).join(", "))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "wedding.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const PREMIUM_CSS = `
.ps-pattern{ background-image: repeating-radial-gradient(circle at 60px 60px, transparent 0 14px, color-mix(in srgb, var(--g) 13%, transparent) 14px 15px); background-size:120px 120px; opacity:.55; }
.ps-hidden{ opacity:0; transform:translateY(14px); }
.ps-shown{ opacity:1; transform:none; transition:opacity .8s ease, transform .8s ease; }
.ps-hero{ background: radial-gradient(circle at 50% 30%, var(--p), var(--pd)); color:#fff; }
.ps-hero::before{ content:""; position:absolute; inset:0; pointer-events:none; background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0 22px, rgba(255,255,255,.05) 22px 23px); }
.ps-card{ background:#fff; border:1px solid color-mix(in srgb, var(--g) 45%, transparent); border-radius:14px; box-shadow:0 6px 24px rgba(0,0,0,.05); }
.ps-eyebrow{ font-family:'Outfit',sans-serif; font-size:11px; letter-spacing:.32em; text-transform:uppercase; color:var(--g); font-weight:500; }
.ps-invocation{ font-size:15px; letter-spacing:.12em; font-weight:600; color:var(--g); }
.ps-invocation::before, .ps-invocation::after{ content:"❙"; margin:0 .6em; opacity:.8; }
.ps-script{ font-family:'Great Vibes', cursive; }
.ps-seal{ display:flex; align-items:center; justify-content:center; width:84px; height:84px; border-radius:50%; font-size:34px; color:var(--gl);
  background: radial-gradient(circle at 35% 30%, var(--p), var(--pd)); box-shadow:0 0 0 10px color-mix(in srgb, var(--g) 25%, transparent), 0 10px 25px rgba(0,0,0,.25);
  animation: ps-pulse 2.4s ease-in-out infinite; cursor:pointer; }
.ps-seal:active{ transform:scale(.92); }
@keyframes ps-pulse{ 0%,100%{ box-shadow:0 0 0 8px color-mix(in srgb, var(--g) 22%, transparent), 0 10px 25px rgba(0,0,0,.25);} 50%{ box-shadow:0 0 0 16px color-mix(in srgb, var(--g) 12%, transparent), 0 10px 25px rgba(0,0,0,.25);} }
.ps-reveal{ position:relative; overflow:hidden; }
.ps-pop{ animation: ps-pop .5s ease; }
@keyframes ps-pop{ from{ opacity:0; transform:scale(.96);} to{ opacity:1; transform:none;} }
.ps-btn{ align-items:center; gap:.5rem; border-radius:9999px; padding:.75rem 1.4rem; font-family:'Outfit',sans-serif; font-size:12px; letter-spacing:.2em; text-transform:uppercase;
  background:var(--p); color:var(--gl); border:1px solid var(--p); display:inline-flex; }
.ps-btn:hover{ background:var(--pd); }
.ps-btn-outline{ background:#fff; color:var(--p); border-color:var(--g); }
.ps-btn-outline:hover{ background:var(--paper); }
@media (prefers-reduced-motion: reduce){ .ps-seal{ animation:none; } }
`;
