import test from "node:test";
import assert from "node:assert/strict";
import { ACCIONES, INICIO_POR_ROL, MENU_POR_ROL, PERMISOS, RECURSOS, ROLES, tienePermiso } from "../src/permisos.ts";

test("profesor: pase de lista, lectura de faltas y sin datos médicos/contactos", () => {
  assert.equal(tienePermiso("profesor", "pase_lista", "edit"), true);
  assert.equal(tienePermiso("profesor", "asistencias", "list"), true);
  assert.equal(tienePermiso("profesor", "justificaciones", "list"), true);
  for (const recurso of ["usuarios", "roles", "tutores", "seguimientos"]) {
    assert.equal(tienePermiso("profesor", recurso, "list"), false);
  }
  assert.equal(tienePermiso("profesor", "infantes", "edit"), false);
});

test("doctor: seguimiento y contacto, sin administrar usuarios ni permisos", () => {
  assert.equal(tienePermiso("doctor_asesor", "seguimientos", "edit"), true);
  assert.equal(tienePermiso("doctor_asesor", "tutores", "list"), true);
  assert.equal(tienePermiso("doctor_asesor", "usuarios", "create"), false);
  assert.equal(tienePermiso("doctor_asesor", "roles", "list"), false);
  // Corrige el pase de lista después del corte (decisión del equipo, RN-02).
  assert.equal(tienePermiso("doctor_asesor", "pase_lista", "edit"), true);
});

test("tutor: justificación y consentimiento, sin gestión institucional", () => {
  assert.equal(tienePermiso("tutor", "mi_asistencia", "show"), true);
  assert.equal(tienePermiso("tutor", "justificaciones", "create"), true);
  assert.equal(tienePermiso("tutor", "consentimientos", "create"), true);
  assert.equal(tienePermiso("tutor", "pase_lista", "edit"), false);
  assert.equal(tienePermiso("tutor", "usuarios", "list"), false);
  assert.equal(tienePermiso("tutor", "seguimientos", "list"), false);
});

test("administrador: gestión y consulta del panel de permisos", () => {
  assert.equal(tienePermiso("administrador", "usuarios", "create"), true);
  assert.equal(tienePermiso("administrador", "roles", "list"), true);
  assert.equal(tienePermiso("administrador", "reportes_asistencia", "list"), true);
  assert.equal(tienePermiso("administrador", "roles", "edit"), false, "No existe editor dinámico de permisos sin backend");
});

test("lo desconocido y los borrados no se autorizan", () => {
  for (const rol of [null, undefined, "", "admin", "__proto__", "rol_nuevo"]) {
    assert.equal(tienePermiso(rol, "usuarios", "list"), false);
  }
  for (const rol of ROLES) {
    for (const recurso of Object.keys(RECURSOS)) assert.equal(tienePermiso(rol, recurso, "delete"), false);
    assert.equal(tienePermiso(rol, "__proto__", "list"), false);
    assert.equal(tienePermiso(rol, "usuarios", "accion_nueva"), false);
  }
});

test("las reglas y destinos iniciales tienen recursos y acciones conocidos", () => {
  for (const rol of ROLES) {
    for (const [recurso, acciones] of Object.entries(PERMISOS[rol])) {
      assert.ok(Object.hasOwn(RECURSOS, recurso));
      for (const accion of acciones) assert.ok(Object.hasOwn(ACCIONES, accion));
    }
  }
  // El administrador abre el tablero (Dashboard en "/"), que no depende de un recurso.
  assert.equal(INICIO_POR_ROL.administrador, "/");
  const destinos = { profesor: ["pase_lista", "show"], doctor_asesor: ["seguimientos", "list"], tutor: ["mi_asistencia", "show"] };
  for (const [rol, destino] of Object.entries(destinos)) {
    assert.equal(tienePermiso(rol, ...destino), true);
    assert.ok(INICIO_POR_ROL[rol].startsWith("/"));
  }
});

test("cada recurso del menú tiene permiso de consulta para ese rol", () => {
  for (const rol of ROLES) {
    for (const recurso of MENU_POR_ROL[rol]) {
      assert.equal(tienePermiso(rol, recurso, "list"), true, `${rol} ve ${recurso} en el menú sin permiso list`);
    }
  }
  // El reporte pide que profesor no vea contactos de tutores.
  assert.equal(MENU_POR_ROL.profesor.includes("tutores"), false);
});
