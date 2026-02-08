
export interface ColorSuggestion {
  hex: string;
  name: string;
}

export interface ProcessingOptions {
  threshold: number;
  edgeStrength: number;
  invert: boolean;
  contrast: number;
  brightness: number;
  blend: number;
}

export interface TransformState {
  scale: number;
  x: number;
  y: number;
  rotation: number;
}

export interface AppSettings {
  showGrid: boolean;
  gridSize: 3 | 9;
  torchOn: boolean;
  showReference: boolean;
  lockWake: boolean;
}
