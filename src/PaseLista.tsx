// NUEVO: useState guarda cambios de pantalla; useEffect carga datos al cambiar el grupo.
import { useEffect, useState } from "react";
import { useDataProvider, useGetList, useNotify, Title } from "react-admin";
import type { Identifier, RaRecord } from "react-admin";
import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { SiraiDataProvider } from "./dataProvider";

type Infante = RaRecord & { nombre: string; apellidos: string };
type Marca = { estado_id: string; incidencia: string };

// NUEVO: usamos la fecha local para que el día no cambie por la zona horaria UTC.
const fechaLocal = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

export const PaseLista = () => {
  // NUEVO: useDataProvider da acceso directo a los métodos de la API.
  const provider = useDataProvider<SiraiDataProvider>();
  // NUEVO: useNotify muestra avisos de éxito y error en React-admin.
  const notify = useNotify();
  const [sala, setSala] = useState("");
  const [fecha, setFecha] = useState(fechaLocal);
  const [turno, setTurno] = useState("matutino");
  const [infantes, setInfantes] = useState<Infante[]>([]);
  const [marcas, setMarcas] = useState<Record<string, Marca>>({});
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [cambios, setCambios] = useState(false);
  const [grupoCargado, setGrupoCargado] = useState("");
  const grupoActual = JSON.stringify([sala, fecha, turno]);

  // NUEVO: useGetList consulta un recurso sin necesitar el componente List.
  const salas = useGetList("salas", { pagination: { page: 1, perPage: 500 }, sort: { field: "nombre", order: "ASC" } });
  const estados = useGetList("cat_estado_asistencia", { pagination: { page: 1, perPage: 100 }, sort: { field: "id", order: "ASC" } });

  useEffect(() => {
    // NUEVO: ignoramos respuestas antiguas si cambia la sala o se desmonta la pantalla.
    let activo = true;
    setGrupoCargado("");
    setInfantes([]);
    setMarcas({});
    setCambios(false);
    setError("");
    if (!sala || !fecha) return;
    setCargando(true);

    const cargar = async () => {
      try {
        // NUEVO: recorremos las páginas para no guardar solo una parte de la sala.
        const obtenerTodos = async (recurso: string, filter: Record<string, unknown>) => {
          const registros: RaRecord[] = [];
          for (let page = 1; ; page++) {
            const respuesta = await provider.getList(recurso, {
              pagination: { page, perPage: 100 }, sort: { field: "id", order: "ASC" }, filter,
            });
            if (!activo) return [];
            registros.push(...respuesta.data);
            if (respuesta.total === undefined) throw new Error("La API debe devolver el total de registros.");
            if (registros.length >= respuesta.total) return registros;
            if (respuesta.data.length === 0) throw new Error("La API devolvió una lista incompleta.");
          }
        };
        const niños = await obtenerTodos("infantes", { sala_id: sala, activo: true });
        const anteriores = await obtenerTodos("asistencias", { sala_id: sala, fecha, turno });
        if (!activo) return;
        const inicial: Record<string, Marca> = {};
        niños.forEach((niño) => {
          const anterior = anteriores.find((registro) => String(registro.infante_id) === String(niño.id));
          inicial[String(niño.id)] = { estado_id: anterior ? String(anterior.estado_id) : "", incidencia: anterior?.incidencia ?? "" };
        });
        setInfantes(niños as Infante[]);
        setMarcas(inicial);
        setGrupoCargado(grupoActual);
      } catch {
        if (activo) setError("No se pudo cargar el grupo. Revisa que la API esté disponible y vuelve a seleccionar la sala.");
      } finally {
        if (activo) setCargando(false);
      }
    };
    void cargar();
    return () => { activo = false; };
  }, [sala, fecha, turno, grupoActual, provider]);

  const listo = !cargando && !guardando && grupoCargado === grupoActual && infantes.length > 0 && !error;
  const presente = estados.data?.find((estado) => estado.codigo === "presente");
  const seleccionSala = salas.data?.find((item) => String(item.id) === sala);

  const actualizar = (id: Identifier, campo: keyof Marca, valor: string) => {
    setMarcas((actuales) => ({ ...actuales, [String(id)]: { ...actuales[String(id)], [campo]: valor } }));
    setCambios(true);
  };

  const todosPresentes = () => {
    if (!presente) return;
    setMarcas((actuales) => Object.fromEntries(infantes.map((niño) => [String(niño.id), { ...actuales[String(niño.id)], estado_id: String(presente.id) }])));
    setCambios(true);
  };

  const guardar = async () => {
    if (!listo || !seleccionSala || !cambios) return;
    if (infantes.some((niño) => !marcas[String(niño.id)]?.estado_id)) {
      notify("Selecciona el estado de todos los infantes antes de guardar.", { type: "warning" });
      return;
    }
    setGuardando(true);
    try {
      // NUEVO: un único envío guarda todo el grupo; la API deberá hacerlo en una transacción.
      await provider.guardarPaseLista({
        sala_id: seleccionSala.id, estancia_id: seleccionSala.estancia_id, fecha, turno,
        registros: infantes.map((niño) => ({
          infante_id: niño.id,
          estado_id: estados.data!.find((estado) => String(estado.id) === marcas[String(niño.id)].estado_id)!.id,
          incidencia: marcas[String(niño.id)].incidencia,
        })),
      });
      setCambios(false);
      notify("Pase de lista guardado correctamente.", { type: "success" });
    } catch {
      notify("No se guardó el pase de lista. Conservamos tus cambios para que puedas reintentar.", { type: "error" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Title title="Pase de lista" />
      <Typography component="h1" variant="h5" gutterBottom>Pase de lista por sala</Typography>
      <Typography gutterBottom>Selecciona la sala, marca los estados y guarda el grupo completo.</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>Esta pantalla requiere nuestra API. Los permisos por sala se validarán en el servidor.</Alert>
      <Stack spacing={2} direction={{ xs: "column", sm: "row" }} sx={{ mb: 2 }}>
        <TextField select label="Sala" value={sala} disabled={guardando || cambios} onChange={(e) => setSala(e.target.value)} sx={{ minWidth: 220 }}>
          {salas.data?.map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>)}
        </TextField>
        <TextField type="date" label="Fecha" value={fecha} disabled={guardando || cambios} onChange={(e) => setFecha(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField select label="Turno" value={turno} disabled={guardando || cambios} onChange={(e) => setTurno(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="matutino">Matutino</MenuItem><MenuItem value="vespertino">Vespertino</MenuItem>
        </TextField>
      </Stack>
      {cambios && <Typography role="status" sx={{ mb: 2 }}>Tienes cambios pendientes. Guarda o descarta antes de cambiar el grupo.</Typography>}
      {(salas.error || estados.error || error) && <Alert severity="error">{error || "No se pudieron cargar los catálogos. La API debe estar disponible."}</Alert>}
      {salas.total !== undefined && salas.total > 500 && <Alert severity="warning">Solo se muestran las primeras 500 salas. Pendiente incorporar búsqueda de salas en el servidor.</Alert>}
      {cargando && <Typography role="status">Cargando el pase de lista…</Typography>}
      {!sala && <Typography>Selecciona una sala para comenzar.</Typography>}
      {grupoCargado === grupoActual && !cargando && infantes.length === 0 && <Typography>No hay infantes activos en esta sala.</Typography>}
      <Stack direction="row" spacing={2} sx={{ my: 2, flexWrap: "wrap", gap: 1 }}>
        <Button variant="outlined" disabled={!listo || !presente} onClick={todosPresentes}>Todos presentes</Button>
        <Button variant="contained" disabled={!listo || !cambios || !estados.data?.length} onClick={guardar}>{guardando ? "Guardando…" : "Guardar pase de lista"}</Button>
        <Button disabled={!cambios || guardando} onClick={() => { setCambios(false); setSala(""); }}>Descartar cambios</Button>
      </Stack>
      <Stack spacing={2}>
        {infantes.map((niño) => (
          <Card key={niño.id}><CardContent>
            <Typography component="h2" variant="h6" gutterBottom>{niño.nombre} {niño.apellidos}</Typography>
            <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
              {/* NUEVO: controles con valor y onChange reflejan el estado de React. */}
              <TextField select label={`Asistencia de ${niño.nombre} ${niño.apellidos}`} value={marcas[String(niño.id)]?.estado_id ?? ""} disabled={!listo} onChange={(e) => actualizar(niño.id, "estado_id", e.target.value)} sx={{ minWidth: 240 }}>
                {estados.data?.map((estado) => <MenuItem key={estado.id} value={String(estado.id)}>{estado.nombre}</MenuItem>)}
              </TextField>
              <TextField label={`Incidencia de ${niño.nombre} ${niño.apellidos}`} value={marcas[String(niño.id)]?.incidencia ?? ""} disabled={!listo} onChange={(e) => actualizar(niño.id, "incidencia", e.target.value)} fullWidth />
            </Stack>
          </CardContent></Card>
        ))}
      </Stack>
    </Box>
  );
};
