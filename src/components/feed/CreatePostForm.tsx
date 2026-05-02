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

const POST_PLACEHOLDER = "Stuck on something? Start a session.\nOr share what you're building.";

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
  const [composerMode, setComposerMode] = useState<"post" | "session">("session");

  const overLimit = content.length > MAX_LENGTH;
  const canPost = content.trim().length > 0 && !overLimit && !submitting;
  const placeholder = POST_PLACEHOLDER;

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
        "feed-card relative overflow-hidden p-5 sm:p-6 transition-all duration-300",
        focused && "ring-2 ring-primary/25 shadow-[0_14px_34px_-20px_hsl(var(--primary)/0.5)]",
      )}
    >
      <div className="absolute -top-16 -right-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.22)_0%,transparent_72%)] pointer-events-none" aria-hidden />

      <div className="flex gap-3.5">
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="gradient-bg text-primary-foreground text-xs font-semibold">
            {getInitials(profile?.display_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            Start something
          </div>

          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => !content && setFocused(false)}
            className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />

          <div className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-secondary/35 p-1">
            <button
              type="button"
              onClick={() => setComposerMode("post")}
              className={cn(
                "h-7 px-3 rounded-lg text-xs font-medium transition-colors",
                composerMode === "post" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Post
            </button>
            <button
              type="button"
              onClick={() => setComposerMode("session")}
              className={cn(
                "h-7 px-3 rounded-lg text-xs font-medium transition-colors",
                composerMode === "session" ? "gradient-bg text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Start session
            </button>
          </div>

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
              className={cn(
                "h-9 px-4 rounded-xl border-0 text-primary-foreground transition-all duration-200",
                composerMode === "session"
                  ? "gradient-bg hover:opacity-95 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_hsl(var(--primary)/0.55)]"
                  : "bg-foreground/85 hover:bg-foreground text-background"
              )}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {composerMode === "session" ? "Start session" : "Post"}
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
