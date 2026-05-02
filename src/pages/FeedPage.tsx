import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchGlobalFeed, fetchFollowingFeed, fetchSuggestedUsers, fetchTrendingPosts, toggleFollow } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import CreatePostForm from "@/components/feed/CreatePostForm";
import PostCard from "@/components/feed/PostCard";
import PostSkeleton from "@/components/feed/PostSkeleton";
import TrendingPostCard from "@/components/feed/TrendingPostCard";
import UserCard from "@/components/shared/UserCard";
import EmptyState from "@/components/shared/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, Users, Sparkles, TrendingUp, Radio, Clock3, PlayCircle, CalendarClock, MessageSquareDashed } from "lucide-react";
import { toast } from "sonner";
import type { PostWithAuthor, Profile } from "@/types";

const PAGE_SIZE = 20;

const LIVE_SESSIONS = [
  {
    name: "Sara Kim",
    topic: "React state bug",
    status: "Live",
    detail: "12 min left",
    minsLeft: 12,
    cta: "Join session",
  },
  {
    name: "Marko V.",
    topic: "PR architecture review",
    status: "Live",
    detail: "8 min left",
    minsLeft: 8,
    cta: "Join session",
  },
  {
    name: "Nina Petrova",
    topic: "TypeScript narrowing",
    status: "Starting",
    detail: "11 min left",
    minsLeft: 11,
    cta: "View",
  },
];

const ACTIVE_SESSION_SIDEBAR = [
  { title: "React perf debugging", timeLeft: "11 min left", progress: 72 },
  { title: "Code review pairing", timeLeft: "18 min left", progress: 54 },
  { title: "Node API troubleshooting", timeLeft: "24 min left", progress: 32 },
];

