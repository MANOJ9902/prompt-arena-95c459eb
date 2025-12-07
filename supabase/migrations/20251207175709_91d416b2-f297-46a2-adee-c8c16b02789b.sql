-- Create competition status enum
CREATE TYPE public.competition_status AS ENUM ('upcoming', 'ongoing', 'completed');

-- Competitions table
CREATE TABLE public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status competition_status NOT NULL DEFAULT 'upcoming',
    time_limit_minutes INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Questions table
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Participants table
CREATE TABLE public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lan_id TEXT NOT NULL,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    submitted BOOLEAN NOT NULL DEFAULT false,
    prompt_file_url TEXT,
    output_file_url TEXT,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(lan_id, competition_id)
);

-- Leaderboard view for current competition scores
CREATE TABLE public.leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lan_id TEXT NOT NULL,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    overall_score INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(lan_id, competition_id)
);

-- Enable RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitions (public read)
CREATE POLICY "Anyone can view competitions" ON public.competitions
FOR SELECT USING (true);

-- RLS Policies for questions (public read)
CREATE POLICY "Anyone can view questions" ON public.questions
FOR SELECT USING (true);

-- RLS Policies for participants
CREATE POLICY "Anyone can view participants" ON public.participants
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert participants" ON public.participants
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update participants" ON public.participants
FOR UPDATE USING (true);

-- RLS Policies for leaderboard (public read/write for now)
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert leaderboard" ON public.leaderboard
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update leaderboard" ON public.leaderboard
FOR UPDATE USING (true);

-- Create storage bucket for submissions
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true);

-- Storage policies
CREATE POLICY "Anyone can upload submissions" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'submissions');

CREATE POLICY "Anyone can view submissions" ON storage.objects
FOR SELECT USING (bucket_id = 'submissions');

-- Insert sample competition (Hack-o-Prompt)
INSERT INTO public.competitions (name, description, start_date, end_date, status, time_limit_minutes)
VALUES (
    'Hack-o-Prompt',
    'Test your prompt engineering skills! Create the best prompts to solve AI challenges.',
    now(),
    now() + interval '7 days',
    'ongoing',
    15
);

-- Insert sample question for Hack-o-Prompt
INSERT INTO public.questions (competition_id, title, description, attachments)
SELECT 
    id,
    'AI Image Generation Challenge',
    'Create a prompt that generates a photorealistic image of a futuristic cityscape at sunset. Your prompt should be detailed, creative, and produce consistent results. You will upload your prompt and the generated output image.',
    '[{"name": "example_reference.pdf", "url": "https://example.com/reference.pdf"}, {"name": "scoring_rubric.pdf", "url": "https://example.com/rubric.pdf"}]'::jsonb
FROM public.competitions WHERE name = 'Hack-o-Prompt';

-- Insert past competition
INSERT INTO public.competitions (name, description, start_date, end_date, status, time_limit_minutes)
VALUES (
    'Code Sprint 2024',
    'Annual coding competition showcasing algorithmic problem-solving skills.',
    now() - interval '30 days',
    now() - interval '23 days',
    'completed',
    30
);

-- Insert upcoming competition
INSERT INTO public.competitions (name, description, start_date, end_date, status, time_limit_minutes)
VALUES (
    'AI Innovation Challenge',
    'Build innovative AI solutions for real-world problems.',
    now() + interval '14 days',
    now() + interval '21 days',
    'upcoming',
    45
);