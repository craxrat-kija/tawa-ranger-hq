import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usersApi, coursesApi } from "@/lib/api";
import { Search, User as UserIcon, Eye } from "lucide-react";
import UserProfile from "./UserProfile";

const UserProfiles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const isSuperAdmin = user?.role === "super_admin";
  const adminCourseId = user?.course_id;
  const basePath = isSuperAdmin ? "/super-admin" : "/admin";

  useEffect(() => {
    loadCourses();
    loadUsers();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [selectedCourse, selectedRole]);

  const loadCourses = async () => {
    try {
      const coursesData = await coursesApi.getAll();
      const coursesArray = Array.isArray(coursesData) ? coursesData : [];
      
      // For regular admin, filter to only their course
      if (!isSuperAdmin && adminCourseId) {
        const filteredCourses = coursesArray.filter((c: any) => c.id === adminCourseId);
        setCourses(filteredCourses);
        if (filteredCourses.length > 0) {
          setSelectedCourse(filteredCourses[0].id.toString());
        } else {
          setSelectedCourse("all");
        }
      } else {
        setCourses(coursesArray);
        // Ensure selectedCourse is never empty string
        setSelectedCourse("all");
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      // Load all users
      const usersData = await usersApi.getAll();
      const usersArray = Array.isArray(usersData) ? usersData : [];
      
      // Filter by course if needed
      let filteredUsers = usersArray;
      if (!isSuperAdmin && adminCourseId) {
        filteredUsers = usersArray.filter((u: any) => u.course_id === adminCourseId);
      } else if (isSuperAdmin && selectedCourse && selectedCourse !== "all") {
        filteredUsers = usersArray.filter((u: any) => u.course_id?.toString() === selectedCourse);
      }
      
      setUsers(filteredUsers);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    // Filter by role
    if (selectedRole !== "all") {
      filtered = filtered.filter((u) => u.role === selectedRole);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((u) => {
        return (
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.user_id?.toLowerCase().includes(query) ||
          u.phone?.toLowerCase().includes(query) ||
          u.department?.toLowerCase().includes(query)
        );
      });
    }
    
    return filtered;
  }, [users, selectedRole, searchQuery]);

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleBack = () => {
    setSelectedUserId(null);
  };

  if (selectedUserId) {
    return <UserProfile userId={selectedUserId} onBack={handleBack} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Profiles</h1>
        <p className="text-muted-foreground">
          View comprehensive profiles including registration, medical records, and discipline information
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search by name, email, ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <div>
              <Label>Filter by Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="trainee">Trainee</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter (Super Admin only) */}
            {isSuperAdmin && (
              <div>
                <Label>Filter by Course</Label>
                <Select value={selectedCourse || "all"} onValueChange={(value) => setSelectedCourse(value || "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => {
                      const courseId = course.id?.toString();
                      if (!courseId) return null;
                      return (
                        <SelectItem key={course.id} value={courseId}>
                          {course.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Click on a user to view their complete profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  {isSuperAdmin && <TableHead>Course</TableHead>}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="font-mono text-sm">{user.user_id || user.id}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge>{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.phone || "N/A"}</TableCell>
                    {isSuperAdmin && (
                      <TableCell>{user.course?.name || user.course_name || "N/A"}</TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProfile(user.id.toString())}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Profile
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
  );
};

export default UserProfiles;

