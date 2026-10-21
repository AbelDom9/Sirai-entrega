import { HttpError } from "react-admin";
import type { AuthProvider } from "react-admin";
import { esRol, INICIO_POR_ROL, tienePermiso } from "./permisos";
import { API_URL, cerrarSesion, httpClient, leerIdentidad } from "./sesion";
import { mensajesError } from "./spanishMessages";

// Basado en frontend/src/Authprovider.ts del repositorio de clase.
// No hay usuarios ni servidor ficticios. La conexión depende de la API del equipo.
export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    cerrarSesion();
    if (!API_URL) throw new Error(mensajesError.configuracion);
    const { json } = await httpClient(`${API_URL}/login`, {
      method: "POST", body: JSON.stringify({ username, password }),
    });
    const rol: unknown = json?.rol;
    // NUEVO: ampliamos la respuesta del ejemplo de clase con el código de rol.
    // No se deduce un rol a partir del nombre de usuario ni de un ID numérico.
    if (!json || typeof json.token !== "string" || !json.token || !esRol(rol) ||
        !["string", "number"].includes(typeof json.id)) {
      throw new Error(mensajesError.acceso);
    }
    sessionStorage.setItem("auth", json.token);
    sessionStorage.setItem("identity", JSON.stringify({ id: json.id, fullName: json.fullName, rol }));
    // NUEVO: cada rol abre su pantalla de trabajo al iniciar sesión.
    return { redirectTo: INICIO_POR_ROL[rol] };
  },
  logout: async () => { cerrarSesion(); },
  checkAuth: async () => { leerIdentidad(); },
  checkError: async ({ status }) => {
    if (status === 401) {
      cerrarSesion();
      throw new HttpError(mensajesError.sesion, 401);
    }
    // NUEVO: 403 no cierra la sesión: significa que falta permiso para esa acción.
  },
  getIdentity: async () => leerIdentidad(),
  getPermissions: async () => leerIdentidad().rol,
  // NUEVO: método nativo de React-admin para autorizar vistas y botones CRUD.
  canAccess: async ({ resource, action }) => {
    const identidad = leerIdentidad();
    return tienePermiso(identidad.rol, resource, action);
  },
};

export default authProvider;
