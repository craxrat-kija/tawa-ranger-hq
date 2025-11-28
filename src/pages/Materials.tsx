import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText, Video, Image, File, Search, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { materialsApi } from "@/lib/api";

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

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.course_id) {
      loadMaterials();
    }
  }, [selectedSubject, searchQuery, user?.course_id]);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const data = await materialsApi.getAll(
        selectedSubject !== "all" ? selectedSubject : undefined,
        undefined,
        searchQuery || undefined,
        user?.course_id || undefined
      );
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      setMaterials(data.map((m: any) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        subject: m.subject,
        size: m.file_size,
        date: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        url: `${API_BASE_URL}/storage/${m.file_path}`,
      })));
    } catch (error) {
      console.error('Error loading materials:', error);
      toast({
        title: "Error",
        description: "Failed to load materials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (uploadData.file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Ensure name is not empty - trim whitespace and fallback to filename
    const materialName = (uploadData.name && uploadData.name.trim()) || uploadData.file.name;
    
    // Validate name length (max 255 characters as per backend)
    if (materialName.length > 255) {
      toast({
        title: "Name Too Long",
        description: "Material name must be 255 characters or less",
        variant: "destructive",
      });
      return;
    }

    // Validate subject is not empty
    if (!uploadData.subject || !uploadData.subject.trim()) {
      toast({
        title: "Invalid Subject",
        description: "Please select a valid subject",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      if (!user?.course_id) {
        throw new Error("Course ID is missing. Please ensure you are assigned to a course.");
      }
      
      await materialsApi.create(
        uploadData.file,
        materialName,
        uploadData.subject,
        user.course_id
      );
      
      setShowUploadDialog(false);
      setUploadData({ name: "", subject: "Maps", file: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      toast({
        title: "Material Uploaded",
        description: `${uploadData.name || uploadData.file.name} has been uploaded successfully`,
      });
      
      loadMaterials();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload material. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (material: MaterialItem) => {
    try {
      await materialsApi.download(material.id.toString());
      toast({
        title: "Download Started",
        description: `Downloading ${material.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download material. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (materialId: number) => {
    if (!confirm("Are you sure you want to delete this material?")) {
      return;
    }
    try {
      await materialsApi.delete(materialId.toString());
      toast({
        title: "Material Deleted",
        description: "Material has been removed successfully",
      });
      loadMaterials();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete material. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredMaterials = materials;

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
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open);
        if (!open) {
          setUploadData({ name: "", subject: "Maps", file: null });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      }}>
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
              <Label htmlFor="material-name">Material Name *</Label>
              <Input
                id="material-name"
                value={uploadData.name}
                onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                placeholder="Enter material name (defaults to filename)"
              />
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
      {isLoading ? (
        <div className="text-center py-8">Loading materials...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No materials found. Upload your first material to get started.
            </div>
          ) : (
            filteredMaterials.map((material) => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Materials;
