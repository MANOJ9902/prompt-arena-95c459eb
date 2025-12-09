import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogIn, AlertCircle, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CompetitionLogin = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lanId, setLanId] = useState("");
  const [loading, setLoading] = useState(false);
  const [competition, setCompetition] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCompetition();
    checkExistingSession();
  }, [competitionId]);

  const fetchCompetition = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single();

      if (error) throw error;
      setCompetition(data);
    } catch (error) {
      console.error('Error fetching competition:', error);
      toast({
        title: "Error",
        description: "Failed to load competition details",
        variant: "destructive",
      });
    }
  };

  const checkExistingSession = () => {
    const session = localStorage.getItem(`competition_session_${competitionId}`);
    if (session) {
      const { lanId, endTime, submitted } = JSON.parse(session);
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      
      if (now < end && !submitted) {
        // Session still valid and not submitted, redirect to workspace
        navigate(`/competition/${competitionId}/workspace`, { 
          state: { lanId, endTime } 
        });
      }
      // Don't show error for existing sessions - just let them try to login again
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!lanId.trim()) {
      setError("Please enter your LAN ID");
      return;
    }

    setLoading(true);

    try {
      // Check if participant already exists
      const { data: existingParticipant, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('lan_id', lanId.trim().toUpperCase())
        .eq('competition_id', competitionId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingParticipant) {
        // Check if already submitted - show "Already used" message
        if (existingParticipant.submitted) {
          setError("This LAN ID has already been used for this competition.");
          setLoading(false);
          return;
        }

        const now = new Date().getTime();
        const endTime = new Date(existingParticipant.end_time).getTime();
        
        // Check if time expired
        if (now > endTime) {
          setError("This LAN ID has already been used for this competition.");
          setLoading(false);
          return;
        }

        // Resume existing session (within time and not submitted)
        localStorage.setItem(`competition_session_${competitionId}`, JSON.stringify({
          lanId: existingParticipant.lan_id,
          endTime: existingParticipant.end_time,
          submitted: false,
        }));

        navigate(`/competition/${competitionId}/workspace`, {
          state: { 
            lanId: existingParticipant.lan_id, 
            endTime: existingParticipant.end_time 
          }
        });
        return;
      }

      // Get questions for this competition (pick first one or random)
      const { data: questions, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('competition_id', competitionId);

      if (questionError) throw questionError;
      if (!questions || questions.length === 0) {
        throw new Error('No questions available for this competition');
      }
      
      // Pick a random question
      const question = questions[Math.floor(Math.random() * questions.length)];

      // Calculate end time
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (competition.time_limit_minutes * 60 * 1000));

      // Create new participant
      const { data: newParticipant, error: insertError } = await supabase
        .from('participants')
        .insert({
          lan_id: lanId.trim().toUpperCase(),
          competition_id: competitionId,
          question_id: question.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          submitted: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Store session
      localStorage.setItem(`competition_session_${competitionId}`, JSON.stringify({
        lanId: newParticipant.lan_id,
        endTime: newParticipant.end_time,
        submitted: false,
      }));

      toast({
        title: "Welcome!",
        description: `Good luck, ${newParticipant.lan_id}! Your ${competition.time_limit_minutes} minute timer starts now.`,
      });

      navigate(`/competition/${competitionId}/workspace`, {
        state: { 
          lanId: newParticipant.lan_id, 
          endTime: newParticipant.end_time 
        }
      });

    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 bg-hero-gradient pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </header>

      {/* Login Form */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/30">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mt-4">
              {competition?.name || 'Loading...'}
            </h1>
            <p className="text-muted-foreground">
              Enter your LAN ID to begin the competition
            </p>
            {competition && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Time Limit: {competition.time_limit_minutes} minutes</span>
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="glass-card p-8 space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="lanId">LAN ID</Label>
              <Input
                id="lanId"
                type="text"
                placeholder="Enter your LAN ID"
                value={lanId}
                onChange={(e) => {
                  setLanId(e.target.value);
                  setError(""); // Clear error when typing
                }}
                className="h-12 text-lg"
                disabled={loading}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Start Competition
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Once you login, your timer will start immediately.
              <br />
              Make sure you're ready before proceeding.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CompetitionLogin;