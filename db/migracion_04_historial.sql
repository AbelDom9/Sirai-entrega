-- =====================================================================
-- Migración 04: historial del tutor (RF-31 y RF-32)
-- Crea la vista mi_historial. No cambia ni borra datos. Una sola vez:
--   mysql -u root -p sirai_dev < db/migracion_04_historial.sql
-- =====================================================================

SET NAMES utf8mb4;

DROP VIEW IF EXISTS mi_historial;
-- Recurso "mi_historial" (tutor, RF-31 y RF-32): registros de asistencia de los
-- hijos de cada tutor, con si es falta y si ya está justificada.
-- La API filtra por el tutor de la sesión.
CREATE VIEW mi_historial AS
SELECT
  a.id                                                     AS id,
  a.infante_id                                             AS infante_id,
  it.tutor_id                                              AS tutor_id,
  a.fecha                                                  AS fecha,
  a.turno                                                  AS turno,
  c.codigo                                                 AS estado_codigo,
  c.nombre                                                 AS estado_nombre,
  (c.codigo IN ('falta_justificada', 'falta_injustificada', 'licencia_medica')) AS es_falta,
  EXISTS (SELECT 1 FROM justificaciones j WHERE j.asistencia_id = a.id)        AS justificada
FROM asistencias a
JOIN infante_tutor it        ON it.infante_id = a.infante_id
JOIN cat_estado_asistencia c ON c.id = a.estado_id;
