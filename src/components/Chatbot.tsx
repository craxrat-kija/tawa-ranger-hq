import { useState } from "react";
import { MessageCircle, X, Send, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "bot" | "user";
  content: string;
  isLoading?: boolean;
  source?: "knowledge" | "web" | "system";
}

// Comprehensive knowledge base for TAWA Ranger HQ System
const getKnowledgeBase = () => {
  return {
    tawaInfo: `
      TAWA (Tanzania Wildlife Authority) RANGER HQ SYSTEM:
      
      ABOUT TAWA:
      - TAWA is Tanzania's wildlife management authority
      - Manages wildlife resources and ranger training programs
      - Coordinates anti-poaching efforts and conservation initiatives
      - Operates training facilities for wildlife rangers
      
      SYSTEM PURPOSE:
      - Comprehensive ranger training management system
      - Medical and health record management for trainees
      - Training materials and resource distribution
      - Schedule and timetable management
      - Communication and coordination platform
    `,
    
    patientManagement: `
      PATIENT MANAGEMENT SYSTEM:
      
      REGISTERING PATIENTS:
      - Navigate to: Doctor Dashboard > Register Patient (/doctor/register)
      - Required fields: Full Name, Email, Phone Number, Emergency Contact
      - Optional fields: Blood Type, Allergies, Medical History
      - Form automatically generates patient ID and registration date
      - Success redirects to Patient Management page
      
      VIEWING PATIENTS:
      - Navigate to: Doctor Dashboard > Patient Management (/doctor/patients)
      - View all registered patients in table format
      - See patient stats: Total patients, reports, attendance records
      
      MEDICAL REPORTS:
      - Add report: Select patient > Click "Add Report" button
      - Required: Diagnosis
      - Optional: Symptoms, Treatment, Notes
      - Vital Signs: Blood Pressure, Temperature, Heart Rate, Weight
      - Reports are sorted by date (newest first)
      - View all reports in Medical Reports tab
      
      ATTENDANCE TRACKING:
      - Record attendance: Click "Record Attendance" button at top
      - Select patient, date, and status (Present/Absent/Late/Excused)
      - Optional: Check-in time, Check-out time, Notes
      - View all attendance in Attendance tab
      - Filtered by patient and sorted by date
      
      PATIENT HISTORY:
      - View complete history: Select patient > Click "History" button
      - Shows: Patient information, all medical reports, attendance records
      - Comprehensive view in dialog format
      
      REPORT GENERATION:
      - Generate report: Select patient > Click "Report" button
      - Downloads comprehensive text file including:
        * Patient information and demographics
        * Allergies and medical history
        * All medical reports with vital signs
        * Attendance summary (Present/Absent/Late/Excused counts)
        * Detailed attendance records
      - File format: Plain text (.txt)
      - Auto-generated filename with patient name and date
    `,
    
    systemFeatures: `
      TAWA RANGER HQ - COMPLETE FEATURE LIST:
      
      DOCTOR/MEDICAL OFFICER CAPABILITIES:
      ✓ Patient Registration - Full health information capture
      ✓ Patient Management - View, search, and manage all patients
      ✓ Medical Reports - Create detailed medical examination reports
      ✓ Vital Signs Recording - Blood pressure, temperature, heart rate, weight
      ✓ Attendance Tracking - Daily patient attendance with timestamps
      ✓ Patient History - Complete medical and attendance history
      ✓ Report Generation - Downloadable comprehensive patient reports
      ✓ Trainee Health Monitoring - View trainee health records
      
      INSTRUCTOR CAPABILITIES:
      ✓ Trainee Management - View all trainees and their information
      ✓ Course Management - Access and organize training courses
      ✓ Material Upload - Upload training materials (PDFs, PowerPoint, etc.)
      ✓ Gallery Management - Upload and organize training images
      ✓ Timetable Creation - Create and manage training schedules
      ✓ Chat Board - Post announcements and messages
      ✓ Material Distribution - Share materials with trainees
      
      ADMIN CAPABILITIES:
      ✓ Full System Access - Complete administrative control
      ✓ User Management - Register, update, and delete users
      ✓ Role Assignment - Assign roles (Admin, Instructor, Doctor, Trainee)
      ✓ System Configuration - Configure system settings
      ✓ All Instructor Features - Full access to training features
      ✓ Gallery Management - Upload and manage all images
      ✓ Timetable Management - Create and manage all schedules
      ✓ Content Moderation - Manage all system content
      
      TRAINEE CAPABILITIES:
      ✓ Course Access - View assigned courses and materials
      ✓ Material Download - Download training materials
      ✓ Timetable View - Check training schedules
      ✓ Gallery Access - View training photos and resources
      ✓ Chat Board - Post messages and communicate
      ✓ Health Record View - Access own health records (if permitted)
    `,
    
    systemSettings: `
      SYSTEM SETTINGS & CONFIGURATION:
      
      THEME SETTINGS:
      - Three theme options: Light, Dark, TAWA Theme
      - Toggle via Theme Toggle button in header (top right)
      - TAWA Theme: Dark mode with military green primary color
      - Theme preference persists across sessions
      
      AUTHENTICATION:
      - Login required: Password "tawa2024"
      - Role-based access control
      - Role determined by email pattern:
        * "admin" in email → Admin role
        * "doctor" or "doc" → Doctor role
        * "instructor" or "teacher" → Instructor role
        * Default → Trainee role
      - Session management with logout functionality
      
      USER ROLES:
      - Admin: Full system access and management
      - Doctor/Medical Officer: Patient management and health records
      - Instructor: Training management and content
      - Trainee: View content and participate in training
      
      NAVIGATION:
      - Sidebar navigation with role-specific menus
      - Quick action cards on dashboard home
      - Direct links to major features
      - Mobile-responsive sidebar toggle
      
      DATA MANAGEMENT:
      - Patient data stored in database via Laravel backend API
      - Real-time state management across components
      - All data persisted in database
      - Data fetched from API on component mount
      
      FILE UPLOADS:
      - Supported formats: PDF, PowerPoint, Images (JPG, PNG)
      - Gallery: Image files only
      - Materials: PDF, PPT, PPTX files
      - File size limits: Browser default limits apply
      
      EXPORT/REPORT FEATURES:
      - Patient reports: Plain text format (.txt)
      - Generated on-demand
      - Includes comprehensive patient information
      - Timestamped with generation date
    `,
    
    navigation: `
      NAVIGATION PATHS:
      
      DOCTOR DASHBOARD:
      - Home: /doctor
      - Register Patient: /doctor/register
      - Patient Management: /doctor/patients
      - View Trainees: /doctor/trainees
      - Health Records: /doctor/records
      
      INSTRUCTOR DASHBOARD:
      - Home: /instructor
      - View Trainees: /instructor/trainees
      - Materials: /instructor/materials
      - Gallery: /instructor/gallery
      - Timetable: /instructor/timetable
      - Chat Board: /instructor/chat
      
      ADMIN DASHBOARD:
      - Home: /admin
      - Users: /admin/users
      - Trainees: /admin/trainees
      - Reports: /admin/reports
      - All Instructor Features Available
      
      TRAINEE ACCESS:
      - Courses: View assigned courses
      - Materials: Download available materials
      - Timetable: View schedule
      - Gallery: Browse training photos
      - Chat Board: Communicate with others
    `,
    
    troubleshooting: `
      TROUBLESHOOTING GUIDE:
      
      REGISTER PATIENT FORM NOT WORKING:
      ✓ Check all required fields are filled (Full Name, Email, Phone, Emergency Contact)
      ✓ Verify form inputs are responding (no disabled/readonly fields)
      ✓ Check browser console (F12) for JavaScript errors
      ✓ Ensure PatientContext is initialized (check App.tsx)
      ✓ Try refreshing the page
      ✓ Clear browser cache if issues persist
      
      ATTENDANCE NOT RECORDING:
      ✓ Select a patient from dropdown
      ✓ Ensure date is selected
      ✓ Choose status (Present/Absent/Late/Excused)
      ✓ Check for validation errors
      ✓ Verify PatientContext is working
      
      MEDICAL REPORTS NOT SAVING:
      ✓ Ensure diagnosis field is filled (required)
      ✓ Select patient before adding report
      ✓ Check for console errors
      ✓ Verify form submission completed
      
      LOGIN ISSUES:
      ✓ Password must be exactly "tawa2024"
      ✓ Email pattern determines role
      ✓ Check browser console for authentication errors
      ✓ Try clearing browser storage
      
      THEME NOT CHANGING:
      ✓ Click Theme Toggle button (top right)
      ✓ Select desired theme from dropdown
      ✓ Refresh page if theme doesn't apply
      ✓ Check browser console for errors
      
      DATA NOT PERSISTING:
      ✓ Current system uses session storage only
      ✓ Data resets on page refresh
      ✓ Future versions will include backend persistence
    `
  };
};

