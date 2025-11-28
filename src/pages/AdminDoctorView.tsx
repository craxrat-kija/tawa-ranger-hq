import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { patientsApi, medicalReportsApi, attendanceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Comments } from "@/components/Comments";
import {
  FileHeart,
  Users,
  Calendar,
  Search,
  Eye,
  Stethoscope,
  Activity,
  User,
  Phone,
  Mail,
  Droplet,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  emergency_contact: string;
  registered_date: string;
  course_id?: number;
}

interface MedicalReport {
  id: number;
  patient_id: number;
  date: string;
  diagnosis: string;
  symptoms?: string;
  treatment?: string;
  notes?: string;
  doctor: string;
  blood_pressure?: string;
  temperature?: string;
  heart_rate?: string;
  weight?: string;
  patient?: Patient;
}

interface AttendanceRecord {
  id: number;
  patient_id: number;
  date: string;
  status: string;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  patient?: Patient;
}

export default function AdminDoctorView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [patientsData, reportsData, attendanceData] = await Promise.all([
        patientsApi.getAll(),
        medicalReportsApi.getAll(),
        attendanceApi.getAll(),
      ]);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load doctor data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Absent":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "Late":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "Excused":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary mb-2">Doctor Dashboard View</h2>
        <p className="text-muted-foreground">
          View all doctor activities, patients, reports, and attendance records (Read-only)
        </p>
      </div>

      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">
            <Users className="w-4 h-4 mr-2" />
            Patients ({patients.length})
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileHeart className="w-4 h-4 mr-2" />
            Medical Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Calendar className="w-4 h-4 mr-2" />
            Attendance ({attendance.length})
          </TabsTrigger>
        </TabsList>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Patients</CardTitle>
              <CardDescription>View all registered patients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No patients found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Blood Type</TableHead>
                      <TableHead>Registered Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.full_name}</TableCell>
                        <TableCell>{patient.email}</TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>{patient.blood_type || "N/A"}</TableCell>
                        <TableCell>
                          {format(new Date(patient.registered_date), "PP")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPatient(patient)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Reports</CardTitle>
              <CardDescription>View all medical reports</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No reports found</div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{report.patient?.full_name || "Unknown Patient"}</h3>
                              <Badge variant="outline">{report.doctor}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              <strong>Diagnosis:</strong> {report.diagnosis}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                              {report.blood_pressure && (
                                <div>
                                  <span className="text-muted-foreground">BP: </span>
                                  {report.blood_pressure}
                                </div>
                              )}
                              {report.temperature && (
                                <div>
                                  <span className="text-muted-foreground">Temp: </span>
                                  {report.temperature}
                                </div>
                              )}
                              {report.heart_rate && (
                                <div>
                                  <span className="text-muted-foreground">HR: </span>
                                  {report.heart_rate}
                                </div>
                              )}
                              {report.weight && (
                                <div>
                                  <span className="text-muted-foreground">Weight: </span>
                                  {report.weight}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(report.date), "PP")}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>View all attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : attendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.patient?.full_name || "Unknown"}
                        </TableCell>
                        <TableCell>{format(new Date(record.date), "PP")}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.check_in_time || "N/A"}</TableCell>
                        <TableCell>{record.check_out_time || "N/A"}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAttendance(record)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patient Detail Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>View patient information and add comments</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Full Name</p>
                        <p className="font-medium">{selectedPatient.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedPatient.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedPatient.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Blood Type</p>
                        <p className="font-medium">{selectedPatient.blood_type || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Allergies</p>
                        <p className="font-medium">{selectedPatient.allergies || "None"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Emergency Contact</p>
                        <p className="font-medium">{selectedPatient.emergency_contact}</p>
                      </div>
                    </div>
                  </div>
                  {selectedPatient.medical_history && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Medical History</p>
                      <p className="text-sm">{selectedPatient.medical_history}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Comments commentableType="patient" commentableId={selectedPatient.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medical Report Details</DialogTitle>
            <DialogDescription>View report information and add comments</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{selectedReport.patient?.full_name || "Unknown Patient"}</h3>
                    <Badge>{selectedReport.doctor}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Diagnosis</p>
                    <p className="font-medium">{selectedReport.diagnosis}</p>
                  </div>
                  {selectedReport.symptoms && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Symptoms</p>
                      <p className="text-sm">{selectedReport.symptoms}</p>
                    </div>
                  )}
                  {selectedReport.treatment && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Treatment</p>
                      <p className="text-sm">{selectedReport.treatment}</p>
                    </div>
                  )}
                  {selectedReport.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{selectedReport.notes}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t">
                    {selectedReport.blood_pressure && (
                      <div>
                        <p className="text-xs text-muted-foreground">Blood Pressure</p>
                        <p className="font-medium">{selectedReport.blood_pressure}</p>
                      </div>
                    )}
                    {selectedReport.temperature && (
                      <div>
                        <p className="text-xs text-muted-foreground">Temperature</p>
                        <p className="font-medium">{selectedReport.temperature}</p>
                      </div>
                    )}
                    {selectedReport.heart_rate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Heart Rate</p>
                        <p className="font-medium">{selectedReport.heart_rate}</p>
                      </div>
                    )}
                    {selectedReport.weight && (
                      <div>
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="font-medium">{selectedReport.weight}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    Date: {format(new Date(selectedReport.date), "PP")}
                  </p>
                </CardContent>
              </Card>
              <Comments commentableType="medical_report" commentableId={selectedReport.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attendance Detail Dialog */}
      <Dialog open={!!selectedAttendance} onOpenChange={() => setSelectedAttendance(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attendance Record Details</DialogTitle>
            <DialogDescription>View attendance information and add comments</DialogDescription>
          </DialogHeader>
          {selectedAttendance && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Patient</p>
                    <p className="font-medium">{selectedAttendance.patient?.full_name || "Unknown"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Date</p>
                      <p className="font-medium">{format(new Date(selectedAttendance.date), "PP")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Badge className={getStatusColor(selectedAttendance.status)}>
                        {selectedAttendance.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Check In</p>
                      <p className="font-medium">{selectedAttendance.check_in_time || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                      <p className="font-medium">{selectedAttendance.check_out_time || "N/A"}</p>
                    </div>
                  </div>
                  {selectedAttendance.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{selectedAttendance.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Comments commentableType="attendance_record" commentableId={selectedAttendance.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



