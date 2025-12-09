import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Clock, CheckCircle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedLogo from "@/components/AnimatedLogo";
import CompetitionCard from "@/components/CompetitionCard";
import { supabase } from "@/integrations/supabase/client";

interface Competition {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  time_limit_minutes: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      // Type assertion to handle the enum
      const typedData = (data || []).map(comp => ({
        ...comp,
        status: comp.status as 'upcoming' | 'ongoing' | 'completed'
      }));
      
      setCompetitions(typedData);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCompetitions = (status: string) => {
    return competitions.filter(c => c.status === status);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="flex flex-col items-center text-center gap-8">
            <AnimatedLogo />
            
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                <span className="gradient-text">Competition</span>
                <span className="text-foreground"> Hub</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Join exciting challenges, showcase your skills, and compete with the best minds in the company.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              <div className="glass-card px-6 py-3 flex items-center gap-3">
                <Zap className="w-5 h-5 text-success" />
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground">{filterCompetitions('ongoing').length}</p>
                  <p className="text-xs text-muted-foreground">Live Now</p>
                </div>
              </div>
              <div className="glass-card px-6 py-3 flex items-center gap-3">
                <Clock className="w-5 h-5 text-warning" />
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground">{filterCompetitions('upcoming').length}</p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
              </div>
              <div className="glass-card px-6 py-3 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground">{filterCompetitions('completed').length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/leaderboard')}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Leaderboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Competitions Section */}
      <main className="container mx-auto px-4 py-12">
        <Tabs defaultValue="ongoing" className="w-full">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-8">
            <TabsTrigger value="ongoing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="w-4 h-4 mr-2" />
              Live
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              <Clock className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle className="w-4 h-4 mr-2" />
              Past
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <TabsContent value="ongoing">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterCompetitions('ongoing').map((comp, index) => (
                    <CompetitionCard key={comp.id} competition={comp} index={index} />
                  ))}
                </div>
                {filterCompetitions('ongoing').length === 0 && (
                  <div className="text-center py-20 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No live competitions at the moment</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upcoming">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterCompetitions('upcoming').map((comp, index) => (
                    <CompetitionCard key={comp.id} competition={comp} index={index} />
                  ))}
                </div>
                {filterCompetitions('upcoming').length === 0 && (
                  <div className="text-center py-20 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming competitions scheduled</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterCompetitions('completed').map((comp, index) => (
                    <CompetitionCard key={comp.id} competition={comp} index={index} />
                  ))}
                </div>
                {filterCompetitions('completed').length === 0 && (
                  <div className="text-center py-20 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No completed competitions yet</p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Competition Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;