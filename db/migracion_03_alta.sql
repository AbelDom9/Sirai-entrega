-- =====================================================================
-- Migración 03: bloqueo "requiere alta" en el pase de lista (RF-27)
--
-- Crea la vista alta_pendiente en una base que ya existe.
-- No cambia ni borra datos. Se corre una sola vez:
--   mysql -u root -p sirai_dev < db/migracion_03_alta.sql
-- =====================================================================

SET NAMES utf8mb4;

DROP VIEW IF EXISTS alta_pendiente;
-- Recurso "alta_pendiente" (RF-27 y RN-04): niños que no pueden marcarse
-- Presente ni Filtro de salud porque tienen un seguimiento que requiere alta
-- médica y todavía no tiene fecha de alta. No incluye el motivo, para que el
-- profesor no vea información médica; solo sabe que falta el alta.
CREATE VIEW alta_pendiente AS
SELECT
  s.id                                                     AS id,
  i.id                                                     AS infante_id,
  i.sala_id                                                AS sala_id,
  sl.estancia_id                                           AS estancia_id
FROM seguimientos s
JOIN asistencias a ON a.id = s.asistencia_id
JOIN infantes i    ON i.id = a.infante_id
JOIN salas sl      ON sl.id = i.sala_id
WHERE s.requiere_alta = TRUE
  AND s.fecha_alta IS NULL;
