// Preset templates + curated stock library grouped by event type.
export const EVENT_TYPES = [
  { id: "wedding", label: "Wedding" },
  { id: "birthday", label: "Birthday" },
  { id: "baby_shower", label: "Baby Shower" },
  { id: "anniversary", label: "Anniversary" },
  { id: "corporate", label: "Corporate" },
];

export const BACKGROUND_LIBRARY = {
  wedding: [
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd2VkZGluZyUyMHJlY2VwdGlvbiUyMHRhYmxlJTIwc2V0dGluZ3xlbnwwfHx8fDE3ODM1MDU2MTJ8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1710587385270-08f30d66bf31?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHxlbGVnYW50JTIwd2VkZGluZyUyMHJlY2VwdGlvbiUyMHRhYmxlJTIwc2V0dGluZ3xlbnwwfHx8fDE3ODM1MDU2MTJ8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1619043518800-7f14be467dca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzaWxrJTIwZmFicmljJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODM1MDU2MjF8MA&ixlib=rb-4.1.0&q=85",
  ],
  birthday: [
    "https://images.unsplash.com/photo-1741969494307-55394e3e4071?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHw0fHxqb3lmdWwlMjBiaXJ0aGRheSUyMHBhcnR5JTIwZGVjb3JhdGlvbnN8ZW58MHx8fHwxNzgzNTA1NjEyfDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1531956531700-dc0ee0f1f9a5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwxfHxqb3lmdWwlMjBiaXJ0aGRheSUyMHBhcnR5JTIwZGVjb3JhdGlvbnN8ZW58MHx8fHwxNzgzNTA1NjEyfDA&ixlib=rb-4.1.0&q=85",
  ],
  corporate: [
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY29ycG9yYXRlJTIwZXZlbnQlMjBjb25mZXJlbmNlfGVufDB8fHx8MTc4MzUwNTYxMXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1561489404-42f13a2f09a2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHxtaW5pbWFsaXN0JTIwY29ycG9yYXRlJTIwZXZlbnQlMjBjb25mZXJlbmNlfGVufDB8fHx8MTc4MzUwNTYxMXww&ixlib=rb-4.1.0&q=85",
  ],
  baby_shower: [
    "https://images.unsplash.com/photo-1644785421448-e1b038f2381e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwyfHxiYWJ5JTIwc2hvd2VyJTIwZGVjb3JhdGlvbiUyMG5ldXRyYWx8ZW58MHx8fHwxNzgzNTA1NjIxfDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1695041713023-c08f364a4ea2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMHBhcGVyJTIwdGV4dHVyZSUyMHdhcm18ZW58MHx8fHwxNzgzNTA1NjIxfDA&ixlib=rb-4.1.0&q=85",
  ],
  anniversary: [
    "https://images.unsplash.com/photo-1612145463153-e97c1774fe2a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBhbm5pdmVyc2FyeSUyMHBhcnR5fGVufDB8fHx8MTc4MzUwNTYyMXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1707831853477-545a84511e57?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhbm5pdmVyc2FyeSUyMHBhcnR5fGVufDB8fHx8MTc4MzUwNTYyMXww&ixlib=rb-4.1.0&q=85",
  ],
};

export const HERO_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1695041713023-c08f364a4ea2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMHBhcGVyJTIwdGV4dHVyZSUyMHdhcm18ZW58MHx8fHwxNzgzNTA1NjIxfDA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1619043518800-7f14be467dca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzaWxrJTIwZmFicmljJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODM1MDU2MjF8MA&ixlib=rb-4.1.0&q=85",
];

// Curated photo library — clip-art / portrait style shots users can drop on canvas.
export const PHOTO_LIBRARY = {
  temple: [
    "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=600&q=80",
    "https://images.unsplash.com/photo-1524492514790-8e5b6bd11a1a?w=600&q=80",
  ],
  south_indian: [
    "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=600&q=80",
    "https://images.unsplash.com/photo-1610030006547-9ce7b8a1a4b6?w=600&q=80",
  ],
  couple: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80",
  ],
  florals: [
    "https://images.unsplash.com/photo-1587556930721-a2e0e7c8de0f?w=600&q=80",
    "https://images.unsplash.com/photo-1416772602849-3e208d0e7f4b?w=600&q=80",
  ],
};

