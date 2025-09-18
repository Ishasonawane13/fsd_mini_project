import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  useEffect(() => {
    fetchHackathons();
  }, [filters]);

  const handleAddToCalendar = async (hackathon: Hackathon) => {
    try {
      // Add registration deadline event
      await supabase.from('calendar_events').insert([
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

      // Also add any rounds
      const { data: rounds } = await supabase
        .from('hackathon_rounds')
        .select('*')
        .eq('hackathon_id', hackathon.id)
        .order('round_order');

      if (rounds && rounds.length > 0) {
        const roundEvents = rounds.map(round => ({
          hackathon_id: hackathon.id,
          event_type: 'hackathon_round',
          round_id: round.id,
          title: `${hackathon.title} - ${round.title}`,
          description: round.description,
          event_date: round.deadline,
        }));

        await supabase.from('calendar_events').insert(roundEvents);
      }

      setCalendarRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast({
        title: "Error",
        description: "Failed to add hackathon to calendar.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NotificationSystem />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">HackPlanner</h1>
          <p className="text-xl text-muted-foreground">
            Track hackathons and competitions with an advanced calendar system
          </p>
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
                    onAddToCalendar={handleAddToCalendar}
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