import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardDescription } from "@/components/ui/card";
import { RotatingLogo } from "@/components/RotatingLogo";
import { Lock, Mail, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SuperAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { superAdminLogin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await superAdminLogin(email, password);

      if (result.success && result.user) {
        toast({
          title: "Login Successful",
          description: `Welcome, Super Administrator`,
        });

        // Navigate to super admin dashboard
        navigate("/super-admin");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid credentials. Please check your email and password.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background">

      {/* Animated Patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse-glow delay-1000" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-purple-500/20 animate-slide-up">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <RotatingLogo className="w-56 h-56" />
              <div className="absolute -top-2 -right-2 bg-purple-600 rounded-full p-2 border-2 border-background">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-400 mb-2 flex items-center justify-center gap-2">
              <Shield className="w-8 h-8" />
              Super Admin Portal
            </h1>
            <p className="text-muted-foreground">Tanzania Wildlife Management Authority</p>
            <p className="text-xs text-purple-300/80 mt-2">Elevated Access Control</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Super Admin Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., superadmin@tawa.go.tz"
                required
                className="border-purple-500/30 focus:border-purple-500"
              />
              <p className="text-xs text-muted-foreground">
                Enter your Super Admin email address
              </p>
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
                className="border-purple-500/30 focus:border-purple-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-6 text-lg shadow-lg"
            >
              <Shield className="w-5 h-5 mr-2" />
              Access Super Admin Panel
            </Button>
          </form>
        </div>

        {/* Bottom Badge */}
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-foreground/70 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-500/30 inline-flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500" />
            Secured Super Admin Access - TAWA IT Department
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;

