import { Admin, Resource, CustomRoutes, defaultLightTheme, defaultDarkTheme } from "react-admin";
import { StoreContextProvider, localStorageStore, useStore, useStoreContext } from "react-admin";
import type { ThemeOptions } from "@mui/material/styles";
// NUEVO: Route conecta una dirección con una pantalla propia.
import { Route } from "react-router-dom";
import polyglotI18nProvider from "ra-i18n-polyglot";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import SchoolIcon from "@mui/icons-material/School";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import GroupIcon from "@mui/icons-material/Group";
import { InfanteList, InfanteCreate, InfanteEdit } from "./infantes";
import { EstanciaList, EstanciaCreate, EstanciaEdit } from "./estancias";
import { SalaList, SalaCreate, SalaEdit } from "./salas";
import { TutorList, TutorCreate, TutorEdit } from "./tutores";
import { InfanteTutorList, InfanteTutorCreate, InfanteTutorEdit } from "./infanteTutores";
import { UsuarioList, UsuarioCreate, UsuarioEdit } from "./usuarios";
import { JustificacionList, JustificacionCreate, JustificacionEdit } from "./justificaciones";
import { SeguimientoList, SeguimientoCreate, SeguimientoEdit } from "./seguimientos";
import { AsistenciaList } from "./asistencias";
import { CatalogoList } from "./catalogos";
import { ReporteList } from "./reportes";
import { PaseLista } from "./PaseLista";
import { MiAsistencia } from "./MiAsistencia";
import { AvisoPrivacidad } from "./AvisoPrivacidad";
import { Acceso } from "./Acceso";
import { RolesPermisos } from "./RolesPermisos";
import { Layout } from "./Layout";
import { Dashboard } from "./Dashboard";
import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";
import spanishMessages from "./spanishMessages";

const i18nProvider = polyglotI18nProvider(() => spanishMessages, "es");

const temaClaro = {
  ...defaultLightTheme,
  typography: {
    ...defaultLightTheme.typography,
    fontSize: 16,
  },
  components: {
    ...defaultLightTheme.components,
    RaAppBar: {
      ...defaultLightTheme.components?.RaAppBar,
      defaultProps: {
        ...defaultLightTheme.components?.RaAppBar?.defaultProps,
        color: "primary" as const,
      },
    },
  },
  palette: {
    ...defaultLightTheme.palette,
    // Umbral para elegir texto claro u oscuro automáticamente; no valida toda la pantalla.
    contrastThreshold: 4.5,
    primary: {
      main: "#611232",
      contrastText: "#FFFFFF",
    },
    background: {
      ...defaultLightTheme.palette?.background,
      default: "#EEE6DB",
    },
  },
};

// Un tercer tema sencillo: fondo negro, texto blanco y controles amarillos.
const temaOscuro: ThemeOptions = {
  ...defaultDarkTheme,
  typography: {
    ...defaultDarkTheme.typography,
    fontSize: 16,
  },
  palette: {
    ...defaultDarkTheme.palette,
    contrastThreshold: 4.5,
  },
};

