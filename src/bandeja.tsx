import { DataTable, DateField, DateInput, EditButton, List, SelectInput, TextInput } from "react-admin";

// NUEVO: fecha de hoy en hora local ("2026-10-21") para el filtro inicial.
const fechaHoy = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

// Estados del seguimiento, los mismos del formulario de seguimientos.tsx.
const estadosSeguimiento = [
  { id: "pendiente", name: "Pendiente" },
  { id: "contactado", name: "Tutor contactado" },
  { id: "cerrado", name: "Cerrado" },
];

// Filtros con etiqueta visible (RA-06): fecha, estado y búsqueda por nombre.
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
        <DataTable.Col source="estado" label="Estado" />
        <DataTable.Col label="Acciones">
          {/* NUEVO: resource="seguimientos" hace que el botón abra el seguimiento
              (mismo id) para anotar la llamada, la causa, el retorno y el alta. */}
          <EditButton resource="seguimientos" label="Atender" />
        </DataTable.Col>
      </DataTable>
    </div>
  </List>
);
