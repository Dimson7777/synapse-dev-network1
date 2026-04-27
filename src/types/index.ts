import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Bookmark = Database["public"]["Tables"]["bookmarks"]["Row"];

export interface PostWithAuthor extends Post {
  profiles: Profile;
  user_has_liked?: boolean;
  user_has_bookmarked?: boolean;
}

export interface CommentWithAuthor extends Comment {
  profiles: Profile;
}
