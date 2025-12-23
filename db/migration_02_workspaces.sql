-- Create a workspaces table to persist subjects/topics even when empty
create table if not exists workspaces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- RLS Policies
alter table workspaces enable row level security;

create policy "Users can view their own workspaces" 
  on workspaces for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own workspaces" 
  on workspaces for insert 
  with check (auth.uid() = user_id);

create policy "Users can delete their own workspaces" 
  on workspaces for delete 
  using (auth.uid() = user_id);

-- Insert 'General' as a default workspace for everyone (optional, logic handles it)
-- but useful for consistency
