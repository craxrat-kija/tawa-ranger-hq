import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileText, Video, Image, File, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Materials = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const { toast } = useToast();

  const mockMaterials = [
    { id: 1, name: "Parade Training Manual.pdf", type: "pdf", subject: "Parade", size: "2.4 MB", date: "2024-01-15" },
    { id: 2, name: "Weaponry Safety Video.mp4", type: "video", subject: "Weaponry", size: "45 MB", date: "2024-01-20" },
    { id: 3, name: "Field Craft Techniques.docx", type: "document", subject: "Field Craft", size: "1.2 MB", date: "2024-02-01" },
    { id: 4, name: "First Aid Guidelines.pdf", type: "pdf", subject: "First Aid", size: "3.1 MB", date: "2024-02-10" },
    { id: 5, name: "Map Reading Tutorial.pdf", type: "pdf", subject: "Maps", size: "5.5 MB", date: "2024-02-15" },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
      case "document":
        return <FileText className="w-8 h-8 text-red-500" />;
      case "video":
        return <Video className="w-8 h-8 text-blue-500" />;
      case "image":
        return <Image className="w-8 h-8 text-green-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const handleDownload = (material: any) => {
    toast({
      title: "Download Started",
      description: `Downloading ${material.name}`,
    });
  };

  const filteredMaterials = mockMaterials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "all" || material.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Training Materials</h1>
        <Button className="bg-gradient-military">
          <Upload className="w-4 h-4 mr-2" />
          Upload Material
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            <SelectItem value="Parade">Parade</SelectItem>
            <SelectItem value="Weaponry">Weaponry</SelectItem>
            <SelectItem value="Field Craft">Field Craft</SelectItem>
            <SelectItem value="First Aid">First Aid</SelectItem>
            <SelectItem value="Maps">Maps</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((material) => (
          <Card key={material.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(material.type)}
                  <div>
                    <CardTitle className="text-sm">{material.name}</CardTitle>
                    <CardDescription className="text-xs">{material.subject}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                <span>{material.size}</span>
                <span>{material.date}</span>
              </div>
              <Button 
                onClick={() => handleDownload(material)} 
                className="w-full"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Materials;
