import tawaLogo from "@/assets/tawa-logo.png";

export const RotatingLogo = ({ className = "w-40 h-40", animate = false }: { className?: string, animate?: boolean }) => {
  return (
    <div className="relative inline-block">
      <div className={`${className} rounded-full overflow-hidden ${animate ? 'animate-spin-slow' : ''} border-4 border-accent bg-white shadow-[0_0_50px_rgba(212,175,55,0.4)]`}>
        <img
          src={tawaLogo}
          alt="TAWA Logo"
          className="w-full h-full object-contain p-2"
        />
      </div>
      <div className="absolute inset-0 rounded-full ring-4 ring-accent/20 animate-pulse-glow pointer-events-none" />
    </div>
  );
};
