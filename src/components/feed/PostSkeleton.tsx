export default function PostSkeleton() {
  return (
    <div className="feed-card p-5">
      <div className="flex gap-3.5 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-muted/60 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-28 bg-muted/60 rounded-lg" />
            <div className="h-3 w-14 bg-muted/40 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-muted/60 rounded-lg" />
            <div className="h-3 w-4/5 bg-muted/40 rounded-lg" />
            <div className="h-3 w-3/5 bg-muted/40 rounded-lg" />
          </div>
          <div className="flex gap-4 pt-2">
            <div className="h-6 w-14 bg-muted/40 rounded-lg" />
            <div className="h-6 w-14 bg-muted/40 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
