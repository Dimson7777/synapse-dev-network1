import { Link } from "react-router-dom";
import { parsePostContent } from "@/lib/post-content";
import { Rocket } from "lucide-react";

interface PostContentProps {
  content: string;
}

export default function PostContent({ content }: PostContentProps) {
  const parsed = parsePostContent(content);

  return (
    <div className="mt-3 space-y-3">
      {parsed.isProjectUpdate && (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary bg-accent rounded-full px-2.5 py-1">
          <Rocket className="h-3 w-3" />
          Project update
        </div>
      )}

      {parsed.segments.map((seg, i) => {
        if (seg.kind === "code") {
          return <CodeBlock key={i} lang={seg.lang} value={seg.value} />;
        }
        if (seg.kind === "tag") {
          return (
            <Link
              key={i}
              to={`/explore?tag=${encodeURIComponent(seg.value.slice(1))}`}
              className="text-sm font-medium text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {seg.value}
            </Link>
          );
        }
        // Inline text — preserve whitespace, break on long words
        return (
          <span
            key={i}
            className="text-sm leading-relaxed whitespace-pre-wrap break-words"
          >
            {seg.value}
          </span>
        );
      })}
    </div>
  );
}

function CodeBlock({ lang, value }: { lang: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 border border-border/60 overflow-hidden text-left">
      {lang && (
        <div className="px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border/50 bg-muted/40">
          {lang}
        </div>
      )}
      <pre className="px-3.5 py-3 text-xs font-mono leading-relaxed overflow-x-auto">
        <code>{value}</code>
      </pre>
    </div>
  );
}
