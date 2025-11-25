import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { patientsApi, medicalReportsApi, attendanceApi } from "@/lib/api";

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
  addPatient: (patient: Omit<Patient, "id" | "registeredDate">) => Promise<Patient>;
  addReport: (report: Omit<MedicalReport, "id">) => Promise<void>;
  addAttendance: (attendance: Omit<AttendanceRecord, "id">) => Promise<void>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const refreshData = async () => {
    try {
      const [patientsData, reportsData, attendanceData] = await Promise.all([
        patientsApi.getAll(),
        medicalReportsApi.getAll(),
        attendanceApi.getAll(),
      ]);

      setPatients(patientsData.map((p: any) => ({
        id: p.id.toString(),
        fullName: p.full_name || p.fullName,
        email: p.email,
        phone: p.phone,
        bloodType: p.blood_type || p.bloodType || "Unknown",
        allergies: p.allergies || "None",
        medicalHistory: p.medical_history || p.medicalHistory || "None",
        emergencyContact: p.emergency_contact || p.emergencyContact || "",
        registeredDate: p.registered_date || p.registeredDate || new Date().toISOString().split('T')[0],
      })));

      setReports(reportsData.map((r: any) => ({
        id: r.id.toString(),
        patientId: r.patient_id?.toString() || r.patientId?.toString(),
        date: r.date,
        diagnosis: r.diagnosis,
        symptoms: r.symptoms,
        treatment: r.treatment,
        notes: r.notes,
        doctor: r.doctor,
        vitalSigns: {
          bloodPressure: r.vital_signs?.blood_pressure || r.vitalSigns?.bloodPressure || "",
          temperature: r.vital_signs?.temperature || r.vitalSigns?.temperature || "",
          heartRate: r.vital_signs?.heart_rate || r.vitalSigns?.heartRate || "",
          weight: r.vital_signs?.weight || r.vitalSigns?.weight || "",
        },
      })));

      setAttendance(attendanceData.map((a: any) => ({
        id: a.id.toString(),
        patientId: a.patient_id?.toString() || a.patientId?.toString(),
        date: a.date,
        status: a.status,
        checkInTime: a.check_in_time || a.checkInTime,
        checkOutTime: a.check_out_time || a.checkOutTime,
        notes: a.notes,
      })));
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addPatient = async (patientData: Omit<Patient, "id" | "registeredDate">): Promise<Patient> => {
    const newPatient = await patientsApi.create({
      full_name: patientData.fullName,
      email: patientData.email,
      phone: patientData.phone,
      blood_type: patientData.bloodType,
      allergies: patientData.allergies,
      medical_history: patientData.medicalHistory,
      emergency_contact: patientData.emergencyContact,
    });
    await refreshData();
    return {
      id: newPatient.id.toString(),
      fullName: newPatient.full_name || newPatient.fullName,
      email: newPatient.email,
      phone: newPatient.phone,
      bloodType: newPatient.blood_type || newPatient.bloodType,
      allergies: newPatient.allergies,
      medicalHistory: newPatient.medical_history || newPatient.medicalHistory,
      emergencyContact: newPatient.emergency_contact || newPatient.emergencyContact,
      registeredDate: newPatient.registered_date || newPatient.registeredDate || new Date().toISOString().split('T')[0],
    };
  };

  const addReport = async (reportData: Omit<MedicalReport, "id">) => {
    await medicalReportsApi.create({
      patient_id: parseInt(reportData.patientId),
      date: reportData.date,
      diagnosis: reportData.diagnosis,
      symptoms: reportData.symptoms,
      treatment: reportData.treatment,
      notes: reportData.notes,
      doctor: reportData.doctor,
      vital_signs: reportData.vitalSigns,
    });
    await refreshData();
  };

  const addAttendance = async (attendanceData: Omit<AttendanceRecord, "id">) => {
    await attendanceApi.create({
      patient_id: parseInt(attendanceData.patientId),
      date: attendanceData.date,
      status: attendanceData.status,
      check_in_time: attendanceData.checkInTime,
      check_out_time: attendanceData.checkOutTime,
      notes: attendanceData.notes,
    });
    await refreshData();
  };

  const updatePatient = async (id: string, patientData: Partial<Patient>) => {
    await patientsApi.update(id, {
      full_name: patientData.fullName,
      email: patientData.email,
      phone: patientData.phone,
      blood_type: patientData.bloodType,
      allergies: patientData.allergies,
      medical_history: patientData.medicalHistory,
      emergency_contact: patientData.emergencyContact,
    });
    await refreshData();
  };

  const deletePatient = async (id: string) => {
    await patientsApi.delete(id);
    await refreshData();
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
        refreshData,
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