const temaAltoContraste: ThemeOptions = {
  ...defaultDarkTheme,
  typography: {
    ...defaultDarkTheme.typography,
    fontSize: 16,
  },
  palette: {
    ...defaultDarkTheme.palette,
    contrastThreshold: 4.5,
    mode: "dark",
    background: { default: "#000000", paper: "#000000" },
    text: { primary: "#FFFFFF", secondary: "#FFFFFF" },
    primary: { main: "#FFFF00", contrastText: "#000000" },
    secondary: { main: "#FFFF00", contrastText: "#000000" },
    error: { main: "#FFB4AB" },
    warning: { main: "#FFFF00" },
    info: { main: "#80DEEA" },
    success: { main: "#A5D6A7" },
    divider: "#FFFFFF",
    action: { active: "#FFFFFF", selected: "rgba(255,255,0,0.20)" },
  },
  components: {
    ...defaultDarkTheme.components,
    MuiCssBaseline: {
      styleOverrides: {
        "*:focus-visible": { outline: "3px solid #FFFF00", outlineOffset: "2px" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: { notchedOutline: { borderColor: "#FFFFFF" } },
    },
    RaToolbar: {
      styleOverrides: { root: { backgroundColor: "#000000", borderTop: "1px solid #FFFFFF" } },
    },
  },
};

// App y la barra comparten las preferencias persistentes de React-admin.
const preferencias = localStorageStore();

// NUEVO: recordRepresentation define el texto que muestran las referencias al recurso.
const nombreCompleto = (record: { nombre?: string; apellidos?: string }) =>
  `${record.nombre ?? ""} ${record.apellidos ?? ""}`.trim();

// NUEVO: requireAuth pide sesión incluso en las rutas propias.
const AppConTema = () => {
  const [altoContraste] = useStore("altoContraste", false);
  const store = useStoreContext();

  return (
  <Admin store={store} theme={altoContraste ? temaAltoContraste : temaClaro} darkTheme={altoContraste ? temaAltoContraste : temaOscuro} defaultTheme="light" requireAuth title="SIRAI" layout={Layout} dashboard={Dashboard} dataProvider={dataProvider} authProvider={authProvider} i18nProvider={i18nProvider}>
    {/* Como en test-admin: cada Resource conecta una lista y sus formularios con la API. */}
    <Resource name="infantes" options={{ label: "Infantes" }} list={InfanteList} create={InfanteCreate} edit={InfanteEdit} icon={ChildCareIcon} recordRepresentation={nombreCompleto} />
    <Resource name="estancias" options={{ label: "Estancias" }} list={EstanciaList} create={EstanciaCreate} edit={EstanciaEdit} icon={SchoolIcon} recordRepresentation="nombre" />
    <Resource name="salas" options={{ label: "Salas" }} list={SalaList} create={SalaCreate} edit={SalaEdit} icon={MeetingRoomIcon} recordRepresentation="nombre" />
    <Resource name="tutores" options={{ label: "Tutores" }} list={TutorList} create={TutorCreate} edit={TutorEdit} icon={GroupIcon} recordRepresentation={nombreCompleto} />
    <Resource name="infante_tutor" options={{ label: "Relación infante–tutor" }} list={InfanteTutorList} create={InfanteTutorCreate} edit={InfanteTutorEdit} />
    <Resource name="usuarios" options={{ label: "Usuarios" }} list={UsuarioList} create={UsuarioCreate} edit={UsuarioEdit} recordRepresentation="nombre" />
    <Resource name="asistencias" options={{ label: "Historial de asistencia" }} list={AsistenciaList} recordRepresentation={(record) => `Registro ${record.id} · ${record.fecha ?? ""}`} />
    <Resource name="justificaciones" options={{ label: "Justificaciones" }} list={JustificacionList} create={JustificacionCreate} edit={JustificacionEdit} />
    <Resource name="seguimientos" options={{ label: "Seguimiento de faltas" }} list={SeguimientoList} create={SeguimientoCreate} edit={SeguimientoEdit} />
    <Resource name="reportes_asistencia" options={{ label: "Reportes agregados" }} list={ReporteList} />
    <Resource name="estatus_infante" options={{ label: "Estatus de inscripción" }} list={CatalogoList} recordRepresentation="nombre" />
    <Resource name="cat_estado_asistencia" options={{ label: "Estados de asistencia" }} list={CatalogoList} recordRepresentation="nombre" />
    <Resource name="motivos_falta" options={{ label: "Motivos de falta" }} list={CatalogoList} recordRepresentation="nombre" />
    <Resource name="roles" options={{ label: "Roles y permisos" }} list={() => <Acceso recurso="roles" accion="list"><RolesPermisos /></Acceso>} recordRepresentation="nombre" />
    {/* NUEVO: Acceso usa CanAccess de React-admin en las rutas personalizadas. */}
    <CustomRoutes>
      <Route path="/inicio" element={<Dashboard />} />
      <Route path="/pase-lista" element={<Acceso recurso="pase_lista" accion="show"><PaseLista /></Acceso>} />
      <Route path="/mis-hijos" element={<Acceso recurso="mi_asistencia" accion="show"><MiAsistencia /></Acceso>} />
      <Route path="/privacidad" element={<Acceso recurso="privacidad" accion="show"><AvisoPrivacidad /></Acceso>} />
    </CustomRoutes>
  </Admin>
  );
};

export const App = () => (
  <StoreContextProvider value={preferencias}>
    <AppConTema />
  </StoreContextProvider>
);
