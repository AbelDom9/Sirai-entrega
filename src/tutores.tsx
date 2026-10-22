import { List, DataTable, TextInput, Create, Edit, SimpleForm, EditButton, required } from "react-admin";
import { GuardarToolbar } from "./GuardarToolbar";
import { email } from "react-admin";

const filtros = [<TextInput key="q" source="q" label="Buscar" alwaysOn />];

    // Se utilizo IA para encontrar la forma de hacer que la tabla sea responsive y 
    // se pueda hacer scroll horizontal en pantallas pequeñas.
export const TutorList = () => (
  <List filters={filtros} exporter={false}>
    {/* NUEVO: el contenedor permite desplazar la tabla en pantallas pequeñas. */}
    <div style={{ overflowX: "auto" }}>
      <DataTable bulkActionButtons={false}>
        <DataTable.Col source="nombre" label="Nombre" />
        <DataTable.Col source="apellidos" label="Apellidos" />
        <DataTable.Col source="telefono" label="Teléfono" />
        <DataTable.Col source="correo" label="Correo" />
        <DataTable.Col label="Acciones"><EditButton /></DataTable.Col>
      </DataTable>
    </div>
  </List>
);

// NUEVO: un componente de campos compartidos evita duplicar crear y editar.
//Se investigo este componente en la documentación de React-admin y se encontró 
// que es una buena práctica para mantener el código limpio y evitar duplicación
const TutorInputs = () => (
  <>
    <TextInput source="nombre" label="Nombre" validate={required()} />
    <TextInput source="apellidos" label="Apellidos" validate={required()} />
    <TextInput source="telefono" label="Teléfono" validate={required()} />
    {/* NUEVO: email() valida el formato del correo; no comprueba que exista. */}
    <TextInput source="correo" label="Correo electrónico" type="email" validate={[required(), email()]} />
  </>
);

export const TutorCreate = () => (
  // abre la pantalla de creación; al guardar, vuelve a la lista.
  //Se investigo como poderla implementar, en la investigación si incluye IA
  // https://marmelab.com/react-admin/SimpleForm.html#warnwhenunsavedchanges
  
  <Create redirect="list">
    {/* NUEVO: la barra propia solo ofrece guardar; el borrado lógico se hará en la API. */}
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <TutorInputs />
    </SimpleForm>
  </Create>
);

export const TutorEdit = () => (
  <Edit>
    <SimpleForm warnWhenUnsavedChanges toolbar={<GuardarToolbar />}>
      <TextInput source="id" label="ID" disabled />
      <TutorInputs />
    </SimpleForm>
  </Edit>
);
