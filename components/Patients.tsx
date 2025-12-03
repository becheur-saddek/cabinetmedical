import React, { useState } from 'react';
import { db } from '../services/db';
import { Patient, Gender, Prescription } from '../types';
import { generatePrescriptionPDF, generateReferralPDF, generateSickLeavePDF } from '../utils/pdfGenerator';
import { 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  Trash2, 
  X,
  FileText,
  Clock,
  Printer,
  Pill,
  User,
  Activity,
  AlertCircle,
  Stethoscope,
  Send,
  CalendarCheck
} from 'lucide-react';

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(db.getPatients());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<{patient: Patient, prescriptions: Prescription[]} | null>(null);
  
  // Right Panel View Mode in Patient Modal
  const [viewMode, setViewMode] = useState<'history' | 'orientation' | 'sickleave'>('history');
  
  // Document Forms State
  const [referralText, setReferralText] = useState('');
  const [sickLeave, setSickLeave] = useState({ days: 3, startDate: new Date().toISOString().split('T')[0] });

  // Form State for New Patient
  const [formData, setFormData] = useState<Partial<Patient>>({
    gender: Gender.Male
  });

  const filteredPatients = patients.filter(p => 
    p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Êtes-vous sûr de vouloir supprimer ce patient ?")) {
      db.deletePatient(id);
      setPatients(db.getPatients());
    }
  };

  const handleOpenHistory = (patient: Patient) => {
    const history = db.getPrescriptionsByPatient(patient.id);
    setSelectedPatientHistory({
      patient: patient,
      prescriptions: history
    });
    setViewMode('history');
    setReferralText(`Cher confrère,\n\nJe vous adresse ce patient, ${patient.gender === 'Homme' ? 'Mr' : 'Mme'} ${patient.lastName} ${patient.firstName}, pour une prise en charge spécialisée concernant...\n\nAntécédents: ${patient.medicalHistory || 'Aucun'}.\n\nConfraternellement.`);
  };

  const handleReprint = (prescription: Prescription) => {
    if (selectedPatientHistory?.patient) {
      generatePrescriptionPDF(selectedPatientHistory.patient, prescription);
    }
  };

  const handlePrintReferral = () => {
    if (selectedPatientHistory?.patient) {
      generateReferralPDF(selectedPatientHistory.patient, referralText);
    }
  };

  const handlePrintSickLeave = () => {
    if (selectedPatientHistory?.patient) {
      const start = new Date(sickLeave.startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + (sickLeave.days - 1));
      generateSickLeavePDF(selectedPatientHistory.patient, sickLeave.days, sickLeave.startDate, end.toISOString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    const newPatient: Patient = {
      id: crypto.randomUUID(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      birthDate: formData.birthDate || '',
      gender: formData.gender as Gender,
      phone: formData.phone || '',
      address: formData.address || '',
      medicalHistory: formData.medicalHistory || '',
      allergies: formData.allergies || '',
      createdAt: Date.now()
    };

    db.addPatient(newPatient);
    setPatients(db.getPatients());
    setIsAddModalOpen(false);
    setFormData({ gender: Gender.Male });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Patients</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={20} />
          Nouveau Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Rechercher par nom..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patient List (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPatients.map(patient => (
          <div 
            key={patient.id} 
            onClick={() => handleOpenHistory(patient)}
            className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative group flex flex-col justify-between h-full cursor-pointer"
          >
             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={(e) => handleDelete(patient.id, e)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded bg-white dark:bg-slate-700 shadow-sm border border-red-100 dark:border-red-900"
                  title="Supprimer le patient"
                >
                  <Trash2 size={18} />
                </button>
             </div>

             <div>
               <div className="flex items-start gap-4">
                 <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold text-white
                   ${patient.gender === Gender.Male ? 'bg-blue-500' : 'bg-pink-500'}
                 `}>
                   {patient.firstName[0]}{patient.lastName[0]}
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-800 dark:text-white">{patient.lastName} {patient.firstName}</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(patient.birthDate).toLocaleDateString()}</p>
                   <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                     <Phone size={14} />
                     <span>{patient.phone}</span>
                   </div>
                   <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                     <MapPin size={14} />
                     <span className="truncate max-w-[150px]">{patient.address}</span>
                   </div>
                 </div>
               </div>
               
               <div className="mt-4 flex gap-2 flex-wrap">
                 <span className="text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                   {patient.gender}
                 </span>
                 {patient.allergies && (
                    <span className="text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                      Allergie: {patient.allergies}
                    </span>
                 )}
               </div>
             </div>

             <div className="mt-5 pt-3 border-t border-gray-50 dark:border-slate-700">
                <button 
                  className="w-full py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText size={16} />
                  Voir Dossier Complet
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* History & Details Modal */}
      {selectedPatientHistory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[90vh] border border-gray-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center bg-teal-600 text-white shrink-0">
              <div>
                <h2 className="text-lg font-bold">Dossier Patient</h2>
                <p className="text-sm text-teal-100 opacity-90">
                  {selectedPatientHistory.patient.lastName} {selectedPatientHistory.patient.firstName}
                </p>
              </div>
              <button onClick={() => setSelectedPatientHistory(null)} className="text-white hover:bg-teal-700 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Sidebar: Patient Info */}
              <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950 p-6 border-r border-gray-200 dark:border-slate-800 overflow-y-auto shrink-0">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <User className="text-teal-600" size={20}/>
                      Informations
                  </h3>
                  
                  <div className="space-y-6">
                      {/* Identity */}
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Identité</label>
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3
                             ${selectedPatientHistory.patient.gender === Gender.Male ? 'bg-blue-500' : 'bg-pink-500'}
                          `}>
                             {selectedPatientHistory.patient.firstName[0]}{selectedPatientHistory.patient.lastName[0]}
                          </div>
                          <p className="font-bold text-gray-800 dark:text-white text-lg">{selectedPatientHistory.patient.lastName}</p>
                          <p className="text-gray-600 dark:text-gray-300">{selectedPatientHistory.patient.firstName}</p>
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 text-sm text-gray-500 dark:text-gray-400">
                             <p>Né(e) le {new Date(selectedPatientHistory.patient.birthDate).toLocaleDateString()}</p>
                             <p>{new Date().getFullYear() - new Date(selectedPatientHistory.patient.birthDate).getFullYear()} ans • {selectedPatientHistory.patient.gender}</p>
                          </div>
                      </div>

                      {/* Contact */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Contact</label>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                <Phone size={18} className="text-gray-400 mt-0.5"/>
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{selectedPatientHistory.patient.phone || 'Non renseigné'}</span>
                            </div>
                            <div className="flex items-start gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                <MapPin size={18} className="text-gray-400 mt-0.5"/>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{selectedPatientHistory.patient.address || 'Non renseigné'}</span>
                            </div>
                          </div>
                      </div>

                      {/* Medical */}
                       <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Médical</label>
                          
                          <div className="space-y-3">
                              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                                      <Activity size={16} className="text-orange-500"/>
                                      Antécédents
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedPatientHistory.patient.medicalHistory || 'Aucun'}
                                  </p>
                              </div>

                              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                                      <AlertCircle size={16} className="text-red-500"/>
                                      Allergies
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedPatientHistory.patient.allergies || 'Aucune'}
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Main Content Area (Tabs + Content) */}
              <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
                {/* Tabs / Toolbar */}
                <div className="p-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex items-center gap-2 shrink-0 overflow-x-auto">
                   <button 
                    onClick={() => setViewMode('history')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap
                      ${viewMode === 'history' 
                        ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow border border-gray-100 dark:border-slate-700' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}
                    `}
                   >
                     <FileText size={16} /> Historique
                   </button>
                   <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-2"></div>
                   <button 
                    onClick={() => setViewMode('orientation')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap
                      ${viewMode === 'orientation' 
                        ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow border border-gray-100 dark:border-slate-700' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}
                    `}
                   >
                     <Send size={16} /> Lettre Orientation
                   </button>
                   <button 
                    onClick={() => setViewMode('sickleave')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap
                      ${viewMode === 'sickleave' 
                        ? 'bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 shadow border border-gray-100 dark:border-slate-700' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}
                    `}
                   >
                     <CalendarCheck size={16} /> Certificat Maladie
                   </button>
                </div>

                {/* Content based on Tab */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-slate-900">
                  
                  {/* VIEW: HISTORY */}
                  {viewMode === 'history' && (
                    <>
                       {selectedPatientHistory.prescriptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
                          <FileText className="w-16 h-16 mb-4 opacity-20" />
                          <p>Aucune ordonnance enregistrée pour ce patient.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedPatientHistory.prescriptions.map((prescription) => (
                            <div key={prescription.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-semibold">
                                  <Clock size={18} />
                                  <span>{new Date(prescription.date).toLocaleDateString()}</span>
                                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                                     à {new Date(prescription.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                                <button 
                                  onClick={() => handleReprint(prescription)}
                                  className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 text-xs border border-gray-200 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors font-medium"
                                  title="Réimprimer"
                                >
                                  <Printer size={14} />
                                  Imprimer
                                </button>
                              </div>

                              <div className="space-y-3">
                                {prescription.medications.map((med, idx) => (
                                  <div key={idx} className="flex items-start gap-3">
                                    <div className="mt-1">
                                      <Pill size={14} className="text-teal-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                        {med.name} <span className="text-gray-500 dark:text-gray-400 text-xs">({med.dosage})</span>
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                                        {med.instructions} - Pendant {med.duration}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* VIEW: ORIENTATION */}
                  {viewMode === 'orientation' && (
                    <div className="max-w-2xl mx-auto">
                       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                          <div className="flex items-center gap-3 mb-6">
                             <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <Send size={24} />
                             </div>
                             <div>
                               <h3 className="text-lg font-bold text-gray-800 dark:text-white">Lettre d'Orientation</h3>
                               <p className="text-sm text-gray-500 dark:text-gray-400">Rédigez une lettre pour un confrère</p>
                             </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contenu de la lettre</label>
                               <textarea 
                                  value={referralText}
                                  onChange={(e) => setReferralText(e.target.value)}
                                  className="w-full h-64 p-4 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans text-gray-700 dark:text-gray-200 dark:bg-slate-900 leading-relaxed"
                                  placeholder="Rédigez votre lettre ici..."
                               />
                            </div>
                            
                            <div className="flex justify-end pt-2">
                               <button 
                                onClick={handlePrintReferral}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                               >
                                  <Printer size={20} />
                                  Générer PDF
                               </button>
                            </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* VIEW: SICK LEAVE */}
                  {viewMode === 'sickleave' && (
                    <div className="max-w-xl mx-auto">
                       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                          <div className="flex items-center gap-3 mb-6">
                             <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                                <CalendarCheck size={24} />
                             </div>
                             <div>
                               <h3 className="text-lg font-bold text-gray-800 dark:text-white">Certificat de Maladie</h3>
                               <p className="text-sm text-gray-500 dark:text-gray-400">Générer un arrêt de travail</p>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de jours</label>
                                   <input 
                                      type="number"
                                      min="1"
                                      value={sickLeave.days}
                                      onChange={(e) => setSickLeave({...sickLeave, days: parseInt(e.target.value) || 1})}
                                      className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg font-bold dark:bg-slate-900 dark:text-white"
                                   />
                                </div>
                                <div>
                                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de début</label>
                                   <input 
                                      type="date"
                                      value={sickLeave.startDate}
                                      onChange={(e) => setSickLeave({...sickLeave, startDate: e.target.value})}
                                      className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-900 dark:text-white"
                                   />
                                </div>
                             </div>
                             
                             <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-900/40">
                                <h4 className="font-bold text-orange-800 dark:text-orange-400 text-sm mb-2">Aperçu des dates</h4>
                                <div className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300">
                                   <span>Du : <strong>{new Date(sickLeave.startDate).toLocaleDateString()}</strong></span>
                                   <span>Au : <strong>
                                     {(() => {
                                        const d = new Date(sickLeave.startDate);
                                        d.setDate(d.getDate() + (sickLeave.days - 1));
                                        return d.toLocaleDateString();
                                     })()}
                                   </strong> (inclus)</span>
                                </div>
                             </div>

                             <div className="flex justify-end pt-2">
                               <button 
                                onClick={handlePrintSickLeave}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-orange-600/20"
                               >
                                  <Printer size={20} />
                                  Générer Certificat
                               </button>
                            </div>
                          </div>
                       </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Nouveau Patient</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
                  <input required type="text" className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                  <input required type="text" className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de naissance</label>
                  <input required type="date" className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexe</label>
                  <select className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value as Gender})}>
                    <option value={Gender.Male}>Homme</option>
                    <option value={Gender.Female}>Femme</option>
                    <option value={Gender.Other}>Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                <input type="tel" className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                <input type="text" className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Antécédents médicaux</label>
                <textarea className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 h-20 dark:bg-slate-700 dark:text-white"
                  onChange={e => setFormData({...formData, medicalHistory: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allergies</label>
                <input type="text" className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                  onChange={e => setFormData({...formData, allergies: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                  Annuler
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;