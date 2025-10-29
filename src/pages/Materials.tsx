import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileText, Video, Image, File, Search, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Materials = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const { toast } = useToast();

  const [materials, setMaterials] = useState([
    { id: 1, name: "Field_Maps.pdf", type: "pdf", subject: "Maps", size: "1.8 MB", date: "2025-01-15", url: "/materials/Field_Maps.pdf" },
    { id: 2, name: "Introduction_GIS.pdf", type: "pdf", subject: "Maps", size: "2.1 MB", date: "2025-01-16", url: "/materials/Introduction_GIS.pdf" },
    { id: 3, name: "Introduction_GPS.pdf", type: "pdf", subject: "Maps", size: "1.5 MB", date: "2025-01-17", url: "/materials/Introduction_GPS.pdf" },
    { id: 4, name: "MAP_OF_FORT_IKOMA_AREA.pdf", type: "pdf", subject: "Maps", size: "3.2 MB", date: "2025-01-18", url: "/materials/MAP_OF_FORT_IKOMA_AREA.pdf" },
    { id: 5, name: "Patrol_Maps.pdf", type: "pdf", subject: "Patrol", size: "2.8 MB", date: "2025-01-19", url: "/materials/Patrol_Maps.pdf" },
    { id: 6, name: "Weapon_Training.ppt", type: "presentation", subject: "Weaponry", size: "8.5 MB", date: "2025-01-20", url: "/materials/Weapon_Training.ppt" },
    { id: 7, name: "Weaponry_Training_Bilingual.pptx", type: "presentation", subject: "Weaponry", size: "12.3 MB", date: "2025-01-21", url: "/materials/Weaponry_Training_Bilingual.pptx" },
  ]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
      case "document":
        return <FileText className="w-8 h-8 text-red-500" />;
      case "video":
        return <Video className="w-8 h-8 text-blue-500" />;
      case "image":
        return <Image className="w-8 h-8 text-green-500" />;
      case "presentation":
        return <FileText className="w-8 h-8 text-orange-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const handleDownload = (material: any) => {
    const link = document.createElement('a');
    link.href = material.url;
    link.download = material.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading ${material.name}`,
    });
  };

  const handleDelete = (materialId: number) => {
    setMaterials(materials.filter(m => m.id !== materialId));
    toast({
      title: "Material Deleted",
      description: "Material has been removed successfully",
    });
  };

  const filteredMaterials = materials.filter(material => {
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
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleDownload(material)} 
                  className="flex-1"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {user?.role === "admin" && (
                  <Button 
                    onClick={() => handleDelete(material.id)} 
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Materials;
