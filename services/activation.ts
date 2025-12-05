import { generateLicenseKey, validateLicenseKey } from '../utils/license';

const DEVICE_ID_KEY = 'medicab_device_id';
const LICENSE_KEY = 'medicab_license_key';
const FIRST_RUN_KEY = 'medicab_first_run_date';
const TRIAL_DURATION_DAYS = 7;

export type LicenseStatus = 'active' | 'trial' | 'expired';

export const activationService = {
  getDeviceId: (): string => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      // Generate a random 4-char segment ID like "MED-X9A2"
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      id = `MED-${randomPart}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  },

  initFirstRun: () => {
    if (!localStorage.getItem(FIRST_RUN_KEY)) {
      localStorage.setItem(FIRST_RUN_KEY, Date.now().toString());
    }
  },

  getLicenseStatus: (): LicenseStatus => {
    const id = activationService.getDeviceId();
    const storedKey = localStorage.getItem(LICENSE_KEY);

    // Check if fully activated
    if (storedKey && validateLicenseKey(storedKey, id)) {
      return 'active';
    }

    // Check Trial Period
    const firstRunStr = localStorage.getItem(FIRST_RUN_KEY);
    if (!firstRunStr) return 'trial';

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

  canAccessApp: (): boolean => {
    const status = activationService.getLicenseStatus();
    return status === 'active' || status === 'trial';
  },

  activate: (key: string): boolean => {
    const id = activationService.getDeviceId();
    if (validateLicenseKey(key.trim(), id)) {
      localStorage.setItem(LICENSE_KEY, key.trim());
      return true;
    }
    return false;
  },

  deactivate: () => {
    localStorage.removeItem(LICENSE_KEY);
    window.location.reload();
  },

  // Legacy support or direct generation if needed
  generateKeyForId: (deviceId: string): string => {
    return generateLicenseKey(deviceId);
  }
};
