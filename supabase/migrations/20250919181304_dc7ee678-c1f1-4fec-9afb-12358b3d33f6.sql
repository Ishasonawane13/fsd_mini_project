-- Insert more hackathons for September and October 2025
INSERT INTO public.hackathons (title, description, organizer, location, team_size_min, team_size_max, status, registration_deadline, start_date, end_date, website_url, prize_pool, tags) VALUES
('AI Innovation Challenge 2025', 'Build the next generation of AI-powered applications using cutting-edge machine learning and LLMs. Focus on practical solutions for real-world problems.', 'TechCorp Labs', 'San Francisco, CA', 2, 5, 'upcoming', '2025-09-10 23:59:59+00', '2025-09-15 09:00:00+00', '2025-09-17 18:00:00+00', 'https://aiinnovation2025.com', '$50,000 total prizes', ARRAY['AI', 'Machine Learning', 'LLM', 'Innovation']),

('Climate Tech Hackathon', 'Develop innovative solutions to combat climate change and promote sustainability. Categories include clean energy, carbon capture, and green technology.', 'Green Future Foundation', 'Online', 1, 4, 'upcoming', '2025-09-20 23:59:59+00', '2025-09-25 08:00:00+00', '2025-09-27 20:00:00+00', 'https://climatetech2025.org', '$75,000 in prizes', ARRAY['Climate', 'Sustainability', 'Clean Energy', 'Environmental']),

('FinTech Revolution 2025', 'Revolutionary financial technology solutions. Build apps for digital banking, cryptocurrency, DeFi, or financial inclusion.', 'FinTech Alliance', 'New York, NY', 2, 6, 'upcoming', '2025-10-01 23:59:59+00', '2025-10-05 10:00:00+00', '2025-10-07 16:00:00+00', 'https://fintechrev2025.com', '$100,000 grand prize', ARRAY['FinTech', 'Blockchain', 'DeFi', 'Banking']),

('Healthcare Innovation Summit', 'Transform healthcare with technology. Focus on telemedicine, health monitoring, medical AI, and patient care solutions.', 'MedTech Innovators', 'Boston, MA', 1, 5, 'upcoming', '2025-10-08 23:59:59+00', '2025-10-12 09:00:00+00', '2025-10-14 17:00:00+00', 'https://healthtech2025.med', '$60,000 in funding', ARRAY['Healthcare', 'MedTech', 'AI', 'Telemedicine']),

('Cybersecurity Defense Challenge', 'Build the next generation of cybersecurity tools and defense systems. Categories include threat detection, encryption, and security automation.', 'CyberSafe Alliance', 'Austin, TX', 2, 4, 'upcoming', '2025-10-15 23:59:59+00', '2025-10-20 08:00:00+00', '2025-10-22 18:00:00+00', 'https://cybersec2025.net', '$80,000 prize pool', ARRAY['Cybersecurity', 'Encryption', 'Security', 'Defense']),

('Mobile App Innovation Fest', 'Create the next viral mobile application. Focus on user experience, innovative features, and cross-platform development.', 'Mobile Dev Community', 'Online', 1, 3, 'upcoming', '2025-10-22 23:59:59+00', '2025-10-25 09:00:00+00', '2025-10-27 19:00:00+00', 'https://mobileappfest2025.com', '$40,000 in prizes', ARRAY['Mobile', 'iOS', 'Android', 'UX/UI']),

('Space Tech Hackathon 2025', 'Develop technology for space exploration and satellite applications. Work on navigation, communication, or Mars mission solutions.', 'Aerospace Innovation Lab', 'Los Angeles, CA', 2, 5, 'upcoming', '2025-10-28 23:59:59+00', '2025-11-02 10:00:00+00', '2025-11-04 16:00:00+00', 'https://spacetech2025.space', '$90,000 NASA prize', ARRAY['Space', 'Aerospace', 'Satellites', 'Innovation']),

('Social Impact Challenge', 'Technology for good. Build solutions that address social issues like education, poverty, accessibility, or community building.', 'Impact Tech Foundation', 'Chicago, IL', 1, 6, 'upcoming', '2025-09-12 23:59:59+00', '2025-09-18 09:00:00+00', '2025-09-20 17:00:00+00', 'https://socialimpact2025.org', '$35,000 + mentorship', ARRAY['Social Impact', 'Education', 'Accessibility', 'Community']),

('Gaming & VR Experience Jam', 'Create immersive gaming experiences using VR, AR, or traditional gaming platforms. Focus on innovative gameplay and user engagement.', 'GameDev Studios', 'Seattle, WA', 1, 4, 'upcoming', '2025-09-28 23:59:59+00', '2025-10-03 08:00:00+00', '2025-10-05 20:00:00+00', 'https://gamingjam2025.game', '$45,000 in prizes', ARRAY['Gaming', 'VR', 'AR', 'Game Development']);

-- Add some hackathon rounds for the new hackathons
INSERT INTO public.hackathon_rounds (hackathon_id, title, description, deadline, round_order) 
SELECT h.id, 'Team Registration', 'Register your team and submit initial project concept', h.registration_deadline, 1
FROM public.hackathons h 
WHERE h.title IN ('AI Innovation Challenge 2025', 'Climate Tech Hackathon', 'FinTech Revolution 2025');

INSERT INTO public.hackathon_rounds (hackathon_id, title, description, deadline, round_order) 
SELECT h.id, 'Prototype Submission', 'Submit working prototype and demo video', h.start_date + INTERVAL '1 day', 2
FROM public.hackathons h 
WHERE h.title IN ('AI Innovation Challenge 2025', 'Climate Tech Hackathon', 'FinTech Revolution 2025');

INSERT INTO public.hackathon_rounds (hackathon_id, title, description, deadline, round_order) 
SELECT h.id, 'Final Presentation', 'Present your final solution to judges', h.end_date, 3
FROM public.hackathons h 
WHERE h.title IN ('AI Innovation Challenge 2025', 'Climate Tech Hackathon', 'FinTech Revolution 2025');