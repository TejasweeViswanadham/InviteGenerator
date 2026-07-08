import { useEffect, useRef, useState } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";

/**
 * Floating music player with autoplay + mute toggle.
 * Browsers block autoplay with sound; we start muted, then user can un-mute.
 */
export default function MusicPlayer({ src, label = "Playing", autoPlay = true }) {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!src || !audioRef.current) return;
    audioRef.current.loop = true;
    audioRef.current.volume = 0.6;
    if (autoPlay) {
      audioRef.current.muted = true;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [src, autoPlay]);

  if (!src) return null;

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !muted;
    audioRef.current.muted = next;
    if (!next && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }
    setMuted(next);
    setPlaying(!audioRef.current.paused);
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-3 py-2 shadow-lg backdrop-blur smooth"
      data-testid="music-player"
    >
      <audio ref={audioRef} src={src} preload="auto" data-testid="music-audio" />
      <Music className="h-4 w-4 text-[#D97757]" />
      <span className="max-w-[10rem] truncate text-xs text-stone-600">
        {label}
      </span>
      <button
        onClick={toggleMute}
        className="rounded-full p-1.5 hover:bg-stone-100 smooth"
        aria-label={muted ? "Unmute" : "Mute"}
        data-testid="music-toggle-btn"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-[#D97757]" />}
      </button>
    </div>
  );
}
