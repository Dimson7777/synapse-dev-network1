-- Prevent double-booking at the database level.
-- A host can only have ONE confirmed booking per (date, slot).
-- Cancelled bookings are excluded so the slot is freed on cancel.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_host_slot_confirmed_uniq
  ON public.bookings (host_id, booking_date, slot)
  WHERE status = 'confirmed';

-- Helpful read index for "taken slots" lookups.
CREATE INDEX IF NOT EXISTS bookings_host_date_idx
  ON public.bookings (host_id, booking_date);