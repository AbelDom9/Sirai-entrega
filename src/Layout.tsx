import type { ReactNode } from "react";
import { Layout as RALayout, CheckForApplicationUpdate, useGetResourceLabel } from "react-admin";
import { Typography, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material";
import { useLocation } from "react-router-dom";
import { Menu } from "./Menu";
import { BarraSuperior } from "./BarraSuperior";

export const Layout = ({ children }: { children: ReactNode }) => {
  const esCelular = useMediaQuery<Theme>((theme) => theme.breakpoints.down("sm"));
  const { pathname } = useLocation();
  const etiquetaRecurso = useGetResourceLabel();
  const [recurso, accion] = pathname.split("/").filter(Boolean);
  const esPantallaPropia = !recurso || ["inicio", "pase-lista", "mis-hijos", "privacidad", "roles"].includes(recurso);
  const titulo = recurso ? etiquetaRecurso(recurso, 2) : "";

  return (
  // NUEVO: menu reemplaza el menú predeterminado por el que incluye nuestras rutas.
  <RALayout menu={Menu} appBar={BarraSuperior}>
    {/* Las pantallas propias ya tienen encabezado; las listas y formularios lo reciben aquí. */}
    {esCelular && !esPantallaPropia && (
      <Typography component="h1" variant="h6" sx={{ px: 2, py: 1, overflowWrap: "anywhere" }}>
        {titulo}{accion ? (accion === "create" ? " · Crear" : " · Editar") : ""}
      </Typography>
    )}
    {children}
    <CheckForApplicationUpdate />
  </RALayout>
  );
};
