-- Allow inserting competitions
CREATE POLICY "Anyone can insert competitions" 
ON public.competitions 
FOR INSERT 
WITH CHECK (true);

-- Allow updating competitions
CREATE POLICY "Anyone can update competitions" 
ON public.competitions 
FOR UPDATE 
USING (true);

-- Allow inserting questions
CREATE POLICY "Anyone can insert questions" 
ON public.questions 
FOR INSERT 
WITH CHECK (true);

-- Allow updating questions
CREATE POLICY "Anyone can update questions" 
ON public.questions 
FOR UPDATE 
USING (true);