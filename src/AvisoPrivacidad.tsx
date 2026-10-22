import { useState } from "react";
import { Title, useGetOne, useDataProvider, useNotify, useCanAccess } from "react-admin";
import { Alert, Box, Button, Checkbox, FormControlLabel, Typography } from "@mui/material";
//Para poder realizar el Aviso de privacidad y consentimiento, utilizamos IA
// Para la investigación de hooks de React-admin, se consultó la documentación oficial de React-admin y se encontró que useGetOne 
// es un hook que permite obtener un único registro de un recurso, en este caso el aviso vigente aprobado por ISSSTE.

export const AvisoPrivacidad = () => {
  // useGetOne pide un único registro, aquí el aviso vigente aprobado por ISSSTE.
  const { data: aviso, isPending, error } = useGetOne("avisos_privacidad", { id: "vigente" });
  const provider = useDataProvider();
  const notify = useNotify();
  // NUEVO: ver el aviso no equivale a poder registrar el consentimiento de un tutor.
  // Hook Nuevo  useCanAccess para comprobar si el usuario tiene permiso para crear un consentimiento.
  //https://marmelab.com/react-admin/useCanAccess.html

  const { canAccess: puedeAceptar } = useCanAccess ({ resource: "consentimientos", action: "create" });
  const [acepta, setAcepta] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [versionAceptada, setVersionAceptada] = useState<string | null>(null);
  const version = aviso ? JSON.stringify([aviso.id, aviso.version]) : "";

  const guardar = async () => {
    if (!puedeAceptar || !aviso?.texto || !aviso.version || !acepta || guardando) return;
    setGuardando(true);
    try {
      // NUEVO: create puede usarse directamente; la API asignará el tutor desde su sesión.
      await provider.create("consentimientos", { data: { aviso_id: aviso.id, version: aviso.version, aceptado: true } });
      setVersionAceptada(version);
      notify("Consentimiento registrado.", { type: "success" });
    } catch {
      notify("No se pudo registrar el consentimiento. Inténtalo nuevamente.", { type: "error" });
    } finally { setGuardando(false); }
  };

  return (
    //Se obtiene de la API el aviso de privacidad y consentimiento, si no hay aviso vigente, se muestra un mensaje de error
    // Se utilizo copilot para poder implementar el aviso de privacidad y consentimiento, ya que nos ayudo a encontrar la forma de obtener el aviso vigente de la API y
    //  mostrarlo en la pantalla, ademas de permitir registrar el consentimiento del tutor.
    <Box sx={{ p: 2 }}>
      <Title title="Aviso de privacidad" />
      <Typography component="h1" variant="h5" gutterBottom>Aviso de privacidad y consentimiento</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>El texto oficial debe ser proporcionado y aprobado por ISSSTE. Esta pantalla lo obtiene de la API.</Alert>
      {isPending && <Typography role="status">Cargando aviso…</Typography>}
      {(error || (!isPending && !aviso?.texto)) && <Alert severity="error">El aviso vigente no está disponible. El consentimiento permanece deshabilitado.</Alert>}
      {aviso?.texto && <>
        {/* NUEVO: whiteSpace conserva los saltos del texto sin inyectar HTML. */}
        <Typography sx={{ whiteSpace: "pre-wrap", my: 2 }}>{aviso.texto}</Typography>
        <FormControlLabel control={<Checkbox checked={acepta} disabled={!puedeAceptar || guardando || versionAceptada === version} onChange={(e) => setAcepta(e.target.checked)} />} label="He leído el aviso de privacidad y otorgo mi consentimiento" />
        <Box><Button variant="contained" disabled={!puedeAceptar || !acepta || !aviso.version || guardando || versionAceptada === version} onClick={guardar}>{guardando ? "Guardando…" : "Registrar consentimiento"}</Button></Box>
        {versionAceptada === version && <Typography role="status" sx={{ mt: 2 }}>Consentimiento registrado para esta versión.</Typography>}
      </>}
    </Box>
  );
};