// Web search function for TAWA-related information
const searchTAWAInfo = async (query: string): Promise<string> => {
  try {
    // Use a search API or fetch from TAWA website
    // For demo, we'll return structured information
    const tawaQueries = [
      "tanzania wildlife authority",
      "tawa ranger training",
      "tanzania wildlife conservation",
      "anti-poaching tanzania",
      "wildlife management tanzania"
    ];
    
    const normalizedQuery = query.toLowerCase();
    
    if (normalizedQuery.includes("tawa") || normalizedQuery.includes("tanzania wildlife")) {
      return `TAWA Information:
      
TAWA (Tanzania Wildlife Authority) is the government authority responsible for wildlife management and conservation in Tanzania.

KEY FUNCTIONS:
- Wildlife resource management and conservation
- Ranger training and development programs
- Anti-poaching operations coordination
- Wildlife law enforcement
- Protected area management
- Community wildlife conservation programs

TRAINING PROGRAMS:
- Field training exercises
- Weaponry training (bilingual programs)
- GPS and GIS navigation training
- Patrol mapping and field operations
- Armed training exercises

For more detailed information, please visit the official TAWA website or contact the TAWA headquarters.`;
    }
    
    return "I found information about TAWA. The Tanzania Wildlife Authority manages wildlife conservation and ranger training programs. Would you like more specific information about training programs, conservation efforts, or operations?";
  } catch (error) {
    return "I'm having trouble searching for TAWA information right now. Please try again or visit the official TAWA website for detailed information.";
  }
};

