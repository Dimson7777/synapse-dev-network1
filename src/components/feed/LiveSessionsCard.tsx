import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Radio, Clock3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SessionRoomDialog, { type SessionRoomData } from "@/components/feed/SessionRoomDialog";

interface LiveSession extends SessionRoomData {
  cta: "Join session" | "View";
}

const LIVE_SESSIONS: LiveSession[] = [
  { id: "sara-react-state", name: "Sara Kim", topic: "React state bug", status: "Live", detail: "12 min left", minsLeft: 12, cta: "Join session" },
  { id: "marko-pr-review", name: "Marko V.", topic: "PR architecture review", status: "Live", detail: "8 min left", minsLeft: 8, cta: "Join session" },
  { id: "nina-ts-narrowing", name: "Nina Petrova", topic: "TypeScript narrowing", status: "Starting", detail: "11 min left", minsLeft: 11, cta: "View" },
];

const progressFor = (minsLeft: number) =>
  Math.max(18, Math.min(96, Math.round(((30 - minsLeft) / 30) * 100)));

export default function LiveSessionsCard() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [room, setRoom] = useState<LiveSession | null>(null);
  const [viewing, setViewing] = useState<LiveSession | null>(null);
  const joinTimer = useRef<number | null>(null);

  // Clear a pending join timeout if the card unmounts mid-join.
  useEffect(() => () => {
    if (joinTimer.current) window.clearTimeout(joinTimer.current);
  }, []);

  const join = (session: LiveSession) => {
    if (loadingId) return; // a join is already in flight
    setLoadingId(session.id);
    joinTimer.current = window.setTimeout(() => {
      joinTimer.current = null;
      setLoadingId(null);
      setViewing(null);
      setRoom(session);
      toast.success("Successfully joined session");
    }, 1000);
  };

  const renderJoinButton = (session: LiveSession) => {
    const loading = loadingId === session.id;
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => join(session)}
        className="h-7 rounded-lg px-2.5 text-[11px] gap-1 group-hover:border-primary/40 group-hover:text-primary [&_svg]:size-3"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" /> Joining…
          </>
        ) : (
          "Join session"
        )}
      </Button>
    );
  };

  return (
    <>
      <section className="feed-card relative overflow-hidden p-6 sm:p-7 border-primary/15 shadow-[0_12px_40px_-20px_hsl(var(--primary)/0.45)]">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.22)_0%,transparent_70%)] pointer-events-none" aria-hidden />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.18)_0%,transparent_72%)] pointer-events-none" aria-hidden />

        <div className="flex items-center justify-between gap-3 relative">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base sm:text-[1.05rem] font-semibold tracking-tight">Live sessions happening now</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live right now
          </span>
        </div>

        <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

        <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 relative">
          {LIVE_SESSIONS.map((s) => {
            const progress = progressFor(s.minsLeft);
            return (
              <div key={s.id} className="group rounded-xl border border-border/70 bg-background/55 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_10px_28px_-18px_hsl(var(--primary)/0.45)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.topic}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    {s.status}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {s.detail}
                  </span>
                  {s.cta === "View" ? (
                    <Button size="sm" variant="outline" className="h-7 rounded-lg px-2.5 text-[11px] group-hover:border-primary/40 group-hover:text-primary" onClick={() => setViewing(s)}>
                      View
                    </Button>
                  ) : (
                    renderJoinButton(s)
                  )}
                </div>

                <div className="mt-3 h-1.5 rounded-full bg-secondary/65 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500/80 to-emerald-500/80 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-500" />
                  <DialogTitle>{viewing.name}</DialogTitle>
                </div>
                <DialogDescription>{viewing.topic}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {viewing.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Time left</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {viewing.detail}
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span>{progressFor(viewing.minsLeft)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary/65 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500/80 to-emerald-500/80 transition-all duration-300" style={{ width: `${progressFor(viewing.minsLeft)}%` }} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => join(viewing)}
                  disabled={loadingId === viewing.id}
                  className="rounded-xl gap-1.5"
                >
                  {loadingId === viewing.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Joining…
                    </>
                  ) : (
                    "Join session"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <SessionRoomDialog session={room} onClose={() => setRoom(null)} />
    </>
  );
}
