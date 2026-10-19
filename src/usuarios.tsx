import { List, DataTable, TextInput, Create, Edit, SimpleForm, EditButton, ReferenceInput, ReferenceField, SelectInput, required } from "react-admin";
import { GuardarToolbar } from "./GuardarToolbar";
import { email } from "react-admin";

const filtros = [<TextInput key="q" source="q" label="Buscar" alwaysOn />];

export const UsuarioList = () => (
  <List filters={filtros} exporter={false}>
    {/* NUEVO: el contenedor permite desplazar la tabla en pantallas pequeñas. */}
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false}>
        <DataTable.Col source="nombre" label="Nombre" />
        <DataTable.Col source="correo" label="Correo" />
        <DataTable.Col source="rol_id" label="Rol">
          <ReferenceField source="rol_id" reference="roles" link={false} />
        </DataTable.Col>
        <DataTable.Col source="estancia_id" label="Estancia">
          <ReferenceField source="estancia_id" reference="estancias" link={false} />
        </DataTable.Col>
        <DataTable.Col label="Acciones"><EditButton /></DataTable.Col>
      </DataTable>
    </div>
  </List>
);

// NUEVO: un componente de campos compartidos evita duplicar crear y editar.
const UsuarioInputs = () => (
  <>
    <TextInput source="nombre" label="Nombre" validate={required()} />
    {/* NUEVO: email() valida el formato del correo. */}
    <TextInput source="correo" label="Correo electrónico" type="email" validate={[required(), email()]} />
    <ReferenceInput source="rol_id" reference="roles">
      <SelectInput label="Rol" optionText="nombre" validate={required()} />
    </ReferenceInput>
    <ReferenceInput source="estancia_id" reference="estancias">
      <SelectInput label="Estancia (si corresponde)" optionText="nombre" />
    </ReferenceInput>
    {/* La creación de credenciales y los permisos se implementarán en la API. */}
  </>
);

export const UsuarioCreate = () => (
  <Create redirect="list">
    {/* NUEVO: la barra propia solo ofrece guardar; el borrado lógico se hará en la API. */}
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <UsuarioInputs />
    </SimpleForm>
  </Create>
);

export const UsuarioEdit = () => (
  <Edit>
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <TextInput source="id" label="ID" disabled />
      <UsuarioInputs />
    </SimpleForm>
  </Edit>
);
