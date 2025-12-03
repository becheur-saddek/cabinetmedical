import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { Patient, Prescription, Medication, SavedMedication } from '../types';
import { generatePrescriptionPDF, generateReferralPDF, generateSickLeavePDF } from '../utils/pdfGenerator';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Printer, 
  Search,
  Edit2,
  Save,
  X,
  ChevronDown,
  CalendarCheck,
  Send
} from 'lucide-react';

const Prescriptions: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1); // 1: Select Patient, 2: Add Meds/Docs
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Tabs for Step 2
  const [activeTab, setActiveTab] = useState<'prescription' | 'sickLeave' | 'referral'>('prescription');

  // --- PRESCRIPTION STATE ---
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medForm, setMedForm] = useState<Medication>({ name: '', dosage: '', duration: '', instructions: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [savedMeds, setSavedMeds] = useState<SavedMedication[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // --- SICK LEAVE STATE ---
  const [sickLeaveDays, setSickLeaveDays] = useState(3);
  const [sickLeaveStart, setSickLeaveStart] = useState(new Date().toISOString().split('T')[0]);

  // --- REFERRAL STATE ---
  const [referralText, setReferralText] = useState('');

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  const patients = db.getPatients();
  const filteredPatients = patients.filter(p => 
    p.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setSavedMeds(db.getSavedMedications());
  }, []);

  // Update referral text when patient changes
  useEffect(() => {
    if (selectedPatientId) {
      const p = db.getPatient(selectedPatientId);
      if (p) {
        setReferralText(`Cher confrère,\n\nJe vous adresse ce patient, ${p.gender === 'Homme' ? 'Mr' : 'Mme'} ${p.lastName} ${p.firstName}, pour une prise en charge spécialisée concernant...\n\nAntécédents: ${p.medicalHistory || 'Aucun'}.\n\nConfraternellement.`);
      }
    }
  }, [selectedPatientId]);

  // Handle click outside suggestions to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- HANDLERS FOR PRESCRIPTION ---
  const handleMedNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMedForm(prev => ({ ...prev, name: val }));
    setShowSuggestions(true);
    const found = savedMeds.find(m => m.name.toLowerCase() === val.toLowerCase());
    if (found) {
      setMedForm({
        name: found.name,
        dosage: found.dosage,
        duration: found.duration,
        instructions: found.instructions
      });
    }
  };

  const selectSavedMed = (med: SavedMedication) => {
    setMedForm({
      name: med.name,
      dosage: med.dosage,
      duration: med.duration,
      instructions: med.instructions
    });
    setShowSuggestions(false);
  };

  const handleAddMed = () => {
    if (!medForm.name) return;
    if (editingIndex !== null) {
      const updatedMeds = [...medications];
      updatedMeds[editingIndex] = medForm;
      setMedications(updatedMeds);
      setEditingIndex(null);
    } else {
      setMedications([...medications, medForm]);
    }
    db.learnMedication(medForm);
    setSavedMeds(db.getSavedMedications());
    setMedForm({ name: '', dosage: '', duration: '', instructions: '' });
  };

  const handleEdit = (index: number) => {
    setMedForm(medications[index]);
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setMedForm({ name: '', dosage: '', duration: '', instructions: '' });
    setEditingIndex(null);
  };

  const removeMed = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
    if (editingIndex === index) handleCancelEdit();
  };

  // --- GENERATION HANDLERS ---
  const handleGeneratePrescription = () => {
    if (!selectedPatientId || medications.length === 0) return;
    const patient = db.getPatient(selectedPatientId);
    if (!patient) return;

    const prescription: Prescription = {
      id: crypto.randomUUID(),
      patientId: patient.id,
      date: Date.now(),
      medications: medications
    };

    db.addPrescription(prescription);
    generatePrescriptionPDF(patient, prescription);
    resetForm();
  };

  const handleGenerateSickLeave = () => {
    if (!selectedPatientId) return;
    const patient = db.getPatient(selectedPatientId);
    if (!patient) return;
    
    const start = new Date(sickLeaveStart);
    const end = new Date(start);
    end.setDate(start.getDate() + (sickLeaveDays - 1));
    
    generateSickLeavePDF(patient, sickLeaveDays, sickLeaveStart, end.toISOString());
  };

  const handleGenerateReferral = () => {
    if (!selectedPatientId) return;
    const patient = db.getPatient(selectedPatientId);
    if (!patient) return;
    generateReferralPDF(patient, referralText);
  };

  const resetForm = () => {
    setMedications([]);
    setEditingIndex(null);
    // Don't reset patient ID to allow printing other docs for same patient
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Documents Médicaux</h1>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex-1 flex flex-col overflow-hidden">
        {/* Progress Stepper */}
        <div className="flex border-b dark:border-slate-700 shrink-0">
          <button 
            className={`flex-1 py-4 text-center font-medium text-sm border-b-2 transition-colors ${step === 1 ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-gray-50 dark:bg-slate-700/50' : 'border-transparent text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
            onClick={() => setStep(1)}
          >
            1. Sélectionner le Patient
          </button>
          <button 
            className={`flex-1 py-4 text-center font-medium text-sm border-b-2 transition-colors ${step === 2 ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-gray-50 dark:bg-slate-700/50' : 'border-transparent text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
            disabled={!selectedPatientId}
            onClick={() => setStep(2)}
          >
            2. Créer le Document
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {step === 1 && (
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Rechercher un patient..." 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPatients.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setStep(2);
                    }}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md
                      ${selectedPatientId === p.id 
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 ring-1 ring-teal-500' 
                        : 'border-gray-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-500 dark:bg-slate-900 dark:text-gray-200'}
                    `}
                  >
                    <div className="font-bold text-gray-800 dark:text-white">{p.lastName} {p.firstName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(p.birthDate).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedPatientId && (
            <div className="flex flex-col h-full">
              {/* Selected Patient Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Patient sélectionné</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                    {db.getPatient(selectedPatientId)?.lastName} {db.getPatient(selectedPatientId)?.firstName}
                  </div>
                </div>
                <button onClick={() => setStep(1)} className="text-sm text-teal-600 dark:text-teal-400 font-medium hover:underline bg-white dark:bg-slate-800 px-3 py-1 rounded border border-gray-200 dark:border-slate-700 shadow-sm">
                  Changer de patient
                </button>
              </div>

              {/* Tabs */}
              <div className="flex bg-gray-100 dark:bg-slate-900 p-1 gap-1 shrink-0 overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('prescription')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap
                    ${activeTab === 'prescription' ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
                >
                  <FileText size={18} /> Ordonnance
                </button>
                <button 
                  onClick={() => setActiveTab('sickLeave')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap
                    ${activeTab === 'sickLeave' ? 'bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
                >
                  <CalendarCheck size={18} /> Arrêt de Travail
                </button>
                <button 
                  onClick={() => setActiveTab('referral')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap
                    ${activeTab === 'referral' ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
                >
                  <Send size={18} /> Lettre Orientation
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-slate-800">
                
                {/* --- TAB 1: PRESCRIPTION --- */}
                {activeTab === 'prescription' && (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {/* Add/Edit Med Form */}
                    <div className={`p-4 rounded-xl border transition-colors space-y-3 ${editingIndex !== null ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700'}`}>
                      {editingIndex !== null && (
                        <div className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                          <Edit2 size={14} /> Modification en cours...
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2 relative" ref={suggestionsRef}>
                           <div className="relative">
                             <input 
                              type="text"
                              placeholder="Médicament (tapez pour voir la liste)" 
                              className="w-full p-2 pr-8 rounded-lg border dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                              value={medForm.name}
                              onChange={handleMedNameChange}
                              onFocus={() => setShowSuggestions(true)}
                              autoComplete="off"
                            />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                           </div>
                          {showSuggestions && (
                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                              {savedMeds.filter(m => m.name.toLowerCase().includes(medForm.name.toLowerCase())).length === 0 ? (
                                 <div className="p-3 text-sm text-gray-400 italic text-center">Aucun médicament enregistré correspondant</div>
                              ) : (
                                 savedMeds
                                  .filter(m => m.name.toLowerCase().includes(medForm.name.toLowerCase()))
                                  .map(m => (
                                    <button 
                                        key={m.id}
                                        type="button" 
                                        onClick={() => selectSavedMed(m)}
                                        className="w-full text-left p-3 hover:bg-teal-50 dark:hover:bg-slate-700 border-b border-gray-50 dark:border-slate-700 last:border-0 transition-colors flex justify-between items-center group"
                                    >
                                        <div>
                                            <div className="font-bold text-gray-800 dark:text-white text-sm group-hover:text-teal-700 dark:group-hover:text-teal-400">{m.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{m.dosage} • {m.instructions.substring(0, 35)}{m.instructions.length > 35 ? '...' : ''}</div>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 text-[10px] px-2 py-1 rounded-full group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 group-hover:text-teal-700 dark:group-hover:text-teal-300 flex-shrink-0 ml-2">
                                             {m.usageCount}x
                                        </div>
                                    </button>
                                  ))
                              )}
                            </div>
                          )}
                        </div>
                        <input 
                          placeholder="Posologie (ex: 1 comprimé)" 
                          className="p-2 rounded-lg border dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                          value={medForm.dosage}
                          onChange={e => setMedForm({...medForm, dosage: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                         <input 
                          placeholder="Durée (ex: 5 jours)" 
                          className="p-2 rounded-lg border dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                          value={medForm.duration}
                          onChange={e => setMedForm({...medForm, duration: e.target.value})}
                        />
                        <input 
                          placeholder="Instructions (ex: Pendant les repas)" 
                          className="md:col-span-2 p-2 rounded-lg border dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                          value={medForm.instructions}
                          onChange={e => setMedForm({...medForm, instructions: e.target.value})}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleAddMed}
                          disabled={!medForm.name}
                          className={`flex-1 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 font-medium transition-colors
                            ${editingIndex !== null ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'}
                          `}
                        >
                          {editingIndex !== null ? <Save size={18} /> : <Plus size={18} />} 
                          {editingIndex !== null ? 'Enregistrer la modification' : 'Ajouter à la liste'}
                        </button>
                        {editingIndex !== null && (
                          <button 
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-center"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* List of Meds */}
                    <div className="space-y-2">
                      {medications.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                          Ajoutez des médicaments à l'ordonnance ci-dessus.
                        </div>
                      ) : (
                        medications.map((med, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-center justify-between p-3 rounded-lg shadow-sm border transition-all
                              ${editingIndex === idx 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-1 ring-blue-300 dark:ring-blue-800' 
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}
                            `}
                          >
                            <div>
                              <div className={`font-semibold ${editingIndex === idx ? 'text-blue-800 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>{med.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {med.dosage} - {med.duration}
                              </div>
                              {med.instructions && <div className="text-xs text-gray-400 italic">{med.instructions}</div>}
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleEdit(idx)} className="p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg"><Edit2 size={18} /></button>
                              <button onClick={() => removeMed(idx)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* --- TAB 2: SICK LEAVE --- */}
                {activeTab === 'sickLeave' && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30 flex items-start gap-4">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-orange-600 shadow-sm">
                        <CalendarCheck size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Certificat de Maladie</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Génère un arrêt de travail officiel au format PDF.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de jours</label>
                           <input 
                              type="number"
                              min="1"
                              value={sickLeaveDays}
                              onChange={(e) => setSickLeaveDays(parseInt(e.target.value) || 1)}
                              className="w-full p-4 border dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 text-xl font-bold dark:bg-slate-900 dark:text-white text-center"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date de début</label>
                           <input 
                              type="date"
                              value={sickLeaveStart}
                              onChange={(e) => setSickLeaveStart(e.target.value)}
                              className="w-full p-4 border dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-slate-900 dark:text-white"
                           />
                        </div>
                     </div>

                     <div className="text-center p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Reprise prévue le :</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                          {(() => {
                            const d = new Date(sickLeaveStart);
                            d.setDate(d.getDate() + (sickLeaveDays)); 
                            return d.toLocaleDateString();
                          })()}
                        </p>
                     </div>
                  </div>
                )}

                {/* --- TAB 3: REFERRAL --- */}
                {activeTab === 'referral' && (
                  <div className="max-w-3xl mx-auto space-y-6">
                     <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 flex items-start gap-4">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-blue-600 shadow-sm">
                        <Send size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Lettre d'Orientation</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Rédigez un courrier pour un confrère spécialiste.</p>
                      </div>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contenu de la lettre</label>
                       <textarea 
                          value={referralText}
                          onChange={(e) => setReferralText(e.target.value)}
                          className="w-full h-80 p-5 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 font-sans text-gray-700 dark:text-gray-200 dark:bg-slate-900 leading-relaxed text-base resize-none"
                          placeholder="Rédigez votre lettre ici..."
                       />
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex justify-end gap-3">
                 {activeTab === 'prescription' && (
                   <button 
                    onClick={handleGeneratePrescription}
                    disabled={medications.length === 0 || editingIndex !== null}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform active:scale-95"
                  >
                    <Printer size={20} />
                    Imprimer Ordonnance
                  </button>
                 )}
                 
                 {activeTab === 'sickLeave' && (
                   <button 
                    onClick={handleGenerateSickLeave}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-600/20 flex items-center gap-2 transform transition-transform active:scale-95"
                  >
                    <Printer size={20} />
                    Imprimer Arrêt de Travail
                  </button>
                 )}

                 {activeTab === 'referral' && (
                   <button 
                    onClick={handleGenerateReferral}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transform transition-transform active:scale-95"
                  >
                    <Printer size={20} />
                    Imprimer Lettre
                  </button>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prescriptions;