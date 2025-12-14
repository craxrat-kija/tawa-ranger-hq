import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RotatingLogo } from "@/components/RotatingLogo";
import { BookOpen, Save, ArrowLeft, List, Info } from "lucide-react";
import { Loading } from "@/components/Loading";
import { coursesApi, courseMetadataApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CreateCourse = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [existingCourses, setExistingCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseCodes, setCourseCodes] = useState<any[]>([]);
  const [courseNames, setCourseNames] = useState<any[]>([]);
  const [courseTypes, setCourseTypes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    courseType: "",
    location: "",
    courseDuration: "",
    courseDescription: "",
    startDate: "",
  });

  // Check authentication and redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please login to create a course.",
          variant: "destructive",
        });
        navigate("/login");
      } else if (user && user.role !== "admin" && user.role !== "super_admin") {
        toast({
          title: "Access Denied",
          description: "Only administrators can create courses.",
          variant: "destructive",
        });
        navigate("/");
      } else if (isAuthenticated && (user?.role === "admin" || user?.role === "super_admin")) {
        // Load existing courses and metadata
        loadExistingCourses();
        loadCourseMetadata();
      }
    }
  }, [isAuthenticated, authLoading, user, navigate, toast]);

  const loadExistingCourses = async () => {
    try {
      setLoadingCourses(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const courses = data.data || data;
        setExistingCourses(Array.isArray(courses) ? courses : []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadCourseMetadata = async () => {
    try {
      setLoadingMetadata(true);
      const [codes, names, types, locs] = await Promise.all([
        courseMetadataApi.getAll('course_code').catch(() => []),
        courseMetadataApi.getAll('name'),
        courseMetadataApi.getAll('course_type'),
        courseMetadataApi.getAll('location'),
      ]);
      setCourseCodes(Array.isArray(codes) ? codes : []);
      setCourseNames(Array.isArray(names) ? names : []);
      setCourseTypes(Array.isArray(types) ? types : []);
      setLocations(Array.isArray(locs) ? locs : []);
    } catch (error) {
      console.error('Error loading course metadata:', error);
    } finally {
      setLoadingMetadata(false);
    }
  };

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated || (user && user.role !== "admin")) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated. Please login again.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: formData.courseCode.toUpperCase(),
          name: formData.courseName,
          type: formData.courseType,
          duration: formData.courseDuration,
          location: formData.location,
          description: formData.courseDescription,
          start_date: formData.startDate,
          status: 'upcoming',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Course creation failed');
      }

      toast({
        title: "Course Created",
        description: `Course "${formData.courseName}" (${formData.courseCode.toUpperCase()}) has been created successfully.`,
      });

      // Refresh user data to get updated course_id
      await refreshUser();

      // Reload existing courses list
      await loadExistingCourses();

      // Reset form
      setFormData({
        courseCode: "",
        courseName: "",
        courseType: "",
        location: "",
        courseDuration: "",
        courseDescription: "",
        startDate: "",
      });

      // Optionally redirect to admin dashboard after a short delay, or stay on page to create another
      // setTimeout(() => {
      //   navigate("/admin");
      // }, 2000);
    } catch (error: any) {
      console.error('Course creation error:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background">
      <div className="w-full max-w-4xl mx-auto p-6">
        <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <RotatingLogo className="w-20 h-20" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">Create New Course</CardTitle>
              <CardDescription className="text-lg mt-2">
                Add a new training course with isolated data
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Info Alert */}
            <Alert className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Multiple Courses:</strong> You can create multiple courses in the system. Each course will have its own isolated data (users, materials, timetable, etc.). Make sure to use a unique course code for each course.
              </AlertDescription>
            </Alert>

            {/* Existing Courses Section */}
            {existingCourses.length > 0 && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Existing Courses ({existingCourses.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {existingCourses.slice(0, 3).map((course: any) => (
                    <div key={course.id} className="flex items-center justify-between p-2 bg-background rounded text-sm">
                      <div>
                        <span className="font-medium">{course.code || 'N/A'}</span> - {course.name}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        course.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                        course.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                  ))}
                  {existingCourses.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      + {existingCourses.length - 3} more courses
                    </p>
                  )}
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Course Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">Course Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseCode">Course Code *</Label>
                    {courseCodes.length > 0 ? (
                      <Select
                        value={formData.courseCode}
                        onValueChange={(value) => setFormData({ ...formData, courseCode: value.toUpperCase() })}
                        required
                      >
                        <SelectTrigger id="courseCode">
                          <SelectValue placeholder="Select course code" />
                        </SelectTrigger>
                        <SelectContent>
                          {courseCodes.map((item) => (
                            <SelectItem key={item.id} value={item.value}>
                              {item.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                    <Input
                      id="courseCode"
                      value={formData.courseCode}
                      onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                      placeholder="e.g., TC2024, SC2024"
                      required
                      pattern="[A-Z0-9]+"
                      title="Course code should contain only uppercase letters and numbers"
                    />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {courseCodes.length === 0 && !loadingMetadata
                        ? "No course codes available. Add them in Course Metadata or type manually."
                        : "Unique identifier for this course (e.g., TC2024)"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Course Name *</Label>
                    {courseNames.length > 0 ? (
                      <Select
                        value={formData.courseName}
                        onValueChange={(value) => setFormData({ ...formData, courseName: value })}
                        required
                      >
                        <SelectTrigger id="courseName">
                          <SelectValue placeholder="Select course name" />
                        </SelectTrigger>
                        <SelectContent>
                          {courseNames.map((item) => (
                            <SelectItem key={item.id} value={item.value}>
                              {item.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                    <Input
                      id="courseName"
                      value={formData.courseName}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                      placeholder="e.g., Transformation Course"
                      required
                    />
                    )}
                    {courseNames.length === 0 && !loadingMetadata && (
                      <p className="text-xs text-muted-foreground">
                        No course names available. Add them in Course Metadata.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="courseType">Course Type *</Label>
                    {courseTypes.length > 0 ? (
                      <Select
                        value={formData.courseType}
                        onValueChange={(value) => setFormData({ ...formData, courseType: value })}
                        required
                      >
                        <SelectTrigger id="courseType">
                          <SelectValue placeholder="Select course type" />
                        </SelectTrigger>
                        <SelectContent>
                          {courseTypes.map((item) => (
                            <SelectItem key={item.id} value={item.value}>
                              {item.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                    <Input
                      id="courseType"
                      value={formData.courseType}
                      onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                      placeholder="e.g., Transformation, Special, Recruit, Refresher"
                      required
                    />
                    )}
                    {courseTypes.length === 0 && !loadingMetadata && (
                      <p className="text-xs text-muted-foreground">
                        No course types available. Add them in Course Metadata.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    {locations.length > 0 ? (
                      <Select
                        value={formData.location}
                        onValueChange={(value) => setFormData({ ...formData, location: value })}
                        required
                      >
                        <SelectTrigger id="location">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((item) => (
                            <SelectItem key={item.id} value={item.value}>
                              {item.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Fort Ikoma, Arusha"
                        required
                      />
                    )}
                    {locations.length === 0 && !loadingMetadata && (
                      <p className="text-xs text-muted-foreground">
                        No locations available. Add them in Course Metadata.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="courseDuration">Duration *</Label>
                    <Input
                      id="courseDuration"
                      value={formData.courseDuration}
                      onChange={(e) => setFormData({ ...formData, courseDuration: e.target.value })}
                      placeholder="e.g., 12 weeks"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="courseDescription">Course Description</Label>
                    <Textarea
                      id="courseDescription"
                      value={formData.courseDescription}
                      onChange={(e) => setFormData({ ...formData, courseDescription: e.target.value })}
                      placeholder="Enter course description..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="min-w-[150px]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-military min-w-[150px]"
                >
                  {isLoading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Course
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCourse;

