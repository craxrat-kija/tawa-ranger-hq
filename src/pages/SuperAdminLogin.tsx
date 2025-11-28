import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RotatingLogo } from "@/components/RotatingLogo";
import { Lock, Mail, User, Shield, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SuperAdminLogin = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { superAdminLogin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Super Admin credentials (for development/testing)
  const credentials = [
    { role: "Super Admin", user_id: "superadmin@tawa.go.tz", password: "superadmin2024", color: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" },
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

  const fillCredentials = (credUserId: string, credPassword: string) => {
    setUserId(credUserId);
    setPassword(credPassword);
    setShowCredentials(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await superAdminLogin(userId, password);
      
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
          description: "Invalid credentials. Please check your User ID and password.",
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
              <RotatingLogo className="w-32 h-32" />
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
              <Label htmlFor="user_id" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Super Admin User ID
              </Label>
              <Input
                id="user_id"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g., superadmin@tawa.go.tz"
                required
                className="border-purple-500/30 focus:border-purple-500"
              />
              <p className="text-xs text-muted-foreground">
                Enter your Super Admin credentials
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

          {/* Credentials Section */}
          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-purple-500/30 hover:bg-purple-500/10"
              onClick={() => setShowCredentials(!showCredentials)}
            >
              <Shield className="w-4 h-4 mr-2" />
              {showCredentials ? "Hide" : "Show"} Super Admin Credentials
            </Button>

            {showCredentials && (
              <Card className="bg-card/50 border-purple-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Super Admin Account
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Click on the credential to auto-fill the login form
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {credentials.map((cred, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${cred.color}`}
                      onClick={() => fillCredentials(cred.user_id, cred.password)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4" />
                            <span className="font-semibold text-sm">{cred.role}</span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" />
                              <span className="font-mono">{cred.user_id}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(cred.user_id, index * 2);
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

          {/* Link to regular login */}
          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="ghost"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/login")}
            >
              Regular User Login →
            </Button>
          </div>
        </div>

        {/* Bottom Badge */}
        <div className="mt-4 text-center text-white/80 text-sm">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Secured Super Admin Access - TAWA IT Department
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;

