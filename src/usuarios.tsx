import { List, DataTable, TextInput, Create, Edit, SimpleForm, EditButton, ReferenceInput, ReferenceField, SelectInput, required } from "react-admin";
import { GuardarToolbar } from "./GuardarToolbar";
import { email, minLength, PasswordInput } from "react-admin";

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
      <SelectInput label="Estancia (profesor y doctor/asesor)" optionText="nombre" />
    </ReferenceInput>
    {/* NUEVO: la API usa sala_id y tutor_id para limitar lo que ve cada rol:
        el profesor ve solo su sala y el tutor solo a sus hijos. */}
    <ReferenceInput source="sala_id" reference="salas">
      <SelectInput label="Sala (solo profesor)" optionText="nombre" />
    </ReferenceInput>
    <ReferenceInput source="tutor_id" reference="tutores">
      <SelectInput label="Tutor vinculado (solo padre/tutor)" />
    </ReferenceInput>
  </>
);

export const UsuarioCreate = () => (
  <Create redirect="list">
    {/* NUEVO: la barra propia solo ofrece guardar; el borrado lógico se hará en la API. */}
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <UsuarioInputs />

      // En este apartado se utilizo IA para encontrar la forma de hacer que la contraseña tenga un mínimo de 8 caracteres 
      // y que se pueda ocultar lo que se escribe en el campo de contraseña.
      {/* NUEVO: PasswordInput oculta lo que se escribe. La API la guarda cifrada
          con argon2 y nunca la devuelve. */}
      <PasswordInput source="password" label="Contraseña inicial" validate={[required(), minLength(8)]} />
    </SimpleForm>
  </Create>
);

export const UsuarioEdit = () => (
  <Edit>
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <TextInput source="id" label="ID" disabled />
      <UsuarioInputs />
      // https://marmelab.com/react-admin/PasswordInput.html
      // La utilizams por si el usuario quiere cambiar su contraseña, si no la cambia, la deja vacía y no se modifica.
    
      <PasswordInput source="password" label="Nueva contraseña (dejar vacía para no cambiarla)" validate={minLength(8)} />
    </SimpleForm>
  </Edit>
);
