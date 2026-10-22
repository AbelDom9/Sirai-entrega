import { AppBar, TitlePortal, LoadingIndicator, useTheme, useStore } from "react-admin";
import { Box, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import ContrastIcon from "@mui/icons-material/Contrast";
import { BotonAyuda } from "./BotonAyuda";

const ControlesBarra = () => {
  const [tema, cambiarTema] = useTheme("light");
  const [altoContraste, cambiarContraste] = useStore("altoContraste", false);
  const oscuro = tema === "dark";

  return (
    <>
      <Tooltip title={oscuro ? "Activar modo claro" : "Activar modo oscuro"}>
      <IconButton
        color="inherit"
        onClick={() => {
          cambiarContraste(false);
          cambiarTema(oscuro ? "light" : "dark");
        }}
        aria-label={oscuro ? "Activar modo claro" : "Activar modo oscuro"}
        sx={{ flexShrink: 0, width: 44, height: 44 }}
      >
        {oscuro ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
      </Tooltip>
      <Tooltip title={altoContraste ? "Desactivar alto contraste" : "Activar alto contraste"}>
        <IconButton
          color="inherit"
          onClick={() => cambiarContraste(!altoContraste)}
          aria-label="Alto contraste"
          aria-pressed={altoContraste}
          sx={{ flexShrink: 0, width: 44, height: 44, border: altoContraste ? "2px solid white" : "2px solid transparent" }}
        >
          <ContrastIcon />
        </IconButton>
      </Tooltip>
      <BotonAyuda />
      <LoadingIndicator />
    </>
  );
};

const alturaImagen = 150;
const recorteArriba = 20;
const recorteAbajo = 72;
const recorteIzquierda = 10;
const recorteDerecha = 10;
// Espacio exterior para bajar la imagen dentro de la barra
const espacioArriba = 0;

export const BarraSuperior = () => {
  const esCelular = useMediaQuery<Theme>((theme) => theme.breakpoints.down("sm"));
  // Reducimos imagen y recortes en la misma proporción para conservar el logo.
  const escala = esCelular ? 0.4 : 1;

  return (
  <AppBar
    toolbar={<ControlesBarra />}
    sx={{ backgroundColor: "#611232", color: "#FFFFFF", backgroundImage: "none" }}
  >
    <Box
      sx={{
        display: "inline-flex",
        overflow: "hidden",
        mt: `${espacioArriba}px`,
        mr: esCelular ? 0.5 : 2,
        flexShrink: 0,
      }}
    >
      <Box
        component="img"
        src={`${import.meta.env.BASE_URL}imagenes/gob.png`}
        alt="Gobierno de México"
        sx={{
          display: "block",
          width: "auto",
          height: alturaImagen * escala,
          maxWidth: "none",
          flexShrink: 0,
          marginTop: `-${recorteArriba * escala}px`,
          marginBottom: `-${recorteAbajo * escala}px`,
          marginLeft: `-${recorteIzquierda * escala}px`,
          marginRight: `-${recorteDerecha * escala}px`,
        }}
      />
    </Box>
    <TitlePortal sx={{ flex: 1, minWidth: 0, visibility: esCelular ? "hidden" : "visible" }} />
  </AppBar>
  );
};
