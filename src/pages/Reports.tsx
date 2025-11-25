import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, TrendingUp, Users, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const { toast } = useToast();

  const reportTypes = [
    { 
      id: 1, 
      title: "Performance Report", 
      description: "Trainee performance analytics and grades",
      icon: TrendingUp,
      color: "text-blue-500"
    },
    { 
      id: 2, 
      title: "Attendance Report", 
      description: "Training attendance records",
      icon: Users,
      color: "text-green-500"
    },
    { 
      id: 3, 
      title: "Course Completion", 
      description: "Course completion statistics",
      icon: Award,
      color: "text-yellow-500"
    },
    { 
      id: 4, 
      title: "Instructor Report", 
      description: "Instructor performance and feedback",
      icon: FileText,
      color: "text-purple-500"
    },
  ];

  const handleGenerateReport = (reportTitle: string) => {
    toast({
      title: "Generating Report",
      description: `${reportTitle} is being generated...`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate and download training reports</p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 bg-accent/20 rounded-lg ${report.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleGenerateReport(report.title)}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[].length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No reports generated yet. Generated reports will appear here.
              </p>
            ) : (
              [].map((report, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.date} • {report.size}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
