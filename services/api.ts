export const API_URL = "http://192.168.2.127:3000";

export interface Espacio {
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string;
  categorias?: any[];
}

export interface Evento {
  id: number;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  id_espacio?: number;
  nombre_espacio?: string;
}

export interface Actividad {
  id: number;
  nombre: string;
  descripcion: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  id_espacio: number;
  espacio_nombre: string;
  id_evento: number;
}

interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const getPaginated = async <T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T[]> => {
  const allItems: T[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const query = new URLSearchParams({
      ...params,
      limit: "50",
      ...(cursor ? { cursor } : {}),
    });
    const response = await fetch(`${API_URL}${path}?${query.toString()}`);
    const data = await response.json();

    if (Array.isArray(data)) return data;

    const paginated = data as PaginatedResponse<T>;
    allItems.push(...(paginated.items || []));
    cursor = paginated.nextCursor;
    hasMore = Boolean(paginated.hasMore && cursor);
  }

  return allItems;
};

export const getEspacios = async (): Promise<Espacio[]> => {
  try {
    const data = await getPaginated<Espacio>("/espacio");
    console.log("Espacios obtenidos:", data);
    return data;
  } catch (error) {
    console.error("Error al obtener espacios:", error);
    throw error;
  }
};

export const getEventos = async (): Promise<Evento[]> => {
  try {
    const data = await getPaginated<Evento>("/evento", { upcoming: "true" });
    console.log("Eventos obtenidos:", data);
    return data;
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    throw error;
  }
};

export const getActividadesByEvento = async (
  eventoId: number,
): Promise<Actividad[]> => {
  try {
    const response = await fetch(`${API_URL}/actividadEv/${eventoId}`);
    const data = await response.json();
    console.log("Actividades obtenidas:", data);
    return data;
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    throw error;
  }
};

export const getCategorias = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_URL}/categoria`);
    const data = await response.json();
    console.log("Categorías obtenidas:", data);
    return data;
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    throw error;
  }
};
