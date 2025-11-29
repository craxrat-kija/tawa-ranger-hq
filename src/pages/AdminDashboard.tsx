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
import ChatBoard from "./ChatBoard";
import RegisterUsers from "./RegisterUsers";
import Assessments from "./Assessments";
import Results from "./Results";
import Subjects from "./Subjects";
import DoctorActivities from "./DoctorActivities";
import AdminDoctorView from "./AdminDoctorView";
import Setup from "./Setup";
import AdminSettings from "./AdminSettings";
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
  PlusCircle,
  MapPin,
  Settings,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { usersApi, materialsApi, coursesApi, subjectsApi, galleryApi, adminPermissionsApi } from "@/lib/api";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    instructors: 0,
    trainees: 0,
    courses: 0,
    materials: 0,
    subjects: 0,
    gallery: 0,
    admins: 0,
    doctors: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [chartData, setChartData] = useState({
    roleDistribution: [],
    materialsByType: [],
    usersOverTime: [],
    courseStats: [],
  });
  const [permissions, setPermissions] = useState<{
    can_manage_users: boolean;
    can_manage_subjects: boolean;
    can_manage_materials: boolean;
    can_manage_gallery: boolean;
    can_manage_timetable: boolean;
    can_manage_reports: boolean;
    can_manage_chat: boolean;
    can_manage_assessments: boolean;
    can_manage_results: boolean;
    can_manage_activities: boolean;
    can_view_doctor_dashboard: boolean;
  } | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isSuperAdmin = user?.role === "super_admin";

  // Helper function to check if a route should be accessible
  const hasPermission = (permissionKey: string | null): boolean => {
    if (isSuperAdmin) return true; // Super admins have all permissions
    if (permissionKey === null) return true; // Always accessible routes
    if (!permissions) return false; // No permissions loaded
    return permissions[permissionKey as keyof typeof permissions] === true;
  };

  useEffect(() => {
    if (user) {
      loadStats();
      if (!isSuperAdmin) {
        loadPermissions();
      } else {
        // Super admins have all permissions by default
        setPermissions({
          can_manage_users: true,
          can_manage_subjects: true,
          can_manage_materials: true,
          can_manage_gallery: true,
          can_manage_timetable: true,
          can_manage_reports: true,
          can_manage_chat: true,
          can_manage_assessments: true,
          can_manage_results: true,
          can_manage_activities: true,
          can_view_doctor_dashboard: true,
        });
        setPermissionsLoading(false);
      }
    }
  }, [user]);

  const loadPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const perms = await adminPermissionsApi.getMyPermissions();
      console.log("Loaded permissions:", perms);
      setPermissions(perms);
    } catch (error) {
      console.error("Failed to load permissions:", error);
      // If no permissions exist, all will be false (default)
      setPermissions({
        can_manage_users: false,
        can_manage_subjects: false,
        can_manage_materials: false,
        can_manage_gallery: false,
        can_manage_timetable: false,
        can_manage_reports: false,
        can_manage_chat: false,
        can_manage_assessments: false,
        can_manage_results: false,
        can_manage_activities: false,
        can_view_doctor_dashboard: false,
      });
    } finally {
      setPermissionsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const usersPromise = usersApi.getAll();
      const materialsPromise = materialsApi.getAll();
      const coursesPromise = isSuperAdmin
        ? coursesApi.getAll()
        : user?.course_id
          ? coursesApi.getById(user.course_id.toString())
          : Promise.resolve([]);
      const subjectsPromise = subjectsApi.getAll();
      const galleryPromise = galleryApi.getAll();

      const [usersData, materialsData, coursesData, subjectsData, galleryData] = await Promise.all([
        usersPromise,
        materialsPromise,
        coursesPromise,
        subjectsPromise,
        galleryPromise,
      ]);

      // Handle different response formats
      const usersArray = Array.isArray(usersData) ? usersData : (usersData?.data || []);
      const materialsArray = Array.isArray(materialsData) ? materialsData : (materialsData?.data || []);
      const coursesArray = Array.isArray(coursesData)
        ? coursesData
        : coursesData
          ? [coursesData]
          : [];
      const subjectsArray = Array.isArray(subjectsData) ? subjectsData : (subjectsData?.data || []);
      const galleryArray = Array.isArray(galleryData) ? galleryData : (galleryData?.data || []);

      // Calculate statistics
      const instructors = usersArray.filter((u: any) => u.role === "instructor").length;
      const trainees = usersArray.filter((u: any) => u.role === "trainee").length;
      const admins = usersArray.filter((u: any) => u.role === "admin").length;
      const doctors = usersArray.filter((u: any) => u.role === "doctor").length;
      const materialsCount = materialsArray.length;
      const coursesCount = coursesArray.length;
      const subjectsCount = subjectsArray.length;
      const galleryCount = galleryArray.length;

      setStats({
        instructors,
        trainees,
        courses: coursesCount,
        materials: materialsCount,
        subjects: subjectsCount,
        gallery: galleryCount,
        admins,
        doctors,
      });

      // Prepare chart data
      // Role Distribution
      const roleDistribution = [
        { name: "Instructors", value: instructors, color: "#3b82f6" },
        { name: "Trainees", value: trainees, color: "#10b981" },
        { name: "Admins", value: admins, color: "#8b5cf6" },
        { name: "Doctors", value: doctors, color: "#f59e0b" },
      ].filter(item => item.value > 0);

      // Materials by Type
      const materialsByTypeMap = new Map<string, number>();
      materialsArray.forEach((material: any) => {
        const type = material.type || "Other";
        materialsByTypeMap.set(type, (materialsByTypeMap.get(type) || 0) + 1);
      });
      const materialsByType = Array.from(materialsByTypeMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));

      // Users over time (simulated - using creation dates if available)
      const usersByMonth = new Map<string, number>();
      usersArray.forEach((user: any) => {
        if (user.created_at) {
          const date = new Date(user.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          usersByMonth.set(monthKey, (usersByMonth.get(monthKey) || 0) + 1);
        }
      });
      const usersOverTime = Array.from(usersByMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([name, value]) => ({ name, users: value }));

      // Course statistics
      const courseStats = coursesArray.map((course: any) => ({
        name: course.name?.substring(0, 15) || "Course",
        trainees: course.enrolled_count || 0,
        instructors: course.instructor_count || 0,
      }));

      setChartData({
        roleDistribution,
        materialsByType,
        usersOverTime: usersOverTime.length > 0 ? usersOverTime : [
          { name: "Current", users: usersArray.length }
        ],
        courseStats: courseStats.length > 0 ? courseStats : [],
      });
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
      setStats({
        instructors: 0,
        trainees: 0,
        courses: 0,
        materials: 0,
        subjects: 0,
        gallery: 0,
        admins: 0,
        doctors: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };
  
  // Determine base path based on role
  const basePath = isSuperAdmin ? "/super-admin" : "/admin";

  // Build menu items based on permissions
  const menuItems = [
    { icon: Users, label: "Dashboard", path: basePath, permission: null }, // Always visible
    ...(isSuperAdmin ? [
      { icon: PlusCircle, label: "Create Course & Admin", path: `${basePath}/setup`, permission: null },
      { icon: Settings, label: "Admin Settings", path: `${basePath}/settings`, permission: null },
    ] : []),
    { icon: Users, label: "Manage Users", path: `${basePath}/users`, permission: "can_manage_users" },
    { icon: BookOpen, label: "Subjects", path: `${basePath}/subjects`, permission: "can_manage_subjects" },
    { icon: Upload, label: "Materials", path: `${basePath}/materials`, permission: "can_manage_materials" },
    { icon: Image, label: "Gallery", path: `${basePath}/gallery`, permission: "can_manage_gallery" },
    { icon: Calendar, label: "Timetable", path: `${basePath}/timetable`, permission: "can_manage_timetable" },
    { icon: FileText, label: "Reports", path: `${basePath}/reports`, permission: "can_manage_reports" },
    { icon: MessageSquare, label: "Chat Board", path: `${basePath}/chat`, permission: "can_manage_chat" },
    { icon: ClipboardCheck, label: "Assessments", path: `${basePath}/assessments`, permission: "can_manage_assessments" },
    { icon: FileText, label: "Results", path: `${basePath}/results`, permission: "can_manage_results" },
    { icon: Activity, label: "Doctor Activities", path: `${basePath}/activities`, permission: "can_manage_activities" },
    { icon: Stethoscope, label: "Doctor Dashboard View", path: `${basePath}/doctor-view`, permission: "can_view_doctor_dashboard" },
  ].filter(item => {
    // Super admins see all items
    if (isSuperAdmin) return true;
    // Regular admins only see items they have permission for
    if (item.permission === null) return true; // Always visible items (Dashboard)
    // Don't show items if permissions are still loading
    if (permissionsLoading || !permissions) return false;
    return permissions[item.permission as keyof typeof permissions] === true;
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-64 bg-gradient-to-b from-[hsl(120,40%,25%)] via-[hsl(45,35%,30%)] to-[hsl(30,40%,22%)]`}
      >
        <div className="relative h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-6 border-b border-[hsl(45,30%,35%)]/40 bg-gradient-to-r from-[hsl(120,45%,30%)]/30 via-[hsl(45,40%,35%)]/20 to-transparent">
            <div className="flex items-center gap-3">
              <RotatingLogo className="w-12 h-12" />
              <div>
                <h2 className="text-white font-bold text-xl">TAWA</h2>
                <p className="text-white/80 text-sm">
                  {isSuperAdmin ? "Super Admin Portal" : "Admin Portal"}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gradient-to-r hover:from-[hsl(120,45%,32%)] hover:via-[hsl(45,40%,38%)] hover:to-[hsl(30,45%,28%)] hover:shadow-lg rounded-lg transition-all group border border-transparent hover:border-[hsl(45,50%,45%)]/40"
              >
                <item.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-base">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-[hsl(45,30%,35%)]/40 bg-gradient-to-r from-transparent via-[hsl(45,40%,35%)]/20 to-[hsl(120,45%,30%)]/30">
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
        <header className="bg-gradient-to-r from-[hsl(120,40%,25%)] via-[hsl(45,35%,30%)] to-[hsl(30,40%,22%)] text-white border-b border-[hsl(120,30%,20%)]/50 p-6 sticky top-0 z-10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isSuperAdmin ? "TAWA Super Admin Dashboard" : "TAWA Admin Dashboard"}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-white text-sm font-medium">
                  {isSuperAdmin 
                    ? "Full system access - Manage all courses, users, and system configuration"
                    : "Manage courses, users, and system configuration"}
                </p>
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
          {!isSuperAdmin && permissionsLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading permissions...</span>
            </div>
          )}
          {!isSuperAdmin && !permissionsLoading && permissions && Object.values(permissions).every(p => p === false) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
              <Shield className="w-12 h-12 mx-auto text-yellow-600 dark:text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">No Access Granted</h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                You don't have any permissions assigned yet. Please contact a super admin to grant you access to system features.
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                You can only view the dashboard until permissions are granted.
              </p>
            </div>
          )}
          <Routes>
            <Route path="/" element={<DashboardHome stats={stats} statsLoading={statsLoading} user={user} isSuperAdmin={isSuperAdmin} basePath={basePath} />} />
            {isSuperAdmin && (
              <>
                <Route path="/setup" element={<Setup />} />
                <Route path="/settings" element={<AdminSettings />} />
              </>
            )}
            {/* Protected routes - only accessible if admin has permission or is super admin */}
            {hasPermission("can_manage_users") && (
              <>
                <Route path="/users" element={<RegisterUsers />} />
                <Route path="/trainees" element={<RegisterUsers />} />
              </>
            )}
            {hasPermission("can_manage_subjects") && (
              <Route path="/subjects" element={<Subjects />} />
            )}
            {hasPermission("can_manage_materials") && (
              <Route path="/materials" element={<Materials />} />
            )}
            {hasPermission("can_manage_gallery") && (
              <Route path="/gallery" element={<Gallery />} />
            )}
            {hasPermission("can_manage_timetable") && (
              <Route path="/timetable" element={<Timetable />} />
            )}
            {hasPermission("can_manage_reports") && (
              <Route path="/reports" element={<Reports />} />
            )}
            {hasPermission("can_manage_chat") && (
              <Route path="/chat" element={<ChatBoard />} />
            )}
            {hasPermission("can_manage_assessments") && (
              <Route path="/assessments" element={<Assessments />} />
            )}
            {hasPermission("can_manage_results") && (
              <Route path="/results" element={<Results />} />
            )}
            {hasPermission("can_manage_activities") && (
              <Route path="/activities" element={<DoctorActivities />} />
            )}
            {hasPermission("can_view_doctor_dashboard") && (
              <Route path="/doctor-view" element={<AdminDoctorView />} />
            )}
            {/* Redirect unauthorized access attempts */}
            <Route path="*" element={
              !isSuperAdmin && permissions && Object.values(permissions).every(p => p === false) ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold mb-2">Access Denied</h3>
                    <p className="text-muted-foreground">You don't have permission to access this page.</p>
                  </div>
                </div>
              ) : (
                <DashboardHome stats={stats} statsLoading={statsLoading} user={user} isSuperAdmin={isSuperAdmin} basePath={basePath} />
              )
            } />
          </Routes>
        </div>
      </main>

      <Chatbot />
    </div>
  );
};

type DashboardStats = {
  instructors: number;
  trainees: number;
  courses: number;
  materials: number;
};

// Dashboard Home Component
const DashboardHome = ({ stats, statsLoading, user, isSuperAdmin, basePath }: { stats: DashboardStats; statsLoading: boolean; user: any; isSuperAdmin: boolean; basePath: string }) => {
  const [chartData, setChartData] = useState({
    roleDistribution: [] as any[],
    materialsByType: [] as any[],
    usersOverTime: [] as any[],
    courseStats: [] as any[],
  });

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      const [usersData, materialsData, coursesData] = await Promise.all([
        usersApi.getAll(),
        materialsApi.getAll(),
        coursesApi.getAll(),
      ]);

      const usersArray = Array.isArray(usersData) ? usersData : (usersData?.data || []);
      const materialsArray = Array.isArray(materialsData) ? materialsData : (materialsData?.data || []);
      const coursesArray = Array.isArray(coursesData) ? coursesData : (coursesData?.data || []);

      // Role Distribution
      const instructors = usersArray.filter((u: any) => u.role === "instructor").length;
      const trainees = usersArray.filter((u: any) => u.role === "trainee").length;
      const admins = usersArray.filter((u: any) => u.role === "admin").length;
      const doctors = usersArray.filter((u: any) => u.role === "doctor").length;

      const roleDistribution = [
        { name: "Instructors", value: instructors, color: "#3b82f6" },
        { name: "Trainees", value: trainees, color: "#10b981" },
        { name: "Admins", value: admins, color: "#8b5cf6" },
        { name: "Doctors", value: doctors, color: "#f59e0b" },
      ].filter(item => item.value > 0);

      // Materials by Type
      const materialsByTypeMap = new Map<string, number>();
      materialsArray.forEach((material: any) => {
        const type = material.type || "Other";
        materialsByTypeMap.set(type, (materialsByTypeMap.get(type) || 0) + 1);
      });
      const materialsByType = Array.from(materialsByTypeMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));

      // Users over time
      const usersByMonth = new Map<string, number>();
      usersArray.forEach((user: any) => {
        if (user.created_at) {
          const date = new Date(user.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          usersByMonth.set(monthKey, (usersByMonth.get(monthKey) || 0) + 1);
        }
      });
      const usersOverTime = Array.from(usersByMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([name, users]) => ({ name, users }));

      // Course statistics
      const courseStats = coursesArray.slice(0, 5).map((course: any) => ({
        name: course.name?.substring(0, 15) || "Course",
        trainees: course.enrolled_count || 0,
        instructors: course.instructor_count || 0,
      }));

      setChartData({
        roleDistribution,
        materialsByType,
        usersOverTime: usersOverTime.length > 0 ? usersOverTime : [
          { name: "Current", users: usersArray.length }
        ],
        courseStats: courseStats.length > 0 ? courseStats : [],
      });
    } catch (error) {
      console.error("Failed to load chart data:", error);
    }
  };
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleQuickAction = (action: string) => {
    switch(action) {
      case "Manage Users":
        navigate("/admin/users");
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
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 border border-primary/20 animate-slide-up">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-4xl font-bold text-primary mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-muted-foreground text-lg">
              {isSuperAdmin ? "Full system overview and management" : "Manage your training programs with precision"}
            </p>
          </div>
          {user?.course_name && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-xl border border-primary/30 backdrop-blur-sm">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">{user.course_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Counters - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border border-blue-500/20 hover:shadow-lg transition-all hover:scale-105">
          <AnimatedCounter end={stats.instructors} label="Instructors" icon={Users} delay={0} />
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-6 border border-green-500/20 hover:shadow-lg transition-all hover:scale-105">
          <AnimatedCounter end={stats.trainees} label="Trainees" icon={GraduationCap} delay={100} />
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-6 border border-purple-500/20 hover:shadow-lg transition-all hover:scale-105">
          <AnimatedCounter end={stats.courses} label="Courses" icon={BookOpen} delay={200} />
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-6 border border-orange-500/20 hover:shadow-lg transition-all hover:scale-105">
          <AnimatedCounter end={stats.materials} label="Materials" icon={FileText} delay={300} />
        </div>
      </div>
      
      {statsLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Refreshing statistics...</span>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution Pie Chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Role Distribution
          </h3>
          {chartData.roleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {chartData.roleDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p>No user data available</p>
            </div>
          )}
        </div>

        {/* Users Over Time Area Chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            User Growth Over Time
          </h3>
          {chartData.usersOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.usersOverTime}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorUsers)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p>No time-series data available</p>
            </div>
          )}
        </div>

        {/* Materials by Type Bar Chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Materials by Type
          </h3>
          {chartData.materialsByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.materialsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Bar 
                  dataKey="value" 
                  fill="#8b5cf6" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1500}
                >
                  {chartData.materialsByType.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'][index % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p>No materials data available</p>
            </div>
          )}
        </div>

        {/* Course Statistics */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course Statistics
          </h3>
          {chartData.courseStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.courseStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar 
                  dataKey="trainees" 
                  fill="#10b981" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1500}
                />
                <Bar 
                  dataKey="instructors" 
                  fill="#3b82f6" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p>No course data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Super Admin Quick Actions */}
      {user?.role === "super_admin" && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Super Admin Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => navigate(`${basePath}/setup`)}
              className="group bg-gradient-to-r from-purple-500 to-indigo-600 border border-purple-400 rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105 animate-slide-up text-left cursor-pointer text-white"
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-white/20">
                <PlusCircle className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Create Course & Admin</h4>
              <p className="text-sm text-white/90">
                Set up a new administrator account and create a new training course with complete data isolation.
              </p>
            </button>
            <button
              onClick={() => navigate(`${basePath}/settings`)}
              className="group bg-gradient-to-r from-blue-500 to-cyan-600 border border-blue-400 rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105 animate-slide-up text-left cursor-pointer text-white"
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-white/20">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Admin Settings</h4>
              <p className="text-sm text-white/90">
                Manage admin permissions and grant access to system features for administrators.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Users, label: "Manage Users", color: "bg-blue-500" },
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
