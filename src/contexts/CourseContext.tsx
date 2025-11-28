import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import React from "react";

interface Course {
  id: number;
  name: string;
  type: string;
  duration: string;
  status: "active" | "completed" | "upcoming";
  description?: string;
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

  const setSelectedCourse = (course: Course | null) => {
    setSelectedCourseState(course);
    if (course) {
      localStorage.setItem('selected_course', JSON.stringify(course));
    } else {
      localStorage.removeItem('selected_course');
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

