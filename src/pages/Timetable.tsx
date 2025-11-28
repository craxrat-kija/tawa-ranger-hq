import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Plus, Clock, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { timetableApi } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  id: number;
  date: string;
  time: string;
  subject: string;
  instructor: string;
  location: string;
}

const Timetable = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    subject: "",
    instructor: "",
    location: "",
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      setIsLoading(true);
      const data = await timetableApi.getAll();
      setSchedule(data.map((item: any) => ({
        id: item.id,
        date: item.date,
        time: item.time,
        subject: item.subject,
        instructor: item.instructor,
        location: item.location,
      })));
    } catch (error) {
      console.error('Error loading timetable:', error);
      toast({
        title: "Error",
        description: "Failed to load timetable. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTimetable = async () => {
    if (!formData.date || !formData.time || !formData.subject || !formData.instructor || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        await timetableApi.update(editingItem.id.toString(), formData);
        toast({
          title: "Schedule Updated",
          description: "Timetable entry has been updated successfully",
        });
      } else {
        await timetableApi.create(formData);
        toast({
          title: "Schedule Created",
          description: "New timetable entry has been added successfully",
        });
      }

      setShowCreateDialog(false);
      setEditingItem(null);
      setSelectedDate(undefined);
      setFormData({ date: "", time: "", subject: "", instructor: "", location: "" });
      loadTimetable();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save timetable entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setSelectedDate(new Date(item.date));
    setFormData({
      date: item.date,
      time: item.time,
      subject: item.subject,
      instructor: item.instructor,
      location: item.location,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this timetable entry?")) {
      return;
    }
    try {
      await timetableApi.delete(id.toString());
      toast({
        title: "Schedule Deleted",
        description: "Timetable entry has been removed",
      });
      loadTimetable();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete timetable entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get scheduled dates for calendar highlighting
  const scheduledDates = schedule.map(item => new Date(item.date));

  // Get schedule items for selected date
  const getScheduleForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedule.filter(item => item.date === dateStr);
  };

  // Get all unique dates with schedules
  const datesWithSchedules = Array.from(new Set(schedule.map(item => item.date)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Training Timetable</h1>
          <p className="text-muted-foreground">Training schedule calendar</p>
        </div>
        {(user?.role === "admin" || user?.role === "super_admin") && (
          <Button 
            onClick={() => {
              setEditingItem(null);
              setSelectedDate(undefined);
              setFormData({ date: "", time: "", subject: "", instructor: "", location: "" });
              setShowCreateDialog(true);
            }} 
            className="bg-gradient-military"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Schedule
          </Button>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Schedule" : "Create New Schedule"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update timetable entry" : "Add a new entry to the training timetable"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) {
                          setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Enter subject name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor *</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="Enter instructor name"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter location"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingItem(null);
                  setSelectedDate(undefined);
                  setFormData({ date: "", time: "", subject: "", instructor: "", location: "" });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTimetable} className="bg-gradient-military">
                {editingItem ? "Update Schedule" : "Create Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select a date to view scheduled classes</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={viewDate}
              onSelect={(date) => date && setViewDate(date)}
              modifiers={{
                scheduled: scheduledDates,
              }}
              modifiersClassNames={{
                scheduled: "bg-primary/20 text-primary font-semibold",
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Schedule for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule for {format(viewDate, "PPP")}</CardTitle>
            <CardDescription>
              {getScheduleForDate(viewDate).length} class{getScheduleForDate(viewDate).length !== 1 ? 'es' : ''} scheduled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : getScheduleForDate(viewDate).length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">No classes scheduled for this date</div>
            ) : (
              getScheduleForDate(viewDate)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-accent/20 rounded-lg border border-accent/30 hover:shadow-md transition-shadow relative group"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-xs font-semibold text-primary">{item.time}</span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{item.subject}</h4>
                    <p className="text-xs text-muted-foreground">{item.instructor}</p>
                    <p className="text-xs text-muted-foreground">{item.location}</p>
                    
                    {(user?.role === "admin" || user?.role === "super_admin") && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Schedule List */}
      {schedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>All scheduled training sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule
                .filter(item => new Date(item.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                .sort((a, b) => {
                  const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
                  if (dateCompare !== 0) return dateCompare;
                  return a.time.localeCompare(b.time);
                })
                .slice(0, 10)
                .map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 bg-accent/10 rounded-lg border border-accent/20 hover:shadow-md transition-shadow relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-sm font-semibold text-primary">
                            {format(new Date(item.date), "EEEE, MMMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </div>
                        </div>
                        <h4 className="font-semibold text-base mb-1">{item.subject}</h4>
                        <p className="text-sm text-muted-foreground">{item.instructor}</p>
                        <p className="text-sm text-muted-foreground">{item.location}</p>
                      </div>
                      {(user?.role === "admin" || user?.role === "super_admin") && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Timetable;
