import React, { useState, useEffect } from 'react';
import { Lock, Stethoscope, ChevronRight } from 'lucide-react';
import { db } from '../services/db';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [savedPin, setSavedPin] = useState('0000');

  useEffect(() => {
    // Load fresh data on every mount
    const profile = db.getDoctorProfile();
    setDoctorName(profile.name);
    setSavedPin(profile.securityCode);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Check against the saved PIN
    if (pin === savedPin) {
      onLogin();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-black flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-transparent dark:border-slate-800">
        <div className="bg-teal-600 dark:bg-teal-800 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MediCabinet Pro</h1>
          <p className="text-teal-100 text-sm mt-1">{doctorName || 'Cabinet Médical'}</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Code d'accès
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(false);
                  }}
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-xl border text-center text-xl tracking-widest font-bold focus:outline-none focus:ring-2 transition-all
                    ${error 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300' 
                      : 'border-gray-200 dark:border-slate-700 focus:ring-teal-500 text-gray-800 dark:text-white dark:bg-slate-800'}
                  `}
                  placeholder="••••"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-red-500 text-xs mt-2 text-center">Code incorrect. Veuillez réessayer.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2 group"
            >
              Connexion
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-center text-gray-400 dark:text-gray-500 text-xs mt-4">
              Sécurité et Confidentialité Médicale
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;