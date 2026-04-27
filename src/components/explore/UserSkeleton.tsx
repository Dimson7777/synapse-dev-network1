export default function UserSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-2 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-muted/60 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 bg-muted/60 rounded-lg" />
        <div className="h-3 w-16 bg-muted/40 rounded-lg" />
      </div>
      <div className="h-8 w-16 bg-muted/40 rounded-xl" />
    </div>
  );
}
