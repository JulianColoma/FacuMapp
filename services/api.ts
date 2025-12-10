const API_URL = 'http://localhost:3000';

export interface Espacio {
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string;
  categorias?: any[];  // ← Agregar esta propiedad
}

export interface Evento {
  id: number;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export const getEspacios = async (): Promise<Espacio[]> => {
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

export const getEventos = async (): Promise<Evento[]> => {
  try {
    const response = await fetch(`${API_URL}/evento`);
    const data = await response.json();
    console.log('Eventos obtenidos:', data);
    return data;
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    throw error;
  }
};