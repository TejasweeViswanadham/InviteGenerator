import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth.jsx";
import { rememberLastEdit } from "@/lib/resume";
import Nav from "@/components/Nav";
import api, { errorMessage, uploadFile } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import InviteCanvas from "@/components/InviteCanvas";
import EffectsLayer from "@/components/EffectsLayer";
import PremiumSite from "@/components/premium/PremiumSite";
import PremiumPanel from "@/components/premium/PremiumPanel";
import {
  BACKGROUND_LIBRARY, FONT_OPTIONS, COLOR_SWATCHES, EVENT_TYPES,
  ENVELOPE_STYLES, EFFECT_OPTIONS, MUSIC_PRESETS as FALLBACK_PRESETS, PHOTO_LIBRARY, fileUrl, shareUrl,
} from "@/lib/templates";
import { toPng, toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import {
  Sparkles, Download, Save, Share2, Loader2, Wand2, Trash2, Upload,
  Users, Music, Eye, RotateCcw, ArrowLeft, Image as ImageIcon,
} from "lucide-react";

const DEBOUNCE = 500;

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const saveTimer = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [musicPresets, setMusicPresets] = useState([]);
  const [aiText, setAiText] = useState({ loading: false, vibe: "elegant", details: "" });

  // Keep latest data in a ref for flush-save on unmount / share.
  const latestData = useRef(null);
  useEffect(() => { latestData.current = data; }, [data]);

  const { user } = useAuth();
  useEffect(() => {
    if (data?.id) rememberLastEdit(user?.id, data);
  }, [user?.id, data?.id, data?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      try {
        const [invRes, presetsRes] = await Promise.all([
          api.get(`/invitations/${id}`),
          api.get("/music-presets").catch(() => ({ data: [] })),
        ]);
        setData(invRes.data);
        // Backend presets → convert to frontend shape with backend-served URLs.
        // Add "No music" option at the top.
        const backendPresets = (presetsRes.data || []).map((p) => ({
          id: p.id,
          label: p.label,
          category: p.category,
          url: p.storage_path,
        }));
        const presets = [{ id: "none", label: "No music", url: "" }, ...backendPresets];
        setMusicPresets(presets.length > 1 ? presets : FALLBACK_PRESETS);
      } catch {
        toast.error("Invitation not found");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (!data || loading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(false), DEBOUNCE);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
    // eslint-disable-next-line
  }, [data]);

  // Flush save on unmount (route change / tab close) using sendBeacon-like fallback.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const snap = latestData.current;
      if (!snap) return;
      const payload = { ...snap };
      ["id", "user_id", "share_id", "created_at", "updated_at"].forEach((k) => delete payload[k]);
      // Best-effort synchronous-ish save with keepalive fetch
      try {
        const token = localStorage.getItem("ic_token");
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/invitations/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };
    // eslint-disable-next-line
  }, [id]);

  const set = (patch) => setData((prev) => ({ ...prev, ...patch }));
  const setWebsite = (patch) => setData((prev) => ({ ...prev, website: { ...(prev.website || {}), ...patch } }));
  // Bumping this remounts the premium preview so the sealed envelope shows again.
  const [previewKey, setPreviewKey] = useState(0);

  const save = async (announce = true) => {
    if (!data) return;
    setSaving(true);
    try {
      const payload = { ...data };
      ["id", "user_id", "share_id", "created_at", "updated_at"].forEach((k) => delete payload[k]);
      await api.patch(`/invitations/${id}`, payload);
      if (announce) toast.success("Saved");
    } catch {
      if (announce) toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const backgrounds = useMemo(() => BACKGROUND_LIBRARY[data?.event_type] || [], [data?.event_type]);

  // ---------------- Photos ----------------
  const addPhotoFromLibrary = (url) => {
    const photo = {
      id: Math.random().toString(36).slice(2, 8),
      url,
      x_pct: 50,
      y_pct: 25,
      w_pct: 26,
      shape: "circle",
      rotation: 0,
      z_index: (data.photos?.length || 0) + 1,
    };
    set({ photos: [...(data.photos || []), photo] });
    setSelectedPhotoId(photo.id);
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const res = await uploadFile("photo", file);
      addPhotoFromLibrary(res.path);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(errorMessage(err, "Upload failed"));
    }
  };

  const updatePhoto = (patched) => {
    set({
      photos: (data.photos || []).map((p) => (p.id === patched.id ? patched : p)),
    });
  };
  const deletePhoto = (pid) => {
    set({ photos: (data.photos || []).filter((p) => p.id !== pid) });
    if (selectedPhotoId === pid) setSelectedPhotoId(null);
  };
  const selectedPhoto = (data?.photos || []).find((p) => p.id === selectedPhotoId);

  // ---------------- Music ----------------
  const setMusic = (label, url) => set({ music_url: url, music_label: label });
  const uploadMusic = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const res = await uploadFile("audio", file);
      setMusic(file.name.replace(/\.[^.]+$/, ""), res.path);
      toast.success("Music uploaded");
    } catch (err) {
      toast.error(errorMessage(err, "Upload failed"));
    }
  };

  // ---------------- AI ----------------
  const generateText = async () => {
    setAiText((p) => ({ ...p, loading: true }));
    try {
      const { data: out } = await api.post("/ai/generate-text", {
        event_type: data.event_type, vibe: aiText.vibe, details: aiText.details,
      });
      const patch = {};
      if (out.title) patch.title = out.title;
      if (out.subtitle) patch.subtitle = out.subtitle;
      if (out.message) patch.message = out.message;
      set(patch);
      toast.success("AI copy applied");
    } catch (e) {
      toast.error(errorMessage(e, "AI text failed"));
    } finally {
      setAiText((p) => ({ ...p, loading: false }));
    }
  };

  // ---------------- Export ----------------
  const exportPng = async () => {
    try {
      const url = await toPng(canvasRef.current, { pixelRatio: 2, cacheBust: true });
      downloadDataUrl(url, `${safeName(data.title)}.png`);
    } catch { toast.error("PNG export failed"); }
  };
  const exportJpg = async () => {
    try {
      const url = await toJpeg(canvasRef.current, { pixelRatio: 2, cacheBust: true, quality: 0.95 });
      downloadDataUrl(url, `${safeName(data.title)}.jpg`);
    } catch { toast.error("JPG export failed"); }
  };
  const exportPdf = async () => {
    try {
      const url = await toPng(canvasRef.current, { pixelRatio: 2, cacheBust: true });
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [600, 800] });
      pdf.addImage(url, "PNG", 0, 0, 600, 800);
      pdf.save(`${safeName(data.title)}.pdf`);
    } catch { toast.error("PDF export failed"); }
  };
  const flushSave = async () => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    await save(false);
  };
  const copyShareLink = async () => {
    // Flush pending save first so guests see the latest content.
    await flushSave();
    const url = shareUrl(data.share_id);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch {
      window.prompt("Copy this URL:", url);
    }
  };
  // Envelope, music and scratch-reveal only play on the guest page, so let the
  // owner open it. The window is opened before the save so popup blockers allow it.
  const previewAsGuest = async () => {
    const win = window.open("", "_blank");
    await flushSave();
    // ?preview tells the guest page to show a "Back to editor" button (owner only).
    const url = `${shareUrl(data.share_id)}?preview=${id}`;
    if (win) win.location.href = url;
    else window.location.href = url;
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <Nav />
        <div className="mx-auto max-w-7xl px-10 py-16 text-sm text-stone-500">Loading editor…</div>
      </div>
    );
  }

  const isPremium = data.layout === "premium";

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Nav />

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[460px_1fr]">
        {/* LEFT — controls */}
        <aside className="rounded-2xl border border-stone-200 bg-white p-6" data-testid="editor-controls">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Link to="/dashboard" className="mb-2 inline-flex items-center gap-1 text-xs text-stone-500 hover:text-[#D97757]" data-testid="editor-back-btn">
                <ArrowLeft className="h-3.5 w-3.5" /> My invitations
              </Link>
              <span className="chip-label block">Editor</span>
              <div className="font-display text-2xl truncate max-w-[280px]">{data.title || "Untitled"}</div>
            </div>
            <div className="text-xs text-stone-500">{saving ? "Saving…" : "Auto-saved"}</div>
          </div>

          {isPremium ? (
            <PremiumPanel data={data} set={set} setWebsite={setWebsite} musicPresets={musicPresets} />
          ) : (
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-5 rounded-full bg-stone-100">
              <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
              <TabsTrigger value="design" data-testid="tab-design">Design</TabsTrigger>
              <TabsTrigger value="media" data-testid="tab-media">Media</TabsTrigger>
              <TabsTrigger value="fx" data-testid="tab-fx">Effects</TabsTrigger>
              <TabsTrigger value="ai" data-testid="tab-ai">AI</TabsTrigger>
            </TabsList>

            {/* Content */}
            <TabsContent value="content" className="mt-6 space-y-4">
              <Field label="Event type">
                <Select value={data.event_type} onValueChange={(v) => set({ event_type: v })}>
                  <SelectTrigger data-testid="input-event-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Title"><Input value={data.title} onChange={(e) => set({ title: e.target.value })} data-testid="input-title" /></Field>
              <Field label="Subtitle"><Input value={data.subtitle} onChange={(e) => set({ subtitle: e.target.value })} data-testid="input-subtitle" /></Field>
              <Field label="Hosts / eyebrow"><Input value={data.hosts} onChange={(e) => set({ hosts: e.target.value })} data-testid="input-hosts" /></Field>
              <Field label="Message"><Textarea rows={3} value={data.message} onChange={(e) => set({ message: e.target.value })} data-testid="input-message" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date"><Input value={data.date_text} onChange={(e) => set({ date_text: e.target.value })} data-testid="input-date" /></Field>
                <Field label="Time"><Input value={data.time_text} onChange={(e) => set({ time_text: e.target.value })} data-testid="input-time" /></Field>
              </div>
              <Field label="Venue"><Input value={data.venue} onChange={(e) => set({ venue: e.target.value })} data-testid="input-venue" /></Field>
              <Field label="RSVP"><Input value={data.rsvp} onChange={(e) => set({ rsvp: e.target.value })} data-testid="input-rsvp" /></Field>

              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div className="chip-label mb-2 flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Guests & RSVP</div>
                <p className="text-xs text-stone-600 mb-3">Manage guest list, send invites and view analytics on a dedicated page.</p>
                <Link to={`/invite/${id}/guests`}>
                  <Button variant="outline" className="w-full rounded-full" data-testid="editor-open-guests-btn">
                    Open guests dashboard
                  </Button>
                </Link>
              </div>
            </TabsContent>

            {/* Design */}
            <TabsContent value="design" className="mt-6 space-y-5">
              <Field label="Heading font">
                <Select value={data.heading_font} onValueChange={(v) => set({ heading_font: v })}>
                  <SelectTrigger data-testid="input-heading-font"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.id} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Body font">
                <Select value={data.body_font} onValueChange={(v) => set({ body_font: v })}>
                  <SelectTrigger data-testid="input-body-font"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.id} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Accent color">
                <ColorPicker value={data.accent_color} onChange={(c) => set({ accent_color: c })} testid="input-accent" />
              </Field>
              <Field label="Text color">
                <ColorPicker value={data.text_color} onChange={(c) => set({ text_color: c })} testid="input-text-color" />
              </Field>

              <Field label={`Background overlay: ${Math.round(data.overlay_opacity * 100)}%`}>
                <Slider value={[data.overlay_opacity]} onValueChange={(v) => set({ overlay_opacity: v[0] })} min={0} max={0.85} step={0.05} data-testid="input-overlay" />
              </Field>

              <Field label="Envelope style (public view)">
                <Select value={data.envelope_style || "none"} onValueChange={(v) => set({ envelope_style: v })}>
                  <SelectTrigger data-testid="input-envelope"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENVELOPE_STYLES.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <GuestPreviewHint onPreview={previewAsGuest} what="The envelope opens" />
              </Field>
            </TabsContent>

            {/* Media (background + photos + music) */}
            <TabsContent value="media" className="mt-6 space-y-6">
              {/* Background */}
              <section>
                <div className="chip-label mb-3 flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" /> Background</div>
                <div className="grid grid-cols-3 gap-2">
                  {backgrounds.map((url) => (
                    <button key={url}
                      onClick={() => set({ background_url: url, background_data: "" })}
                      className={`overflow-hidden rounded-lg border-2 smooth ${data.background_url === url ? "border-[#D97757]" : "border-transparent"}`}
                      data-testid="bg-preset-btn">
                      <img src={url} alt="" className="h-20 w-full object-cover" />
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full rounded-full"
                  onClick={() => set({ background_url: "", background_data: "" })} data-testid="bg-clear-btn">
                  Clear background
                </Button>
              </section>

              {/* Photos */}
              <section>
                <div className="chip-label mb-3 flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" /> Photos on canvas</div>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(PHOTO_LIBRARY).flatMap(([, urls]) =>
                    urls.map((url) => (
                      <button key={url} onClick={() => addPhotoFromLibrary(url)}
                        className="overflow-hidden rounded-lg border border-stone-200 smooth hover:border-[#D97757]"
                        data-testid="photo-lib-btn">
                        <img src={url} alt="" className="h-16 w-full object-cover" />
                      </button>
                    ))
                  )}
                </div>
                <label className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-stone-300 py-3 text-xs text-stone-600 hover:border-[#D97757] hover:text-[#D97757] smooth" data-testid="photo-upload-label">
                  <Upload className="h-3.5 w-3.5" /> Upload your photo (jpg/png · max 6MB)
                  <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} data-testid="photo-upload-input" />
                </label>

                {selectedPhoto && (
                  <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="chip-label">Selected photo</div>
                      <button onClick={() => deletePhoto(selectedPhoto.id)} className="text-xs text-red-600 hover:underline" data-testid="photo-delete-btn">
                        <Trash2 className="mr-1 inline h-3 w-3" /> Remove
                      </button>
                    </div>
                    <Field label={`Size: ${Math.round(selectedPhoto.w_pct)}%`}>
                      <Slider value={[selectedPhoto.w_pct]} onValueChange={(v) => updatePhoto({ ...selectedPhoto, w_pct: v[0] })} min={10} max={80} step={1} data-testid="photo-size-slider" />
                    </Field>
                    <Field label={`Rotation: ${Math.round(selectedPhoto.rotation)}°`}>
                      <Slider value={[selectedPhoto.rotation]} onValueChange={(v) => updatePhoto({ ...selectedPhoto, rotation: v[0] })} min={-45} max={45} step={1} data-testid="photo-rot-slider" />
                    </Field>
                    <Field label="Shape">
                      <Select value={selectedPhoto.shape} onValueChange={(v) => updatePhoto({ ...selectedPhoto, shape: v })}>
                        <SelectTrigger data-testid="photo-shape"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="circle">Circle</SelectItem>
                          <SelectItem value="rounded">Rounded square</SelectItem>
                          <SelectItem value="rect">Rectangle</SelectItem>
                          <SelectItem value="arch">Arch (portrait)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                )}
              </section>

              {/* Music */}
              <section>
                <div className="chip-label mb-3 flex items-center gap-2"><Music className="h-3.5 w-3.5" /> Music (public view)</div>
                <Field label="Preset (self-hosted)">
                  <Select
                    value={musicPresets.find((m) => m.url === data.music_url)?.id || (data.music_url ? "upload" : "none")}
                    onValueChange={(id) => {
                      const preset = musicPresets.find((m) => m.id === id);
                      if (preset) setMusic(preset.label, preset.url);
                    }}
                  >
                    <SelectTrigger data-testid="music-preset"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {musicPresets.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}{m.category === "indian" ? " · 🕉" : ""}
                        </SelectItem>
                      ))}
                      {data.music_url && !musicPresets.find((m) => m.url === data.music_url) && (
                        <SelectItem value="upload">Uploaded: {data.music_label}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </Field>
                <label className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-stone-300 py-2.5 text-xs text-stone-600 hover:border-[#D97757] hover:text-[#D97757] smooth" data-testid="music-upload-label">
                  <Upload className="h-3.5 w-3.5" /> Upload mp3/wav (max 12MB)
                  <input type="file" accept="audio/*" className="hidden" onChange={uploadMusic} data-testid="music-upload-input" />
                </label>
                {data.music_url && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                    <span className="text-xs text-stone-600 truncate max-w-[220px]">{data.music_label || "Music"}</span>
                    <button onClick={() => setMusic("", "")} className="text-xs text-red-600 hover:underline" data-testid="music-clear-btn">Clear</button>
                  </div>
                )}
                {data.music_url && (
                  <audio key={data.music_url} src={fileUrl(data.music_url)} controls preload="none" className="mt-2 w-full" data-testid="music-preview" />
                )}
              </section>
            </TabsContent>

            {/* Effects */}
            <TabsContent value="fx" className="mt-6 space-y-5">
              <div>
                <div className="chip-label mb-1">Falling effects</div>
                <p className="mb-3 text-xs text-stone-500">Shown over the live preview, and across the whole page for guests.</p>
                <div className="space-y-2">
                  {EFFECT_OPTIONS.map((e) => {
                    const active = (data.effects || []).includes(e.id);
                    return (
                      <label key={e.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5 hover:border-stone-400 smooth" data-testid={`effect-${e.id}`}>
                        <span className="text-sm">{e.label}</span>
                        <Checkbox
                          checked={active}
                          onCheckedChange={(v) => {
                            const set0 = new Set(data.effects || []);
                            if (v) set0.add(e.id); else set0.delete(e.id);
                            set({ effects: Array.from(set0) });
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="chip-label">Scratch to reveal</div>
                    <p className="text-xs text-stone-600 mt-1">Guests scratch a golden overlay to reveal the invite.</p>
                  </div>
                  <Switch
                    checked={!!data.scratch_reveal}
                    onCheckedChange={(v) => set({ scratch_reveal: v })}
                    data-testid="scratch-toggle"
                  />
                </div>
                <GuestPreviewHint onPreview={previewAsGuest} what="Scratching" />
              </div>
            </TabsContent>

            {/* AI */}
            <TabsContent value="ai" className="mt-6 space-y-6">
              <div className="rounded-xl border border-stone-200 p-4">
                <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#D97757]" /><div className="chip-label">AI copywriter</div></div>
                <Field label="Vibe">
                  <Select value={aiText.vibe} onValueChange={(v) => setAiText((p) => ({ ...p, vibe: v }))}>
                    <SelectTrigger data-testid="ai-vibe"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["elegant", "playful", "romantic", "formal", "modern", "whimsical"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Extra context">
                  <Textarea rows={2} value={aiText.details} onChange={(e) => setAiText((p) => ({ ...p, details: e.target.value }))} data-testid="ai-text-details" />
                </Field>
                <Button onClick={generateText} disabled={aiText.loading} className="w-full rounded-full bg-[#1A1A1A] text-white hover:bg-[#D97757]" data-testid="ai-generate-text-btn">
                  {aiText.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate copy
                </Button>
                <p className="mt-2 text-xs text-stone-500">Writes a title, subtitle and message with Claude, replacing the current text.</p>
              </div>

            </TabsContent>
          </Tabs>
          )}
        </aside>

        {/* RIGHT — preview */}
        <main className="flex flex-col items-center">
          <div className="mb-6 flex w-full items-center justify-between">
            <span className="chip-label">{isPremium ? "Live preview · phone view" : "Live preview · click a photo to select"}</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => save(true)} className="rounded-full" data-testid="editor-save-btn">
                <Save className="mr-1.5 h-4 w-4" /> Save
              </Button>
              <Button variant="ghost" size="sm" onClick={previewAsGuest} className="rounded-full" data-testid="editor-guest-preview-btn">
                <Eye className="mr-1.5 h-4 w-4" /> Preview as guest
              </Button>
              <Button variant="ghost" size="sm" onClick={copyShareLink} className="rounded-full" data-testid="editor-share-btn">
                <Share2 className="mr-1.5 h-4 w-4" /> Share link
              </Button>
              {isPremium ? (
                <Button variant="ghost" size="sm" onClick={() => setPreviewKey((k) => k + 1)} className="rounded-full">
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Replay envelope
                </Button>
              ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="rounded-full bg-[#1A1A1A] text-white hover:bg-[#D97757]" data-testid="editor-export-btn">
                    <Download className="mr-1.5 h-4 w-4" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportPng} data-testid="export-png">Download PNG</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportJpg} data-testid="export-jpg">Download JPG</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPdf} data-testid="export-pdf">Download PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              )}
            </div>
          </div>

          {isPremium ? (
            // Phone-sized frame; the site scrolls inside it.
            <div className="rounded-[2.5rem] border-[10px] border-[#1A1A1A] bg-[#1A1A1A] shadow-2xl">
              <div className="relative h-[760px] w-[390px] overflow-y-auto rounded-[1.8rem] bg-white">
                <PremiumSite key={previewKey} data={data} embedded shareLink={shareUrl(data.share_id)} />
              </div>
            </div>
          ) : (
          <div className="relative overflow-hidden rounded-3xl bg-white/50 p-8">
            <EffectsLayer effects={data.effects || []} contained />
            <InviteCanvas
              ref={canvasRef}
              data={data}
              interactivePhotos
              selectedPhotoId={selectedPhotoId}
              onPhotoSelect={setSelectedPhotoId}
              onPhotoUpdate={updatePhoto}
            />
          </div>
          )}
        </main>
      </div>
    </div>
  );
}

function GuestPreviewHint({ onPreview, what }) {
  return (
    <p className="mt-2 text-xs text-stone-500">
      {what} on the guest page.{" "}
      <button type="button" onClick={onPreview} className="underline hover:text-[#D97757]">Preview as guest</button>
    </p>
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

function ColorPicker({ value, onChange, testid }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-1.5">
        {COLOR_SWATCHES.map((c) => (
          <button key={c} onClick={() => onChange(c)}
            className={`h-7 w-7 rounded-full border-2 smooth ${value === c ? "border-[#1A1A1A]" : "border-stone-200"}`}
            style={{ background: c }} aria-label={c} data-testid={`${testid}-swatch`} />
        ))}
      </div>
      <Input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-12 cursor-pointer rounded-md border border-stone-200 p-1" data-testid={`${testid}-input`} />
    </div>
  );
}

function safeName(name) { return (name || "invitation").replace(/[^a-z0-9]+/gi, "_").toLowerCase(); }
function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a"); a.href = dataUrl; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}
