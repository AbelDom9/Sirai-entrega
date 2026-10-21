// NUEVO: estos son los cuatro códigos de rol acordados en el reporte.
// Se comparan códigos, no IDs numéricos que pueden variar en la base de datos.
export const ROLES = ["administrador", "profesor", "doctor_asesor", "tutor"] as const;
export type Rol = (typeof ROLES)[number];

export const NOMBRES_ROL: Record<Rol, string> = {
  administrador: "Administrador central",
  profesor: "Profesor / Educadora",
  doctor_asesor: "Doctor / Asesor",
  tutor: "Padre / Tutor",
};

// NUEVO: los mismos nombres de recurso se usan en App, menú y permisos.
export const RECURSOS = {
  estancias: "Estancias", salas: "Salas", infantes: "Infantes",
  tutores: "Tutores", infante_tutor: "Relación infante–tutor", usuarios: "Usuarios",
  roles: "Roles y permisos", asistencias: "Historial de asistencia",
  justificaciones: "Justificaciones", seguimientos: "Seguimiento de faltas",
  reportes_asistencia: "Reportes agregados", estatus_infante: "Estatus de inscripción",
  cat_estado_asistencia: "Estados de asistencia", motivos_falta: "Motivos de falta",
  pase_lista: "Pase de lista", mi_asistencia: "Asistencia de mis hijos",
  bandeja_seguimientos: "Bandeja de faltas", alta_pendiente: "Alta médica pendiente",
  mi_historial: "Historial de mis hijos",
  privacidad: "Aviso de privacidad", consentimientos: "Consentimiento",
};

export const ACCIONES = {
  list: "Consultar lista", show: "Consultar detalle", create: "Crear", edit: "Modificar",
};

// NUEVO: aquí se cambia qué acciones permite cada rol en cada recurso.
// list/create/edit/show son acciones estándar de React-admin.
// No se autoriza delete: el flujo de baja lógica se acordará con el backend.
export const PERMISOS: Record<Rol, Record<string, readonly string[]>> = {
  administrador: {
    estancias: ["list", "show", "create", "edit"],
    salas: ["list", "show", "create", "edit"],
    infantes: ["list", "show", "create", "edit"],
    tutores: ["list", "show", "create", "edit"],
    infante_tutor: ["list", "show", "create", "edit"],
    usuarios: ["list", "show", "create", "edit"],
    roles: ["list", "show"],
    asistencias: ["list", "show"],
    justificaciones: ["list", "show", "create", "edit"],
    seguimientos: ["list", "show", "create", "edit"],
    reportes_asistencia: ["list", "show"],
    estatus_infante: ["list", "show"],
    cat_estado_asistencia: ["list", "show"], motivos_falta: ["list", "show"],
    pase_lista: ["show", "edit"], mi_asistencia: ["show"], privacidad: ["show"],
    alta_pendiente: ["list"],
  },
  profesor: {
    // Sala y catálogos se consultan para mostrar los nombres en el pase de lista.
    estancias: ["list", "show"], salas: ["list", "show"], infantes: ["list", "show"],
    estatus_infante: ["list", "show"], cat_estado_asistencia: ["list", "show"],
    motivos_falta: ["list", "show"], pase_lista: ["show", "edit"],
    // Para avisar en el pase de lista qué niños requieren alta (RF-27).
    alta_pendiente: ["list"],
    asistencias: ["list", "show"], justificaciones: ["list", "show"],
  },
  doctor_asesor: {
    estancias: ["list", "show"], salas: ["list", "show"], infantes: ["list", "show"],
    tutores: ["list", "show"], usuarios: ["list", "show"],
    asistencias: ["list", "show"], justificaciones: ["list", "show"],
    seguimientos: ["list", "show", "create", "edit"],
    motivos_falta: ["list", "show"], cat_estado_asistencia: ["list", "show"],
    // Puede corregir el pase de lista de su estancia, también después del corte.
    pase_lista: ["show", "edit"],
    // Bandeja del día con contactos del tutor (RF-21). Solo el doctor/asesor.
    bandeja_seguimientos: ["list"],
    alta_pendiente: ["list"],
  },
  tutor: {
    infantes: ["list", "show"], tutores: ["list", "show"],
    asistencias: ["list", "show"], justificaciones: ["list", "show", "create", "edit"],
    motivos_falta: ["list", "show"], cat_estado_asistencia: ["list", "show"],
    mi_asistencia: ["show"], privacidad: ["show"], consentimientos: ["create"],
    // Historial de sus hijos en la tarjeta (RF-31 y RF-32).
    mi_historial: ["list"],
  },
};

// NUEVO: recursos que aparecen en el menú de cada rol (tareas diarias).
// Tener permiso no implica aparecer en el menú: por ejemplo, el profesor puede
// consultar salas para mostrar sus nombres, pero no necesita un enlace a Salas.
// Una prueba comprueba que cada recurso de esta lista tenga permiso "list".
export const MENU_POR_ROL: Record<Rol, readonly string[]> = {
  administrador: [
    "infantes", "estancias", "salas", "tutores", "infante_tutor", "usuarios",
    "asistencias", "justificaciones", "seguimientos", "reportes_asistencia",
    "estatus_infante", "cat_estado_asistencia", "motivos_falta", "roles",
  ],
  profesor: ["asistencias", "justificaciones"],
  doctor_asesor: ["bandeja_seguimientos", "seguimientos", "asistencias", "justificaciones", "tutores"],
  tutor: ["asistencias", "justificaciones"],
};

// NUEVO: función pura: no depende de React, API ni base de datos.
export const esRol = (rol: unknown): rol is Rol =>
  typeof rol === "string" && (ROLES as readonly string[]).includes(rol);

export const tienePermiso = (rol: unknown, recurso: string, accion: string): boolean => {
  // NUEVO: rol/recurso/acción desconocidos se rechazan; no hay acceso por defecto.
  if (!esRol(rol)) return false;
  return Object.prototype.hasOwnProperty.call(PERMISOS[rol], recurso) && PERMISOS[rol][recurso].includes(accion);
};

// NUEVO: pantalla que abre cada rol al iniciar sesión (Tabla 14 del reporte).
// "/" es el Dashboard que Admin recibe en la propiedad dashboard: el tablero del administrador.
export const INICIO_POR_ROL: Record<Rol, string> = {
  administrador: "/",
  profesor: "/pase-lista",
  doctor_asesor: "/bandeja_seguimientos",
  tutor: "/mis-hijos",
};
