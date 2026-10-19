import { Alert, Card, CardContent, CardHeader, Typography } from "@mui/material";
import { useGetIdentity } from "react-admin";

export const Dashboard = () => {
  const { data: identity, isPending, error } = useGetIdentity();
  if (isPending) return <p role="status">Cargando tu información…</p>;
  if (error) return <p role="alert">No se pudo obtener la información de tu usuario.</p>;
  return (
    <Card>
      <CardHeader title="SIRAI · Registro de asistencia infantil" titleTypographyProps={{ component: "h1", variant: "h5" }} />
      <CardContent>
        <Typography gutterBottom>Bienvenido{identity?.fullName ? `, ${identity.fullName}` : ""}.</Typography>
        <Typography gutterBottom>Estancias de Bienestar y Desarrollo Infantil del ISSSTE.</Typography>
        <Typography gutterBottom>Usa el menú para consultar salas, infantes, pase de lista y seguimiento de faltas.</Typography>
        <Alert severity="info">Etapa de desarrollo: las pantallas requieren nuestra API y base de datos. El inicio de sesión sigue siendo de ejemplo y todos los módulos están visibles; los permisos por rol todavía no están implementados.</Alert>
      </CardContent>
    </Card>
  );
};
