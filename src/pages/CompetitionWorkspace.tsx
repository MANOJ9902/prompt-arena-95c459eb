import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  LogOut, 
  Send, 
  FileText, 
  Download, 
  Paperclip,
  AlertTriangle,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Timer from "@/components/Timer";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CompetitionWorkspace = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [question, setQuestion] = useState<any>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [promptText, setPromptText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  const lanId = location.state?.lanId;
  const endTime = location.state?.endTime;

  useEffect(() => {
    if (!lanId || !endTime) {
      navigate(`/competition/${competitionId}/login`);
      return;
    }
    
    fetchData();
    checkSubmissionStatus();
  }, [competitionId, lanId, endTime]);

  const fetchData = async () => {
    try {
      const [compRes, questionRes] = await Promise.all([
        supabase.from('competitions').select('*').eq('id', competitionId).single(),
        supabase.from('questions').select('*').eq('competition_id', competitionId),
      ]);

      if (compRes.error) throw compRes.error;
      if (questionRes.error) throw questionRes.error;

      setCompetition(compRes.data);
      // Use first question if multiple exist
      if (questionRes.data && questionRes.data.length > 0) {
        setQuestion(questionRes.data[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load competition data",
        variant: "destructive",
      });
    }
  };

  const checkSubmissionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('submitted, prompt_text, output_text')
        .eq('lan_id', lanId)
        .eq('competition_id', competitionId)
        .single();

      if (error) throw error;
      if (data?.submitted) {
        setSubmitted(true);
      }
      // Load existing text if any
      if (data?.prompt_text) setPromptText(data.prompt_text);
      if (data?.output_text) setOutputText(data.output_text);
    } catch (error) {
      console.error('Error checking submission status:', error);
    }
  };

  const handleTimeUp = useCallback(async () => {
    setTimeExpired(true);
    
    // Auto-submit whatever data is available
    if (!submitted) {
      await handleSubmit(true);
    } else {
      toast({
        title: "Time's Up!",
        description: "Your submission window has closed.",
        variant: "destructive",
      });
    }
  }, [submitted, promptText, outputText, competitionId, lanId]);

  const handleSubmit = async (isAutoSubmit = false) => {
    setSubmitting(true);

    try {
      // Generate random marks between 50-100 for evaluation
      const randomMarks = Math.floor(Math.random() * 51) + 50;
      
      // Update participant record with text submissions and marks
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          prompt_text: promptText,
          output_text: outputText,
          submitted: true,
          score: randomMarks,
        })
        .eq('lan_id', lanId)
        .eq('competition_id', competitionId);

      if (updateError) throw updateError;

      // Add/update leaderboard entry with the marks
      const { data: existingEntry } = await supabase
        .from('leaderboard')
        .select('id, overall_score')
        .eq('lan_id', lanId)
        .eq('competition_id', competitionId)
        .maybeSingle();

      if (existingEntry) {
        await supabase
          .from('leaderboard')
          .update({ 
            score: randomMarks,
            overall_score: existingEntry.overall_score + randomMarks,
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingEntry.id);
      } else {
        // Check if user has previous overall score from other competitions
        const { data: prevEntries } = await supabase
          .from('leaderboard')
          .select('overall_score')
          .eq('lan_id', lanId);
        
        const previousOverall = prevEntries?.reduce((sum, e) => sum + e.overall_score, 0) || 0;
        
        await supabase
          .from('leaderboard')
          .insert({
            lan_id: lanId,
            competition_id: competitionId,
            score: randomMarks,
            overall_score: previousOverall + randomMarks,
          });
      }

      // Update local storage
      const session = localStorage.getItem(`competition_session_${competitionId}`);
      if (session) {
        const sessionData = JSON.parse(session);
        sessionData.submitted = true;
        localStorage.setItem(`competition_session_${competitionId}`, JSON.stringify(sessionData));
      }

      setSubmitted(true);

      toast({
        title: isAutoSubmit ? "Auto-Submitted!" : "Submitted!",
        description: isAutoSubmit 
          ? "Your answers were automatically submitted as time ran out."
          : "Your submission has been recorded successfully.",
      });

    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    navigate('/');
  };

  if (submitted || timeExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            {submitted ? <Send className="w-8 h-8 text-primary" /> : <AlertTriangle className="w-8 h-8 text-warning" />}
          </div>
          <h1 className="text-2xl font-bold">
            {submitted ? "Submission Complete!" : "Time Expired"}
          </h1>
          <p className="text-muted-foreground">
            {submitted 
              ? "Thank you for participating. Your submission has been recorded."
              : "Your time has expired. Your answers have been auto-submitted."}
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{competition?.name}</h1>
              <p className="text-xs text-muted-foreground">Participant: {lanId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Timer endTime={new Date(endTime)} onTimeUp={handleTimeUp} />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Panel - Question */}
          <div className="glass-card p-6 space-y-6 overflow-auto">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Challenge</h2>
                <p className="text-sm text-muted-foreground">Read carefully before starting</p>
              </div>
            </div>

            {question ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">{question.title}</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{question.description}</p>
                </div>

                {/* Attachments */}
                {question.attachments && question.attachments.length > 0 && (
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Reference Files
                    </h4>
                    <div className="space-y-2">
                      {question.attachments.map((attachment: any, index: number) => (
                        <a
                          key={index}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm flex-1">{attachment.name}</span>
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Right Panel - Submission */}
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Your Submission</h2>
                <p className="text-sm text-muted-foreground">Enter your answers below</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-base font-medium">1. Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Enter your prompt here..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  disabled={submitting}
                  className="min-h-[150px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="output" className="text-base font-medium">2. Output</Label>
                <Textarea
                  id="output"
                  placeholder="Enter your output/solution here..."
                  value={outputText}
                  onChange={(e) => setOutputText(e.target.value)}
                  disabled={submitting}
                  className="min-h-[150px] resize-none"
                />
              </div>

              <div className="pt-4 border-t border-border/50">
                <Button
                  className="w-full h-12 text-lg"
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Solution
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-3">
                  Your submission will be final. Make sure everything is correct.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Are you sure you want to logout?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your timer will continue running. You can login again with the same LAN ID 
              to resume your session until the time expires or you submit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompetitionWorkspace;