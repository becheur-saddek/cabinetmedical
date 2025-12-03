
const DEVICE_ID_KEY = 'medicab_device_id';
const LICENSE_KEY = 'medicab_license_key';
const FIRST_RUN_KEY = 'medicab_first_run_date';
const SECRET_SALT = 'MEDICAB_2025_SADDEK_SECURE_SALT';
const TRIAL_DURATION_DAYS = 7;

// Simple string hash function for offline usage
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
};

export type LicenseStatus = 'active' | 'trial' | 'expired';

export const activationService = {
  getDeviceId: (): string => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      // Generate a random 4-char segment ID like "DEV-X9A2"
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      id = `MED-${randomPart}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  },

  // Initialize trial if not present
  initFirstRun: () => {
    if (!localStorage.getItem(FIRST_RUN_KEY)) {
      localStorage.setItem(FIRST_RUN_KEY, Date.now().toString());
    }
  },

  getLicenseStatus: (): LicenseStatus => {
    // 1. Check if fully activated with key
    const id = activationService.getDeviceId();
    const storedKey = localStorage.getItem(LICENSE_KEY);
    const expectedKey = activationService.generateKeyForId(id);
    
    if (storedKey === expectedKey) {
      return 'active';
    }

    // 2. Check Trial Period
    const firstRunStr = localStorage.getItem(FIRST_RUN_KEY);
    if (!firstRunStr) {
      // Should have been set on init, but safety check
      return 'trial'; 
    }

    const firstRunDate = parseInt(firstRunStr, 10);
    const now = Date.now();
    const diffTime = Math.abs(now - firstRunDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays <= TRIAL_DURATION_DAYS) {
      return 'trial';
    }

    return 'expired';
  },

  getTrialDaysRemaining: (): number => {
    const firstRunStr = localStorage.getItem(FIRST_RUN_KEY);
    if (!firstRunStr) return TRIAL_DURATION_DAYS;
    
    const firstRunDate = parseInt(firstRunStr, 10);
    const now = Date.now();
    const diffTime = Math.abs(now - firstRunDate);
    const usedDays = diffTime / (1000 * 60 * 60 * 24);
    
    return Math.max(0, Math.ceil(TRIAL_DURATION_DAYS - usedDays));
  },

  // Wrapper for App.tsx router guard
  canAccessApp: (): boolean => {
    const status = activationService.getLicenseStatus();
    return status === 'active' || status === 'trial';
  },

  activate: (key: string): boolean => {
    const id = activationService.getDeviceId();
    const expectedKey = activationService.generateKeyForId(id);
    
    if (key.trim().toUpperCase() === expectedKey) {
      localStorage.setItem(LICENSE_KEY, expectedKey);
      return true;
    }
    return false;
  },

  generateKeyForId: (deviceId: string): string => {
    // Logic: Hash(ID + Salt) -> take substring -> format
    const raw = `${deviceId}:${SECRET_SALT}`;
    const hash = simpleHash(raw);
    
    // Mix it up a bit more to look professional (e.g. A1B2-C3D4)
    const part1 = hash.substring(0, 4);
    const part2 = hash.substring(4, 8);
    return `${part1}-${part2}`;
  },
  
  deactivate: () => {
    localStorage.removeItem(LICENSE_KEY);
    window.location.reload();
  }
};
