// queryClient.ts
import { QueryClient } from "@tanstack/react-query";

/**
 * Instancia global de QueryClient con configuración predeterminada
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo durante el cual los datos se consideran frescos (5 minutos)
      staleTime: 5 * 60 * 1000,
      // Tiempo antes de que se eliminen del caché (10 minutos)
      gcTime: 10 * 60 * 1000,
    },
  },
});

/**
 * URL base de la API
 * Deja como cadena vacía para usar proxy de Vite (vite.config.ts)
 */
const API_BASE = "";

/**
 * Realiza una solicitud HTTP a la API del backend
 * Incluye credenciales para mantener sesión con express-session
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    // Encabezados por defecto para JSON
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    // Permite enviar cookies de sesión al backend
    credentials: "include",
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Arrojar error si el servidor respondió con estado distinto a 2xx
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Intentar parsear el cuerpo como JSON
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}