export const FONT_OPTIONS = [
  { id: "cormorant", label: "Cormorant (serif)", value: "'Cormorant Garamond', serif" },
  { id: "playfair", label: "Playfair (serif)", value: "'Playfair Display', serif" },
  { id: "bodoni", label: "Bodoni (serif)", value: "'Bodoni Moda', serif" },
  { id: "outfit", label: "Outfit (sans)", value: "'Outfit', sans-serif" },
  { id: "dancing", label: "Dancing Script", value: "'Dancing Script', cursive" },
  { id: "vibes", label: "Great Vibes", value: "'Great Vibes', cursive" },
];

export const COLOR_SWATCHES = [
  "#D97757", "#C89F59", "#8A6D3B", "#4A6741", "#2C5F5D",
  "#5B4A8C", "#A03E3E", "#1A1A1A", "#F1E9DB", "#FFFFFF",
];

export const ENVELOPE_STYLES = [
  { id: "none", label: "None (open directly)" },
  { id: "classic", label: "Classic Paper" },
  { id: "indian", label: "Shubh Vivah (gold + red)" },
  { id: "modern", label: "Minimal Modern" },
];

export const EFFECT_OPTIONS = [
  { id: "petals", label: "Falling Rose Petals" },
  { id: "flowers", label: "Floating Flowers" },
  { id: "confetti", label: "Confetti Rain" },
  { id: "sparkles", label: "Golden Sparkles" },
  { id: "bells", label: "Temple Bells (visual)" },
];

