import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, BarChart3, TrendingUp } from "lucide-react";
import AnimatedLogo from "@/components/AnimatedLogo";
import LeaderboardTable from "@/components/LeaderboardTable";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Competition {
  id: string;
  name: string;
  status: string;
}

const Leaderboard = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>(competitionId || '');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [overallData, setOverallData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    if (selectedCompetition) {
      fetchLeaderboard(selectedCompetition);
    }
    fetchOverallLeaderboard();
  }, [selectedCompetition]);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, name, status')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setCompetitions(data || []);
      
      if (!selectedCompetition && data && data.length > 0) {
        setSelectedCompetition(competitionId || data[0].id);
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
    }
  };

  const fetchLeaderboard = async (compId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('competition_id', compId)
        .order('score', { ascending: false });

      if (error) throw error;
      setLeaderboardData(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallLeaderboard = async () => {
    try {
      // Aggregate overall scores
      const { data, error } = await supabase
        .from('leaderboard')
        .select('lan_id, overall_score')
        .order('overall_score', { ascending: false });

      if (error) throw error;

      // Deduplicate by lan_id and sum overall scores
      const aggregated = (data || []).reduce((acc: any, curr) => {
        if (!acc[curr.lan_id]) {
          acc[curr.lan_id] = { lan_id: curr.lan_id, score: 0, overall_score: curr.overall_score };
        } else {
          acc[curr.lan_id].overall_score = Math.max(acc[curr.lan_id].overall_score, curr.overall_score);
        }
        return acc;
      }, {});

      setOverallData(Object.values(aggregated));
    } catch (error) {
      console.error('Error fetching overall leaderboard:', error);
    }
  };

  const selectedCompName = competitions.find(c => c.id === selectedCompetition)?.name || 'Select Competition';

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10">
              <AnimatedLogo />
            </div>
            <h1 className="text-xl font-bold">Leaderboard</h1>
          </div>

          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <Tabs defaultValue="competition" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="competition" className="gap-2">
                <Trophy className="w-4 h-4" />
                Competition
              </TabsTrigger>
              <TabsTrigger value="overall" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Overall
              </TabsTrigger>
            </TabsList>

            <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select competition" />
              </SelectTrigger>
              <SelectContent>
                {competitions.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="competition" className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedCompName}</h2>
                  <p className="text-sm text-muted-foreground">Competition Rankings</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <LeaderboardTable entries={leaderboardData} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="overall" className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Overall Rankings</h2>
                  <p className="text-sm text-muted-foreground">Combined scores across all competitions</p>
                </div>
              </div>

              <LeaderboardTable entries={overallData} showOverall />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Leaderboard;
