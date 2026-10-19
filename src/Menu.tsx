import { Menu as RAMenu, usePermissions } from "react-admin";
import ChecklistIcon from "@mui/icons-material/Checklist";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import { esRol, MENU_POR_ROL, tienePermiso } from "./permisos";

export const Menu = () => {
  const { permissions: rol, isPending, error } = usePermissions();
  if (isPending) return <p role="status">Cargando menú…</p>;
  if (error) return <p role="alert">No se pudo consultar el rol.</p>;

  return (
    <RAMenu>
      <RAMenu.DashboardItem />
      {/* NUEVO: las rutas propias consultan la misma tabla de permisos que las vistas. */}
      {tienePermiso(rol, "pase_lista", "show") && <RAMenu.Item to="/pase-lista" primaryText="Pase de lista" leftIcon={<ChecklistIcon />} />}
      {tienePermiso(rol, "mi_asistencia", "show") && <RAMenu.Item to="/mis-hijos" primaryText="Asistencia de mis hijos" leftIcon={<FamilyRestroomIcon />} />}
      {tienePermiso(rol, "privacidad", "show") && <RAMenu.Item to="/privacidad" primaryText="Aviso de privacidad" leftIcon={<PrivacyTipIcon />} />}
      {/* NUEVO: el menú sale de MENU_POR_ROL en permisos.ts, no de condiciones por rol.
          ResourceItem además consulta canAccess("list") y se oculta si no hay permiso. */}
      {esRol(rol) && MENU_POR_ROL[rol].map((recurso) => <RAMenu.ResourceItem key={recurso} name={recurso} />)}
    </RAMenu>
  );
};
