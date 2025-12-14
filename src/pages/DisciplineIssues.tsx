import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { disciplineIssuesApi, usersApi, coursesApi } from "@/lib/api";
import { Plus, Search, Edit, Trash2, Download, FileText, AlertCircle, X, CheckCircle, XCircle, Eye, BookOpen, ChevronRight } from "lucide-react";
import { useCourse } from "@/contexts/CourseContext";

interface DisciplineIssue {
  id: number;
  user_id: number;
  course_id?: number;
  reported_by: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  incident_date: string;
  document_path?: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: number | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  user?: {
    id: number;
    name: string;
    user_id: string;
  };
  course?: {
    id: number;
    name: string;
  };
  reportedBy?: {
    id: number;
    name: string;
  };
  approvedBy?: {
    id: number;
    name: string;
  };
}

interface Course {
  id: number;
  name: string;
}

const DisciplineIssues = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedCourse, setSelectedCourse } = useCourse();
  const isSuperAdmin = user?.role === "super_admin";
  const adminCourseId = user?.course_id;

  const [issues, setIssues] = useState<DisciplineIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<DisciplineIssue | null>(null);
  const [rejectingIssue, setRejectingIssue] = useState<DisciplineIssue | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewingIssue, setViewingIssue] = useState<DisciplineIssue | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<DisciplineIssue | null>(null);
  const [approvingIssue, setApprovingIssue] = useState<DisciplineIssue | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const userSearchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    user_id: "",
    title: "",
    description: "",
    severity: "medium" as 'low' | 'medium' | 'high' | 'critical',
    incident_date: new Date().toISOString().split('T')[0],
    document: null as File | null,
    course_id: "",
  });

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    if (!userSearchQuery.trim()) return true;
    const query = userSearchQuery.toLowerCase().trim();
    return (
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.user_id && user.user_id.toString().toLowerCase().includes(query)) ||
      (user.phone && user.phone.toLowerCase().includes(query))
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    severity: "medium" as 'low' | 'medium' | 'high' | 'critical',
    status: "pending" as 'pending' | 'investigating' | 'resolved' | 'dismissed',
    incident_date: "",
    resolution_notes: "",
    document: null as File | null,
  });

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData = await coursesApi.getAll().catch(() => []);
        const coursesArray = Array.isArray(coursesData) ? coursesData : [];
        
        if (!isSuperAdmin && adminCourseId) {
          const filteredCourses = coursesArray.filter((c: any) => c.id === adminCourseId);
          setCourses(filteredCourses);
          if (filteredCourses.length > 0 && !selectedCourse) {
            setSelectedCourse(filteredCourses[0]);
          }
        } else {
          setCourses(coursesArray);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      }
    };
    loadCourses();
  }, [isSuperAdmin, adminCourseId]);

  // Load users when course is selected
  useEffect(() => {
    if (selectedCourse || (!isSuperAdmin && adminCourseId)) {
      loadUsers();
      // Clear selected user when course changes
      setSelectedUser(null);
      setUserSearchQuery("");
      setFormData(prev => ({ ...prev, user_id: "" }));
    }
  }, [selectedCourse, adminCourseId, isSuperAdmin]);

  // Load issues
  useEffect(() => {
    loadIssues();
  }, [searchQuery, statusFilter, severityFilter, approvalFilter, courseFilter, selectedCourse, adminCourseId]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const courseId = selectedCourse?.id || adminCourseId;
      console.log("Loading users for course:", courseId);
      const usersData = await usersApi.getAll(courseId ? { course_id: courseId } : undefined);
      const usersArray = Array.isArray(usersData) ? usersData : [];
      console.log("Loaded users:", usersArray.length, usersArray);
      setUsers(usersArray);
      if (usersArray.length === 0 && courseId) {
        toast({
          title: "No Users Found",
          description: "No users found in the selected course.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadIssues = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (severityFilter !== "all") params.severity = severityFilter;
      if (approvalFilter !== "all") params.approval_status = approvalFilter;
      if (searchQuery) params.search = searchQuery;
      
      // Add course filter - prioritize courseFilter dropdown, then selectedCourse, then adminCourseId
      // For super admin, if courseFilter is "all", don't filter by course (show all)
      // For non-super admin, always filter by their course
      if (courseFilter !== "all") {
        params.course_id = Number(courseFilter);
      } else if (!isSuperAdmin) {
        // For non-super admin, always filter by their course
      const courseId = selectedCourse?.id || adminCourseId;
      if (courseId) {
        params.course_id = courseId;
      }
      } else if (selectedCourse) {
        // For super admin, if a course is selected from card view, use it
        params.course_id = selectedCourse.id;
      }
      // If isSuperAdmin and courseFilter is "all" and no selectedCourse, don't add course_id filter (show all)

      const data = await disciplineIssuesApi.getAll(params);
      const issuesArray = Array.isArray(data) ? data : [];
      // Normalize relationship keys (handle both camelCase and snake_case)
      const normalizedIssues = issuesArray.map((issue: any) => ({
        ...issue,
        reportedBy: issue.reportedBy || issue.reported_by || null,
        approvedBy: issue.approvedBy || issue.approved_by || null,
      }));
      setIssues(normalizedIssues);
    } catch (error: any) {
      console.error("Error loading discipline issues:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load discipline issues.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id || !selectedUser || !formData.title || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please select a user and fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const createData: any = {
        user_id: Number(formData.user_id),
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        incident_date: formData.incident_date,
      };

      if (formData.document) {
        createData.document = formData.document;
      }

      if (isSuperAdmin && formData.course_id) {
        createData.course_id = Number(formData.course_id);
      }

      await disciplineIssuesApi.create(createData);
      
      toast({
        title: "Success",
        description: "Discipline issue created successfully.",
      });
      
      setShowForm(false);
      resetForm();
      loadIssues();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create discipline issue.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (issue: DisciplineIssue) => {
    setEditingIssue(issue);
    setEditFormData({
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      status: issue.status,
      incident_date: issue.incident_date.split('T')[0],
      resolution_notes: issue.resolution_notes || "",
      document: null,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingIssue) {
      toast({
        title: "Error",
        description: "No issue selected for editing.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Updating issue:", editingIssue.id, editFormData);
      const updateData: any = {
        title: editFormData.title,
        description: editFormData.description,
        severity: editFormData.severity,
        status: editFormData.status,
        incident_date: editFormData.incident_date,
      };

      if (editFormData.resolution_notes) {
        updateData.resolution_notes = editFormData.resolution_notes;
      }

      if (editFormData.document) {
        updateData.document = editFormData.document;
      }

      console.log("Update data:", updateData);
      const result = await disciplineIssuesApi.update(editingIssue.id, updateData);
      console.log("Update result:", result);
      
      toast({
        title: "Success",
        description: "Discipline issue updated successfully.",
      });
      
      setEditingIssue(null);
      resetEditForm();
      loadIssues();
    } catch (error: any) {
      console.error("Error updating discipline issue:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update discipline issue.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingIssue) {
      toast({
        title: "Error",
        description: "No issue selected for deletion.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Deleting issue:", deletingIssue.id);
      await disciplineIssuesApi.delete(deletingIssue.id);
      console.log("Issue deleted successfully");
      toast({
        title: "Success",
        description: "Discipline issue deleted successfully.",
      });
      setDeletingIssue(null);
      loadIssues();
    } catch (error: any) {
      console.error("Error deleting discipline issue:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete discipline issue.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = async (issue: DisciplineIssue) => {
    try {
      await disciplineIssuesApi.downloadDocument(issue.id);
      toast({
        title: "Download Started",
        description: "Document is being downloaded.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download document.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    if (!approvingIssue) return;

    try {
      await disciplineIssuesApi.approve(approvingIssue.id);
      toast({
        title: "Success",
        description: "Discipline issue approved successfully.",
      });
      setApprovingIssue(null);
      loadIssues();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve discipline issue.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!rejectingIssue) return;
    
    if (!rejectionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      await disciplineIssuesApi.reject(rejectingIssue.id, rejectionReason);
      toast({
        title: "Success",
        description: "Discipline issue rejected successfully.",
      });
      setRejectingIssue(null);
      setRejectionReason("");
      loadIssues();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject discipline issue.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: "",
      title: "",
      description: "",
      severity: "medium",
      incident_date: new Date().toISOString().split('T')[0],
      document: null,
      course_id: "",
    });
    setUserSearchQuery("");
    setSelectedUser(null);
    setShowUserDropdown(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setFormData({ ...formData, user_id: user.id.toString() });
    setUserSearchQuery(user.name + (user.user_id ? ` (${user.user_id})` : ` (${user.email})`));
    setShowUserDropdown(false);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setFormData({ ...formData, user_id: "" });
    setUserSearchQuery("");
    setShowUserDropdown(false);
  };

  const resetEditForm = () => {
    setEditFormData({
      title: "",
      description: "",
      severity: "medium",
      status: "pending",
      incident_date: "",
      resolution_notes: "",
      document: null,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'investigating': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      case 'dismissed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getApprovalStatusColor = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Group issues by course for super admin
  const issuesByCourse = useMemo(() => {
    if (!isSuperAdmin) return {};
    
    const grouped: Record<string, { course: Course; issues: DisciplineIssue[] }> = {};
    
    issues.forEach((issue) => {
      const courseId = issue.course_id?.toString() || 'no-course';
      const course = issue.course || { id: issue.course_id || 0, name: 'Unknown Course' };
      
      if (!grouped[courseId]) {
        grouped[courseId] = { course, issues: [] };
      }
      grouped[courseId].issues.push(issue);
    });
    
    return grouped;
  }, [issues, isSuperAdmin]);

  // Get approval statistics for a course
  const getCourseApprovalStats = (courseIssues: DisciplineIssue[]) => {
    return {
      pending: courseIssues.filter(i => i.approval_status === 'pending').length,
      approved: courseIssues.filter(i => i.approval_status === 'approved').length,
      rejected: courseIssues.filter(i => i.approval_status === 'rejected').length,
      total: courseIssues.length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Discipline Issues</h1>
          <p className="text-muted-foreground">
            Manage and track discipline issues for trainees
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Discipline Issue
        </Button>
      </div>

      {/* Super Admin Course Cards View */}
      {isSuperAdmin && !selectedCourse && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(issuesByCourse).map(([courseId, { course, issues: courseIssues }]) => {
            const stats = getCourseApprovalStats(courseIssues);
            
            return (
              <Card
                key={courseId}
                className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary animate-slide-up flex flex-col"
                style={{ animationDelay: `${parseInt(courseId) * 50}ms` }}
              >
                <CardHeader 
                  className="bg-gradient-to-r from-primary/10 to-primary/5 cursor-pointer"
                  onClick={() => {
                    setSelectedCourse(course);
                    setCourseFilter(course.id.toString());
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/20 rounded-lg group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">{course.name}</CardTitle>
                        {course.code && (
                          <CardDescription className="text-sm font-medium">{course.code}</CardDescription>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Issues</span>
                      <span className="text-lg font-bold">{stats.total}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <div className="text-xs text-muted-foreground">Pending</div>
                        <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-xs text-muted-foreground">Approved</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.approved}</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                        <div className="text-xs text-muted-foreground">Rejected</div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {Object.keys(issuesByCourse).length === 0 && !loading && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No discipline issues found across all courses.
            </div>
          )}
        </div>
      )}

      {/* Course Selection (for super admin when viewing specific course) */}
      {isSuperAdmin && selectedCourse && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedCourse.name}</CardTitle>
                <CardDescription>Viewing discipline issues for this course</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCourse(null);
                  setCourseFilter("all");
                }}
              >
                <X className="w-4 h-4 mr-2" />
                View All Courses
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {isSuperAdmin && (
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            {isSuperAdmin && (
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by approval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Approvals</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issues Table */}
        <Card>
          <CardHeader>
            <CardTitle>Discipline Issues</CardTitle>
            <CardDescription>
              {issues.length} issue(s) found
              {selectedCourse && ` in ${selectedCourse.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : issues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No discipline issues found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Incident Date</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{issue.user?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            {issue.user?.user_id || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={issue.title}>
                          {issue.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getApprovalStatusColor(issue.approval_status || 'pending')}>
                          {(issue.approval_status || 'pending').toUpperCase()}
                        </Badge>
                        {issue.approval_status === 'rejected' && issue.rejection_reason && (
                          <div className="text-xs text-muted-foreground mt-1" title={issue.rejection_reason}>
                            Reason: {issue.rejection_reason.substring(0, 30)}...
                          </div>
                        )}
                        {issue.approval_status === 'approved' && issue.approvedBy && (
                          <div className="text-xs text-muted-foreground mt-1">
                            By: {issue.approvedBy.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(issue.incident_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {issue.reportedBy?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {issue.document_path ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(issue)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">No document</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingIssue(issue)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isSuperAdmin && issue.approval_status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setApprovingIssue(issue)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRejectingIssue(issue)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(issue)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingIssue(issue)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Issue Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) {
          resetForm();
        } else {
          // Always load users when dialog opens
          if (selectedCourse || (!isSuperAdmin && adminCourseId)) {
            loadUsers();
          } else if (isSuperAdmin) {
            // For super admin, show message to select course first
            toast({
              title: "Select Course",
              description: "Please select a course first to load users.",
              variant: "default",
            });
          }
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <DialogTitle>Add Discipline Issue</DialogTitle>
            </div>
            <DialogDescription>
              Create a new discipline issue for a trainee
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {isSuperAdmin && (
              <div>
                <Label>Course</Label>
                <Select
                  value={formData.course_id}
                  onValueChange={async (value) => {
                    setFormData({ ...formData, course_id: value });
                    // Clear selected user when course changes
                    setSelectedUser(null);
                    setUserSearchQuery("");
                    // Load users for the selected course
                    try {
                      setLoadingUsers(true);
                      const usersData = await usersApi.getAll({ course_id: Number(value) });
                      const usersArray = Array.isArray(usersData) ? usersData : [];
                      setUsers(usersArray);
                    } catch (error) {
                      console.error("Error loading users:", error);
                      toast({
                        title: "Error",
                        description: "Failed to load users for this course.",
                        variant: "destructive",
                      });
                    } finally {
                      setLoadingUsers(false);
                    }
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="relative" ref={userSearchRef}>
              <Label>User *</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search user by name, ID, email, or phone..."
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setShowUserDropdown(true);
                      if (!e.target.value) {
                        setSelectedUser(null);
                        setFormData({ ...formData, user_id: "" });
                      }
                    }}
                    onFocus={() => {
                      setShowUserDropdown(true);
                      // Load users if not loaded yet
                      if (users.length === 0 && (selectedCourse || (!isSuperAdmin && adminCourseId))) {
                        loadUsers();
                      }
                    }}
                    disabled={loadingUsers}
                    className="pl-10 pr-10"
                    required={!formData.user_id}
                  />
                  {selectedUser && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={handleClearUser}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {showUserDropdown && (
                  <>
                    {filteredUsers.length > 0 ? (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="px-4 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                          >
                            <div className="font-medium">{user.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.user_id && <span>ID: {user.user_id}</span>}
                              {user.user_id && user.email && <span> • </span>}
                              {user.email && <span>{user.email}</span>}
                              {user.phone && <span> • {user.phone}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : userSearchQuery.trim() ? (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-4 text-center text-muted-foreground">
                        No users found matching "{userSearchQuery}"
                      </div>
                    ) : loadingUsers ? (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-4 text-center text-muted-foreground">
                        Loading users...
                      </div>
                    ) : users.length === 0 ? (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-4 text-center text-muted-foreground">
                        No users available. {isSuperAdmin ? 'Please select a course first.' : 'No users found in your course.'}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              {selectedUser && (
                <div className="mt-2 p-2 bg-accent rounded-md">
                  <div className="text-sm font-medium">Selected: {selectedUser.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedUser.user_id || selectedUser.email}
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Severity *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Incident Date *</Label>
                <Input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Document (Optional)</Label>
              <Input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, document: file });
                  }
                }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {formData.document && (
                <div className="mt-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{formData.document.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, document: null });
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowForm(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">Create Issue</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Issue Dialog */}
      <Dialog open={!!editingIssue} onOpenChange={(open) => !open && setEditingIssue(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Edit className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <DialogTitle>Edit Discipline Issue</DialogTitle>
            </div>
            <DialogDescription>
              Update discipline issue details and status
            </DialogDescription>
          </DialogHeader>
          {editingIssue && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Severity *</Label>
                  <Select
                    value={editFormData.severity}
                    onValueChange={(value: any) => setEditFormData({ ...editFormData, severity: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Incident Date *</Label>
                <Input
                  type="date"
                  value={editFormData.incident_date}
                  onChange={(e) => setEditFormData({ ...editFormData, incident_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Resolution Notes</Label>
                <Textarea
                  value={editFormData.resolution_notes}
                  onChange={(e) => setEditFormData({ ...editFormData, resolution_notes: e.target.value })}
                  rows={3}
                  placeholder="Add resolution notes when resolving the issue..."
                />
              </div>
              <div>
                <Label>Update Document (Optional)</Label>
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditFormData({ ...editFormData, document: file });
                    }
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {editingIssue.document_path && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Current document: {editingIssue.document_path.split('/').pop()}
                  </div>
                )}
                {editFormData.document && (
                  <div className="mt-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{editFormData.document.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditFormData({ ...editFormData, document: null })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setEditingIssue(null);
                  resetEditForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">Update Issue</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Issue Dialog */}
      <Dialog open={!!rejectingIssue} onOpenChange={(open) => !open && setRejectingIssue(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle>Reject Discipline Issue</DialogTitle>
            </div>
            <DialogDescription>
              Please provide a reason for rejecting this discipline issue
            </DialogDescription>
          </DialogHeader>
          {rejectingIssue && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">User:</span>
                  <span className="text-sm font-semibold">{rejectingIssue.user?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Title:</span>
                  <span className="text-sm font-semibold">{rejectingIssue.title}</span>
                </div>
              </div>
              <div>
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter the reason for rejection..."
                  rows={4}
                  required
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRejectingIssue(null);
                    setRejectionReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Issue
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Issue Confirmation Dialog */}
      <Dialog open={!!approvingIssue} onOpenChange={(open) => !open && setApprovingIssue(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle>Approve Discipline Issue</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to approve this discipline issue?
            </DialogDescription>
          </DialogHeader>
          {approvingIssue && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">User:</span>
                  <span className="text-sm font-semibold">{approvingIssue.user?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Title:</span>
                  <span className="text-sm font-semibold">{approvingIssue.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Severity:</span>
                  <Badge className={getSeverityColor(approvingIssue.severity)}>
                    {approvingIssue.severity.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApprovingIssue(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Issue
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Issue Confirmation Dialog */}
      <Dialog open={!!deletingIssue} onOpenChange={(open) => !open && setDeletingIssue(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle>Delete Discipline Issue</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete this discipline issue? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingIssue && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">User:</span>
                  <span className="text-sm font-semibold">{deletingIssue.user?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Title:</span>
                  <span className="text-sm font-semibold">{deletingIssue.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Severity:</span>
                  <Badge className={getSeverityColor(deletingIssue.severity)}>
                    {deletingIssue.severity.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingIssue(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Issue
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Issue Dialog */}
      <Dialog open={!!viewingIssue} onOpenChange={(open) => !open && setViewingIssue(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <DialogTitle>Discipline Issue Details</DialogTitle>
            </div>
            <DialogDescription>
              View complete details of the discipline issue
            </DialogDescription>
          </DialogHeader>
          {viewingIssue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <div className="font-medium">{viewingIssue.user?.name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">
                    {viewingIssue.user?.user_id || viewingIssue.user?.email || 'N/A'}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Course</Label>
                  <div className="font-medium">{viewingIssue.course?.name || 'N/A'}</div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Title</Label>
                <div className="font-medium">{viewingIssue.title}</div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {viewingIssue.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Severity</Label>
                  <div>
                    <Badge className={getSeverityColor(viewingIssue.severity)}>
                      {viewingIssue.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge className={getStatusColor(viewingIssue.status)}>
                      {viewingIssue.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Approval Status</Label>
                <div className="space-y-2">
                  <Badge className={getApprovalStatusColor(viewingIssue.approval_status || 'pending')}>
                    {(viewingIssue.approval_status || 'pending').toUpperCase()}
                  </Badge>
                  {viewingIssue.approval_status === 'approved' && viewingIssue.approvedBy && (
                    <div className="text-sm text-muted-foreground">
                      Approved by: {viewingIssue.approvedBy.name}
                      {viewingIssue.approved_at && (
                        <span> on {new Date(viewingIssue.approved_at).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {viewingIssue.approval_status === 'rejected' && (
                    <div className="space-y-1">
                      {viewingIssue.approvedBy && (
                        <div className="text-sm text-muted-foreground">
                          Rejected by: {viewingIssue.approvedBy.name}
                          {viewingIssue.approved_at && (
                            <span> on {new Date(viewingIssue.approved_at).toLocaleString()}</span>
                          )}
                        </div>
                      )}
                      {viewingIssue.rejection_reason && (
                        <div className="text-sm bg-red-50 dark:bg-red-950 p-3 rounded-md border border-red-200 dark:border-red-800">
                          <div className="font-medium text-red-700 dark:text-red-300 mb-1">Rejection Reason:</div>
                          <div className="text-red-600 dark:text-red-400">{viewingIssue.rejection_reason}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Incident Date</Label>
                  <div>{new Date(viewingIssue.incident_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reported By</Label>
                  <div>{viewingIssue.reportedBy?.name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(viewingIssue.created_at || '').toLocaleString()}
                  </div>
                </div>
              </div>

              {viewingIssue.document_path && (
                <div>
                  <Label className="text-muted-foreground">Document</Label>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(viewingIssue)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Document
                    </Button>
                  </div>
                </div>
              )}

              {viewingIssue.resolution_notes && (
                <div>
                  <Label className="text-muted-foreground">Resolution Notes</Label>
                  <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {viewingIssue.resolution_notes}
                  </div>
                </div>
              )}

              {viewingIssue.resolved_at && (
                <div>
                  <Label className="text-muted-foreground">Resolved At</Label>
                  <div>{new Date(viewingIssue.resolved_at).toLocaleString()}</div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setViewingIssue(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Issue Dialog */}
      <Dialog open={!!viewingIssue} onOpenChange={(open) => !open && setViewingIssue(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <DialogTitle>Discipline Issue Details</DialogTitle>
            </div>
            <DialogDescription>
              View complete details of the discipline issue
            </DialogDescription>
          </DialogHeader>
          {viewingIssue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <div className="font-medium">{viewingIssue.user?.name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">
                    {viewingIssue.user?.user_id || viewingIssue.user?.email || 'N/A'}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Course</Label>
                  <div className="font-medium">{viewingIssue.course?.name || 'N/A'}</div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Title</Label>
                <div className="font-medium">{viewingIssue.title}</div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {viewingIssue.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Severity</Label>
                  <div>
                    <Badge className={getSeverityColor(viewingIssue.severity)}>
                      {viewingIssue.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge className={getStatusColor(viewingIssue.status)}>
                      {viewingIssue.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Approval Status</Label>
                <div className="space-y-2">
                  <Badge className={getApprovalStatusColor(viewingIssue.approval_status || 'pending')}>
                    {(viewingIssue.approval_status || 'pending').toUpperCase()}
                  </Badge>
                  {viewingIssue.approval_status === 'approved' && viewingIssue.approvedBy && (
                    <div className="text-sm text-muted-foreground">
                      Approved by: {viewingIssue.approvedBy.name}
                      {viewingIssue.approved_at && (
                        <span> on {new Date(viewingIssue.approved_at).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {viewingIssue.approval_status === 'rejected' && (
                    <div className="space-y-1">
                      {viewingIssue.approvedBy && (
                        <div className="text-sm text-muted-foreground">
                          Rejected by: {viewingIssue.approvedBy.name}
                          {viewingIssue.approved_at && (
                            <span> on {new Date(viewingIssue.approved_at).toLocaleString()}</span>
                          )}
                        </div>
                      )}
                      {viewingIssue.rejection_reason && (
                        <div className="text-sm bg-red-50 dark:bg-red-950 p-3 rounded-md border border-red-200 dark:border-red-800">
                          <div className="font-medium text-red-700 dark:text-red-300 mb-1">Rejection Reason:</div>
                          <div className="text-red-600 dark:text-red-400">{viewingIssue.rejection_reason}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Incident Date</Label>
                  <div>{new Date(viewingIssue.incident_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reported By</Label>
                  <div>{viewingIssue.reportedBy?.name || 'Unknown'}</div>
                  {viewingIssue.created_at && (
                    <div className="text-sm text-muted-foreground">
                      {new Date(viewingIssue.created_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {viewingIssue.document_path && (
                <div>
                  <Label className="text-muted-foreground">Document</Label>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(viewingIssue)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Document
                    </Button>
                  </div>
                </div>
              )}

              {viewingIssue.resolution_notes && (
                <div>
                  <Label className="text-muted-foreground">Resolution Notes</Label>
                  <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {viewingIssue.resolution_notes}
                  </div>
                </div>
              )}

              {viewingIssue.resolved_at && (
                <div>
                  <Label className="text-muted-foreground">Resolved At</Label>
                  <div>{new Date(viewingIssue.resolved_at).toLocaleString()}</div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setViewingIssue(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisciplineIssues;

