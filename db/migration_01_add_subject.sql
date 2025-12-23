-- Run this in your Supabase SQL Editor to enable Workspaces

-- 1. Add the subject column
ALTER TABLE review_items 
ADD COLUMN subject text DEFAULT 'General';

-- 2. Index it for faster filtering
CREATE INDEX idx_review_items_subject ON review_items(subject);
