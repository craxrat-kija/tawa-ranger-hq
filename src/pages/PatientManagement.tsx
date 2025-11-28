import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePatients, Patient, MedicalReport, AttendanceRecord } from "@/contexts/PatientContext";
import { useAuth } from "@/contexts/AuthContext";
import { FileHeart, Plus, Eye, Calendar, FileText, Download, Clock } from "lucide-react";

const PatientManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { patients, reports, attendance, addReport, addAttendance, refreshData } = usePatients();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Refresh data when component mounts
    const loadData = async () => {
      setIsLoading(true);
      try {
        await refreshData();
      } catch (error) {
        console.error('Failed to load patient data:', error);
        toast({
          title: "Error",
          description: "Failed to load patient data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshData, toast]);

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [reportForm, setReportForm] = useState({
    diagnosis: "",
    symptoms: "",
    treatment: "",
    notes: "",
    bloodPressure: "",
    temperature: "",
    heartRate: "",
    weight: "",
  });

  const [attendanceForm, setAttendanceForm] = useState({
    patientId: "",
    date: new Date().toISOString().split('T')[0],
    status: "Present" as AttendanceRecord['status'],
    checkInTime: "",
    checkOutTime: "",
    notes: "",
  });

  const handleSubmitReport = async () => {
    if (!selectedPatient || !reportForm.diagnosis) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const newReport: Omit<MedicalReport, "id"> = {
        patientId: selectedPatient.id,
        date: new Date().toISOString().split('T')[0],
        diagnosis: reportForm.diagnosis,
        symptoms: reportForm.symptoms,
        treatment: reportForm.treatment,
        notes: reportForm.notes,
        doctor: user?.name || "Medical Officer",
        vitalSigns: {
          bloodPressure: reportForm.bloodPressure,
          temperature: reportForm.temperature,
          heartRate: reportForm.heartRate,
          weight: reportForm.weight,
        },
      };

      await addReport(newReport);
      setShowReportDialog(false);
      setSelectedPatient(null);
      setReportForm({
        diagnosis: "",
        symptoms: "",
        treatment: "",
        notes: "",
        bloodPressure: "",
        temperature: "",
        heartRate: "",
        weight: "",
      });

      toast({
        title: "Report Saved",
        description: `Medical report for ${selectedPatient.fullName} has been recorded`,
      });
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save medical report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAttendance = async () => {
    if (!attendanceForm.patientId || !attendanceForm.date || !attendanceForm.status) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const newAttendance: Omit<AttendanceRecord, "id"> = {
        patientId: attendanceForm.patientId,
        date: attendanceForm.date,
        status: attendanceForm.status,
        checkInTime: attendanceForm.checkInTime || undefined,
        checkOutTime: attendanceForm.checkOutTime || undefined,
        notes: attendanceForm.notes || undefined,
      };

      await addAttendance(newAttendance);
      setShowAttendanceDialog(false);
      setAttendanceForm({
        patientId: "",
        date: new Date().toISOString().split('T')[0],
        status: "Present",
        checkInTime: "",
        checkOutTime: "",
        notes: "",
      });

      toast({
        title: "Attendance Recorded",
        description: "Attendance has been recorded successfully",
      });
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record attendance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPatientReports = (patientId: string) => {
    return reports.filter(r => r.patientId === patientId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const getPatientAttendance = (patientId: string) => {
    return attendance.filter(a => a.patientId === patientId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const generatePatientReport = (patient: Patient) => {
    const patientReports = getPatientReports(patient.id);
    const patientAttendance = getPatientAttendance(patient.id);
    
    const presentCount = patientAttendance.filter(a => a.status === "Present").length;
    const absentCount = patientAttendance.filter(a => a.status === "Absent").length;
    const lateCount = patientAttendance.filter(a => a.status === "Late").length;
    
    const reportContent = `
╔══════════════════════════════════════════════════════════════════╗
║              PATIENT COMPREHENSIVE MEDICAL REPORT                ║
╚══════════════════════════════════════════════════════════════════╝

PATIENT INFORMATION
─────────────────────────────────────────────────────────────────────
Patient Name:    ${patient.fullName}
Email:           ${patient.email}
Phone:           ${patient.phone}
Blood Type:      ${patient.bloodType}
Registered:      ${patient.registeredDate}

ALLERGIES
─────────────────────────────────────────────────────────────────────
${patient.allergies || "None reported"}

MEDICAL HISTORY
─────────────────────────────────────────────────────────────────────
${patient.medicalHistory || "No significant medical history"}

EMERGENCY CONTACT
─────────────────────────────────────────────────────────────────────
${patient.emergencyContact}

════════════════════════════════════════════════════════════════════

MEDICAL REPORTS (Total: ${patientReports.length})
─────────────────────────────────────────────────────────────────────
${patientReports.length === 0 ? "No medical reports on record." : patientReports.map((r, idx) => `
Report #${idx + 1}
Date: ${r.date}
Doctor: ${r.doctor}
─────────────────────────────────────────────────────────────────
Diagnosis: ${r.diagnosis}
Symptoms: ${r.symptoms}
Treatment: ${r.treatment}
${r.notes ? `Notes: ${r.notes}` : ''}

Vital Signs:
  • Blood Pressure: ${r.vitalSigns.bloodPressure || "N/A"}
  • Temperature: ${r.vitalSigns.temperature || "N/A"}
  • Heart Rate: ${r.vitalSigns.heartRate || "N/A"}
  • Weight: ${r.vitalSigns.weight || "N/A"}

${idx < patientReports.length - 1 ? '─────────────────────────────────────────────────────────────────\n' : ''}
`).join('\n')}

════════════════════════════════════════════════════════════════════

ATTENDANCE SUMMARY (Total Records: ${patientAttendance.length})
─────────────────────────────────────────────────────────────────────
Present:  ${presentCount} days
Absent:   ${absentCount} days
Late:     ${lateCount} days
Excused:  ${patientAttendance.filter(a => a.status === "Excused").length} days

ATTENDANCE DETAILS
─────────────────────────────────────────────────────────────────────
${patientAttendance.length === 0 ? "No attendance records." : patientAttendance.map((a) => `
Date: ${a.date}
Status: ${a.status}
${a.checkInTime ? `Check-in Time: ${a.checkInTime}` : ''}
${a.checkOutTime ? `Check-out Time: ${a.checkOutTime}` : ''}
${a.notes ? `Notes: ${a.notes}` : ''}
─────────────────────────────────────────────────────────────────
`).join('\n')}

════════════════════════════════════════════════════════════════════

Report Generated: ${new Date().toLocaleString()}
Generated By: ${user?.name || 'Medical Officer'}

    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${patient.fullName.replace(' ', '_')}_Medical_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Generated",
      description: `Medical report for ${patient.fullName} has been downloaded`,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Patient Management</h1>
          <p className="text-muted-foreground">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Patient Management</h1>
          <p className="text-muted-foreground">Manage patient records, reports, attendance, and generate reports</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAttendanceDialog(true)} 
            variant="outline"
            disabled={patients.length === 0}
          >
            <Clock className="w-4 h-4 mr-2" />
            Record Attendance
          </Button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
              <FileHeart className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Records</p>
                <p className="text-2xl font-bold">{attendance.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Present</p>
                <p className="text-2xl font-bold">
                  {attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === "Present").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">All Patients</TabsTrigger>
          <TabsTrigger value="reports">Medical Reports</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Patients</CardTitle>
              <CardDescription>View and manage all patient records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => {
                    const patientReports = getPatientReports(patient.id);
                    return (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.fullName}</TableCell>
                        <TableCell>{patient.email}</TableCell>
                        <TableCell>{patient.bloodType}</TableCell>
                        <TableCell>{patient.registeredDate}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{patientReports.length} report(s)</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowReportDialog(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Report
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowHistoryDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              History
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePatientReport(patient)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Report
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Reports</CardTitle>
              <CardDescription>View all medical reports by patient</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patients.map((patient) => {
                  const patientReports = getPatientReports(patient.id);
                  if (patientReports.length === 0) return null;
                  
                  return (
                    <Card key={patient.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{patient.fullName}</CardTitle>
                        <CardDescription>{patientReports.length} report(s)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {patientReports.map((report) => (
                            <div key={report.id} className="border-l-4 border-primary pl-4 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold">{report.diagnosis}</p>
                                  <p className="text-sm text-muted-foreground">{report.date}</p>
                                </div>
                                <Badge variant="outline">{report.vitalSigns.temperature}</Badge>
                              </div>
                              <p className="text-sm"><strong>Symptoms:</strong> {report.symptoms}</p>
                              <p className="text-sm"><strong>Treatment:</strong> {report.treatment}</p>
                              {report.notes && <p className="text-sm"><strong>Notes:</strong> {report.notes}</p>}
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>BP: {report.vitalSigns.bloodPressure}</span>
                                <span>HR: {report.vitalSigns.heartRate}</span>
                                <span>Weight: {report.vitalSigns.weight}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>Track patient attendance and check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => {
                    const patient = patients.find(p => p.id === record.patientId);
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{patient?.fullName || "Unknown"}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              record.status === "Present" ? "default" :
                              record.status === "Late" ? "secondary" :
                              record.status === "Absent" ? "destructive" : "outline"
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.checkInTime || "-"}</TableCell>
                        <TableCell>{record.checkOutTime || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Medical Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Medical Report - {selectedPatient?.fullName}</DialogTitle>
            <DialogDescription>Record a new medical examination and treatment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="diagnosis">Diagnosis *</Label>
                <Input
                  id="diagnosis"
                  value={reportForm.diagnosis}
                  onChange={(e) => setReportForm({ ...reportForm, diagnosis: e.target.value })}
                  placeholder="Enter diagnosis"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  value={reportForm.symptoms}
                  onChange={(e) => setReportForm({ ...reportForm, symptoms: e.target.value })}
                  placeholder="Describe patient symptoms"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure</Label>
                <Input
                  id="bloodPressure"
                  value={reportForm.bloodPressure}
                  onChange={(e) => setReportForm({ ...reportForm, bloodPressure: e.target.value })}
                  placeholder="e.g., 120/80"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  value={reportForm.temperature}
                  onChange={(e) => setReportForm({ ...reportForm, temperature: e.target.value })}
                  placeholder="e.g., 98.6°F"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate</Label>
                <Input
                  id="heartRate"
                  value={reportForm.heartRate}
                  onChange={(e) => setReportForm({ ...reportForm, heartRate: e.target.value })}
                  placeholder="e.g., 72 bpm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={reportForm.weight}
                  onChange={(e) => setReportForm({ ...reportForm, weight: e.target.value })}
                  placeholder="e.g., 75 kg"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="treatment">Treatment</Label>
                <Textarea
                  id="treatment"
                  value={reportForm.treatment}
                  onChange={(e) => setReportForm({ ...reportForm, treatment: e.target.value })}
                  placeholder="Prescribed treatment and medications"
                  rows={3}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={reportForm.notes}
                  onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                  placeholder="Any additional notes or recommendations"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowReportDialog(false);
                setSelectedPatient(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReport} className="bg-gradient-military">
                Save Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient History - {selectedPatient?.fullName}</DialogTitle>
            <DialogDescription>Complete medical history and attendance records</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedPatient.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedPatient.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Blood Type</p>
                    <p className="font-medium">{selectedPatient.bloodType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Allergies</p>
                    <p className="font-medium">{selectedPatient.allergies || "None"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Medical History</p>
                    <p className="font-medium">{selectedPatient.medicalHistory || "None"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Medical Reports ({getPatientReports(selectedPatient.id).length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getPatientReports(selectedPatient.id).length === 0 ? (
                      <p className="text-muted-foreground">No medical reports on record.</p>
                    ) : (
                      getPatientReports(selectedPatient.id).map((report) => (
                        <div key={report.id} className="border-l-4 border-primary pl-4 space-y-2">
                          <div className="flex justify-between">
                            <p className="font-semibold">{report.diagnosis}</p>
                            <p className="text-sm text-muted-foreground">{report.date}</p>
                          </div>
                          <p className="text-sm"><strong>Symptoms:</strong> {report.symptoms}</p>
                          <p className="text-sm"><strong>Treatment:</strong> {report.treatment}</p>
                          {report.notes && <p className="text-sm"><strong>Notes:</strong> {report.notes}</p>}
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>BP: {report.vitalSigns.bloodPressure}</span>
                            <span>Temp: {report.vitalSigns.temperature}</span>
                            <span>HR: {report.vitalSigns.heartRate}</span>
                            <span>Weight: {report.vitalSigns.weight}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Attendance */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Records ({getPatientAttendance(selectedPatient.id).length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPatientAttendance(selectedPatient.id).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No attendance records
                          </TableCell>
                        </TableRow>
                      ) : (
                        getPatientAttendance(selectedPatient.id).map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  record.status === "Present" ? "default" :
                                  record.status === "Late" ? "secondary" :
                                  record.status === "Absent" ? "destructive" : "outline"
                                }
                              >
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.checkInTime || "-"}</TableCell>
                            <TableCell>{record.checkOutTime || "-"}</TableCell>
                            <TableCell className="text-sm">{record.notes || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Attendance</DialogTitle>
            <DialogDescription>Mark patient attendance for a specific date</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attendance-patient">Patient *</Label>
              <Select 
                value={attendanceForm.patientId} 
                onValueChange={(value) => setAttendanceForm({ ...attendanceForm, patientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>{patient.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="attendance-date">Date *</Label>
                <Input
                  id="attendance-date"
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendance-status">Status *</Label>
                <Select 
                  value={attendanceForm.status} 
                  onValueChange={(value) => setAttendanceForm({ ...attendanceForm, status: value as AttendanceRecord['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="check-in">Check-in Time</Label>
                <Input
                  id="check-in"
                  type="time"
                  value={attendanceForm.checkInTime}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkInTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="check-out">Check-out Time</Label>
                <Input
                  id="check-out"
                  type="time"
                  value={attendanceForm.checkOutTime}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOutTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendance-notes">Notes</Label>
              <Textarea
                id="attendance-notes"
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                placeholder="Additional notes about attendance"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAttendanceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitAttendance} className="bg-gradient-military">
                Save Attendance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientManagement;

