import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import UserProfile from "./UserProfile";
import UserProfiles from "./UserProfiles";
import Assessments from "./Assessments";
import Results from "./Results";
import Subjects from "./Subjects";
import DoctorActivities from "./DoctorActivities";
import AdminDoctorView from "./AdminDoctorView";
import Setup from "./Setup";
import AdminSettings from "./AdminSettings";
import DisciplineIssues from "./DisciplineIssues";
import CourseMetadata from "./CourseMetadata";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const SystemReport = lazy(() => import("./SystemReport"));
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
  FileBarChart,
  Download,
  Box,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Tag,
  User,
  LayoutGrid,
  BarChart3,
  Globe,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { usersApi, materialsApi, coursesApi, subjectsApi, galleryApi, adminPermissionsApi } from "@/lib/api";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useCourse } from "@/contexts/CourseContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const { selectedCourse, setSelectedCourse } = useCourse();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    administration: false,
    academic: false,
    reports: false,
    assessments: false,
    medical: false,
  });
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
    navigate("/login");
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
  }, [user, selectedCourse]);

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
      const usersPromise = usersApi.getAll(selectedCourse ? { course_id: selectedCourse.id } : undefined);
      const materialsPromise = materialsApi.getAll(selectedCourse ? { course_id: selectedCourse.id } : undefined);
      const coursesPromise = selectedCourse
        ? coursesApi.getById(selectedCourse.id.toString())
        : (isSuperAdmin ? coursesApi.getAll() : Promise.resolve([]));
      const subjectsPromise = subjectsApi.getAll(selectedCourse ? { course_id: selectedCourse.id } : undefined);
      const galleryPromise = galleryApi.getAll(selectedCourse ? { course_id: selectedCourse.id } : undefined);

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

  // Toggle dropdown
  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper function to check if item should be visible
  const shouldShowItem = (permission: string | null) => {
    if (isSuperAdmin) return true;
    if (permission === null) return true;
    if (permissionsLoading || !permissions) return false;
    return permissions[permission as keyof typeof permissions] === true;
  };

  // Build menu structure with groups - reorganized for better UX
  const menuGroups = [
    {
      type: "single",
      item: { icon: LayoutGrid, label: "Dashboard", path: basePath, permission: null },
      separator: false
    },
    {
      type: "group",
      key: "academic",
      icon: BookOpen,
      label: "Academic Management",
      items: [
        { icon: BookOpen, label: "Subjects Registry", path: `${basePath}/subjects`, permission: "can_manage_subjects" },
        { icon: Calendar, label: "Training Timetable", path: `${basePath}/timetable`, permission: "can_manage_timetable" },
        { icon: Upload, label: "Learning Materials", path: `${basePath}/materials`, permission: "can_manage_materials" },
        { icon: Image, label: "Visual Gallery", path: `${basePath}/gallery`, permission: "can_manage_gallery" },
      ].filter(item => shouldShowItem(item.permission)),
      separator: false
    },
    {
      type: "group",
      key: "assessments",
      icon: ClipboardCheck,
      label: "Assessments & Results",
      items: [
        { icon: ClipboardCheck, label: "Training Assessments", path: `${basePath}/assessments`, permission: "can_manage_assessments" },
        { icon: FileText, label: "Performance Results", path: `${basePath}/results`, permission: "can_manage_results" },
      ].filter(item => shouldShowItem(item.permission)),
      separator: false
    },
    {
      type: "group",
      key: "reports",
      icon: FileBarChart,
      label: "Reports & Analytics",
      items: [
        { icon: Box, label: "Operational Reports", path: `${basePath}/reports`, permission: "can_manage_reports" },
        ...(isSuperAdmin ? [
          { icon: FileBarChart, label: "System Analytics", path: `${basePath}/system-report`, permission: null },
        ] : [
          { icon: FileBarChart, label: "Course Overview", path: `${basePath}/system-report`, permission: "can_manage_reports" },
        ]),
      ].filter(item => shouldShowItem(item.permission)),
      separator: false
    },
    {
      type: "single",
      item: { icon: MessageSquare, label: "Chat Board", path: `${basePath}/chat`, permission: "can_manage_chat" },
      separator: false
    },
    {
      type: "group",
      key: "administration",
      icon: Settings,
      label: "Administration",
      items: [
        { icon: Users, label: "Manage Users", path: `${basePath}/users`, permission: "can_manage_users" },
        { icon: User, label: "User Profiles", path: `${basePath}/user-profiles`, permission: "can_manage_users" },
        { icon: AlertTriangle, label: "Discipline Registry", path: `${basePath}/discipline-issues`, permission: null },
        ...(isSuperAdmin ? [
          { icon: PlusCircle, label: "System Provisioning", path: `${basePath}/setup`, permission: null },
          { icon: Tag, label: "Course Parameters", path: `${basePath}/course-metadata`, permission: null },
          { icon: Settings, label: "Security Settings", path: `${basePath}/settings`, permission: null },
        ] : []),
      ].filter(item => shouldShowItem(item.permission)),
      separator: false
    },
    {
      type: "group",
      key: "medical",
      icon: Stethoscope,
      label: "Medical",
      items: [
        { icon: Activity, label: "Medical Activities", path: `${basePath}/activities`, permission: "can_manage_activities" },
        { icon: Shield, label: "Medical Dashboard", path: `${basePath}/doctor-view`, permission: "can_view_doctor_dashboard" },
      ].filter(item => shouldShowItem(item.permission)),
      separator: false
    },
  ].filter(group => {
    if (group.type === "single") {
      return shouldShowItem(group.item.permission);
    }
    return group.items.length > 0;
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } w-72 bg-[#1a2e1a] border-r border-white/5 shadow-2xl`}
      >
        <div className="relative h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-8 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
            <div className="flex flex-col items-center text-center gap-4">
              <RotatingLogo className="w-24 h-24" animate={false} />
              <div>
                <h2 className="text-white font-bold text-xl">TAWA</h2>
                <p className="text-white/80 text-sm">
                  {isSuperAdmin ? "Super Admin Portal" : "Admin Portal"}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {menuGroups.map((group, idx) => {
              // Add separator before group if needed
              const showSeparator = group.separator && idx > 0;

              return (
                <div key={idx} className="space-y-1">
                  {/* Section Header */}
                  {group.section && (
                    <div className="pt-4 pb-1 px-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                        {group.section}
                      </p>
                    </div>
                  )}

                  {group.type === "single" ? (
                    <div>
                      {showSeparator && (
                        <div className="my-2 mx-2 border-t border-white/10"></div>
                      )}
                      <Link
                        to={group.item.path}
                        className="flex items-center gap-3 px-4 py-2.5 text-white hover:bg-white/10 rounded-lg transition-all group border border-transparent active:scale-[0.98]"
                      >
                        <group.item.icon className="w-4 h-4 text-white/70 group-hover:text-white transition-colors flex-shrink-0" />
                        <span className="font-medium text-sm">{group.item.label}</span>
                      </Link>
                    </div>
                  ) : (
                    <div
                      onMouseEnter={() => setOpenDropdowns(prev => ({ ...prev, [group.key]: true }))}
                      onMouseLeave={() => setOpenDropdowns(prev => ({ ...prev, [group.key]: false }))}
                    >
                      {showSeparator && (
                        <div className="my-2 mx-2 border-t border-white/10"></div>
                      )}
                      <Collapsible
                        open={openDropdowns[group.key]}
                        onOpenChange={(isOpen) => setOpenDropdowns(prev => ({ ...prev, [group.key]: isOpen }))}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-white hover:bg-white/10 rounded-lg transition-all group border border-transparent active:scale-[0.98]">
                            <div className="flex items-center gap-3">
                              <group.icon className="w-4 h-4 text-white/70 group-hover:text-white transition-colors flex-shrink-0" />
                              <span className="font-medium text-sm">{group.label}</span>
                            </div>
                            <div className="flex items-center">
                              {openDropdowns[group.key] ? (
                                <ChevronDown className="w-3 h-3 text-white/50" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-white/50" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="overflow-hidden transition-all duration-200">
                          <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
                            {group.items.map((item, itemIdx) => (
                              <Link
                                key={itemIdx}
                                to={item.path}
                                className="flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-all active:scale-[0.98]"
                              >
                                <item.icon className="w-3.5 h-3.5" />
                                <span className="font-medium text-[13px]">{item.label}</span>
                              </Link>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-[hsl(45,30%,35%)]/40 bg-gradient-to-r from-transparent via-[hsl(45,40%,35%)]/20 to-[hsl(120,45%,30%)]/30">
            <div className="mb-3 text-white">
              <p className="font-semibold text-base">{user?.name}</p>
              <p className="text-sm text-white/80">{user?.user_id || user?.email}</p>
            </div>
            {selectedCourse && (
              <div className="mb-3 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 text-white">
                  <BookOpen className="w-4 h-4 text-white/80" />
                  <div>
                    <p className="text-xs text-white/70">Active Course</p>
                    <p className="text-sm font-semibold">{selectedCourse.name}</p>
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
        className="fixed top-4 left-4 lg:hidden z-50 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="drop-shadow-sm" /> : <Menu className="drop-shadow-sm" />}
      </Button>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-card border-b p-6 sticky top-0 z-10 shadow-sm backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {isSuperAdmin ? "Super Admin Command" : "Command Dashboard"}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-muted-foreground text-sm font-medium">
                  {isSuperAdmin
                    ? "Strategic Enterprise Oversight"
                    : "Operational Course Oversight"}
                </p>
                {selectedCourse && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-primary font-bold text-sm">{selectedCourse.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {(user?.enrolled_courses && user.enrolled_courses.length > 1) || isSuperAdmin ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Switch Course:</span>
                  <Select
                    value={selectedCourse?.id?.toString() || "all"}
                    onValueChange={(value) => {
                      if (value === "all") {
                        setSelectedCourse(null);
                      } else {
                        const course = user?.enrolled_courses?.find(c => c.id.toString() === value);
                        if (course) {
                          setSelectedCourse(course as any);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {isSuperAdmin && <SelectItem value="all">All Courses</SelectItem>}
                      {user?.enrolled_courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <NotificationBar />
                <ThemeToggle />
              </div>
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
                <Route path="/course-metadata" element={<CourseMetadata />} />
                <Route path="/settings" element={<AdminSettings />} />
              </>
            )}
            {(isSuperAdmin || hasPermission("can_manage_reports")) && (
              <Route
                path="/system-report"
                element={
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                        <p className="text-muted-foreground">Loading Report...</p>
                      </div>
                    </div>
                  }>
                    <SystemReport />
                  </Suspense>
                }
              />
            )}
            {/* Protected routes - only accessible if admin has permission or is super admin */}
            {hasPermission("can_manage_users") && (
              <>
                <Route path="/users" element={<RegisterUsers />} />
                <Route path="/trainees" element={<RegisterUsers />} />
                <Route path="/user-profiles" element={<UserProfiles />} />
                <Route path="/users/:userId/profile" element={<UserProfile />} />
              </>
            )}
            {/* Discipline Issues - accessible by admin and super admin */}
            <Route path="/discipline-issues" element={<DisciplineIssues />} />
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
            {(isSuperAdmin || hasPermission("can_manage_reports")) && (
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
    switch (action) {
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
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
            { icon: Box, label: "Generate Reports", color: "bg-red-500" },
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
