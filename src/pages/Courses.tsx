import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, BookOpen, Users, Calendar, Trash2, Edit } from "lucide-react";

interface Course {
  id: number;
  name: string;
  type: string;
  duration: string;
  trainees: number;
  instructor: string;
  startDate: string;
  status: "active" | "completed" | "upcoming";
}

const Courses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    duration: "",
    instructor: "",
    startDate: "",
  });

  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      name: "Basic Paramilitary Training",
      type: "Transformation Course",
      duration: "12 weeks",
      trainees: 45,
      instructor: "Sgt. John Mwangi",
      startDate: "2024-01-15",
      status: "active",
    },
    {
      id: 2,
      name: "Advanced Weapons Handling",
      type: "Special Course",
      duration: "6 weeks",
      trainees: 28,
      instructor: "Lt. Sarah Ndlovu",
      startDate: "2024-02-01",
      status: "active",
    },
    {
      id: 3,
      name: "Field Tactics & Strategy",
      type: "Special Course",
      duration: "8 weeks",
      trainees: 35,
      instructor: "Cpl. David Kimani",
      startDate: "2024-03-01",
      status: "upcoming",
    },
    {
      id: 4,
      name: "Recruit Foundation Course",
      type: "Recruit Course",
      duration: "16 weeks",
      trainees: 60,
      instructor: "Maj. Grace Omondi",
      startDate: "2023-11-01",
      status: "completed",
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCourse: Course = {
      id: courses.length + 1,
      name: formData.name,
      type: formData.type,
      duration: formData.duration,
      trainees: 0,
      instructor: formData.instructor,
      startDate: formData.startDate,
      status: "upcoming",
    };
    setCourses([...courses, newCourse]);
    toast({
      title: "Course Created",
      description: `${formData.name} has been added successfully.`,
    });
    setFormData({ name: "", type: "", duration: "", instructor: "", startDate: "" });
    setShowAddForm(false);
  };

  const handleDelete = (courseId: number) => {
    setCourses(courses.filter(c => c.id !== courseId));
    toast({
      title: "Course Deleted",
      description: "Course has been removed from the system.",
    });
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

      {/* Add Course Form */}
      {showAddForm && user?.role === "admin" && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Create New Course</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter course name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Course Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
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
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 12 weeks"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="Instructor name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="bg-gradient-military">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </form>
        </Card>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{course.duration} • Starts {new Date(course.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{course.trainees} Trainees</span>
                </div>
                <div className="font-medium text-foreground">
                  Instructor: {course.instructor}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Courses;
