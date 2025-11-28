import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { activityLogApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  UserPlus,
  FileHeart,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  User,
  Stethoscope,
} from "lucide-react";
import { format } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'patient_registration' | 'medical_report' | 'attendance_record';
  title: string;
  description: string;
  doctor_name: string;
  patient_name?: string;
  patient_email?: string;
  diagnosis?: string;
  status?: string;
  course_name: string;
  timestamp: string;
  action_url?: string;
}

export default function DoctorActivities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total: 0,
    last_page: 1,
  });
  const { toast } = useToast();

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const response = await activityLogApi.getDoctorActivities({
        type: typeFilter !== "all" ? typeFilter : undefined,
        page: currentPage,
        per_page: 50,
      });
      setActivities(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error: any) {
      console.error("Error loading activities:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load doctor activities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [typeFilter, currentPage]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'patient_registration':
        return <UserPlus className="w-5 h-5" />;
      case 'medical_report':
        return <FileHeart className="w-5 h-5" />;
      case 'attendance_record':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'patient_registration':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'medical_report':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'attendance_record':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'patient_registration':
        return 'Patient Registration';
      case 'medical_report':
        return 'Medical Report';
      case 'attendance_record':
        return 'Attendance Record';
      default:
        return type;
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        activity.patient_name?.toLowerCase().includes(searchLower) ||
        activity.doctor_name?.toLowerCase().includes(searchLower) ||
        activity.description?.toLowerCase().includes(searchLower) ||
        activity.course_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary mb-2">Doctor Activities</h2>
        <p className="text-muted-foreground">
          View all activities performed by doctors in the system
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by patient, doctor, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="patient_registration">Patient Registration</SelectItem>
                <SelectItem value="medical_report">Medical Report</SelectItem>
                <SelectItem value="attendance_record">Attendance Record</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadActivities}
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {filteredActivities.length} of {pagination.total} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No activities found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <Card
                  key={activity.id}
                  className={`border-l-4 ${getActivityColor(activity.type)}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{activity.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getActivityTypeLabel(activity.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {activity.description}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Doctor:</span>
                              <span className="font-medium">{activity.doctor_name}</span>
                            </div>
                            {activity.patient_name && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Patient:</span>
                                <span className="font-medium">{activity.patient_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Course:</span>
                              <span className="font-medium">{activity.course_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Time:</span>
                              <span className="font-medium">
                                {format(new Date(activity.timestamp), "PPp")}
                              </span>
                            </div>
                          </div>
                          {activity.diagnosis && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                              <span className="font-medium">Diagnosis: </span>
                              {activity.diagnosis}
                            </div>
                          )}
                          {activity.status && (
                            <div className="mt-2">
                              <Badge variant="secondary">{activity.status}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {pagination.current_page} of {pagination.last_page}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                  disabled={currentPage === pagination.last_page || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

