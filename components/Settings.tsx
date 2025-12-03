
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { activationService, LicenseStatus } from '../services/activation';
import { DoctorProfile } from '../types';
import { Save, RefreshCw, AlertTriangle, Lock, ShieldCheck, Copy, Clock, Unlock, Key, X } from 'lucide-react';

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<DoctorProfile>({
    name: '',
    specialty: '',
    address: '',
    phone: '',
    email: '',
    securityCode: ''
  });

  const [saved, setSaved] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>('active');
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [activationKey, setActivationKey] = useState('');
  
  // Modal State handling
  const [activeModal, setActiveModal] = useState<'reset' | 'deactivate' | null>(null);
  
  const deviceId = activationService.getDeviceId();

  useEffect(() => {
    setProfile(db.getDoctorProfile());
    setLicenseStatus(activationService.getLicenseStatus());
    setTrialDaysLeft(activationService.getTrialDaysRemaining());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
    setSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateDoctorProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const confirmReset = () => {
    db.resetDatabase();
    setActiveModal(null);
  };
  
  const confirmDeactivate = () => {
    activationService.deactivate();
    setActiveModal(null);
  };

  const handleActivateTrial = () => {
    if (activationService.activate(activationKey)) {
      alert("Application activée avec succès ! Merci de votre confiance.");
      setLicenseStatus('active');
      setActivationKey('');
    } else {
      alert("Clé invalide. Vérifiez votre saisie.");
    }
  };

  const handleCopyId = async () => {
    try {
        await navigator.clipboard.writeText(deviceId);
        alert("ID Copié !");
    } catch (err) {
        // Fallback or simple alert
        alert("Veuillez sélectionner et copier l'ID manuellement.");
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Configuration du Cabinet</h1>

      {/* NEW LICENSE SECTION */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-teal-600" />
          Licence & Activation
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status & ID Card */}
            <div className="space-y-4">
                {/* Status Indicator */}
                <div className={`p-4 rounded-xl border flex items-center justify-between
                    ${licenseStatus === 'active' 
                        ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800' 
                        : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    }`}>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 text-gray-600 dark:text-gray-300">État de la licence</p>
                        <div className="flex items-center gap-2">
                             {licenseStatus === 'active' ? (
                                <ShieldCheck className="text-teal-600 dark:text-teal-400" size={24} />
                             ) : (
                                <Clock className="text-orange-600 dark:text-orange-400" size={24} />
                             )}
                             <span className={`text-xl font-bold ${licenseStatus === 'active' ? 'text-teal-800 dark:text-teal-300' : 'text-orange-800 dark:text-orange-300'}`}>
                                {licenseStatus === 'active' ? 'ACTIVÉ (VERSION PRO)' : `MODE ESSAI (${trialDaysLeft} Jours restants)`}
                             </span>
                        </div>
                    </div>
                </div>

                {/* Device ID Display - BIG AND CLEAR */}
                <div className="p-5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 shadow-inner">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        ID Appareil (À communiquer à l'administrateur)
                    </p>
                    <div className="flex items-center gap-3">
                        <code className="flex-1 text-3xl font-mono font-bold text-gray-800 dark:text-white tracking-widest select-all text-center">
                            {deviceId}
                        </code>
                        <button 
                            onClick={handleCopyId}
                            className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 transition-colors shadow-sm"
                            title="Copier l'ID"
                        >
                            <Copy size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Activation Form */}
            <div className="flex flex-col justify-center space-y-4 p-4 lg:pl-8 lg:border-l border-gray-100 dark:border-slate-700">
                 {licenseStatus !== 'active' ? (
                     <>
                        <div className="mb-2">
                            <h3 className="font-bold text-gray-800 dark:text-white">Activer le produit</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Saisissez la clé fournie par l'administrateur pour débloquer la version complète.</p>
                        </div>
                        <div className="space-y-3">
                            <input 
                                type="text"
                                value={activationKey}
                                onChange={(e) => setActivationKey(e.target.value)}
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                className="w-full p-4 border dark:border-slate-600 rounded-xl font-mono text-lg uppercase focus:ring-2 focus:ring-teal-500 dark:bg-slate-900 dark:text-white text-center tracking-widest"
                            />
                            <button 
                                onClick={handleActivateTrial}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                            >
                                <Unlock size={20} />
                                Valider la Clé
                            </button>
                        </div>
                     </>
                 ) : (
                     <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-80">
                         <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400">
                             <ShieldCheck size={32} />
                         </div>
                         <div>
                             <p className="font-bold text-gray-800 dark:text-white">Licence Valide</p>
                             <p className="text-sm text-gray-500 dark:text-gray-400">Merci d'utiliser MediCabinet Pro.</p>
                         </div>
                         <button 
                            onClick={() => setActiveModal('deactivate')}
                            className="text-red-500 hover:text-red-600 text-sm hover:underline"
                        >
                            Désactiver la licence sur cet appareil
                        </button>
                     </div>
                 )}
            </div>
        </div>
      </div>

      {/* Doctor Profile Form */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          Coordonnées du Médecin
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Ces informations apparaîtront sur les ordonnances imprimées.</p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet</label>
              <input 
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Ex: Dr. Martin Philippe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spécialité</label>
              <input 
                name="specialty"
                value={profile.specialty}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Ex: Médecine Générale"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse du cabinet</label>
            <input 
              name="address"
              value={profile.address}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Ex: 10 Rue de la Paix, 75000 Paris"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
              <input 
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Ex: 01 23 45 67 89"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input 
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Ex: contact@cabinet.com"
              />
            </div>
          </div>
          
          <hr className="my-6 border-gray-100 dark:border-slate-700" />
          
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-600" />
            Sécurité
          </h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code d'accès (Login)</label>
            <input 
              name="securityCode"
              value={profile.securityCode}
              onChange={handleChange}
              type="text"
              pattern="\d*"
              maxLength={6}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 tracking-widest font-mono dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="0000"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ce code est requis pour accéder à l'application.</p>
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button 
              type="submit" 
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 shadow-md"
            >
              <Save size={18} />
              Enregistrer
            </button>
            {saved && <span className="text-green-600 text-sm font-medium animate-pulse">Modifications enregistrées !</span>}
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
        <h2 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
          <AlertTriangle size={20} />
          Zone de danger
        </h2>
        <p className="text-sm text-red-600 dark:text-red-300 mb-4">
          La remise à zéro permet de vider toutes les listes (patients, rendez-vous, consultations) pour repartir sur un tableau de bord vierge, sans perdre vos paramètres ni vos médicaments enregistrés.
        </p>
        <button 
          onClick={() => setActiveModal('reset')}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Vider les dossiers patients (Conserver mon profil)
        </button>
      </div>

      {/* Credits */}
      <div className="text-center pt-8 border-t border-gray-200 dark:border-slate-700 mt-8">
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          Application développée par
        </p>
        <p className="text-slate-800 dark:text-slate-200 font-bold text-lg mt-1">
          BECHEUR Saddek
        </p>
        <p className="text-teal-600 font-mono mt-1">
          0555323194
        </p>
        <p className="text-gray-400 dark:text-gray-600 text-xs mt-4">
          © {new Date().getFullYear()} MediCabinet Pro. Tous droits réservés.
        </p>
      </div>

      {/* --- CONFIRMATION MODALS --- */}
      
      {/* 1. RESET MODAL */}
      {activeModal === 'reset' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-fade-in">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <AlertTriangle size={32} />
              <h3 className="text-xl font-bold">Confirmation requise</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              ATTENTION : Cette action va vider toutes les listes (Patients, RDV, Ordonnances) pour remettre les compteurs à zéro.
              <br/><br/>
              Votre profil et vos médicaments enregistrés seront <strong className="text-teal-600 dark:text-teal-400">CONSERVÉS</strong>.
              <br/><br/>
              Êtes-vous sûr de vouloir continuer ?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-600/20 transition-transform active:scale-95"
              >
                Oui, vider les dossiers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DEACTIVATE MODAL */}
      {activeModal === 'deactivate' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-fade-in">
             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
                  <Lock size={28} />
                  <h3 className="text-lg font-bold">Désactiver la licence ?</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              L'application sera verrouillée et vous devrez saisir à nouveau la clé d'activation pour y accéder.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDeactivate}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg shadow-orange-600/20 transition-transform active:scale-95"
              >
                Confirmer la désactivation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
