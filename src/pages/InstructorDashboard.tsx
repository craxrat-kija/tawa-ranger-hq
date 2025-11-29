import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCourse } from "@/contexts/CourseContext";
import { Button } from "@/components/ui/button";
import { RotatingLogo } from "@/components/RotatingLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Chatbot } from "@/components/Chatbot";
import { NotificationBar } from "@/components/NotificationBar";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import Materials from "./Materials";
import Gallery from "./Gallery";
import Timetable from "./Timetable";
import ChatBoard from "./ChatBoard";
import ViewTrainees from "./ViewTrainees";
import Assessments from "./Assessments";
import Results from "./Results";
import Courses from "./Courses";
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
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { timetableApi, coursesApi, usersApi, materialsApi, assessmentsApi, gradesApi } from "@/lib/api";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const InstructorDashboard = () => {
  const { logout, user } = useAuth();
  const { selectedCourse, setSelectedCourse } = useCourse();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    { icon: BookOpen, label: "My Courses", path: "/instructor" },
    { icon: BookOpen, label: "Courses", path: "/instructor/courses" },
    { icon: Users, label: "View Trainees", path: "/instructor/trainees" },
    { icon: Upload, label: "Materials", path: "/instructor/materials" },
    { icon: Image, label: "Gallery", path: "/instructor/gallery" },
    { icon: Calendar, label: "Timetable", path: "/instructor/timetable" },
    { icon: MessageSquare, label: "Chat Board", path: "/instructor/chat" },
    { icon: ClipboardCheck, label: "Assessments", path: "/instructor/assessments" },
    { icon: FileText, label: "Results", path: "/instructor/results" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-64 bg-[hsl(120,30%,18%)]`}
      >
        <div className="relative h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-6 border-b border-[hsl(45,30%,35%)]/40 bg-gradient-to-r from-[hsl(120,45%,30%)]/30 via-[hsl(45,40%,35%)]/20 to-transparent">
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
                className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[hsl(120,35%,28%)] hover:shadow-md rounded-lg transition-all group border border-transparent hover:border-[hsl(120,40%,35%)]/30"
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
              <p className="text-sm text-white/80">{user?.user_id || "Instructor"}</p>
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
              <h1 className="text-3xl font-bold text-white">TAWA Instructor Dashboard</h1>
              <div className="flex items-center gap-4 mt-2">
                {selectedCourse ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg border border-white/30 backdrop-blur-sm">
                    <BookOpen className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm">{selectedCourse.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCourse(null);
                        navigate("/select-course");
                      }}
                      className="text-white/80 hover:text-white hover:bg-white/20 h-6 px-2 ml-2"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Switch Course
                    </Button>
                  </div>
                ) : user?.course_name ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg border border-white/30 backdrop-blur-sm">
                    <BookOpen className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm">{user.course_name}</span>
                  </div>
                ) : null}
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
            <Route path="/" element={<InstructorHome />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/trainees" element={<ViewTrainees />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/chat" element={<ChatBoard />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/results" element={<Results />} />
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
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [stats, setStats] = useState({
    courses: 0,
    trainees: 0,
    materials: 0,
    pendingReviews: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadTodaySchedule();
    loadStats();
  }, [user]);

  const loadTodaySchedule = async () => {
    try {
      setIsLoadingSchedule(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const data = await timetableApi.getAll();
      // Filter for today's schedule
      const todayItems = data.filter((item: any) => item.date === today);
      setTodaySchedule(todayItems);
    } catch (error) {
      console.error('Error loading today\'s schedule:', error);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) {
      console.log('No user ID, skipping stats load');
      return;
    }
    
    try {
      setIsLoadingStats(true);
      console.log('Loading stats for instructor:', user.id, user.name);
      
      // Initialize stats
      let coursesCount = 0;
      let traineesCount = 0;
      let materialsCount = 0;
      let pendingReviewsCount = 0;
      
      // 1. Get My Courses - courses where instructor_id matches current user
      let coursesArray: any[] = [];
      try {
        const myCoursesResponse = await coursesApi.getAll();
        coursesArray = Array.isArray(myCoursesResponse) 
          ? myCoursesResponse 
          : (myCoursesResponse?.data || []);
        coursesCount = coursesArray.length;
        console.log('✓ Courses loaded:', coursesCount, coursesArray);
        
        // Prepare chart data: Trainees per course
        const chartDataArray = [];
        for (const course of coursesArray) {
          try {
            const enrolledUsersResponse = await coursesApi.getEnrolledUsers(course.id.toString());
            const enrolledUsers = Array.isArray(enrolledUsersResponse) 
              ? enrolledUsersResponse 
              : (enrolledUsersResponse?.data || []);
            const trainees = enrolledUsers.filter((u: any) => u.role === 'trainee');
            
            chartDataArray.push({
              name: course.name?.substring(0, 15) || 'Course',
              trainees: trainees.length,
            });
          } catch (error: any) {
            console.error(`  ✗ Error loading trainees for chart (course ${course.id}):`, error.message);
            chartDataArray.push({
              name: course.name?.substring(0, 15) || 'Course',
              trainees: 0,
            });
          }
        }
        setChartData(chartDataArray);
        console.log('✓ Chart data loaded:', chartDataArray);
        
        // 2. Get My Trainees - use same method as /instructor/trainees page
        try {
          const traineesData = await usersApi.getAll('trainee');
          const traineesArray = Array.isArray(traineesData) 
            ? traineesData 
            : (traineesData?.data || []);
          traineesCount = traineesArray.length;
          console.log('✓ Trainees loaded (same as /instructor/trainees):', traineesCount);
        } catch (error: any) {
          console.error('✗ Error loading trainees:', error.message);
        }
      } catch (error: any) {
        console.error('✗ Error loading courses:', error.message);
      }
      
      // 3. Get All Materials - instructors can see all materials in the system
      try {
        const allMaterialsResponse = await materialsApi.getAll();
        const materialsArray = Array.isArray(allMaterialsResponse) 
          ? allMaterialsResponse 
          : (allMaterialsResponse?.data || []);
        
        // Instructors can see all materials across all courses
        materialsCount = materialsArray.length;
        console.log('✓ Materials loaded:', materialsCount, 'total materials in system');
      } catch (error: any) {
        console.error('✗ Error loading materials:', error.message);
      }
      
      // 4. Get Pending Reviews - assessments that need grading
      try {
        const allAssessmentsResponse = await assessmentsApi.getAll(user.id.toString());
        const instructorAssessments = Array.isArray(allAssessmentsResponse) 
          ? allAssessmentsResponse 
          : (allAssessmentsResponse?.data || []);
        
        console.log('✓ Assessments loaded:', instructorAssessments.length);
        
        for (const assessment of instructorAssessments) {
          try {
            const assessmentGradesResponse = await gradesApi.getAll(assessment.id.toString());
            const grades = Array.isArray(assessmentGradesResponse) 
              ? assessmentGradesResponse 
              : (assessmentGradesResponse?.data || []);
            
            if (assessment.course_id) {
              const enrolledUsersResponse = await coursesApi.getEnrolledUsers(assessment.course_id.toString());
              const enrolledUsers = Array.isArray(enrolledUsersResponse) 
                ? enrolledUsersResponse 
                : (enrolledUsersResponse?.data || []);
              
              const trainees = enrolledUsers.filter((u: any) => u.role === 'trainee');
              const gradedTraineeIds = grades.map((g: any) => g.trainee_id?.toString());
              const ungradedTrainees = trainees.filter((t: any) => 
                !gradedTraineeIds.includes(t.id?.toString())
              );
              pendingReviewsCount += ungradedTrainees.length;
            }
          } catch (error: any) {
            console.error(`  ✗ Error loading grades for assessment ${assessment.id}:`, error.message);
          }
        }
        console.log('✓ Pending reviews:', pendingReviewsCount);
      } catch (error: any) {
        console.error('✗ Error loading assessments:', error.message);
      }
      
      const finalStats = {
        courses: coursesCount,
        trainees: traineesCount,
        materials: materialsCount,
        pendingReviews: pendingReviewsCount,
      };
      
      console.log('✓ Final stats:', finalStats);
      setStats(finalStats);
    } catch (error: any) {
      console.error('✗ Error loading stats:', error.message, error);
    } finally {
      setIsLoadingStats(false);
    }
  };
  
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
        {isLoadingStats ? (
          <>
            <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-12 bg-muted rounded w-1/2"></div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-12 bg-muted rounded w-1/2"></div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-12 bg-muted rounded w-1/2"></div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-12 bg-muted rounded w-1/2"></div>
            </div>
          </>
        ) : (
          <>
            <AnimatedCounter end={stats.courses} label="My Courses" icon={BookOpen} delay={0} />
            <AnimatedCounter end={stats.trainees} label="My Trainees" icon={Users} delay={100} />
            <AnimatedCounter end={stats.materials} label="Uploaded Materials" icon={FileText} delay={200} />
            <AnimatedCounter end={stats.pendingReviews} label="Pending Reviews" icon={ClipboardCheck} delay={300} />
          </>
        )}
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

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Trainees per Course
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={80}
              />
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
                name="Trainees"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Today's Schedule & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Today's Schedule
          </h3>
          <div className="space-y-3">
            {isLoadingSchedule ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading schedule...</p>
            ) : todaySchedule.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No classes scheduled for today. Check the timetable to view upcoming schedules.
              </p>
            ) : (
              todaySchedule
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((item) => (
                  <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold">{item.subject}</span>
                      <span className="text-xs text-accent">{item.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.instructor}</p>
                    <p className="text-xs text-muted-foreground">{item.location}</p>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Recent Feedback
          </h3>
          <div className="space-y-3">
            {[].length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No feedback available yet. Feedback will appear here once trainees submit their reviews.
              </p>
            ) : (
              [].map((feedback, idx) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
