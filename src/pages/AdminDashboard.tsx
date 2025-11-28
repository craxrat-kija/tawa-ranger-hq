import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RotatingLogo } from "@/components/RotatingLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Chatbot } from "@/components/Chatbot";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { NotificationBar } from "@/components/NotificationBar";
import Materials from "./Materials";
import Gallery from "./Gallery";
import Timetable from "./Timetable";
import Reports from "./Reports";
import Instructors from "./Instructors";
import ChatBoard from "./ChatBoard";
import RegisterUsers from "./RegisterUsers";
import Courses from "./Courses";
import Assessments from "./Assessments";
import Results from "./Results";
import Subjects from "./Subjects";
import DoctorActivities from "./DoctorActivities";
import AdminDoctorView from "./AdminDoctorView";
import {
  Users,
  BookOpen,
  Upload,
  Calendar,
  FileText,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Target,
  Shield,
  Award,
  TrendingUp,
  Image,
  MessageSquare,
  ClipboardCheck,
  Activity,
  Stethoscope,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import tawaBackground from "@/assets/tawa-background.jpg";

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    { icon: Users, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "All Users", path: "/admin/users" },
    { icon: Users, label: "Register Users", path: "/admin/users" },
    { icon: BookOpen, label: "Subjects", path: "/admin/subjects" },
    { icon: BookOpen, label: "Courses", path: "/admin/courses" },
    { icon: Upload, label: "Materials", path: "/admin/materials" },
    { icon: Image, label: "Gallery", path: "/admin/gallery" },
    { icon: Calendar, label: "Timetable", path: "/admin/timetable" },
    { icon: FileText, label: "Reports", path: "/admin/reports" },
    { icon: Users, label: "Instructors", path: "/admin/instructors" },
    { icon: MessageSquare, label: "Chat Board", path: "/admin/chat" },
    { icon: ClipboardCheck, label: "Assessments", path: "/admin/assessments" },
    { icon: FileText, label: "Results", path: "/admin/results" },
    { icon: Activity, label: "Doctor Activities", path: "/admin/activities" },
    { icon: Stethoscope, label: "Doctor Dashboard View", path: "/admin/doctor-view" },
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
                <p className="text-white/80 text-sm">Admin Portal</p>
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
              <p className="text-sm text-white/80">{user?.user_id || user?.email}</p>
            </div>
            {user?.course_name && (
              <div className="mb-3 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 text-white">
                  <BookOpen className="w-4 h-4 text-white/80" />
                  <div>
                    <p className="text-xs text-white/70">Course</p>
                    <p className="text-sm font-semibold">{user.course_name}</p>
                  </div>
                </div>
              </div>
            )}
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
            <div>
              <h1 className="text-3xl font-bold text-white">TAWA Admin Dashboard</h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-white/80 text-sm">Manage courses, users, and system configuration</p>
                {user?.course_name && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg border border-white/30 backdrop-blur-sm">
                    <BookOpen className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm">{user.course_name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBar />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/users" element={<RegisterUsers />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/instructors" element={<Instructors />} />
            <Route path="/trainees" element={<RegisterUsers />} />
            <Route path="/chat" element={<ChatBoard />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/results" element={<Results />} />
            <Route path="/activities" element={<DoctorActivities />} />
            <Route path="/doctor-view" element={<AdminDoctorView />} />
          </Routes>
        </div>
      </main>

      <Chatbot />
    </div>
  );
};

// Dashboard Home Component
const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleQuickAction = (action: string) => {
    switch(action) {
      case "Register Users":
        navigate("/admin/users");
        break;
      case "Manage Courses":
        navigate("/admin/courses");
        break;
      case "Upload Materials":
        navigate("/admin/materials");
        break;
      case "Create Timetable":
        navigate("/admin/timetable");
        break;
      case "Generate Reports":
        navigate("/admin/reports");
        break;
      case "Manage Gallery":
        navigate("/admin/gallery");
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
          Welcome back, {user?.name}!
        </h2>
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            Manage your paramilitary training programs with precision and excellence.
          </p>
          {user?.course_name && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{user.course_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedCounter end={0} label="Total Instructors" icon={Users} delay={0} />
        <AnimatedCounter end={0} label="Active Trainees" icon={GraduationCap} delay={100} />
        <AnimatedCounter end={0} label="Active Courses" icon={BookOpen} delay={200} />
        <AnimatedCounter end={0} label="Course Materials" icon={FileText} delay={300} />
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Users, label: "Register Users", color: "bg-blue-500" },
            { icon: BookOpen, label: "Manage Courses", color: "bg-green-500" },
            { icon: Upload, label: "Upload Materials", color: "bg-purple-500" },
            { icon: Calendar, label: "Create Timetable", color: "bg-orange-500" },
            { icon: FileText, label: "Generate Reports", color: "bg-red-500" },
            { icon: Image, label: "Manage Gallery", color: "bg-pink-500" },
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

      {/* Recent Activity & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Types Overview */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Course Types Overview
          </h3>
          <div className="space-y-4">
            {[].length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No course data available. Course statistics will appear here once courses are created.
              </p>
            ) : (
              [].map((course, idx) => (
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
              ))
            )}
          </div>
        </div>

        {/* Performance Highlights */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Highlights
          </h3>
          <div className="space-y-4">
            {[].length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No performance data available. Performance metrics will appear here once data is collected.
              </p>
            ) : (
              [].map((stat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">{stat.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{stat.value}</span>
                  <Award className="w-4 h-4 text-accent" />
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
