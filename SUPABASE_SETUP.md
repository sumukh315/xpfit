# Supabase Setup for XPFit

## 1. Create a Supabase project at supabase.com

## 2. Create a `.env` file from `.env.example` and fill in your URL and anon key

## 3. Run this SQL in the Supabase SQL editor:

```sql
-- Profiles table
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  character jsonb default '{}',
  equipped jsonb default '{}',
  total_xp integer default 0,
  points integer default 100,
  level integer default 1,
  inventory jsonb default '[]',
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Workouts table
create table workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  exercises jsonb default '[]',
  notes text,
  photo_url text,
  xp_earned integer default 0,
  points_earned integer default 0,
  created_at timestamptz default now()
);

alter table workouts enable row level security;
create policy "Users can view all workouts" on workouts for select using (true);
create policy "Users can insert own workouts" on workouts for insert with check (auth.uid() = user_id);
create policy "Users can update own workouts" on workouts for update using (auth.uid() = user_id);

-- Friendships table
create table friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  friend_id uuid references profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

alter table friendships enable row level security;
create policy "Users can view own friendships" on friendships for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users can insert friendships" on friendships for insert with check (auth.uid() = user_id);
create policy "Users can update friendships" on friendships for update using (auth.uid() = friend_id);

-- Storage bucket for workout photos
insert into storage.buckets (id, name, public) values ('workout-photos', 'workout-photos', true);
create policy "Anyone can view workout photos" on storage.objects for select using (bucket_id = 'workout-photos');
create policy "Authenticated users can upload photos" on storage.objects for insert with check (bucket_id = 'workout-photos' and auth.role() = 'authenticated');
```

## 4. Run `npm run dev` to start the development server
