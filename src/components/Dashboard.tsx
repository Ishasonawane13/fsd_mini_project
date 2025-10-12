import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HackathonCard } from './HackathonCard';
import { HackathonFilters } from './HackathonFilters';
import { CalendarView } from './CalendarView';
import { NotificationSystem } from './NotificationSystem';
import { hackathonsApi, type Hackathon as ApiHackathon } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
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

// Helper function to convert API response to component interface
const convertApiHackathon = (apiHackathon: ApiHackathon): Hackathon => ({
  id: apiHackathon._id,
  title: apiHackathon.title,
  description: apiHackathon.description,
  organizer: apiHackathon.organizer,
  location: typeof apiHackathon.location === 'object'
    ? `${apiHackathon.location.venue || apiHackathon.location.type}`
    : apiHackathon.location || 'TBD',
  team_size_min: apiHackathon.teamSize.min,
  team_size_max: apiHackathon.teamSize.max,
  status: apiHackathon.status,
  registration_deadline: apiHackathon.registrationDeadline,
  start_date: apiHackathon.startDate,
  end_date: apiHackathon.endDate,
  website_url: apiHackathon.links?.website || null,
  prize_pool: apiHackathon.prizes?.[0]?.amount ? `₹${apiHackathon.prizes[0].amount.toLocaleString()}` : null,
  tags: apiHackathon.tags,
  created_at: apiHackathon.createdAt,
  updated_at: apiHackathon.updatedAt,
  registration_start: null,
});

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
  const { isAuthenticated } = useAuth();

  const fetchHackathons = async () => {
    try {
      setLoading(true);

      // Prepare API parameters based on filters
      const apiParams: any = {};

      if (filters.search) apiParams.search = filters.search;
      if (filters.status !== 'all') apiParams.status = filters.status;
      if (filters.location !== 'all') apiParams.location = filters.location;
      if (filters.sortBy) apiParams.sortBy = filters.sortBy;

      // Call our MongoDB backend
      const response = await hackathonsApi.getAll(apiParams);

      // Convert API response to component format
      const hackathons = response?.data?.hackathons || [];
      const convertedHackathons = hackathons.map(convertApiHackathon);

      // Apply frontend filters that aren't handled by the API
      let filteredHackathons = convertedHackathons;

      if (filters.teamSize !== 'all') {
        filteredHackathons = filteredHackathons.filter(h => {
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

      setHackathons(filteredHackathons);
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
      // TODO: Implement calendar events with MongoDB backend
      // For now, just set empty calendar
      setHackathonsInCalendar(new Set());
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
        // TODO: Implement calendar removal with MongoDB backend

        toast({
          title: "Removed from Calendar",
          description: `${hackathon.title} has been removed from your calendar.`,
        });

        // Update local state
        const updatedCalendar = new Set(hackathonsInCalendar);
        updatedCalendar.delete(hackathon.id);
        setHackathonsInCalendar(updatedCalendar);
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
        // TODO: Implement calendar addition with MongoDB backend

        toast({
          title: "Added to Calendar",
          description: `${hackathon.title} has been added to your calendar.`,
        });

        // Update local state
        const updatedCalendar = new Set(hackathonsInCalendar);
        updatedCalendar.add(hackathon.id);
        setHackathonsInCalendar(updatedCalendar);
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
        title: "Refreshing Data",
        description: "Fetching latest hackathons from database...",
      });

      // Fetch fresh data from our MongoDB backend
      await fetchHackathons();
      setCalendarRefresh(prev => prev + 1);

      toast({
        title: "Success",
        description: "Hackathons refreshed successfully!",
      });

    } catch (error) {
      console.error('Error refreshing hackathons:', error);
      toast({
        title: "Error",
        description: "Failed to refresh hackathons. Please try again.",
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