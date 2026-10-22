import { DataTable, List, TextInput, useResourceContext } from "react-admin";

// NUEVO: reutilizamos una lista para varios catálogos de solo consulta.
// Cada Resource aporta automáticamente el nombre del endpoint correspondiente.
export const CatalogoList = () => {
  const recurso = useResourceContext();
  const etiquetas: Record<string, string> = {
    motivos_falta: "Motivo de la falta",
    estatus_infante: "Estatus de inscripción",
    cat_estado_asistencia: "Estado de asistencia",
  };
  const etiqueta = etiquetas[recurso ?? ""] ?? "Nombre";

  return (
  <List exporter={false} filters={[<TextInput key="q" source="q" label="Buscar" alwaysOn />]}>
    <DataTable bulkActionButtons={false} rowClick={false}>
      <DataTable.Col source="id" label="ID" />
      <DataTable.Col source="nombre" label={etiqueta} />
    </DataTable>
  </List>
  );
};
