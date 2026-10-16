import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Copy, Download, Eye, Loader2, Mail, MessageCircle, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Everything needed to send an invitation, in one place.
 * `url` is empty while the link preview is being prepared; `imageFile` is a
 * snapshot of the card, attached when sharing through the phone's share sheet.
 */
export default function ShareDialog({ open, onOpenChange, url, imageFile, title, invitationId, onPreview, onDownload }) {
  const ready = Boolean(url);
  const text = `You're invited! ${title ? `${title} — ` : ""}${url}`;
  const [imageSrc, setImageSrc] = useState("");
  useEffect(() => {
    if (!imageFile) { setImageSrc(""); return undefined; }
    const src = URL.createObjectURL(imageFile);
    setImageSrc(src);
    return () => URL.revokeObjectURL(src);
  }, [imageFile]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — paste it anywhere");
    } catch {
      window.prompt("Copy this link:", url);
    }
  };
  const more = async () => {
    try {
      // With a file attached many apps drop `url`, so the link goes in the text.
      if (imageFile && navigator.canShare?.({ files: [imageFile] })) {
        await navigator.share({ files: [imageFile], title: title || "Invitation", text });
      } else {
        await navigator.share({ title: title || "Invitation", text: "You're invited!", url });
      }
    } catch {}
  };
  const disabled = ready ? "" : "pointer-events-none opacity-50";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Share your invitation</DialogTitle>
          <DialogDescription>Your latest changes are saved. Guests open this link on any phone or computer.</DialogDescription>
        </DialogHeader>

        {imageSrc && (
          <div className="flex items-center gap-3 rounded-xl border border-stone-200 p-2">
            <img src={imageSrc} alt="" className="h-16 w-12 rounded object-cover" />
            <p className="text-xs text-stone-500">This picture shows with your link in WhatsApp and other apps.</p>
          </div>
        )}

        <div className="flex gap-2">
          <Input value={ready ? url : "Preparing link preview…"} readOnly onFocus={(e) => e.target.select()} className="rounded-full text-xs" data-testid="share-dialog-url" />
          <Button onClick={copy} disabled={!ready} className="shrink-0 rounded-full bg-[#1A1A1A] text-white hover:bg-[#D97757]" data-testid="share-dialog-copy">
            {ready ? <Copy className="mr-1.5 h-4 w-4" /> : <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Copy
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"
            className={`flex items-center justify-center gap-2 rounded-full border border-[#25D366] py-2.5 text-sm text-[#128C7E] hover:bg-[#25D366]/10 ${disabled}`}>
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <a href={`mailto:?subject=${encodeURIComponent(title ? `Invitation: ${title}` : "You're invited")}&body=${encodeURIComponent(text)}`}
            className={`flex items-center justify-center gap-2 rounded-full border border-stone-200 py-2.5 text-sm hover:border-stone-400 ${disabled}`}>
            <Mail className="h-4 w-4" /> Email
          </a>
          <button onClick={onPreview} className="flex items-center justify-center gap-2 rounded-full border border-stone-200 py-2.5 text-sm hover:border-stone-400">
            <Eye className="h-4 w-4" /> See it as a guest
          </button>
          {typeof navigator !== "undefined" && navigator.share ? (
            <button onClick={more} disabled={!ready} className="flex disabled:opacity-50 items-center justify-center gap-2 rounded-full border border-stone-200 py-2.5 text-sm hover:border-stone-400">
              <Share2 className="h-4 w-4" /> More apps
            </button>
          ) : onDownload ? (
            <button onClick={onDownload} className="flex items-center justify-center gap-2 rounded-full border border-stone-200 py-2.5 text-sm hover:border-stone-400">
              <Download className="h-4 w-4" /> Download image
            </button>
          ) : null}
        </div>

        <Link to={`/invite/${invitationId}/guests`}
          className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm hover:border-[#D97757]">
          <Users className="h-5 w-5 text-[#D97757]" />
          <span>
            <span className="block font-medium">Guest list &amp; RSVPs</span>
            <span className="text-xs text-stone-500">Add guests, email invites and see who's coming</span>
          </span>
        </Link>
      </DialogContent>
    </Dialog>
  );
}
