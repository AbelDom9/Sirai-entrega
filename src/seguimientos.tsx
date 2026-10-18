import { List, DataTable, TextInput, Create, Edit, SimpleForm, EditButton, ReferenceInput, ReferenceField, SelectInput, required } from "react-admin";
import { GuardarToolbar } from "./GuardarToolbar";
import { DateInput, DateField, BooleanInput } from "react-admin";

const filtros = [<TextInput key="q" source="q" label="Buscar" alwaysOn />];

export const SeguimientoList = () => (
  <List filters={filtros} exporter={false}>
    {/* NUEVO: el contenedor permite desplazar la tabla en pantallas pequeñas. */}
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false}>
        <DataTable.Col source="asistencia_id" label="Asistencia">
          <ReferenceField source="asistencia_id" reference="asistencias" link={false} />
        </DataTable.Col>
        <DataTable.Col source="responsable_id" label="Responsable">
          <ReferenceField source="responsable_id" reference="usuarios" link={false} />
        </DataTable.Col>
        <DataTable.Col source="causa" label="Causa" />
        {/* NUEVO: DateField presenta una fecha con formato en español. */}
        <DataTable.Col source="fecha_retorno" label="Retorno previsto"><DateField source="fecha_retorno" locales="es-MX" /></DataTable.Col>
        <DataTable.Col source="estado" label="Estado" />
        <DataTable.Col label="Acciones"><EditButton /></DataTable.Col>
      </DataTable>
    </div>
  </List>
);

// NUEVO: un componente de campos compartidos evita duplicar crear y editar.
const SeguimientoInputs = () => (
  <>
    <ReferenceInput source="asistencia_id" reference="asistencias">
      <SelectInput label="Asistencia" optionText="nombre" validate={required()} />
    </ReferenceInput>
    <ReferenceInput source="responsable_id" reference="usuarios">
      <SelectInput label="Responsable" optionText="nombre" validate={required()} />
    </ReferenceInput>
    <ReferenceInput source="motivo_id" reference="motivos_falta">
      <SelectInput label="Motivo" optionText="nombre" validate={required()} />
    </ReferenceInput>
    <TextInput source="causa" label="Detalle de la causa" validate={required()} />
    <TextInput source="registro_llamada" label="Registro de la llamada" multiline rows={3} />
    {/* NUEVO: DateInput captura la fecha de retorno prevista. */}
    <DateInput source="fecha_retorno" label="Fecha prevista de retorno" />
    {/* NUEVO: BooleanInput registra si hace falta autorización médica de regreso. */}
    <BooleanInput source="requiere_alta" label="Requiere alta médica" />
    <DateInput source="fecha_alta" label="Fecha de alta médica" />
    {/* NUEVO: choices define un catálogo pequeño dentro del formulario. */}
    <SelectInput source="estado" label="Estado del seguimiento" validate={required()} choices={[
      { id: "pendiente", name: "Pendiente" },
      { id: "contactado", name: "Tutor contactado" },
      { id: "cerrado", name: "Cerrado" },
    ]} />
  </>
);

export const SeguimientoCreate = () => (
  <Create redirect="list">
    {/* NUEVO: la barra propia solo ofrece guardar; el borrado lógico se hará en la API. */}
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <SeguimientoInputs />
    </SimpleForm>
  </Create>
);

export const SeguimientoEdit = () => (
  <Edit>
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <TextInput source="id" label="ID" disabled />
      <SeguimientoInputs />
    </SimpleForm>
  </Edit>
);
