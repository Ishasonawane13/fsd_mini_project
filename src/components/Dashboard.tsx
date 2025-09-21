import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HackathonCard } from './HackathonCard';
import { HackathonFilters } from './HackathonFilters';
import { CalendarView } from './CalendarView';
import { NotificationSystem } from './NotificationSystem';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Hackathon {
  id: string;
  title: string;
  description: string | null;
  organizer: string;
  location: string | null;
  team_size_min: number;
  team_size_max: number | null;
  status: string;
  registration_deadline: string;
  start_date: string;
  end_date: string;
  website_url?: string | null;
  prize_pool?: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  registration_start: string | null;
}

interface FilterState {
  search: string;
  status: string;
  location: string;
  teamSize: string;
  sortBy: string;
}

export const Dashboard = () => {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarRefresh, setCalendarRefresh] = useState(0);
  const [hackathonsInCalendar, setHackathonsInCalendar] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    location: 'all',
    teamSize: 'all',
    sortBy: 'start_date'
  });
  const { toast } = useToast();

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      let query = supabase.from('hackathons').select('*');

      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,organizer.ilike.%${filters.search}%`);
      }

      // Apply sorting
      const ascending = filters.sortBy !== 'created_at';
      query = query.order(filters.sortBy, { ascending });

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Apply location filter
      if (filters.location !== 'all') {
        if (filters.location === 'online') {
          filteredData = filteredData.filter(h => h.location?.toLowerCase().includes('online'));
        } else {
          filteredData = filteredData.filter(h => h.location && !h.location.toLowerCase().includes('online'));
        }
      }

      // Apply team size filter
      if (filters.teamSize !== 'all') {
        filteredData = filteredData.filter(h => {
          const maxSize = h.team_size_max || h.team_size_min;
          switch (filters.teamSize) {
            case '1':
              return h.team_size_min === 1 && maxSize === 1;
            case '2-4':
              return maxSize >= 2 && maxSize <= 4;
            case '5+':
              return maxSize >= 5;
            default:
              return true;
          }
        });
      }

      setHackathons(filteredData);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      toast({
        title: "Error",
        description: "Failed to load hackathons. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHackathonsInCalendar = async () => {
    try {
      const { data: calendarEvents } = await supabase
        .from('calendar_events')
        .select('hackathon_id');

      if (calendarEvents) {
        const hackathonIds = new Set(calendarEvents.map(event => event.hackathon_id));
        setHackathonsInCalendar(hackathonIds);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  useEffect(() => {
    fetchHackathons();
    fetchHackathonsInCalendar();
  }, [filters]);

  useEffect(() => {
    fetchHackathonsInCalendar();
  }, [calendarRefresh]);

  const handleToggleCalendar = async (hackathon: Hackathon) => {
    const isInCalendar = hackathonsInCalendar.has(hackathon.id);
    
    if (isInCalendar) {
      // Remove from calendar
      try {
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('hackathon_id', hackathon.id);

        if (error) throw error;

        toast({
          title: "Removed from Calendar",
          description: `${hackathon.title} has been removed from your calendar.`,
        });

        setCalendarRefresh(prev => prev + 1);
      } catch (error) {
        console.error('Error removing from calendar:', error);
        toast({
          title: "Error",
          description: "Failed to remove hackathon from calendar.",
          variant: "destructive",
        });
      }
    } else {
      // Add to calendar
      try {
        // Add main hackathon events
        const { error: mainEventsError } = await supabase.from('calendar_events').insert([
          {
            hackathon_id: hackathon.id,
            event_type: 'registration_deadline',
            title: `${hackathon.title} - Registration Deadline`,
            description: 'Last day to register for this hackathon',
            event_date: hackathon.registration_deadline,
          },
          {
            hackathon_id: hackathon.id,
            event_type: 'hackathon_event',
            title: `${hackathon.title} - Starts`,
            description: 'Hackathon begins',
            event_date: hackathon.start_date,
          },
          {
            hackathon_id: hackathon.id,
            event_type: 'hackathon_event',
            title: `${hackathon.title} - Ends`,
            description: 'Hackathon ends',
            event_date: hackathon.end_date,
          }
        ]);

        if (mainEventsError) throw mainEventsError;

        // Also add any rounds
        const { data: rounds, error: roundsError } = await supabase
          .from('hackathon_rounds')
          .select('*')
          .eq('hackathon_id', hackathon.id)
          .order('round_order');

        if (roundsError) throw roundsError;

        if (rounds && rounds.length > 0) {
          const roundEvents = rounds.map(round => ({
            hackathon_id: hackathon.id,
            event_type: 'hackathon_round',
            round_id: round.id,
            title: `${hackathon.title} - ${round.title}`,
            description: round.description,
            event_date: round.deadline,
          }));

          const { error: roundEventsError } = await supabase.from('calendar_events').insert(roundEvents);
          if (roundEventsError) throw roundEventsError;
        }

        toast({
          title: "Added to Calendar",
          description: `${hackathon.title} has been added to your calendar.`,
        });

        setCalendarRefresh(prev => prev + 1);
      } catch (error) {
        console.error('Error adding to calendar:', error);
        toast({
          title: "Error",
          description: "Failed to add hackathon to calendar.",
          variant: "destructive",
        });
      }
    }
  };

  const handleScrapeUnstop = async () => {
    try {
      setLoading(true);
      toast({
        title: "Scraping Started",
        description: "Fetching latest hackathons from Unstop...",
      });

      const { data, error } = await supabase.functions.invoke('scrape-unstop');
      
      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success!",
          description: `Scraped ${data.hackathons} hackathons from Unstop`,
        });
        // Refresh the hackathons list
        await fetchHackathons();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error scraping Unstop:', error);
      toast({
        title: "Error",
        description: "Failed to scrape hackathons from Unstop",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NotificationSystem />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">HackPlanner</h1>
              <p className="text-xl text-muted-foreground">
                Track hackathons and competitions with an advanced calendar system
              </p>
            </div>
            <Button onClick={handleScrapeUnstop} disabled={loading} variant="outline">
              {loading ? "Scraping..." : "Refresh from Unstop"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <HackathonFilters filters={filters} onFiltersChange={setFilters} />
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hackathons.map((hackathon) => (
                  <HackathonCard
                    key={hackathon.id}
                    hackathon={hackathon}
                    onToggleCalendar={handleToggleCalendar}
                    isInCalendar={hackathonsInCalendar.has(hackathon.id)}
                  />
                ))}
              </div>
            )}

            {!loading && hackathons.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No hackathons found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView refreshTrigger={calendarRefresh} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};