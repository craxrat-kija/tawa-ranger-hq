import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCourse } from "@/contexts/CourseContext";
import { coursesApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Calendar, ArrowRight, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: number;
  name: string;
  type: string;
  duration: string;
  status: "active" | "completed" | "upcoming";
  description?: string;
  instructor?: any;
  trainees?: number;
  is_enrolled?: boolean;
}

const CourseSelection = () => {
  const { user, logout } = useAuth();
  const { setSelectedCourse } = useCourse();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      // For admin, show all courses
      // For other users, show only enrolled courses using the dedicated endpoint
      if (user?.role === "admin" || user?.role === "super_admin") {
        const data = await coursesApi.getAll();
        setCourses(data);
      } else {
        // Use the myCourses endpoint which returns all enrolled courses
        const enrolledCourses = await coursesApi.getMyCourses();
        console.log('Loaded enrolled courses:', enrolledCourses);
        // Ensure we have an array
        const coursesArray = Array.isArray(enrolledCourses) ? enrolledCourses : [];
        setCourses(coursesArray);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    
    // Navigate to appropriate dashboard based on role
    if (user?.role === "admin" || user?.role === "super_admin") {
      navigate("/admin");
    } else if (user?.role === "doctor") {
      navigate("/doctor");
    } else if (user?.role === "instructor") {
      navigate("/instructor");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getStatusColor = (status: Course["status"]) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "completed": return "bg-blue-500";
      case "upcoming": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-military/90" />
      
      {/* Header */}
      <header className="relative z-10 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">TAWA Training Portal</h1>
          <p className="text-white/80 mt-1">Welcome, {user?.name}</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-2">
              {(user?.role === "admin" || user?.role === "super_admin") ? "Select or Manage Course" : "Select Your Course"}
            </h2>
            <p className="text-white/80 text-lg">
              {(user?.role === "admin" || user?.role === "super_admin") 
                ? "Choose a course to manage or create a new one" 
                : "Please select a course to access your dashboard"}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-white text-lg">Loading courses...</div>
            </div>
          ) : courses.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Courses Available</h3>
                <p className="text-muted-foreground">
                  {(user?.role === "admin" || user?.role === "super_admin") 
                    ? "Create your first course to get started." 
                    : "You are not enrolled in any courses yet. Please contact your administrator."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card 
                  key={course.id} 
                  className="hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-primary"
                  onClick={() => handleSelectCourse(course)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{course.name}</CardTitle>
                          <span className={`inline-block px-2 py-1 text-xs text-white rounded mt-2 ${getStatusColor(course.status)}`}>
                            {course.status}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-muted-foreground">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      {course.trainees !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{course.trainees} Trainees</span>
                        </div>
                      )}
                      {course.instructor && (
                        <div className="text-sm mt-2">
                          <span className="font-medium">Instructor: </span>
                          {course.instructor.name}
                        </div>
                      )}
                      {course.description && (
                        <div className="text-sm mt-3 line-clamp-2">{course.description}</div>
                      )}
                    </div>
                    <Button className="w-full mt-4 bg-gradient-military group-hover:scale-105 transition-transform">
                      Select Course
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default CourseSelection;

