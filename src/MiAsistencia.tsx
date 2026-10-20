import { useGetList, Title } from "react-admin";
import { Alert, Box, Card, CardContent, Stack, Typography } from "@mui/material";

export const MiAsistencia = () => {
  // NUEVO: un endpoint personal debe devolver solo los hijos del tutor autenticado.
  // La API calculará el porcentaje; no descargamos el padrón completo para filtrarlo aquí.
  const { data, isPending, error } = useGetList("mi_asistencia", {
    pagination: { page: 1, perPage: 100 }, sort: { field: "id", order: "ASC" }, filter: {},
  });

  return (
    <Box sx={{ p: 2 }}>
      <Title title="Asistencia de mis hijos" />
      <Typography component="h1" variant="h5" gutterBottom>Asistencia de mis hijos</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>La vista del tutor requiere autenticación real y el endpoint personal de la API.</Alert>
      {isPending && <Typography role="status">Cargando asistencia…</Typography>}
      {error && <Alert severity="error">No se pudo consultar la asistencia. Revisa la conexión con nuestra API.</Alert>}
      {!isPending && !error && !data?.length && <Typography>No hay hijos asociados a esta cuenta.</Typography>}
      <Stack spacing={2}>
        {data?.map((hijo) => (
          <Card key={hijo.id}><CardContent>
            <Typography component="h2" variant="h6">{hijo.nombre} {hijo.apellidos}</Typography>
            <Typography>Sala: {hijo.sala_nombre}</Typography>
            {/* NUEVO: mostramos el porcentaje en texto para que no dependa de una gráfica. */}
            <Typography>Asistencia: {hijo.porcentaje_asistencia == null ? "Sin registros" : `${hijo.porcentaje_asistencia}%`}</Typography>
            <Typography>Periodo: {hijo.periodo ?? "Sin periodo disponible"}</Typography>
            <Typography>Estado de hoy: {hijo.estado_hoy ?? "Sin registrar"}</Typography>
          </CardContent></Card>
        ))}
      </Stack>
    </Box>
  );
};
