import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  Send, 
  FileText, 
  Download, 
  Paperclip,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Timer from "@/components/Timer";
import FileUpload from "@/components/FileUpload";
import AnimatedLogo from "@/components/AnimatedLogo";
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
  const [promptFile, setPromptFile] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<File | null>(null);
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
        supabase.from('questions').select('*').eq('competition_id', competitionId).single(),
      ]);

      if (compRes.error) throw compRes.error;
      if (questionRes.error) throw questionRes.error;

      setCompetition(compRes.data);
      setQuestion(questionRes.data);
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
        .select('submitted')
        .eq('lan_id', lanId)
        .eq('competition_id', competitionId)
        .single();

      if (error) throw error;
      if (data?.submitted) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error checking submission status:', error);
    }
  };

  const handleTimeUp = useCallback(async () => {
    setTimeExpired(true);
    
    // Auto-submit if files are present
    if (promptFile && outputFile && !submitted) {
      await handleSubmit(true);
    } else {
      toast({
        title: "Time's Up!",
        description: "Your submission window has closed.",
        variant: "destructive",
      });
      
      // Mark as expired in storage
      const session = localStorage.getItem(`competition_session_${competitionId}`);
      if (session) {
        const sessionData = JSON.parse(session);
        sessionData.expired = true;
        localStorage.setItem(`competition_session_${competitionId}`, JSON.stringify(sessionData));
      }
    }
  }, [promptFile, outputFile, submitted, competitionId]);

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!promptFile || !outputFile) {
      toast({
        title: "Missing Files",
        description: "Please upload both prompt and output files",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload files to storage
      const timestamp = Date.now();
      const promptPath = `${competitionId}/${lanId}/prompt_${timestamp}_${promptFile.name}`;
      const outputPath = `${competitionId}/${lanId}/output_${timestamp}_${outputFile.name}`;

      const [promptUpload, outputUpload] = await Promise.all([
        supabase.storage.from('submissions').upload(promptPath, promptFile),
        supabase.storage.from('submissions').upload(outputPath, outputFile),
      ]);

      if (promptUpload.error) throw promptUpload.error;
      if (outputUpload.error) throw outputUpload.error;

      // Get public URLs
      const promptUrl = supabase.storage.from('submissions').getPublicUrl(promptPath).data.publicUrl;
      const outputUrl = supabase.storage.from('submissions').getPublicUrl(outputPath).data.publicUrl;

      // Update participant record
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          prompt_file_url: promptUrl,
          output_file_url: outputUrl,
          submitted: true,
        })
        .eq('lan_id', lanId)
        .eq('competition_id', competitionId);

      if (updateError) throw updateError;

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
          ? "Your files were automatically submitted as time ran out."
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
          <AnimatedLogo />
          <h1 className="text-2xl font-bold mt-6">
            {submitted ? "Submission Complete!" : "Time Expired"}
          </h1>
          <p className="text-muted-foreground">
            {submitted 
              ? "Thank you for participating. Your submission has been recorded."
              : "Your time has expired. You can no longer submit."}
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
            <div className="w-8 h-8">
              <AnimatedLogo />
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
                      Attachments
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
                <p className="text-sm text-muted-foreground">Upload your files below</p>
              </div>
            </div>

            <div className="space-y-6">
              <FileUpload
                label="1. Prompt File"
                onFileSelect={setPromptFile}
                disabled={submitting}
              />

              <FileUpload
                label="2. Output File"
                onFileSelect={setOutputFile}
                disabled={submitting}
              />

              <div className="pt-4 border-t border-border/50">
                <Button
                  className="w-full h-12 text-lg"
                  onClick={() => handleSubmit(false)}
                  disabled={!promptFile || !outputFile || submitting}
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
