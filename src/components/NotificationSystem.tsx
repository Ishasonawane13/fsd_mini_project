import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { hackathonsApi, type Hackathon } from '@/services/api';
import { format, differenceInHours, differenceInDays } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  description: string;
  event_date: string;
  hackathon_title: string;
  type: 'registration' | 'start' | 'end';
}

export const NotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const checkForNotifications = async () => {
    try {
      // Get upcoming hackathons from our MongoDB API
      const response = await hackathonsApi.getAll({ status: 'upcoming' });
      const hackathons = response?.data?.hackathons || [];

      const now = new Date();
      const newNotifications: Notification[] = [];

      hackathons.forEach(hackathon => {
        const registrationDeadline = new Date(hackathon.registrationDeadline);
        const startDate = new Date(hackathon.startDate);
        const endDate = new Date(hackathon.endDate);

        const hoursUntilRegistration = differenceInHours(registrationDeadline, now);
        const hoursUntilStart = differenceInHours(startDate, now);
        const hoursUntilEnd = differenceInHours(endDate, now);

        const daysUntilRegistration = differenceInDays(registrationDeadline, now);
        const daysUntilStart = differenceInDays(startDate, now);

        // Registration deadline reminders
        if (daysUntilRegistration === 1 && hoursUntilRegistration <= 24 && hoursUntilRegistration > 0) {
          newNotifications.push({
            id: `${hackathon._id}-registration`,
            title: 'Registration Deadline Tomorrow',
            description: `Registration for ${hackathon.title} closes tomorrow`,
            event_date: hackathon.registrationDeadline,
            hackathon_title: hackathon.title,
            type: 'registration'
          });
        } else if (hoursUntilRegistration <= 12 && hoursUntilRegistration > 0) {
          newNotifications.push({
            id: `${hackathon._id}-registration-12h`,
            title: 'Registration Deadline Soon',
            description: `Registration for ${hackathon.title} closes in ${hoursUntilRegistration} hours`,
            event_date: hackathon.registrationDeadline,
            hackathon_title: hackathon.title,
            type: 'registration'
          });
        }

        // Start date reminders
        if (daysUntilStart === 1 && hoursUntilStart <= 24 && hoursUntilStart > 0) {
          newNotifications.push({
            id: `${hackathon._id}-start`,
            title: 'Hackathon Starts Tomorrow',
            description: `${hackathon.title} starts tomorrow`,
            event_date: hackathon.startDate,
            hackathon_title: hackathon.title,
            type: 'start'
          });
        } else if (hoursUntilStart <= 3 && hoursUntilStart > 0) {
          newNotifications.push({
            id: `${hackathon._id}-start-3h`,
            title: 'Hackathon Starting Soon',
            description: `${hackathon.title} starts in ${hoursUntilStart} hours`,
            event_date: hackathon.startDate,
            hackathon_title: hackathon.title,
            type: 'start'
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
      case 'registration': return 'bg-blue-100 text-blue-800';
      case 'start': return 'bg-green-100 text-green-800';
      case 'end': return 'bg-red-100 text-red-800';
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