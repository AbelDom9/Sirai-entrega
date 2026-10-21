import { HttpError, fetchUtils } from "react-admin";
import { esRol } from "./permisos";
import type { Rol } from "./permisos";
import { mensajesError } from "./spanishMessages";

// Como en el repositorio de clase: VITE_BACKEND y sessionStorage auth/identity.
export const API_URL = (import.meta.env.VITE_BACKEND || import.meta.env.VITE_SIMPLE_REST_URL || "").replace(/\/$/, "");

export type Identidad = {
  id: string | number;
  fullName?: string;
  rol: Rol;
};

export const cerrarSesion = () => {
  sessionStorage.removeItem("auth");
  sessionStorage.removeItem("identity");
};

// NUEVO: este es el único punto que lee la identidad entregada por el login.
// Los compañeros podrán adaptar este contrato a su API sin cambiar los menús.
export const leerIdentidad = (): Identidad => {
  try {
    const raw = sessionStorage.getItem("identity");
    const identidad = raw ? JSON.parse(raw) : null;
    if (!sessionStorage.getItem("auth") || !identidad || !esRol(identidad.rol) ||
        !["string", "number"].includes(typeof identidad.id)) {
      throw new Error();
    }
    return identidad;
  } catch {
    cerrarSesion();
    throw new HttpError(mensajesError.sesion, 401);
  }
};

export const httpClient = async (url: string, options: fetchUtils.Options = {}) => {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  const token = sessionStorage.getItem("auth");
  // Como en dataProvider.ts del ejemplo de clase: enviamos el token en la
  // cabecera "Authentication", que es la que lee api/index.js.
  if (token) headers.set("Authentication", token);
  try {
    return await fetchUtils.fetchJson(url, { ...options, headers });
  } catch (error) {
    // Conservamos el código HTTP para que React-admin siga manejando los permisos.
    if (error instanceof HttpError) {
      const mensajesPorEstado: Record<number, string> = {
        400: mensajesError.datos,
        401: url.endsWith("/login") ? mensajesError.credenciales : mensajesError.sesion,
        403: mensajesError.permiso,
        404: mensajesError.noEncontrado,
        409: mensajesError.conflicto,
        422: mensajesError.datos,
        429: mensajesError.demasiadasPeticiones,
      };
      throw new HttpError(mensajesPorEstado[error.status] ?? mensajesError.servidor, error.status, error.body);
    }
    // Un fallo de red o certificado no tiene respuesta HTTP: evitamos "Failed to fetch".
    throw new HttpError(mensajesError.conexion, 0);
  }
};
