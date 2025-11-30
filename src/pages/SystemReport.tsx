import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { coursesApi, usersApi, materialsApi, subjectsApi, galleryApi, patientsApi, medicalReportsApi, attendanceApi } from "@/lib/api";
import { Download, FileBarChart, Loader2, FileText, Users, BookOpen, Upload, Image, Activity, Calendar } from "lucide-react";
import { format } from "date-fns";

// System Report Component - Generates comprehensive reports of all system data
interface SystemReportData {
  courses: any[];
  users: any[];
  materials: any[];
  subjects: any[];
  gallery: any[];
  patients: any[];
  medicalReports: any[];
  attendance: any[];
  summary: {
    totalCourses: number;
    totalUsers: number;
    totalMaterials: number;
    totalSubjects: number;
    totalGalleryItems: number;
    totalPatients: number;
    totalReports: number;
    totalAttendance: number;
    usersByRole: Record<string, number>;
    materialsByType: Record<string, number>;
    courseStats?: Record<number, any> | null;
  };
}

const SystemReport = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<SystemReportData | null>(null);

  const isSuperAdmin = user?.role === "super_admin";
  const adminCourseId = user?.course_id;

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Fetch all data from the system
      let [courses, users, materials, subjects, gallery, patients, reports, attendance] = await Promise.all([
        coursesApi.getAll().catch(() => []),
        usersApi.getAll().catch(() => []),
        materialsApi.getAll().catch(() => []),
        subjectsApi.getAll().catch(() => []),
        galleryApi.getAll().catch(() => []),
        patientsApi.getAll().catch(() => []),
        medicalReportsApi.getAll().catch(() => []),
        attendanceApi.getAll().catch(() => []),
      ]);

      // Convert to arrays
      courses = Array.isArray(courses) ? courses : [];
      users = Array.isArray(users) ? users : [];
      materials = Array.isArray(materials) ? materials : [];
      subjects = Array.isArray(subjects) ? subjects : [];
      gallery = Array.isArray(gallery) ? gallery : [];
      patients = Array.isArray(patients) ? patients : [];
      reports = Array.isArray(reports) ? reports : [];
      attendance = Array.isArray(attendance) ? attendance : [];

      // Filter by course_id for regular admins
      if (!isSuperAdmin && adminCourseId) {
        // Filter courses - admin should only see their course
        courses = courses.filter((course: any) => course.id === adminCourseId);
        
        // Filter users - only users from admin's course
        users = users.filter((user: any) => user.course_id === adminCourseId);
        
        // Filter materials - only materials from admin's course
        materials = materials.filter((material: any) => material.course_id === adminCourseId);
        
        // Filter subjects - only subjects from admin's course
        subjects = subjects.filter((subject: any) => subject.course_id === adminCourseId);
        
        // Filter gallery - only gallery items from admin's course
        gallery = gallery.filter((item: any) => item.course_id === adminCourseId);
        
        // Filter patients - only patients from admin's course
        patients = patients.filter((patient: any) => patient.course_id === adminCourseId);
        
        // Filter medical reports - only reports for patients in admin's course
        const patientIds = new Set(patients.map((p: any) => p.id));
        reports = reports.filter((report: any) => patientIds.has(report.patient_id));
        
        // Filter attendance - only attendance for patients in admin's course
        attendance = attendance.filter((record: any) => patientIds.has(record.patient_id));
      }

      // Calculate summary statistics
      const usersByRole: Record<string, number> = {};
      users.forEach((user: any) => {
        const role = user.role || "unknown";
        usersByRole[role] = (usersByRole[role] || 0) + 1;
      });

      const materialsByType: Record<string, number> = {};
      materials.forEach((material: any) => {
        const type = material.type || "unknown";
        materialsByType[type] = (materialsByType[type] || 0) + 1;
      });

      // Group data by course for super admin
      const courseStats: Record<number, any> = {};
      
      if (isSuperAdmin) {
        courses.forEach((course: any) => {
          const courseId = course.id;
          const courseUsers = users.filter((u: any) => u.course_id === courseId);
          const courseMaterials = materials.filter((m: any) => m.course_id === courseId);
          const courseSubjects = subjects.filter((s: any) => s.course_id === courseId);
          const courseGallery = gallery.filter((g: any) => g.course_id === courseId);
          const coursePatients = patients.filter((p: any) => p.course_id === courseId);
          const patientIds = new Set(coursePatients.map((p: any) => p.id));
          const courseReports = reports.filter((r: any) => patientIds.has(r.patient_id));
          const courseAttendance = attendance.filter((a: any) => patientIds.has(a.patient_id));

          const courseUsersByRole: Record<string, number> = {};
          courseUsers.forEach((user: any) => {
            const role = user.role || "unknown";
            courseUsersByRole[role] = (courseUsersByRole[role] || 0) + 1;
          });

          const courseMaterialsByType: Record<string, number> = {};
          courseMaterials.forEach((material: any) => {
            const type = material.type || "unknown";
            courseMaterialsByType[type] = (courseMaterialsByType[type] || 0) + 1;
          });

          courseStats[courseId] = {
            course: course,
            users: courseUsers,
            materials: courseMaterials,
            subjects: courseSubjects,
            gallery: courseGallery,
            patients: coursePatients,
            reports: courseReports,
            attendance: courseAttendance,
            stats: {
              totalUsers: courseUsers.length,
              totalMaterials: courseMaterials.length,
              totalSubjects: courseSubjects.length,
              totalGalleryItems: courseGallery.length,
              totalPatients: coursePatients.length,
              totalReports: courseReports.length,
              totalAttendance: courseAttendance.length,
              usersByRole: courseUsersByRole,
              materialsByType: courseMaterialsByType,
            },
          };
        });
      }

      const summary = {
        totalCourses: courses.length,
        totalUsers: users.length,
        totalMaterials: materials.length,
        totalSubjects: subjects.length,
        totalGalleryItems: gallery.length,
        totalPatients: patients.length,
        totalReports: reports.length,
        totalAttendance: attendance.length,
        usersByRole,
        materialsByType,
        courseStats: isSuperAdmin ? courseStats : null, // Only for super admin
      };

      setReportData({
        courses,
        users,
        materials,
        subjects,
        gallery,
        patients,
        medicalReports: reports,
        attendance,
        summary,
      });
    } catch (error) {
      console.error("Error loading report data:", error);
      toast({
        title: "Error",
        description: "Failed to load system data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [user?.course_id, user?.role]);

  const generatePDFReport = () => {
    if (!reportData) {
      toast({
        title: "No Data",
        description: "Please wait for data to load before generating report.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const reportTitle = isSuperAdmin 
        ? "TAWA System Report" 
        : `TAWA Course Report - ${user?.course_name || "Course"}`;
      const reportType = isSuperAdmin 
        ? "Complete System Overview" 
        : `Course-Specific Report for ${user?.course_name || "Course"}`;
      
      // Create HTML content for the report
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${reportTitle} - ${format(new Date(), "yyyy-MM-dd")}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #22c55e;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #22c55e;
      margin: 0;
    }
    .header p {
      color: #666;
      margin: 5px 0;
    }
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .section h2 {
      color: #22c55e;
      border-bottom: 2px solid #22c55e;
      padding-bottom: 10px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .summary-card {
      background: #f0fdf4;
      border: 1px solid #22c55e;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      color: #22c55e;
      font-size: 14px;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #15803d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #22c55e;
      color: white;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${reportTitle}</h1>
    <p>Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm:ss")}</p>
    <p>Report Type: ${reportType}</p>
    ${!isSuperAdmin && user?.course_name ? `<p>Course: ${user.course_name}</p>` : ''}
  </div>

  ${isSuperAdmin && reportData.summary.courseStats ? `
  <div class="section">
    <h2>Course-wise Breakdown</h2>
    ${Object.values(reportData.summary.courseStats).map((courseData: any) => `
      <div style="margin: 30px 0; padding: 20px; border: 2px solid #22c55e; border-radius: 8px; background: #f0fdf4;">
        <h3 style="color: #22c55e; margin-top: 0;">${courseData.course.name}</h3>
        <p style="color: #666; margin: 5px 0;">${courseData.course.code || `Course ID: ${courseData.course.id}`}${courseData.course.location ? ` • ${courseData.course.location}` : ''}</p>
        <table>
          <tr>
            <th>Metric</th>
            <th>Count</th>
          </tr>
          <tr><td>Users</td><td>${courseData.stats.totalUsers}</td></tr>
          <tr><td>Materials</td><td>${courseData.stats.totalMaterials}</td></tr>
          <tr><td>Subjects</td><td>${courseData.stats.totalSubjects}</td></tr>
          <tr><td>Gallery Items</td><td>${courseData.stats.totalGalleryItems}</td></tr>
          <tr><td>Patients</td><td>${courseData.stats.totalPatients}</td></tr>
          <tr><td>Medical Reports</td><td>${courseData.stats.totalReports}</td></tr>
          <tr><td>Attendance Records</td><td>${courseData.stats.totalAttendance}</td></tr>
        </table>
        <div style="margin-top: 15px;">
          <h4>Users by Role:</h4>
          <ul>
            ${Object.entries(courseData.stats.usersByRole).map(([role, count]: [string, any]) => 
              `<li>${role}: ${count}</li>`
            ).join('')}
          </ul>
        </div>
        <div style="margin-top: 15px;">
          <h4>Materials by Type:</h4>
          <ul>
            ${Object.entries(courseData.stats.materialsByType).map(([type, count]: [string, any]) => 
              `<li>${type}: ${count}</li>`
            ).join('')}
          </ul>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2>Executive Summary</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Total Courses</h3>
        <div class="value">${reportData.summary.totalCourses}</div>
      </div>
      <div class="summary-card">
        <h3>Total Users</h3>
        <div class="value">${reportData.summary.totalUsers}</div>
      </div>
      <div class="summary-card">
        <h3>Total Materials</h3>
        <div class="value">${reportData.summary.totalMaterials}</div>
      </div>
      <div class="summary-card">
        <h3>Total Subjects</h3>
        <div class="value">${reportData.summary.totalSubjects}</div>
      </div>
      <div class="summary-card">
        <h3>Gallery Items</h3>
        <div class="value">${reportData.summary.totalGalleryItems}</div>
      </div>
      <div class="summary-card">
        <h3>Total Patients</h3>
        <div class="value">${reportData.summary.totalPatients}</div>
      </div>
      <div class="summary-card">
        <h3>Medical Reports</h3>
        <div class="value">${reportData.summary.totalReports}</div>
      </div>
      <div class="summary-card">
        <h3>Attendance Records</h3>
        <div class="value">${reportData.summary.totalAttendance}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>User Distribution by Role</h2>
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(reportData.summary.usersByRole)
          .map(
            ([role, count]) => `
        <tr>
          <td>${role.charAt(0).toUpperCase() + role.slice(1)}</td>
          <td>${count}</td>
          <td>${((count / reportData.summary.totalUsers) * 100).toFixed(2)}%</td>
        </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Materials Distribution by Type</h2>
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(reportData.summary.materialsByType)
          .map(
            ([type, count]) => `
        <tr>
          <td>${type}</td>
          <td>${count}</td>
          <td>${((count / reportData.summary.totalMaterials) * 100).toFixed(2)}%</td>
        </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Courses Overview</h2>
    <table>
      <thead>
        <tr>
          <th>Course Name</th>
          <th>Code</th>
          <th>Type</th>
          <th>Status</th>
          <th>Start Date</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.courses
          .map(
            (course) => `
        <tr>
          <td>${course.name || "N/A"}</td>
          <td>${course.code || "N/A"}</td>
          <td>${course.type || "N/A"}</td>
          <td>${course.status || "N/A"}</td>
          <td>${course.start_date ? format(new Date(course.start_date), "MMM dd, yyyy") : "N/A"}</td>
        </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>This report was automatically generated by the TAWA System</p>
    <p>© ${new Date().getFullYear()} TAWA - All rights reserved</p>
  </div>
</body>
</html>
      `;

      // Create a blob and download
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TAWA_System_Report_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "System report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateCourseReport = (courseData: any, reportFormat: 'html' | 'csv') => {
    if (!reportData) return;

    setGenerating(true);
    try {
      const course = courseData.course;
      const stats = courseData.stats;
      const reportDate = format(new Date(), "yyyy-MM-dd");
      const reportDateTime = format(new Date(), "MMMM dd, yyyy 'at' HH:mm:ss");
      
      if (reportFormat === 'html') {
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TAWA Course Report - ${course.name} - ${reportDate}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #22c55e; margin: 0; }
    .header p { color: #666; margin: 5px 0; }
    .section { margin: 30px 0; page-break-inside: avoid; }
    .section h2 { color: #22c55e; border-bottom: 2px solid #22c55e; padding-bottom: 10px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .summary-card { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; text-align: center; }
    .summary-card h3 { margin: 0 0 10px 0; color: #22c55e; font-size: 14px; }
    .summary-card .value { font-size: 32px; font-weight: bold; color: #15803d; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #22c55e; color: white; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>TAWA Course Report - ${course.name}</h1>
    <p>Generated on: ${reportDateTime}</p>
    <p>Course Code: ${course.code || 'N/A'}</p>
    ${course.location ? `<p>Location: ${course.location}</p>` : ''}
    <p>Status: ${course.status || 'Active'}</p>
  </div>

  <div class="section">
    <h2>Course Statistics</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Total Users</h3>
        <div class="value">${stats.totalUsers}</div>
      </div>
      <div class="summary-card">
        <h3>Total Materials</h3>
        <div class="value">${stats.totalMaterials}</div>
      </div>
      <div class="summary-card">
        <h3>Total Subjects</h3>
        <div class="value">${stats.totalSubjects}</div>
      </div>
      <div class="summary-card">
        <h3>Gallery Items</h3>
        <div class="value">${stats.totalGalleryItems}</div>
      </div>
      <div class="summary-card">
        <h3>Total Patients</h3>
        <div class="value">${stats.totalPatients}</div>
      </div>
      <div class="summary-card">
        <h3>Medical Reports</h3>
        <div class="value">${stats.totalReports}</div>
      </div>
      <div class="summary-card">
        <h3>Attendance Records</h3>
        <div class="value">${stats.totalAttendance}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Users by Role</h2>
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(stats.usersByRole).map(([role, count]: [string, any]) => {
          const percentage = stats.totalUsers > 0 ? ((count / stats.totalUsers) * 100).toFixed(2) : '0';
          return `<tr><td>${role.charAt(0).toUpperCase() + role.slice(1)}</td><td>${count}</td><td>${percentage}%</td></tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Materials by Type</h2>
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(stats.materialsByType).map(([type, count]: [string, any]) => {
          const percentage = stats.totalMaterials > 0 ? ((count / stats.totalMaterials) * 100).toFixed(2) : '0';
          return `<tr><td>${type}</td><td>${count}</td><td>${percentage}%</td></tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>This report was automatically generated by the TAWA System</p>
    <p>© ${new Date().getFullYear()} TAWA - All rights reserved</p>
  </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `TAWA_Course_Report_${course.name.replace(/\s+/g, '_')}_${reportDate}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // CSV format
        const csvDateTime = format(new Date(), "yyyy-MM-dd HH:mm:ss");
        let csvContent = `TAWA Course Report - ${course.name}\n`;
        csvContent += `Generated on: ${csvDateTime}\n`;
        csvContent += `Course Code: ${course.code || 'N/A'}\n`;
        if (course.location) csvContent += `Location: ${course.location}\n`;
        csvContent += `Status: ${course.status || 'Active'}\n`;
        csvContent += "\n";

        csvContent += "COURSE STATISTICS\n";
        csvContent += "Metric,Value\n";
        csvContent += `Total Users,${stats.totalUsers}\n`;
        csvContent += `Total Materials,${stats.totalMaterials}\n`;
        csvContent += `Total Subjects,${stats.totalSubjects}\n`;
        csvContent += `Gallery Items,${stats.totalGalleryItems}\n`;
        csvContent += `Total Patients,${stats.totalPatients}\n`;
        csvContent += `Medical Reports,${stats.totalReports}\n`;
        csvContent += `Attendance Records,${stats.totalAttendance}\n\n`;

        csvContent += "USERS BY ROLE\n";
        csvContent += "Role,Count,Percentage\n";
        Object.entries(stats.usersByRole).forEach(([role, count]: [string, any]) => {
          const percentage = stats.totalUsers > 0 ? ((count / stats.totalUsers) * 100).toFixed(2) : '0';
          csvContent += `${role},${count},${percentage}%\n`;
        });
        csvContent += "\n";

        csvContent += "MATERIALS BY TYPE\n";
        csvContent += "Type,Count,Percentage\n";
        Object.entries(stats.materialsByType).forEach(([type, count]: [string, any]) => {
          const percentage = stats.totalMaterials > 0 ? ((count / stats.totalMaterials) * 100).toFixed(2) : '0';
          csvContent += `${type},${count},${percentage}%\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `TAWA_Course_Report_${course.name.replace(/\s+/g, '_')}_${reportDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Report Generated",
        description: `Course report for ${course.name} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error("Error generating course report:", error);
      toast({
        title: "Error",
        description: "Failed to generate course report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateCSVReport = () => {
    if (!reportData) {
      toast({
        title: "No Data",
        description: "Please wait for data to load before generating report.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Generate CSV content
      const reportTitle = isSuperAdmin 
        ? "TAWA System Report" 
        : `TAWA Course Report - ${user?.course_name || "Course"}`;
      
      let csvContent = `${reportTitle}\n`;
      csvContent += `Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}\n`;
      if (!isSuperAdmin && user?.course_name) {
        csvContent += `Course: ${user.course_name}\n`;
      }
      csvContent += "\n";

      // Course-wise Breakdown (Super Admin only)
      if (isSuperAdmin && reportData.summary.courseStats) {
        csvContent += "COURSE-WISE BREAKDOWN\n";
        csvContent += "Course Name,Code,Location,Users,Materials,Subjects,Gallery Items,Patients,Medical Reports,Attendance Records\n";
        Object.values(reportData.summary.courseStats).forEach((courseData: any) => {
          csvContent += `"${courseData.course.name}","${courseData.course.code || 'N/A'}","${courseData.course.location || 'N/A'}",${courseData.stats.totalUsers},${courseData.stats.totalMaterials},${courseData.stats.totalSubjects},${courseData.stats.totalGalleryItems},${courseData.stats.totalPatients},${courseData.stats.totalReports},${courseData.stats.totalAttendance}\n`;
        });
        csvContent += "\n";
      }

      // Summary
      csvContent += "SUMMARY\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Courses,${reportData.summary.totalCourses}\n`;
      csvContent += `Total Users,${reportData.summary.totalUsers}\n`;
      csvContent += `Total Materials,${reportData.summary.totalMaterials}\n`;
      csvContent += `Total Subjects,${reportData.summary.totalSubjects}\n`;
      csvContent += `Total Gallery Items,${reportData.summary.totalGalleryItems}\n`;
      csvContent += `Total Patients,${reportData.summary.totalPatients}\n`;
      csvContent += `Total Medical Reports,${reportData.summary.totalReports}\n`;
      csvContent += `Total Attendance Records,${reportData.summary.totalAttendance}\n\n`;

      // Users by Role
      csvContent += "USERS BY ROLE\n";
      csvContent += "Role,Count,Percentage\n";
      Object.entries(reportData.summary.usersByRole).forEach(([role, count]) => {
        const percentage = ((count / reportData.summary.totalUsers) * 100).toFixed(2);
        csvContent += `${role},${count},${percentage}%\n`;
      });
      csvContent += "\n";

      // Courses
      csvContent += "COURSES\n";
      csvContent += "Name,Code,Type,Status,Start Date\n";
      reportData.courses.forEach((course) => {
        csvContent += `"${course.name || ""}","${course.code || ""}","${course.type || ""}","${course.status || ""}","${course.start_date || ""}"\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TAWA_System_Report_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "CSV report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating CSV report:", error);
      toast({
        title: "Error",
        description: "Failed to generate CSV report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading system data...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileBarChart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <FileBarChart className="w-8 h-8" />
            {isSuperAdmin ? "System Report" : "Course Report"}
          </h2>
          <p className="text-muted-foreground">
            {isSuperAdmin 
              ? "Comprehensive overview of all system data and statistics"
              : `Report for ${user?.course_name || "your course"} - Course-specific data and statistics`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generatePDFReport}
            disabled={generating}
            className="bg-gradient-military hover:shadow-lg transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download HTML Report
              </>
            )}
          </Button>
          <Button
            onClick={generateCSVReport}
            disabled={generating}
            variant="outline"
            className="hover:shadow-lg transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Download CSV Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{reportData.summary.totalCourses}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{reportData.summary.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Upload className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{reportData.summary.totalMaterials}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Activity className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">{reportData.summary.totalPatients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Course-wise Breakdown (Super Admin Only) */}
      {isSuperAdmin && reportData.summary.courseStats && Object.keys(reportData.summary.courseStats).length > 0 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-primary mb-2">Course-wise Statistics</h3>
            <p className="text-muted-foreground">Detailed breakdown of data by course</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {Object.values(reportData.summary.courseStats).map((courseData: any) => (
              <Card key={courseData.course.id} className="border-2 hover:shadow-xl transition-all">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{courseData.course.name}</CardTitle>
                      <CardDescription>
                        {courseData.course.code || `Course ID: ${courseData.course.id}`}
                        {courseData.course.location && ` • ${courseData.course.location}`}
                      </CardDescription>
                    </div>
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-sm text-muted-foreground mb-1">Users</p>
                      <p className="text-2xl font-bold text-accent">{courseData.stats.totalUsers}</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-sm text-muted-foreground mb-1">Materials</p>
                      <p className="text-2xl font-bold text-blue-500">{courseData.stats.totalMaterials}</p>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-sm text-muted-foreground mb-1">Subjects</p>
                      <p className="text-2xl font-bold text-green-500">{courseData.stats.totalSubjects}</p>
                    </div>
                    <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <p className="text-sm text-muted-foreground mb-1">Patients</p>
                      <p className="text-2xl font-bold text-purple-500">{courseData.stats.totalPatients}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-3">Users by Role</h4>
                      <div className="space-y-2">
                        {Object.entries(courseData.stats.usersByRole).map(([role, count]: [string, any]) => {
                          const percentage = courseData.stats.totalUsers > 0 
                            ? ((count / courseData.stats.totalUsers) * 100).toFixed(1)
                            : "0";
                          return (
                            <div key={role} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{role}</span>
                              <span className="font-medium">{count} ({percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Materials by Type</h4>
                      <div className="space-y-2">
                        {Object.entries(courseData.stats.materialsByType).map(([type, count]: [string, any]) => {
                          const percentage = courseData.stats.totalMaterials > 0
                            ? ((count / courseData.stats.totalMaterials) * 100).toFixed(1)
                            : "0";
                          return (
                            <div key={type} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{type}</span>
                              <span className="font-medium">{count} ({percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Gallery Items</p>
                      <p className="font-bold text-lg">{courseData.stats.totalGalleryItems}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Medical Reports</p>
                      <p className="font-bold text-lg">{courseData.stats.totalReports}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Attendance Records</p>
                      <p className="font-bold text-lg">{courseData.stats.totalAttendance}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-bold text-lg capitalize">{courseData.course.status || "Active"}</p>
                    </div>
                  </div>
                  
                  {/* Download Buttons for Individual Course */}
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <Button
                      onClick={() => generateCourseReport(courseData, 'html')}
                      disabled={generating}
                      size="sm"
                      className="flex-1 bg-gradient-military hover:shadow-lg transition-all"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download HTML
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => generateCourseReport(courseData, 'csv')}
                      disabled={generating}
                      size="sm"
                      variant="outline"
                      className="flex-1 hover:shadow-lg transition-all"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Download CSV
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <CardDescription>Distribution of users across different roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportData.summary.usersByRole).map(([role, count]) => {
                const percentage = ((count / reportData.summary.totalUsers) * 100).toFixed(1);
                return (
                  <div key={role} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium capitalize">{role}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Materials by Type</CardTitle>
            <CardDescription>Distribution of materials across different types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportData.summary.materialsByType).map(([type, count]) => {
                const percentage = ((count / reportData.summary.totalMaterials) * 100).toFixed(1);
                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium capitalize">{type}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary.totalSubjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Gallery Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary.totalGalleryItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Medical Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary.totalReports}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemReport;

