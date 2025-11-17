import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Clock, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ScheduleItem {
  id: number;
  day: string;
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
  const [formData, setFormData] = useState({
    day: "",
    time: "",
    subject: "",
    instructor: "",
    location: "",
  });

  const [mockSchedule, setMockSchedule] = useState<ScheduleItem[]>([
    { id: 1, day: "Monday", time: "08:00 - 10:00", subject: "Parade Training", instructor: "CPT. Mwangi", location: "Main Ground" },
    { id: 2, day: "Monday", time: "10:30 - 12:30", subject: "Weaponry", instructor: "SGT. Kimani", location: "Range A" },
    { id: 3, day: "Tuesday", time: "08:00 - 10:00", subject: "Field Craft", instructor: "LT. Nyerere", location: "Training Field" },
    { id: 4, day: "Tuesday", time: "10:30 - 12:30", subject: "First Aid", instructor: "CPL. Hassan", location: "Medical Wing" },
    { id: 5, day: "Wednesday", time: "08:00 - 10:00", subject: "Map Reading", instructor: "CPT. Mwangi", location: "Classroom B" },
    { id: 6, day: "Thursday", time: "08:00 - 10:00", subject: "Protocol", instructor: "MAJ. Kamau", location: "Main Hall" },
    { id: 7, day: "Friday", time: "08:00 - 10:00", subject: "Physical Training", instructor: "SGT. Juma", location: "Gym" },
  ]);

  const handleCreateTimetable = () => {
    if (!formData.day || !formData.time || !formData.subject || !formData.instructor || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (editingItem) {
      // Update existing item
      setMockSchedule(mockSchedule.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...formData } 
          : item
      ));
      toast({
        title: "Schedule Updated",
        description: "Timetable entry has been updated successfully",
      });
    } else {
      // Create new item
      const newItem: ScheduleItem = {
        id: mockSchedule.length + 1,
        ...formData,
      };
      setMockSchedule([...mockSchedule, newItem]);
      toast({
        title: "Schedule Created",
        description: "New timetable entry has been added successfully",
      });
    }

    setShowCreateDialog(false);
    setEditingItem(null);
    setFormData({ day: "", time: "", subject: "", instructor: "", location: "" });
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormData({
      day: item.day,
      time: item.time,
      subject: item.subject,
      instructor: item.instructor,
      location: item.location,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (id: number) => {
    setMockSchedule(mockSchedule.filter(item => item.id !== id));
    toast({
      title: "Schedule Deleted",
      description: "Timetable entry has been removed",
    });
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Training Timetable</h1>
          <p className="text-muted-foreground">Weekly training schedule</p>
        </div>
        {user?.role === "admin" && (
          <Button 
            onClick={() => {
              setEditingItem(null);
              setFormData({ day: "", time: "", subject: "", instructor: "", location: "" });
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
                <Label htmlFor="day">Day *</Label>
                <Select value={formData.day} onValueChange={(value) => setFormData({ ...formData, day: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="08:00 - 10:00"
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
                  setFormData({ day: "", time: "", subject: "", instructor: "", location: "" });
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

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {days.map((day) => (
          <Card key={day} className="border-2">
            <CardHeader className="bg-primary/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {day}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {mockSchedule
                .filter((item) => item.day === day)
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
                    
                    {user?.role === "admin" && (
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
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Timetable;
