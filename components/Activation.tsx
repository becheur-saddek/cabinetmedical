
import React, { useState } from 'react';
import { activationService } from '../services/activation';
import { ShieldAlert, Unlock, Phone, Clock } from 'lucide-react';

interface ActivationProps {
  onActivate: () => void;
}

const Activation: React.FC<ActivationProps> = ({ onActivate }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const deviceId = activationService.getDeviceId();
  const status = activationService.getLicenseStatus();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activationService.activate(key)) {
      alert("Application activée avec succès !");
      onActivate();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-red-600 p-6 text-center text-white">
          {status === 'expired' ? (
             <Clock className="w-12 h-12 mx-auto mb-2" />
          ) : (
             <ShieldAlert className="w-12 h-12 mx-auto mb-2" />
          )}
          
          <h1 className="text-2xl font-bold">
            {status === 'expired' ? "Période d'essai Expirée" : "Activation Requise"}
          </h1>
          <p className="text-red-100 opacity-90 text-sm mt-1">
             {status === 'expired' 
               ? "Votre période d'essai de 7 jours est terminée. Veuillez activer l'application pour continuer." 
               : "Cette copie de MediCabinet Pro n'est pas activée."}
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
            <p className="text-gray-500 text-sm font-medium mb-1">Votre ID d'installation :</p>
            <p className="text-3xl font-mono font-bold text-slate-800 tracking-wider select-all cursor-pointer" title="Cliquer pour copier" onClick={() => {navigator.clipboard.writeText(deviceId); alert('ID copié !')}}>
              {deviceId}
            </p>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Pour obtenir votre code d'activation définitif, veuillez contacter :</p>
            <div className="flex items-center justify-center gap-2 mt-2 font-bold text-slate-800">
              <Phone size={16} className="text-teal-600"/>
              <span>0555 32 31 94 (BECHEUR Saddek)</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Communiquez-lui l'ID ci-dessus.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entrez le code d'activation</label>
              <input 
                type="text" 
                className={`w-full p-3 text-center text-lg font-mono border-2 rounded-xl focus:outline-none uppercase tracking-widest
                  ${error ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-500'}
                `}
                placeholder="XXXX-XXXX"
                value={key}
                onChange={e => {setKey(e.target.value); setError(false);}}
              />
              {error && <p className="text-red-500 text-xs mt-2 text-center">Code invalide. Vérifiez l'ID et réessayez.</p>}
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Unlock size={20} />
              Débloquer l'application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Activation;
