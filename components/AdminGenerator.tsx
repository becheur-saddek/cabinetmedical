
import React, { useState } from 'react';
import { activationService } from '../services/activation';
import { Key, Lock, Copy } from 'lucide-react';

const AdminGenerator: React.FC = () => {
  const [adminPass, setAdminPass] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const [clientId, setClientId] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  // Simple hardcoded protection for this page so clients don't use it easily
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === 'admin123') { // Simple password for the dev
      setIsUnlocked(true);
    } else {
      alert('Accès refusé');
    }
  };

  const handleGenerate = () => {
    if (!clientId) return;
    const key = activationService.generateKeyForId(clientId.trim());
    setGeneratedKey(key);
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <form onSubmit={handleAuth} className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="text-red-500" /> Zone Admin
          </h2>
          <input 
            type="password" 
            placeholder="Mot de passe admin" 
            className="w-full p-2 border rounded mb-4"
            value={adminPass}
            onChange={e => setAdminPass(e.target.value)}
          />
          <button className="w-full bg-red-600 text-white py-2 rounded font-bold">Entrer</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full border border-teal-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <div className="bg-teal-100 p-2 rounded-lg text-teal-700">
            <Key size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Générateur de Licence</h1>
            <p className="text-xs text-gray-500">Outil réservé à BECHEUR Saddek</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID du Client (ex: MED-X9A2)</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-lg font-mono text-lg uppercase focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="MED-XXXX"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!clientId}
            className="w-full py-3 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50"
          >
            Générer la Clé
          </button>

          {generatedKey && (
            <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-200 animate-fade-in">
              <p className="text-center text-sm text-green-700 font-medium mb-2">Clé d'activation :</p>
              <div 
                className="text-3xl font-mono font-bold text-center text-green-800 tracking-widest cursor-pointer select-all flex items-center justify-center gap-2"
                onClick={() => {navigator.clipboard.writeText(generatedKey); alert('Copié !')}}
              >
                {generatedKey}
                <Copy size={20} className="text-green-600 opacity-50" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGenerator;
