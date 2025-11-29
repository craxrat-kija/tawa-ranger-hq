import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/lib/api";
import { Search } from "lucide-react";

interface Trainee {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  course?: string;
  status?: "active" | "completed" | "suspended";
}

const ViewTrainees = () => {
  const { user } = useAuth();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTrainees();
  }, []);

  const loadTrainees = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getAll('trainee');
      setTrainees(data.map((u: any) => ({
        id: u.id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone || "",
        department: u.department || "",
        course: "N/A", // This would come from course enrollment in a real system
        status: "active" as const, // This would come from enrollment status in a real system
      })));
    } catch (error) {
      console.error('Error loading trainees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "completed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "suspended": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  // Filter trainees based on search query
  const filteredTrainees = useMemo(() => {
    if (!searchQuery.trim()) {
      return trainees;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return trainees.filter((trainee) => {
      return (
        trainee.name.toLowerCase().includes(query) ||
        trainee.email.toLowerCase().includes(query) ||
        trainee.phone.toLowerCase().includes(query) ||
        trainee.department.toLowerCase().includes(query) ||
        trainee.id.toLowerCase().includes(query) ||
        (trainee.course && trainee.course.toLowerCase().includes(query))
      );
    });
  }, [trainees, searchQuery]);

  const roleDisplay = user?.role === "instructor" ? "Trainees" : user?.role === "doctor" ? "Patients" : "Trainees";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">View {roleDisplay}</h1>
        <p className="text-muted-foreground">
          {user?.role === "instructor" 
            ? "View all trainees assigned to your courses"
            : user?.role === "doctor"
            ? "View all trainee health records and information"
            : "View all trainees in the system"}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search trainees by name, email, phone, department, ID, or course..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trainee Directory</CardTitle>
          <CardDescription>
            {user?.role === "instructor" 
              ? "Trainees enrolled in your courses"
              : user?.role === "doctor"
              ? "All trainees' health information"
              : "All trainees in the TAWA system"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading trainees...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No trainees found matching your search." : "No trainees found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrainees.map((trainee) => (
                <TableRow key={trainee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{trainee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{trainee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{trainee.email}</TableCell>
                  <TableCell>{trainee.course}</TableCell>
                  <TableCell>{trainee.department}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(trainee.status)}>
                      {trainee.status.charAt(0).toUpperCase() + trainee.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{trainee.phone}</TableCell>
                </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Trainees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {searchQuery ? filteredTrainees.length : trainees.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? "Matching search results" : "All registered trainees"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Trainees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {filteredTrainees.filter(t => t.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {filteredTrainees.filter(t => t.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Graduated trainees</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewTrainees;


