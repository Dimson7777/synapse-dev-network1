-- Bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  guest_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  slot TEXT NOT NULL, -- HH:MM
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | cancelled
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent double booking on the same host/date/slot when confirmed
CREATE UNIQUE INDEX bookings_unique_confirmed_slot
  ON public.bookings (host_id, booking_date, slot)
  WHERE status = 'confirmed';

CREATE INDEX bookings_host_idx ON public.bookings (host_id, booking_date);
CREATE INDEX bookings_guest_idx ON public.bookings (guest_id, booking_date);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE POLICY "Users can create bookings as guest"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = guest_id AND guest_id <> host_id);

CREATE POLICY "Host or guest can update their booking"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- updated_at trigger (reuse existing function pattern; create if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();