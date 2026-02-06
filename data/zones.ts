export interface Zone {
  id: string;
  pressable: boolean;
  // Para zonas rectangulares
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  // Para zonas irregulares con path SVG
  path?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // BoundingBox para zonas con path (un solo rectángulo que cubra toda el área)
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const ZONES: Zone[] = [
  // Zonas rectangulares presionables
  { id: "1", x: 49, y: 912, w: 48, h: 26, pressable: true },
  { id: "2", x: 49, y: 941, w: 48, h: 31, pressable: true },
  { id: "3", x: 49, y: 975, w: 48, h: 34, pressable: true },
  { id: "4", x: 49, y: 1012, w: 48, h: 26, pressable: true },
  { id: "5", x: 49, y: 1041, w: 48, h: 77, pressable: true },
  { id: "6", x: 100, y: 1075, w: 40, h: 43, pressable: true },
  { id: "7", x: 159, y: 1099, w: 59, h: 24, pressable: true },
  { id: "8", x: 159, y: 1075, w: 59, h: 21, pressable: true },
  { id: "9", x: 143, y: 1019, w: 66, h: 32, pressable: true },
  { id: "10", x: 143, y: 976, w: 74, h: 40, pressable: true },
  { id: "11", x: 143, y: 928, w: 74, h: 45, pressable: true },
  { id: "12", x: 143, y: 881, w: 74, h: 44, pressable: true },
  { id: "13", x: 143, y: 802, w: 75, h: 44, pressable: true },

  // Zona irregular (path personalizado)
  {
    id: "14",
    path: "M264 846H221V799H199V761H264V846Z",
    pressable: true,
    boundingBox: { x: 199, y: 761, width: 65, height: 85 },
  },

  { id: "15", x: 267, y: 796, w: 45, h: 50, pressable: true },
  { id: "16", x: 267, y: 761, w: 45, h: 32, pressable: true },
  { id: "17", x: 49, y: 751, w: 48, h: 72, pressable: true },
  { id: "18", x: 103, y: 624, w: 69, h: 46, pressable: true },
  { id: "19", x: 199, y: 630, w: 84, h: 95, pressable: true },
  { id: "20", x: 286, y: 702, w: 43, h: 23, pressable: true },
  { id: "21", x: 332, y: 702, w: 30, h: 23, pressable: true },
  { id: "22", x: 365, y: 702, w: 30, h: 23, pressable: true },
  { id: "23", x: 309, y: 556, w: 93, h: 120, pressable: true },
  { id: "24", x: 452, y: 680, w: 55, h: 45, pressable: true },
  { id: "25", x: 452, y: 584, w: 55, h: 93, pressable: true },
  { id: "26", x: 452, y: 536, w: 55, h: 45, pressable: true },
  { id: "27", x: 309, y: 313, w: 93, h: 240, pressable: true },
  { id: "28", x: 452, y: 471, w: 84, h: 62, pressable: true },
  { id: "29", x: 452, y: 413, w: 84, h: 55, pressable: true },
  { id: "30", x: 452, y: 354, w: 84, h: 56, pressable: true },
  { id: "31", x: 452, y: 295, w: 84, h: 56, pressable: true },
  { id: "32", x: 452, y: 237, w: 84, h: 55, pressable: true },
  { id: "33", x: 452, y: 178, w: 84, h: 56, pressable: true },
  { id: "34", x: 452, y: 121, w: 84, h: 54, pressable: true },
  { id: "35", x: 428, y: 3, w: 108, h: 115, pressable: true },
];
