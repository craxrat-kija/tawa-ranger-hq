import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { galleryApi } from "@/lib/api";

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
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState({ title: "", file: null as File | null });
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setIsLoading(true);
      const data = await galleryApi.getAll();
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      console.log('Gallery data:', data);
      setImages(data.map((item: any) => {
        // Use image_url from backend if available, otherwise construct it
        let imageUrl = item.image_url || `${API_BASE_URL}/storage/${item.image_path}`;
        
        // Fix URL if backend returns URL without port (e.g., http://localhost/storage -> http://localhost:8000/storage)
        if (imageUrl.includes('http://localhost/storage') && !imageUrl.includes(':8000')) {
          imageUrl = imageUrl.replace('http://localhost/storage', `${API_BASE_URL}/storage`);
        }
        if (imageUrl.includes('http://127.0.0.1/storage') && !imageUrl.includes(':8000')) {
          imageUrl = imageUrl.replace('http://127.0.0.1/storage', `${API_BASE_URL}/storage`);
        }
        
        console.log('Image URL:', imageUrl, 'Image path:', item.image_path);
        return {
          id: item.id,
          url: imageUrl,
          title: item.title,
          date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        };
      }));
    } catch (error) {
      console.error('Error loading gallery:', error);
      toast({
        title: "Error",
        description: "Failed to load gallery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      if (file.type.startsWith('image/')) {
        setUploadData({ ...uploadData, file });
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('FileReader onloadend - result length:', reader.result?.toString().length);
          if (reader.result) {
            setPreview(reader.result as string);
            console.log('Preview set successfully');
          } else {
            console.error('FileReader result is null');
            toast({
              title: "Error",
              description: "Failed to read image file",
              variant: "destructive",
            });
          }
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          toast({
            title: "Error",
            description: "Failed to read image file",
            variant: "destructive",
          });
        };
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentLoaded = Math.round((event.loaded / event.total) * 100);
            console.log('FileReader progress:', percentLoaded + '%');
          }
        };
        try {
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Error reading file:', error);
          toast({
            title: "Error",
            description: "Failed to read image file",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invalid File",
          description: "Please select an image file (JPG, PNG, GIF, etc.)",
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } else {
      console.log('No file selected');
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

    // Check file size (5MB max for images)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (uploadData.file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      await galleryApi.create(uploadData.file, uploadData.title);
      
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
      
      loadGallery();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }
    try {
      await galleryApi.delete(imageId.toString());
      toast({
        title: "Image Deleted",
        description: "Image has been removed from gallery",
      });
      loadGallery();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }
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
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open);
        if (!open) {
          setUploadData({ title: "", file: null });
          setPreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Photo</DialogTitle>
            <DialogDescription>
              Add a new photo to the gallery. Select an image and provide a title.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Select Image *</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="cursor-pointer"
                required
              />
              {preview ? (
                <div className="mt-4">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="max-w-full h-48 object-contain rounded-lg border bg-muted"
                    onLoad={() => {
                      console.log('Preview image loaded successfully');
                    }}
                    onError={(e) => {
                      console.error('Preview image error:', e);
                      setPreview(null);
                      toast({
                        title: "Preview Error",
                        description: "Could not display image preview",
                        variant: "destructive",
                      });
                    }}
                  />
                </div>
              ) : uploadData.file ? (
                <div className="mt-4 p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    Selected: <span className="font-medium">{uploadData.file.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Size: {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB | Type: {uploadData.file.type}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Loading preview...
                  </p>
                </div>
              ) : null}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image-title">Photo Title *</Label>
              <Input
                id="image-title"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="Enter photo title"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowUploadDialog(false);
                  setUploadData({ title: "", file: null });
                  setPreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                className="bg-gradient-military"
                disabled={uploading || !uploadData.file || !uploadData.title.trim()}
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading gallery...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No photos found. Upload your first photo to get started.
            </div>
          ) : (
            images.map((image) => (
          <Card 
            key={image.id} 
            className="overflow-hidden hover:shadow-xl transition-all group relative"
          >
            <div 
              className="relative aspect-square overflow-hidden cursor-pointer bg-muted"
              onClick={() => setSelectedImage(image.url)}
            >
              <img 
                src={image.url} 
                alt={image.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  console.error('Image load error:', image.url);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // Show placeholder
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                        <div class="text-center p-4">
                          <p class="text-sm font-medium">Image not found</p>
                          <p class="text-xs mt-1">${image.title}</p>
                        </div>
                      </div>
                    `;
                  }
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', image.url);
                }}
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
            ))
          )}
        </div>
      )}

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
