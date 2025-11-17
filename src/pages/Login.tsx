import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotatingLogo } from "@/components/RotatingLogo";
import { Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import tawaBackground from "@/assets/tawa-background.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(email, password);
    
    if (success) {
      toast({
        title: "Login Successful",
        description: `Welcome to TAWA Training Portal`,
      });
      
      // Navigate based on detected role
      setTimeout(() => {
        let role = "instructor"; // default
        if (email.includes("admin")) {
          role = "admin";
        } else if (email.includes("doctor") || email.includes("doc")) {
          role = "doctor";
        }
        navigate(`/${role}`);
      }, 100);
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Demo: admin@tawa.go.tz / instructor@tawa.go.tz",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${tawaBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-secondary/80" />
      </div>

      {/* Animated Patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-accent rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse-glow delay-1000" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-accent/20 animate-slide-up">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <RotatingLogo className="w-32 h-32" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">TAWA Training Portal</h1>
            <p className="text-muted-foreground">Tanzania Wildlife Management Authority</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tawa.go.tz"
                required
                className="border-primary/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border-primary/30"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-military hover:opacity-90 text-white font-semibold py-6 text-lg shadow-lg"
            >
              Access System
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <button className="text-sm text-accent hover:underline">
              Forgot Password?
            </button>
            <p className="text-xs text-muted-foreground">
              Demo: admin@tawa.go.tz, instructor@tawa.go.tz, or doctor@tawa.go.tz | Password: tawa2024
            </p>
          </div>
        </div>

        {/* Bottom Badge */}
        <div className="mt-4 text-center text-white/80 text-sm">
          <p>Secured by TAWA IT Department</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
