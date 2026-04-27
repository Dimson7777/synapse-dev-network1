import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types";
import { composeProfileBio, parseProfileBio } from "@/lib/post-content";

interface EditProfileDialogProps {
  profile: Profile;
  onUpdated: (updated: Profile) => void;
}

export default function EditProfileDialog({ profile, onUpdated }: EditProfileDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const initial = useMemo(() => parseProfileBio(profile.bio), [profile.bio]);

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [bio, setBio] = useState(initial.text);
  const [skills, setSkills] = useState<string[]>(initial.skills);
  const [skillDraft, setSkillDraft] = useState("");
  const [website, setWebsite] = useState(profile.website || "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");
  const [location, setLocation] = useState(profile.location || "");

  const addSkill = (raw: string) => {
    const cleaned = raw.trim().replace(/^#/, "").toLowerCase();
    if (!cleaned || skills.includes(cleaned) || skills.length >= 10) return;
    setSkills((s) => [...s, cleaned]);
  };

  const handleSkillKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillDraft);
      setSkillDraft("");
    } else if (e.key === "Backspace" && !skillDraft && skills.length) {
      setSkills((s) => s.slice(0, -1));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      toast.error("Display name can't be empty");
      return;
    }

    setIsSaving(true);
    try {
      // Flush any draft skill
      const finalSkills = [...skills];
      const draftClean = skillDraft.trim().replace(/^#/, "").toLowerCase();
      if (draftClean && !finalSkills.includes(draftClean)) finalSkills.push(draftClean);

      const composedBio = composeProfileBio(bio, finalSkills);

      const updated = await updateProfile(user.id, {
        display_name: displayName.trim(),
        bio: composedBio,
        website: website.trim(),
        github_url: githubUrl.trim(),
        location: location.trim(),
      });
      onUpdated(updated);
      setOpen(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Couldn't save changes. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl gap-1.5">
          <Pencil className="h-3 w-3" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <FormField label="Display Name">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Your name"
              className="rounded-xl"
            />
          </FormField>

          <FormField label="Bio">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              className="resize-none min-h-[80px] rounded-xl"
              placeholder="Frontend dev. Likes good DX and bad puns."
            />
            <span className="text-[10px] text-muted-foreground">{bio.length}/300</span>
          </FormField>

          <FormField label="Stack / Skills">
            <div className="rounded-xl border border-input bg-background px-2 py-2 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-ring">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 text-xs font-medium bg-accent text-accent-foreground rounded-full pl-2.5 pr-1 py-0.5"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setSkills((curr) => curr.filter((x) => x !== s))}
                    className="rounded-full hover:bg-background/60 p-0.5"
                    aria-label={`Remove ${s}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={handleSkillKey}
                onBlur={() => {
                  if (skillDraft.trim()) {
                    addSkill(skillDraft);
                    setSkillDraft("");
                  }
                }}
                placeholder={skills.length ? "" : "react, typescript, postgres..."}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-xs px-1 py-0.5"
                maxLength={20}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              Press enter or comma to add. Max 10.
            </span>
          </FormField>

          <FormField label="Location">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
              maxLength={100}
              className="rounded-xl"
            />
          </FormField>

          <FormField label="Website">
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
              maxLength={200}
              type="url"
              className="rounded-xl"
            />
          </FormField>

          <FormField label="GitHub">
            <Input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              maxLength={200}
              type="url"
              className="rounded-xl"
            />
          </FormField>

          <Button onClick={handleSave} disabled={isSaving} className="w-full rounded-xl h-10">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
