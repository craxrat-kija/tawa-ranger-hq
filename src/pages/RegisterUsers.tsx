import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, subjectsApi } from "@/lib/api";
import { Edit, Trash2, Eye, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
}

const RegisterUsers = () => {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    department: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      loadUsers();
      loadSubjects();
    }
  }, [user]);

  const loadSubjects = async () => {
    try {
      const data = await subjectsApi.getAll();
      // subjectsApi.getAll already handles array/object conversion
      setSubjects(data);
    } catch (error: any) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getAll();
      // usersApi.getAll already handles array/object conversion
      setUsers(data.map((u: any) => ({
        id: u.id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone || "",
        department: u.department || "",
      })));
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load users. Please try again.",
        variant: "destructive",
      });
      setUsers([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editUser) {
        // Update existing user
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

        // Add subject_ids if role is instructor
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
        // Create new user
        // Password is required for all roles except trainee (trainees don't login)
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
        
        // Only add password if provided (not required for trainees)
        if (formData.password) {
          createData.password = formData.password;
        }

        // Add subject_ids if role is instructor
        if (formData.role === 'instructor' && selectedSubjects.length > 0) {
          createData.subject_ids = selectedSubjects;
        }

        await usersApi.create(createData);
        toast({
          title: "User Registered",
          description: `${formData.name} has been registered successfully.`,
        });
      }

      setFormData({ name: "", email: "", role: "", phone: "", department: "", password: "" });
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
      
      // Handle validation errors from Laravel
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
    });
    
    // Load user's subjects if instructor
    if (user.role === 'instructor') {
      try {
        const userData = await usersApi.getById(user.id);
        // usersApi.getById already handles response structure
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

  // Show loading if auth is still loading
  if (authLoading || !user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">User Management</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage and register new users to the system" : "View users and trainees in the system"}
          </p>
        </div>
        {isAdmin && (
          <Button 
            className="bg-gradient-military" 
            onClick={() => { 
              setEditUser(null); 
              setFormData({ name: "", email: "", role: "", phone: "", department: "", password: "" }); 
              setSelectedSubjects([]);
              setShowForm(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {isAdmin && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="max-w-2xl">
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
                        // Clear selected subjects if role is not instructor
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
                      <p className="text-xs text-muted-foreground">
                        Password is required for users who can login to the system.
                      </p>
                    </div>
                  )}
                  
                  {formData.role === 'trainee' && (
                    <div className="space-y-2 col-span-2">
                      <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">
                          <strong>Note:</strong> Trainees do not have login access to the system. No password is required for trainee accounts.
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.role === 'instructor' && (
                    <div className="space-y-2 col-span-2">
                      <Label>Subjects to Teach *</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Select one or more subjects that this instructor will teach
                      </p>
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
                          <>
                            {subjects.map((subject) => (
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
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                >
                                  <span className="font-semibold">{subject.name}</span>
                                  {subject.code && (
                                    <span className="text-muted-foreground ml-2">({subject.code})</span>
                                  )}
                                  {subject.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{subject.description}</p>
                                  )}
                                </label>
                              </div>
                            ))}
                            <div className="pt-2 border-t mt-2">
                              <p className="text-xs text-muted-foreground">
                                Selected: <span className="font-semibold text-primary">{selectedSubjects.length}</span> subject(s)
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      {formData.role === 'instructor' && selectedSubjects.length === 0 && (
                        <p className="text-xs text-destructive font-medium">
                          ⚠ Please select at least one subject for the instructor
                        </p>
                      )}
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
                      setFormData({ name: "", email: "", role: "", phone: "", department: "", password: "" });
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

        {isLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No users found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Admins Section */}
          {users.filter(u => u.role === 'admin').length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-primary">Administrators</CardTitle>
                    <CardDescription>Manage system administrators</CardDescription>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                    {users.filter(u => u.role === 'admin').length} {users.filter(u => u.role === 'admin').length === 1 ? 'Admin' : 'Admins'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Department</TableHead>
                      {isAdmin && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(u => u.role === 'admin').map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "N/A"}</TableCell>
                        <TableCell>{user.department || "N/A"}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(user)}
                                title="Edit user"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(user.id)}
                                title="Delete user"
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
          )}

          {/* Instructors Section */}
          {users.filter(u => u.role === 'instructor').length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-primary">Instructors</CardTitle>
                    <CardDescription>Manage training instructors</CardDescription>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    {users.filter(u => u.role === 'instructor').length} {users.filter(u => u.role === 'instructor').length === 1 ? 'Instructor' : 'Instructors'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Department</TableHead>
                      {isAdmin && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(u => u.role === 'instructor').map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "N/A"}</TableCell>
                        <TableCell>{user.department || "N/A"}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(user)}
                                title="Edit user"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(user.id)}
                                title="Delete user"
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
          )}

          {/* Doctors Section */}
          {users.filter(u => u.role === 'doctor').length > 0 && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-primary">Doctors</CardTitle>
                    <CardDescription>Manage medical staff</CardDescription>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {users.filter(u => u.role === 'doctor').length} {users.filter(u => u.role === 'doctor').length === 1 ? 'Doctor' : 'Doctors'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Department</TableHead>
                      {isAdmin && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(u => u.role === 'doctor').map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "N/A"}</TableCell>
                        <TableCell>{user.department || "N/A"}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(user)}
                                title="Edit user"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(user.id)}
                                title="Delete user"
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
          )}

          {/* Trainees Section */}
          {users.filter(u => u.role === 'trainee').length > 0 && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-primary">Trainees</CardTitle>
                    <CardDescription>Manage training participants</CardDescription>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                    {users.filter(u => u.role === 'trainee').length} {users.filter(u => u.role === 'trainee').length === 1 ? 'Trainee' : 'Trainees'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Department</TableHead>
                      {isAdmin && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(u => u.role === 'trainee').map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "N/A"}</TableCell>
                        <TableCell>{user.department || "N/A"}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(user)}
                                title="Edit user"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(user.id)}
                                title="Delete user"
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
          )}
        </div>
      )}
    </div>
  );
};

export default RegisterUsers;
