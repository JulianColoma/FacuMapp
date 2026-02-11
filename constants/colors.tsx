export const COLORS = {
  verde: '#38dc26ff',
  verde_claro: '#e2fee3ff',
  amarillo: '#FFA500ff',
  gris: '#afafafff',
  blanco: '#ffffffff',

} as const;

// Opcional: combinaciones específicas para espacios
export const SPACE_COLORS = {
  default: {
    fill: COLORS.verde_claro,
    stroke: COLORS.verde,
  },
  aula: {
    fill: COLORS.verde_claro,
    stroke: COLORS.verde,
  },
} as const;