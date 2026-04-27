// App root – clean rebuild
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { lazy, Suspense, useState, type ReactNode } from "react";

// Lazy-load pages for better initial load
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const FeedPage = lazy(() => import("@/pages/FeedPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ExplorePage = lazy(() => import("@/pages/ExplorePage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const BookmarksPage = lazy(() => import("@/pages/BookmarksPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const BookingsPage = lazy(() => import("@/pages/BookingsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-fade-in">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(false);

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;

  const isNewUser = profile && !profile.bio && !profile.avatar_url && !onboardingDone;
  if (isNewUser) {
    return <OnboardingFlow profile={profile} onComplete={() => setOnboardingDone(true)} />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
        <Route path="/u/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" richColors closeButton />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
