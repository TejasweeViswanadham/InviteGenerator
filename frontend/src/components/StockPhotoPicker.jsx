import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import api, { errorMessage } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PHOTO_LIBRARY } from "@/lib/templates";
import { Loader2, Search } from "lucide-react";

/**
 * Free stock photos (Pixabay or Pexels, via our backend) for "Photos on canvas".
 * Pixabay photos are copied into our storage when picked (Pixabay forbids permanent
 * hotlinking); Pexels photos are used straight from Pexels.
 *
 * Opens on the invitation's theme (`themeQuery`, from its template) and lets the user
 * search anything else, as photos or illustrations. `suggestions` adds extra search
 * chips and `curated` asks for Pixabay's Editor's Choice (both used for events whose
 * stock photos skew towards people). If photo search isn't configured on the server,
 * it falls back to the small built-in PHOTO_LIBRARY.
 */
export default function StockPhotoPicker({ themeQuery, eventQuery, suggestions = [], curated = false, onPick }) {
  const [input, setInput] = useState(themeQuery);
  const [search, setSearch] = useState({ query: themeQuery, kind: "photo" });
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [curatedMode, setCuratedMode] = useState(curated); // may switch off if too few picks
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [provider, setProvider] = useState("");
  const [importing, setImporting] = useState(null); // id of the photo being copied in

  const restart = (next) => {
    setInput(next.query);
    setPage(1);
    setPhotos([]);
    setCuratedMode(curated);
    setSearch(next);
  };

  // A new theme (the user switched background/event) restarts the search on it.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    restart({ query: themeQuery, kind: "photo" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeQuery]);

  useEffect(() => {
    if (!search.query) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    api.get("/stock-photos", { params: { query: search.query, kind: search.kind, curated: curatedMode, page, per_page: 24 } })
      .then(({ data }) => {
        if (cancelled) return;
        setPhotos((prev) => (page === 1 ? data.photos : [...prev, ...data.photos]));
        setHasMore(data.has_more);
        setProvider(data.provider);
        if (page === 1 && data.curated !== curatedMode) setCuratedMode(data.curated);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 503) setUnavailable(true);
        else setError(errorMessage(err, "Couldn't load photos"));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // curatedMode is only read here; a fallback reported by the server must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const runSearch = (query, kind = search.kind) => {
    const q = (query ?? input).trim();
    setInput(q);
    if (!q || (q === search.query && kind === search.kind)) return;
    restart({ query: q, kind });
  };

  const pick = async (p) => {
    if (!p.import) return onPick(p.url);
    if (importing) return;
    setImporting(p.id);
    try {
      const { data } = await api.post("/stock-photos/import", { url: p.url });
      onPick(data.path);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't add that photo"));
    } finally {
      setImporting(null);
    }
  };

  if (unavailable) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Object.values(PHOTO_LIBRARY).flat().map((url) => (
          <button key={url} onClick={() => onPick(url)}
            className="overflow-hidden rounded-lg border border-stone-200 smooth hover:border-[#D97757]"
            data-testid="photo-lib-btn">
            <img src={url} alt="" className="h-16 w-full object-cover" />
          </button>
        ))}
      </div>
    );
  }

  const credit = provider === "pexels"
    ? { name: "Pexels", href: "https://www.pexels.com" }
    : { name: "Pixabay", href: "https://pixabay.com" };
  const chips = [
    ...[themeQuery, eventQuery].filter(Boolean).map((q) => ({ q, kind: "photo" })),
    ...suggestions.map((s) => ({ q: s.q, kind: s.kind || "photo" })),
  ].filter((c, i, all) => all.findIndex((o) => o.q === c.q && o.kind === c.kind) === i);
  const chipActive = (c) => c.q === search.query && c.kind === search.kind;

  return (
    <div data-testid="stock-photo-picker">
      {provider !== "pexels" && (
        <div className="mb-2 grid grid-cols-2 rounded-full border border-stone-200 p-0.5 text-xs">
          {[["photo", "Photos"], ["illustration", "Illustrations"]].map(([k, label]) => (
            <button key={k} onClick={() => runSearch(search.query, k)}
              className={`rounded-full py-1 smooth ${search.kind === k ? "bg-[#D97757] text-white" : "text-stone-600 hover:text-[#D97757]"}`}
              data-testid={`stock-kind-${k}`}>
              {label}
            </button>
          ))}
        </div>
      )}
      <form className="relative" onSubmit={(e) => { e.preventDefault(); runSearch(); }}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={search.kind === "illustration" ? "Search free illustrations…" : "Search free photos…"}
          className="rounded-full pl-9 text-sm"
          data-testid="stock-photo-search"
        />
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button key={`${c.kind}:${c.q}`} onClick={() => runSearch(c.q, c.kind)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] smooth ${chipActive(c) ? "border-[#D97757] bg-[#D97757]/10 text-[#D97757]" : "border-stone-200 text-stone-600 hover:border-[#D97757]"}`}>
            {c.q}{c.kind === "illustration" ? " ✎" : ""}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {photos.map((p) => (
          <button key={p.id} onClick={() => pick(p)} title={`${p.alt || "Photo"} · by ${p.photographer}`}
            className="group relative overflow-hidden rounded-lg border border-stone-200 smooth hover:border-[#D97757]"
            style={{ background: p.avg_color }}
            data-testid="stock-photo-btn">
            <img src={p.thumb} alt={p.alt} loading="lazy" className="h-20 w-full object-cover" />
            {importing === p.id && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/60">
                <Loader2 className="h-5 w-5 animate-spin text-[#D97757]" />
              </span>
            )}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-[9px] text-white opacity-0 group-hover:opacity-100 smooth">
              {p.photographer}
            </span>
          </button>
        ))}
        {loading && Array.from({ length: photos.length ? 3 : 9 }, (_, i) => (
          <div key={`sk${i}`} className="h-20 animate-pulse rounded-lg bg-stone-100" />
        ))}
      </div>
      {!loading && !error && photos.length === 0 && (
        <p className="mt-3 text-center text-xs text-stone-500">Nothing found. Try another search.</p>
      )}
      {error && <p className="mt-3 text-center text-xs text-red-600">{error}</p>}
      {hasMore && !loading && (
        <Button variant="outline" size="sm" className="mt-3 w-full rounded-full" onClick={() => setPage((n) => n + 1)}>
          Load more
        </Button>
      )}
      {loading && photos.length > 0 && (
        <div className="mt-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-stone-400" /></div>
      )}
      <p className="mt-2 text-[10px] text-stone-400">
        {curatedMode && provider === "pixabay" ? "Editor's picks · " : ""}Free images from{" "}
        <a href={credit.href} target="_blank" rel="noreferrer" className="underline hover:text-[#D97757]">{credit.name}</a>
      </p>
    </div>
  );
}
