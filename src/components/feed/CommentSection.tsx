import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchComments, createComment, deleteComment } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import type { CommentWithAuthor } from "@/types";

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  onCommentCountChange: (delta: number) => void;
}

export default function CommentSection({ postId, postAuthorId, onCommentCountChange }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments(postId)
      .then(setComments)
      .catch(() => toast.error("Couldn't load comments"))
      .finally(() => setIsLoading(false));
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed || !user) return;

    setIsSubmitting(true);
    try {
      const comment = await createComment(user.id, postId, trimmed, postAuthorId);
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      onCommentCountChange(1);
    } catch {
      toast.error("Couldn't post comment. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentCountChange(-1);
    } catch {
      toast.error("Couldn't delete comment.");
    }
  };

  if (isLoading) {
    return (
      <div className="border-t px-5 sm:px-6 py-4 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-2.5 animate-pulse">
            <div className="h-7 w-7 rounded-full bg-muted/60 shrink-0" />
            <div className="flex-1 h-8 rounded-xl bg-muted/40" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border-t px-5 sm:px-6 py-4 space-y-3">
      {comments.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">No comments yet — be the first</p>
      )}

      {comments.map((comment) => {
        const author = comment.profiles;
        return (
          <div key={comment.id} className="flex gap-2.5 animate-fade-in group">
            <Link to={`/u/${author?.username}`} className="shrink-0">
              <Avatar className="h-7 w-7">
                <AvatarImage src={author?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground font-medium">
                  {getInitials(author?.display_name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link to={`/u/${author?.username}`} className="text-xs font-semibold hover:underline">
                  {author?.display_name}
                </Link>
                <time className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(new Date(comment.created_at))}
                </time>
                {user?.id === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity rounded-md"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-xs mt-0.5 break-words leading-relaxed">{comment.content}</p>
            </div>
          </div>
        );
      })}

      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
          <Input
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="text-xs h-9 rounded-xl"
            maxLength={1000}
            autoFocus
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 px-3 shrink-0 rounded-xl"
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        </form>
      )}
    </div>
  );
}
