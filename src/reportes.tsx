import { DataTable, DateInput, List, NumberField, ReferenceInput, SelectInput, useGetList } from "react-admin";

// NUEVO: este recurso espera cifras agregadas de la API, sin nombres ni CURP.
// El administrador tendrá acceso cuando implementemos permisos reales en el servidor.
export const ReporteList = () => {
  const { data: estancias = [] } = useGetList("estancias", { pagination: { page: 1, perPage: 500 }});
  const opciones = (campo: "estado" | "ur") => 
  [...new Set(estancias.map((estancia) => estancia[campo]).filter(Boolean))].sort().map((valor) => ({ id: valor, name: valor }));
  return(

  <List exporter={false} filters={[
    <DateInput key="desde" source="desde" label="Desde" alwaysOn />,
    <DateInput key="hasta" source="hasta" label="Hasta" alwaysOn />,
    <ReferenceInput key="estancia" source="estancia_id" reference="estancias"><SelectInput label="Estancia" optionText="nombre" /></ReferenceInput>,
    <SelectInput key="estado" source="estado" label="Estado" choices={opciones("estado")} alwaysOn />,
    <SelectInput key="ur" source="ur" label="UR" choices={opciones("ur")} alwaysOn />,
    
  ]}>
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false} rowClick={false}>
        <DataTable.Col source="estancia_nombre" label="Estancia"/>
        <DataTable.Col source="estado" label= "Estado"/>
        <DataTable.Col source="ur" label="UR"/>
        <DataTable.Col source="periodo" label="Periodo" />
        {/* NUEVO: NumberField presenta cantidades con formato numérico. */}
        <DataTable.Col source="total_registros" label="Registros"><NumberField source="total_registros" /></DataTable.Col>
        <DataTable.Col source="presentes" label="Presencias"><NumberField source="presentes" /></DataTable.Col>
        <DataTable.Col source="ausentes" label="Ausencias"><NumberField source="ausentes" /></DataTable.Col>
        <DataTable.Col source="porcentaje_asistencia" label="Asistencia (%)"><NumberField source="porcentaje_asistencia" /></DataTable.Col>
      </DataTable>
    </div>
  </List>
);
};
