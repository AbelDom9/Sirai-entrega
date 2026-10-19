import { List, DataTable, TextInput, Create, Edit, SimpleForm, EditButton, ReferenceInput, ReferenceField, SelectInput, required } from "react-admin";
import { GuardarToolbar } from "./GuardarToolbar";

const filtros = [<TextInput key="q" source="q" label="Buscar" alwaysOn />];

export const SalaList = () => (
  <List filters={filtros} exporter={false}>
    {/* NUEVO: el contenedor permite desplazar la tabla en pantallas pequeñas. */}
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false}>
        <DataTable.Col source="nombre" label="Sala" />
        <DataTable.Col source="estancia_id" label="Estancia">
          <ReferenceField source="estancia_id" reference="estancias" link={false} />
        </DataTable.Col>
        <DataTable.Col source="grupo_edad" label="Grupo de edad" />
        <DataTable.Col label="Acciones"><EditButton /></DataTable.Col>
      </DataTable>
    </div>
  </List>
);

// NUEVO: un componente de campos compartidos evita duplicar crear y editar.
const SalaInputs = () => (
  <>
    <TextInput source="nombre" label="Nombre de la sala" validate={required()} />
    <ReferenceInput source="estancia_id" reference="estancias">
      <SelectInput label="Estancia" optionText="nombre" validate={required()} />
    </ReferenceInput>
    <TextInput source="grupo_edad" label="Grupo de edad" validate={required()} />
  </>
);

export const SalaCreate = () => (
  <Create redirect="list">
    {/* NUEVO: la barra propia solo ofrece guardar; el borrado lógico se hará en la API. */}
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <SalaInputs />
    </SimpleForm>
  </Create>
);

export const SalaEdit = () => (
  <Edit>
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <TextInput source="id" label="ID" disabled />
      <SalaInputs />
    </SimpleForm>
  </Edit>
);
