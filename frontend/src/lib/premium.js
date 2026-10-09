// Premium wedding websites: one multi-section design ("Sacred Vows") in three
// colour themes. An invitation with `layout: "premium"` is rendered by
// components/premium/PremiumSite.jsx from its `website` object.

export const THEMES = {
  maroon: {
    label: "Maroon & Gold",
    primary: "#8E1B2C",
    primaryDark: "#5A0E1A",
    gold: "#C9A24A",
    goldLight: "#F2D488",
    paper: "#FAF3E6",
    ink: "#4A1D1F",
  },
  emerald: {
    label: "Emerald & Gold",
    primary: "#0F5A45",
    primaryDark: "#06372A",
    gold: "#C9A24A",
    goldLight: "#F2D488",
    paper: "#F3F4EC",
    ink: "#16352B",
  },
  rose: {
    label: "Rose Gold",
    primary: "#A04C64",
    primaryDark: "#64283A",
    gold: "#C99A7A",
    goldLight: "#F6D9C9",
    paper: "#FDF5F2",
    ink: "#4D2632",
  },
};

export const themeOf = (key) => THEMES[key] || THEMES.maroon;

const ornate = (name) => `${process.env.PUBLIC_URL || ""}/backgrounds/${name}.svg`;
const unsplash = (id, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;
const SHIV_PARVATI =
  "https://upload.wikimedia.org/wikipedia/commons/1/1d/An_Oleograph_of_Shiva%2C_Parvati_and_Nandi_by_Raja_Ravi_Varma.jpg";

// People-free décor shots for the sample galleries.
const DECOR_GALLERY = [
  unsplash("1455659817273-f96807779a8a", 600),
  unsplash("1605100804763-247f67b3557e", 600),
  unsplash("1522673607200-164d1b6ce486", 600),
  unsplash("1710587385270-08f30d66bf31", 600),
  unsplash("1490750967868-88aa4486c946", 600),
  unsplash("1519225421980-715cb0215aed", 600),
];

let eventSeq = 0;
export const newEvent = (patch = {}) => ({
  id: `ev${Date.now().toString(36)}${(eventSeq++).toString(36)}`,
  name: "New event",
  date: "",
  time: "",
  venue: "",
  note: "",
  ...patch,
});

// Shared card-level fields so dashboards / the classic editor still have sensible values.
const cardBase = (title, bg) => ({
  title,
  subtitle: "Wedding website",
  hosts: "",
  date_text: "",
  time_text: "",
  venue: "",
  rsvp: "",
  message: "",
  background_url: bg,
  accent_color: "#C9A24A",
  text_color: "#FAF9F6",
  heading_font: "'Cormorant Garamond', serif",
  body_font: "'Outfit', sans-serif",
  overlay_opacity: 0,
  layout: "premium",
});

export const PREMIUM_TEMPLATES = [
  {
    id: "premium-sacred-maroon",
    event_type: "wedding",
    premium: true,
    style: "Wedding website",
    name: "Sacred Vows · Maroon & Gold",
    theme: "maroon",
    data: {
      ...cardBase("Ananya & Karthik", ornate("ayodhya-saffron")),
      theme: "maroon",
      effects: ["petals"],
      website: {
        seal_symbol: "ॐ",
        invocation: "Shubha Vivaha Mahotsavam",
        hero_image: SHIV_PARVATI,
        blessing_line: "With the blessings of the Almighty and our elders, we joyfully invite you to the wedding of",
        bride: "Ananya Reddy",
        groom: "Karthik Varma",
        date_line: "Sunday · 14 · February · 2027",
        time_line: "Muhurtham · 9:30 AM to 10:30 AM",
        extra_line: "Meena Lagnam",
        place_line: "at the sacred hills of Tirumala",
        story_title: "A Sacred Union",
        story_quote: "Two souls, two families, one blessed journey.",
        story_text: "With hearts full of gratitude and joy, we humbly seek your gracious presence and blessings as Ananya and Karthik take their sacred vows.",
        reveal_events: true,
        events: [
          newEvent({ name: "Haldi & Pelli Kuturu", date: "Friday, 12 Feb 2027", time: "8:00 AM", venue: "Family residence, Tirupati", note: "Wear yellow!" }),
          newEvent({ name: "Mehendi & Sangeet", date: "Friday, 12 Feb 2027", time: "6:00 PM onwards", venue: "Hotel Bliss lawns, Tirupati", note: "Music, dance and henna." }),
          newEvent({ name: "Muhurtham", date: "Sunday, 14 Feb 2027", time: "9:30 – 10:30 AM", venue: "Sri Venkateswara Kalyana Vedika, Tirumala", note: "Breakfast 8:00 AM · Lunch 12:30 PM" }),
          newEvent({ name: "Reception", date: "Sunday, 14 Feb 2027", time: "7:00 PM onwards", venue: "Fortune Select Grand Ridge, Tirupati", note: "Dinner will be served." }),
        ],
        venue: {
          title: "Blessings at Tirumala",
          name: "Sri Venkateswara Kalyana Vedika",
          address: "Tirumala, Andhra Pradesh 517504",
          photo: unsplash("1582510003544-4d00b7f74220"),
          map_query: "Sri Venkateswara Kalyana Vedika, Tirumala",
        },
        countdown_at: "2027-02-14T09:30",
        gallery: DECOR_GALLERY,
        blessings_text: "Your presence is our most cherished blessing. May your love and good wishes light the path of this new journey.",
        family: "With love, the Reddy & Varma families",
        closing: "Sri Venkateswara Prasannam",
      },
    },
  },
  {
    id: "premium-sacred-emerald",
    event_type: "wedding",
    premium: true,
    style: "Wedding website",
    name: "Sacred Vows · Emerald & Gold",
    theme: "emerald",
    data: {
      ...cardBase("Ayesha & Imran", ornate("nikah-emerald")),
      theme: "emerald",
      effects: ["sparkles"],
      website: {
        seal_symbol: "☪",
        invocation: "Bismillah ir-Rahman ir-Rahim",
        hero_image: "",
        blessing_line: "With the grace of Allah, we request the honour of your presence at the Nikah of",
        bride: "Ayesha Siddiqui",
        groom: "Imran Qureshi",
        date_line: "Friday · 15 · October · 2027",
        time_line: "Nikah after Asr prayer",
        extra_line: "Walima dinner to follow",
        place_line: "Banjara Hills, Hyderabad",
        story_title: "A Blessed Union",
        story_quote: "And among His signs is that He created for you mates, that you may find tranquillity in them.",
        story_text: "Our families joyfully invite you to celebrate the Nikah of Ayesha and Imran. Your duas and presence mean the world to us.",
        reveal_events: false,
        events: [
          newEvent({ name: "Mehndi", date: "Wednesday, 13 Oct 2027", time: "7:00 PM", venue: "Bride's residence, Tolichowki", note: "Ladies' evening with music." }),
          newEvent({ name: "Nikah", date: "Friday, 15 Oct 2027", time: "After Asr", venue: "Taj Krishna, Banjara Hills", note: "" }),
          newEvent({ name: "Walima", date: "Saturday, 16 Oct 2027", time: "8:00 PM", venue: "Taj Krishna, Banjara Hills", note: "Dinner will be served." }),
        ],
        venue: {
          title: "Join Us At",
          name: "Taj Krishna",
          address: "Road No. 1, Banjara Hills, Hyderabad 500034",
          photo: unsplash("1519167758481-83f550bb49b3"),
          map_query: "Taj Krishna, Banjara Hills, Hyderabad",
        },
        countdown_at: "2027-10-15T16:30",
        gallery: DECOR_GALLERY,
        blessings_text: "Please keep the couple in your duas as they begin this beautiful journey together.",
        family: "With love, the Siddiqui & Qureshi families",
        closing: "JazakAllah Khair",
      },
    },
  },
  {
    id: "premium-sacred-rose",
    event_type: "wedding",
    premium: true,
    style: "Wedding website",
    name: "Sacred Vows · Rose Gold",
    theme: "rose",
    data: {
      ...cardBase("Sara & Daniel", ornate("lotus-rani")),
      theme: "rose",
      effects: ["petals"],
      website: {
        seal_symbol: "♥",
        invocation: "Together with their families",
        hero_image: "",
        blessing_line: "We joyfully invite you to celebrate the wedding of",
        bride: "Sara Thomas",
        groom: "Daniel Mathew",
        date_line: "Saturday · 22 · May · 2027",
        time_line: "Ceremony at 4:00 PM",
        extra_line: "Reception to follow",
        place_line: "by the lake in Kochi",
        story_title: "Our Story",
        story_quote: "Whatever our souls are made of, his and mine are the same.",
        story_text: "From a chance meeting to a lifetime together — we can't wait to celebrate this day with the people we love most.",
        reveal_events: false,
        events: [
          newEvent({ name: "Ceremony", date: "Saturday, 22 May 2027", time: "4:00 PM", venue: "Lakeside Gardens, Kochi", note: "Please be seated by 3:45 PM." }),
          newEvent({ name: "Cocktails", date: "Saturday, 22 May 2027", time: "5:30 PM", venue: "The Lawn Terrace", note: "" }),
          newEvent({ name: "Reception & Dinner", date: "Saturday, 22 May 2027", time: "7:00 PM", venue: "The Grand Hall", note: "Dress code: Garden formal." }),
        ],
        venue: {
          title: "Where We Celebrate",
          name: "Lakeside Gardens",
          address: "Marine Drive, Kochi, Kerala 682031",
          photo: unsplash("1522673607200-164d1b6ce486"),
          map_query: "Marine Drive, Kochi",
        },
        countdown_at: "2027-05-22T16:00",
        gallery: DECOR_GALLERY,
        blessings_text: "Thank you for being part of our story. Your love and support mean everything to us.",
        family: "With love, the Thomas & Mathew families",
        closing: "Forever begins today",
      },
    },
  },
];
