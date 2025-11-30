import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, TrendingUp, Users, Award, Loader2, BookOpen, Upload, Image, Calendar, Stethoscope, FileHeart, MessageSquare, Database, BarChart, Box } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  usersApi, 
  gradesApi, 
  attendanceApi, 
  assessmentsApi, 
  coursesApi,
  materialsApi,
  galleryApi,
  subjectsApi,
  timetableApi,
  patientsApi,
  medicalReportsApi,
  messagesApi
} from "@/lib/api";
import { format } from "date-fns";

const Reports = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [generating, setGenerating] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  
  const isSuperAdmin = user?.role === "super_admin";
  const adminCourseId = user?.course_id;

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

  const reportTypes = [
    { 
      id: 1, 
      title: "Performance Report", 
      description: "Trainee performance analytics and grades",
      icon: TrendingUp,
      color: "text-blue-500"
    },
    { 
      id: 2, 
      title: "Attendance Report", 
      description: "Training attendance records",
      icon: Users,
      color: "text-green-500"
    },
    { 
      id: 3, 
      title: "Course Completion", 
      description: "Course completion statistics",
      icon: Award,
      color: "text-yellow-500"
    },
    { 
      id: 4, 
      title: "Instructor Report", 
      description: "Instructor performance and feedback",
      icon: FileText,
      color: "text-purple-500"
    },
    { 
      id: 16, 
      title: "Results Report", 
      description: "All grades and trainee results",
      icon: FileText,
      color: "text-lime-500"
    },
    // Super Admin Only Reports
    ...(isSuperAdmin ? [
      { 
        id: 5, 
        title: "System Overview", 
        description: "Comprehensive system-wide statistics and data",
        icon: Database,
        color: "text-indigo-500"
      },
      { 
        id: 6, 
        title: "Users Report", 
        description: "Complete user database and role distribution",
        icon: Users,
        color: "text-cyan-500"
      },
      { 
        id: 7, 
        title: "Courses Report", 
        description: "All courses, enrollment, and course statistics",
        icon: BookOpen,
        color: "text-emerald-500"
      },
      { 
        id: 8, 
        title: "Materials Report", 
        description: "All training materials and resource distribution",
        icon: Box,
        color: "text-orange-500"
      },
      { 
        id: 9, 
        title: "Gallery Report", 
        description: "All gallery items and media content",
        icon: Image,
        color: "text-pink-500"
      },
      { 
        id: 10, 
        title: "Subjects Report", 
        description: "All subjects and subject assignments",
        icon: BookOpen,
        color: "text-teal-500"
      },
      { 
        id: 11, 
        title: "Timetable Report", 
        description: "All timetable entries and schedules",
        icon: Calendar,
        color: "text-amber-500"
      },
      { 
        id: 12, 
        title: "Patients Report", 
        description: "All patient records and medical data",
        icon: Stethoscope,
        color: "text-red-500"
      },
      { 
        id: 13, 
        title: "Medical Reports", 
        description: "All medical reports and health records",
        icon: FileHeart,
        color: "text-rose-500"
      },
      { 
        id: 14, 
        title: "Chat Board Report", 
        description: "All messages and communication logs",
        icon: MessageSquare,
        color: "text-violet-500"
      },
      { 
        id: 15, 
        title: "Assessments Report", 
        description: "All assessments and evaluation data",
        icon: BarChart,
        color: "text-sky-500"
      },
    ] : []),
  ];

  const generatePerformanceReport = async () => {
    setGenerating(1);
    try {
      const courseId = selectedCourse ? Number(selectedCourse) : undefined;
      const courseName = selectedCourse ? courses.find((c: any) => String(c.id) === selectedCourse)?.name : undefined;
      
      // Fetch grades and assessments
      const [grades, assessments, trainees] = await Promise.all([
        gradesApi.getAll(undefined, undefined, undefined, courseId).catch(() => []),
        assessmentsApi.getAll().catch(() => []),
        usersApi.getAll().catch(() => []),
      ]);

      const gradesArray = Array.isArray(grades) ? grades : [];
      const assessmentsArray = Array.isArray(assessments) ? assessments : [];
      const traineesArray = Array.isArray(trainees) ? trainees : [];

      // Filter by course
      let filteredGrades = gradesArray;
      let filteredAssessments = assessmentsArray;
      let filteredTrainees = traineesArray;

      if (courseId) {
        filteredTrainees = traineesArray.filter((t: any) => t.course_id === courseId && t.role === "trainee");
        filteredGrades = gradesArray.filter((g: any) => g.course_id === courseId);
        filteredAssessments = assessmentsArray.filter((a: any) => a.course_id === courseId);
      } else {
        filteredTrainees = traineesArray.filter((t: any) => t.role === "trainee");
      }

      // Calculate statistics
      const avgScore = filteredGrades.length > 0
        ? filteredGrades.reduce((sum: number, g: any) => sum + (g.score || 0), 0) / filteredGrades.length
        : 0;

      const traineePerformance = filteredTrainees.map((trainee: any) => {
        const traineeGrades = filteredGrades.filter((g: any) => g.trainee_id === trainee.id);
        const avgTraineeScore = traineeGrades.length > 0
          ? traineeGrades.reduce((sum: number, g: any) => sum + (g.score || 0), 0) / traineeGrades.length
          : 0;
        return {
          name: trainee.name,
          user_id: trainee.user_id,
          totalAssessments: traineeGrades.length,
          averageScore: avgTraineeScore,
          grades: traineeGrades,
        };
      });

      // Generate HTML report
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Performance Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #1a472a; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #1a472a; color: white; }
    .summary { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Performance Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm:ss")}</p>
  ${courseName ? `<p>Course: ${courseName}</p>` : ''}
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Trainees: ${filteredTrainees.length}</p>
    <p>Total Assessments: ${filteredAssessments.length}</p>
    <p>Total Grades: ${filteredGrades.length}</p>
    <p>Average Score: ${avgScore.toFixed(2)}%</p>
  </div>

  <h2>Trainee Performance</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>User ID</th>
        <th>Total Assessments</th>
        <th>Average Score</th>
      </tr>
    </thead>
    <tbody>
      ${traineePerformance.map((tp: any) => `
        <tr>
          <td>${tp.name}</td>
          <td>${tp.user_id || 'N/A'}</td>
          <td>${tp.totalAssessments}</td>
          <td>${tp.averageScore.toFixed(2)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

      // Download HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-report-${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Performance report generated successfully!",
      });
    } catch (error) {
      console.error("Error generating performance report:", error);
      toast({
        title: "Error",
        description: "Failed to generate performance report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const generateAttendanceReport = async () => {
    setGenerating(2);
    try {
      const courseId = selectedCourse ? Number(selectedCourse) : undefined;
      const courseName = selectedCourse ? courses.find((c: any) => String(c.id) === selectedCourse)?.name : undefined;
      
      const [attendance, trainees] = await Promise.all([
        attendanceApi.getAll().catch(() => []),
        usersApi.getAll().catch(() => []),
      ]);

      let filteredAttendance = Array.isArray(attendance) ? attendance : [];
      let filteredTrainees = Array.isArray(trainees) ? trainees.filter((t: any) => t.role === "trainee") : [];

      if (courseId) {
        filteredTrainees = filteredTrainees.filter((t: any) => t.course_id === courseId);
        const traineeIds = new Set(filteredTrainees.map((t: any) => t.id));
        filteredAttendance = filteredAttendance.filter((a: any) => traineeIds.has(a.patient_id));
      }

      // Group by date
      const attendanceByDate: Record<string, any[]> = {};
      filteredAttendance.forEach((record: any) => {
        const date = format(new Date(record.date || record.created_at), "yyyy-MM-dd");
        if (!attendanceByDate[date]) {
          attendanceByDate[date] = [];
        }
        attendanceByDate[date].push(record);
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attendance Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #1a472a; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #1a472a; color: white; }
    .summary { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Attendance Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm:ss")}</p>
  ${courseName ? `<p>Course: ${courseName}</p>` : ''}
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Trainees: ${filteredTrainees.length}</p>
    <p>Total Attendance Records: ${filteredAttendance.length}</p>
    <p>Unique Dates: ${Object.keys(attendanceByDate).length}</p>
  </div>

  <h2>Attendance by Date</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Records</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(attendanceByDate).map(([date, records]) => `
        <tr>
          <td>${format(new Date(date), "MMMM dd, yyyy")}</td>
          <td>${records.length}</td>
          <td>${records.filter((r: any) => r.status === 'present').length} Present, ${records.filter((r: any) => r.status === 'absent').length} Absent</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Attendance report generated successfully!",
      });
    } catch (error) {
      console.error("Error generating attendance report:", error);
      toast({
        title: "Error",
        description: "Failed to generate attendance report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const generateCourseCompletionReport = async () => {
    setGenerating(3);
    try {
      const courseId = selectedCourse ? Number(selectedCourse) : undefined;
      
      const [coursesData, trainees, assessments, grades] = await Promise.all([
        coursesApi.getAll().catch(() => []),
        usersApi.getAll().catch(() => []),
        assessmentsApi.getAll().catch(() => []),
        gradesApi.getAll().catch(() => []),
      ]);

      let filteredCourses = Array.isArray(coursesData) ? coursesData : [];
      let filteredTrainees = Array.isArray(trainees) ? trainees.filter((t: any) => t.role === "trainee") : [];
      let filteredAssessments = Array.isArray(assessments) ? assessments : [];
      let filteredGrades = Array.isArray(grades) ? grades : [];

      if (courseId) {
        filteredCourses = filteredCourses.filter((c: any) => c.id === courseId);
        filteredTrainees = filteredTrainees.filter((t: any) => t.course_id === courseId);
        filteredAssessments = filteredAssessments.filter((a: any) => a.course_id === courseId);
        filteredGrades = filteredGrades.filter((g: any) => g.course_id === courseId);
      }

      const courseStats = filteredCourses.map((course: any) => {
        const courseTrainees = filteredTrainees.filter((t: any) => t.course_id === course.id);
        const courseAssessments = filteredAssessments.filter((a: any) => a.course_id === course.id);
        const completed = courseTrainees.filter((t: any) => {
          const traineeGrades = filteredGrades.filter((g: any) => g.trainee_id === t.id);
          return traineeGrades.length >= courseAssessments.length * 0.8; // 80% completion
        });

        return {
          name: course.name,
          totalTrainees: courseTrainees.length,
          totalAssessments: courseAssessments.length,
          completed: completed.length,
          completionRate: courseTrainees.length > 0 ? (completed.length / courseTrainees.length) * 100 : 0,
        };
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Course Completion Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #1a472a; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #1a472a; color: white; }
  </style>
</head>
<body>
  <h1>Course Completion Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm:ss")}</p>
  
  <h2>Course Statistics</h2>
  <table>
    <thead>
      <tr>
        <th>Course Name</th>
        <th>Total Trainees</th>
        <th>Total Assessments</th>
        <th>Completed</th>
        <th>Completion Rate</th>
      </tr>
    </thead>
    <tbody>
      ${courseStats.map((cs: any) => `
        <tr>
          <td>${cs.name}</td>
          <td>${cs.totalTrainees}</td>
          <td>${cs.totalAssessments}</td>
          <td>${cs.completed}</td>
          <td>${cs.completionRate.toFixed(2)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `course-completion-report-${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Course completion report generated successfully!",
      });
    } catch (error) {
      console.error("Error generating course completion report:", error);
      toast({
        title: "Error",
        description: "Failed to generate course completion report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const generateInstructorReport = async () => {
    setGenerating(4);
    try {
      const courseId = selectedCourse ? Number(selectedCourse) : undefined;
      const courseName = selectedCourse ? courses.find((c: any) => String(c.id) === selectedCourse)?.name : undefined;
      
      const [instructors, assessments, grades] = await Promise.all([
        usersApi.getAll().catch(() => []),
        assessmentsApi.getAll().catch(() => []),
        gradesApi.getAll().catch(() => []),
      ]);

      let filteredInstructors = Array.isArray(instructors) ? instructors.filter((i: any) => i.role === "instructor") : [];
      let filteredAssessments = Array.isArray(assessments) ? assessments : [];
      let filteredGrades = Array.isArray(grades) ? grades : [];

      if (courseId) {
        filteredInstructors = filteredInstructors.filter((i: any) => i.course_id === courseId);
        filteredAssessments = filteredAssessments.filter((a: any) => a.course_id === courseId);
        filteredGrades = filteredGrades.filter((g: any) => g.course_id === courseId);
      }

      const instructorStats = filteredInstructors.map((instructor: any) => {
        const instructorAssessments = filteredAssessments.filter((a: any) => a.instructor_id === instructor.id);
        const instructorGrades = filteredGrades.filter((g: any) => {
          return instructorAssessments.some((a: any) => a.id === g.assessment_id);
        });
        const avgScore = instructorGrades.length > 0
          ? instructorGrades.reduce((sum: number, g: any) => sum + (g.score || 0), 0) / instructorGrades.length
          : 0;

        return {
          name: instructor.name,
          user_id: instructor.user_id,
          totalAssessments: instructorAssessments.length,
          totalGrades: instructorGrades.length,
          averageScore: avgScore,
        };
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Instructor Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #1a472a; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #1a472a; color: white; }
  </style>
</head>
<body>
  <h1>Instructor Performance Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm:ss")}</p>
  ${courseName ? `<p>Course: ${courseName}</p>` : ''}
  
  <h2>Instructor Statistics</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>User ID</th>
        <th>Total Assessments</th>
        <th>Total Grades</th>
        <th>Average Score</th>
      </tr>
    </thead>
    <tbody>
      ${instructorStats.map((is: any) => `
        <tr>
          <td>${is.name}</td>
          <td>${is.user_id || 'N/A'}</td>
          <td>${is.totalAssessments}</td>
          <td>${is.totalGrades}</td>
          <td>${is.averageScore.toFixed(2)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `instructor-report-${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Instructor report generated successfully!",
      });
    } catch (error) {
      console.error("Error generating instructor report:", error);
      toast({
        title: "Error",
        description: "Failed to generate instructor report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  // Super Admin Report Generators
  const generateSystemOverviewReport = async () => {
    setGenerating(5);
    try {
      const [courses, users, materials, subjects, gallery, patients, reports, attendance, assessments, messages] = await Promise.all([
        coursesApi.getAll().catch(() => []),
        usersApi.getAll().catch(() => []),
        materialsApi.getAll().catch(() => []),
        subjectsApi.getAll().catch(() => []),
        galleryApi.getAll().catch(() => []),
        patientsApi.getAll().catch(() => []),
        medicalReportsApi.getAll().catch(() => []),
        attendanceApi.getAll().catch(() => []),
        assessmentsApi.getAll().catch(() => []),
        messagesApi.getAll().catch(() => []),
      ]);

      const coursesArray = Array.isArray(courses) ? courses : [];
      const usersArray = Array.isArray(users) ? users : [];
      const materialsArray = Array.isArray(materials) ? materials : [];
      const subjectsArray = Array.isArray(subjects) ? subjects : [];
      const galleryArray = Array.isArray(gallery) ? gallery : [];
      const patientsArray = Array.isArray(patients) ? patients : [];
      const reportsArray = Array.isArray(reports) ? reports : [];
      const attendanceArray = Array.isArray(attendance) ? attendance : [];
      const assessmentsArray = Array.isArray(assessments) ? assessments : [];
      const messagesArray = Array.isArray(messages) ? messages : [];

      const usersByRole: Record<string, number> = {};
      usersArray.forEach((user: any) => {
        const role = user.role || "unknown";
        usersByRole[role] = (usersByRole[role] || 0) + 1;
      });

      const materialsByType: Record<string, number> = {};
      materialsArray.forEach((material: any) => {
        const type = material.type || "unknown";
        materialsByType[type] = (materialsByType[type] || 0) + 1;
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA System Overview Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #22c55e; margin: 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .summary-card { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; text-align: center; }
    .summary-card h3 { margin: 0 0 10px 0; color: #22c55e; font-size: 14px; }
    .summary-card .value { font-size: 32px; font-weight: bold; color: #15803d; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #22c55e; color: white; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9fafb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>TAWA System Overview Report</h1>
    <p>Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm:ss")}</p>
  </div>

  <div class="summary-grid">
    <div class="summary-card"><h3>Total Courses</h3><div class="value">${coursesArray.length}</div></div>
    <div class="summary-card"><h3>Total Users</h3><div class="value">${usersArray.length}</div></div>
    <div class="summary-card"><h3>Total Materials</h3><div class="value">${materialsArray.length}</div></div>
    <div class="summary-card"><h3>Total Subjects</h3><div class="value">${subjectsArray.length}</div></div>
    <div class="summary-card"><h3>Gallery Items</h3><div class="value">${galleryArray.length}</div></div>
    <div class="summary-card"><h3>Total Patients</h3><div class="value">${patientsArray.length}</div></div>
    <div class="summary-card"><h3>Medical Reports</h3><div class="value">${reportsArray.length}</div></div>
    <div class="summary-card"><h3>Attendance Records</h3><div class="value">${attendanceArray.length}</div></div>
    <div class="summary-card"><h3>Assessments</h3><div class="value">${assessmentsArray.length}</div></div>
    <div class="summary-card"><h3>Messages</h3><div class="value">${messagesArray.length}</div></div>
  </div>

  <h2>Users by Role</h2>
  <table>
    <tr><th>Role</th><th>Count</th></tr>
    ${Object.entries(usersByRole).map(([role, count]) => `<tr><td>${role}</td><td>${count}</td></tr>`).join('')}
  </table>

  <h2>Materials by Type</h2>
  <table>
    <tr><th>Type</th><th>Count</th></tr>
    ${Object.entries(materialsByType).map(([type, count]) => `<tr><td>${type}</td><td>${count}</td></tr>`).join('')}
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_System_Overview_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "System overview report generated successfully!" });
    } catch (error) {
      console.error("Error generating system overview report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateUsersReport = async () => {
    setGenerating(6);
    try {
      const users = await usersApi.getAll().catch(() => []);
      const usersArray = Array.isArray(users) ? users : [];

      const usersByRole: Record<string, any[]> = {};
      usersArray.forEach((user: any) => {
        const role = user.role || "unknown";
        if (!usersByRole[role]) usersByRole[role] = [];
        usersByRole[role].push(user);
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Users Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #22c55e; color: white; }
  </style>
</head>
<body>
  <h1>TAWA Users Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy")}</p>
  <p>Total Users: ${usersArray.length}</p>
  
  ${Object.entries(usersByRole).map(([role, roleUsers]) => `
    <h2>${role.charAt(0).toUpperCase() + role.slice(1)}s (${roleUsers.length})</h2>
    <table>
      <tr><th>Name</th><th>User ID</th><th>Email</th><th>Phone</th><th>Course</th></tr>
      ${roleUsers.map((u: any) => `<tr><td>${u.name}</td><td>${u.user_id || 'N/A'}</td><td>${u.email || 'N/A'}</td><td>${u.phone || 'N/A'}</td><td>${u.course_name || 'N/A'}</td></tr>`).join('')}
    </table>
  `).join('')}
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_Users_Report_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Users report generated successfully!" });
    } catch (error) {
      console.error("Error generating users report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateCoursesReport = async () => {
    setGenerating(7);
    try {
      const courses = await coursesApi.getAll().catch(() => []);
      const coursesArray = Array.isArray(courses) ? courses : [];

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Courses Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #22c55e; color: white; }
  </style>
</head>
<body>
  <h1>TAWA Courses Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy")}</p>
  <p>Total Courses: ${coursesArray.length}</p>
  
  <table>
    <tr><th>Name</th><th>Code</th><th>Type</th><th>Status</th><th>Location</th><th>Start Date</th></tr>
    ${coursesArray.map((c: any) => `<tr><td>${c.name}</td><td>${c.code || 'N/A'}</td><td>${c.type || 'N/A'}</td><td>${c.status || 'Active'}</td><td>${c.location || 'N/A'}</td><td>${c.start_date || 'N/A'}</td></tr>`).join('')}
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_Courses_Report_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Courses report generated successfully!" });
    } catch (error) {
      console.error("Error generating courses report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateMaterialsReport = async () => {
    setGenerating(8);
    try {
      const materials = await materialsApi.getAll().catch(() => []);
      const materialsArray = Array.isArray(materials) ? materials : [];

      const materialsByType: Record<string, any[]> = {};
      materialsArray.forEach((material: any) => {
        const type = material.type || "unknown";
        if (!materialsByType[type]) materialsByType[type] = [];
        materialsByType[type].push(material);
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Materials Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #22c55e; color: white; }
  </style>
</head>
<body>
  <h1>TAWA Materials Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy")}</p>
  <p>Total Materials: ${materialsArray.length}</p>
  
  ${Object.entries(materialsByType).map(([type, typeMaterials]) => `
    <h2>${type} (${typeMaterials.length})</h2>
    <table>
      <tr><th>Name</th><th>Subject</th><th>Course</th><th>Uploaded By</th><th>Date</th></tr>
      ${typeMaterials.map((m: any) => `<tr><td>${m.name}</td><td>${m.subject || 'N/A'}</td><td>${m.course_name || 'N/A'}</td><td>${m.uploaded_by || 'N/A'}</td><td>${m.created_at ? format(new Date(m.created_at), "yyyy-MM-dd") : 'N/A'}</td></tr>`).join('')}
    </table>
  `).join('')}
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_Materials_Report_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Materials report generated successfully!" });
    } catch (error) {
      console.error("Error generating materials report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateGalleryReport = async () => {
    setGenerating(9);
    try {
      const gallery = await galleryApi.getAll().catch(() => []);
      const galleryArray = Array.isArray(gallery) ? gallery : [];

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Gallery Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #22c55e; color: white; }
  </style>
</head>
<body>
  <h1>TAWA Gallery Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy")}</p>
  <p>Total Gallery Items: ${galleryArray.length}</p>
  
  <table>
    <tr><th>Title</th><th>Course</th><th>Uploaded By</th><th>Date</th></tr>
    ${galleryArray.map((g: any) => `<tr><td>${g.title}</td><td>${g.course_name || 'N/A'}</td><td>${g.uploaded_by || 'N/A'}</td><td>${g.created_at ? format(new Date(g.created_at), "yyyy-MM-dd") : 'N/A'}</td></tr>`).join('')}
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_Gallery_Report_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Gallery report generated successfully!" });
    } catch (error) {
      console.error("Error generating gallery report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateSubjectsReport = async () => {
    setGenerating(10);
    try {
      const subjects = await subjectsApi.getAll().catch(() => []);
      const subjectsArray = Array.isArray(subjects) ? subjects : [];

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Subjects Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #22c55e; color: white; }
  </style>
</head>
<body>
  <h1>TAWA Subjects Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy")}</p>
  <p>Total Subjects: ${subjectsArray.length}</p>
  
  <table>
    <tr><th>Name</th><th>Code</th><th>Course</th><th>Instructor</th><th>Description</th></tr>
    ${subjectsArray.map((s: any) => `<tr><td>${s.name}</td><td>${s.code || 'N/A'}</td><td>${s.course_name || 'N/A'}</td><td>${s.instructor_name || 'N/A'}</td><td>${s.description || 'N/A'}</td></tr>`).join('')}
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_Subjects_Report_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Subjects report generated successfully!" });
    } catch (error) {
      console.error("Error generating subjects report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateTimetableReport = async () => {
    setGenerating(11);
    try {
      const timetable = await timetableApi.getAll().catch(() => []);
      const timetableArray = Array.isArray(timetable) ? timetable : [];

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Timetable Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #22c55e; color: white; }
  </style>
</head>
<body>
  <h1>TAWA Timetable Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy")}</p>
  <p>Total Timetable Entries: ${timetableArray.length}</p>
  
  <table>
    <tr><th>Date</th><th>Time</th><th>Subject</th><th>Instructor</th><th>Location</th><th>Course</th></tr>
    ${timetableArray.map((t: any) => `<tr><td>${t.date || 'N/A'}</td><td>${t.time || 'N/A'}</td><td>${t.subject || 'N/A'}</td><td>${t.instructor || 'N/A'}</td><td>${t.location || 'N/A'}</td><td>${t.course_name || 'N/A'}</td></tr>`).join('')}
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_Timetable_Report_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Timetable report generated successfully!" });
    } catch (error) {
      console.error("Error generating timetable report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generatePatientsReport = async () => {
    setGenerating(12);
    try {
      const patients = await patientsApi.getAll().catch(() => []);
      const patientsArray = Array.isArray(patients) ? patients : [];

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Patients Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #22c55e; color: white; }
  </style>
</head>
<body>
  <h1>TAWA Patients Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy")}</p>
  <p>Total Patients: ${patientsArray.length}</p>
  
  <table>
    <tr><th>Name</th><th>Email</th><th>Phone</th><th>Blood Type</th><th>Course</th><th>Registered Date</th></tr>
    ${patientsArray.map((p: any) => `<tr><td>${p.full_name}</td><td>${p.email || 'N/A'}</td><td>${p.phone || 'N/A'}</td><td>${p.blood_type || 'N/A'}</td><td>${p.course_name || 'N/A'}</td><td>${p.registered_date ? format(new Date(p.registered_date), "yyyy-MM-dd") : 'N/A'}</td></tr>`).join('')}
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_Patients_Report_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Patients report generated successfully!" });
    } catch (error) {
      console.error("Error generating patients report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateMedicalReportsReport = async () => {
    setGenerating(13);
    try {
      const reports = await medicalReportsApi.getAll().catch(() => []);
      const reportsArray = Array.isArray(reports) ? reports : [];

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Medical Reports Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #22c55e; color: white; }
  </style>
</head>
<body>
  <h1>TAWA Medical Reports Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy")}</p>
  <p>Total Medical Reports: ${reportsArray.length}</p>
  
  <table>
    <tr><th>Patient</th><th>Report Type</th><th>Date</th><th>Doctor</th><th>Course</th></tr>
    ${reportsArray.map((r: any) => `<tr><td>${r.patient_name || 'N/A'}</td><td>${r.report_type || 'N/A'}</td><td>${r.date ? format(new Date(r.date), "yyyy-MM-dd") : 'N/A'}</td><td>${r.doctor_name || 'N/A'}</td><td>${r.course_name || 'N/A'}</td></tr>`).join('')}
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_Medical_Reports_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Medical reports report generated successfully!" });
    } catch (error) {
      console.error("Error generating medical reports report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateChatBoardReport = async () => {
    setGenerating(14);
    try {
      const messages = await messagesApi.getAll().catch(() => []);
      const messagesArray = Array.isArray(messages) ? messages : [];

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Chat Board Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #22c55e; color: white; }
  </style>
</head>
<body>
  <h1>TAWA Chat Board Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy")}</p>
  <p>Total Messages: ${messagesArray.length}</p>
  
  <table>
    <tr><th>Sender</th><th>Message</th><th>Course</th><th>Date</th></tr>
    ${messagesArray.map((m: any) => `<tr><td>${m.sender_name || 'N/A'}</td><td>${m.content || 'N/A'}</td><td>${m.course_name || 'N/A'}</td><td>${m.created_at ? format(new Date(m.created_at), "yyyy-MM-dd HH:mm") : 'N/A'}</td></tr>`).join('')}
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_Chat_Board_Report_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Chat board report generated successfully!" });
    } catch (error) {
      console.error("Error generating chat board report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateAssessmentsReport = async () => {
    setGenerating(15);
    try {
      const assessments = await assessmentsApi.getAll().catch(() => []);
      const assessmentsArray = Array.isArray(assessments) ? assessments : [];

      const assessmentsByType: Record<string, any[]> = {};
      assessmentsArray.forEach((assessment: any) => {
        const type = assessment.type || "unknown";
        if (!assessmentsByType[type]) assessmentsByType[type] = [];
        assessmentsByType[type].push(assessment);
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Assessments Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #22c55e; color: white; }
  </style>
</head>
<body>
  <h1>TAWA Assessments Report</h1>
  <p>Generated on: ${format(new Date(), "MMMM dd, yyyy")}</p>
  <p>Total Assessments: ${assessmentsArray.length}</p>
  
  ${Object.entries(assessmentsByType).map(([type, typeAssessments]) => `
    <h2>${type} (${typeAssessments.length})</h2>
    <table>
      <tr><th>Title</th><th>Subject</th><th>Course</th><th>Date</th><th>Max Score</th></tr>
      ${typeAssessments.map((a: any) => `<tr><td>${a.title}</td><td>${a.subject_name || 'N/A'}</td><td>${a.course_name || 'N/A'}</td><td>${a.date ? format(new Date(a.date), "yyyy-MM-dd") : 'N/A'}</td><td>${a.max_score || 'N/A'}</td></tr>`).join('')}
    </table>
  `).join('')}
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_Assessments_Report_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Assessments report generated successfully!" });
    } catch (error) {
      console.error("Error generating assessments report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const generateResultsReport = async () => {
    setGenerating(16);
    try {
      const courseId = selectedCourse ? Number(selectedCourse) : undefined;
      const courseName = selectedCourse ? courses.find((c: any) => String(c.id) === selectedCourse)?.name : undefined;
      
      const [grades, trainees, assessments] = await Promise.all([
        gradesApi.getAll(undefined, undefined, undefined, courseId).catch(() => []),
        usersApi.getAll().catch(() => []),
        assessmentsApi.getAll(undefined, undefined, courseId).catch(() => []),
      ]);

      const gradesArray = Array.isArray(grades) ? grades : [];
      const traineesArray = Array.isArray(trainees) ? trainees.filter((t: any) => t.role === "trainee") : [];
      const assessmentsArray = Array.isArray(assessments) ? assessments : [];

      // Filter trainees by course if course is selected
      let filteredTrainees = traineesArray;
      let filteredGrades = gradesArray;
      let filteredAssessments = assessmentsArray;

      if (courseId) {
        filteredTrainees = traineesArray.filter((t: any) => t.course_id === courseId);
        filteredGrades = gradesArray.filter((g: any) => {
          const assessment = assessmentsArray.find((a: any) => a.id === g.assessment_id);
          return assessment && assessment.course_id === courseId;
        });
      }

      // Group grades by trainee
      const traineeResults = filteredTrainees.map((trainee: any) => {
        const traineeGrades = filteredGrades.filter((g: any) => g.trainee_id === trainee.id);
        const totalScore = traineeGrades.reduce((sum: number, g: any) => {
          const score = typeof g.score === 'number' ? g.score : parseFloat(g.score) || 0;
          return sum + score;
        }, 0);
        const maxScore = traineeGrades.reduce((sum: number, g: any) => {
          const assessment = filteredAssessments.find((a: any) => a.id === g.assessment_id);
          const max = typeof assessment?.max_score === 'number' ? assessment.max_score : parseFloat(assessment?.max_score) || 100;
          return sum + max;
        }, 0);
        const average = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        return {
          name: trainee.name,
          user_id: trainee.user_id,
          totalAssessments: traineeGrades.length,
          totalScore: totalScore.toFixed(2),
          maxScore: maxScore.toFixed(2),
          average: average.toFixed(2),
          grades: traineeGrades,
        };
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Results Report - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #22c55e; margin: 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .summary-card { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; text-align: center; }
    .summary-card h3 { margin: 0 0 10px 0; color: #22c55e; font-size: 14px; }
    .summary-card .value { font-size: 32px; font-weight: bold; color: #15803d; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #22c55e; color: white; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .grade-detail { margin-top: 10px; padding: 10px; background: #f0f9ff; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>TAWA Results Report</h1>
    <p>Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm:ss")}</p>
    ${courseName ? `<p><strong>Course:</strong> ${courseName}</p>` : ''}
  </div>

  <div class="summary-grid">
    <div class="summary-card"><h3>Total Trainees</h3><div class="value">${filteredTrainees.length}</div></div>
    <div class="summary-card"><h3>Total Grades</h3><div class="value">${filteredGrades.length}</div></div>
    <div class="summary-card"><h3>Total Assessments</h3><div class="value">${filteredAssessments.length}</div></div>
    <div class="summary-card"><h3>Average Score</h3><div class="value">${traineeResults.length > 0 ? (traineeResults.reduce((sum: number, tr: any) => sum + parseFloat(tr.average), 0) / traineeResults.length).toFixed(2) : '0.00'}%</div></div>
  </div>

  <h2>Trainee Results Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>User ID</th>
        <th>Total Assessments</th>
        <th>Total Score</th>
        <th>Max Score</th>
        <th>Average (%)</th>
      </tr>
    </thead>
    <tbody>
      ${traineeResults.map((tr: any) => `
        <tr>
          <td>${tr.name}</td>
          <td>${tr.user_id || 'N/A'}</td>
          <td>${tr.totalAssessments}</td>
          <td>${tr.totalScore}</td>
          <td>${tr.maxScore}</td>
          <td>${tr.average}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Detailed Grade Records</h2>
  <table>
    <thead>
      <tr>
        <th>Trainee</th>
        <th>Assessment</th>
        <th>Subject</th>
        <th>Score</th>
        <th>Max Score</th>
        <th>Percentage</th>
        <th>Comments</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${filteredGrades.map((g: any) => {
        const trainee = filteredTrainees.find((t: any) => t.id === g.trainee_id);
        const assessment = filteredAssessments.find((a: any) => a.id === g.assessment_id);
        const score = typeof g.score === 'number' ? g.score : parseFloat(g.score) || 0;
        const maxScore = typeof assessment?.max_score === 'number' ? assessment.max_score : parseFloat(assessment?.max_score) || 100;
        const percentage = maxScore > 0 ? ((score / maxScore) * 100).toFixed(2) : '0.00';
        return `
          <tr>
            <td>${trainee?.name || 'N/A'}</td>
            <td>${assessment?.title || 'N/A'}</td>
            <td>${assessment?.subject_name || 'N/A'}</td>
            <td>${score}</td>
            <td>${maxScore}</td>
            <td>${percentage}%</td>
            <td>${g.comments || 'N/A'}</td>
            <td>${g.created_at ? format(new Date(g.created_at), "yyyy-MM-dd") : 'N/A'}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TAWA_Results_Report_${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Results report generated successfully!" });
    } catch (error) {
      console.error("Error generating results report:", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateReport = (reportId: number, reportTitle: string) => {
    // Check if course is selected (except for system-wide reports)
    const systemWideReports = [5, 6, 7]; // System Overview, Users Report, Courses Report
    if (!systemWideReports.includes(reportId) && !selectedCourse) {
      toast({
        title: "Course Selection Required",
        description: "Please select a course before generating this report.",
        variant: "destructive",
      });
      return;
    }

    switch (reportId) {
      case 1:
        generatePerformanceReport();
        break;
      case 2:
        generateAttendanceReport();
        break;
      case 3:
        generateCourseCompletionReport();
        break;
      case 4:
        generateInstructorReport();
        break;
      case 5:
        if (isSuperAdmin) generateSystemOverviewReport();
        break;
      case 6:
        if (isSuperAdmin) generateUsersReport();
        break;
      case 7:
        if (isSuperAdmin) generateCoursesReport();
        break;
      case 8:
        if (isSuperAdmin) generateMaterialsReport();
        break;
      case 9:
        if (isSuperAdmin) generateGalleryReport();
        break;
      case 10:
        if (isSuperAdmin) generateSubjectsReport();
        break;
      case 11:
        if (isSuperAdmin) generateTimetableReport();
        break;
      case 12:
        if (isSuperAdmin) generatePatientsReport();
        break;
      case 13:
        if (isSuperAdmin) generateMedicalReportsReport();
        break;
      case 14:
        if (isSuperAdmin) generateChatBoardReport();
        break;
      case 15:
        if (isSuperAdmin) generateAssessmentsReport();
        break;
      case 16:
        generateResultsReport();
        break;
      default:
    toast({
          title: "Error",
          description: "Unknown report type.",
          variant: "destructive",
    });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate and download training reports</p>
      </div>

      {/* Course Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Course</CardTitle>
          <CardDescription>Choose a course before generating reports</CardDescription>
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
            {!selectedCourse && (
              <p className="text-sm text-muted-foreground">
                Please select a course to generate reports.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 bg-accent/20 rounded-lg ${report.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleGenerateReport(report.id, report.title)}
                  className="w-full"
                  variant="outline"
                  disabled={generating === report.id || (!selectedCourse && ![5, 6, 7].includes(report.id))}
                >
                  {generating === report.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[].length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No reports generated yet. Generated reports will appear here.
              </p>
            ) : (
              [].map((report, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.date} • {report.size}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
