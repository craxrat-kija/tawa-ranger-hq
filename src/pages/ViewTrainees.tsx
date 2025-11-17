import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Eye } from "lucide-react";

interface Trainee {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  course: string;
  status: "active" | "completed" | "suspended";
}

const ViewTrainees = () => {
  const { user } = useAuth();
  
  // Mock data for trainees
  const trainees: Trainee[] = [
    { id: "1", name: "John Doe", email: "john.doe@tawa.go.tz", role: "trainee", phone: "+255 712 345 678", department: "Field Operations", course: "Recruit Course", status: "active" },
    { id: "2", name: "Jane Smith", email: "jane.smith@tawa.go.tz", role: "trainee", phone: "+255 713 456 789", department: "Wildlife Protection", course: "Special Course", status: "active" },
    { id: "3", name: "Michael Johnson", email: "michael.j@tawa.go.tz", role: "trainee", phone: "+255 714 567 890", department: "Conservation", course: "Transformation Course", status: "completed" },
    { id: "4", name: "Sarah Williams", email: "sarah.w@tawa.go.tz", role: "trainee", phone: "+255 715 678 901", department: "Law Enforcement", course: "Recruit Course", status: "active" },
    { id: "5", name: "Robert Brown", email: "robert.b@tawa.go.tz", role: "trainee", phone: "+255 716 789 012", department: "Field Operations", course: "Special Course", status: "suspended" },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "completed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "suspended": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

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
              {trainees.map((trainee) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Trainees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{trainees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All registered trainees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Trainees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {trainees.filter(t => t.status === "active").length}
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
              {trainees.filter(t => t.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Graduated trainees</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewTrainees;


