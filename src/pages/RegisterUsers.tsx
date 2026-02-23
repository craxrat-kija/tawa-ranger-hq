import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, subjectsApi, coursesApi, apiRequest } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Trash2, UserPlus, Download, Upload, Search, BookOpen, Users, X, ChevronRight, ChevronLeft, FileSpreadsheet, Image, Camera, Eye, Plus, User, FileText, Trash, Filter, MoreVertical, LayoutGrid, List, GraduationCap, Shield, PlusCircle, ChevronDown, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  all_courses?: { id: number; name: string; code: string }[];
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
  const [roleFilter, setRoleFilter] = useState("all");
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

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, selectedCourse]);

  // Handle loading users with a slight debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) loadUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [user, selectedCourse, searchQuery, roleFilter]);

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
        all_courses: u.all_courses || [],
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

  // Filtered users based on search, selected course, AND role
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (selectedCourse && isSuperAdmin) {
      filtered = filtered.filter(u => u.course_id === selectedCourse.id);
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(u => u.role === roleFilter);
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
  }, [users, selectedCourse, searchQuery, roleFilter, isSuperAdmin]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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
            title: response?.message?.includes('Existing') ? "Existing User Enrolled" : "User Registered",
            description: response?.message || `${formData.name} has been registered successfully. User ID: ${userId}`,
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
    switch (role) {
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
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="mt-4 text-lg font-medium text-muted-foreground transition-all">Loading management portal...</p>
        </div>
      </div>
    );
  }

  const roleCounts = {
    all: filteredUsers.length,
    admin: users.filter(u => u.role === 'admin' && (!selectedCourse || u.course_id === selectedCourse.id)).length,
    instructor: users.filter(u => u.role === 'instructor' && (!selectedCourse || u.course_id === selectedCourse.id)).length,
    doctor: users.filter(u => u.role === 'doctor' && (!selectedCourse || u.course_id === selectedCourse.id)).length,
    trainee: users.filter(u => u.role === 'trainee' && (!selectedCourse || u.course_id === selectedCourse.id)).length,
  };

  const statItems = [
    { label: "Total Staff & Trainees", count: users.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Instructors", count: users.filter(u => u.role === 'instructor').length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Trainees", count: users.filter(u => u.role === 'trainee').length, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Admin & Medical", count: users.filter(u => u.role === 'admin' || u.role === 'doctor').length, icon: Shield, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Users className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">System Administration</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            {isSuperAdmin
              ? "Comprehensive control over all accounts across the TAWA training ecosystem. Monitor, edit, and manage system-wide access."
              : "Manage and oversee instructor, doctor, and trainee accounts within your assigned training course."}
          </p>
        </div>

        {!selectedCourse && isSuperAdmin && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="hidden md:flex border-green-600/20 text-green-700 hover:bg-green-50 hover:text-green-800 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Excel Template
            </Button>
            <Button
              onClick={() => setShowExcelDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm bg-card hover:shadow-md transition-shadow overflow-hidden group">
            <div className={`h-1 w-full ${stat.bg.replace('/10', '')}`} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-1 tracking-tighter">{stat.count}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Super Admin Course Cards View */}
      {isSuperAdmin && !selectedCourse && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-primary" />
              Active Training Courses
            </h2>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button variant="ghost" size="sm" className="bg-background shadow-sm h-8 px-3">
                <LayoutGrid className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-muted-foreground opacity-50 cursor-not-allowed">
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(usersByCourse).map(([courseId, { course, users: courseUsers }]) => {
              const counts = getRoleCounts(courseUsers);

              return (
                <Card
                  key={courseId}
                  className="relative group hover:ring-2 hover:ring-primary/40 transition-all duration-300 shadow-sm hover:shadow-xl border-t-0 animate-in slide-in-from-bottom-2"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40 rounded-t-xl" />

                  <CardHeader
                    className="pb-4 cursor-pointer"
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{course.name}</CardTitle>
                        <Badge variant="secondary" className="font-mono text-[10px] letter-spacing-widest">
                          {course.code || "NO-CODE"}
                        </Badge>
                      </div>
                      <div className="p-2 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-dashed">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Enrolled Staff</span>
                      </div>
                      <span className="text-lg font-bold">{courseUsers.length}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {['admin', 'instructor', 'doctor', 'trainee'].map((role) => {
                        const count = counts[role as keyof typeof counts] || 0;
                        return (
                          <TooltipProvider key={role}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-center p-2 bg-muted/20 rounded-lg border border-transparent hover:border-border transition-colors">
                                  <div className={`w-2 h-2 rounded-full mb-1 ${role === 'admin' ? 'bg-red-500' :
                                    role === 'instructor' ? 'bg-blue-500' :
                                      role === 'doctor' ? 'bg-green-500' : 'bg-purple-500'
                                    }`} />
                                  <span className="text-xs font-bold">{count}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent><p className="capitalize">{role}s</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between hover:bg-primary/5 hover:text-primary transition-colors">
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Course Actions
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setSelectedCourse(course)}>
                          <Eye className="w-4 h-4 mr-2" /> View Course Portal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedCourse(course);
                          setEditUser(null);
                          setFormData({ name: "", email: "", role: "", phone: "", department: "", password: "", course_id: course.id.toString() });
                          setSelectedSubjects([]);
                          setShowForm(true);
                        }}>
                          <UserPlus className="w-4 h-4 mr-2" /> Add Single User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedCourse(course);
                          setShowExcelDialog(true);
                        }}>
                          <Upload className="w-4 h-4 mr-2" /> Import Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadTemplate} className="text-green-600">
                          <Download className="w-4 h-4 mr-2" /> Excel Template
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail View (Selected Course) */}
      {(selectedCourse || !isSuperAdmin) && (
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-1 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />

          <div className="p-6 space-y-6">
            {/* Context Navigation (Super Admin) */}
            {isSuperAdmin && selectedCourse && (
              <div className="flex items-center gap-4 border-b pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCourse(null)}
                  className="hover:bg-primary/10 text-primary"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  All Courses
                </Button>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary border-none">{selectedCourse.code || "CS"}</Badge>
                  <h2 className="text-lg font-bold">{selectedCourse.name}</h2>
                </div>
              </div>
            )}

            {/* Filter Tabs and Actions Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
              <Tabs defaultValue="all" value={roleFilter} onValueChange={setRoleFilter} className="w-full xl:w-auto">
                <TabsList className="bg-muted/50 p-1 h-12 w-full sm:w-auto justify-start border overflow-x-auto no-scrollbar">
                  <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 h-9">
                    All Roles <Badge variant="secondary" className="ml-2 bg-muted">{users.filter(u => !selectedCourse || u.course_id === selectedCourse.id).length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="data-[state=active]:bg-background data-[state=active]:text-red-600 px-4 h-9">
                    Admins <Badge variant="secondary" className="ml-2 text-red-600">{roleCounts.admin}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="instructor" className="data-[state=active]:bg-background data-[state=active]:text-blue-600 px-4 h-9">
                    Instructors <Badge variant="secondary" className="ml-2 text-blue-600">{roleCounts.instructor}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="doctor" className="data-[state=active]:bg-background data-[state=active]:text-green-600 px-4 h-9">
                    Medical <Badge variant="secondary" className="ml-2 text-green-600">{roleCounts.doctor}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="trainee" className="data-[state=active]:bg-background data-[state=active]:text-purple-600 px-4 h-9">
                    Trainees <Badge variant="secondary" className="ml-2 text-purple-600">{roleCounts.trainee}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                <div className="relative flex-1 sm:min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, ID or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-11 bg-muted/30 border-none focus-visible:ring-1 hover:bg-muted/50 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-11 px-4 border-dashed hover:border-primary hover:text-primary transition-all"
                    onClick={() => setShowExcelDialog(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <Button
                    className="h-11 px-6 bg-primary shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Users Table */}
            <div className="rounded-xl border bg-background/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[300px] py-4">Full Identity</TableHead>
                    <TableHead className="py-4 font-semibold">User Access ID</TableHead>
                    <TableHead className="py-4 font-semibold">Contact Details</TableHead>
                    <TableHead className="py-4 font-semibold">Operational Unit</TableHead>
                    {isSuperAdmin && <TableHead className="py-4 font-semibold">Course Enrollments</TableHead>}
                    <TableHead className="text-right py-4 font-bold pr-6">Status & Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-10 h-10 animate-spin text-primary" />
                          <p className="text-muted-foreground animate-pulse">Synchronizing user data...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="p-4 bg-muted rounded-full">
                            <Search className="w-10 h-10 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold">No Staff Found</h4>
                            <p className="text-muted-foreground mt-1 text-sm max-w-xs mx-auto">
                              We couldn't find any user profiles matching your current filters or search query.
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setRoleFilter("all") }}>
                            Reset All Filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (
                      <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                              <AvatarImage src={user.passport_picture} />
                              <AvatarFallback className={getRoleColor(user.role)}>
                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-base tracking-tight">{user.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">{user.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-5 font-mono text-sm tracking-tighter">
                          <Badge variant="outline" className="font-mono bg-muted/20 border-none px-3 py-1">
                            {user.user_id || user.id}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-5">
                          <div className="flex flex-col text-sm">
                            <span className="font-medium underline decoration-primary/30 underline-offset-4">{user.phone || "No Phone"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <Badge variant="secondary" className="bg-muted text-foreground/80 font-semibold px-2">
                            {user.department || "N/A"}
                          </Badge>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="py-5">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {user.all_courses && user.all_courses.length > 0 ? (
                                user.all_courses.map((c, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-[10px] bg-primary/5 text-primary border-primary/20 whitespace-nowrap"
                                  >
                                    {c.code || "CS"}: {c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground italic">None Assigned</span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="py-5 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            {user.passport_picture && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewPassport(user)}
                                      className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Documents</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => handleEdit(user)}>
                                  <Edit className="w-4 h-4 mr-2" /> Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}/profile`)}>
                                  <User className="w-4 h-4 mr-2" /> View Detailed Page
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDelete(user.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Terminate Access
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Design */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t px-2 text-sm">
                <p className="text-muted-foreground">
                  Showing <span className="font-bold text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-foreground">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-bold text-foreground">{filteredUsers.length}</span> results
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>

                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(num => num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1))
                      .map((num, idx, arr) => (
                        <React.Fragment key={num}>
                          {idx > 0 && arr[idx - 1] !== num - 1 && <span className="px-2">...</span>}
                          <Button
                            variant={currentPage === num ? "default" : "ghost"}
                            size="sm"
                            className="h-9 w-9 p-0 font-bold transition-all"
                            onClick={() => setCurrentPage(num)}
                          >
                            {num}
                          </Button>
                        </React.Fragment>
                      ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-4"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
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
