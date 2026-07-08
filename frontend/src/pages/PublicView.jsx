import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import InviteCanvas from "@/components/InviteCanvas";
import { Button } from "@/components/ui/button";

export default function PublicView() {
  const { shareId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <div className="text-center">
          <span className="chip-label">Not found</span>
          <h1 className="font-display mt-3 text-4xl">This invitation isn't available.</h1>
          <Link to="/">
            <Button className="mt-6 rounded-full bg-[#1A1A1A] text-white hover:bg-[#D97757]">
              Return home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] text-sm text-stone-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16">
        <span className="chip-label" data-testid="public-view-label">You're invited</span>
        <div className="mt-6">
          <InviteCanvas data={data} />
        </div>
        <p className="mt-8 text-xs text-stone-500">
          Made with{" "}
          <Link to="/" className="underline hover:text-[#D97757]">InviteCraft</Link>
        </p>
      </div>
    </div>
  );
}
