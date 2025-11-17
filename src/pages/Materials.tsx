import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText, Video, Image, File, Search, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface MaterialItem {
  id: number;
  name: string;
  type: string;
  subject: string;
  size: string;
  date: string;
  url: string;
  file?: File;
}

const Materials = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadData, setUploadData] = useState({
    name: "",
    subject: "Maps",
    file: null as File | null,
  });
  const { toast } = useToast();

  const [materials, setMaterials] = useState<MaterialItem[]>([
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

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['ppt', 'pptx', 'key'].includes(ext || '')) return 'presentation';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) return 'video';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'image';
    return 'document';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadData({ 
        ...uploadData, 
        file,
        name: file.name,
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.subject) {
      toast({
        title: "Missing Information",
        description: "Please select a file and choose a subject",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const fileType = getFileType(uploadData.file.name);
    const fileSize = formatFileSize(uploadData.file.size);
    
    const newMaterial: MaterialItem = {
      id: materials.length + 1,
      name: uploadData.file.name,
      type: fileType,
      subject: uploadData.subject,
      size: fileSize,
      date: new Date().toISOString().split('T')[0],
      url: URL.createObjectURL(uploadData.file),
      file: uploadData.file,
    };

    setMaterials([...materials, newMaterial]);
    setShowUploadDialog(false);
    setUploadData({ name: "", subject: "Maps", file: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    toast({
      title: "Material Uploaded",
      description: `${uploadData.file.name} has been uploaded successfully`,
    });
    
    setUploading(false);
  };

  const handleDownload = (material: MaterialItem) => {
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
        {(user?.role === "admin" || user?.role === "instructor") && (
          <Button 
            onClick={() => setShowUploadDialog(true)} 
            className="bg-gradient-military"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Material
          </Button>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Material</DialogTitle>
            <DialogDescription>
              Upload training materials, documents, or resources for the team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material-file">Select File *</Label>
              <Input
                id="material-file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {uploadData.file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadData.file.name} ({formatFileSize(uploadData.file.size)})
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="material-subject">Subject *</Label>
              <Select 
                value={uploadData.subject} 
                onValueChange={(value) => setUploadData({ ...uploadData, subject: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maps">Maps</SelectItem>
                  <SelectItem value="Parade">Parade</SelectItem>
                  <SelectItem value="Weaponry">Weaponry</SelectItem>
                  <SelectItem value="Field Craft">Field Craft</SelectItem>
                  <SelectItem value="First Aid">First Aid</SelectItem>
                  <SelectItem value="Patrol">Patrol</SelectItem>
                  <SelectItem value="Protocol">Protocol</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUploadDialog(false);
                  setUploadData({ name: "", subject: "Maps", file: null });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                className="bg-gradient-military"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Material"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <SelectItem value="Patrol">Patrol</SelectItem>
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
                {(user?.role === "admin" || user?.role === "instructor") && (
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
