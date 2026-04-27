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
import { Loader2, Globe, Users, Sparkles, PenLine, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import type { PostWithAuthor, Profile } from "@/types";

const PAGE_SIZE = 20;

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
    emptyDesc?: string
  ) => {
    if (loading) {
      return <div className="space-y-4">{[1, 2, 3].map((i) => <PostSkeleton key={i} />)}</div>;
    }
    if (!posts.length) {
      return <EmptyState icon={emptyIcon} title={emptyMsg} description={emptyDesc} />;
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
        <div className="space-y-6 min-w-0">
          <CreatePostForm onPostCreated={addPost} />

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
                <PenLine className="h-7 w-7" />,
                "No posts yet",
                "Share your first thought with the community — your post will appear here!"
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

        <aside className="hidden lg:block space-y-5">
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

          {suggested.length > 0 && (
            <div className="feed-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="section-label m-0">Suggested for you</h3>
              </div>
              <div className="space-y-1 stagger-children">
                {suggested.map((p) => (
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
