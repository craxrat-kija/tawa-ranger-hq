const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
const apiRequest = async <T>(
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
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    // Handle Laravel validation errors
    if (error.errors) {
      const errorMessages = Object.values(error.errors).flat().join(', ');
      throw new Error(errorMessages || error.message || `HTTP error! status: ${response.status}`);
    }
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  // Return data.data if it exists (Laravel wrapped response), otherwise return data
  return data.data || data;
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || data.errors?.email?.[0] || `HTTP error! status: ${response.status}`);
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
    const response = await apiRequest<any>('/user');
    // Handle response structure - backend returns { success: true, data: { user: ... } }
    // apiRequest returns data.data || data, so response could be { user: ... } or just user object
    if (response.user) {
      return response.user;
    }
    return response;
  },
};

// Users API
export const usersApi = {
  getAll: async (role?: string) => {
    const endpoint = role ? `/users?role=${role}` : '/users';
    const response = await apiRequest<any>(endpoint);
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
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
    return response;
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
    const response = await apiRequest<any[]>('/medical-reports');
    return response;
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
};

// Materials API
export const materialsApi = {
  getAll: async (subject?: string, type?: string, search?: string) => {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (type) params.append('type', type);
    if (search) params.append('search', search);
    const endpoint = params.toString() ? `/materials?${params}` : '/materials';
    const response = await apiRequest<any>(endpoint);
    // Handle both array and object responses
    return Array.isArray(response) ? response : (response?.data || []);
  },

  getById: async (id: string) => {
    const response = await apiRequest<any>(`/materials/${id}`);
    return response;
  },

  create: async (file: File, name: string, subject: string) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('subject', subject);

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/materials`, {
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
  getAll: async () => {
    const response = await apiRequest<any>('/gallery');
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
  getAll: async (day?: string) => {
    const endpoint = day ? `/timetable?day=${day}` : '/timetable';
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
  getAll: async (instructorId?: string) => {
    const endpoint = instructorId ? `/subjects?instructor_id=${instructorId}` : '/subjects';
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
  getAll: async (instructorId?: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (instructorId) params.append('instructor_id', instructorId);
    if (subjectId) params.append('subject_id', subjectId);
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
  getAll: async (assessmentId?: string, traineeId?: string, instructorId?: string) => {
    const params = new URLSearchParams();
    if (assessmentId) params.append('assessment_id', assessmentId);
    if (traineeId) params.append('trainee_id', traineeId);
    if (instructorId) params.append('instructor_id', instructorId);
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

