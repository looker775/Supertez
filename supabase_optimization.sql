-- 1. Ensure the rides table has a robust city column and index for speed
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='rides' and column_name='city') then
    alter table public.rides add column city text;
  end if;
end $$;

create index if not exists idx_rides_city_status on public.rides(city, status);

-- 2. Expand ride_offers to include more driver details for the client
create table if not exists public.ride_offers (
  id uuid default gen_random_uuid() primary key,
  ride_id uuid references public.rides(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete cascade,
  driver_lat float not null,
  driver_lng float not null,
  driver_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(ride_id, driver_id)
);

-- 3. Update RLS for ride_offers - Allow clients to see who is bidding
drop policy if exists "Clients can see offers for their rides" on public.ride_offers;
create policy "Clients can see offers for their rides" on public.ride_offers
  for select using (
    exists (
      select 1 from public.rides 
      where rides.id = ride_offers.ride_id 
      and rides.client_id = auth.uid()
    )
  );

drop policy if exists "Drivers can manage their own offers" on public.ride_offers;
create policy "Drivers can manage their own offers" on public.ride_offers
  for all using (auth.uid() = driver_id);
