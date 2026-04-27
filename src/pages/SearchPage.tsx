import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { searchProfiles, toggleFollow, checkIsFollowing } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import AppLayout from "@/components/layout/AppLayout";
import UserCard from "@/components/shared/UserCard";
import EmptyState from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Users, UserSearch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types";

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 350);
  const [results, setResults] = useState<Profile[]>([]);
  const [followStatusMap, setFollowStatusMap] = useState<Record<string, boolean>>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-search on debounced query change
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    let cancelled = false;

    async function search() {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const profiles = await searchProfiles(debouncedQuery);
        if (cancelled) return;
        setResults(profiles);

        if (user) {
          const statuses: Record<string, boolean> = {};
          await Promise.all(
            profiles
              .filter((p) => p.user_id !== user.id)
              .map(async (p) => {
                statuses[p.user_id] = await checkIsFollowing(user.id, p.user_id);
              })
          );
          if (!cancelled) setFollowStatusMap(statuses);
        }
      } catch {
        if (!cancelled) toast.error("Search failed. Try again.");
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }

    search();
    return () => { cancelled = true; };
  }, [debouncedQuery, user]);

  const handleToggleFollow = async (targetUserId: string) => {
    if (!user) return;
    const wasFollowing = followStatusMap[targetUserId] ?? false;
    setFollowStatusMap((prev) => ({ ...prev, [targetUserId]: !wasFollowing }));
    try {
      await toggleFollow(user.id, targetUserId, wasFollowing);
    } catch {
      setFollowStatusMap((prev) => ({ ...prev, [targetUserId]: wasFollowing }));
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-accent flex items-center justify-center">
            <SearchIcon className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="page-header">Search</h1>
            <p className="text-sm text-muted-foreground">Find developers in the community</p>
          </div>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl text-sm"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {!isSearching && hasSearched ? (
          results.length === 0 ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="No matches"
              description={`Nothing for "${debouncedQuery}". Try a different name or username.`}
            />
          ) : (
            <div className="feed-card p-4 divide-y divide-border/50 stagger-children">
              {results.map((profile) => (
                <UserCard
                  key={profile.id}
                  profile={profile}
                  showFollowButton={user?.id !== profile.user_id}
                  isFollowing={followStatusMap[profile.user_id] ?? false}
                  onToggleFollow={() => handleToggleFollow(profile.user_id)}
                />
              ))}
            </div>
          )
        ) : !hasSearched ? (
          <EmptyState
            icon={<UserSearch className="h-7 w-7" />}
            title="Search developers by name or username"
            description="Find folks shipping cool stuff and follow along."
          />
        ) : null}
      </div>
    </AppLayout>
  );
}