// Enhanced response generator with intelligent query understanding
const generateBotResponse = async (userInput: string, knowledgeBase: any): Promise<string> => {
  const input = userInput.toLowerCase().trim();
  
  // Greetings
  if (input.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
    return `Hello! I'm TAWA Assistant, your guide to the TAWA Ranger HQ System. I can help you with:
    
• Patient management and medical records
• System navigation and features
• Training materials and schedules
• System settings and configuration
• TAWA organization information
• Troubleshooting issues

What would you like to know?`;
  }
  
  // TAWA general information
  if (input.includes("what is tawa") || input.includes("about tawa") || input.includes("tawa organization") || input.includes("tanzania wildlife authority")) {
    const webInfo = await searchTAWAInfo(input);
    return webInfo;
  }
  
  // Patient registration
  if (input.includes("register") && (input.includes("patient") || input.includes("trainee"))) {
    return knowledgeBase.patientManagement.split("REGISTERING PATIENTS:")[1].split("VIEWING PATIENTS:")[0].trim();
  }
  
  // View patients
  if ((input.includes("view") || input.includes("see") || input.includes("list")) && input.includes("patient")) {
    return knowledgeBase.patientManagement.split("VIEWING PATIENTS:")[1].split("MEDICAL REPORTS:")[0].trim();
  }
  
  // Medical reports
  if (input.includes("medical report") || input.includes("add report") || input.includes("diagnosis") || input.includes("vital signs")) {
    return knowledgeBase.patientManagement.split("MEDICAL REPORTS:")[1].split("ATTENDANCE TRACKING:")[0].trim();
  }
  
  // Attendance
  if (input.includes("attendance") || input.includes("check in") || input.includes("present") || input.includes("absent") || input.includes("late")) {
    return knowledgeBase.patientManagement.split("ATTENDANCE TRACKING:")[1].split("PATIENT HISTORY:")[0].trim();
  }
  
  // Patient history
  if (input.includes("history") || (input.includes("view") && input.includes("record"))) {
    return knowledgeBase.patientManagement.split("PATIENT HISTORY:")[1].split("REPORT GENERATION:")[0].trim();
  }
  
  // Generate report
  if (input.includes("generate") || (input.includes("download") && input.includes("report")) || input.includes("export patient")) {
    return knowledgeBase.patientManagement.split("REPORT GENERATION:")[1].trim();
  }
  
  // System features
  if (input.includes("features") || input.includes("what can") || input.includes("capabilities") || input.includes("what does")) {
    return knowledgeBase.systemFeatures;
  }
  
  // System settings
  if (input.includes("settings") || input.includes("configuration") || input.includes("theme") || input.includes("preference") || input.includes("setup")) {
    return knowledgeBase.systemSettings;
  }
  
  // Navigation
  if (input.includes("navigate") || input.includes("go to") || input.includes("how do i get to") || input.includes("where is") || input.includes("path") || input.includes("route")) {
    return knowledgeBase.navigation;
  }
  
  // Troubleshooting
  if (input.includes("not working") || input.includes("error") || input.includes("problem") || input.includes("issue") || input.includes("fix") || input.includes("broken") || input.includes("help")) {
    return knowledgeBase.troubleshooting;
  }
  
  // Role-specific queries
  if (input.includes("admin") || input.includes("administrator")) {
    return knowledgeBase.systemFeatures.split("ADMIN CAPABILITIES:")[1].split("TRAINEE CAPABILITIES:")[0].trim();
  }
  
  if (input.includes("doctor") || input.includes("medical")) {
    return knowledgeBase.systemFeatures.split("DOCTOR/MEDICAL OFFICER CAPABILITIES:")[1].split("INSTRUCTOR CAPABILITIES:")[0].trim();
  }
  
  if (input.includes("instructor") || input.includes("teacher")) {
    return knowledgeBase.systemFeatures.split("INSTRUCTOR CAPABILITIES:")[1].split("ADMIN CAPABILITIES:")[0].trim();
  }
  
  if (input.includes("trainee") || input.includes("student")) {
    return knowledgeBase.systemFeatures.split("TRAINEE CAPABILITIES:")[1].trim();
  }
  
  // Search for TAWA information
  if (input.includes("search") || input.includes("find information") || input.includes("tawa training") || input.includes("conservation")) {
    const webInfo = await searchTAWAInfo(input);
    return `Here's what I found about TAWA:\n\n${webInfo}`;
  }
  
  // Login/authentication
  if (input.includes("login") || input.includes("password") || input.includes("authenticate") || input.includes("access")) {
    return knowledgeBase.systemSettings.split("AUTHENTICATION:")[1].split("USER ROLES:")[0].trim();
  }
  
  // Default response - attempt to be helpful
  if (input.length > 3) {
    // Try to search web for TAWA info if query seems relevant
    if (input.includes("tawa") || input.includes("wildlife") || input.includes("ranger") || input.includes("tanzania")) {
      const webInfo = await searchTAWAInfo(input);
      return `Based on your question, here's what I found:\n\n${webInfo}\n\nIf you need help with the system features, ask me about patient management, system settings, or navigation.`;
    }
    
    return `I'm not sure I understood your question completely. Here's what I can help with:
    
• Patient Management: "How do I register a patient?", "Add medical report"
• System Features: "What features are available?", "What can admin do?"
• System Settings: "How do I change theme?", "System settings"
• Navigation: "How do I navigate to patient management?"
• TAWA Info: "What is TAWA?", "Search TAWA training programs"
• Troubleshooting: "Form not working", "Login issues"

Try rephrasing your question or ask about one of these topics!`;
  }
  
  return "I'm here to help! Ask me about patient management, system features, settings, navigation, or TAWA information.";
};

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "bot", 
      content: "Hello! I'm TAWA Assistant. I can help you with patient management, system features, settings, navigation, and TAWA information. How can I assist you today?",
      source: "knowledge"
    }
  ]);
  const [input, setInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isSearching) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    
    // Show loading indicator
    setMessages(prev => [...prev, { 
      role: "bot", 
      content: "Searching and analyzing...", 
      isLoading: true,
      source: "system"
    }]);
    setIsSearching(true);
    
    try {
      const knowledgeBase = getKnowledgeBase();
      const botResponse = await generateBotResponse(userMessage, knowledgeBase);
      
      // Remove loading message and add actual response
      setMessages(prev => {
        const withoutLoading = prev.filter((msg, idx) => !(idx === prev.length - 1 && msg.isLoading));
        return [...withoutLoading, {
          role: "bot",
          content: botResponse,
          isLoading: false,
          source: userMessage.toLowerCase().includes("search") || userMessage.toLowerCase().includes("tawa") ? "web" : "knowledge"
        }];
      });
    } catch (error) {
      setMessages(prev => {
        const withoutLoading = prev.filter((msg, idx) => !(idx === prev.length - 1 && msg.isLoading));
        return [...withoutLoading, {
          role: "bot",
          content: "I encountered an error processing your request. Please try again or rephrase your question.",
          isLoading: false,
          source: "system"
        }];
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-military shadow-lg hover:shadow-2xl transition-all z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-military p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-white" />
              <h3 className="font-semibold text-white">TAWA Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex flex-col max-w-[85%]">
                    <div
                      className={`p-3 rounded-lg whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : msg.isLoading
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{msg.content}</span>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.source && !msg.isLoading && msg.role === "bot" && (
                      <div className="mt-1 flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          {msg.source === "web" && <Search className="h-3 w-3 mr-1" />}
                          {msg.source === "web" ? "Web Search" : msg.source === "knowledge" ? "Knowledge Base" : "System"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isSearching && handleSend()}
                placeholder={isSearching ? "Processing..." : "Ask about system, TAWA, or get help..."}
                className="flex-1"
                disabled={isSearching}
              />
              <Button 
                onClick={handleSend} 
                size="icon" 
                className="bg-gradient-military"
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
