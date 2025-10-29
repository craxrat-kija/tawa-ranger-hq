import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Gallery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [images, setImages] = useState([
    { id: 1, url: "https://images.unsplash.com/photo-1622666522125-c90c8d64b2bb?w=400", title: "Parade Training", date: "2024-01-15" },
    { id: 2, url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400", title: "Field Exercise", date: "2024-01-20" },
    { id: 3, url: "https://images.unsplash.com/photo-1509021436665-8f0371143a69?w=400", title: "Weapons Training", date: "2024-02-01" },
    { id: 4, url: "https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=400", title: "Team Building", date: "2024-02-10" },
    { id: 5, url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400", title: "Graduation Ceremony", date: "2024-02-15" },
    { id: 6, url: "https://images.unsplash.com/photo-1587876931567-564ce588bfbd?w=400", title: "Map Reading Session", date: "2024-02-20" },
  ]);

  const handleUpload = () => {
    toast({
      title: "Upload Photo",
      description: "Photo upload functionality will open here",
    });
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
          <Button onClick={handleUpload} className="bg-gradient-military">
            <Upload className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
        )}
      </div>

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
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default Gallery;
