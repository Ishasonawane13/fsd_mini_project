import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface FilterState {
  search: string;
  status: string;
  location: string;
  teamSize: string;
  sortBy: string;
}

interface HackathonFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const HackathonFilters = ({ filters, onFiltersChange }: HackathonFiltersProps) => {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      location: 'all',
      teamSize: 'all',
      sortBy: 'start_date'
    });
  };

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.location !== 'all' || filters.teamSize !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search hackathons..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.teamSize} onValueChange={(value) => updateFilter('teamSize', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Team Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Size</SelectItem>
              <SelectItem value="1">Solo (1)</SelectItem>
              <SelectItem value="2-4">Small (2-4)</SelectItem>
              <SelectItem value="5+">Large (5+)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start_date">Start Date</SelectItem>
              <SelectItem value="registration_deadline">Registration Deadline</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="created_at">Recently Added</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};