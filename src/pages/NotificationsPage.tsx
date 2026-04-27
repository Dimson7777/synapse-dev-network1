import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import EmptyState from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Heart, UserPlus, MessageCircle, Check } from "lucide-react";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Profile } from "@/types";

interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: "like" | "follow" | "comment";
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
}

const ICONS = {
  like: Heart,
  follow: UserPlus,
  comment: MessageCircle,
} as const;

const LABELS = {
  like: "liked your post",
  follow: "started following you",
  comment: "commented on your post",
} as const;

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        toast.error("Couldn't load notifications");
        setIsLoading(false);
        return;
      }

      const items = (data ?? []) as Notification[];

      // Fetch actor profiles in one go
      const actorIds = [...new Set(items.map((n) => n.actor_id))];
      if (actorIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", actorIds);

        const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
        items.forEach((n) => {
          n.actor = profileMap.get(n.actor_id) as Profile | undefined;
        });
      }

      setNotifications(items);
      setIsLoading(false);
    }

    load();

    // Realtime: listen for new notifications
    const channel = supabase
      .channel("my-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const notif = payload.new as Notification;
          const { data: actor } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", notif.actor_id)
            .single();
          notif.actor = actor as Profile;
          setNotifications((prev) => [notif, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    if (error) toast.error("Couldn't mark as read");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-accent flex items-center justify-center">
              <Bell className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="page-header">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="rounded-xl gap-1.5 text-xs">
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="feed-card p-4 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 py-3">
                <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded-md" />
                  <div className="h-3 w-24 bg-muted rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-7 w-7" />}
            title="No notifications yet"
            description="When someone likes your post or follows you, you'll see it here"
          />
        ) : (
          <div className="feed-card divide-y divide-border/50">
            {notifications.map((notif) => {
              const Icon = ICONS[notif.type];
              const actor = notif.actor;
              return (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-center gap-3 px-5 py-4 transition-colors",
                    !notif.read && "bg-accent/30"
                  )}
                >
                  <Link to={actor ? `/u/${actor.username}` : "#"} className="shrink-0">
                    <Avatar className="h-10 w-10 ring-2 ring-border">
                      <AvatarImage src={actor?.avatar_url || undefined} />
                      <AvatarFallback className="gradient-bg text-primary-foreground text-xs font-semibold">
                        {getInitials(actor?.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <Link to={actor ? `/u/${actor.username}` : "#"} className="font-semibold hover:text-primary transition-colors">
                        {actor?.display_name ?? "Someone"}
                      </Link>{" "}
                      <span className="text-muted-foreground">{LABELS[notif.type]}</span>
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(notif.created_at))}
                    </time>
                  </div>
                  <Icon className={cn(
                    "h-4 w-4 shrink-0",
                    notif.type === "like" && "text-destructive",
                    notif.type === "follow" && "text-primary",
                    notif.type === "comment" && "text-primary"
                  )} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
