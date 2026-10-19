import { AuthProvider, HttpError } from "react-admin";
import data from "./users.json";

/**
 * This authProvider is only for test purposes. Don't use it in production.
 */
export const authProvider: AuthProvider = {
  login: ({ username, password }) => {
    const user = data.users.find(
      (u) => u.username === username && u.password === password,
    );

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userToPersist } = user;
      localStorage.setItem("user", JSON.stringify(userToPersist));
      return Promise.resolve();
    }

    return Promise.reject(
      new HttpError("Acceso denegado", 401, {
        message: "Usuario o contraseña incorrectos",
      }),
    );
  },
  logout: () => {
    localStorage.removeItem("user");
    return Promise.resolve();
  },
  checkError: () => Promise.resolve(),
  checkAuth: () =>
    localStorage.getItem("user") ? Promise.resolve() : Promise.reject(),
  // NUEVO: React-admin llama a getPermissions para conocer el rol de la sesión.
  // login ya guarda el usuario sin contraseña en localStorage, incluido su rol.
  getPermissions: () => {
    const persistedUser = localStorage.getItem("user");
    if (!persistedUser) return Promise.reject(new Error("Se requiere iniciar sesión"));

    // NUEVO: try/catch evita un fallo sin controlar si la sesión no contiene JSON válido.
    try {
      const user = JSON.parse(persistedUser);
      // NUEVO: ?? devuelve null si la sesión antigua todavía no tiene rol.
      return Promise.resolve(user.rol ?? null);
    } catch {
      return Promise.reject(new Error("No se pudo leer el rol del usuario"));
    }
  },
  getIdentity: () => {
    const persistedUser = localStorage.getItem("user");
    const user = persistedUser ? JSON.parse(persistedUser) : null;

    return Promise.resolve(user);
  },
};

export default authProvider;
