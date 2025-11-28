import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RotatingLogo } from "@/components/RotatingLogo";
import { Settings, User, BookOpen, Calendar, Save } from "lucide-react";
import tawaBackground from "@/assets/tawa-background.jpg";

const Setup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Admin Information
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    adminPhone: "",
    adminDepartment: "",
    
    // Course Information
    courseCode: "",
    courseName: "",
    courseType: "",
    courseDuration: "",
    courseDescription: "",
    startDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Setup failed');
      }

      toast({
        title: "Course & Admin Created",
        description: "Your admin account and course have been created successfully. You can now login.",
      });

      // Redirect to landing page after a short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error('Setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden" style={{ backgroundImage: `url(${tawaBackground})` }}>
      <div className="absolute inset-0 bg-gradient-military/90" />
      
      <div className="relative z-10 w-full max-w-4xl mx-auto p-6">
        <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <RotatingLogo className="w-20 h-20" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">Create New Course & Admin</CardTitle>
              <CardDescription className="text-lg mt-2">
                Set up a new administrator account and create your own isolated training course
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Admin Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">Administrator Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Full Name *</Label>
                    <Input
                      id="adminName"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      placeholder="Enter admin full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email Address *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      placeholder="admin@tawa.go.tz"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      placeholder="Enter secure password"
                      required
                      minLength={8}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminPhone">Phone Number</Label>
                    <Input
                      id="adminPhone"
                      value={formData.adminPhone}
                      onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                      placeholder="+255 XXX XXX XXX"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="adminDepartment">Department</Label>
                    <Input
                      id="adminDepartment"
                      value={formData.adminDepartment}
                      onChange={(e) => setFormData({ ...formData, adminDepartment: e.target.value })}
                      placeholder="IT Department"
                    />
                  </div>
                </div>
              </div>

              {/* Course Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">Initial Course Configuration</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseCode">Course Code *</Label>
                    <Input
                      id="courseCode"
                      value={formData.courseCode}
                      onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                      placeholder="e.g., TC2024, SC2024"
                      required
                      pattern="[A-Z0-9]+"
                      title="Course code should contain only uppercase letters and numbers"
                    />
                    <p className="text-xs text-muted-foreground">Unique identifier for this course (e.g., TC2024)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Course Name *</Label>
                    <Input
                      id="courseName"
                      value={formData.courseName}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                      placeholder="e.g., Transformation Course"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="courseType">Course Type *</Label>
                    <Input
                      id="courseType"
                      value={formData.courseType}
                      onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                      placeholder="e.g., Transformation, Special, Recruit, Refresher"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="courseDuration">Duration *</Label>
                    <Input
                      id="courseDuration"
                      value={formData.courseDuration}
                      onChange={(e) => setFormData({ ...formData, courseDuration: e.target.value })}
                      placeholder="e.g., 12 weeks"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="courseDescription">Course Description</Label>
                    <Textarea
                      id="courseDescription"
                      value={formData.courseDescription}
                      onChange={(e) => setFormData({ ...formData, courseDescription: e.target.value })}
                      placeholder="Enter course description..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-military min-w-[150px]"
                >
                  {isLoading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Course & Admin
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;


