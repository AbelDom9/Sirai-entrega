import { AppBar, TitlePortal } from "react-admin";
import { Box } from "@mui/material";

const alturaImagen = 150;
const recorteArriba = 20;
const recorteAbajo = 72;
const recorteIzquierda = 10;
const recorteDerecha = 10;
// Espacio exterior para bajar la imagen dentro de la barra
const espacioArriba = 0;

export const BarraSuperior = () => (
  <AppBar>
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
