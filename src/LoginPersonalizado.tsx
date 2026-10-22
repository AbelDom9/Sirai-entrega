import { Login } from "react-admin";
import { Box, Typography } from "@mui/material";

export const LoginPersonalizado = () => (
  <Box sx={{ position: "relative"}}>
    <Box sx={{ position: "absolute", top: 24, left: 0, right: 0, px: 2, color: "#611232", textAlign: "center" }}>
      <Typography component="h1" sx={{ fontSize: { xs: 48, sm: 64 }, fontWeight: 700, lineHeight: 1.1, mb: 1 }}>
        SIRAI
      </Typography>
      <Typography component="p" sx={{ fontSize: { xs: 16, sm: 18 } }}>
        Pase de lista y reportes de asistencia
      </Typography>
    </Box>
    <Login
      backgroundImage=""
      sx={{
        backgroundImage: "none",
        backgroundColor: "#EEE6DB",
        "& .RaLogin-card": { marginTop: { xs: "160px", sm: "180px" } },
      }}
    />
  </Box>
);
