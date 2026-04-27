import { useEffect, useMemo, useState } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SLOTS,
  createBooking,
  fetchTakenSlots,
  toDateKey,
} from "@/lib/bookings";
import type { Profile } from "@/types";

interface Props {
  host: Profile;
  guestId: string;
  trigger: React.ReactNode;
  onBooked?: () => void;
}

type SlotState = "available" | "selected" | "booked" | "past";

function buildDateOptions(count = 14): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

function dateLabel(d: Date): string {
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE");
}

const STATE_LABEL: Record<SlotState, string> = {
  available: "Available",
  selected: "Selected",
  booked: "Booked",
  past: "Past",
};

export default function BookSessionDialog({ host, guestId, trigger, onBooked }: Props) {
  const [open, setOpen] = useState(false);
  const dates = useMemo(() => buildDateOptions(14), []);
  const [date, setDate] = useState<Date>(dates[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setDate(dates[0]);
      setSelectedSlot(null);
      setNote("");
      setTaken(new Set());
    }
  }, [open, dates]);

  // Reset selection when day changes & load taken slots
  useEffect(() => {
    if (!open) return;
    setSelectedSlot(null);
    setLoadingSlots(true);
    fetchTakenSlots(host.user_id, toDateKey(date))
      .then(setTaken)
      .catch(() => toast.error("Couldn't load availability"))
      .finally(() => setLoadingSlots(false));
  }, [date, host.user_id, open]);

  const isPastSlot = (s: string): boolean => {
    const dt = new Date(`${toDateKey(date)}T${s}:00`);
    return dt.getTime() < Date.now();
  };

  const getState = (s: string): SlotState => {
    if (isPastSlot(s)) return "past";
    if (taken.has(s)) return "booked";
    if (selectedSlot === s) return "selected";
    return "available";
  };

  const handleSelect = (s: string) => {
    const state = getState(s);
    if (state === "booked" || state === "past") return;
    setSelectedSlot((prev) => (prev === s ? null : s));
  };

  const handleConfirm = async () => {
    if (!selectedSlot || submitting) return;
    const slot = selectedSlot;
    const dateKey = toDateKey(date);
    setSubmitting(true);

    // Optimistic: mark booked immediately so the UI feels instant.
    const prevTaken = taken;
    setTaken((s) => new Set(s).add(slot));

    try {
      // Pre-flight check to catch obvious conflicts before the write.
      const fresh = await fetchTakenSlots(host.user_id, dateKey);
      if (fresh.has(slot)) {
        setTaken(fresh);
        setSelectedSlot(null);
        toast.error("This slot was just taken");
        return;
      }

      await createBooking({
        hostId: host.user_id,
        guestId,
        dateKey,
        slot,
        note: note.trim(),
      });

      toast.success("Session booked");
      setOpen(false);
      onBooked?.();
    } catch (err) {
      // Rollback optimistic update.
      const msg = err instanceof Error ? err.message : "";
      const isConflict =
        msg.toLowerCase().includes("duplicate") ||
        msg.includes("23505") ||
        msg.toLowerCase().includes("unique");

      if (isConflict) {
        // Refresh from server so the slot shows as actually booked.
        try {
          const fresh = await fetchTakenSlots(host.user_id, dateKey);
          setTaken(fresh);
        } catch {
          setTaken(prevTaken);
        }
        setSelectedSlot(null);
        toast.error("This slot was just taken");
      } else {
        setTaken(prevTaken);
        toast.error("Couldn't create booking. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const allUnavailable =
    !loadingSlots && DEFAULT_SLOTS.every((s) => taken.has(s) || isPastSlot(s));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-5 border-b border-border">
          <DialogTitle className="text-lg">
            Book a session with @{host.username}
          </DialogTitle>
          <DialogDescription className="text-sm mt-1">
            30 minutes · Pick a day and time, then confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* 1. Date */}
          <section className="px-6 pt-5 pb-5">
            <SectionLabel step={1}>Choose a day</SectionLabel>
            <div className="mt-3 flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
              {dates.map((d) => {
                const active = toDateKey(d) === toDateKey(date);
                return (
                  <button
                    key={toDateKey(d)}
                    type="button"
                    onClick={() => setDate(d)}
                    className={cn(
                      "shrink-0 flex flex-col items-center justify-center min-w-[60px] h-16 rounded-lg border text-xs transition-colors cursor-pointer",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background hover:border-foreground/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="font-medium">{dateLabel(d)}</span>
                    <span className="text-[11px] mt-1 tabular-nums opacity-80">
                      {format(d, "MMM d")}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Time */}
          <section className="px-6 pt-1 pb-6 border-t border-border">
            <div className="pt-5">
              <SectionLabel step={2}>Select a time to continue</SectionLabel>
            </div>
            <div className="mt-3">
              {loadingSlots ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading times…
                </div>
              ) : allUnavailable ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No slots available on this day.
                </p>
              ) : (
                <ul className="space-y-2">
                  {DEFAULT_SLOTS.map((s) => {
                    const state = getState(s);
                    const disabled = state === "booked" || state === "past";
                    return (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => handleSelect(s)}
                          disabled={disabled || submitting}
                          aria-pressed={state === "selected"}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3.5 rounded-lg border text-left transition-all duration-200 ease-out",
                            "disabled:cursor-not-allowed",
                            state === "available" &&
                              "border-border bg-background hover:border-foreground/40 hover:bg-muted/40 cursor-pointer active:scale-[0.99]",
                            state === "selected" &&
                              "border-foreground bg-foreground/[0.06] ring-2 ring-foreground/30 shadow-md scale-[1.02] cursor-pointer",
                            state === "booked" && "border-border bg-muted/30 opacity-70",
                            state === "past" && "border-border bg-muted/10 opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                state === "available" && "bg-emerald-500",
                                state === "selected" && "bg-foreground",
                                state === "booked" && "bg-muted-foreground/50",
                                state === "past" && "bg-muted-foreground/30"
                              )}
                            />
                            <span className="font-mono text-base tabular-nums">{s}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-xs font-medium",
                                state === "selected"
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {STATE_LABEL[state]}
                            </span>
                            {state === "selected" && (
                              <Check className="h-4 w-4 text-foreground" />
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* 3. Note */}
          <section className="px-6 pt-5 pb-6 border-t border-border">
            <SectionLabel step={3} optional>Add a note</SectionLabel>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`What do you want to talk about with ${host.display_name || `@${host.username}`}?`}
              rows={3}
              maxLength={280}
              className="mt-3 resize-none text-sm"
            />
          </section>
        </div>

        {/* 4. Action */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {selectedSlot ? (
              <>
                <span className="font-medium text-foreground">
                  {format(date, "EEE, MMM d")}
                </span>{" "}
                at{" "}
                <span className="font-mono font-medium text-foreground">
                  {selectedSlot}
                </span>
              </>
            ) : (
              "Pick a slot to continue"
            )}
          </span>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSlot || submitting}
            className="h-10 px-5 min-w-[160px]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Booking…
              </>
            ) : (
              "Confirm booking"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({
  step,
  optional,
  children,
}: {
  step: number;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold flex items-center justify-center tabular-nums">
        {step}
      </span>
      <span className="text-sm font-medium">{children}</span>
      {optional && (
        <span className="text-xs text-muted-foreground font-normal">(optional)</span>
      )}
    </div>
  );
}
