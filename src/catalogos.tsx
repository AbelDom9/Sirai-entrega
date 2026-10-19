import { DataTable, List, TextInput } from "react-admin";

// NUEVO: reutilizamos una lista para varios catálogos de solo consulta.
// Cada Resource aporta automáticamente el nombre del endpoint correspondiente.
export const CatalogoList = () => (
  <List exporter={false} filters={[<TextInput key="q" source="q" label="Buscar" alwaysOn />]}>
    <DataTable bulkActionButtons={false} rowClick={false}>
      <DataTable.Col source="id" label="ID" />
      <DataTable.Col source="nombre" label="Nombre" />
    </DataTable>
  </List>
);
