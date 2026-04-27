import { supabase } from "@/integrations/supabase/client";
import type { PostWithAuthor, CommentWithAuthor, Profile } from "@/types";

const POST_WITH_AUTHOR = "*, profiles!posts_profile_fkey(*)" as const;

// Batch-checks which posts a user has liked/bookmarked, merges into each post
async function withUserInteractions(posts: PostWithAuthor[], userId: string): Promise<PostWithAuthor[]> {
  if (!posts.length) return posts;

  const ids = posts.map((p) => p.id);
  const [{ data: liked }, { data: saved }] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", userId).in("post_id", ids),
    supabase.from("bookmarks").select("post_id").eq("user_id", userId).in("post_id", ids),
  ]);

  const likedSet = new Set(liked?.map((r) => r.post_id));
  const savedSet = new Set(saved?.map((r) => r.post_id));

  return posts.map((post) => ({
    ...post,
    user_has_liked: likedSet.has(post.id),
    user_has_bookmarked: savedSet.has(post.id),
  }));
}

function castPosts(data: unknown): PostWithAuthor[] {
  return (data ?? []) as PostWithAuthor[];
}

// Posts

export async function fetchGlobalFeed(page = 0, limit = 20, currentUserId?: string) {
  const from = page * limit;
  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_AUTHOR)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw error;
  const posts = castPosts(data);
  return currentUserId ? withUserInteractions(posts, currentUserId) : posts;
}

export async function fetchFollowingFeed(userId: string, page = 0, limit = 20) {
  const { data: rows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const ids = rows?.map((r) => r.following_id) ?? [];
  if (!ids.length) return [];

  const from = page * limit;
  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_AUTHOR)
    .in("user_id", ids)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw error;
  return withUserInteractions(castPosts(data), userId);
}

export async function fetchTrendingPosts(limit = 5, currentUserId?: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_AUTHOR)
    .order("likes_count", { ascending: false })
    .order("comments_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  const posts = castPosts(data);
  return currentUserId ? withUserInteractions(posts, currentUserId) : posts;
}

export async function fetchUserPosts(userId: string, currentUserId?: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_AUTHOR)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const posts = castPosts(data);
  return currentUserId ? withUserInteractions(posts, currentUserId) : posts;
}

export async function createPost(userId: string, content: string, linkUrl?: string) {
  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: userId, content, link_url: linkUrl || "" })
    .select(POST_WITH_AUTHOR)
    .single();

  if (error) throw error;
  return data as unknown as PostWithAuthor;
}

export async function updatePost(postId: string, content: string, linkUrl?: string) {
  const { data, error } = await supabase
    .from("posts")
    .update({ content, link_url: linkUrl ?? "" })
    .eq("id", postId)
    .select(POST_WITH_AUTHOR)
    .single();

  if (error) throw error;
  return data as unknown as PostWithAuthor;
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
}

// Likes & bookmarks

export async function toggleLike(userId: string, postId: string, isLiked: boolean, postAuthorId?: string) {
  const q = isLiked
    ? supabase.from("likes").delete().eq("user_id", userId).eq("post_id", postId)
    : supabase.from("likes").insert({ user_id: userId, post_id: postId });
  const { error } = await q;
  if (error) throw error;

  if (!isLiked && postAuthorId) {
    createNotification(userId, postAuthorId, "like", postId);
  }
}

export async function toggleBookmark(userId: string, postId: string, isSaved: boolean) {
  const q = isSaved
    ? supabase.from("bookmarks").delete().eq("user_id", userId).eq("post_id", postId)
    : supabase.from("bookmarks").insert({ user_id: userId, post_id: postId });
  const { error } = await q;
  if (error) throw error;
}

export async function fetchBookmarkedPosts(userId: string) {
  const { data: rows, error: err } = await supabase
    .from("bookmarks")
    .select("post_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (err) throw err;
  const ids = rows?.map((r) => r.post_id) ?? [];
  if (!ids.length) return [] as PostWithAuthor[];

  const { data, error } = await supabase
    .from("posts")
    .select(POST_WITH_AUTHOR)
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return withUserInteractions(castPosts(data), userId);
}

// Comments

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_profile_fkey(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as CommentWithAuthor[];
}

export async function createComment(userId: string, postId: string, content: string, postAuthorId?: string) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ user_id: userId, post_id: postId, content })
    .select("*, profiles!comments_profile_fkey(*)")
    .single();

  if (error) throw error;

  if (postAuthorId) {
    createNotification(userId, postAuthorId, "comment", postId);
  }

  return data as unknown as CommentWithAuthor;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

// Profiles

export async function fetchProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function searchProfiles(query: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

// Notifications

export async function createNotification(actorId: string, userId: string, type: "like" | "follow" | "comment", postId?: string) {
  // Don't notify yourself
  if (actorId === userId) return;
  await supabase.from("notifications").insert({
    user_id: userId,
    actor_id: actorId,
    type,
    post_id: postId ?? null,
  });
}

export async function fetchUnreadNotificationCount(userId: string) {
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  return count ?? 0;
}

// Follows

export async function toggleFollow(followerId: string, targetId: string, isFollowing: boolean) {
  const q = isFollowing
    ? supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", targetId)
    : supabase.from("follows").insert({ follower_id: followerId, following_id: targetId });
  const { error } = await q;
  if (error) throw error;

  // Fire notification on follow (not unfollow)
  if (!isFollowing) {
    createNotification(followerId, targetId, "follow");
  }
}

export async function checkIsFollowing(followerId: string, targetId: string) {
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", targetId)
    .maybeSingle();
  return !!data;
}

export async function fetchFollowCounts(userId: string) {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

export async function fetchSuggestedUsers(currentUserId: string) {
  const { data: rows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", currentUserId);

  const exclude = rows?.map((r) => r.following_id) ?? [];
  exclude.push(currentUserId);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .not("user_id", "in", `(${exclude.join(",")})`)
    .limit(5);

  if (error) throw error;
  return (data ?? []) as Profile[];
}
