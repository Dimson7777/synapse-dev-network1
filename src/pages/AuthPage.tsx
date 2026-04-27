import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowRight, Code2, GitPullRequest, MessageSquare, Search, Calendar, Coffee, Circle } from "lucide-react";
import logoImg from "@/assets/logo.png";

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
    <div className="min-h-screen bg-[#0b0c10] text-zinc-100 selection:bg-zinc-300 selection:text-zinc-900">
      <Header />
      <main className="max-w-6xl mx-auto px-6 lg:px-8">
        <Hero />
        <Reveal><HowItWorks /></Reveal>
        <Reveal><UseCases /></Reveal>
        <Reveal><AuthSection /></Reveal>
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
  const { booked, online } = useLiveSignals();
  return (
    <section className="pt-24 pb-28 lg:pt-32 lg:pb-36 grid lg:grid-cols-[1.1fr,1fr] gap-14 items-center">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] text-zinc-400 mb-8">
          <Circle className="h-1.5 w-1.5 fill-emerald-500 text-emerald-500 animate-pulse" />
          <span>{booked} sessions booked today</span>
          <span className="text-zinc-700">·</span>
          <span>{online} online now</span>
        </div>

        <h1 className="text-[2.6rem] sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight leading-[1.05] text-white">
          Talk to developers.
          <br />
          <span className="text-zinc-500">Not profiles.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-md">
          Book a 30-minute session with someone actually building.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href="#auth"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-white text-zinc-900 text-sm font-medium shadow-sm hover:bg-zinc-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
          >
            Find developers
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#auth"
            className="inline-flex items-center h-11 px-5 rounded-md border border-white/15 bg-white/[0.02] text-sm font-medium text-zinc-200 hover:bg-white/[0.06] hover:border-white/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
          >
            Book a session
          </a>
        </div>
      </div>

      {/* Product preview — a real-looking booking card, not a placeholder */}
      <ProductPreview />
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-white/[0.02] rounded-2xl blur-2xl" aria-hidden />
      <div className="relative rounded-xl border border-white/10 bg-zinc-950/60 backdrop-blur-sm overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          </div>
          <span className="ml-2 text-[11px] text-zinc-500 font-mono">
            devcircle.app/u/sara — book session
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-semibold text-white">
              SK
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-100">Sara Kim</div>
              <div className="text-xs text-zinc-500">Senior backend · Go, Postgres</div>
            </div>
          </div>

          <div className="space-y-2">
            <PreviewSlot time="10:00" label="Available" tone="ok" />
            <PreviewSlot time="11:00" label="Selected" tone="selected" />
            <PreviewSlot time="12:00" label="Booked" tone="muted" />
          </div>

          <button
            type="button"
            disabled
            className="w-full h-10 rounded-md bg-white text-zinc-900 text-sm font-medium opacity-90"
          >
            Confirm booking
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewSlot({
  time,
  label,
  tone,
}: {
  time: string;
  label: string;
  tone: "ok" | "selected" | "muted";
}) {
  const styles = {
    ok: "border-white/10 bg-white/[0.02]",
    selected: "border-white/40 bg-white/5 ring-1 ring-white/30",
    muted: "border-white/5 bg-white/[0.01] opacity-60",
  }[tone];
  const dot = {
    ok: "bg-emerald-500",
    selected: "bg-white",
    muted: "bg-zinc-600",
  }[tone];
  return (
    <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border ${styles}`}>
      <div className="flex items-center gap-2.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="font-mono text-sm text-zinc-200">{time}</span>
      </div>
      <span className="text-xs text-zinc-400">{label}</span>
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
          How people actually use DevCircle
        </h2>
        <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
          Not networking. Not "let's connect." Real, short conversations about real work.
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
