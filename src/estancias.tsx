import { List, DataTable, TextInput, Create, Edit, SimpleForm, EditButton, required } from "react-admin";
import { GuardarToolbar } from "./GuardarToolbar";

const filtros = [<TextInput key="q" source="q" label="Buscar" alwaysOn />];

export const EstanciaList = () => (
  <List filters={filtros} exporter={false}>
    {/* NUEVO: el contenedor permite desplazar la tabla en pantallas pequeñas. */}
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false}>
        <DataTable.Col source="clave_ebdi" label="Clave EBDI" />
        <DataTable.Col source="nombre" label="Nombre" />
        <DataTable.Col source="estado" label="Estado" />
        <DataTable.Col source="ur" label="Unidad responsable" />
        <DataTable.Col label="Acciones"><EditButton /></DataTable.Col>
      </DataTable>
    </div>
  </List>
);

// NUEVO: un componente de campos compartidos evita duplicar crear y editar.
const EstanciaInputs = () => (
  <>
    <TextInput source="clave_ebdi" label="Clave EBDI" validate={required()} />
    <TextInput source="nombre" label="Nombre" validate={required()} />
    <TextInput source="estado" label="Estado" validate={required()} />
    <TextInput source="ur" label="Unidad responsable" validate={required()} />
  </>
);

export const EstanciaCreate = () => (
  <Create redirect="list">
    {/* NUEVO: la barra propia solo ofrece guardar; el borrado lógico se hará en la API. */}
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <EstanciaInputs />
    </SimpleForm>
  </Create>
);

export const EstanciaEdit = () => (
  <Edit>
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <TextInput source="id" label="ID" disabled />
      <EstanciaInputs />
    </SimpleForm>
  </Edit>
);
