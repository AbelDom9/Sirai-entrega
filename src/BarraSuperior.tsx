import { AppBar, TitlePortal, LoadingIndicator, useTheme } from "react-admin";
import { Box, IconButton, Tooltip } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

const ControlesBarra = () => {
  const [tema, cambiarTema] = useTheme("light");
  const oscuro = tema === "dark";

  return (
    <>
      <Tooltip title={oscuro ? "Activar modo claro" : "Activar modo oscuro"}>
      <IconButton
        color="inherit"
        onClick={() => cambiarTema(oscuro ? "light" : "dark")}
        aria-label={oscuro ? "Activar modo claro" : "Activar modo oscuro"}
        sx={{ flexShrink: 0, width: 44, height: 44 }}
      >
        {oscuro ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
      </Tooltip>
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

export const BarraSuperior = () => (
  <AppBar toolbar={<ControlesBarra />}>
    <Box
      sx={{
        display: "inline-flex",
        overflow: "hidden",
        mt: `${espacioArriba}px`,
        mr: 2,
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
          height: alturaImagen,
          maxWidth: "none",
          flexShrink: 0,
          marginTop: `-${recorteArriba}px`,
          marginBottom: `-${recorteAbajo}px`,
          marginLeft: `-${recorteIzquierda}px`,
          marginRight: `-${recorteDerecha}px`,
        }}
      />
    </Box>
    <TitlePortal sx={{ flex: 1, minWidth: 0 }} />
  </AppBar>
);
