import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Timetable = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const mockSchedule = [
    { id: 1, day: "Monday", time: "08:00 - 10:00", subject: "Parade Training", instructor: "CPT. Mwangi", location: "Main Ground" },
    { id: 2, day: "Monday", time: "10:30 - 12:30", subject: "Weaponry", instructor: "SGT. Kimani", location: "Range A" },
    { id: 3, day: "Tuesday", time: "08:00 - 10:00", subject: "Field Craft", instructor: "LT. Nyerere", location: "Training Field" },
    { id: 4, day: "Tuesday", time: "10:30 - 12:30", subject: "First Aid", instructor: "CPL. Hassan", location: "Medical Wing" },
    { id: 5, day: "Wednesday", time: "08:00 - 10:00", subject: "Map Reading", instructor: "CPT. Mwangi", location: "Classroom B" },
    { id: 6, day: "Thursday", time: "08:00 - 10:00", subject: "Protocol", instructor: "MAJ. Kamau", location: "Main Hall" },
    { id: 7, day: "Friday", time: "08:00 - 10:00", subject: "Physical Training", instructor: "SGT. Juma", location: "Gym" },
  ];

  const handleCreateTimetable = () => {
    toast({
      title: "Create Timetable",
      description: "Timetable creation form will open here",
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
          <Button onClick={handleCreateTimetable} className="bg-gradient-military">
            <Plus className="w-4 h-4 mr-2" />
            Create Schedule
          </Button>
        )}
      </div>

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
                    className="p-3 bg-accent/20 rounded-lg border border-accent/30 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-xs font-semibold text-primary">{item.time}</span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{item.subject}</h4>
                    <p className="text-xs text-muted-foreground">{item.instructor}</p>
                    <p className="text-xs text-muted-foreground">{item.location}</p>
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