export default function FeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("global");

  const [globalPosts, setGlobalPosts] = useState<PostWithAuthor[]>([]);
  const [followingPosts, setFollowingPosts] = useState<PostWithAuthor[]>([]);
  const [suggested, setSuggested] = useState<Profile[]>([]);
  const [trending, setTrending] = useState<PostWithAuthor[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [globalPage, setGlobalPage] = useState(0);
  const [followingPage, setFollowingPage] = useState(0);
  const [moreGlobal, setMoreGlobal] = useState(true);
  const [moreFollowing, setMoreFollowing] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset all local state when the user changes (login/logout/switch)
  useEffect(() => {
    setGlobalPosts([]);
    setFollowingPosts([]);
    setSuggested([]);
    setTrending([]);
    setFollowedIds(new Set());
    setGlobalPage(0);
    setFollowingPage(0);
    setMoreGlobal(true);
    setMoreFollowing(true);
    setLoading(true);
  }, [user?.id]);

  const loadGlobal = useCallback(async (page: number) => {
    const posts = await fetchGlobalFeed(page, PAGE_SIZE, user?.id);
    if (posts.length < PAGE_SIZE) setMoreGlobal(false);
    return posts;
  }, [user?.id]);

  const loadFollowing = useCallback(async (page: number) => {
    if (!user) return [];
    const posts = await fetchFollowingFeed(user.id, page, PAGE_SIZE);
    if (posts.length < PAGE_SIZE) setMoreFollowing(false);
    return posts;
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const [g, f] = await Promise.all([
          loadGlobal(0),
          user ? loadFollowing(0) : Promise.resolve([]),
        ]);
        setGlobalPosts(g);
        setFollowingPosts(f);

        if (user) {
          const [s, t] = await Promise.all([
            fetchSuggestedUsers(user.id),
            fetchTrendingPosts(5, user.id),
          ]);
          setSuggested(s);
          // Fallback: if no trending posts (all 0 likes), use latest posts
          setTrending(t.length > 0 ? t : g.slice(0, 5));
        }
      } catch {
        toast.error("Couldn't load your feed. Try refreshing.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, loadGlobal, loadFollowing]);

  const addPost = (post: PostWithAuthor) => setGlobalPosts((prev) => [post, ...prev]);

  const removePost = (id: string) => {
    setGlobalPosts((p) => p.filter((x) => x.id !== id));
    setFollowingPosts((p) => p.filter((x) => x.id !== id));
  };

  const patchPost = (updated: PostWithAuthor) => {
    const swap = (p: PostWithAuthor[]) => p.map((x) => (x.id === updated.id ? updated : x));
    setGlobalPosts(swap);
    setFollowingPosts(swap);
  };

  const loadMore = async (feed: "global" | "following") => {
    setLoadingMore(true);
    try {
      if (feed === "global") {
        const next = globalPage + 1;
        const posts = await loadGlobal(next);
        setGlobalPosts((prev) => [...prev, ...posts]);
        setGlobalPage(next);
      } else {
        const next = followingPage + 1;
        const posts = await loadFollowing(next);
        setFollowingPosts((prev) => [...prev, ...posts]);
        setFollowingPage(next);
      }
    } catch {
      toast.error("Couldn't load more posts");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    const was = followedIds.has(targetId);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      was ? next.delete(targetId) : next.add(targetId);
      return next;
    });
    try {
      await toggleFollow(user.id, targetId, was);
      toast.success(was ? "Unfollowed" : "Following!");
    } catch {
      setFollowedIds((prev) => {
        const next = new Set(prev);
        was ? next.add(targetId) : next.delete(targetId);
        return next;
      });
      toast.error("Couldn't update follow status");
    }
  };

  // Infinite scroll
  const globalSentinelRef = useRef<HTMLDivElement>(null);
  const followingSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = tab === "global" ? globalSentinelRef.current : followingSentinelRef.current;
    const hasMore = tab === "global" ? moreGlobal : moreFollowing;
    if (!sentinel || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(tab as "global" | "following"); },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [tab, moreGlobal, moreFollowing, loading, loadingMore, globalPage, followingPage]);

  const renderFeed = (
    posts: PostWithAuthor[],
    hasMore: boolean,
    sentinelRef: React.RefObject<HTMLDivElement | null>,
    emptyIcon: React.ReactNode,
    emptyMsg: string,
    emptyDesc?: string,
    emptyAction?: React.ReactNode
  ) => {
    if (loading) {
      return <div className="space-y-4">{[1, 2, 3].map((i) => <PostSkeleton key={i} />)}</div>;
    }
    if (!posts.length) {
      return <EmptyState icon={emptyIcon} title={emptyMsg} description={emptyDesc} action={emptyAction} />;
    }
    return (
      <div className="space-y-4 stagger-children">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onDelete={removePost} onUpdate={patchPost} />
        ))}
        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-7 min-w-0">
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
                const progress = Math.max(18, Math.min(96, Math.round(((30 - s.minsLeft) / 30) * 100)));
                return (
                  <div key={`${s.name}-${s.topic}`} className="group rounded-xl border border-border/70 bg-background/55 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_10px_28px_-18px_hsl(var(--primary)/0.45)]">
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
                      <Button size="sm" variant="outline" className="h-7 rounded-lg px-2.5 text-[11px] group-hover:border-primary/40 group-hover:text-primary" onClick={() => toast.success(`Opening ${s.topic}`)}>
                        {s.cta}
                      </Button>
                    </div>

                    <div className="mt-3 h-1.5 rounded-full bg-secondary/65 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500/80 to-emerald-500/80 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" aria-hidden />

          <div id="feed-composer" className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-[radial-gradient(circle,rgba(124,58,237,0.13)_0%,transparent_65%)] pointer-events-none" aria-hidden />
            <CreatePostForm onPostCreated={addPost} />
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden />

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-2 h-11 bg-secondary/50 rounded-xl p-1">
              <TabsTrigger value="global" className="rounded-lg gap-2 data-[state=active]:shadow-sm transition-all">
                <Globe className="h-4 w-4" /> Global
              </TabsTrigger>
              <TabsTrigger value="following" className="rounded-lg gap-2 data-[state=active]:shadow-sm transition-all">
                <Users className="h-4 w-4" /> Following
              </TabsTrigger>
            </TabsList>

            <TabsContent value="global" className="mt-5 space-y-4 animate-fade-in">
              {renderFeed(
                globalPosts, moreGlobal, globalSentinelRef,
                <MessageSquareDashed className="h-7 w-7" />,
                "Start your first session or share what you're building",
                "Post a blocker, ask for review, or open a quick live session with another developer.",
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button size="sm" className="rounded-xl" onClick={() => toast.success("Session composer opened")}>Start session</Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => document.getElementById("feed-composer")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Create post</Button>
                </div>
              )}
              {!loading && !globalPosts.length && (
                <p className="text-[11px] text-center text-muted-foreground/90 inline-flex items-center justify-center gap-1.5 w-full animate-fade-in">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Someone is starting a session...
                </p>
              )}
            </TabsContent>
            <TabsContent value="following" className="mt-5 space-y-4 animate-fade-in">
              {renderFeed(
                followingPosts, moreFollowing, followingSentinelRef,
                <Users className="h-7 w-7" />,
                "Your feed is empty",
                "Follow developers from the Explore or Search pages to see their posts here"
              )}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-5">
          {trending.length > 0 && (
            <div className="feed-card p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="section-label m-0">Trending in dev 🔥</h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">
                What developers are talking about today
              </p>
              <div className="space-y-0.5 stagger-children">
                {trending.map((post, i) => (
                  <TrendingPostCard key={post.id} post={post} rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          <div className="feed-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="section-label m-0">Developers available now</h3>
            </div>
            {suggested.length > 0 ? (
              <div className="space-y-2 stagger-children">
                {suggested.slice(0, 4).map((p, idx) => {
                  const status = idx % 3 === 0 ? "Busy" : "Available";
                  const statusTone = status === "Available" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400";
                  return (
                    <div key={p.id} className="group rounded-xl border border-border/55 bg-background/40 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_8px_22px_-16px_hsl(var(--primary)/0.45)]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{p.display_name || p.username}</p>
                          <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                        </div>
                        <span className={`text-[10px] inline-flex items-center gap-1 ${statusTone}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status === "Available" ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
                          {status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleFollow(p.user_id)}
                          className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                        >
                          {followedIds.has(p.user_id) ? "Following" : "Follow"}
                        </button>
                        <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {status === "Available" ? "Book" : "Join"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No developers are online right now.</p>
            )}
          </div>

          <div className="feed-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h3 className="section-label m-0">Active sessions</h3>
            </div>
            <div className="space-y-2">
              {ACTIVE_SESSION_SIDEBAR.map((item) => (
                <div key={item.title} className="group rounded-lg border border-border/55 px-3 py-2.5 text-xs text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_8px_22px_-16px_hsl(var(--primary)/0.45)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="truncate">{item.title}</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{item.timeLeft}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500/75 to-emerald-500/80" style={{ width: `${item.progress}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-end">
                    <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">Join</span>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4 rounded-xl h-9 gap-2" onClick={() => toast.success("Start a session") }>
              <PlayCircle className="h-4 w-4" />
              Start a session
            </Button>
          </div>

          {suggested.length > 0 && (
            <div className="feed-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="section-label m-0">Suggested for you</h3>
              </div>
              <div className="space-y-1 stagger-children">
                {suggested.slice(4, 8).map((p) => (
                  <UserCard
                    key={p.id}
                    profile={p}
                    showFollowButton
                    isFollowing={followedIds.has(p.user_id)}
                    onToggleFollow={() => handleFollow(p.user_id)}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </AppLayout>
  );
}
