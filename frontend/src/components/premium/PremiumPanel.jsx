import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorMessage, uploadFile } from "@/lib/api";
import { EFFECT_OPTIONS, PHOTO_LIBRARY, fileUrl } from "@/lib/templates";
import { THEMES, newEvent } from "@/lib/premium";

const SEALS = [
  { v: "ॐ", label: "ॐ Om" },
  { v: "☪", label: "☪ Crescent" },
  { v: "✝", label: "✝ Cross" },
  { v: "☬", label: "☬ Khanda" },
  { v: "♥", label: "♥ Heart" },
  { v: "❁", label: "❁ Flower" },
];

/** Left-hand controls for `layout: "premium"` invitations. */
export default function PremiumPanel({ data, set, setWebsite, musicPresets }) {
  const w = data.website || {};
  const venue = w.venue || {};
  const events = w.events || [];
  const gallery = w.gallery || [];
  const [uploading, setUploading] = useState(false);
  const [galleryUrl, setGalleryUrl] = useState("");

  const setVenue = (patch) => setWebsite({ venue: { ...venue, ...patch } });
  const setEvents = (list) => setWebsite({ events: list });
  const updateEvent = (id, patch) => setEvents(events.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const moveEvent = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= events.length) return;
    const list = [...events];
    [list[i], list[j]] = [list[j], list[i]];
    setEvents(list);
  };
  const setNames = (patch) => {
    const next = { ...w, ...patch };
    const first = (n) => (n || "").trim().split(/\s+/)[0] || "";
    setWebsite(patch);
    // Keep the dashboard title in step with the couple's names.
    set({ title: [first(next.bride), first(next.groom)].filter(Boolean).join(" & ") || "Our Wedding" });
  };

  const upload = async (file, onDone) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile("photo", file);
      onDone(res.path);
    } catch (err) {
      toast.error(errorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };
  const uploadMany = async (files) => {
    const added = [];
    for (const f of Array.from(files || [])) {
      await upload(f, (path) => added.push(path));
    }
    if (added.length) setWebsite({ gallery: [...gallery, ...added] });
  };

  const uploadMusic = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const res = await uploadFile("audio", file);
      set({ music_url: res.path, music_label: file.name.replace(/\.[^.]+$/, "") });
      toast.success("Music uploaded");
    } catch (err) {
      toast.error(errorMessage(err, "Upload failed"));
    }
  };

  return (
    <Tabs defaultValue="couple" className="w-full">
      <TabsList className="grid w-full grid-cols-5 rounded-full bg-stone-100">
        <TabsTrigger value="couple">Couple</TabsTrigger>
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="venue">Venue</TabsTrigger>
        <TabsTrigger value="gallery">Gallery</TabsTrigger>
        <TabsTrigger value="style">Style</TabsTrigger>
      </TabsList>

      {/* Couple & wording */}
      <TabsContent value="couple" className="mt-6 space-y-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bride"><Input value={w.bride || ""} onChange={(e) => setNames({ bride: e.target.value })} /></Field>
          <Field label="Groom"><Input value={w.groom || ""} onChange={(e) => setNames({ groom: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-[1fr_130px] gap-3">
          <Field label="Opening line"><Input value={w.invocation || ""} onChange={(e) => setWebsite({ invocation: e.target.value })} /></Field>
          <Field label="Seal">
            <Select value={w.seal_symbol || "♥"} onValueChange={(v) => setWebsite({ seal_symbol: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SEALS.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Blessing line"><Textarea rows={2} value={w.blessing_line || ""} onChange={(e) => setWebsite({ blessing_line: e.target.value })} /></Field>
        <Field label="Date line"><Input value={w.date_line || ""} onChange={(e) => setWebsite({ date_line: e.target.value })} placeholder="Sunday · 14 · February · 2027" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Time line"><Input value={w.time_line || ""} onChange={(e) => setWebsite({ time_line: e.target.value })} /></Field>
          <Field label="Extra line"><Input value={w.extra_line || ""} onChange={(e) => setWebsite({ extra_line: e.target.value })} placeholder="e.g. Lagnam" /></Field>
        </div>
        <Field label="Place line"><Input value={w.place_line || ""} onChange={(e) => setWebsite({ place_line: e.target.value })} /></Field>

        <Field label="Main image">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setWebsite({ hero_image: "" })}
              className={`flex h-20 items-center justify-center rounded-lg border-2 text-xs ${!w.hero_image ? "border-[#D97757]" : "border-stone-200"}`}
            >
              Initials
            </button>
            {PHOTO_LIBRARY.deities.map((url) => (
              <button key={url} onClick={() => setWebsite({ hero_image: url })}
                className={`overflow-hidden rounded-lg border-2 ${w.hero_image === url ? "border-[#D97757]" : "border-stone-200"}`}>
                <img src={url} alt="" className="h-20 w-full object-cover object-top" />
              </button>
            ))}
          </div>
          <UploadButton label="Upload your own image" disabled={uploading} onFile={(f) => upload(f, (path) => setWebsite({ hero_image: path }))} />
        </Field>

        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div className="chip-label mb-2">Story section</div>
          <Field label="Heading"><Input value={w.story_title || ""} onChange={(e) => setWebsite({ story_title: e.target.value })} /></Field>
          <Field label="Quote"><Input value={w.story_quote || ""} onChange={(e) => setWebsite({ story_quote: e.target.value })} /></Field>
          <Field label="Text"><Textarea rows={3} value={w.story_text || ""} onChange={(e) => setWebsite({ story_text: e.target.value })} /></Field>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div className="chip-label mb-2">Closing blessings</div>
          <Field label="Message"><Textarea rows={2} value={w.blessings_text || ""} onChange={(e) => setWebsite({ blessings_text: e.target.value })} /></Field>
          <Field label="Family line"><Input value={w.family || ""} onChange={(e) => setWebsite({ family: e.target.value })} /></Field>
          <Field label="Last line"><Input value={w.closing || ""} onChange={(e) => setWebsite({ closing: e.target.value })} /></Field>
        </div>
      </TabsContent>

      {/* Events */}
      <TabsContent value="events" className="mt-6 space-y-3">
        <label className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5">
          <span className="text-sm">Guests tap to reveal each event</span>
          <Switch checked={!!w.reveal_events} onCheckedChange={(v) => setWebsite({ reveal_events: v })} />
        </label>
        {events.map((e, i) => (
          <div key={e.id} className="rounded-lg border border-stone-200 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Input value={e.name} onChange={(ev) => updateEvent(e.id, { name: ev.target.value })} className="font-medium" />
              <button onClick={() => moveEvent(i, -1)} className="rounded p-1.5 hover:bg-stone-100" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
              <button onClick={() => moveEvent(i, 1)} className="rounded p-1.5 hover:bg-stone-100" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
              <button onClick={() => setEvents(events.filter((x) => x.id !== e.id))} className="rounded p-1.5 text-red-600 hover:bg-red-50" aria-label="Remove event"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input value={e.date} onChange={(ev) => updateEvent(e.id, { date: ev.target.value })} placeholder="Date" />
              <Input value={e.time} onChange={(ev) => updateEvent(e.id, { time: ev.target.value })} placeholder="Time" />
            </div>
            <Input className="mt-2" value={e.venue} onChange={(ev) => updateEvent(e.id, { venue: ev.target.value })} placeholder="Venue" />
            <Input className="mt-2" value={e.note} onChange={(ev) => updateEvent(e.id, { note: ev.target.value })} placeholder="Note (dress code, meals…)" />
          </div>
        ))}
        <Button variant="outline" className="w-full rounded-full" onClick={() => setEvents([...events, newEvent()])}>
          <Plus className="mr-1.5 h-4 w-4" /> Add event
        </Button>
      </TabsContent>

      {/* Venue & countdown */}
      <TabsContent value="venue" className="mt-6 space-y-1">
        <Field label="Main ceremony date & time (for countdown and calendar)">
          <Input type="datetime-local" value={w.countdown_at || ""} onChange={(e) => setWebsite({ countdown_at: e.target.value })} />
        </Field>
        <Field label="Section heading"><Input value={venue.title || ""} onChange={(e) => setVenue({ title: e.target.value })} /></Field>
        <Field label="Venue name"><Input value={venue.name || ""} onChange={(e) => setVenue({ name: e.target.value })} /></Field>
        <Field label="Address"><Textarea rows={2} value={venue.address || ""} onChange={(e) => setVenue({ address: e.target.value })} /></Field>
        <Field label="Map search (what to look up on Google Maps)">
          <Input value={venue.map_query || ""} onChange={(e) => setVenue({ map_query: e.target.value })} placeholder="Defaults to name + address" />
        </Field>
        <Field label="Venue photo">
          {venue.photo && <img src={fileUrl(venue.photo)} alt="" className="mb-2 h-28 w-full rounded-lg object-cover" />}
          <div className="flex gap-2">
            <UploadButton label="Upload photo" disabled={uploading} onFile={(f) => upload(f, (path) => setVenue({ photo: path }))} />
            {venue.photo && <Button variant="outline" size="sm" className="mt-2 rounded-full" onClick={() => setVenue({ photo: "" })}>Remove</Button>}
          </div>
        </Field>
      </TabsContent>

      {/* Gallery */}
      <TabsContent value="gallery" className="mt-6 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {gallery.map((src, i) => (
            <div key={`${src}-${i}`} className="group relative overflow-hidden rounded-lg">
              <img src={fileUrl(src)} alt="" className="aspect-square w-full object-cover" />
              <button
                onClick={() => setWebsite({ gallery: gallery.filter((_, j) => j !== i) })}
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow"
                aria-label="Remove photo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <UploadButton label={uploading ? "Uploading…" : "Upload photos"} multiple disabled={uploading} onFiles={uploadMany} />
        <div className="flex gap-2">
          <Input value={galleryUrl} onChange={(e) => setGalleryUrl(e.target.value)} placeholder="…or paste an image link" />
          <Button variant="outline" onClick={() => { if (galleryUrl.trim()) { setWebsite({ gallery: [...gallery, galleryUrl.trim()] }); setGalleryUrl(""); } }}>Add</Button>
        </div>
      </TabsContent>

      {/* Style: theme, music, effects */}
      <TabsContent value="style" className="mt-6 space-y-5">
        <Field label="Colour theme">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(THEMES).map(([key, t]) => (
              <button key={key} onClick={() => set({ theme: key })}
                className={`rounded-lg border-2 p-2 text-left text-xs ${data.theme === key ? "border-[#1A1A1A]" : "border-stone-200"}`}>
                <div className="mb-1.5 flex gap-1">
                  {[t.primary, t.gold, t.paper].map((c) => <span key={c} className="h-5 w-5 rounded-full border border-stone-200" style={{ background: c }} />)}
                </div>
                {t.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Music (starts when guests open the seal)">
          <Select
            value={musicPresets.find((m) => m.url === data.music_url)?.id || (data.music_url ? "upload" : "none")}
            onValueChange={(id) => {
              const p = musicPresets.find((m) => m.id === id);
              if (p) set({ music_url: p.url, music_label: p.label });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {musicPresets.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
              {data.music_url && !musicPresets.find((m) => m.url === data.music_url) && (
                <SelectItem value="upload">Uploaded: {data.music_label}</SelectItem>
              )}
            </SelectContent>
          </Select>
          <label className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-stone-300 py-2.5 text-xs text-stone-600 hover:border-[#D97757] hover:text-[#D97757]">
            <Upload className="h-3.5 w-3.5" /> Upload mp3/wav (max 12MB)
            <input type="file" accept="audio/*" className="hidden" onChange={uploadMusic} />
          </label>
          {data.music_url && <audio key={data.music_url} src={fileUrl(data.music_url)} controls preload="none" className="mt-2 w-full" />}
        </Field>
        <Field label="Falling effects">
          <div className="space-y-2">
            {EFFECT_OPTIONS.map((e) => (
              <label key={e.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 px-3 py-2">
                <span className="text-sm">{e.label}</span>
                <Checkbox
                  checked={(data.effects || []).includes(e.id)}
                  onCheckedChange={(v) => {
                    const s = new Set(data.effects || []);
                    if (v) s.add(e.id); else s.delete(e.id);
                    set({ effects: Array.from(s) });
                  }}
                />
              </label>
            ))}
          </div>
        </Field>
      </TabsContent>
    </Tabs>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <Label className="chip-label">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function UploadButton({ label, onFile, onFiles, multiple = false, disabled }) {
  return (
    <label className={`mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-stone-300 py-2.5 text-xs text-stone-600 hover:border-[#D97757] hover:text-[#D97757] ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <Upload className="h-3.5 w-3.5" /> {label}
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          // Copy before clearing the input: some browsers empty the live FileList.
          const files = Array.from(e.target.files || []);
          if (onFiles) onFiles(files);
          else onFile?.(files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}
