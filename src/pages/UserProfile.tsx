import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usersApi, medicalRecordsApi, disciplineIssuesApi, coursesApi } from "@/lib/api";
import { ArrowLeft, User, Heart, AlertTriangle, Calendar, Mail, Phone, MapPin, BookOpen, Printer } from "lucide-react";

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  user_id?: string;
  department?: string;
  course_id?: number;
  course?: {
    id: number;
    name: string;
  };
  date_of_birth?: string;
  gender?: string;
  tribe?: string;
  religion?: string;
  blood_group?: string;
  national_id?: string;
  birth_region?: string;
  birth_district?: string;
  birth_street?: string;
  phone_2?: string;
  profession?: string;
  university?: string;
  employment?: string;
  other_education_level?: string;
  other_education_university?: string;
  skills?: string[];
  marital_status?: string;
  spouse_name?: string;
  spouse_phone?: string;
  father_name?: string;
  father_phone?: string;
  mother_name?: string;
  mother_phone?: string;
  number_of_children?: number;
  relatives?: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
  passport_picture?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserProfileProps {
  userId?: string;
  onBack?: () => void;
}

const UserProfile = ({ userId: propUserId, onBack }: UserProfileProps = {}) => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const userId = propUserId || paramUserId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [disciplineIssues, setDisciplineIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [courses, setCourses] = useState<any[]>([]);
  
  const isSuperAdmin = user?.role === "super_admin";
  const adminCourseId = user?.course_id;

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (userId) {
      loadProfileData();
    }
  }, [userId, selectedCourse]);

  const loadCourses = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const coursesData = await coursesApi.getAll();
      const coursesArray = Array.isArray(coursesData) ? coursesData : [];
      setCourses(coursesArray);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const loadProfileData = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      // Load user data
      const userData = await usersApi.getById(userId);
      const userInfo = userData?.data || userData;
      setProfileData(userInfo);

      // Load medical records
      try {
        const records = await medicalRecordsApi.getAll({ user_id: userId });
        const recordsArray = Array.isArray(records) ? records : (records?.data || []);
        
        // Filter by course if needed
        let filteredRecords = recordsArray;
        if (isSuperAdmin && selectedCourse && selectedCourse !== "all") {
          filteredRecords = recordsArray.filter((r: any) => r.course_id?.toString() === selectedCourse);
        } else if (!isSuperAdmin && adminCourseId) {
          filteredRecords = recordsArray.filter((r: any) => r.course_id === adminCourseId);
        }
        
        setMedicalRecords(filteredRecords);
      } catch (error) {
        console.error("Error loading medical records:", error);
        setMedicalRecords([]);
      }

      // Load discipline issues
      try {
        const issues = await disciplineIssuesApi.getAll({ user_id: userId });
        const issuesArray = Array.isArray(issues) ? issues : (issues?.data || []);
        
        // Filter by course if needed
        let filteredIssues = issuesArray;
        if (isSuperAdmin && selectedCourse && selectedCourse !== "all") {
          filteredIssues = issuesArray.filter((i: any) => i.course_id?.toString() === selectedCourse);
        } else if (!isSuperAdmin && adminCourseId) {
          filteredIssues = issuesArray.filter((i: any) => i.course_id === adminCourseId);
        }
        
        setDisciplineIssues(filteredIssues);
      } catch (error) {
        console.error("Error loading discipline issues:", error);
        setDisciplineIssues([]);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load user profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render functions for print view
  const renderRegistrationPrintView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">Full Name</Label>
          <p className="text-sm">{profileData.name}</p>
        </div>
        <div>
          <Label className="text-sm font-semibold">Email</Label>
          <p className="text-sm">{profileData.email}</p>
        </div>
        <div>
          <Label className="text-sm font-semibold">Phone</Label>
          <p className="text-sm">{profileData.phone || "N/A"}</p>
        </div>
        {profileData.phone_2 && (
          <div>
            <Label className="text-sm font-semibold">Secondary Phone</Label>
            <p className="text-sm">{profileData.phone_2}</p>
          </div>
        )}
        <div>
          <Label className="text-sm font-semibold">Role</Label>
          <Badge>{profileData.role}</Badge>
        </div>
        <div>
          <Label className="text-sm font-semibold">User ID</Label>
          <p className="text-sm">{profileData.user_id || profileData.id}</p>
        </div>
        {profileData.department && (
          <div>
            <Label className="text-sm font-semibold">Department</Label>
            <p className="text-sm">{profileData.department}</p>
          </div>
        )}
        {profileData.course && (
          <div>
            <Label className="text-sm font-semibold">Course</Label>
            <p className="text-sm">{profileData.course.name}</p>
          </div>
        )}
        {profileData.date_of_birth && (
          <div>
            <Label className="text-sm font-semibold">Date of Birth</Label>
            <p className="text-sm">{new Date(profileData.date_of_birth).toLocaleDateString()}</p>
          </div>
        )}
        {profileData.gender && (
          <div>
            <Label className="text-sm font-semibold">Gender</Label>
            <p className="text-sm">{profileData.gender}</p>
          </div>
        )}
        {profileData.blood_group && (
          <div>
            <Label className="text-sm font-semibold">Blood Group</Label>
            <p className="text-sm">{profileData.blood_group}</p>
          </div>
        )}
        {profileData.national_id && (
          <div>
            <Label className="text-sm font-semibold">National ID</Label>
            <p className="text-sm">{profileData.national_id}</p>
          </div>
        )}
      </div>

      {(profileData.birth_region || profileData.birth_district || profileData.birth_street) && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Birth Information</h3>
          <div className="grid grid-cols-3 gap-4">
            {profileData.birth_region && (
              <div>
                <Label className="text-xs text-muted-foreground">Region</Label>
                <p className="text-sm">{profileData.birth_region}</p>
              </div>
            )}
            {profileData.birth_district && (
              <div>
                <Label className="text-xs text-muted-foreground">District</Label>
                <p className="text-sm">{profileData.birth_district}</p>
              </div>
            )}
            {profileData.birth_street && (
              <div>
                <Label className="text-xs text-muted-foreground">Street</Label>
                <p className="text-sm">{profileData.birth_street}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {(profileData.profession || profileData.university || profileData.employment) && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Professional Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {profileData.profession && (
              <div>
                <Label className="text-xs text-muted-foreground">Profession</Label>
                <p className="text-sm">{profileData.profession}</p>
              </div>
            )}
            {profileData.university && (
              <div>
                <Label className="text-xs text-muted-foreground">University</Label>
                <p className="text-sm">{profileData.university}</p>
              </div>
            )}
            {profileData.employment && (
              <div>
                <Label className="text-xs text-muted-foreground">Employment</Label>
                <p className="text-sm">{profileData.employment}</p>
              </div>
            )}
            {profileData.skills && profileData.skills.length > 0 && (
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Skills</Label>
                <p className="text-sm">{profileData.skills.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {(profileData.marital_status || profileData.spouse_name || profileData.father_name || profileData.mother_name) && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Family Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {profileData.marital_status && (
              <div>
                <Label className="text-xs text-muted-foreground">Marital Status</Label>
                <p className="text-sm">{profileData.marital_status}</p>
              </div>
            )}
            {profileData.spouse_name && (
              <div>
                <Label className="text-xs text-muted-foreground">Spouse Name</Label>
                <p className="text-sm">{profileData.spouse_name}</p>
              </div>
            )}
            {profileData.spouse_phone && (
              <div>
                <Label className="text-xs text-muted-foreground">Spouse Phone</Label>
                <p className="text-sm">{profileData.spouse_phone}</p>
              </div>
            )}
            {profileData.father_name && (
              <div>
                <Label className="text-xs text-muted-foreground">Father Name</Label>
                <p className="text-sm">{profileData.father_name}</p>
              </div>
            )}
            {profileData.father_phone && (
              <div>
                <Label className="text-xs text-muted-foreground">Father Phone</Label>
                <p className="text-sm">{profileData.father_phone}</p>
              </div>
            )}
            {profileData.mother_name && (
              <div>
                <Label className="text-xs text-muted-foreground">Mother Name</Label>
                <p className="text-sm">{profileData.mother_name}</p>
              </div>
            )}
            {profileData.mother_phone && (
              <div>
                <Label className="text-xs text-muted-foreground">Mother Phone</Label>
                <p className="text-sm">{profileData.mother_phone}</p>
              </div>
            )}
            {profileData.number_of_children !== undefined && (
              <div>
                <Label className="text-xs text-muted-foreground">Number of Children</Label>
                <p className="text-sm">{profileData.number_of_children}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {profileData.relatives && profileData.relatives.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Relatives</h3>
          <div className="space-y-2">
            {profileData.relatives.map((relative, idx) => (
              <div key={idx} className="border rounded p-2">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {relative.name}
                  </div>
                  <div>
                    <span className="font-medium">Relationship:</span> {relative.relationship}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {relative.phone}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMedicalRecordsPrintView = () => {
    if (medicalRecords.length === 0) {
      return <p className="text-sm text-muted-foreground">No medical records found</p>;
    }

    return (
      <div className="space-y-4">
        {medicalRecords.map((record, idx) => (
          <div key={record.id || idx} className="border rounded-lg p-4 break-inside-avoid">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Medical Record #{idx + 1}</h3>
              <Badge variant="outline">
                {record.record_date ? new Date(record.record_date).toLocaleDateString() : "N/A"}
              </Badge>
            </div>
            {record.course && (
              <p className="text-xs text-muted-foreground mb-3">Course: {record.course.name || record.course_id}</p>
            )}
            
            <div className="space-y-3">
              {record.emergency_contact && (
                <div>
                  <Label className="text-xs font-semibold">Emergency Contact</Label>
                  <p className="text-sm">{record.emergency_contact}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2 text-sm">Medical Examinations</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {record.blood_pressure && (
                    <div><span className="font-medium">Blood Pressure:</span> {record.blood_pressure}</div>
                  )}
                  {record.malaria_test && (
                    <div><span className="font-medium">Malaria Test:</span> {record.malaria_test}</div>
                  )}
                  {record.sugar_test && (
                    <div><span className="font-medium">Sugar Test:</span> {record.sugar_test}</div>
                  )}
                  {record.hepatitis_test && (
                    <div><span className="font-medium">Hepatitis Test:</span> {record.hepatitis_test}</div>
                  )}
                  {record.pregnancy_test && (
                    <div><span className="font-medium">Pregnancy Test:</span> {record.pregnancy_test}</div>
                  )}
                  {record.weight && (
                    <div><span className="font-medium">Weight:</span> {record.weight}</div>
                  )}
                  {record.height && (
                    <div><span className="font-medium">Height:</span> {record.height}</div>
                  )}
                  {record.hb_hemoglobin && (
                    <div><span className="font-medium">Hb (Hemoglobin):</span> {record.hb_hemoglobin}</div>
                  )}
                  {record.blood_type && (
                    <div><span className="font-medium">Blood Type:</span> {record.blood_type}</div>
                  )}
                  {record.hiv_status && (
                    <div><span className="font-medium">HIV Status:</span> {record.hiv_status}</div>
                  )}
                </div>
              </div>

              {(record.chronic_illnesses || record.allergies || record.trauma_history || record.medical_history) && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Medical History</h4>
                  <div className="space-y-1 text-xs">
                    {record.chronic_illnesses && (
                      <div>
                        <span className="font-medium">Chronic Illnesses:</span>
                        <p className="whitespace-pre-wrap ml-2">{record.chronic_illnesses}</p>
                      </div>
                    )}
                    {record.allergies && (
                      <div>
                        <span className="font-medium">Allergies:</span>
                        <p className="whitespace-pre-wrap ml-2">{record.allergies}</p>
                      </div>
                    )}
                    {record.trauma_history && (
                      <div>
                        <span className="font-medium">Trauma History:</span>
                        <p className="whitespace-pre-wrap ml-2">{record.trauma_history}</p>
                      </div>
                    )}
                    {record.medical_history && (
                      <div>
                        <span className="font-medium">General Medical History:</span>
                        <p className="whitespace-pre-wrap ml-2">{record.medical_history}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDisciplineIssuesPrintView = () => {
    if (disciplineIssues.length === 0) {
      return <p className="text-sm text-muted-foreground">No discipline issues found</p>;
    }

    return (
      <div className="space-y-4">
        {disciplineIssues.map((issue, idx) => (
          <div key={issue.id || idx} className="border rounded-lg p-4 break-inside-avoid">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{issue.title || `Discipline Issue #${idx + 1}`}</h3>
              <Badge
                variant={
                  issue.status === "approved"
                    ? "default"
                    : issue.status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
              >
                {issue.status || "pending"}
              </Badge>
            </div>
            {issue.course && (
              <p className="text-xs text-muted-foreground mb-3">Course: {issue.course.name || issue.course_id}</p>
            )}
            
            <div className="space-y-2 text-sm">
              {issue.description && (
                <div>
                  <Label className="text-xs font-semibold">Description</Label>
                  <p className="whitespace-pre-wrap">{issue.description}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {issue.incident_date && (
                  <div>
                    <span className="font-medium">Incident Date:</span> {new Date(issue.incident_date).toLocaleDateString()}
                  </div>
                )}
                {issue.severity && (
                  <div>
                    <span className="font-medium">Severity:</span> {issue.severity}
                  </div>
                )}
                {issue.created_at && (
                  <div>
                    <span className="font-medium">Reported On:</span> {new Date(issue.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
      
      <div className="space-y-6 print-content">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack || (() => navigate(-1))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{profileData.name}</h1>
            <p className="text-muted-foreground">{profileData.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Summary
          </Button>
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Label>Filter by Course:</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-48">
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
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold">{profileData.name} - Complete Profile Summary</h1>
        <p className="text-muted-foreground">{profileData.email}</p>
        <p className="text-sm text-muted-foreground">Generated on: {new Date().toLocaleString()}</p>
      </div>

      {/* Profile Tabs */}
      <Tabs defaultValue="registration" className="w-full">
        <TabsList className="grid w-full grid-cols-3 no-print">
          <TabsTrigger value="registration">
            <User className="w-4 h-4 mr-2" />
            Registration
          </TabsTrigger>
          <TabsTrigger value="medical">
            <Heart className="w-4 h-4 mr-2" />
            Medical Records ({medicalRecords.length})
          </TabsTrigger>
          <TabsTrigger value="discipline">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Discipline ({disciplineIssues.length})
          </TabsTrigger>
        </TabsList>

        {/* Registration Information */}
        <TabsContent value="registration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Full Name</Label>
                <p className="text-sm">{profileData.name}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Email</Label>
                <p className="text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profileData.email}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Phone</Label>
                <p className="text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {profileData.phone || "N/A"}
                </p>
              </div>
              {profileData.phone_2 && (
                <div>
                  <Label className="text-sm font-semibold">Secondary Phone</Label>
                  <p className="text-sm">{profileData.phone_2}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-semibold">Role</Label>
                <Badge>{profileData.role}</Badge>
              </div>
              <div>
                <Label className="text-sm font-semibold">User ID</Label>
                <p className="text-sm">{profileData.user_id || profileData.id}</p>
              </div>
              {profileData.department && (
                <div>
                  <Label className="text-sm font-semibold">Department</Label>
                  <p className="text-sm">{profileData.department}</p>
                </div>
              )}
              {profileData.course && (
                <div>
                  <Label className="text-sm font-semibold">Course</Label>
                  <p className="text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {profileData.course.name}
                  </p>
                </div>
              )}
              {profileData.date_of_birth && (
                <div>
                  <Label className="text-sm font-semibold">Date of Birth</Label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(profileData.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              )}
              {profileData.gender && (
                <div>
                  <Label className="text-sm font-semibold">Gender</Label>
                  <p className="text-sm">{profileData.gender}</p>
                </div>
              )}
              {profileData.blood_group && (
                <div>
                  <Label className="text-sm font-semibold">Blood Group</Label>
                  <p className="text-sm">{profileData.blood_group}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Birth Information */}
          {(profileData.birth_region || profileData.birth_district || profileData.birth_street) && (
            <Card>
              <CardHeader>
                <CardTitle>Birth Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.birth_region && (
                  <div>
                    <Label className="text-sm font-semibold">Region</Label>
                    <p className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {profileData.birth_region}
                    </p>
                  </div>
                )}
                {profileData.birth_district && (
                  <div>
                    <Label className="text-sm font-semibold">District</Label>
                    <p className="text-sm">{profileData.birth_district}</p>
                  </div>
                )}
                {profileData.birth_street && (
                  <div>
                    <Label className="text-sm font-semibold">Street</Label>
                    <p className="text-sm">{profileData.birth_street}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Professional Information */}
          {(profileData.profession || profileData.university || profileData.employment) && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.profession && (
                  <div>
                    <Label className="text-sm font-semibold">Profession</Label>
                    <p className="text-sm">{profileData.profession}</p>
                  </div>
                )}
                {profileData.university && (
                  <div>
                    <Label className="text-sm font-semibold">University</Label>
                    <p className="text-sm">{profileData.university}</p>
                  </div>
                )}
                {profileData.employment && (
                  <div>
                    <Label className="text-sm font-semibold">Employment</Label>
                    <p className="text-sm">{profileData.employment}</p>
                  </div>
                )}
                {profileData.skills && profileData.skills.length > 0 && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-semibold">Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profileData.skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Family Information */}
          {(profileData.marital_status || profileData.spouse_name || profileData.father_name || profileData.mother_name) && (
            <Card>
              <CardHeader>
                <CardTitle>Family Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.marital_status && (
                  <div>
                    <Label className="text-sm font-semibold">Marital Status</Label>
                    <p className="text-sm">{profileData.marital_status}</p>
                  </div>
                )}
                {profileData.spouse_name && (
                  <div>
                    <Label className="text-sm font-semibold">Spouse Name</Label>
                    <p className="text-sm">{profileData.spouse_name}</p>
                  </div>
                )}
                {profileData.spouse_phone && (
                  <div>
                    <Label className="text-sm font-semibold">Spouse Phone</Label>
                    <p className="text-sm">{profileData.spouse_phone}</p>
                  </div>
                )}
                {profileData.father_name && (
                  <div>
                    <Label className="text-sm font-semibold">Father Name</Label>
                    <p className="text-sm">{profileData.father_name}</p>
                  </div>
                )}
                {profileData.father_phone && (
                  <div>
                    <Label className="text-sm font-semibold">Father Phone</Label>
                    <p className="text-sm">{profileData.father_phone}</p>
                  </div>
                )}
                {profileData.mother_name && (
                  <div>
                    <Label className="text-sm font-semibold">Mother Name</Label>
                    <p className="text-sm">{profileData.mother_name}</p>
                  </div>
                )}
                {profileData.mother_phone && (
                  <div>
                    <Label className="text-sm font-semibold">Mother Phone</Label>
                    <p className="text-sm">{profileData.mother_phone}</p>
                  </div>
                )}
                {profileData.number_of_children !== undefined && (
                  <div>
                    <Label className="text-sm font-semibold">Number of Children</Label>
                    <p className="text-sm">{profileData.number_of_children}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Relatives */}
          {profileData.relatives && profileData.relatives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Relatives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profileData.relatives.map((relative, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Name</Label>
                          <p className="text-sm font-medium">{relative.name}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Relationship</Label>
                          <p className="text-sm">{relative.relationship}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Phone</Label>
                          <p className="text-sm">{relative.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Medical Records */}
        <TabsContent value="medical" className="space-y-4">
          {medicalRecords.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No medical records found
              </CardContent>
            </Card>
          ) : (
            medicalRecords.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Medical Record</CardTitle>
                    <Badge variant="outline">
                      {record.record_date ? new Date(record.record_date).toLocaleDateString() : "N/A"}
                    </Badge>
                  </div>
                  {record.course && (
                    <CardDescription>
                      Course: {record.course.name || record.course_id}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Personal Particulars */}
                  {record.emergency_contact && (
                    <div>
                      <Label className="text-sm font-semibold">Emergency Contact</Label>
                      <p className="text-sm">{record.emergency_contact}</p>
                    </div>
                  )}

                  {/* Medical Examinations */}
                  <div>
                    <h4 className="font-semibold mb-2">Medical Examinations</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {record.blood_pressure && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Blood Pressure</Label>
                          <p className="text-sm">{record.blood_pressure}</p>
                        </div>
                      )}
                      {record.malaria_test && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Malaria Test</Label>
                          <p className="text-sm">{record.malaria_test}</p>
                        </div>
                      )}
                      {record.sugar_test && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Sugar Test</Label>
                          <p className="text-sm">{record.sugar_test}</p>
                        </div>
                      )}
                      {record.hepatitis_test && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Hepatitis Test</Label>
                          <p className="text-sm">{record.hepatitis_test}</p>
                        </div>
                      )}
                      {record.pregnancy_test && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Pregnancy Test</Label>
                          <p className="text-sm">{record.pregnancy_test}</p>
                        </div>
                      )}
                      {record.weight && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Weight</Label>
                          <p className="text-sm">{record.weight}</p>
                        </div>
                      )}
                      {record.height && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Height</Label>
                          <p className="text-sm">{record.height}</p>
                        </div>
                      )}
                      {record.hb_hemoglobin && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Hb (Hemoglobin)</Label>
                          <p className="text-sm">{record.hb_hemoglobin}</p>
                        </div>
                      )}
                      {record.blood_type && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Blood Type</Label>
                          <p className="text-sm">{record.blood_type}</p>
                        </div>
                      )}
                      {record.hiv_status && (
                        <div>
                          <Label className="text-xs text-muted-foreground">HIV Status</Label>
                          <p className="text-sm">{record.hiv_status}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medical History */}
                  {(record.allergies || record.medical_history || record.chronic_illnesses || record.trauma_history) && (
                    <div>
                      <h4 className="font-semibold mb-2">Medical History</h4>
                      <div className="space-y-2">
                        {record.chronic_illnesses && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Chronic Illnesses</Label>
                            <p className="text-sm whitespace-pre-wrap">{record.chronic_illnesses}</p>
                          </div>
                        )}
                        {record.allergies && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Allergies</Label>
                            <p className="text-sm whitespace-pre-wrap">{record.allergies}</p>
                          </div>
                        )}
                        {record.trauma_history && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Trauma History</Label>
                            <p className="text-sm whitespace-pre-wrap">{record.trauma_history}</p>
                          </div>
                        )}
                        {record.medical_history && (
                          <div>
                            <Label className="text-xs text-muted-foreground">General Medical History</Label>
                            <p className="text-sm whitespace-pre-wrap">{record.medical_history}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Discipline Issues */}
        <TabsContent value="discipline" className="space-y-4">
          {disciplineIssues.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No discipline issues found
              </CardContent>
            </Card>
          ) : (
            disciplineIssues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{issue.title || "Discipline Issue"}</CardTitle>
                    <Badge
                      variant={
                        issue.status === "approved"
                          ? "default"
                          : issue.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {issue.status || "pending"}
                    </Badge>
                  </div>
                  {issue.course && (
                    <CardDescription>
                      Course: {issue.course.name || issue.course_id}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {issue.description && (
                    <div>
                      <Label className="text-sm font-semibold">Description</Label>
                      <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
                    </div>
                  )}
                  {issue.incident_date && (
                    <div>
                      <Label className="text-sm font-semibold">Incident Date</Label>
                      <p className="text-sm">{new Date(issue.incident_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {issue.severity && (
                    <div>
                      <Label className="text-sm font-semibold">Severity</Label>
                      <Badge variant="outline">{issue.severity}</Badge>
                    </div>
                  )}
                  {issue.created_at && (
                    <div>
                      <Label className="text-sm font-semibold">Reported On</Label>
                      <p className="text-sm">{new Date(issue.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        {/* Print View - Show All Sections */}
        <div className="hidden print:block space-y-6">
          {/* Registration Information - Print View */}
          <div className="print:block">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">1. Registration Information</h2>
            {renderRegistrationPrintView()}
          </div>
          
          {/* Medical Records - Print View */}
          <div className="print:block">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">2. Medical Records ({medicalRecords.length})</h2>
            {renderMedicalRecordsPrintView()}
          </div>
          
          {/* Discipline Issues - Print View */}
          <div className="print:block">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">3. Discipline Issues ({disciplineIssues.length})</h2>
            {renderDisciplineIssuesPrintView()}
          </div>
        </div>
      </Tabs>
      </div>
    </>
  );
};

export default UserProfile;

