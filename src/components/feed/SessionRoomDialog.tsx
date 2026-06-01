import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Clock3, LogOut, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

export interface SessionRoomData {
  id: string;
  name: string; // host
  topic: string; // session title
  status: "Live" | "Starting";
  detail: string;
  minsLeft: number;
}

interface SessionRoomDialogProps {
  session: SessionRoomData | null;
  onClose: () => void;
}

export default function SessionRoomDialog({ session, onClose }: SessionRoomDialogProps) {
  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0 overflow-hidden">
        {/* Mount the room only while open so all of its timers are torn down on close. */}
        {session && <SessionRoom session={session} onLeave={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

type Message = {
  id: number;
  author: string;
  text: string;
  self?: boolean;
  system?: boolean;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function SessionRoom({ session, onLeave }: { session: SessionRoomData; onLeave: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(session.minsLeft * 60);
  const [participants, setParticipants] = useState<string[]>([session.name, "You", "Priya Sharma"]);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, author: session.name, text: `Welcome in! We're digging into ${session.topic.toLowerCase()}.` },
    { id: 2, author: "Priya Sharma", text: "Dropped the repo link in the shared notes 👀" },
  ]);
  const [typing, setTyping] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const nextId = useRef(3);
  const replyTimers = useRef<number[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const pushMessage = (msg: Omit<Message, "id">) =>
    setMessages((prev) => [...prev, { ...msg, id: nextId.current++ }]);

  // Live countdown — ticks every second, cleared on unmount.
  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Scripted mock participant activity — finite sequence, cleared on unmount.
  useEffect(() => {
    let step = 0;
    const script: Array<() => void> = [
      () => {
        setParticipants((p) => (p.includes("Marco Rivera") ? p : [...p, "Marco Rivera"]));
        pushMessage({ author: "System", text: "Marco Rivera joined the session", system: true });
      },
      () => pushMessage({ author: "Priya Sharma", text: "Try logging state inside the effect cleanup." }),
      () => pushMessage({ author: "System", text: "Alex Kim is reviewing the PR", system: true }),
    ];
    const id = window.setInterval(() => {
      script[step]?.();
      step += 1;
      if (step >= script.length) window.clearInterval(id);
    }, 6500);
    return () => window.clearInterval(id);
  }, []);

  // Clear any pending scripted-reply timers on unmount (covers Leave / Esc / overlay).
  useEffect(() => () => replyTimers.current.forEach((t) => window.clearTimeout(t)), []);

  // Keep the latest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages, typing]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeLabel = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    pushMessage({ author: "You", text, self: true });
    setDraft("");

    // Subtle scripted reply from the host.
    const t1 = window.setTimeout(() => setTyping(session.name), 650);
    const t2 = window.setTimeout(() => {
      setTyping(null);
      pushMessage({ author: session.name, text: "Good call — let's walk through it together." });
    }, 1800);
    replyTimers.current.push(t1, t2);
  };

  const handleLeave = () => {
    toast.success("You left the session");
    onLeave();
  };

  return (
    <div className="flex max-h-[88vh] flex-col">
      {/* Header */}
      <div className="border-b border-border/60 p-5 pr-12">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base">{session.topic}</DialogTitle>
            <DialogDescription className="mt-0.5 truncate">
              Hosted by <span className="font-medium text-foreground">{session.name}</span>
            </DialogDescription>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {session.status}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums text-foreground">{timeLabel}</span> remaining
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {participants.length}
            </span>
            <div className="flex -space-x-2">
              {participants.slice(0, 4).map((p) => (
                <Avatar key={p} className="h-7 w-7 ring-2 ring-background">
                  <AvatarFallback className="gradient-bg text-[10px] font-semibold text-primary-foreground">
                    {getInitials(p)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {participants.length > 4 && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-medium ring-2 ring-background">
                  +{participants.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-[200px] flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) =>
          m.system ? (
            <p key={m.id} className="animate-fade-in text-center text-[11px] text-muted-foreground">
              {m.text}
            </p>
          ) : (
            <div key={m.id} className={`flex animate-fade-in items-start gap-2 ${m.self ? "flex-row-reverse" : ""}`}>
              <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                <AvatarFallback className={`text-[10px] font-semibold ${m.self ? "bg-primary text-primary-foreground" : "gradient-bg text-primary-foreground"}`}>
                  {getInitials(m.author)}
                </AvatarFallback>
              </Avatar>
              <div className={`max-w-[78%] ${m.self ? "items-end text-right" : ""}`}>
                <p className="text-[11px] text-muted-foreground">{m.self ? "You" : m.author}</p>
                <div className={`mt-0.5 inline-block rounded-2xl px-3 py-1.5 text-sm ${m.self ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-secondary text-foreground"}`}>
                  {m.text}
                </div>
              </div>
            </div>
          ),
        )}
        {typing && (
          <p className="animate-fade-in text-[11px] text-muted-foreground" aria-live="polite">
            {typing} is typing…
          </p>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer + Leave */}
      <div className="space-y-2 border-t border-border/60 p-3">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message the room…"
            maxLength={300}
            className="h-9 rounded-xl"
            aria-label="Message the room"
          />
          <Button type="submit" size="sm" disabled={!draft.trim()} className="h-9 rounded-xl gap-1.5">
            <Send className="h-4 w-4" /> Send
          </Button>
        </form>
        <Button
          variant="outline"
          onClick={handleLeave}
          className="h-9 w-full rounded-xl gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Leave Session
        </Button>
      </div>
    </div>
  );
}
