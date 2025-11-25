import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usersApi } from "@/lib/api";
import { Mail, Phone, Award } from "lucide-react";

interface Instructor {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialization?: string;
  rank?: string;
  experience?: string;
  avatar?: string;
  department?: string;
}

const Instructors = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getAll('instructor');
      setInstructors(data.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "",
        department: u.department || "",
        specialization: u.department || "Training",
        rank: u.name.match(/(CPT|SGT|LT|CPL|Captain|Sergeant|Lieutenant|Corporal)\.?/i)?.[0] || "Instructor",
        experience: "N/A",
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
      })));
    } catch (error) {
      console.error('Error loading instructors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Instructor Directory</h1>
        <p className="text-muted-foreground">Training staff and their specializations</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading instructors...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {instructors.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              No instructors found
            </div>
          ) : (
            instructors.map((instructor) => (
          <Card key={instructor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={instructor.avatar} />
                  <AvatarFallback>{instructor.name.split(' ')[1][0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {instructor.name}
                    <Badge variant="secondary">{instructor.rank}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Award className="w-3 h-3" />
                    {instructor.specialization}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{instructor.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{instructor.phone}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Experience:</span> {instructor.experience}
                </p>
              </div>
            </CardContent>
          </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Instructors;
