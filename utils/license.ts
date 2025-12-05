export const generateLicenseKey = (deviceId: string, secret: string = 'MEDICABINET_SECRET_2025'): string => {
    // Simple custom latch generation: 
    // 1. Concat ID + Secret
    // 2. Hash or shuffle
    // 3. Format as XXXX-XXXX-XXXX-XXXX

    const source = `${deviceId}-${secret}`;
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
        hash = ((hash << 5) - hash) + source.charCodeAt(i);
        hash |= 0;
    }

    // Create a deterministic sequence from hash
    const seeds = Math.abs(hash).toString().split('').map(Number);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 to avoid confusion
    let key = "";

    for (let i = 0; i < 16; i++) {
        const seedIndex = (i + (seeds[i % seeds.length] || 0)) % chars.length;
        key += chars[seedIndex];
        if ((i + 1) % 4 === 0 && i !== 15) key += "-";
    }

    return key;
};

export const validateLicenseKey = (key: string, deviceId: string, secret: string = 'MEDICABINET_SECRET_2025'): boolean => {
    const expected = generateLicenseKey(deviceId, secret);
    return key === expected;
};
