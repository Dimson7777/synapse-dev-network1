import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createPost } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Code2, Hash, Link2, Loader2, Rocket, Send } from "lucide-react";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import type { PostWithAuthor } from "@/types";

const MAX_LENGTH = 2000;

const PLACEHOLDERS = [
  "Shipped something? Stuck on a bug? Share it.",
  "What are you building right now?",
  "Drop a code snippet, a tip, or a tiny win.",
  "TIL... ?",
];

export default function CreatePostForm({
  onPostCreated,
}: {
  onPostCreated: (p: PostWithAuthor) => void;
}) {
  const { user, profile } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  const overLimit = content.length > MAX_LENGTH;
  const canPost = content.trim().length > 0 && !overLimit && !submitting;
  const placeholder = PLACEHOLDERS[0]; // keep stable per render — feels less random

  const insertAtCursor = (snippet: string, selectFrom?: number, selectTo?: number) => {
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? content.length;
    const end = ta?.selectionEnd ?? content.length;
    const next = content.slice(0, start) + snippet + content.slice(end);
    setContent(next);
    setFocused(true);
    // Restore focus on next tick
    requestAnimationFrame(() => {
      ta?.focus();
      const cursor = start + (selectFrom ?? snippet.length);
      const cursorEnd = start + (selectTo ?? snippet.length);
      ta?.setSelectionRange(cursor, cursorEnd);
    });
  };

  const handleAddCode = () => {
    const needsNewline = content.length > 0 && !content.endsWith("\n");
    const prefix = needsNewline ? "\n" : "";
    const snippet = `${prefix}\`\`\`ts\n\n\`\`\`\n`;
    // Place cursor on the empty middle line
    const cursorPos = prefix.length + 6; // after ```ts\n
    insertAtCursor(snippet, cursorPos, cursorPos);
  };

  const handleAddTag = () => {
    const needsSpace = content.length > 0 && !/\s$/.test(content);
    insertAtCursor(`${needsSpace ? " " : ""}#`);
  };

  const handleAddUpdate = () => {
    if (/^\s*(?:📦\s*update:|\/update)/i.test(content)) return;
    insertAtCursor("📦 update: ", undefined, undefined);
    // Move cursor to end after insertion
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      ta?.setSelectionRange(ta.value.length, ta.value.length);
    });
  };

  const handlePost = async () => {
    if (!canPost || !user) return;
    setSubmitting(true);
    try {
      const post = await createPost(user.id, content.trim(), linkUrl.trim() || undefined);
      onPostCreated(post);
      setContent("");
      setLinkUrl("");
      setShowLink(false);
      setFocused(false);
      toast.success("Posted");
    } catch (err: any) {
      const msg = err?.message?.includes("content")
        ? "Post content is required"
        : "Couldn't publish your post. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "feed-card p-5 sm:p-6 transition-all duration-300",
        focused && "ring-2 ring-primary/20 shadow-lg shadow-primary/5",
      )}
    >
      <div className="flex gap-3.5">
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="gradient-bg text-primary-foreground text-xs font-semibold">
            {getInitials(profile?.display_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => !content && setFocused(false)}
            className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />

          {focused && (
            <p className="text-[11px] text-muted-foreground/70">
              Tip: wrap code in <code className="font-mono text-foreground/70">```</code>, add tags like{" "}
              <code className="font-mono text-foreground/70">#react</code>.
            </p>
          )}

          {showLink && (
            <div className="animate-fade-in">
              <Input
                placeholder="https://github.com/..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="text-sm rounded-xl"
                autoFocus
              />
            </div>
          )}

          <div
            className={cn(
              "flex items-center justify-between pt-3 border-t border-border/40 transition-opacity",
              !focused && !content ? "opacity-60" : "opacity-100",
            )}
          >
            <div className="flex items-center gap-0.5">
              <ToolbarButton onClick={handleAddCode} title="Insert code block" active={false}>
                <Code2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={handleAddTag} title="Add a tag" active={false}>
                <Hash className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setShowLink(!showLink)}
                title="Add a link"
                active={showLink}
              >
                <Link2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={handleAddUpdate} title="Mark as project update" active={false}>
                <Rocket className="h-4 w-4" />
              </ToolbarButton>
              {content.length > 0 && (
                <span
                  className={cn(
                    "text-xs tabular-nums ml-2",
                    overLimit ? "text-destructive font-medium" : "text-muted-foreground",
                  )}
                >
                  {content.length}/{MAX_LENGTH}
                </span>
              )}
            </div>
            <Button
              size="sm"
              onClick={handlePost}
              disabled={!canPost}
              className="h-9 px-4 rounded-xl gradient-bg border-0 text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title}
      className={cn(
        "h-8 w-8 p-0 rounded-xl",
        active ? "text-primary bg-accent" : "text-muted-foreground hover:text-primary",
      )}
    >
      {children}
    </Button>
  );
}
