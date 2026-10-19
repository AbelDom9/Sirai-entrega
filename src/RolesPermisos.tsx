import { Title } from "react-admin";
import { Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { ACCIONES, NOMBRES_ROL, PERMISOS, RECURSOS, ROLES, tienePermiso } from "./permisos";

// NUEVO: una matriz de consulta muestra exactamente las reglas usadas por canAccess.
// Los cuatro roles están fijados por el reporte; las reglas se editan en permisos.ts.
export const RolesPermisos = () => (
  <Box sx={{ p: 2 }}>
    <Title title="Roles y permisos" />
    <Typography component="h1" variant="h5" gutterBottom>Roles y permisos</Typography>
    <Typography sx={{ mb: 2 }}>Acciones disponibles para cada perfil según la configuración del proyecto.</Typography>
    {ROLES.map((rol) => (
      <Card key={rol} sx={{ mb: 2 }}><CardContent>
        <Typography component="h2" variant="h6" gutterBottom>{NOMBRES_ROL[rol]}</Typography>
        <TableContainer>
          <Table size="small" aria-label={`Permisos de ${NOMBRES_ROL[rol]}`}>
            <TableHead><TableRow>
              <TableCell component="th" scope="col">Apartado</TableCell>
              {Object.values(ACCIONES).map((nombre) => <TableCell component="th" scope="col" key={nombre}>{nombre}</TableCell>)}
            </TableRow></TableHead>
            <TableBody>{Object.keys(PERMISOS[rol]).map((recurso) => (
              <TableRow key={recurso}>
                <TableCell component="th" scope="row">{RECURSOS[recurso as keyof typeof RECURSOS]}</TableCell>
                {Object.keys(ACCIONES).map((accion) => <TableCell key={accion}>{tienePermiso(rol, recurso, accion) ? "Sí" : "No"}</TableCell>)}
              </TableRow>
            ))}</TableBody>
          </Table>
        </TableContainer>
      </CardContent></Card>
    ))}
  </Box>
);
