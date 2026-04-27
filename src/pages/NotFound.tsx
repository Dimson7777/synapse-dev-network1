import { Link } from "react-router-dom";
import { Code2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg">
          <Code2 className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight gradient-text mb-2">404</h1>
        <p className="text-lg font-medium mb-1">Page not found</p>
        <p className="text-sm text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="rounded-xl gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>
        </Button>
      </div>
    </div>
  );
}
