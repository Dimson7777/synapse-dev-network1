import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle } from "lucide-react";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import type { PostWithAuthor } from "@/types";

interface TrendingPostCardProps {
  post: PostWithAuthor;
  rank: number;
}

export default function TrendingPostCard({ post, rank }: TrendingPostCardProps) {
  const author = post.profiles;

  return (
    <Link
      to={`/u/${author?.username}`}
      className="flex gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-accent/30 transition-colors group"
    >
      <span className="text-xs font-bold text-muted-foreground/50 w-5 pt-1 shrink-0 tabular-nums">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Avatar className="h-5 w-5">
            <AvatarImage src={author?.avatar_url || undefined} />
            <AvatarFallback className="gradient-bg text-primary-foreground text-[8px] font-bold">
              {getInitials(author?.display_name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
            {author?.display_name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(new Date(post.created_at))}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {post.content}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {post.likes_count}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {post.comments_count}
          </span>
        </div>
      </div>
    </Link>
  );
}
