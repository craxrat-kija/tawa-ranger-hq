import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, subjectsApi, coursesApi, apiRequest } from "@/lib/api";
import { Edit, Trash2, UserPlus, Download, Upload, Search, BookOpen, Users, X, ChevronRight, ChevronLeft, FileSpreadsheet, Image, Camera, Eye, Plus, User, FileText, Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  course_id?: number;
  course_name?: string;
  user_id?: string;
  passport_picture?: string;
}

interface Course {
  id: number;
  name: string;
  code?: string;
  location?: string;
}

const RegisterUsers = () => {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";
  const canCreateUsers = isSuperAdmin;
  
  const [showForm, setShowForm] = useState(false);
  const [showExcelDialog, setShowExcelDialog] = useState(false);
  const [showPassportDialog, setShowPassportDialog] = useState(false);
  const [viewingPassportUser, setViewingPassportUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    department: "",
    password: "",
    course_id: "",
    // Extended fields
    date_of_birth: "",
    gender: "",
    tribe: "",
    religion: "",
    blood_group: "",
    national_id: "",
    birth_region: "",
    birth_district: "",
    birth_street: "",
    phone_2: "",
    profession: "",
    university: "",
    employment: "",
    other_education_level: "",
    other_education_university: "",
    skills: [] as string[],
    marital_status: "",
    spouse_name: "",
    spouse_phone: "",
    father_name: "",
    father_phone: "",
    mother_name: "",
    mother_phone: "",
    number_of_children: "",
    relatives: [] as any[],
  });
  const [passportPicture, setPassportPicture] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [currentPassportUrl, setCurrentPassportUrl] = useState<string | null>(null);
  const [supportiveDocuments, setSupportiveDocuments] = useState<File[]>([]);
  const [supportiveDocumentsPreview, setSupportiveDocumentsPreview] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supportiveDocsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      if (isSuperAdmin) {
        loadCourses();
      }
      loadSubjects();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user, selectedCourse, searchQuery]);

  const loadCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await subjectsApi.getAll();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      // Only filter by course if a specific course is selected
      // When showing all course cards (selectedCourse is null), load all users
      if (selectedCourse && isSuperAdmin) {
        params.course_id = selectedCourse.id;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      // Use apiRequest with proper authentication
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/users?${queryString}` : '/users';
      
      const response = await apiRequest<any>(endpoint);
      
      const usersData = Array.isArray(response) ? response : (response?.data || []);
      
      const mappedUsers = usersData.map((u: any) => ({
        id: u.id.toString(),
        user_id: u.user_id || u.id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone || "",
        department: u.department || "",
        course_id: u.course_id,
        course_name: u.course_name || null,
        passport_picture: u.passport_picture || null,
      }));
      
      // Debug: Log users with passport pictures
      const usersWithPictures = mappedUsers.filter((u: any) => u.passport_picture);
      if (usersWithPictures.length > 0) {
        console.log('Users with passport pictures:', usersWithPictures);
      }
      
      setUsers(mappedUsers);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load users. Please try again.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group users by course for super admin
  const usersByCourse = useMemo(() => {
    if (!isSuperAdmin) return {};
    
    const grouped: Record<number, { course: Course; users: User[] }> = {};
    
    courses.forEach(course => {
      const courseUsers = users.filter(u => u.course_id === course.id);
      grouped[course.id] = {
        course,
        users: courseUsers,
      };
    });
    
    // Add users without course
    const usersWithoutCourse = users.filter(u => !u.course_id || u.course_id === null);
    if (usersWithoutCourse.length > 0) {
      grouped[0] = {
        course: { id: 0, name: "No Course Assigned", code: "N/A" },
        users: usersWithoutCourse,
      };
    }
    
    return grouped;
  }, [users, courses, isSuperAdmin]);

  // Filtered users based on search and selected course
  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    if (selectedCourse && isSuperAdmin) {
      filtered = filtered.filter(u => u.course_id === selectedCourse.id);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.user_id ? String(u.user_id).toLowerCase().includes(query) : false) ||
        (u.phone ? u.phone.toLowerCase().includes(query) : false) ||
        (u.department ? u.department.toLowerCase().includes(query) : false) ||
        u.role.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [users, selectedCourse, searchQuery, isSuperAdmin]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCourse]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadUsers();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCourse]);

  const handleDownloadTemplate = async () => {
    try {
      await usersApi.downloadTemplate();
      toast({
        title: "Success",
        description: "Template downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download template.",
        variant: "destructive",
      });
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      toast({
        title: "Error",
        description: "Please select an Excel file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const courseId = selectedCourse ? selectedCourse.id : undefined;
      const result = await usersApi.importFromExcel(excelFile, courseId);
      
      const importedCount = result.data?.imported || 0;
      const hasErrors = result.data?.errors && result.data.errors.length > 0;
      
      if (importedCount === 0) {
        toast({
          title: "No Users Imported",
          description: hasErrors 
            ? `No users were imported. ${result.data.errors.slice(0, 3).join(' ')}`
            : "No users were imported. Please check your Excel file format and ensure rows are not empty.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result.message || `Successfully imported ${importedCount} user(s).${hasErrors ? ` Some errors occurred.` : ''}`,
        });
      }
      
      setExcelFile(null);
      setShowExcelDialog(false);
      loadUsers();
    } catch (error: any) {
      console.error('Excel import error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to import users from Excel.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePassportPictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Passport picture must be less than 2MB.",
          variant: "destructive",
        });
        return;
      }
      setPassportPicture(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassportPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePassportPicture = () => {
    setPassportPicture(null);
    setPassportPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSupportiveDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Validate file types (PDF, images, Word docs)
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid File Type",
          description: "Please select PDF, image, or Word document files only.",
          variant: "destructive",
        });
        return;
      }

      // Validate file sizes (max 5MB per file)
      const largeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
      if (largeFiles.length > 0) {
        toast({
          title: "File Too Large",
          description: "Each document must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Limit to 5 documents
      if (files.length > 5) {
        toast({
          title: "Too Many Files",
          description: "You can upload a maximum of 5 documents.",
          variant: "destructive",
        });
        return;
      }

      setSupportiveDocuments(files);
      
      // Create previews for images
      const previews: string[] = [];
      files.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            previews.push(reader.result as string);
            if (previews.length === files.filter(f => f.type.startsWith('image/')).length) {
              setSupportiveDocumentsPreview(previews);
            }
          };
          reader.readAsDataURL(file);
        }
      });
      
      if (files.filter(f => !f.type.startsWith('image/')).length === files.length) {
        setSupportiveDocumentsPreview([]);
      }
    }
  };

  const handleRemoveSupportiveDocument = (index: number) => {
    const newDocs = supportiveDocuments.filter((_, i) => i !== index);
    setSupportiveDocuments(newDocs);
    
    // Update previews
    const imageDocs = newDocs.filter(f => f.type.startsWith('image/'));
    if (imageDocs.length > 0) {
      const previews: string[] = [];
      imageDocs.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          if (previews.length === imageDocs.length) {
            setSupportiveDocumentsPreview(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setSupportiveDocumentsPreview([]);
    }
    
    if (supportiveDocsInputRef.current) {
      supportiveDocsInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.role || !formData.phone || !formData.department) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields (Name, Email, Role, Phone, Department).",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (editUser) {
        // If passport picture is uploaded, use FormData
        if (passportPicture) {
          const formDataToSend = new FormData();
          formDataToSend.append('name', formData.name);
          formDataToSend.append('email', formData.email);
          formDataToSend.append('role', formData.role);
          formDataToSend.append('phone', formData.phone);
          formDataToSend.append('department', formData.department);
          if (formData.password) {
            formDataToSend.append('password', formData.password);
          }
          if (formData.role === 'instructor' && selectedSubjects.length > 0) {
            selectedSubjects.forEach(id => formDataToSend.append('subject_ids[]', id.toString()));
          } else if (formData.role === 'instructor') {
            formDataToSend.append('subject_ids', '[]');
          }
          formDataToSend.append('passport_picture', passportPicture);
          
          // Add extended fields
          if (formData.date_of_birth) formDataToSend.append('date_of_birth', formData.date_of_birth);
          if (formData.gender) formDataToSend.append('gender', formData.gender);
          if (formData.tribe) formDataToSend.append('tribe', formData.tribe);
          if (formData.religion) formDataToSend.append('religion', formData.religion);
          if (formData.blood_group) formDataToSend.append('blood_group', formData.blood_group);
          if (formData.national_id) formDataToSend.append('national_id', formData.national_id);
          if (formData.birth_region) formDataToSend.append('birth_region', formData.birth_region);
          if (formData.birth_district) formDataToSend.append('birth_district', formData.birth_district);
          if (formData.birth_street) formDataToSend.append('birth_street', formData.birth_street);
          if (formData.phone_2) formDataToSend.append('phone_2', formData.phone_2);
          if (formData.profession) formDataToSend.append('profession', formData.profession);
          if (formData.university) formDataToSend.append('university', formData.university);
          if (formData.employment) formDataToSend.append('employment', formData.employment);
          if (formData.other_education_level) formDataToSend.append('other_education_level', formData.other_education_level);
          if (formData.other_education_university) formDataToSend.append('other_education_university', formData.other_education_university);
          if (formData.marital_status) formDataToSend.append('marital_status', formData.marital_status);
          if (formData.spouse_name) formDataToSend.append('spouse_name', formData.spouse_name);
          if (formData.spouse_phone) formDataToSend.append('spouse_phone', formData.spouse_phone);
          if (formData.father_name) formDataToSend.append('father_name', formData.father_name);
          if (formData.father_phone) formDataToSend.append('father_phone', formData.father_phone);
          if (formData.mother_name) formDataToSend.append('mother_name', formData.mother_name);
          if (formData.mother_phone) formDataToSend.append('mother_phone', formData.mother_phone);
          if (formData.number_of_children) formDataToSend.append('number_of_children', formData.number_of_children);
          if (formData.skills && formData.skills.length > 0) {
            // Send skills as JSON string for FormData
            formDataToSend.append('skills', JSON.stringify(formData.skills));
          }
          // Filter out empty relatives (where name is empty) before sending
          // Always ensure relatives is an array
          const relativesArray = Array.isArray(formData.relatives) ? formData.relatives : [];
          const validRelatives = relativesArray.filter((rel: any) => rel && rel.name && rel.name.trim() !== "");
          // Always send relatives as JSON string for FormData (even if empty array)
          formDataToSend.append('relatives', JSON.stringify(validRelatives));
          
          // Add supportive documents for doctors
          if (formData.role === 'doctor' && supportiveDocuments.length > 0) {
            supportiveDocuments.forEach((doc, index) => {
              formDataToSend.append(`supportive_documents[${index}]`, doc);
            });
          }
          
          formDataToSend.append('_method', 'PUT');

          const token = localStorage.getItem('auth_token');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          const response = await fetch(`${API_BASE_URL}/api/users/${editUser.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: formDataToSend,
          });

          if (!response.ok) {
            const errorData = await response.json();
            // Extract validation errors if they exist
            if (errorData.errors) {
              const validationErrors = Object.entries(errorData.errors)
                .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('\n');
              throw new Error(`Validation failed:\n${validationErrors}`);
            }
            throw new Error(errorData.message || 'Failed to update user');
          }

          const responseData = await response.json();
          if (responseData && !responseData.success && responseData.message) {
            throw new Error(responseData.message);
          }
          toast({
            title: "User Updated",
            description: `${formData.name} has been updated successfully.`,
          });
        } else {
          // Regular update without passport picture
          const updateData: any = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            phone: formData.phone,
            department: formData.department,
          };
          if (formData.password) {
            updateData.password = formData.password;
          }
          if (formData.role === 'instructor' && selectedSubjects.length > 0) {
            updateData.subject_ids = selectedSubjects;
          } else if (formData.role === 'instructor') {
            updateData.subject_ids = [];
          }
          
          // Add extended fields (only if they have values)
          if (formData.date_of_birth) updateData.date_of_birth = formData.date_of_birth;
          if (formData.gender) updateData.gender = formData.gender;
          if (formData.tribe) updateData.tribe = formData.tribe;
          if (formData.religion) updateData.religion = formData.religion;
          if (formData.blood_group) updateData.blood_group = formData.blood_group;
          if (formData.national_id) updateData.national_id = formData.national_id;
          if (formData.birth_region) updateData.birth_region = formData.birth_region;
          if (formData.birth_district) updateData.birth_district = formData.birth_district;
          if (formData.birth_street) updateData.birth_street = formData.birth_street;
          if (formData.phone_2) updateData.phone_2 = formData.phone_2;
          if (formData.profession) updateData.profession = formData.profession;
          if (formData.university) updateData.university = formData.university;
          if (formData.employment) updateData.employment = formData.employment;
          if (formData.other_education_level) updateData.other_education_level = formData.other_education_level;
          if (formData.other_education_university) updateData.other_education_university = formData.other_education_university;
          if (formData.marital_status) updateData.marital_status = formData.marital_status;
          if (formData.spouse_name) updateData.spouse_name = formData.spouse_name;
          if (formData.spouse_phone) updateData.spouse_phone = formData.spouse_phone;
          if (formData.father_name) updateData.father_name = formData.father_name;
          if (formData.father_phone) updateData.father_phone = formData.father_phone;
          if (formData.mother_name) updateData.mother_name = formData.mother_name;
          if (formData.mother_phone) updateData.mother_phone = formData.mother_phone;
          if (formData.number_of_children) updateData.number_of_children = parseInt(formData.number_of_children) || 0;
          if (formData.skills && formData.skills.length > 0) updateData.skills = formData.skills;
          // Filter out empty relatives (where name is empty) before sending
          // Always ensure relatives is an array
          const relativesArray = Array.isArray(formData.relatives) ? formData.relatives : [];
          const validRelatives = relativesArray.filter((rel: any) => rel && rel.name && rel.name.trim() !== "");
          updateData.relatives = validRelatives; // Always send as array, even if empty

          try {
          const response = await usersApi.update(editUser.id, updateData);
          // Check if response indicates failure
          if (response && typeof response === 'object') {
            if ('success' in response && !response.success) {
              // Check for validation errors
              if (response.errors) {
                const validationErrors = Object.entries(response.errors)
                  .map(([field, messages]: [string, any]) => {
                    const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const msgList = Array.isArray(messages) ? messages.join(', ') : String(messages);
                    return `${fieldName}: ${msgList}`;
                  })
                  .join('\n');
                throw new Error(`Validation failed:\n${validationErrors}`);
              }
              throw new Error(response.message || 'Failed to update user');
            }
            if ('data' in response && response.data && typeof response.data === 'object' && 'success' in response.data && !response.data.success) {
              // Check for validation errors in data
              if (response.data.errors) {
                const validationErrors = Object.entries(response.data.errors)
                  .map(([field, messages]: [string, any]) => {
                    const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const msgList = Array.isArray(messages) ? messages.join(', ') : String(messages);
                    return `${fieldName}: ${msgList}`;
                  })
                  .join('\n');
                throw new Error(`Validation failed:\n${validationErrors}`);
              }
              throw new Error(response.data.message || 'Failed to update user');
            }
          }
        } catch (apiError: any) {
          // Re-throw with better error message if it's a validation error
          if (apiError.message && apiError.message.includes('Validation failed')) {
            throw apiError;
          }
          // Try to extract validation errors from the error object
          if (apiError.response?.data?.errors) {
            const validationErrors = Object.entries(apiError.response.data.errors)
              .map(([field, messages]: [string, any]) => {
                const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const msgList = Array.isArray(messages) ? messages.join(', ') : String(messages);
                return `${fieldName}: ${msgList}`;
              })
              .join('\n');
            throw new Error(`Validation failed:\n${validationErrors}`);
          }
          // If the error message already contains validation errors (from apiRequest), use it
          if (apiError.message && apiError.message !== 'An error occurred') {
            throw apiError;
          }
          throw apiError;
        }
        toast({
          title: "User Updated",
          description: `${formData.name} has been updated successfully.`,
        });
        }
      } else {
        if (!canCreateUsers) {
          toast({
            title: "Access Denied",
            description: "Only super administrators can create new users.",
            variant: "destructive",
          });
          return;
        }
        
        if (formData.role !== 'trainee' && !formData.password) {
          toast({
            title: "Password Required",
            description: "Please provide a password for the new user.",
            variant: "destructive",
          });
          return;
        }
        
        // If doctor has supportive documents, use FormData
        if (formData.role === 'doctor' && supportiveDocuments.length > 0) {
          const formDataToSend = new FormData();
          formDataToSend.append('name', formData.name);
          formDataToSend.append('email', formData.email);
          formDataToSend.append('role', formData.role);
          formDataToSend.append('phone', formData.phone);
          formDataToSend.append('department', formData.department);
          
          if (formData.password) {
            formDataToSend.append('password', formData.password);
          }
          
          // Add course_id if super admin and course is selected
          if (isSuperAdmin && selectedCourse) {
            formDataToSend.append('course_id', selectedCourse.id.toString());
          } else if (isSuperAdmin && formData.course_id) {
            formDataToSend.append('course_id', formData.course_id);
          }
          
          if (formData.role === 'instructor' && selectedSubjects.length > 0) {
            selectedSubjects.forEach(id => formDataToSend.append('subject_ids[]', id.toString()));
          }
          
          // Add supportive documents
          supportiveDocuments.forEach((doc, index) => {
            formDataToSend.append(`supportive_documents[${index}]`, doc);
          });

          const token = localStorage.getItem('auth_token');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          const response = await fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: formDataToSend,
          });

          if (!response.ok) {
            let errorData: any = {};
            try {
              errorData = await response.json();
            } catch (e) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            if (errorData.errors) {
              const validationErrors = Object.entries(errorData.errors)
                .map(([field, messages]: [string, any]) => {
                  const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const msgList = Array.isArray(messages) ? messages.join(', ') : String(messages);
                  return `${fieldName}: ${msgList}`;
                })
                .join('\n');
              const error = new Error(`Validation failed:\n${validationErrors}`);
              (error as any).response = { data: errorData };
              throw error;
            }
            
            const error = new Error(errorData.message || 'Failed to create user');
            (error as any).response = { data: errorData };
            throw error;
          }

          const responseData = await response.json();
          const registeredUser = responseData?.data || responseData;
          const userId = registeredUser?.user_id || 'User ID pending';
          
          toast({
            title: "User Registered",
            description: `${formData.name} has been registered successfully. User ID: ${userId}`,
          });
        } else {
          // Regular create without documents
          const createData: any = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            phone: formData.phone,
            department: formData.department,
          };
          
          // Add course_id if super admin and course is selected
          if (isSuperAdmin && selectedCourse) {
            createData.course_id = selectedCourse.id;
          } else if (isSuperAdmin && formData.course_id) {
            createData.course_id = parseInt(formData.course_id);
          }
          
          if (formData.password) {
            createData.password = formData.password;
          }
          if (formData.role === 'instructor' && selectedSubjects.length > 0) {
            createData.subject_ids = selectedSubjects;
          }

          const response = await usersApi.create(createData);
          const registeredUser = response?.data || response;
          const userId = registeredUser?.user_id || 'User ID pending';
          
          toast({
            title: "User Registered",
            description: `${formData.name} has been registered successfully. User ID: ${userId}`,
          });
        }
      }

      setFormData({ 
        name: "", 
        email: "", 
        role: "", 
        phone: "", 
        department: "", 
        password: "", 
        course_id: selectedCourse ? selectedCourse.id.toString() : "",
        date_of_birth: "",
        gender: "",
        tribe: "",
        religion: "",
        blood_group: "",
        national_id: "",
        birth_region: "",
        birth_district: "",
        birth_street: "",
        phone_2: "",
        profession: "",
        university: "",
        employment: "",
        other_education_level: "",
        other_education_university: "",
        skills: [],
        marital_status: "",
        spouse_name: "",
        spouse_phone: "",
        father_name: "",
        father_phone: "",
        mother_name: "",
        mother_phone: "",
        number_of_children: "",
        relatives: [],
      });
      setSelectedSubjects([]);
      setPassportPicture(null);
      setPassportPreview(null);
      setCurrentPassportUrl(null);
      setSupportiveDocuments([]);
      setSupportiveDocumentsPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (supportiveDocsInputRef.current) {
        supportiveDocsInputRef.current.value = "";
      }
      setShowForm(false);
      setEditUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      let errorMessage = "Failed to save user. Please try again.";
      
      // Check for validation errors in different formats
      if (error.message && error.message.includes('Validation failed')) {
        errorMessage = error.message;
      } else if (error.response?.data?.errors) {
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([field, messages]: [string, any]) => {
            const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const msgList = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${fieldName}: ${msgList}`;
          })
          .join('\n');
        errorMessage = `Validation failed:\n${validationErrors}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show longer for validation errors
      });
    }
  };

  const handleEdit = async (user: User) => {
    try {
      // Always fetch full user data to ensure all fields are populated
      const userData = await usersApi.getById(user.id);
      
      setEditUser(user);
      setFormData({
        name: userData.name || user.name || "",
        email: userData.email || user.email || "",
        role: userData.role || user.role || "",
        phone: userData.phone || user.phone || "",
        department: userData.department || user.department || "",
        password: "",
        course_id: (userData.course_id || user.course_id)?.toString() || "",
        // Extended fields
        date_of_birth: userData.date_of_birth || "",
        gender: userData.gender || "",
        tribe: userData.tribe || "",
        religion: userData.religion || "",
        blood_group: userData.blood_group || "",
        national_id: userData.national_id || "",
        birth_region: userData.birth_region || "",
        birth_district: userData.birth_district || "",
        birth_street: userData.birth_street || "",
        phone_2: userData.phone_2 || "",
        profession: userData.profession || "",
        university: userData.university || "",
        employment: userData.employment || "",
        other_education_level: userData.other_education_level || "",
        other_education_university: userData.other_education_university || "",
        skills: userData.skills || [],
        marital_status: userData.marital_status || "",
        spouse_name: userData.spouse_name || "",
        spouse_phone: userData.spouse_phone || "",
        father_name: userData.father_name || "",
        father_phone: userData.father_phone || "",
        mother_name: userData.mother_name || "",
        mother_phone: userData.mother_phone || "",
        number_of_children: userData.number_of_children?.toString() || "",
        relatives: userData.relatives || [],
      });
      setPassportPicture(null);
      setPassportPreview(null);
      
      // Set current passport URL if user has one
      const passportPicture = userData.passport_picture || user.passport_picture;
      if (passportPicture) {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        setCurrentPassportUrl(`${API_BASE_URL}/storage/${passportPicture}`);
      } else {
        setCurrentPassportUrl(null);
      }
      
      // Set selected subjects for instructors
      if (userData.role === 'instructor' || user.role === 'instructor') {
        setSelectedSubjects(userData.subjects?.map((s: any) => s.id) || []);
      } else {
        setSelectedSubjects([]);
      }
      
      setShowForm(true);
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewPassport = (user: User) => {
    console.log('View passport clicked for user:', user);
    console.log('User passport_picture:', user.passport_picture);
    setViewingPassportUser(user);
    setShowPassportDialog(true);
  };

  const handleDownloadPassport = async () => {
    if (!viewingPassportUser?.passport_picture || !viewingPassportUser?.id) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('auth_token');
      
      // Use the API endpoint to download with proper CORS headers
      const downloadUrl = `${API_BASE_URL}/api/users/${viewingPassportUser.id}/passport-picture/download`;
      
      // Fetch the image with authentication
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download passport picture');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Extract filename from response headers or create one
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = `passport_${viewingPassportUser.name.replace(/\s+/g, '_')}.jpg`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Download Started",
        description: "Passport picture is being downloaded.",
      });
    } catch (error) {
      console.error("Error downloading passport picture:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the passport picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const userToDelete = users.find(u => u.id === userId);
      await usersApi.delete(userId);
      toast({
        title: "User Deleted",
        description: `${userToDelete?.name} has been removed from the system.`,
        variant: "destructive",
      });
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "instructor": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "doctor": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "trainee": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getRoleCounts = (usersList: User[]) => {
    return {
      admin: usersList.filter(u => u.role === 'admin').length,
      instructor: usersList.filter(u => u.role === 'instructor').length,
      doctor: usersList.filter(u => u.role === 'doctor').length,
      trainee: usersList.filter(u => u.role === 'trainee').length,
    };
  };

  if (authLoading || !user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">User Management</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin 
              ? "Manage all users across all courses" 
              : isAdmin 
                ? "Manage users in your course" 
                : "View users in the system"}
          </p>
        </div>
        {canCreateUsers && selectedCourse && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleDownloadTemplate}
              className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowExcelDialog(true)}
              className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Button 
              className="bg-gradient-military" 
              onClick={() => { 
                setEditUser(null); 
                setFormData({ 
                  name: "", 
                  email: "", 
                  role: "", 
                  phone: "", 
                  department: "", 
                  password: "", 
                  course_id: selectedCourse.id.toString()
                }); 
                setSelectedSubjects([]);
                setShowForm(true);
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User to {selectedCourse.name}
            </Button>
          </div>
        )}
      </div>

      {/* Super Admin Course Cards View */}
      {isSuperAdmin && !selectedCourse && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(usersByCourse).map(([courseId, { course, users: courseUsers }]) => {
            const counts = getRoleCounts(courseUsers);
            const totalUsers = courseUsers.length;
            
            return (
              <Card
                key={courseId}
                className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary animate-slide-up flex flex-col"
                style={{ animationDelay: `${parseInt(courseId) * 50}ms` }}
              >
                <CardHeader 
                  className="bg-gradient-to-r from-primary/10 to-primary/5 cursor-pointer"
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/20 rounded-lg group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">{course.name}</CardTitle>
                        {course.code && (
                          <CardDescription className="text-sm font-medium">{course.code}</CardDescription>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Total Users</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{totalUsers}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {counts.admin > 0 && (
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded text-center">
                          <div className="text-xs text-red-600 dark:text-red-300">Admins</div>
                          <div className="text-lg font-bold text-red-800 dark:text-red-200">{counts.admin}</div>
                        </div>
                      )}
                      {counts.instructor > 0 && (
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded text-center">
                          <div className="text-xs text-blue-600 dark:text-blue-300">Instructors</div>
                          <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{counts.instructor}</div>
                        </div>
                      )}
                      {counts.doctor > 0 && (
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded text-center">
                          <div className="text-xs text-green-600 dark:text-green-300">Doctors</div>
                          <div className="text-lg font-bold text-green-800 dark:text-green-200">{counts.doctor}</div>
                        </div>
                      )}
                      {counts.trainee > 0 && (
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded text-center">
                          <div className="text-xs text-purple-600 dark:text-purple-300">Trainees</div>
                          <div className="text-lg font-bold text-purple-800 dark:text-purple-200">{counts.trainee}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t space-y-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowExcelDialog(true);
                      }}
                      className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Excel
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-gradient-military"
                      onClick={() => {
                        setSelectedCourse(course);
                        setEditUser(null);
                        setFormData({
                          name: "",
                          email: "",
                          role: "",
                          phone: "",
                          department: "",
                          password: "",
                          course_id: course.id.toString(),
                        });
                        setSelectedSubjects([]);
                        setShowForm(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User to {course.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Search Bar for Super Admin - Show after cards when viewing all courses */}
      {isSuperAdmin && !selectedCourse && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search all users across all courses by name, email, user ID, phone, department, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Selected Course Header (Super Admin) */}
      {isSuperAdmin && selectedCourse && (
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCourse(null)}
              className="hover:bg-primary/20"
            >
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-primary">{selectedCourse.name}</h2>
              {selectedCourse.code && (
                <p className="text-sm text-muted-foreground">Course Code: {selectedCourse.code}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length} user(s) in this course
            </div>
            {canCreateUsers && (
              <Button 
                size="sm"
                className="bg-gradient-military" 
                onClick={() => { 
                  setEditUser(null); 
                  setFormData({ 
                    name: "", 
                    email: "", 
                    role: "", 
                    phone: "", 
                    department: "", 
                    password: "", 
                    course_id: selectedCourse.id.toString() 
                  }); 
                  setSelectedSubjects([]);
                  setShowForm(true);
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User to This Course
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search Bar - Only show when viewing users (not cards) */}
      {(selectedCourse || !isSuperAdmin) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder={
              selectedCourse 
                ? `Search users in ${selectedCourse.name} by name, email, user ID, phone, department, or role...`
                : "Search users by name, email, user ID, phone, department, or role..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No users found matching your search." : "No users found."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Group by Role */}
          {['admin', 'instructor', 'doctor', 'trainee'].map((role) => {
            const roleUsers = paginatedUsers.filter(u => u.role === role);
            if (roleUsers.length === 0) return null;

            return (
              <Card key={role} className="border-2 animate-slide-up hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-primary capitalize">{role}s</CardTitle>
                      <CardDescription>Manage {role} accounts</CardDescription>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getRoleColor(role)}`}>
                      {roleUsers.length} {roleUsers.length === 1 ? role : `${role}s`}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Department</TableHead>
                        {isSuperAdmin && <TableHead>Course</TableHead>}
                        {isAdmin && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roleUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="font-mono text-sm">{user.user_id || user.id}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone || "N/A"}</TableCell>
                          <TableCell>{user.department || "N/A"}</TableCell>
                          {isSuperAdmin && (
                            <TableCell>{user.course_name || "N/A"}</TableCell>
                          )}
                          {isAdmin && (
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleViewPassport(user);
                                  }}
                                  title={user.passport_picture ? "View passport picture" : "View passport picture (not available)"}
                                  className={user.passport_picture ? "hover:bg-blue-50 dark:hover:bg-blue-950" : "hover:bg-muted/50 opacity-60"}
                                >
                                  <Eye className={`w-4 h-4 ${user.passport_picture ? "text-blue-600" : "text-muted-foreground"}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(user)}
                                  title="Edit user"
                                  className="hover:bg-primary/10"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(user.id)}
                                  title="Delete user"
                                  className="hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit User Dialog */}
      {isAdmin && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editUser ? "Edit User" : "Register New User"}</DialogTitle>
              <DialogDescription>
                {editUser ? "Update user information" : "Add a new user to the system"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                    disabled={!!editUser}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => {
                      setFormData({ ...formData, role: value });
                      if (value !== 'instructor') {
                        setSelectedSubjects([]);
                      }
                    }} 
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="trainee">Trainee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+255 XXX XXX XXX"
                    required
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Enter department"
                    required
                  />
                </div>

                {isSuperAdmin && !editUser && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="course_id">Assign to Course *</Label>
                    <Select 
                      value={formData.course_id || (selectedCourse ? selectedCourse.id.toString() : undefined)} 
                      onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                      required
                      disabled={!!selectedCourse}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedCourse ? `Selected: ${selectedCourse.name}` : "Select course"} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name} {course.code && `(${course.code})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCourse && (
                      <p className="text-xs text-primary font-medium">
                        ✓ User will be added to: <strong>{selectedCourse.name}</strong>
                      </p>
                    )}
                  </div>
                )}

                {formData.role !== 'trainee' && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="password">Password {editUser ? "(leave blank to keep current)" : "*"}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editUser ? "Enter new password (optional)" : "Enter password"}
                      required={!editUser}
                      minLength={8}
                    />
                  </div>
                )}

                {formData.role === 'instructor' && (
                  <div className="space-y-2 col-span-2">
                    <Label>Subjects to Teach *</Label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2 bg-muted/30">
                      {subjects.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            No subjects available. Please create subjects first.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowForm(false);
                              navigate('/admin/subjects');
                            }}
                          >
                            Go to Subjects Management
                          </Button>
                        </div>
                      ) : (
                        subjects.map((subject) => (
                          <div key={subject.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
                            <Checkbox
                              id={`subject-${subject.id}`}
                              checked={selectedSubjects.includes(subject.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubjects([...selectedSubjects, subject.id]);
                                } else {
                                  setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id));
                                }
                              }}
                            />
                            <label
                              htmlFor={`subject-${subject.id}`}
                              className="text-sm font-medium leading-none cursor-pointer flex-1"
                            >
                              <span className="font-semibold">{subject.name}</span>
                              {subject.code && (
                                <span className="text-muted-foreground ml-2">({subject.code})</span>
                              )}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {editUser && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="passport-picture">Passport Size Picture (Optional)</Label>
                    <div className="space-y-3">
                      {currentPassportUrl && !passportPreview && (
                        <div className="relative inline-block">
                          <img 
                            src={currentPassportUrl} 
                            alt="Current passport picture" 
                            className="w-32 h-40 object-cover border-2 border-gray-300 rounded-lg"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Current picture</p>
                        </div>
                      )}
                      {passportPreview && (
                        <div className="relative inline-block">
                          <img 
                            src={passportPreview} 
                            alt="New passport picture preview" 
                            className="w-32 h-40 object-cover border-2 border-primary rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-red-500 hover:bg-red-600 text-white"
                            onClick={handleRemovePassportPicture}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <p className="text-xs text-primary font-medium mt-1">New picture (will replace current)</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Input
                          id="passport-picture"
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handlePassportPictureChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          {passportPreview ? "Change Picture" : currentPassportUrl ? "Replace Picture" : "Upload Picture"}
                        </Button>
                        {passportPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemovePassportPicture}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recommended: Passport size (2x2 inches), Max 2MB. JPG, PNG formats accepted.
                      </p>
                    </div>
                  </div>
                )}

                {/* Supportive Documents for Doctors */}
                {formData.role === 'doctor' && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="supportive-documents">Supportive Documents (Optional)</Label>
                    <div className="space-y-3">
                      {supportiveDocuments.length > 0 && (
                        <div className="space-y-2">
                          {supportiveDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                              <div className="flex items-center gap-3 flex-1">
                                <FileText className="w-5 h-5 text-primary" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(doc.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSupportiveDocument(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Input
                          id="supportive-documents"
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          multiple
                          ref={supportiveDocsInputRef}
                          onChange={handleSupportiveDocumentsChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => supportiveDocsInputRef.current?.click()}
                          className="flex items-center gap-2"
                          disabled={supportiveDocuments.length >= 5}
                        >
                          <Upload className="w-4 h-4" />
                          {supportiveDocuments.length > 0 ? "Add More Documents" : "Upload Documents"}
                        </Button>
                        {supportiveDocuments.length > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {supportiveDocuments.length} / 5 documents
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload supporting documents (e.g., certificates, licenses). Max 5 files, 5MB each. PDF, Word, or Image formats accepted.
                      </p>
                    </div>
                  </div>
                )}

                {/* Extended Fields - Only visible when editing and for admin/super_admin */}
                {editUser && isAdmin && (
                  <>
                    <div className="col-span-2 border-t pt-4 mt-4">
                      <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                    </div>

                    {/* Personal Information */}
                    <div className="col-span-2">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Personal Information</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={formData.gender} 
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tribe">Tribe</Label>
                      <Input
                        id="tribe"
                        value={formData.tribe}
                        onChange={(e) => setFormData({ ...formData, tribe: e.target.value })}
                        placeholder="Enter tribe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="religion">Religion</Label>
                      <Input
                        id="religion"
                        value={formData.religion}
                        onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                        placeholder="Enter religion"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="blood_group">Blood Group</Label>
                      <Select 
                        value={formData.blood_group} 
                        onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="national_id">National ID</Label>
                      <Input
                        id="national_id"
                        value={formData.national_id}
                        onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                        placeholder="Enter national ID"
                      />
                    </div>

                    {/* Birth Information */}
                    <div className="col-span-2 mt-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Birth Information</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_region">Birth Region</Label>
                      <Input
                        id="birth_region"
                        value={formData.birth_region}
                        onChange={(e) => setFormData({ ...formData, birth_region: e.target.value })}
                        placeholder="Enter birth region"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_district">Birth District</Label>
                      <Input
                        id="birth_district"
                        value={formData.birth_district}
                        onChange={(e) => setFormData({ ...formData, birth_district: e.target.value })}
                        placeholder="Enter birth district"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="birth_street">Birth Street/Address</Label>
                      <Input
                        id="birth_street"
                        value={formData.birth_street}
                        onChange={(e) => setFormData({ ...formData, birth_street: e.target.value })}
                        placeholder="Enter birth street/address"
                      />
                    </div>

                    {/* Contact Information */}
                    <div className="col-span-2 mt-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Additional Contact</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_2">Phone 2</Label>
                      <Input
                        id="phone_2"
                        value={formData.phone_2}
                        onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })}
                        placeholder="+255 XXX XXX XXX"
                      />
                    </div>

                    {/* Professional Information */}
                    <div className="col-span-2 mt-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Professional Information</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profession">Profession</Label>
                      <Input
                        id="profession"
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        placeholder="Enter profession"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Input
                        id="university"
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        placeholder="Enter university"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employment">Employment</Label>
                      <Input
                        id="employment"
                        value={formData.employment}
                        onChange={(e) => setFormData({ ...formData, employment: e.target.value })}
                        placeholder="Enter employment"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="other_education_level">Other Education Level</Label>
                      <Input
                        id="other_education_level"
                        value={formData.other_education_level}
                        onChange={(e) => setFormData({ ...formData, other_education_level: e.target.value })}
                        placeholder="Enter other education level"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="other_education_university">Other Education University</Label>
                      <Input
                        id="other_education_university"
                        value={formData.other_education_university}
                        onChange={(e) => setFormData({ ...formData, other_education_university: e.target.value })}
                        placeholder="Enter other education university"
                      />
                    </div>

                    {/* Family Information */}
                    <div className="col-span-2 mt-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Family Information</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marital_status">Marital Status</Label>
                      <Select 
                        value={formData.marital_status} 
                        onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spouse_name">Spouse Name</Label>
                      <Input
                        id="spouse_name"
                        value={formData.spouse_name}
                        onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                        placeholder="Enter spouse name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spouse_phone">Spouse Phone</Label>
                      <Input
                        id="spouse_phone"
                        value={formData.spouse_phone}
                        onChange={(e) => setFormData({ ...formData, spouse_phone: e.target.value })}
                        placeholder="+255 XXX XXX XXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="father_name">Father Name</Label>
                      <Input
                        id="father_name"
                        value={formData.father_name}
                        onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                        placeholder="Enter father name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="father_phone">Father Phone</Label>
                      <Input
                        id="father_phone"
                        value={formData.father_phone}
                        onChange={(e) => setFormData({ ...formData, father_phone: e.target.value })}
                        placeholder="+255 XXX XXX XXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mother_name">Mother Name</Label>
                      <Input
                        id="mother_name"
                        value={formData.mother_name}
                        onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                        placeholder="Enter mother name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mother_phone">Mother Phone</Label>
                      <Input
                        id="mother_phone"
                        value={formData.mother_phone}
                        onChange={(e) => setFormData({ ...formData, mother_phone: e.target.value })}
                        placeholder="+255 XXX XXX XXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number_of_children">Number of Children</Label>
                      <Input
                        id="number_of_children"
                        type="number"
                        min="0"
                        value={formData.number_of_children}
                        onChange={(e) => setFormData({ ...formData, number_of_children: e.target.value })}
                        placeholder="0"
                      />
                    </div>

                    {/* Relatives Information */}
                    <div className="col-span-2 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Relatives Information</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newRelatives = [...(formData.relatives || []), { name: "", relationship: "", phone: "" }];
                            setFormData({ ...formData, relatives: newRelatives });
                          }}
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Relative
                        </Button>
                      </div>
                      {formData.relatives && formData.relatives.length > 0 ? (
                        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                          {formData.relatives.map((relative: any, index: number) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-background rounded-lg border">
                              <div className="col-span-4 space-y-1">
                                <Label htmlFor={`relative-name-${index}`} className="text-xs">Name</Label>
                                <Input
                                  id={`relative-name-${index}`}
                                  value={relative.name || ""}
                                  onChange={(e) => {
                                    const newRelatives = [...formData.relatives];
                                    newRelatives[index] = { ...newRelatives[index], name: e.target.value };
                                    setFormData({ ...formData, relatives: newRelatives });
                                  }}
                                  placeholder="Relative name"
                                  className="h-9"
                                />
                              </div>
                              <div className="col-span-3 space-y-1">
                                <Label htmlFor={`relative-relationship-${index}`} className="text-xs">Relationship</Label>
                                <Input
                                  id={`relative-relationship-${index}`}
                                  value={relative.relationship || ""}
                                  onChange={(e) => {
                                    const newRelatives = [...formData.relatives];
                                    newRelatives[index] = { ...newRelatives[index], relationship: e.target.value };
                                    setFormData({ ...formData, relatives: newRelatives });
                                  }}
                                  placeholder="e.g., Brother"
                                  className="h-9"
                                />
                              </div>
                              <div className="col-span-4 space-y-1">
                                <Label htmlFor={`relative-phone-${index}`} className="text-xs">Phone</Label>
                                <Input
                                  id={`relative-phone-${index}`}
                                  value={relative.phone || ""}
                                  onChange={(e) => {
                                    const newRelatives = [...formData.relatives];
                                    newRelatives[index] = { ...newRelatives[index], phone: e.target.value };
                                    setFormData({ ...formData, relatives: newRelatives });
                                  }}
                                  placeholder="+255 XXX XXX XXX"
                                  className="h-9"
                                />
                              </div>
                              <div className="col-span-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newRelatives = formData.relatives.filter((_: any, i: number) => i !== index);
                                    setFormData({ ...formData, relatives: newRelatives });
                                  }}
                                  className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border rounded-lg p-4 bg-muted/30 text-center text-sm text-muted-foreground">
                          No relatives added. Click "Add Relative" to add one.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { 
                    setShowForm(false); 
                    setEditUser(null); 
                    setSelectedSubjects([]);
                    setPassportPicture(null);
                    setPassportPreview(null);
                    setCurrentPassportUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                    setFormData({ 
                      name: "", 
                      email: "", 
                      role: "", 
                      phone: "", 
                      department: "", 
                      password: "", 
                      course_id: selectedCourse ? selectedCourse.id.toString() : "",
                      date_of_birth: "",
                      gender: "",
                      tribe: "",
                      religion: "",
                      blood_group: "",
                      national_id: "",
                      birth_region: "",
                      birth_district: "",
                      birth_street: "",
                      phone_2: "",
                      profession: "",
                      university: "",
                      employment: "",
                      other_education_level: "",
                      other_education_university: "",
                      skills: [],
                      marital_status: "",
                      spouse_name: "",
                      spouse_phone: "",
                      father_name: "",
                      father_phone: "",
                      mother_name: "",
                      mother_phone: "",
                      number_of_children: "",
                      relatives: [],
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-military"
                  disabled={formData.role === 'instructor' && selectedSubjects.length === 0}
                >
                  {editUser ? "Update User" : "Register User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* View Passport Picture Dialog */}
      <Dialog open={showPassportDialog} onOpenChange={setShowPassportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Passport Picture</DialogTitle>
            <DialogDescription>
              {viewingPassportUser?.name}'s passport size photo
            </DialogDescription>
          </DialogHeader>
          {viewingPassportUser && (
            <div className="space-y-4">
              {viewingPassportUser.passport_picture ? (
                <>
                  <div className="flex justify-center">
                    <img 
                      src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/storage/${viewingPassportUser.passport_picture}`}
                      alt={`${viewingPassportUser.name}'s passport picture`}
                      className="max-w-full h-auto rounded-lg border-2 border-gray-300 shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        (e.target as HTMLImageElement).alt = 'Image not found';
                      }}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-semibold">{viewingPassportUser.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {viewingPassportUser.user_id || viewingPassportUser.email}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="flex justify-center">
                    <Image className="w-16 h-16 text-muted-foreground opacity-50" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">No Passport Picture</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {viewingPassportUser.name} doesn't have a passport picture uploaded yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      You can upload one by editing the user.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                {viewingPassportUser.passport_picture && (
                  <Button 
                    variant="outline"
                    onClick={handleDownloadPassport}
                    className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save Picture
                  </Button>
                )}
                <Button onClick={() => setShowPassportDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog */}
      {canCreateUsers && (
        <Dialog open={showExcelDialog} onOpenChange={setShowExcelDialog}>
          <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Users from Excel</DialogTitle>
                <DialogDescription>
                  {selectedCourse 
                    ? `Upload a filled Excel file to import multiple users to ${selectedCourse.name}.`
                    : "Upload a filled Excel file to import multiple users at once."}
                </DialogDescription>
              </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-semibold">Download Template</p>
                    <p className="text-sm text-muted-foreground">Get the Excel template with example data</p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="excel-file">Select Excel File</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                />
                {excelFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {excelFile.name}
                  </p>
                )}
              </div>

              {isSuperAdmin && courses.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="course-select">Assign to Course {selectedCourse ? "(Selected)" : "(Optional)"}</Label>
                  <Select 
                    value={selectedCourse?.id.toString() || "none"} 
                    onValueChange={(value) => {
                      if (value === "none") {
                        setSelectedCourse(null);
                      } else {
                        const course = courses.find(c => c.id.toString() === value);
                        setSelectedCourse(course || null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCourse ? `Selected: ${selectedCourse.name}` : "Select course (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name} {course.code && `(${course.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCourse && (
                    <p className="text-xs text-primary font-medium">
                      ✓ Users will be imported to: <strong>{selectedCourse.name}</strong>
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowExcelDialog(false);
                    setExcelFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleExcelUpload}
                  disabled={!excelFile || isUploading}
                  className="bg-gradient-military"
                >
                  {isUploading ? "Uploading..." : "Import Users"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RegisterUsers;
