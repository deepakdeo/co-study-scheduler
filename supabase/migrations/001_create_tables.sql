-- Rooms table
create table rooms (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  host_name text not null,
  title text not null,
  description text,
  meeting_link text not null,
  host_timezone text default 'America/Chicago',
  morning_start int default 10,
  morning_end int default 15,
  evening_start int default 19,
  evening_end int default 23,
  slot_duration int default 120,
  slot_interval int default 30,
  admin_pin text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Bookings table
create table bookings (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade,
  name text not null,
  email text,
  note text,
  booking_date date not null,
  slot_start_utc timestamptz not null,
  slot_end_utc timestamptz not null,
  booker_timezone text,
  status text default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz default now()
);

-- Indexes
create index idx_bookings_room_date on bookings(room_id, booking_date);
create index idx_rooms_slug on rooms(slug);

-- Row Level Security
alter table rooms enable row level security;
alter table bookings enable row level security;

-- Public read access for rooms
create policy "Rooms are publicly readable"
  on rooms for select using (is_active = true);

-- Public read access for confirmed bookings
create policy "Confirmed bookings are publicly readable"
  on bookings for select using (status = 'confirmed');

-- Public insert for rooms (anyone can create)
create policy "Anyone can create a room"
  on rooms for insert with check (true);

-- Public insert for bookings (anyone can book)
create policy "Anyone can book a slot"
  on bookings for insert with check (true);

-- Public update for bookings (for cancellation — validated in app layer)
create policy "Bookings can be updated"
  on bookings for update using (true);
