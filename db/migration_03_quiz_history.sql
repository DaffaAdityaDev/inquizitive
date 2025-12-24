-- TABLE: quiz_history (Recent Forges persistence)
create table quiz_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  
  topic text not null,
  tags text, -- simple comma separated string or null
  question_json jsonb not null, -- The raw array of questions
  
  created_at timestamp with time zone default now()
);

-- Index for faster retrieval by user
create index idx_quiz_history_user_created on quiz_history(user_id, created_at desc);

-- RLS
alter table quiz_history enable row level security;

create policy "Users can CRUD their own history"
  on quiz_history for all
  using (auth.uid() = user_id);
