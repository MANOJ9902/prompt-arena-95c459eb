import { Trophy, Medal, Award } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeaderboardEntry {
  lan_id: string;
  score: number;
  overall_score: number;
  rank?: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  showOverall?: boolean;
}

const LeaderboardTable = ({ entries, showOverall = false }: LeaderboardTableProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-mono">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400/10 border-yellow-400/30';
      case 2:
        return 'bg-gray-300/10 border-gray-300/30';
      case 3:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return '';
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const scoreA = showOverall ? b.overall_score : b.score;
    const scoreB = showOverall ? a.overall_score : a.score;
    return scoreA - scoreB;
  });

  return (
    <div className="glass-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>LAN ID</TableHead>
            {!showOverall && <TableHead className="text-right">Competition Score</TableHead>}
            {showOverall && <TableHead className="text-right">Overall Score</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEntries.map((entry, index) => (
            <TableRow 
              key={entry.lan_id} 
              className={`border-border/30 ${getRankBg(index + 1)} transition-colors hover:bg-muted/30`}
            >
              <TableCell className="text-center">
                <div className="flex items-center justify-center w-8 h-8 mx-auto">
                  {getRankIcon(index + 1)}
                </div>
              </TableCell>
              <TableCell className="font-medium">{entry.lan_id}</TableCell>
              <TableCell className="text-right">
                <span className="font-mono text-lg font-semibold text-primary">
                  {showOverall ? entry.overall_score : entry.score}
                </span>
                <span className="text-muted-foreground text-sm ml-1">pts</span>
              </TableCell>
            </TableRow>
          ))}
          {sortedEntries.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                No entries yet. Be the first to compete!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeaderboardTable;
