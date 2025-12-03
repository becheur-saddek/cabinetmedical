import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Patient, Consultation, Prescription } from '../types';
import { 
  Search, 
  User, 
  Clock, 
  Plus, 
  ChevronRight, 
  Activity, 
  Calendar, 
  Stethoscope, 
  FileText, 
  Pill,
  AlertCircle,
  ClipboardList,
  Save,
  ArrowLeft
} from 'lucide-react';

const Consultations: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientHistory, setPatientHistory] = useState<{
    consultations: Consultation[];
    prescriptions: Prescription[];
  } | null>(null);

  // View State
  const [view, setView] = useState<'timeline' | 'create'>('timeline');
  const [newConsultation, setNewConsultation] = useState<Partial<Consultation>>({
    reason: '',
    examination: '',
    diagnosis: '',
    notes: ''
  });

  useEffect(() => {
    setPatients(db.getPatients());
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      const cons = db.getConsultationsByPatient(selectedPatientId);
      const pres = db.getPrescriptionsByPatient(selectedPatientId);
      setPatientHistory({ consultations: cons, prescriptions: pres });
      setView('timeline'); 
    } else {
      setPatientHistory(null);
    }
  }, [selectedPatientId]);

  const filteredPatients = patients.filter(p => 
    p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = selectedPatientId ? db.getPatient(selectedPatientId) : null;

  const handleSaveConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    const consultation: Consultation = {
      id: crypto.randomUUID(),
      patientId: selectedPatientId,
      date: Date.now(),
      reason: newConsultation.reason || '',
      examination: newConsultation.examination || '',
      diagnosis: newConsultation.diagnosis || '',
      notes: newConsultation.notes || ''
    };

    db.addConsultation(consultation);
    
    // Refresh
    const cons = db.getConsultationsByPatient(selectedPatientId);
    const pres = db.getPrescriptionsByPatient(selectedPatientId);
    setPatientHistory({ consultations: cons, prescriptions: pres });
    
    setView('timeline');
    setNewConsultation({ reason: '', examination: '', diagnosis: '', notes: '' });
  };

  // Merge and sort history for timeline
  const getTimelineEvents = () => {
    if (!patientHistory) return [];
    const events = [
      ...patientHistory.consultations.map(c => ({ type: 'consultation', data: c, date: c.date })),
      ...patientHistory.prescriptions.map(p => ({ type: 'prescription', data: p, date: p.date }))
    ];
    return events.sort((a, b) => b.date - a.date);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6 overflow-hidden">
      
      {/* ---------------- LEFT PANEL: PATIENT DIRECTORY ---------------- */}
      {/* Logic: Hidden on mobile if a patient is selected, otherwise visible */}
      <div className={`
        ${selectedPatientId ? 'hidden lg:flex' : 'flex'} 
        w-full lg:w-80 flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden shrink-0 h-full
      `}>
        
        {/* Search Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 shrink-0">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dossiers Patients</h2>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-teal-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher un dossier..." 
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all dark:text-white placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredPatients.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">Aucun patient trouvé.</div>
          ) : (
            filteredPatients.map(p => (
              <div 
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`
                  group p-3 rounded-xl cursor-pointer transition-all border
                  ${selectedPatientId === p.id 
                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-700'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm
                    ${p.gender === 'Homme' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-pink-400 to-pink-600'}
                  `}>
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${selectedPatientId === p.id ? 'text-teal-900 dark:text-teal-300' : 'text-gray-700 dark:text-gray-200'}`}>
                      {p.lastName} {p.firstName}
                    </p>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                       {new Date(p.birthDate).toLocaleDateString()} • {new Date().getFullYear() - new Date(p.birthDate).getFullYear()} ans
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-300 group-hover:text-teal-500 ${selectedPatientId === p.id ? 'text-teal-500' : ''}`} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>


      {/* ---------------- RIGHT PANEL: MEDICAL RECORD ---------------- */}
      {/* Logic: Hidden on mobile if NO patient selected, always visible on Desktop */}
      <div className={`
        ${!selectedPatientId ? 'hidden lg:flex' : 'flex'} 
        flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex-col overflow-hidden relative h-full
      `}>
        {!selectedPatient ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 bg-gray-50/30 dark:bg-slate-800 p-6 text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg font-medium">Sélectionnez un patient</p>
            <p className="text-sm">Le dossier médical s'affichera ici</p>
          </div>
        ) : (
          <>
            {/* --- Sticky Header --- */}
            <div className="px-4 lg:px-8 py-5 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
              <div className="flex items-start gap-4 w-full">
                {/* Back Button (Mobile Only) */}
                <button 
                  onClick={() => setSelectedPatientId(null)}
                  className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
                >
                  <ArrowLeft size={24} />
                </button>

                <div className={`
                  w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl lg:text-2xl font-bold text-white shadow-lg
                  ${selectedPatient.gender === 'Homme' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-pink-500 to-pink-700'}
                `}>
                  {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-white truncate">
                    {selectedPatient.lastName} {selectedPatient.firstName}
                  </h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                      <User size={12} /> {selectedPatient.gender}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                      <Calendar size={12} /> {new Date().getFullYear() - new Date(selectedPatient.birthDate).getFullYear()} Ans
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                 {view === 'create' ? (
                   <button 
                    onClick={() => setView('timeline')}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium text-sm w-full sm:w-auto"
                   >
                     <ArrowLeft size={18} /> <span className="hidden sm:inline">Retour historique</span><span className="sm:hidden">Retour</span>
                   </button>
                 ) : (
                   <button 
                    onClick={() => setView('create')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/20 transition-all font-bold text-sm transform active:scale-95 w-full sm:w-auto"
                   >
                     <Plus size={18} /> <span className="hidden sm:inline">Nouvelle Consultation</span><span className="sm:hidden">Consultation</span>
                   </button>
                 )}
              </div>
            </div>

            {/* Sub-header info (Allergies/History) - Scrollable horizontally if needed */}
            {(selectedPatient.medicalHistory || selectedPatient.allergies) && (
               <div className="px-4 lg:px-8 py-2 bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700 flex gap-2 overflow-x-auto whitespace-nowrap shrink-0 scrollbar-hide">
                  {selectedPatient.medicalHistory && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-900/20 text-xs font-medium text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-800">
                        <Activity size={14} /> {selectedPatient.medicalHistory}
                      </span>
                    )}
                    {selectedPatient.allergies && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-xs font-medium text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800">
                        <AlertCircle size={14} /> Allergie: {selectedPatient.allergies}
                      </span>
                    )}
               </div>
            )}

            {/* --- Main Scrollable Content --- */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-slate-900/50 p-4 lg:p-8">
              
              {/* VIEW: CREATE FORM */}
              {view === 'create' ? (
                <div className="max-w-4xl mx-auto animate-fade-in pb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-lg">
                      <FileText size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Nouvelle fiche clinique</h2>
                  </div>

                  <form onSubmit={handleSaveConsultation} className="space-y-6">
                    
                    {/* Motif */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Motif de consultation</label>
                      <input 
                        className="w-full text-lg p-3 border-b-2 border-gray-200 dark:border-slate-600 focus:border-teal-500 dark:focus:border-teal-400 outline-none bg-transparent transition-colors placeholder-gray-300 dark:placeholder-gray-600 dark:text-white"
                        placeholder="Ex: Douleurs abdominales aigües..."
                        value={newConsultation.reason}
                        onChange={e => setNewConsultation({...newConsultation, reason: e.target.value})}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Examen */}
                       <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Activity size={16} className="text-blue-500" />
                            Examen Clinique
                          </label>
                          <textarea 
                            className="w-full flex-1 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all dark:text-white"
                            placeholder="Observations, constantes, auscultation..."
                            rows={6}
                            value={newConsultation.examination}
                            onChange={e => setNewConsultation({...newConsultation, examination: e.target.value})}
                          />
                       </div>

                       {/* Diagnostic */}
                       <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Stethoscope size={16} className="text-purple-500" />
                            Diagnostic & Conclusion
                          </label>
                          <textarea 
                            className="w-full flex-1 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none transition-all dark:text-white"
                            placeholder="Diagnostic suspecté ou confirmé..."
                            rows={6}
                            value={newConsultation.diagnosis}
                            onChange={e => setNewConsultation({...newConsultation, diagnosis: e.target.value})}
                          />
                       </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                       <label className="block text-xs font-bold text-gray-400 mb-2">NOTES INTERNES (Privé)</label>
                       <input 
                          className="w-full p-2 bg-transparent outline-none text-gray-600 dark:text-gray-300 placeholder-gray-300"
                          placeholder="Note personnelle..."
                          value={newConsultation.notes}
                          onChange={e => setNewConsultation({...newConsultation, notes: e.target.value})}
                       />
                    </div>

                    <div className="flex justify-end pt-4 pb-4">
                      <button type="submit" className="flex items-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-teal-600/20 hover:bg-teal-700 hover:scale-105 transition-all w-full md:w-auto justify-center">
                        <Save size={20} />
                        Enregistrer au dossier
                      </button>
                    </div>

                  </form>
                </div>
              ) : (
                /* VIEW: TIMELINE */
                <div className="max-w-4xl mx-auto pb-10">
                   {getTimelineEvents().length === 0 ? (
                      <div className="text-center py-20">
                         <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Activity className="text-gray-400 dark:text-gray-500" size={32} />
                         </div>
                         <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Dossier Vide</h3>
                         <p className="text-gray-500 dark:text-gray-400">Aucune consultation ou ordonnance enregistrée.</p>
                         <button onClick={() => setView('create')} className="mt-4 text-teal-600 font-bold hover:underline">
                            Commencer une consultation
                         </button>
                      </div>
                   ) : (
                      <div className="relative pl-8 space-y-12 before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-200 dark:before:bg-slate-700">
                         {getTimelineEvents().map((event: any, idx) => (
                           <div key={idx} className="relative animate-fade-in" style={{animationDelay: `${idx * 50}ms`}}>
                              
                              {/* Timeline Dot */}
                              <div className={`
                                absolute -left-[41px] top-0 w-10 h-10 rounded-full border-4 border-gray-50 dark:border-slate-900 flex items-center justify-center shadow-sm z-10
                                ${event.type === 'consultation' ? 'bg-teal-500 text-white' : 'bg-purple-500 text-white'}
                              `}>
                                 {event.type === 'consultation' ? <Stethoscope size={18} /> : <Pill size={18} />}
                              </div>

                              {/* Card */}
                              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                                 {/* Header */}
                                 <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                                    <div>
                                       <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${event.type === 'consultation' ? 'text-teal-600 dark:text-teal-400' : 'text-purple-600 dark:text-purple-400'}`}>
                                          {event.type === 'consultation' ? 'Consultation' : 'Ordonnance'}
                                       </span>
                                       <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                          {event.type === 'consultation' ? event.data.reason : 'Prescription Médicale'}
                                       </h3>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 px-3 py-1 rounded-full self-start">
                                       <Clock size={14} />
                                       {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                 </div>

                                 {/* Content */}
                                 {event.type === 'consultation' ? (
                                    <div className="space-y-4">
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {event.data.examination && (
                                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">EXAMEN</p>
                                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{event.data.examination}</p>
                                            </div>
                                          )}
                                          {event.data.diagnosis && (
                                            <div className="bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-900/20">
                                              <p className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-1">DIAGNOSTIC</p>
                                              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{event.data.diagnosis}</p>
                                            </div>
                                          )}
                                       </div>
                                       {event.data.notes && (
                                          <div className="text-xs text-gray-400 italic pt-2 border-t border-gray-100 dark:border-slate-700">
                                             Note: {event.data.notes}
                                          </div>
                                       )}
                                    </div>
                                 ) : (
                                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-100 dark:border-slate-600">
                                       <ul className="space-y-3">
                                          {event.data.medications.map((med: any, i: number) => (
                                             <li key={i} className="flex items-start gap-3">
                                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></div>
                                                <div>
                                                   <p className="font-bold text-gray-800 dark:text-white text-sm">{med.name} <span className="text-gray-500 font-normal">{med.dosage}</span></p>
                                                   <p className="text-xs text-gray-500 dark:text-gray-400">{med.instructions} • {med.duration}</p>
                                                </div>
                                             </li>
                                          ))}
                                       </ul>
                                    </div>
                                 )}

                              </div>
                           </div>
                         ))}
                      </div>
                   )}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Consultations;