import { SaveButton, Toolbar } from "react-admin";

// NUEVO: Toolbar permite elegir las acciones del formulario.
// Solo mostramos guardar hasta implementar borrado lógico y permisos en la API.
export const GuardarToolbar = () => (
  <Toolbar><SaveButton /></Toolbar>
);
