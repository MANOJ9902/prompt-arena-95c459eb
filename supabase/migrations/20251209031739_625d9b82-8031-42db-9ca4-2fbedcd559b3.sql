-- Add text columns for prompt and output submissions, and marks
ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS prompt_text TEXT,
ADD COLUMN IF NOT EXISTS output_text TEXT;

-- Rename score to marks for clarity (if not already done)
-- Keep score column as it exists, marks will be alias through the app