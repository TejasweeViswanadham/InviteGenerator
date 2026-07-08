import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import InviteCanvas from "@/components/InviteCanvas";
import EffectsLayer from "@/components/EffectsLayer";
import Envelope from "@/components/Envelope";
import MusicPlayer from "@/components/MusicPlayer";
import ScratchReveal from "@/components/ScratchReveal";
import { fileUrl } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function PublicView() {
  const { shareId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [rsvp, setRsvp] = useState({
    name: "", email: "", status: "yes", note: "", submitted: false, loading: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/public/${shareId}`);
        setData(data);
      } catch {
        setError(true);
      }
    })();
  }, [shareId]);

  const submitRsvp = async (e) => {
    e.preventDefault();
    if (!rsvp.email) { toast.error("Please enter your email"); return; }
    setRsvp((r) => ({ ...r, loading: true }));
    try {
      await api.post(`/public/${shareId}/rsvp`, {
        email: rsvp.email, name: rsvp.name, status: rsvp.status, note: rsvp.note,
      });
      setRsvp((r) => ({ ...r, submitted: true, loading: false }));
      toast.success("Thank you for your RSVP!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "RSVP failed");
      setRsvp((r) => ({ ...r, loading: false }));
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <div className="text-center">
          <span className="chip-label">Not found</span>
          <h1 className="font-display mt-3 text-4xl">This invitation isn't available.</h1>
          <Link to="/"><Button className="mt-6 rounded-full bg-[#1A1A1A] text-white hover:bg-[#D97757]">Return home</Button></Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] text-sm text-stone-500">Loading…</div>;
  }

  const invite = (
    <div data-testid="public-invite">
      {data.scratch_reveal ? (
        <ScratchReveal coverColor={data.accent_color || "#C89F59"}>
          <InviteCanvas data={data} />
        </ScratchReveal>
      ) : (
        <InviteCanvas data={data} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <EffectsLayer effects={data.effects || []} />
      <MusicPlayer src={data.music_url ? fileUrl(data.music_url) : ""} label={data.music_label || "Music"} />

      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16">
        <span className="chip-label" data-testid="public-view-label">You're invited</span>

        <div className="mt-6">
          {data.envelope_style && data.envelope_style !== "none" ? (
            <Envelope style={data.envelope_style}>{invite}</Envelope>
          ) : (
            invite
          )}
        </div>

        {data.video_url && (
          <div className="mt-12 w-full max-w-md">
            <div className="chip-label mb-3 text-center">Video invitation</div>
            <video
              src={fileUrl(data.video_url)}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="w-full rounded-2xl border border-stone-200"
              data-testid="public-video"
            />
          </div>
        )}

        {/* RSVP form */}
        <div className="mt-16 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8" data-testid="rsvp-block">
          <div className="text-center">
            <span className="chip-label">Kindly reply</span>
            <h2 className="font-display mt-2 text-3xl">Will you join us?</h2>
          </div>
          {rsvp.submitted ? (
            <div className="mt-8 rounded-lg bg-stone-50 p-6 text-center">
              <div className="font-display text-2xl text-[#D97757]">Thank you!</div>
              <p className="mt-2 text-sm text-stone-600">Your response has been recorded.</p>
            </div>
          ) : (
            <form onSubmit={submitRsvp} className="mt-6 space-y-4" data-testid="rsvp-form">
              <div>
                <Label className="chip-label">Your name</Label>
                <Input value={rsvp.name} onChange={(e) => setRsvp((r) => ({ ...r, name: e.target.value }))} className="mt-2 rounded-lg" required data-testid="rsvp-name-input" />
              </div>
              <div>
                <Label className="chip-label">Your email</Label>
                <Input type="email" value={rsvp.email} onChange={(e) => setRsvp((r) => ({ ...r, email: e.target.value }))} className="mt-2 rounded-lg" required data-testid="rsvp-email-input" />
              </div>
              <div>
                <Label className="chip-label mb-3 block">Response</Label>
                <RadioGroup value={rsvp.status} onValueChange={(v) => setRsvp((r) => ({ ...r, status: v }))} className="grid grid-cols-3 gap-2">
                  {[
                    { value: "yes", label: "Joyfully accept" },
                    { value: "maybe", label: "Maybe" },
                    { value: "no", label: "Cannot attend" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border px-3 py-3 text-xs smooth ${
                        rsvp.status === opt.value
                          ? "border-[#D97757] bg-[#FBEEE1]"
                          : "border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} className="sr-only" data-testid={`rsvp-radio-${opt.value}`} />
                      <span className="text-center">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label className="chip-label">Message (optional)</Label>
                <Textarea rows={2} value={rsvp.note} onChange={(e) => setRsvp((r) => ({ ...r, note: e.target.value }))} className="mt-2 rounded-lg" data-testid="rsvp-note-input" />
              </div>
              <Button type="submit" disabled={rsvp.loading} className="w-full rounded-full bg-[#1A1A1A] py-6 text-white hover:bg-[#D97757]" data-testid="rsvp-submit-btn">
                {rsvp.loading ? "Sending…" : "Send RSVP"}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-10 text-xs text-stone-500">Made with <Link to="/" className="underline hover:text-[#D97757]">InviteCraft</Link></p>
      </div>
    </div>
  );
}
