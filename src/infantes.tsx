// NUEVO: DateInput captura fechas y required() valida campos obligatorios.
import { DateInput, required } from "react-admin";
import { Create, DataTable, Edit, EditButton, List, ReferenceField, ReferenceInput, SelectInput, SimpleForm, SimpleList, TextInput } from "react-admin";
import { GuardarToolbar } from "./GuardarToolbar";
import { useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material";

// Como en test-admin: el filtro q envía la búsqueda a la API.
const infanteFilters = [
  <TextInput key="buscar" source="q" label="Buscar" alwaysOn />,
];

export const InfanteList = () => {
  // Como en users.tsx: usamos una lista sencilla en pantallas pequeñas.
  const isSmall = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down("sm"),
  );

  return (
    // NUEVO: exporter={false} oculta la exportación de datos de infantes.
    <List filters={infanteFilters} exporter={false}>
      {isSmall ? (
        // NUEVO: linkType="edit" abre la edición al tocar un infante.
        <SimpleList
          primaryText={(record) => `${record.nombre} ${record.apellidos}`}
          secondaryText={(record) => `Matrícula: ${record.matricula}`}
          linkType="edit"
        />
      ) : (
        // NUEVO: bulkActionButtons={false} desactiva las acciones masivas.
        <DataTable bulkActionButtons={false}>
          <DataTable.Col source="matricula" label="Matrícula" />
          <DataTable.Col source="nombre" label="Nombre" />
          <DataTable.Col source="apellidos" label="Apellidos" />

          <DataTable.Col source="sala_id" label="Sala">
            {/* NUEVO: link={false} muestra la referencia sin enlace. */}
            <ReferenceField source="sala_id" reference="salas" link={false} />
          </DataTable.Col>

          <DataTable.Col source="estatus_id" label="Estatus">
            {/* NUEVO: link={false} evita navegar al catálogo de estatus. */}
            <ReferenceField
              source="estatus_id"
              reference="estatus_infante"
              link={false}
            />
          </DataTable.Col>

          <DataTable.Col label="Acciones">
            <EditButton />
          </DataTable.Col>
        </DataTable>
      )}
    </List>
  );
};

// NUEVO: compartimos los campos entre crear y editar para evitar duplicarlos.
const InfanteInputs = () => (
  // NUEVO: <>...</> es un fragmento; agrupa elementos sin añadir un contenedor visual.
  <>
    {/* NUEVO: validate={required()} comprueba que el usuario capture un valor. */}
    <TextInput source="matricula" label="Matrícula" validate={required()} />
    <TextInput source="curp" label="CURP" validate={required()} />
    <TextInput source="nombre" label="Nombre" validate={required()} />
    <TextInput source="apellidos" label="Apellidos" validate={required()} />

    {/* NUEVO: DateInput captura la fecha de nacimiento. */}
    <DateInput
      source="fecha_nacimiento"
      label="Fecha de nacimiento"
      validate={required()}
    />

    {/* Como en posts.tsx: ReferenceInput obtiene las opciones desde otro recurso. */}
    <ReferenceInput source="sala_id" reference="salas">
      <SelectInput label="Sala" optionText="nombre" validate={required()} />
    </ReferenceInput>

    <ReferenceInput source="estatus_id" reference="estatus_infante">
      <SelectInput
        label="Estatus de inscripción"
        optionText="nombre"
        validate={required()}
      />
    </ReferenceInput>
  </>
);

export const InfanteCreate = () => (
  <Create redirect="list">
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      {/* NUEVO: reutilizamos los campos definidos en InfanteInputs. */}
      <InfanteInputs />
    </SimpleForm>
  </Create>
);

export const InfanteEdit = () => (
  <Edit>
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <TextInput source="id" label="ID" disabled />
      {/* NUEVO: editar utiliza los mismos campos que crear. */}
      <InfanteInputs />
    </SimpleForm>
  </Edit>
);

// Recurso registrado en App.tsx. Pendiente: implementar sus endpoints en la API.
// Los permisos, la CURP única y el borrado lógico se validarán en el backend.
