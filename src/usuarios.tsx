import { List, DataTable, SimpleList, TextInput, Create, Edit, SimpleForm, EditButton, ReferenceInput, ReferenceField, SelectInput, required } from "react-admin";
import { Box, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material";
import { GuardarToolbar } from "./GuardarToolbar";
import { email, minLength, PasswordInput, BooleanInput, BooleanField } from "react-admin";

const filtros = [<TextInput key="q" source="q" label="Buscar" alwaysOn />];

export const UsuarioList = () => {
  const esCelular = useMediaQuery<Theme>((theme) => theme.breakpoints.down("sm"));

  return (
  <List filters={filtros} exporter={false}>
    {esCelular ? (
      <SimpleList
        primaryText={(record) => record.nombre}
        secondaryText={(record) => (
          <Box component="span" sx={{ display: "block", overflowWrap: "anywhere" }}>
            <Box component="span" sx={{ display: "block" }}>Correo: {record.correo}</Box>
            <Box component="span" sx={{ display: "block" }}>
              Rol: <ReferenceField source="rol_id" reference="roles" record={record} link={false} emptyText="Sin rol" />
            </Box>
            <Box component="span" sx={{ display: "block" }}>
              Estancia: <ReferenceField source="estancia_id" reference="estancias" record={record} link={false} emptyText="Sin estancia" />
            </Box>
            <Box component="span" sx={{ display: "block" }}>Toca para editar</Box>
          </Box>
        )}
        linkType="edit"
        sx={{
          "& .MuiListItem-root": { mb: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 },
          "& .MuiListItemText-root": { minWidth: 0, overflowWrap: "anywhere" },
        }}
      />
    ) : (
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false}>
        <DataTable.Col source="nombre" label="Nombre" />
        <DataTable.Col source="correo" label="Correo" />
        {/* RF-05: una cuenta desactivada no puede iniciar sesión (la API lo revisa). */}
        <DataTable.Col source="activo" label="Activo"><BooleanField source="activo" /></DataTable.Col>
        <DataTable.Col source="rol_id" label="Rol">
          <ReferenceField source="rol_id" reference="roles" link={false} />
        </DataTable.Col>
        <DataTable.Col source="estancia_id" label="Estancia">
          <ReferenceField source="estancia_id" reference="estancias" link={false} />
        </DataTable.Col>
        <DataTable.Col label="Acciones"><EditButton /></DataTable.Col>
      </DataTable>
    </div>
    )}
  </List>
  );
};

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
      {/* NUEVO (RF-05): desactivar en lugar de borrar (baja lógica). */}
      <BooleanInput source="activo" label="Cuenta activa" helperText="Si la desactivas, la persona ya no podrá iniciar sesión." />
    </SimpleForm>
  </Edit>
);
