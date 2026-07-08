import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Trash2, Send, Eye, Users, CheckCircle, HelpCircle, XCircle, Clock, ArrowLeft } from "lucide-react";

export default function Guests() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [guests, setGuests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newGuest, setNewGuest] = useState({ name: "", email: "" });
  const [bulk, setBulk] = useState("");
  const [sending, setSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [invRes, guestsRes, analyticsRes] = await Promise.all([
        api.get(`/invitations/${id}`),
        api.get(`/invitations/${id}/guests`),
        api.get(`/invitations/${id}/analytics`),
      ]);
      setInvite(invRes.data);
      setGuests(guestsRes.data);
      setAnalytics(analyticsRes.data);
      setEmailSubject(`You're invited: ${invRes.data.title || "Our celebration"}`);
    } catch {
      toast.error("Could not load invitation data");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const addGuest = async (e) => {
    e.preventDefault();
    if (!newGuest.email) return;
    try {
      const { data } = await api.post(`/invitations/${id}/guests`, {
        guests: [{ name: newGuest.name || newGuest.email.split("@")[0], email: newGuest.email }],
      });
      toast.success(data.added.length ? "Guest added" : "Guest already exists");
      setNewGuest({ name: "", email: "" });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Add failed");
    }
  };

  const addBulk = async () => {
    const lines = bulk
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed = [];
    for (const l of lines) {
      // "Name <email>" or just "email"
      const m = l.match(/^(.*?)[\s<]*([^\s<>]+@[^\s<>]+)>?$/);
      if (m) {
        parsed.push({ name: (m[1] || "").trim() || m[2].split("@")[0], email: m[2].trim() });
      }
    }
    if (!parsed.length) { toast.error("No valid emails found"); return; }
    try {
      const { data } = await api.post(`/invitations/${id}/guests`, { guests: parsed });
      toast.success(`${data.added.length} added, ${parsed.length - data.added.length} duplicates skipped`);
      setBulk("");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Bulk add failed");
    }
  };

  const removeGuest = async (guestId) => {
    if (!window.confirm("Remove this guest?")) return;
    try {
      await api.delete(`/invitations/${id}/guests/${guestId}`);
      load();
    } catch { toast.error("Remove failed"); }
  };

  const sendInvites = async (guestIds = null) => {
    setSending(true);
    try {
      const { data } = await api.post(`/invitations/${id}/send-invites`, {
        subject: emailSubject,
        message: emailMessage,
        guest_ids: guestIds,
      });
      toast.success(`Sent ${data.sent} of ${data.total_targets} — ${data.failed.length} failed`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Send failed");
    } finally {
      setSending(false);
    }
  };

  if (loading || !invite) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <Nav />
        <div className="mx-auto max-w-6xl px-10 py-16 text-sm text-stone-500">Loading…</div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/i/${invite.share_id}`;
  const rsvp = analytics?.rsvp_counts || { yes: 0, no: 0, maybe: 0, pending: 0 };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Nav />
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <div className="mb-8">
          <Link to={`/editor/${id}`} className="chip-label inline-flex items-center gap-1 text-stone-500 hover:text-[#D97757] smooth" data-testid="back-to-editor">
            <ArrowLeft className="h-3 w-3" /> Back to editor
          </Link>
          <h1 className="font-display mt-3 text-4xl">Guests & RSVP</h1>
          <p className="mt-1 text-sm text-stone-600">{invite.title}</p>
        </div>

        {/* Analytics summary */}
        <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Stat icon={<Eye className="h-4 w-4" />} label="Views" value={analytics?.views_total || 0} testid="stat-views" />
          <Stat icon={<Eye className="h-4 w-4" />} label="Unique viewers" value={analytics?.views_unique || 0} testid="stat-unique" />
          <Stat icon={<Users className="h-4 w-4" />} label="Total guests" value={analytics?.guests_total || 0} testid="stat-guests" />
          <Stat icon={<CheckCircle className="h-4 w-4 text-emerald-600" />} label="Accepted" value={rsvp.yes} testid="stat-yes" />
          <Stat icon={<XCircle className="h-4 w-4 text-red-600" />} label="Declined" value={rsvp.no} testid="stat-no" />
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* Guest list */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="chip-label">Guest list</span>
                <div className="font-display text-2xl">{guests.length} guests</div>
              </div>
              <Button size="sm" onClick={() => sendInvites()} disabled={sending || guests.length === 0} className="rounded-full bg-[#1A1A1A] text-white hover:bg-[#D97757]" data-testid="send-all-btn">
                <Send className="mr-2 h-4 w-4" /> {sending ? "Sending…" : "Send to all"}
              </Button>
            </div>

            <form onSubmit={addGuest} className="mb-4 flex flex-wrap gap-2" data-testid="add-guest-form">
              <Input placeholder="Name (optional)" value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} className="rounded-lg" data-testid="add-guest-name" style={{ flex: "1 1 140px" }} />
              <Input type="email" placeholder="guest@example.com" value={newGuest.email} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} className="rounded-lg" required data-testid="add-guest-email" style={{ flex: "2 1 220px" }} />
              <Button type="submit" variant="outline" className="rounded-full" data-testid="add-guest-btn">Add</Button>
            </form>

            <details className="mb-4 rounded-lg border border-stone-200 bg-stone-50">
              <summary className="cursor-pointer px-4 py-2 text-sm">Add many at once</summary>
              <div className="p-4">
                <Textarea rows={4} placeholder="One per line. e.g. Anna <anna@example.com>&#10;bob@example.com" value={bulk} onChange={(e) => setBulk(e.target.value)} data-testid="bulk-input" />
                <Button size="sm" variant="outline" onClick={addBulk} className="mt-2 rounded-full" data-testid="bulk-add-btn">Add batch</Button>
              </div>
            </details>

            {guests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-300 py-12 text-center text-sm text-stone-500">
                No guests yet. Add your first above.
              </div>
            ) : (
              <ul className="divide-y divide-stone-200">
                {guests.map((g) => (
                  <li key={g.id} className="flex items-center justify-between py-3" data-testid={`guest-row-${g.id}`}>
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{g.name}</div>
                      <div className="text-xs text-stone-500 truncate">{g.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={g.status} />
                      <Button size="sm" variant="ghost" onClick={() => sendInvites([g.id])} disabled={sending} className="rounded-full text-xs" data-testid={`send-guest-${g.id}`}>
                        <Mail className="mr-1 h-3 w-3" /> Send
                      </Button>
                      <button onClick={() => removeGuest(g.id)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 hover:text-red-600 smooth" data-testid={`remove-guest-${g.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Right column: share + email settings */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <span className="chip-label">Share link</span>
              <div className="mt-3 break-all rounded-lg bg-stone-50 p-3 text-xs text-stone-700" data-testid="share-url">{shareUrl}</div>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied"); }} className="mt-3 w-full rounded-full" data-testid="copy-share-btn">Copy link</Button>
              <a href={shareUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-stone-200 px-4 py-2 text-xs smooth hover:border-[#D97757] hover:text-[#D97757]">
                Open public view
              </a>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <span className="chip-label">Email template</span>
              <div className="mt-3 space-y-3">
                <div>
                  <Label className="chip-label">Subject</Label>
                  <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="mt-2 rounded-lg" data-testid="email-subject" />
                </div>
                <div>
                  <Label className="chip-label">Personal note (optional)</Label>
                  <Textarea rows={3} value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} placeholder="Overrides the invitation message" className="mt-2 rounded-lg" data-testid="email-message" />
                </div>
              </div>
              <p className="mt-3 text-xs text-stone-500">
                Emails include your invitation background, title and a big CTA button linking to the public view.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <span className="chip-label">RSVP breakdown</span>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center justify-between"><span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" /> Accepted</span><b>{rsvp.yes}</b></li>
                <li className="flex items-center justify-between"><span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-amber-600" /> Maybe</span><b>{rsvp.maybe}</b></li>
                <li className="flex items-center justify-between"><span className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" /> Declined</span><b>{rsvp.no}</b></li>
                <li className="flex items-center justify-between"><span className="flex items-center gap-2"><Clock className="h-4 w-4 text-stone-500" /> Pending</span><b>{rsvp.pending}</b></li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, testid }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5" data-testid={testid}>
      <div className="chip-label flex items-center gap-1.5">{icon}{label}</div>
      <div className="font-display mt-1 text-3xl">{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    yes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    no: "bg-red-50 text-red-700 border-red-200",
    maybe: "bg-amber-50 text-amber-700 border-amber-200",
    pending: "bg-stone-50 text-stone-600 border-stone-200",
  }[status] || "bg-stone-50 text-stone-600 border-stone-200";
  const label = { yes: "Accepted", no: "Declined", maybe: "Maybe", pending: "Pending" }[status] || status;
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-widest ${styles}`}>
      {label}
    </span>
  );
}
