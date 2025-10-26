import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { hackathonsApi, calendarApi, type Hackathon } from '@/services/api';
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
    event_type: 'registration' | 'start' | 'end';
    description?: string;
    hackathon: Hackathon;
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
      // Get hackathons from user's calendar (My Rounds)
      const calendarResponse = await calendarApi.getCalendarHackathons();
      if (!calendarResponse.success) {
        console.error('Failed to fetch calendar hackathons:', calendarResponse);
        setEvents([]);
        return;
      }

      // Use the hackathons returned by the calendar API (these are from My Rounds)
      const hackathons = calendarResponse.data.hackathons || [];

      if (hackathons.length === 0) {
        setEvents([]);
        return;
      }

      const formattedEvents: CalendarEvent[] = [];

      // Process all hackathons from My Rounds
      hackathons.forEach(hackathon => {
        // Registration deadline event
        if (hackathon.registrationDeadline) {
          formattedEvents.push({
            id: `${hackathon._id}-registration`,
            title: `Registration Deadline: ${hackathon.title}`,
            start: new Date(hackathon.registrationDeadline),
            end: new Date(hackathon.registrationDeadline),
            resource: {
              hackathon_id: hackathon._id,
              event_type: 'registration',
              description: `Registration deadline for ${hackathon.title}`,
              hackathon: hackathon
            }
          });
        }

        // Start date event
        formattedEvents.push({
          id: `${hackathon._id}-start`,
          title: `${hackathon.title} Starts`,
          start: new Date(hackathon.startDate),
          end: new Date(hackathon.startDate),
          resource: {
            hackathon_id: hackathon._id,
            event_type: 'start',
            description: `${hackathon.title} begins`,
            hackathon: hackathon
          }
        });

        // End date event
        formattedEvents.push({
          id: `${hackathon._id}-end`,
          title: `${hackathon.title} Ends`,
          start: new Date(hackathon.endDate),
          end: new Date(hackathon.endDate),
          resource: {
            hackathon_id: hackathon._id,
            event_type: 'end',
            description: `${hackathon.title} concludes`,
            hackathon: hackathon
          }
        });
      });

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
    // For now, just close the modal since we don't have a delete feature for hackathons
    toast({
      title: "Note",
      description: "Calendar events are based on hackathon dates and cannot be deleted individually.",
    });
    setIsModalOpen(false);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';

    switch (event.resource.event_type) {
      case 'registration':
        backgroundColor = '#f59e0b';
        break;
      case 'start':
        backgroundColor = '#10b981';
        break;
      case 'end':
        backgroundColor = '#ef4444';
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
      {events.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hackathons in your calendar</h3>
            <p className="text-muted-foreground">
              Add hackathons to your calendar from the "All Sources" tab to see them here.
            </p>
          </div>
        </div>
      ) : (
        <>
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
        .rbc-event {
          white-space: pre-line !important;
          font-size: 12px !important;
          line-height: 1.2 !important;
          padding: 2px 4px !important;
        }
        .rbc-event-content {
          white-space: pre-line !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
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
                          <span>
                            {selectedEvent.resource.hackathon.location.type === 'online'
                              ? 'Online'
                              : selectedEvent.resource.hackathon.location.venue ||
                              `${selectedEvent.resource.hackathon.location.address?.city}, ${selectedEvent.resource.hackathon.location.address?.country}`
                            }
                          </span>
                        </div>

                        {selectedEvent.resource.hackathon.prizes && selectedEvent.resource.hackathon.prizes.length > 0 && (
                          <div className="flex items-center">
                            <Trophy className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span>
                              {selectedEvent.resource.hackathon.prizes[0].currency} {selectedEvent.resource.hackathon.prizes[0].amount.toLocaleString()}
                              {selectedEvent.resource.hackathon.prizes.length > 1 && ' + more prizes'}
                            </span>
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

                    {selectedEvent.resource.hackathon?.links?.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={selectedEvent.resource.hackathon.links.website}
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
        </>
      )}
    </div>
  );
};