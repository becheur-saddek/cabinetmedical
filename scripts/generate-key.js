// Standalone Key Generator for MediCabinet Pro
// Usage: node scripts/generate-key.js <DEVICE_ID>

const generateLicenseKey = (deviceId, secret = 'MEDICABINET_SECRET_2025') => {
    const source = `${deviceId}-${secret}`;
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
        hash = ((hash << 5) - hash) + source.charCodeAt(i);
        hash |= 0;
    }

    const seeds = Math.abs(hash).toString().split('').map(Number);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let key = "";

    for (let i = 0; i < 16; i++) {
        const seedIndex = (i + (seeds[i % seeds.length] || 0)) % chars.length;
        key += chars[seedIndex];
        if ((i + 1) % 4 === 0 && i !== 15) key += "-";
    }

    return key;
};

// Main Execution
const args = process.argv.slice(2);
const deviceId = args[0];

if (!deviceId) {
    console.error("Error: Please provide a Device ID.");
    console.log("Usage: node scripts/generate-key.js <DEVICE_ID>");
    process.exit(1);
}

const key = generateLicenseKey(deviceId.trim());

console.log("\n========================================");
console.log("MEDICABINET PRO - LICENSE GENERATOR");
console.log("========================================");
console.log(`Device ID:  ${deviceId}`);
console.log(`Secret:     ***SECURE***`);
console.log("----------------------------------------");
console.log(`LICENSE KEY: \x1b[32m${key}\x1b[0m`);
console.log("========================================\n");
