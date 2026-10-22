import { Button, DataTable, DateField, DateInput, EditButton, List, SelectInput, TextInput, useNotify, useRecordContext, useRefresh } from "react-admin";
import { API_URL, httpClient } from "./sesion";

// NUEVO (RF-24): botón que registra un intento de llamada al tutor.
// useRecordContext da el renglón actual; useRefresh vuelve a cargar la lista.
const BotonIntento = () => {
  const registro = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  if (!registro || registro.estado === "cerrado") return null;
  const registrar = async () => {
    try {
      await httpClient(`${API_URL}/seguimientos/${registro.id}/intento`, { method: "POST" });
      notify("Intento de llamada registrado.", { type: "success" });
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo registrar el intento.", { type: "error" });
    }
  };
  return <Button label="Registrar intento de llamada" onClick={registrar} />;
};
// Se utilizo IA para poder implementar la bandeja de faltas del doctor/asesor, ya que nos ayudo a 
// encontrar la forma de mostrar los registros en una tabla con fechas y datos relacionados, 
// sin acciones masivas ni navegación al pulsar las filas, ademas de permitir desplazarse 
// horizontalmente cuando no cabe en la pantalla (Como en otras anteriores que ya se implementaron en este proyecto)


// Estamos usando la fecha del dia de hoy 2026-10-21 para inicializar el filtro
const fechaHoy = () => {
  const hoy = new Date();
  //Formato de fecha YYYY-MM-DD para que React-admin lo use en el filtro de la bandeja
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

// Estados del seguimiento, los mismos del formulario de seguimientos.tsx.
const estadosSeguimiento = [
  { id: "pendiente", name: "Pendiente" },
  { id: "contactado", name: "Tutor contactado" },
  { id: "cerrado", name: "Cerrado" },
];

// Filtros con etiqueta visible (RA-06): fecha, estado y búsqueda por nombre.
//Requerimiento de Accesibilidad RA-06: los filtros deben tener etiqueta visible, no solo placeholder.
// https://marmelab.com/react-admin/FilteringTutorial.html
const filtros = [
  <DateInput key="fecha" source="fecha" label="Fecha de la falta" alwaysOn />,
  <SelectInput key="estado" source="estado" label="Estado del seguimiento" choices={estadosSeguimiento} alwaysOn />,
  <TextInput key="q" source="q" label="Buscar niño o sala" alwaysOn />,
];

// Bandeja de faltas del doctor/asesor (RF-21 y RF-22).
// Lee la vista bandeja_seguimientos: un renglón por falta con los contactos
// de todos los tutores. Para anotar la llamada se abre el seguimiento.
export const BandejaList = () => (
  // NUEVO: filterDefaultValues hace que la bandeja empiece en las faltas de hoy.
  <List filters={filtros} filterDefaultValues={{ fecha: fechaHoy() }} sort={{ field: "id", order: "DESC" }} exporter={false} title="Bandeja de faltas">
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false} rowClick={false}>
        <DataTable.Col source="infante_nombre" label="Niño o niña" />
        <DataTable.Col source="sala_nombre" label="Sala" />
        <DataTable.Col source="fecha" label="Fecha"><DateField source="fecha" locales="es-MX" /></DataTable.Col>
        <DataTable.Col source="turno" label="Turno" />
        <DataTable.Col source="tipo_falta" label="Tipo de falta" />
        {/* RF-22: datos para llamar. Incluye a todos los tutores con su parentesco y teléfono. */}
        <DataTable.Col source="contactos" label="Contactos del tutor" />
        {/* RF-24, RF-25 y RF-26 (simplificados): aviso escrito y contactos de emergencia. */}
        <DataTable.Col source="alerta" label="Alerta" />
        <DataTable.Col source="contactos_emergencia" label="Contactos de emergencia" />
        <DataTable.Col source="intentos" label="Intentos de llamada" />
        <DataTable.Col source="estado" label="Estado" />
        <DataTable.Col label="Acciones">
          {/* NUEVO: resource="seguimientos" hace que el botón abra el seguimiento
              (mismo id) para anotar la llamada, la causa, el retorno y el alta. */}
          <EditButton resource="seguimientos" label="Atender" />
          <BotonIntento />
        </DataTable.Col>
      </DataTable>
    </div>
  </List>
);
