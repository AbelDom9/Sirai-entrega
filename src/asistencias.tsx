import { DataTable, DateField, DateInput, List, ReferenceField, ReferenceInput, SelectInput } from "react-admin";

export const AsistenciaList = () => (
  // NUEVO: sort establece el orden inicial; la API realiza la ordenación.
  // Esto lo hacemos para que la primera página de resultados se muestre ordenada por fecha descendente.

  //Se utilizo IA para encontrar la forma de hacer que la tabla sea responsive y se pueda hacer scroll horizontal en pantallas pequeñas.
  <List exporter={false} sort={{ field: "fecha", order: "DESC" }} filters={[
    <DateInput key="fecha" source="fecha" label="Fecha" alwaysOn />,
    <ReferenceInput key="infante" source="infante_id" reference="infantes"><SelectInput label="Infante" optionText="nombre" /></ReferenceInput>,
  ]}>

  // https://marmelab.com/react-admin/DataTable.html
  // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-x
  // Utilizamos Ia en este apartado, para Muestra los registros en una tabla con fechas y datos relacionados, sin acciones masivas ni navegación al pulsar las filas, 
  //ademas de permitir desplazarse horizontalmente cuando no cabe en la pantalla

    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false} rowClick={false}>
        <DataTable.Col source="fecha" label="Fecha"><DateField source="fecha" locales="es-MX" /></DataTable.Col>
        <DataTable.Col source="infante_id" label="Infante"><ReferenceField source="infante_id" reference="infantes" link={false} /></DataTable.Col>
        <DataTable.Col source="estancia_id" label="Estancia"><ReferenceField source="estancia_id" reference="estancias" link={false} /></DataTable.Col>
        <DataTable.Col source="estado_id" label="Estado"><ReferenceField source="estado_id" reference="cat_estado_asistencia" link={false} /></DataTable.Col>
        <DataTable.Col source="hora_entrada" label="Entrada" />
        <DataTable.Col source="hora_salida" label="Salida" />
        <DataTable.Col source="metodo" label="Método" />
        <DataTable.Col source="turno" label="Turno" />
        <DataTable.Col source="incidencia" label="Incidencia" />
      </DataTable>
    </div>
  </List>
);
