import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RotatingLogo } from "@/components/RotatingLogo";
import { LogIn, BookOpen, Settings, ArrowRight } from "lucide-react";
import tawaBackground from "@/assets/tawa-background.jpg";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isSetup, setIsSetup] = useState(false);

  // Check if system is set up
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/setup/check`);
        const data = await response.json();
        setIsSetup(data.is_setup === true);
      } catch (error) {
        console.error('Error checking setup:', error);
        setIsSetup(false);
      } finally {
        setIsCheckingSetup(false);
      }
    };
    checkSetup();
  }, []);

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RotatingLogo className="w-20 h-20 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <RotatingLogo className="w-32 h-32" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">TAWA Training System</h1>
          <p className="text-xl text-white/90">Tanzania Wildlife Management Authority</p>
          <p className="text-lg text-white/80 mt-2">Ranger Training Headquarters</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Create New Course/Admin Card - Primary action, always visible */}
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-2 hover:border-primary/50 transition-all hover:shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-green-500/10 rounded-full">
                  <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Create New Course</CardTitle>
              <CardDescription className="text-center">
                Set up a new administrator account and create your own training course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Each administrator gets their own isolated course with complete data separation. 
                Create your admin account and course to get started.
              </p>
              <Button 
                onClick={() => navigate("/setup")}
                className="w-full bg-gradient-military hover:opacity-90 text-white font-semibold py-6 text-lg"
                size="lg"
              >
                Create New Course & Admin
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Login Card - Show when at least one admin exists */}
          {isSetup && (
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-2 hover:border-primary/50 transition-all hover:shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <LogIn className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">Login to System</CardTitle>
                <CardDescription className="text-center">
                  Access your dashboard and manage your training course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6 text-center">
                  Login with your registered admin credentials to access your course dashboard
                </p>
                <Button 
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-military hover:opacity-90 text-white font-semibold py-6 text-lg"
                  size="lg"
                >
                  Go to Login
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/80 text-sm">
          <p>Secured by TAWA IT Department</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

