const AnimatedLogo = () => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Glow effect behind logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 bg-primary/30 rounded-full blur-2xl animate-pulse-glow" />
      </div>
      
      {/* Orbiting rings */}
      <div className="absolute w-28 h-28 border border-primary/20 rounded-full animate-spin-slow" />
      <div className="absolute w-36 h-36 border border-primary/10 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '12s' }} />
      
      {/* Logo container */}
      <div className="relative z-10 animate-float">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 backdrop-blur-sm border border-primary/30 flex items-center justify-center p-2 shadow-lg shadow-primary/20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <text 
              x="50" 
              y="65" 
              textAnchor="middle" 
              fill="hsl(199, 100%, 42%)" 
              fontSize="36" 
              fontWeight="bold"
              fontFamily="system-ui, sans-serif"
            >
              ANZ
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AnimatedLogo;
