
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { Appointment } from '../types';
import { Plus, Check, X, Search, ChevronDown, User } from 'lucide-react';

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(db.getAppointments());
  const patients = db.getPatients();
  const [showModal, setShowModal] = useState(false);
  const [newApt, setNewApt] = useState<Partial<Appointment>>({ date: Date.now() });

  // Autocomplete States
  const [patientSearch, setPatientSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter patients for the modal search
  const filteredPatients = patients.filter(p => 
    `${p.lastName} ${p.firstName}`.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getPatientName = (id: string) => {
    const p = patients.find(pat => pat.id === id);
    return p ? `${p.lastName} ${p.firstName}` : 'Inconnu';
  };

  const handleStatusChange = (id: string, status: 'completed' | 'cancelled') => {
    db.updateAppointmentStatus(id, status);
    setAppointments(db.getAppointments());
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApt.patientId || !newApt.date || !newApt.reason) {
      alert("Veuillez remplir tous les champs et sélectionner un patient valide.");
      return;
    }

    db.addAppointment({
      id: crypto.randomUUID(),
      patientId: newApt.patientId,
      date: new Date(newApt.date).getTime(),
      reason: newApt.reason,
      status: 'scheduled'
    });
    setAppointments(db.getAppointments());
    setShowModal(false);
  };

  const openModal = () => {
    const now = new Date();
    // Adjust for timezone offset to show correct local time in input
    const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    
    setNewApt({ date: now.getTime() }); 
    setPatientSearch(''); // Reset search
    setShowModal(true);
  };

  const selectPatient = (id: string, name: string) => {
    setNewApt(prev => ({ ...prev, patientId: id }));
    setPatientSearch(name);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Rendez-vous</h1>
        <button 
          onClick={openModal}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          Nouveau RDV
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b dark:border-slate-700">
              <tr>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Heure / Date</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Patient</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Motif</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Statut</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">Aucun rendez-vous prévu.</td>
                </tr>
              ) : (
                appointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {new Date(apt.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(apt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-200">{getPatientName(apt.patientId)}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{apt.reason}</td>
                    <td className="p-4">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-semibold
                        ${apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}
                        ${apt.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
                        ${apt.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}
                      `}>
                        {apt.status === 'scheduled' && 'Prévu'}
                        {apt.status === 'completed' && 'Terminé'}
                        {apt.status === 'cancelled' && 'Annulé'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {apt.status === 'scheduled' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleStatusChange(apt.id, 'completed')}
                            className="p-1 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 rounded"
                            title="Terminer"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                             onClick={() => handleStatusChange(apt.id, 'cancelled')}
                            className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded"
                            title="Annuler"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Planifier un RDV</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              
              {/* Autocomplete Patient Selection */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Patient</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-700 dark:text-white
                      ${!newApt.patientId && patientSearch ? 'border-orange-300' : 'dark:border-slate-600'}
                    `}
                    placeholder="Tapez le nom du patient..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setNewApt(prev => ({ ...prev, patientId: '' })); // Clear ID if user modifies name
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    required
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && patientSearch && !newApt.patientId && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                     {filteredPatients.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">Aucun patient trouvé</div>
                     ) : (
                        filteredPatients.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => selectPatient(p.id, `${p.lastName} ${p.firstName}`)}
                            className="p-3 hover:bg-teal-50 dark:hover:bg-slate-600 cursor-pointer border-b border-gray-50 dark:border-slate-600 last:border-0"
                          >
                            <div className="font-bold text-gray-800 dark:text-white">{p.lastName} {p.firstName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(p.birthDate).toLocaleDateString()} • {p.phone}</div>
                          </div>
                        ))
                     )}
                  </div>
                )}
                
                {/* Visual feedback if patient is not selected from list */}
                {patientSearch && !newApt.patientId && (
                   <p className="text-xs text-orange-500 mt-1 ml-1">Veuillez sélectionner un patient dans la liste.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date et Heure</label>
                <input 
                  type="datetime-local" 
                  className="w-full border dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500"
                  required
                  defaultValue={new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
                  onChange={e => setNewApt({...newApt, date: new Date(e.target.value).getTime()})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Motif</label>
                <input 
                  type="text" 
                  className="w-full border dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="Ex: Consultation générale"
                  required
                  onChange={e => setNewApt({...newApt, reason: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">Annuler</button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newApt.patientId}
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
