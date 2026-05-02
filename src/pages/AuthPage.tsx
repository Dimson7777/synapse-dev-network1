import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowRight, Code2, GitPullRequest, MessageSquare, Search, Calendar, Coffee, Circle, CheckCircle2, Loader2, X, Minus, Zap } from "lucide-react";
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

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#0b0c10] text-zinc-100 selection:bg-zinc-300 selection:text-zinc-900 overflow-x-hidden">
      <AnimatedBackground />
      <Header />
      <main className="max-w-6xl mx-auto px-6 lg:px-8 relative">
        <Hero />
        <Reveal><HowItWorks /></Reveal>
        <Reveal><ProblemSolution /></Reveal>
        <Reveal><UseCases /></Reveal>
        <Reveal><Differentiation /></Reveal>
        <Reveal><MetricsStrip /></Reveal>
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
    <section className="relative pt-20 pb-24 lg:pt-28 lg:pb-32 grid lg:grid-cols-[1.05fr,1fr] gap-12 lg:gap-16 items-center">
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
          <a
            href="#auth"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-white text-zinc-900 text-sm font-medium shadow-sm hover:bg-zinc-100 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.16)] active:translate-y-0 transition-all duration-200"
          >
            Find developers
            <ArrowRight className="h-4 w-4" />
          </a>
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
    </section>
  );
}

function GlobeVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const S = 480;
    const cx = S / 2, cy = S / 2, R = S * 0.365;
    const D2R = Math.PI / 180;

    const NODES: { lat: number; lon: number; init: string; col: string }[] = [
      { lat: 40.7, lon: -74.0,  init: "JD", col: "#818cf8" },
      { lat: 51.5, lon: -0.1,   init: "SK", col: "#c084fc" },
      { lat: 48.8, lon: 2.3,    init: "MK", col: "#60a5fa" },
      { lat: 35.7, lon: 139.7,  init: "AN", col: "#34d399" },
      { lat: -33.9, lon: 151.2, init: "LV", col: "#f472b6" },
      { lat: 19.1, lon: 72.9,   init: "RK", col: "#fb923c" },
      { lat: 37.8, lon: -122.4, init: "PE", col: "#a78bfa" },
      { lat: -23.5, lon: -46.6, init: "DB", col: "#4ade80" },
    ];

    const BASE_CONNS: [number, number][] = [
      [0, 1], [1, 2], [0, 6], [2, 3], [3, 4], [5, 3], [7, 0], [6, 1],
    ];

    const ALL_CONN_POOL: [number, number][] = [];
    for (let i = 0; i < NODES.length; i += 1) {
      for (let j = i + 1; j < NODES.length; j += 1) {
        ALL_CONN_POOL.push([i, j]);
      }
    }

    const BUBBLES: { src: number; dst: number; msg: string; start: number; dur: number }[] = [
      { src: 0, dst: 1, msg: "Need help with React state", start: 0,    dur: 5200 },
      { src: 6, dst: 3, msg: "Reviewing PR",               start: 2000, dur: 4500 },
      { src: 3, dst: 1, msg: "Booked 30 min",              start: 1200, dur: 4800 },
      { src: 4, dst: 6, msg: "Bug fixed",                  start: 3200, dur: 3800 },
      { src: 7, dst: 2, msg: "Session confirmed",          start: 1800, dur: 5000 },
    ];

    const startTime = Date.now();

    const seededPick = (slot: number, count: number) => {
      const pool = [...ALL_CONN_POOL];
      const picked: [number, number][] = [...BASE_CONNS];
      let seed = (slot + 1) * 2654435761;
      while (picked.length < count && pool.length > 0) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const idx = seed % pool.length;
        const c = pool.splice(idx, 1)[0];
        if (!c) break;
        const exists = picked.some(([a, b]) => (a === c[0] && b === c[1]) || (a === c[1] && b === c[0]));
        if (!exists) picked.push(c);
      }
      return picked;
    };

    const project = (lat: number, lon: number, rot: number) => {
      const la = lat * D2R, lo = lon * D2R + rot;
      return { x: Math.cos(la) * Math.sin(lo), y: Math.sin(la), z: Math.cos(la) * Math.cos(lo) };
    };

    const toScr = (x: number, y: number, z: number) => ({
      sx: cx + R * x,
      sy: cy - R * y,
      vis: z > -0.08,
      a: Math.max(0, Math.min(1, (z + 0.6) / 1.4)),
    });

    const bezPt = (t: number, ax: number, ay: number, cpx: number, cpy: number, bx: number, by: number) => ({
      x: (1 - t) ** 2 * ax + 2 * (1 - t) * t * cpx + t ** 2 * bx,
      y: (1 - t) ** 2 * ay + 2 * (1 - t) * t * cpy + t ** 2 * by,
    });

    const rrect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x, y + h, r); ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y, r); ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };

    const frame = () => {
      const elapsed = Date.now() - startTime;
      const rot = elapsed * 0.00022;
      const connSlot = Math.floor(elapsed / 3800);
      const activeConns = seededPick(connSlot, 11);
      ctx.clearRect(0, 0, S, S);

      // Ambient glow behind globe
      const glow = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 1.4);
      glow.addColorStop(0, "rgba(99,102,241,0.07)");
      glow.addColorStop(0.5, "rgba(139,92,246,0.05)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, S, S);

      // Globe rim
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(99,102,241,0.18)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Grid lines clipped to sphere surface
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 1, 0, Math.PI * 2);
      ctx.clip();
      for (let lat = -75; lat <= 75; lat += 25) {
        ctx.beginPath();
        let fw = true, wv = false;
        for (let lo = -180; lo <= 181; lo += 2) {
          const p = project(lat, lo, rot), s = toScr(p.x, p.y, p.z);
          if (s.vis) { (fw || !wv) ? ctx.moveTo(s.sx, s.sy) : ctx.lineTo(s.sx, s.sy); fw = false; }
          wv = s.vis;
        }
        ctx.strokeStyle = "rgba(99,102,241,0.10)"; ctx.lineWidth = 0.5; ctx.stroke();
      }
      for (let lo = -165; lo < 180; lo += 25) {
        ctx.beginPath();
        let fw = true, wv = false;
        for (let lat2 = -85; lat2 <= 85; lat2 += 2) {
          const p = project(lat2, lo, rot), s = toScr(p.x, p.y, p.z);
          if (s.vis) { (fw || !wv) ? ctx.moveTo(s.sx, s.sy) : ctx.lineTo(s.sx, s.sy); fw = false; }
          wv = s.vis;
        }
        ctx.strokeStyle = "rgba(99,102,241,0.10)"; ctx.lineWidth = 0.5; ctx.stroke();
      }
      ctx.restore();

      // Project all node positions
      const np = NODES.map((n) => {
        const p = project(n.lat, n.lon, rot);
        return { ...toScr(p.x, p.y, p.z), col: n.col, init: n.init };
      });

      // Connection arcs between nodes (dynamic set rotates every few seconds)
      activeConns.forEach(([ai, bi], ci) => {
        const na = np[ai], nb = np[bi];
        if (!na.vis || !nb.vis) return;
        const mx = (na.sx + nb.sx) / 2, my = (na.sy + nb.sy) / 2;
        const dx = mx - cx, dy = my - cy, dl = Math.hypot(dx, dy) || 1;
        const cpx = mx + (dx / dl) * R * 0.26, cpy = my + (dy / dl) * R * 0.26;
        ctx.beginPath(); ctx.moveTo(na.sx, na.sy); ctx.quadraticCurveTo(cpx, cpy, nb.sx, nb.sy);
        const flow = 0.75 + 0.25 * Math.sin((elapsed / 880) + ci);
        ctx.strokeStyle = `rgba(139,92,246,${+(Math.min(na.a, nb.a) * 0.34 * flow).toFixed(3)})`;
        ctx.lineWidth = 0.9; ctx.stroke();
      });

      // Developer node glows, dots and initials (active/idle brightness variation)
      np.forEach(({ sx, sy, vis, a, col, init }, ni) => {
        if (!vis) return;
        const pulse = 0.72 + 0.28 * Math.sin((elapsed / 1200) + ni * 0.85);
        const activeBoost = (Math.floor(elapsed / 3000) + ni) % 3 === 0 ? 1.18 : 0.92;
        const alpha = Math.min(1, a * pulse * activeBoost);
        ctx.globalAlpha = alpha;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 16);
        g.addColorStop(0, col + "50"); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 16, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx, sy, 3.2 + pulse * 0.8, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        ctx.font = "bold 8.5px system-ui,sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(init, sx, sy + 7.5);
        ctx.globalAlpha = 1;
      });

      // Traveling message bubbles
      BUBBLES.forEach((b) => {
        const cycle = b.dur + 2600;
        const t2 = (elapsed - b.start + cycle * 20) % cycle;
        if (t2 > b.dur) return;
        const t = t2 / b.dur;
        const na = np[b.src], nb = np[b.dst];
        if (!na.vis || !nb.vis) return;
        const mx = (na.sx + nb.sx) / 2, my = (na.sy + nb.sy) / 2;
        const dx = mx - cx, dy = my - cy, dl = Math.hypot(dx, dy) || 1;
        const cpx = mx + (dx / dl) * R * 0.26, cpy = my + (dy / dl) * R * 0.26;
        const bp = bezPt(t, na.sx, na.sy, cpx, cpy, nb.sx, nb.sy);
        const fade = t < 0.1 ? t / 0.1 : t > 0.85 ? (1 - t) / 0.15 : 1;
        ctx.font = "bold 9.5px system-ui,sans-serif";
        const tw = ctx.measureText(b.msg).width, pw = tw + 14, ph = 20;
        ctx.globalAlpha = fade * 0.93;
        rrect(bp.x - pw / 2, bp.y - ph / 2, pw, ph, ph / 2);
        ctx.fillStyle = "rgba(10,10,22,0.93)"; ctx.fill();
        ctx.strokeStyle = "rgba(139,92,246,0.5)"; ctx.lineWidth = 0.75; ctx.stroke();
        ctx.fillStyle = "rgba(210,210,255,0.92)";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(b.msg, bp.x, bp.y + 0.5);
        ctx.globalAlpha = 1;
      });

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full">
      <div
        className="absolute inset-[8%] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle,rgba(99,102,241,0.22) 0%,rgba(139,92,246,0.14) 42%,transparent 68%)",
          filter: "blur(32px)",
        }}
        aria-hidden
      />
      <canvas
        ref={canvasRef}
        width={480}
        height={480}
        className="relative w-full max-w-[440px] aspect-square"
      />
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: <Search className="h-4 w-4" />, title: "Find a developer", text: "Browse people building things you care about." },
    { icon: <Calendar className="h-4 w-4" />, title: "Pick a time", text: "Open their profile, choose a slot that works." },
    { icon: <Coffee className="h-4 w-4" />, title: "Talk, solve, ship", text: "30 focused minutes on a real problem." },
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
      <div className="mt-12 grid sm:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/15 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="font-mono text-xs text-zinc-500">0{i + 1}</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-400">{s.icon}</span>
            </div>
            <h3 className="mt-5 text-base font-medium text-white">{s.title}</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    {
      icon: <GitPullRequest className="h-4 w-4" />,
      title: "Quick code reviews",
      text: "Get a second pair of eyes on a PR before you merge.",
    },
    {
      icon: <MessageSquare className="h-4 w-4" />,
      title: "Career advice",
      text: "Talk through job decisions with someone further along.",
    },
    {
      icon: <Code2 className="h-4 w-4" />,
      title: "Pair programming",
      text: "Unstick a hard problem in 30 minutes instead of 3 hours.",
    },
  ];
  return (
    <section className="py-28 border-t border-white/5">
      <div className="max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Not just networking. Real outcomes.
        </h2>
        <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
          Connect, then solve something — instantly.
        </p>
      </div>

      <div className="mt-12 grid sm:grid-cols-3 gap-6">
        {cases.map((c, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/15 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="h-8 w-8 rounded-md border border-white/10 bg-white/5 flex items-center justify-center text-zinc-300">
              {c.icon}
            </div>
            <h3 className="mt-5 text-sm font-medium text-white">{c.title}</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.14em]">
          Built-in booking
        </span>

        <div className="group mt-3 relative overflow-hidden rounded-2xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/[0.12] via-purple-500/[0.1] to-teal-500/[0.08] p-6 sm:p-7 transition-all duration-300 hover:border-indigo-300/45 hover:shadow-[0_0_40px_rgba(99,102,241,0.22)]">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-400/15 blur-3xl pointer-events-none" aria-hidden />
          <div className="absolute -left-8 -bottom-10 h-32 w-32 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" aria-hidden />

          <div className="relative grid gap-6 sm:grid-cols-[1fr,auto] sm:items-center">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                Instant developer sessions
              </h3>
              <p className="mt-2 text-sm sm:text-base text-zinc-200/85 leading-relaxed max-w-[52ch]">
                Found someone useful? Book 30 minutes and solve it immediately.
              </p>
            </div>

            <div className="relative rounded-xl border border-white/15 bg-zinc-950/55 backdrop-blur-sm p-4 sm:w-[280px]">
              <div className="text-sm font-medium text-zinc-100">Sara Kim — React debugging</div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-300">
                <span className="font-mono">10:00 • Available</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                </span>
              </div>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 h-9 px-3.5 rounded-md bg-white text-zinc-900 text-xs font-semibold transition-all duration-200 group-hover:bg-zinc-100 group-hover:-translate-y-0.5"
              >
                Book session
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
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
function ProblemSolution() {
  return (
    <section className="py-28 border-t border-white/5">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* Problem */}
        <div>
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.14em]">
            The problem
          </span>
          <p className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
            Developers don't need more networking.
          </p>
          <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
            They need fast, focused help on real problems.
          </p>
          <div className="mt-8 space-y-3">
            {["Long threads that go nowhere", "DMs that feel transactional", "Networking events for the wrong crowd"].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-zinc-500">
                <span className="mt-0.5 h-4 w-4 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center shrink-0">
                  <Minus className="h-2.5 w-2.5 text-red-400" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Solution */}
        <div className="lg:pl-8 lg:border-l lg:border-white/5">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.14em]">
            The solution
          </span>
          <p className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
            DevCircle removes noise.
          </p>
          <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
            You book time, talk directly, solve something, and move on.
          </p>
          <div className="mt-8 space-y-3">
            {["Direct booking, no back-and-forth", "30-minute focused sessions", "Real developers, real problems solved"].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                <span className="mt-0.5 h-4 w-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Differentiation ─────────────────────────────────────────────────────────
function Differentiation() {
  const items = [
    {
      title: "No endless messaging",
      desc: "Skip the thread. Book a slot and show up.",
      accent: "from-rose-500/10 to-transparent",
      border: "border-rose-500/15",
    },
    {
      title: "No profile hunting",
      desc: "Find someone by skill. Book immediately. Done.",
      accent: "from-amber-500/10 to-transparent",
      border: "border-amber-500/15",
    },
    {
      title: "No wasted time",
      desc: "30 minutes. One problem. Real outcome.",
      accent: "from-emerald-500/10 to-transparent",
      border: "border-emerald-500/15",
    },
  ];

  return (
    <section className="py-28 border-t border-white/5">
      <div className="max-w-xl mb-12">
        <h2 className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.14em]">
          Why it's different
        </h2>
        <p className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Designed to get out of your way.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.title}
            className={`relative rounded-xl border ${item.border} bg-gradient-to-b ${item.accent} bg-white/[0.02] p-6 overflow-hidden group hover:-translate-y-1 transition-all duration-200`}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <h3 className="text-base font-semibold text-white">{item.title}</h3>
            <p className="mt-2.5 text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Metrics strip ────────────────────────────────────────────────────────────
function MetricsStrip() {
  const metrics = [
    { value: "30+", label: "sessions simulated" },
    { value: "6", label: "developer profiles" },
    { value: "3", label: "booking states" },
    { value: "100%", label: "responsive UI" },
  ];
  return (
    <section className="py-16 border-t border-white/5">
      <div className="text-center mb-10">
        <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.14em]">
          Internal product data
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-[#0b0c10] px-6 py-8 flex flex-col items-center gap-1.5 hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-3xl font-semibold tracking-tight text-white tabular-nums">{m.value}</span>
            <span className="text-xs text-zinc-500 text-center">{m.label}</span>
          </div>
        ))}
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
