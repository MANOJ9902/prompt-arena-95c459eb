-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update competitions table policies - Admin only for modifications
DROP POLICY IF EXISTS "Anyone can insert competitions" ON public.competitions;
DROP POLICY IF EXISTS "Anyone can update competitions" ON public.competitions;

CREATE POLICY "Admins can insert competitions"
ON public.competitions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update competitions"
ON public.competitions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete competitions"
ON public.competitions FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update questions table policies - Admin only for modifications
DROP POLICY IF EXISTS "Anyone can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Anyone can update questions" ON public.questions;

CREATE POLICY "Admins can insert questions"
ON public.questions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update questions"
ON public.questions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions"
ON public.questions FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update participants table policies - Admin can manage all
DROP POLICY IF EXISTS "Anyone can insert participants" ON public.participants;
DROP POLICY IF EXISTS "Anyone can update participants" ON public.participants;

CREATE POLICY "Anyone can insert participants"
ON public.participants FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update own participant"
ON public.participants FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete participants"
ON public.participants FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update leaderboard policies
DROP POLICY IF EXISTS "Anyone can insert leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Anyone can update leaderboard" ON public.leaderboard;

CREATE POLICY "Anyone can insert leaderboard"
ON public.leaderboard FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update leaderboard"
ON public.leaderboard FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete leaderboard"
ON public.leaderboard FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;