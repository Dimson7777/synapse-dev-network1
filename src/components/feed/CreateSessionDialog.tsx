import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlayCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TAGS = ["React", "TypeScript", "Node.js", "CSS", "Debugging", "Architecture", "Career"];
const DURATIONS = ["15 min", "30 min", "45 min", "60 min"];

export default function CreateSessionDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [duration, setDuration] = useState("30 min");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setTag("");
    setDuration("30 min");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Add a session title");
      return;
    }
    setSubmitting(true);
    // Frontend-only mock: simulate a brief "creating" state, then settle.
    window.setTimeout(() => {
      setSubmitting(false);
      setOpen(false);
      toast.success("Session created");
      reset();
    }, 700);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full mt-4 rounded-xl h-9 gap-2">
          <PlayCircle className="h-4 w-4" />
          Start a session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Start a session</DialogTitle>
          <DialogDescription>Spin up a live session for other developers to join.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="session-title" className="text-xs font-medium">Session title</Label>
            <Input
              id="session-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Debugging a tricky useEffect"
              maxLength={80}
              className="rounded-xl"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Topic / tag</Label>
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Pick a topic" />
              </SelectTrigger>
              <SelectContent>
                {TAGS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={submitting} className="w-full rounded-xl h-10">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              "Create session"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
