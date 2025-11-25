import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RotatingLogo } from "@/components/RotatingLogo";
import { Lock, Mail, User, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import tawaBackground from "@/assets/tawa-background.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const credentials = [
    { role: "Admin", email: "admin@tawa.go.tz", password: "tawa2024", color: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" },
    { role: "Instructor", email: "instructor@tawa.go.tz", password: "tawa2024", color: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" },
    { role: "Doctor", email: "doctor@tawa.go.tz", password: "tawa2024", color: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" },
  ];

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({
      title: "Copied!",
      description: "Credentials copied to clipboard",
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const fillCredentials = (credEmail: string, credPassword: string) => {
    setEmail(credEmail);
    setPassword(credPassword);
    setShowCredentials(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await login(email, password);
      
      if (result.success && result.user) {
        toast({
          title: "Login Successful",
          description: `Welcome to TAWA Training Portal`,
        });
        
        // Navigate based on actual user role from login response
        const userRole = result.user.role;
        
        // Trainees cannot login to the system
        if (userRole === "trainee") {
          toast({
            title: "Access Denied",
            description: "Trainees do not have access to the login system. Please contact your administrator.",
            variant: "destructive",
          });
          return;
        }
        
        if (userRole === "admin") {
          navigate("/admin");
        } else if (userRole === "doctor") {
          navigate("/doctor");
        } else if (userRole === "instructor") {
          navigate("/instructor");
        } else {
          navigate("/instructor"); // default
        }
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

          {/* Credentials Section */}
          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowCredentials(!showCredentials)}
            >
              <User className="w-4 h-4 mr-2" />
              {showCredentials ? "Hide" : "Show"} Login Credentials
            </Button>

            {showCredentials && (
              <Card className="bg-card/50 border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Available Accounts</CardTitle>
                  <CardDescription className="text-xs">
                    Click on any credential to auto-fill the login form
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {credentials.map((cred, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${cred.color}`}
                      onClick={() => fillCredentials(cred.email, cred.password)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{cred.role}</span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <span className="font-mono">{cred.email}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(cred.email, index * 2);
                                }}
                                className="ml-auto p-1 hover:bg-white/20 rounded"
                              >
                                {copiedIndex === index * 2 ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Lock className="w-3 h-3" />
                              <span className="font-mono">{cred.password}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(cred.password, index * 2 + 1);
                                }}
                                className="ml-auto p-1 hover:bg-white/20 rounded"
                              >
                                {copiedIndex === index * 2 + 1 ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
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