// Music preset library — SoundHelix public MP3s (no auth needed, generic music)
// plus placeholder for uploads.
export const MUSIC_PRESETS = [
  { id: "none", label: "No music", url: "" },
  { id: "piano", label: "Ambient Piano", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "uplifting", label: "Uplifting", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: "elegant", label: "Elegant Strings", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
  { id: "cinematic", label: "Cinematic", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" },
];

// Preset "starter" templates users can pick from.
export const TEMPLATES = [
  {
    id: "wed-classic",
    event_type: "wedding",
    name: "Classic Ivory",
    preview: BACKGROUND_LIBRARY.wedding[0],
    data: {
      title: "Anna & Ethan",
      subtitle: "Together with their families",
      hosts: "request the honor of your presence",
      date_text: "Saturday, the 14th of June, 2026",
      time_text: "Ceremony at 4:00 in the afternoon",
      venue: "The Rosewood Gardens · Napa Valley, CA",
      rsvp: "Kindly reply by May 1st · rsvp@annaandethan.love",
      message: "Two hearts, one journey — join us as we say I do.",
      background_url: BACKGROUND_LIBRARY.wedding[0],
      accent_color: "#8A6D3B",
      text_color: "#1A1A1A",
      heading_font: "'Cormorant Garamond', serif",
      body_font: "'Outfit', sans-serif",
      overlay_opacity: 0.55,
    },
  },
  {
    id: "wed-silk",
    event_type: "wedding",
    name: "Silk & Blush",
    preview: BACKGROUND_LIBRARY.wedding[2],
    data: {
      title: "Priya & Arjun",
      subtitle: "Save the Date",
      hosts: "with the blessings of our families",
      date_text: "November 22, 2026",
      time_text: "5:30 PM onwards",
      venue: "Taj Falaknuma Palace · Hyderabad",
      rsvp: "RSVP by Oct 15 · +91 98765 43210",
      message: "A celebration of love, laughter, and forever.",
      background_url: BACKGROUND_LIBRARY.wedding[2],
      accent_color: "#A03E3E",
      text_color: "#FAF9F6",
      heading_font: "'Playfair Display', serif",
      body_font: "'Outfit', sans-serif",
      overlay_opacity: 0.45,
      envelope_style: "indian",
      effects: ["petals"],
    },
  },
  {
    id: "bday-joy",
    event_type: "birthday",
    name: "Confetti Joy",
    preview: BACKGROUND_LIBRARY.birthday[0],
    data: {
      title: "Maya turns 8!",
      subtitle: "You're invited",
      hosts: "Come celebrate with us",
      date_text: "Sunday, April 12th",
      time_text: "3:00 – 6:00 PM",
      venue: "42 Willow Lane · Backyard party",
      rsvp: "RSVP: mom@maya-family.com",
      message: "Cake, games and a whole lot of sparkle.",
      background_url: BACKGROUND_LIBRARY.birthday[0],
      accent_color: "#D97757",
      text_color: "#FAF9F6",
      heading_font: "'Playfair Display', serif",
      body_font: "'Outfit', sans-serif",
      overlay_opacity: 0.45,
      envelope_style: "modern",
      effects: ["confetti"],
    },
  },
  {
    id: "bday-adult",
    event_type: "birthday",
    name: "Golden Thirty",
    preview: BACKGROUND_LIBRARY.birthday[1],
    data: {
      title: "Three Zero",
      subtitle: "Julia's 30th Birthday",
      hosts: "Cheers to a new decade",
      date_text: "Friday, September 5th",
      time_text: "8:00 PM till late",
      venue: "The Aurora Rooftop · Downtown",
      rsvp: "Text 555-0142 to confirm",
      message: "Cocktails, dancing and dear friends.",
      background_url: BACKGROUND_LIBRARY.birthday[1],
      accent_color: "#C89F59",
      text_color: "#FAF9F6",
      heading_font: "'Bodoni Moda', serif",
      body_font: "'Outfit', sans-serif",
      overlay_opacity: 0.5,
    },
  },
  {
    id: "baby-neutral",
    event_type: "baby_shower",
    name: "Soft Neutral",
    preview: BACKGROUND_LIBRARY.baby_shower[0],
    data: {
      title: "Baby on the way",
      subtitle: "A shower for Emma",
      hosts: "Please join us to celebrate",
      date_text: "Saturday, March 8th",
      time_text: "11:00 AM Brunch",
      venue: "The Greenhouse · 12 Oak Street",
      rsvp: "RSVP by Feb 20 · emma.shower@gmail.com",
      message: "Little feet are on the way — come sprinkle love.",
      background_url: BACKGROUND_LIBRARY.baby_shower[0],
      accent_color: "#8A6D3B",
      text_color: "#1A1A1A",
      heading_font: "'Cormorant Garamond', serif",
      body_font: "'Outfit', sans-serif",
      overlay_opacity: 0.35,
      effects: ["sparkles"],
    },
  },
  {
    id: "anniv-lux",
    event_type: "anniversary",
    name: "Twenty Five",
    preview: BACKGROUND_LIBRARY.anniversary[0],
    data: {
      title: "25 Years",
      subtitle: "Silver Anniversary",
      hosts: "David & Elena invite you",
      date_text: "Saturday, October 18th, 2026",
      time_text: "7:00 PM Dinner & Dancing",
      venue: "The Grand Ballroom · Hotel Fontaine",
      rsvp: "Regrets only · elena@davidandelena.co",
      message: "A quarter century of love — let's raise a glass.",
      background_url: BACKGROUND_LIBRARY.anniversary[0],
      accent_color: "#C89F59",
      text_color: "#FAF9F6",
      heading_font: "'Bodoni Moda', serif",
      body_font: "'Outfit', sans-serif",
      overlay_opacity: 0.55,
      envelope_style: "classic",
    },
  },
  {
    id: "corp-summit",
    event_type: "corporate",
    name: "Corporate Summit",
    preview: BACKGROUND_LIBRARY.corporate[0],
    data: {
      title: "Vertex Summit 2026",
      subtitle: "Annual Leadership Conference",
      hosts: "Vertex Labs cordially invites you",
      date_text: "March 3–5, 2026",
      time_text: "Doors open 8:30 AM",
      venue: "The Hilton San Francisco · Financial District",
      rsvp: "Register: vertex.co/summit",
      message: "Bold ideas, bolder people. Join the conversation.",
      background_url: BACKGROUND_LIBRARY.corporate[0],
      accent_color: "#2C5F5D",
      text_color: "#FAF9F6",
      heading_font: "'Outfit', sans-serif",
      body_font: "'Outfit', sans-serif",
      overlay_opacity: 0.6,
    },
  },
];

export function templatesForType(type) {
  return TEMPLATES.filter((t) => t.event_type === type);
}

// Build a full file URL usable by <img>/<audio> for a stored file path
export function fileUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("data:") || pathOrUrl.startsWith("http")) return pathOrUrl;
  const backend = process.env.REACT_APP_BACKEND_URL;
  const token = localStorage.getItem("ic_token");
  const qs = token ? `?auth=${encodeURIComponent(token)}` : "";
  return `${backend}/api/files/${pathOrUrl}${qs}`;
}
