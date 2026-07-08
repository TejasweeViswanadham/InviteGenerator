import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import InviteCanvas from "@/components/InviteCanvas";
import {
  BACKGROUND_LIBRARY, FONT_OPTIONS, COLOR_SWATCHES, EVENT_TYPES,
} from "@/lib/templates";
import { toPng, toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import { Sparkles, Download, Save, Share2, Loader2, Wand2 } from "lucide-react";

const DEBOUNCE = 900;

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const saveTimer = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiText, setAiText] = useState({ loading: false, vibe: "elegant", details: "" });
  const [aiImg, setAiImg] = useState({ loading: false, prompt: "soft romantic florals with cream background" });

  // Load invitation
  useEffect(() => {
    (async () => {
      try {
        const { data: inv } = await api.get(`/invitations/${id}`);
        setData(inv);
      } catch {
        toast.error("Invitation not found");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  // Auto-save (debounced)
  useEffect(() => {
    if (!data || loading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(false), DEBOUNCE);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
    // eslint-disable-next-line
  }, [data]);

  const set = (patch) => setData((prev) => ({ ...prev, ...patch }));

  const save = async (announce = true) => {
    if (!data) return;
    setSaving(true);
    try {
      const payload = { ...data };
      delete payload.id;
      delete payload.user_id;
      delete payload.share_id;
      delete payload.created_at;
      delete payload.updated_at;
      await api.patch(`/invitations/${id}`, payload);
      if (announce) toast.success("Saved");
    } catch {
      if (announce) toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const backgrounds = useMemo(
    () => BACKGROUND_LIBRARY[data?.event_type] || [],
    [data?.event_type]
  );

  const generateText = async () => {
    setAiText((p) => ({ ...p, loading: true }));
    try {
      const { data: out } = await api.post("/ai/generate-text", {
        event_type: data.event_type,
        vibe: aiText.vibe,
        details: aiText.details,
      });
      const patch = {};
      if (out.title) patch.title = out.title;
      if (out.subtitle) patch.subtitle = out.subtitle;
      if (out.message) patch.message = out.message;
      set(patch);
      toast.success("AI copy applied");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI text failed");
    } finally {
      setAiText((p) => ({ ...p, loading: false }));
    }
  };

  const generateImage = async () => {
    setAiImg((p) => ({ ...p, loading: true }));
    try {
      const { data: out } = await api.post("/ai/generate-image", {
        prompt: aiImg.prompt,
        event_type: data.event_type,
      });
      set({ background_data: out.data_url, background_url: "" });
      toast.success("AI background applied");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI image failed");
    } finally {
      setAiImg((p) => ({ ...p, loading: false }));
    }
  };

  const exportPng = async () => {
    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio: 2, cacheBust: true });
      downloadDataUrl(dataUrl, `${safeName(data.title)}.png`);
    } catch (e) {
      toast.error("PNG export failed");
    }
  };

  const exportJpg = async () => {
    try {
      const dataUrl = await toJpeg(canvasRef.current, { pixelRatio: 2, cacheBust: true, quality: 0.95 });
      downloadDataUrl(dataUrl, `${safeName(data.title)}.jpg`);
    } catch (e) {
      toast.error("JPG export failed");
    }
  };

  const exportPdf = async () => {
    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio: 2, cacheBust: true });
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [600, 800] });
      pdf.addImage(dataUrl, "PNG", 0, 0, 600, 800);
      pdf.save(`${safeName(data.title)}.pdf`);
    } catch {
      toast.error("PDF export failed");
    }
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/i/${data.share_id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch {
      window.prompt("Copy this URL:", url);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <Nav />
        <div className="mx-auto max-w-7xl px-10 py-16 text-sm text-stone-500">Loading editor…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Nav />

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[440px_1fr]">
        {/* Left: Controls */}
        <aside className="rounded-2xl border border-stone-200 bg-white p-6" data-testid="editor-controls">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="chip-label">Editor</span>
              <div className="font-display text-2xl">{data.title || "Untitled"}</div>
            </div>
            <div className="text-xs text-stone-500">
              {saving ? "Saving…" : "Auto-saved"}
            </div>
          </div>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-full bg-stone-100">
              <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
              <TabsTrigger value="design" data-testid="tab-design">Design</TabsTrigger>
              <TabsTrigger value="bg" data-testid="tab-bg">Background</TabsTrigger>
              <TabsTrigger value="ai" data-testid="tab-ai">AI</TabsTrigger>
            </TabsList>

            {/* Content */}
            <TabsContent value="content" className="mt-6 space-y-4">
              <Field label="Event type">
                <Select value={data.event_type} onValueChange={(v) => set({ event_type: v })}>
                  <SelectTrigger data-testid="input-event-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Title">
                <Input value={data.title} onChange={(e) => set({ title: e.target.value })} data-testid="input-title" />
              </Field>
              <Field label="Subtitle">
                <Input value={data.subtitle} onChange={(e) => set({ subtitle: e.target.value })} data-testid="input-subtitle" />
              </Field>
              <Field label="Hosts / eyebrow">
                <Input value={data.hosts} onChange={(e) => set({ hosts: e.target.value })} data-testid="input-hosts" />
              </Field>
              <Field label="Message">
                <Textarea rows={3} value={data.message} onChange={(e) => set({ message: e.target.value })} data-testid="input-message" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date">
                  <Input value={data.date_text} onChange={(e) => set({ date_text: e.target.value })} data-testid="input-date" />
                </Field>
                <Field label="Time">
                  <Input value={data.time_text} onChange={(e) => set({ time_text: e.target.value })} data-testid="input-time" />
                </Field>
              </div>
              <Field label="Venue">
                <Input value={data.venue} onChange={(e) => set({ venue: e.target.value })} data-testid="input-venue" />
              </Field>
              <Field label="RSVP">
                <Input value={data.rsvp} onChange={(e) => set({ rsvp: e.target.value })} data-testid="input-rsvp" />
              </Field>
            </TabsContent>

            {/* Design */}
            <TabsContent value="design" className="mt-6 space-y-5">
              <Field label="Heading font">
                <Select value={data.heading_font} onValueChange={(v) => set({ heading_font: v })}>
                  <SelectTrigger data-testid="input-heading-font"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.id} value={f.value} style={{ fontFamily: f.value }}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Body font">
                <Select value={data.body_font} onValueChange={(v) => set({ body_font: v })}>
                  <SelectTrigger data-testid="input-body-font"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.id} value={f.value} style={{ fontFamily: f.value }}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Accent color">
                <ColorPicker
                  value={data.accent_color}
                  onChange={(c) => set({ accent_color: c })}
                  testid="input-accent"
                />
              </Field>
              <Field label="Text color">
                <ColorPicker
                  value={data.text_color}
                  onChange={(c) => set({ text_color: c })}
                  testid="input-text-color"
                />
              </Field>

              <Field label={`Background overlay: ${Math.round(data.overlay_opacity * 100)}%`}>
                <Slider
                  value={[data.overlay_opacity]}
                  onValueChange={(v) => set({ overlay_opacity: v[0] })}
                  min={0}
                  max={0.85}
                  step={0.05}
                  data-testid="input-overlay"
                />
              </Field>
            </TabsContent>

            {/* Background */}
            <TabsContent value="bg" className="mt-6 space-y-4">
              <div>
                <div className="chip-label mb-3">Preset backgrounds</div>
                <div className="grid grid-cols-3 gap-2">
                  {backgrounds.map((url) => (
                    <button
                      key={url}
                      onClick={() => set({ background_url: url, background_data: "" })}
                      className={`overflow-hidden rounded-lg border-2 smooth ${
                        data.background_url === url ? "border-[#D97757]" : "border-transparent"
                      }`}
                      data-testid="bg-preset-btn"
                    >
                      <img src={url} alt="" className="h-20 w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() => set({ background_url: "", background_data: "" })}
                data-testid="bg-clear-btn"
              >
                Clear background
              </Button>
            </TabsContent>

            {/* AI */}
            <TabsContent value="ai" className="mt-6 space-y-6">
              <div className="rounded-xl border border-stone-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#D97757]" />
                  <div className="chip-label">AI copywriter</div>
                </div>
                <div className="space-y-3">
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
                  <Field label="Extra context (names, dates, theme)">
                    <Textarea
                      rows={2}
                      value={aiText.details}
                      onChange={(e) => setAiText((p) => ({ ...p, details: e.target.value }))}
                      data-testid="ai-text-details"
                    />
                  </Field>
                  <Button
                    onClick={generateText}
                    disabled={aiText.loading}
                    className="w-full rounded-full bg-[#1A1A1A] text-white hover:bg-[#D97757]"
                    data-testid="ai-generate-text-btn"
                  >
                    {aiText.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generate copy
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#D97757]" />
                  <div className="chip-label">AI background</div>
                </div>
                <div className="space-y-3">
                  <Field label="Describe your dream background">
                    <Textarea
                      rows={2}
                      value={aiImg.prompt}
                      onChange={(e) => setAiImg((p) => ({ ...p, prompt: e.target.value }))}
                      data-testid="ai-image-prompt"
                    />
                  </Field>
                  <Button
                    onClick={generateImage}
                    disabled={aiImg.loading}
                    className="w-full rounded-full bg-[#1A1A1A] text-white hover:bg-[#D97757]"
                    data-testid="ai-generate-image-btn"
                  >
                    {aiImg.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Paint background
                  </Button>
                  <p className="text-xs text-stone-500">
                    Uses Gemini Nano Banana — usually takes 10-20s.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Right: Preview */}
        <main className="flex flex-col items-center">
          <div className="mb-6 flex w-full items-center justify-between">
            <span className="chip-label">Live preview</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => save(true)} className="rounded-full" data-testid="editor-save-btn">
                <Save className="mr-1.5 h-4 w-4" /> Save
              </Button>
              <Button variant="ghost" size="sm" onClick={copyShareLink} className="rounded-full" data-testid="editor-share-btn">
                <Share2 className="mr-1.5 h-4 w-4" /> Share link
              </Button>
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
            </div>
          </div>

          <div className="rounded-3xl bg-white/50 p-8">
            <InviteCanvas ref={canvasRef} data={data} />
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
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
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`h-7 w-7 rounded-full border-2 smooth ${
              value === c ? "border-[#1A1A1A]" : "border-stone-200"
            }`}
            style={{ background: c }}
            aria-label={c}
            data-testid={`${testid}-swatch`}
          />
        ))}
      </div>
      <Input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-12 cursor-pointer rounded-md border border-stone-200 p-1"
        data-testid={`${testid}-input`}
      />
    </div>
  );
}

function safeName(name) {
  return (name || "invitation").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
