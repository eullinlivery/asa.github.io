
export type Zone = 'paredes' | 'techo' | 'puertas';

export type Brand = 'Leroy Merlin' | 'Bauhaus' | 'Hiper Decoración';

export interface ColorOption {
  name: string;
  hex: string;
  brand: Brand;
}

export interface AppState {
  originalImage: string | null;
  resultImage: string | null;
  zoneColors: Record<Zone, string | null>; 
  activeZone: Zone; 
  isProcessing: boolean;
  error: string | null;
}
