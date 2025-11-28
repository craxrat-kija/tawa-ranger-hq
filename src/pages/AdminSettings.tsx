import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { adminPermissionsApi } from "@/lib/api";
import { Loader2, Save, Users, BookOpen, Upload, Image, Calendar, FileText, MessageSquare, ClipboardCheck, Activity, Stethoscope, Search } from "lucide-react";

interface Admin {
  id: number;
  name: string;
  email: string;
  user_id: string;
  course_id: number | null;
  course_name: string | null;
  permissions: {
    can_manage_users: boolean;
    can_manage_subjects: boolean;
    can_manage_materials: boolean;
    can_manage_gallery: boolean;
    can_manage_timetable: boolean;
    can_manage_reports: boolean;
    can_manage_chat: boolean;
    can_manage_assessments: boolean;
    can_manage_results: boolean;
    can_manage_activities: boolean;
    can_view_doctor_dashboard: boolean;
  } | null;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<{ [key: number]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminPermissionsApi.getAll();
      console.log("Loaded admins data:", data);
      setAdmins(data);
    } catch (error: any) {
      console.error("Error loading admins:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load admins. Please try again.",
        variant: "destructive",
      });
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (adminId: number, permission: string, value: boolean) => {
    setAdmins((prev) =>
      prev.map((admin) => {
        if (admin.id === adminId) {
          return {
            ...admin,
            permissions: admin.permissions
              ? { ...admin.permissions, [permission]: value }
              : {
                  can_manage_users: false,
                  can_manage_subjects: false,
                  can_manage_materials: false,
                  can_manage_gallery: false,
                  can_manage_timetable: false,
                  can_manage_reports: false,
                  can_manage_chat: false,
                  can_manage_assessments: false,
                  can_manage_results: false,
                  can_manage_activities: false,
                  can_view_doctor_dashboard: false,
                  [permission]: value,
                },
          };
        }
        return admin;
      })
    );
  };

  const handleSave = async (adminId: number) => {
    const admin = admins.find((a) => a.id === adminId);
    if (!admin || !admin.permissions) {
      toast({
        title: "Error",
        description: "No permissions to save.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, [adminId]: true }));
      await adminPermissionsApi.update(adminId, admin.permissions);
      toast({
        title: "Success",
        description: `Permissions updated for ${admin.name}`,
      });
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving((prev) => ({ ...prev, [adminId]: false }));
    }
  };

  const permissionLabels = [
    { key: "can_manage_users", label: "Manage Users", icon: Users },
    { key: "can_manage_subjects", label: "Manage Subjects", icon: BookOpen },
    { key: "can_manage_materials", label: "Manage Materials", icon: Upload },
    { key: "can_manage_gallery", label: "Manage Gallery", icon: Image },
    { key: "can_manage_timetable", label: "Manage Timetable", icon: Calendar },
    { key: "can_manage_reports", label: "Manage Reports", icon: FileText },
    { key: "can_manage_chat", label: "Manage Chat Board", icon: MessageSquare },
    { key: "can_manage_assessments", label: "Manage Assessments", icon: ClipboardCheck },
    { key: "can_manage_results", label: "Manage Results", icon: FileText },
    { key: "can_manage_activities", label: "Manage Activities", icon: Activity },
    { key: "can_view_doctor_dashboard", label: "View Doctor Dashboard", icon: Stethoscope },
  ];

  // Filter admins based on search query
  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) {
      return admins;
    }

    const query = searchQuery.toLowerCase().trim();
    return admins.filter((admin) => {
      const nameMatch = admin.name.toLowerCase().includes(query);
      const emailMatch = admin.email.toLowerCase().includes(query);
      const userIdMatch = admin.user_id?.toLowerCase().includes(query);
      const courseMatch = admin.course_name?.toLowerCase().includes(query);
      
      return nameMatch || emailMatch || userIdMatch || courseMatch;
    });
  }, [admins, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading admins...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Permissions Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage access permissions for regular admins. Toggle permissions to grant or revoke access to specific features.
        </p>
      </div>

      {/* Search Bar */}
      {admins.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search admins by name, email, user ID, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing {filteredAdmins.length} of {admins.length} admin(s)
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {admins.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-medium">No admins found.</p>
            <p className="text-muted-foreground text-sm mt-2">
              Create an admin user first to manage their permissions.
            </p>
          </CardContent>
        </Card>
      ) : filteredAdmins.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-medium">No admins found matching your search.</p>
            <p className="text-muted-foreground text-sm mt-2">
              Try adjusting your search query.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredAdmins.map((admin) => (
            <Card key={admin.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{admin.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {admin.email} • {admin.user_id}
                      {admin.course_name && ` • ${admin.course_name}`}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleSave(admin.id)}
                    disabled={saving[admin.id]}
                    className="gap-2"
                  >
                    {saving[admin.id] ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissionLabels.map(({ key, label, icon: Icon }) => {
                    const permission = admin.permissions?.[key as keyof typeof admin.permissions] ?? false;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                          <Label htmlFor={`${admin.id}-${key}`} className="cursor-pointer">
                            {label}
                          </Label>
                        </div>
                        <Switch
                          id={`${admin.id}-${key}`}
                          checked={permission}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(admin.id, key, checked)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;

