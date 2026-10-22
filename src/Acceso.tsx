import type { ReactNode } from "react";
import { CanAccess } from "react-admin";
import { Alert } from "@mui/material";

// NUEVO: CanAccess es de React-admin; consulta authProvider.canAccess.
//Lo usamos en rutas propias. List/Create/Edit ya consultan canAccess nativamente.
//Lo estamos usando para comprobar si el usuario tiene permiso para ver una pantalla.
// Si tiene permiso, la muestra; si no, muestra un aviso de acceso denegado.

export const Acceso = ({ recurso, accion, children }: {
  recurso: string; accion: string; children: ReactNode;
}) => (
  <CanAccess
    resource={recurso}
    action={accion}
    loading={<p role="status">Comprobando acceso…</p>}
    accessDenied={<Alert severity="error">No tienes permiso para abrir esta pantalla.</Alert>}
    error={<Alert severity="error">No se pudo comprobar tu acceso. Vuelve a iniciar sesión.</Alert>}
  >
    {children}
  </CanAccess>
);
