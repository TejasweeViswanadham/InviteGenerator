import { Link } from "react-router-dom";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import InviteCanvas from "@/components/InviteCanvas";
import ScaledBox from "@/components/ScaledBox";
import { TEMPLATES } from "@/lib/templates";
import { Crown, ImageIcon, Share2, Sparkles } from "lucide-react";

const tpl = (id) => TEMPLATES.find((t) => t.id === id);

// Real templates, drawn exactly as the editor draws them.
const HERO = [tpl("wed-kolam"), tpl("wed-srinivasa-kalyanam"), tpl("wed-nikah")];

const gallery = [
  { tpl: tpl("wed-sacred-bond"), label: "Weddings" },
  { tpl: tpl("bday-balloons"), label: "Birthdays" },
  { tpl: tpl("anniv-ruby"), label: "Anniversaries" },
  { tpl: tpl("baby-neutral"), label: "Baby showers" },
  { tpl: tpl("corp-gala"), label: "Corporate" },
];

function CardThumb({ t, width, className = "", style }) {
  const s = width / 600;
  return (
    <div className={`overflow-hidden rounded-xl shadow-2xl ${className}`} style={{ width, height: 800 * s, ...style }}>
      <div style={{ width: 600, height: 800, transform: `scale(${s})`, transformOrigin: "top left" }}>
        <InviteCanvas data={{ ...t.data, photos: t.data.photos || [] }} />
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Nav variant="landing" />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-16 sm:px-10 lg:grid-cols-2 lg:pt-24">
        <div className="fade-up">
          <span className="chip-label" data-testid="hero-eyebrow">
            Invitations · Wedding websites · RSVPs
          </span>
          <h1 className="font-display mt-4 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            Invitations,
            <br />
            <em className="font-light text-[#D97757]">beautifully crafted.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-700">
            Design beautiful wedding cards — South Indian, North Indian, devotional
            and Nikah — plus birthday, anniversary and corporate invites in minutes.
            Share them on WhatsApp and collect RSVPs, all in one calm little studio.
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

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-500">
            <span>◆ Share on WhatsApp</span>
            <span>◆ Collect RSVPs</span>
            <span>◆ Download PNG / PDF</span>
          </div>
        </div>

        <div className="fade-up stagger-2 relative">
          {/* Three real templates fanned out */}
          <ScaledBox width={560} height={460} className="mx-auto">
            <div className="relative h-[460px] w-[560px]">
              <CardThumb t={HERO[0]} width={230} className="absolute left-0 top-12" style={{ transform: "rotate(-8deg)" }} />
              <CardThumb t={HERO[2]} width={230} className="absolute right-0 top-12" style={{ transform: "rotate(8deg)" }} />
              <CardThumb t={HERO[1]} width={270} className="absolute left-1/2 top-0 z-10 -translate-x-1/2" />
            </div>
          </ScaledBox>
          <div className="absolute -bottom-4 left-0 z-20 hidden rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-lg sm:block">
            <div className="chip-label">Live template</div>
            <div className="font-display text-lg">{HERO[1].name}</div>
          </div>
        </div>
      </section>

      <div className="hairline mx-auto max-w-7xl" />

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-24 sm:px-10">
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
              body: "South Indian, North Indian, devotional and Nikah designs, plus birthdays, anniversaries, baby showers and corporate events.",
            },
            {
              icon: <Crown className="h-5 w-5" />,
              title: "Wedding websites",
              body: "Premium invites that open from a sealed envelope, with your events, venue map, countdown, gallery and music.",
            },
            {
              icon: <Share2 className="h-5 w-5" />,
              title: "Share & RSVP",
              body: "Send one link on WhatsApp or email. Guests reply in a tap and you see who's coming.",
            },
            {
              icon: <Sparkles className="h-5 w-5" />,
              title: "AI wording & downloads",
              body: "Let AI suggest your invitation wording, then download a PNG or print-ready PDF.",
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
      <section id="gallery" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-24 sm:px-10">
        <div className="mb-16 max-w-2xl">
          <span className="chip-label">Made for every moment</span>
          <h2 className="font-display mt-3 text-4xl sm:text-5xl">
            Five occasions. Infinite variations.
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
          {gallery.map((g, i) => (
            <Link
              to="/register"
              key={i}
              className="fade-up group relative block overflow-hidden rounded-2xl border border-stone-200 bg-white smooth hover-lift"
              style={{ animationDelay: `${0.08 * i}s` }}
              data-testid={`gallery-item-${g.label.toLowerCase()}`}
            >
              <ScaledBox width={600} height={800}>
                <InviteCanvas data={{ ...g.tpl.data, photos: g.tpl.data.photos || [] }} />
              </ScaledBox>
              <div className="border-t border-stone-200 px-3 py-2.5">
                <span className="chip-label">{g.label}</span>
              </div>
            </Link>
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
