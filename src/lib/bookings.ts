// Bookings API — simple, predictable scheduling
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

export const DEFAULT_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00",
] as const;

export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  id: string;
  host_id: string;
  guest_id: string;
  booking_date: string; // YYYY-MM-DD
  slot: string;         // HH:MM
  status: BookingStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithProfiles extends Booking {
  host: Profile | null;
  guest: Profile | null;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns the set of slot strings already taken (confirmed) for a host on a date. */
export async function fetchTakenSlots(hostId: string, dateKey: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("bookings")
    .select("slot")
    .eq("host_id", hostId)
    .eq("booking_date", dateKey)
    .eq("status", "confirmed");

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.slot));
}

export async function createBooking(params: {
  hostId: string;
  guestId: string;
  dateKey: string;
  slot: string;
  note?: string;
}): Promise<Booking> {
  const { hostId, guestId, dateKey, slot, note } = params;
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      host_id: hostId,
      guest_id: guestId,
      booking_date: dateKey,
      slot,
      note: note ?? "",
    })
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);
  if (error) throw error;
}

/** All bookings where the user is host OR guest (any status). */
export async function fetchMyBookings(userId: string): Promise<BookingWithProfiles[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
    .order("booking_date", { ascending: true })
    .order("slot", { ascending: true });

  if (error) throw error;
  const rows = (data ?? []) as Booking[];
  if (rows.length === 0) return [];

  // Hydrate profiles (no FK between bookings and profiles)
  const userIds = Array.from(new Set(rows.flatMap((r) => [r.host_id, r.guest_id])));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("user_id", userIds);

  const byId = new Map((profiles ?? []).map((p) => [p.user_id, p as Profile]));
  return rows.map((r) => ({
    ...r,
    host: byId.get(r.host_id) ?? null,
    guest: byId.get(r.guest_id) ?? null,
  }));
}

/** Compares a booking's date+slot to now. */
export function bookingDateTime(b: Pick<Booking, "booking_date" | "slot">): Date {
  return new Date(`${b.booking_date}T${b.slot}:00`);
}
