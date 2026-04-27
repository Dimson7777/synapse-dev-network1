import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBookmarkedPosts } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import PostCard from "@/components/feed/PostCard";
import PostSkeleton from "@/components/feed/PostSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import type { PostWithAuthor } from "@/types";

export default function BookmarksPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchBookmarkedPosts(user.id)
      .then(setPosts)
      .catch(() => toast.error("Couldn't load saved posts"))
      .finally(() => setIsLoading(false));
  }, [user]);

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdated = (updatedPost: PostWithAuthor) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-accent flex items-center justify-center">
            <Bookmark className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="page-header">Saved Posts</h1>
            <p className="text-sm text-muted-foreground">Posts you've bookmarked for later</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="h-7 w-7" />}
            title="Nothing saved yet"
            description="Bookmark posts to build your personal reading list"
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
    </AppLayout>
  );
}
