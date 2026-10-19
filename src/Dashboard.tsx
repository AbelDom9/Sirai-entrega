import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import { useGetIdentity, usePermissions } from "react-admin";
import { NOMBRES_ROL, esRol } from "./permisos";

export const Dashboard = () => {
  const { data: identity, isPending, error } = useGetIdentity();
  const { permissions } = usePermissions();
  if (isPending) return <p role="status">Cargando tu información…</p>;
  if (error) return <p role="alert">No se pudo obtener la información de tu usuario.</p>;
  return (
    <Card>
      <CardHeader title="SIRAI · Registro de asistencia infantil" titleTypographyProps={{ component: "h1", variant: "h5" }} />
      <CardContent>
        <Typography gutterBottom>Bienvenido{identity?.fullName ? `, ${identity.fullName}` : ""}.</Typography>
        <Typography gutterBottom>Perfil: {esRol(permissions) ? NOMBRES_ROL[permissions] : "Sin rol válido"}</Typography>
        <Typography>Usa el menú para acceder a las funciones de tu perfil.</Typography>
      </CardContent>
    </Card>
  );
};
