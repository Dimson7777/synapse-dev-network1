import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toggleLike, toggleBookmark, deletePost, updatePost } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Heart,
  MessageCircle,
  Trash2,
  ExternalLink,
  Bookmark,
  Pencil,
  X,
  Check,
  MoreHorizontal,
  LifeBuoy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import type { PostWithAuthor } from "@/types";
import CommentSection from "@/components/feed/CommentSection";
import PostContent from "@/components/feed/PostContent";

interface PostCardProps {
  post: PostWithAuthor;
  onDelete?: (postId: string) => void;
  onUpdate?: (updatedPost: PostWithAuthor) => void;
  sessionActionLabel?: "Book session" | "Ask for help";
}

export default function PostCard({ post, onDelete, onUpdate, sessionActionLabel }: PostCardProps) {
  const { user } = useAuth();
  const author = post.profiles;
  const isOwner = user?.id === post.user_id;

  const [liked, setLiked] = useState(post.user_has_liked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [bookmarked, setBookmarked] = useState(post.user_has_bookmarked ?? false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [justLiked, setJustLiked] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const sessionLabel = sessionActionLabel ?? (post.comments_count > 0 ? "Ask for help" : "Book session");

  const handleSessionNudge = () => {
    toast.success("Session prompt sent");
  };

  const handleLike = async () => {
    if (!user) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => c + (wasLiked ? -1 : 1));
    if (!wasLiked) {
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 400);
    }
    try {
      await toggleLike(user.id, post.id, wasLiked, post.user_id);
    } catch {
      setLiked(wasLiked);
      setLikesCount((c) => c + (wasLiked ? 1 : -1));
      toast.error("Couldn't update like. Try again.");
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);
    try {
      await toggleBookmark(user.id, post.id, wasBookmarked);
      toast.success(wasBookmarked ? "Removed from saved" : "Saved to bookmarks");
    } catch {
      setBookmarked(wasBookmarked);
      toast.error("Couldn't update bookmark.");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      onDelete?.(post.id);
      toast.success("Post deleted");
    } catch {
      toast.error("Couldn't delete post. Try again.");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent.trim() === post.content) {
      setIsEditing(false);
      setEditContent(post.content);
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updatePost(post.id, editContent.trim(), post.link_url ?? undefined);
      onUpdate?.(updated);
      setIsEditing(false);
      toast.success("Post updated");
    } catch {
      toast.error("Couldn't save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  return (
    <article className="feed-card group/card hover:-translate-y-[1px] hover:border-primary/20 hover:shadow-[0_10px_28px_-18px_hsl(var(--primary)/0.45)]">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <Link to={`/u/${author?.username}`} className="shrink-0">
            <Avatar className="h-10 w-10 ring-2 ring-border transition-all hover:ring-primary/30">
              <AvatarImage src={author?.avatar_url || undefined} />
              <AvatarFallback className="gradient-bg text-primary-foreground text-xs font-semibold">
                {getInitials(author?.display_name)}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  to={`/u/${author?.username}`}
                  className="font-semibold text-sm hover:text-primary transition-colors truncate"
                >
                  {author?.display_name}
                </Link>
                <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                  @{author?.username}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(new Date(post.created_at))}
                </time>
              </div>

              {isOwner && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground opacity-0 group-hover/card:opacity-100 transition-opacity rounded-lg"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 rounded-xl">
                      <DropdownMenuItem onClick={() => { setIsEditing(true); setEditContent(post.content); }} className="rounded-lg">
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive rounded-lg">
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The post and all its comments will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {isEditing ? (
              <div className="mt-3 space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="text-sm min-h-[60px] resize-none rounded-xl"
                  maxLength={2000}
                  autoFocus
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isSaving} className="rounded-lg">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={isSaving || !editContent.trim()} className="rounded-lg">
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <PostContent content={post.content} />
                {post.link_url && post.link_url.length > 0 && (
                  <a
                    href={post.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary bg-accent/50 px-3 py-2 rounded-xl transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate max-w-[240px]">{post.link_url.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="mt-5 pt-3 border-t border-border/40 flex items-center gap-1 pl-[52px] flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "gap-1.5 text-xs h-8 rounded-xl transition-all",
              liked ? "text-destructive hover:text-destructive/80" : "text-muted-foreground hover:text-destructive"
            )}
          >
            <Heart className={cn(
              "h-4 w-4 transition-all",
              liked && "fill-current",
              justLiked && "animate-like-pop"
            )} />
            {likesCount > 0 && <span className="tabular-nums">{likesCount}</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "gap-1.5 text-xs h-8 rounded-xl transition-colors",
              showComments ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}
          >
            <MessageCircle className="h-4 w-4" />
            {commentsCount > 0 && <span className="tabular-nums">{commentsCount}</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSessionNudge}
            className="gap-1.5 text-xs h-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <LifeBuoy className="h-4 w-4" />
            {sessionLabel}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={cn(
              "gap-1.5 text-xs h-8 rounded-xl ml-auto transition-colors",
              bookmarked ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}
          >
            <Bookmark className={cn("h-4 w-4 transition-all", bookmarked && "fill-current")} />
          </Button>
        </div>
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          postAuthorId={post.user_id}
          onCommentCountChange={(delta) => setCommentsCount((c) => c + delta)}
        />
      )}
    </article>
  );
}
