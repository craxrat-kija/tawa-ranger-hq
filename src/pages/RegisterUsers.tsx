import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, subjectsApi, coursesApi, apiRequest } from "@/lib/api";
import { Edit, Trash2, UserPlus, Download, Upload, Search, BookOpen, Users, X, ChevronRight, ChevronLeft, FileSpreadsheet } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  course_id?: number;
  course_name?: string;
  user_id?: string;
}

interface Course {
  id: number;
  name: string;
  code?: string;
  location?: string;
}

const RegisterUsers = () => {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";
  const canCreateUsers = isSuperAdmin;
  
  const [showForm, setShowForm] = useState(false);
  const [showExcelDialog, setShowExcelDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    department: "",
    password: "",
    course_id: "",
  });

  useEffect(() => {
    if (user) {
      if (isSuperAdmin) {
        loadCourses();
      }
      loadSubjects();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user, selectedCourse, searchQuery]);

  const loadCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await subjectsApi.getAll();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      // Only filter by course if a specific course is selected
      // When showing all course cards (selectedCourse is null), load all users
      if (selectedCourse && isSuperAdmin) {
        params.course_id = selectedCourse.id;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      // Use apiRequest with proper authentication
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/users?${queryString}` : '/users';
      
      const response = await apiRequest<any>(endpoint);
      
      const usersData = Array.isArray(response) ? response : (response?.data || []);
      
      setUsers(usersData.map((u: any) => ({
        id: u.id.toString(),
        user_id: u.user_id || u.id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone || "",
        department: u.department || "",
        course_id: u.course_id,
        course_name: u.course_name || null,
      })));
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load users. Please try again.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group users by course for super admin
  const usersByCourse = useMemo(() => {
    if (!isSuperAdmin) return {};
    
    const grouped: Record<number, { course: Course; users: User[] }> = {};
    
    courses.forEach(course => {
      const courseUsers = users.filter(u => u.course_id === course.id);
      grouped[course.id] = {
        course,
        users: courseUsers,
      };
    });
    
    // Add users without course
    const usersWithoutCourse = users.filter(u => !u.course_id || u.course_id === null);
    if (usersWithoutCourse.length > 0) {
      grouped[0] = {
        course: { id: 0, name: "No Course Assigned", code: "N/A" },
        users: usersWithoutCourse,
      };
    }
    
    return grouped;
  }, [users, courses, isSuperAdmin]);

  // Filtered users based on search and selected course
  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    if (selectedCourse && isSuperAdmin) {
      filtered = filtered.filter(u => u.course_id === selectedCourse.id);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.user_id ? String(u.user_id).toLowerCase().includes(query) : false) ||
        (u.phone ? u.phone.toLowerCase().includes(query) : false) ||
        (u.department ? u.department.toLowerCase().includes(query) : false) ||
        u.role.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [users, selectedCourse, searchQuery, isSuperAdmin]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCourse]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadUsers();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCourse]);

  const handleDownloadTemplate = async () => {
    try {
      await usersApi.downloadTemplate();
      toast({
        title: "Success",
        description: "Template downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download template.",
        variant: "destructive",
      });
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      toast({
        title: "Error",
        description: "Please select an Excel file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const courseId = selectedCourse ? selectedCourse.id : undefined;
      const result = await usersApi.importFromExcel(excelFile, courseId);
      
      const importedCount = result.data?.imported || 0;
      const hasErrors = result.data?.errors && result.data.errors.length > 0;
      
      if (importedCount === 0) {
        toast({
          title: "No Users Imported",
          description: hasErrors 
            ? `No users were imported. ${result.data.errors.slice(0, 3).join(' ')}`
            : "No users were imported. Please check your Excel file format and ensure rows are not empty.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result.message || `Successfully imported ${importedCount} user(s).${hasErrors ? ` Some errors occurred.` : ''}`,
        });
      }
      
      setExcelFile(null);
      setShowExcelDialog(false);
      loadUsers();
    } catch (error: any) {
      console.error('Excel import error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to import users from Excel.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editUser) {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          department: formData.department,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        if (formData.role === 'instructor' && selectedSubjects.length > 0) {
          updateData.subject_ids = selectedSubjects;
        } else if (formData.role === 'instructor') {
          updateData.subject_ids = [];
        }

        await usersApi.update(editUser.id, updateData);
        toast({
          title: "User Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        if (!canCreateUsers) {
          toast({
            title: "Access Denied",
            description: "Only super administrators can create new users.",
            variant: "destructive",
          });
          return;
        }
        
        if (formData.role !== 'trainee' && !formData.password) {
          toast({
            title: "Password Required",
            description: "Please provide a password for the new user.",
            variant: "destructive",
          });
          return;
        }
        
        const createData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          department: formData.department,
        };
        
        // Add course_id if super admin and course is selected
        if (isSuperAdmin && selectedCourse) {
          createData.course_id = selectedCourse.id;
        } else if (isSuperAdmin && formData.course_id) {
          createData.course_id = parseInt(formData.course_id);
        }
        
        if (formData.password) {
          createData.password = formData.password;
        }
        if (formData.role === 'instructor' && selectedSubjects.length > 0) {
          createData.subject_ids = selectedSubjects;
        }

        const response = await usersApi.create(createData);
        const registeredUser = response?.data || response;
        const userId = registeredUser?.user_id || 'User ID pending';
        
        toast({
          title: "User Registered",
          description: `${formData.name} has been registered successfully. User ID: ${userId}`,
        });
      }

      setFormData({ 
        name: "", 
        email: "", 
        role: "", 
        phone: "", 
        department: "", 
        password: "", 
        course_id: selectedCourse ? selectedCourse.id.toString() : "" 
      });
      setSelectedSubjects([]);
      setShowForm(false);
      setEditUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      let errorMessage = "Failed to save user. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat().join(', ');
        errorMessage = validationErrors || errorMessage;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (user: User) => {
    setEditUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      department: user.department,
      password: "",
      course_id: user.course_id?.toString() || "",
    });
    
    if (user.role === 'instructor') {
      try {
        const userData = await usersApi.getById(user.id);
        setSelectedSubjects(userData.subjects?.map((s: any) => s.id) || []);
      } catch (error: any) {
        console.error('Error loading user subjects:', error);
        setSelectedSubjects([]);
      }
    } else {
      setSelectedSubjects([]);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const userToDelete = users.find(u => u.id === userId);
      await usersApi.delete(userId);
      toast({
        title: "User Deleted",
        description: `${userToDelete?.name} has been removed from the system.`,
        variant: "destructive",
      });
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "instructor": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "doctor": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "trainee": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getRoleCounts = (usersList: User[]) => {
    return {
      admin: usersList.filter(u => u.role === 'admin').length,
      instructor: usersList.filter(u => u.role === 'instructor').length,
      doctor: usersList.filter(u => u.role === 'doctor').length,
      trainee: usersList.filter(u => u.role === 'trainee').length,
    };
  };

  if (authLoading || !user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">User Management</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin 
              ? "Manage all users across all courses" 
              : isAdmin 
                ? "Manage users in your course" 
                : "View users in the system"}
          </p>
        </div>
        {canCreateUsers && selectedCourse && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleDownloadTemplate}
              className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowExcelDialog(true)}
              className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Button 
              className="bg-gradient-military" 
              onClick={() => { 
                setEditUser(null); 
                setFormData({ 
                  name: "", 
                  email: "", 
                  role: "", 
                  phone: "", 
                  department: "", 
                  password: "", 
                  course_id: selectedCourse.id.toString()
                }); 
                setSelectedSubjects([]);
                setShowForm(true);
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User to {selectedCourse.name}
            </Button>
          </div>
        )}
      </div>

      {/* Super Admin Course Cards View */}
      {isSuperAdmin && !selectedCourse && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(usersByCourse).map(([courseId, { course, users: courseUsers }]) => {
            const counts = getRoleCounts(courseUsers);
            const totalUsers = courseUsers.length;
            
            return (
              <Card
                key={courseId}
                className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary animate-slide-up flex flex-col"
                style={{ animationDelay: `${parseInt(courseId) * 50}ms` }}
              >
                <CardHeader 
                  className="bg-gradient-to-r from-primary/10 to-primary/5 cursor-pointer"
                  onClick={() => setSelectedCourse(course)}
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
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Total Users</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{totalUsers}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {counts.admin > 0 && (
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded text-center">
                          <div className="text-xs text-red-600 dark:text-red-300">Admins</div>
                          <div className="text-lg font-bold text-red-800 dark:text-red-200">{counts.admin}</div>
                        </div>
                      )}
                      {counts.instructor > 0 && (
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded text-center">
                          <div className="text-xs text-blue-600 dark:text-blue-300">Instructors</div>
                          <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{counts.instructor}</div>
                        </div>
                      )}
                      {counts.doctor > 0 && (
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded text-center">
                          <div className="text-xs text-green-600 dark:text-green-300">Doctors</div>
                          <div className="text-lg font-bold text-green-800 dark:text-green-200">{counts.doctor}</div>
                        </div>
                      )}
                      {counts.trainee > 0 && (
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded text-center">
                          <div className="text-xs text-purple-600 dark:text-purple-300">Trainees</div>
                          <div className="text-lg font-bold text-purple-800 dark:text-purple-200">{counts.trainee}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t space-y-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowExcelDialog(true);
                      }}
                      className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Excel
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-gradient-military"
                      onClick={() => {
                        setSelectedCourse(course);
                        setEditUser(null);
                        setFormData({
                          name: "",
                          email: "",
                          role: "",
                          phone: "",
                          department: "",
                          password: "",
                          course_id: course.id.toString(),
                        });
                        setSelectedSubjects([]);
                        setShowForm(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User to {course.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Search Bar for Super Admin - Show after cards when viewing all courses */}
      {isSuperAdmin && !selectedCourse && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search all users across all courses by name, email, user ID, phone, department, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Selected Course Header (Super Admin) */}
      {isSuperAdmin && selectedCourse && (
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCourse(null)}
              className="hover:bg-primary/20"
            >
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-primary">{selectedCourse.name}</h2>
              {selectedCourse.code && (
                <p className="text-sm text-muted-foreground">Course Code: {selectedCourse.code}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length} user(s) in this course
            </div>
            {canCreateUsers && (
              <Button 
                size="sm"
                className="bg-gradient-military" 
                onClick={() => { 
                  setEditUser(null); 
                  setFormData({ 
                    name: "", 
                    email: "", 
                    role: "", 
                    phone: "", 
                    department: "", 
                    password: "", 
                    course_id: selectedCourse.id.toString() 
                  }); 
                  setSelectedSubjects([]);
                  setShowForm(true);
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User to This Course
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search Bar - Only show when viewing users (not cards) */}
      {(selectedCourse || !isSuperAdmin) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder={
              selectedCourse 
                ? `Search users in ${selectedCourse.name} by name, email, user ID, phone, department, or role...`
                : "Search users by name, email, user ID, phone, department, or role..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No users found matching your search." : "No users found."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Group by Role */}
          {['admin', 'instructor', 'doctor', 'trainee'].map((role) => {
            const roleUsers = paginatedUsers.filter(u => u.role === role);
            if (roleUsers.length === 0) return null;

            return (
              <Card key={role} className="border-2 animate-slide-up hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-primary capitalize">{role}s</CardTitle>
                      <CardDescription>Manage {role} accounts</CardDescription>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getRoleColor(role)}`}>
                      {roleUsers.length} {roleUsers.length === 1 ? role : `${role}s`}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Department</TableHead>
                        {isSuperAdmin && <TableHead>Course</TableHead>}
                        {isAdmin && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roleUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="font-mono text-sm">{user.user_id || user.id}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone || "N/A"}</TableCell>
                          <TableCell>{user.department || "N/A"}</TableCell>
                          {isSuperAdmin && (
                            <TableCell>{user.course_name || "N/A"}</TableCell>
                          )}
                          {isAdmin && (
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(user)}
                                  title="Edit user"
                                  className="hover:bg-primary/10"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(user.id)}
                                  title="Delete user"
                                  className="hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit User Dialog */}
      {isAdmin && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editUser ? "Edit User" : "Register New User"}</DialogTitle>
              <DialogDescription>
                {editUser ? "Update user information" : "Add a new user to the system"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                    disabled={!!editUser}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => {
                      setFormData({ ...formData, role: value });
                      if (value !== 'instructor') {
                        setSelectedSubjects([]);
                      }
                    }} 
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="trainee">Trainee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+255 XXX XXX XXX"
                    required
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Enter department"
                    required
                  />
                </div>

                {isSuperAdmin && !editUser && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="course_id">Assign to Course *</Label>
                    <Select 
                      value={formData.course_id || (selectedCourse ? selectedCourse.id.toString() : undefined)} 
                      onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                      required
                      disabled={!!selectedCourse}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedCourse ? `Selected: ${selectedCourse.name}` : "Select course"} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name} {course.code && `(${course.code})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCourse && (
                      <p className="text-xs text-primary font-medium">
                        ✓ User will be added to: <strong>{selectedCourse.name}</strong>
                      </p>
                    )}
                  </div>
                )}

                {formData.role !== 'trainee' && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="password">Password {editUser ? "(leave blank to keep current)" : "*"}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editUser ? "Enter new password (optional)" : "Enter password"}
                      required={!editUser}
                      minLength={8}
                    />
                  </div>
                )}

                {formData.role === 'instructor' && (
                  <div className="space-y-2 col-span-2">
                    <Label>Subjects to Teach *</Label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2 bg-muted/30">
                      {subjects.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            No subjects available. Please create subjects first.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowForm(false);
                              navigate('/admin/subjects');
                            }}
                          >
                            Go to Subjects Management
                          </Button>
                        </div>
                      ) : (
                        subjects.map((subject) => (
                          <div key={subject.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
                            <Checkbox
                              id={`subject-${subject.id}`}
                              checked={selectedSubjects.includes(subject.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubjects([...selectedSubjects, subject.id]);
                                } else {
                                  setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id));
                                }
                              }}
                            />
                            <label
                              htmlFor={`subject-${subject.id}`}
                              className="text-sm font-medium leading-none cursor-pointer flex-1"
                            >
                              <span className="font-semibold">{subject.name}</span>
                              {subject.code && (
                                <span className="text-muted-foreground ml-2">({subject.code})</span>
                              )}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { 
                    setShowForm(false); 
                    setEditUser(null); 
                    setSelectedSubjects([]);
                    setFormData({ 
                      name: "", 
                      email: "", 
                      role: "", 
                      phone: "", 
                      department: "", 
                      password: "", 
                      course_id: selectedCourse ? selectedCourse.id.toString() : "" 
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-military"
                  disabled={formData.role === 'instructor' && selectedSubjects.length === 0}
                >
                  {editUser ? "Update User" : "Register User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Excel Import Dialog */}
      {canCreateUsers && (
        <Dialog open={showExcelDialog} onOpenChange={setShowExcelDialog}>
          <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Users from Excel</DialogTitle>
                <DialogDescription>
                  {selectedCourse 
                    ? `Upload a filled Excel file to import multiple users to ${selectedCourse.name}.`
                    : "Upload a filled Excel file to import multiple users at once."}
                </DialogDescription>
              </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-semibold">Download Template</p>
                    <p className="text-sm text-muted-foreground">Get the Excel template with example data</p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="excel-file">Select Excel File</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                />
                {excelFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {excelFile.name}
                  </p>
                )}
              </div>

              {isSuperAdmin && courses.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="course-select">Assign to Course {selectedCourse ? "(Selected)" : "(Optional)"}</Label>
                  <Select 
                    value={selectedCourse?.id.toString() || "none"} 
                    onValueChange={(value) => {
                      if (value === "none") {
                        setSelectedCourse(null);
                      } else {
                        const course = courses.find(c => c.id.toString() === value);
                        setSelectedCourse(course || null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCourse ? `Selected: ${selectedCourse.name}` : "Select course (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name} {course.code && `(${course.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCourse && (
                    <p className="text-xs text-primary font-medium">
                      ✓ Users will be imported to: <strong>{selectedCourse.name}</strong>
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowExcelDialog(false);
                    setExcelFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleExcelUpload}
                  disabled={!excelFile || isUploading}
                  className="bg-gradient-military"
                >
                  {isUploading ? "Uploading..." : "Import Users"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RegisterUsers;
