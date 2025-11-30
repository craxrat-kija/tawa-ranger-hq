import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { patientsApi, medicalReportsApi, attendanceApi } from "@/lib/api";
import { useAuth } from "./AuthContext";

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
  addPatient: (patient: Omit<Patient, "id" | "registeredDate"> & { userId?: number }) => Promise<Patient>;
  addReport: (report: Omit<MedicalReport, "id">) => Promise<void>;
  addAttendance: (attendance: Omit<AttendanceRecord, "id">) => Promise<void>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    
    try {
      console.log('Loading patient data...');
      const [patientsData, reportsData, attendanceData] = await Promise.all([
        patientsApi.getAll().catch(err => {
          console.error('Error loading patients:', err);
          return [];
        }),
        medicalReportsApi.getAll().catch(err => {
          console.error('Error loading reports:', err);
          return [];
        }),
        attendanceApi.getAll().catch(err => {
          console.error('Error loading attendance:', err);
          return [];
        }),
      ]);

      console.log('Patient data loaded:', { patients: patientsData.length, reports: reportsData.length, attendance: attendanceData.length });

      // Ensure we're working with arrays
      const patientsArray = Array.isArray(patientsData) ? patientsData : [];
      const reportsArray = Array.isArray(reportsData) ? reportsData : [];
      const attendanceArray = Array.isArray(attendanceData) ? attendanceData : [];

      setPatients(patientsArray.map((p: any) => ({
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

      setReports(reportsArray.map((r: any) => ({
        id: r.id.toString(),
        patientId: r.patient_id?.toString() || r.patientId?.toString(),
        date: r.date || new Date().toISOString().split('T')[0],
        diagnosis: r.diagnosis || "",
        symptoms: r.symptoms || "",
        treatment: r.treatment || "",
        notes: r.notes || "",
        doctor: r.doctor || "",
        vitalSigns: {
          // Backend stores as separate fields (blood_pressure, temperature, etc.)
          // but may also come as nested vital_signs object
          bloodPressure: r.blood_pressure || r.vital_signs?.blood_pressure || r.vital_signs?.bloodPressure || r.vitalSigns?.bloodPressure || "",
          temperature: r.temperature || r.vital_signs?.temperature || r.vital_signs?.temperature || r.vitalSigns?.temperature || "",
          heartRate: r.heart_rate || r.vital_signs?.heart_rate || r.vital_signs?.heartRate || r.vitalSigns?.heartRate || "",
          weight: r.weight || r.vital_signs?.weight || r.vital_signs?.weight || r.vitalSigns?.weight || "",
        },
      })));

      setAttendance(attendanceArray.map((a: any) => ({
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
      // Set empty arrays on error to prevent UI from breaking
      setPatients([]);
      setReports([]);
      setAttendance([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);

  const addPatient = async (patientData: Omit<Patient, "id" | "registeredDate"> & { userId?: number }): Promise<Patient> => {
    const newPatient = await patientsApi.create({
      full_name: patientData.fullName,
      email: patientData.email,
      phone: patientData.phone,
      blood_type: patientData.bloodType,
      allergies: patientData.allergies,
      medical_history: patientData.medicalHistory,
      emergency_contact: patientData.emergencyContact,
      user_id: patientData.userId,
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
    try {
      await medicalReportsApi.create({
        patient_id: parseInt(reportData.patientId),
        date: reportData.date,
        diagnosis: reportData.diagnosis,
        symptoms: reportData.symptoms || "",
        treatment: reportData.treatment || "",
        notes: reportData.notes || "",
        doctor: reportData.doctor,
        vital_signs: reportData.vitalSigns || {},
      });
      await refreshData();
    } catch (error) {
      console.error('Error adding report:', error);
      throw error;
    }
  };

  const addAttendance = async (attendanceData: Omit<AttendanceRecord, "id">) => {
    try {
      await attendanceApi.create({
        patient_id: parseInt(attendanceData.patientId),
        date: attendanceData.date,
        status: attendanceData.status,
        check_in_time: attendanceData.checkInTime || null,
        check_out_time: attendanceData.checkOutTime || null,
        notes: attendanceData.notes || null,
      });
      await refreshData();
    } catch (error) {
      console.error('Error adding attendance:', error);
      throw error;
    }
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

