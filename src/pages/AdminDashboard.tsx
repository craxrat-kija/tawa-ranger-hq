import { AnimatedCounter } from "@/components/AnimatedCounter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Chatbot } from "@/components/Chatbot";
import { RotatingLogo } from "@/components/RotatingLogo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  Upload,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  GraduationCap,
  Shield,
  Award,
  Target,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import tawaBackground from "@/assets/tawa-background.jpg";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { icon: Users, label: "Register Users", path: "/admin/users", color: "bg-blue-500" },
    { icon: BookOpen, label: "Manage Courses", path: "/admin/courses", color: "bg-green-500" },
    { icon: Upload, label: "Upload Materials", path: "/admin/materials", color: "bg-purple-500" },
    { icon: Calendar, label: "Timetables", path: "/admin/timetable", color: "bg-orange-500" },
    { icon: BarChart3, label: "Performance", path: "/admin/performance", color: "bg-red-500" },
    { icon: Settings, label: "Settings", path: "/admin/settings", color: "bg-gray-500" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Sidebar Background */}
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
                <h1 className="text-2xl font-bold text-white">TAWA Admin Portal</h1>
                <p className="text-white/80 text-sm">System Administrator Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="text-right text-white">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-white/80">{user?.email}</p>
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
            Welcome back, {user?.name}!
          </h2>
          <p className="text-muted-foreground">
            Manage your paramilitary training programs with precision and excellence.
          </p>
        </div>

        {/* Statistics Counters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnimatedCounter end={45} label="Total Instructors" icon={Users} delay={0} />
          <AnimatedCounter end={312} label="Active Trainees" icon={GraduationCap} delay={100} />
          <AnimatedCounter end={28} label="Active Courses" icon={BookOpen} delay={200} />
          <AnimatedCounter end={486} label="Course Materials" icon={FileText} delay={300} />
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className="group relative bg-card border border-border rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105 text-left animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-lg text-foreground mb-1">
                  {action.label}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Manage and oversee {action.label.toLowerCase()}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Types Overview */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Course Types Overview
            </h3>
            <div className="space-y-4">
              {[
                { name: "Transformation Course", count: 8, color: "bg-blue-500" },
                { name: "Special Course", count: 6, color: "bg-purple-500" },
                { name: "Recruit Course", count: 10, color: "bg-green-500" },
                { name: "Refresher Course", count: 4, color: "bg-orange-500" },
              ].map((course, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className={`${course.color} w-3 h-3 rounded-full`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{course.name}</span>
                      <span className="text-sm text-muted-foreground">{course.count} Active</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`${course.color} h-full transition-all duration-1000`}
                        style={{ width: `${(course.count / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Highlights */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Highlights
            </h3>
            <div className="space-y-4">
              {[
                { metric: "Average Pass Rate", value: "87.5%", trend: "up" },
                { metric: "Course Completion", value: "92.3%", trend: "up" },
                { metric: "Instructor Rating", value: "4.7/5", trend: "up" },
                { metric: "Material Usage", value: "94.2%", trend: "up" },
              ].map((stat, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{stat.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{stat.value}</span>
                    <Award className="w-4 h-4 text-accent" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default AdminDashboard;
