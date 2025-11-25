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
import { gradesApi, usersApi, assessmentsApi, subjectsApi } from "@/lib/api";
import { Edit, Eye, Download, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface Grade {
  id: number;
  assessment_id: number;
  trainee_id: number;
  score: number;
  comments?: string;
  assessment?: any;
  trainee?: any;
}

const Results = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrainee, setSelectedTrainee] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editForm, setEditForm] = useState({ score: "", comments: "" });

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) {
      return;
    }

    try {
      setIsLoading(true);
      
      // For instructors, get grades from their assessments only
      // For admin, get all grades (instructorId = undefined)
      const instructorId = user.role === 'admin' ? undefined : user.id?.toString();
      
      const [gradesData, traineesData, assessmentsData, subjectsData] = await Promise.all([
        gradesApi.getAll(undefined, undefined, instructorId),
        usersApi.getAll('trainee'),
        assessmentsApi.getAll(instructorId),
        subjectsApi.getAll(instructorId),
      ]);

      // Ensure all data is arrays
      const gradesList = Array.isArray(gradesData) ? gradesData : [];
      const traineesList = Array.isArray(traineesData) ? traineesData : [];
      const assessmentsList = Array.isArray(assessmentsData) ? assessmentsData : [];
      const subjectsList = Array.isArray(subjectsData) ? subjectsData : [];

      setGrades(gradesList);
      setTrainees(traineesList);
      setAssessments(assessmentsList);
      setSubjects(subjectsList);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load results. Please try again.",
        variant: "destructive",
      });
      setGrades([]);
      setTrainees([]);
      setAssessments([]);
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGrade = (grade: Grade) => {
    setEditingGrade(grade);
    setEditForm({
      score: grade.score.toString(),
      comments: grade.comments || "",
    });
    setShowEditDialog(true);
  };

  const handleUpdateGrade = async () => {
    if (!editingGrade || !editForm.score) return;

    try {
      await gradesApi.update(editingGrade.id.toString(), {
        score: parseFloat(editForm.score),
        comments: editForm.comments || undefined,
      });

      toast({
        title: "Grade Updated",
        description: "Grade has been updated successfully",
      });

      setShowEditDialog(false);
      setEditingGrade(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update grade. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredGrades = grades.filter(grade => {
    if (selectedTrainee && grade.trainee_id !== parseInt(selectedTrainee)) return false;
    if (selectedSubject) {
      const subjectId = grade.assessment?.subject_id || grade.assessment?.subject?.id;
      if (subjectId !== parseInt(selectedSubject)) return false;
    }
    return true;
  });

  // Calculate statistics
  const getTraineeStats = (traineeId: number) => {
    const traineeGrades = filteredGrades.filter(g => g.trainee_id === traineeId);
    if (traineeGrades.length === 0) return null;

    const totalScore = traineeGrades.reduce((sum, g) => sum + g.score, 0);
    const maxScore = traineeGrades.reduce((sum, g) => sum + (g.assessment?.max_score || 100), 0);
    const average = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
      total: traineeGrades.length,
      average: average.toFixed(2),
      totalScore: totalScore.toFixed(2),
      maxScore: maxScore.toFixed(2),
    };
  };

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  // Show message if user is not available
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          Please log in to view results.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Results & Grades</h1>
          <p className="text-muted-foreground">
            {user?.role === 'admin' 
              ? "Review and manage all trainee performance across all instructors"
              : "Review and manage trainee performance"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trainee">Filter by Trainee</Label>
              <Select value={selectedTrainee || "all"} onValueChange={(value) => setSelectedTrainee(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Trainees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trainees</SelectItem>
                  {trainees.map((trainee) => (
                    <SelectItem key={trainee.id} value={trainee.id.toString()}>
                      {trainee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Filter by Subject</Label>
              <Select value={selectedSubject || "all"} onValueChange={(value) => setSelectedSubject(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Results</CardTitle>
          <CardDescription>All recorded grades and scores</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading results...</div>
          ) : grades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No grades found.</p>
              <p className="text-sm">
                {user?.role === 'instructor' 
                  ? "You haven't recorded any grades yet. Go to Assessments to create assessments and record grades for trainees."
                  : user?.role === 'admin'
                  ? "No grades have been recorded in the system yet. Instructors can create assessments and record grades for trainees."
                  : "No grades have been recorded yet."}
              </p>
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No grades match the selected filters.</p>
              <p className="text-sm mt-2">Try adjusting your filter selections.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainee</TableHead>
                  {user?.role === "admin" && <TableHead>Instructor</TableHead>}
                  <TableHead>Assessment</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Max Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Comments</TableHead>
                  {(user?.role === "admin" || user?.role === "instructor") && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((grade) => {
                  const percentage = grade.assessment?.max_score 
                    ? ((grade.score / grade.assessment.max_score) * 100).toFixed(2)
                    : "0";
                  
                  return (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.trainee?.name || "N/A"}</TableCell>
                      {user?.role === "admin" && (
                        <TableCell>{grade.assessment?.instructor?.name || "N/A"}</TableCell>
                      )}
                      <TableCell>{grade.assessment?.title || "N/A"}</TableCell>
                      <TableCell>{grade.assessment?.subject?.name || "N/A"}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-accent/20">
                          {grade.assessment?.type || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {grade.assessment?.date ? format(new Date(grade.assessment.date), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="font-semibold">{grade.score}</TableCell>
                      <TableCell>{grade.assessment?.max_score || "N/A"}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          parseFloat(percentage) >= 80 ? "text-green-600" :
                          parseFloat(percentage) >= 60 ? "text-yellow-600" :
                          "text-red-600"
                        }`}>
                          {percentage}%
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{grade.comments || "-"}</TableCell>
                      {(user?.role === "admin" || user?.role === "instructor") && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditGrade(grade)}
                            title="Edit Grade"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Trainee Statistics */}
      {selectedTrainee && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Overall performance statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const stats = getTraineeStats(parseInt(selectedTrainee));
              if (!stats) return <p className="text-muted-foreground">No data available</p>;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-accent/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Assessments</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="p-4 bg-accent/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold">{stats.average}%</p>
                  </div>
                  <div className="p-4 bg-accent/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-2xl font-bold">{stats.totalScore} / {stats.maxScore}</p>
                  </div>
                  <div className="p-4 bg-accent/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p className={`text-2xl font-bold ${
                      parseFloat(stats.average) >= 80 ? "text-green-600" :
                      parseFloat(stats.average) >= 60 ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {parseFloat(stats.average) >= 80 ? "Excellent" :
                       parseFloat(stats.average) >= 60 ? "Good" :
                       "Needs Improvement"}
                    </p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Edit Grade Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>
              Update the grade for {editingGrade?.trainee?.name} - {editingGrade?.assessment?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="score">Score *</Label>
              <Input
                id="score"
                type="number"
                value={editForm.score}
                onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
                min="0"
                max={editingGrade?.assessment?.max_score}
                step="0.01"
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum score: {editingGrade?.assessment?.max_score}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={editForm.comments}
                onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })}
                placeholder="Enter comments"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateGrade} className="bg-gradient-military">
                Update Grade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Results;

