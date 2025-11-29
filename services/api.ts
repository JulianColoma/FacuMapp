const API_URL = 'http://192.168.0.168:3000';

export interface Espacio {
  id: number;
  nombre: string;
  descripcion?: string;
}

export const getEspacios = async () => {
  try {
    const response = await fetch(`${API_URL}/espacio`);
    const data = await response.json();
    console.log('Espacios obtenidos:', data);
    return data;
  } catch (error) {
    console.error('Error al obtener espacios:', error);
    throw error;
  }
};