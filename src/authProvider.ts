import { HttpError } from "react-admin";
import type { AuthProvider } from "react-admin";
import { esRol, INICIO_POR_ROL, tienePermiso } from "./permisos";
import { API_URL, cerrarSesion, httpClient, leerIdentidad } from "./sesion";
import { mensajesError } from "./spanishMessages";

// Basado en frontend/src/Authprovider.ts del repositorio que hicimos en clase.
// No hay usuarios ni servidor ficticios. La conexión depende de la API de nosotros
// Se utilizo IA para poder implementar roles y permisos en el authprovider
//https://marmelab.com/react-admin/Permissions.html

//authProvider es un objeto que implementa la interfaz AuthProvider de React-admin.
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


    // Como lo visto en clase, guardamos el token y la identidad en sessionStorage para que React-admin los use.
    sessionStorage.setItem("auth", json.token);
    sessionStorage.setItem("identity", JSON.stringify({ id: json.id, fullName: json.fullName, rol }));
    // NUEVO: cada rol abre su pantalla de trabajo al iniciar sesión.
    // Implementación para la parte del rol, esta fue dada por Copilot
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
  // Se utilizo IA para encontrar la forma de hacer que el authProvider pueda autorizar vistas y botones CRUD,
  // NUEVO: método nativo de React-admin para autorizar vistas y botones CRUD.
  // En nuestro caso, la API no devuelve los permisos de cada usuario, solo su rol.
  canAccess: async ({ resource, action }) => {
    const identidad = leerIdentidad();
    return tienePermiso(identidad.rol, resource, action);
  },
};

export default authProvider;
