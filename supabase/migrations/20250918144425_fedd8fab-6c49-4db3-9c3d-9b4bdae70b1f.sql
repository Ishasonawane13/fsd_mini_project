-- Create hackathons table
CREATE TABLE public.hackathons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  organizer TEXT NOT NULL,
  location TEXT, -- 'online' or physical location
  team_size_min INTEGER DEFAULT 1,
  team_size_max INTEGER,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'ended')),
  registration_start TIMESTAMP WITH TIME ZONE,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  website_url TEXT,
  prize_pool TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hackathon rounds/milestones table
CREATE TABLE public.hackathon_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g., "PPT Submission", "Doc Submission", "Test"
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  round_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user calendar events table (for events added to calendar)
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('registration_deadline', 'hackathon_round', 'hackathon_event')),
  round_id UUID REFERENCES public.hackathon_rounds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_1day BOOLEAN DEFAULT true,
  reminder_12h BOOLEAN DEFAULT true,
  reminder_3h BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access since no auth)
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public read access for hackathons" 
ON public.hackathons FOR SELECT USING (true);

CREATE POLICY "Public insert access for hackathons" 
ON public.hackathons FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for hackathons" 
ON public.hackathons FOR UPDATE USING (true);

CREATE POLICY "Public read access for hackathon_rounds" 
ON public.hackathon_rounds FOR SELECT USING (true);

CREATE POLICY "Public insert access for hackathon_rounds" 
ON public.hackathon_rounds FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for calendar_events" 
ON public.calendar_events FOR SELECT USING (true);

CREATE POLICY "Public insert access for calendar_events" 
ON public.calendar_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for calendar_events" 
ON public.calendar_events FOR UPDATE USING (true);

CREATE POLICY "Public delete access for calendar_events" 
ON public.calendar_events FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_hackathons_updated_at
  BEFORE UPDATE ON public.hackathons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.hackathons (title, description, organizer, location, team_size_min, team_size_max, status, registration_deadline, start_date, end_date, website_url, prize_pool, tags) VALUES
('TechCrunch Disrupt Hackathon', 'Build the next big startup in 48 hours', 'TechCrunch', 'San Francisco, CA', 2, 4, 'upcoming', '2024-03-15 23:59:59+00', '2024-03-20 09:00:00+00', '2024-03-22 18:00:00+00', 'https://techcrunch.com/hackathon', '$50,000', ARRAY['startup', 'ai', 'fintech']),
('Global AI Challenge', 'Create AI solutions for social good', 'AI for Good Foundation', 'online', 1, 6, 'upcoming', '2024-03-10 23:59:59+00', '2024-03-25 10:00:00+00', '2024-03-27 20:00:00+00', 'https://aiforgood.org', '$25,000', ARRAY['ai', 'social-impact', 'ml']),
('Blockchain Innovation Hackathon', 'Build decentralized applications', 'CryptoVentures', 'New York, NY', 2, 5, 'upcoming', '2024-03-12 23:59:59+00', '2024-03-18 08:00:00+00', '2024-03-20 22:00:00+00', 'https://cryptoventures.com/hack', '$75,000', ARRAY['blockchain', 'web3', 'defi']);

-- Insert sample rounds for hackathons
INSERT INTO public.hackathon_rounds (hackathon_id, title, description, deadline, round_order) 
SELECT 
  h.id,
  'Team Registration',
  'Submit team details and project idea',
  h.registration_deadline,
  1
FROM public.hackathons h;

INSERT INTO public.hackathon_rounds (hackathon_id, title, description, deadline, round_order)
SELECT 
  h.id,
  'Project Submission',
  'Submit your final project and demo video',
  h.end_date - INTERVAL '4 hours',
  2
FROM public.hackathons h;

INSERT INTO public.hackathon_rounds (hackathon_id, title, description, deadline, round_order)
SELECT 
  h.id,
  'Final Presentation',
  'Present your project to judges',
  h.end_date,
  3
FROM public.hackathons h;