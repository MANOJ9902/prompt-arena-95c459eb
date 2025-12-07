import { Calendar, Clock, Trophy, ArrowRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Competition {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  time_limit_minutes: number;
}

interface CompetitionCardProps {
  competition: Competition;
  index: number;
}

const CompetitionCard = ({ competition, index }: CompetitionCardProps) => {
  const navigate = useNavigate();

  const getStatusConfig = () => {
    switch (competition.status) {
      case 'ongoing':
        return {
          badge: 'Live Now',
          badgeClass: 'bg-success/20 text-success border-success/30',
          icon: <Sparkles className="w-3 h-3" />,
          action: 'Register Now',
          actionVariant: 'default' as const,
          canClick: true,
        };
      case 'upcoming':
        return {
          badge: 'Coming Soon',
          badgeClass: 'bg-warning/20 text-warning border-warning/30',
          icon: <Clock className="w-3 h-3" />,
          action: 'Announced Soon',
          actionVariant: 'secondary' as const,
          canClick: false,
        };
      case 'completed':
        return {
          badge: 'Completed',
          badgeClass: 'bg-muted text-muted-foreground border-muted',
          icon: <Lock className="w-3 h-3" />,
          action: 'View Results',
          actionVariant: 'outline' as const,
          canClick: true,
        };
      default:
        return {
          badge: 'Unknown',
          badgeClass: 'bg-muted text-muted-foreground',
          icon: null,
          action: 'View',
          actionVariant: 'outline' as const,
          canClick: false,
        };
    }
  };

  const config = getStatusConfig();

  const handleAction = () => {
    if (competition.status === 'ongoing') {
      navigate(`/competition/${competition.id}/login`);
    } else if (competition.status === 'completed') {
      navigate(`/leaderboard/${competition.id}`);
    }
  };

  return (
    <div 
      className="glass-card-hover p-6 opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <Badge variant="outline" className={config.badgeClass}>
              {config.icon}
              <span className="ml-1">{config.badge}</span>
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{competition.time_limit_minutes} min</span>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {competition.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 flex-grow line-clamp-2">
          {competition.description}
        </p>

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(competition.start_date), 'MMM dd, yyyy')}</span>
          </div>
          <span>→</span>
          <span>{format(new Date(competition.end_date), 'MMM dd, yyyy')}</span>
        </div>

        {/* Action */}
        <Button 
          variant={config.actionVariant}
          className={`w-full group ${competition.status === 'ongoing' ? 'animate-pulse-glow' : ''}`}
          onClick={handleAction}
          disabled={!config.canClick}
        >
          {config.action}
          {config.canClick && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>
      </div>
    </div>
  );
};

export default CompetitionCard;
