-- Create ride_offers table
create table if not exists public.ride_offers (
  id uuid default gen_random_uuid() primary key,
  ride_id uuid references public.rides(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete cascade,
  driver_lat float,
  driver_lng float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(ride_id, driver_id)
);

-- Update RLS for ride_offers
alter table public.ride_offers enable row level security;

create policy "Clients can see offers for their rides" on public.ride_offers
  for select using (
    exists (
      select 1 from public.rides 
      where rides.id = ride_offers.ride_id 
      and rides.client_id = auth.uid()
    )
  );

create policy "Drivers can manage their own offers" on public.ride_offers
  for all using (auth.uid() = driver_id);

-- Add city column to rides if missing (safety check)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='rides' and column_name='city') then
    alter table public.rides add column city text;
  end if;
end $$;
