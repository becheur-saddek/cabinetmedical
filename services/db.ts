
import { Patient, Prescription, Appointment, DatabaseSchema, Gender, SavedMedication, DoctorProfile, Medication, Consultation } from '../types';

const DB_KEY = 'medicabinet_db_v3';

// Initial seed data
const initialData: DatabaseSchema = {
  patients: [
    {
      id: '1',
      firstName: 'Jean',
      lastName: 'Dupont',
      birthDate: '1980-05-15',
      gender: Gender.Male,
      phone: '06 12 34 56 78',
      address: '10 Rue de la Paix, Paris',
      medicalHistory: 'Hypertension',
      allergies: 'Pénicilline',
      createdAt: Date.now()
    },
    {
      id: '2',
      firstName: 'Marie',
      lastName: 'Curie',
      birthDate: '1992-11-07',
      gender: Gender.Female,
      phone: '07 98 76 54 32',
      address: '25 Avenue des Champs, Lyon',
      medicalHistory: 'Asthme léger',
      allergies: 'Aucune',
      createdAt: Date.now()
    }
  ],
  prescriptions: [],
  appointments: [
    {
      id: '101',
      patientId: '1',
      date: Date.now() + 86400000, // tomorrow
      reason: 'Suivi tension',
      status: 'scheduled'
    }
  ],
  savedMedications: [
    { id: 'm1', name: 'Doliprane', dosage: '1000mg', duration: '5 jours', instructions: '1 comprimé toutes les 6 heures si douleur', usageCount: 1 },
    { id: 'm2', name: 'Amoxicilline', dosage: '1g', duration: '7 jours', instructions: '1 matin et soir au milieu du repas', usageCount: 1 },
    { id: 'm3', name: 'Spasfon', dosage: '80mg', duration: '3 jours', instructions: '2 comprimés en cas de douleur', usageCount: 1 }
  ],
  consultations: [],
  doctorProfile: {
    name: 'Dr. BECHEUR Saddek',
    specialty: 'Médecine Générale',
    address: 'Cité des Roses, 25000 Constantine',
    phone: '0555 32 31 94',
    email: 'cabinet.becheur@gmail.com',
    securityCode: '0000'
  }
};

// Helper to load/save
const loadDB = (): DatabaseSchema => {
  try {
    const stored = localStorage.getItem(DB_KEY);
    if (!stored) {
      localStorage.setItem(DB_KEY, JSON.stringify(initialData));
      return initialData;
    }
    
    let data;
    try {
        data = JSON.parse(stored);
    } catch (e) {
        console.warn("JSON Parse error, resetting DB");
        return initialData;
    }
    
    // Safety check: if data is null or not an object
    if (!data || typeof data !== 'object') {
      return initialData;
    }

    // Force strict structure to prevent crashes
    const safeData: DatabaseSchema = {
        patients: Array.isArray(data.patients) ? data.patients : [],
        prescriptions: Array.isArray(data.prescriptions) ? data.prescriptions : [],
        appointments: Array.isArray(data.appointments) ? data.appointments : [],
        consultations: Array.isArray(data.consultations) ? data.consultations : [],
        savedMedications: Array.isArray(data.savedMedications) ? data.savedMedications : initialData.savedMedications,
        doctorProfile: {
            ...initialData.doctorProfile,
            ...(data.doctorProfile || {})
        }
    };
    
    return safeData;
  } catch (error) {
    console.error("Critical DB Load Error:", error);
    return initialData;
  }
};

const saveDB = (data: DatabaseSchema) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Erreur sauvegarde DB", e);
  }
};

