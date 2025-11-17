import { RotatingLogo } from "./RotatingLogo";

export const Loading = () => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <RotatingLogo className="w-32 h-32" />
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-bold text-primary animate-pulse">Loading TAWA System...</p>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
};


