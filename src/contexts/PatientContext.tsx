import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bloodType: string;
  allergies: string;
  medicalHistory: string;
  emergencyContact: string;
  registeredDate: string;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  date: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes: string;
  doctor: string;
  vitalSigns: {
    bloodPressure: string;
    temperature: string;
    heartRate: string;
    weight: string;
  };
}

export interface AttendanceRecord {
  id: string;
  patientId: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Excused";
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

interface PatientContextType {
  patients: Patient[];
  reports: MedicalReport[];
  attendance: AttendanceRecord[];
  addPatient: (patient: Omit<Patient, "id" | "registeredDate">) => Patient;
  addReport: (report: Omit<MedicalReport, "id">) => void;
  addAttendance: (attendance: Omit<AttendanceRecord, "id">) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: "1",
      fullName: "John Doe",
      email: "john.doe@tawa.go.tz",
      phone: "+255 712 345 678",
      bloodType: "O+",
      allergies: "Penicillin, Peanuts",
      medicalHistory: "No significant history",
      emergencyContact: "Jane Doe - +255 713 456 789",
      registeredDate: "2024-01-15",
    },
    {
      id: "2",
      fullName: "Jane Smith",
      email: "jane.smith@tawa.go.tz",
      phone: "+255 713 456 789",
      bloodType: "A-",
      allergies: "None",
      medicalHistory: "Previous ankle injury (2023)",
      emergencyContact: "John Smith - +255 714 567 890",
      registeredDate: "2024-01-20",
    },
    {
      id: "3",
      fullName: "Robert Johnson",
      email: "robert.j@tawa.go.tz",
      phone: "+255 714 567 890",
      bloodType: "B+",
      allergies: "Dust",
      medicalHistory: "Hypertension (controlled)",
      emergencyContact: "Mary Johnson - +255 715 678 901",
      registeredDate: "2024-02-01",
    },
  ]);

  const [reports, setReports] = useState<MedicalReport[]>([
    {
      id: "1",
      patientId: "1",
      date: "2025-01-25",
      diagnosis: "Minor ankle sprain",
      symptoms: "Pain and swelling in right ankle",
      treatment: "Rest, ice, compression, elevation. Ibuprofen 400mg twice daily for 5 days.",
      notes: "Patient advised to avoid strenuous activity for 1 week. Follow-up in 7 days if symptoms persist.",
      doctor: "Dr. Medical Officer",
      vitalSigns: {
        bloodPressure: "120/80",
        temperature: "98.6°F",
        heartRate: "72 bpm",
        weight: "75 kg",
      },
    },
    {
      id: "2",
      patientId: "2",
      date: "2025-01-24",
      diagnosis: "Routine checkup",
      symptoms: "No current complaints",
      treatment: "Annual physical examination completed. Patient in good health.",
      notes: "All vital signs within normal limits. Continue current exercise regimen.",
      doctor: "Dr. Medical Officer",
      vitalSigns: {
        bloodPressure: "115/75",
        temperature: "98.2°F",
        heartRate: "68 bpm",
        weight: "62 kg",
      },
    },
  ]);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([
    { id: "1", patientId: "1", date: "2025-01-25", status: "Present", checkInTime: "08:00", checkOutTime: "17:00" },
    { id: "2", patientId: "1", date: "2025-01-24", status: "Present", checkInTime: "08:15", checkOutTime: "17:30" },
    { id: "3", patientId: "2", date: "2025-01-25", status: "Late", checkInTime: "09:30", checkOutTime: "17:00" },
    { id: "4", patientId: "2", date: "2025-01-24", status: "Present", checkInTime: "08:00", checkOutTime: "17:00" },
    { id: "5", patientId: "3", date: "2025-01-25", status: "Absent", notes: "Sick leave" },
  ]);

  const addPatient = (patientData: Omit<Patient, "id" | "registeredDate">): Patient => {
    const newPatient: Patient = {
      ...patientData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      registeredDate: new Date().toISOString().split('T')[0],
    };
    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  };

  const addReport = (reportData: Omit<MedicalReport, "id">) => {
    const newReport: MedicalReport = {
      ...reportData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setReports(prev => [...prev, newReport]);
  };

  const addAttendance = (attendanceData: Omit<AttendanceRecord, "id">) => {
    const newAttendance: AttendanceRecord = {
      ...attendanceData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setAttendance(prev => [...prev, newAttendance]);
  };

  const updatePatient = (id: string, patientData: Partial<Patient>) => {
    setPatients(prev =>
      prev.map(patient => (patient.id === id ? { ...patient, ...patientData } : patient))
    );
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(patient => patient.id !== id));
    setReports(prev => prev.filter(report => report.patientId !== id));
    setAttendance(prev => prev.filter(att => att.patientId !== id));
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        reports,
        attendance,
        addPatient,
        addReport,
        addAttendance,
        updatePatient,
        deletePatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatients must be used within a PatientProvider");
  }
  return context;
};

