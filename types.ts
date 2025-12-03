export enum Gender {
  Male = 'Homme',
  Female = 'Femme',
  Other = 'Autre'
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  address: string;
  medicalHistory: string;
  allergies: string;
  createdAt: number;
}

export interface Medication {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

// For the autocomplete library
export interface SavedMedication extends Medication {
  id: string;
  usageCount: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  date: number;
  medications: Medication[];
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: number; // timestamp
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Consultation {
  id: string;
  patientId: string;
  date: number;
  reason: string;      // Motif
  examination: string; // Examen clinique
  diagnosis: string;   // Diagnostic
  notes: string;       // Notes libres
}

export interface DoctorProfile {
  name: string;
  specialty: string;
  address: string;
  phone: string;
  email: string;
  securityCode: string; // PIN Code
}

// Simulated DB Schema
export interface DatabaseSchema {
  patients: Patient[];
  prescriptions: Prescription[];
  appointments: Appointment[];
  savedMedications: SavedMedication[];
  consultations: Consultation[];
  doctorProfile: DoctorProfile;
}