import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { assessmentsApi, subjectsApi, gradesApi, usersApi, coursesApi } from "@/lib/api";
import { Plus, Edit, Trash2, FileText, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Assessment {
  id: number;
  subject_id: number;
  instructor_id: number;
  title: string;
  description?: string;
  type: string;
  date: string;
  max_score: number;
  weight?: number;
  subject?: any;
}

interface Grade {
  id: number;
  assessment_id: number;
  trainee_id: number;
  score: number;
  comments?: string;
  trainee?: any;
}

const Assessments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [showGradesDialog, setShowGradesDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [assessmentForm, setAssessmentForm] = useState({
    subject_id: "",
    title: "",
    description: "",
    type: "quiz" as "quiz" | "assignment" | "exam" | "practical" | "project" | "other",
    date: "",
    max_score: "100",
    weight: "0",
  });
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeForm, setGradeForm] = useState<Record<number, { score: string; comments: string }>>({});

  const isSuperAdmin = user?.role === "super_admin";
  const adminCourseId = user?.course_id;

  // Load courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const coursesData = await coursesApi.getAll().catch(() => []);
        const coursesArray = Array.isArray(coursesData) ? coursesData : [];
        
        // For regular admins, filter to only their course
        if (!isSuperAdmin && adminCourseId) {
          const filteredCourses = coursesArray.filter((c: any) => c.id === adminCourseId);
          setCourses(filteredCourses);
          // Auto-select the admin's course
          if (filteredCourses.length > 0) {
            setSelectedCourse(String(filteredCourses[0].id));
          }
        } else {
          setCourses(coursesArray);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
        toast({
          title: "Error",
          description: "Failed to load courses. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, [isSuperAdmin, adminCourseId, toast]);

  useEffect(() => {
    if (selectedCourse || (!isSuperAdmin && adminCourseId)) {
      loadData();
    }
  }, [selectedCourse]);

  const loadData = async () => {
    if (!selectedCourse && (!isSuperAdmin || !adminCourseId)) {
      return;
    }

    try {
      setIsLoading(true);
      const courseId = selectedCourse ? Number(selectedCourse) : (adminCourseId ? Number(adminCourseId) : undefined);
      const instructorId = (user?.role === 'admin' || user?.role === 'super_admin') ? undefined : user?.id?.toString();
      
      const [assessmentsData, subjectsData, traineesData] = await Promise.all([
        assessmentsApi.getAll(instructorId, undefined, courseId),
        subjectsApi.getAll(instructorId, courseId),
        usersApi.getAll('trainee'),
      ]);
      
      // Ensure data is an array
      let assessmentsList = Array.isArray(assessmentsData) ? assessmentsData : [];
      let subjectsList = Array.isArray(subjectsData) ? subjectsData : [];
      let traineesList = Array.isArray(traineesData) ? traineesData : [];
      
      // Filter trainees by course if course is selected
      if (courseId) {
        traineesList = traineesList.filter((t: any) => t.course_id === courseId);
      }
      
      setAssessments(assessmentsList);
      setSubjects(subjectsList);
      setTrainees(traineesList);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load data. Please try again.",
        variant: "destructive",
      });
      setSubjects([]);
      setAssessments([]);
      setTrainees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!assessmentForm.subject_id || !assessmentForm.title || !assessmentForm.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const courseId = selectedCourse ? Number(selectedCourse) : (adminCourseId ? Number(adminCourseId) : undefined);
    if (!courseId) {
      toast({
        title: "Course Required",
        description: "Please select a course before creating an assessment",
        variant: "destructive",
      });
      return;
    }

    try {
      await assessmentsApi.create({
        subject_id: parseInt(assessmentForm.subject_id),
        course_id: courseId,
        title: assessmentForm.title,
        description: assessmentForm.description || undefined,
        type: assessmentForm.type,
        date: assessmentForm.date,
        max_score: parseFloat(assessmentForm.max_score),
        weight: parseFloat(assessmentForm.weight) || undefined,
      });

      toast({
        title: "Assessment Created",
        description: "Assessment has been created successfully",
      });

      setShowAssessmentDialog(false);
      setAssessmentForm({
        subject_id: "",
        title: "",
        description: "",
        type: "quiz",
        date: "",
        max_score: "100",
        weight: "0",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create assessment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenGrades = async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    try {
      const gradesData = await gradesApi.getAll(assessment.id.toString());
      setGrades(gradesData);
      
      // Initialize grade form with existing grades
      const formData: Record<number, { score: string; comments: string }> = {};
      trainees.forEach(trainee => {
        const existingGrade = gradesData.find((g: any) => g.trainee_id === trainee.id);
        formData[trainee.id] = {
          score: existingGrade ? existingGrade.score.toString() : "",
          comments: existingGrade?.comments || "",
        };
      });
      setGradeForm(formData);
      setShowGradesDialog(true);
    } catch (error) {
      console.error('Error loading grades:', error);
      toast({
        title: "Error",
        description: "Failed to load grades. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedAssessment) return;

    try {
      const promises: Promise<any>[] = [];

      for (const traineeId in gradeForm) {
        const formData = gradeForm[parseInt(traineeId)];
        if (formData.score) {
          const existingGrade = grades.find(g => g.trainee_id === parseInt(traineeId));
          
          if (existingGrade) {
            // Update existing grade
            promises.push(gradesApi.update(existingGrade.id.toString(), {
              score: parseFloat(formData.score),
              comments: formData.comments || undefined,
            }));
          } else {
            // Create new grade
            promises.push(gradesApi.create({
              assessment_id: selectedAssessment.id,
              trainee_id: parseInt(traineeId),
              score: parseFloat(formData.score),
              comments: formData.comments || undefined,
            }));
          }
        }
      }

      await Promise.all(promises);

      toast({
        title: "Grades Saved",
        description: "All grades have been saved successfully",
      });

      setShowGradesDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save grades. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssessment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assessment? All grades will also be deleted.")) {
      return;
    }

    try {
      await assessmentsApi.delete(id.toString());
      toast({
        title: "Assessment Deleted",
        description: "Assessment has been removed",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete assessment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Course</CardTitle>
          <CardDescription>Choose a course to view assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="course-select">Course</Label>
            <Select
              value={selectedCourse}
              onValueChange={setSelectedCourse}
              disabled={loadingCourses}
            >
              <SelectTrigger id="course-select" className="w-full">
                <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course: any) => (
                  <SelectItem key={course.id} value={String(course.id)}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedCourse && !adminCourseId && (
              <p className="text-sm text-muted-foreground">
                Please select a course to view assessments.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Assessments & Grades</h1>
          <p className="text-muted-foreground">Manage assessments and record trainee grades</p>
        </div>
        {((user?.role === "admin" || user?.role === "super_admin" || user?.role === "instructor")) && (
          <Button
            onClick={() => {
              if (!selectedCourse && (!isSuperAdmin || !adminCourseId)) {
                toast({
                  title: "Course Selection Required",
                  description: "Please select a course before creating an assessment.",
                  variant: "destructive",
                });
                return;
              }
              setSelectedAssessment(null);
              setAssessmentForm({
                subject_id: "",
                title: "",
                description: "",
                type: "quiz",
                date: "",
                max_score: "100",
                weight: "0",
              });
              setShowAssessmentDialog(true);
            }}
            className="bg-gradient-military"
            disabled={!selectedCourse && (!isSuperAdmin || !adminCourseId)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assessment
          </Button>
        )}
      </div>

      {/* Create Assessment Dialog */}
      <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Assessment</DialogTitle>
            <DialogDescription>Add a new assessment for trainees</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                {subjects.length === 0 ? (
                  <div className="space-y-2">
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="No subjects available" />
                      </SelectTrigger>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === 'instructor' 
                        ? "You don't have any subjects assigned. Please contact admin to assign subjects to you."
                        : "No subjects available. Please create subjects first."}
                    </p>
                  </div>
                ) : (
                  <Select
                    value={assessmentForm.subject_id}
                    onValueChange={(value) => setAssessmentForm({ ...assessmentForm, subject_id: value })}
                    disabled={subjects.length === 0}
                  >
                    <SelectTrigger id="subject-select">
                      <SelectValue placeholder={subjects.length === 0 ? "Loading subjects..." : "Select subject"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={String(subject.id)}>
                          {subject.name} {subject.code && `(${subject.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Assessment Type *</Label>
                <Select
                  value={assessmentForm.type}
                  onValueChange={(value: any) => setAssessmentForm({ ...assessmentForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="practical">Practical</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={assessmentForm.title}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                  placeholder="Enter assessment title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={assessmentForm.date}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_score">Maximum Score *</Label>
                <Input
                  id="max_score"
                  type="number"
                  value={assessmentForm.max_score}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, max_score: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (%)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={assessmentForm.weight}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, weight: e.target.value })}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={assessmentForm.description}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
                  placeholder="Enter assessment description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssessmentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssessment} className="bg-gradient-military">
                Create Assessment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grades Dialog */}
      <Dialog open={showGradesDialog} onOpenChange={setShowGradesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Grades - {selectedAssessment?.title}</DialogTitle>
            <DialogDescription>
              Enter scores for all trainees. Maximum score: {selectedAssessment?.max_score}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {trainees.map((trainee) => (
                <div key={trainee.id} className="grid grid-cols-12 gap-4 items-center p-3 border rounded-lg">
                  <div className="col-span-4">
                    <Label className="font-medium">{trainee.name}</Label>
                    <p className="text-xs text-muted-foreground">{trainee.email}</p>
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Score"
                      value={gradeForm[trainee.id]?.score || ""}
                      onChange={(e) => {
                        setGradeForm({
                          ...gradeForm,
                          [trainee.id]: {
                            ...gradeForm[trainee.id],
                            score: e.target.value,
                          },
                        });
                      }}
                      min="0"
                      max={selectedAssessment?.max_score}
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      placeholder="Comments (optional)"
                      value={gradeForm[trainee.id]?.comments || ""}
                      onChange={(e) => {
                        setGradeForm({
                          ...gradeForm,
                          [trainee.id]: {
                            ...gradeForm[trainee.id],
                            comments: e.target.value,
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGradesDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveGrades} className="bg-gradient-military">
                Save All Grades
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assessments List */}
      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
          <CardDescription>All assessments and their details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading assessments...</div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No assessments found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Max Score</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.title}</TableCell>
                    <TableCell>{assessment.subject?.name || "N/A"}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-accent/20">
                        {assessment.type}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(assessment.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{assessment.max_score}</TableCell>
                    <TableCell>{assessment.weight || 0}%</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenGrades(assessment)}
                          title="Record Grades"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        {((user?.role === "admin" || user?.role === "super_admin" || assessment.instructor_id === parseInt(user?.id?.toString() || "0"))) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAssessment(assessment.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Assessments;

