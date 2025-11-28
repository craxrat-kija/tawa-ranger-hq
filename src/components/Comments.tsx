import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { commentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Trash2, Edit2, X, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Comment {
  id: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface CommentsProps {
  commentableType: 'patient' | 'medical_report' | 'attendance_record';
  commentableId: number;
}

export const Comments = ({ commentableType, commentableId }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await commentsApi.getAll(commentableType, commentableId);
      setComments(data);
    } catch (error: any) {
      console.error("Error loading comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [commentableType, commentableId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const comment = await commentsApi.create({
        commentable_type: commentableType,
        commentable_id: commentableId,
        comment: newComment.trim(),
      });
      setComments([comment, ...comments]);
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editText.trim()) return;

    try {
      const updated = await commentsApi.update(id.toString(), editText.trim());
      setComments(comments.map(c => c.id === id ? updated : c));
      setEditingId(null);
      setEditText("");
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update comment",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await commentsApi.delete(id.toString());
      setComments(comments.filter(c => c.id !== id));
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'doctor':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'instructor':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Comments ({comments.length})</h3>
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="mb-4">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2"
            rows={3}
          />
          <Button type="submit" size="sm" className="w-full sm:w-auto">
            <Send className="w-4 h-4 mr-2" />
            Post Comment
          </Button>
        </form>

        {/* Comments List */}
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-lg border bg-card"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.user.name}</span>
                    <Badge variant="outline" className={`text-xs ${getRoleColor(comment.user.role)}`}>
                      {comment.user.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveEdit(comment.id)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditText("");
                          }}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                      {user && (user.id === comment.user_id || user.role === 'admin') && (
                        <div className="flex gap-2 mt-2">
                          {user.id === comment.user_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleEdit(comment)}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleDelete(comment.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};



