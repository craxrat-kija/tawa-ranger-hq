import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, medicalRecordsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Edit, Heart, Upload, FileText, Trash, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface MedicalRecordData {
  id?: string;
  user_id?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  // Personal Particulars
  emergency_contact?: string;
  // Medical Examination Fields
  blood_type?: string;
  blood_pressure?: string;
  malaria_test?: string;
  sugar_test?: string;
  hepatitis_test?: string;
  pregnancy_test?: string;
  weight?: string;
  height?: string;
  hb_hemoglobin?: string;
  hiv_status?: string;
  // Medical History Fields
  allergies?: string;
  medical_history?: string;
  chronic_illnesses?: string;
  trauma_history?: string;
  attachments?: string | string[]; // JSON string or array of file paths
  record_date?: string;
}

const ViewTrainees = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecordData | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [traineesWithRecords, setTraineesWithRecords] = useState<Set<string>>(new Set());
  const [filterTab, setFilterTab] = useState<"all" | "registered" | "unregistered">("all");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const attachmentsInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    // Personal Particulars
    emergency_contact: "",
    // Medical Examination Fields
    blood_type: "",
    blood_pressure: "",
    malaria_test: "",
    sugar_test: "",
    hepatitis_test: "",
    pregnancy_test: "",
    weight: "",
    height: "",
    hb_hemoglobin: "",
    hiv_status: "",
    // Medical History Fields
    allergies: "",
    medical_history: "",
    chronic_illnesses: "",
    trauma_history: "",
  });

  useEffect(() => {
    loadTrainees();
  }, []);

  const loadTrainees = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getAll('trainee');
      const traineesList = data.map((u: any) => ({
        id: u.id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone || "",
        department: u.department || "",
        course: "N/A", // This would come from course enrollment in a real system
        status: "active" as const, // This would come from enrollment status in a real system
      }));
      setTrainees(traineesList);
      
      // Check which trainees have medical records
      if (traineesList.length > 0) {
        try {
          const allRecords = await medicalRecordsApi.getAll({ latest: true });
          const recordsSet = new Set<string>();
          
          // Handle both array and object responses
          const recordsArray = Array.isArray(allRecords) ? allRecords : (allRecords?.data || []);
          
          // Create a set of user_ids that have medical records
          recordsArray.forEach((record: any) => {
            const userId = record.user_id || record.user?.id;
            if (userId) {
              recordsSet.add(userId.toString());
            }
          });
          
          setTraineesWithRecords(recordsSet);
        } catch (error) {
          console.error('Error loading medical records:', error);
        }
      }
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

  // Filter trainees based on search query and registration status
  const filteredTrainees = useMemo(() => {
    let filtered = trainees;
    
    // Filter by registration status
    if (filterTab === "registered") {
      filtered = filtered.filter((trainee) => traineesWithRecords.has(trainee.id));
    } else if (filterTab === "unregistered") {
      filtered = filtered.filter((trainee) => !traineesWithRecords.has(trainee.id));
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((trainee) => {
        return (
          trainee.name.toLowerCase().includes(query) ||
          trainee.email.toLowerCase().includes(query) ||
          trainee.phone.toLowerCase().includes(query) ||
          trainee.department.toLowerCase().includes(query) ||
          trainee.id.toLowerCase().includes(query) ||
          (trainee.course && trainee.course.toLowerCase().includes(query))
        );
      });
    }
    
    return filtered;
  }, [trainees, searchQuery, filterTab, traineesWithRecords]);

  const roleDisplay = user?.role === "instructor" ? "Trainees" : user?.role === "doctor" ? "Patients" : "Trainees";

  const handleViewMedicalInfo = async (trainee: Trainee) => {
    try {
      setIsLoadingRecord(true);
      setSelectedTrainee(trainee);
      
      // Get latest medical record for this user
      const response = await medicalRecordsApi.getLatestByUser(trainee.id);
      const recordData = response?.data || response;
      
      if (recordData) {
        setMedicalRecord(recordData);
        // Load attachments for view
        if (recordData.attachments) {
          const atts = typeof recordData.attachments === 'string' 
            ? JSON.parse(recordData.attachments) 
            : recordData.attachments;
          setExistingAttachments(Array.isArray(atts) ? atts : []);
        } else {
          setExistingAttachments([]);
        }
        setShowViewDialog(true);
      } else {
        toast({
          title: "No Medical Information",
          description: "No medical information found for this trainee. Click 'Add' to register medical information.",
          variant: "destructive",
        });
        // Open edit dialog to add new information
        setFormData({
          emergency_contact: "",
          blood_type: "",
          blood_pressure: "",
          malaria_test: "",
          sugar_test: "",
          hepatitis_test: "",
          pregnancy_test: "",
          weight: "",
          height: "",
          hb_hemoglobin: "",
          hiv_status: "",
          allergies: "",
          medical_history: "",
          chronic_illnesses: "",
          trauma_history: "",
        });
        setShowEditDialog(true);
      }
    } catch (error: any) {
      console.error('Error loading medical record:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load medical information.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecord(false);
    }
  };

  const handleEditMedicalInfo = async (trainee: Trainee) => {
    try {
      setIsLoadingRecord(true);
      setSelectedTrainee(trainee);
      
      // Get latest medical record for this user
      const response = await medicalRecordsApi.getLatestByUser(trainee.id);
      const recordData = response?.data || response;
      
      if (recordData) {
        setMedicalRecord(recordData);
        setFormData({
          emergency_contact: recordData.emergency_contact || "",
          blood_type: recordData.blood_type || "",
          blood_pressure: recordData.blood_pressure || "",
          malaria_test: recordData.malaria_test || "",
          sugar_test: recordData.sugar_test || "",
          hepatitis_test: recordData.hepatitis_test || "",
          pregnancy_test: recordData.pregnancy_test || "",
          weight: recordData.weight || "",
          height: recordData.height || "",
          hb_hemoglobin: recordData.hb_hemoglobin || "",
          hiv_status: recordData.hiv_status || "",
          allergies: recordData.allergies || "",
          medical_history: recordData.medical_history || "",
          chronic_illnesses: recordData.chronic_illnesses || "",
          trauma_history: recordData.trauma_history || "",
        });
        // Load existing attachments
        if (recordData.attachments) {
          const atts = typeof recordData.attachments === 'string' 
            ? JSON.parse(recordData.attachments) 
            : recordData.attachments;
          setExistingAttachments(Array.isArray(atts) ? atts : []);
        } else {
          setExistingAttachments([]);
        }
        setAttachments([]);
      } else {
        setMedicalRecord(null);
        setFormData({
          emergency_contact: "",
          blood_type: "",
          blood_pressure: "",
          malaria_test: "",
          sugar_test: "",
          hepatitis_test: "",
          pregnancy_test: "",
          weight: "",
          height: "",
          hb_hemoglobin: "",
          hiv_status: "",
          allergies: "",
          medical_history: "",
          chronic_illnesses: "",
          trauma_history: "",
        });
        setExistingAttachments([]);
        setAttachments([]);
      }
      
      setShowEditDialog(true);
    } catch (error: any) {
      console.error('Error loading medical record:', error);
      // If record doesn't exist, just open the form
      setMedicalRecord(null);
      setFormData({
        emergency_contact: "",
        blood_type: "",
        blood_pressure: "",
        malaria_test: "",
        sugar_test: "",
        hepatitis_test: "",
        pregnancy_test: "",
        weight: "",
        height: "",
        hb_hemoglobin: "",
        hiv_status: "",
        allergies: "",
        medical_history: "",
        chronic_illnesses: "",
        trauma_history: "",
      });
      setExistingAttachments([]);
      setAttachments([]);
      setShowEditDialog(true);
    } finally {
      setIsLoadingRecord(false);
    }
  };

  const handleAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Validate file types (PDF only)
      const invalidFiles = files.filter(file => file.type !== 'application/pdf');
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid File Type",
          description: "Only PDF files are allowed for attachments.",
          variant: "destructive",
        });
        return;
      }

      // Validate file sizes (max 10MB per file)
      const largeFiles = files.filter(file => file.size > 10 * 1024 * 1024);
      if (largeFiles.length > 0) {
        toast({
          title: "File Too Large",
          description: "Each attachment must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }

      // Limit to 10 attachments
      if (files.length > 10) {
        toast({
          title: "Too Many Files",
          description: "You can upload a maximum of 10 attachments.",
          variant: "destructive",
        });
        return;
      }

      setAttachments(files);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    if (attachmentsInputRef.current) {
      attachmentsInputRef.current.value = "";
    }
  };

  const handleDownloadAttachment = (filePath: string) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const url = `${API_BASE_URL}/storage/${filePath}`;
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filePath.split('/').pop() || 'attachment');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveMedicalInfo = async () => {
    if (!selectedTrainee) return;
    
    if (!formData.emergency_contact) {
      toast({
        title: "Required Field",
        description: "Emergency contact is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // If attachments are present, use FormData
      if (attachments.length > 0) {
        const formDataToSend = new FormData();
        formDataToSend.append('emergency_contact', formData.emergency_contact);
        if (formData.blood_type) formDataToSend.append('blood_type', formData.blood_type);
        if (formData.blood_pressure) formDataToSend.append('blood_pressure', formData.blood_pressure);
        if (formData.malaria_test) formDataToSend.append('malaria_test', formData.malaria_test);
        if (formData.sugar_test) formDataToSend.append('sugar_test', formData.sugar_test);
        if (formData.hepatitis_test) formDataToSend.append('hepatitis_test', formData.hepatitis_test);
        if (formData.pregnancy_test) formDataToSend.append('pregnancy_test', formData.pregnancy_test);
        if (formData.weight) formDataToSend.append('weight', formData.weight);
        if (formData.height) formDataToSend.append('height', formData.height);
        if (formData.hb_hemoglobin) formDataToSend.append('hb_hemoglobin', formData.hb_hemoglobin);
        if (formData.hiv_status) formDataToSend.append('hiv_status', formData.hiv_status);
        if (formData.allergies) formDataToSend.append('allergies', formData.allergies);
        if (formData.medical_history) formDataToSend.append('medical_history', formData.medical_history);
        if (formData.chronic_illnesses) formDataToSend.append('chronic_illnesses', formData.chronic_illnesses);
        if (formData.trauma_history) formDataToSend.append('trauma_history', formData.trauma_history);
        if (formData.blood_type) formDataToSend.append('blood_type', formData.blood_type);
        
        // Add attachments
        attachments.forEach((file, index) => {
          formDataToSend.append(`attachments[${index}]`, file);
        });

        const token = localStorage.getItem('auth_token');
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        
        if (medicalRecord?.id) {
          // Update existing medical record
          formDataToSend.append('_method', 'PUT');
          const response = await fetch(`${API_BASE_URL}/api/medical-records/${medicalRecord.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: formDataToSend,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update medical record');
          }

          toast({
            title: "Medical Information Updated",
            description: "Medical information has been updated successfully.",
          });
        } else {
          // Create new medical record
          formDataToSend.append('user_id', selectedTrainee.id);
          const response = await fetch(`${API_BASE_URL}/api/medical-records`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: formDataToSend,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create medical record');
          }

          toast({
            title: "Medical Information Registered",
            description: "Medical information has been registered successfully.",
          });
        }
      } else {
        // No attachments, use regular API
        if (medicalRecord?.id) {
          // Update existing medical record
          await medicalRecordsApi.update(medicalRecord.id.toString(), {
            emergency_contact: formData.emergency_contact,
            blood_type: formData.blood_type || null,
            blood_pressure: formData.blood_pressure || null,
            malaria_test: formData.malaria_test || null,
            sugar_test: formData.sugar_test || null,
            hepatitis_test: formData.hepatitis_test || null,
            pregnancy_test: formData.pregnancy_test || null,
            weight: formData.weight || null,
            height: formData.height || null,
            hb_hemoglobin: formData.hb_hemoglobin || null,
            hiv_status: formData.hiv_status || null,
            allergies: formData.allergies || null,
            medical_history: formData.medical_history || null,
            chronic_illnesses: formData.chronic_illnesses || null,
            trauma_history: formData.trauma_history || null,
          });
          toast({
            title: "Medical Information Updated",
            description: "Medical information has been updated successfully.",
          });
        } else {
          // Create new medical record (always create new for historical tracking)
          await medicalRecordsApi.create({
            user_id: selectedTrainee.id,
            emergency_contact: formData.emergency_contact,
            blood_type: formData.blood_type || null,
            blood_pressure: formData.blood_pressure || null,
            malaria_test: formData.malaria_test || null,
            sugar_test: formData.sugar_test || null,
            hepatitis_test: formData.hepatitis_test || null,
            pregnancy_test: formData.pregnancy_test || null,
            weight: formData.weight || null,
            height: formData.height || null,
            hb_hemoglobin: formData.hb_hemoglobin || null,
            hiv_status: formData.hiv_status || null,
            allergies: formData.allergies || null,
            medical_history: formData.medical_history || null,
            chronic_illnesses: formData.chronic_illnesses || null,
            trauma_history: formData.trauma_history || null,
          });
          toast({
            title: "Medical Information Registered",
            description: "Medical information has been registered successfully.",
          });
        }
      }
      
      setShowEditDialog(false);
      setMedicalRecord(null);
      setSelectedTrainee(null);
      setAttachments([]);
      setExistingAttachments([]);
      if (attachmentsInputRef.current) {
        attachmentsInputRef.current.value = "";
      }
      
      // Reload trainees to update the records status
      await loadTrainees();
    } catch (error: any) {
      console.error('Error saving medical record:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save medical information.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

      {/* Tabs for filtering */}
      {user?.role === "doctor" && (
        <Tabs value={filterTab} onValueChange={(value) => setFilterTab(value as "all" | "registered" | "unregistered")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All Trainees</TabsTrigger>
            <TabsTrigger value="registered">Registered</TabsTrigger>
            <TabsTrigger value="unregistered">Unregistered</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

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
                  {user?.role === "doctor" && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user?.role === "doctor" ? 7 : 6} className="text-center py-8 text-muted-foreground">
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
                  {user?.role === "doctor" && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMedicalInfo(trainee)}
                          className="flex items-center gap-1"
                        >
                          <Eye className={`w-4 h-4 ${traineesWithRecords.has(trainee.id) ? 'text-blue-500' : ''}`} />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMedicalInfo(trainee)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          {medicalRecord ? "Edit" : "Add"}
                        </Button>
                      </div>
                    </TableCell>
                  )}
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

      {/* View Medical Information Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Medical Information - {selectedTrainee?.name}
            </DialogTitle>
            <DialogDescription>
              View medical information for this trainee
            </DialogDescription>
          </DialogHeader>
          {isLoadingRecord ? (
            <div className="text-center py-8">Loading medical information...</div>
          ) : medicalRecord ? (
            <div className="space-y-6">
              {/* 1. Personal Particulars */}
              <div>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">1. Personal Particulars</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Full Name</Label>
                    <p className="text-sm">{medicalRecord.user?.name || selectedTrainee?.name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Email</Label>
                    <p className="text-sm">{medicalRecord.user?.email || selectedTrainee?.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Phone</Label>
                    <p className="text-sm">{medicalRecord.user?.phone || selectedTrainee?.phone || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Emergency Contact</Label>
                    <p className="text-sm">{medicalRecord.emergency_contact || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* 2. Medical Examinations/Tests */}
              <div>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">2. Vipimo vya Awali (Initial Medical Tests)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Blood Pressure</Label>
                    <p className="text-sm">{medicalRecord.blood_pressure || "Not recorded"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Malaria Test</Label>
                    <p className="text-sm">{medicalRecord.malaria_test || "Not recorded"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Sugar Test (Diabetes)</Label>
                    <p className="text-sm">{medicalRecord.sugar_test || "Not recorded"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Hepatitis Test</Label>
                    <p className="text-sm">{medicalRecord.hepatitis_test || "Not recorded"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Pregnancy Test</Label>
                    <p className="text-sm">{medicalRecord.pregnancy_test || "Not recorded"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Weight</Label>
                    <p className="text-sm">{medicalRecord.weight || "Not recorded"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Height</Label>
                    <p className="text-sm">{medicalRecord.height || "Not recorded"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Hb (Hemoglobin)</Label>
                    <p className="text-sm">{medicalRecord.hb_hemoglobin || "Not recorded"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Blood Group</Label>
                    <p className="text-sm">{medicalRecord.blood_type || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">HIV Status</Label>
                    <p className="text-sm">{medicalRecord.hiv_status || "Not recorded"}</p>
                  </div>
                </div>
              </div>

              {/* 3. Medical History */}
              <div>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">3. Past and Current Medical History</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Chronic Illnesses</Label>
                    <p className="text-sm whitespace-pre-wrap">{medicalRecord.chronic_illnesses || "None recorded"}</p>
                    <p className="text-xs text-muted-foreground mt-1">(TB, Diabetes, Genetic, Mental Illness, etc.)</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Allergies</Label>
                    <p className="text-sm whitespace-pre-wrap">{medicalRecord.allergies || "None recorded"}</p>
                    <p className="text-xs text-muted-foreground mt-1">(Drug allergies, food allergies, etc.)</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Trauma History</Label>
                    <p className="text-sm whitespace-pre-wrap">{medicalRecord.trauma_history || "None recorded"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">General Medical History</Label>
                    <p className="text-sm whitespace-pre-wrap">{medicalRecord.medical_history || "No medical history recorded"}</p>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              {medicalRecord.attachments && (() => {
                const atts = typeof medicalRecord.attachments === 'string' 
                  ? JSON.parse(medicalRecord.attachments) 
                  : medicalRecord.attachments;
                const attachmentList = Array.isArray(atts) ? atts : [];
                if (attachmentList.length > 0) {
                  return (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                      <div className="space-y-2">
                        {attachmentList.map((filePath: string, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3 flex-1">
                              <FileText className="w-5 h-5 text-primary" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{filePath.split('/').pop()}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadAttachment(filePath)}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No medical information available.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Add Medical Information Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              {medicalRecord ? "Edit" : "Register"} Medical Information - {selectedTrainee?.name}
            </DialogTitle>
            <DialogDescription>
              {medicalRecord ? "Update medical information for this trainee" : "Register medical information for this trainee"}
            </DialogDescription>
          </DialogHeader>
          {isLoadingRecord ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* 1. Personal Particulars */}
              <div>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">1. Personal Particulars</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="emergency_contact">Emergency Contact *</Label>
                    <Input
                      id="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                      placeholder="Emergency contact name and phone"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. Medical Examinations/Tests */}
              <div>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">2. Vipimo vya Awali (Initial Medical Tests)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="blood_pressure">Blood Pressure</Label>
                    <Input
                      id="blood_pressure"
                      value={formData.blood_pressure}
                      onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
                      placeholder="e.g., 120/80"
                    />
                  </div>
                  <div>
                    <Label htmlFor="malaria_test">Malaria Test</Label>
                    <Select 
                      value={formData.malaria_test} 
                      onValueChange={(value) => setFormData({ ...formData, malaria_test: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Positive">Positive</SelectItem>
                        <SelectItem value="Negative">Negative</SelectItem>
                        <SelectItem value="Not Tested">Not Tested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sugar_test">Sugar Test (Diabetes)</Label>
                    <Input
                      id="sugar_test"
                      value={formData.sugar_test}
                      onChange={(e) => setFormData({ ...formData, sugar_test: e.target.value })}
                      placeholder="e.g., 5.5 mmol/L"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hepatitis_test">Hepatitis Test</Label>
                    <Select 
                      value={formData.hepatitis_test} 
                      onValueChange={(value) => setFormData({ ...formData, hepatitis_test: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Positive">Positive</SelectItem>
                        <SelectItem value="Negative">Negative</SelectItem>
                        <SelectItem value="Not Tested">Not Tested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pregnancy_test">Pregnancy Test</Label>
                    <Select 
                      value={formData.pregnancy_test} 
                      onValueChange={(value) => setFormData({ ...formData, pregnancy_test: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Positive">Positive</SelectItem>
                        <SelectItem value="Negative">Negative</SelectItem>
                        <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                        <SelectItem value="Not Tested">Not Tested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="e.g., 70.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      placeholder="e.g., 175"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hb_hemoglobin">Hb (Hemoglobin)</Label>
                    <Input
                      id="hb_hemoglobin"
                      value={formData.hb_hemoglobin}
                      onChange={(e) => setFormData({ ...formData, hb_hemoglobin: e.target.value })}
                      placeholder="e.g., 14.5 g/dL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="blood_type">Blood Group</Label>
                    <Select 
                      value={formData.blood_type} 
                      onValueChange={(value) => setFormData({ ...formData, blood_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hiv_status">HIV Status</Label>
                    <Select 
                      value={formData.hiv_status} 
                      onValueChange={(value) => setFormData({ ...formData, hiv_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Positive">Positive</SelectItem>
                        <SelectItem value="Negative">Negative</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                        <SelectItem value="Not Tested">Not Tested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 3. Medical History */}
              <div>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">3. Past and Current Medical History</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="chronic_illnesses">Chronic Illnesses</Label>
                    <Textarea
                      id="chronic_illnesses"
                      value={formData.chronic_illnesses}
                      onChange={(e) => setFormData({ ...formData, chronic_illnesses: e.target.value })}
                      placeholder="e.g., TB, Diabetes, Genetic conditions, Mental illness, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder="Drug allergies, food allergies, environmental allergies, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="trauma_history">Trauma History</Label>
                    <Textarea
                      id="trauma_history"
                      value={formData.trauma_history}
                      onChange={(e) => setFormData({ ...formData, trauma_history: e.target.value })}
                      placeholder="Any history of trauma, injuries, accidents, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="medical_history">General Medical History</Label>
                    <Textarea
                      id="medical_history"
                      value={formData.medical_history}
                      onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                      placeholder="Any other medical history, previous surgeries, medications, etc."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                <div className="space-y-3">
                  {/* Existing Attachments */}
                  {existingAttachments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Existing Attachments</Label>
                      {existingAttachments.map((filePath: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{filePath.split('/').pop()}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadAttachment(filePath)}
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Attachments */}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">New Attachments</Label>
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAttachment(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex items-center gap-2">
                    <Input
                      id="attachments"
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      ref={attachmentsInputRef}
                      onChange={handleAttachmentsChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => attachmentsInputRef.current?.click()}
                      className="flex items-center gap-2"
                      disabled={attachments.length >= 10}
                    >
                      <Upload className="w-4 h-4" />
                      {attachments.length > 0 ? "Add More Attachments" : "Upload Attachments"}
                    </Button>
                    {attachments.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {attachments.length} / 10 attachments
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload supporting documents (e.g., test results, certificates). Max 10 files, 10MB each. PDF format only.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDialog(false);
                    setMedicalRecord(null);
                    setSelectedTrainee(null);
                    setAttachments([]);
                    setExistingAttachments([]);
                    if (attachmentsInputRef.current) {
                      attachmentsInputRef.current.value = "";
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveMedicalInfo}
                  disabled={isSaving || !formData.emergency_contact}
                  className="bg-gradient-military"
                >
                  {isSaving ? "Saving..." : medicalRecord ? "Update" : "Register"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewTrainees;


