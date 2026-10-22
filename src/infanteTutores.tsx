import { List, DataTable, TextInput, Create, Edit, SimpleForm, EditButton, ReferenceInput, ReferenceField, SelectInput, required } from "react-admin";
import { GuardarToolbar } from "./GuardarToolbar";
import { BooleanInput, BooleanField } from "react-admin";

const filtros = [<TextInput key="q" source="q" label="Buscar" alwaysOn />];

export const InfanteTutorList = () => (
  <List filters={filtros} exporter={false}>
    {/* NUEVO: el contenedor permite desplazar la tabla en pantallas pequeñas. */}
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false}>
        <DataTable.Col source="infante_id" label="Infante">
          <ReferenceField source="infante_id" reference="infantes" link={false} />
        </DataTable.Col>
        <DataTable.Col source="tutor_id" label="Tutor">
          <ReferenceField source="tutor_id" reference="tutores" link={false} />
        </DataTable.Col>
        <DataTable.Col source="parentesco" label="Parentesco" />
        {/* NUEVO: BooleanField muestra un valor verdadero o falso. */}
        <DataTable.Col source="autorizado_recoger" label="Puede recoger"><BooleanField source="autorizado_recoger" /></DataTable.Col>
        <DataTable.Col source="contact_emergencia" label="Contacto de emergencia"><BooleanField source="contact_emergencia" /></DataTable.Col>
        <DataTable.Col label="Acciones"><EditButton /></DataTable.Col>
      </DataTable>
    </div>
  </List>
);

// NUEVO: un componente de campos compartidos evita duplicar crear y editar.
const InfanteTutorInputs = () => (
  <>
    <ReferenceInput source="infante_id" reference="infantes">
      <SelectInput label="Infante" optionText="nombre" validate={required()} />
    </ReferenceInput>
    <ReferenceInput source="tutor_id" reference="tutores">
      <SelectInput label="Tutor" optionText="nombre" validate={required()} />
    </ReferenceInput>
    <TextInput source="parentesco" label="Parentesco" validate={required()} />
    {/* NUEVO: BooleanInput captura una opción de sí o no. */}
    <BooleanInput source="autorizado_recoger" label="Autorizado para recoger" />
    <BooleanInput source="contact_emergencia" label="Contacto de emergencia" />
  </>
);

export const InfanteTutorCreate = () => (
  <Create redirect="list">
    {/* NUEVO: la barra propia solo ofrece guardar; el borrado lógico se hará en la API. */}
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <InfanteTutorInputs />
    </SimpleForm>
  </Create>
);

export const InfanteTutorEdit = () => (
  <Edit>
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <TextInput source="id" label="ID" disabled />
      <InfanteTutorInputs />
    </SimpleForm>
  </Edit>
);
