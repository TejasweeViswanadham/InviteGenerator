import { Link } from "react-router-dom";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { HERO_BACKGROUNDS, BACKGROUND_LIBRARY } from "@/lib/templates";
import { Sparkles, ImageIcon, Download, Share2 } from "lucide-react";

const gallery = [
  { img: BACKGROUND_LIBRARY.wedding[0], label: "Weddings" },
  { img: BACKGROUND_LIBRARY.birthday[0], label: "Birthdays" },
  { img: BACKGROUND_LIBRARY.anniversary[0], label: "Anniversaries" },
  { img: BACKGROUND_LIBRARY.baby_shower[0], label: "Baby showers" },
  { img: BACKGROUND_LIBRARY.corporate[0], label: "Corporate" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Nav variant="landing" />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-16 sm:px-10 lg:grid-cols-2 lg:pt-24">
        <div className="fade-up">
          <span className="chip-label" data-testid="hero-eyebrow">
            Invitations · Templates · AI Design
          </span>
          <h1 className="font-display mt-4 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            Invitations,
            <br />
            <em className="font-light text-[#D97757]">beautifully crafted.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-700">
            Design gorgeous wedding cards, birthday invites, baby showers and
            corporate announcements in minutes. Curated presets, AI-generated
            backgrounds and copy — all in one calm little studio.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/register">
              <Button
                size="lg"
                className="rounded-full bg-[#1A1A1A] px-8 py-6 text-base text-white hover:bg-[#D97757]"
                data-testid="hero-get-started-btn"
              >
                Start creating — free
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="ghost"
                size="lg"
                className="rounded-full px-6 py-6 text-base"
                data-testid="hero-signin-btn"
              >
                I already have an account
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6 text-xs text-stone-500">
            <span>◆ No credit card</span>
            <span>◆ Export PNG / PDF</span>
            <span>◆ Share by link</span>
          </div>
        </div>

        <div className="fade-up stagger-2 relative">
          <div className="grid grid-cols-2 gap-4">
            <img
              src={HERO_BACKGROUNDS[0]}
              alt="Warm paper texture"
              className="col-span-2 h-64 w-full rounded-2xl object-cover"
            />
            <img
              src={BACKGROUND_LIBRARY.wedding[0]}
              alt="Wedding preview"
              className="h-56 w-full rounded-2xl object-cover"
            />
            <img
              src={BACKGROUND_LIBRARY.birthday[0]}
              alt="Birthday preview"
              className="h-56 w-full rounded-2xl object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-lg sm:block">
            <div className="chip-label">Live template</div>
            <div className="font-display text-lg">Anna & Ethan · 2026</div>
          </div>
        </div>
      </section>

      <div className="hairline mx-auto max-w-7xl" />

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 sm:px-10">
        <div className="mb-16 max-w-2xl">
          <span className="chip-label">Everything you need</span>
          <h2 className="font-display mt-3 text-4xl sm:text-5xl">
            One quiet studio for every occasion.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <ImageIcon className="h-5 w-5" />,
              title: "Curated templates",
              body: "Hand-designed starters for weddings, birthdays, baby showers, anniversaries and corporate events.",
            },
            {
              icon: <Sparkles className="h-5 w-5" />,
              title: "AI copy + art",
              body: "Claude writes elegant invitation copy. Gemini Nano Banana paints custom backgrounds.",
            },
            {
              icon: <Download className="h-5 w-5" />,
              title: "Export anywhere",
              body: "Download as high-resolution PNG or print-ready PDF in a single click.",
            },
            {
              icon: <Share2 className="h-5 w-5" />,
              title: "Share by link",
              body: "Every invite has a public shareable URL — no downloads required for guests.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="fade-up rounded-2xl border border-stone-200 bg-white p-8 hover-lift smooth"
              style={{ animationDelay: `${0.05 * (i + 1)}s` }}
              data-testid={`feature-card-${i}`}
            >
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FBEEE1] text-[#D97757]">
                {f.icon}
              </div>
              <h3 className="font-display text-2xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="hairline mx-auto max-w-7xl" />

      {/* Gallery */}
      <section id="gallery" className="mx-auto max-w-7xl px-6 py-24 sm:px-10">
        <div className="mb-16 max-w-2xl">
          <span className="chip-label">Made for every moment</span>
          <h2 className="font-display mt-3 text-4xl sm:text-5xl">
            Five occasions. Infinite variations.
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
          {gallery.map((g, i) => (
            <div
              key={i}
              className="fade-up group relative aspect-[3/4] overflow-hidden rounded-2xl"
              style={{ animationDelay: `${0.08 * i}s` }}
              data-testid={`gallery-item-${g.label.toLowerCase()}`}
            >
              <img
                src={g.img}
                alt={g.label}
                className="h-full w-full object-cover smooth group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <span className="chip-label text-white/90">{g.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-32 sm:px-10">
        <div className="rounded-3xl border border-stone-200 bg-white px-8 py-16 text-center sm:px-16 sm:py-20">
          <span className="chip-label">Ready when you are</span>
          <h2 className="font-display mx-auto mt-4 max-w-2xl text-4xl sm:text-5xl">
            Your next invitation is <em className="text-[#D97757]">two minutes away.</em>
          </h2>
          <div className="mt-10">
            <Link to="/register">
              <Button
                size="lg"
                className="rounded-full bg-[#1A1A1A] px-10 py-6 text-base text-white hover:bg-[#D97757]"
                data-testid="cta-register-btn"
              >
                Create your first invite
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-xs text-stone-500 sm:flex-row sm:px-10">
          <div>© 2026 InviteCraft — designed with intention.</div>
          <div className="chip-label">Made for real celebrations</div>
        </div>
      </footer>
    </div>
  );
}
