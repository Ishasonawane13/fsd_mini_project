import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Trophy, ExternalLink, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    hackathon_id: string;
    event_type: string;
    description?: string;
    hackathon?: any;
  };
}

interface CalendarViewProps {
  refreshTrigger: number;
}

export const CalendarView = ({ refreshTrigger }: CalendarViewProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchCalendarEvents = async () => {
    try {
      const { data: calendarEvents, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          hackathons (
            id,
            title,
            description,
            organizer,
            location,
            prize_pool,
            website_url,
            tags
          )
        `)
        .order('event_date', { ascending: true });

      if (error) throw error;

      const formattedEvents: CalendarEvent[] = calendarEvents?.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.event_date),
        end: new Date(new Date(event.event_date).getTime() + 60 * 60 * 1000), // 1 hour duration
        resource: {
          hackathon_id: event.hackathon_id,
          event_type: event.event_type,
          description: event.description,
          hackathon: event.hackathons
        }
      })) || [];

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar events.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, [refreshTrigger]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Event Removed",
        description: "Event has been removed from your calendar.",
      });

      setIsModalOpen(false);
      fetchCalendarEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to remove event from calendar.",
        variant: "destructive",
      });
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    
    switch (event.resource.event_type) {
      case 'registration_deadline':
        backgroundColor = '#f59e0b';
        break;
      case 'hackathon_round':
        backgroundColor = '#10b981';
        break;
      case 'hackathon_event':
        backgroundColor = '#6366f1';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="h-[600px]">
      <style>{`
        .rbc-calendar {
          color: hsl(var(--foreground));
          background: hsl(var(--background));
        }
        .rbc-header {
          color: hsl(var(--foreground));
          background: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
        }
        .rbc-month-view, .rbc-time-view {
          border: 1px solid hsl(var(--border));
        }
        .rbc-day-bg {
          background: hsl(var(--background));
        }
        .rbc-day-bg:hover {
          background: hsl(var(--muted));
        }
        .rbc-today {
          background: hsl(var(--accent));
        }
        .rbc-off-range-bg {
          background: hsl(var(--muted));
        }
        .rbc-toolbar {
          color: hsl(var(--foreground));
          margin-bottom: 10px;
        }
        .rbc-toolbar button {
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 5px 10px;
          margin-right: 5px;
        }
        .rbc-toolbar button:hover {
          background: hsl(var(--muted));
        }
        .rbc-toolbar button.rbc-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
      `}</style>
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleEventClick}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day']}
        defaultView="month"
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {format(selectedEvent.start, 'PPP p')}
                </p>
                
                {selectedEvent.resource.description && (
                  <p className="text-sm mb-3">{selectedEvent.resource.description}</p>
                )}

                <Badge variant="secondary" className="text-xs">
                  {selectedEvent.resource.event_type.replace('_', ' ')}
                </Badge>
              </div>

              {selectedEvent.resource.hackathon && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Hackathon Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{selectedEvent.resource.hackathon.location}</span>
                    </div>
                    
                    {selectedEvent.resource.hackathon.prize_pool && (
                      <div className="flex items-center">
                        <Trophy className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span>{selectedEvent.resource.hackathon.prize_pool}</span>
                      </div>
                    )}

                    <p className="text-muted-foreground">
                      by {selectedEvent.resource.hackathon.organizer}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedEvent.resource.hackathon.tags?.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
                
                {selectedEvent.resource.hackathon?.website_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={selectedEvent.resource.hackathon.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};