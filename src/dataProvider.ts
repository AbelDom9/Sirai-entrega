// Como en frontend/src/dataProvider.ts del repositorio de clase: proveedor json-server.
import jsonServerProvider from "ra-data-json-server";
// Como en el ejemplo de clase: las peticiones llevan el token del login.
import { API_URL, httpClient } from "./sesion";
import type { DataProvider, Identifier } from "react-admin";

const apiUrl = API_URL;

// NUEVO: un tipo describe el cuerpo que espera el guardado de todo el grupo.
export type PaseListaPayload = {
  sala_id: Identifier;
  estancia_id: Identifier;
  fecha: string;
  turno: string;
  registros: { infante_id: Identifier; estado_id: Identifier; incidencia: string }[];
};

// NUEVO: extendemos el proveedor estándar con una operación propia de SIRAI.
export type SiraiDataProvider = DataProvider & {
  guardarPaseLista: (datos: PaseListaPayload) => Promise<unknown>;
};

export const dataProvider: SiraiDataProvider = {
  // Igual que el profe: jsonServerProvider envía _sort, _order, _start y _end,
  // y lee el total de registros de la cabecera X-Total-Count.
  ...jsonServerProvider(apiUrl, httpClient),
  guardarPaseLista: async (datos) => {
    // NUEVO: fetchJson envía JSON y rechaza la promesa si la API devuelve un error.
    const { json } = await httpClient(`${apiUrl}/asistencias/lote`, {
      method: "POST",
      body: JSON.stringify(datos),
    });
    return json;
  },
};
