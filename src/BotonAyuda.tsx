import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

// Instrucciones breves por pantalla. Se pueden editar sin cambiar la lógica del botón.
const ayudas: Record<string, { titulo: string; pasos: string[] }> = {
  "pase-lista": {
    titulo: "Pase de lista",
    pasos: [
      "Selecciona la sala, la fecha y el turno.",
      "Usa Todos presentes o elige el estado de cada infante. Agrega incidencias si es necesario.",
      "Pulsa Guardar pase de lista. Si se indica que falta un alta médica o que el pase está cerrado, revisa el aviso antes de continuar.",
    ],
  },
  "mis-hijos": {
    titulo: "Asistencia de mis hijos",
    pasos: [
      "Consulta el estado de hoy, el porcentaje de asistencia y el historial de cada hijo.",
      "Para una falta pendiente, pulsa Justificar, selecciona el motivo y agrega un comentario si lo necesitas.",
      "Pulsa Enviar justificación y espera la confirmación.",
    ],
  },
  privacidad: {
    titulo: "Aviso de privacidad",
    pasos: ["Lee el aviso vigente y su versión.", "Si deseas otorgar tu consentimiento, marca la casilla y pulsa Registrar consentimiento."],
  },
  usuarios: {
    titulo: "Usuarios",
    pasos: ["Usa Buscar para encontrar una cuenta. En celular, toca su tarjeta para editarla.", "Para crear una cuenta, pulsa Crear o el botón +. Captura nombre, correo, rol y contraseña inicial.", "Asigna sala al profesor, estancia al doctor/asesor o tutor vinculado a la cuenta de padre/tutor. Pulsa Guardar."],
  },
  justificaciones: {
    titulo: "Justificaciones",
    pasos: ["Busca una justificación o pulsa Crear para registrar una.", "Selecciona la asistencia, el tutor y el motivo. El comentario es opcional.", "Pulsa Guardar y espera la confirmación."],
  },
  seguimientos: {
    titulo: "Seguimiento de faltas",
    pasos: ["Abre el caso que necesitas atender.", "Registra el resultado de la llamada, el motivo, el retorno previsto y el alta médica cuando corresponda.", "Revisa el estado del seguimiento y pulsa Guardar."],
  },
  bandeja_seguimientos: {
    titulo: "Bandeja de faltas",
    pasos: ["Usa los filtros para localizar las faltas que debes atender.", "Consulta los contactos del tutor y abre el seguimiento para registrar la atención."],
  },
  asistencias: {
    titulo: "Historial de asistencia",
    pasos: ["Filtra por fecha o infante para encontrar los registros.", "Consulta el estado, el turno y las incidencias de cada asistencia."],
  },
  reportes_asistencia: {
    titulo: "Reportes agregados",
    pasos: ["Selecciona el periodo y los filtros disponibles.", "Consulta los totales y porcentajes. Los reportes muestran cifras agregadas."],
  },
};

export const BotonAyuda = () => {
  const [abierta, setAbierta] = useState(false);
  const { pathname } = useLocation();
  const pantalla = pathname.split("/")[1];
  const ayuda = ayudas[pantalla] ?? {
    titulo: "Uso de SIRAI",
    pasos: ["Abre el menú para elegir una de las opciones disponibles para tu cuenta.", "En las listas, usa Buscar o los filtros. Si tienes permiso, usa Crear o Editar y guarda los cambios.", "Los campos marcados con un asterisco son obligatorios. Si aparece un error, lee el mensaje y corrige el campo indicado."],
  };

  return (
    <>
      <Tooltip title="Ayuda">
        <Button
          color="inherit"
          startIcon={<HelpOutlineIcon />}
          aria-label="Abrir ayuda"
          aria-haspopup="dialog"
          onClick={() => setAbierta(true)}
          sx={{ minWidth: 44, minHeight: 44, flexShrink: 0, "& .MuiButton-startIcon": { mr: { xs: 0, sm: 1 }, ml: 0 } }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Ayuda</Box>
        </Button>
      </Tooltip>
      <Dialog open={abierta} onClose={() => setAbierta(false)} aria-labelledby="titulo-ayuda" aria-describedby="contenido-ayuda" fullWidth maxWidth="sm">
        <DialogTitle id="titulo-ayuda">Ayuda: {ayuda.titulo}</DialogTitle>
        <DialogContent>
          <DialogContentText component="div" id="contenido-ayuda" sx={{ color: "text.primary" }}>
            <ol>
              {ayuda.pasos.map((paso) => <li key={paso}>{paso}</li>)}
            </ol>
            <p>El icono de luna o sol cambia el modo claro y oscuro. El círculo dividido activa o desactiva el alto contraste.</p>
            <p>Puedes moverte con Tab y Shift + Tab. Pulsa Enter para activar un botón y Escape para cerrar esta ayuda.</p>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => setAbierta(false)} sx={{ minHeight: 44 }}>Cerrar ayuda</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
