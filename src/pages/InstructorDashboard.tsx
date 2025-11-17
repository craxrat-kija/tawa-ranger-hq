import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RotatingLogo } from "@/components/RotatingLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Chatbot } from "@/components/Chatbot";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import Materials from "./Materials";
import Gallery from "./Gallery";
import Timetable from "./Timetable";
import Instructors from "./Instructors";
import ChatBoard from "./ChatBoard";
import ViewTrainees from "./ViewTrainees";
import {
  Upload,
  Calendar,
  FileText,
  LogOut,
  Menu,
  X,
  BookOpen,
  Users,
  ClipboardCheck,
  MessageSquare,
  Image,
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import tawaBackground from "@/assets/tawa-background.jpg";

const InstructorDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    { icon: BookOpen, label: "My Courses", path: "/instructor" },
    { icon: Users, label: "View Trainees", path: "/instructor/trainees" },
    { icon: Upload, label: "Materials", path: "/instructor/materials" },
    { icon: Image, label: "Gallery", path: "/instructor/gallery" },
    { icon: Calendar, label: "Timetable", path: "/instructor/timetable" },
    { icon: Users, label: "Instructors", path: "/instructor/instructors" },
    { icon: MessageSquare, label: "Chat Board", path: "/instructor/chat" },
    { icon: ClipboardCheck, label: "Assessment", path: "/instructor/assessment" },
    { icon: FileText, label: "Performance", path: "/instructor/performance" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-64 bg-slate-900`}
      >
        <div className="relative h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <RotatingLogo className="w-12 h-12" />
              <div>
                <h2 className="text-white font-bold text-xl">TAWA</h2>
                <p className="text-white/80 text-sm">Instructor Portal</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/20 rounded-lg transition-colors group"
              >
                <item.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-base">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="mb-3 text-white">
              <p className="font-semibold text-base">{user?.name}</p>
              <p className="text-sm text-white/80">Instructor</p>
            </div>
            <Button
              variant="ghost"
              className="w-full text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 lg:hidden z-50"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X /> : <Menu />}
      </Button>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-cover bg-center border-b border-border p-6 sticky top-0 z-10" style={{ backgroundImage: `url(${tawaBackground})` }}>
          <div className="absolute inset-0 bg-gradient-military/70" />
          <div className="relative flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">TAWA Instructor Dashboard</h1>
            <ThemeToggle />
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<InstructorHome />} />
            <Route path="/trainees" element={<ViewTrainees />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/instructors" element={<Instructors />} />
            <Route path="/chat" element={<ChatBoard />} />
          </Routes>
        </div>
      </main>

      <Chatbot />
    </div>
  );
};

// Instructor Home Component
const InstructorHome = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleQuickAction = (action: string) => {
    switch(action) {
      case "Upload Materials":
        navigate("/instructor/materials");
        break;
      case "My Courses":
        navigate("/instructor");
        break;
      case "View Timetable":
        navigate("/instructor/timetable");
        break;
      case "Performance Reports":
        toast({
          title: "Performance Reports",
          description: "Generating your performance reports...",
        });
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="animate-slide-up">
        <h2 className="text-3xl font-bold text-primary mb-2">
          Welcome, Instructor {user?.name}!
        </h2>
        <p className="text-muted-foreground">
          Empower the next generation of wildlife conservation officers.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedCounter end={8} label="My Courses" icon={BookOpen} delay={0} />
        <AnimatedCounter end={124} label="My Students" icon={Users} delay={100} />
        <AnimatedCounter end={87} label="Uploaded Materials" icon={FileText} delay={200} />
        <AnimatedCounter end={15} label="Pending Reviews" icon={ClipboardCheck} delay={300} />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Upload, label: "Upload Materials", color: "bg-purple-500", type: "navigate" },
            { icon: BookOpen, label: "My Courses", color: "bg-green-500", type: "navigate" },
            { icon: Calendar, label: "View Timetable", color: "bg-orange-500", type: "navigate" },
            { icon: FileText, label: "Performance Reports", color: "bg-red-500", type: "modal" },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickAction(action.label)}
              className="group bg-card border border-border rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105 animate-slide-up text-left cursor-pointer"
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
    </div>
  );
};

export default InstructorDashboard;
