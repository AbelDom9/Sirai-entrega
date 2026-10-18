import simpleRestProvider from "ra-data-simple-rest";
import { fetchUtils } from "react-admin";
import type { DataProvider, Identifier } from "react-admin";

const apiUrl = import.meta.env.VITE_SIMPLE_REST_URL;

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
  ...simpleRestProvider(apiUrl),
  guardarPaseLista: async (datos) => {
    // NUEVO: fetchJson envía JSON y rechaza la promesa si la API devuelve un error.
    const { json } = await fetchUtils.fetchJson(`${apiUrl}/asistencias/lote`, {
      method: "POST",
      body: JSON.stringify(datos),
    });
    return json;
  },
};
