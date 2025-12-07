import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  endTime: Date;
  onTimeUp: () => void;
}

const Timer = ({ endTime, onTimeUp }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 60) return 'text-destructive';
    if (timeLeft <= 180) return 'text-warning';
    return 'text-success';
  };

  const getProgressPercentage = () => {
    const totalSeconds = 15 * 60; // Assuming 15 min max
    return (timeLeft / totalSeconds) * 100;
  };

  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="relative w-16 h-16">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={175.93}
            strokeDashoffset={175.93 - (175.93 * getProgressPercentage()) / 100}
            className={`${getTimerColor()} transition-all duration-1000`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock className={`w-6 h-6 ${getTimerColor()}`} />
        </div>
      </div>
      
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Time Remaining</p>
        <p className={`text-3xl font-bold font-mono ${getTimerColor()}`}>
          {formatTime(timeLeft)}
        </p>
      </div>

      {timeLeft <= 60 && (
        <div className="ml-auto animate-pulse">
          <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
            Hurry up!
          </span>
        </div>
      )}
    </div>
  );
};

export default Timer;
