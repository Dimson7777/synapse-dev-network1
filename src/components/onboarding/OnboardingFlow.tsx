import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, ArrowLeft, Check, User, MapPin, Github } from "lucide-react";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import type { Profile } from "@/types";

const STEPS = [
  { title: "Welcome to DevCircle!", subtitle: "Let's set up your profile in a few quick steps." },
  { title: "Tell us about yourself", subtitle: "Add a bio and photo so others can find you." },
  { title: "Where are you based?", subtitle: "Help nearby developers connect with you." },
  { title: "You're all set!", subtitle: "Your profile is ready. Start exploring." },
] as const;

export default function OnboardingFlow({ profile, onComplete }: { profile: Profile; onComplete: () => void }) {
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [location, setLocation] = useState(profile.location || "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");
  const [website, setWebsite] = useState(profile.website || "");

  const lastStep = step === STEPS.length - 1;

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile(profile.user_id, {
        display_name: displayName.trim() || profile.display_name,
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        location: location.trim(),
        github_url: githubUrl.trim(),
        website: website.trim(),
      });
      await refreshProfile();
      toast.success("Profile set up! Welcome aboard 🎉");
      onComplete();
    } catch {
      toast.error("Couldn't save your profile. Try again.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-scale-up">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-500", i <= step ? "gradient-bg" : "bg-border")} />
          ))}
        </div>

        <div className="feed-card p-8 sm:p-10">
          <div className="text-center mb-8" key={step}>
            <h1 className="text-2xl font-bold tracking-tight">{STEPS[step].title}</h1>
            <p className="text-muted-foreground mt-2">{STEPS[step].subtitle}</p>
          </div>

          <div className="space-y-5" key={`body-${step}`}>
            {step === 0 && (
              <div className="text-center space-y-6">
                <div className="mx-auto h-20 w-20 rounded-2xl gradient-bg flex items-center justify-center animate-float">
                  <User className="h-10 w-10 text-primary-foreground" />
                </div>
                <div className="space-y-3">
                  <Input
                    placeholder="Your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-12 text-center text-lg"
                  />
                  <p className="text-xs text-muted-foreground">This is how others will see you — @{profile.username}</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-border">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="gradient-bg text-primary-foreground text-lg font-bold">
                      {getInitials(displayName || profile.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input placeholder="Avatar URL (paste an image link)" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="h-10 text-sm" type="url" />
                    <p className="text-xs text-muted-foreground mt-1">Paste a link to your profile photo</p>
                  </div>
                </div>
                <Textarea
                  placeholder="Write a short bio — what do you work on?"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[100px] resize-none text-sm"
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" /> Location
                  </label>
                  <Input placeholder="e.g. San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Github className="h-4 w-4 text-muted-foreground" /> GitHub
                  </label>
                  <Input placeholder="https://github.com/you" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="h-11" type="url" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input placeholder="https://yoursite.dev" value={website} onChange={(e) => setWebsite(e.target.value)} className="h-11" type="url" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-5">
                <Avatar className="h-20 w-20 mx-auto ring-2 ring-border">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="gradient-bg text-primary-foreground text-2xl font-bold">
                    {getInitials(displayName || profile.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{displayName || profile.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  {bio && <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">{bio}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onComplete} className="text-muted-foreground">
                Skip for now
              </Button>
            )}

            <Button
              onClick={() => lastStep ? save() : setStep((s) => s + 1)}
              disabled={saving}
              className="gradient-bg border-0 text-primary-foreground hover:opacity-90"
            >
              {saving ? "Saving..." : lastStep ? (
                <><Check className="h-4 w-4 mr-1.5" /> Let's go!</>
              ) : (
                <>Continue <ArrowRight className="h-4 w-4 ml-1.5" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
