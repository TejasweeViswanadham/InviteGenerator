import { useState } from "react";
import { X } from "lucide-react";

const KEY = "ic_editor_welcome_seen";

/** One-time "how this works" card at the top of the editor. */
export default function EditorWelcome({ premium = false }) {
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem(KEY);
    } catch {
      return false;
    }
  });
  if (!show) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setShow(false);
  };
  const steps = premium
    ? [
        ["Fill in your details", "Couple, events and venue tabs — the phone preview updates as you type."],
        ["Pick the look", "Colours, music and effects are in the Style tab."],
        ["Share", "Tap Share to send the link on WhatsApp, email or copy it."],
      ]
    : [
        ["Type your wording", "The Content tab — the card updates as you type. Empty lines are hidden."],
        ["Make it yours", "Design for fonts & colours, Media for background, photos and music."],
        ["Share", "Tap Share to send the link on WhatsApp, email or copy it."],
      ];
  return (
    <div className="relative mb-5 rounded-xl border border-[#E8D9C4] bg-[#FBF5EC] p-4" data-testid="editor-welcome">
      <button onClick={close} className="absolute right-2 top-2 rounded-full p-1 text-stone-500 hover:bg-white" aria-label="Close tips">
        <X className="h-4 w-4" />
      </button>
      <div className="chip-label mb-2">How it works</div>
      <ol className="space-y-2">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D97757] text-xs text-white">{i + 1}</span>
            <span className="text-sm">
              <span className="font-medium">{t}.</span> <span className="text-stone-600">{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-stone-500">Everything saves automatically.</p>
      <button onClick={close} className="mt-3 rounded-full bg-[#1A1A1A] px-4 py-1.5 text-xs text-white hover:bg-[#D97757]">Got it</button>
    </div>
  );
}
