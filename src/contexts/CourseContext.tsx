import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import React from "react";
import { useAuth } from "./AuthContext";

interface Course {
  id: number;
  name: string;
  type?: string;
  duration?: string;
  status?: "active" | "completed" | "upcoming";
  description?: string;
  code?: string;
  instructor?: any;
}

interface CourseContextType {
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course | null) => void;
  isCourseSelected: boolean;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCourse, setSelectedCourseState] = useState<Course | null>(null);
  const { user } = useAuth();

  // Load selected course from localStorage on mount
  useEffect(() => {
    const savedCourse = localStorage.getItem('selected_course');
    if (savedCourse) {
      try {
        setSelectedCourseState(JSON.parse(savedCourse));
      } catch (error) {
        console.error('Error loading saved course:', error);
      }
    }
  }, []);

  // Auto-select course if none selected and user has only one course
  useEffect(() => {
    if (!selectedCourse && user?.enrolled_courses) {
      if (user.enrolled_courses.length === 1) {
        const course = user.enrolled_courses[0];
        setSelectedCourse(course as any);
      }
    }
  }, [user, selectedCourse]);

  const setSelectedCourse = (course: Course | null) => {
    setSelectedCourseState(course);
    if (course) {
      localStorage.setItem('selected_course', JSON.stringify(course));
      localStorage.setItem('active_course_id', course.id.toString());
    } else {
      localStorage.removeItem('selected_course');
      localStorage.removeItem('active_course_id');
    }
  };

  return (
    <CourseContext.Provider
      value={{
        selectedCourse,
        setSelectedCourse,
        isCourseSelected: !!selectedCourse
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};

