import { HttpError, fetchUtils } from "react-admin";
import { esRol } from "./permisos";
import type { Rol } from "./permisos";

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
    throw new HttpError("Inicia sesión con una cuenta que tenga un rol válido", 401);
  }
};

export const httpClient = (url: string, options: fetchUtils.Options = {}) => {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  const token = sessionStorage.getItem("auth");
  // Como en dataProvider.ts del ejemplo de clase: enviamos el token en la
  // cabecera "Authentication", que es la que lee api/index.js.
  if (token) headers.set("Authentication", token);
  return fetchUtils.fetchJson(url, { ...options, headers });
};
