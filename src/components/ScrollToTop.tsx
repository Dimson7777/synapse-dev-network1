import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ensures every page opens at the top of the hero on first load, hard refresh,
 * route change and back/forward return — UNLESS the URL carries a valid in-page
 * deep link (#section), which is honored instead.
 *
 * Works with `history.scrollRestoration = "manual"` (set in main.tsx), which
 * stops the browser from auto-restoring a stale scroll position.
 *
 * It intentionally keys off `pathname` only, so same-route anchor clicks
 * (#auth, #how, …) keep their existing native smooth-scroll behavior untouched.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const root = document.documentElement;

    // The site sets `html { scroll-behavior: smooth }`. Neutralize it just for
    // this programmatic positioning so the landing/deep-link placement is
    // instant (no visible animation), then restore it so anchor links and the
    // existing scroll-to-section behavior stay smooth.
    const scrollInstant = (apply: () => void) => {
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      apply();
      root.style.scrollBehavior = previous;
    };

    const hash = window.location.hash;
    const id = hash.length > 1 ? decodeURIComponent(hash.slice(1)) : "";

    if (!id) {
      scrollInstant(() => window.scrollTo(0, 0));
      return;
    }

    // There IS a deep link. Its target may not be in the DOM yet because routes
    // are lazy-loaded behind <Suspense>. Poll a bounded number of animation
    // frames (~1s at 60fps) for the element, then scroll to it; fall back to the
    // top if it never appears. rAF (not setTimeout) keeps it in sync with paint.
    let frames = 0;
    let raf = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        scrollInstant(() => el.scrollIntoView({ block: "start" }));
      } else if (frames++ < 60) {
        raf = requestAnimationFrame(tryScroll);
      } else {
        scrollInstant(() => window.scrollTo(0, 0));
      }
    };
    raf = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  // Safari/Firefox can restore a page from the bfcache with its previous scroll
  // position; re-assert the top on persisted returns (no deep link present).
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      if (window.location.hash.length > 1) return;
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      root.style.scrollBehavior = previous;
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return null;
};

export default ScrollToTop;
