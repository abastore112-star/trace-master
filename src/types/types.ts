
export interface ProcessingOptions {
    threshold: number;
    edgeStrength: number;
    invert: boolean;
    contrast: number;
    brightness: number;
    blend: number;
    isSketch?: boolean;
    isPerfectSketch?: boolean;
    specialAction?: 'magicEraser';
    startX?: number;
    startY?: number;
    tolerance?: number;
}

export interface TransformState {
    scale: number;
    x: number;
    y: number;
    rotation: number;
}

export interface AppSettings {
    showGrid: boolean;
    gridSize: number;
    torchOn: boolean;
    showReference: boolean;
    lockWake: boolean;
}

export interface DeviceInfo {
    tier: 'LOW' | 'MID' | 'HIGH';
    memory?: number;
    cores?: number;
}
