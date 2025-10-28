import { AnimatedCounter } from "@/components/AnimatedCounter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Chatbot } from "@/components/Chatbot";
import { RotatingLogo } from "@/components/RotatingLogo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Upload,
  BookOpen,
  Calendar,
  Users,
  FileText,
  BarChart3,
  LogOut,
  ClipboardCheck,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import tawaBackground from "@/assets/tawa-background.jpg";

const InstructorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { icon: Upload, label: "Upload Materials", path: "/instructor/upload", color: "bg-purple-500" },
    { icon: BookOpen, label: "My Courses", path: "/instructor/courses", color: "bg-green-500" },
    { icon: Calendar, label: "View Timetable", path: "/instructor/timetable", color: "bg-orange-500" },
    { icon: BarChart3, label: "Performance Reports", path: "/instructor/performance", color: "bg-red-500" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="relative bg-cover bg-center border-b border-border"
        style={{ backgroundImage: `url(${tawaBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-military/95" />
        <div className="relative z-10 container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RotatingLogo className="w-16 h-16" />
              <div>
                <h1 className="text-2xl font-bold text-white">TAWA Instructor Portal</h1>
                <p className="text-white/80 text-sm">Training Excellence Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="text-right text-white">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-white/80">Instructor</p>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-slide-up">
          <h2 className="text-3xl font-bold text-primary mb-2">
            Welcome, Instructor {user?.name}!
          </h2>
          <p className="text-muted-foreground">
            Empower the next generation of wildlife conservation officers.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnimatedCounter end={8} label="My Courses" icon={BookOpen} delay={0} />
          <AnimatedCounter end={124} label="My Students" icon={Users} delay={100} />
          <AnimatedCounter end={87} label="Uploaded Materials" icon={FileText} delay={200} />
          <AnimatedCounter end={15} label="Pending Reviews" icon={ClipboardCheck} delay={300} />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className="group bg-card border border-border rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105 text-left animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-lg">{action.label}</h4>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Schedule & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Schedule
            </h3>
            <div className="space-y-3">
              {[
                { time: "08:00 - 10:00", subject: "Parade & Protocol", course: "Recruit Course" },
                { time: "10:30 - 12:00", subject: "Weaponry Training", course: "Special Course" },
                { time: "14:00 - 16:00", subject: "Field Craft", course: "Transformation" },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold">{item.subject}</span>
                    <span className="text-xs text-accent">{item.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.course}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Recent Feedback
            </h3>
            <div className="space-y-3">
              {[
                { student: "Trainee John M.", message: "Excellent weapons safety instruction", rating: 5 },
                { student: "Trainee Sarah K.", message: "Clear field craft demonstrations", rating: 5 },
                { student: "Trainee David L.", message: "Very engaging patrol training", rating: 4 },
              ].map((feedback, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{feedback.student}</span>
                    <div className="flex gap-1">
                      {[...Array(feedback.rating)].map((_, i) => (
                        <span key={i} className="text-accent">★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{feedback.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Chatbot />
    </div>
  );
};

export default InstructorDashboard;
