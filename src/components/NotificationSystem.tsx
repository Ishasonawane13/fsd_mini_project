import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInHours, differenceInDays } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  description: string;
  event_date: string;
  hackathon_title: string;
  type: '1day' | '12hour' | '3hour';
}

export const NotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const checkForNotifications = async () => {
    try {
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          hackathons!inner(title)
        `);

      if (error) throw error;

      const now = new Date();
      const newNotifications: Notification[] = [];

      events?.forEach(event => {
        const eventDate = new Date(event.event_date);
        const hoursUntil = differenceInHours(eventDate, now);
        const daysUntil = differenceInDays(eventDate, now);

        // Check for notifications
        if (daysUntil === 1 && hoursUntil <= 24 && hoursUntil > 12 && event.reminder_1day) {
          newNotifications.push({
            id: `${event.id}-1day`,
            title: '1 Day Reminder',
            description: `${event.title} is tomorrow`,
            event_date: event.event_date,
            hackathon_title: event.hackathons?.title || 'Unknown',
            type: '1day'
          });
        } else if (hoursUntil === 12 && event.reminder_12h) {
          newNotifications.push({
            id: `${event.id}-12hour`,
            title: '12 Hour Reminder',
            description: `${event.title} is in 12 hours`,
            event_date: event.event_date,
            hackathon_title: event.hackathons?.title || 'Unknown',
            type: '12hour'
          });
        } else if (hoursUntil === 3 && event.reminder_3h) {
          newNotifications.push({
            id: `${event.id}-3hour`,
            title: '3 Hour Reminder',
            description: `${event.title} is in 3 hours`,
            event_date: event.event_date,
            hackathon_title: event.hackathons?.title || 'Unknown',
            type: '3hour'
          });
        }
      });

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  useEffect(() => {
    // Check for notifications on mount
    checkForNotifications();

    // Check every 30 minutes
    const interval = setInterval(checkForNotifications, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case '1day': return 'bg-blue-100 text-blue-800';
      case '12hour': return 'bg-yellow-100 text-yellow-800';
      case '3hour': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs">
            {notifications.length}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Notifications
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notifications
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getNotificationColor(notification.type)} variant="secondary">
                          {notification.title}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{notification.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notification.event_date), 'MMM dd, yyyy h:mm a')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};