import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Shield,
  Database,
  Users,
  FileQuestion,
  Trophy,
  ExternalLink,
  Save,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, { score: number; overall_score: number }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [compRes, questRes, partRes, leadRes] = await Promise.all([
        supabase.from('competitions').select('*').order('start_date', { ascending: false }),
        supabase.from('questions').select('*').order('created_at', { ascending: false }),
        supabase.from('participants').select('*').order('created_at', { ascending: false }),
        supabase.from('leaderboard').select('*').order('score', { ascending: false }),
      ]);

      setCompetitions(compRes.data || []);
      setQuestions(questRes.data || []);
      setParticipants(partRes.data || []);
      setLeaderboard(leadRes.data || []);
      
      // Initialize scores state
      const initialScores: Record<string, { score: number; overall_score: number }> = {};
      (leadRes.data || []).forEach((entry: any) => {
        initialScores[entry.id] = { score: entry.score, overall_score: entry.overall_score };
      });
      setScores(initialScores);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (id: string, field: 'score' | 'overall_score', value: number) => {
    setScores(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const updateScores = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(scores).map(([id, scoreData]) => 
        supabase
          .from('leaderboard')
          .update({ 
            score: scoreData.score, 
            overall_score: scoreData.overall_score,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
      );
      
      await Promise.all(updates);
      
      toast({
        title: "Success",
        description: "Scores updated successfully",
      });
      
      fetchAllData();
    } catch (error) {
      console.error('Error updating scores:', error);
      toast({
        title: "Error",
        description: "Failed to update scores",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getCompetitionName = (id: string) => {
    return competitions.find(c => c.id === id)?.name || 'Unknown';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-destructive/30 to-accent/20 flex items-center justify-center border border-destructive/30">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>

          <Button variant="outline" onClick={fetchAllData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <Tabs defaultValue="participants" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="competitions" className="gap-2">
              <Database className="w-4 h-4" />
              Competitions
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <FileQuestion className="w-4 h-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="participants" className="gap-2">
              <Users className="w-4 h-4" />
              Participants
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Competitions Tab */}
          <TabsContent value="competitions">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">Competitions ({competitions.length})</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Time Limit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitions.map((comp) => (
                      <TableRow key={comp.id}>
                        <TableCell className="font-medium">{comp.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            comp.status === 'ongoing' ? 'bg-success/20 text-success' :
                            comp.status === 'completed' ? 'bg-muted text-muted-foreground' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {comp.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(comp.start_date)}</TableCell>
                        <TableCell>{formatDate(comp.end_date)}</TableCell>
                        <TableCell>{comp.time_limit_minutes} min</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">Questions ({questions.length})</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">{q.title}</TableCell>
                        <TableCell>{getCompetitionName(q.competition_id)}</TableCell>
                        <TableCell className="max-w-xs truncate">{q.description}</TableCell>
                        <TableCell>{formatDate(q.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">Participants & Submissions ({participants.length})</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>LAN ID</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Prompt File</TableHead>
                      <TableHead>Output File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium font-mono">{p.lan_id}</TableCell>
                        <TableCell>{getCompetitionName(p.competition_id)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            p.submitted ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                          }`}>
                            {p.submitted ? 'Yes' : 'No'}
                          </span>
                        </TableCell>
                        <TableCell>{p.start_time ? formatDate(p.start_time) : '-'}</TableCell>
                        <TableCell>{p.end_time ? formatDate(p.end_time) : '-'}</TableCell>
                        <TableCell>
                          {p.prompt_file_url ? (
                            <a 
                              href={p.prompt_file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {p.output_file_url ? (
                            <a 
                              href={p.output_file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Leaderboard Scores ({leaderboard.length})</h2>
                <Button onClick={updateScores} disabled={saving} className="gap-2">
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Update Scores
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>LAN ID</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead>Competition Score</TableHead>
                      <TableHead>Overall Score</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium font-mono">{entry.lan_id}</TableCell>
                        <TableCell>{getCompetitionName(entry.competition_id)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={scores[entry.id]?.score ?? entry.score}
                            onChange={(e) => handleScoreChange(entry.id, 'score', parseInt(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={scores[entry.id]?.overall_score ?? entry.overall_score}
                            onChange={(e) => handleScoreChange(entry.id, 'overall_score', parseInt(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>{formatDate(entry.updated_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;