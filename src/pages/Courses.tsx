import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { coursesApi, usersApi } from "@/lib/api";
import { Plus, BookOpen, Users, Calendar, Trash2, Edit } from "lucide-react";

interface Course {
  id: number;
  name: string;
  type: string;
  duration: string;
  trainees?: number;
  instructor?: any;
  instructor_id?: number;
  start_date: string;
  status: "active" | "completed" | "upcoming";
}

const Courses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    duration: "",
    instructor_id: "",
    start_date: "",
    status: "upcoming" as "active" | "completed" | "upcoming",
    description: "",
  });

  useEffect(() => {
    loadCourses();
    loadInstructors();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const data = await coursesApi.getAll();
      setCourses(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        duration: c.duration,
        trainees: c.trainees || 0,
        instructor: c.instructor,
        instructor_id: c.instructor_id,
        start_date: c.start_date,
        status: c.status || "upcoming",
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

  const loadInstructors = async () => {
    try {
      const data = await usersApi.getAll('instructor');
      setInstructors(data);
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await coursesApi.update(editingCourse.id.toString(), {
          name: formData.name,
          type: formData.type,
          duration: formData.duration,
          instructor_id: formData.instructor_id ? parseInt(formData.instructor_id) : undefined,
          start_date: formData.start_date,
          status: formData.status,
          description: formData.description,
        });
        toast({
          title: "Course Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        await coursesApi.create({
          name: formData.name,
          type: formData.type,
          duration: formData.duration,
          instructor_id: formData.instructor_id ? parseInt(formData.instructor_id) : undefined,
          start_date: formData.start_date,
          status: formData.status,
          description: formData.description,
        });
        toast({
          title: "Course Created",
          description: `${formData.name} has been added successfully.`,
        });
      }
      setFormData({ name: "", type: "", duration: "", instructor_id: "", start_date: "", status: "upcoming", description: "" });
      setShowAddForm(false);
      setEditingCourse(null);
      loadCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      type: course.type,
      duration: course.duration,
      instructor_id: course.instructor_id?.toString() || "",
      start_date: course.start_date,
      status: course.status,
      description: "",
    });
    setShowAddForm(true);
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

  const getStatusColor = (status: Course["status"]) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "completed": return "bg-blue-500";
      case "upcoming": return "bg-orange-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Manage Courses</h1>
          <p className="text-muted-foreground">Create and manage training courses</p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-gradient-military">
            <Plus className="w-4 h-4 mr-2" />
            {showAddForm ? "Cancel" : "Add Course"}
          </Button>
        )}
      </div>

      {/* Add/Edit Course Form */}
      <Dialog open={showAddForm} onOpenChange={(open) => {
        setShowAddForm(open);
        if (!open) {
          setEditingCourse(null);
          setFormData({ name: "", type: "", duration: "", instructor_id: "", start_date: "", status: "upcoming", description: "" });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
            <DialogDescription>
              {editingCourse ? "Update course information" : "Add a new training course to the system"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })} required>
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
                <Select value={formData.instructor_id} onValueChange={(value) => setFormData({ ...formData, instructor_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })} required>
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
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddForm(false);
                setEditingCourse(null);
                setFormData({ name: "", type: "", duration: "", instructor_id: "", start_date: "", status: "upcoming", description: "" });
              }}>
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

      {/* Courses Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading courses...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No courses found. Create your first course to get started.
            </div>
          ) : (
            courses.map((course) => (
              <Card key={course.id} className="p-6 hover:shadow-xl transition-all group">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{course.name}</h3>
                        <span className={`inline-block px-2 py-1 text-xs text-white rounded ${getStatusColor(course.status)}`}>
                          {course.status}
                        </span>
                      </div>
                    </div>
                    {user?.role === "admin" && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(course)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(course.id)}
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
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Courses;
