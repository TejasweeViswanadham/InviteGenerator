import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Nav from "@/components/Nav";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Pencil } from "lucide-react";
import { EVENT_TYPES } from "@/lib/templates";

export default function Dashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/invitations");
      setItems(data);
    } catch (e) {
      toast.error("Could not load your invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invitation? This cannot be undone.")) return;
    try {
      await api.delete(`/invitations/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success("Invitation deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Nav />
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="chip-label">My studio</span>
            <h1 className="font-display mt-2 text-5xl">Your invitations</h1>
            <p className="mt-2 max-w-xl text-sm text-stone-600">
              Pick up where you left off or start a fresh design from a template.
            </p>
          </div>
          <Link to="/templates">
            <Button
              size="lg"
              className="rounded-full bg-[#1A1A1A] px-6 text-white hover:bg-[#D97757]"
              data-testid="dashboard-new-invite-btn"
            >
              <Plus className="mr-2 h-4 w-4" /> New invitation
            </Button>
          </Link>
        </div>

        <div className="mt-14">
          {loading ? (
            <p className="text-sm text-stone-500">Loading…</p>
          ) : items.length === 0 ? (
            <EmptyState onCreate={() => navigate("/templates")} />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="fade-up group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white smooth hover-lift"
                  data-testid={`invite-card-${it.id}`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                    {it.background_data ? (
                      <img src={it.background_data} alt="" className="h-full w-full object-cover" />
                    ) : it.background_url ? (
                      <img src={it.background_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-3xl text-stone-400">
                        {it.title || "Untitled"}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="chip-label text-white/80">
                        {EVENT_TYPES.find((e) => e.id === it.event_type)?.label || it.event_type}
                      </div>
                      <div className="font-display text-xl text-white">{it.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-stone-200 p-4">
                    <div className="text-xs text-stone-500">
                      Updated {new Date(it.updated_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/i/${it.share_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-[#D97757] smooth"
                        data-testid={`invite-view-${it.id}`}
                        title="Public view"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Link
                        to={`/editor/${it.id}`}
                        className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-[#D97757] smooth"
                        data-testid={`invite-edit-${it.id}`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(it.id)}
                        className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-red-600 smooth"
                        data-testid={`invite-delete-${it.id}`}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="rounded-3xl border border-dashed border-stone-300 bg-white/50 px-8 py-24 text-center">
      <span className="chip-label">Nothing here yet</span>
      <h2 className="font-display mt-3 text-3xl">Your first invitation awaits</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
        Pick a starter template — you can change everything once you're inside the editor.
      </p>
      <Button
        onClick={onCreate}
        className="mt-8 rounded-full bg-[#1A1A1A] px-8 py-5 text-white hover:bg-[#D97757]"
        data-testid="empty-create-btn"
      >
        Browse templates
      </Button>
    </div>
  );
}
