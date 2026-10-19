import { DataTable, DateField, DateInput, List, ReferenceField, ReferenceInput, SelectInput } from "react-admin";

export const AsistenciaList = () => (
  // NUEVO: sort establece el orden inicial; la API realiza la ordenación.
  <List exporter={false} sort={{ field: "fecha", order: "DESC" }} filters={[
    <DateInput key="fecha" source="fecha" label="Fecha" alwaysOn />,
    <ReferenceInput key="infante" source="infante_id" reference="infantes"><SelectInput label="Infante" optionText="nombre" /></ReferenceInput>,
  ]}>
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false} rowClick={false}>
        <DataTable.Col source="fecha" label="Fecha"><DateField source="fecha" locales="es-MX" /></DataTable.Col>
        <DataTable.Col source="infante_id" label="Infante"><ReferenceField source="infante_id" reference="infantes" link={false} /></DataTable.Col>
        <DataTable.Col source="estancia_id" label="Estancia"><ReferenceField source="estancia_id" reference="estancias" link={false} /></DataTable.Col>
        <DataTable.Col source="estado_id" label="Estado"><ReferenceField source="estado_id" reference="cat_estado_asistencia" link={false} /></DataTable.Col>
        <DataTable.Col source="turno" label="Turno" />
        <DataTable.Col source="incidencia" label="Incidencia" />
      </DataTable>
    </div>
  </List>
);
