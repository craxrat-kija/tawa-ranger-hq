import tawaLogo from "@/assets/tawa-logo.jpeg";

export const RotatingLogo = ({ className = "w-24 h-24" }: { className?: string }) => {
  return (
    <div className="relative inline-block">
      <div className={`${className} rounded-full overflow-hidden animate-spin-slow border-4 border-accent shadow-[0_0_30px_rgba(212,175,55,0.5)]`}>
        <img 
          src={tawaLogo} 
          alt="TAWA Logo" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse-glow pointer-events-none" />
    </div>
  );
};
