const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

// Get auth token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// API request helper
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorData: any = null;
    try {
      errorData = await response.json();
    // Handle Laravel validation errors
      if (errorData.errors) {
        const errorMessages = Object.values(errorData.errors).flat().join(', ');
        errorMessage = errorMessages || errorData.message || errorMessage;
      } else {
        errorMessage = errorData.message || errorMessage;
      }
    } catch (e) {
      errorMessage = `HTTP error! status: ${response.status}`;
    }
    const error = new Error(errorMessage);
    (error as any).response = {
      status: response.status,
      data: errorData,
    };
    throw error;
  }

  const data = await response.json();
  // Return data.data if it exists (Laravel wrapped response), otherwise return data
  return data.data || data;
};

// Auth API
export const authApi = {
  login: async (userId: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || data.errors?.user_id?.[0] || data.errors?.email?.[0] || `HTTP error! status: ${response.status}`);
        (error as any).response = { data };
        throw error;
      }

      // Handle both wrapped and unwrapped responses
      if (data.data) {
        return data.data;
      }
      return data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      throw new Error(error.message || 'Failed to login');
    }
  },

  superAdminLogin: async (userId: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/super-admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || data.errors?.user_id?.[0] || data.errors?.email?.[0] || `HTTP error! status: ${response.status}`);
        (error as any).response = { data };
        throw error;
      }

      // Handle both wrapped and unwrapped responses
      if (data.data) {
        return data.data;
      }
      return data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      throw new Error(error.message || 'Failed to login');
    }
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    department?: string;
  }) => {
    const response = await apiRequest<{ user: any; token: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  },

  logout: async () => {
    await apiRequest('/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async () => {
    try {
    const response = await apiRequest<any>('/user');
    // Handle response structure - backend returns { success: true, data: { user: ... } }
    // apiRequest returns data.data || data, so response could be { user: ... } or just user object
      if (response && typeof response === 'object') {
    if (response.user) {
          return { user: response.user };
        }
        // If response itself is the user object
        if (response.id) {
          return { user: response };
        }
    }
    return response;
    } catch (error: any) {
      // Re-throw with more context
      if (error.message) {
        throw error;
      }
      throw new Error('Failed to get current user');
    }
  },
};

// Users API
export const usersApi = {
  getAll: async (roleOrParams?: string | { role?: string; course_id?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    
    // Support both old signature (string for role) and new signature (object with params)
    if (typeof roleOrParams === 'string') {
      // Old signature: usersApi.getAll('trainee')
      queryParams.append('role', roleOrParams);
    } else if (roleOrParams && typeof roleOrParams === 'object') {
      // New signature: usersApi.getAll({ role: 'trainee', course_id: 1 })
      if (roleOrParams.role) queryParams.append('role', roleOrParams.role);
      if (roleOrParams.course_id) queryParams.append('course_id', roleOrParams.course_id.toString());
      if (roleOrParams.search) queryParams.append('search', roleOrParams.search);
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    const response = await apiRequest<any>(endpoint);
    // Handle both array and object responses
    if (Array.isArray(response)) {
      return response;
    }
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/users/${id}`);
    // Handle response structure - backend returns { success: true, data: { ... } }
    // apiRequest returns data.data || data, so response could be user object or { user: ... }
    if (response.user) {
      return response.user;
    }
    return response;
  },

  create: async (userData: {
    name: string;
    email: string;
    password?: string;
    role: string;
    phone?: string;
    department?: string;
    subject_ids?: number[];
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || `HTTP error! status: ${response.status}`);
        (error as any).response = { data };
        throw error;
      }

      return data.data || data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      throw new Error(error.message || 'Failed to create user');
    }
  },

  update: async (id: string, userData: Partial<{
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string;
    department: string;
    subject_ids?: number[];
  }>) => {
    const response = await apiRequest<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response;
  },

  delete: async (id: string) => {
    await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  downloadTemplate: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/users/template/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to download template');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  importFromExcel: async (file: File, courseId?: number) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('users_file', file);
    if (courseId !== undefined && courseId !== null) {
      formData.append('course_id', courseId.toString());
    }
    
    const response = await fetch(`${API_BASE_URL}/users/import/excel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || `HTTP error! status: ${response.status}`);
      (error as any).response = { data };
      throw error;
    }
    
    return data;
  },
};

// Patients API
export const patientsApi = {
  getAll: async () => {
    const response = await apiRequest<any>('/patients');
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/patients/${id}`);
    // Handle response structure: { success: true, data: {...} } or just {...}
    if (response && typeof response === 'object' && 'data' in response) {
      return response;
    }
    return { data: response };
  },

  create: async (patientData: any) => {
    const response = await apiRequest<any>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
    return response;
  },

  update: async (id: string, patientData: any) => {
    const response = await apiRequest<any>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
    return response;
  },

  delete: async (id: string) => {
    await apiRequest(`/patients/${id}`, {
      method: 'DELETE',
    });
  },
};

// Medical Reports API
export const medicalReportsApi = {
  getAll: async () => {
    const response = await apiRequest<any>('/medical-reports');
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  create: async (reportData: any) => {
    const response = await apiRequest<any>('/medical-reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
    return response;
  },
};

// Attendance Records API
export const attendanceApi = {
  getAll: async () => {
    const response = await apiRequest<any>('/attendance-records');
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  create: async (attendanceData: any) => {
    const response = await apiRequest<any>('/attendance-records', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
    return response;
  },
};

// Medical Records API
export const medicalRecordsApi = {
  getAll: async (params?: { user_id?: string; latest?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.latest) queryParams.append('latest', 'true');
    const queryString = queryParams.toString();
    const endpoint = `/medical-records${queryString ? `?${queryString}` : ''}`;
    const response = await apiRequest<any>(endpoint);
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/medical-records/${id}`);
    if (response && typeof response === 'object' && 'data' in response) {
      return response;
    }
    return { data: response };
  },

  getLatestByUser: async (userId: string) => {
    const response = await apiRequest<any>(`/medical-records/user/${userId}/latest`);
    if (response && typeof response === 'object' && 'data' in response) {
      return response;
    }
    return { data: response };
  },

  create: async (recordData: any) => {
    const response = await apiRequest<any>('/medical-records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
    return response;
  },

  update: async (id: string, recordData: any) => {
    const response = await apiRequest<any>(`/medical-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
    return response;
  },

  delete: async (id: string) => {
    await apiRequest(`/medical-records/${id}`, {
      method: 'DELETE',
    });
  },
};

// Courses API
export const coursesApi = {
  getAll: async (status?: string, instructorId?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (instructorId) params.append('instructor_id', instructorId.toString());
    const endpoint = params.toString() ? `/courses?${params}` : '/courses';
    const response = await apiRequest<any>(endpoint);
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/courses/${id}`);
    // Handle response structure: { success: true, data: {...} } or just {...}
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    return response;
  },

  create: async (courseData: {
    name: string;
    type: string;
    duration: string;
    instructor_id?: number;
    start_date: string;
    status?: 'active' | 'completed' | 'upcoming';
    description?: string;
    content?: string;
  }) => {
    const response = await apiRequest<any>('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
    return response;
  },

  update: async (id: string, courseData: Partial<{
    name: string;
    type: string;
    duration: string;
    instructor_id: number;
    start_date: string;
    status: 'active' | 'completed' | 'upcoming';
    description: string;
    content: string;
    trainees: number;
  }>) => {
    const response = await apiRequest<any>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
    return response;
  },

  delete: async (id: string) => {
    await apiRequest(`/courses/${id}`, {
      method: 'DELETE',
    });
  },

  enroll: async (courseId: string) => {
    const response = await apiRequest<any>(`/courses/${courseId}/enroll`, {
      method: 'POST',
    });
    return response;
  },

  unenroll: async (courseId: string) => {
    const response = await apiRequest<any>(`/courses/${courseId}/unenroll`, {
      method: 'POST',
    });
    return response;
  },

  getMyCourses: async () => {
    const response = await apiRequest<any>('/courses/my/enrolled');
    // Handle response structure: { success: true, data: [...] } or just [...]
    if (response && typeof response === 'object') {
      if (Array.isArray(response)) {
        return response;
      }
      if ('data' in response && Array.isArray(response.data)) {
        return response.data;
      }
    }
    return [];
  },

  getAvailableCourses: async () => {
    const response = await apiRequest<any>('/courses/available');
    return Array.isArray(response) ? response : (response?.data || []);
  },

  enrollUser: async (courseId: string, userId: string) => {
    const response = await apiRequest<any>(`/courses/${courseId}/enroll-user/${userId}`, {
      method: 'POST',
    });
    return response;
  },

  unenrollUser: async (courseId: string, userId: string) => {
    const response = await apiRequest<any>(`/courses/${courseId}/unenroll-user/${userId}`, {
      method: 'POST',
    });
    return response;
  },

  getEnrolledUsers: async (courseId: string) => {
    const response = await apiRequest<any>(`/courses/${courseId}/enrolled-users`);
    // Handle response structure: { success: true, data: [...] } or just [...]
    if (response && typeof response === 'object' && 'data' in response) {
      return Array.isArray(response.data) ? response.data : [];
    }
    return Array.isArray(response) ? response : [];
  },
};

// Materials API
export const materialsApi = {
  getAll: async (subject?: string, type?: string, search?: string, courseId?: number) => {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (type) params.append('type', type);
    if (search) params.append('search', search);
    if (courseId) params.append('course_id', courseId.toString());
    const endpoint = params.toString() ? `/materials?${params}` : '/materials';
    const response = await apiRequest<any>(endpoint);
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/materials/${id}`);
    return response;
  },

  create: async (file: File, name: string, subject: string, courseId: number) => {
    // Validate inputs
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided');
    }
    
    if (!subject || !subject.trim()) {
      throw new Error('Subject is required');
    }

    const token = getToken();
    const formData = new FormData();
    
    // Ensure name is not empty - use file name if name is empty or whitespace
    const materialName = (name && name.trim()) || file.name;
    
    // Final validation - ensure we have a name
    if (!materialName || !materialName.trim()) {
      throw new Error('Material name is required');
    }
    
    // Append file - make sure it's the actual File object
    formData.append('file', file, file.name);
    formData.append('name', materialName);
    formData.append('subject', subject.trim());
    // Note: course_id is not needed in the request as backend gets it from user's course assignment
    // But we'll keep it for potential future use
    formData.append('course_id', courseId.toString());

    // Debug logging - verify FormData contents
    console.log('Uploading material:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      name: materialName,
      subject: subject.trim(),
      courseId: courseId,
      hasToken: !!token,
      apiUrl: `${API_BASE_URL}/materials`,
    });

    // Verify FormData has the file
    if (!formData.has('file')) {
      throw new Error('File was not added to FormData');
    }

    const headers: HeadersInit = {
      'Accept': 'application/json',
      // DO NOT set Content-Type - browser will set it with boundary for multipart/form-data
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
    const response = await fetch(`${API_BASE_URL}/materials`, {
      method: 'POST',
      headers,
      body: formData,
    });

      // Log response status
      console.log('Upload response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = 'An error occurred';
        let errorData: any = null;
        
      try {
          const responseText = await response.text();
          console.error('Error response text:', responseText);
          
          if (responseText) {
            errorData = JSON.parse(responseText);
            console.error('Material upload error response:', errorData);
          }
          
          if (errorData) {
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors) {
              // Laravel validation errors - format them nicely
              const errorMessages = Object.entries(errorData.errors).map(([field, messages]) => {
                const msgArray = Array.isArray(messages) ? messages : [messages];
                return `${field}: ${msgArray.join(', ')}`;
              });
              errorMessage = errorMessages.join('; ');
        } else if (errorData.error) {
          errorMessage = errorData.error;
            }
          } else {
            errorMessage = `HTTP error! status: ${response.status} ${response.statusText}`;
        }
      } catch (e) {
          console.error('Failed to parse error response:', e);
          errorMessage = `HTTP error! status: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
      console.log('Upload success:', data);
    return data.data || data;
    } catch (error: any) {
      // Re-throw if it's already our formatted error
      if (error instanceof Error && error.message !== 'An error occurred') {
        throw error;
      }
      // Otherwise wrap in a more descriptive error
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  },

  download: async (id: string) => {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/materials/${id}/download`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const contentDisposition = response.headers.get('content-disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : 'download';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  delete: async (id: string) => {
    await apiRequest(`/materials/${id}`, {
      method: 'DELETE',
    });
  },
};

// Gallery API
export const galleryApi = {
  getAll: async (params?: { search?: string }) => {
    const queryString = params && params.search ? `?search=${encodeURIComponent(params.search)}` : '';
    const response = await apiRequest<any>(`/gallery${queryString}`);
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/gallery/${id}`);
    return response;
  },

  create: async (file: File, title: string) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/gallery`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors) {
          // Laravel validation errors
          const errorMessages = Object.values(errorData.errors).flat();
          errorMessage = errorMessages.join(', ');
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        errorMessage = `HTTP error! status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data || data;
  },

  delete: async (id: string) => {
    await apiRequest(`/gallery/${id}`, {
      method: 'DELETE',
    });
  },
};

