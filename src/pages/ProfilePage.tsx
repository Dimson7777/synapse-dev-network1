import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchProfileByUsername,
  fetchUserPosts,
  fetchFollowCounts,
  checkIsFollowing,
  toggleFollow,
} from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import PostCard from "@/components/feed/PostCard";
import PostSkeleton from "@/components/feed/PostSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import BookSessionDialog from "@/components/booking/BookSessionDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Link as LinkIcon, Github, Calendar, PenLine, UserCheck, UserPlus, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { getInitials, formatJoinDate } from "@/lib/utils";
import { parseProfileBio } from "@/lib/post-content";
import type { Profile, PostWithAuthor } from "@/types";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, refreshProfile } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user && profile && user.id === profile.user_id;

  useEffect(() => {
    if (!username) return;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const profileData = await fetchProfileByUsername(username);
        setProfile(profileData);

        const [userPosts, counts] = await Promise.all([
          fetchUserPosts(profileData.user_id, user?.id),
          fetchFollowCounts(profileData.user_id),
        ]);

        setPosts(userPosts);
        setFollowerCount(counts.followers);
        setFollowingCount(counts.following);

        if (user && user.id !== profileData.user_id) {
          const following = await checkIsFollowing(user.id, profileData.user_id);
          setIsFollowing(following);
        }
      } catch {
        toast.error("Couldn't find this user");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [username, user]);

  const handleToggleFollow = async () => {
    if (!user || !profile) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowerCount((c) => c + (wasFollowing ? -1 : 1));
    try {
      await toggleFollow(user.id, profile.user_id, wasFollowing);
      toast.success(wasFollowing ? "Unfollowed" : `Following @${profile.username}!`);
    } catch {
      setIsFollowing(wasFollowing);
      setFollowerCount((c) => c + (wasFollowing ? 1 : -1));
      toast.error("Couldn't update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdated = (updatedPost: PostWithAuthor) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const handleProfileUpdated = (updated: Profile) => {
    setProfile(updated);
    refreshProfile();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="feed-card overflow-hidden animate-pulse">
            <div className="h-32 bg-muted" />
            <div className="px-6 pb-6">
              <div className="flex gap-5 -mt-10">
                <div className="h-20 w-20 rounded-full bg-muted border-4 border-card shrink-0" />
                <div className="space-y-3 flex-1 pt-12">
                  <div className="h-5 w-40 bg-muted rounded-md" />
                  <div className="h-4 w-24 bg-muted rounded-md" />
                </div>
              </div>
            </div>
          </div>
          {[1, 2].map((i) => <PostSkeleton key={i} />)}
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <EmptyState
            title="User not found"
            description="This profile doesn't exist or may have been removed. Check the URL and try again."
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile header */}
        <div className="feed-card overflow-hidden animate-fade-in">
          <div className="h-32 gradient-bg relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/20" />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-5">
              <Avatar className="h-24 w-24 border-4 border-card shadow-lg ring-2 ring-border">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="gradient-bg text-primary-foreground text-2xl font-bold">
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>

              <div className="pt-14 flex items-center gap-2">
                {isOwnProfile ? (
                  <EditProfileDialog profile={profile} onUpdated={handleProfileUpdated} />
                ) : user ? (
                  <>
                    <BookSessionDialog
                      host={profile}
                      guestId={user.id}
                      trigger={
                        <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1.5">
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Book session
                        </Button>
                      }
                    />
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={handleToggleFollow}
                      disabled={followLoading}
                      className={isFollowing
                        ? "h-9 rounded-xl gap-1.5"
                        : "h-9 rounded-xl gradient-bg border-0 text-primary-foreground hover:opacity-90 gap-1.5"
                      }
                    >
                      {isFollowing ? (
                        <><UserCheck className="h-3.5 w-3.5" /> Following</>
                      ) : (
                        <><UserPlus className="h-3.5 w-3.5" /> Follow</>
                      )}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            <h1 className="text-2xl font-bold leading-tight">{profile.display_name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>

            {(() => {
              const { text, skills } = parseProfileBio(profile.bio);
              return (
                <>
                  {text && (
                    <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
                  )}
                  {skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="text-xs font-medium bg-accent text-accent-foreground rounded-full px-2.5 py-1"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Meta links */}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <LinkIcon className="h-3.5 w-3.5" />
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {formatJoinDate(new Date(profile.created_at))}
              </span>
            </div>

            {/* Stats */}
            <div className="mt-5 flex gap-6 text-sm">
              <Stat value={posts.length} label="posts" />
              <Stat value={followerCount} label="followers" />
              <Stat value={followingCount} label="following" />
            </div>
          </div>
        </div>

        {/* User's posts */}
        <div className="space-y-4">
          <h2 className="section-label px-1">Posts</h2>
          {posts.length === 0 ? (
            <EmptyState
              icon={<PenLine className="h-7 w-7" />}
              title="No posts yet"
              description={isOwnProfile ? "Share your first thought — go to the feed to create a post!" : `@${profile.username} hasn't posted anything yet.`}
            />
          ) : (
            <div className="space-y-4 stagger-children">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={handlePostDeleted}
                  onUpdate={handlePostUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
