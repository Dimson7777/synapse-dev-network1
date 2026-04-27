import { type ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { fetchUnreadNotificationCount } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Compass, User, LogOut, Search, Moon, Sun, Bookmark, Bell, Calendar } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import logoImg from "@/assets/logo.png";

const NAV_ITEMS = [
  { path: "/", label: "Feed", icon: Home },
  { path: "/explore", label: "Explore", icon: Compass },
  { path: "/search", label: "Search", icon: Search },
  { path: "/notifications", label: "Alerts", icon: Bell },
  { path: "/bookmarks", label: "Saved", icon: Bookmark },
] as const;

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchUnreadNotificationCount(user.id).then(setUnreadCount);

    const channel = supabase
      .channel("nav-notif-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => setUnreadCount((c) => c + 1)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (location.pathname === "/notifications") setUnreadCount(0);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = getInitials(profile?.display_name);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logoImg} alt="DevCircle" className="h-7 w-7 sm:h-8 sm:w-8 transition-transform group-hover:scale-105" />
            <span className="text-base sm:text-lg font-bold tracking-tight hidden sm:block gradient-text">DevCircle</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 bg-secondary/50 rounded-xl p-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              const showBadge = path === "/notifications" && unreadCount > 0;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl hover:bg-secondary transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-border hover:ring-primary/30 transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="gradient-bg text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 mt-1 rounded-xl">
                <DropdownMenuItem onClick={() => navigate(`/u/${profile?.username}`)} className="rounded-lg">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/bookmarks")} className="rounded-lg">
                  <Bookmark className="mr-2 h-4 w-4" />
                  Saved Posts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/bookings")} className="rounded-lg">
                  <Calendar className="mr-2 h-4 w-4" />
                  My bookings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive rounded-lg">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-xl md:hidden safe-area-inset">
        <div className="flex items-center justify-around h-14 px-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            const showBadge = path === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                  active
                    ? "text-primary bg-accent"
                    : "text-muted-foreground active:scale-95"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                <span className="text-[10px] font-medium">{label}</span>
                {showBadge && (
                  <span className="absolute top-0 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
