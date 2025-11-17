import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Edit, Trash2, Eye } from "lucide-react";

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
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    department: "",
  });

  // Mock data for users
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "John Doe", email: "john.doe@tawa.go.tz", role: "trainee", phone: "+255 712 345 678", department: "Field Operations" },
    { id: "2", name: "Jane Smith", email: "jane.smith@tawa.go.tz", role: "trainee", phone: "+255 713 456 789", department: "Wildlife Protection" },
    { id: "3", name: "Michael Johnson", email: "michael.j@tawa.go.tz", role: "trainee", phone: "+255 714 567 890", department: "Conservation" },
    { id: "4", name: "Sarah Williams", email: "sarah.w@tawa.go.tz", role: "trainee", phone: "+255 715 678 901", department: "Law Enforcement" },
    { id: "5", name: "Robert Brown", email: "robert.b@tawa.go.tz", role: "instructor", phone: "+255 716 789 012", department: "Training" },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editUser) {
      // Update existing user
      setUsers(users.map(u => u.id === editUser.id ? { ...u, ...formData } : u));
      toast({
        title: "User Updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      // Create new user
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
      };
      setUsers([...users, newUser]);
      toast({
        title: "User Registered",
        description: `${formData.name} has been registered successfully.`,
      });
    }
    
    setFormData({ name: "", email: "", role: "", phone: "", department: "" });
    setShowForm(false);
    setEditUser(null);
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      department: user.department,
    });
    setShowForm(true);
  };

  const handleDelete = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    setUsers(users.filter(u => u.id !== userId));
    toast({
      title: "User Deleted",
      description: `${userToDelete?.name} has been removed from the system.`,
      variant: "destructive",
    });
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
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-military" onClick={() => { setEditUser(null); setFormData({ name: "", email: "", role: "", phone: "", department: "" }); }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Register New User
              </Button>
            </DialogTrigger>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} required>
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
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditUser(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-military">
                    {editUser ? "Update User" : "Register User"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            {isAdmin 
              ? "Manage all users including admins, instructors, doctors, and trainees"
              : "View all users and trainees in the system"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Department</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.department}</TableCell>
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
    </div>
  );
};

export default RegisterUsers;
