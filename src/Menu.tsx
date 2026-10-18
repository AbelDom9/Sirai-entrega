// NUEVO: usePermissions consulta lo que devuelve authProvider.getPermissions.
import { Menu as RAMenu, usePermissions } from "react-admin";
import ChecklistIcon from "@mui/icons-material/Checklist";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";

export const Menu = () => {
  // NUEVO: isPending indica que el rol aún está cargando; error indica un fallo.
  const { permissions, isPending, error } = usePermissions();

  // NUEVO: no mostramos el menú completo mientras se obtiene el rol.
  if (isPending) return <p role="status">Cargando menú…</p>;
  if (error) return <p role="alert">No se pudo cargar el menú.</p>;

  // NUEVO: un if de React elige qué menú mostrar según el rol del usuario.
  // Es una prueba de interfaz: todavía no protege rutas ni datos de la API.
  if (permissions === "profesor") {
    return (
      <RAMenu>
        <RAMenu.Item to="/pase-lista" primaryText="Pase de lista" leftIcon={<ChecklistIcon />} />
        {/* NUEVO: ResourceItem agrega solamente el recurso indicado al menú. */}
        <RAMenu.ResourceItem name="asistencias" />
      </RAMenu>
    );
  }

  // Los demás usuarios conservan el menú de desarrollo en este primer paso.
  return (
    <RAMenu>
      <RAMenu.DashboardItem />
      <RAMenu.Item to="/pase-lista" primaryText="Pase de lista" leftIcon={<ChecklistIcon />} />
      <RAMenu.Item to="/mis-hijos" primaryText="Asistencia de mis hijos" leftIcon={<FamilyRestroomIcon />} />
      <RAMenu.Item to="/privacidad" primaryText="Aviso de privacidad" leftIcon={<PrivacyTipIcon />} />
      <RAMenu.ResourceItems />
    </RAMenu>
  );
};
