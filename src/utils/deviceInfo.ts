
export type DeviceTier = 'LOW' | 'MID' | 'HIGH';

export interface DeviceInfo {
    tier: DeviceTier;
    memory?: number;
    cores?: number;
    isMobile: boolean;
}

export const getDeviceTier = (): DeviceInfo => {
    const memory = (navigator as any).deviceMemory || 4; // Default to 4GB if undetected
    const cores = navigator.hardwareConcurrency || 4;     // Default to 4 cores
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    let tier: DeviceTier = 'MID';

    // Heuristics for Tiering
    if (memory <= 2 || cores <= 4 || (isMobile && memory <= 3)) {
        tier = 'LOW';
    } else if (memory >= 8 && cores >= 8) {
        tier = 'HIGH';
    }

    // Force-low for specific known low-end ranges if necessary
    // (Optional: add UA checks for J7, Neo, etc. if tiering is still too high)

    return { tier, memory, cores, isMobile };
};

export const getTierScale = (tier: DeviceTier) => {
    switch (tier) {
        case 'LOW': return { maxDim: 720, useFilters: false, workerDebounce: 200 };
        case 'MID': return { maxDim: 1280, useFilters: true, workerDebounce: 50 };
        case 'HIGH': return { maxDim: 1920, useFilters: true, workerDebounce: 0 };
    }
};
