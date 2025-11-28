import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { coursesApi, usersApi } from "@/lib/api";
import { Plus, BookOpen, Users, Calendar, Trash2, Edit, Eye, LogIn, LogOut, UserPlus, UserMinus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Course {
  id: number;
  code?: string;
  name: string;
  type: string;
  duration: string;
  trainees?: number;
  instructor?: any;
  instructor_id?: number;
  start_date: string;
  status: "active" | "completed" | "upcoming";
  description?: string;
  content?: string;
  is_enrolled?: boolean;
  enrolled_at?: string;
}

const Courses = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [showAddForm, setShowAddForm] = useState(false);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolledUsers, setEnrolledUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("none");
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "",
    duration: "",
    instructor_id: "",
    start_date: "",
    status: "upcoming" as "active" | "completed" | "upcoming",
    description: "",
    content: "",
  });

  useEffect(() => {
    if (user) {
      loadCourses();
      if (isAdmin) {
        loadInstructors();
        loadAllUsers();
      } else {
        loadEnrolledCourses();
        loadAvailableCourses();
      }
    }
  }, [user, isAdmin]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const data = await coursesApi.getAll();
      setCourses(data.map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        type: c.type,
        duration: c.duration,
        trainees: c.trainees || 0,
        instructor: c.instructor,
        instructor_id: c.instructor_id,
        start_date: c.start_date,
        status: c.status || "upcoming",
        description: c.description,
        content: c.content,
        is_enrolled: c.is_enrolled || false,
      })));
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

  const loadEnrolledCourses = async () => {
    try {
      const data = await coursesApi.getMyCourses();
      setEnrolledCourses(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        duration: c.duration,
        trainees: c.trainees || 0,
        instructor: c.instructor,
        instructor_id: c.instructor_id,
        start_date: c.start_date,
        status: c.status || "upcoming",
        description: c.description,
        content: c.content,
        is_enrolled: true,
        enrolled_at: c.enrolled_at,
      })));
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
    }
  };

  const loadAvailableCourses = async () => {
    try {
      const data = await coursesApi.getAvailableCourses();
      setAvailableCourses(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        duration: c.duration,
        trainees: c.trainees || 0,
        instructor: c.instructor,
        instructor_id: c.instructor_id,
        start_date: c.start_date,
        status: c.status || "upcoming",
        description: c.description,
        is_enrolled: false,
      })));
    } catch (error) {
      console.error('Error loading available courses:', error);
    }
  };

  const loadInstructors = async () => {
    try {
      const data = await usersApi.getAll('instructor');
      setInstructors(data);
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const data = await usersApi.getAll();
      // Filter out admins and only show users who can be enrolled (instructors, doctors, trainees)
      setAllUsers(data.filter((u: any) => u.role !== 'admin'));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadEnrolledUsers = async (courseId: number) => {
    try {
      setLoadingEnrollments(true);
      const data = await coursesApi.getEnrolledUsers(courseId.toString());
      setEnrolledUsers(data);
    } catch (error: any) {
      console.error('Error loading enrolled users:', error);
      toast({
        title: "Error",
        description: "Failed to load enrolled users.",
        variant: "destructive",
      });
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleManageEnrollments = async (course: Course) => {
    setSelectedCourse(course);
    setShowEnrollmentDialog(true);
    await loadEnrolledUsers(course.id);
  };

  const handleEnrollUser = async () => {
    if (!selectedCourse || selectedUserId === "none") {
      toast({
        title: "Error",
        description: "Please select a user to enroll.",
        variant: "destructive",
      });
      return;
    }

    try {
      await coursesApi.enrollUser(selectedCourse.id.toString(), selectedUserId);
      toast({
        title: "Success",
        description: "User enrolled successfully.",
      });
      await loadEnrolledUsers(selectedCourse.id);
      loadCourses(); // Refresh course list to update trainee count
      setSelectedUserId("none");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll user.",
        variant: "destructive",
      });
    }
  };

  const handleUnenrollUser = async (userId: string) => {
    if (!selectedCourse) return;

    if (!confirm("Are you sure you want to unenroll this user from the course?")) {
      return;
    }

    try {
      await coursesApi.unenrollUser(selectedCourse.id.toString(), userId);
      toast({
        title: "Success",
        description: "User unenrolled successfully.",
      });
      await loadEnrolledUsers(selectedCourse.id);
      loadCourses(); // Refresh course list to update trainee count
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unenroll user.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        const updatePayload: any = {
          name: formData.name,
          type: formData.type,
          duration: formData.duration,
          start_date: formData.start_date,
          status: formData.status,
        };
        
        if (formData.instructor_id && formData.instructor_id !== "none" && formData.instructor_id !== "") {
          updatePayload.instructor_id = parseInt(formData.instructor_id);
        } else {
          // Remove instructor if none selected
          updatePayload.instructor_id = null;
        }
        
        if (formData.description) {
          updatePayload.description = formData.description;
        }
        
        if (formData.content) {
          updatePayload.content = formData.content;
        }
        
        await coursesApi.update(editingCourse.id.toString(), updatePayload);
        toast({
          title: "Course Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        const coursePayload: any = {
          code: formData.code.toUpperCase(),
          name: formData.name,
          type: formData.type,
          duration: formData.duration,
          start_date: formData.start_date,
          status: formData.status,
        };
        
        if (formData.instructor_id && formData.instructor_id !== "none") {
          coursePayload.instructor_id = parseInt(formData.instructor_id);
        }
        
        if (formData.description) {
          coursePayload.description = formData.description;
        }
        
        if (formData.content) {
          coursePayload.content = formData.content;
        }
        
        console.log('Creating course with payload:', coursePayload);
        const result = await coursesApi.create(coursePayload);
        console.log('Course created successfully:', result);
        toast({
          title: "Course Created",
          description: `${formData.name} has been added successfully.`,
        });
        
        // Refresh user data to get updated course_id
        await refreshUser();
      }
      resetForm();
      await loadCourses();
    } catch (error: any) {
      console.error('Error creating/updating course:', error);
      const errorMessage = error.message || error.response?.data?.message || "Failed to save course. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ code: "", name: "", type: "", duration: "", instructor_id: "none", start_date: "", status: "upcoming", description: "", content: "" });
    setShowAddForm(false);
    setEditingCourse(null);
  };

  const handleEdit = async (course: Course) => {
    // Load full course details including content
    try {
      const fullCourse = await coursesApi.getById(course.id.toString());
      setEditingCourse(fullCourse);
      setFormData({
        code: fullCourse.code || "",
        name: fullCourse.name,
        type: fullCourse.type,
        duration: fullCourse.duration,
        instructor_id: fullCourse.instructor_id?.toString() || "none",
        start_date: fullCourse.start_date,
        status: fullCourse.status,
        description: fullCourse.description || "",
        content: fullCourse.content || "",
      });
      setShowAddForm(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load course details.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (courseId: number) => {
    if (!confirm("Are you sure you want to delete this course?")) {
      return;
    }
    try {
      await coursesApi.delete(courseId.toString());
      toast({
        title: "Course Deleted",
        description: "Course has been removed from the system.",
      });
      loadCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEnroll = async (courseId: number) => {
    try {
      await coursesApi.enroll(courseId.toString());
      toast({
        title: "Enrolled",
        description: "You have successfully enrolled in this course.",
      });
      loadEnrolledCourses();
      loadAvailableCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll in course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnenroll = async (courseId: number) => {
    if (!confirm("Are you sure you want to unenroll from this course?")) {
      return;
    }
    try {
      await coursesApi.unenroll(courseId.toString());
      toast({
        title: "Unenrolled",
        description: "You have been unenrolled from this course.",
      });
      loadEnrolledCourses();
      loadAvailableCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unenroll from course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewContent = async (course: Course) => {
    try {
      // Load full course details including content
      const fullCourse = await coursesApi.getById(course.id.toString());
      setSelectedCourse(fullCourse);
      setShowContentDialog(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load course content.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Course["status"]) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "completed": return "bg-blue-500";
      case "upcoming": return "bg-orange-500";
    }
  };

  const renderCourseCard = (course: Course) => (
    <Card key={course.id} className="p-6 hover:shadow-xl transition-all group">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{course.name}</h3>
              <span className={`inline-block px-2 py-1 text-xs text-white rounded mt-1 ${getStatusColor(course.status)}`}>
                {course.status}
              </span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleManageEnrollments(course)}
                title="Manage enrollments"
              >
                <Users className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(course)}
                title="Edit course"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(course.id)}
                title="Delete course"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{course.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{course.duration} • Starts {new Date(course.start_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{course.trainees || 0} Trainees</span>
          </div>
          <div className="font-medium text-foreground">
            Instructor: {course.instructor?.name || "Not assigned"}
          </div>
          {course.description && (
            <p className="text-sm mt-2 line-clamp-2">{course.description}</p>
          )}
        </div>

        {!isAdmin && (
          <div className="flex gap-2 pt-2 border-t">
            {course.is_enrolled ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewContent(course)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Content
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnenroll(course.id)}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                className="flex-1 bg-gradient-military"
                size="sm"
                onClick={() => handleEnroll(course.id)}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Enroll
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {isAdmin ? "Manage Courses" : "Courses"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Create and manage training courses with content" 
              : "Browse and enroll in available courses"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddForm(true)} className="bg-gradient-military">
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        )}
      </div>

      {/* Add/Edit Course Form - Admin Only */}
      {isAdmin && (
        <Dialog open={showAddForm} onOpenChange={(open) => {
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
              <DialogDescription>
                {editingCourse ? "Update course information and content" : "Add a new training course to the system"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!editingCourse && (
                  <div className="space-y-2">
                    <Label htmlFor="code">Course Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., TC2024, SC2024"
                      required
                      pattern="[A-Z0-9]+"
                      title="Course code should contain only uppercase letters and numbers"
                    />
                    <p className="text-xs text-muted-foreground">Unique identifier (e.g., TC2024)</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter course name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Course Type *</Label>
                  <Select value={formData.type || ""} onValueChange={(value) => setFormData({ ...formData, type: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transformation Course">Transformation Course</SelectItem>
                      <SelectItem value="Special Course">Special Course</SelectItem>
                      <SelectItem value="Recruit Course">Recruit Course</SelectItem>
                      <SelectItem value="Refresher Course">Refresher Course</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 12 weeks"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructor_id">Instructor</Label>
                  <Select 
                    value={formData.instructor_id || "none"} 
                    onValueChange={(value) => setFormData({ ...formData, instructor_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {instructors.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id.toString()}>
                          {instructor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status || "upcoming"} onValueChange={(value: any) => setFormData({ ...formData, status: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Course description (optional)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="content">Course Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter course content that enrolled users will see..."
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    This content will be visible to users who enroll in this course. (Optional)
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-military">
                  <Plus className="w-4 h-4 mr-2" />
                  {editingCourse ? "Update Course" : "Create Course"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Course Content View Dialog */}
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCourse?.name}</DialogTitle>
            <DialogDescription>
              Course Content
            </DialogDescription>
          </DialogHeader>
          {selectedCourse?.content ? (
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-sm">{selectedCourse.content}</div>
            </div>
          ) : (
            <p className="text-muted-foreground">No content available for this course.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Enrollment Management Dialog - Admin Only */}
      {isAdmin && (
        <Dialog open={showEnrollmentDialog} onOpenChange={(open) => {
          setShowEnrollmentDialog(open);
          if (!open) {
            setSelectedCourse(null);
            setEnrolledUsers([]);
            setSelectedUserId("none");
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Enrollments - {selectedCourse?.name}</DialogTitle>
              <DialogDescription>
                Enroll or unenroll users from this course
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Enroll New User */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enroll New User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select user to enroll" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select a user...</SelectItem>
                        {allUsers
                          .filter((u: any) => !enrolledUsers.some((eu: any) => eu.id.toString() === u.id.toString()))
                          .map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} ({user.email}) - {user.role}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleEnrollUser}
                      disabled={selectedUserId === "none"}
                      className="bg-gradient-military"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Enroll
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Enrolled Users List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enrolled Users ({enrolledUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingEnrollments ? (
                    <div className="text-center py-4">Loading enrolled users...</div>
                  ) : enrolledUsers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No users enrolled in this course yet.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Enrolled At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrolledUsers.map((enrolledUser: any) => (
                          <TableRow key={enrolledUser.id}>
                            <TableCell className="font-medium">{enrolledUser.name}</TableCell>
                            <TableCell>{enrolledUser.email}</TableCell>
                            <TableCell>
                              <span className="capitalize">{enrolledUser.role}</span>
                            </TableCell>
                            <TableCell>{enrolledUser.department || "N/A"}</TableCell>
                            <TableCell>
                              {new Date(enrolledUser.enrolled_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUnenrollUser(enrolledUser.id.toString())}
                                title="Unenroll user"
                              >
                                <UserMinus className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Courses Display */}
      {isLoading ? (
        <div className="text-center py-8">Loading courses...</div>
      ) : isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No courses found. Create your first course to get started.
            </div>
          ) : (
            courses.map(renderCourseCard)
          )}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="enrolled">My Courses</TabsTrigger>
            <TabsTrigger value="available">Available Courses</TabsTrigger>
          </TabsList>
          <TabsContent value="enrolled" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  You haven't enrolled in any courses yet. Browse available courses to get started.
                </div>
              ) : (
                enrolledCourses.map(renderCourseCard)
              )}
            </div>
          </TabsContent>
          <TabsContent value="available" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No available courses at the moment.
                </div>
              ) : (
                availableCourses.map(renderCourseCard)
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Courses;
