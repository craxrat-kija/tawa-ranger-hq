import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import trainingGroup1 from "@/assets/gallery/training-group-1.jpg";
import traineePortrait from "@/assets/gallery/trainee-portrait.jpg";
import trainingGroup2 from "@/assets/gallery/training-group-2.jpg";
import fieldTraining from "@/assets/gallery/field-training.jpg";
import instructorSession from "@/assets/gallery/instructor-session.jpg";
import patrolTraining1 from "@/assets/gallery/patrol-training-1.jpg";
import armedTraining1 from "@/assets/gallery/armed-training-1.jpg";
import armedTraining2 from "@/assets/gallery/armed-training-2.jpg";
import patrolTraining2 from "@/assets/gallery/patrol-training-2.jpg";

interface ImageItem {
  id: number;
  url: string;
  title: string;
  date: string;
  file?: File;
}

const Gallery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState({ title: "", file: null as File | null });

  const [images, setImages] = useState<ImageItem[]>([
    { id: 1, url: trainingGroup1, title: "Training Group Formation", date: "2024-10-26" },
    { id: 2, url: traineePortrait, title: "Trainee Portrait", date: "2024-10-26" },
    { id: 3, url: trainingGroup2, title: "Group Training Session", date: "2024-10-26" },
    { id: 4, url: fieldTraining, title: "Field Training Exercise", date: "2024-10-26" },
    { id: 5, url: instructorSession, title: "Instructor Session", date: "2024-10-26" },
    { id: 6, url: patrolTraining1, title: "Patrol Training", date: "2024-10-26" },
    { id: 7, url: armedTraining1, title: "Armed Combat Training", date: "2024-10-26" },
    { id: 8, url: armedTraining2, title: "Tactical Positioning", date: "2024-10-26" },
    { id: 9, url: patrolTraining2, title: "Advanced Patrol Tactics", date: "2024-10-26" },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setUploadData({ ...uploadData, file });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select an image and enter a title",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a preview URL from the file
    const previewUrl = preview || URL.createObjectURL(uploadData.file);
    
    const newImage: ImageItem = {
      id: images.length + 1,
      url: previewUrl,
      title: uploadData.title,
      date: new Date().toISOString().split('T')[0],
      file: uploadData.file,
    };

    setImages([...images, newImage]);
    setShowUploadDialog(false);
    setUploadData({ title: "", file: null });
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    toast({
      title: "Photo Uploaded",
      description: `${uploadData.title} has been added to the gallery`,
    });
    
    setUploading(false);
  };

  const handleDelete = (imageId: number) => {
    setImages(images.filter(img => img.id !== imageId));
    toast({
      title: "Image Deleted",
      description: "Image has been removed from gallery",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Photo Gallery</h1>
          <p className="text-muted-foreground">Training moments and achievements</p>
        </div>
        {user?.role === "admin" && (
          <Button 
            onClick={() => setShowUploadDialog(true)} 
            className="bg-gradient-military"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Photo</DialogTitle>
            <DialogDescription>
              Add a new photo to the gallery. Select an image and provide a title.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Select Image</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {preview && (
                <div className="mt-4">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="max-w-full h-48 object-contain rounded-lg border"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image-title">Photo Title</Label>
              <Input
                id="image-title"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="Enter photo title"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUploadDialog(false);
                  setUploadData({ title: "", file: null });
                  setPreview(null);
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
                {uploading ? "Uploading..." : "Upload Photo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card 
            key={image.id} 
            className="overflow-hidden hover:shadow-xl transition-all group relative"
          >
            <div 
              className="relative aspect-square overflow-hidden cursor-pointer"
              onClick={() => setSelectedImage(image.url)}
            >
              <img 
                src={image.url} 
                alt={image.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold">{image.title}</h3>
                  <p className="text-xs text-white/80">{image.date}</p>
                </div>
              </div>
            </div>
            {user?.role === "admin" && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Gallery;
