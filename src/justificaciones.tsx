import { List, DataTable, TextInput, Create, Edit, SimpleForm, EditButton, ReferenceInput, ReferenceField, SelectInput, required, useCanAccess, usePermissions } from "react-admin";
import { GuardarToolbar } from "./GuardarToolbar";
import { AsistenciaOpcion } from "./AsistenciaOpcion";

const filtros = [<TextInput key="q" source="q" label="Buscar" alwaysOn />];

export const JustificacionList = () => {
  // NUEVO: useCanAccess pregunta a authProvider.canAccess si este rol puede
  // consultar tutores. El profesor no puede (sin contactos de tutores), así que
  // la columna Tutor no se muestra en lugar de mostrar un error.
  const { canAccess: puedeVerTutores } = useCanAccess({ resource: "tutores", action: "list" });
  // NUEVO: el tutor justifica desde la tarjeta de su hijo (RF-32), así que aquí
  // no ve el botón "Crear" del formulario general.
  const { permissions: rol } = usePermissions();
  return (
  <List filters={filtros} exporter={false} actions={rol === "tutor" ? false : undefined}>
    {/* NUEVO: el contenedor permite desplazar la tabla en pantallas pequeñas. */}
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false}>
        <DataTable.Col source="asistencia_id" label="Asistencia">
          <ReferenceField source="asistencia_id" reference="asistencias" link={false} />
        </DataTable.Col>
        {puedeVerTutores && (
          <DataTable.Col source="tutor_id" label="Tutor">
            <ReferenceField source="tutor_id" reference="tutores" link={false} />
          </DataTable.Col>
        )}
        <DataTable.Col source="motivo_id" label="Motivo">
          <ReferenceField source="motivo_id" reference="motivos_falta" link={false} />
        </DataTable.Col>
        <DataTable.Col source="comentario" label="Comentario" />
        <DataTable.Col label="Acciones"><EditButton /></DataTable.Col>
      </DataTable>
    </div>
  </List>
  );
};

// NUEVO: un componente de campos compartidos evita duplicar crear y editar.
const JustificacionInputs = () => (
  <>
    <ReferenceInput source="asistencia_id" reference="asistencias">
      <SelectInput label="Asistencia" optionText={<AsistenciaOpcion />} validate={required()} />
    </ReferenceInput>
    <ReferenceInput source="tutor_id" reference="tutores">
      <SelectInput label="Tutor" optionText="nombre" validate={required()} />
    </ReferenceInput>
    <ReferenceInput source="motivo_id" reference="motivos_falta">
      <SelectInput label="Motivo de la falta" optionText="nombre" validate={required()} />
    </ReferenceInput>
    {/* Como en posts.tsx: multiline permite escribir un comentario de varias líneas. */}
    <TextInput source="comentario" label="Comentario" multiline rows={3} />
    {/* La API debe comprobar que la asistencia pertenece a un hijo del tutor autenticado. */}
  </>
);

export const JustificacionCreate = () => (
  <Create redirect="list">
    {/* NUEVO: la barra propia solo ofrece guardar; el borrado lógico se hará en la API. */}
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <JustificacionInputs />
    </SimpleForm>
  </Create>
);

export const JustificacionEdit = () => (
  <Edit>
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <TextInput source="id" label="ID" disabled />
      <JustificacionInputs />
    </SimpleForm>
  </Edit>
);
