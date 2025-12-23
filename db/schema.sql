-- THE NEURO-STACK ARCHITECTURE SCHEMA

-- 1. Enable RLS (Row Level Security) is best practice, though not explicitly in the prompt, 
-- we will assume standard Supabase setup. 

-- TABLE 1: REVIEW_ITEMS (The Vault)
create table review_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  
  -- Content
  subject text default 'General', -- High-level workspace (e.g. "Golang", "Japanese")
  topic text not null,
  question_json jsonb not null, -- {q, options, answer, explanation}
  
  -- SRS Metrics
  srs_level int default 0,      -- 0=New, 1=Hard, 2=Medium, 3=Easy, 4=Mastered
  ease_factor float default 2.5,
  interval_days int default 0,
  
  -- Timing
  last_reviewed_at timestamp with time zone,
  next_review_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  
  -- Tags (added based on "Missing Critical Features" section)
  tags text[] default array[]::text[]
);

-- Index for tags
CREATE INDEX idx_review_items_tags ON review_items USING GIN(tags);

-- TABLE 2: LEARNING_STATS (Gamification)
create table learning_stats (
  user_id uuid references auth.users primary key,
  total_xp int default 0,
  current_streak int default 0,
  last_activity_date date default current_date,
  items_mastered int default 0
);

-- RLS POLICIES (Safety First)
alter table review_items enable row level security;
alter table learning_stats enable row level security;

create policy "Users can CRUD their own review items"
  on review_items for all
  using (auth.uid() = user_id);

create policy "Users can CRUD their own stats"
  on learning_stats for all
  using (auth.uid() = user_id);
