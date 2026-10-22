import { Button, DataTable, DateField, DateInput, List, ReferenceField, TopToolbar, useNotify, useRefresh } from "react-admin";
import { API_URL, httpClient } from "./sesion";

// RF-11: historial de altas, cambios y bajas de los infantes (solo administrador).
// Los registros los crea la API sola cuando se crea o edita un infante.
const tiposMovimiento: Record<string, string> = {
  ALTA: "Alta",
  CAMBIO_SALA: "Cambio de sala",
  CAMBIO_ESTATUS: "Cambio de estatus",
  BAJA: "Baja",
};

const filtrosFecha = [
  <DateInput key="desde" source="desde" label="Desde" alwaysOn />,
  <DateInput key="hasta" source="hasta" label="Hasta" alwaysOn />,
];

export const MovimientoList = () => (
  <List empty={false} filters={filtrosFecha} sort={{ field: "id", order: "DESC" }} exporter={false} title="Movimientos">
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false} rowClick={false}>
        <DataTable.Col source="fecha" label="Fecha"><DateField source="fecha" locales="es-MX" /></DataTable.Col>
        <DataTable.Col source="infante_id" label="Niño o niña"><ReferenceField source="infante_id" reference="infantes" link={false} /></DataTable.Col>
        {/* render convierte el código del tipo en texto sencillo. */}
        <DataTable.Col source="tipo" label="Movimiento" render={(registro) => tiposMovimiento[registro.tipo] ?? registro.tipo} />
        <DataTable.Col source="valor_antes" label="Antes (id)" />
        <DataTable.Col source="valor_despues" label="Después (id)" />
        <DataTable.Col source="usuario_id" label="Registró"><ReferenceField source="usuario_id" reference="usuarios" link={false} /></DataTable.Col>
      </DataTable>
    </div>
  </List>
);

// NUEVO (RF-11): botón que cierra el mes actual en el padrón mensual.
const BotonCerrarMes = () => {
  const notify = useNotify();
  const refresh = useRefresh();
  const cerrar = async () => {
    try {
      const { json } = await httpClient(`${API_URL}/padron_mensual/cierre`, { method: "POST" });
      notify(`Mes cerrado (${json.periodo}): ${json.agregados} niños agregados.`, { type: "success" });
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo cerrar el mes.", { type: "error" });
    }
  };
  return <Button label="Cerrar mes actual" onClick={cerrar} />;
};

// RF-11: una fila por niño por mes (en lugar de una columna por mes).
export const PadronList = () => (
  // empty={false}: aunque todavía no haya filas, se muestra la tabla con su
  // barra de acciones; si no, React-admin pone "Todavía no hay…" y oculta el botón.
  <List filters={filtrosFecha} sort={{ field: "periodo", order: "DESC" }} exporter={false} title="Padrón mensual"
    empty={false} actions={<TopToolbar><BotonCerrarMes /></TopToolbar>}>
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false} rowClick={false}>
        <DataTable.Col source="periodo" label="Mes"><DateField source="periodo" locales="es-MX" options={{ year: "numeric", month: "long" }} /></DataTable.Col>
        <DataTable.Col source="infante_id" label="Niño o niña"><ReferenceField source="infante_id" reference="infantes" link={false} /></DataTable.Col>
        <DataTable.Col source="estancia_id" label="Estancia"><ReferenceField source="estancia_id" reference="estancias" link={false} /></DataTable.Col>
        <DataTable.Col source="estatus_id" label="Estatus"><ReferenceField source="estatus_id" reference="estatus_infante" link={false} /></DataTable.Col>
        <DataTable.Col source="inscripcion_inicial" label="Primera inscripción" render={(registro) => (registro.inscripcion_inicial ? "Sí" : "No")} />
      </DataTable>
    </div>
  </List>
);
