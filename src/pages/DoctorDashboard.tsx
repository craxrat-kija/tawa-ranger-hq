import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCourse } from "@/contexts/CourseContext";
import { usePatients } from "@/contexts/PatientContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RotatingLogo } from "@/components/RotatingLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Chatbot } from "@/components/Chatbot";
import { NotificationBar } from "@/components/NotificationBar";
import ViewTrainees from "./ViewTrainees";
import PatientManagement from "./PatientManagement";
import {
  Users,
  LogOut,
  Menu,
  X,
  Heart,
  UserPlus,
  FileHeart,
  Activity,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import tawaBackground from "@/assets/tawa-background.jpg";

const DoctorDashboard = () => {
  const { logout, user } = useAuth();
  const { selectedCourse, setSelectedCourse } = useCourse();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    { icon: Heart, label: "Dashboard", path: "/doctor" },
    { icon: Users, label: "View Trainees", path: "/doctor/trainees" },
    { icon: UserPlus, label: "Register Patient", path: "/doctor/register" },
    { icon: FileHeart, label: "Patient Management", path: "/doctor/patients" },
    { icon: FileHeart, label: "Health Records", path: "/doctor/records" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-64 bg-slate-900`}
      >
        <div className="relative h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <RotatingLogo className="w-12 h-12" />
              <div>
                <h2 className="text-white font-bold text-xl">TAWA</h2>
                <p className="text-white/80 text-sm">Medical Portal</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/20 rounded-lg transition-colors group"
              >
                <item.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-base">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="mb-3 text-white">
              <p className="font-semibold text-base">{user?.name}</p>
              <p className="text-sm text-white/80">{user?.user_id || user?.email}</p>
            </div>
            {user?.course_name && (
              <div className="mb-3 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 text-white">
                  <BookOpen className="w-4 h-4 text-white/80" />
                  <div>
                    <p className="text-xs text-white/70">Course</p>
                    <p className="text-sm font-semibold">{user.course_name}</p>
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-cover bg-center border-b border-border p-4 flex items-center justify-between" style={{ backgroundImage: `url(${tawaBackground})` }}>
          <div className="absolute inset-0 bg-gradient-military/70" />
          <div className="relative flex items-center justify-between w-full">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-accent rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Medical Officer Portal</h1>
              <div className="flex items-center gap-4 mt-2">
                {selectedCourse ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg border border-white/30 backdrop-blur-sm">
                    <BookOpen className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm">{selectedCourse.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCourse(null);
                        navigate("/select-course");
                      }}
                      className="text-white/80 hover:text-white hover:bg-white/20 h-6 px-2 ml-2"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Switch Course
                    </Button>
                  </div>
                ) : user?.course_name ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg border border-white/30 backdrop-blur-sm">
                    <BookOpen className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm">{user.course_name}</span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBar />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<DoctorHome />} />
            <Route path="/trainees" element={<ViewTrainees />} />
            <Route path="/register" element={<RegisterUser />} />
            <Route path="/patients" element={<PatientManagement />} />
            <Route path="/records" element={<HealthRecords />} />
          </Routes>
        </main>
      </div>

      <Chatbot />
    </div>
  );
};

// Dashboard Home Component
const DoctorHome = () => {
  const navigate = useNavigate();
  const { patients, reports, attendance } = usePatients();

  // Calculate real statistics
  const totalPatients = patients.length;
  const totalReports = reports.length;
  const recentReports = reports.filter((r: any) => {
    const reportDate = new Date(r.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return reportDate >= weekAgo;
  }).length;
  const pendingCases = patients.length > 0 ? Math.max(0, totalPatients - totalReports) : 0;

  const handleNavigate = (path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  return (
    <div className="space-y-6" style={{ position: 'relative', zIndex: 1 }}>
      <div>
        <h2 className="text-3xl font-bold text-primary mb-2">Medical Dashboard</h2>
        <p className="text-muted-foreground">Manage trainee health records and registrations</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">Active patients</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Health Checks</CardTitle>
            <Activity className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{recentReports}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Cases</CardTitle>
            <FileHeart className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{pendingCases}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card style={{ position: 'relative', zIndex: 2 }}>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common medical tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            type="button"
            className="w-full h-20 text-lg bg-gradient-military cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigate("/doctor/register");
            }}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
          >
            <UserPlus className="w-6 h-6 mr-2" />
            Register Patient
          </Button>
          <Button 
            type="button"
            variant="outline" 
            className="w-full h-20 text-lg cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigate("/doctor/patients");
            }}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
          >
            <FileHeart className="w-6 h-6 mr-2" />
            Manage Patients
          </Button>
          <Button 
            type="button"
            variant="outline" 
            className="w-full h-20 text-lg cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigate("/doctor/records");
            }}
            style={{ pointerEvents: 'auto', zIndex: 10 }}
          >
            <FileHeart className="w-6 h-6 mr-2" />
            Health Records
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Register User Component
const RegisterUser = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addPatient, refreshData } = usePatients();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bloodType: "",
    allergies: "",
    medicalHistory: "",
    emergencyContact: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.emergencyContact) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addPatient({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        bloodType: formData.bloodType || "Unknown",
        allergies: formData.allergies || "None",
        medicalHistory: formData.medicalHistory || "None",
        emergencyContact: formData.emergencyContact,
      });

      // Refresh data after adding patient
      await refreshData();

      toast({
        title: "Patient Registered",
        description: `${formData.fullName} has been registered successfully`,
      });
      
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        bloodType: "",
        allergies: "",
        medicalHistory: "",
        emergencyContact: "",
      });

      // Navigate to patient management after a short delay
      setTimeout(() => {
        navigate("/doctor/patients");
      }, 1000);
    } catch (error) {
      console.error("Error registering patient:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    console.log(`Updating ${field}:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl">Register New Patient</CardTitle>
          <CardDescription>Add patient health information and details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  onInput={(e) => handleInputChange('fullName', (e.target as HTMLInputElement).value)}
                  placeholder="Enter full name"
                  required
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onInput={(e) => handleInputChange('phone', (e.target as HTMLInputElement).value)}
                  placeholder="Enter phone number"
                  required
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Input
                  id="bloodType"
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={(e) => handleInputChange('bloodType', e.target.value)}
                  onInput={(e) => handleInputChange('bloodType', (e.target as HTMLInputElement).value)}
                  placeholder="e.g., O+, A-, AB+"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Known Allergies</Label>
              <Textarea
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                onInput={(e) => handleInputChange('allergies', (e.target as HTMLTextAreaElement).value)}
                placeholder="List any known allergies..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Medical History</Label>
              <Textarea
                id="medicalHistory"
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                onInput={(e) => handleInputChange('medicalHistory', (e.target as HTMLTextAreaElement).value)}
                placeholder="Previous conditions, surgeries, medications..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact *</Label>
              <Input
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                onInput={(e) => handleInputChange('emergencyContact', (e.target as HTMLInputElement).value)}
                placeholder="Name and phone number"
                required
                autoComplete="off"
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-military" disabled={isSubmitting}>
              <UserPlus className="w-4 h-4 mr-2" />
              {isSubmitting ? "Registering..." : "Register User"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Health Records Component
const HealthRecords = () => {
  const { patients, reports, refreshData } = usePatients();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await refreshData();
      } catch (error) {
        console.error('Failed to load health records:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshData]);

  // Get latest report for each patient
  const patientRecords = patients.map(patient => {
    const patientReports = reports.filter(r => r.patientId === patient.id);
    const latestReport = patientReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return {
      id: patient.id,
      name: patient.fullName,
      bloodType: patient.bloodType,
      lastCheckup: latestReport?.date || "No checkup",
      status: latestReport ? "Healthy" : "No records",
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2">Health Records</h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Health Records</h2>
        <p className="text-muted-foreground">View and manage trainee health information</p>
      </div>

      <div className="grid gap-4">
        {patientRecords.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No health records found
            </CardContent>
          </Card>
        ) : (
          patientRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{record.name}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Blood Type: {record.bloodType}</span>
                    <span>Last Checkup: {record.lastCheckup}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      record.status === "Healthy"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : record.status === "Follow-up required"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