// Timetable API
export const timetableApi = {
  getAll: async (day?: string, courseId?: number) => {
    const params = new URLSearchParams();
    if (day) params.append('day', day);
    if (courseId) params.append('course_id', courseId.toString());
    const endpoint = params.toString() ? `/timetable?${params}` : '/timetable';
    const response = await apiRequest<any>(endpoint);
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/timetable/${id}`);
    return response;
  },

  create: async (timetableData: {
    date: string;
    time: string;
    subject: string;
    instructor: string;
    location: string;
    course_id: number;
  }) => {
    const response = await apiRequest<any>('/timetable', {
      method: 'POST',
      body: JSON.stringify(timetableData),
    });
    return response;
  },

  update: async (id: string, timetableData: Partial<{
    date: string;
    time: string;
    subject: string;
    instructor: string;
    location: string;
  }>) => {
    const response = await apiRequest<any>(`/timetable/${id}`, {
      method: 'PUT',
      body: JSON.stringify(timetableData),
    });
    return response;
  },

  delete: async (id: string) => {
    await apiRequest(`/timetable/${id}`, {
      method: 'DELETE',
    });
  },
};

// Messages API (Chat Board)
export const messagesApi = {
  getAll: async () => {
    const response = await apiRequest<any>('/messages');
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/messages/${id}`);
    return response;
  },

  create: async (messageData: {
    message: string;
  }) => {
    const response = await apiRequest<any>('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
    return response;
  },

  update: async (id: string, messageData: {
    message: string;
  }) => {
    const response = await apiRequest<any>(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(messageData),
    });
    return response;
  },

  delete: async (id: string) => {
    await apiRequest(`/messages/${id}`, {
      method: 'DELETE',
    });
  },
};

