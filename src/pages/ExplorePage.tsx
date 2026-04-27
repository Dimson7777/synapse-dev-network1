import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { fetchGlobalFeed, fetchTrendingPosts, fetchSuggestedUsers, toggleFollow } from "@/lib/api";
import { DEMO_POSTS, DEMO_PROFILES, DEMO_ACTIVE_USERS } from "@/lib/demo-data";
import AppLayout from "@/components/layout/AppLayout";
import PostCard from "@/components/feed/PostCard";
import PostSkeleton from "@/components/feed/PostSkeleton";
import UserCard from "@/components/shared/UserCard";
import UserSkeleton from "@/components/explore/UserSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Flame, Clock, Sparkles, Users, Compass, MessageCircle, Zap, PenLine } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import type { PostWithAuthor, Profile } from "@/types";

const ENGAGEMENT_PROMPTS = [
  { icon: <MessageCircle className="h-4 w-4" />, text: "People are sharing ideas — jump in!" },
  { icon: <Zap className="h-4 w-4" />, text: "Conversations are happening now" },
  { icon: <Sparkles className="h-4 w-4" />, text: "Your next great connection is a post away" },
];

export default function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentPosts, setRecentPosts] = useState<PostWithAuthor[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<PostWithAuthor[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("trending");
  const [hasRealData, setHasRealData] = useState(true);

  const engagementPrompt = useMemo(
    () => ENGAGEMENT_PROMPTS[Math.floor(Math.random() * ENGAGEMENT_PROMPTS.length)],
    []
  );

  useEffect(() => {
    Promise.all([
      fetchGlobalFeed(0, 30, user?.id),
      fetchTrendingPosts(20, user?.id),
      user ? fetchSuggestedUsers(user.id) : Promise.resolve([]),
    ])
      .then(([recent, trending, suggested]) => {
        const realDataExists = recent.length > 0;
        setHasRealData(realDataExists);

        // Fallback to demo content when the database is empty
        setRecentPosts(realDataExists ? recent : DEMO_POSTS);
        setTrendingPosts(
          trending.length > 0
            ? trending
            : realDataExists
              ? recent.slice(0, 10)
              : [...DEMO_POSTS].sort((a, b) => b.likes_count - a.likes_count)
        );
        setSuggestedUsers(suggested.length > 0 ? suggested : DEMO_PROFILES);
      })
      .catch(() => {
        // Even on error, show demo content
        setHasRealData(false);
        setRecentPosts(DEMO_POSTS);
        setTrendingPosts([...DEMO_POSTS].sort((a, b) => b.likes_count - a.likes_count));
        setSuggestedUsers(DEMO_PROFILES);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Derive "most active" users from posts, fallback to demo
  const activeUsers = useMemo(() => {
    if (!hasRealData) return DEMO_ACTIVE_USERS;

    const authorMap = new Map<string, { profile: Profile; postCount: number; totalLikes: number }>();
    for (const post of recentPosts) {
      const p = post.profiles;
      if (!p) continue;
      const existing = authorMap.get(p.user_id);
      if (existing) {
        existing.postCount++;
        existing.totalLikes += post.likes_count;
      } else {
        authorMap.set(p.user_id, { profile: p as Profile, postCount: 1, totalLikes: post.likes_count });
      }
    }
    return Array.from(authorMap.values())
      .sort((a, b) => b.postCount + b.totalLikes - (a.postCount + a.totalLikes))
      .slice(0, 5);
  }, [recentPosts, hasRealData]);

  const removePost = (id: string) => {
    setRecentPosts((p) => p.filter((x) => x.id !== id));
    setTrendingPosts((p) => p.filter((x) => x.id !== id));
  };

  const patchPost = (updated: PostWithAuthor) => {
    const swap = (p: PostWithAuthor[]) => p.map((x) => (x.id === updated.id ? updated : x));
    setRecentPosts(swap);
    setTrendingPosts(swap);
  };

  const handleFollow = async (targetId: string) => {
    if (!user) {
      toast.error("Sign in to follow people");
      return;
    }
    // Don't allow following demo users
    if (targetId.startsWith("demo-")) {
      toast("Sign up to follow real users!", { icon: "✨" });
      return;
    }
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

  const renderPosts = (posts: PostWithAuthor[], emptyIcon: React.ReactNode, emptyMsg: string, emptyDesc?: string) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <PostSkeleton key={i} />)}
        </div>
      );
    }
    if (!posts.length) {
      return <EmptyState icon={emptyIcon} title={emptyMsg} description={emptyDesc} />;
    }
    return (
      <div className="space-y-4 stagger-children">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onDelete={removePost} onUpdate={patchPost} />
        ))}
      </div>
    );
  };

  const totalPosts = recentPosts.length;
  const totalActiveUsers = activeUsers.length;

  return (
    <AppLayout>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="space-y-6 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl gradient-bg flex items-center justify-center shadow-md">
              <Compass className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="page-header">Explore</h1>
              <p className="text-sm text-muted-foreground">Discover posts, people, and conversations</p>
            </div>
          </div>

          {/* Join the conversation CTA */}
          {!loading && (
            <div className="feed-card p-5 gradient-border animate-fade-in">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <PenLine className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Join the conversation</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      {engagementPrompt.icon}
                      {engagementPrompt.text}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 gradient-bg border-0 text-primary-foreground hover:opacity-90"
                  onClick={() => user ? navigate("/") : navigate("/auth")}
                >
                  {user ? "Write a post" : "Create your first post"}
                </Button>
              </div>
            </div>
          )}

          {/* Quick stats */}
          {!loading && (
            <div className="flex gap-3 flex-wrap animate-fade-in">
              <div className="feed-card px-4 py-2.5 flex items-center gap-2">
                <Flame className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">🔥 {totalPosts} posts today</span>
              </div>
              <div className="feed-card px-4 py-2.5 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">👀 {totalActiveUsers} active users</span>
              </div>
            </div>
          )}

          {/* Demo banner */}
          {!loading && !hasRealData && (
            <div className="rounded-xl bg-accent/50 border border-accent px-4 py-3 text-sm text-accent-foreground animate-fade-in flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>
                You're seeing sample content.{" "}
                <button
                  className="font-semibold underline underline-offset-2 hover:text-primary transition-colors"
                  onClick={() => user ? navigate("/") : navigate("/auth")}
                >
                  {user ? "Create a post" : "Sign up"}
                </button>{" "}
                to make it real!
              </span>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-2 h-11 bg-secondary/50 rounded-xl p-1">
              <TabsTrigger value="trending" className="rounded-lg gap-2 data-[state=active]:shadow-sm transition-all">
                <Flame className="h-4 w-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="recent" className="rounded-lg gap-2 data-[state=active]:shadow-sm transition-all">
                <Clock className="h-4 w-4" />
                Recent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trending" className="mt-5 space-y-4 animate-fade-in">
              {renderPosts(trendingPosts, <Flame className="h-7 w-7" />, "Nothing trending yet", "Be the first to post something — it might just go viral!")}
            </TabsContent>
            <TabsContent value="recent" className="mt-5 space-y-4 animate-fade-in">
              {renderPosts(recentPosts, <Clock className="h-7 w-7" />, "No posts yet", "The community is just getting started — share something!")}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-5">
          {/* Most active users */}
          <div className="feed-card p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="section-label m-0">Most active</h3>
            </div>
            {loading ? (
              <div className="space-y-1">
                {[1, 2, 3].map((i) => <UserSkeleton key={i} />)}
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {activeUsers.map(({ profile, postCount, totalLikes }) => (
                  <div
                    key={profile.user_id}
                    className="flex items-center gap-3 group cursor-pointer rounded-lg hover:bg-accent/30 p-2 -mx-2 transition-colors"
                    onClick={() =>
                      profile.user_id.startsWith("demo-")
                        ? toast("This is a sample user", { icon: "👋" })
                        : navigate(`/u/${profile.username}`)
                    }
                  >
                    <Avatar className="h-9 w-9 ring-2 ring-border group-hover:ring-primary/20 transition-all">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="gradient-bg text-primary-foreground text-xs font-semibold">
                        {getInitials(profile.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {profile.display_name || profile.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {postCount} post{postCount !== 1 ? "s" : ""} · {totalLikes} ❤️
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggested users */}
          <div className="feed-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="section-label m-0">People to follow</h3>
            </div>
            {loading ? (
              <div className="space-y-1">
                {[1, 2, 3].map((i) => <UserSkeleton key={i} />)}
              </div>
            ) : (
              <div className="space-y-1 stagger-children">
                {suggestedUsers.map((profile) => (
                  <UserCard
                    key={profile.id}
                    profile={profile}
                    showFollowButton
                    isFollowing={followedIds.has(profile.user_id)}
                    onToggleFollow={() => handleFollow(profile.user_id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Trending highlights */}
          {!loading && trendingPosts.length > 0 && (
            <div className="feed-card p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="section-label m-0">Top posts</h3>
              </div>
              <div className="space-y-3">
                {trendingPosts.slice(0, 3).map((post, i) => (
                  <div key={post.id} className="flex items-start gap-3 group cursor-pointer rounded-lg hover:bg-accent/30 p-2 -mx-2 transition-colors">
                    <span className="text-lg font-bold text-muted-foreground/50 mt-0.5 tabular-nums">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {post.content.slice(0, 100)}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>❤️ {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </AppLayout>
  );
}
