import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowRight, ArrowUpRight, Code2, Braces, Activity, MessageSquare, Search, Calendar, Coffee, Circle, CheckCircle2, Loader2, X, XCircle, Zap, ShieldCheck, Clock, Users, BarChart3, ThumbsUp } from "lucide-react";
import logoImg from "@/assets/logo.png";

// ─── Animated dot-grid background ────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <>
      <style>{`
        @keyframes drift-a { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(18px,-22px) scale(1.05)} 66%{transform:translate(-12px,16px) scale(0.97)} }
        @keyframes drift-b { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-20px,14px) scale(0.96)} 66%{transform:translate(14px,-18px) scale(1.04)} }
        @keyframes drift-c { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(10px,20px) scale(1.03)} }
        @keyframes dot-pulse { 0%,100%{opacity:0.25} 50%{opacity:0.55} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        @keyframes signal-travel { 0%{ transform: translateX(0); opacity: 0; } 18%{ opacity: .9; } 82%{ opacity: .45; } 100%{ transform: translateX(100%); opacity: 0; } }
        @keyframes success-pulse { 0%,100%{ box-shadow: 0 0 0 0 rgba(52,211,153,0.0);} 50%{ box-shadow: 0 0 0 8px rgba(52,211,153,0.08);} }
        .blob-a { animation: drift-a 22s ease-in-out infinite; }
        .blob-b { animation: drift-b 28s ease-in-out infinite; }
        .blob-c { animation: drift-c 18s ease-in-out infinite; }
        .dot-grid-dot { animation: dot-pulse 4s ease-in-out infinite; }
        .dot-blink { animation: blink 1.2s ease-in-out infinite; }
      `}</style>
      {/* Soft ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="blob-a absolute top-[-10%] right-[5%] w-[420px] h-[420px] rounded-full bg-indigo-900/20 blur-[100px]" />
        <div className="blob-b absolute bottom-[10%] left-[-5%] w-[380px] h-[380px] rounded-full bg-purple-900/15 blur-[90px]" />
        <div className="blob-c absolute top-[45%] right-[30%] w-[280px] h-[280px] rounded-full bg-blue-900/10 blur-[80px]" />
        {/* Dot grid overlay */}
        <DotGrid />
      </div>
    </>
  );
}

function DotGrid() {
  // Static dot pattern using SVG – subtle noise texture
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dot-pattern" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-pattern)" />
    </svg>
  );
}

// ─── Live activity ticker ─────────────────────────────────────────────────────
const TICKER_EVENTS = [
  "Ivan booked a React debugging session",
  "Sara completed a code review",
  "Marko joined as Frontend Developer",
  "Ana booked a 30-min architecture review",
  "Luka completed a pair programming session",
  "Nina joined as Backend Engineer",
  "Petar booked a career advice session",
  "Jelena completed a code walkthrough",
];

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % TICKER_EVENTS.length);
        setVisible(true);
      }, 300);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/8 bg-white/[0.03] text-[11px] text-zinc-400 overflow-hidden max-w-xs sm:max-w-sm">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>
      <span
        style={{ transition: "opacity 0.28s ease, transform 0.28s ease", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-4px)" }}
        className="truncate"
      >
        {TICKER_EVENTS[idx]}
      </span>
    </div>
  );
}


// Small "live" signals — anchored values that drift slightly so they feel honest.
function useLiveSignals() {
  const [online, setOnline] = useState(19);
  const [booked, setBooked] = useState(28);
  useEffect(() => {
    // Tiny drift on mount so it's not the exact same number on every reload.
    const drift = (n: number, range: number) =>
      n + Math.floor(Math.random() * (range * 2 + 1)) - range;
    setOnline((n) => Math.max(12, drift(n, 3)));
    setBooked((n) => Math.max(20, drift(n, 4)));
  }, []);
  return { online, booked };
}

