import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { courseMetadataApi } from "@/lib/api";
import { Plus, Edit, Trash2, BookOpen, MapPin, Tag } from "lucide-react";

interface CourseMetadata {
  id: number;
  type: 'name' | 'course_type' | 'location' | 'course_code';
  value: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

const CourseMetadata = () => {
  const { toast } = useToast();
  const [metadata, setMetadata] = useState<CourseMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CourseMetadata | null>(null);
  const [deletingItem, setDeletingItem] = useState<CourseMetadata | null>(null);
  const [formData, setFormData] = useState({
    type: 'name' as 'name' | 'course_type' | 'location' | 'course_code',
    value: '',
    description: '',
  });

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      setLoading(true);
      const data = await courseMetadataApi.getAll();
      setMetadata(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error loading course metadata:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load course metadata.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.value.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a value.",
        variant: "destructive",
      });
      return;
    }

    try {
      await courseMetadataApi.create(formData);
      toast({
        title: "Success",
        description: "Course metadata created successfully.",
      });
      setShowForm(false);
      resetForm();
      loadMetadata();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create course metadata.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: CourseMetadata) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      value: item.value,
      description: item.description || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItem || !formData.value.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a value.",
        variant: "destructive",
      });
      return;
    }

    try {
      await courseMetadataApi.update(editingItem.id, formData);
      toast({
        title: "Success",
        description: "Course metadata updated successfully.",
      });
      setEditingItem(null);
      resetForm();
      loadMetadata();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update course metadata.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      await courseMetadataApi.delete(deletingItem.id);
      toast({
        title: "Success",
        description: "Course metadata deleted successfully.",
      });
      setDeletingItem(null);
      loadMetadata();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete course metadata.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'name',
      value: '',
      description: '',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'name':
        return <BookOpen className="w-4 h-4" />;
      case 'course_type':
        return <Tag className="w-4 h-4" />;
      case 'location':
        return <MapPin className="w-4 h-4" />;
      case 'course_code':
        return <Tag className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'name':
        return 'Course Name';
      case 'course_type':
        return 'Course Type';
      case 'location':
        return 'Location';
      case 'course_code':
        return 'Course Code';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'name':
        return 'bg-blue-500';
      case 'course_type':
        return 'bg-green-500';
      case 'location':
        return 'bg-purple-500';
      case 'course_code':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const groupedMetadata = {
    name: metadata.filter(m => m.type === 'name'),
    course_type: metadata.filter(m => m.type === 'course_type'),
    location: metadata.filter(m => m.type === 'location'),
    course_code: metadata.filter(m => m.type === 'course_code'),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Course Metadata</h1>
          <p className="text-muted-foreground">
            Manage course names, types, and locations for course creation
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Metadata
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Course Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedMetadata.course_code.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Course Names</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedMetadata.name.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Course Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedMetadata.course_type.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedMetadata.location.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata Tables */}
      {['course_code', 'name', 'course_type', 'location'].map((type) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getTypeIcon(type)}
              {getTypeLabel(type)}
            </CardTitle>
            <CardDescription>
              {groupedMetadata[type as keyof typeof groupedMetadata].length} item(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : groupedMetadata[type as keyof typeof groupedMetadata].length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {getTypeLabel(type).toLowerCase()} found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Value</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedMetadata[type as keyof typeof groupedMetadata].map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(item.type)}>
                              {item.value}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {item.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingItem(item)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingItem(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Course Metadata' : 'Add Course Metadata'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update course metadata information' : 'Create new course metadata for use in course creation'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingItem ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <Label>Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course_code">Course Code</SelectItem>
                  <SelectItem value="name">Course Name</SelectItem>
                  <SelectItem value="course_type">Course Type</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value *</Label>
              <Input
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={`Enter ${getTypeLabel(formData.type).toLowerCase()}`}
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowForm(false);
                setEditingItem(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course Metadata</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course metadata? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingItem && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Type:</span>
                  <Badge className={getTypeColor(deletingItem.type)}>
                    {getTypeLabel(deletingItem.type)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Value:</span>
                  <span className="text-sm font-semibold">{deletingItem.value}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseMetadata;