// API
export const db = {
  resetDatabase: () => {
    try {
      // 1. Lire les données brutes pour être sûr de récupérer le profil actuel
      const raw = localStorage.getItem(DB_KEY);
      let currentProfile = initialData.doctorProfile;
      let currentMeds = initialData.savedMedications;

      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.doctorProfile) currentProfile = parsed.doctorProfile;
          if (parsed.savedMedications && Array.isArray(parsed.savedMedications)) currentMeds = parsed.savedMedications;
        } catch (e) {
          console.warn("Impossible de lire les anciennes données pour la réinitialisation");
        }
      }

      // 2. Créer une base propre avec listes vides mais profil conservé
      const cleanDB: DatabaseSchema = {
        patients: [],
        prescriptions: [],
        appointments: [],
        consultations: [],
        savedMedications: currentMeds, // On garde les médicaments
        doctorProfile: currentProfile  // On garde le profil
      };
      
      // 3. Sauvegarder
      localStorage.setItem(DB_KEY, JSON.stringify(cleanDB));
      
      // 4. Soft Reset: Dispatch event instead of reload to avoid connection errors
      window.dispatchEvent(new Event('medicab_reset'));
      
    } catch (e) {
      console.error("Erreur reset DB", e);
    }
  },

  getDoctorProfile: (): DoctorProfile => {
    return loadDB().doctorProfile;
  },

  updateDoctorProfile: (profile: DoctorProfile) => {
    const data = loadDB();
    data.doctorProfile = profile;
    saveDB(data);
  },

  getPatients: (): Patient[] => {
    return loadDB().patients.sort((a, b) => b.createdAt - a.createdAt);
  },
  
  getPatient: (id: string): Patient | undefined => {
    return loadDB().patients.find(p => p.id === id);
  },

  addPatient: (patient: Patient) => {
    const data = loadDB();
    data.patients.push(patient);
    saveDB(data);
  },

  updatePatient: (patient: Patient) => {
    const data = loadDB();
    const idx = data.patients.findIndex(p => p.id === patient.id);
    if (idx !== -1) {
      data.patients[idx] = patient;
      saveDB(data);
    }
  },

  deletePatient: (id: string) => {
    const data = loadDB();
    data.patients = data.patients.filter(p => p.id !== id);
    data.prescriptions = data.prescriptions.filter(p => p.patientId !== id);
    data.appointments = data.appointments.filter(a => a.patientId !== id);
    data.consultations = data.consultations.filter(c => c.patientId !== id);
    saveDB(data);
  },

  getAppointments: (): Appointment[] => {
    return loadDB().appointments.sort((a, b) => a.date - b.date);
  },

  addAppointment: (apt: Appointment) => {
    const data = loadDB();
    data.appointments.push(apt);
    saveDB(data);
  },
  
  updateAppointmentStatus: (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    const data = loadDB();
    const apt = data.appointments.find(a => a.id === id);
    if (apt) {
      apt.status = status;
      saveDB(data);
    }
  },

  getPrescriptions: (): Prescription[] => {
    return loadDB().prescriptions.sort((a, b) => b.date - a.date);
  },
  
  getPrescriptionsByPatient: (patientId: string): Prescription[] => {
    return loadDB().prescriptions
      .filter(p => p.patientId === patientId)
      .sort((a, b) => b.date - a.date);
  },

  addPrescription: (p: Prescription) => {
    const data = loadDB();
    data.prescriptions.push(p);
    saveDB(data);
  },

  getConsultations: (): Consultation[] => {
    return loadDB().consultations.sort((a, b) => b.date - a.date);
  },

  getConsultationsByPatient: (patientId: string): Consultation[] => {
    return loadDB().consultations
      .filter(c => c.patientId === patientId)
      .sort((a, b) => b.date - a.date);
  },

  addConsultation: (c: Consultation) => {
    const data = loadDB();
    data.consultations.push(c);
    saveDB(data);
  },

  getSavedMedications: (): SavedMedication[] => {
    return loadDB().savedMedications.sort((a, b) => b.usageCount - a.usageCount);
  },

  learnMedication: (med: Medication) => {
    const data = loadDB();
    const existingIndex = data.savedMedications.findIndex(m => m.name.toLowerCase() === med.name.toLowerCase());
    
    if (existingIndex >= 0) {
      data.savedMedications[existingIndex].usageCount += 1;
    } else {
      data.savedMedications.push({
        id: crypto.randomUUID(),
        ...med,
        usageCount: 1
      });
    }
    saveDB(data);
  },

  getFullDB: (): string => {
    return localStorage.getItem(DB_KEY) || '';
  },

  importDB: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') return false;
      // Basic validation
      if (!Array.isArray(data.patients)) data.patients = [];
      localStorage.setItem(DB_KEY, JSON.stringify(data));
      window.dispatchEvent(new Event('medicab_reset'));
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  }
};
