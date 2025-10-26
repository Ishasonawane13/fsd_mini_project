import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HackathonCard } from './HackathonCard';
import { HackathonFilters } from './HackathonFilters';
import { CalendarView } from './CalendarView';
import { NotificationSystem } from './NotificationSystem';
import { hackathonsApi, calendarApi, type Hackathon as ApiHackathon } from '@/services/api';
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

// Helper function to convert mixed API response (database + scraped) to component interface
const convertMixedHackathon = (hackathon: any): Hackathon => {
  // Handle database format
  if (hackathon._id && hackathon.startDate) {
    return convertApiHackathon(hackathon as ApiHackathon);
  }

  // Handle scraped format
  return {
    id: hackathon._id || hackathon.id,
    title: hackathon.title,
    description: hackathon.description,
    organizer: hackathon.organizer?.name || hackathon.organizer || 'Unstop',
    location: typeof hackathon.location === 'object'
      ? hackathon.location.address || hackathon.location.venue || hackathon.location.type
      : hackathon.location || 'Online',
    team_size_min: hackathon.teamSize?.min || 1,
    team_size_max: hackathon.teamSize?.max || 4,
    status: hackathon.status,
    registration_deadline: hackathon.registrationDeadline || hackathon.deadline,
    start_date: hackathon.startDate || hackathon.start_date,
    end_date: hackathon.endDate || hackathon.end_date,
    website_url: hackathon.links?.website || hackathon.url || null,
    prize_pool: hackathon.prize || null,
    tags: hackathon.tags || [hackathon.category || 'Technology'],
    created_at: hackathon.createdAt || hackathon.created_at,
    updated_at: hackathon.updatedAt || hackathon.updated_at,
    registration_start: null,
  };
};

interface FilterState {
  search: string;
  status: string;
  location: string;
  teamSize: string;
  sortBy: string;
}

// Global cache to prevent redundant API calls
let globalCache: { [key: string]: { data: any[], timestamp: number } } = {};
let activeRequests: { [key: string]: Promise<any> } = {};

// Rate limiting constants
const CACHE_DURATION = 60000; // 1 minute cache
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests

