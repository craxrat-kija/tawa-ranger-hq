import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Award } from "lucide-react";

const Instructors = () => {
  const mockInstructors = [
    {
      id: 1,
      name: "CPT. John Mwangi",
      email: "j.mwangi@tawa.go.tz",
      phone: "+255 712 345 678",
      specialization: "Parade & Protocol",
      rank: "Captain",
      experience: "12 years",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John"
    },
    {
      id: 2,
      name: "SGT. Sarah Kimani",
      email: "s.kimani@tawa.go.tz",
      phone: "+255 713 456 789",
      specialization: "Weaponry",
      rank: "Sergeant",
      experience: "8 years",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
      id: 3,
      name: "LT. Ahmed Nyerere",
      email: "a.nyerere@tawa.go.tz",
      phone: "+255 714 567 890",
      specialization: "Field Craft",
      rank: "Lieutenant",
      experience: "10 years",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed"
    },
    {
      id: 4,
      name: "CPL. Mary Hassan",
      email: "m.hassan@tawa.go.tz",
      phone: "+255 715 678 901",
      specialization: "First Aid",
      rank: "Corporal",
      experience: "6 years",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mary"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Instructor Directory</h1>
        <p className="text-muted-foreground">Training staff and their specializations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockInstructors.map((instructor) => (
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
        ))}
      </div>
    </div>
  );
};

export default Instructors;
