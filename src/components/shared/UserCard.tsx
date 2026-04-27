import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { parseProfileBio } from "@/lib/post-content";
import type { Profile } from "@/types";

interface UserCardProps {
  profile: Profile;
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  followLoading?: boolean;
}

export default function UserCard({
  profile,
  showFollowButton,
  isFollowing,
  onToggleFollow,
  followLoading,
}: UserCardProps) {
  const { text: bioText, skills } = parseProfileBio(profile.bio);
  const subtitle = bioText || (skills.length ? skills.slice(0, 4).join(" · ") : "");

  return (
    <div className="flex items-center gap-3 py-3 group rounded-xl hover:bg-accent/30 px-3 -mx-3 transition-colors">
      <Link to={`/u/${profile.username}`} className="shrink-0">
        <Avatar className="h-10 w-10 ring-2 ring-border transition-all group-hover:ring-primary/20">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="gradient-bg text-primary-foreground text-xs font-semibold">
            {getInitials(profile.display_name)}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          to={`/u/${profile.username}`}
          className="text-sm font-semibold hover:text-primary transition-colors truncate block"
        >
          {profile.display_name}
        </Link>
        <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>
        )}
      </div>
      {showFollowButton && (
        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          onClick={onToggleFollow}
          disabled={followLoading}
          className={
            isFollowing
              ? "shrink-0 h-8 text-xs rounded-xl"
              : "shrink-0 h-8 text-xs rounded-xl gradient-bg border-0 text-primary-foreground hover:opacity-90"
          }
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