export const Dashboard = () => {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [allHackathons, setAllHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarRefresh, setCalendarRefresh] = useState(0);
  const [hackathonsInCalendar, setHackathonsInCalendar] = useState<Set<string>>(new Set());
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [activeTab, setActiveTab] = useState('all-sources');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    location: 'all',
    teamSize: 'all',
    sortBy: 'start_date'
  });
  const { toast } = useToast();
  const { user, isAuthenticated, logout } = useAuth();

  // Memoized filter function for better performance
  const applyFilters = useMemo(() => {
    return (hackathonsToFilter: Hackathon[]) => {
      let filteredHackathons = [...hackathonsToFilter];

      // Apply search filter
      if (filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim();
        filteredHackathons = filteredHackathons.filter((h) =>
          h.title.toLowerCase().includes(searchTerm) ||
          h.description?.toLowerCase().includes(searchTerm) ||
          h.organizer.toLowerCase().includes(searchTerm) ||
          h.location.toLowerCase().includes(searchTerm) ||
          h.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply status filter
      if (filters.status !== 'all') {
        filteredHackathons = filteredHackathons.filter((h) => {
          // Handle different status formats
          const status = h.status.toLowerCase();
          const filterStatus = filters.status.toLowerCase();

          // Map common status variations
          if (filterStatus === 'upcoming') {
            return status === 'upcoming' || status === 'open' || status === 'registration_open';
          } else if (filterStatus === 'ongoing') {
            return status === 'ongoing' || status === 'live' || status === 'active';
          } else if (filterStatus === 'ended') {
            return status === 'ended' || status === 'completed' || status === 'closed' || status === 'finished';
          }

          return status === filterStatus;
        });
      }

      // Apply location filter
      if (filters.location !== 'all') {
        filteredHackathons = filteredHackathons.filter((h) => {
          const location = h.location.toLowerCase();
          if (filters.location === 'online') {
            return location.includes('online') || location.includes('virtual') || location.includes('remote');
          } else if (filters.location === 'offline') {
            return !location.includes('online') && !location.includes('virtual') && !location.includes('remote');
          }
          return location.includes(filters.location.toLowerCase());
        });
      }

      // Apply team size filter
      if (filters.teamSize !== 'all') {
        filteredHackathons = filteredHackathons.filter((h) => {
          const minSize = h.team_size_min || 1;
          const maxSize = h.team_size_max || 4;

          switch (filters.teamSize) {
            case '1':
              return minSize <= 1 && maxSize >= 1;
            case '2-4':
              return minSize <= 4 && maxSize >= 2;
            case '5+':
              return maxSize >= 5;
            default:
              return true;
          }
        });
      }

      // Apply sorting
      filteredHackathons.sort((a, b) => {
        switch (filters.sortBy) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'registration_deadline':
            return new Date(a.registration_deadline).getTime() - new Date(b.registration_deadline).getTime();
          case 'created_at':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'start_date':
          default:
            return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        }
      });

      return filteredHackathons;
    };
  }, [filters]);

  const fetchHackathons = async (source: 'all' | 'database' = 'all', forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = `${source}-base`; // Use base cache key without filters

    // Check if we have cached data and it's still fresh
    const cachedData = globalCache[cacheKey];
    if (cachedData && !forceRefresh && (now - cachedData.timestamp) < CACHE_DURATION) {
      console.log(`Using cached data for ${cacheKey}`);
      setAllHackathons(cachedData.data);
      const filtered = applyFilters(cachedData.data);
      setHackathons(filtered);
      setLoading(false);
      return;
    }

    // Check if there's already a request in progress
    if (activeRequests[cacheKey]) {
      console.log(`Request already in progress for ${cacheKey}`);
      return activeRequests[cacheKey];
    }

    // Rate limiting check
    const timeSinceLastRequest = now - lastRequestTime;
    if (!forceRefresh && timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      console.log(`Rate limited: ${MIN_REQUEST_INTERVAL - timeSinceLastRequest}ms remaining`);
      toast({
        title: "Please Wait",
        description: `Please wait ${Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000)} seconds before refreshing.`,
        variant: "default",
      });
      return;
    }

    const fetchPromise = (async () => {
      try {
        setLoading(true);
        setLastRequestTime(now);

        let response: any;
        let hackathons: any[] = [];

        if (source === 'database') {
          response = await hackathonsApi.getAll();
          hackathons = response?.data?.hackathons || [];
          hackathons = hackathons.map(convertApiHackathon);
        } else {
          response = await hackathonsApi.getAllSources();
          hackathons = response?.data?.hackathons || [];
          hackathons = hackathons.map(convertMixedHackathon);
        }

        // Cache the raw results (without filters)
        globalCache[cacheKey] = {
          data: hackathons,
          timestamp: now
        };

        setAllHackathons(hackathons);
        const filtered = applyFilters(hackathons);
        setHackathons(filtered);

      } catch (error: any) {
        console.error('Error fetching hackathons:', error);

        if (error.message?.includes('429') || error.message?.includes('Too Many Requests') ||
          error.response?.status === 429) {
          toast({
            title: "Rate Limited",
            description: "Too many requests. Please wait before trying again.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Error",
          description: "Failed to load hackathons. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        delete activeRequests[cacheKey];
      }
    })();

    activeRequests[cacheKey] = fetchPromise;
    return fetchPromise;
  };  // Function to get hackathons for display (filtering is now handled in useEffect)
  const getFilteredHackathons = () => {
    return hackathons;
  };

  const fetchHackathonsInCalendar = async () => {
    try {
      const response = await calendarApi.getCalendarHackathons();
      if (response.success) {
        setHackathonsInCalendar(new Set(response.data.hackathonIds));
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      // Fallback to empty set if API fails
      setHackathonsInCalendar(new Set());
    }
  };

  // Handle filter changes - apply filters to existing data
  useEffect(() => {
    if (activeTab === 'my-rounds') {
      // For My Rounds, filter calendar hackathons and apply filters
      const calendarHackathons = allHackathons.filter(h => hackathonsInCalendar.has(h.id));
      const filtered = applyFilters(calendarHackathons);
      setHackathons(filtered);
    } else if (activeTab === 'all-sources') {
      // Apply filters to all hackathons
      const filtered = applyFilters(allHackathons);
      setHackathons(filtered);
    }
  }, [filters.search, filters.status, filters.location, filters.sortBy, filters.teamSize, activeTab, allHackathons, hackathonsInCalendar]);

  // Initial load only - just once when component mounts
  useEffect(() => {
    fetchHackathons('all');
    fetchHackathonsInCalendar();
  }, []); // Empty dependency array - only run once on mount

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Clear filters with Escape key
      if (e.key === 'Escape') {
        const hasActiveFilters = filters.search || filters.status !== 'all' ||
          filters.location !== 'all' || filters.teamSize !== 'all';
        if (hasActiveFilters) {
          e.preventDefault();
          setFilters({
            search: '',
            status: 'all',
            location: 'all',
            teamSize: 'all',
            sortBy: 'start_date'
          });
          toast({
            title: "Filters Cleared",
            description: "All filters have been reset.",
          });
        }
      }

      // Focus search with Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filters, setFilters, toast]);

  const handleToggleCalendar = async (hackathon: Hackathon) => {
    const isInCalendar = hackathonsInCalendar.has(hackathon.id);

    if (isInCalendar) {
      // Remove from calendar
      try {
        console.log('Removing hackathon from calendar:', hackathon.id, hackathon.title);
        const response = await calendarApi.removeFromCalendar(hackathon.id);

        if (response.success) {
          toast({
            title: "Removed from Calendar",
            description: `${hackathon.title} has been removed from your calendar.`,
          });

          // Update local state
          const updatedCalendar = new Set(hackathonsInCalendar);
          updatedCalendar.delete(hackathon.id);
          setHackathonsInCalendar(updatedCalendar);

          // Trigger calendar refresh
          setCalendarRefresh(prev => prev + 1);
        } else {
          throw new Error(response.message || 'Unknown error');
        }
      } catch (error: any) {
        console.error('Error removing from calendar:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to remove hackathon from calendar.",
          variant: "destructive",
        });
      }
    } else {
      // Add to calendar
      try {
        console.log('Adding hackathon to calendar:', hackathon.id, hackathon.title);
        const response = await calendarApi.addToCalendar(hackathon.id);

        if (response.success) {
          toast({
            title: "Added to Calendar",
            description: `${hackathon.title} has been added to your calendar.`,
          });

          // Update local state
          const updatedCalendar = new Set(hackathonsInCalendar);
          updatedCalendar.add(hackathon.id);
          setHackathonsInCalendar(updatedCalendar);

          // Trigger calendar refresh
          setCalendarRefresh(prev => prev + 1);
        } else {
          throw new Error(response.message || 'Unknown error');
        }
      } catch (error: any) {
        console.error('Error adding to calendar:', error);

        // Handle duplicate case gracefully
        if (error.message?.includes('already in calendar') || error.message?.includes('409')) {
          toast({
            title: "Already Added",
            description: `${hackathon.title} is already in your calendar.`,
          });
          // Update local state to reflect server state
          const updatedCalendar = new Set(hackathonsInCalendar);
          updatedCalendar.add(hackathon.id);
          setHackathonsInCalendar(updatedCalendar);
          setCalendarRefresh(prev => prev + 1);
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to add hackathon to calendar.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleRemove = async (hackathon: Hackathon) => {
    try {
      // Call the trash API endpoint
      await hackathonsApi.moveToTrash(hackathon.id);

      // Remove from local state
      setHackathons(prevHackathons =>
        prevHackathons.filter(h => h.id !== hackathon.id)
      );

      // Refresh the data only if necessary
      if (activeTab === 'all-sources') {
        await fetchHackathons('all', true); // Force refresh for remove action
      }

    } catch (error) {
      console.error('Error removing hackathon:', error);
      throw error; // Re-throw to let HackathonCard handle the toast
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
            <div className="flex items-center gap-4">
              <Button onClick={handleScrapeUnstop} disabled={loading} variant="outline">
                {loading ? "Scraping..." : "Refresh from Unstop"}
              </Button>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      Welcome, {user?.firstName || user?.username || 'User'}!
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        logout();
                        toast({
                          title: "Logged Out",
                          description: "You have been successfully logged out.",
                        });
                      }}
                    >
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="all-sources">All Sources</TabsTrigger>
            <TabsTrigger value="my-rounds">My Rounds</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="all-sources" className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <HackathonFilters filters={filters} onFiltersChange={setFilters} />
                <Button onClick={() => fetchHackathons('all', true)} disabled={loading} variant="outline" size="sm">
                  {loading ? "Loading..." : "Refresh All"}
                </Button>
              </div>

              {!loading && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>
                    Showing {getFilteredHackathons().length} of {allHackathons.length} hackathons
                    {getFilteredHackathons().length !== allHackathons.length && " (filtered)"}
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredHackathons().map((hackathon) => (
                  <HackathonCard
                    key={hackathon.id}
                    hackathon={hackathon}
                    onToggleCalendar={handleToggleCalendar}
                    isInCalendar={hackathonsInCalendar.has(hackathon.id)}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}

            {!loading && getFilteredHackathons().length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No hackathons found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-rounds" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">My Rounds</h2>
                <p className="text-sm text-muted-foreground">Hackathons you've added to your calendar</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <HackathonFilters filters={filters} onFiltersChange={setFilters} />

              {!loading && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>
                    Showing {getFilteredHackathons().length} of {allHackathons.filter(h => hackathonsInCalendar.has(h.id)).length} hackathons in your calendar
                    {getFilteredHackathons().length !== allHackathons.filter(h => hackathonsInCalendar.has(h.id)).length && " (filtered)"}
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredHackathons().map((hackathon) => (
                  <HackathonCard
                    key={hackathon.id}
                    hackathon={hackathon}
                    onToggleCalendar={handleToggleCalendar}
                    isInCalendar={hackathonsInCalendar.has(hackathon.id)}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}

            {!loading && getFilteredHackathons().length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No hackathons in your rounds yet</h3>
                <p className="text-muted-foreground">
                  Add hackathons to your calendar to see them here. Click "Add to Calendar" on any hackathon card!
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