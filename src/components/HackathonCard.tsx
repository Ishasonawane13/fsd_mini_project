import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Trophy, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Hackathon {
  id: string;
  title: string;
  description: string | null;
  organizer?: string;
  location?: string | null;
  team_size_min?: number;
  team_size_max?: number | null;
  teamSize?: string;
  status: string;
  registration_deadline?: string;
  deadline?: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  website_url?: string | null;
  url?: string | null;
  prize_pool?: string | null;
  prize?: string | null;
  tags?: string[];
  category?: string;
  source?: string;
  difficulty?: string;
  scraped_at?: string;
}

interface HackathonCardProps {
  hackathon: Hackathon;
  onToggleCalendar: (hackathon: Hackathon) => void;
  isInCalendar: boolean;
}

export const HackathonCard = ({ hackathon, onToggleCalendar, isInCalendar }: HackathonCardProps) => {
  const { toast } = useToast();

  // Helper functions to handle both database and scraped data formats
  const getOrganizerName = () => {
    return hackathon.organizer || (hackathon.source === 'scraped' ? 'Unstop' : 'Unknown Organizer');
  };

  const getStartDate = () => {
    return hackathon.start_date || hackathon.startDate || new Date().toISOString();
  };

  const getEndDate = () => {
    return hackathon.end_date || hackathon.endDate || new Date().toISOString();
  };

  const getRegistrationDeadline = () => {
    return hackathon.registration_deadline || hackathon.deadline || getEndDate();
  };

  const getWebsiteUrl = () => {
    return hackathon.website_url || hackathon.url;
  };

  const getPrize = () => {
    return hackathon.prize_pool || hackathon.prize;
  };

  const getTeamSize = () => {
    if (hackathon.teamSize) return hackathon.teamSize;
    if (hackathon.team_size_min && hackathon.team_size_max) {
      return `${hackathon.team_size_min}-${hackathon.team_size_max} members`;
    }
    return '1-4 members';
  };

  const getTags = () => {
    if (hackathon.tags && hackathon.tags.length > 0) return hackathon.tags;
    const tags = [];
    if (hackathon.category) tags.push(hackathon.category);
    if (hackathon.difficulty) tags.push(hackathon.difficulty);
    if (hackathon.source) tags.push(hackathon.source);
    return tags.length > 0 ? tags : ['Technology'];
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'upcoming':
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ended':
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleToggleCalendar = () => {
    onToggleCalendar(hackathon);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return 'TBD';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{hackathon.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              by {getOrganizerName()}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge className={getStatusColor(hackathon.status)}>
              {hackathon.status}
            </Badge>
            {hackathon.source && (
              <Badge variant="outline" className="text-xs">
                {hackathon.source}
              </Badge>
            )}
          </div>
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
            <span>{formatDate(getStartDate())} - {formatDate(getEndDate())}</span>
          </div>

          <div className="flex items-center text-sm">
            <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="truncate">{hackathon.location || 'Online/TBD'}</span>
          </div>

          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>Team: {getTeamSize()}</span>
          </div>

          {getPrize() && getPrize() !== 'N/A' && (
            <div className="flex items-center text-sm">
              <Trophy className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="truncate">{getPrize()}</span>
            </div>
          )}

          <div className="text-sm">
            <span className="text-muted-foreground">Registration deadline: </span>
            <span className="font-medium">{formatDate(getRegistrationDeadline())}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {getTags().map((tag) => (
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
        {getWebsiteUrl() && getWebsiteUrl() !== 'N/A' && (
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <a href={getWebsiteUrl()!} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};