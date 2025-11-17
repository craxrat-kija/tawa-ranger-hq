import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  sender: string;
  message: string;
  time: string;
  avatar: string;
}

const ChatBoard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "CPT. Mwangi",
      message: "Reminder: Tomorrow's parade training starts at 0800 hours sharp.",
      time: "10:30 AM",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John"
    },
    {
      id: 2,
      sender: "SGT. Kimani",
      message: "New weaponry manuals have been uploaded to the materials section.",
      time: "11:15 AM",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
      id: 3,
      sender: "LT. Nyerere",
      message: "Field training exercise scheduled for next week. Check timetable for details.",
      time: "2:45 PM",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed"
    },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: user?.name || "User",
        message: message.trim(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`
      };
      
      setMessages([...messages, newMessage]);
      setMessage("");
      
      toast({
        title: "Message Sent",
        description: "Your message has been posted to the board",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Message Board</h1>
        <p className="text-muted-foreground">Instructor communication and announcements</p>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Staff Communications
          </CardTitle>
          <CardDescription>Share updates and coordinate training activities</CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-accent/5 rounded-lg">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <Avatar>
                  <AvatarImage src={msg.avatar} />
                  <AvatarFallback>{msg.sender[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{msg.sender}</span>
                    <span className="text-xs text-muted-foreground">{msg.time}</span>
                  </div>
                  <div className="bg-card p-3 rounded-lg shadow-sm border">
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} className="bg-gradient-military">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatBoard;
