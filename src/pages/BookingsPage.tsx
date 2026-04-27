import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import EmptyState from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  bookingDateTime,
  cancelBooking,
  fetchMyBookings,
  type BookingWithProfiles,
} from "@/lib/bookings";
import { getInitials } from "@/lib/utils";

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await fetchMyBookings(user.id);
      setBookings(rows);
    } catch {
      toast.error("Couldn't load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    // optimistic
    const prev = bookings;
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    try {
      await cancelBooking(id);
      toast.success("Booking cancelled");
    } catch {
      setBookings(prev);
      toast.error("Couldn't cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const now = Date.now();
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && bookingDateTime(b).getTime() >= now
  );
  const past = bookings.filter(
    (b) => b.status !== "confirmed" || bookingDateTime(b).getTime() < now
  );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sessions you scheduled with other developers, or that they scheduled with you.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-7 w-7" />}
            title="Nothing on the calendar"
            description="You haven't booked any sessions yet — find someone to talk to."
            action={
              <Link to="/explore">
                <Button size="sm" className="rounded-xl">Find developers</Button>
              </Link>
            }
          />
        ) : (
          <>
            <Section title="Upcoming" empty="Nothing scheduled.">
              {upcoming.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  currentUserId={user!.id}
                  onCancel={handleCancel}
                  cancelling={cancellingId === b.id}
                  canCancel
                />
              ))}
            </Section>

            <Section title="Past & cancelled" empty="No history.">
              {past.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  currentUserId={user!.id}
                  onCancel={handleCancel}
                  cancelling={false}
                  canCancel={false}
                />
              ))}
            </Section>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="space-y-3">
      <h2 className="section-label px-1">{title}</h2>
      {hasChildren ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <p className="text-sm text-muted-foreground px-1">{empty}</p>
      )}
    </div>
  );
}

function BookingRow({
  booking,
  currentUserId,
  onCancel,
  cancelling,
  canCancel,
}: {
  booking: BookingWithProfiles;
  currentUserId: string;
  onCancel: (id: string) => void;
  cancelling: boolean;
  canCancel: boolean;
}) {
  const isHost = booking.host_id === currentUserId;
  const other = isHost ? booking.guest : booking.host;
  const dt = bookingDateTime(booking);

  return (
    <div className="feed-card p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={other?.avatar_url || undefined} />
          <AvatarFallback className="gradient-bg text-primary-foreground text-xs font-semibold">
            {getInitials(other?.display_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            {isHost ? "With " : "With "}
            {other ? (
              <Link to={`/u/${other.username}`} className="hover:underline">
                {other.display_name || `@${other.username}`}
              </Link>
            ) : (
              "Unknown user"
            )}
            <span className="text-muted-foreground font-normal ml-1.5">
              ({isHost ? "they booked you" : "you booked"})
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {format(dt, "EEE, MMM d")} · {booking.slot}
            {booking.status === "cancelled" && (
              <span className="ml-2 text-destructive">· Cancelled</span>
            )}
          </div>
          {booking.note && (
            <div className="text-xs text-muted-foreground mt-1 truncate italic">
              “{booking.note}”
            </div>
          )}
        </div>
      </div>

      {canCancel && booking.status === "confirmed" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCancel(booking.id)}
          disabled={cancelling}
          className="text-destructive hover:text-destructive shrink-0"
        >
          {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel"}
        </Button>
      )}
    </div>
  );
}
