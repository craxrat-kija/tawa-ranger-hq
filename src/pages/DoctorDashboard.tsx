import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCourse } from "@/contexts/CourseContext";
import { usePatients } from "@/contexts/PatientContext";
import { usersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RotatingLogo } from "@/components/RotatingLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Chatbot } from "@/components/Chatbot";
import { NotificationBar } from "@/components/NotificationBar";
import ViewTrainees from "./ViewTrainees";
import PatientManagement from "./PatientManagement";
import {
  Users,
  LogOut,
  Menu,
  X,
  Heart,
  UserPlus,
  FileHeart,
  Activity,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const DoctorDashboard = () => {
  const { logout, user } = useAuth();
  const { selectedCourse, setSelectedCourse } = useCourse();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { icon: Heart, label: "Dashboard", path: "/doctor" },
    { icon: Users, label: "View Trainees", path: "/doctor/trainees" },
    { icon: UserPlus, label: "Register Patient", path: "/doctor/register" },
    { icon: FileHeart, label: "Patient Management", path: "/doctor/patients" },
    { icon: FileHeart, label: "Health Records", path: "/doctor/records" },
  ];

  // Close sidebar when clicking outside on mobile
  const handleSidebarClick = (e: React.MouseEvent) => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-background relative">
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-64 bg-gradient-to-b from-[hsl(120,30%,18%)] via-[hsl(120,30%,16%)] to-[hsl(120,30%,14%)] relative overflow-hidden`}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(120,40%,25%)]/20 via-transparent to-[hsl(45,50%,30%)]/10 animate-gradient-shift bg-[length:200%_200%]" />
        
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(120,50%,50%)] to-transparent animate-shimmer" />
        
        <div className="relative h-full flex flex-col z-10">
          {/* Logo Section */}
          <div className="p-6 border-b border-[hsl(120,30%,25%)]/30 bg-gradient-to-r from-[hsl(120,35%,25%)]/30 via-[hsl(120,40%,30%)]/20 to-transparent relative overflow-hidden">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3 animate-fade-in-up">
                <div className="relative">
                  <RotatingLogo className="w-12 h-12 animate-glow-pulse" />
                  <div className="absolute inset-0 rounded-full bg-[hsl(120,50%,50%)]/30 blur-xl animate-pulse-glow" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl drop-shadow-lg animate-scale-in" style={{ animationDelay: "0.1s" }}>
                    TAWA
                  </h2>
                  <p className="text-white/90 text-sm drop-shadow-md animate-scale-in" style={{ animationDelay: "0.2s" }}>
                    Medical Portal
                  </p>
                </div>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:border-white/50"
                aria-label="Close sidebar"
              >
                <X size={20} className="drop-shadow-lg" />
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                onClick={handleSidebarClick}
                className="relative flex items-center gap-3 px-4 py-3 text-white hover:bg-gradient-to-r hover:from-[hsl(120,40%,28%)] hover:via-[hsl(120,45%,30%)] hover:to-[hsl(120,40%,28%)] rounded-lg transition-all duration-300 group border border-transparent hover:border-[hsl(120,50%,40%)]/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-[hsl(120,50%,50%)]/0 group-hover:bg-[hsl(120,50%,50%)]/10 blur-sm transition-all duration-300" />
                <item.icon className="w-6 h-6 group-hover:scale-125 transition-all duration-300 relative z-10 drop-shadow-lg group-hover:drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                <span className="font-medium text-base relative z-10 group-hover:font-semibold transition-all">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-[hsl(120,30%,25%)]/30 bg-gradient-to-r from-transparent via-[hsl(120,35%,25%)]/20 to-[hsl(120,35%,25%)]/30 relative">
            {/* Glow effect */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[hsl(120,50%,50%)] to-transparent opacity-50" />
            <div className="mb-3 text-white relative z-10">
              <p className="font-semibold text-base drop-shadow-lg animate-fade-in-up">{user?.name}</p>
              <p className="text-sm text-white/90 drop-shadow-md animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                {user?.user_id || user?.email}
              </p>
            </div>
            {user?.course_name && (
              <div className="mb-3 px-3 py-2 bg-gradient-to-r from-white/10 via-white/15 to-white/10 rounded-lg border border-white/30 shadow-lg backdrop-blur-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-300 relative overflow-hidden group animate-scale-in">
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <div className="flex items-center gap-2 text-white relative z-10">
                  <BookOpen className="w-4 h-4 text-white/90 drop-shadow-md group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs text-white/80">Course</p>
                    <p className="text-sm font-semibold drop-shadow-md">{user.course_name}</p>
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full text-white hover:bg-gradient-to-r hover:from-white/20 hover:via-white/25 hover:to-white/20 border border-transparent hover:border-white/30 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-[1.02] relative overflow-hidden group"
              onClick={handleLogout}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <LogOut className="w-5 h-5 mr-2 relative z-10 group-hover:scale-110 transition-transform drop-shadow-md" />
              <span className="relative z-10">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="relative bg-gradient-to-r from-[hsl(120,35%,22%)] via-[hsl(120,30%,20%)] to-[hsl(120,25%,18%)] text-white border-b border-[hsl(120,30%,15%)] p-4 shadow-lg overflow-hidden">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(120,40%,25%)]/30 via-[hsl(120,35%,22%)]/20 to-[hsl(120,30%,20%)]/30 animate-gradient-shift bg-[length:200%_100%]" />
          
          {/* Glow line at top */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[hsl(120,50%,50%)] to-transparent opacity-60 animate-shimmer" />
          
          <div className="flex items-center justify-between gap-2 w-full relative z-10">
            {/* Mobile toggle button - always visible on mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white flex-shrink-0 shadow-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:border-white/50 relative overflow-hidden group"
              aria-label="Toggle sidebar"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-[hsl(120,50%,50%)]/0 group-hover:bg-[hsl(120,50%,50%)]/20 blur-sm transition-all duration-300" />
              <Menu size={24} className="drop-shadow-lg relative z-10 group-hover:animate-pulse" />
            </button>
            
            {/* Title and course info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white truncate drop-shadow-lg animate-fade-in-up relative">
                <span className="relative z-10">TAWA Medical Officer Portal</span>
                <span className="absolute inset-0 text-[hsl(120,50%,50%)] blur-sm opacity-50 animate-pulse-glow">TAWA Medical Officer Portal</span>
              </h1>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {selectedCourse ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-white/20 via-white/25 to-white/20 rounded-lg border border-white/40 backdrop-blur-sm shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-105 relative overflow-hidden group animate-scale-in">
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <BookOpen className="w-4 h-4 text-white flex-shrink-0 relative z-10 drop-shadow-md group-hover:scale-110 transition-transform" />
                    <span className="text-white font-semibold text-sm truncate relative z-10 drop-shadow-md">{selectedCourse.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCourse(null);
                        navigate("/select-course");
                      }}
                      className="text-white/90 hover:text-white hover:bg-white/30 h-6 px-2 ml-2 hidden sm:inline-flex relative z-10 border border-white/20 hover:border-white/40 transition-all hover:scale-110"
                    >
                      <RefreshCw className="w-3 h-3 mr-1 group-hover:rotate-180 transition-transform duration-500" />
                      Switch Course
                    </Button>
                  </div>
                ) : user?.course_name ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-white/20 via-white/25 to-white/20 rounded-lg border border-white/40 backdrop-blur-sm shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-105 relative overflow-hidden group animate-scale-in">
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <BookOpen className="w-4 h-4 text-white flex-shrink-0 relative z-10 drop-shadow-md group-hover:scale-110 transition-transform" />
                    <span className="text-white font-semibold text-sm truncate relative z-10 drop-shadow-md">{user.course_name}</span>
                  </div>
                ) : null}
              </div>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <NotificationBar />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<DoctorHome />} />
            <Route path="/trainees" element={<ViewTrainees />} />
            <Route path="/register" element={<RegisterUser />} />
            <Route path="/patients" element={<PatientManagement />} />
            <Route path="/records" element={<HealthRecords />} />
          </Routes>
        </main>
      </div>

      <Chatbot />
    </div>
  );
};

// Dashboard Home Component
const DoctorHome = () => {
  const navigate = useNavigate();
  const { patients, reports, attendance } = usePatients();

  // Calculate real statistics
  const totalPatients = patients.length;
  const totalReports = reports.length;
  const recentReports = reports.filter((r: any) => {
    const reportDate = new Date(r.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return reportDate >= weekAgo;
  }).length;
  const pendingCases = patients.length > 0 ? Math.max(0, totalPatients - totalReports) : 0;

  const handleNavigate = (path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  return (
    <div className="space-y-6" style={{ position: 'relative', zIndex: 1 }}>
      <div className="animate-fade-in-up">
        <h2 className="text-3xl font-bold mb-2 relative">
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-shift drop-shadow-lg">
            Medical Dashboard
          </span>
          <span className="absolute inset-0 text-primary blur-sm opacity-50 animate-pulse-glow">Medical Dashboard</span>
        </h2>
        <p className="text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Manage trainee health records and registrations
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border-primary/30 shadow-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all duration-300 hover:scale-105 overflow-hidden group animate-fade-in-up">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium drop-shadow-sm">Total Registered</CardTitle>
            <Users className="w-5 h-5 text-primary drop-shadow-lg group-hover:scale-125 group-hover:animate-pulse-glow transition-all duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-primary drop-shadow-md animate-counter">{totalPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">Active patients</p>
          </CardContent>
        </Card>

        <Card className="relative bg-gradient-to-br from-accent/15 via-accent/10 to-accent/5 border-accent/30 shadow-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all duration-300 hover:scale-105 overflow-hidden group animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium drop-shadow-sm">Health Checks</CardTitle>
            <Activity className="w-5 h-5 text-accent drop-shadow-lg group-hover:scale-125 group-hover:animate-pulse-glow transition-all duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-accent drop-shadow-md animate-counter">{recentReports}</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>

        <Card className="relative bg-gradient-to-br from-destructive/15 via-destructive/10 to-destructive/5 border-destructive/30 shadow-lg hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-105 overflow-hidden group animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium drop-shadow-sm">Pending Cases</CardTitle>
            <FileHeart className="w-5 h-5 text-destructive drop-shadow-lg group-hover:scale-125 group-hover:animate-pulse-glow transition-all duration-300" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-destructive drop-shadow-md animate-counter">{pendingCases}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="relative overflow-hidden border-2 shadow-xl animate-fade-in-up" style={{ position: 'relative', zIndex: 2, animationDelay: "0.3s" }}>
        {/* Background gradient animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 animate-gradient-shift bg-[length:200%_200%]" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-shift">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-muted-foreground">Common medical tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          <Button 
            type="button"
            className="w-full h-20 text-lg bg-gradient-military cursor-pointer relative overflow-hidden group shadow-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all duration-300 hover:scale-105 border-2 border-primary/30 hover:border-primary/60"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigate("/doctor/register");
            }}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            <UserPlus className="w-6 h-6 mr-2 relative z-10 drop-shadow-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
            <span className="relative z-10 font-semibold drop-shadow-md">Register Patient</span>
          </Button>
          <Button 
            type="button"
            variant="outline" 
            className="w-full h-20 text-lg cursor-pointer relative overflow-hidden group border-2 hover:border-accent/50 hover:bg-accent/10 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-[0_0_25px_rgba(34,197,94,0.3)]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigate("/doctor/patients");
            }}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <FileHeart className="w-6 h-6 mr-2 relative z-10 text-accent group-hover:scale-125 group-hover:animate-pulse-glow transition-all duration-300" />
            <span className="relative z-10 font-semibold">Manage Patients</span>
          </Button>
          <Button 
            type="button"
            variant="outline" 
            className="w-full h-20 text-lg cursor-pointer relative overflow-hidden group border-2 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-[0_0_25px_rgba(34,197,94,0.3)]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigate("/doctor/records");
            }}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <FileHeart className="w-6 h-6 mr-2 relative z-10 text-primary group-hover:scale-125 group-hover:animate-pulse-glow transition-all duration-300" />
            <span className="relative z-10 font-semibold">Health Records</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Register User Component
const RegisterUser = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCourse } = useCourse();
  const { addPatient, refreshData } = usePatients();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bloodType: "",
    allergies: "",
    medicalHistory: "",
    emergencyContact: "",
  });

  // Get the doctor's course ID
  const doctorCourseId = selectedCourse?.id || user?.course_id;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    if (!doctorCourseId) {
      toast({
        title: "Course Required",
        description: "You must be assigned to a course to search for patients.",
        variant: "destructive",
      });
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search users from the doctor's course only
      const allUsers = await usersApi.getAll();
      const filtered = allUsers.filter((user: any) => {
        // Only include users from the doctor's course
        const userCourseId = user.course_id || user.course?.id;
        if (userCourseId !== doctorCourseId) {
          return false;
        }

        const searchLower = query.toLowerCase();
        return (
          (user.name && String(user.name).toLowerCase().includes(searchLower)) ||
          (user.email && String(user.email).toLowerCase().includes(searchLower)) ||
          (user.user_id && String(user.user_id).toLowerCase().includes(searchLower)) ||
          (user.phone && String(user.phone).toLowerCase().includes(searchLower))
        );
      });
      setSearchResults(filtered.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
    // Pre-fill emergency contact if available
    if (!formData.emergencyContact && user.phone) {
      setFormData(prev => ({ ...prev, emergencyContact: user.phone }));
    }
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setFormData({
      bloodType: "",
      allergies: "",
      medicalHistory: "",
      emergencyContact: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast({
        title: "No User Selected",
        description: "Please search and select a user first",
        variant: "destructive",
      });
      return;
    }

    if (!formData.emergencyContact) {
      toast({
        title: "Missing Information",
        description: "Emergency contact is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addPatient({
        fullName: selectedUser.name,
        email: selectedUser.email || "",
        phone: selectedUser.phone || "",
        bloodType: formData.bloodType || "Unknown",
        allergies: formData.allergies || "None",
        medicalHistory: formData.medicalHistory || "None",
        emergencyContact: formData.emergencyContact,
        userId: selectedUser.id, // Pass user ID to link the patient record
      });

      // Refresh data after adding patient
      await refreshData();

      toast({
        title: "Patient Registered",
        description: `${selectedUser.name} has been registered as a patient successfully`,
      });
      
      // Reset form
      setSelectedUser(null);
      setFormData({
        bloodType: "",
        allergies: "",
        medicalHistory: "",
        emergencyContact: "",
      });
      setSearchQuery("");

      // Navigate to patient management after a short delay
      setTimeout(() => {
        navigate("/doctor/patients");
      }, 1000);
    } catch (error) {
      console.error("Error registering patient:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl">Add Patient Record</CardTitle>
          <CardDescription>Search for an existing user and add their patient information</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedUser ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search User *</Label>
                <Input
                  id="search"
                  name="search"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name, email, user ID, or phone number..."
                  autoComplete="off"
                />
                {isSearching && (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full text-left p-3 hover:bg-muted border-b last:border-b-0 transition-colors"
                    >
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email && <span>{user.email}</span>}
                        {user.user_id && (
                          <span className="ml-2">ID: {user.user_id}</span>
                        )}
                        {user.phone && (
                          <span className="ml-2">Phone: {user.phone}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found. Try a different search term.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Selected User Info */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Selected User</CardTitle>
                      <CardDescription>
                        {selectedUser.name} • {selectedUser.email || selectedUser.user_id}
                        {selectedUser.phone && ` • ${selectedUser.phone}`}
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSelection}
                    >
                      Change
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Patient-specific information */}
              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Input
                  id="bloodType"
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={(e) => handleInputChange('bloodType', e.target.value)}
                  placeholder="e.g., O+, A-, AB+"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Known Allergies</Label>
                <Textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  placeholder="List any known allergies..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                  placeholder="Previous conditions, surgeries, medications..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="Name and phone number"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClearSelection} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-military" disabled={isSubmitting}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Adding..." : "Add Patient Record"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Health Records Component
const HealthRecords = () => {
  const { patients, reports, refreshData } = usePatients();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await refreshData();
      } catch (error) {
        console.error('Failed to load health records:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshData]);

  // Get latest report for each patient
  const patientRecords = patients.map(patient => {
    const patientReports = reports.filter(r => r.patientId === patient.id);
    const latestReport = patientReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return {
      id: patient.id,
      name: patient.fullName,
      bloodType: patient.bloodType,
      lastCheckup: latestReport?.date || "No checkup",
      status: latestReport ? "Healthy" : "No records",
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2">Health Records</h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Health Records</h2>
        <p className="text-muted-foreground">View and manage trainee health information</p>
      </div>

      <div className="grid gap-4">
        {patientRecords.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No health records found
            </CardContent>
          </Card>
        ) : (
          patientRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{record.name}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Blood Type: {record.bloodType}</span>
                    <span>Last Checkup: {record.lastCheckup}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      record.status === "Healthy"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : record.status === "Follow-up required"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
