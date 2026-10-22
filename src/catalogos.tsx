import { Create, DataTable, Edit, EditButton, List, SimpleForm, TextInput, required, useResourceContext } from "react-admin";
import { GuardarToolbar } from "./GuardarToolbar";

// Etiqueta del campo "nombre" según el catálogo.
const etiquetas: Record<string, string> = {
  motivos_falta: "Motivo de la falta",
  estatus_infante: "Estatus de inscripción",
  cat_estado_asistencia: "Estado de asistencia",
  roles: "Nombre del rol",
};

// NUEVO: reutilizamos una lista para varios catálogos.
// Cada Resource aporta automáticamente el nombre del endpoint correspondiente.
export const CatalogoList = () => {
  const recurso = useResourceContext();
  const etiqueta = etiquetas[recurso ?? ""] ?? "Nombre";

  return (
  <List exporter={false} filters={[<TextInput key="q" source="q" label="Buscar" alwaysOn />]}>
    <DataTable bulkActionButtons={false} rowClick={false}>
      <DataTable.Col source="nombre" label={etiqueta} />
      {/* El código solo lo ve el administrador aquí; las demás pantallas muestran el nombre. */}
      <DataTable.Col source="codigo" label="Código interno" />
      {/* EditButton se oculta solo si el rol no tiene permiso de modificar (canAccess). */}
      <DataTable.Col label="Acciones"><EditButton /></DataTable.Col>
    </DataTable>
  </List>
  );
};

// NUEVO (RF-10): el administrador agrega un registro al catálogo.
// El código es obligatorio y después ya no se puede cambiar.
export const CatalogoCreate = () => {
  const recurso = useResourceContext();
  return (
    <Create redirect="list">
      <SimpleForm toolbar={<GuardarToolbar />}>
        <TextInput source="nombre" label={etiquetas[recurso ?? ""] ?? "Nombre"} helperText="En lenguaje sencillo, como lo verán las personas." validate={required()} />
        <TextInput source="codigo" label="Código interno" helperText="Sin espacios, por ejemplo OTRO. No se podrá cambiar después." validate={required()} />
      </SimpleForm>
    </Create>
  );
};

// NUEVO (RF-10): editar solo el nombre visible; el código queda bloqueado.
export const CatalogoEdit = () => {
  const recurso = useResourceContext();
  return (
    <Edit>
      <SimpleForm toolbar={<GuardarToolbar />}>
        <TextInput source="nombre" label={etiquetas[recurso ?? ""] ?? "Nombre"} validate={required()} />
        <TextInput source="codigo" label="Código interno (no se puede cambiar)" disabled />
      </SimpleForm>
    </Edit>
  );
};
