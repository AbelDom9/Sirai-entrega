import { useState } from "react";
import { useDataProvider, useGetList, useNotify, Title } from "react-admin";
import type { Identifier, RaRecord } from "react-admin";
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";

// Primer día del mes actual ("2026-10-01"), para pedir el historial del mes.
const inicioDeMes = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
};

// "2026-10-20" -> "20/10/2026"
const fechaVisible = (fecha: string) => String(fecha).slice(0, 10).split("-").reverse().join("/");

// RF-31 y RF-32: historial del mes de un hijo, con botón para justificar faltas.
const HistorialHijo = ({ infanteId }: { infanteId: Identifier }) => {
  const provider = useDataProvider();
  const notify = useNotify();
  const historial = useGetList("mi_historial", {
    pagination: { page: 1, perPage: 100 }, sort: { field: "fecha", order: "DESC" },
    filter: { infante_id: infanteId, desde: inicioDeMes() },
  });
  const motivos = useGetList("motivos_falta", { pagination: { page: 1, perPage: 50 }, sort: { field: "id", order: "ASC" } });
  // NUEVO: la falta que se está justificando; null = cuadro cerrado.
  const [falta, setFalta] = useState<RaRecord | null>(null);
  const [motivo, setMotivo] = useState("");
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);

  const abrir = (registro: RaRecord) => { setFalta(registro); setMotivo(""); setComentario(""); };

  const guardar = async () => {
    if (!falta || !motivo) return;
    setGuardando(true);
    try {
      // El tutor y la falta ya van incluidos: la API toma al tutor de la sesión.
      await provider.create("justificaciones", { data: { asistencia_id: falta.id, motivo_id: motivo, comentario } });
      notify("Justificación enviada.", { type: "success" });
      setFalta(null);
      historial.refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo enviar la justificación.", { type: "error" });
    } finally {
      setGuardando(false);
    }
  };

  if (historial.isPending) return <Typography role="status">Cargando historial…</Typography>;
  if (historial.error) return <Typography role="alert">No se pudo cargar el historial.</Typography>;
  return (
    <>
      <Typography component="h3" variant="subtitle1" sx={{ mt: 1 }}>Registros de este mes</Typography>
      {!historial.data?.length && <Typography>Sin registros este mes.</Typography>}
      <Stack spacing={1}>
        {historial.data?.map((registro) => (
          <Stack key={registro.id} direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography>{fechaVisible(registro.fecha)} · {registro.turno === "vespertino" ? "Vespertino" : "Matutino"} · {registro.estado_nombre}</Typography>
            {!!registro.es_falta && !!registro.justificada && <Typography color="text.secondary">(justificada)</Typography>}
            {!!registro.es_falta && !registro.justificada && (
              <Button variant="outlined" size="small" onClick={() => abrir(registro)}>Justificar falta del {fechaVisible(registro.fecha)}</Button>
            )}
          </Stack>
        ))}
      </Stack>
      {/* NUEVO: Dialog es una ventana sobre la pantalla con un formulario corto. */}
      <Dialog open={!!falta} onClose={() => setFalta(null)} aria-labelledby="titulo-justificar">
        <DialogTitle id="titulo-justificar">Justificar falta del {falta ? fechaVisible(falta.fecha) : ""}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 280 }}>
            <TextField select label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} required>
              {motivos.data?.map((m) => <MenuItem key={m.id} value={String(m.id)}>{m.nombre}</MenuItem>)}
            </TextField>
            <TextField label="Comentario (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFalta(null)}>Cancelar</Button>
          <Button variant="contained" disabled={!motivo || guardando} onClick={guardar}>{guardando ? "Enviando…" : "Enviar justificación"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

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
            <HistorialHijo infanteId={hijo.id} />
          </CardContent></Card>
        ))}
      </Stack>
    </Box>
  );
};