// Subjects API
export const subjectsApi = {
  getAll: async (instructorId?: string, courseId?: number, searchParams?: { search?: string }) => {
    const params = new URLSearchParams();
    if (instructorId) params.append('instructor_id', instructorId);
    if (courseId) params.append('course_id', courseId.toString());
    if (searchParams?.search) params.append('search', searchParams.search);
    const endpoint = params.toString() ? `/subjects?${params}` : '/subjects';
    const response = await apiRequest<any>(endpoint);
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/subjects/${id}`);
    return response;
  },

  create: async (subjectData: {
    name: string;
    code?: string;
    description?: string;
    course_id: number;
  }) => {
    const response = await apiRequest<any>('/subjects', {
      method: 'POST',
      body: JSON.stringify(subjectData),
    });
    return response;
  },

  update: async (id: string, subjectData: Partial<{
    name: string;
    code?: string;
    description?: string;
  }>) => {
    const response = await apiRequest<any>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subjectData),
    });
    return response;
  },

  delete: async (id: string) => {
    await apiRequest(`/subjects/${id}`, {
      method: 'DELETE',
    });
  },
};

// Assessments API
export const assessmentsApi = {
  getAll: async (instructorId?: string, subjectId?: string, courseId?: number) => {
    const params = new URLSearchParams();
    if (instructorId) params.append('instructor_id', instructorId);
    if (subjectId) params.append('subject_id', subjectId);
    if (courseId) params.append('course_id', courseId.toString());
    const endpoint = `/assessments${params.toString() ? '?' + params.toString() : ''}`;
    const response = await apiRequest<any>(endpoint);
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/assessments/${id}`);
    return response;
  },

  create: async (assessmentData: {
    subject_id: number;
    course_id: number;
    title: string;
    description?: string;
    type: 'quiz' | 'assignment' | 'exam' | 'practical' | 'project' | 'other';
    date: string;
    max_score: number;
    weight?: number;
  }) => {
    const response = await apiRequest<any>('/assessments', {
      method: 'POST',
      body: JSON.stringify(assessmentData),
    });
    return response;
  },

  update: async (id: string, assessmentData: Partial<{
    subject_id: number;
    title: string;
    description?: string;
    type: 'quiz' | 'assignment' | 'exam' | 'practical' | 'project' | 'other';
    date: string;
    max_score: number;
    weight?: number;
  }>) => {
    const response = await apiRequest<any>(`/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assessmentData),
    });
    return response;
  },

  delete: async (id: string) => {
    await apiRequest(`/assessments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Grades API
export const gradesApi = {
  getAll: async (assessmentId?: string, traineeId?: string, instructorId?: string, courseId?: number) => {
    const params = new URLSearchParams();
    if (assessmentId) params.append('assessment_id', assessmentId);
    if (traineeId) params.append('trainee_id', traineeId);
    if (instructorId) params.append('instructor_id', instructorId);
    if (courseId) params.append('course_id', courseId.toString());
    const endpoint = `/grades${params.toString() ? '?' + params.toString() : ''}`;
    const response = await apiRequest<any>(endpoint);
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/grades/${id}`);
    return response;
  },

  create: async (gradeData: {
    assessment_id: number;
    trainee_id: number;
    score: number;
    comments?: string;
  }) => {
    const response = await apiRequest<any>('/grades', {
      method: 'POST',
      body: JSON.stringify(gradeData),
    });
    return response;
  },

  update: async (id: string, gradeData: Partial<{
    score: number;
    comments?: string;
  }>) => {
    const response = await apiRequest<any>(`/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gradeData),
    });
    return response;
  },

  delete: async (id: string) => {
    await apiRequest(`/grades/${id}`, {
      method: 'DELETE',
    });
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async () => {
    const response = await apiRequest<{ data: any[]; unread_count: number }>('/notifications');
    return response;
  },

  getUnread: async () => {
    const response = await apiRequest<any[]>('/notifications/unread');
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getCount: async () => {
    const response = await apiRequest<{ unread_count: number }>('/notifications/count');
    return response.unread_count || 0;
  },

  markAsRead: async (id: string) => {
    const response = await apiRequest<any>(`/notifications/${id}/read`, {
      method: 'POST',
    });
    return response;
  },

  markAllAsRead: async () => {
    const response = await apiRequest<any>('/notifications/read-all', {
      method: 'POST',
    });
    return response;
  },

  delete: async (id: string) => {
    await apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

// Activity Log API (Admin only)
export const activityLogApi = {
  getDoctorActivities: async (filters?: {
    type?: string;
    doctor?: string;
    course_id?: number;
    page?: number;
    per_page?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.doctor) params.append('doctor', filters.doctor);
    if (filters?.course_id) params.append('course_id', filters.course_id.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());
    
    const endpoint = `/admin/doctor-activities${params.toString() ? '?' + params.toString() : ''}`;
    const response = await apiRequest<{
      data: any[];
      pagination: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
      };
    }>(endpoint);
    return response;
  },
};

// Comments API
export const commentsApi = {
  getAll: async (commentableType: 'patient' | 'medical_report' | 'attendance_record', commentableId: number) => {
    const params = new URLSearchParams();
    params.append('commentable_type', commentableType);
    params.append('commentable_id', commentableId.toString());
    const response = await apiRequest<any[]>(`/comments?${params.toString()}`);
    return Array.isArray(response) ? response : (response?.data || []);
  },

  create: async (commentData: {
    commentable_type: 'patient' | 'medical_report' | 'attendance_record';
    commentable_id: number;
    comment: string;
  }) => {
    const response = await apiRequest<any>('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
    return response;
  },

  update: async (id: string, comment: string) => {
    const response = await apiRequest<any>(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ comment }),
    });
    return response;
  },

  delete: async (id: string) => {
    await apiRequest(`/comments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin Permissions API
export const adminPermissionsApi = {
  getAll: async () => {
    const response = await apiRequest<any>('/admin/permissions');
    // The apiRequest helper already unwraps data.data || data
    // So response should be the data array directly, or wrapped in { success: true, data: [...] }
    if (Array.isArray(response)) {
      return response;
    }
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    console.warn('Unexpected response format:', response);
    return [];
  },

  update: async (adminId: number, permissions: {
    can_manage_users?: boolean;
    can_manage_subjects?: boolean;
    can_manage_materials?: boolean;
    can_manage_gallery?: boolean;
    can_manage_timetable?: boolean;
    can_manage_reports?: boolean;
    can_manage_chat?: boolean;
    can_manage_assessments?: boolean;
    can_manage_results?: boolean;
    can_manage_activities?: boolean;
    can_view_doctor_dashboard?: boolean;
  }) => {
    const response = await apiRequest<{
      success: boolean;
      message: string;
      data: any;
    }>(`/admin/permissions/${adminId}`, {
      method: 'PUT',
      body: JSON.stringify(permissions),
    });
    return response;
  },

  getMyPermissions: async () => {
    // apiRequest already unwraps data.data || data, so response should be the permissions object directly
    const response = await apiRequest<{
      can_manage_users: boolean;
      can_manage_subjects: boolean;
      can_manage_materials: boolean;
      can_manage_gallery: boolean;
      can_manage_timetable: boolean;
      can_manage_reports: boolean;
      can_manage_chat: boolean;
      can_manage_assessments: boolean;
      can_manage_results: boolean;
      can_manage_activities: boolean;
      can_view_doctor_dashboard: boolean;
    }>('/admin/permissions/my');
    
    // If response is already the permissions object (which it should be after apiRequest unwrapping)
    if (response && typeof response === 'object' && 'can_manage_users' in response) {
      return response;
    }
    
    // If response is wrapped in data property (shouldn't happen, but handle it)
    if (response && (response as any).data && typeof (response as any).data === 'object') {
      return (response as any).data;
    }
    
    console.warn('Unexpected permissions response format:', response);
    // Return default (all false) if we can't parse
    return {
      can_manage_users: false,
      can_manage_subjects: false,
      can_manage_materials: false,
      can_manage_gallery: false,
      can_manage_timetable: false,
      can_manage_reports: false,
      can_manage_chat: false,
      can_manage_assessments: false,
      can_manage_results: false,
      can_manage_activities: false,
      can_view_doctor_dashboard: false,
    };
  },
};

// Discipline Issues API
export const disciplineIssuesApi = {
  getAll: async (params?: { user_id?: number; status?: string; severity?: string; approval_status?: string; search?: string; course_id?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.approval_status) queryParams.append('approval_status', params.approval_status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.course_id) queryParams.append('course_id', params.course_id.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/discipline-issues${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<any>(endpoint);
    if (Array.isArray(response)) {
      return response;
    }
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  get: async (id: number) => {
    const response = await apiRequest<any>(`/discipline-issues/${id}`);
    if (response && response.data) {
      return response.data;
    }
    if (response && response.success && response.data) {
      return response.data;
    }
    return response;
  },

  create: async (data: {
    user_id: number;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    incident_date: string;
    document?: File;
    course_id?: number;
  }) => {
    const formData = new FormData();
    formData.append('user_id', data.user_id.toString());
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('severity', data.severity);
    formData.append('incident_date', data.incident_date);
    if (data.document) {
      formData.append('document', data.document);
    }
    if (data.course_id) {
      formData.append('course_id', data.course_id.toString());
    }

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/discipline-issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create discipline issue');
    }

    const result = await response.json();
    return result.data || result;
  },

  update: async (id: number, data: {
    title?: string;
    description?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'pending' | 'investigating' | 'resolved' | 'dismissed';
    incident_date?: string;
    resolution_notes?: string;
    document?: File;
  }) => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.severity) formData.append('severity', data.severity);
    if (data.status) formData.append('status', data.status);
    if (data.incident_date) formData.append('incident_date', data.incident_date);
    if (data.resolution_notes !== undefined) formData.append('resolution_notes', data.resolution_notes);
    if (data.document) {
      formData.append('document', data.document);
    }
    formData.append('_method', 'PUT');

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/discipline-issues/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update discipline issue');
    }

    const result = await response.json();
    return result.data || result;
  },

  delete: async (id: number) => {
    const response = await apiRequest<any>(`/discipline-issues/${id}`, {
      method: 'DELETE',
    });
    return response;
  },

  downloadDocument: async (id: number) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/discipline-issues/${id}/document/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to download document');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const contentDisposition = response.headers.get('content-disposition');
    let fileName = 'document';
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (fileNameMatch) {
        fileName = fileNameMatch[1];
      }
    }
    
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  approve: async (id: number) => {
    const response = await apiRequest<any>(`/discipline-issues/${id}/approve`, {
      method: 'POST',
    });
    return response.data || response;
  },

  reject: async (id: number, rejectionReason: string) => {
    const response = await apiRequest<any>(`/discipline-issues/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
    return response.data || response;
  },
};

// Course Metadata API
export const courseMetadataApi = {
  getAll: async (type?: 'name' | 'course_type' | 'location' | 'course_code') => {
    const params = type ? `?type=${type}` : '';
    const response = await apiRequest<any>(`/course-metadata${params}`);
    return Array.isArray(response) ? response : (response?.data || []);
  },

  get: async (id: number) => {
    const response = await apiRequest<any>(`/course-metadata/${id}`);
    return response.data || response;
  },

  create: async (metadataData: { type: 'name' | 'course_type' | 'location'; value: string; description?: string }) => {
    const response = await apiRequest<any>('/course-metadata', {
      method: 'POST',
      body: JSON.stringify(metadataData),
    });
    return response.data || response;
  },

  update: async (id: number, metadataData: Partial<{ type: 'name' | 'course_type' | 'location'; value: string; description?: string }>) => {
    const response = await apiRequest<any>(`/course-metadata/${id}`, {
      method: 'PUT',
      body: JSON.stringify(metadataData),
    });
    return response.data || response;
  },

  delete: async (id: number) => {
    const response = await apiRequest<any>(`/course-metadata/${id}`, {
      method: 'DELETE',
    });
    return response;
  },
};

