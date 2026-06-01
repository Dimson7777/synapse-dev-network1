import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Check,
  Loader2,
  MessageCircle,
  Radio,
  Send,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types";

export interface ActiveUserEntry {
  profile: Profile;
  postCount: number;
  totalLikes: number;
}

interface ActiveUserDialogProps {
  entry: ActiveUserEntry | null;
  onOpenChange: (open: boolean) => void;
}

type View = "compact" | "expanded";

const SKILL_POOL = ["React", "TypeScript", "Node.js", "CSS", "GraphQL", "Testing", "System design", "Rust", "Go", "DX"];

// Deterministic mock details so the expanded view stays consistent per user.
function buildExtras(entry: ActiveUserEntry) {
  const seed = entry.profile.username.length + entry.postCount + entry.totalLikes;
  const skills: string[] = [];
  for (let i = 0; skills.length < 4 && i < SKILL_POOL.length; i++) {
    const s = SKILL_POOL[(seed + i * 3) % SKILL_POOL.length];
    if (!skills.includes(s)) skills.push(s);
  }
  const activeSessions = (entry.postCount % 3) + 1;
  const activity = [
    { text: `Hosted a live session on ${skills[0]}`, time: "2h ago" },
    { text: `Shared a post · ${entry.totalLikes} reactions`, time: "8h ago" },
    { text: `Replied in a ${skills[1]} thread`, time: "1d ago" },
  ];
  return { skills, activeSessions, activity };
}

export default function ActiveUserDialog({ entry, onOpenChange }: ActiveUserDialogProps) {
  const [view, setView] = useState<View>("compact");
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");

  const profile = entry?.profile;
  const name = profile?.display_name || profile?.username || "Developer";

  // Reset all per-user mock state whenever a different user is opened.
  useEffect(() => {
    setView("compact");
    setFollowing(false);
    setFollowLoading(false);
    setMessageOpen(false);
    setMessageText("");
  }, [entry?.profile.user_id]);

  const extras = useMemo(() => (entry ? buildExtras(entry) : null), [entry]);

  const toggleFollow = () => {
    if (followLoading) return;
    setFollowLoading(true);
    // Frontend-only mock: brief loading, then settle into the new state.
    window.setTimeout(() => {
      setFollowing((prev) => {
        const next = !prev;
        toast.success(next ? `You are now following ${name}` : `Unfollowed ${name}`);
        return next;
      });
      setFollowLoading(false);
    }, 700);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setMessageOpen(false);
    setMessageText("");
    toast.success(`Message sent to ${name}`);
  };

  // Render helper (not a nested component) so the button keeps focus across re-renders.
  const renderFollowButton = (className?: string) => (
    <Button
      variant={following ? "secondary" : "default"}
      onClick={toggleFollow}
      disabled={followLoading}
      className={`rounded-xl gap-1.5 ${className ?? ""}`}
    >
      {followLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <>
          <Check className="h-4 w-4" /> Following
        </>
      ) : (
        "Follow"
      )}
    </Button>
  );

  return (
    <>
      <Dialog
        open={!!entry}
        onOpenChange={(open) => {
          if (!open) setView("compact");
          onOpenChange(open);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
          {profile && entry && extras && (
            view === "compact" ? (
              <div key="compact" className="animate-fade-in">
                <DialogHeader className="items-center text-center sm:text-center">
                  <Avatar className="h-16 w-16 ring-2 ring-border">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="gradient-bg text-primary-foreground text-base font-semibold">
                      {getInitials(profile.display_name || profile.username)}
                    </AvatarFallback>
                  </Avatar>
                  <DialogTitle className="mt-2">{name}</DialogTitle>
                  <DialogDescription>@{profile.username}</DialogDescription>
                </DialogHeader>

                <div className="flex justify-center gap-8 py-3">
                  <div className="text-center">
                    <p className="text-base font-semibold">{entry.postCount}</p>
                    <p className="text-[11px] text-muted-foreground">Post{entry.postCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold">{entry.totalLikes}</p>
                    <p className="text-[11px] text-muted-foreground">Likes</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center px-2">
                  {profile.bio?.trim() || "An active developer sharing what they build with the community."}
                </p>

                <DialogFooter className="sm:justify-center gap-2 mt-4">
                  {renderFollowButton()}
                  <Button variant="outline" onClick={() => setView("expanded")} className="rounded-xl">
                    View profile
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div key="expanded" className="animate-fade-in">
                <DialogHeader className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setView("compact")}
                    className="inline-flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground transition-colors -ml-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <div className="flex items-center gap-3 text-left">
                    <Avatar className="h-14 w-14 ring-2 ring-border">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="gradient-bg text-primary-foreground text-base font-semibold">
                        {getInitials(profile.display_name || profile.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <DialogTitle className="truncate">{name}</DialogTitle>
                      <DialogDescription className="truncate">@{profile.username}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {profile.bio?.trim() || "An active developer sharing what they build with the community."}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-border/60 bg-background/40 py-2">
                      <p className="text-base font-semibold">{entry.postCount}</p>
                      <p className="text-[11px] text-muted-foreground">Posts</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/40 py-2">
                      <p className="text-base font-semibold">{entry.totalLikes}</p>
                      <p className="text-[11px] text-muted-foreground">Likes</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/40 py-2">
                      <p className="inline-flex items-center justify-center gap-1 text-base font-semibold">
                        <Radio className="h-3.5 w-3.5 text-emerald-500" />
                        {extras.activeSessions}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Sessions</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Skills &amp; interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {extras.skills.map((s) => (
                        <span key={s} className="inline-flex items-center text-xs font-medium bg-accent text-accent-foreground rounded-full px-2.5 py-0.5">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent activity</p>
                    <ul className="space-y-2">
                      {extras.activity.map((a) => (
                        <li key={a.text} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                          <span className="flex-1 text-muted-foreground">{a.text}</span>
                          <span className="text-[11px] text-muted-foreground/80 whitespace-nowrap">{a.time}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <DialogFooter className="flex-row flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setMessageOpen(true)}
                    className="rounded-xl gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4" /> Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toast.success(`Invitation sent to ${name}`)}
                    className="rounded-xl gap-1.5"
                  >
                    <UserPlus className="h-4 w-4" /> Invite
                  </Button>
                  {renderFollowButton()}
                </DialogFooter>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Message composer — layered on top of the expanded view. */}
      <Dialog
        open={messageOpen}
        onOpenChange={(open) => {
          setMessageOpen(open);
          if (!open) setMessageText("");
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Message {name}
            </DialogTitle>
            <DialogDescription>Send a quick note. This is a demo — nothing is sent or stored.</DialogDescription>
          </DialogHeader>

          <form onSubmit={sendMessage} className="space-y-3 py-1">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Say hi to ${name}…`}
              maxLength={500}
              className="resize-none min-h-[110px] rounded-xl"
              autoFocus
            />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setMessageOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={!messageText.trim()} className="rounded-xl gap-1.5">
                <Send className="h-4 w-4" /> Send
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