// Reveal child on scroll into view (subtle, not flashy).
function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${className}`}
    >
      {children}
    </div>
  );
}

// ── Entrance + count-up helpers (same IntersectionObserver style as <Reveal>) ──
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useInView<T extends HTMLElement>(rootMargin = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}

// Animates 0 → target with easeOutCubic once `active`. Honors reduced motion by
// jumping straight to the final value. rAF-driven, transform-free.
function useCountUp(target: number, active: boolean, reduced: boolean, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, reduced, duration]);
  return value;
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#0b0c10] text-zinc-100 selection:bg-zinc-300 selection:text-zinc-900 overflow-x-hidden">
      <AnimatedBackground />
      <Header />
      <main className="max-w-6xl mx-auto px-6 lg:px-8 relative">
        <Hero />
        <Reveal><HowItWorks /></Reveal>
        <ProblemSolution />
        <Reveal><UseCases /></Reveal>
        <Reveal><DemoSession /></Reveal>
        <Reveal><AuthSection /></Reveal>
        <Reveal><FounderSection /></Reveal>
        <Footer />
      </main>
    </div>
  );
}

function Header() {
  const { online } = useLiveSignals();
  return (
    <header className="border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <img src={logoImg} alt="DevCircle" className="h-7 w-7" />
          <span className="text-sm font-semibold tracking-tight">DevCircle</span>
        </a>
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
            <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
            {online} developers online
          </span>
          <a
            href="#auth"
            className="text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Sign in
          </a>
        </div>
      </div>
    </header>
  );
}

// ─── Magnetic primary CTA ─────────────────────────────────────────────────────
// The one "wow" hero detail: the primary call-to-action gently follows the
// cursor (magnetic pull) with a glow that tracks the pointer, plus a soft
// ambient breathe so it feels alive before any interaction. Transform/opacity
// only, driven by requestAnimationFrame — no layout thrashing. Falls back to the
// plain (existing) button on touch devices and when prefers-reduced-motion is on.
function MagneticCTA() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const spotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const link = linkRef.current;
    const spot = spotRef.current;
    if (!wrap || !link || !spot) return;

    const noMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    // Static fallback (keeps the existing hover styles) for touch / reduced motion.
    if (noMotion || !finePointer) return;

    const RADIUS = 90; // px around the button where the magnet engages
    const PULL = 0.32; // how strongly it follows the cursor
    const MAX = 8; // max travel in px

    let raf = 0;
    let curX = 0, curY = 0; // current offset
    let tgtX = 0, tgtY = 0; // target offset
    let engaged = false;

    const tick = () => {
      curX += (tgtX - curX) * 0.18;
      curY += (tgtY - curY) * 0.18;
      wrap.style.transform = `translate(${curX.toFixed(2)}px, ${curY.toFixed(2)}px)`;
      if (engaged || Math.abs(tgtX - curX) > 0.1 || Math.abs(tgtY - curY) > 0.1) {
        raf = requestAnimationFrame(tick);
      } else {
        wrap.style.transform = "";
        raf = 0;
      }
    };
    const ensureTick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = link.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const within = Math.hypot(dx, dy) < r.width / 2 + RADIUS;
      spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
      spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      if (within) {
        engaged = true;
        spot.style.opacity = "1";
        tgtX = Math.max(-MAX, Math.min(MAX, dx * PULL));
        tgtY = Math.max(-MAX, Math.min(MAX, dy * PULL));
      } else {
        engaged = false;
        spot.style.opacity = "";
        tgtX = 0;
        tgtY = 0;
      }
      ensureTick();
    };
    const onLeave = () => {
      engaged = false;
      spot.style.opacity = "";
      tgtX = 0;
      tgtY = 0;
      ensureTick();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative inline-flex will-change-transform">
      <style>{`
        @keyframes cta-breathe { 0%,100%{opacity:.3;transform:scale(0.97)} 50%{opacity:.5;transform:scale(1.03)} }
        .cta-aura { background: radial-gradient(closest-side, rgba(129,140,248,0.45), rgba(139,92,246,0.16) 62%, transparent 80%); filter: blur(15px); animation: cta-breathe 4.5s ease-in-out infinite; }
        .cta-spot { background: radial-gradient(110px circle at var(--mx,50%) var(--my,50%), rgba(165,180,252,0.6), rgba(139,92,246,0.22) 46%, transparent 72%); filter: blur(11px); }
        @media (prefers-reduced-motion: reduce){ .cta-aura{ animation:none; opacity:.32 } }
      `}</style>
      {/* Ambient "alive" glow — always on, very subtle */}
      <span aria-hidden className="cta-aura pointer-events-none absolute -inset-4 rounded-2xl" />
      {/* Cursor-tracking spotlight — fades in near the button */}
      <span
        ref={spotRef}
        aria-hidden
        className="cta-spot pointer-events-none absolute -inset-3 rounded-xl opacity-0 transition-opacity duration-300"
      />
      <a
        ref={linkRef}
        href="#auth"
        className="relative inline-flex items-center gap-2 h-11 px-5 rounded-md bg-white text-zinc-900 text-sm font-medium shadow-sm hover:bg-zinc-100 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.16)] active:translate-y-0 transition-all duration-200"
      >
        Find developers
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}

function Hero() {
  const { online } = useLiveSignals();
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [activityIdx, setActivityIdx] = useState(0);
  const [activityVisible, setActivityVisible] = useState(true);
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const MINI = [
    { role: "user", text: "I'm stuck with a React state bug." },
    { role: "typing", text: "" },
    { role: "dev", text: "Show me the component." },
    { role: "typing", text: "" },
    { role: "dev", text: "You're mutating state directly." },
    { role: "ok", text: "Fixed in 30 minutes." },
  ];
  const HERO_ACTIVITY = [
    "Last session solved in 28 min",
    "React bug fixed live",
    "Session started 2 min ago",
    "Code review in progress",
  ];

  const openDemo = () => {
    if (demoOpen) return;
    setDemoOpen(true);
    setDemoStep(0);
    [450, 1100, 1900, 2500, 3400, 4300].forEach((delay, i) => {
      const t = setTimeout(() => setDemoStep(i + 1), delay);
      demoTimers.current.push(t);
    });
  };

  const closeDemo = () => {
    demoTimers.current.forEach(clearTimeout);
    demoTimers.current = [];
    setDemoOpen(false);
    setDemoStep(0);
  };

  useEffect(() => {
    const id = setInterval(() => {
      setActivityVisible(false);
      setTimeout(() => {
        setActivityIdx((p) => (p + 1) % HERO_ACTIVITY.length);
        setActivityVisible(true);
      }, 260);
    }, 3600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => demoTimers.current.forEach(clearTimeout), []);

  return (
    <section className="relative pt-20 pb-20 lg:pt-28 lg:pb-28">
      {/* Faint grid backdrop behind the whole hero (fades toward the globe side) */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 72% 38%, #000 25%, transparent 75%)",
          maskImage: "radial-gradient(ellipse 75% 70% at 72% 38%, #000 25%, transparent 75%)",
        }}
      />
      <div className="relative grid lg:grid-cols-[1.05fr,1fr] gap-12 lg:gap-16 items-center">
        <div className="hidden lg:block pointer-events-none absolute top-[57%] left-[50%] w-[22%] h-px bg-gradient-to-r from-indigo-400/0 via-indigo-400/30 to-emerald-300/0" aria-hidden>
          <span
            className="absolute top-1/2 -translate-y-1/2 h-1.5 w-6 rounded-full bg-gradient-to-r from-indigo-300 to-emerald-300 blur-[0.5px]"
            style={{ animation: "signal-travel 5.6s ease-in-out infinite" }}
          />
        </div>
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[11px] text-indigo-300 font-medium mb-6 tracking-wide">
            <Zap className="h-2.5 w-2.5" />
            Global developer sessions
          </div>

          {/* Headline */}
          <h1 className="text-[2.5rem] sm:text-5xl lg:text-[3.4rem] font-semibold tracking-tight leading-[1.06] text-white">
            Real developers.
            <br />
            <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-teal-200 bg-clip-text text-transparent">
              Real problems. Solved live.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[42ch]">
            Book focused 30-minute sessions with developers who can help you unblock faster — without endless networking or cold messages.
          </p>

          {/* Live activity strip */}
          <div className="mt-7 flex flex-wrap gap-2">
            {[
              { color: "bg-emerald-500", text: `${online} developers online`,      delay: "0ms" },
              { color: "bg-indigo-400",  text: "3 sessions happening now",          delay: "600ms" },
              { color: "bg-purple-400",  text: "React review booked 2 min ago",     delay: "1200ms" },
            ].map((pill) => (
              <span key={pill.text} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/8 bg-white/[0.03] text-[11px] text-zinc-400">
                <span className={`h-1.5 w-1.5 rounded-full ${pill.color} animate-pulse`} style={{ animationDelay: pill.delay }} />
                {pill.text}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <MagneticCTA />
            <button
              onClick={openDemo}
              disabled={demoOpen}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-indigo-500/40 bg-indigo-500/10 text-sm font-medium text-indigo-200 hover:bg-indigo-500/[0.2] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(99,102,241,0.24)] active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-default"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              Start demo session
            </button>
          </div>

          <div className="mt-4 h-5 flex items-center">
            <div
              style={{
                opacity: activityVisible ? 1 : 0,
                transform: activityVisible ? "translateY(0)" : "translateY(-4px)",
                transition: "opacity 240ms ease, transform 240ms ease",
              }}
              className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-white/8 bg-white/[0.03] text-[11px] text-zinc-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {HERO_ACTIVITY[activityIdx]}
            </div>
          </div>

          {/* Inline mini demo panel */}
          {demoOpen && (
            <div
              style={{ animation: "fadeSlideUp 0.3s ease forwards" }}
              className="mt-5 rounded-xl border border-white/10 bg-zinc-950/85 backdrop-blur-sm overflow-hidden shadow-[0_0_0_1px_rgba(99,102,241,0.12),0_10px_40px_rgba(20,20,40,0.52)]"
            >
              <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-zinc-500 font-mono">Session #3021 · React debugging</span>
                </div>
                <button onClick={closeDemo} className="text-zinc-600 hover:text-zinc-400 transition-colors p-0.5">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-4 sm:p-5 space-y-3 min-h-[72px]">
                {MINI.slice(0, demoStep).map((s, i) => (
                  <div key={i} style={{ animation: "fadeSlideUp 0.25s ease forwards" }}>
                    {s.role === "user" && (
                      <div className="flex justify-end">
                        <span className="max-w-[86%] px-3 py-2 rounded-xl rounded-br-sm bg-white/[0.08] border border-white/6 text-xs text-zinc-200 leading-relaxed">{s.text}</span>
                      </div>
                    )}
                    {s.role === "typing" && (
                      <div className="flex items-end gap-2 pl-1">
                        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[8px] font-bold text-white shrink-0">MK</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl rounded-bl-sm bg-zinc-800/82 border border-white/5">
                          {[0, 1, 2].map((n) => (
                            <span key={n} className="dot-blink h-1.5 w-1.5 rounded-full bg-zinc-500" style={{ animationDelay: `${n * 220}ms` }} />
                          ))}
                        </span>
                      </div>
                    )}
                    {s.role === "dev" && (
                      <div className="flex items-end gap-2">
                        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[8px] font-bold text-white shrink-0">MK</span>
                        <span className="max-w-[86%] px-3 py-2 rounded-xl rounded-bl-sm bg-zinc-800/84 border border-white/5 text-xs text-zinc-200 leading-relaxed">{s.text}</span>
                      </div>
                    )}
                    {s.role === "ok" && (
                      <div className="flex justify-center pt-0.5">
                        <span style={{ animation: "success-pulse 1.8s ease-in-out infinite" }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] text-[11px] text-emerald-300 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          {s.text}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Globe visual */}
        <GlobeVisual />
      </div>

      {/* Bottom stats bar — premium glass band spanning the full hero width */}
      <HeroStats />
    </section>
  );
}

// ─── Hero centerpiece ─────────────────────────────────────────────────────────
// A futuristic SVG/CSS globe with orbit rings + traveling satellites, floating
// glass status cards and a focal live-session card. Pure transform/opacity
// animation (no canvas / WebGL), GPU-friendly, with a calm
// prefers-reduced-motion fallback. The globe stacks below the copy and scales
// down (340px) on small screens; the side floating cards simplify away on mobile.

const STAR_DOTS = [
  { left: "12%", top: "20%", size: "2px", delay: "0s" },
  { left: "82%", top: "12%", size: "3px", delay: "0.6s" },
  { left: "68%", top: "30%", size: "2px", delay: "1.2s" },
  { left: "24%", top: "70%", size: "2px", delay: "0.3s" },
  { left: "88%", top: "62%", size: "2px", delay: "1.6s" },
  { left: "44%", top: "8%", size: "2px", delay: "0.9s" },
  { left: "8%", top: "48%", size: "3px", delay: "2.1s" },
  { left: "92%", top: "40%", size: "2px", delay: "1.4s" },
  { left: "56%", top: "90%", size: "2px", delay: "0.5s" },
  { left: "34%", top: "42%", size: "2px", delay: "1.9s" },
] as const;

const TECH_CHIPS = [
  { label: "React", dot: "#61dafb" },
  { label: "TS", dot: "#3178c6" },
  { label: "Next", dot: "#e5e7eb" },
  { label: "Tailwind", dot: "#38bdf8" },
] as const;

const FLOAT_CARDS = [
  { Icon: Code2, title: "Reviewing PR", meta: "Alice · React", tint: "text-indigo-300", glow: "99,102,241", pos: "top-[1%] left-[-3%]", anim: "gv-floatA", hideOnMobile: false },
  { Icon: CheckCircle2, title: "Bug fixed", meta: "Sam · Node.js", tint: "text-emerald-300", glow: "52,211,153", pos: "top-[14%] right-[-4%]", anim: "gv-floatB", hideOnMobile: true },
  { Icon: Users, title: "Pairing", meta: "Vite · TypeScript", tint: "text-purple-300", glow: "168,85,247", pos: "bottom-[17%] left-[-5%]", anim: "gv-floatC", hideOnMobile: true },
  { Icon: BarChart3, title: "Optimizing", meta: "Liam · Performance", tint: "text-teal-300", glow: "45,212,191", pos: "bottom-[1%] right-[-2%]", anim: "gv-floatD", hideOnMobile: false },
] as const;

const ORBITS = [
  { size: 126, tilt: 0, flatten: 0.3, dur: 38, reverse: false, color: "99,102,241", sat: "#a5b4fc" },
  { size: 118, tilt: 62, flatten: 0.3, dur: 52, reverse: true, color: "168,85,247", sat: "#d8b4fe" },
  { size: 118, tilt: -54, flatten: 0.3, dur: 46, reverse: false, color: "45,212,191", sat: "#5eead4" },
] as const;

function GlobeVisual() {
  // 400×400 viewBox sphere, radius 150 centered at (200,200).
  const R = 150;
  const meridianRx = [150, 116, 74, 26];
  const parallelOffsets = [0, 42, 84, 118];

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[440px] aspect-square">
      <style>{`
        @keyframes gv-halo  { 0%,100%{opacity:.45} 50%{opacity:.8} }
        @keyframes gv-sheen { to { transform: rotate(360deg) } }
        @keyframes gv-orbit { to { transform: rotate(360deg) } }
        @keyframes gv-twinkle { 0%,100%{opacity:.15} 50%{opacity:.65} }
        @keyframes gv-floatA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(6px,-12px)} }
        @keyframes gv-floatB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-8px,-9px)} }
        @keyframes gv-floatC { 0%,100%{transform:translate(0,0)} 50%{transform:translate(7px,10px)} }
        @keyframes gv-floatD { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-6px,11px)} }
        @keyframes gv-livePing { 0%{transform:scale(1);opacity:.7} 75%,100%{transform:scale(2.4);opacity:0} }
        .gv-orbit { animation-name: gv-orbit; animation-timing-function: linear; animation-iteration-count: infinite; transform-origin: 50% 50%; }
        .gv-sheen { animation: gv-sheen 28s linear infinite; }
        .gv-halo  { animation: gv-halo 6s ease-in-out infinite; }
        .gv-twinkle { animation: gv-twinkle 4s ease-in-out infinite; }
        .gv-live-ping { animation: gv-livePing 2s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .gv-orbit, .gv-sheen, .gv-halo, .gv-twinkle, .gv-live-ping, .gv-float { animation: none !important; }
        }
      `}</style>

      {/* Ambient radial glow behind the globe */}
      <div
        className="absolute inset-[6%] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.14) 42%, transparent 68%)", filter: "blur(36px)" }}
        aria-hidden
      />

      {/* Star dots */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {STAR_DOTS.map((s, i) => (
          <span
            key={i}
            className="gv-twinkle absolute rounded-full bg-white"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, opacity: 0.4 }}
          />
        ))}
      </div>

      {/* The globe — SVG wireframe + dotted texture + shading + base halo */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="gv-body" cx="38%" cy="32%" r="80%">
            <stop offset="0%" stopColor="#1b1b35" />
            <stop offset="55%" stopColor="#101024" />
            <stop offset="100%" stopColor="#08080f" />
          </radialGradient>
          <radialGradient id="gv-shade" cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor="rgba(165,180,252,0.18)" />
            <stop offset="45%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>
          <radialGradient id="gv-rim" cx="50%" cy="50%" r="50%">
            <stop offset="78%" stopColor="rgba(129,140,248,0)" />
            <stop offset="100%" stopColor="rgba(129,140,248,0.35)" />
          </radialGradient>
          <pattern id="gv-dots" width="13" height="13" patternUnits="userSpaceOnUse">
            <circle cx="1.4" cy="1.4" r="1.1" fill="#a5b4fc" fillOpacity="0.5" />
          </pattern>
          <clipPath id="gv-clip"><circle cx="200" cy="200" r="150" /></clipPath>
        </defs>

        {/* Glowing base ring / halo at the bottom */}
        <ellipse className="gv-halo" cx="200" cy="338" rx="150" ry="26" fill="none" stroke="#2dd4bf" strokeOpacity="0.5" strokeWidth="2" style={{ filter: "blur(2px)" }} />
        <ellipse cx="200" cy="338" rx="150" ry="26" fill="none" stroke="#818cf8" strokeOpacity="0.45" strokeWidth="1" />

        {/* Planet body + clipped surface */}
        <circle cx="200" cy="200" r="150" fill="url(#gv-body)" />
        <g clipPath="url(#gv-clip)">
          <rect x="50" y="50" width="300" height="300" fill="url(#gv-dots)" opacity="0.5" />
          {parallelOffsets.map((d) => {
            const rx = Math.sqrt(Math.max(0, R * R - d * d));
            const ry = Math.max(3, rx * 0.16);
            return (
              <g key={`p${d}`} stroke="#818cf8" strokeOpacity="0.16" strokeWidth="1" fill="none">
                <ellipse cx="200" cy={200 - d} rx={rx} ry={ry} />
                {d !== 0 && <ellipse cx="200" cy={200 + d} rx={rx} ry={ry} />}
              </g>
            );
          })}
          {meridianRx.map((rx) => (
            <ellipse key={`m${rx}`} cx="200" cy="200" rx={rx} ry="150" fill="none" stroke="#818cf8" strokeOpacity="0.16" strokeWidth="1" />
          ))}
          <circle cx="200" cy="200" r="150" fill="url(#gv-shade)" />
        </g>

        {/* Rim light */}
        <circle cx="200" cy="200" r="150" fill="url(#gv-rim)" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="#818cf8" strokeOpacity="0.35" strokeWidth="1" />
      </svg>

      {/* Slowly rotating sheen over the sphere (sphere = 75% of the box) */}
      <div className="absolute inset-[12.5%] rounded-full overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="gv-sheen absolute inset-[-25%]"
          style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(129,140,248,0.10) 55deg, transparent 130deg, transparent 360deg)" }}
        />
      </div>

      {/* Orbit rings + traveling satellites (whole tilted ellipse rotates slowly) */}
      {ORBITS.map((o, i) => (
        <div
          key={i}
          className="gv-orbit absolute pointer-events-none"
          aria-hidden
          style={{
            width: `${o.size}%`,
            height: `${o.size}%`,
            left: "50%",
            top: "50%",
            marginLeft: `${-o.size / 2}%`,
            marginTop: `${-o.size / 2}%`,
            animationDuration: `${o.dur}s`,
            animationDirection: o.reverse ? "reverse" : "normal",
          }}
        >
          <div className="absolute inset-0" style={{ transform: `rotate(${o.tilt}deg)` }}>
            <div
              className="absolute inset-0 rounded-full"
              style={{ transform: `scaleY(${o.flatten})`, border: `1px solid rgba(${o.color},0.45)`, boxShadow: `0 0 14px rgba(${o.color},0.3)` }}
            />
            <span
              className="absolute left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ top: `${(1 - o.flatten) * 50}%`, background: o.sat, boxShadow: `0 0 10px 2px rgba(${o.color},0.7)` }}
            />
          </div>
        </div>
      ))}

      {/* Floating glass status cards */}
      {FLOAT_CARDS.map((c) => (
        <div
          key={c.title}
          className={`gv-float absolute ${c.pos} ${c.hideOnMobile ? "hidden sm:flex" : "flex"} items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-3 py-2`}
          style={{ animation: `${c.anim} 7s ease-in-out infinite`, boxShadow: `0 8px 30px -12px rgba(${c.glow},0.6)` }}
        >
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] ${c.tint}`}>
            <c.Icon className="h-3.5 w-3.5" />
          </span>
          <span className="leading-tight">
            <span className="block text-[11px] font-medium text-zinc-100">{c.title}</span>
            <span className="block text-[10px] text-zinc-500">{c.meta}</span>
          </span>
        </div>
      ))}

      {/* Focal glassmorphism card — live session */}
      <div className="absolute left-1/2 top-1/2 w-[62%] max-w-[230px] -translate-x-1/2 -translate-y-1/2">
        <div className="relative rounded-2xl border border-white/12 bg-zinc-950/55 backdrop-blur-md p-4 shadow-[0_0_40px_-8px_rgba(139,92,246,0.5)]">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent" aria-hidden />
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="gv-live-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">Live session</span>
          </div>
          <div className="mt-2 text-sm font-semibold text-white">React debugging</div>
          <div className="text-[11px] text-zinc-400">Solved in 28 min</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {TECH_CHIPS.map((t) => (
              <span key={t.label} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium text-zinc-300">
                <span className="h-1 w-1 rounded-full" style={{ background: t.dot }} />
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bottom hero stats bar (count-up on entry) ────────────────────────────────
const HERO_STATS = [
  { Icon: Users, value: 30, suffix: "+", label: "Sessions simulated", sub: "Real scenarios. Real help.", tint: "text-indigo-300", ring: "border-indigo-400/30" },
  { Icon: ShieldCheck, value: 6, suffix: "", label: "Developer profiles", sub: "Vetted. Trusted. Proven.", tint: "text-purple-300", ring: "border-purple-400/30" },
  { Icon: Zap, value: 3, suffix: "", label: "Booking states", sub: "Instant. Simple. Clear.", tint: "text-teal-300", ring: "border-teal-400/30" },
  { Icon: ThumbsUp, value: 100, suffix: "%", label: "Responsive experience", sub: "Fast. Smooth. Reliable.", tint: "text-emerald-300", ring: "border-emerald-400/30" },
] as const;

function HeroStat({ stat, active, reduced }: { stat: (typeof HERO_STATS)[number]; active: boolean; reduced: boolean }) {
  const n = useCountUp(stat.value, active, reduced);
  const Icon = stat.Icon;
  return (
    <div className="group relative flex flex-col gap-2 bg-[#0b0c10] px-6 py-7 sm:px-7 sm:py-8 transition-colors hover:bg-white/[0.02]">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${stat.ring} bg-white/[0.03] ${stat.tint}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="mt-1 text-4xl sm:text-5xl font-semibold tracking-tight text-white tabular-nums">
        {Math.round(n)}
        <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">{stat.suffix}</span>
      </span>
      <span className="text-sm font-medium text-white">{stat.label}</span>
      <span className="text-xs text-zinc-500 leading-snug">{stat.sub}</span>
    </div>
  );
}

function HeroStats() {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className="relative mt-16 lg:mt-20">
      <div
        className="absolute -inset-x-4 -inset-y-6 pointer-events-none"
        aria-hidden
        style={{ background: "radial-gradient(60% 80% at 50% 50%, rgba(99,102,241,0.12), rgba(45,212,191,0.06) 55%, transparent 80%)", filter: "blur(20px)" }}
      />
      <div className="relative rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_60px_-24px_rgba(99,102,241,0.55)]">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent z-10" aria-hidden />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.07]">
          {HERO_STATS.map((s) => (
            <HeroStat key={s.label} stat={s} active={inView} reduced={reduced} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();

  const steps = [
    {
      icon: <Search className="h-4 w-4" />,
      title: "Find a developer",
      text: "Browse people building things you care about.",
      ring: "from-indigo-400/70 to-indigo-500/0",
      dot: "bg-indigo-400",
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      title: "Pick a time",
      text: "Open their profile, choose a slot that works.",
      ring: "from-purple-400/70 to-purple-500/0",
      dot: "bg-purple-400",
    },
    {
      icon: <Coffee className="h-4 w-4" />,
      title: "Talk, solve, ship",
      text: "30 focused minutes on a real problem.",
      ring: "from-teal-400/70 to-teal-500/0",
      dot: "bg-teal-400",
    },
  ];

  return (
    <section id="how" className="py-28 border-t border-white/5">
      <div className="max-w-2xl">
        <h2 className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.14em]">
          How it works
        </h2>
        <p className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Three steps. No introductions. No back-and-forth.
        </p>
      </div>

      <div ref={ref} className="relative mt-14">
        {/* Progression line — animates left→right as the section enters (desktop) */}
        <div className="pointer-events-none absolute left-0 right-0 top-[26px] hidden sm:block" aria-hidden>
          <div className="h-px w-full bg-white/8" />
          <div
            className="absolute inset-y-0 left-0 h-px bg-gradient-to-r from-indigo-400/60 via-purple-400/60 to-teal-400/60 transition-[width] ease-out"
            style={{ width: inView || reduced ? "100%" : "0%", transitionDuration: "1400ms" }}
          />
        </div>

        <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="relative transition-all duration-700 ease-out"
              style={{
                transitionDelay: reduced ? "0ms" : `${i * 130}ms`,
                opacity: inView || reduced ? 1 : 0,
                transform: inView || reduced ? "translateY(0)" : "translateY(16px)",
              }}
            >
              {/* Numbered node sitting on the progression line */}
              <div className="relative z-10 flex items-center gap-3 sm:block">
                <div className="relative inline-flex">
                  <span
                    aria-hidden
                    className={`absolute -inset-1.5 rounded-full bg-gradient-to-br ${s.ring} blur-md opacity-70`}
                  />
                  <span className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/12 bg-zinc-950 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    {s.icon}
                    <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${s.dot} ring-2 ring-zinc-950`} />
                  </span>
                </div>
                <span className="font-mono text-[11px] text-zinc-600 sm:hidden">Step 0{i + 1}</span>
              </div>

              {/* Card body */}
              <div className="group mt-5 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_18px_50px_-26px_rgba(99,102,241,0.6)]">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
                <span className="hidden font-mono text-[11px] text-zinc-600 sm:inline">0{i + 1} / 03</span>
                <h3 className="mt-3 text-base font-medium text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Not just networking / developer sessions ────────────────────────────────
// Premium glass cards + a built-in booking panel. Contained glow/wave/particles
// blend into the page background (no new full-bleed bg). Transform/opacity only,
// in-view reveal, with a calm prefers-reduced-motion fallback. The "Book session"
// button is presentational here (the landing page has no booking handler yet).
const UC_PARTICLES = [
  { left: "8%", top: "24%", size: "3px", delay: "0s", dur: "7s" },
  { left: "22%", top: "70%", size: "2px", delay: "1.1s", dur: "9s" },
  { left: "47%", top: "16%", size: "2px", delay: "0.6s", dur: "8s" },
  { left: "63%", top: "62%", size: "3px", delay: "1.8s", dur: "10s" },
  { left: "81%", top: "30%", size: "2px", delay: "0.3s", dur: "7.5s" },
  { left: "91%", top: "72%", size: "2px", delay: "2.2s", dur: "9.5s" },
] as const;

function UseCases() {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [panelRef, panelInView] = useInView<HTMLDivElement>();

  const cases = [
    {
      Icon: Code2,
      title: "Quick code reviews",
      text: "Get a second pair of eyes on a PR before you merge.",
      PillIcon: Clock,
      pill: "~15 min avg response",
      tint: "text-indigo-300",
      badge: "border-indigo-400/30 bg-indigo-500/10",
      hover: "hover:border-indigo-400/40 hover:shadow-[0_22px_60px_-28px_rgba(99,102,241,0.8)]",
      hairline: "via-indigo-400/50",
      arrow: "group-hover:border-indigo-400/40 group-hover:bg-indigo-500/15",
    },
    {
      Icon: MessageSquare,
      title: "Career advice",
      text: "Talk through job decisions with someone further along.",
      PillIcon: Users,
      pill: "1:1 conversations",
      tint: "text-purple-300",
      badge: "border-purple-400/30 bg-purple-500/10",
      hover: "hover:border-purple-400/40 hover:shadow-[0_22px_60px_-28px_rgba(168,85,247,0.8)]",
      hairline: "via-purple-400/50",
      arrow: "group-hover:border-purple-400/40 group-hover:bg-purple-500/15",
    },
    {
      Icon: Braces,
      title: "Pair programming",
      text: "Unstick a hard problem in 30 minutes instead of 3 hours.",
      PillIcon: Activity,
      pill: "Live collaboration",
      tint: "text-teal-300",
      badge: "border-teal-400/30 bg-teal-500/10",
      hover: "hover:border-teal-400/40 hover:shadow-[0_22px_60px_-28px_rgba(45,212,191,0.8)]",
      hairline: "via-teal-400/50",
      arrow: "group-hover:border-teal-400/40 group-hover:bg-teal-500/15",
    },
  ];

  const benefits = [
    { Icon: Clock, label: "30-min", sub: "focused slots", tint: "text-indigo-300" },
    { Icon: Calendar, label: "Pick a time", sub: "instantly", tint: "text-purple-300" },
    { Icon: ShieldCheck, label: "Confirmed", sub: "in one tap", tint: "text-emerald-300" },
  ];

  const slots = [
    { t: "9:00", h: "h-5", on: false },
    { t: "10:00", h: "h-9", on: true },
    { t: "11:00", h: "h-6", on: false },
    { t: "12:00", h: "h-7", on: false },
  ];

  return (
    <section className="relative py-28 border-t border-white/5">
      <style>{`
        @keyframes uc-wave-drift { 0%,100%{transform:translateX(-50%)} 50%{transform:translateX(calc(-50% + 26px))} }
        @keyframes uc-float { 0%,100%{transform:translateY(0);opacity:.25} 50%{transform:translateY(-14px);opacity:.6} }
        .uc-wave { animation: uc-wave-drift 14s ease-in-out infinite; }
        .uc-particle { animation: uc-float var(--d,8s) ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .uc-wave, .uc-particle, .uc-anim { animation: none !important; }
        }
      `}</style>

      {/* Contained background — soft glow, wave line and faint particles (blends into page bg) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[18%] top-4 h-44 w-[55%] rounded-full bg-indigo-500/10 blur-[90px]" />
        <div className="absolute right-[14%] bottom-6 h-40 w-[42%] rounded-full bg-purple-500/[0.08] blur-[90px]" />
        <svg className="uc-wave absolute left-1/2 top-[44%] w-[150%] -translate-x-1/2 opacity-[0.16]" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="uc-wave-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(99,102,241,0)" />
              <stop offset="30%" stopColor="rgba(99,102,241,0.8)" />
              <stop offset="60%" stopColor="rgba(45,212,191,0.8)" />
              <stop offset="100%" stopColor="rgba(168,85,247,0)" />
            </linearGradient>
          </defs>
          <path d="M0,60 C150,12 300,108 450,60 S750,12 900,60 S1200,108 1350,60" stroke="url(#uc-wave-grad)" strokeWidth="1.5" />
        </svg>
        {UC_PARTICLES.map((p, i) => (
          <span
            key={i}
            className="uc-particle absolute rounded-full bg-white/70"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: p.delay, "--d": p.dur } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="relative">
        {/* Heading block */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-indigo-200">
            <Zap className="h-3 w-3" />
            Solve faster, together
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-[1.12]">
            Not just networking.
            <br />
            <span className="bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">Real outcomes.</span>
          </h2>
          <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
            Connect, then solve something — <span className="font-medium text-indigo-300">instantly</span>.
          </p>
        </div>

        {/* Three feature cards (equal height) */}
        <div ref={ref} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c, i) => (
            <div
              key={c.title}
              className="flex transition-all duration-700 ease-out"
              style={{
                transitionDelay: reduced ? "0ms" : `${i * 110}ms`,
                opacity: inView || reduced ? 1 : 0,
                transform: inView || reduced ? "translateY(0)" : "translateY(16px)",
              }}
            >
              <div className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-6 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1.5 ${c.hover}`}>
                <div className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent ${c.hairline} to-transparent`} aria-hidden />
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${c.badge} ${c.tint} transition-transform duration-300 group-hover:scale-110`}>
                  <c.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{c.title}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{c.text}</p>
                <div className="mt-auto flex items-center justify-between pt-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-zinc-400">
                    <c.PillIcon className={`h-3 w-3 ${c.tint}`} />
                    {c.pill}
                  </span>
                  <span aria-hidden className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] ${c.tint} transition-all duration-300 group-hover:-translate-y-0.5 ${c.arrow}`}>
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Built-in booking panel */}
        <div
          ref={panelRef}
          className="mt-10 transition-all duration-700 ease-out"
          style={{
            opacity: panelInView || reduced ? 1 : 0,
            transform: panelInView || reduced ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.14em]">
            Built-in booking
          </span>

          <div className="group mt-3 relative overflow-hidden rounded-2xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/[0.12] via-purple-500/[0.1] to-teal-500/[0.08] p-6 sm:p-7 backdrop-blur-sm transition-all duration-300 hover:border-indigo-300/45 hover:shadow-[0_0_50px_-12px_rgba(99,102,241,0.4)]">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent" aria-hidden />
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-400/15 blur-3xl pointer-events-none" aria-hidden />
            <div className="absolute -left-8 -bottom-10 h-32 w-32 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" aria-hidden />

            <div className="relative grid gap-8 lg:grid-cols-[1fr,auto] lg:items-center">
              {/* LEFT */}
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                  <ShieldCheck className="h-3 w-3 text-emerald-300" />
                  No-show protected · Free while early
                </span>
                <h3 className="mt-4 text-xl sm:text-2xl font-semibold tracking-tight text-white">
                  Instant developer sessions
                </h3>
                <p className="mt-2 text-sm sm:text-base text-zinc-200/85 leading-relaxed max-w-[52ch]">
                  Found someone useful? Book 30 minutes and solve it immediately.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                  {benefits.map((b) => (
                    <div key={b.label} className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] ${b.tint}`}>
                        <b.Icon className="h-4 w-4" />
                      </span>
                      <span className="leading-tight">
                        <span className="block text-sm font-medium text-white">{b.label}</span>
                        <span className="block text-[11px] text-zinc-400">{b.sub}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT — compact booking card */}
              <div className="relative w-full rounded-xl border border-white/15 bg-zinc-950/55 backdrop-blur-sm p-4 lg:w-[300px] transition-transform duration-300 group-hover:-translate-y-0.5">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent" aria-hidden />
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[11px] font-semibold text-white">SK</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-100 truncate">Sara Kim</div>
                    <div className="text-[11px] text-zinc-400 truncate">React debugging</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300">
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Clock className="h-3.5 w-3.5 text-indigo-300" />
                    10:00 · Available
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-300">
                    <span className="relative flex h-2 w-2">
                      <span className="uc-anim absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Live
                  </span>
                </div>

                {/* mini availability timeline */}
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {slots.map((s) => (
                    <div key={s.t} className="flex flex-col items-center gap-1">
                      <span className="flex h-9 w-full items-end justify-center rounded-md bg-white/[0.04] p-0.5">
                        <span className={`w-full rounded ${s.h} ${s.on ? "bg-gradient-to-t from-indigo-500 to-purple-400 shadow-[0_0_12px_rgba(129,140,248,0.65)]" : "bg-white/10"}`} />
                      </span>
                      <span className={`text-[9px] ${s.on ? "font-medium text-indigo-300" : "text-zinc-500"}`}>{s.t}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 h-9 px-3.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-8px_rgba(139,92,246,0.65)]"
                >
                  Book session
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
                <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-zinc-500">
                  <Zap className="h-2.5 w-2.5 text-indigo-300" />
                  Takes 30 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthSection() {
  const [tab, setTab] = useState("login");
  return (
    <section id="auth" className="py-28 border-t border-white/5 grid lg:grid-cols-[1fr,1fr] gap-14 items-center">
      <div className="max-w-md">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Join in under a minute.
        </h2>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Free while we're early. No credit card. No invites. Just sign up and start a conversation.
        </p>
        <ul className="mt-6 space-y-2.5 text-sm text-zinc-400">
          <li className="flex gap-2"><span className="text-zinc-600">·</span> Create a developer profile in 20 seconds</li>
          <li className="flex gap-2"><span className="text-zinc-600">·</span> Browse people actually building things</li>
          <li className="flex gap-2"><span className="text-zinc-600">·</span> Book a 30-minute session</li>
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-6 sm:p-7">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 h-10 rounded-lg bg-white/5 border border-white/5 p-1">
            <TabsTrigger
              value="login"
              className="text-sm rounded-md data-[state=active]:bg-white data-[state=active]:text-zinc-900 text-zinc-300"
            >
              Sign in
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="text-sm rounded-md data-[state=active]:bg-white data-[state=active]:text-zinc-900 text-zinc-300"
            >
              Sign up
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-5">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register" className="mt-5">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

// ─── Problem / Solution ───────────────────────────────────────────────────────
const PROBLEM_POINTS = [
  "Long threads that go nowhere",
  "DMs that feel transactional",
  "Networking events for the wrong crowd",
];
const SOLUTION_POINTS = [
  "Direct booking, no back-and-forth",
  "30-minute focused sessions",
  "Real developers, real problems solved",
];

// Premium interactive problem→solution split: a glowing transformation node on a
// vertical light beam, gradient orbit rings (rose on the left, cyan on the right)
// and slow particles. Reuses the existing dark/glow language; transform/opacity-
// only motion with an in-view reveal and a calm prefers-reduced-motion fallback.
function ProblemSolution() {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const shown = inView || reduced;

  return (
    <section className="relative py-28 border-t border-white/5 overflow-hidden">
      <style>{`
        @keyframes ps-pulse { 0%{transform:scale(.55);opacity:.55} 100%{transform:scale(1.7);opacity:0} }
        @keyframes ps-orbit { to { transform: rotate(360deg) } }
        @keyframes ps-breathe { 0%,100%{opacity:.4;transform:scale(.92)} 50%{opacity:.8;transform:scale(1.1)} }
        .ps-pulse  { transform-box: fill-box; transform-origin: center; animation: ps-pulse 4.5s ease-out infinite; }
        .ps-pulse2 { animation-delay: 2.25s; }
        .ps-orbit  { animation-name: ps-orbit; animation-timing-function: linear; animation-iteration-count: infinite; transform-origin: 50% 50%; }
        .ps-breathe{ animation: ps-breathe 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ps-pulse, .ps-orbit, .ps-breathe { animation: none !important; }
          .ps-pulse { opacity: .3 !important; }
        }
      `}</style>

      {/* Contained ambient glow — blends into the page background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[20%] top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-rose-500/[0.06] blur-[90px]" />
        <div className="absolute right-[20%] top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-cyan-500/[0.07] blur-[90px]" />
      </div>

      <div ref={ref} className="relative grid items-stretch gap-y-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-0">
        {/* LEFT — THE PROBLEM */}
        <div
          className="lg:pr-14 transition-all duration-700 ease-out"
          style={{ opacity: shown ? 1 : 0, transform: shown ? "translateX(0)" : "translateX(-28px)" }}
        >
          <span className="inline-flex items-center gap-2">
            <XCircle className="h-4 w-4 text-rose-400" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-rose-300/80">The problem</span>
          </span>
          <h2 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
            Developers don't need more{" "}
            <span className="bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent">networking.</span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
            They need fast, focused help on real problems.
          </p>
          <ul className="mt-8 divide-y divide-white/5">
            {PROBLEM_POINTS.map((item) => (
              <li key={item} className="group flex items-center gap-3 py-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 transition-all duration-300 group-hover:bg-rose-500/20 group-hover:shadow-[0_0_14px_rgba(244,63,94,0.45)]">
                  <XCircle className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-zinc-400 transition-colors duration-300 group-hover:text-zinc-200">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CENTER — transformation node */}
        <div
          className="relative flex items-center justify-center py-6 lg:py-0 transition-all duration-700 ease-out"
          style={{ transitionDelay: reduced ? "0ms" : "150ms", opacity: shown ? 1 : 0, transform: shown ? "scale(1)" : "scale(0.8)" }}
        >
          {/* Vertical light beam — full height on desktop, short connector on mobile */}
          <div aria-hidden className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-purple-500/40 to-transparent" />
          <div aria-hidden className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(168,85,247,0.12),transparent)]" />

          <div className="relative flex h-[180px] w-[180px] items-center justify-center">
            {/* Orbit rings (rose → purple → cyan gradient + radar pulse) */}
            <svg viewBox="0 0 180 180" className="absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <linearGradient id="ps-ring-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#a855f7" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <circle cx="90" cy="90" r="42" fill="none" stroke="url(#ps-ring-grad)" strokeWidth="1" opacity="0.55" />
              <circle cx="90" cy="90" r="66" fill="none" stroke="url(#ps-ring-grad)" strokeWidth="1" opacity="0.3" />
              <circle className="ps-pulse" cx="90" cy="90" r="42" fill="none" stroke="url(#ps-ring-grad)" strokeWidth="1.4" />
              <circle className="ps-pulse ps-pulse2" cx="90" cy="90" r="42" fill="none" stroke="url(#ps-ring-grad)" strokeWidth="1.4" />
            </svg>

            {/* Slow orbiting particles — rose (outer) and cyan (inner, reverse) */}
            <div className="ps-orbit absolute inset-0" style={{ animationDuration: "16s" }} aria-hidden>
              <span className="absolute left-1/2 top-[10px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-rose-400 shadow-[0_0_8px_2px_rgba(244,63,94,0.6)]" />
            </div>
            <div className="ps-orbit absolute inset-[20px]" style={{ animationDuration: "20s", animationDirection: "reverse" }} aria-hidden>
              <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.6)]" />
            </div>

            {/* Node */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-purple-400/40 bg-gradient-to-br from-purple-500/30 to-purple-700/20 backdrop-blur-sm shadow-[0_0_30px_-4px_rgba(168,85,247,0.7)]">
              <span aria-hidden className="ps-breathe absolute -inset-2 rounded-full bg-purple-500/30 blur-xl" />
              <Zap className="relative h-6 w-6 text-purple-50" />
            </div>
          </div>
        </div>

        {/* RIGHT — THE SOLUTION */}
        <div
          className="lg:pl-14 transition-all duration-700 ease-out"
          style={{ transitionDelay: reduced ? "0ms" : "100ms", opacity: shown ? 1 : 0, transform: shown ? "translateX(0)" : "translateX(28px)" }}
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-300/80">The solution</span>
          </span>
          <h2 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
            DevCircle removes{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">noise.</span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
            You book time, talk directly, solve something, and move on.
          </p>
          <ul className="mt-8 divide-y divide-white/5">
            {SOLUTION_POINTS.map((item) => (
              <li key={item} className="group flex items-center gap-3 py-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-all duration-300 group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_14px_rgba(16,185,129,0.45)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-zinc-400 transition-colors duration-300 group-hover:text-zinc-200">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Demo session ───────────────────────────────────────────────────────────
const DEMO_STEPS = [
  {
    id: "user-msg",
    role: "user" as const,
    content: "I'm stuck with a React state bug. My component isn't re-rendering when I update an array.",
    delay: 0,
  },
  {
    id: "dev-typing",
    role: "typing" as const,
    content: "",
    delay: 900,
  },
  {
    id: "dev-msg-1",
    role: "dev" as const,
    content: "Check if you're mutating state directly. React won't detect the change if the reference stays the same.",
    delay: 2200,
  },
  {
    id: "code",
    role: "code" as const,
    content: `// ❌ This won't trigger a re-render
const handleAdd = (item) => {
  items.push(item); // mutating original
  setItems(items); // same reference!
};

// ✅ Use a copy instead
const handleAdd = (item) => {
  setItems([...items, item]);
};`,
    delay: 3400,
  },
  {
    id: "dev-typing-2",
    role: "typing" as const,
    content: "",
    delay: 4600,
  },
  {
    id: "dev-msg-2",
    role: "dev" as const,
    content: "Use a copy instead of direct mutation. Spread operator or .slice() — either works.",
    delay: 5600,
  },
  {
    id: "result",
    role: "result" as const,
    content: "Bug fixed. State updates correctly.",
    delay: 6800,
  },
] as const;

type StepRole = (typeof DEMO_STEPS)[number]["role"];

function DemoSession() {
  const [started, setStarted] = useState(false);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startDemo = () => {
    if (started) return;
    setStarted(true);
    setVisibleIds([]);
    setDone(false);

    DEMO_STEPS.forEach((step, i) => {
      const t = setTimeout(() => {
        setVisibleIds((prev) => {
          // Replace typing indicator with actual message when the message arrives
          if (step.role === "dev" && i > 0) {
            const prev2 = prev.filter(
              (id) => id !== "dev-typing" && id !== "dev-typing-2"
            );
            return [...prev2, step.id];
          }
          return [...prev, step.id];
        });
        if (i === DEMO_STEPS.length - 1) {
          setDone(true);
        }
      }, step.delay);
      timersRef.current.push(t);
    });
  };

  const reset = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setStarted(false);
    setVisibleIds([]);
    setDone(false);
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [visibleIds]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const visibleSteps = DEMO_STEPS.filter((s) => visibleIds.includes(s.id));

  return (
    <section className="py-28 border-t border-white/5">
      <style>{`
        @keyframes fadeIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink     { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        .msg-enter  { animation: fadeIn 0.3s ease forwards; }
        .dot-blink  { animation: blink 1.2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="max-w-xl mb-10">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.14em]">
          Interactive demo
        </span>
        <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          See how a real session works
        </h2>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Watch a 30-minute debugging session compressed into 10 seconds.
        </p>
      </div>

      {/* Chat window */}
      <div className="max-w-2xl">
        <div className="rounded-xl border border-white/10 bg-zinc-950/70 backdrop-blur-md overflow-hidden shadow-2xl shadow-black/40">
          {/* Chrome bar */}
          <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              </div>
              <span className="text-[11px] font-mono text-zinc-500">Session #2847 — React debugging</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-zinc-500">Live</span>
            </div>
          </div>

          {/* Participants bar */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[11px] font-semibold text-white">U</div>
              <span className="text-xs text-zinc-400">You</span>
            </div>
            <span className="text-zinc-700 text-xs">·</span>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[11px] font-semibold text-white">MK</div>
              <span className="text-xs text-zinc-400">Marko K. <span className="text-zinc-600">— Senior React Engineer</span></span>
            </div>
          </div>

          {/* Messages area */}
          <div className="p-5 min-h-[220px] space-y-4 flex flex-col justify-start">
            {!started && (
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="text-center space-y-4">
                  <div className="text-2xl">💬</div>
                  <p className="text-sm text-zinc-500">Session ready to start</p>
                </div>
              </div>
            )}

            {visibleSteps.map((step) => (
              <DemoMessage key={step.id} step={step} />
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Label bar */}
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-zinc-600">Simulated real session</span>
            {done && (
              <button
                onClick={reset}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
              >
                Replay
              </button>
            )}
          </div>
        </div>

        {/* CTA row */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {!started ? (
            <button
              onClick={startDemo}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-white text-zinc-900 text-sm font-medium shadow-sm hover:bg-zinc-100 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Start demo session
            </button>
          ) : (
            <button
              disabled={!done}
              onClick={reset}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-md border border-white/15 text-sm font-medium text-zinc-300 hover:bg-white/[0.05] transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Try again
            </button>
          )}
          {done && (
            <a
              href="#auth"
              className="msg-enter inline-flex items-center gap-2 h-11 px-6 rounded-md border border-indigo-500/40 bg-indigo-500/10 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20 hover:-translate-y-0.5 transition-all duration-150"
            >
              Book a real session
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function DemoMessage({ step }: { step: (typeof DEMO_STEPS)[number] }) {
  if (step.role === "typing") {
    return (
      <div className="msg-enter flex items-end gap-2.5">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">MK</div>
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-zinc-800/80 border border-white/5">
          <div className="flex items-center gap-1">
            <span className="dot-blink h-1.5 w-1.5 rounded-full bg-zinc-400 inline-block" style={{ animationDelay: "0ms" }} />
            <span className="dot-blink h-1.5 w-1.5 rounded-full bg-zinc-400 inline-block" style={{ animationDelay: "200ms" }} />
            <span className="dot-blink h-1.5 w-1.5 rounded-full bg-zinc-400 inline-block" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      </div>
    );
  }

  if (step.role === "user") {
    return (
      <div className="msg-enter flex items-end justify-end gap-2.5">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-white/[0.08] border border-white/8">
          <p className="text-sm text-zinc-200 leading-relaxed">{step.content}</p>
        </div>
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">U</div>
      </div>
    );
  }

  if (step.role === "dev") {
    return (
      <div className="msg-enter flex items-end gap-2.5">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">MK</div>
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-zinc-800/80 border border-white/5">
          <p className="text-sm text-zinc-300 leading-relaxed">{step.content}</p>
        </div>
      </div>
    );
  }

  if (step.role === "code") {
    return (
      <div className="msg-enter flex items-start gap-2.5">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[11px] font-semibold text-white shrink-0 mt-0.5">MK</div>
        <div className="flex-1 rounded-xl rounded-tl-sm border border-white/8 bg-zinc-900 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">fix.tsx</span>
            <span className="text-[10px] text-zinc-600">JavaScript / React</span>
          </div>
          <pre className="px-4 py-3 text-[12px] font-mono leading-relaxed overflow-x-auto text-zinc-300 whitespace-pre">{step.content}</pre>
        </div>
      </div>
    );
  }

  if (step.role === "result") {
    return (
      <div className="msg-enter flex items-center justify-center py-2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/25 bg-emerald-500/8">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-emerald-400">{step.content}</span>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Founder section ───────────────────────────────────────────────────────────
function FounderSection() {
  return (
    <section className="py-28 border-t border-white/5">
      <div className="grid lg:grid-cols-[auto,1fr] gap-10 items-start">
        {/* Avatar */}
        <div className="flex flex-col items-center lg:items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
            DB
          </div>
          <div className="text-center lg:text-left">
            <div className="text-sm font-medium text-zinc-200">Dimitrije Bukejlovic</div>
            <div className="text-xs text-zinc-500 mt-0.5">Creator of DevCircle</div>
          </div>
        </div>

        {/* Text */}
        <div className="max-w-xl">
          <h2 className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.14em] mb-5">
            Built by
          </h2>
          <blockquote className="space-y-4">
            <p className="text-xl sm:text-2xl font-semibold tracking-tight text-white leading-snug">
              Built by Dimitrije Bukejlovic
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              I built DevCircle to explore how real developer tools should feel — simple, focused, and useful. The goal wasn't to create another social platform, but something practical: fast sessions, clear value, and clean execution.
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 mt-10 text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-3">
      <span>© DevCircle. Built for developers, by developers.</span>
      <span className="font-mono">v0.4 · alpha</span>
    </footer>
  );
}

const inputCls =
  "h-11 rounded-lg bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:border-white/40";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEmail("");
    setPassword("");
    if (emailRef.current) emailRef.current.value = "";
    if (passwordRef.current) passwordRef.current.value = "";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      const friendly = msg.includes("invalid login") || msg.includes("invalid email or password")
        ? "Wrong email or password."
        : msg.includes("rate") || msg.includes("limit")
        ? "Too many tries. Wait a moment and retry."
        : msg.includes("network") || msg.includes("fetch")
        ? "Network hiccup. Check your connection."
        : "Couldn't sign you in. Try again.";
      toast.error(friendly);
    } else {
      navigate("/");
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email" className="text-xs text-zinc-400">Email</Label>
        <Input ref={emailRef} id="login-email" name="login-email-field" type="email" placeholder="dev@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required autoFocus autoComplete="off" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password" className="text-xs text-zinc-400">Password</Label>
        <Input ref={passwordRef} id="login-password" name="login-password-field" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required autoComplete="new-password" />
      </div>
      <Button type="submit" className="w-full h-11 rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition-colors" disabled={loading}>
        {loading ? "Signing in…" : (
          <>
            Sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <p className="text-[11px] text-zinc-500 text-center pt-1">
        We won't spam you. Promise.
      </p>
    </form>
  );
}

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setEmail("");
    setPassword("");
    setUsername("");
    setDisplayName("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !username.trim()) return;
    if (password.length < 6) {
      toast.error("Password needs at least 6 characters.");
      return;
    }
    if (username.length < 3) {
      toast.error("Username needs at least 3 characters.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      toast.error("Username: lowercase letters, numbers, and underscores only.");
      return;
    }

    setLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (existing) {
        toast.error("That username is taken.");
        setLoading(false);
        return;
      }
    } catch {
      // Non-blocking
    }

    const { error } = await signUp(email, password, username, displayName || username);
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      const friendly = msg.includes("already registered")
        ? "An account with this email already exists."
        : msg.includes("password")
        ? "Password is too weak."
        : msg.includes("valid email") || msg.includes("invalid")
        ? "That email doesn't look right."
        : msg.includes("rate") || msg.includes("limit")
        ? "Too many tries. Wait a moment and retry."
        : "Couldn't create your account. Try again.";
      toast.error(friendly);
    } else {
      toast.success("You're in.");
      navigate("/");
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="reg-username" className="text-xs text-zinc-400">Username</Label>
          <Input id="reg-username" name="reg-username-field" placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className={inputCls} required autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-display" className="text-xs text-zinc-400">Display name</Label>
          <Input id="reg-display" name="reg-display-field" placeholder="John Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} autoComplete="off" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-email" className="text-xs text-zinc-400">Email</Label>
        <Input id="reg-email" name="reg-email-field" type="email" placeholder="dev@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required autoComplete="off" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-password" className="text-xs text-zinc-400">Password</Label>
        <Input id="reg-password" name="reg-password-field" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required autoComplete="new-password" />
      </div>
      <Button type="submit" className="w-full h-11 rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition-colors" disabled={loading}>
        {loading ? "Creating your account…" : (
          <>
            Create account
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <p className="text-[11px] text-zinc-500 text-center pt-1">
        No email verification. You're in straight away.
      </p>
    </form>
  );
}
