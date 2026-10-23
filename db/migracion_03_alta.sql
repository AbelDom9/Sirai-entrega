-- Esta migración permite actualizar la vista de altas pendientes a partir de los seguimientos de los infantes conservando los datos existentes; para elaborarla, nos apoyamos en una guía y explicación de IA que nos ayudó a comprender los cambios necesarios.
SET NAMES utf8mb4;

DROP VIEW IF EXISTS alta_pendiente;

CREATE VIEW alta_pendiente AS
SELECT
  s.id AS id,
  i.id AS infante_id,
  i.sala_id AS sala_id,
  sl.estancia_id AS estancia_id
FROM seguimientos s
JOIN asistencias a ON a.id = s.asistencia_id
JOIN infantes i ON i.id = a.infante_id
JOIN salas sl ON sl.id = i.sala_id
WHERE s.requiere_alta = TRUE
  AND s.fecha_alta IS NULL;
