import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Trophy, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
}

interface HackathonCardProps {
  hackathon: Hackathon;
  onToggleCalendar: (hackathon: Hackathon) => void;
  isInCalendar: boolean;
}

export const HackathonCard = ({ hackathon, onToggleCalendar, isInCalendar }: HackathonCardProps) => {
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ongoing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ended': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleToggleCalendar = () => {
    onToggleCalendar(hackathon);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{hackathon.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              by {hackathon.organizer}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(hackathon.status)}>
            {hackathon.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {hackathon.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {hackathon.description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>{format(new Date(hackathon.start_date), 'MMM dd')} - {format(new Date(hackathon.end_date), 'MMM dd, yyyy')}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>{hackathon.location || 'TBD'}</span>
          </div>

          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>Team: {hackathon.team_size_min}{hackathon.team_size_max && hackathon.team_size_max !== hackathon.team_size_min ? `-${hackathon.team_size_max}` : ''} members</span>
          </div>

          {hackathon.prize_pool && (
            <div className="flex items-center text-sm">
              <Trophy className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>{hackathon.prize_pool}</span>
            </div>
          )}

          <div className="text-sm">
            <span className="text-muted-foreground">Registration deadline: </span>
            <span className="font-medium">{format(new Date(hackathon.registration_deadline), 'MMM dd, yyyy')}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {hackathon.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button 
          variant={isInCalendar ? "destructive" : "outline"} 
          size="sm" 
          onClick={handleToggleCalendar}
          className="flex-1"
        >
          {isInCalendar ? "Remove from Calendar" : "Add to Calendar"}
        </Button>
        {hackathon.website_url && (
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
          >
            <a href={hackathon.website_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};