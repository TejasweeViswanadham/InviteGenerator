import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { TEMPLATES, EVENT_TYPES } from "@/lib/templates";
import { PREMIUM_TEMPLATES, themeOf } from "@/lib/premium";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Crown, Plus } from "lucide-react";

export default function Templates() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [creating, setCreating] = useState(null);

  const filtered = useMemo(() => {
    if (tab === "premium") return PREMIUM_TEMPLATES;
    if (tab === "all") return TEMPLATES;
    return TEMPLATES.filter((t) => t.event_type === tab);
  }, [tab]);

  const startFrom = async (tpl) => {
    setCreating(tpl.id);
    try {
      const payload = { ...tpl.data, event_type: tpl.event_type };
      const { data } = await api.post("/invitations", payload);
      toast.success("Invitation created — start customizing");
      navigate(`/editor/${data.id}`);
    } catch (e) {
      toast.error("Could not create invitation");
    } finally {
      setCreating(null);
    }
  };

  const startBlank = async (type) => {
    try {
      const { data } = await api.post("/invitations", {
        title: "Untitled Invitation",
        event_type: type || "wedding",
        subtitle: "",
        hosts: "You are invited",
        date_text: "Saturday, June 14 2026",
        time_text: "4:00 PM",
        venue: "Venue · City",
        rsvp: "RSVP by mail",
        message: "Please join us for a special celebration.",
        background_url: "",
        background_data: "",
        accent_color: "#D97757",
        text_color: "#1A1A1A",
        heading_font: "'Cormorant Garamond', serif",
        body_font: "'Outfit', sans-serif",
        overlay_opacity: 0.35,
      });
      navigate(`/editor/${data.id}`);
    } catch {
      toast.error("Could not create blank invite");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Nav />
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="chip-label">Choose a starter</span>
            <h1 className="font-display mt-2 text-5xl">Templates</h1>
            <p className="mt-2 max-w-xl text-sm text-stone-600">
              Every template is a starting point. Change anything — text, colors, background, layout.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => startBlank(tab === "all" || tab === "premium" ? "wedding" : tab)}
            data-testid="templates-blank-btn"
          >
            <Plus className="mr-2 h-4 w-4" /> Start blank
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-10 flex flex-wrap gap-3">
          {[{ id: "all", label: "All" }, ...EVENT_TYPES, { id: "premium", label: "Premium" }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-5 py-2 text-xs smooth ${
                tab === t.id
                  ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
              }`}
              style={{ letterSpacing: "0.2em", textTransform: "uppercase" }}
              data-testid={`template-filter-${t.id}`}
            >
              {t.id === "premium" && <Crown className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" />}
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="fade-up group overflow-hidden rounded-2xl border border-stone-200 bg-white smooth hover-lift"
              data-testid={`template-card-${tpl.id}`}
            >
              {tpl.premium ? <PremiumCardPreview tpl={tpl} /> : (
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={tpl.preview}
                  alt={tpl.name}
                  className="h-full w-full object-cover smooth group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-white">
                  {tpl.data.photos?.[0] && (
                    <img
                      src={tpl.data.photos[0].url}
                      alt=""
                      className="mb-4 h-32 w-24 object-cover object-top"
                      style={{
                        borderRadius: "50% 50% 4px 4px / 38% 38% 4px 4px",
                        border: `3px solid ${tpl.data.accent_color}`,
                      }}
                    />
                  )}
                  <div
                    className="text-[10px]"
                    style={{ letterSpacing: "0.42em", color: tpl.data.accent_color }}
                  >
                    {tpl.data.hosts?.toUpperCase()}
                  </div>
                  <h3
                    className="mt-3 text-4xl leading-tight"
                    style={{ fontFamily: tpl.data.heading_font, fontWeight: 400 }}
                  >
                    {tpl.data.title}
                  </h3>
                  <p className="mt-2 text-xs italic opacity-80">{tpl.data.subtitle}</p>
                </div>
              </div>
              )}
              <div className="flex items-center justify-between p-5">
                <div>
                  <div className="chip-label">
                    {EVENT_TYPES.find((e) => e.id === tpl.event_type)?.label}
                    {tpl.style ? ` · ${tpl.style}` : ""}
                  </div>
                  <div className="font-display text-xl">{tpl.name}</div>
                </div>
                <Button
                  onClick={() => startFrom(tpl)}
                  disabled={creating === tpl.id}
                  className="rounded-full bg-[#1A1A1A] px-5 text-white hover:bg-[#D97757]"
                  data-testid={`template-use-${tpl.id}`}
                >
                  {creating === tpl.id ? "Creating…" : "Use"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock of the premium site's sealed-envelope opening, in the template's theme.
function PremiumCardPreview({ tpl }) {
  const t = themeOf(tpl.theme);
  const w = tpl.data.website || {};
  const first = (n) => (n || "").trim().split(/\s+/)[0] || "";
  return (
    <div className="relative flex aspect-[3/4] flex-col items-center overflow-hidden" style={{ background: t.paper }}>
      <div className="h-12 w-full shrink-0" style={{ background: t.primary, clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
      <div className="mx-6 -mt-1 flex flex-1 flex-col items-center rounded-sm bg-white px-5 pb-5 pt-4 text-center shadow-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        <div className="text-[11px] font-semibold tracking-[0.15em]" style={{ color: t.gold }}>{w.invocation}</div>
        <div className="mt-3 flex h-36 w-full items-center justify-center overflow-hidden rounded border-2" style={{ borderColor: t.gold, background: `linear-gradient(160deg, ${t.primary}, ${t.primaryDark})` }}>
          {w.hero_image ? (
            <img src={w.hero_image} alt="" className="h-full w-full object-cover object-top" />
          ) : (
            <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 54, color: t.goldLight }}>
              {first(w.bride)[0]}&amp;{first(w.groom)[0]}
            </span>
          )}
        </div>
        <div className="mt-3 text-3xl" style={{ fontFamily: "'Great Vibes', cursive", color: t.primary }}>
          {first(w.bride)} &amp; {first(w.groom)}
        </div>
        <div className="mt-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl" style={{ background: t.primary, color: t.goldLight, boxShadow: `0 0 0 6px ${t.gold}40` }}>
          {w.seal_symbol}
        </div>
      </div>
      <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#1A1A1A] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[#F2D488]">
        <Crown className="h-3 w-3" /> Premium
      </span>
    </div>
  );
}
