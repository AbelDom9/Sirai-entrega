-- Esta migración permite actualizar la vista del historial de asistencia de los infantes y sus justificaciones conservando los datos existentes; para elaborarla, nos apoyamos en una guía y explicación de IA que nos ayudó a comprender los cambios necesarios.
SET NAMES utf8mb4;

DROP VIEW IF EXISTS mi_historial;

CREATE VIEW mi_historial AS
SELECT
  a.id AS id,
  a.infante_id AS infante_id,
  it.tutor_id AS tutor_id,
  a.fecha AS fecha,
  a.turno AS turno,
  c.codigo AS estado_codigo,
  c.nombre AS estado_nombre,
  (c.codigo IN ('falta_justificada', 'falta_injustificada', 'licencia_medica')) AS es_falta,
  EXISTS (SELECT 1 FROM justificaciones j WHERE j.asistencia_id = a.id) AS justificada
FROM asistencias a
JOIN infante_tutor it ON it.infante_id = a.infante_id
JOIN cat_estado_asistencia c ON c.id = a.estado_id;
